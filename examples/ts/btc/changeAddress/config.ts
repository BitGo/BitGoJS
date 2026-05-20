import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';

const env = 'test';

const accessToken = '';
const walletId = '';
const walletPassphrase = '';
const otp = '';

const sdk = new BitGoAPI({ env });
sdk.register('tbtc', Tbtc.createInstance);
sdk.authenticateWithAccessToken({ accessToken });

export const changeAddressConfig = {
  env,
  coin: env === 'test' ? 'tbtc' : 'btc',
  sdk,
  walletPassphrase,
  walletId,
  otp,
};
