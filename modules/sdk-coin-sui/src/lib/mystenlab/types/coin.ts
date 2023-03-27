import { array, boolean, Infer, literal, nullable, number, object, optional, string, union } from 'superstruct';
import { ObjectId, TransactionDigest } from './common';

export const CoinStruct = object({
  coinType: string(),
  coinObjectId: ObjectId,
  version: number(),
  digest: TransactionDigest,
  balance: number(),
  lockedUntilEpoch: nullable(number()),
  previousTransaction: TransactionDigest,
});

export type CoinStruct = Infer<typeof CoinStruct>;

export const PaginatedCoins = object({
  data: array(CoinStruct),
  nextCursor: union([ObjectId, literal(null)]),
  hasNextPage: boolean(),
});

export type PaginatedCoins = Infer<typeof PaginatedCoins>;

export const CoinBalance = object({
  coinType: string(),
  coinObjectCount: number(),
  totalBalance: number(),
  lockedBalance: object({
    epochId: optional(number()),
    number: optional(number()),
  }),
});

export type CoinBalance = Infer<typeof CoinBalance>;

export const CoinSupply = object({
  value: number(),
});

export type CoinSupply = Infer<typeof CoinSupply>;
