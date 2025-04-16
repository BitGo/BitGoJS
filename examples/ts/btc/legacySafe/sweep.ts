import { legacySafeConfig } from './config';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { unspents } from './fixtures/unspents';

const destination = '2MyGxrhLC4kRfuVjLqCVYFtC7DchhgMCiNz';

/*
 * Usage: npx ts-node btc/legacySafe/sweepSDK.ts
 * */
const sweepTransaction = async () => {
  const coin = legacySafeConfig.sdk.coin(legacySafeConfig.coin) as AbstractUtxoCoin;
  return await coin.sweepV1({
    walletId: legacySafeConfig.walletId,
    walletPassphrase: legacySafeConfig.userPassword,
    unspents,
    recoveryDestination: destination,
    userKey: legacySafeConfig.userKey,
    otp: legacySafeConfig.otp,
  });
};

sweepTransaction()
  .then((sweepTxResponse) => console.log('v1 wallet sweep tx -> ', sweepTxResponse))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
