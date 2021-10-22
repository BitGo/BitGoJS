import * as assert from 'assert';
import * as bitcoinjs from 'bitcoinjs-lib';
import { OP_CHECKSIG, OP_CHECKSIGVERIFY } from 'bitcoin-ops';
import { isTriple, Triple } from './types';

export const scriptTypes2Of3 = ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr'] as const;
export type ScriptType2Of3 = typeof scriptTypes2Of3[number];

export function isScriptType2Of3(t: string): t is ScriptType2Of3 {
  return scriptTypes2Of3.includes(t as ScriptType2Of3);
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
    default:
      throw new Error(`unsupported script type ${t}`);
  }
}

export type SpendableScript = {
  scriptPubKey: Buffer;
  redeemScript?: Buffer;
  witnessScript?: Buffer;
  /** A triple of control blocks for the user+bitgo, user+backup, and backup+bitgo scripts in that order. */
  controlBlocks?: [userBitGoScript: Buffer, userBackupScript: Buffer, backupBitGoScript: Buffer];
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
 * @returns {{redeemScript, witnessScript, scriptPubKey}}
 */
export function createOutputScript2of3(pubkeys: Buffer[], scriptType: ScriptType2Of3): SpendableScript {
  if (!isTriple(pubkeys)) {
    throw new Error(`must provide pubkey triple`);
  }

  pubkeys.forEach((key) => {
    if (key.length !== 33) {
      throw new Error(`Unexpected key length ${key.length}. Must use compressed keys.`);
    }
  });

  if (scriptType === 'p2tr') {
    // p2tr addresses use a combination of 2 of 2 multisig scripts distinct from
    // the 2 of 3 multisig used for other script types
    return createTaprootScript2of3(pubkeys);
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

/**
 * Creates and returns a taproot output script using the user and bitgo keys for the aggregate
 * public key and a taptree containing a user+bitgo 2-of-2 script at the first depth level of the
 * tree and user+backup and bitgo+backup 2-of-2 scripts one level deeper.
 * @param pubkeys - a pubkey array containing the user key, backup key, and bitgo key in that order
 * @returns {{scriptPubKey}}
 */
function createTaprootScript2of3([userKey, backupKey, bitGoKey]: Triple<Buffer>): SpendableScript {
  const userBitGoScript = bitcoinjs.script.compile([userKey, OP_CHECKSIGVERIFY, bitGoKey, OP_CHECKSIG]);
  const userBackupScript = bitcoinjs.script.compile([userKey, OP_CHECKSIGVERIFY, backupKey, OP_CHECKSIG]);
  const backupBitGoScript = bitcoinjs.script.compile([backupKey, OP_CHECKSIGVERIFY, bitGoKey, OP_CHECKSIG]);

  assert(userBitGoScript);
  assert(userBackupScript);
  assert(backupBitGoScript);

  const { output } = bitcoinjs.payments.p2tr({
    pubkeys: [userKey, bitGoKey],
    scripts: [userBitGoScript, userBackupScript, backupBitGoScript],
    weights: [2, 1, 1],
  });

  assert(output);

  // TODO: return control blocks once they are returned from payments.p2tr()
  return {
    scriptPubKey: output,
  };
}
