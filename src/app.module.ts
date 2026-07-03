import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { resolve } from 'path';
import { agent } from 'supertest';
import { AuthMiddleware } from './auth.middleware';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [AdminModule],
  controllers: [AppController],
  providers: [
    // {
    //   provide: APP_GUARD, useClass: AuthGuard
    // },
    {
      provide: 'app-service', useClass: AppService
    },
    {
      provide: 'user', useValue: { name: 'thepham', age: 18 }
    },
    {
      provide: 'user2', useFactory() {
        return {
          name: "nestjs",
          age: 8
        }
      }
    },
    {
      provide: 'newUser', useFactory(user, appService){
        return {
          name: user.name + ' aaa',
          helloService: appService.getHello()
        }
      },
      inject: ['user', 'app-service']
    },
    {
      provide: 'user3', useFactory: async() => {
        await new Promise(resolve => {
          setTimeout(resolve, 3000)
        })

        return {
          name: 'thepham promise',
          age: 18
        }
      }
    }
  ],
})
export class AppModule implements NestModule{ 
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes('/api/*')
  }
}
 