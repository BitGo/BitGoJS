import { Psbt as PsbtBase } from 'bip174';
import { TapBip32Derivation, Transaction as ITransaction, TransactionFromBuffer } from 'bip174/src/lib/interfaces';
import { checkForInput } from 'bip174/src/lib/utils';
import { BufferWriter, varuint } from 'bitcoinjs-lib/src/bufferutils';

import { taproot, HDSigner, Psbt, PsbtTransaction, Transaction, TxOutput, Network, ecc as eccLib } from '..';
import { UtxoTransaction } from './UtxoTransaction';
import { getOutputIdForInput } from './Unspent';
import { isSegwit } from './psbt/scriptTypes';
import { unsign } from './psbt/fromHalfSigned';
import { parseTaprootScript2of3PubKeys, toXOnlyPublicKey } from './outputScripts';

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
  maximumFeeRate?: number; // [sat/byte]
}

// TODO: upstream does `checkInputsForPartialSigs` before doing things like
// `setVersion`. Our inputs could have tapscriptsigs (or in future tapkeysigs)
// and not fail that check. Do we want to do anything about that?
export class UtxoPsbt<Tx extends UtxoTransaction<bigint>> extends Psbt {
  protected static transactionFromBuffer(buffer: Buffer, network: Network): UtxoTransaction<bigint> {
    return UtxoTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data?: PsbtBase): UtxoPsbt<UtxoTransaction<bigint>> {
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

  getSignatureCount(inputIndex: number): number {
    const input = checkForInput(this.data.inputs, inputIndex);
    return Math.max(
      Array.isArray(input.partialSig) ? input.partialSig.length : 0,
      Array.isArray(input.tapScriptSig) ? input.tapScriptSig.length : 0
    );
  }

  getNonWitnessPreviousTxids(): string[] {
    const txInputs = this.txInputs; // These are somewhat costly to extract
    const txidSet = new Set<string>();
    this.data.inputs.forEach((input, index) => {
      if (!input.witnessUtxo) {
        throw new Error('Must have witness UTXO for all inputs');
      }
      if (!isSegwit(input.witnessUtxo.script, input.redeemScript)) {
        txidSet.add(getOutputIdForInput(txInputs[index]).txid);
      }
    });
    return [...txidSet];
  }

  addNonWitnessUtxos(txBufs: Record<string, Buffer>): this {
    const txInputs = this.txInputs; // These are somewhat costly to extract
    this.data.inputs.forEach((input, index) => {
      if (!input.witnessUtxo) {
        throw new Error('Must have witness UTXO for all inputs');
      }
      if (!isSegwit(input.witnessUtxo.script, input.redeemScript)) {
        const { txid } = getOutputIdForInput(txInputs[index]);
        if (txBufs[txid] === undefined) {
          throw new Error('Not all required previous transactions provided');
        }
        this.updateInput(index, { nonWitnessUtxo: txBufs[txid] });
      }
    });
    return this;
  }

  static fromTransaction(
    transaction: UtxoTransaction<bigint>,
    prevOutputs: TxOutput<bigint>[]
  ): UtxoPsbt<UtxoTransaction<bigint>> {
    if (prevOutputs.length !== transaction.ins.length) {
      throw new Error(
        `Transaction has ${transaction.ins.length} inputs, but ${prevOutputs.length} previous outputs provided`
      );
    }
    const clonedTransaction = transaction.clone();
    const updates = unsign(clonedTransaction, prevOutputs);

    const psbtBase = new PsbtBase(new PsbtTransaction({ tx: clonedTransaction }));
    clonedTransaction.ins.forEach(() => psbtBase.inputs.push({ unknownKeyVals: [] }));
    clonedTransaction.outs.forEach(() => psbtBase.outputs.push({ unknownKeyVals: [] }));
    const psbt = this.createPsbt({ network: transaction.network }, psbtBase);

    updates.forEach((update, index) => {
      psbt.updateInput(index, update);
      psbt.updateInput(index, { witnessUtxo: prevOutputs[index] });
    });

    return psbt;
  }

  getUnsignedTx(): UtxoTransaction<bigint> {
    return this.tx.clone();
  }

  protected static newTransaction(network: Network): UtxoTransaction<bigint> {
    return new UtxoTransaction<bigint>(network);
  }

  protected get tx(): Tx {
    return (this.data.globalMap.unsignedTx as PsbtTransaction).tx as Tx;
  }

  protected checkForSignatures(propName?: string): void {
    this.data.inputs.forEach((input) => {
      if (input.tapScriptSig?.length || input.tapKeySig || input.partialSig?.length) {
        throw new Error(`Cannot modify ${propName ?? 'transaction'} - signatures exist.`);
      }
    });
  }

  /**
   * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
   */
  finalizeAllInputs(): this {
    checkForInput(this.data.inputs, 0); // making sure we have at least one
    this.data.inputs.map((input, idx) => {
      return input.tapScriptSig?.length ? this.finalizeTaprootInput(idx) : this.finalizeInput(idx);
    });
    return this;
  }

  finalizeTaprootInput(inputIndex: number): this {
    const input = checkForInput(this.data.inputs, inputIndex);
    // witness = control-block script first-sig second-sig
    if (input.tapLeafScript?.length !== 1) {
      throw new Error('Only one leaf script supported for finalizing');
    }
    const { controlBlock, script } = input.tapLeafScript[0];
    const witness: Buffer[] = [script, controlBlock];
    const [pubkey1, pubkey2] = parseTaprootScript2of3PubKeys(script);
    for (const pk of [pubkey1, pubkey2]) {
      const sig = input.tapScriptSig?.find(({ pubkey }) => pubkey.equals(pk));
      if (!sig) {
        throw new Error('Could not find signatures in Script Sig.');
      }
      witness.unshift(sig.signature);
    }

    const witnessLength = witness.reduce((s, b) => s + b.length + varuint.encodingLength(b.length), 1);

    const bufferWriter = BufferWriter.withCapacity(witnessLength);
    bufferWriter.writeVector(witness);
    const finalScriptWitness = bufferWriter.end();

    this.data.updateInput(inputIndex, { finalScriptWitness });
    this.data.clearFinalizedInput(inputIndex);

    return this;
  }

  /**
   * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
   *
   * Unlike the function it overrides, this does not take a validator. In BitGo
   * context, we know how we want to validate so we just hard code the right
   * validator.
   */
  validateSignaturesOfAllInputs(): boolean {
    checkForInput(this.data.inputs, 0); // making sure we have at least one
    const results = this.data.inputs.map((input, idx) => {
      return input.tapScriptSig?.length
        ? this.validateTaprootSignaturesOfInput(idx)
        : this.validateSignaturesOfInput(idx, (p, m, s) => eccLib.verify(m, p, s));
    });
    return results.reduce((final, res) => res && final, true);
  }

  validateTaprootSignaturesOfInput(inputIndex: number, pubkey?: Buffer): boolean {
    const input = this.data.inputs[inputIndex];
    const tapSigs = (input || {}).tapScriptSig;
    if (!input || !tapSigs || tapSigs.length < 1) {
      throw new Error('No signatures to validate');
    }
    let mySigs;
    if (pubkey) {
      const xOnlyPubkey = toXOnlyPublicKey(pubkey);
      mySigs = tapSigs.filter((sig) => sig.pubkey.equals(xOnlyPubkey));
      if (mySigs.length < 1) {
        throw new Error('No signatures for this pubkey');
      }
    } else {
      mySigs = tapSigs;
    }
    const results: boolean[] = [];

    for (const pSig of mySigs) {
      const { signature, leafHash, pubkey } = pSig;
      let sigHashType: number;
      let sig: Buffer;
      if (signature.length === 65) {
        sigHashType = signature[64];
        sig = signature.slice(0, 64);
      } else {
        sigHashType = Transaction.SIGHASH_DEFAULT;
        sig = signature;
      }
      const { hash } = this.getTaprootHashForSig(inputIndex, true, [sigHashType], leafHash);
      results.push(eccLib.verifySchnorr(hash, pubkey, sig));
    }
    return results.every((res) => res === true);
  }

  /**
   * @param publicKeys
   * @return array of boolean values. True when corresponding index in `publicKeys` has signed the transaction.
   * If no signature in the tx or no public key matching signature, the validation is considered as false.
   */
  getSignatureValidationArray(inputIndex: number, publicKeys: Buffer[]): boolean[] {
    const noSigErrorMessages = ['No signatures to validate', 'No signatures for this pubkey'];
    const input = checkForInput(this.data.inputs, inputIndex);
    const isP2tr = input.tapScriptSig?.length;
    return publicKeys.map((publicKey) => {
      try {
        return isP2tr
          ? this.validateTaprootSignaturesOfInput(inputIndex, publicKey)
          : this.validateSignaturesOfInput(inputIndex, (p, m, s) => eccLib.verify(m, p, s), publicKey);
      } catch (err) {
        // Not an elegant solution. Might need upstream changes like custom error types.
        if (noSigErrorMessages.includes(err.message)) {
          return false;
        }
        throw err;
      }
    });
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
    const pubkey = toXOnlyPublicKey(signer.publicKey);
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
          pubkey,
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
    const sighashType = this.data.inputs[inputIndex].sighashType || Transaction.SIGHASH_DEFAULT;
    if (sighashTypes && sighashTypes.indexOf(sighashType) < 0) {
      throw new Error(
        `Sighash type is not allowed. Retry the sign method passing the ` +
          `sighashTypes array of whitelisted types. Sighash type: ${sighashType}`
      );
    }
    const txInputs = this.txInputs; // These are somewhat costly to extract
    const prevoutScripts: Buffer[] = [];
    const prevoutValues: bigint[] = [];

    this.data.inputs.forEach((input, i) => {
      let prevout;
      if (input.nonWitnessUtxo) {
        // TODO: This could be costly, either cache it here, or find a way to share with super
        const nonWitnessUtxoTx = (this.constructor as typeof UtxoPsbt).transactionFromBuffer(
          input.nonWitnessUtxo,
          this.tx.network
        );

        const prevoutHash = txInputs[i].hash;
        const utxoHash = nonWitnessUtxoTx.getHash();

        // If a non-witness UTXO is provided, its hash must match the hash specified in the prevout
        if (!prevoutHash.equals(utxoHash)) {
          throw new Error(`Non-witness UTXO hash for input #${i} doesn't match the hash specified in the prevout`);
        }

        const prevoutIndex = txInputs[i].index;
        prevout = nonWitnessUtxoTx.outs[prevoutIndex];
      } else if (input.witnessUtxo) {
        prevout = input.witnessUtxo;
      } else {
        throw new Error('Need a Utxo input item for signing');
      }
      prevoutScripts.push(prevout.script);
      prevoutValues.push(prevout.value);
    });
    const hash = this.tx.hashForWitnessV1(inputIndex, prevoutScripts, prevoutValues, sighashType, leafHash);
    return { hash, sighashType };
  }
}
