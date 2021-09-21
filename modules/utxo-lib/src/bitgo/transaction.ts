import * as networks from '../networks';
import { Network, ZcashNetwork } from '../networkTypes';
import { getMainnet } from '../coins';

import { UtxoTransaction } from './UtxoTransaction';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { DashTransaction } from './dash/DashTransaction';
import { DashTransactionBuilder } from './dash/DashTransactionBuilder';
import { ZcashTransactionBuilder } from './zcash/ZcashTransactionBuilder';
import { ZcashTransaction } from './zcash/ZcashTransaction';

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

export function setTransactionBuilderDefaults(txb: UtxoTransactionBuilder, network: Network): void {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
      txb.setVersion(2);
      break;
    case networks.zcash:
      (txb as ZcashTransactionBuilder).setVersion(4);
      (txb as ZcashTransactionBuilder).setVersionGroupId(0x892f2085);
      // Use "Canopy" consensus branch ID https://zips.z.cash/zip-0251
      (txb as ZcashTransactionBuilder).setConsensusBranchId(0xe9ff75a6);
      break;
  }
}

export function createTransactionBuilderForNetwork(network: Network): UtxoTransactionBuilder {
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
  }

  setTransactionBuilderDefaults(txb, network);

  return txb;
}

export function createTransactionBuilderFromTransaction(tx: UtxoTransaction): UtxoTransactionBuilder {
  switch (getMainnet(tx.network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.litecoin:
      return UtxoTransactionBuilder.fromTransaction(tx);
    case networks.dash:
      return DashTransactionBuilder.fromTransaction(tx as DashTransaction);
    case networks.zcash:
      return ZcashTransactionBuilder.fromTransaction(tx as ZcashTransaction);
  }

  throw new Error(`invalid network`);
}
