import { createHash } from 'node:crypto';

import { BIP32 } from '@bitgo/wasm-utxo';
import * as bip39 from 'bip39';
import { getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';

export const STACKS_ACCOUNT_DERIVATION_PATH = "m/44'/5757'/0'/0/0";

export type DerivedStacksAccount = {
  address: string;
  privateKey: string;
  derivationPath: string;
  mnemonicTranslated: boolean;
};

export function toBip39Mnemonic(seedPhrase: string): { mnemonic: string; translated: boolean } {
  const normalizedPhrase = seedPhrase.trim().replace(/\s+/g, ' ').normalize('NFKC');
  if (normalizedPhrase.length === 0) throw new Error('Seed phrase cannot be empty');
  if (bip39.validateMnemonic(normalizedPhrase)) return { mnemonic: normalizedPhrase, translated: false };

  const entropy = createHash('sha256').update(normalizedPhrase, 'utf8').digest();
  return { mnemonic: bip39.entropyToMnemonic(entropy), translated: true };
}

export function deriveStacksAccount(seedPhrase: string): DerivedStacksAccount {
  const { mnemonic, translated } = toBip39Mnemonic(seedPhrase);
  const root = BIP32.fromSeed(bip39.mnemonicToSeedSync(mnemonic));
  const account = root.derivePath(STACKS_ACCOUNT_DERIVATION_PATH);
  if (account.privateKey === undefined) throw new Error('Seed phrase did not produce a private key');
  const privateKey = Buffer.concat([Buffer.from(account.privateKey), Buffer.from([1])]);
  return {
    address: getAddressFromPrivateKey(privateKey, TransactionVersion.Testnet),
    privateKey: privateKey.toString('hex'),
    derivationPath: STACKS_ACCOUNT_DERIVATION_PATH,
    mnemonicTranslated: translated,
  };
}
