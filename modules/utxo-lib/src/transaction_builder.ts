import * as types from 'bitcoinjs-lib/src/types';
import { address as baddress, p2trPayments } from './';
import * as bufferutils from 'bitcoinjs-lib/src/bufferutils';
import * as classify from './classify';
import { crypto as bcrypto } from './';
import { networks } from './';
import { Network } from './';
import { payments } from './';
import { Payment } from './';
import { script as bscript } from './';
import { opcodes as ops } from './';
import { taproot } from './';
import { TxOutput, Transaction } from './';
import { ECPair, ecc as eccLib } from './noble_ecc';

export interface Signer {
  privateKey?: Buffer;
  publicKey: Buffer;
  getPublicKey?(): Buffer;
  sign(hash: Buffer, lowR?: boolean): Buffer;
  signSchnorr(hash: Buffer): Buffer;
}

const typeforce = require('typeforce');

const tfFullSigner = (obj: any): boolean => {
  return typeforce.Buffer(obj.publicKey) && typeof obj.sign === 'function' && typeof obj.signSchnorr === 'function';
};

const SCRIPT_TYPES = classify.types;

const PREVOUT_TYPES: Set<string> = new Set([
  // Raw
  'p2pkh',
  'p2pk',
  'p2wpkh',
  'p2ms',
  // P2SH wrapped
  'p2sh-p2pkh',
  'p2sh-p2pk',
  'p2sh-p2wpkh',
  'p2sh-p2ms',
  // P2WSH wrapped
  'p2wsh-p2pkh',
  'p2wsh-p2pk',
  'p2wsh-p2ms',
  // P2SH-P2WSH wrapper
  'p2sh-p2wsh-p2pkh',
  'p2sh-p2wsh-p2pk',
  'p2sh-p2wsh-p2ms',
  // P2TR KeyPath
  'p2tr',
  // P2TR ScriptPath
  'p2tr-p2ns',
]);

type MaybeBuffer = Buffer | undefined;
type TxbSignatures = Buffer[] | MaybeBuffer[];
type TxbPubkeys = MaybeBuffer[];
type TxbWitness = Buffer[];
type TxbScriptType = string;
type TxbScript = Buffer;

interface TxbInput<TNumber extends number | bigint = number> {
  value?: TNumber;
  witnessVersion?: number;
  signScript?: TxbScript;
  signType?: TxbScriptType;
  prevOutScript?: TxbScript;
  redeemScript?: TxbScript;
  redeemScriptType?: TxbScriptType;
  prevOutType?: TxbScriptType;
  pubkeys?: TxbPubkeys;
  signatures?: TxbSignatures;
  witness?: TxbWitness;
  witnessScript?: TxbScript;
  witnessScriptType?: TxbScriptType;
  controlBlock?: Buffer;
  annex?: Buffer;
  script?: TxbScript;
  sequence?: number;
  scriptSig?: TxbScript;
  maxSignatures?: number;
}

interface TxbOutput {
  type: string;
  pubkeys?: TxbPubkeys;
  signatures?: TxbSignatures;
  maxSignatures?: number;
}

interface TxbSignArg<TNumber extends number | bigint = number> {
  prevOutScriptType: string;
  vin: number;
  keyPair: Signer;
  redeemScript?: Buffer;
  hashType?: number;
  witnessValue?: TNumber;
  witnessScript?: Buffer;
  controlBlock?: Buffer;
  annex?: Buffer;
}

function tfMessage(type: any, value: any, message: string): void {
  try {
    typeforce(type, value);
  } catch (err) {
    throw new Error(message);
  }
}

function txIsString<TNumber extends number | bigint = number>(
  tx: Buffer | string | Transaction<TNumber>
): tx is string {
  return typeof tx === 'string' || tx instanceof String;
}

function txIsTransaction<TNumber extends number | bigint = number>(
  tx: Buffer | string | Transaction<TNumber>
): tx is Transaction<TNumber> {
  return tx instanceof Transaction;
}

export class TransactionBuilder<TNumber extends number | bigint = number> {
  static fromTransaction<TNumber extends number | bigint = number>(
    transaction: Transaction<TNumber>,
    network?: Network,
    prevOutputs?: TxOutput<TNumber>[]
  ): TransactionBuilder<TNumber> {
    const txb = new TransactionBuilder<TNumber>(network);

    // Copy transaction fields
    txb.setVersion(transaction.version);
    txb.setLockTime(transaction.locktime);

    // Copy outputs (done first to avoid signature invalidation)
    transaction.outs.forEach((txOut) => {
      txb.addOutput(txOut.script, (txOut as TxOutput<TNumber>).value);
    });

    // Copy inputs
    transaction.ins.forEach((txIn) => {
      txb.__addInputUnsafe(txIn.hash, txIn.index, {
        sequence: txIn.sequence,
        script: txIn.script,
        witness: txIn.witness,
      });
    });

    // fix some things not possible through the public API
    txb.__INPUTS.forEach((input, i) => {
      fixMultisigOrder<TNumber>(input, transaction, i, prevOutputs);
    });

    return txb;
  }

  private __PREV_TX_SET: { [index: string]: boolean };
  private __INPUTS: Array<TxbInput<TNumber>>;
  private __TX: Transaction<TNumber>;
  private __USE_LOW_R: boolean;

  // WARNING: maximumFeeRate is __NOT__ to be relied on,
  //          it's just another potential safety mechanism (safety in-depth)
  constructor(public network: Network = networks.bitcoin, public maximumFeeRate: number = 2500) {
    this.__PREV_TX_SET = {};
    this.__INPUTS = [];
    this.__TX = new Transaction<TNumber>();
    this.__TX.version = 2;
    this.__USE_LOW_R = false;
  }

