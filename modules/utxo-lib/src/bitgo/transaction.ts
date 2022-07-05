import { TxOutput } from 'bitcoinjs-lib';

import { networks, Network, getMainnet } from '../networks';

import { UtxoTransaction } from './UtxoTransaction';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { DashTransaction } from './dash/DashTransaction';
import { DashTransactionBuilder } from './dash/DashTransactionBuilder';
import { ZcashTransactionBuilder } from './zcash/ZcashTransactionBuilder';
import { ZcashNetwork, ZcashTransaction } from './zcash/ZcashTransaction';

export function createTransactionFromBuffer<TNumber extends number | bigint = number>(
  buf: Buffer,
  network: Network,
  amountType: 'number' | 'bigint' = 'number',
  { version }: { version?: number } = {}
): UtxoTransaction<TNumber> {
  if (amountType !== 'number' && (getMainnet(network) === networks.dash || getMainnet(network) === networks.zcash)) {
    throw new Error('dash and zcash must use number amount type; bigint amount type is recommended for doge only');
  }
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.litecoin:
      return UtxoTransaction.fromBuffer<TNumber>(buf, false, amountType, network);
    case networks.dash:
      return DashTransaction.fromBufferDash(buf, false, network) as unknown as UtxoTransaction<TNumber>;
    case networks.zcash:
      return ZcashTransaction.fromBufferWithVersion(
        buf,
        network as ZcashNetwork,
        version
      ) as unknown as UtxoTransaction<TNumber>;
  }

  /* istanbul ignore next */
  throw new Error(`invalid network`);
}

/* istanbul ignore next */
export function createTransactionFromHex<TNumber extends number | bigint = number>(
  hex: string,
  network: Network,
  amountType: 'number' | 'bigint' = 'number'
): UtxoTransaction<TNumber> {
  return createTransactionFromBuffer<TNumber>(Buffer.from(hex, 'hex'), network, amountType);
}

export function getDefaultTransactionVersion(network: Network): number {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
      return 2;
    case networks.zcash:
      return ZcashTransaction.VERSION4_BRANCH_NU5;
    default:
      return 1;
  }
}

export function setTransactionBuilderDefaults<TNumber extends number | bigint>(
  txb: UtxoTransactionBuilder<TNumber>,
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
      (txb as unknown as ZcashTransactionBuilder).setDefaultsForVersion(network, version);
      break;
    default:
      if (version !== 1) {
        throw new Error(`invalid version`);
      }
  }
}

export function createTransactionBuilderForNetwork<TNumber extends number | bigint = number>(
  network: Network,
  { version }: { version?: number } = {}
): UtxoTransactionBuilder<TNumber> {
  let txb;
  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.litecoin: {
      txb = new UtxoTransactionBuilder<TNumber>(network);
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

  setTransactionBuilderDefaults<TNumber>(txb, network, { version });

  return txb;
}

export function createTransactionBuilderFromTransaction<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  prevOutputs?: TxOutput<TNumber>[]
): UtxoTransactionBuilder<TNumber> {
  switch (getMainnet(tx.network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.litecoin:
      return UtxoTransactionBuilder.fromTransaction<TNumber>(tx, undefined, prevOutputs);
    case networks.dash:
      return DashTransactionBuilder.fromTransactionDash(
        tx as unknown as DashTransaction,
        undefined,
        prevOutputs as TxOutput[]
      ) as unknown as UtxoTransactionBuilder<TNumber>;
    case networks.zcash:
      return ZcashTransactionBuilder.fromTransactionZcash(
        tx as unknown as ZcashTransaction,
        undefined,
        prevOutputs as TxOutput[]
      ) as unknown as UtxoTransactionBuilder<TNumber>;
  }

  throw new Error(`invalid network`);
}
