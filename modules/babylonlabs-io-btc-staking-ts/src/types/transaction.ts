import { Psbt, Transaction } from "bitcoinjs-lib";

/**
 * PsbtResult is an object containing a partially signed transaction and its fee
 */
export interface PsbtResult {
  psbt: Psbt;
  fee: number;
}

/**
 * TransactionResult is an object containing an unsigned transaction and its fee
 */
export interface TransactionResult {
  transaction: Transaction;
  fee: number;
}
