import BaseObject from "../../models/BaseObject";

export interface IOrganizerApiModel {
  uid: string;
  email: string;
  firstname: string;
  lastname: string;
  privilege?: number;
}

export class Organizer extends BaseObject {

  uid: string;
  email: string;
  firstname: string;
  lastname: string;
  privilege?: number;

  constructor(data: IOrganizerApiModel) {
    super();
    this.disallowedProperties.push('privilege');
    this.uid = data.uid;
    this.email = data.email;
    this.firstname = data.firstname;
    this.lastname = data.lastname;
    // this.privilege = data.privilege;
  }

  public get id(): any {
    return this.uid;
  }
  protected get schema(): any {
    return null;
  }
}