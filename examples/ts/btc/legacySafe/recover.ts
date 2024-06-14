import { legacySafeConfig } from './config';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { unspents } from './fixtures/unspents';

const destination = '2MyGxrhLC4kRfuVjLqCVYFtC7DchhgMCiNz';

/*
 * Usage: npx ts-node btc/legacySafe/recover.ts
 * */
const recoveryTransaction = async () => {
  const coin = legacySafeConfig.sdk.coin(legacySafeConfig.coin) as AbstractUtxoCoin;
  return await coin.recoverV1({
    walletId: legacySafeConfig.walletId,
    walletPassphrase: legacySafeConfig.userPassword,
    unspents,
    recoveryDestination: destination,
    userKey: legacySafeConfig.userKey,
    backupKey: legacySafeConfig.backupKey,
  });
};

recoveryTransaction()
  .then((txHex) => console.log('v1 wallet recovery tx -> ', txHex))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
