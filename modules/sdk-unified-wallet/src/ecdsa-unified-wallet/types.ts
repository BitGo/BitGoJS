import { coins } from '@bitgo/statics';

export const supportedCoins: string[] = [coins.get('ethereum').name, coins.get('polygon').name].map((e) =>
  e.toLowerCase()
);
export const supportedTestCoins: string[] = [coins.get('tgeth').name, coins.get('tpolygon').name].map((e) =>
  e.toLowerCase()
);
