const squel = require('squel');
const sql = require('mysql');
const uuidv4 = require('uuid/v4');

const sqlOptions = require('../helpers/constants').sqlConnection;
const connection = sql.createConnection(sqlOptions);

connection.connect((err) => {
    if (err) {
        console.error(err.stack);
    }
});

/**
 * @param limit {Number} Limit the number of rows to retrieve
 * @param offset {Number} Offset from start to retrieve at
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getRegistrations(limit, offset) {
    const mLimit = parseInt(limit);
    const mOffset = parseInt(offset);
    const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
        .limit(mLimit ? mLimit : null)
        .offset(mOffset ? mOffset : null)
        .toString()
        .concat(';');
    squel.str("");
    return connection.query(query).stream();
}

/**
 *
 * @param uid {string} The uid of the user to retrieve the registration for
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getRegistration(uid) {
    const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
        .where('uid = ?', uid)
        .toParam();
    query.text = query.text.concat(';');
    return connection.query(query.text, query.values).stream();
}

/**
 * @param limit {Number} Limit the number of rows to retrieve
 * @param offset {Number} Offset from start to retrieve at
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getPreRegistrations(limit, offset) {
    const mLimit = parseInt(limit);
    const mOffset = parseInt(offset);
    const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from('PRE_REGISTRATION')
        .limit(mLimit ? limit : null)
        .offset(mOffset ? offset : null)
        .toString().concat(';');
    return connection.query(query).stream();
}

/**
 *
 * @param email {String} the email
 * @return {Promise<any>}
 */
