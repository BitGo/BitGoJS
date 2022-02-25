import * as opcodes from 'bitcoin-ops';
import * as bip32 from 'bip32';

import { payments, script, Transaction, TxInput, taproot, TxOutput, ScriptSignature } from 'bitcoinjs-lib';

import { UtxoTransaction } from './UtxoTransaction';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import {
  createOutputScript2of3,
  createOutputScriptP2shP2pk,
  createSpendScriptP2tr,
  ScriptType,
  ScriptType2Of3,
  scriptType2Of3AsPrevOutType,
} from './outputScripts';
import { isTriple, Triple } from './types';
import { classify } from '../';
import { getMainnet, Network, networks } from '../networks';
import { ECPair, ecc as eccLib } from '../noble_ecc';

const inputTypes = [
  'multisig',
  'nonstandard',
  'nulldata',
  'pubkey',
  'pubkeyhash',
  'scripthash',
  'witnesspubkeyhash',
  'witnessscripthash',
  'taproot',
  'taprootnofn',
  'witnesscommitment',
] as const;

type InputType = typeof inputTypes[number];

export function isPlaceholderSignature(v: number | Buffer): boolean {
  if (Buffer.isBuffer(v)) {
    return v.length === 0;
  }
  return v === 0;
}

export interface ParsedSignatureScript {
  scriptType: ScriptType | 'p2pkh' | undefined;
  isSegwitInput: boolean;
  inputClassification: InputType;
  p2shOutputClassification?: string;
}

export interface ParsedSignatureScriptUnknown extends ParsedSignatureScript {
  scriptType: undefined;
}

export interface ParsedSignatureScriptP2PK extends ParsedSignatureScript {
  scriptType: 'p2shP2pk';
  inputClassification: 'scripthash';
}

export interface ParsedSignatureScriptP2PKH extends ParsedSignatureScript {
  scriptType: 'p2pkh';
  inputClassification: 'pubkeyhash';
  signatures: [Buffer];
  publicKeys: [Buffer];
  pubScript?: Buffer;
}

export interface ParsedSignatureScript2Of3 extends ParsedSignatureScript {
  scriptType: 'p2sh' | 'p2shP2wsh' | 'p2wsh';
  inputClassification: 'scripthash' | 'witnessscripthash';
  publicKeys: [Buffer, Buffer, Buffer];
  signatures:
    | [Buffer, Buffer] // fully-signed transactions with signatures
    /* Partially signed transactions with placeholder signatures.
       For p2sh, the placeholder is OP_0 (number 0) */
    | [Buffer | 0, Buffer | 0, Buffer | 0];
  pubScript: Buffer;
}

export interface ParsedSignatureScriptTaproot extends ParsedSignatureScript {
  scriptType: 'p2tr';
  inputClassification: 'taproot';
  // P2TR tapscript spends are for keypath spends or 2-of-2 multisig scripts
  // A single signature indicates a keypath spend.
  // Two signatures indicate a scriptPath spend.
  publicKeys: [Buffer] | [Buffer, Buffer];
  signatures: [Buffer] | [Buffer, Buffer];
  // For scriptpath signatures, this contains the control block data. For keypath signatures this is undefined.
  controlBlock: Buffer | undefined;
  // For scriptpath signatures, this indicates the level inside the taptree. For keypath signatures this is undefined.
  scriptPathLevel: number | undefined;
  pubScript: Buffer;
}

export function getDefaultSigHash(network: Network, scriptType?: ScriptType2Of3): number {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
      return Transaction.SIGHASH_ALL | UtxoTransaction.SIGHASH_FORKID;
    default:
      return scriptType === 'p2tr' ? Transaction.SIGHASH_DEFAULT : Transaction.SIGHASH_ALL;
  }
}

/**
 * Parse a transaction's signature script to obtain public keys, signatures, the sig script,
 * and other properties.
 *
 * Only supports script types used in BitGo transactions.
 *
 * @param input
 * @returns ParsedSignatureScript
 */
