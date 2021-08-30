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

export function createTransactionBuilderForNetwork(network: Network): TransactionBuilder {
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dash:
    case networks.litecoin: {
      const txb = new TransactionBuilder(network);
      switch (getMainnet(network)) {
        case networks.bitcoincash:
        case networks.bitcoinsv:
          txb.setVersion(2);
      }
      return txb;
    }
    case networks.zcash: {
      const txb = new TransactionBuilder(network as ZcashNetwork);
      txb.setVersion(4);
      txb.setVersionGroupId(0x892f2085);
      // Use "Canopy" consensus branch ID https://zips.z.cash/zip-0251
      txb.setConsensusBranchId(0xe9ff75a6);
      return txb;
    }
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
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