  setLowR(setting?: boolean): boolean {
    typeforce(typeforce.maybe(typeforce.Boolean), setting);
    if (setting === undefined) {
      setting = true;
    }
    this.__USE_LOW_R = setting;
    return setting;
  }

  setLockTime(locktime: number): void {
    typeforce(types.UInt32, locktime);

    // if any signatures exist, throw
    if (
      this.__INPUTS.some((input) => {
        if (!input.signatures) return false;

        return input.signatures.some((s) => s !== undefined);
      })
    ) {
      throw new Error('No, this would invalidate signatures');
    }

    this.__TX.locktime = locktime;
  }

  setVersion(version: number): void {
    typeforce(types.UInt32, version);

    // XXX: this might eventually become more complex depending on what the versions represent
    this.__TX.version = version;
  }

  addInput(
    txHash: Buffer | string | Transaction<TNumber>,
    vout: number,
    sequence?: number,
    prevOutScript?: Buffer,
    value?: TNumber
  ): number {
    if (!this.__canModifyInputs()) {
      throw new Error('No, this would invalidate signatures');
    }

    // is it a hex string?
    if (txIsString(txHash)) {
      // transaction hashs's are displayed in reverse order, un-reverse it
      txHash = bufferutils.reverseBuffer(Buffer.from(txHash, 'hex'));

      // is it a Transaction object?
    } else if (txIsTransaction(txHash)) {
      const txOut = txHash.outs[vout];
      prevOutScript = txOut.script;
      value = (txOut as TxOutput<TNumber>).value;

      txHash = txHash.getHash(false) as Buffer;
    }

    return this.__addInputUnsafe(txHash, vout, {
      sequence,
      prevOutScript,
      value,
    });
  }

  addOutput(scriptPubKey: string | Buffer, value: TNumber): number {
    if (!this.__canModifyOutputs()) {
      throw new Error('No, this would invalidate signatures');
    }

    // Attempt to get a script if it's a base58 or bech32 address string
    if (typeof scriptPubKey === 'string') {
      scriptPubKey = baddress.toOutputScript(scriptPubKey, this.network);
    }

    return this.__TX.addOutput(scriptPubKey, value);
  }

  build(): Transaction<TNumber> {
    return this.__build(false);
  }

  buildIncomplete(): Transaction<TNumber> {
    return this.__build(true);
  }

  sign(
    signParams: number | TxbSignArg<TNumber>,
    keyPair?: Signer,
    redeemScript?: Buffer,
    hashType?: number,
    witnessValue?: TNumber,
    witnessScript?: Buffer,
    controlBlock?: Buffer,
    annex?: Buffer
  ): void {
    trySign<TNumber>(
      getSigningData<TNumber>(
        this.network,
        this.__INPUTS,
        this.__needsOutputs.bind(this),
        this.__TX,
        signParams,
        keyPair,
        redeemScript,
        hashType,
        witnessValue,
        witnessScript,
        controlBlock,
        annex,
        this.__USE_LOW_R
      )
    );
  }

  private __addInputUnsafe(txHash: Buffer, vout: number, options: TxbInput<TNumber>): number {
    if (Transaction.isCoinbaseHash(txHash)) {
      throw new Error('coinbase inputs not supported');
    }

    const prevTxOut = txHash.toString('hex') + ':' + vout;
    if (this.__PREV_TX_SET[prevTxOut] !== undefined) throw new Error('Duplicate TxOut: ' + prevTxOut);

    let input: TxbInput<TNumber> = {};

    // derive what we can from the scriptSig
    if (options.script !== undefined || options.witness !== undefined) {
      input = expandInput<TNumber>(options.script, options.witness);
    }

    // if an input value was given, retain it
    if (options.value !== undefined) {
      input.value = options.value;
    }

    // derive what we can from the previous transactions output script
    if (!input.prevOutScript && options.prevOutScript) {
      let prevOutType;

      if (!input.pubkeys && !input.signatures) {
        const expanded = expandOutput(options.prevOutScript);
        if (expanded.pubkeys) {
          input.pubkeys = expanded.pubkeys;
          input.signatures = expanded.signatures;
        }

        prevOutType = expanded.type;
      }

      input.prevOutScript = options.prevOutScript;
      input.prevOutType = prevOutType || classify.output(options.prevOutScript);
    }

    const vin = this.__TX.addInput(txHash, vout, options.sequence, options.scriptSig);
    this.__INPUTS[vin] = input;
    this.__PREV_TX_SET[prevTxOut] = true;
    return vin;
  }

  private __build(allowIncomplete?: boolean): Transaction<TNumber> {
    if (!allowIncomplete) {
      if (!this.__TX.ins.length) throw new Error('Transaction has no inputs');
      if (!this.__TX.outs.length) throw new Error('Transaction has no outputs');
    }

    const tx = this.__TX.clone();

    // create script signatures from inputs
    this.__INPUTS.forEach((input, i) => {
      if (!input.prevOutType && !allowIncomplete) throw new Error('Transaction is not complete');

      const result = build<TNumber>(input.prevOutType!, input, allowIncomplete);
      if (!result) {
        if (!allowIncomplete && input.prevOutType === SCRIPT_TYPES.NONSTANDARD) throw new Error('Unknown input type');
        if (!allowIncomplete) throw new Error('Not enough information');
        return;
      }

      if (result.input) {
        tx.setInputScript(i, result.input);
      }
      tx.setWitness(i, result.witness!);
    });

    if (!allowIncomplete) {
      // do not rely on this, its merely a last resort
      if (this.__overMaximumFees(tx.virtualSize())) {
        throw new Error('Transaction has absurd fees');
      }
    }

    return tx;
  }

  private __canModifyInputs(): boolean {
    return this.__INPUTS.every((input) => {
      if (!input.signatures) return true;

      return input.signatures.every((signature) => {
        if (!signature) return true;
        const hashType = signatureHashType(signature);

        // if SIGHASH_ANYONECANPAY is set, signatures would not
        // be invalidated by more inputs
        return (hashType & Transaction.SIGHASH_ANYONECANPAY) !== 0;
      });
    });
  }

