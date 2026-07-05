import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as {
        sqlMessage?: string;
        sql?: string;
        code?: string;
      };

      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: driverError?.sqlMessage ?? exception.message,
        error: 'Database Error',
        sql: driverError?.sql,
        code: driverError?.code,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        return response.status(status).json({
          success: false,
          statusCode: status,
          message: body,
        });
      }

      const obj = body as Record<string, unknown>;
      const { statusCode: _s, error, message, ...extra } = obj;

      if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
        return response.status(status).json({
          success: false,
          statusCode: status,
          ...(message as Record<string, unknown>),
          ...(error ? { error } : {}),
        });
      }

      return response.status(status).json({
        success: false,
        statusCode: status,
        message,
        ...(error ? { error } : {}),
        ...extra,
      });
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: 'Internal Server Error',
    });
  }
}