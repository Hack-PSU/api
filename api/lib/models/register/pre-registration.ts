import assets from '../../assets/schemas/load-schemas';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const preRegisteredSchema = assets('preRegisteredSchema');

export class PreRegistration extends BaseObject {
  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return preRegisteredSchema;
  }

  private readonly uid: UidType;
  private email: string;

  constructor(email: string, uid?: string) {
    super();
    this.email = email;
    this.uid = uid || uuidv4().replace(/-/g, '');
  }
}
