import nock = require('nock');
import { encrypt } from '@bitgo/sdk-api';
import { Environment, Environments, Wallet } from '@bitgo/sdk-core';
import { BIP32, Triple } from '@bitgo/wasm-utxo';

import { defaultBitGo } from './utxoCoins';

export function nockBitGo(bitgo = defaultBitGo): nock.Scope {
  const env = Environments[bitgo.getEnv()] as Environment;
  return nock(env.uri);
}

/**
 * Mock the key fetching endpoints for a wallet.
 * Sets up nock to return the key triple with the user key encrypted.
 */
export function nockWalletKeys(wallet: Wallet, keyTriple: Triple<BIP32>, userPassphrase: string): void {
  const [user] = keyTriple;
  const pubs = keyTriple.map((k) => k.neutered().toBase58());
  const responses = [
    { pub: pubs[0], encryptedPrv: encrypt(userPassphrase, user.toBase58()) },
    { pub: pubs[1] },
    { pub: pubs[2] },
  ];
  wallet.keyIds().forEach((id, i) => nockBitGo().get(`/api/v2/${wallet.coin()}/key/${id}`).reply(200, responses[i]));
}
