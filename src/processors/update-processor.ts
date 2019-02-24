import { Inject, Injectable } from 'injection-js';
import { IUpdateDataMapper } from '../models/update';
import { Update } from '../models/update/update';
import { ResponseBody } from '../router/router-types';
import { IPushNotifService } from '../services/communication/push-notification';
import { Logger } from '../services/logging/logging';

export interface IUpdateProcessor {
  processUpdate(update: Update): Promise<ResponseBody>;
}

@Injectable()
export class UpdateProcessor implements IUpdateProcessor {

  constructor(
    @Inject('IUpdateDataMapper') private readonly updateDataMapper: IUpdateDataMapper,
    @Inject('IPushNotifService') private notificationService: IPushNotifService,
    @Inject('BunyanLogger') private logger: Logger,
  ) {}

  public async processUpdate(update: Update) {
    const result = await this.updateDataMapper.insert(update);
    // Send out push notification and pass along stream
    if (update.push_notification) {
      try {
        await this.notificationService.sendNotification(
          update.update_title,
          update.update_text,
        );
      } catch (error) {
        this.logger.error(error);
      }
    }
    return new ResponseBody(
      'Success',
      200,
      { result: 'Success', data: result },
    );
  }
}
