/**
 * @prettier
 */
import * as opcodes from 'bitcoin-ops';

import * as script from '../script';
import * as crypto from '../crypto';
import * as ECPair from '../ecpair';
import * as Transaction from '../transaction';
import * as ECSignature from '../ecsignature';
import { Network } from '../networkTypes';
import * as networks from '../networks';
import { getMainnet } from '../coins';

export interface Input {
  hash: Buffer;
  index: number;
  sequence: number;
  witness: Buffer;
  script: Buffer;
  signScript: Buffer;
}

const inputTypes = [
  'multisig',
  'nonstandard',
  'nulldata',
  'pubkey',
  'pubkeyhash',
  'scripthash',
  'witnesspubkeyhash',
  'witnessscripthash',
  'witnesscommitment',
] as const;

type InputType = typeof inputTypes[number];

export interface ParsedSignatureScript {
  isSegwitInput: boolean;
  inputClassification: InputType;
}

export interface ParsedSignatureP2PKH extends ParsedSignatureScript {
  signatures: [Buffer];
  publicKeys: [Buffer];
  pubScript: Buffer;
}

export interface ParsedSignatureScript2Of3 extends ParsedSignatureScript {
  signatures:
    | [Buffer, Buffer] // fully-signed transactions with signatures
    | [Buffer, Buffer, Buffer]; // partially signed transactions with placeholder signatures
  publicKeys: [Buffer, Buffer, Buffer];
  pubScript: Buffer;
}

export function getDefaultSigHash(network: Network): number {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
      return Transaction.SIGHASH_ALL | Transaction.SIGHASH_BITCOINCASHBIP143;
    default:
      return Transaction.SIGHASH_ALL;
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
  input: Input
): ParsedSignatureScript | ParsedSignatureP2PKH | ParsedSignatureScript2Of3 {
  const isSegwitInput = input.witness.length > 0;
  const isNativeSegwitInput = input.script.length === 0;
  let decompiledSigScript, inputClassification;
  if (isSegwitInput) {
    // The decompiledSigScript is the script containing the signatures, public keys, and the script that was committed
    // to (pubScript). If this is a segwit input the decompiledSigScript is in the witness, regardless of whether it
    // is native or not. The inputClassification is determined based on whether or not the input is native to give an
    // accurate classification. Note that p2shP2wsh inputs will be classified as p2sh and not p2wsh.
    decompiledSigScript = input.witness;
    if (isNativeSegwitInput) {
      inputClassification = script.classifyWitness(script.compile(decompiledSigScript), true);
    } else {
      inputClassification = script.classifyInput(input.script, true);
    }
  } else {
    inputClassification = script.classifyInput(input.script, true);
    decompiledSigScript = script.decompile(input.script);
  }

  if (inputClassification === script.types.P2PKH) {
    const [signature, publicKey] = decompiledSigScript;
    const publicKeys: [Buffer] = [publicKey];
    const signatures: [Buffer] = [signature];
    const pubScript: Buffer = script.pubKeyHash.output.encode(crypto.hash160(publicKey));

    return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
  }

  // Note the assumption here that if we have a p2sh or p2wsh input it will be multisig (appropriate because the
  // BitGo platform only supports multisig within these types of inputs). Signatures are all but the last entry in
  // the decompiledSigScript. The redeemScript/witnessScript (depending on which type of input this is) is the last
  // entry in the decompiledSigScript (denoted here as the pubScript). The public keys are the second through
  // antepenultimate entries in the decompiledPubScript. See below for a visual representation of the typical 2-of-3
  // multisig setup:
  //
  //   decompiledSigScript = 0 <sig1> <sig2> [<sig3>] <pubScript>
  //   decompiledPubScript = 2 <pub1> <pub2> <pub3> 3 OP_CHECKMULTISIG
  //
  // Transactions built with `.build()` only have two signatures `<sig1>` and `<sig2>` in _decompiledSigScript_.
  // Transactions built with `.buildIncomplete()` have three signatures, where missing signatures are substituted with `OP_0`.
  const expectedScriptType = inputClassification === script.types.P2SH || inputClassification === script.types.P2WSH;
  const expectedScriptLength =
    // complete transactions with 2 signatures
    decompiledSigScript.length === 4 ||
    // incomplete transaction with 3 signatures or signature placeholders
    decompiledSigScript.length === 5;

  if (!expectedScriptType || !expectedScriptLength) {
    return { isSegwitInput, inputClassification };
  }

  if (isSegwitInput) {
    if (!Buffer.isBuffer(decompiledSigScript[0])) {
      throw new Error(`expected decompiledSigScript[0] to be a buffer for segwit inputs`);
    }
    if (decompiledSigScript[0].length !== 0) {
      throw new Error(`witness stack expected to start with empty buffer`);
    }
  } else if (decompiledSigScript[0] !== opcodes.OP_0) {
    throw new Error(`sigScript expected to start with OP_0`);
  }

  const signatures = decompiledSigScript.slice(1 /* ignore leading OP_0 */, -1 /* ignore trailing pubScript */);
  if (signatures.length !== 2 && signatures.length !== 3) {
    throw new Error(`expected 2 or 3 signatures, got ${signatures.length}`);
  }

  const pubScript = decompiledSigScript[decompiledSigScript.length - 1];
  const decompiledPubScript = script.decompile(pubScript);
  if (decompiledPubScript.length !== 6) {
    throw new Error(`unexpected decompiledPubScript length`);
  }
  const publicKeys = decompiledPubScript.slice(1, -2);
  if (publicKeys.length !== 3) {
    throw new Error(`expected 3 public keys, got ${publicKeys.length}`);
  }

  // Op codes 81 through 96 represent numbers 1 through 16 (see https://en.bitcoin.it/wiki/Script#Opcodes), which is
  // why we subtract by 80 to get the number of signatures (n) and the number of public keys (m) in an n-of-m setup.
  const len = decompiledPubScript.length;
  const signatureThreshold = decompiledPubScript[0] - 80;
  if (signatureThreshold !== 2) {
    throw new Error(`expected signatureThreshold 2, got ${signatureThreshold}`);
  }
  const nPubKeys = decompiledPubScript[len - 2] - 80;
  if (nPubKeys !== 3) {
    throw new Error(`expected nPubKeys 3, got ${nPubKeys}`);
  }

  const lastOpCode = decompiledPubScript[len - 1];
  if (lastOpCode !== opcodes.OP_CHECKMULTISIG) {
    throw new Error(`expected opcode #${opcodes.OP_CHECKMULTISIG}, got opcode #${lastOpCode}`);
  }

  return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
}

