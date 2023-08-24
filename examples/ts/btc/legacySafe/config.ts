import { BitGo } from '../../../../modules/bitgo';

const env = 'test';
const bitgo = new BitGo({ env });

const accessToken = '<user-access-token-here>';
bitgo.authenticateWithAccessToken({ accessToken });

export const legacySafeConfig = {
  env,
  coin: env === 'test' ? 'tbtc' : 'btc',
  bitgo,
  userPassword: '<wallet-password-here>',
};
