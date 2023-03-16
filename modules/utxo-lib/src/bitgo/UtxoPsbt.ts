import { Psbt as PsbtBase } from 'bip174';
import { TapBip32Derivation, Transaction as ITransaction, TransactionFromBuffer } from 'bip174/src/lib/interfaces';
import { checkForInput } from 'bip174/src/lib/utils';
import { BufferWriter, varuint } from 'bitcoinjs-lib/src/bufferutils';

import {
  taproot,
  HDSigner,
  Psbt,
  PsbtTransaction,
  Transaction,
  TxOutput,
  Network,
  ecc as eccLib,
  p2trPayments,
} from '..';
import { UtxoTransaction } from './UtxoTransaction';
import { getOutputIdForInput } from './Unspent';
import { isSegwit } from './psbt/scriptTypes';
import { unsign } from './psbt/fromHalfSigned';
import { checkPlainPublicKey, checkXOnlyPublicKey, toXOnlyPublicKey } from './outputScripts';
import { parsePubScript } from './parseInput';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as bs58check from 'bs58check';
import { decodeProprietaryKey, encodeProprietaryKey, ProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import {
  createAggregateNonce,
  createMusig2Nonce,
  createMusig2SigningSession,
  createTapTweak,
  encodePsbtMusig2PartialSigKeyKeyValData,
  encodePsbtMusig2PubNonceKeyValData,
  musig2PartialSign,
  parsePsbtMusig2NoncesKeyValData,
  parsePsbtMusig2ParticipantsKeyValData,
  PsbtMusig2ParticipantsKeyValueData,
  validatePsbtMusig2NoncesKeyValData,
  validatePsbtMusig2ParticipantsKeyValData,
} from './Musig2';
import { isTuple, Tuple } from './types';

export const PSBT_PROPRIETARY_IDENTIFIER = 'BITGO';

export enum ProprietaryKeySubtype {
  ZEC_CONSENSUS_BRANCH_ID = 0x00,
  MUSIG2_PARTICIPANT_PUB_KEYS = 0x01,
  MUSIG2_PUB_NONCE = 0x02,
  MUSIG2_PARTIAL_SIG = 0x03,
}

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

/**
 * HD signer object for taproot p2tr musig2 key path sign
 */
export interface HDTaprootMusig2Signer extends HDSigner {
  /**
   * Musig2 requires signer's 32-bytes private key to be passed to it.
   */
  privateKey: Buffer;

  /**
   * The path string must match /^m(\/\d+'?)+$/
   * ex. m/44'/0'/0'/1/23 levels with ' must be hard derivations
   */
  derivePath(path: string): HDTaprootMusig2Signer;
}

export interface SchnorrSigner {
  publicKey: Buffer;
  signSchnorr(hash: Buffer): Buffer;
}

export interface Musig2Signer {
  publicKey: Buffer;
  privateKey: Buffer;
}

export interface TaprootSigner {
  leafHashes: Buffer[];
  signer: SchnorrSigner;
}

export interface PsbtOpts {
  network: Network;
  maximumFeeRate?: number; // [sat/byte]
  bip32PathsAbsolute?: boolean;
}

/**
 * Psbt proprietary keydata object.
 * <compact size uint identifier length> <bytes identifier> <compact size uint subtype> <bytes subkeydata>
 * => <bytes valuedata>
 */
export interface ProprietaryKeyValueData {
  key: ProprietaryKey;
  value: Buffer;
}

/**
 * Psbt proprietary keydata object search fields.
 * <compact size uint identifier length> <bytes identifier> <compact size uint subtype> <bytes subkeydata>
 */
export interface ProprietaryKeySearch {
  identifier: string;
  subtype: number;
  keydata?: Buffer;
  identifierEncoding?: BufferEncoding;
}

// TODO: upstream does `checkInputsForPartialSigs` before doing things like
// `setVersion`. Our inputs could have tapscriptsigs (or in future tapkeysigs)
// and not fail that check. Do we want to do anything about that?
export class UtxoPsbt<Tx extends UtxoTransaction<bigint> = UtxoTransaction<bigint>> extends Psbt {
  // musig-js uses WeakMap internally for secure nonce caching.
  // So, the caller requires to use the original pubNonce object for reference.
  // The scope of the values of the map should be assured to be within the psbt object to avoid misuse of nonce.
  private MUSIG2_PUB_NONCE_CACHE = new Map<string, Uint8Array>();

  protected static transactionFromBuffer(buffer: Buffer, network: Network): UtxoTransaction<bigint> {
    return UtxoTransaction.fromBuffer<bigint>(buffer, false, 'bigint', network);
  }

  static createPsbt(opts: PsbtOpts, data?: PsbtBase): UtxoPsbt {
    return new UtxoPsbt(
      opts,
      data || new PsbtBase(new PsbtTransaction({ tx: new UtxoTransaction<bigint>(opts.network) }))
    );
  }

  static fromBuffer(buffer: Buffer, opts: PsbtOpts): UtxoPsbt {
    const transactionFromBuffer: TransactionFromBuffer = (buffer: Buffer): ITransaction => {
      const tx = this.transactionFromBuffer(buffer, opts.network);
      return new PsbtTransaction({ tx });
    };
    const psbtBase = PsbtBase.fromBuffer(buffer, transactionFromBuffer, {
      bip32PathsAbsolute: opts.bip32PathsAbsolute,
    });
    const psbt = this.createPsbt(opts, psbtBase);
    // Upstream checks for duplicate inputs here, but it seems to be of dubious value.
    return psbt;
  }

  static fromHex(data: string, opts: PsbtOpts): UtxoPsbt {
    return this.fromBuffer(Buffer.from(data, 'hex'), opts);
  }

  get network(): Network {
    return this.tx.network;
  }

  toHex(): string {
    return this.toBuffer().toString('hex');
  }

  private createMusig2PubNonceCacheKey(participantPubKey: Buffer, tapOutputKey: Buffer) {
    return Buffer.concat([checkPlainPublicKey(participantPubKey), checkXOnlyPublicKey(tapOutputKey)]).toString('hex');
  }

  private getOriginalMusig2PubNonce(participantPubKey: Buffer, tapOutputKey: Buffer): Uint8Array | undefined {
    return this.MUSIG2_PUB_NONCE_CACHE.get(this.createMusig2PubNonceCacheKey(participantPubKey, tapOutputKey));
  }
  private setOriginalMusig2PubNonce(participantPubKey: Buffer, tapOutputKey: Buffer, pubNonce: Uint8Array): void {
    this.MUSIG2_PUB_NONCE_CACHE.set(this.createMusig2PubNonceCacheKey(participantPubKey, tapOutputKey), pubNonce);
  }
  private deleteOriginalMusig2PubNonce(participantPubKey: Buffer, tapOutputKey: Buffer): void {
    this.MUSIG2_PUB_NONCE_CACHE.delete(this.createMusig2PubNonceCacheKey(participantPubKey, tapOutputKey));
  }

  /**
   * @return true iff PSBT input is finalized
   */
  isInputFinalized(inputIndex: number): boolean {
    const input = checkForInput(this.data.inputs, inputIndex);
    return Buffer.isBuffer(input.finalScriptSig) || Buffer.isBuffer(input.finalScriptWitness);
  }

  /**
   * @return partialSig/tapScriptSig count iff input is not finalized
   */
  getSignatureCount(inputIndex: number): number {
    if (this.isInputFinalized(inputIndex)) {
      throw new Error('Input is already finalized');
    }
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

  static fromTransaction(transaction: UtxoTransaction<bigint>, prevOutputs: TxOutput<bigint>[]): UtxoPsbt {
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
      psbt.updateInput(index, { witnessUtxo: { script: prevOutputs[index].script, value: prevOutputs[index].value } });
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
    const [pubkey1, pubkey2] = parsePubScript(script, 'p2tr').publicKeys;
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

  finalizeTapInputWithSingleLeafScriptAndSignature(inputIndex: number): this {
    const input = checkForInput(this.data.inputs, inputIndex);
    if (input.tapLeafScript?.length !== 1) {
      throw new Error('Only one leaf script supported for finalizing');
    }
    if (input.tapScriptSig?.length !== 1) {
      throw new Error('Could not find signatures in Script Sig.');
    }

    const { controlBlock, script } = input.tapLeafScript[0];
    const witness: Buffer[] = [input.tapScriptSig[0].signature, script, controlBlock];
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
      const { hash } = this.getTaprootHashForSig(inputIndex, [sigHashType], leafHash);
      results.push(eccLib.verifySchnorr(hash, pubkey, sig));
    }
    return results.every((res) => res === true);
  }

  /**
   * @return array of boolean values. True when corresponding index in `publicKeys` has signed the transaction.
   * If no signature in the tx or no public key matching signature, the validation is considered as false.
   */
  getSignatureValidationArray(inputIndex: number): boolean[] {
    const noSigErrorMessages = ['No signatures to validate', 'No signatures for this pubkey'];
    const input = checkForInput(this.data.inputs, inputIndex);
    const isP2tr = input.tapScriptSig?.length;
    if (!this.data.globalMap.globalXpub) {
      throw new Error('Cannot get signature validation array without global xpubs');
    }
    if (this.data.globalMap.globalXpub.length !== 3) {
      throw new Error(`There must be 3 global xpubs and there are ${this.data.globalMap.globalXpub.length}`);
    }
    return this.data.globalMap.globalXpub.map((xpub) => {
      // const bip32 = ECPair.fromPublicKey(xpub.extendedPubkey, { network: (this as any).opts.network });
      const bip32 = BIP32Factory(eccLib).fromBase58(bs58check.encode(xpub.extendedPubkey));
      try {
        return isP2tr
          ? this.validateTaprootSignaturesOfInput(inputIndex, bip32.publicKey)
          : this.validateSignaturesOfInput(inputIndex, (p, m, s) => eccLib.verify(m, p, s), bip32.publicKey);
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
    hdKeyPair: HDTaprootSigner | HDTaprootMusig2Signer,
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
    hdKeyPair: HDTaprootSigner | HDTaprootMusig2Signer,
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

    function getDerivedNode(bipDv: TapBip32Derivation): HDTaprootMusig2Signer | HDTaprootSigner {
      const node = hdKeyPair.derivePath(bipDv.path);
      if (!bipDv.pubkey.equals(node.publicKey.slice(1))) {
        throw new Error('pubkey did not match tapBip32Derivation');
      }
      return node;
    }

    if (input.tapLeafScript?.length) {
      const signers: TaprootSigner[] = myDerivations.map((bipDv) => {
        const signer = getDerivedNode(bipDv);
        if (!('signSchnorr' in signer)) {
          throw new Error('signSchnorr function is required to sign p2tr');
        }
        return { signer, leafHashes: bipDv.leafHashes };
      });
      signers.forEach(({ signer, leafHashes }) => this.signTaprootInput(inputIndex, signer, leafHashes, sighashTypes));
    } else if (input.tapInternalKey?.length) {
      const signers: Musig2Signer[] = myDerivations.map((bipDv) => {
        const signer = getDerivedNode(bipDv);
        if (!('privateKey' in signer) || !signer.privateKey) {
          throw new Error('privateKey is required to sign p2tr musig2');
        }
        return signer;
      });
      signers.forEach((signer) => this.signTaprootMusig2Input(inputIndex, signer, sighashTypes));
    }
    return this;
  }

  private getMusig2ParticipantsKeyValData(inputIndex: number, tapInternalKey: Buffer, tapMerkleRoot: Buffer) {
    const participantsKeyValData = parsePsbtMusig2ParticipantsKeyValData(this, inputIndex);
    if (!participantsKeyValData) {
      throw new Error(`Found 0 matching participant key value instead of 1`);
    }
    validatePsbtMusig2ParticipantsKeyValData(participantsKeyValData, tapInternalKey, tapMerkleRoot);
    return participantsKeyValData;
  }

  private getMusig2NoncesKeyValData(inputIndex: number, participantsKeyValData: PsbtMusig2ParticipantsKeyValueData) {
    const noncesKeyValsData = parsePsbtMusig2NoncesKeyValData(this, inputIndex);
    if (!noncesKeyValsData || !isTuple(noncesKeyValsData)) {
      throw new Error(
        `Found ${noncesKeyValsData?.length ? noncesKeyValsData.length : 0} matching nonce key value instead of 2`
      );
    }
    validatePsbtMusig2NoncesKeyValData(noncesKeyValsData, participantsKeyValData);
    return noncesKeyValsData;
  }

  /**
   * Signs p2tr musig2 key path input with 2 aggregated keys.
   * @param inputIndex
   * @param signer - XY public key and private key are required
   * @param sighashTypes
   */
  signTaprootMusig2Input(
    inputIndex: number,
    signer: Musig2Signer,
    sighashTypes: number[] = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL]
  ): this {
    const input = checkForInput(this.data.inputs, inputIndex);

    if (!input.tapInternalKey) {
      throw new Error('tapInternalKey is required for p2tr musig2 key path signing');
    }
    if (!input.tapMerkleRoot) {
      throw new Error('tapMerkleRoot is required for p2tr musig2 key path signing');
    }

    const participantsKeyValData = this.getMusig2ParticipantsKeyValData(
      inputIndex,
      input.tapInternalKey,
      input.tapMerkleRoot
    );
    const { tapOutputKey, participantPubKeys } = participantsKeyValData;
    const participantPubKey = participantPubKeys.find((pubKey) => pubKey.equals(signer.publicKey));
    if (!participantPubKey) {
      throw new Error('participant plain pub key should match one signer pub key');
    }

    const noncesKeyValsData = this.getMusig2NoncesKeyValData(inputIndex, participantsKeyValData);
    const pubNonces: Tuple<Buffer> = [noncesKeyValsData[0].pubNonce, noncesKeyValsData[1].pubNonce];
    const aggNonce = createAggregateNonce(pubNonces);
    const tweak = createTapTweak(input.tapInternalKey, input.tapMerkleRoot);
    const { hash, sighashType } = this.getTaprootHashForSig(inputIndex, sighashTypes);
    const sessionKey = createMusig2SigningSession(aggNonce, hash, participantPubKeys, tweak);

    const nonceKeyValData = noncesKeyValsData.find((kv) => kv.participantPubKey.equals(participantPubKey));
    if (!nonceKeyValData) {
      throw new Error('pubNonce is missing. retry signing process');
    }
    const originalPubNonce = this.getOriginalMusig2PubNonce(
      nonceKeyValData.participantPubKey,
      nonceKeyValData.tapOutputKey
    );
    if (!originalPubNonce) {
      throw new Error('original pubNonce object is missing. retry signing process');
    }

    let partialSig = musig2PartialSign(signer.privateKey, originalPubNonce, sessionKey);
    this.deleteOriginalMusig2PubNonce(nonceKeyValData.participantPubKey, nonceKeyValData.tapOutputKey);
    if (sighashType !== Transaction.SIGHASH_DEFAULT) {
      partialSig = Buffer.concat([partialSig, Buffer.of(sighashType)]);
    }

    const partialSigKeyValData = encodePsbtMusig2PartialSigKeyKeyValData({
      participantPubKey,
      tapOutputKey,
      partialSig,
    });
    this.addProprietaryKeyValToInput(inputIndex, partialSigKeyValData);
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
      throw new Error('tapLeafScript is required for p2tr script path');
    }
    const pubkey = toXOnlyPublicKey(signer.publicKey);
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
    const { hash, sighashType } = this.getTaprootHashForSig(inputIndex, sighashTypes, leafHash);
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

  /**
   * @retuns true iff the input is taproot.
   */
  isTaprootInput(inputIndex: number): boolean {
    const input = checkForInput(this.data.inputs, inputIndex);
    function isP2tr(output: Buffer): boolean {
      try {
        p2trPayments.p2tr({ output }, { eccLib });
        return true;
      } catch (err) {
        return false;
      }
    }
    return !!(
      input.tapInternalKey ||
      input.tapMerkleRoot ||
      (input.tapLeafScript && input.tapLeafScript.length) ||
      (input.tapBip32Derivation && input.tapBip32Derivation.length) ||
      (input.witnessUtxo && isP2tr(input.witnessUtxo.script))
    );
  }

  /**
   * @returns hash and hashType for taproot input at inputIndex
   * @throws error if input at inputIndex is not a taproot input
   */
  getTaprootHashForSigChecked(
    inputIndex: number,
    sighashTypes: number[] = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL],
    leafHash?: Buffer
  ): {
    hash: Buffer;
    sighashType: number;
  } {
    if (!this.isTaprootInput(inputIndex)) {
      throw new Error(`${inputIndex} input is not a taproot type to take taproot tx hash`);
    }
    return this.getTaprootHashForSig(inputIndex, sighashTypes, leafHash);
  }

  /**
   * Adds proprietary key value pair to PSBT input.
   * Default identifierEncoding is utf-8 for identifier.
   */
  addProprietaryKeyValToInput(inputIndex: number, keyValueData: ProprietaryKeyValueData): this {
    return this.addUnknownKeyValToInput(inputIndex, {
      key: encodeProprietaryKey(keyValueData.key),
      value: keyValueData.value,
    });
  }

  /**
   * Adds or updates (if exists) proprietary key value pair to PSBT input.
   * Default identifierEncoding is utf-8 for identifier.
   */
  addOrUpdateProprietaryKeyValToInput(inputIndex: number, keyValueData: ProprietaryKeyValueData): this {
    const input = checkForInput(this.data.inputs, inputIndex);
    const key = encodeProprietaryKey(keyValueData.key);
    const { value } = keyValueData;
    if (input.unknownKeyVals?.length) {
      const ukvIndex = input.unknownKeyVals.findIndex((ukv) => ukv.key.equals(key));
      if (ukvIndex > -1) {
        input.unknownKeyVals[ukvIndex] = { key, value };
        return this;
      }
    }
    this.addUnknownKeyValToInput(inputIndex, {
      key,
      value,
    });
    return this;
  }

  /**
   * To search any data from proprietary key value againts keydata.
   * Default identifierEncoding is utf-8 for identifier.
   */
  getProprietaryKeyVals(inputIndex: number, keySearch?: ProprietaryKeySearch): ProprietaryKeyValueData[] {
    const input = checkForInput(this.data.inputs, inputIndex);
    if (!input.unknownKeyVals || input.unknownKeyVals.length === 0) {
      return [];
    }
    const keyVals = input.unknownKeyVals.map(({ key, value }, i) => {
      return { key: decodeProprietaryKey(key), value };
    });
    return keyVals.filter((keyVal) => {
      return (
        keySearch === undefined ||
        (keySearch.identifier === keyVal.key.identifier &&
          keySearch.subtype === keyVal.key.subtype &&
          (!Buffer.isBuffer(keySearch.keydata) || keySearch.keydata.equals(keyVal.key.keydata)))
      );
    });
  }

  private deriveWalletKey(tapBip32Derivations: TapBip32Derivation[], rootWalletKey: BIP32Interface): BIP32Interface {
    const myDerivations = tapBip32Derivations.filter((bipDv) => {
      return bipDv.masterFingerprint.equals(rootWalletKey.fingerprint);
    });

    if (!myDerivations.length) {
      throw new Error('Need one tapBip32Derivation masterFingerprint to match the rootWalletKey fingerprint');
    }

    const myDerivation = myDerivations.filter((bipDv) => {
      const node = rootWalletKey.derivePath(bipDv.path);
      if (!bipDv.pubkey.equals(toXOnlyPublicKey(node.publicKey))) {
        throw new Error('pubkey did not match tapBip32Derivation');
      }
      return node;
    });

    if (myDerivation.length !== 1) {
      throw new Error('root wallet key should derive one tapBip32Derivation');
    }
    return rootWalletKey.derivePath(myDerivation[0].path);
  }

  private getMusig2Nonce(
    inputIndex: number,
    rootWalletKey: BIP32Interface,
    sessionId?: Buffer
  ): { tapOutputKey: Buffer; participantPubKey: Buffer; pubNonce: Uint8Array } | undefined {
    const input = this.data.inputs[inputIndex];
    if (!input.tapInternalKey) {
      return;
    }
    if (!input.tapMerkleRoot) {
      throw new Error('tapMerkleRoot is required to create nonce');
    }
    if (!input.tapBip32Derivation?.length) {
      throw new Error('tapBip32Derivation is required to create nonce');
    }
    const derivedWalletKey = this.deriveWalletKey(input.tapBip32Derivation, rootWalletKey);
    if (!derivedWalletKey.privateKey) {
      throw new Error('privateKey is required to create nonce');
    }
    const participantsKeyValData = parsePsbtMusig2ParticipantsKeyValData(this, inputIndex);
    if (!participantsKeyValData) {
      throw new Error(`Found 0 matching participant key value instead of 1`);
    }
    validatePsbtMusig2ParticipantsKeyValData(participantsKeyValData, input.tapInternalKey, input.tapMerkleRoot);
    const { tapOutputKey, participantPubKeys } = participantsKeyValData;
    const participantPubKey = participantPubKeys.find((pubKey) => pubKey.equals(derivedWalletKey.publicKey));

    if (!Buffer.isBuffer(participantPubKey)) {
      throw new Error('participant plain pub key should match one tapBip32Derivation plain pub key');
    }

    const { hash } = this.getTaprootHashForSigChecked(inputIndex);
    const pubNonce = createMusig2Nonce(derivedWalletKey.privateKey, participantPubKey, tapOutputKey, hash, sessionId);

    return { tapOutputKey, participantPubKey, pubNonce };
  }

  /**
   * Generates and sets Musig2 nonces to p2trMusig2 key path spending inputs.
   * tapInternalkey, tapMerkleRoot, tapBip32Derivation for rootWalletKey are required per p2trMusig2 key path input.
   * Also participant keys are required from psbt proprietary key values.
   * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
   * @param psbt
   * @param rootWalletKey
   * @param sessionId If provided it must either be a counter unique to this secret key,
   * (converted to an array of 32 bytes), or 32 uniformly random bytes.
   */
  setMusig2Nonces(rootWalletKey: BIP32Interface, sessionId?: Buffer): void {
    if (rootWalletKey.isNeutered()) {
      throw new Error('private key is required to generate nonce');
    }
    if (Buffer.isBuffer(sessionId) && sessionId.length !== 32) {
      throw new Error(`Invalid sessionId size ${sessionId.length}`);
    }
    this.data.inputs.forEach((input, inputIndex) => {
      const nonce = this.getMusig2Nonce(inputIndex, rootWalletKey, sessionId);
      if (!nonce) {
        return;
      }
      const { tapOutputKey, participantPubKey, pubNonce } = nonce;
      const nonceKeyValData = encodePsbtMusig2PubNonceKeyValData({
        tapOutputKey,
        participantPubKey,
        pubNonce: Buffer.from(nonce.pubNonce),
      });
      this.addOrUpdateProprietaryKeyValToInput(inputIndex, nonceKeyValData);
      this.setOriginalMusig2PubNonce(participantPubKey, tapOutputKey, pubNonce);
    });
  }

  clone(): this {
    return super.clone() as this;
  }
}
