import { createHmac } from 'node:crypto';

import * as utxolib from '@bitgo/utxo-lib';

import type { BitGoCoinName, BitGoEnvironment } from './bitgo-api';

export interface Pox5FakeStakeMaterials {
  principalPreimage: Buffer;
  earlyExitKey: utxolib.ECPairInterface;
}

export function derivePox5FakeStakeMaterials(
  walletPassphrase: string,
  environment: BitGoEnvironment,
  coinName: BitGoCoinName,
  network: utxolib.Network
): Pox5FakeStakeMaterials {
  if (walletPassphrase.length === 0) throw new Error('BITGO_WALLET_PASSPHRASE must not be empty');

  const deriveSecret = (purpose: string): Buffer =>
    createHmac('sha256', walletPassphrase)
      .update('bitgojs:pox5:fake-stake:v1\0')
      .update(environment)
      .update('\0')
      .update(coinName)
      .update('\0')
      .update(purpose)
      .digest();

  const principalPreimage = deriveSecret('principal-preimage');
  const earlyExitKey = utxolib.ECPair.fromPrivateKey(deriveSecret('early-exit-private-key'), { network });
  return { principalPreimage, earlyExitKey };
}
