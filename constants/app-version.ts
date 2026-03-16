const appConfig = require('../app.json');

export const APP_VERSION: string = appConfig?.expo?.version ?? '0.0.0';
export const APP_NAME: string = appConfig?.expo?.name ?? 'SalesInsight';
