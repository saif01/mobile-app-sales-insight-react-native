const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const config = require('./app.json');

const isUat = String(process.env.APP_UAT).toLowerCase() === 'true';
const webViewToken = (process.env.WEB_VIEW_TOKEN ?? '').trim();

module.exports = {
  ...config,
  expo: {
    ...config.expo,
    name: isUat ? `${config.expo.name}-UAT` : config.expo.name,
    extra: {
      ...config.expo.extra,
      appUat: isUat,
      webViewToken,
    },
  },
};
