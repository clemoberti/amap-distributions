import { firstValueFrom } from 'rxjs';
import { firstRequest, loginBody, secondLoginBody, secondRequest, thirdRequest } from './body-get-permanences';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const qs = require('qs');

@Injectable()
export class AmapjService {

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
  }

  public async getDistributionList(): Promise<any> {

    const currentDate: number = (new Date()).getTime();
    const getLoginPage = await firstValueFrom(this.httpService.get('https://s3.amapj.fr/p/billancourt'));
    const cookie: string = getLoginPage.headers["set-cookie"][0].split(';')[0];

    const xcrf = await this.getxcrf(currentDate, cookie);
    const uild = JSON.parse(xcrf.data.uidl);
    const csrfToken = uild['Vaadin-Security-Key'];
    const syncId: number = uild['syncId'] + 0;
    const clientId: number = xcrf.data['v-uiId'] + 0;

    await this.login(cookie);

    await this.makeRequest(cookie, csrfToken, clientId, syncId, loginBody);
    await this.makeRequest(cookie, csrfToken, clientId, syncId, secondLoginBody);
    await this.makeRequest(cookie, csrfToken, clientId, syncId, firstRequest);
    const res2 = await this.makeRequest(cookie, csrfToken, clientId, syncId, secondRequest);
    const res3 = await this.makeRequest(cookie, csrfToken, clientId, syncId, thirdRequest);

    const firstPart = JSON.parse(res2.data.replace('for(;;);', ''))[0].changes[0][2][2].slice(2);
    const secondPart = JSON.parse(res3.data.replace('for(;;);', ''))[0].changes[0][2][2].slice(2);
    const fullYear = firstPart.concat(secondPart);

    return fullYear;
  }

  private getxcrf(currentDate: number, cookie: string): Promise<any> {
    const token = 'v-' + currentDate;
    const url = `https://s3.amapj.fr/p/billancourt?${token}`;
    const data = qs.stringify({
      'v-browserDetails': '1',
      'theme': 'amapj',
      'v-appId': 'p-112',
      'v-sh': '960',
      'v-sw': '1536',
      'v-cw': '955',
      'v-ch': '824',
      'v-curdate': currentDate,
      'v-tzo': '-120',
      'v-dstd': '60',
      'v-rtzo': '-60',
      'v-dston': 'true',
      'v-vw': '955',
      'v-vh': '0',
      'v-loc': 'https://s3.amapj.fr/p/billancourt#!/detail_periode_permanence',
      'v-wn': 'p-112-0.20807532485566926'
    });
    return firstValueFrom(this.httpService.post(url, data, { headers: { Cookie: cookie }}));
  }

  private login(cookie: string): Promise<any> {
    const data = qs.stringify({
      'username': this.configService.get<string>('amapj.username'),
      'password': this.configService.get<string>('amapj.password')
    });
    const url: string = 'https://s3.amapj.fr/p/loginForm';

    return firstValueFrom(
      this.httpService.post(url, data, {
        headers: {
          Cookie: cookie,
          Host: 's3.amapj.fr',
          Origin: 'https://s3.amapj.fr',
          Referer: 'https://s3.amapj.fr/p/billancourt',
          'Postman-Token': '0',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
        }
      }));
  }

  private makeRequest(cookie: string, csrfToken: string, clientId: number, syncId: number, body: any): Promise<any> {
    const url: string = `https://s3.amapj.fr/p/UIDL/?v-uiId=${clientId}`;
    const data = { ...body, csrfToken };
    return firstValueFrom(this.httpService.post(url, data, {
      headers: {
        Cookie: cookie,
        'Postman-Token': '1',
        Host: 's3.amapj.fr',
        Origin: 'https://s3.amapj.fr',
        Referer: 'https://s3.amapj.fr/p/billancourt',
        'Content-Type': 'application/json;charset=UTF-8'
      }
    }));
  }
}
