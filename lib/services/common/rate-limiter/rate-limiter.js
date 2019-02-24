"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const limiter_1 = require("limiter");
const errors_1 = require("../../../JSCommon/errors");
class RateLimiter {
    constructor(tokensPerMinute) {
        this.tokenBucket = new limiter_1.RateLimiter(tokensPerMinute, 'minute', true);
    }
    /**
     * One incoming request should make one call to this function
     * If rate limited, error will be thrown
     * @throws HttpError
     */
    makeRequest() {
        if (!this.tokenBucket.tryRemoveTokens(1)) {
            throw new errors_1.HttpError('Rate limit on this request has been hit', 429);
        }
        return true;
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map