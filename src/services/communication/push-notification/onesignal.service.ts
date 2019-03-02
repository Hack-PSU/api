import { Injectable } from 'injection-js';
import * as request from 'request';
import { Constants } from '../../../assets/constants/constants';
import { IPushNotifService } from './push-notif.service';

const CONTENT_TYPE = 'application/json; charset=utf-8';
const APP_URL = 'https://app.hackpsu.org';
const ONESIGNAL_URL = 'https://onesignal.com/api/v1/notifications';

@Injectable()
export class OnesignalService implements IPushNotifService {

  private readonly authorization: string;
  private readonly appId: string;

  constructor() {
    this.appId = Constants.pushNotifKey.app_id;
    this.authorization = `Basic ${Constants.pushNotifKey.key}`;
  }

  public sendNotification(notificationTitle: string, notificationBody: string) {
    const headers = {
      Authorization: this.authorization,
      'Content-Type': CONTENT_TYPE,
    };

    const data = {
      app_id: this.appId,
      contents: { en: notificationBody.toString() },
      headings: { en: notificationTitle.toString() },
      included_segments: ['All'],
      url: APP_URL,
    };

    const options = {
      headers,
      json: data,
      method: 'POST',
      uri: ONESIGNAL_URL,
    };

    return new Promise((resolve, reject) => {
      request.post(options, (err, response, body) => {
        if (body && body.errors && body.errors.length > 0) {
          reject(body.errors);
        } else {
          resolve(body);
        }
      });
    });
  }
}