export function parseSignatureScript(
  input: TxInput
):
  | ParsedSignatureScriptUnknown
  | ParsedSignatureScriptP2PK
  | ParsedSignatureScriptP2PKH
  | ParsedSignatureScript2Of3
  | ParsedSignatureScriptTaproot {
  const isSegwitInput = input.witness.length > 0;
  const isNativeSegwitInput = input.script.length === 0;
  let decompiledSigScript: Array<Buffer | number> | null;
  let inputClassification: InputType;
  if (isSegwitInput) {
    // The decompiledSigScript is the script containing the signatures, public keys, and the script that was committed
    // to (pubScript). If this is a segwit input the decompiledSigScript is in the witness, regardless of whether it
    // is native or not. The inputClassification is determined based on whether or not the input is native to give an
    // accurate classification. Note that p2shP2wsh inputs will be classified as p2sh and not p2wsh.
    decompiledSigScript = input.witness;
    if (isNativeSegwitInput) {
      inputClassification = classify.witness(decompiledSigScript as Buffer[], true) as InputType;
    } else {
      inputClassification = classify.input(input.script, true) as InputType;
    }
  } else {
    inputClassification = classify.input(input.script, true) as InputType;
    decompiledSigScript = script.decompile(input.script);
  }

  if (!decompiledSigScript) {
    return { scriptType: undefined, isSegwitInput, inputClassification };
  }

  if (inputClassification === 'pubkeyhash') {
    /* istanbul ignore next */
    if (!decompiledSigScript || decompiledSigScript.length !== 2) {
      throw new Error('unexpected signature for p2pkh');
    }
    const [signature, publicKey] = decompiledSigScript;
    /* istanbul ignore next */
    if (!Buffer.isBuffer(signature) || !Buffer.isBuffer(publicKey)) {
      throw new Error('unexpected signature for p2pkh');
    }
    const publicKeys: [Buffer] = [publicKey];
    const signatures: [Buffer] = [signature];
    const pubScript = payments.p2pkh({ pubkey: publicKey }).output;

    return {
      scriptType: 'p2pkh',
      isSegwitInput,
      inputClassification,
      signatures,
      publicKeys,
      pubScript,
    };
  }

  if (inputClassification === 'taproot') {
    // assumes no annex
    if (input.witness.length !== 4) {
      throw new Error(`unrecognized taproot input`);
    }
    const [sig1, sig2, tapscript, controlBlock] = input.witness;
    const tapscriptClassification = classify.output(tapscript);
    if (tapscriptClassification !== 'taprootnofn') {
      throw new Error(`tapscript must be n of n multisig`);
    }

    const publicKeys = payments.p2tr_ns({ output: tapscript }, { eccLib }).pubkeys;
    if (!publicKeys || publicKeys.length !== 2) {
      throw new Error('expected 2 pubkeys');
    }

    const signatures = [sig1, sig2].map((b) => {
      if (Buffer.isBuffer(b)) {
        return b;
      }
      throw new Error(`unexpected signature element ${b}`);
    }) as [Buffer, Buffer];

    const scriptPathLevel = controlBlock.length === 65 ? 1 : controlBlock.length === 97 ? 2 : undefined;

    /* istanbul ignore next */
    if (scriptPathLevel === undefined) {
      throw new Error(`unexpected control block length ${controlBlock.length}`);
    }

    return {
      scriptType: 'p2tr',
      isSegwitInput,
      inputClassification,
      publicKeys: publicKeys as [Buffer, Buffer],
      signatures,
      pubScript: tapscript,
      controlBlock,
      scriptPathLevel,
    };
  }

  // Note the assumption here that if we have a p2sh or p2wsh input it will be multisig (appropriate because the
  // BitGo platform only supports multisig within these types of inputs, with the exception of replay protection inputs,
  // which are single signature p2sh). Signatures are all but the last entry in the decompiledSigScript.
  // The redeemScript/witnessScript (depending on which type of input this is) is the last entry in
  // the decompiledSigScript (denoted here as the pubScript). The public keys are the second through
  // antepenultimate entries in the decompiledPubScript. See below for a visual representation of the typical 2-of-3
  // multisig setup:
  //
  //   decompiledSigScript = 0 <sig1> <sig2> [<sig3>] <pubScript>
  //   decompiledPubScript = 2 <pub1> <pub2> <pub3> 3 OP_CHECKMULTISIG
  //
  // Transactions built with `.build()` only have two signatures `<sig1>` and `<sig2>` in _decompiledSigScript_.
  // Transactions built with `.buildIncomplete()` have three signatures, where missing signatures are substituted with `OP_0`.
  if (inputClassification !== 'scripthash' && inputClassification !== 'witnessscripthash') {
    return { scriptType: undefined, isSegwitInput, inputClassification };
  }

  const pubScript = decompiledSigScript[decompiledSigScript.length - 1];
  /* istanbul ignore next */
  if (!Buffer.isBuffer(pubScript)) {
    throw new Error(`invalid pubScript`);
  }

  const p2shOutputClassification = classify.output(pubScript);

  if (inputClassification === 'scripthash' && p2shOutputClassification === 'pubkey') {
    return {
      scriptType: 'p2shP2pk',
      isSegwitInput,
      inputClassification,
      p2shOutputClassification,
    };
  }

  if (p2shOutputClassification !== 'multisig') {
    return {
      scriptType: undefined,
      isSegwitInput,
      inputClassification,
      p2shOutputClassification,
    };
  }

  const decompiledPubScript = script.decompile(pubScript);
  if (decompiledPubScript === null) {
    /* istanbul ignore next */
    throw new Error(`could not decompile pubScript`);
  }

  const expectedScriptLength =
    // complete transactions with 2 signatures
    decompiledSigScript.length === 4 ||
    // incomplete transaction with 3 signatures or signature placeholders
    decompiledSigScript.length === 5;

  if (!expectedScriptLength) {
    return { scriptType: undefined, isSegwitInput, inputClassification };
  }

  if (isSegwitInput) {
    /* istanbul ignore next */
    if (!Buffer.isBuffer(decompiledSigScript[0])) {
      throw new Error(`expected decompiledSigScript[0] to be a buffer for segwit inputs`);
    }
    /* istanbul ignore next */
    if (decompiledSigScript[0].length !== 0) {
      throw new Error(`witness stack expected to start with empty buffer`);
    }
  } else if (decompiledSigScript[0] !== opcodes.OP_0) {
    throw new Error(`sigScript expected to start with OP_0`);
  }

  const signatures = decompiledSigScript.slice(1 /* ignore leading OP_0 */, -1 /* ignore trailing pubScript */);
  /* istanbul ignore next */
  if (signatures.length !== 2 && signatures.length !== 3) {
    throw new Error(`expected 2 or 3 signatures, got ${signatures.length}`);
  }

  /* istanbul ignore next */
  if (decompiledPubScript.length !== 6) {
    throw new Error(`unexpected decompiledPubScript length`);
  }
  const publicKeys = decompiledPubScript.slice(1, -2) as Buffer[];
  publicKeys.forEach((b) => {
    /* istanbul ignore next */
    if (!Buffer.isBuffer(b)) {
      throw new Error();
    }
  });
  if (!isTriple(publicKeys)) {
    /* istanbul ignore next */
    throw new Error(`expected 3 public keys, got ${publicKeys.length}`);
  }

  // Op codes 81 through 96 represent numbers 1 through 16 (see https://en.bitcoin.it/wiki/Script#Opcodes), which is
  // why we subtract by 80 to get the number of signatures (n) and the number of public keys (m) in an n-of-m setup.
  const len = decompiledPubScript.length;
  const signatureThreshold = (decompiledPubScript[0] as number) - 80;
  /* istanbul ignore next */
  if (signatureThreshold !== 2) {
    throw new Error(`expected signatureThreshold 2, got ${signatureThreshold}`);
  }
  const nPubKeys = (decompiledPubScript[len - 2] as number) - 80;
  /* istanbul ignore next */
  if (nPubKeys !== 3) {
    throw new Error(`expected nPubKeys 3, got ${nPubKeys}`);
  }

  const lastOpCode = decompiledPubScript[len - 1];
  /* istanbul ignore next */
  if (lastOpCode !== opcodes.OP_CHECKMULTISIG) {
    throw new Error(`expected opcode #${opcodes.OP_CHECKMULTISIG}, got opcode #${lastOpCode}`);
  }

  const scriptType = input.witness.length
    ? input.script.length
      ? 'p2shP2wsh'
      : 'p2wsh'
    : input.script.length
    ? 'p2sh'
    : undefined;
  if (scriptType === undefined) {
    throw new Error('illegal state');
  }

  return {
    scriptType,
    isSegwitInput,
    inputClassification,
    p2shOutputClassification,
    signatures: signatures.map((b) => {
      if (Buffer.isBuffer(b) || b === 0) {
        return b;
      }
      throw new Error(`unexpected signature element ${b}`);
    }) as [Buffer, Buffer] | [Buffer, Buffer, Buffer],
    publicKeys,
    pubScript,
  };
}

