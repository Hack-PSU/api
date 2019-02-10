import { Inject, Injectable } from 'injection-js';
import { PreRegistration } from '../models/register/pre-registration';
import { ResponseBody } from '../router/router-types';
import { IDataMapper } from '../services/database';

export interface IPreregistrationProcessor {
  processPreregistration(preRegistration: PreRegistration): Promise<ResponseBody>;
}

/**
 * This class handles any processing functions the Api needs
 */
@Injectable()
export class PreRegistrationProcessor implements IPreregistrationProcessor {

  constructor(
    @Inject('IPreRegisterDataMapper') private readonly preRegDataMapper: IDataMapper<PreRegistration>,
  ){ }

  public async processPreregistration(preRegistration: PreRegistration) {
    const result = await this.preRegDataMapper.insert(preRegistration);
    return new ResponseBody(
      'Success',
      200,
      { result: 'Success', data: { preRegistration, result } },
    );
  }
}
