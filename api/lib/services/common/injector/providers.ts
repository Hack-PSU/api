import { EventDataMapperImpl } from '../../../models/event/event-data-mapper-impl';
import { HackathonDataMapperImpl } from '../../../models/hackathon';
import { ActiveHackathonDataMapperImpl } from '../../../models/hackathon/active-hackathon';
import { PreRegisterDataMapperImpl, RegisterDataMapperImpl } from '../../../models/register';
import { UpdateDataMapperImpl } from '../../../models/update/update-data-mapper-impl';
import { IndexController } from '../../../router/routes';
import { AdminController } from '../../../router/routes/admin/';
import { AdminRegisterController } from '../../../router/routes/admin/admin-register';
import { InternalController } from '../../../router/routes/internal';
import { EventsController } from '../../../router/routes/live/events';
import { LiveController } from '../../../router/routes/live/live';
import { UpdatesController } from '../../../router/routes/live/updates';
import { RegistrationController } from '../../../router/routes/register';
import { FirebaseAuthService } from '../../auth/firebase-auth';
import { RBAC } from '../../auth/RBAC/rbac';
import { SendgridService } from '../../communication/email/sendgrid.service';
import { OnesignalService } from '../../communication/push-notification/onesignal.service';
import { MemCacheServiceImpl } from '../../database/cache/memcache-impl.service';
import { RtdbConnectionFactory } from '../../database/connection/rtdb-connection-factory';
import { SqlConnectionFactory } from '../../database/connection/sql-connection-factory';
import { MysqlUow } from '../../database/svc/mysql-uow.service';
import { RtdbUow } from '../../database/svc/rtdb-uow.service';
import { Logger } from '../../logging/logging';
import { GoogleStorageService } from '../../storage/svc/google-storage.service';
import { FirebaseService } from '../firebase/firebase.service';
import { RootInjector } from './root-injector';

export class ExpressProvider {
  public static config() {
    RootInjector.registerProvider(
      [
        // Controllers
        { provide: 'IndexController', useClass: IndexController },
        { provide: 'LiveController', useClass: LiveController },
        { provide: 'UpdatesController', useClass: UpdatesController },
        { provide: 'EventsController', useClass: EventsController },
        { provide: 'InternalController', useClass: InternalController },
        { provide: 'RegistrationController', useClass: RegistrationController },
        { provide: 'AdminController', useClass: AdminController },
        { provide: 'AdminRegisterController', useClass: AdminRegisterController },

        // Interfaces
        { provide: 'IAcl', useClass: RBAC },
        { provide: 'IAuthService', useClass: FirebaseAuthService },
        { provide: 'IConnectionFactory', useClass: SqlConnectionFactory },
        { provide: 'IRtdbFactory', useClass: RtdbConnectionFactory },
        { provide: 'IPushNotifService', useClass: OnesignalService },
        { provide: 'ICacheService', useClass: MemCacheServiceImpl },
        { provide: 'IUpdateDataMapper', useClass: UpdateDataMapperImpl },
        { provide: 'IEventDataMapper', useClass: EventDataMapperImpl },
        { provide: 'IRegisterDataMapper', useClass: RegisterDataMapperImpl },
        { provide: 'IPreRegisterDataMapper', useClass: PreRegisterDataMapperImpl },
        { provide: 'IActiveHackathonDataMapper', useClass: ActiveHackathonDataMapperImpl },
        { provide: 'IHackathonDataMapper', useClass: HackathonDataMapperImpl },
        { provide: 'IEmailService', useClass: SendgridService },
        { provide: 'IStorageService', useClass: GoogleStorageService },

        // Classes
        { provide: 'FirebaseService', useValue: FirebaseService.instance },
        { provide: 'MysqlUow', useClass: MysqlUow },
        { provide: 'RtdbUow', useClass: RtdbUow },
        { provide: 'BunyanLogger', useClass: Logger },
      ],
    );
  }
}
