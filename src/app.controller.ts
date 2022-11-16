import { Controller, Get } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Cron('0 18 * * 0')
  notifyWhenMissingDistributors(): any {
    return this.appService.sendReminder();
  }
}
