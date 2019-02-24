"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../../models/admin");
const admin_statistics_data_mapper_impl_1 = require("../../../models/admin/statistics/admin-statistics-data-mapper-impl");
const attendance_data_mapper_impl_1 = require("../../../models/attendance/attendance-data-mapper-impl");
const checkout_items_data_mapper_impl_1 = require("../../../models/checkout-items/checkout-items-data-mapper-impl");
const checkout_object_data_mapper_impl_1 = require("../../../models/checkout-object/checkout-object-data-mapper-impl");
const event_data_mapper_impl_1 = require("../../../models/event/event-data-mapper-impl");
const extra_credit_data_mapper_impl_1 = require("../../../models/extra-credit/extra-credit-data-mapper-impl");
const hackathon_1 = require("../../../models/hackathon");
const active_hackathon_1 = require("../../../models/hackathon/active-hackathon");
const location_data_mapper_impl_1 = require("../../../models/location/location-data-mapper-impl");
const register_1 = require("../../../models/register");
const RSVP_data_mapper_impl_1 = require("../../../models/RSVP/RSVP-data-mapper-impl");
const scanner_data_mapper_impl_1 = require("../../../models/scanner/scanner-data-mapper-impl");
const update_data_mapper_impl_1 = require("../../../models/update/update-data-mapper-impl");
const admin_processor_1 = require("../../../processors/admin-processor");
const index_processor_1 = require("../../../processors/index-processor");
const pre_registration_processor_1 = require("../../../processors/pre-registration-processor");
const registration_processor_1 = require("../../../processors/registration-processor");
const scanner_processor_1 = require("../../../processors/scanner-processor");
const update_processor_1 = require("../../../processors/update-processor");
const routes_1 = require("../../../router/routes");
const admin_2 = require("../../../router/routes/admin");
const admin_3 = require("../../../router/routes/admin/");
const admin_checkout_1 = require("../../../router/routes/admin/admin-checkout");
const admin_scanner_1 = require("../../../router/routes/admin/admin-scanner");
const internal_1 = require("../../../router/routes/internal");
const events_1 = require("../../../router/routes/live/events");
const live_1 = require("../../../router/routes/live/live");
const updates_1 = require("../../../router/routes/live/updates");
const register_2 = require("../../../router/routes/register");
const auth_1 = require("../../auth");
const apikey_auth_1 = require("../../auth/apikey-auth");
const rbac_1 = require("../../auth/RBAC/rbac");
const sendgrid_service_1 = require("../../communication/email/sendgrid.service");
const onesignal_service_1 = require("../../communication/push-notification/onesignal.service");
const memcache_impl_service_1 = require("../../database/cache/memcache-impl.service");
const rtdb_connection_factory_1 = require("../../database/connection/rtdb-connection-factory");
const sql_connection_factory_1 = require("../../database/connection/sql-connection-factory");
const mysql_uow_service_1 = require("../../database/svc/mysql-uow.service");
const rtdb_uow_service_1 = require("../../database/svc/rtdb-uow.service");
const logging_1 = require("../../logging/logging");
const google_storage_service_1 = require("../../storage/svc/google-storage.service");
const firebase_service_1 = require("../firebase/firebase.service");
const rate_limiter_service_1 = require("../rate-limiter/rate-limiter.service");
const root_injector_1 = require("./root-injector");
class ExpressProvider {
    static config() {
        root_injector_1.RootInjector.registerProvider([
            // Controllers
            { provide: 'IndexController', useClass: routes_1.IndexController },
            { provide: 'LiveController', useClass: live_1.LiveController },
            { provide: 'UpdatesController', useClass: updates_1.UpdatesController },
            { provide: 'EventsController', useClass: events_1.EventsController },
            { provide: 'InternalController', useClass: internal_1.InternalController },
            { provide: 'RegistrationController', useClass: register_2.RegistrationController },
            { provide: 'AdminController', useClass: admin_3.AdminController },
            { provide: 'AdminRegisterController', useClass: admin_2.AdminRegisterController },
            { provide: 'AdminStatisticsController', useClass: admin_2.AdminStatisticsController },
            { provide: 'AdminHackathonController', useClass: admin_2.AdminHackathonController },
            { provide: 'AdminScannerController', useClass: admin_scanner_1.AdminScannerController },
            { provide: 'AdminLocationController', useClass: admin_2.AdminLocationController },
            { provide: 'AdminCheckoutController', useClass: admin_checkout_1.AdminCheckoutController },
            // Processors
            { provide: 'IIndexProcessor', useClass: index_processor_1.IndexProcessor },
            { provide: 'IRegistrationProcessor', useClass: registration_processor_1.RegistrationProcessor },
            { provide: 'IPreregistrationProcessor', useClass: pre_registration_processor_1.PreRegistrationProcessor },
            { provide: 'IAdminProcessor', useClass: admin_processor_1.AdminProcessor },
            { provide: 'IAdminScannerProcessor', useClass: scanner_processor_1.ScannerProcessor },
            { provide: 'IScannerProcessor', useClass: scanner_processor_1.ScannerProcessor },
            { provide: 'IUpdateProcessor', useClass: update_processor_1.UpdateProcessor },
            // Data Mappers
            { provide: 'IUpdateDataMapper', useClass: update_data_mapper_impl_1.UpdateDataMapperImpl },
            { provide: 'IEventDataMapper', useClass: event_data_mapper_impl_1.EventDataMapperImpl },
            { provide: 'ILocationDataMapper', useClass: location_data_mapper_impl_1.LocationDataMapperImpl },
            { provide: 'IAttendanceDataMapper', useClass: attendance_data_mapper_impl_1.AttendanceDataMapperImpl },
            { provide: 'IExtraCreditDataMapper', useClass: extra_credit_data_mapper_impl_1.ExtraCreditDataMapperImpl },
            { provide: 'IRegisterDataMapper', useClass: register_1.RegisterDataMapperImpl },
            { provide: 'IPreRegisterDataMapper', useClass: register_1.PreRegisterDataMapperImpl },
            { provide: 'IRsvpDataMapper', useClass: RSVP_data_mapper_impl_1.RsvpDataMapperImpl },
            { provide: 'IActiveHackathonDataMapper', useClass: active_hackathon_1.ActiveHackathonDataMapperImpl },
            { provide: 'IHackathonDataMapper', useClass: hackathon_1.HackathonDataMapperImpl },
            { provide: 'IAdminDataMapper', useClass: admin_1.AdminDataMapperImpl },
            { provide: 'IAdminStatisticsDataMapper', useClass: admin_statistics_data_mapper_impl_1.AdminStatisticsDataMapperImpl },
            { provide: 'IScannerDataMapper', useClass: scanner_data_mapper_impl_1.ScannerDataMapperImpl },
            { provide: 'ICheckoutObjectDataMapper', useClass: checkout_object_data_mapper_impl_1.CheckoutObjectDataMapperImpl },
            { provide: 'ICheckoutItemsDataMapper', useClass: checkout_items_data_mapper_impl_1.CheckoutItemsDataMapperImpl },
            // Interfaces
            { provide: 'IAcl', useClass: rbac_1.RBAC },
            { provide: 'IAuthService', useClass: auth_1.FirebaseAuthService },
            { provide: 'IScannerAuthService', useClass: apikey_auth_1.ApikeyAuthService },
            { provide: 'IConnectionFactory', useClass: sql_connection_factory_1.SqlConnectionFactory },
            { provide: 'IRtdbFactory', useClass: rtdb_connection_factory_1.RtdbConnectionFactory },
            { provide: 'IPushNotifService', useClass: onesignal_service_1.OnesignalService },
            { provide: 'ICacheService', useClass: memcache_impl_service_1.MemCacheServiceImpl },
            { provide: 'IEmailService', useClass: sendgrid_service_1.SendgridService },
            { provide: 'IStorageService', useClass: google_storage_service_1.GoogleStorageService },
            // Classes
            { provide: 'FirebaseService', useValue: firebase_service_1.FirebaseService.instance },
            { provide: 'RateLimiterService', useClass: rate_limiter_service_1.RateLimiterService },
            { provide: 'MysqlUow', useClass: mysql_uow_service_1.MysqlUow },
            { provide: 'RtdbUow', useClass: rtdb_uow_service_1.RtdbUow },
            { provide: 'BunyanLogger', useClass: logging_1.Logger },
        ]);
    }
}
exports.ExpressProvider = ExpressProvider;
//# sourceMappingURL=providers.js.map