export function parseSignatureScript2Of3(input: TxInput): ParsedSignatureScript2Of3 | ParsedSignatureScriptTaproot {
  const result = parseSignatureScript(input) as ParsedSignatureScript2Of3;

  if (
    ![classify.types.P2WSH, classify.types.P2SH, classify.types.P2PKH, classify.types.P2TR].includes(
      result.inputClassification
    )
  ) {
    throw new Error(`unexpected inputClassification ${result.inputClassification}`);
  }
  if (!result.signatures) {
    throw new Error(`missing signatures`);
  }
  if (
    result.publicKeys.length !== 3 &&
    (result.publicKeys.length !== 2 || result.inputClassification !== classify.types.P2TR)
  ) {
    throw new Error(`unexpected pubkey count`);
  }
  if (!result.pubScript || result.pubScript.length === 0) {
    throw new Error(`pubScript missing or empty`);
  }

  return result;
}

/**
 * Constraints for signature verifications.
 * Parameters are conjunctive: if multiple parameters are set, a verification for an individual
 * signature must satisfy all of them.
 */
export type VerificationSettings = {
  /**
   * The index of the signature to verify. Only iterates over non-empty signatures.
   */
  signatureIndex?: number;
  /**
   * The public key to verify.
   */
  publicKey?: Buffer;
};

