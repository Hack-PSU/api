import * as request from 'request';
import { IEmailData } from './email-types';

export interface IEmailService {
  sendEmail(data: IEmailData): Promise<[request.Response, {}]>;
}
