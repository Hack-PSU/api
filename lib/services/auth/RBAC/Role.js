"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Role extends Object {
    get name() {
        return this._name;
    }
    get capability() {
        return this._capability;
    }
    get action() {
        return this._action;
    }
    get inherits() {
        return this._inherits;
    }
    constructor(name, capability, action, inherits) {
        super();
        this._name = name;
        this._capability = new Set(capability);
        this._action = action;
        this._inherits = inherits ? new Set(inherits) : undefined;
    }
    /**
     * Merges two provided roles.
     * This method only merges capabilities and inheritances
     * This will not perform merging on the actions
     * @param {Role} role
     */
    merge(role) {
        if (this.name !== role.name) {
            throw new Error('Cannot merge different roles');
        }
        this._capability = new Set([...this.capability, ...role.capability]);
        this._inherits = (!this.inherits && !role.inherits) ?
            undefined :
            new Set([...(this.inherits ? this.inherits : []), ...(role.inherits ? role.inherits : [])]);
    }
    toString() {
        return `{ name: ${this.name}, capabilities: ${JSON.stringify(Array.from(this.capability.values()))},inherits: ${this.inherits ?
            JSON.stringify(Array.from(this.inherits.values())) :
            undefined},action: ${this.action}`;
    }
}
exports.Role = Role;
//# sourceMappingURL=Role.js.map