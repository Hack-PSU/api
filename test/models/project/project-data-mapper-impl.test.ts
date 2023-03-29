import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
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
      const expectedSQL = 'SELECT * FROM `PROJECTS` WHERE (uid = ?);';
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
      const expectedSQL = 'DELETE FROM `PROJECTS` WHERE (uid = ?);';
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
      const expectedSQL = 'SELECT COUNT(uid) AS "project_count" FROM `PROJECTS`;';
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
        project: 'test_project',
      });
      // WHEN: Retrieving number of projects
      await projectDataMapper.insert(testProject);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `PROJECTS` (`project`, `hackathon`) VALUES (?, ?);';
      const expectedParams = [
        testProject.project,
        await activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid)).toPromise()
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
        project: 'test_project',
        uid: 5,
      });
      // WHEN: Retrieving number of projects
      await projectDataMapper.update(testProject);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `PROJECTS` SET `project` = ?, `uid` = ? WHERE (uid = ?);';
      const expectedParams = [
        testProject.project,
        testProject.uid,
        testProject.uid
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
                .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

})
