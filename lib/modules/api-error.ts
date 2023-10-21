export class ApiError extends Error {
  statusCode: number = 0;
  message: string = "";

  constructor(statusCode: number, message: string) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}
