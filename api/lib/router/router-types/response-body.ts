export class ResponseBody {
  private readonly _response: string;
  private readonly _status: number;
  private readonly _body: any;

  constructor(response: string, status: number, body: any) {
    this._response = response;
    this._status = status;
    this._body = body;
  }

  public get response(): string {
    return this._response;
  }

  public get status(): number {
    return this._status;
  }

  public get body(): any {
    return this._body;
  }
}
