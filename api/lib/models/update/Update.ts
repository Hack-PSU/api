/* eslint-disable class-methods-use-this */
import assets from '../../assets/schemas/load-schemas';
import BaseObject from '../BaseObject';

const liveUpdateSchema = assets('liveUpdateSchema');

export class Update extends BaseObject {

  static get useRTDB() {
    return true;
  }

  get schema() {
    return liveUpdateSchema;
  }

  public get id() {
    return '';
  }

  public static generateTestData() {
    throw new Error('Not implemented');
  }

  private update_title: string;
  private update_text: string;
  private update_image: string;
  private update_time: number;
  private push_notification: boolean;
  private uid: string;

  constructor(data: any) {
    super();
    this.update_title = data.updateTitle || null;
    this.update_text = data.updateText || null;
    this.update_image = data.updateImage || null;
    this.update_time = data.updateTime || new Date().getTime();
    this.push_notification = data.pushNotification || false;
    this.disallowedProperties = ['useRTDB', 'push_notification', 'hackathonPromise'];
  }
}
