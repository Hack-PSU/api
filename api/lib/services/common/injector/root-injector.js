"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
class RootInjector {
    static getInjector() {
        if (!this.injector) {
            this.injector = injection_js_1.ReflectiveInjector.fromResolvedProviders(Array.from(this.providers));
        }
        return this.injector;
    }
    static registerProvider(providers) {
        injection_js_1.ReflectiveInjector.resolve(providers).forEach(provider => this.providers.add(provider));
    }
}
RootInjector.providers = new Set();
exports.RootInjector = RootInjector;
//# sourceMappingURL=root-injector.js.map