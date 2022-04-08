import { IDbResult } from '../../services/database';

export class ResponseBody {
  public readonly api_response: string;
  public readonly status: number;
  public readonly body: IDbResult<any> | undefined;

  constructor(response: string, status: number, body?: IDbResult<any>) {
    this.api_response = response;
    this.status = status;
    this.body = body;
  }
}
