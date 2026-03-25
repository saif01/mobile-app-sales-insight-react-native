const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const config = require('./app.json');

const isUat = String(process.env.APP_UAT).toLowerCase() === 'true';
const webViewToken = (process.env.WEB_VIEW_TOKEN ?? '').trim();
const aboutCompanyWebsite = (process.env.ABOUT_COMPANY_WEBSITE ?? '').trim();
const aboutSupportEmail = (process.env.ABOUT_SUPPORT_EMAIL ?? '').trim();
const aboutSupportPhone = (process.env.ABOUT_SUPPORT_PHONE ?? '').trim();
const aboutDeveloperName = (process.env.ABOUT_DEVELOPER_NAME ?? '').trim();

module.exports = {
  ...config,
  expo: {
    ...config.expo,
    name: isUat ? `${config.expo.name}-UAT` : config.expo.name,
    extra: {
      ...config.expo.extra,
      appUat: isUat,
      webViewToken,
      aboutCompanyWebsite,
      aboutSupportEmail,
      aboutSupportPhone,
      aboutDeveloperName,
    },
  },
};
