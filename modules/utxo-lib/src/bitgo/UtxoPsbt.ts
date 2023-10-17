import * as assert from 'assert';
import { Psbt as PsbtBase } from 'bip174';
import {
  Bip32Derivation,
  PsbtInput,
  TapBip32Derivation,
  Transaction as ITransaction,
  TransactionFromBuffer,
} from 'bip174/src/lib/interfaces';
import { checkForInput } from 'bip174/src/lib/utils';
import { BufferWriter, varuint } from 'bitcoinjs-lib/src/bufferutils';
import { SessionKey } from '@brandonblack/musig';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as bs58check from 'bs58check';
import { decodeProprietaryKey, encodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';

import {
  taproot,
  HDSigner,
  Psbt,
  PsbtTransaction,
  Transaction,
  TxOutput,
  Network,
  ecc as eccLib,
  getMainnet,
  networks,
} from '..';
import { UtxoTransaction } from './UtxoTransaction';
import { getOutputIdForInput } from './Unspent';
import { isSegwit } from './psbt/scriptTypes';
import { unsign } from './psbt/fromHalfSigned';
import { toXOnlyPublicKey } from './outputScripts';
import { parsePubScript2Of3 } from './parseInput';
import {
  createMusig2SigningSession,
  encodePsbtMusig2PartialSig,
  encodePsbtMusig2PubNonce,
  musig2PartialSign,
  parsePsbtMusig2Nonces,
  parsePsbtMusig2Participants,
  PsbtMusig2Participants,
  assertPsbtMusig2Nonces,
  assertPsbtMusig2Participants,
  Musig2NonceStore,
  PsbtMusig2PubNonce,
  parsePsbtMusig2PartialSigs,
  musig2PartialSigVerify,
  musig2AggregateSigs,
  getSigHashTypeFromSigs,
  musig2DeterministicSign,
  createMusig2DeterministicNonce,
} from './Musig2';
import { isTriple, isTuple, Triple, Tuple } from './types';
import { getTaprootOutputKey } from '../taproot';
import {
  getPsbtInputProprietaryKeyVals,
  getPsbtInputSignatureCount,
  ProprietaryKeySearch,
  ProprietaryKeySubtype,
  ProprietaryKeyValue,
  PSBT_PROPRIETARY_IDENTIFIER,
} from './PsbtUtil';

type SignatureParams = {
  /** When true, and add the second (last) nonce and signature for a taproot key
   * path spend deterministically. Throws an error if done for the first nonce/signature
   * of a taproot keypath spend. Ignore for all other input types.
   */
  deterministic: boolean;
  /** Allowed sighash types */
  sighashTypes: number[];
};

function defaultSighashTypes(network: Network): number[] {
  const sighashTypes = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL];
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.ecash:
      return [...sighashTypes, ...sighashTypes.map((s) => s | UtxoTransaction.SIGHASH_FORKID)];
    default:
      return sighashTypes;
  }
}

function toSignatureParams(network: Network, v?: Partial<SignatureParams> | number[]): SignatureParams {
  if (Array.isArray(v)) return toSignatureParams(network, { sighashTypes: v });
  return { deterministic: false, sighashTypes: defaultSighashTypes(network), ...v };
}

/**
 * @param a
 * @param b
 * @returns true if the two public keys are equal ignoring the y coordinate.
 */
