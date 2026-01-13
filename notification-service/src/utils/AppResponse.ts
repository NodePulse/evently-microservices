export class AppResponse {
  public status: number;
  public message: string;
  public data: any;
  public error: null;

  constructor(status: number, message: string, data?: any) {
    this.status = status;
    this.message = message;
    this.data = data || null;
    this.error = null;
  }
}