/**
 * Result for a individual signature verification
 */
export type SignatureVerification = {
  /** Set to the public key that signed for the signature */
  signedBy: Buffer | undefined;
};

/**
 * @deprecated - use {@see verifySignaturesWithPublicKeys} instead
 * Get signature verifications for multsig transaction
 * @param transaction
 * @param inputIndex
 * @param amount - must be set for segwit transactions and BIP143 transactions
 * @param verificationSettings
 * @param prevOutputs - must be set for p2tr transactions
 * @returns SignatureVerification[] - in order of parsed non-empty signatures
 */
export function getSignatureVerifications(
  transaction: UtxoTransaction,
  inputIndex: number,
  amount: number,
  verificationSettings: VerificationSettings = {},
  prevOutputs?: TxOutput[]
): SignatureVerification[] {
  /* istanbul ignore next */
  if (!transaction.ins) {
    throw new Error(`invalid transaction`);
  }

  const input = transaction.ins[inputIndex];
  /* istanbul ignore next */
  if (!input) {
    throw new Error(`no input at index ${inputIndex}`);
  }

  if ((!input.script || input.script.length === 0) && input.witness.length === 0) {
    // Unsigned input: no signatures.
    return [];
  }

  const parsedScript = parseSignatureScript2Of3(input);

  const signatures = parsedScript.signatures
    .filter((s) => s && s.length)
    .filter((s, i) => verificationSettings.signatureIndex === undefined || verificationSettings.signatureIndex === i);

  const publicKeys = parsedScript.publicKeys.filter(
    (buf) =>
      verificationSettings.publicKey === undefined ||
      verificationSettings.publicKey.equals(buf) ||
      verificationSettings.publicKey.slice(1).equals(buf)
  );

  return signatures.map((signatureBuffer) => {
    if (signatureBuffer === 0 || signatureBuffer.length === 0) {
      return { signedBy: undefined };
    }

    let hashType = Transaction.SIGHASH_DEFAULT;

    if (signatureBuffer.length === 65) {
      hashType = signatureBuffer[signatureBuffer.length - 1];
      signatureBuffer = signatureBuffer.slice(0, -1);
    }

    if (parsedScript.inputClassification === classify.types.P2TR) {
      if (verificationSettings.signatureIndex !== undefined) {
        throw new Error(`signatureIndex parameter not supported for p2tr`);
      }

      if (!prevOutputs) {
        throw new Error(`prevOutputs not set`);
      }

      if (prevOutputs.length !== transaction.ins.length) {
        throw new Error(`prevOutputs length ${prevOutputs.length}, expected ${transaction.ins.length}`);
      }

      const { controlBlock, pubScript } = parsedScript as ParsedSignatureScriptTaproot;
      if (!controlBlock) {
        throw new Error('expected controlBlock');
      }
      const leafHash = taproot.getTapleafHash(eccLib, controlBlock, pubScript);
      const signatureHash = transaction.hashForWitnessV1(
        inputIndex,
        prevOutputs.map(({ script }) => script),
        prevOutputs.map(({ value }) => value),
        hashType,
        leafHash
      );

      const signedBy = publicKeys.filter(
        (k) => Buffer.isBuffer(signatureBuffer) && eccLib.verifySchnorr(signatureHash, k, signatureBuffer)
      );

      if (signedBy.length === 0) {
        return { signedBy: undefined };
      }
      if (signedBy.length === 1) {
        return { signedBy: signedBy[0] };
      }
      throw new Error(`illegal state: signed by multiple public keys`);
    } else {
      // slice the last byte from the signature hash input because it's the hash type
      const { signature, hashType } = ScriptSignature.decode(signatureBuffer);
      const transactionHash = parsedScript.isSegwitInput
        ? transaction.hashForWitnessV0(inputIndex, parsedScript.pubScript, amount, hashType)
        : transaction.hashForSignatureByNetwork(inputIndex, parsedScript.pubScript, amount, hashType);
      const signedBy = publicKeys.filter((publicKey) =>
        eccLib.verify(
          transactionHash,
          publicKey,
          signature,
          /*
            Strict verification (require lower-S value), as required by BIP-0146
            https://github.com/bitcoin/bips/blob/master/bip-0146.mediawiki
            https://github.com/bitcoin-core/secp256k1/blob/ac83be33/include/secp256k1.h#L478-L508
            https://github.com/bitcoinjs/tiny-secp256k1/blob/v1.1.6/js.js#L231-L233
          */
          true
        )
      );

      if (signedBy.length === 0) {
        return { signedBy: undefined };
      }
      if (signedBy.length === 1) {
        return { signedBy: signedBy[0] };
      }
      throw new Error(`illegal state: signed by multiple public keys`);
    }
  });
}