function equalPublicKeyIgnoreY(a: Buffer, b: Buffer): boolean {
  return toXOnlyPublicKey(a).equals(toXOnlyPublicKey(b));
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

// TODO: upstream does `checkInputsForPartialSigs` before doing things like
// `setVersion`. Our inputs could have tapscriptsigs (or in future tapkeysigs)
// and not fail that check. Do we want to do anything about that?
export class UtxoPsbt<Tx extends UtxoTransaction<bigint> = UtxoTransaction<bigint>> extends Psbt {
  private nonceStore = new Musig2NonceStore();

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

  /**
   * @param parent - Parent key. Matched with `bip32Derivations` using `fingerprint` property.
   * @param bip32Derivations - possible derivations for input or output
   * @param ignoreY - when true, ignore the y coordinate when matching public keys
   * @return derived bip32 node if matching derivation is found, undefined if none is found
   * @throws Error if more than one match is found
   */
  static deriveKeyPair(
    parent: BIP32Interface,
    bip32Derivations: Bip32Derivation[],
    { ignoreY }: { ignoreY: boolean }
  ): BIP32Interface | undefined {
    const matchingDerivations = bip32Derivations.filter((bipDv) => {
      return bipDv.masterFingerprint.equals(parent.fingerprint);
    });

    if (!matchingDerivations.length) {
      // No fingerprint match
      return undefined;
    }

    if (matchingDerivations.length !== 1) {
      throw new Error(
        `more than one matching derivation for fingerprint ${parent.fingerprint.toString('hex')}: ${
          matchingDerivations.length
        }`
      );
    }

    const [derivation] = matchingDerivations;
    const node = parent.derivePath(derivation.path);

    if (!node.publicKey.equals(derivation.pubkey)) {
      if (!ignoreY || !equalPublicKeyIgnoreY(node.publicKey, derivation.pubkey)) {
        throw new Error('pubkey did not match bip32Derivation');
      }
    }

    return node;
  }

  static deriveKeyPairForInput(bip32: BIP32Interface, input: PsbtInput): Buffer | undefined {
    return input.tapBip32Derivation?.length
      ? UtxoPsbt.deriveKeyPair(bip32, input.tapBip32Derivation, { ignoreY: true })?.publicKey
      : input.bip32Derivation?.length
      ? UtxoPsbt.deriveKeyPair(bip32, input.bip32Derivation, { ignoreY: false })?.publicKey
      : bip32?.publicKey;
  }

  get network(): Network {
    return this.tx.network;
  }

  toHex(): string {
    return this.toBuffer().toString('hex');
  }

  /**
   * It is expensive to attempt to compute every output address using psbt.txOutputs[outputIndex]
   * to then just get the script. Here, we are doing the same thing as what txOutputs() does in
   * bitcoinjs-lib, but without iterating over each output.
   * @param outputIndex
   * @returns output script at the given index
   */
  getOutputScript(outputIndex: number): Buffer {
    return (this as any).__CACHE.__TX.outs[outputIndex].script as Buffer;
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
   * @returns true if the input at inputIndex is a taproot key path.
   * Checks for presence of minimum required key path input fields and absence of any script path only input fields.
   */
  isTaprootKeyPathInput(inputIndex: number): boolean {
    const input = checkForInput(this.data.inputs, inputIndex);
    return (
      !!input.tapInternalKey &&
      !!input.tapMerkleRoot &&
      !(
        input.tapLeafScript?.length ||
        input.tapScriptSig?.length ||
        input.tapBip32Derivation?.some((v) => v.leafHashes.length)
      )
    );
  }

  /**
   * @returns true if the input at inputIndex is a taproot script path.
   * Checks for presence of minimum required script path input fields and absence of any key path only input fields.
   */
  isTaprootScriptPathInput(inputIndex: number): boolean {
    const input = checkForInput(this.data.inputs, inputIndex);
    return (
      !!input.tapLeafScript?.length &&
      !(
        this.getProprietaryKeyVals(inputIndex, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
        }).length ||
        this.getProprietaryKeyVals(inputIndex, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        }).length ||
        this.getProprietaryKeyVals(inputIndex, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
        }).length
      )
    );
  }

  /**
   * @returns true if the input at inputIndex is a taproot
   */
  isTaprootInput(inputIndex: number): boolean {
    const input = checkForInput(this.data.inputs, inputIndex);
    const isP2TR = (script: Buffer): boolean => {
      try {
        getTaprootOutputKey(script);
        return true;
      } catch (e) {
        return false;
      }
    };
    return !!(
      input.tapInternalKey ||
      input.tapMerkleRoot ||
      input.tapLeafScript?.length ||
      input.tapBip32Derivation?.length ||
      input.tapScriptSig?.length ||
      this.getProprietaryKeyVals(inputIndex, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
      }).length ||
      this.getProprietaryKeyVals(inputIndex, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
      }).length ||
      this.getProprietaryKeyVals(inputIndex, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
      }).length ||
      (input.witnessUtxo && isP2TR(input.witnessUtxo.script))
    );
  }

  private isMultisigTaprootScript(script: Buffer): boolean {
    try {
      parsePubScript2Of3(script, 'taprootScriptPathSpend');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
   */
  finalizeAllInputs(): this {
    checkForInput(this.data.inputs, 0); // making sure we have at least one
    this.data.inputs.map((input, idx) => {
      if (input.tapLeafScript?.length) {
        return this.isMultisigTaprootScript(input.tapLeafScript[0].script)
          ? this.finalizeTaprootInput(idx)
          : this.finalizeTapInputWithSingleLeafScriptAndSignature(idx);
      } else if (this.isTaprootKeyPathInput(idx)) {
        return this.finalizeTaprootMusig2Input(idx);
      }
      return this.finalizeInput(idx);
    });
    return this;
  }

  finalizeTaprootInput(inputIndex: number): this {
    const checkPartialSigSighashes = (sig: Buffer) => {
      const sighashType = sig.length === 64 ? Transaction.SIGHASH_DEFAULT : sig.readUInt8(sig.length - 1);
      const inputSighashType = input.sighashType === undefined ? Transaction.SIGHASH_DEFAULT : input.sighashType;
      assert(sighashType === inputSighashType, 'signature sighash does not match input sighash type');
    };
    const input = checkForInput(this.data.inputs, inputIndex);
    // witness = control-block script first-sig second-sig
    if (input.tapLeafScript?.length !== 1) {
      throw new Error('Only one leaf script supported for finalizing');
    }
    const { controlBlock, script } = input.tapLeafScript[0];
    const witness: Buffer[] = [script, controlBlock];
    const [pubkey1, pubkey2] = parsePubScript2Of3(script, 'taprootScriptPathSpend').publicKeys;
    for (const pk of [pubkey1, pubkey2]) {
      const sig = input.tapScriptSig?.find(({ pubkey }) => equalPublicKeyIgnoreY(pk, pubkey));
      if (!sig) {
        throw new Error('Could not find signatures in Script Sig.');
      }
      checkPartialSigSighashes(sig.signature);
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
   * Finalizes a taproot musig2 input by aggregating all partial sigs.
   * IMPORTANT: Always call validate* function before finalizing.
   */
  finalizeTaprootMusig2Input(inputIndex: number): this {
    const input = checkForInput(this.data.inputs, inputIndex);
    const partialSigs = parsePsbtMusig2PartialSigs(input);
    if (partialSigs?.length !== 2) {
      throw new Error(`invalid number of partial signatures ${partialSigs ? partialSigs.length : 0} to finalize`);
    }
    const { partialSigs: pSigs, sigHashType } = getSigHashTypeFromSigs(partialSigs);
    const { sessionKey } = this.getMusig2SessionKey(inputIndex, sigHashType);

    const aggSig = musig2AggregateSigs(
      pSigs.map((pSig) => pSig.partialSig),
      sessionKey
    );

    const sig = sigHashType === Transaction.SIGHASH_DEFAULT ? aggSig : Buffer.concat([aggSig, Buffer.of(sigHashType)]);

    // single signature with 64/65 bytes size is script witness for key path spend
    const bufferWriter = BufferWriter.withCapacity(1 + varuint.encodingLength(sig.length) + sig.length);
    bufferWriter.writeVector([sig]);
    const finalScriptWitness = bufferWriter.end();

    this.data.updateInput(inputIndex, { finalScriptWitness });
    this.data.clearFinalizedInput(inputIndex);
    // deleting only BitGo proprietary key values.
    this.deleteProprietaryKeyVals(inputIndex, { identifier: PSBT_PROPRIETARY_IDENTIFIER });
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
      return this.validateSignaturesOfInputCommon(idx);
    });
    return results.reduce((final, res) => res && final, true);
  }

  /**
   * @returns true iff any matching valid signature is found for a derived pub key from given HD key pair.
   */
  validateSignaturesOfInputHD(inputIndex: number, hdKeyPair: BIP32Interface): boolean {
    const input = checkForInput(this.data.inputs, inputIndex);
    const pubKey = UtxoPsbt.deriveKeyPairForInput(hdKeyPair, input);
    if (!pubKey) {
      throw new Error('can not derive from HD key pair');
    }
    return this.validateSignaturesOfInputCommon(inputIndex, pubKey);
  }

  /**
   * @returns true iff any valid signature(s) are found from bip32 data of PSBT or for given pub key.
   */
  validateSignaturesOfInputCommon(inputIndex: number, pubkey?: Buffer): boolean {
    try {
      if (this.isTaprootScriptPathInput(inputIndex)) {
        return this.validateTaprootSignaturesOfInput(inputIndex, pubkey);
      } else if (this.isTaprootKeyPathInput(inputIndex)) {
        return this.validateTaprootMusig2SignaturesOfInput(inputIndex, pubkey);
      }
      return this.validateSignaturesOfInput(inputIndex, (p, m, s) => eccLib.verify(m, p, s, true), pubkey);
    } catch (err) {
      // Not an elegant solution. Might need upstream changes like custom error types.
      if (err.message === 'No signatures for this pubkey') {
        return false;
      }
      throw err;
    }
  }

  private getMusig2SessionKey(
    inputIndex: number,
    sigHashType: number
  ): {
    participants: PsbtMusig2Participants;
    nonces: Tuple<PsbtMusig2PubNonce>;
    hash: Buffer;
    sessionKey: SessionKey;
  } {
    const input = checkForInput(this.data.inputs, inputIndex);
    if (!input.tapInternalKey || !input.tapMerkleRoot) {
      throw new Error('both tapInternalKey and tapMerkleRoot are required');
    }

    const participants = this.getMusig2Participants(inputIndex, input.tapInternalKey, input.tapMerkleRoot);
    const nonces = this.getMusig2Nonces(inputIndex, participants);

    const { hash } = this.getTaprootHashForSig(inputIndex, [sigHashType]);

    const sessionKey = createMusig2SigningSession({
      pubNonces: [nonces[0].pubNonce, nonces[1].pubNonce],
      pubKeys: participants.participantPubKeys,
      txHash: hash,
      internalPubKey: input.tapInternalKey,
      tapTreeRoot: input.tapMerkleRoot,
    });
    return { participants, nonces, hash, sessionKey };
  }

  /**
   * @returns true for following cases.
   * If valid musig2 partial signatures exists for both 2 keys, it will also verify aggregated sig
   * for aggregated tweaked key (output key), otherwise only verifies partial sig.
   * If pubkey is passed in input, it will check sig only for that pubkey,
   * if no sig exits for such key, throws error.
   * For invalid state of input data, it will throw errors.
   */
  validateTaprootMusig2SignaturesOfInput(inputIndex: number, pubkey?: Buffer): boolean {
    const input = checkForInput(this.data.inputs, inputIndex);
    const partialSigs = parsePsbtMusig2PartialSigs(input);
    if (!partialSigs) {
      throw new Error(`No signatures to validate`);
    }

    let myPartialSigs = partialSigs;
    if (pubkey) {
      myPartialSigs = partialSigs.filter((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, pubkey));
      if (myPartialSigs?.length < 1) {
        throw new Error('No signatures for this pubkey');
      }
    }

    const { partialSigs: mySigs, sigHashType } = getSigHashTypeFromSigs(myPartialSigs);
    const { participants, nonces, hash, sessionKey } = this.getMusig2SessionKey(inputIndex, sigHashType);

    const results = mySigs.map((mySig) => {
      const myNonce = nonces.find((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, mySig.participantPubKey));
      if (!myNonce) {
        throw new Error('Found no pub nonce for pubkey');
      }
      return musig2PartialSigVerify(mySig.partialSig, mySig.participantPubKey, myNonce.pubNonce, sessionKey);
    });

    // For valid single sig or 1 or 2 failure sigs, no need to validate aggregated sig. So skip.
    const result = results.every((res) => res);
    if (!result || mySigs.length < 2) {
      return result;
    }

    const aggSig = musig2AggregateSigs(
      mySigs.map((mySig) => mySig.partialSig),
      sessionKey
    );

    return eccLib.verifySchnorr(hash, participants.tapOutputKey, aggSig);
  }

  validateTaprootSignaturesOfInput(inputIndex: number, pubkey?: Buffer): boolean {
    const input = this.data.inputs[inputIndex];
    const tapSigs = (input || {}).tapScriptSig;
    if (!input || !tapSigs || tapSigs.length < 1) {
      throw new Error('No signatures to validate');
    }
    let mySigs;
    if (pubkey) {
      mySigs = tapSigs.filter((sig) => equalPublicKeyIgnoreY(sig.pubkey, pubkey));
      if (mySigs.length < 1) {
        throw new Error('No signatures for this pubkey');
      }
    } else {
      mySigs = tapSigs;
    }
    const results: boolean[] = [];

    assert(input.tapLeafScript?.length === 1, `single tapLeafScript is expected. Got ${input.tapLeafScript?.length}`);
    const [tapLeafScript] = input.tapLeafScript;
    const pubKeys = this.isMultisigTaprootScript(tapLeafScript.script)
      ? parsePubScript2Of3(tapLeafScript.script, 'taprootScriptPathSpend').publicKeys
      : undefined;

    for (const pSig of mySigs) {
      const { signature, leafHash, pubkey } = pSig;
      if (pubKeys) {
        assert(
          pubKeys.find((pk) => pubkey.equals(pk)),
          'public key not found in tap leaf script'
        );
      }
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
    return results.every((res) => res);
  }

  /**
   * @param inputIndex
   * @param rootNodes optional input root bip32 nodes to verify with. If it is not provided, globalXpub will be used.
   * @return array of boolean values. True when corresponding index in `publicKeys` has signed the transaction.
   * If no signature in the tx or no public key matching signature, the validation is considered as false.
   */
  getSignatureValidationArray(
    inputIndex: number,
    { rootNodes }: { rootNodes?: Triple<BIP32Interface> } = {}
  ): Triple<boolean> {
    if (!rootNodes && (!this.data.globalMap.globalXpub?.length || !isTriple(this.data.globalMap.globalXpub))) {
      throw new Error('Cannot get signature validation array without 3 global xpubs');
    }

    const bip32s = rootNodes
      ? rootNodes
      : this.data.globalMap.globalXpub?.map((xpub) =>
          BIP32Factory(eccLib).fromBase58(bs58check.encode(xpub.extendedPubkey))
        );

    if (!bip32s) {
      throw new Error('either globalMap or rootNodes is required');
    }

    const input = checkForInput(this.data.inputs, inputIndex);
    if (!getPsbtInputSignatureCount(input)) {
      return [false, false, false];
    }

    return bip32s.map((bip32) => {
      const pubKey = UtxoPsbt.deriveKeyPairForInput(bip32, input);
      if (!pubKey) {
        return false;
      }
      try {
        return this.validateSignaturesOfInputCommon(inputIndex, pubKey);
      } catch (err) {
        // Not an elegant solution. Might need upstream changes like custom error types.
        if (err.message === 'No signatures for this pubkey') {
          return false;
        }
        throw err;
      }
    }) as Triple<boolean>;
  }

  /**
   * Mostly copied from bitcoinjs-lib/ts_src/psbt.ts
   */
  signAllInputsHD(
    hdKeyPair: HDTaprootSigner | HDTaprootMusig2Signer,
    params?: number[] | Partial<SignatureParams>
  ): this {
    if (!hdKeyPair || !hdKeyPair.publicKey || !hdKeyPair.fingerprint) {
      throw new Error('Need HDSigner to sign input');
    }
    const { sighashTypes, deterministic } = toSignatureParams(this.network, params);

    const results: boolean[] = [];
    for (let i = 0; i < this.data.inputs.length; i++) {
      try {
        this.signInputHD(i, hdKeyPair, { sighashTypes, deterministic });
        results.push(true);
      } catch (err) {
        results.push(false);
      }
    }
    if (results.every((v) => !v)) {
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
    { sighashTypes = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL], deterministic = false } = {}
  ): this {
    if (!this.isTaprootInput(inputIndex)) {
      throw new Error('not a taproot input');
    }
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
      if (!equalPublicKeyIgnoreY(bipDv.pubkey, node.publicKey)) {
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
      signers.forEach((signer) => this.signTaprootMusig2Input(inputIndex, signer, { sighashTypes, deterministic }));
    }
    return this;
  }

  signInputHD(
    inputIndex: number,
    hdKeyPair: HDTaprootSigner | HDTaprootMusig2Signer,
    params?: number[] | Partial<SignatureParams>
  ): this {
    const { sighashTypes, deterministic } = toSignatureParams(this.network, params);
    if (this.isTaprootInput(inputIndex)) {
      return this.signTaprootInputHD(inputIndex, hdKeyPair, { sighashTypes, deterministic });
    } else {
      return super.signInputHD(inputIndex, hdKeyPair, sighashTypes);
    }
  }

  private getMusig2Participants(inputIndex: number, tapInternalKey: Buffer, tapMerkleRoot: Buffer) {
    const participantsKeyValData = parsePsbtMusig2Participants(this.data.inputs[inputIndex]);
    if (!participantsKeyValData) {
      throw new Error(`Found 0 matching participant key value instead of 1`);
    }
    assertPsbtMusig2Participants(participantsKeyValData, tapInternalKey, tapMerkleRoot);
    return participantsKeyValData;
  }

  private getMusig2Nonces(inputIndex: number, participantsKeyValData: PsbtMusig2Participants) {
    const noncesKeyValsData = parsePsbtMusig2Nonces(this.data.inputs[inputIndex]);
    if (!noncesKeyValsData || !isTuple(noncesKeyValsData)) {
      throw new Error(
        `Found ${noncesKeyValsData?.length ? noncesKeyValsData.length : 0} matching nonce key value instead of 2`
      );
    }
    assertPsbtMusig2Nonces(noncesKeyValsData, participantsKeyValData);
    return noncesKeyValsData;
  }

  /**
   * Signs p2tr musig2 key path input with 2 aggregated keys.
   *
   * Note: Only can sign deterministically as the cosigner
   * @param inputIndex
   * @param signer - XY public key and private key are required
   * @param sighashTypes
   * @param deterministic If true, sign the musig input deterministically
   */
  signTaprootMusig2Input(
    inputIndex: number,
    signer: Musig2Signer,
    { sighashTypes = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL], deterministic = false } = {}
  ): this {
    if (!this.isTaprootKeyPathInput(inputIndex)) {
      throw new Error('not a taproot musig2 input');
    }

    const input = this.data.inputs[inputIndex];

    if (!input.tapInternalKey || !input.tapMerkleRoot) {
      throw new Error('missing required input data');
    }

    // Retrieve and check that we have two participant nonces
    const participants = this.getMusig2Participants(inputIndex, input.tapInternalKey, input.tapMerkleRoot);
    const { tapOutputKey, participantPubKeys } = participants;
    const signerPubKey = participantPubKeys.find((pubKey) => equalPublicKeyIgnoreY(pubKey, signer.publicKey));
    if (!signerPubKey) {
      throw new Error('signer pub key should match one of participant pub keys');
    }

    const nonces = this.getMusig2Nonces(inputIndex, participants);
    const { hash, sighashType } = this.getTaprootHashForSig(inputIndex, sighashTypes);

    let partialSig: Buffer;
    if (deterministic) {
      if (!equalPublicKeyIgnoreY(signerPubKey, participantPubKeys[1])) {
        throw new Error('can only add a deterministic signature on the cosigner');
      }

      const firstSignerNonce = nonces.find((n) => equalPublicKeyIgnoreY(n.participantPubKey, participantPubKeys[0]));
      if (!firstSignerNonce) {
        throw new Error('could not find the user nonce');
      }

      partialSig = musig2DeterministicSign({
        privateKey: signer.privateKey,
        otherNonce: firstSignerNonce.pubNonce,
        publicKeys: participantPubKeys,
        internalPubKey: input.tapInternalKey,
        tapTreeRoot: input.tapMerkleRoot,
        hash,
      }).sig;
    } else {
      const sessionKey = createMusig2SigningSession({
        pubNonces: [nonces[0].pubNonce, nonces[1].pubNonce],
        pubKeys: participantPubKeys,
        txHash: hash,
        internalPubKey: input.tapInternalKey,
        tapTreeRoot: input.tapMerkleRoot,
      });

      const signerNonce = nonces.find((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, signerPubKey));
      if (!signerNonce) {
        throw new Error('pubNonce is missing. retry signing process');
      }
      partialSig = musig2PartialSign(signer.privateKey, signerNonce.pubNonce, sessionKey, this.nonceStore);
    }

    if (sighashType !== Transaction.SIGHASH_DEFAULT) {
      partialSig = Buffer.concat([partialSig, Buffer.of(sighashType)]);
    }

    const sig = encodePsbtMusig2PartialSig({
      participantPubKey: signerPubKey,
      tapOutputKey,
      partialSig: partialSig,
    });
    this.addProprietaryKeyValToInput(inputIndex, sig);
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
    const [tapLeafScript] = input.tapLeafScript;

    if (this.isMultisigTaprootScript(tapLeafScript.script)) {
      const pubKeys = parsePubScript2Of3(tapLeafScript.script, 'taprootScriptPathSpend').publicKeys;
      assert(
        pubKeys.find((pk) => pubkey.equals(pk)),
        'public key not found in tap leaf script'
      );
    }

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

  private getTaprootOutputScript(inputIndex: number) {
    const input = checkForInput(this.data.inputs, inputIndex);
    if (input.tapLeafScript?.length) {
      return taproot.createTaprootOutputScript({
        controlBlock: input.tapLeafScript[0].controlBlock,
        leafScript: input.tapLeafScript[0].script,
      });
    } else if (input.tapInternalKey && input.tapMerkleRoot) {
      return taproot.createTaprootOutputScript({
        internalPubKey: input.tapInternalKey,
        taptreeRoot: input.tapMerkleRoot,
      });
    }
    throw new Error('not a taproot input');
  }

  private getTaprootHashForSig(
    inputIndex: number,
    sighashTypes?: number[],
    leafHash?: Buffer
  ): {
    hash: Buffer;
    sighashType: number;
  } {
    if (!this.isTaprootInput(inputIndex)) {
      throw new Error('not a taproot input');
    }
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
    const outputScript = this.getTaprootOutputScript(inputIndex);
    if (!outputScript.equals(prevoutScripts[inputIndex])) {
      throw new Error(`Witness script for input #${inputIndex} doesn't match the scriptPubKey in the prevout`);
    }
    const hash = this.tx.hashForWitnessV1(inputIndex, prevoutScripts, prevoutValues, sighashType, leafHash);
    return { hash, sighashType };
  }

  /**
   * Adds proprietary key value pair to PSBT input.
   * Default identifierEncoding is utf-8 for identifier.
   */
  addProprietaryKeyValToInput(inputIndex: number, keyValueData: ProprietaryKeyValue): this {
    return this.addUnknownKeyValToInput(inputIndex, {
      key: encodeProprietaryKey(keyValueData.key),
      value: keyValueData.value,
    });
  }

  /**
   * Adds or updates (if exists) proprietary key value pair to PSBT input.
   * Default identifierEncoding is utf-8 for identifier.
   */
  addOrUpdateProprietaryKeyValToInput(inputIndex: number, keyValueData: ProprietaryKeyValue): this {
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
   * To search any data from proprietary key value against keydata.
   * Default identifierEncoding is utf-8 for identifier.
   */
  getProprietaryKeyVals(inputIndex: number, keySearch?: ProprietaryKeySearch): ProprietaryKeyValue[] {
    const input = checkForInput(this.data.inputs, inputIndex);
    return getPsbtInputProprietaryKeyVals(input, keySearch);
  }

  /**
   * To delete any data from proprietary key value.
   * Default identifierEncoding is utf-8 for identifier.
   */
  deleteProprietaryKeyVals(inputIndex: number, keysToDelete?: ProprietaryKeySearch): this {
    const input = checkForInput(this.data.inputs, inputIndex);
    if (!input.unknownKeyVals?.length) {
      return this;
    }
    if (keysToDelete && keysToDelete.subtype === undefined && Buffer.isBuffer(keysToDelete.keydata)) {
      throw new Error('invalid proprietary key search filter combination. subtype is required');
    }
    input.unknownKeyVals = input.unknownKeyVals.filter((keyValue, i) => {
      const key = decodeProprietaryKey(keyValue.key);
      return !(
        keysToDelete === undefined ||
        (keysToDelete.identifier === key.identifier &&
          (keysToDelete.subtype === undefined ||
            (keysToDelete.subtype === key.subtype &&
              (!Buffer.isBuffer(keysToDelete.keydata) || keysToDelete.keydata.equals(key.keydata)))))
      );
    });
    return this;
  }

  private createMusig2NonceForInput(
    inputIndex: number,
    keyPair: BIP32Interface,
    keyType: 'root' | 'derived',
    params: { sessionId?: Buffer; deterministic?: boolean } = { deterministic: false }
  ): PsbtMusig2PubNonce {
    const input = this.data.inputs[inputIndex];
    if (!input.tapInternalKey) {
      throw new Error('tapInternalKey is required to create nonce');
    }
    if (!input.tapMerkleRoot) {
      throw new Error('tapMerkleRoot is required to create nonce');
    }
    const getDerivedKeyPair = (): BIP32Interface => {
      if (!input.tapBip32Derivation?.length) {
        throw new Error('tapBip32Derivation is required to create nonce');
      }
      const derived = UtxoPsbt.deriveKeyPair(keyPair, input.tapBip32Derivation, { ignoreY: true });
      if (!derived) {
        throw new Error('No bip32Derivation masterFingerprint matched the HD keyPair fingerprint');
      }
      return derived;
    };
    const derivedKeyPair = keyType === 'root' ? getDerivedKeyPair() : keyPair;
    if (!derivedKeyPair.privateKey) {
      throw new Error('privateKey is required to create nonce');
    }
    const participants = parsePsbtMusig2Participants(input);
    if (!participants) {
      throw new Error(`Found 0 matching participant key value instead of 1`);
    }
    assertPsbtMusig2Participants(participants, input.tapInternalKey, input.tapMerkleRoot);
    const { tapOutputKey, participantPubKeys } = participants;

    const participantPubKey = participantPubKeys.find((pubKey) =>
      equalPublicKeyIgnoreY(pubKey, derivedKeyPair.publicKey)
    );
    if (!Buffer.isBuffer(participantPubKey)) {
      throw new Error('participant plain pub key should match one bip32Derivation plain pub key');
    }

    const { hash } = this.getTaprootHashForSig(inputIndex);

    let pubNonce: Buffer;
    if (params.deterministic) {
      if (params.sessionId) {
        throw new Error('Cannot add extra entropy when generating a deterministic nonce');
      }
      // There must be only 2 participant pubKeys if it got to this point
      if (!equalPublicKeyIgnoreY(participantPubKey, participantPubKeys[1])) {
        throw new Error(`Only the cosigner's nonce can be set deterministically`);
      }
      const nonces = parsePsbtMusig2Nonces(input);
      if (!nonces) {
        throw new Error(`No nonces found on input #${inputIndex}`);
      }
      if (nonces.length > 2) {
        throw new Error(`Cannot have more than 2 nonces`);
      }
      const firstSignerNonce = nonces.find((kv) => equalPublicKeyIgnoreY(kv.participantPubKey, participantPubKeys[0]));
      if (!firstSignerNonce) {
        throw new Error('signer nonce must be set if cosigner nonce is to be derived deterministically');
      }

      pubNonce = createMusig2DeterministicNonce({
        privateKey: derivedKeyPair.privateKey,
        otherNonce: firstSignerNonce.pubNonce,
        publicKeys: participantPubKeys,
        internalPubKey: input.tapInternalKey,
        tapTreeRoot: input.tapMerkleRoot,
        hash,
      });
    } else {
      pubNonce = Buffer.from(
        this.nonceStore.createMusig2Nonce(
          derivedKeyPair.privateKey,
          participantPubKey,
          tapOutputKey,
          hash,
          params.sessionId
        )
      );
    }

    return { tapOutputKey, participantPubKey, pubNonce };
  }

  private setMusig2NoncesInner(
    keyPair: BIP32Interface,
    keyType: 'root' | 'derived',
    inputIndex?: number,
    params: { sessionId?: Buffer; deterministic?: boolean } = { deterministic: false }
  ): this {
    if (keyPair.isNeutered()) {
      throw new Error('private key is required to generate nonce');
    }
    if (Buffer.isBuffer(params.sessionId) && params.sessionId.length !== 32) {
      throw new Error(`Invalid sessionId size ${params.sessionId.length}`);
    }

    const inputIndexes = inputIndex === undefined ? [...Array(this.inputCount).keys()] : [inputIndex];
    inputIndexes.forEach((index) => {
      if (!this.isTaprootKeyPathInput(index)) {
        return;
      }
      const nonce = this.createMusig2NonceForInput(index, keyPair, keyType, params);
      this.addOrUpdateProprietaryKeyValToInput(index, encodePsbtMusig2PubNonce(nonce));
    });
    return this;
  }

  /**
   * Generates and sets MuSig2 nonce to taproot key path input at inputIndex.
   * If input is not a taproot key path, no action.
   *
   * @param inputIndex input index
   * @param keyPair derived key pair
   * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
   * (converted to an array of 32 bytes), or 32 uniformly random bytes.
   * @param deterministic If true, set the cosigner nonce deterministically
   */
  setInputMusig2Nonce(
    inputIndex: number,
    derivedKeyPair: BIP32Interface,
    params: { sessionId?: Buffer; deterministic?: boolean } = { deterministic: false }
  ): this {
    return this.setMusig2NoncesInner(derivedKeyPair, 'derived', inputIndex, params);
  }

  /**
   * Generates and sets MuSig2 nonce to taproot key path input at inputIndex.
   * If input is not a taproot key path, no action.
   *
   * @param inputIndex input index
   * @param keyPair HD root key pair
   * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
   * (converted to an array of 32 bytes), or 32 uniformly random bytes.
   * @param deterministic If true, set the cosigner nonce deterministically
   */
  setInputMusig2NonceHD(
    inputIndex: number,
    keyPair: BIP32Interface,
    params: { sessionId?: Buffer; deterministic?: boolean } = { deterministic: false }
  ): this {
    checkForInput(this.data.inputs, inputIndex);
    return this.setMusig2NoncesInner(keyPair, 'root', inputIndex, params);
  }

  /**
   * Generates and sets MuSig2 nonce to all taproot key path inputs. Other inputs will be skipped.
   *
   * @param inputIndex input index
   * @param keyPair derived key pair
   * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
   * (converted to an array of 32 bytes), or 32 uniformly random bytes.
   */
  setAllInputsMusig2Nonce(
    keyPair: BIP32Interface,
    params: { sessionId?: Buffer; deterministic?: boolean } = { deterministic: false }
  ): this {
    return this.setMusig2NoncesInner(keyPair, 'derived', undefined, params);
  }

  /**
   * Generates and sets MuSig2 nonce to all taproot key path inputs. Other inputs will be skipped.
   *
   * @param inputIndex input index
   * @param keyPair HD root key pair
   * @param sessionId Optional extra entropy. If provided it must either be a counter unique to this secret key,
   * (converted to an array of 32 bytes), or 32 uniformly random bytes.
   */
  setAllInputsMusig2NonceHD(
    keyPair: BIP32Interface,
    params: { sessionId?: Buffer; deterministic?: boolean } = { deterministic: false }
  ): this {
    return this.setMusig2NoncesInner(keyPair, 'root', undefined, params);
  }

  clone(): this {
    return super.clone() as this;
  }

  extractTransaction(disableFeeCheck?: boolean): UtxoTransaction<bigint> {
    const tx = super.extractTransaction(disableFeeCheck);
    if (tx instanceof UtxoTransaction) {
      return tx;
    }
    throw new Error('extractTransaction did not return instace of UtxoTransaction');
  }
}
