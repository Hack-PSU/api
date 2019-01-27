import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import tsStream from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { HttpError, MethodNotImplementedError } from '../../JSCommon/errors';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IScannerDataMapper } from './index';
import { RfidAssignment } from './rfid-assignment';
import { Scan } from './scan';

@Injectable()
export class ScannerDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IScannerDataMapper {
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
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
  }

  public delete(object: UidType | RfidAssignment): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public get(object: UidType, opts?: IUowOpts): Promise<IDbResult<RfidAssignment>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public getAll(opts?: IUowOpts): Promise<IDbResult<tsStream<RfidAssignment>>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public insert(object: RfidAssignment): Promise<IDbResult<RfidAssignment>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFields(object.dbRepresentation)
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

  public addRfidAssignments(assignments: RfidAssignment[]) {
    return Promise.all(assignments.map(
      assignment => this.insert(assignment).catch(error => error),
    ));
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