/**
 * @deprecated use {@see verifySignatureWithPublicKeys} instead
 * @param transaction
 * @param inputIndex
 * @param amount
 * @param verificationSettings - if publicKey is specified, returns true iff any signature is signed by publicKey.
 * @param prevOutputs - must be set for p2tr transactions
 */
export function verifySignature(
  transaction: UtxoTransaction,
  inputIndex: number,
  amount: number,
  verificationSettings: VerificationSettings = {},
  prevOutputs?: TxOutput[]
): boolean {
  const signatureVerifications = getSignatureVerifications(
    transaction,
    inputIndex,
    amount,
    verificationSettings,
    prevOutputs
  ).filter(
    (v) =>
      // If no publicKey is set in verificationSettings, all signatures must be valid.
      // Otherwise, a single valid signature by the specified pubkey is sufficient.
      verificationSettings.publicKey === undefined ||
      (v.signedBy !== undefined &&
        (verificationSettings.publicKey.equals(v.signedBy) ||
          verificationSettings.publicKey.slice(1).equals(v.signedBy)))
  );

  return signatureVerifications.length > 0 && signatureVerifications.every((v) => v.signedBy !== undefined);
}

/**
 * @param v
 * @param publicKey
 * @return true iff signature is by publicKey (or xonly variant of publicKey)
 */
