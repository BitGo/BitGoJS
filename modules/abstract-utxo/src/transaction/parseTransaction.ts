import { AbstractUtxoCoin, ParseTransactionOptions } from '../abstractUtxoCoin.js';
import { isDescriptorWallet } from '../descriptor/index.js';

import { ParsedTransaction } from './types.js';
import * as descriptor from './descriptor/index.js';
import * as fixedScript from './fixedScript/index.js';

export async function parseTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  params: ParseTransactionOptions<TNumber>
): Promise<ParsedTransaction<TNumber>> {
  if (isDescriptorWallet(params.wallet)) {
    return descriptor.parseToAmountType(coin, params.wallet, params);
  } else {
    return fixedScript.parseTransaction(coin, params);
  }
}
