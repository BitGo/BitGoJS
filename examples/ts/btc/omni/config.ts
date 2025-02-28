import { BitGoAPI } from '@bitgo/sdk-api';
import { Btc, Tbtc4 } from '@bitgo/sdk-coin-btc';
import * as utxolib from '@bitgo/utxo-lib';

const env = 'test' as 'test' | 'prod';

const accessToken = '';
const walletId = '';
const walletPassphrase = '';
// optional
const otp = '';

const sdk = new BitGoAPI({ env });
sdk.register('tbtc4', Tbtc4.createInstance);
sdk.register('btc', Btc.createInstance);
sdk.authenticateWithAccessToken({ accessToken });

export const omniConfig = {
  env,
  coin: env === 'test' ? 'tbtc4' : 'btc',
  network: env === 'test' ? utxolib.networks.bitcoinTestnet4 : utxolib.networks.bitcoin,
  sdk,
  walletPassphrase,
  walletId,
  otp,
};
