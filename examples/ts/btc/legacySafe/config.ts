import { BitGo, BitGoAPI } from '../../../../modules/bitgo';
import { Tbtc } from '@bitgo/sdk-coin-btc';

const env = 'test';
const bitgo = new BitGo({ env });

const accessToken = '';
const walletId = '';
const walletPassphrase = '';
const userKey = '';
const backupKey = '';

const sdk = new BitGoAPI({ env });
sdk.register('tbtc', Tbtc.createInstance);
sdk.authenticateWithAccessToken({ accessToken });

export const legacySafeConfig = {
  env,
  coin: env === 'test' ? 'tbtc' : 'btc',
  bitgo,
  sdk,
  userPassword: walletPassphrase,
  walletId: walletId,
  userKey,
  backupKey,
};