function addPreRegistration(email) {
    const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .into(process.env.NODE_ENV === 'test' ? 'PRE_REGISTRATION_TEST' : 'PRE_REGISTRATION')
        .setFieldsRows([
            {id: uuidv4().replace(/-/g, ""), email: email},
        ])
        .toParam();
    query.text = query.text.concat(';');
    return new Promise((resolve, reject) => {
        connection.query(query.text, query.values, (err, result) => {
            if (err && err.errno === 1062) {
                const error = new Error();
                error.message = "Email already provided";
                error.status = 400;
                reject(error);
            } else if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}


/**
 *
 * @param uid {string} UID of the user to set registration submission status
 */
function setRegistrationSubmitted(uid) {
    const dbname = process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION';
    const query = squel.update({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .table(dbname)
        .set('submitted', true)
        .where("uid = ?", uid)
        .toParam();
    query.text = query.text.concat(';');
    connection.query(query.text, query.values);
}


/**
 *
 * @param data {Object} Data format that matches the registeredUserSchema
 * @return {Promise<any>}
 */
function addRegistration(data) {
    const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .into(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
        .setFieldsRows([
            data
        ]).toParam();
    query.text = query.text.concat(';');
    return new Promise((resolve, reject) => {
        connection.query(query.text, query.values, (err, result) => {
            if (err && err.errno === 1062) {
                const error = new Error();
                error.message = "User already registered";
                error.status = 400;
                reject(error);
            } else if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

/**
 *
 * @param msg {String} Message to write
 */
function writePiMessage(msg) {
    const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .into('PI_TEST')
        .setFieldsRows([
            {time: new Date().getTime(), message: msg}
        ])
        .toParam();
    query.text = query.text.concat(';');
    return new Promise((resolve, reject) => {
        connection.query(query.text, query.values, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });
}

/**
 *
 * @param ipAddress {string} The IP Address to store
 * @param user_agent {string} The user-agent field
 * @return Promise<any> {Promise<any>}
 */
function storeIP(ipAddress, user_agent) {
    const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .into('REQ_DATA')
        .setFieldsRows([
            {idREQ_DATA: uuidv4(), req_time: new Date().getTime(), req_ip: ipAddress, req_user_agent: user_agent}
        ])
        .toParam();
    query.text = query.text.concat(';');
    return new Promise((resolve) => {
        connection.query(query.text, query.values, () => {
            resolve();
        });
    });
}

function storeProjectInfo(data){
    let team = data.members.join(",");
    let category = data.categories.join(",");
    const query = "call assignTeam(?, ?, ?);\n";
    connection.query(query,[data.projectName, team, category])
        .on('data',(data)=>{
            let table_query ="call assignTable(?,?,?)";
            connection.query(query, [data, Math.min(data.categories)]);
        })
        .on('err',(err)=>{

        });
        // Project Name, tam, category

        // projectID, categoryID
    return new Promise((resolve) => {
        connection.query(query.text, query.values, () => {
            resolve();
        });
    });
}
/**
 * @param uid
 *
 * @return Object {Object} with field 'found' to indicate success.
 */
function getProjectInfo(uid) {
    // 1) Query PROJECT_TEAM to get projectID (no project id, return {found: false}
    // 2) Join with PROJECT_LIST
    let query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from(process.env.NODE_ENV === 'test' ? 'PROJECT_TEAM_TEST' : 'PROJECT_TEAM', 'pt')
        .where('userID = ?', uid)
        .join(process.env.NODE_ENV === 'test' ? 'PROJECT_LIST_TEST' : 'PROJECT_LIST', 'pl', 'pt.projectID=pl.projectID')

        .toParam();
    query_project.text=query_project.test.concat(';');
    connection.query(query_project)
        .on('data',(data)=>{
            let query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
                .from(process.env.NODE_ENV === 'test' ? 'PROJECT_LIST_TEST' : 'PROJECT_LIST', "pl")
                .where('projectID = ?', data)
                .join(process.env.NODE_ENV === 'test' ? 'TABLE_ASSIGNMENTS_TEST' : 'TABLE_ASSIGNMENTS','ta','ta.projectID = pl.projectID')
                .join('CATEGORY_LIST', 'cl', 'cl.categoryID = ')
                .toParam();
            query.text = query.text.concat(';');
            return connection.query(query).stream();
        })
        .on('err',(err)=>{
            reject(err);
        });
}
//
// function storeProjectMembers(data){
//     let prepped = "call assignTeam(@projectName, @teamMemberList, @categoriesList, @projectID_out)"; // TODO: Update this
//     let list = [];
//     data.members.forEach(function(member){
//         list.append({projectID: data.projectID, userID: member})
//     });
//
//     return new Promise((resolve, reject) => {
//        connection.query(prepped, list, (err, response) => {
//            if (err) {
//                reject(err);
//            } else {
//                resolve(response); // TODO decide what to return
//            }
//        });
//     });
// }
//
// function storeProjectCategories(data){
//     let list = [];
//     data.category.forEach(function(category){
//         list.push({projectID: data.projectID, categoryID: category})
//     });
//     let query = squel.insert()
//         .into(process.env.NODE_ENV === 'test' ? "PROJECT_CATEGORIES_TEST": "PROJECT_CATEGORIES")
//         .setFieldsRows(list)
//         .toParam();
//     query.text = query.text.concat(';');
//     return new Promise((resolve) => {
//         connection.query(query.text, query.values, () => {
//             resolve();
//         });
//     });
// }
//
// function storeProjectMembers(data){
//     let prepped = "function(?)"; // TODO: Update this
//     let list = [];
//     for(let person in data.members){ // TODO: For in loops dont work well on arrays. Either use a for (let i = 0; i < ...; i++) or more recommended
//                                     // use the data.members.forEach((data) => {//do stuff here}) loop mechanism
//         list.append({userID:person, projectID: data.projectID}) // TODO: Where is `person` coming from? dereference from data?
//     }
//     const query = squel.insert()
//         .into(process.env.NODE_ENV === 'test' ? "PROJECT_TEAM": "PROJECT_TEAM_TEST")
//         .setFieldsRows(list)
//         .toParam();
//     query.text = query.text.concat(';');
//     return new Promise((resolve, reject) => {
//        connection.query(query.text, query.values, (err, response) => {
//            if (err) {
//                reject(err);
//            } else {
//                resolve(response); // TODO decide what to return
//            }
//        })
//     });
// }

module.exports = {
    getRegistrations,
    getRegistration,
    getPreRegistrations,
    addPreRegistration,
    writePiMessage,
    addRegistration,
    setRegistrationSubmitted,
    storeIP,
    // storeProjectMembers,
    getProjectInfo,
    // storeProjectCategories,
    storeProjectInfo,
    // getCategoryInfo
};
