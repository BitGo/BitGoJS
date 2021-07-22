/**
 * @prettier
 */
import * as assert from 'assert';
import * as crypto from 'crypto';
import { Network, Transaction, Triple } from './types';

const utxolib = require('../../../src');
const coins = require('../../../src/coins');

export const scriptTypesSingleSig = ['p2pkh', 'p2wkh'] as const;
export type ScriptTypeSingleSig = typeof scriptTypesSingleSig[number];

export const scriptTypes2Of3 = ['p2sh', 'p2shP2wsh', 'p2wsh'] as const;
export type ScriptType2Of3 = typeof scriptTypes2Of3[number];

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
  return coins.isBitcoin(network) || coins.isLitecoin(network) || coins.isBitcoinGold(network);
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

type SpendableScript = {
  scriptPubKey: Buffer;
  redeemScript?: Buffer;
  witnessScript?: Buffer;
};

/**
 * Return a 2-of-3 multisig output
 * @param keys - the key array for multisig
 * @param scriptType
 * @returns {{redeemScript, witnessScript, address}}
 */
export function createOutputScript2of3(keys: KeyTriple, scriptType: ScriptType): SpendableScript {
  const pubkeys = keys.map((k) => k.getPublicKeyBuffer());
  const script2of3 = utxolib.script.multisig.output.encode(2, pubkeys);
  const p2wshOutputScript = utxolib.script.witnessScriptHash.output.encode(utxolib.crypto.sha256(script2of3));
  let redeemScript;
  let witnessScript;
  switch (scriptType) {
    case 'p2sh':
      redeemScript = script2of3;
      break;
    case 'p2shP2wsh':
      witnessScript = script2of3;
      redeemScript = p2wshOutputScript;
      break;
    case 'p2wsh':
      witnessScript = script2of3;
      break;
    default:
      throw new Error(`unknown multisig script type ${scriptType}`);
  }

  let scriptPubKey;
  if (scriptType === 'p2wsh') {
    scriptPubKey = p2wshOutputScript;
  } else {
    const redeemScriptHash = utxolib.crypto.hash160(redeemScript);
    scriptPubKey = utxolib.script.scriptHash.output.encode(redeemScriptHash);
  }

  return { redeemScript, witnessScript, scriptPubKey };
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
      return createOutputScript2of3(keys, scriptType).scriptPubKey;
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
  switch (coins.getMainnet(network)) {
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

  const { scriptPubKey, redeemScript, witnessScript } = createOutputScript2of3(keys, scriptType);
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
      switch (coins.getMainnet(network)) {
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
