import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger(LoggingInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.url !== '/metrics')
      this.logger.log({
        message: 'Service Request Context',
        request: {
          url: request?.url,
          method: request?.method,
          query: request?.query,
          data: request?.body,
          headers: request?.headers,
        },
      });

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        if (request.url !== '/metrics')
          this.logger.log({
            message: 'Service Response Context',
            request: {
              url: request?.url,
              method: request?.method,
              query: request?.query,
              data: request?.body,
              headers: request?.headers,
            },
            response: {
              data,
              status_code: response?.statusCode,
              response_time: response.elapsedTime,
              headers: response?.getHeaders(),
            },
          });
      }),
    );
  }
}
