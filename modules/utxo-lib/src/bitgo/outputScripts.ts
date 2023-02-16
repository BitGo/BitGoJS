import * as assert from 'assert';
import * as bitcoinjs from 'bitcoinjs-lib';

import { Network, p2trPayments, supportsSegwit, supportsTaproot, taproot } from '..';

import { isTriple, Triple, Tuple } from './types';

import { ecc as eccLib } from '../noble_ecc';

export { scriptTypeForChain } from './wallet/chains';

export const scriptTypeP2shP2pk = 'p2shP2pk';
export type ScriptTypeP2shP2pk = typeof scriptTypeP2shP2pk;

export const scriptTypes2Of3 = ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2'] as const;
export type ScriptType2Of3 = typeof scriptTypes2Of3[number];

export function isScriptType2Of3(t: string): t is ScriptType2Of3 {
  return scriptTypes2Of3.includes(t as ScriptType2Of3);
}

export type ScriptType = ScriptTypeP2shP2pk | ScriptType2Of3;

/**
 * @return true iff scriptType requires witness data
 */
export function hasWitnessData(scriptType: ScriptType): scriptType is 'p2shP2wsh' | 'p2wsh' | 'p2tr' | 'p2trMusig2' {
  return ['p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2'].includes(scriptType);
}

/**
 * @param network
 * @param scriptType
 * @return true iff script type is supported for network
 */
export function isSupportedScriptType(network: Network, scriptType: ScriptType): boolean {
  switch (scriptType) {
    case 'p2sh':
    case 'p2shP2pk':
      return true;
    case 'p2shP2wsh':
    case 'p2wsh':
      return supportsSegwit(network);
    case 'p2tr':
    case 'p2trMusig2':
      return supportsTaproot(network);
  }

  /* istanbul ignore next */
  throw new Error(`unexpected script type ${scriptType}`);
}

/**
 * @param t
 * @return string prevOut as defined in PREVOUT_TYPES (bitcoinjs-lib/.../transaction_builder.js)
 */
export function scriptType2Of3AsPrevOutType(t: ScriptType2Of3): string {
  switch (t) {
    case 'p2sh':
      return 'p2sh-p2ms';
    case 'p2shP2wsh':
      return 'p2sh-p2wsh-p2ms';
    case 'p2wsh':
      return 'p2wsh-p2ms';
    case 'p2tr':
      return 'p2tr-p2ns';
    case 'p2trMusig2':
      return 'p2tr';
  }

  /* istanbul ignore next */
  throw new Error(`unsupported script type ${t}`);
}

export type SpendableScript = {
  scriptPubKey: Buffer;
  redeemScript?: Buffer;
  witnessScript?: Buffer;
};

export type SpendScriptP2tr = {
  controlBlock: Buffer;
  witnessScript: Buffer;
  leafVersion: number;
  leafHash: Buffer;
};

/**
 * Return scripts for p2sh-p2pk (used for BCH/BSV replay protection)
 * @param pubkey
 */
export function createOutputScriptP2shP2pk(pubkey: Buffer): SpendableScript {
  const p2pk = bitcoinjs.payments.p2pk({ pubkey });
  const p2sh = bitcoinjs.payments.p2sh({ redeem: p2pk });
  if (!p2sh.output || !p2pk.output) {
    throw new Error(`invalid state`);
  }
  return {
    scriptPubKey: p2sh.output,
    redeemScript: p2pk.output,
  };
}

/**
 * Return scripts for 2-of-3 multisig output
 * @param pubkeys - the key triple for multisig
 * @param scriptType
 * @param network - if set, performs sanity check for scriptType support
 * @returns {{redeemScript, witnessScript, scriptPubKey}}
 */