  private __needsOutputs(signingHashType: number): boolean {
    if (signingHashType === Transaction.SIGHASH_ALL || signingHashType === Transaction.SIGHASH_DEFAULT) {
      return this.__TX.outs.length === 0;
    }

    // if inputs are being signed with SIGHASH_NONE, we don't strictly need outputs
    // .build() will fail, but .buildIncomplete() is OK
    return (
      this.__TX.outs.length === 0 &&
      this.__INPUTS.some((input) => {
        if (!input.signatures) return false;

        return input.signatures.some((signature) => {
          if (!signature) return false; // no signature, no issue
          const hashType = signatureHashType(signature);
          if (hashType & Transaction.SIGHASH_NONE) return false; // SIGHASH_NONE doesn't care about outputs
          return true; // SIGHASH_* does care
        });
      })
    );
  }

  private __canModifyOutputs(): boolean {
    const nInputs = this.__TX.ins.length;
    const nOutputs = this.__TX.outs.length;

    return this.__INPUTS.every((input) => {
      if (input.signatures === undefined) return true;

      return input.signatures.every((signature) => {
        if (!signature) return true;
        const hashType = signatureHashType(signature);

        const hashTypeMod = hashType & 0x1f;
        if (hashTypeMod === Transaction.SIGHASH_NONE) return true;
        if (hashTypeMod === Transaction.SIGHASH_SINGLE) {
          // if SIGHASH_SINGLE is set, and nInputs > nOutputs
          // some signatures would be invalidated by the addition
          // of more outputs
          return nInputs <= nOutputs;
        }
        return false;
      });
    });
  }

  private __overMaximumFees(bytes: number): boolean {
    // not all inputs will have .value defined
    const incoming = this.__INPUTS.reduce(
      (a, x) => a + (typeof x.value !== 'undefined' ? BigInt(x.value) : BigInt(0)),
      BigInt(0)
    );

    // but all outputs do, and if we have any input value
    // we can immediately determine if the outputs are too small
    const outgoing = this.__TX.outs.reduce((a, x) => a + BigInt((x as TxOutput<TNumber>).value), BigInt(0));
    const fee = incoming - outgoing;
    const feeRate = Number(fee) / bytes; // assume fee fits within number

    return feeRate > this.maximumFeeRate;
  }
}

function expandInput<TNumber extends number | bigint = number>(
  scriptSig?: Buffer,
  witnessStack: Buffer[] = [],
  type?: string,
  scriptPubKey?: Buffer
): TxbInput<TNumber> {
  if (scriptSig && scriptSig.length === 0 && witnessStack.length === 0) return {};
  if (!type) {
    let ssType: string | undefined = scriptSig ? classify.input(scriptSig, true) : undefined;
    let wsType: string | undefined = classify.witness(witnessStack, true);
    if (ssType === SCRIPT_TYPES.NONSTANDARD) ssType = undefined;
    if (wsType === SCRIPT_TYPES.NONSTANDARD) wsType = undefined;
    type = ssType || wsType;
  }

  switch (type) {
    case SCRIPT_TYPES.P2WPKH: {
      const { output, pubkey, signature } = payments.p2wpkh({
        witness: witnessStack,
      });

      return {
        prevOutScript: output,
        prevOutType: SCRIPT_TYPES.P2WPKH,
        pubkeys: [pubkey],
        signatures: [signature],
      };
    }

    case SCRIPT_TYPES.P2PKH: {
      const { output, pubkey, signature } = payments.p2pkh({
        input: scriptSig,
      });

      return {
        prevOutScript: output,
        prevOutType: SCRIPT_TYPES.P2PKH,
        pubkeys: [pubkey],
        signatures: [signature],
      };
    }

    case SCRIPT_TYPES.P2PK: {
      const { signature } = payments.p2pk({ input: scriptSig });

      return {
        prevOutType: SCRIPT_TYPES.P2PK,
        pubkeys: [undefined],
        signatures: [signature],
      };
    }

    case SCRIPT_TYPES.P2MS: {
      const { m, pubkeys, signatures } = payments.p2ms(
        {
          input: scriptSig,
          output: scriptPubKey,
        },
        { allowIncomplete: true }
      );

      return {
        prevOutType: SCRIPT_TYPES.P2MS,
        pubkeys,
        signatures,
        maxSignatures: m,
      };
    }

    case SCRIPT_TYPES.P2TR_NS: {
      const { n, pubkeys, signatures } = p2trPayments.p2tr_ns(
        {
          // Witness signatures are reverse of pubkeys, because it's a stack
          signatures: witnessStack.length ? witnessStack.reverse() : undefined,
          output: scriptPubKey,
        },
        { allowIncomplete: true, eccLib }
      );

      return {
        prevOutType: SCRIPT_TYPES.P2TR_NS,
        pubkeys,
        signatures,
        maxSignatures: n,
      };
    }
  }

  if (type === SCRIPT_TYPES.P2SH) {
    const { output, redeem } = payments.p2sh({
      input: scriptSig,
      witness: witnessStack,
    });

    const outputType = classify.output(redeem!.output!);
    const expanded = expandInput<TNumber>(redeem!.input!, redeem!.witness!, outputType, redeem!.output);
    if (!expanded.prevOutType) return {};

    return {
      prevOutScript: output,
      prevOutType: SCRIPT_TYPES.P2SH,
      redeemScript: redeem!.output,
      redeemScriptType: expanded.prevOutType,
      witnessScript: expanded.witnessScript,
      witnessScriptType: expanded.witnessScriptType,

      pubkeys: expanded.pubkeys,
      signatures: expanded.signatures,
    };
  }

  if (type === SCRIPT_TYPES.P2WSH) {
    const { output, redeem } = payments.p2wsh({
      input: scriptSig,
      witness: witnessStack,
    });
    const outputType = classify.output(redeem!.output!);
    let expanded;
    if (outputType === SCRIPT_TYPES.P2WPKH) {
      expanded = expandInput<TNumber>(redeem!.input!, redeem!.witness!, outputType);
    } else {
      expanded = expandInput<TNumber>(bscript.compile(redeem!.witness!), [], outputType, redeem!.output);
    }
    if (!expanded.prevOutType) return {};

    return {
      prevOutScript: output,
      prevOutType: SCRIPT_TYPES.P2WSH,
      witnessScript: redeem!.output,
      witnessScriptType: expanded.prevOutType,

      pubkeys: expanded.pubkeys,
      signatures: expanded.signatures,
    };
  }

  if (type === SCRIPT_TYPES.P2TR) {
    const parsedWitness = taproot.parseTaprootWitness(witnessStack);
    if (parsedWitness.spendType === 'Key') {
      // key path spend, nothing to expand
      const { signature, annex } = parsedWitness;
      return {
        prevOutType: SCRIPT_TYPES.P2TR,
        signatures: [signature],
        annex,
      };
    } else {
      // script path spend
      const { tapscript, controlBlock, annex } = parsedWitness;
      const prevOutScript = p2trPayments.p2tr(
        {
          redeems: [{ output: tapscript }],
          redeemIndex: 0,
          controlBlock,
          annex,
        },
        { eccLib }
      ).output;
      const witnessScriptType = classify.output(tapscript);
      const { pubkeys, signatures } = expandInput<TNumber>(
        undefined,
        parsedWitness.scriptSig,
        witnessScriptType,
        tapscript
      );

      return {
        prevOutScript,
        prevOutType: SCRIPT_TYPES.P2TR,
        witnessScript: tapscript,
        witnessScriptType,

        controlBlock,
        annex,

        pubkeys,
        signatures,
      };
    }
  }

  return {
    prevOutType: SCRIPT_TYPES.NONSTANDARD,
    prevOutScript: scriptSig,
  };
}

