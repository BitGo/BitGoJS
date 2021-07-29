/**
 * @prettier
 */
import * as script from '../script';
import * as crypto from '../crypto';

export const scriptTypes2Of3 = ['p2sh', 'p2shP2wsh', 'p2wsh'] as const;
export type ScriptType2Of3 = typeof scriptTypes2Of3[number];

export type SpendableScript = {
  scriptPubKey: Buffer;
  redeemScript?: Buffer;
  witnessScript?: Buffer;
};

/**
 * Return scripts for 2-of-3 multisig output
 * @param pubkeys - the key array for multisig
 * @param scriptType
 * @returns {{redeemScript, witnessScript, address}}
 */
export function createOutputScript2of3(pubkeys: Buffer[], scriptType: ScriptType2Of3): SpendableScript {
  const script2of3 = script.multisig.output.encode(2, pubkeys);
  const p2wshOutputScript = script.witnessScriptHash.output.encode(crypto.sha256(script2of3));
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
    const redeemScriptHash = crypto.hash160(redeemScript);
    scriptPubKey = script.scriptHash.output.encode(redeemScriptHash);
  }

  return { redeemScript, witnessScript, scriptPubKey };
}
