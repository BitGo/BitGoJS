import { TxOutput } from 'bitcoinjs-lib';

import { networks, Network, getMainnet } from '../networks';

import { UtxoTransaction } from './UtxoTransaction';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { DashTransaction } from './dash/DashTransaction';
import { DashTransactionBuilder } from './dash/DashTransactionBuilder';
import { ZcashTransactionBuilder } from './zcash/ZcashTransactionBuilder';
import { ZcashNetwork, ZcashTransaction } from './zcash/ZcashTransaction';

export function createTransactionFromBuffer(buf: Buffer, network: Network): UtxoTransaction {
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.litecoin:
      return UtxoTransaction.fromBuffer(buf, false, network);
    case networks.dash:
      return DashTransaction.fromBuffer(buf, false, network);
    case networks.zcash:
      return ZcashTransaction.fromBuffer(buf, false, network as ZcashNetwork);
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}

/* istanbul ignore next */
export function createTransactionFromHex(hex: string, network: Network): UtxoTransaction {
  return createTransactionFromBuffer(Buffer.from(hex, 'hex'), network);
}

export function getDefaultTransactionVersion(network: Network): number {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
      return 2;
    case networks.zcash:
      return 4;
    default:
      return 1;
  }
}

export function setTransactionBuilderDefaults(
  txb: UtxoTransactionBuilder,
  network: Network,
  { version = getDefaultTransactionVersion(network) }: { version?: number } = {}
): void {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
      if (version !== 2) {
        throw new Error(`invalid version`);
      }
      txb.setVersion(version);
      break;
    case networks.zcash:
      (txb as ZcashTransactionBuilder).setDefaultsForVersion(version);
      break;
    default:
      if (version !== 1) {
        throw new Error(`invalid version`);
      }
  }
}

export function createTransactionBuilderForNetwork(
  network: Network,
  { version }: { version?: number } = {}
): UtxoTransactionBuilder {
  let txb;
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.litecoin: {
      txb = new UtxoTransactionBuilder(network);
      break;
    }
    case networks.dash:
      txb = new DashTransactionBuilder(network);
      break;
    case networks.zcash: {
      txb = new ZcashTransactionBuilder(network as ZcashNetwork);
      break;
    }
    default:
      throw new Error(`unsupported network`);
  }

  setTransactionBuilderDefaults(txb, network, { version });

  return txb;
}

export function createTransactionBuilderFromTransaction(
  tx: UtxoTransaction,
  prevOutputs?: TxOutput[]
): UtxoTransactionBuilder {
  switch (getMainnet(tx.network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.litecoin:
      return UtxoTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
    case networks.dash:
      return DashTransactionBuilder.fromTransaction(tx as DashTransaction, undefined, prevOutputs);
    case networks.zcash:
      return ZcashTransactionBuilder.fromTransaction(tx as ZcashTransaction, undefined, prevOutputs);
  }

  throw new Error(`invalid network`);
}