function isSignatureByPublicKey(v: SignatureVerification, publicKey: Buffer): boolean {
  return (
    !!v.signedBy &&
    (v.signedBy.equals(publicKey) ||
      /* for p2tr signatures, we pass the pubkey in 33-byte format recover it from the signature in 32-byte format */
      (publicKey.length === 33 && isSignatureByPublicKey(v, publicKey.slice(1))))
  );
}

/**
 * @param transaction
 * @param inputIndex
 * @param prevOutputs - transaction outputs for inputs
 * @param publicKeys - public keys to check signatures for
 * @return array of booleans indicating a valid signature for every pubkey in _publicKeys_
 */
export function verifySignatureWithPublicKeys(
  transaction: UtxoTransaction,
  inputIndex: number,
  prevOutputs: TxOutput[],
  publicKeys: Buffer[]
): boolean[] {
  if (transaction.ins.length !== prevOutputs.length) {
    throw new Error(`input length must match prevOutputs length`);
  }

  const signatureVerifications = getSignatureVerifications(
    transaction,
    inputIndex,
    prevOutputs[inputIndex].value,
    {},
    prevOutputs
  );

  return publicKeys.map((publicKey) => !!signatureVerifications.find((v) => isSignatureByPublicKey(v, publicKey)));
}

/**
 * Wrapper for {@see verifySignatureWithPublicKeys} for single pubkey
 * @param transaction
 * @param inputIndex
 * @param prevOutputs
 * @param publicKey
 * @return true iff signature is valid
 */
export function verifySignatureWithPublicKey(
  transaction: UtxoTransaction,
  inputIndex: number,
  prevOutputs: TxOutput[],
  publicKey: Buffer
): boolean {
  return verifySignatureWithPublicKeys(transaction, inputIndex, prevOutputs, [publicKey])[0];
}

export function signInputP2shP2pk(txBuilder: UtxoTransactionBuilder, vin: number, keyPair: bip32.BIP32Interface): void {
  const prevOutScriptType = 'p2sh-p2pk';
  const { redeemScript, witnessScript } = createOutputScriptP2shP2pk(keyPair.publicKey);
  keyPair.network = txBuilder.network;

  txBuilder.sign({
    vin,
    prevOutScriptType,
    keyPair,
    hashType: getDefaultSigHash(txBuilder.network as Network),
    redeemScript,
    witnessScript,
    witnessValue: undefined,
  });
}

export function signInput2Of3(
  txBuilder: UtxoTransactionBuilder,
  vin: number,
  scriptType: ScriptType2Of3,
  pubkeys: Triple<Buffer>,
  keyPair: bip32.BIP32Interface,
  cosigner: Buffer,
  amount: number
): void {
  let controlBlock;
  let redeemScript;
  let witnessScript;

  const prevOutScriptType = scriptType2Of3AsPrevOutType(scriptType);
  if (scriptType === 'p2tr') {
    ({ witnessScript, controlBlock } = createSpendScriptP2tr(pubkeys, [keyPair.publicKey, cosigner]));
  } else {
    ({ redeemScript, witnessScript } = createOutputScript2of3(pubkeys, scriptType));
  }

  keyPair.network = txBuilder.network;

  txBuilder.sign({
    vin,
    prevOutScriptType,
    keyPair,
    hashType: getDefaultSigHash(txBuilder.network as Network, scriptType),
    redeemScript,
    witnessScript,
    witnessValue: amount,
    controlBlock,
  });
}