// could be done in expandInput, but requires the original Transaction for hashForSignature
function fixMultisigOrder<TNumber extends number | bigint = number>(
  input: TxbInput<TNumber>,
  transaction: Transaction<TNumber>,
  vin: number,
  prevOutputs?: TxOutput<TNumber>[]
): void {
  if (input.redeemScriptType !== SCRIPT_TYPES.P2MS || !input.redeemScript) return;
  if (input.pubkeys!.length === input.signatures!.length) return;
  const prevOutput = prevOutputs && prevOutputs[vin];

  const unmatched = input.signatures!.concat();

  input.signatures = input.pubkeys!.map((pubKey) => {
    const keyPair = ECPair.fromPublicKey(pubKey!);
    let match: Buffer | undefined;

    // check for a signature
    unmatched.some((signature, i) => {
      // skip if undefined || OP_0
      if (!signature) return false;

      // TODO: avoid O(n) hashForSignature
      const parsed = bscript.signature.decode(signature);
      const hash = transaction.hashForSignature(vin, input.redeemScript!, parsed.hashType, prevOutput?.value);

      // skip if signature does not match pubKey
      if (!keyPair.verify(hash, parsed.signature)) return false;

      // remove matched signature from unmatched
      unmatched[i] = undefined;
      match = signature;

      return true;
    });

    return match;
  });
}

function expandOutput(script: Buffer, ourPubKey?: Buffer, controlBlock?: Buffer): TxbOutput {
  typeforce(types.Buffer, script);
  const type = classify.output(script);

  switch (type) {
    case SCRIPT_TYPES.P2PKH: {
      if (!ourPubKey) return { type };

      // does our hash160(pubKey) match the output scripts?
      const pkh1 = payments.p2pkh({ output: script }).hash;
      const pkh2 = bcrypto.hash160(ourPubKey);
      if (!pkh1!.equals(pkh2)) return { type };

      return {
        type,
        pubkeys: [ourPubKey],
        signatures: [undefined],
      };
    }

    case SCRIPT_TYPES.P2WPKH: {
      if (!ourPubKey) return { type };

      // does our hash160(pubKey) match the output scripts?
      const wpkh1 = payments.p2wpkh({ output: script }).hash;
      const wpkh2 = bcrypto.hash160(ourPubKey);
      if (!wpkh1!.equals(wpkh2)) return { type };

      return {
        type,
        pubkeys: [ourPubKey],
        signatures: [undefined],
      };
    }

    case SCRIPT_TYPES.P2TR: {
      if (!ourPubKey) return { type };
      // HACK ourPubKey to BIP340-style
      if (ourPubKey.length === 33) ourPubKey = ourPubKey.slice(1);
      // TODO: support multiple pubkeys
      const p2tr = p2trPayments.p2tr({ pubkey: ourPubKey, controlBlock }, { eccLib });

      // Does tweaked output for a single pubkey match?
      if (!script.equals(p2tr.output!)) return { type };

      // P2TR KeyPath, single key
      return {
        type,
        pubkeys: [ourPubKey],
        signatures: [undefined],
      };
    }

    case SCRIPT_TYPES.P2TR_NS: {
      const p2trNs = p2trPayments.p2tr_ns({ output: script }, { eccLib });
      // P2TR ScriptPath
      return {
        type,
        pubkeys: p2trNs.pubkeys,
        signatures: p2trNs.pubkeys!.map((): undefined => undefined),
        maxSignatures: p2trNs.pubkeys!.length,
      };
    }

    case SCRIPT_TYPES.P2PK: {
      const p2pk = payments.p2pk({ output: script });
      return {
        type,
        pubkeys: [p2pk.pubkey],
        signatures: [undefined],
      };
    }

    case SCRIPT_TYPES.P2MS: {
      const p2ms = payments.p2ms({ output: script });
      return {
        type,
        pubkeys: p2ms.pubkeys,
        signatures: p2ms.pubkeys!.map((): undefined => undefined),
        maxSignatures: p2ms.m,
      };
    }
  }

  return { type };
}

