const BaseObject = require('./BaseObject');
const squel = require('squel');

const { projectRegistrationSchema } = require('../helpers/schemas');

module.exports = class Project extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, projectRegistrationSchema, null);
    this.projectName = data.project_name || null;
    this.team = data.team || [];
    this.categories = data.categories || [];
    this.projectId = data.projectId || null;
  }

  static generateTestData(uow) {
    throw new Error('Not implemented');
  }

  add() {
    let prepped = 'CALL ';
    prepped = prepped.concat(process.env.NODE_ENV === 'test' ? 'assignTeam_test' : 'assignTeam');
    prepped = prepped.concat('(?,?,?,@projectID_out); SELECT @projectID_out as projectID;');
    const list = [this.projectName, this.team.join(','), this.categories.join(',')];
    return this.uow.query(prepped, list);
  }

  assignTable() {
    let prepped = 'CALL ';
    prepped = prepped.concat(process.env.NODE_ENV === 'test' ? 'assignTable_test' : 'assignTable')
      .concat('(?,?,@tableNumber_out); SELECT @tableNumber_out as table_number;');
    const list = [this.projectId, Math.min(...this.categories.map(c => parseInt(c, 10)))];
    return this.uow.query(prepped, list);
  }

  /**
   *
   * @param uid User id to return project details of
   * @return {Promise<Stream>}
   */
  getByUser(uid) {
    // 1) Query PROJECT_TEAM to get projectID (no project id, return {found: false}
    // 2) Join with PROJECT_LIST
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from('PROJECT_TEAM', 'pt')
      .field('pl.projectName')
      .field('pt.*')
      .field('ta.tableNumber')
      .field('cl.*')
      .where('userID = ?', uid)
      .join('PROJECT_LIST', 'pl', 'pt.projectID=pl.projectID')
      .join('TABLE_ASSIGNMENTS', 'ta', 'ta.projectID = pl.projectID')
      .join('PROJECT_CATEGORIES', 'pc', 'pc.projectID = pt.projectID')
      .join('CATEGORY_LIST', 'cl', 'cl.categoryID = pc.categoryID ')
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values, { stream: true });
  }
};
