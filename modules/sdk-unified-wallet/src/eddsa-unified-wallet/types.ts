import { coins } from '@bitgo/statics';

export const supportedEDDSACoins: string[] = [coins.get('sol').name].map((e) => e.toLowerCase());
export const supportedEDDSATestCoins: string[] = [coins.get('tsol').name].map((e) => e.toLowerCase());