export function createOutputScript2of3(
  pubkeys: Buffer[],
  scriptType: ScriptType2Of3,
  network?: Network
): SpendableScript {
  if (network) {
    if (!isSupportedScriptType(network, scriptType)) {
      throw new Error(`unsupported script type ${scriptType} for network`);
    }
  }

  if (!isTriple(pubkeys)) {
    throw new Error(`must provide pubkey triple`);
  }

  pubkeys.forEach((key) => {
    if (key.length !== 33) {
      throw new Error(`Unexpected key length ${key.length}. Must use compressed keys.`);
    }
  });

  if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
    // p2tr/p2trMusig2 addresses use a combination of 2 of 2 multisig scripts distinct from
    // the 2 of 3 multisig used for other script types
    return createTaprootScript2of3(scriptType, pubkeys);
  }

  const script2of3 = bitcoinjs.payments.p2ms({ m: 2, pubkeys });
  assert(script2of3.output);

  let scriptPubKey: bitcoinjs.Payment;
  let redeemScript: bitcoinjs.Payment | undefined;
  let witnessScript: bitcoinjs.Payment | undefined;
  switch (scriptType) {
    case 'p2sh':
      redeemScript = script2of3;
      scriptPubKey = bitcoinjs.payments.p2sh({ redeem: script2of3 });
      break;
    case 'p2shP2wsh':
      witnessScript = script2of3;
      redeemScript = bitcoinjs.payments.p2wsh({ redeem: script2of3 });
      scriptPubKey = bitcoinjs.payments.p2sh({ redeem: redeemScript });
      break;
    case 'p2wsh':
      witnessScript = script2of3;
      scriptPubKey = bitcoinjs.payments.p2wsh({ redeem: witnessScript });
      break;
    default:
      throw new Error(`unknown multisig script type ${scriptType}`);
  }

  assert(scriptPubKey);
  assert(scriptPubKey.output);

  return {
    scriptPubKey: scriptPubKey.output,
    redeemScript: redeemScript?.output,
    witnessScript: witnessScript?.output,
  };
}

export function toXOnlyPublicKey(b: Buffer): Buffer {
  if (b.length === 33) {
    return b.slice(1);
  }
  if (b.length === 32) {
    return b;
  }
  throw new Error(`invalid key size ${b.length}`);
}

export function checkPlainPublicKey(b: Buffer): Buffer {
  if (b.length === 33) {
    return b;
  }
  throw new Error(`invalid key size ${b.length}. Must use plain keys.`);
}

function getTaptreeKeyCombinations(scriptType: 'p2tr' | 'p2trMusig2', keys: Triple<Buffer>): Tuple<Buffer>[] {
  const [userKey, backupKey, bitGoKey] = keys.map((k) => toXOnlyPublicKey(k));
  return scriptType === 'p2tr'
    ? [
        [userKey, bitGoKey],
        [userKey, backupKey],
        [backupKey, bitGoKey],
      ]
    : [
        [userKey, backupKey],
        [backupKey, bitGoKey],
      ];
}

function getKeyPathCombination(scriptType: 'p2tr' | 'p2trMusig2', keys: Triple<Buffer>): Tuple<Buffer> {
  const sanitizePublicKey = scriptType === 'p2tr' ? toXOnlyPublicKey : checkPlainPublicKey;
  return [sanitizePublicKey(keys[0]), sanitizePublicKey(keys[2])];
}

function getRedeemIndex(keyCombinations: [Buffer, Buffer][], signer: Buffer, cosigner: Buffer): number {
  signer = toXOnlyPublicKey(signer);
  cosigner = toXOnlyPublicKey(cosigner);
  const i = keyCombinations.findIndex(([a, b]) => {
    if (a.length !== signer.length || b.length !== cosigner.length) {
      throw new Error(`invalid comparison`);
    }
    return (a.equals(signer) && b.equals(cosigner)) || (a.equals(cosigner) && b.equals(signer));
  });
  if (0 <= i) {
    return i;
  }
  throw new Error(`could not find singer/cosigner combination`);
}

