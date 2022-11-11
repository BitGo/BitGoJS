import { PartialSig, PsbtInputUpdate } from 'bip174/src/lib/interfaces';
import * as opcodes from 'bitcoin-ops';
import { Stack, ScriptSignature, TxOutput, ecc as eccLib, script as bscript, taproot, payments } from '../..';
import { UtxoTransaction } from '../UtxoTransaction';
import { isP2wpkh, isP2wsh, isTaproot } from './scriptTypes';

/**
 * @param hashFn
 * @param script
 * @param stack
 *
 * @return partial signatures for a 2of3 p2ms script
 */
function matchSignatures(hashFn: (hashType: number) => Buffer, script: Buffer, stack: Stack): PartialSig[] {
  const partialSig: PartialSig[] = [];
  const publicKeys = payments.p2ms({ output: script }).pubkeys;
  if (!publicKeys || publicKeys.length !== 3) {
    throw new Error('Invalid multisig script');
  }
  for (const sig of stack.slice(1)) {
    // Ignore extra empty element re MULTISIG bug
    if (!Buffer.isBuffer(sig) || sig.length === 0) continue;
    const { signature, hashType } = ScriptSignature.decode(sig);
    const hash = hashFn(hashType);
    let signatureMatched = false;
    for (const pubkey of publicKeys) {
      if (eccLib.verify(hash, pubkey, signature)) {
        signatureMatched = true;
        partialSig.push({ pubkey, signature: sig });
        break;
      }
    }
    if (!signatureMatched) {
      throw new Error('Invalid signature in partially signed transaction');
    }
  }
  return partialSig;
}

export function getInputUpdate(tx: UtxoTransaction<bigint>, vin: number, prevOut: TxOutput<bigint>): PsbtInputUpdate {
  const input = tx.ins[vin];
  const update: PsbtInputUpdate = {};
  let redeemScript;
  if (input.script && input.script.length) {
    const decompiledScriptSig = bscript.decompile(input.script);
    if (!decompiledScriptSig) {
      throw new Error('Invalid scriptSig, failed to decompile');
    }
    if ((!input.witness || !input.witness.length) && decompiledScriptSig.length === 2) {
      throw new Error();
    }
    redeemScript = decompiledScriptSig.pop();
    if (!Buffer.isBuffer(redeemScript)) {
      throw new Error('Invalid redeem script');
    }
    update.redeemScript = redeemScript;
    if (opcodes.OP_0 !== redeemScript[0] || ![22, 34].includes(redeemScript.length)) {
      // P2SH -> 2-of-3
      const hashFn = (hashType) => tx.hashForSignature(vin, redeemScript, hashType, prevOut.value);
      update.partialSig = matchSignatures(hashFn, redeemScript, decompiledScriptSig);
      return update;
    }
  }
  if (input.witness && input.witness.length) {
    const witness = input.witness;
    if (witness.length > 2 && witness[witness.length - 1][0] === 0x50) {
      throw new Error('Annex not supported');
    }
    if (witness.length === 1) {
      // Taproot key path
      update.tapKeySig = witness.pop();
      return update;
    }
    if (isTaproot(prevOut.script)) {
      // Taproot script path
      const controlBlock = witness.pop();
      const script = witness.pop();
      if (!controlBlock || !script) throw new Error('Unexpected witness structure');
      const leafVersion = controlBlock[0] & 0xfe;
      update.tapLeafScript = [{ controlBlock, script, leafVersion }];
      const publicKeys = payments.p2tr_ns({ output: script }, { eccLib }).pubkeys;
      if (!publicKeys || publicKeys.length !== 2) {
        throw new Error('expected 2 pubkeys');
      }
      if (witness.length !== 2) {
        throw new Error(`expected exactly 2 signatures, got ${witness.length}`);
      }
      update.tapScriptSig = [];
      let signature;
      while ((signature = witness.pop()) !== undefined) {
        if (signature.length === 0) {
          publicKeys.shift(); // No signature for this key
          continue;
        }
        const leafHash = taproot.getTapleafHash(eccLib, controlBlock, script);
        const pubkey = publicKeys.shift();
        if (!pubkey) throw new Error("Impossible, known 2-length things didn't match");
        update.tapScriptSig.push({ signature, pubkey, leafHash });
      }
    } else if (isP2wsh(prevOut.script, redeemScript)) {
      const witnessScript = witness.pop();
      if (!witnessScript) throw new Error('Invalid witness structure');
      update.witnessScript = witnessScript;
      const decompiledWitnessScript = bscript.decompile(witnessScript);
      if (!decompiledWitnessScript) {
        throw new Error('Invalid witnessScript, failed to decompile');
      }
      const hashFn = (hashType) => tx.hashForWitnessV0(vin, witnessScript, prevOut.value, hashType);
      update.partialSig = matchSignatures(hashFn, witnessScript, witness);
    } else if (isP2wpkh(prevOut.script, redeemScript)) {
      if (witness.length === 2) {
        const pubkey = witness.pop();
        const signature = witness.pop();
        if (!Buffer.isBuffer(pubkey) || !Buffer.isBuffer(signature)) {
          throw new Error('Invalid pubkey or signature');
        }
        update.partialSig = [{ pubkey, signature }];
      }
      return update;
    }
  }
  return update;
}

/**
 * Takes a partially signed transaction and removes the scripts and signatures.
 *
 * Inputs must be one of:
 *  * P2PKH
 *  * P2SH 2-of-3
 *  * P2WSH 2-of-3
 *  * P2WPKH
 *  * P2SH -> P2WSH 2-of-3
 *  * P2SH -> P2WPKH
 *  * P2TR script path 2-of-2
 *
 * @param tx the partially signed transaction
 * @param prevOuts
 *
 * @return the removed scripts and signatures, ready to be added to a PSBT
 */
export function unsign(tx: UtxoTransaction<bigint>, prevOuts: TxOutput<bigint>[]): PsbtInputUpdate[] {
  return tx.ins.map((input, vin) => {
    const update = getInputUpdate(tx, vin, prevOuts[vin]);
    input.witness = [];
    input.script = Buffer.alloc(0);
    return update;
  });
}
