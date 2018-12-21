export class Role {
  private readonly _name: string;
  private _capability: Set<string>;
  private readonly _action: ((params: any) => boolean) | undefined;
  private _inherits: Set<string> | undefined;

  public get name(): string {
    return this._name;
  }

  public get capability(): Set<string> {
    return this._capability;
  }

  public get action(): ((params: any) => boolean) | undefined {
    return this._action;
  }

  public get inherits(): Set<string> | undefined {
    return this._inherits;
  }

  constructor(
    name: string,
    capability: string[],
    action?: (params: any) => (boolean),
    inherits?: string[],
  ) {
    this._name = name;
    this._capability = new Set<string>(capability);
    this._action = action;
    this._inherits = inherits ? new Set<string>(inherits) : undefined;
  }

  /**
   * Merges two provided roles.
   * This method only merges capabilities and inheritances
   * This will not perform merging on the actions
   * @param {Role} role
   */
  public merge(role: Role) {
    if (this.name !== role.name) {
      throw new Error('Cannot merge different roles');
    }
    this._capability = new Set([...this.capability, ...role.capability]);
    this._inherits = (!this.inherits && !role.inherits) ?
      undefined :
      new Set(
        [...(this.inherits ? this.inherits : []), ...(role.inherits ? role.inherits : [])],
      );
  }
}
