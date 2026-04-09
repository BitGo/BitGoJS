import * as address from '../../src/address';
import { Network, getMainnet, networks, isZcash } from '../../src/networks';
import { DashTransaction, UtxoTransaction, ZcashTransaction } from '../../src/bitgo';
import { decimalCoinsToSats } from '../testutil';

import { RpcTransaction } from './generate/RpcTypes';

type NormalizedObject = Record<string, unknown>;

function toRegtestAddress(script: Buffer, network: { bech32?: string }): string {
  switch (network) {
    case networks.testnet:
      network = { ...network, bech32: 'bcrt' };
      break;
    case networks.litecoinTest:
      network = { ...network, bech32: 'rltc' };
      break;
    case networks.bitcoingoldTestnet:
      network = { ...network, bech32: 'btgrt' };
      break;
  }
  return address.fromOutputScript(script, network as Network);
}

export function normalizeParsedTransaction<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  network: Network = tx.network
): NormalizedObject {
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
      let address;
      try {
        address = toRegtestAddress(o.script, network as { bech32?: string });
      } catch (e) {
        // ignore
      }
      return {
        n,
        scriptPubKey: {
          hex: o.script.toString('hex'),
          ...(address && { address }),
        },
        value: o.value.toString(),
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
      const dashTx = tx as unknown as DashTransaction;
      normalizedTx.type = dashTx.type;
      if (dashTx.extraPayload && dashTx.extraPayload.length) {
        normalizedTx.extraPayload = dashTx.extraPayload.toString('hex');
        normalizedTx.extraPayloadSize = dashTx.extraPayload.length;
      }
      break;
    case networks.dogecoin:
      normalizedTx.vsize = tx.virtualSize();
      break;
    case networks.zcash:
      const zcashTx = tx as unknown as ZcashTransaction;
      normalizedTx.overwintered = !!zcashTx.overwintered;
      normalizedTx.versiongroupid = zcashTx.versionGroupId.toString(16);
      normalizedTx.expiryheight = zcashTx.expiryHeight;
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
      if (v.scriptPubKey.addresses?.length === 1) {
        v.scriptPubKey.address = v.scriptPubKey.addresses[0];
      }
      delete v.type;
      delete v.scriptPubKey.asm;
      delete v.scriptPubKey.addresses;
      delete v.scriptPubKey.reqSigs;
      delete v.scriptPubKey.type;
      delete v.valueSat;
      if (isZcash(network)) {
        delete v.valueZat;
      }
      v.value = decimalCoinsToSats<bigint>(v.value, 'bigint').toString();
      return v;
    }),
  };

  switch (getMainnet(network)) {
    case networks.bitcoin:
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.dogecoin:
    case networks.ecash:
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
      delete normalizedTx.authdigest;
      delete normalizedTx.valueBalanceZat;
  }

  return normalizedTx;
}