function prepareInput<TNumber extends number | bigint = number>(
  input: TxbInput<TNumber>,
  ourPubKey: Buffer,
  redeemScript?: Buffer,
  witnessScript?: Buffer,
  controlBlock?: Buffer,
  annex?: Buffer
): TxbInput<TNumber> {
  if (redeemScript && witnessScript) {
    const p2wsh = payments.p2wsh({
      redeem: { output: witnessScript },
    }) as Payment;
    const p2wshAlt = payments.p2wsh({ output: redeemScript }) as Payment;
    const p2sh = payments.p2sh({ redeem: { output: redeemScript } }) as Payment;
    const p2shAlt = payments.p2sh({ redeem: p2wsh }) as Payment;

    // enforces P2SH(P2WSH(...))
    if (!p2wsh.hash!.equals(p2wshAlt.hash!)) throw new Error('Witness script inconsistent with prevOutScript');
    if (!p2sh.hash!.equals(p2shAlt.hash!)) throw new Error('Redeem script inconsistent with prevOutScript');

    const expanded = expandOutput(p2wsh.redeem!.output!, ourPubKey);
    if (!expanded.pubkeys) {
      throw new Error(expanded.type + ' not supported as witnessScript (' + bscript.toASM(witnessScript) + ')');
    }
    if (input.signatures && input.signatures.some((x) => x !== undefined)) {
      expanded.signatures = input.signatures;
    }

    const signScript = witnessScript;
    if (expanded.type === SCRIPT_TYPES.P2WPKH) throw new Error('P2SH(P2WSH(P2WPKH)) is a consensus failure');

    return {
      redeemScript,
      redeemScriptType: SCRIPT_TYPES.P2WSH,

      witnessScript,
      witnessScriptType: expanded.type,

      prevOutType: SCRIPT_TYPES.P2SH,
      prevOutScript: p2sh.output,

      witnessVersion: 0,
      signScript,
      signType: expanded.type,

      pubkeys: expanded.pubkeys,
      signatures: expanded.signatures,
      maxSignatures: expanded.maxSignatures,
    };
  }

  if (redeemScript) {
    const p2sh = payments.p2sh({ redeem: { output: redeemScript } }) as Payment;

    if (input.prevOutScript) {
      let p2shAlt;
      try {
        p2shAlt = payments.p2sh({ output: input.prevOutScript }) as Payment;
      } catch (e) {
        throw new Error('PrevOutScript must be P2SH');
      }
      if (!p2sh.hash!.equals(p2shAlt.hash!)) throw new Error('Redeem script inconsistent with prevOutScript');
    }

    const expanded = expandOutput(p2sh.redeem!.output!, ourPubKey);
    if (!expanded.pubkeys) {
      throw new Error(expanded.type + ' not supported as redeemScript (' + bscript.toASM(redeemScript) + ')');
    }
    if (input.signatures && input.signatures.some((x) => x !== undefined)) {
      expanded.signatures = input.signatures;
    }

    let signScript = redeemScript;
    if (expanded.type === SCRIPT_TYPES.P2WPKH) {
      signScript = payments.p2pkh({ pubkey: expanded.pubkeys[0] }).output!;
    }

    return {
      redeemScript,
      redeemScriptType: expanded.type,

      prevOutType: SCRIPT_TYPES.P2SH,
      prevOutScript: p2sh.output,

      witnessVersion: expanded.type === SCRIPT_TYPES.P2WPKH ? 0 : undefined,
      signScript,
      signType: expanded.type,

      pubkeys: expanded.pubkeys,
      signatures: expanded.signatures,
      maxSignatures: expanded.maxSignatures,
    };
  }

  if (witnessScript && controlBlock) {
    // P2TR ScriptPath
    /* tslint:disable-next-line:no-shadowed-variable */
    let prevOutScript = input.prevOutScript;
    if (!prevOutScript) {
      prevOutScript = p2trPayments.p2tr(
        {
          redeems: [{ output: witnessScript }],
          redeemIndex: 0,
          controlBlock,
          annex,
        },
        { eccLib }
      ).output;
    }

    const expanded = expandOutput(witnessScript, ourPubKey);
    if (!expanded.pubkeys) {
      throw new Error(expanded.type + ' not supported as witnessScript (' + bscript.toASM(witnessScript) + ')');
    }
    if (input.signatures && input.signatures.some((x) => x !== undefined)) {
      expanded.signatures = input.signatures;
    }

    return {
      witnessScript,
      witnessScriptType: expanded.type,

      prevOutType: SCRIPT_TYPES.P2TR,
      prevOutScript,

      witnessVersion: 1,
      signScript: witnessScript,
      signType: expanded.type,

      pubkeys: expanded.pubkeys,
      signatures: expanded.signatures,
      maxSignatures: expanded.maxSignatures,

      controlBlock,
      annex,
    };
  }

  if (witnessScript) {
    const p2wsh = payments.p2wsh({ redeem: { output: witnessScript } });

    if (input.prevOutScript) {
      const p2wshAlt = payments.p2wsh({ output: input.prevOutScript });
      if (!p2wsh.hash!.equals(p2wshAlt.hash!)) throw new Error('Witness script inconsistent with prevOutScript');
    }

    const expanded = expandOutput(p2wsh.redeem!.output!, ourPubKey);
    if (!expanded.pubkeys) {
      throw new Error(expanded.type + ' not supported as witnessScript (' + bscript.toASM(witnessScript) + ')');
    }
    if (input.signatures && input.signatures.some((x) => x !== undefined)) {
      expanded.signatures = input.signatures;
    }

    const signScript = witnessScript;
    if (expanded.type === SCRIPT_TYPES.P2WPKH) throw new Error('P2WSH(P2WPKH) is a consensus failure');

    return {
      witnessScript,
      witnessScriptType: expanded.type,

      prevOutType: SCRIPT_TYPES.P2WSH,
      prevOutScript: p2wsh.output,

      witnessVersion: 0,
      signScript,
      signType: expanded.type,

      pubkeys: expanded.pubkeys,
      signatures: expanded.signatures,
      maxSignatures: expanded.maxSignatures,
    };
  }

  if (input.prevOutType && input.prevOutScript) {
    // embedded scripts are not possible without extra information
    if (input.prevOutType === SCRIPT_TYPES.P2SH) {
      throw new Error('PrevOutScript is ' + input.prevOutType + ', requires redeemScript');
    }
    if (input.prevOutType === SCRIPT_TYPES.P2WSH) {
      throw new Error('PrevOutScript is ' + input.prevOutType + ', requires witnessScript');
    }

    const expanded = expandOutput(input.prevOutScript, ourPubKey);
    if (!expanded.pubkeys) {
      throw new Error(expanded.type + ' not supported (' + bscript.toASM(input.prevOutScript) + ')');
    }
    if (input.signatures && input.signatures.some((x) => x !== undefined)) {
      expanded.signatures = input.signatures;
    }

    let signScript = input.prevOutScript;
    if (expanded.type === SCRIPT_TYPES.P2WPKH) {
      signScript = payments.p2pkh({ pubkey: expanded.pubkeys[0] }).output as Buffer;
    }

    let witnessVersion;
    if (expanded.type === SCRIPT_TYPES.P2WPKH) {
      witnessVersion = 0;
    } else if (expanded.type === SCRIPT_TYPES.P2TR) {
      witnessVersion = 1;
    }

    return {
      prevOutType: expanded.type,
      prevOutScript: input.prevOutScript,

      witnessVersion,
      signScript,
      signType: expanded.type,

      pubkeys: expanded.pubkeys,
      signatures: expanded.signatures,
      maxSignatures: expanded.maxSignatures,
    };
  }

  const prevOutScript = payments.p2pkh({ pubkey: ourPubKey }).output;
  return {
    prevOutType: SCRIPT_TYPES.P2PKH,
    prevOutScript,

    signScript: prevOutScript,
    signType: SCRIPT_TYPES.P2PKH,

    pubkeys: [ourPubKey],
    signatures: [undefined],
  };
}

