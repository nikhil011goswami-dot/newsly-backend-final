import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    const status   = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;

    const errorResponse = {
      success:    false,
      statusCode: status,
      timestamp:  new Date().toISOString(),
      path:       request.url,
      method:     request.method,
      message:    Array.isArray(message) ? message : [message],
      error:      exception.name,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      JSON.stringify(errorResponse),
    );

    response.status(status).json(errorResponse);
  }
}
