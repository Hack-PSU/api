"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This enum is used as a mapping from operations to
 * An IAcl's member IAclPerm implementation. In order to
 * keep functioning error free, ensure that the enumerable
 * names here match those in IAclPerm and its extensions
 */
var AclOperations;
(function (AclOperations) {
    AclOperations[AclOperations["SEND_EMAIL"] = 0] = "SEND_EMAIL";
    AclOperations[AclOperations["COUNT"] = 1] = "COUNT";
    AclOperations[AclOperations["CREATE"] = 2] = "CREATE";
    AclOperations[AclOperations["UPDATE"] = 3] = "UPDATE";
    AclOperations[AclOperations["DELETE"] = 4] = "DELETE";
    AclOperations[AclOperations["READ"] = 5] = "READ";
    AclOperations[AclOperations["READ_ALL"] = 6] = "READ_ALL";
    AclOperations[AclOperations["GET_EMAIL"] = 7] = "GET_EMAIL";
    AclOperations[AclOperations["REDUCE_PERMISSION"] = 8] = "REDUCE_PERMISSION";
    AclOperations[AclOperations["MAKE_ACTIVE"] = 9] = "MAKE_ACTIVE";
})(AclOperations = exports.AclOperations || (exports.AclOperations = {}));
//# sourceMappingURL=index.js.map