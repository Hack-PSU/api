import { Request } from 'express';
import { IUow } from '../services/database/svc/uow.service';

export interface IHackpsuRequest extends Request {
  uow: IUow;
}
