import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable, tap } from 'rxjs';

@Injectable()
export class TimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now()
    // return next.handle().pipe(
    //   tap(() => {
    //     console.log('execution time: ', Date.now() - startTime)
    //   })
    // );

    return next.handle().pipe(
      map(data => ({
        success: true,
        element: data,
        timeStamp: new Date().toISOString()
      }))
    )
  }
}

