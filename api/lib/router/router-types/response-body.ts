import { IDbResult } from '../../services/database';

export class ResponseBody {
  public readonly response: string;
  public readonly status: number;
  public readonly body: IDbResult<any>;

  constructor(response: string, status: number, body: IDbResult<any>) {
    this.response = response;
    this.status = status;
    this.body = body;
  }
}