export function parseSignatureScript2Of3(input: Input): ParsedSignatureScript2Of3 {
  const result = parseSignatureScript(input) as ParsedSignatureScript2Of3;

  if (![script.types.P2WSH, script.types.P2SH, script.types.P2PKH].includes(result.inputClassification)) {
    throw new Error(`unexpected inputClassification ${result.inputClassification}`);
  }
  if (!result.signatures) {
    throw new Error(`missing signatures`);
  }
  if (result.publicKeys.length !== 3) {
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
   * The hex of the public key to verify.
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
 * Get signature verifications for multsig transaction
 * @param transaction
 * @param inputIndex
 * @param amount - must be set for segwit transactions and BIP143 transactions
 * @param verificationSettings
 * @returns SignatureVerification[] - in order of parsed non-empty signatures
 */
export function getSignatureVerifications(
  transaction: Transaction,
  inputIndex: number,
  amount: number,
  verificationSettings: VerificationSettings = {}
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

  const parsedScript = parseSignatureScript2Of3(input);

  const signatures = parsedScript.signatures
    .filter((s) => s && s.length)
    .filter((s, i) => verificationSettings.signatureIndex === undefined || verificationSettings.signatureIndex === i);

  const publicKeys = parsedScript.publicKeys.filter(
    (buf) => verificationSettings.publicKey === undefined || verificationSettings.publicKey.equals(buf)
  );

  return signatures.map((signatureBuffer) => {
    // slice the last byte from the signature hash input because it's the hash type
    const signature = ECSignature.fromDER(signatureBuffer.slice(0, -1));
    const hashType = signatureBuffer[signatureBuffer.length - 1];
    const transactionHash = transaction.hashForSignatureByNetwork(
      inputIndex,
      parsedScript.pubScript,
      amount,
      hashType,
      parsedScript.isSegwitInput
    );
    const signedBy = publicKeys.filter((publicKey) =>
      ECPair.fromPublicKeyBuffer(publicKey).verify(transactionHash, signature)
    );

    if (signedBy.length === 0) {
      return { signedBy: undefined };
    }
    if (signedBy.length === 1) {
      return { signedBy: signedBy[0] };
    }
    throw new Error(`illegal state: signed by multiple public keys`);
  });
}

/**
 * @param transaction
 * @param inputIndex
 * @param amount
 * @param verificationSettings - if publicKey is specified, returns true iff any signature is signed by publicKey.
 */
export function verifySignature(
  transaction: Transaction,
  inputIndex: number,
  amount: number,
  verificationSettings: VerificationSettings = {}
): boolean {
  const signatureVerifications = getSignatureVerifications(
    transaction,
    inputIndex,
    amount,
    verificationSettings
  ).filter(
    (v) =>
      // If a publicKey constraint is set, a single valid signature by the specified pubkey is sufficient.
      // Otherwise, all signatures must be valid.
      verificationSettings.publicKey === undefined ||
      (v.signedBy !== undefined && verificationSettings.publicKey.equals(v.signedBy))
  );

  return signatureVerifications.length > 0 && signatureVerifications.every((v) => v.signedBy !== undefined);
}
