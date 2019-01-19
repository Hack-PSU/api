import v4 from 'uuid/v4';
import loadSchemas from '../../assets/schemas/load-schemas';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const preRegisteredSchema = loadSchemas('preRegisteredSchema');

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
    this.uid = uid || v4().replace(/-/g, '');
  }
}