function createPaymentP2trCommon(
  scriptType: 'p2tr' | 'p2trMusig2',
  pubkeys: Triple<Buffer>,
  redeemIndex?: number | { signer: Buffer; cosigner: Buffer }
): bitcoinjs.Payment {
  const keyCombinations2of2 = getTaptreeKeyCombinations(scriptType, pubkeys);
  if (typeof redeemIndex === 'object') {
    redeemIndex = getRedeemIndex(keyCombinations2of2, redeemIndex.signer, redeemIndex.cosigner);
  }
  const redeems = keyCombinations2of2.map((pubkeys, index) =>
    p2trPayments.p2tr_ns(
      {
        pubkeys,
        depth: scriptType === 'p2trMusig2' || index === 0 ? 1 : 2,
      },
      { eccLib }
    )
  );

  return p2trPayments.p2tr(
    {
      pubkeys: getKeyPathCombination(scriptType, pubkeys),
      redeems,
      redeemIndex,
    },
    { eccLib }
  );
}

export function createPaymentP2tr(
  pubkeys: Triple<Buffer>,
  redeemIndex?: number | { signer: Buffer; cosigner: Buffer }
): bitcoinjs.Payment {
  return createPaymentP2trCommon('p2tr', pubkeys, redeemIndex);
}

function getLeafHashCommon(
  scriptType: 'p2tr' | 'p2trMusig2',
  params: bitcoinjs.Payment | { publicKeys: Triple<Buffer>; signer: Buffer; cosigner: Buffer }
): Buffer {
  if ('publicKeys' in params) {
    params = createPaymentP2trCommon(scriptType, params.publicKeys, params);
  }
  const { output, controlBlock, redeem } = params;
  if (!output || !controlBlock || !redeem || !redeem.output) {
    throw new Error(`invalid state`);
  }
  return taproot.getTapleafHash(eccLib, controlBlock, redeem.output);
}

export function getLeafHash(
  params: bitcoinjs.Payment | { publicKeys: Triple<Buffer>; signer: Buffer; cosigner: Buffer }
): Buffer {
  return getLeafHashCommon('p2tr', params);
}

function createSpendScriptP2trCommon(
  scriptType: 'p2tr' | 'p2trMusig2',
  pubkeys: Triple<Buffer>,
  keyCombination: Tuple<Buffer>
): SpendScriptP2tr {
  const keyCombinations = getTaptreeKeyCombinations(scriptType, pubkeys);
  const [a, b] = keyCombination.map((k) => toXOnlyPublicKey(k));
  const redeemIndex = keyCombinations.findIndex(
    ([c, d]) => (a.equals(c) && b.equals(d)) || (a.equals(d) && b.equals(c))
  );

  if (redeemIndex < 0) {
    throw new Error(`could not find redeemIndex for key combination`);
  }

  const payment = createPaymentP2trCommon(scriptType, pubkeys, redeemIndex);
  const { controlBlock } = payment;
  assert(Buffer.isBuffer(controlBlock));

  assert(payment.redeem);
  const leafScript = payment.redeem.output;
  assert(Buffer.isBuffer(leafScript));

  const parsedControlBlock = taproot.parseControlBlock(eccLib, controlBlock);
  const { leafVersion } = parsedControlBlock;
  const leafHash = taproot.getTapleafHash(eccLib, parsedControlBlock, leafScript);

  return {
    controlBlock,
    witnessScript: leafScript,
    leafVersion,
    leafHash,
  };
}

export function createSpendScriptP2tr(pubkeys: Triple<Buffer>, keyCombination: Tuple<Buffer>): SpendScriptP2tr {
  return createSpendScriptP2trCommon('p2tr', pubkeys, keyCombination);
}

/**
 * Creates and returns a taproot output script using the user+bitgo keys for the aggregate
 * public key using MuSig2 and a taptree containing either of the following depends on scriptType.
 * p2tr type: a user+bitgo 2-of-2 script at the first depth level of the tree and user+backup
 * and bitgo+backup 2-of-2 scripts one level deeper.
 * p2trMusig2 type: user+backup and bitgo+backup 2-of-2 scripts at the first depth level of the
 * tree.
 * @param pubkeys - a pubkey array containing the user key, backup key, and bitgo key in that order
 * @returns {{scriptPubKey}}
 */
function createTaprootScript2of3(scriptType: 'p2tr' | 'p2trMusig2', pubkeys: Triple<Buffer>): SpendableScript {
  const { output } = createPaymentP2trCommon(scriptType, pubkeys);
  assert(Buffer.isBuffer(output));
  return {
    scriptPubKey: output,
  };
}
