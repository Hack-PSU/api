import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import tsStream from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { HttpError, MethodNotImplementedError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import BaseObject from '../BaseObject';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { IScannerDataMapper } from './index';
import { RfidAssignment } from './rfid-assignment';
import { Scan } from './scan';

@Injectable()
export class ScannerDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IScannerDataMapper {

  private static handleInsertionError<T extends BaseObject>(error: Error, object: T): IDbResult<T> {
    switch ((error as HttpError).status) {
      case 400:
        return { result: 'Bad input', data: object.cleanRepresentation };
      case 409:
        return {
          data: object.cleanRepresentation,
          result: 'Duplicate detected',
        };
      default:
        return {
          data: object.cleanRepresentation,
          result: 'Error',
        };
    }
  }
  public COUNT: string = 'rfidassignment:count';
  public CREATE: string = 'rfidassignment:create';
  public READ_ALL: string = 'rfidassignment:readall';
  public UPDATE: string = 'rfidassignment:update';
  // Unsupported operations
  public READ: string;
  public DELETE: string;

  public tableName: string = 'RFID_ASSIGNMENTS';
  public scansTableName = 'SCANS';
  protected pkColumnName: string = 'rfid_uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE, this.UPDATE, this.COUNT, this.READ_ALL],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
  }

  public delete(object: UidType | RfidAssignment): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  /**
   * Returns an RFID assignment object from a wid
   * @param {UidType} object
   * @param {IUowOpts} opts
   * @returns {Promise<IDbResult<RfidAssignment>>}
   */
  public async get(wid: UidType, opts?: IUowOpts): Promise<IDbResult<RfidAssignment>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon.uid = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, wid);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<RfidAssignment>(query.text, query.values, { stream: false, cache: true }))
      .pipe(
        map((rfidAssignment: RfidAssignment[]) => ({ result: 'Success', data: rfidAssignment[0] })),
      )
      .toPromise();
  }

  public getAll(opts?: IUowOpts): Promise<IDbResult<tsStream<RfidAssignment>>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public async insert(object: RfidAssignment): Promise<IDbResult<RfidAssignment>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject(new HttpError(validation.error, 400));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFields(object.dbRepresentation)
      .set(
        'hackathon',
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
          .toPromise(),
      )
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public update(object: RfidAssignment): Promise<IDbResult<RfidAssignment>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public async addRfidAssignments(assignments: RfidAssignment[]): Promise<IDbResult<Array<IDbResult<RfidAssignment>>>> {
    let resultString: string = 'Success';
    const result = await Promise.all(
      assignments.map(
        // Handle any insertion errors here and
        // change return an IDbResult with result: error
        async (assignment, index) => {
          try {
            return await this.insert(assignment);
          } catch (error) {
            resultString = 'Error';
            return ScannerDataMapperImpl.handleInsertionError<RfidAssignment>(
              error,
              assignment[index],
            );
          }
        },
      ));
    return {
      data: result,
      result: resultString,
    };
  }

  public addScans(scans: Scan[]): Promise<Array<IDbResult<Scan>>> {
    return Promise.all(scans.map(
      scan => this.addSingleScan(scan).catch(error => error),
    ));
  }

  public addSingleScan(scan: Scan): Promise<IDbResult<Scan>> {
    const validation = scan.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(scan.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.scansTableName)
      .setFields(scan.dbRepresentation)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: scan.cleanRepresentation })),
    ).toPromise();
  }
}
