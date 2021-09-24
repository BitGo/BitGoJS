import * as assert from 'assert';
import * as bitcoinjs from 'bitcoinjs-lib';

export const scriptTypes2Of3 = ['p2sh', 'p2shP2wsh', 'p2wsh'] as const;
export type ScriptType2Of3 = typeof scriptTypes2Of3[number];

export function isScriptType2Of3(t: string): t is ScriptType2Of3 {
  return scriptTypes2Of3.includes(t as ScriptType2Of3);
}

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
  if (pubkeys.length !== 3) {
    throw new Error(`must provide 3 pubkeys`);
  }
  pubkeys.forEach((key) => {
    if (key.length !== 33) {
      throw new Error(`Unexpected key length ${key.length}. Must use compressed keys.`);
    }
  });

  const script2of3 = bitcoinjs.payments.p2ms({ m: 2, pubkeys });
  assert(script2of3.output);

  let scriptPubKey;
  let redeemScript;
  let witnessScript;
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
