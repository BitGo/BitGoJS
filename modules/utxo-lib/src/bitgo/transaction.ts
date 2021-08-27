/**
 * @prettier
 */
import * as networks from '../networks';
import { Network, ZcashNetwork } from '../networkTypes';
import { getMainnet } from '../coins';

const Transaction = require('../transaction');
const TransactionBuilder = require('../transaction_builder');

type Transaction = any;

type TransactionBuilder = any;

export function createTransactionForNetwork(network: Network): Transaction {
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dash:
    case networks.litecoin:
    case networks.zcash:
      return new Transaction(network);
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}

export function createTransactionFromBuffer(buf: Buffer, network: Network): Transaction {
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dash:
    case networks.litecoin:
    case networks.zcash:
      return Transaction.fromBuffer(buf, network);
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}

export function createTransactionFromHex(hex: string, network: Network): Transaction {
  return createTransactionFromBuffer(Buffer.from(hex, 'hex'), network);
}

export function setTransactionBuilderDefaults(txb: TransactionBuilder, network: Network): void {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
      txb.setVersion(2);
      break;
    case networks.zcash:
      txb.setVersion(4);
      txb.setVersionGroupId(0x892f2085);
      // Use "Canopy" consensus branch ID https://zips.z.cash/zip-0251
      txb.setConsensusBranchId(0xe9ff75a6);
      break;
  }
}

export function createTransactionBuilderForNetwork(network: Network): TransactionBuilder {
  let txb;
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dash:
    case networks.litecoin:
    case networks.zcash:
      txb = new TransactionBuilder(network);
      break;
    default:
      /* istanbul ignore next */
      throw new Error(`invalid network`);
  }

  setTransactionBuilderDefaults(txb, network);

  return txb;
}

export function createTransactionBuilderFromTransaction(tx: Transaction): TransactionBuilder {
  switch (getMainnet(tx.network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dash:
    case networks.litecoin:
    case networks.zcash:
      return TransactionBuilder.fromTransaction(tx, tx.network);
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}
