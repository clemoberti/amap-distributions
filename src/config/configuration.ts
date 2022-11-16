export default () => ({
  port: parseInt(process.env.PORT) || 3000,
  membersMailingList: process.env.MEMBERS_MAILING_LIST,
  amapj: {
    username: process.env.AMAPJ_USERNAME,
    password: process.env.AMAPJ_PASSWORD,
  },
  mailgun: {
    apiKey: process.env.MAILGUN_APIKEY,
    domain: 'mailgun.amap-boulognebillancourt.fr'
  }
});
