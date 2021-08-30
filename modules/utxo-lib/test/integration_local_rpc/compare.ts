/**
 * @prettier
 */
import { RpcTransaction } from './generate/RpcTypes';
import * as networks from '../../src/networks';
import { Network } from '../../src/networkTypes';
import { getMainnet, isZcash } from '../../src/coins';

type NormalizedObject = Record<string, unknown>;

export function normalizeParsedTransaction(tx, network: Network): NormalizedObject {
  const normalizedTx: NormalizedObject = {
    txid: tx.getId(),
    version: tx.version,
    hex: tx.toBuffer().toString('hex'),
    locktime: tx.locktime,
    size: tx.byteLength(),
    vin: tx.ins.map((i) => {
      const normalizedInput: NormalizedObject = {
        scriptSig: {
          hex: i.script.toString('hex'),
        },
        sequence: i.sequence,
        txid: Buffer.from(i.hash).reverse().toString('hex'),
        vout: i.index,
      };

      if (i.witness && i.witness.length) {
        normalizedInput.txinwitness = i.witness.map((w) => w.toString('hex'));
      }

      return normalizedInput;
    }),
    vout: tx.outs.map((o, n) => {
      return {
        n,
        scriptPubKey: {
          hex: o.script.toString('hex'),
        },
        value: o.value,
      };
    }),
  };

  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoingold:
    case networks.litecoin:
      normalizedTx.vsize = tx.virtualSize();
      normalizedTx.weight = tx.weight();
      break;
    case networks.dash:
      normalizedTx.type = tx.type;
      if (tx.extraPayload && tx.extraPayload.length) {
        normalizedTx.extraPayload = tx.extraPayload.toString('hex');
        normalizedTx.extraPayloadSize = tx.extraPayload.length;
      }
      break;
    case networks.zcash:
      normalizedTx.overwintered = !!tx.overwintered;
      normalizedTx.versiongroupid = tx.versionGroupId.toString(16);
      normalizedTx.expiryheight = tx.expiryHeight;
      normalizedTx.vjoinsplit = [];
      normalizedTx.vShieldedOutput = [];
      normalizedTx.vShieldedSpend = [];
      normalizedTx.valueBalance = 0;
  }

  return normalizedTx;
}

export function normalizeRpcTransaction(tx: RpcTransaction, network: Network): NormalizedObject {
  const normalizedTx: NormalizedObject = {
    ...tx,
    vin: tx.vin.map((v: any) => {
      delete v.scriptSig.asm;
      return v;
    }),
    vout: tx.vout.map((v: any) => {
      delete v.type;
      delete v.scriptPubKey.asm;
      delete v.scriptPubKey.addresses;
      delete v.scriptPubKey.reqSigs;
      delete v.scriptPubKey.type;
      delete v.valueSat;
      if (isZcash(network)) {
        delete v.valueZat;
      }
      v.value = v.value * 1e8;
      return v;
    }),
  };

  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.litecoin:
      // this is the normalized hash which is not implemented in utxolib
      delete normalizedTx.hash;
      break;
    case networks.dash:
      // these flags are not supported in utxolib
      delete normalizedTx.chainlock;
      delete normalizedTx.instantlock;
      delete normalizedTx.instantlock_internal;
      delete normalizedTx.proRegTx;
      delete normalizedTx.proUpServTx;
      delete normalizedTx.proUpRevTx;
      delete normalizedTx.proUpRegTx;
      break;
    case networks.zcash:
      delete normalizedTx.valueBalanceZat;
  }

  return normalizedTx;
}
