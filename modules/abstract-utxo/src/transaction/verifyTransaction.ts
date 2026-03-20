import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin, VerifyTransactionOptions } from '../abstractUtxoCoin.js';
import { getDescriptorMapFromWallet, isDescriptorWallet, getPolicyForEnv } from '../descriptor/index.js';
import { fetchKeychains, toBip32Triple } from '../keychains.js';

import * as fixedScript from './fixedScript/index.js';
import * as descriptor from './descriptor/index.js';

export async function verifyTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: VerifyTransactionOptions<TNumber>
): Promise<boolean> {
  if (isDescriptorWallet(params.wallet)) {
    const walletKeys = toBip32Triple(await fetchKeychains(coin, params.wallet));
    return descriptor.verifyTransaction(
      coin,
      params,
      getDescriptorMapFromWallet(params.wallet, walletKeys, getPolicyForEnv(bitgo.env))
    );
  } else {
    return fixedScript.verifyTransaction(coin, bitgo, params);
  }
}
