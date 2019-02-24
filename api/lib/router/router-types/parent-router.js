"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ParentRouter {
    static registerRouter(route, routerToken, version = 1) {
        this.registeredRoutes.set(`/v${version}/${this.baseRoute}${route}`, routerToken);
    }
    static setResponseHeaders(eResponse) {
        eResponse.setHeader('X-API-version', '2.0');
    }
    sendResponse(eResponse, response) {
        ParentRouter.setResponseHeaders(eResponse);
        return Promise.resolve(eResponse.status(response.status).send(response));
    }
}
ParentRouter.registeredRoutes = new Map();
ParentRouter.baseRoute = '';
exports.ParentRouter = ParentRouter;
//# sourceMappingURL=parent-router.js.map