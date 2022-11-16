import { Injectable } from '@nestjs/common';
import { AmapjService } from './amapj.service';
import { firstValueFrom, of } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  public static EMAIL_SENDER = `AMAP Distributions <distribution@amap-boulognebillancourt.fr>`;
  public EMAIL_MAINTAINER: string;
  public static MIN_NUMBER_OF_DISTRIBUTORS = 4;

  public constructor(
    private readonly amapjService: AmapjService,
    private readonly configService: ConfigService
  ) {
    this.EMAIL_MAINTAINER = this.configService.get<string>('maintainerEmail') ?? 'clement.berti@gmail.com';
  }

  async sendReminder(): Promise<any> {
    let distributions: Record<string, string> = {};
    try {
      const fullYear = await this.amapjService.getDistributionList();
      fullYear.map((week) => {
        distributions[week[2]] = week[6];
      });
    } catch (error: any) {
      return this.warnThatSomethingWentWrong('la récupération des permanences sur AMAPJ', error);
    }

    try {
      return await this.sendReminderWhenNecessary(distributions);
    } catch (error: any) {
      return this.warnThatSomethingWentWrong('l\'envois du mail de rappel aux AMAPiens', error);
    }
  }

  private async sendReminderWhenNecessary(distributions: any): Promise<string> {
    const comingTuesday: string = this.getNextDayOfWeek(new Date(), 2, true) as string;
    const nbMissingDistributors = this.getNumberOfDistributors(comingTuesday, distributions);
    if (nbMissingDistributors === 0) {
      return firstValueFrom(of('ok'));
    }
    if (nbMissingDistributors === AppService.MIN_NUMBER_OF_DISTRIBUTORS) {
      return this.sendEmailToAskIfItsNormal(comingTuesday);
    }

    const nextWednesday: Date = this.getNextDayOfWeek(new Date(), 3) as Date;
    let followingTuesday: string = this.getNextDayOfWeek(nextWednesday, 2, true) as string;
    const nbMissingDistributorsWeekAfter = this.getNumberOfDistributors(followingTuesday, distributions);
    if (nbMissingDistributorsWeekAfter === 0) {
      followingTuesday = undefined;
    }

    // send a reminder email
    return this.sendEmailToRemindOfMissingDistributors(comingTuesday, followingTuesday);
  }

  private getNextDayOfWeek(date: Date, dayOfWeek: number, format = false): string | Date {
    let resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

    if (format) {
      return resultDate.toLocaleString("default", { day: "2-digit" }) + "/" +
        (resultDate.toLocaleString("default", { month: "2-digit" })) + "/" +
        resultDate.toLocaleString("default", { year: "numeric" });
    }
    return resultDate;
  }

  private getNumberOfDistributors(day: string, distributions: any): number {
    const distributors = distributions[day].split(', ').filter((person) => person);
    return Math.max(AppService.MIN_NUMBER_OF_DISTRIBUTORS - distributors.length, 0);
  }

  private sendEmailToRemindOfMissingDistributors(date: string, nextDate?: string): Promise<any> {
    const nextTuesday: string = nextDate ? `, ainsi que le mardi suivant ${nextDate}` : '';
    const sendTo: string = this.configService.get<string>('membersMailingList');
    const text = `
Bonjour à tou.te.s,
      
Il manque des distributeurs pour mardi ${date}${nextTuesday}.
Merci de vous inscrire aux permanences sur AMAPJ afin que la distribution se déroule dans les meilleures conditions.

https://s3.amapj.fr/p/billancourt#!/mes_permanences
      
AMAPicalement,
      
L'AMAP de Boulogne-Billancourt

PS: Merci à vous pour votre participation à 4 permanences dans l'année !`;

    return this.sendEmail(sendTo, '[AMAP] - Il manque des distributeurs mardi !', text);
  }

  private sendEmailToAskIfItsNormal(date: string): Promise<any> {
    const text = `
Salut Clément,

j'ai un doute sur la date suivante (${date}), personne n'est inscrit à la prochaine distribution de l'AMAP...
Dans le doute je n'envois pas de mail.

AMAP-Boulbi-Bot`;

    return this.sendEmail(this.EMAIL_MAINTAINER, 'Manque t-il des distributeurs mardi ?', text);
  }

  private warnThatSomethingWentWrong(when: string, error: any): Promise<any> {
    const text = `
Salut Clément,

Il y a eu un problème lors de ${when}.

Voici ce que j'ai comme info : ${error.message ?? error.description ?? error.toString()}

Il faudrait regarder le script notifiant automatiquement lorsqu'il manque des distributeurs !

AMAP-Boulbi-Bot`;

    return this.sendEmail(this.EMAIL_MAINTAINER, 'Check ton script de permanences !', text);
  }

  private sendEmail(to: string, subject: string, text: string): Promise<any> {
    const apiKey = this.configService.get<string>('mailgun.apikey');
    const domain = this.configService.get<string>('mailgun.domain');

    const mailgun = require('mailgun-js')({
      domain,
      apiKey,
      host: 'api.eu.mailgun.net'
    });

    return mailgun.messages().send({
      from: AppService.EMAIL_SENDER, to, subject, text
    });
  }

  // private findNumberOfDistribPerPerson(fullYear: any): Array<string> {
  //   const topDistributeurs = {};
  //   fullYear.map((week) => {
  //     const distributeurs = week[6].split(', ');
  //     distributeurs.map((name) => {
  //       if (!name) {
  //         return;
  //       }
  //       if (!topDistributeurs[name]) {
  //         topDistributeurs[name] = { counter: 0, name };
  //       }
  //       topDistributeurs[name].counter += 1;
  //     })
  //   });
  //
  //   return Object.values(topDistributeurs)
  //     .sort((a: any, b: any) => a.counter <= b.counter ? 1 : -1)
  //     .map((a: any) => {
  //       return `${a.name}, ${a.counter}`
  //     });
  // }

}
