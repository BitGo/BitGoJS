import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';

export function isWalletKeyName(name: string): name is utxolib.bitgo.KeyName {
  return name === 'user' || name === 'backup' || name === 'bitgo';
}

export const keyOptions = {
  userKey: { type: 'string', demandOption: true },
  userKeyPrefix: { type: 'string', default: '0/0' },
  backupKey: { type: 'string', demandOption: true },
  backupKeyPrefix: { type: 'string', default: '0/0' },
  bitgoKey: { type: 'string', demandOption: true },
  bitgoKeyPrefix: { type: 'string', default: '0/0' },
} as const;

export type KeyOptions = {
  userKey: string;
  userKeyPrefix?: string;
  backupKey: string;
  backupKeyPrefix?: string;
  bitgoKey: string;
  bitgoKeyPrefix?: string;
};

export function getRootWalletKeys(argv: KeyOptions): utxolib.bitgo.RootWalletKeys {
  const xpubs = [argv.userKey, argv.backupKey, argv.bitgoKey].map((k) => utxolib.bip32.fromBase58(k));
  assert(utxolib.bitgo.isTriple(xpubs));
  return new utxolib.bitgo.RootWalletKeys(xpubs, [
    argv.userKeyPrefix ?? utxolib.bitgo.RootWalletKeys.defaultPrefix,
    argv.backupKeyPrefix ?? utxolib.bitgo.RootWalletKeys.defaultPrefix,
    argv.bitgoKeyPrefix ?? utxolib.bitgo.RootWalletKeys.defaultPrefix,
  ]);
}
