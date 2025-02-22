import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types/DateFromISOString';
import { BigIntFromString } from 'io-ts-types/BigIntFromString';

// codecs for lightning wallet transaction related apis

/**
 * Transaction entry details
 */
export const TransactionEntry = t.intersection(
  [
    t.type({
      inputs: t.number,
      outputs: t.number,
      value: t.number,
      valueString: t.string,
      address: t.string,
    }),
    t.partial({
      wallet: t.string,
    }),
  ],
  'TransactionEntry'
);
export type TransactionEntry = t.TypeOf<typeof TransactionEntry>;

/**
 * Transaction input/output details
 */
export const Output = t.intersection(
  [
    t.type({
      id: t.string,
      value: t.number,
      valueString: t.string,
    }),
    t.partial({
      wallet: t.string,
      address: t.string,
    }),
  ],
  'Output'
);
export type Output = t.TypeOf<typeof Output>;

/**
 * Transaction details
 */
export const Transaction = t.intersection(
  [
    t.type({
      id: t.string,
      normalizedTxHash: t.string,
      blockHeight: t.number,
      blockHash: t.string,
      blockPosition: t.number,
      inputIds: t.array(t.string),
      entries: t.array(TransactionEntry),
      inputs: t.array(Output),
      outputs: t.array(Output),
      size: t.number,
      date: DateFromISOString,
      fee: t.number,
      feeString: t.string,
      hex: t.string,
      confirmations: t.number,
    }),
    t.partial({
      label: t.string,
    }),
  ],
  'Transaction'
);
export type Transaction = t.TypeOf<typeof Transaction>;

/**
 * Transaction query parameters
 */
export const TransactionQuery = t.partial(
  {
    blockHeight: BigIntFromString,
    limit: BigIntFromString,
    startDate: DateFromISOString,
    endDate: DateFromISOString,
  },
  'TransactionQuery'
);
export type TransactionQuery = t.TypeOf<typeof TransactionQuery>;
