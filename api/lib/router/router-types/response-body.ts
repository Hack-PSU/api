export class ResponseBody {
  private response: string;
  private status: number;
  private body: any;

  constructor(response: string, status: number, body: any) {
    this.response = response;
    this.status = status;
    this.body = body;
  }
}
