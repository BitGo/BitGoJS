import { ParseTransactionOptions } from '@bitgo/sdk-core';

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface VetParseTransactionOptions extends ParseTransactionOptions {
  txHex: string;
}
