import { UtxoTransaction } from './UtxoTransaction';
import { taproot, HDSigner, Psbt, PsbtTransaction, Stack, Transaction } from '../';
import {
  PartialSig,
  PsbtInputUpdate,
  TapBip32Derivation,
  Transaction as ITransaction,
  TransactionFromBuffer,
} from 'bip174/src/lib/interfaces';
import { checkForInput } from 'bip174/src/lib/utils';
import { Psbt as PsbtBase } from 'bip174';
import { Network } from '..';
import { ecc as eccLib, script as bscript, payments } from '..';

export interface HDTaprootSigner extends HDSigner {
  /**
   * The path string must match /^m(\/\d+'?)+$/
   * ex. m/44'/0'/0'/1/23 levels with ' must be hard derivations
   */
  derivePath(path: string): HDTaprootSigner;
  /**
   * Input hash (the "message digest") for the signature algorithm
   * Return a 64 byte signature (32 byte r and 32 byte s in that order)
   */
  signSchnorr(hash: Buffer): Buffer;
}

export interface SchnorrSigner {
  publicKey: Buffer;
  signSchnorr(hash: Buffer): Buffer;
}

export interface TaprootSigner {
  leafHashes: Buffer[];
  signer: SchnorrSigner;
}

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

  /**
   * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
   */
  signAllInputsHD(
    hdKeyPair: HDTaprootSigner,
    sighashTypes: number[] = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL]
  ): this {
    if (!hdKeyPair || !hdKeyPair.publicKey || !hdKeyPair.fingerprint) {
      throw new Error('Need HDSigner to sign input');
    }

    const results: boolean[] = [];
    for (let i = 0; i < this.data.inputs.length; i++) {
      try {
        if (this.data.inputs[i].tapBip32Derivation?.length) {
          this.signTaprootInputHD(i, hdKeyPair, sighashTypes);
        } else {
          this.signInputHD(i, hdKeyPair, sighashTypes);
        }
        results.push(true);
      } catch (err) {
        results.push(false);
      }
    }
    if (results.every((v) => v === false)) {
      throw new Error('No inputs were signed');
    }
    return this;
  }

  /**
   * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts:signInputHD
   */
  signTaprootInputHD(
    inputIndex: number,
    hdKeyPair: HDTaprootSigner,
    sighashTypes: number[] = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL]
  ): this {
    if (!hdKeyPair || !hdKeyPair.publicKey || !hdKeyPair.fingerprint) {
      throw new Error('Need HDSigner to sign input');
    }
    const input = checkForInput(this.data.inputs, inputIndex);
    if (!input.tapBip32Derivation || input.tapBip32Derivation.length === 0) {
      throw new Error('Need tapBip32Derivation to sign Taproot with HD');
    }
    const myDerivations = input.tapBip32Derivation
      .map((bipDv) => {
        if (bipDv.masterFingerprint.equals(hdKeyPair.fingerprint)) {
          return bipDv;
        }
      })
      .filter((v) => !!v) as TapBip32Derivation[];
    if (myDerivations.length === 0) {
      throw new Error('Need one tapBip32Derivation masterFingerprint to match the HDSigner fingerprint');
    }
    const signers: TaprootSigner[] = myDerivations.map((bipDv) => {
      const node = hdKeyPair.derivePath(bipDv.path);
      if (!bipDv.pubkey.equals(node.publicKey.slice(1))) {
        throw new Error('pubkey did not match tapBip32Derivation');
      }
      return { signer: node, leafHashes: bipDv.leafHashes };
    });
    signers.forEach(({ signer, leafHashes }) => this.signTaprootInput(inputIndex, signer, leafHashes, sighashTypes));
    return this;
  }

  signTaprootInput(
    inputIndex: number,
    signer: SchnorrSigner,
    leafHashes: Buffer[],
    sighashTypes: number[] = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL]
  ): this {
    const input = checkForInput(this.data.inputs, inputIndex);
    // Figure out if this is script path or not, if not, tweak the private key
    if (!input.tapLeafScript?.length) {
      // See BitGo/BitGoJS/modules/utxo_lib/src/transaction_builder.ts:trySign for how to support it.
      throw new Error('Taproot key path signing is not supported.');
    }
    if (input.tapLeafScript.length !== 1) {
      throw new Error('Only one leaf script supported for signing');
    }
    const tapLeafScript = input.tapLeafScript[0];
    const parsedControlBlock = taproot.parseControlBlock(eccLib, tapLeafScript.controlBlock);
    const { leafVersion } = parsedControlBlock;
    if (leafVersion !== tapLeafScript.leafVersion) {
      throw new Error('Tap script leaf version mismatch with control block');
    }
    const leafHash = taproot.getTapleafHash(eccLib, parsedControlBlock, tapLeafScript.script);
    if (!leafHashes.find((l) => l.equals(leafHash))) {
      throw new Error(`Signer cannot sign for leaf hash ${leafHash.toString('hex')}`);
    }
    const { hash, sighashType } = this.getTaprootHashForSig(inputIndex, false, sighashTypes, leafHash);
    let signature = signer.signSchnorr(hash);
    if (sighashType !== Transaction.SIGHASH_DEFAULT) {
      signature = Buffer.concat([signature, Buffer.of(sighashType)]);
    }
    this.data.updateInput(inputIndex, {
      tapScriptSig: [
        {
          pubkey: signer.publicKey.slice(1),
          signature,
          leafHash,
        },
      ],
    });
    return this;
  }

  private getTaprootHashForSig(
    inputIndex: number,
    forValidate: boolean,
    sighashTypes?: number[],
    leafHash?: Buffer
  ): {
    hash: Buffer;
    sighashType: number;
  } {
    const unsignedTx = this.tx;
    const sighashType = this.data.inputs[inputIndex].sighashType || Transaction.SIGHASH_DEFAULT;
    if (sighashTypes && sighashTypes.indexOf(sighashType) < 0) {
      throw new Error(
        `Sighash type is not allowed. Retry the sign method passing the ` +
          `sighashTypes array of whitelisted types. Sighash type: ${sighashType}`
      );
    }
    const prevoutScripts: Buffer[] = [];
    const prevoutValues: bigint[] = [];

    for (const input of this.data.inputs) {
      let prevout;
      if (input.nonWitnessUtxo) {
        // TODO: This could be costly, either cache it here, or find a way to share with super
        const nonWitnessUtxoTx = (this.constructor as typeof UtxoPsbt).transactionFromBuffer(
          input.nonWitnessUtxo,
          unsignedTx.network
        );

        const prevoutHash = unsignedTx.ins[inputIndex].hash;
        const utxoHash = nonWitnessUtxoTx.getHash();

        // If a non-witness UTXO is provided, its hash must match the hash specified in the prevout
        if (!prevoutHash.equals(utxoHash)) {
          throw new Error(
            `Non-witness UTXO hash for input #${inputIndex} doesn't match the hash specified in the prevout`
          );
        }

        const prevoutIndex = unsignedTx.ins[inputIndex].index;
        prevout = nonWitnessUtxoTx.outs[prevoutIndex];
      } else if (input.witnessUtxo) {
        prevout = input.witnessUtxo;
      } else {
        throw new Error('Need a Utxo input item for signing');
      }
      prevoutScripts.push(prevout.script);
      prevoutValues.push(prevout.value);
    }
    const hash = unsignedTx.hashForWitnessV1(inputIndex, prevoutScripts, prevoutValues, sighashType, leafHash);
    return { hash, sighashType };
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
