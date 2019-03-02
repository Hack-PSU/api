/**
 * This class handles any processing functions the Api needs
 */
import { Injectable } from 'injection-js';
import { ResponseBody } from '../router/router-types';

export interface IIndexProcessor {
  processIndex(): ResponseBody;
}

@Injectable()
export class IndexProcessor implements IIndexProcessor {
  public processIndex() {
    return new ResponseBody(
      'Welcome to the HackPSU API!',
      200,
      { result: 'Success', data: {} },
    );
  }
}
