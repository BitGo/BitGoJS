import { UtxoTransaction } from './UtxoTransaction';
import { taproot, Psbt, PsbtTransaction, Stack, Transaction } from '../';
import {
  PartialSig,
  PsbtInputUpdate,
  Transaction as ITransaction,
  TransactionFromBuffer,
} from 'bip174/src/lib/interfaces';
import { Psbt as PsbtBase } from 'bip174';
import { Network } from '..';
import { ecc as eccLib, script as bscript, payments } from '..';

export interface PsbtOpts {
  network: Network;
}

export class UtxoPsbt<Tx extends UtxoTransaction<bigint>> extends Psbt {
  protected static transactionFromBuffer(buffer: Buffer, network: Network): UtxoTransaction<bigint> {
    return UtxoTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data: PsbtBase): UtxoPsbt<UtxoTransaction<bigint>> {
    return new UtxoPsbt<UtxoTransaction<bigint>>(
      opts,
      data || new PsbtBase(new PsbtTransaction({ tx: new UtxoTransaction<bigint>(opts.network) }))
    );
  }

  static fromBuffer(buffer: Buffer, opts: PsbtOpts): UtxoPsbt<UtxoTransaction<bigint>> {
    const transactionFromBuffer: TransactionFromBuffer = (buffer: Buffer): ITransaction => {
      const tx = this.transactionFromBuffer(buffer, opts.network);
      return new PsbtTransaction({ tx });
    };
    const psbtBase = PsbtBase.fromBuffer(buffer, transactionFromBuffer);
    const psbt = this.createPsbt(opts, psbtBase);
    // Upstream checks for duplicate inputs here, but it seems to be of dubious value.
    return psbt;
  }

  protected static newTransaction(network: Network): UtxoTransaction<bigint> {
    return new UtxoTransaction<bigint>(network);
  }

  get tx(): Tx {
    return (this.data.globalMap.unsignedTx as PsbtTransaction).tx as Tx;
  }
}

/**
 * Takes a partially signed transaction and removes the scripts and signatures.
 *
 * Inputs must be one of:
 *  * P2PKH
 *  * P2SH 2-of-3
 *  * P2WSH 2-of-3
 *  * P2SH -> P2WSH 2-of-3
 *  * P2TR script path 2-of-2
 *
 * @param tx the partially signed transaction
 *
 * @return the removed scripts and signatures, ready to be added to a PSBT
 */
export function unsign(tx: Transaction<bigint>, inputValues: bigint[]): PsbtInputUpdate[] {
  const ret: PsbtInputUpdate[] = [];
  for (let vin = 0; vin < tx.ins.length; vin++) {
    const input = tx.ins[vin];
    const inputValue = inputValues[vin];
    const update: PsbtInputUpdate = {};
    if (input.witness && input.witness.length) {
      const witness = [...input.witness];
      if (witness.length > 2 && witness[witness.length - 1][0] === 0x50) {
        throw new Error('Annex not supported');
      }
      if (witness.length === 1) {
        // Taproot key path
        update.tapKeySig = witness.pop();
        continue;
      }
      if (taproot.VALID_LEAF_VERSIONS.has(witness[witness.length - 1][0] & 0xfe)) {
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
      } else {
        // P2WSH or P2SH->P2WSH
        const witnessScript = witness.pop();
        if (!witnessScript) throw new Error('Invalid witness structure');
        update.witnessScript = witnessScript;
        const signatures = witness.slice(1); // Skip the extra OP_0 required by OP_CHECKMULTISIG
        const hashFn = (hashType) => tx.hashForWitnessV0(vin, witnessScript, inputValue, hashType);
        update.partialSig = matchSignatures(hashFn, witnessScript, signatures);
      }
    }
    if (input.script && input.script.length) {
      const decompiledScriptSig = bscript.decompile(input.script);
      if (!decompiledScriptSig) {
        throw new Error('Invalid scriptSig, failed to decompile');
      }
      if (!update.witnessScript && decompiledScriptSig.length === 2) {
        // P2PKH
        const pubkey = decompiledScriptSig.pop();
        const signature = decompiledScriptSig.pop();
        if (!Buffer.isBuffer(pubkey) || !Buffer.isBuffer(signature)) {
          throw new Error('Invalid pubkey or signature');
        }
        update.partialSig = [{ pubkey, signature }];
        continue;
      }
      const redeemScript = decompiledScriptSig.pop();
      if (!Buffer.isBuffer(redeemScript)) {
        throw new Error('Invalid redeem script');
      }
      update.redeemScript = redeemScript;
      if (update.witnessScript) {
        // P2SH->P2WSH
        if (decompiledScriptSig.length !== 0) {
          throw new Error('Extra elements in scriptSig, expected only redeem');
        }
      } else {
        // P2SH
        const hashFn = (hashType) => tx.hashForSignature(vin, redeemScript, hashType);
        const signatures = decompiledScriptSig.slice(1); // Skip the extra OP_0 required by OP_CHECKMULTISIG
        update.partialSig = matchSignatures(hashFn, redeemScript, signatures);
      }
    }
  }
  tx.ins.forEach((input) => {
    input.witness = [];
    input.script = Buffer.alloc(0);
  });
  return ret;
}

function matchSignatures(hashFn: (hashType: number) => Buffer, script: Buffer, signatures: Stack): PartialSig[] {
  const partialSig: PartialSig[] = [];
  const publicKeys = payments.p2ms({ output: script }).pubkeys;
  if (!publicKeys || publicKeys.length) {
    throw new Error('Invalid multisig script');
  }
  for (const signature of signatures) {
    if (!Buffer.isBuffer(signature) || signature.length === 0) continue;
    const hash = hashFn(signature[signature.length - 1]);
    let signatureMatched = false;
    for (const pubkey of publicKeys) {
      if (!eccLib.verify(hash, pubkey, signature)) continue;
      signatureMatched = true;
      partialSig.push({ pubkey, signature });
    }
    if (!signatureMatched) {
      throw new Error('Invalid signature in partially signed transaction');
    }
  }
  return partialSig;
}
