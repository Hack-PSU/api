import { ActiveHackathonDataMapperImpl } from '../../../models/hackathon/active-hackathon';
import { AdminDataMapperImpl } from '../../../models/admin';
import { AdminStatisticsDataMapperImpl } from '../../../models/admin/statistics/admin-statistics-data-mapper-impl';
import { AttendanceDataMapperImpl } from '../../../models/attendance/attendance-data-mapper-impl';
import { CheckoutItemsDataMapperImpl } from '../../../models/checkout-items/checkout-items-data-mapper-impl';
import { CheckoutObjectDataMapperImpl } from '../../../models/checkout-object/checkout-object-data-mapper-impl';
import { EventDataMapperImpl } from '../../../models/event/event-data-mapper-impl';
import { ExtraCreditDataMapperImpl } from '../../../models/extra-credit/extra-credit-data-mapper-impl';
import { HackathonDataMapperImpl } from '../../../models/hackathon';
import { LocationDataMapperImpl } from '../../../models/location/location-data-mapper-impl';
import { OrganizerDataMapperImpl } from '../../../models/admin/organizer-data-mapper-impl';
import { PreRegisterDataMapperImpl } from '../../../models/register/pre-register-data-mapper-impl';
import { ProjectDataMapperImpl } from '../../../models/project/project-data-mapper-impl';
import { RegisterDataMapperImpl } from '../../../models/register/register-data-mapper-impl';
import { RsvpDataMapperImpl } from '../../../models/RSVP/RSVP-data-mapper-impl';
import { ScannerDataMapperImpl } from '../../../models/scanner/scanner-data-mapper-impl';
import { ScoreDataMapperImpl } from '../../../models/score/score-data-mapper';
import { SponsorDataMapperImpl } from '../../../models/sponsorship/sponsor-data-mapper-impl';
import { UpdateDataMapperImpl } from '../../../models/update/update-data-mapper-impl';
import { UrlDataMapperImpl } from '../../../models/url/url-data-mapper-impl';
import { WorkshopDataMapperImpl } from '../../../models/workshops-scans/workshop-scanner-data-mapper';

import { AdminProcessor } from '../../../processors/admin-processor';
import { IndexProcessor } from '../../../processors/index-processor';
import { PreRegistrationProcessor } from '../../../processors/pre-registration-processor';
import { RegistrationProcessor } from '../../../processors/registration-processor';
import { ScannerProcessor } from '../../../processors/scanner-processor';
import { UpdateProcessor } from '../../../processors/update-processor';

import { AdminController } from '../../../router/routes/admin/';
import { AdminCheckoutController } from '../../../router/routes/admin/admin-checkout';
import {
  AdminHackathonController, AdminLocationController, AdminRegisterController, AdminStatisticsController, } from '../../../router/routes/admin';
import { EventsController } from '../../../router/routes/live/events';
import { IndexController } from '../../../router/routes';
import { InternalController } from '../../../router/routes/internal';
import { JudgingController } from '../../../router/routes/judging';
import { LiveController } from '../../../router/routes/live/live';
import { UpdatesController } from '../../../router/routes/live/updates';
import { UsersController } from '../../../router/routes/users';
import { ScannerController } from '../../../router/routes/scanner/scanner';
import { SponsorshipController } from '../../../router/routes/sponsorship';
import { WorkshopScannerController } from '../../../router/routes/scanner/workshop-scanner';

import { ApikeyAuthService } from '../../auth/apikey-auth';
import { FirebaseAuthService } from '../../auth';
import { RBAC } from '../../auth/RBAC/rbac';
import { SendgridService } from '../../communication/email/sendgrid.service';
import { OnesignalService } from '../../communication/push-notification/onesignal.service';

import { MemCacheServiceImpl } from '../../database/cache/memcache-impl.service';
import { RtdbConnectionFactory } from '../../database/connection/rtdb-connection-factory';
import { SqlConnectionFactory } from '../../database/connection/sql-connection-factory';
import { MysqlUow } from '../../database/svc/mysql-uow.service';
import { RtdbUow } from '../../database/svc/rtdb-uow.service';
import { WebsocketPusher } from '../../communication/websocket-pusher';

import { Logger } from '../../logging/logging';
import { GoogleStorageService } from '../../storage/svc/google-storage.service';
import { FirebaseService } from '../firebase/firebase.service';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { RootInjector } from './root-injector';

