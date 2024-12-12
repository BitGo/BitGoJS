import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin, VerifyTransactionOptions } from '../abstractUtxoCoin';
import { isDescriptorWallet } from '../descriptor';

import * as fixedScript from './fixedScript';

export async function verifyTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: VerifyTransactionOptions<TNumber>
): Promise<boolean> {
  if (isDescriptorWallet(params.wallet)) {
    throw new Error('Descriptor wallets are not supported');
  } else {
    return fixedScript.verifyTransaction(coin, bitgo, params);
  }
}
