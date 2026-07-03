import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NextFunction } from 'express';
import { AuthGuard } from './auth.guard';
import { TimeInterceptor } from './time.interceptor';
import { ValidatePipe } from './validate.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // add middleware global
  app.use(function (req: Request, res:Response, next:NextFunction){
    console.log('before>>', req.url)
    next()
    console.log('after>>', )
  })

  //add guard, interception, pipe
  // app.useGlobalGuards(new AuthGuard)
  // app.useGlobalInterceptors(new TimeInterceptor())
  // app.useGlobalPipes(new ValidatePipe)

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