export class ExpressProvider {
  public static config() {
    RootInjector.registerProvider(
      [
        // Controllers
        { provide: 'AdminCheckoutController', useClass: AdminCheckoutController },
        { provide: 'AdminController', useClass: AdminController },
        { provide: 'AdminHackathonController', useClass: AdminHackathonController },
        { provide: 'AdminLocationController', useClass: AdminLocationController },
        { provide: 'AdminRegisterController', useClass: AdminRegisterController },
        { provide: 'AdminStatisticsController', useClass: AdminStatisticsController },
        { provide: 'EventsController', useClass: EventsController },
        { provide: 'IndexController', useClass: IndexController },
        { provide: 'InternalController', useClass: InternalController },
        { provide: 'JudgingController', useClass: JudgingController },
        { provide: 'LiveController', useClass: LiveController },
        { provide: 'ScannerController', useClass: ScannerController },
        { provide: 'SponsorshipController', useClass: SponsorshipController },
        { provide: 'UpdatesController', useClass: UpdatesController },
        { provide: 'UsersController', useClass: UsersController },
        { provide: 'WorkshopController', useClass: WorkshopScannerController},
        
        // Processors
        { provide: 'IAdminProcessor', useClass: AdminProcessor },
        { provide: 'IAdminScannerProcessor', useClass: ScannerProcessor },
        { provide: 'IIndexProcessor', useClass: IndexProcessor },
        { provide: 'IRegistrationProcessor', useClass: RegistrationProcessor },
        { provide: 'IPreregistrationProcessor', useClass: PreRegistrationProcessor },
        { provide: 'IScannerProcessor', useClass: ScannerProcessor },
        { provide: 'IUpdateProcessor', useClass: UpdateProcessor },

        // Data Mappers
        { provide: 'IActiveHackathonDataMapper', useClass: ActiveHackathonDataMapperImpl },
        { provide: 'IAdminDataMapper', useClass: AdminDataMapperImpl },
        { provide: 'IAdminStatisticsDataMapper', useClass: AdminStatisticsDataMapperImpl },
        { provide: 'IAttendanceDataMapper', useClass: AttendanceDataMapperImpl },
        { provide: 'ICheckoutItemsDataMapper', useClass: CheckoutItemsDataMapperImpl },
        { provide: 'ICheckoutObjectDataMapper', useClass: CheckoutObjectDataMapperImpl },
        { provide: 'IEventDataMapper', useClass: EventDataMapperImpl },
        { provide: 'IExtraCreditDataMapper', useClass: ExtraCreditDataMapperImpl },
        { provide: 'IHackathonDataMapper', useClass: HackathonDataMapperImpl },
        { provide: 'ILocationDataMapper', useClass: LocationDataMapperImpl },
        { provide: 'IOrganizerDataMapper', useClass: OrganizerDataMapperImpl },
        { provide: 'IPreRegisterDataMapper', useClass: PreRegisterDataMapperImpl },
        { provide: 'IProjectDataMapper', useClass: ProjectDataMapperImpl },
        { provide: 'IRegisterDataMapper', useClass: RegisterDataMapperImpl },
        { provide: 'IRsvpDataMapper', useClass: RsvpDataMapperImpl },
        { provide: 'IScannerDataMapper', useClass: ScannerDataMapperImpl },
        { provide: 'IScoreDataMapper', useClass: ScoreDataMapperImpl },
        { provide: 'ISponsorDataMapper', useClass: SponsorDataMapperImpl },
        { provide: 'IUpdateDataMapper', useClass: UpdateDataMapperImpl },
        { provide: 'IUrlDataMapper', useClass: UrlDataMapperImpl },
        { provide: 'IWorkshopScansDataMapper', useClass: WorkshopDataMapperImpl },
        
        // Interfaces
        { provide: 'IAcl', useClass: RBAC },
        { provide: 'IAuthService', useClass: FirebaseAuthService },
        { provide: 'ICacheService', useClass: MemCacheServiceImpl },
        { provide: 'IConnectionFactory', useClass: SqlConnectionFactory },
        { provide: 'IEmailService', useClass: SendgridService },
        { provide: 'IPushNotifService', useClass: OnesignalService },
        { provide: 'IRtdbFactory', useClass: RtdbConnectionFactory },
        { provide: 'IScannerAuthService', useClass: ApikeyAuthService },
        { provide: 'IStorageService', useClass: GoogleStorageService },
        { provide: 'WebsocketPusher', useClass: WebsocketPusher},

        // Classes
        { provide: 'BunyanLogger', useClass: Logger },
        { provide: 'FirebaseService', useValue: FirebaseService.instance },
        { provide: 'RateLimiterService', useClass: RateLimiterService },
        { provide: 'MysqlUow', useClass: MysqlUow },
        { provide: 'RtdbUow', useClass: RtdbUow },
      ],
    );
  }
}
