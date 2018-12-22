import { ReflectiveInjector } from 'injection-js';
import { EventDataMapperImpl } from '../../../models/event/EventDataMapperImpl';
import { UpdateDataMapperImpl } from '../../../models/update/UpdateDataMapperImpl';
import { FirebaseAuthService } from '../../auth/firebase-auth';
import { RBAC } from '../../auth/RBAC/rbac';
import { OnesignalService } from '../../communication/push-notification/onesignal.service';
import { MemCacheServiceImpl } from '../../database/cache/memcache-impl.service';
import { RtdbConnectionFactory } from '../../database/connection/rtdb-connection-factory';
import { SqlConnectionFactory } from '../../database/connection/sql-connection-factory';
import { MysqlUow } from '../../database/svc/mysql-uow.service';
import { RtdbUow } from '../../database/svc/rtdb-uow.service';
import { FirebaseService } from '../firebase/firebase.service';

export class RootInjector {
  public static getInjector(): ReflectiveInjector {
    if (!this.injector) {
      this.injector = ReflectiveInjector.resolveAndCreate([
          { provide: 'IAcl', useClass: RBAC },
          { provide: 'FirebaseService', useValue: FirebaseService.instance },
          { provide: 'IAuthService', useClass: FirebaseAuthService },
          { provide: 'IConnectionFactory', useClass: SqlConnectionFactory },
          { provide: 'IRtdbFactory', useClass: RtdbConnectionFactory },
          { provide: 'IPushNotifService', useClass: OnesignalService },
          { provide: 'ICacheService', useClass: MemCacheServiceImpl },
          { provide: 'MysqlUow', useClass: MysqlUow },
          { provide: 'RtdbUow', useClass: RtdbUow },
          { provide: 'IUpdateDataMapper', useClass: UpdateDataMapperImpl },
          { provide: 'IEventDataMapper', useClass: EventDataMapperImpl },
        ],
      );
    }
    return this.injector;
  }

  private static injector: ReflectiveInjector;
}