function build<TNumber extends number | bigint = number>(
  type: string,
  input: TxbInput<TNumber>,
  allowIncomplete?: boolean
): Payment | undefined {
  const pubkeys = (input.pubkeys || []) as Buffer[];
  let signatures = (input.signatures || []) as Buffer[];

  switch (type) {
    case SCRIPT_TYPES.P2PKH: {
      if (pubkeys.length === 0) break;
      if (signatures.length === 0) break;

      return payments.p2pkh({ pubkey: pubkeys[0], signature: signatures[0] });
    }
    case SCRIPT_TYPES.P2WPKH: {
      if (pubkeys.length === 0) break;
      if (signatures.length === 0) break;

      return payments.p2wpkh({ pubkey: pubkeys[0], signature: signatures[0] });
    }
    case SCRIPT_TYPES.P2PK: {
      if (pubkeys.length === 0) break;
      if (signatures.length === 0) break;

      return payments.p2pk({ signature: signatures[0] });
    }
    case SCRIPT_TYPES.P2MS: {
      const m = input.maxSignatures;
      if (allowIncomplete) {
        signatures = signatures.map((x) => x || ops.OP_0);
      } else {
        signatures = signatures.filter((x) => x);
      }

      // if the transaction is not not complete (complete), or if signatures.length === m, validate
      // otherwise, the number of OP_0's may be >= m, so don't validate (boo)
      const validate = !allowIncomplete || m === signatures.length;
      return payments.p2ms({ m, pubkeys, signatures }, { allowIncomplete, validate });
    }
    case SCRIPT_TYPES.P2SH: {
      const redeem = build<TNumber>(input.redeemScriptType!, input, allowIncomplete);
      if (!redeem) return;

      return payments.p2sh({
        redeem: {
          output: redeem.output || input.redeemScript,
          input: redeem.input,
          witness: redeem.witness,
        },
      });
    }
    case SCRIPT_TYPES.P2WSH: {
      const redeem = build<TNumber>(input.witnessScriptType!, input, allowIncomplete);
      if (!redeem) return;

      return payments.p2wsh({
        redeem: {
          output: input.witnessScript,
          input: redeem.input,
          witness: redeem.witness,
        },
      });
    }
    case SCRIPT_TYPES.P2TR: {
      if (input.witnessScriptType === SCRIPT_TYPES.P2TR_NS) {
        // ScriptPath
        const redeem = build<TNumber>(input.witnessScriptType!, input, allowIncomplete);
        return p2trPayments.p2tr(
          {
            output: input.prevOutScript,
            controlBlock: input.controlBlock,
            annex: input.annex,
            redeems: [redeem!],
            redeemIndex: 0,
          },
          { eccLib }
        );
      }

      // KeyPath
      if (signatures.length === 0) break;

      return p2trPayments.p2tr({ pubkeys, signature: signatures[0] }, { eccLib });
    }
    case SCRIPT_TYPES.P2TR_NS: {
      const m = input.maxSignatures;
      if (allowIncomplete) {
        signatures = signatures.map((x) => x || ops.OP_0);
      } else {
        signatures = signatures.filter((x) => x);
      }

      // if the transaction is not not complete (complete), or if signatures.length === m, validate
      // otherwise, the number of OP_0's may be >= m, so don't validate (boo)
      const validate = !allowIncomplete || m === signatures.length;
      return p2trPayments.p2tr_ns({ pubkeys, signatures }, { allowIncomplete, validate, eccLib });
    }
  }
}

