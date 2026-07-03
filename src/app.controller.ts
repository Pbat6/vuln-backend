import { Controller, Get, Inject, Query, UseFilters, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth.guard';
import { TimeInterceptor } from './time.interceptor';
import { ValidatePipe } from './validate.pipe';
import { TestFilter } from './test.filter';

@Controller()
@UseInterceptors(TimeInterceptor)
// @UsePipes(ValidatePipe) 
export class AppController {
  constructor(
    @Inject('app-service') private readonly appService: AppService,
    @Inject('user') private readonly user: { name: string; age: number },
    @Inject('user2') private readonly user2: { name: string; age: number },
    @Inject('newUser') private readonly newUser: { name: string; helloService: string },
    @Inject('user3') private readonly user3: { name: string; age: number }
  ) { }

  @Get()
  getHello(): string {
    // console.log('name1: ', this.user.name);
    // console.log('name2: ', this.user2.name);
    // console.log('newName: ', this.newUser.name);
    // console.log('name3: ', this.user3.name);
    return this.appService.getHello();
  }

  @Get('/api/cr7')

  getInfoCR7(): string {
    return 'hello CR7';
  }

  @Get('/api/m10')
  @UseGuards(AuthGuard)
  getInfoM10(): string {
    return 'hello M10';
  }

  @Get('/api/getNumber')
  @UseFilters(TestFilter)
  getNumber(@Query('age', ValidatePipe) num: number){
    console.log(num);
    return num + 10;
  }
}

