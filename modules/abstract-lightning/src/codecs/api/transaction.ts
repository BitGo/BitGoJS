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
      blockHash: t.string,
      blockPosition: t.number,
      label: t.string,
    }),
  ],
  'Transaction'
);
export type Transaction = t.TypeOf<typeof Transaction>;

export const ListTransactionsResponse = t.intersection(
  [
    t.type({
      transactions: t.array(Transaction),
    }),
    t.partial({
      /**
       * Transaction ID of the last transaction in this batch.
       * Use as prevId in next request to continue pagination.
       */
      nextBatchPrevId: t.string,
    }),
  ],
  'ListTransactionsResponse'
);
export type ListTransactionsResponse = t.TypeOf<typeof ListTransactionsResponse>;

/**
 * Transaction query parameters with cursor-based pagination
 */
export const TransactionQuery = t.partial(
  {
    /** Maximum number of transactions to return per page */
    limit: BigIntFromString,
    /** Optional filter for transactions at a specific block height */
    blockHeight: BigIntFromString,
    /** Optional start date filter */
    startDate: DateFromISOString,
    /** Optional end date filter */
    endDate: DateFromISOString,
    /** Transaction ID for cursor-based pagination (from nextBatchPrevId) */
    prevId: t.string,
  },
  'TransactionQuery'
);
export type TransactionQuery = t.TypeOf<typeof TransactionQuery>;