function canSign<TNumber extends number | bigint = number>(input: TxbInput<TNumber>): boolean {
  return (
    input.signScript !== undefined &&
    input.signType !== undefined &&
    input.pubkeys !== undefined &&
    input.signatures !== undefined &&
    input.signatures.length === input.pubkeys.length &&
    input.pubkeys.length > 0 &&
    (input.witnessVersion === undefined || input.value !== undefined)
  );
}

function signatureHashType(buffer: Buffer): number {
  if (bscript.isCanonicalSchnorrSignature(buffer) && buffer.length === 64) {
    return Transaction.SIGHASH_DEFAULT;
  }
  return buffer.readUInt8(buffer.length - 1);
}

function checkSignArgs<TNumber extends number | bigint = number>(
  inputs: Array<TxbInput<TNumber>>,
  signParams: TxbSignArg<TNumber>
): void {
  if (!PREVOUT_TYPES.has(signParams.prevOutScriptType)) {
    throw new TypeError(`Unknown prevOutScriptType "${signParams.prevOutScriptType}"`);
  }
  tfMessage(typeforce.Number, signParams.vin, `sign must include vin parameter as Number (input index)`);
  tfMessage(tfFullSigner, signParams.keyPair, `sign must include keyPair parameter as Signer interface`);
  tfMessage(typeforce.maybe(typeforce.Number), signParams.hashType, `sign hashType parameter must be a number`);
  const prevOutType = (inputs[signParams.vin] || []).prevOutType;
  const posType = signParams.prevOutScriptType;
  switch (posType) {
    case 'p2pkh':
      if (prevOutType && prevOutType !== 'pubkeyhash') {
        throw new TypeError(`input #${signParams.vin} is not of type p2pkh: ${prevOutType}`);
      }
      tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
      tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
      tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
      break;
    case 'p2pk':
      if (prevOutType && prevOutType !== 'pubkey') {
        throw new TypeError(`input #${signParams.vin} is not of type p2pk: ${prevOutType}`);
      }
      tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
      tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
      tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
      break;
    case 'p2wpkh':
      if (prevOutType && prevOutType !== 'witnesspubkeyhash') {
        throw new TypeError(`input #${signParams.vin} is not of type p2wpkh: ${prevOutType}`);
      }
      tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
      tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
      tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessValue`);
      break;
    case 'p2ms':
      if (prevOutType && prevOutType !== 'multisig') {
        throw new TypeError(`input #${signParams.vin} is not of type p2ms: ${prevOutType}`);
      }
      tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
      tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
      tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
      break;
    case 'p2sh-p2wpkh':
      if (prevOutType && prevOutType !== 'scripthash') {
        throw new TypeError(`input #${signParams.vin} is not of type p2sh-p2wpkh: ${prevOutType}`);
      }
      tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
      tfMessage(typeforce.Buffer, signParams.redeemScript, `${posType} requires redeemScript`);
      tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessValue`);
      break;
    case 'p2sh-p2ms':
    case 'p2sh-p2pk':
    case 'p2sh-p2pkh':
      if (prevOutType && prevOutType !== 'scripthash') {
        throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
      }
      tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
      tfMessage(typeforce.Buffer, signParams.redeemScript, `${posType} requires redeemScript`);
      tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
      break;
    case 'p2wsh-p2ms':
    case 'p2wsh-p2pk':
    case 'p2wsh-p2pkh':
      if (prevOutType && prevOutType !== 'witnessscripthash') {
        throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
      }
      tfMessage(typeforce.Buffer, signParams.witnessScript, `${posType} requires witnessScript`);
      tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
      tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessValue`);
      break;
    case 'p2sh-p2wsh-p2ms':
    case 'p2sh-p2wsh-p2pk':
    case 'p2sh-p2wsh-p2pkh':
      if (prevOutType && prevOutType !== 'scripthash') {
        throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
      }
      tfMessage(typeforce.Buffer, signParams.witnessScript, `${posType} requires witnessScript`);
      tfMessage(typeforce.Buffer, signParams.redeemScript, `${posType} requires witnessScript`);
      tfMessage(types.Satoshi, signParams.witnessValue, `${posType} requires witnessScript`);
      break;
    case 'p2tr':
      if (prevOutType && prevOutType !== 'taproot') {
        throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
      }
      tfMessage(typeforce.value(undefined), signParams.witnessScript, `${posType} requires NO witnessScript`);
      tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
      tfMessage(typeforce.value(undefined), signParams.witnessValue, `${posType} requires NO witnessValue`);
      break;
    case 'p2tr-p2ns':
      if (prevOutType && prevOutType !== 'taproot') {
        throw new TypeError(`input #${signParams.vin} is not of type ${posType}: ${prevOutType}`);
      }
      inputs[signParams.vin].prevOutType = inputs[signParams.vin].prevOutType || 'taproot';
      tfMessage(typeforce.Buffer, signParams.witnessScript, `${posType} requires witnessScript`);
      tfMessage(typeforce.Buffer, signParams.controlBlock, `${posType} requires controlBlock`);
      tfMessage(typeforce.value(undefined), signParams.redeemScript, `${posType} requires NO redeemScript`);
      break;
  }
}

