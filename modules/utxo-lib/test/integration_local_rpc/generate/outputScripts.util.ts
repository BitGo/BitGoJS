/**
 * @prettier
 */
import * as crypto from 'crypto';
import { Network } from '../../../src/networkTypes';
import { Transaction, Triple } from './types';
import { createOutputScript2of3, ScriptType2Of3, scriptTypes2Of3 } from '../../../src/bitgo/outputScripts';
import { getMainnet, isBitcoin, isBitcoinGold, isLitecoin } from '../../../src/coins';

const utxolib = require('../../../src');

export const scriptTypesSingleSig = ['p2pkh', 'p2wkh'] as const;
export type ScriptTypeSingleSig = typeof scriptTypesSingleSig[number];

export const scriptTypes = [...scriptTypesSingleSig, ...scriptTypes2Of3];
export type ScriptType = ScriptType2Of3 | ScriptTypeSingleSig;

export function requiresSegwit(scriptType: ScriptType): boolean {
  return scriptType === 'p2wkh' || scriptType === 'p2wsh' || scriptType === 'p2shP2wsh';
}

export interface HDNode {
  getPublicKeyBuffer(): Buffer;
}

export type KeyTriple = Triple<HDNode>;

function getKey(seed: string): HDNode {
  return utxolib.HDNode.fromSeedBuffer(crypto.createHash('sha256').update(seed).digest());
}

export function getKeyTriple(seed: string): KeyTriple {
  return [getKey(seed + '.0'), getKey(seed + '.1'), getKey(seed + '.2')];
}

export function supportsSegwit(network: Network): boolean {
  return isBitcoin(network) || isLitecoin(network) || isBitcoinGold(network);
}

export function isSupportedDepositType(network: Network, scriptType: ScriptType): boolean {
  return !requiresSegwit(scriptType) || supportsSegwit(network);
}

export function isSupportedSpendType(network: Network, scriptType: ScriptType): boolean {
  if (!scriptTypes2Of3.includes(scriptType as ScriptType2Of3)) {
    return false;
  }

  return isSupportedDepositType(network, scriptType);
}

/**
 *
 * @param keys - Pubkeys to use for generating the address.
 *               If scriptType is single-sig, the first key will be used.
 * @param scriptType
 * @param network
 * @return {Buffer} scriptPubKey
 */
export function createScriptPubKey(keys: KeyTriple, scriptType: ScriptType, network: Network): Buffer {
  switch (scriptType) {
    case 'p2sh':
    case 'p2shP2wsh':
    case 'p2wsh':
      return createOutputScript2of3(
        keys.map((k) => k.getPublicKeyBuffer()),
        scriptType
      ).scriptPubKey;
  }

  const key = keys[0];
  const pkHash = utxolib.crypto.hash160(key.getPublicKeyBuffer());
  switch (scriptType) {
    case 'p2pkh':
      return utxolib.script.pubKeyHash.output.encode(pkHash);
    case 'p2wkh':
      return utxolib.script.witnessPubKeyHash.output.encode(pkHash);
  }

  throw new Error(`unsupported output type ${scriptType}`);
}

export function getTransactionBuilder(network: Network) {
  const txb = new utxolib.TransactionBuilder(network);
  switch (getMainnet(network)) {
    case utxolib.networks.zcash:
      txb.setVersion(4);
      txb.setVersionGroupId(0x892f2085);
      // Use "Canopy" consensus branch ID https://zips.z.cash/zip-0251
      txb.setConsensusBranchId(0xe9ff75a6);
      break;
    case utxolib.networks.bitcoincash:
    case utxolib.networks.bitcoinsv:
      txb.setVersion(2);
      break;
  }
  return txb;
}

export function createSpendTransaction(
  keys: KeyTriple,
  scriptType: ScriptType,
  inputTxid: string,
  inputTxBuffer: Buffer,
  recipientScript: Buffer,
  network: Network
): Transaction {
  const inputTx = utxolib.Transaction.fromBuffer(inputTxBuffer, network);
  if (inputTx.getId() !== inputTxid) {
    throw new Error(`txid mismatch ${inputTx.get()} ${inputTxid}`);
  }

  if (!scriptTypes2Of3.includes(scriptType as ScriptType2Of3)) {
    throw new Error(`invalid scriptType ${scriptType}`);
  }

  const { scriptPubKey, redeemScript, witnessScript } = createOutputScript2of3(
    keys.map((k) => k.getPublicKeyBuffer()),
    scriptType as ScriptType2Of3
  );
  const matches = inputTx.outs.map((o, vout) => [o, vout]).filter(([o]) => scriptPubKey.equals(o.script));
  if (!matches.length) {
    throw new Error(`could not find matching outputs in funding transaction`);
  }

  const txBuilder = getTransactionBuilder(network);

  matches.forEach(([{}, vout]) => {
    txBuilder.addInput(inputTxid, vout);
  });

  const inputSum = matches.reduce((sum, [o]) => sum + o.value, 0);
  const fee = 1000;

  txBuilder.addOutput(recipientScript, inputSum - fee);

  matches.forEach(([output], vin) => {
    keys.slice(0, 2).forEach((key) => {
      let sighash: number;
      switch (getMainnet(network)) {
        case utxolib.networks.bitcoincash:
        case utxolib.networks.bitcoinsv:
          sighash = utxolib.Transaction.SIGHASH_ALL | utxolib.Transaction.SIGHASH_BITCOINCASHBIP143;
          break;
        default:
          sighash = utxolib.Transaction.SIGHASH_ALL;
      }

      txBuilder.sign(vin, key, redeemScript, sighash, output.value, witnessScript);
    });
  });

  return txBuilder.build();
}
