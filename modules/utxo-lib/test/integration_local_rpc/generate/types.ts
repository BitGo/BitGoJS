/**
 * @prettier
 */
const networks = require('../../../src/networks');
const Transaction = require('../../../src/transaction');

export type Network = typeof networks[string];

export type Transaction = {
  getId(): string;
  toBuffer(): Buffer;
};

export type Triple<T> = [T, T, T];
