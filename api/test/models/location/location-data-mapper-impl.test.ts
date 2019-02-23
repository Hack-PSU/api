import { expect } from 'chai';
import 'mocha';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { Location } from '../../../lib/models/location/location';
import { LocationDataMapperImpl } from '../../../lib/models/location/location-data-mapper-impl';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

let locationDataMapper: IDataMapper<Location>;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Location Data Mapper', () => {

  beforeEach(() => {
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Location Data Mapper
    locationDataMapper = new LocationDataMapperImpl(acl, mysqlUow, new Logger());
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Location read', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve a location', async () => {
      // GIVEN: An location with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this location
      await locationDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `LOCATIONS` WHERE (uid= ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Location delete', () => {
    // @ts-ignore
    it('causes the location to get deleted', async () => {
      // GIVEN: A location with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this location
      await locationDataMapper.delete(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `LOCATIONS` WHERE (uid = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Location count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of locations', async () => {
      // GIVEN: Instance of a location data mapper
      // WHEN: Retrieving number of locations
      const result = await locationDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `LOCATIONS`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Location insert', () => {
    // @ts-ignore
    it('inserts the locations', async () => {
      // GIVEN: A location to insert
      const testLocation = new Location({
        locationName: 'test location'
      });
      // WHEN: Retrieving number of locations
      await locationDataMapper.insert(testLocation);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `LOCATIONS` (`location_name`) VALUES (?);';
      const expectedParams = [
        testLocation.location_name,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Location update', () => {
    // @ts-ignore
    it('updates the locations', async () => {
      // GIVEN: A location to insert
      const testLocation = new Location({
        locationName: 'test location',
      });
      // WHEN: Retrieving number of locations
      await locationDataMapper.update(testLocation);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `LOCATIONS` SET `location_name` = ? WHERE (uid = ?);';
      const expectedParams = [
        testLocation.location_name,
        testLocation.uid,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});