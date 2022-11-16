import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { AmapjService } from './amapj.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import config from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, AmapjService],
})
export class AppModule {}
