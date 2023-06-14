import { BIP32Interface } from 'bip32';

import { Transaction, taproot, TxOutput, ScriptSignature } from 'bitcoinjs-lib';

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
import { Triple } from './types';
import { getMainnet, Network, networks } from '../networks';
import { ecc as eccLib } from '../noble_ecc';
import { parseSignatureScript2Of3 } from './parseInput';
import { getTaprootOutputKey } from '../taproot';

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
export type SignatureVerification =
  | {
      /** Set to the public key that signed for the signature */
      signedBy: Buffer;
      /** Set to the signature buffer */
      signature: Buffer;
    }
  | { signedBy: undefined; signature: undefined };

/**
 * @deprecated - use {@see verifySignaturesWithPublicKeys} instead
 * Get signature verifications for multsig transaction
 * @param transaction
 * @param inputIndex
 * @param amount - must be set for segwit transactions and BIP143 transactions
 * @param verificationSettings
 * @param prevOutputs - must be set for p2tr and p2trMusig2 transactions
 * @returns SignatureVerification[] - in order of parsed non-empty signatures
 */
export function getSignatureVerifications<TNumber extends number | bigint>(
  transaction: UtxoTransaction<TNumber>,
  inputIndex: number,
  amount: TNumber,
  verificationSettings: VerificationSettings = {},
  prevOutputs?: TxOutput<TNumber>[]
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

  if (parsedScript.scriptType === 'taprootKeyPathSpend' || parsedScript.scriptType === 'taprootScriptPathSpend') {
    if (
      parsedScript.scriptType === 'taprootKeyPathSpend' &&
      (verificationSettings.signatureIndex || verificationSettings.publicKey)
    ) {
      throw new Error(`signatureIndex and publicKey parameters not supported for taprootKeyPathSpend`);
    }

    if (verificationSettings.signatureIndex !== undefined) {
      throw new Error(`signatureIndex parameter not supported for taprootScriptPathSpend`);
    }

    if (!prevOutputs) {
      throw new Error(`prevOutputs not set`);
    }

    if (prevOutputs.length !== transaction.ins.length) {
      throw new Error(`prevOutputs length ${prevOutputs.length}, expected ${transaction.ins.length}`);
    }
  }

  let publicKeys: Buffer[];
  if (parsedScript.scriptType === 'taprootKeyPathSpend') {
    if (!prevOutputs) {
      throw new Error(`prevOutputs not set`);
    }
    publicKeys = [getTaprootOutputKey(prevOutputs[inputIndex].script)];
  } else {
    publicKeys = parsedScript.publicKeys.filter(
      (buf) =>
        verificationSettings.publicKey === undefined ||
        verificationSettings.publicKey.equals(buf) ||
        verificationSettings.publicKey.slice(1).equals(buf)
    );
  }

  const signatures = parsedScript.signatures
    .filter((s) => s && s.length)
    .filter((s, i) => verificationSettings.signatureIndex === undefined || verificationSettings.signatureIndex === i);

  return signatures.map((signatureBuffer): SignatureVerification => {
    if (signatureBuffer === 0 || signatureBuffer.length === 0) {
      return { signedBy: undefined, signature: undefined };
    }

    let hashType = Transaction.SIGHASH_DEFAULT;

    if (signatureBuffer.length === 65) {
      hashType = signatureBuffer[signatureBuffer.length - 1];
      signatureBuffer = signatureBuffer.slice(0, -1);
    }

    if (parsedScript.scriptType === 'taprootScriptPathSpend') {
      if (!prevOutputs) {
        throw new Error(`prevOutputs not set`);
      }
      const { controlBlock, pubScript } = parsedScript;
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
        return { signedBy: undefined, signature: undefined };
      }
      if (signedBy.length === 1) {
        return { signedBy: signedBy[0], signature: signatureBuffer };
      }
      throw new Error(`illegal state: signed by multiple public keys`);
    } else if (parsedScript.scriptType === 'taprootKeyPathSpend') {
      if (!prevOutputs) {
        throw new Error(`prevOutputs not set`);
      }
      const signatureHash = transaction.hashForWitnessV1(
        inputIndex,
        prevOutputs.map(({ script }) => script),
        prevOutputs.map(({ value }) => value),
        hashType
      );
      const result = eccLib.verifySchnorr(signatureHash, publicKeys[0], signatureBuffer);
      return result
        ? { signedBy: publicKeys[0], signature: signatureBuffer }
        : { signedBy: undefined, signature: undefined };
    } else {
      // slice the last byte from the signature hash input because it's the hash type
      const { signature, hashType } = ScriptSignature.decode(signatureBuffer);
      const transactionHash =
        parsedScript.scriptType === 'p2shP2wsh' || parsedScript.scriptType === 'p2wsh'
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
        return { signedBy: undefined, signature: undefined };
      }
      if (signedBy.length === 1) {
        return { signedBy: signedBy[0], signature: signatureBuffer };
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
export function verifySignature<TNumber extends number | bigint>(
  transaction: UtxoTransaction<TNumber>,
  inputIndex: number,
  amount: TNumber,
  verificationSettings: VerificationSettings = {},
  prevOutputs?: TxOutput<TNumber>[]
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
 * @param prevOutputs
 * @param publicKeys
 * @return array with signature corresponding to n-th key, undefined if no match found
 */
export function getSignaturesWithPublicKeys<TNumber extends number | bigint>(
  transaction: UtxoTransaction<TNumber>,
  inputIndex: number,
  prevOutputs: TxOutput<TNumber>[],
  publicKeys: Buffer[]
): Array<Buffer | undefined> {
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

  return publicKeys.map((publicKey) => {
    const v = signatureVerifications.find((v) => isSignatureByPublicKey(v, publicKey));
    return v ? v.signature : undefined;
  });
}

/**
 * @param transaction
 * @param inputIndex
 * @param prevOutputs - transaction outputs for inputs
 * @param publicKeys - public keys to check signatures for
 * @return array of booleans indicating a valid signature for every pubkey in _publicKeys_
 */
export function verifySignatureWithPublicKeys<TNumber extends number | bigint>(
  transaction: UtxoTransaction<TNumber>,
  inputIndex: number,
  prevOutputs: TxOutput<TNumber>[],
  publicKeys: Buffer[]
): boolean[] {
  return getSignaturesWithPublicKeys(transaction, inputIndex, prevOutputs, publicKeys).map((s) => s !== undefined);
}

/**
 * Wrapper for {@see verifySignatureWithPublicKeys} for single pubkey
 * @param transaction
 * @param inputIndex
 * @param prevOutputs
 * @param publicKey
 * @return true iff signature is valid
 */
export function verifySignatureWithPublicKey<TNumber extends number | bigint>(
  transaction: UtxoTransaction<TNumber>,
  inputIndex: number,
  prevOutputs: TxOutput<TNumber>[],
  publicKey: Buffer
): boolean {
  return verifySignatureWithPublicKeys(transaction, inputIndex, prevOutputs, [publicKey])[0];
}

export function getDefaultSigHash(network: Network, scriptType?: ScriptType): number {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
    case networks.bitcoinsv:
    case networks.bitcoingold:
    case networks.ecash:
      return Transaction.SIGHASH_ALL | UtxoTransaction.SIGHASH_FORKID;
    default:
      switch (scriptType) {
        case 'p2tr':
        case 'p2trMusig2':
          return Transaction.SIGHASH_DEFAULT;
        default:
          return Transaction.SIGHASH_ALL;
      }
  }
}

export function signInputP2shP2pk<TNumber extends number | bigint>(
  txBuilder: UtxoTransactionBuilder<TNumber>,
  vin: number,
  keyPair: BIP32Interface
): void {
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

export function signInput2Of3<TNumber extends number | bigint>(
  txBuilder: UtxoTransactionBuilder<TNumber>,
  vin: number,
  scriptType: ScriptType2Of3,
  pubkeys: Triple<Buffer>,
  keyPair: BIP32Interface,
  cosigner: Buffer,
  amount: TNumber
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
