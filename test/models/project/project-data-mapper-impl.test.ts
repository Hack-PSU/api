import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { Project } from '../../../src/models/project/project';
import { ProjectDataMapperImpl } from '../../../src/models/project/project-data-mapper-impl';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let projectDataMapper: ProjectDataMapperImpl;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

// const validProject = new Project({
//   project_name: 'test_project';,
//   team: [''];,
//   categories: [''];,
//   projectId: 'test uid';,
// });

describe('TEST: Project Data Mapper', () => {

  beforeEach(() => {
        // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    (activeHackathonDataMapper.activeHackathon as any).returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    (activeHackathonDataMapper.tableName as any).mimicks(() => 'HACKATHON');
        // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
            .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
        // Configure Project Data Mapper
    projectDataMapper = new ProjectDataMapperImpl(acl, mysqlUow, activeHackathonDataMapper, new Logger());
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Project read', () => {
        // @ts-ignore
    it('generates the expected SQL to retrieve an project', async () => {
            // GIVEN: An project with a valid ID to read from
      const uid = 'test uid';
            // WHEN: Retrieving data for this project
      await projectDataMapper.get(uid);

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `PROJECT_LIST` WHERE (projectID = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
                .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Project delete', () => {
        // @ts-ignore
    it('causes the project to get deleted', async () => {
            // GIVEN: An Project with a valid ID to read from
      const uid = 'test uid';
            // WHEN: Retrieving data for this project
      await projectDataMapper.delete(uid);

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `PROJECT_LIST` WHERE (projectID = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
                .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Project count', () => {
        // @ts-ignore
    it('generates the expected SQL to retrieve the number of projects', async () => {
            // GIVEN: Instance of an project data mapper
            // WHEN: Retrieving number of project
      await projectDataMapper.getCount();

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(projectID) AS "project_count" FROM `PROJECT_LIST`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Project insert', () => {
        // @ts-ignore
    it('inserts the project', async () => {
            // GIVEN: An project to insert
      const testProject = new Project({
        project_name: 'test_project',
        team: ['a', 'b'],
        categories: ['1', '2'],
        projectId: 'test uid',
      });
            // WHEN: Retrieving number of projects
      await projectDataMapper.insert(testProject);

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'CALL assignTeam (?,?,?,@projectID_out); SELECT @projectID_out as projectID;';
      const expectedParams = [
        testProject.project_name,
        testProject.team.join(','),
        testProject.categories.join(','),
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
                .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Project update', () => {
        // @ts-ignore
    it('updates the projects', async () => {
            // GIVEN: An project to insert
      const testProject = new Project({
        project_name: 'test_project_b',
        team: ['peter'],
        categories: ['core'],
        projectId: 'test uid',
      });
            // WHEN: Retrieving number of projects
      await projectDataMapper.update(testProject);

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `PROJECT_LIST` SET `team` = ?, ' +
                '`categories` = ?, `project_name` = ? WHERE (projectID = ?);';
      const expectedParams = [
        testProject.team.join(','),
        testProject.categories.join(','),
        testProject.project_name,
        testProject.projectId,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
                .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Project get by user', () => {
    it('get the project by userID', async () => {
            // GIVEN: An Project associated with a valid user ID to read from
      const uid = 'test uid';
            // WHEN: Retriving data for this project
      await projectDataMapper.getByUser(uid);

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT `project_list`.`projectName`, `project_team`.*, `table_assignment`.`tableNumber`, ' +
                '`category_list`.* FROM `PROJECT_TEAM` `project_team` INNER JOIN `PROJECT_LIST` `project_list` ON ' +
                '(project_list.projectID=project_list.projectID) INNER JOIN `PROJECT_CATEGORIES` `project_category` ON ' +
                '(project_category.projectID = project_team.projectID) INNER JOIN `CATEGORY_LIST` `category_list` ON ' +
                '(category_list.uid = project_category.categoryID ) LEFT JOIN `TABLE_ASSIGNMENTS` `table_assignment` ON ' +
                '(table_assignment.projectID = project_list.project.ID) WHERE (project_team.userID = ?);';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);

    });
  });

  describe('TEST: Project assign table', () => {
    it('assign project to table', async () => {
            // GIVEN: An Project created in to the database
      const testProject = new Project({
        project_name: 'test_project_b',
        team: ['peter'],
        categories: ['1'],
        projectId: 'test uid',
      });
            // WHEN: assigning a project for table number
      await projectDataMapper.assignTable(testProject);

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'CALL assignTable(?,?,@tableNumber_out); SELECT @tableNumber_out as table_number;';
      const expectedParams = [
        testProject.projectId,
        1,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
                .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Project assign table multi-category', () => {
    it('assign project associated with multiple cateogry to table', async () => {
            // GIVEN: An Project created in to the database
      const testProject = new Project({
        project_name: 'test_project_b',
        team: ['peter'],
        categories: ['1', '2', '10'],
        projectId: 'test uid',
      });
            // WHEN: assigning a project for table number
      await projectDataMapper.assignTable(testProject);

            // THEN: Generated SQL matches the expectation
      const expectedSQL = 'CALL assignTable(?,?,@tableNumber_out); SELECT @tableNumber_out as table_number;';
      const expectedParams = [
        testProject.projectId,
        1,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
                .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
