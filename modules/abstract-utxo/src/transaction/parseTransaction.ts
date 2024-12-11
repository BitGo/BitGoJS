import { AbstractUtxoCoin, ParsedTransaction, ParseTransactionOptions } from '../abstractUtxoCoin';

import { isDescriptorWallet } from '../descriptor';

import * as fixedScript from './fixedScript';

export async function parseTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  params: ParseTransactionOptions<TNumber>
): Promise<ParsedTransaction<TNumber>> {
  if (isDescriptorWallet(params.wallet)) {
    throw new Error('Descriptor wallets are not supported');
  } else {
    return fixedScript.parseTransaction(coin, params);
  }
}
