import { coins } from '@bitgo/statics';

export const supportedCoins: string[] = [coins.get('eth').name, coins.get('polygon').name].map((e) => e.toLowerCase());
export const supportedTestCoins: string[] = [coins.get('gteth').name, coins.get('tpolygon').name].map((e) =>
  e.toLowerCase()
);