function trySign<TNumber extends number | bigint = number>({
  input,
  ourPubKey,
  keyPair,
  signatureHash,
  hashType,
  useLowR,
  taptreeRoot,
}: SigningData<TNumber>): void {
  if (input.witnessVersion === 1 && ourPubKey.length === 33) ourPubKey = ourPubKey.slice(1);
  // enforce in order signing of public keys
  let signed = false;
  for (const [i, pubKey] of input.pubkeys!.entries()) {
    if (!ourPubKey.equals(pubKey!)) continue;
    if (input.signatures![i] && input.signatures![i]!.length > 0) throw new Error('Signature already exists');

    // TODO: add tests
    if (ourPubKey.length !== 33 && input.witnessVersion === 0) {
      throw new Error('BIP143 (Witness v0) inputs require compressed pubkeys');
    } else if (ourPubKey.length !== 32 && input.witnessVersion === 1) {
      throw new Error('BIP341 (Witness v1) inputs require x-only pubkeys');
    }

    if (input.witnessVersion === 1) {
      if (!input.witnessScript) {
        // FIXME: Workaround for not having proper tweaking support for key path
        if (!keyPair.privateKey) {
          throw new Error(`unexpected keypair`);
        }
        const privateKey = taproot.tapTweakPrivkey(eccLib, ourPubKey, keyPair.privateKey, taptreeRoot);
        keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey));
      }
      // https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#common-signature-message
      const signature = keyPair.signSchnorr(signatureHash);
      // SIGHASH_DEFAULT is omitted from the signature
      if (hashType === Transaction.SIGHASH_DEFAULT) {
        input.signatures![i] = Buffer.from(signature);
      } else {
        input.signatures![i] = Buffer.concat([signature, Buffer.of(hashType)]);
      }
    } else {
      const signature = keyPair.sign(signatureHash, useLowR);
      input.signatures![i] = bscript.signature.encode(signature, hashType);
    }
    signed = true;
  }

  if (!signed) throw new Error('Key pair cannot sign for this input');
}

interface SigningData<TNumber extends number | bigint = number> {
  input: TxbInput<TNumber>;
  ourPubKey: Buffer;
  keyPair: Signer;
  signatureHash: Buffer;
  hashType: number;
  useLowR: boolean;
  taptreeRoot?: Buffer;
}

type HashTypeCheck = (hashType: number) => boolean;

function getSigningData<TNumber extends number | bigint = number>(
  network: Network,
  inputs: Array<TxbInput<TNumber>>,
  needsOutputs: HashTypeCheck,
  tx: Transaction<TNumber>,
  signParams: number | TxbSignArg<TNumber>,
  keyPair?: Signer,
  redeemScript?: Buffer,
  hashType?: number,
  witnessValue?: TNumber,
  witnessScript?: Buffer,
  controlBlock?: Buffer,
  annex?: Buffer,
  useLowR?: boolean
): SigningData<TNumber> {
  let vin: number;
  if (typeof signParams === 'number') {
    console.warn(
      'DEPRECATED: TransactionBuilder sign method arguments ' + 'will change in v6, please use the TxbSignArg interface'
    );
    vin = signParams;
  } else if (typeof signParams === 'object') {
    checkSignArgs<TNumber>(inputs, signParams);
    ({ vin, keyPair, redeemScript, hashType, witnessValue, witnessScript, controlBlock, annex } = signParams);
  } else {
    throw new TypeError('TransactionBuilder sign first arg must be TxbSignArg or number');
  }
  if (keyPair === undefined) {
    throw new Error('sign requires keypair');
  }
  if (!inputs[vin]) throw new Error('No input at index: ' + vin);

  const input = inputs[vin];

  // if redeemScript was previously provided, enforce consistency
  if (input.redeemScript !== undefined && redeemScript && !input.redeemScript.equals(redeemScript)) {
    throw new Error('Inconsistent redeemScript');
  }

  const ourPubKey = keyPair.publicKey || (keyPair.getPublicKey && keyPair.getPublicKey());
  if (!canSign<TNumber>(input)) {
    if (witnessValue !== undefined) {
      if (input.value !== undefined && input.value !== witnessValue) {
        throw new Error('Input did not match witnessValue');
      }
      typeforce(types.Satoshi, witnessValue);
      input.value = witnessValue;
    }

    if (!canSign<TNumber>(input)) {
      const prepared = prepareInput<TNumber>(input, ourPubKey, redeemScript, witnessScript, controlBlock, annex);

      // updates inline
      Object.assign(input, prepared);
    }

    if (!canSign<TNumber>(input)) throw Error(input.prevOutType + ' not supported');
  }

  // hashType can be 0 in Taproot, so can't use hashType || SIGHASH_ALL
  if (input.witnessVersion === 1) {
    hashType = hashType === undefined ? Transaction.SIGHASH_DEFAULT : hashType;
  } else {
    hashType = hashType || Transaction.SIGHASH_ALL;
  }
  if (needsOutputs(hashType)) throw new Error('Transaction needs outputs');

  // TODO: This is not the best place to do this, but might stick with it until PSBT
  let leafHash;
  let taptreeRoot;
  if (controlBlock && witnessScript) {
    leafHash = taproot.getTapleafHash(eccLib, controlBlock, witnessScript);
    taptreeRoot = taproot.getTaptreeRoot(eccLib, controlBlock, witnessScript, leafHash);
  }

  // ready to sign
  let signatureHash: Buffer;
  switch (input.witnessVersion) {
    case undefined:
      signatureHash = tx.hashForSignature(vin, input.signScript as Buffer, hashType, input.value);
      break;
    case 0:
      signatureHash = tx.hashForWitnessV0(vin, input.signScript as Buffer, input.value as TNumber, hashType);
      break;
    case 1:
      signatureHash = tx.hashForWitnessV1(
        vin,
        inputs.map(({ prevOutScript }) => prevOutScript as Buffer),
        inputs.map(({ value }) => value as TNumber),
        hashType,
        leafHash
      );
      break;
    default:
      throw new TypeError('Unsupported witness version');
  }

  return {
    input,
    ourPubKey,
    keyPair,
    signatureHash,
    hashType,
    useLowR: !!useLowR,
    taptreeRoot,
  };
}
