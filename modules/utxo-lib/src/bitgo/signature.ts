/**
 * @prettier
 */
import * as opcodes from 'bitcoin-ops';

import * as script from '../script';
import * as crypto from '../crypto';
import * as ECPair from '../ecpair';
import * as ECSignature from '../ecsignature';
import { Network } from '../networkTypes';

export interface Input {
  hash: Buffer;
  index: number;
  sequence: number;
  witness: Buffer;
  script: Buffer;
  signScript: Buffer;
}

export interface Transaction {
  network: Network;

  ins: Input[];

  hashForSignatureByNetwork(index: number, pubScript: Buffer, amount: number, hashType: number, isSegwit: boolean);
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
  signatures?: Buffer[];
  publicKeys?: Buffer[];
  pubScript?: Buffer;
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
export function parseSignatureScript(input: Input): ParsedSignatureScript {
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
    const publicKeys = [publicKey];
    const signatures = [signature];
    const pubScript = script.pubKeyHash.output.encode(crypto.hash160(publicKey));

    return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
  }

  if (
    (inputClassification !== script.types.P2SH && inputClassification !== script.types.P2WSH) ||
    decompiledSigScript.length !== 4
  ) {
    return { isSegwitInput, inputClassification };
  }
  // Note the assumption here that if we have a p2sh or p2wsh input it will be multisig (appropriate because the
  // BitGo platform only supports multisig within these types of inputs). Signatures are all but the last entry in
  // the decompiledSigScript. The redeemScript/witnessScript (depending on which type of input this is) is the last
  // entry in the decompiledSigScript (denoted here as the pubScript). The public keys are the second through
  // antepenultimate entries in the decompiledPubScript. See below for a visual representation of the typical 2-of-3
  // multisig setup:
  //
  // decompiledSigScript = 0 <sig1> <sig2> <pubScript>
  // decompiledPubScript = 2 <pub1> <pub2> <pub3> 3 OP_CHECKMULTISIG
  if (decompiledSigScript.length !== 4) {
    throw new Error(`unexpected decompiledSigScript length`);
  }
  const signatures = decompiledSigScript.slice(0, -1);
  const pubScript = decompiledSigScript[decompiledSigScript.length - 1];
  const decompiledPubScript = script.decompile(pubScript);
  if (decompiledPubScript.length !== 6) {
    throw new Error(`unexpected decompiledPubScript length`);
  }
  const publicKeys = decompiledPubScript.slice(1, -2);

  // Op codes 81 through 96 represent numbers 1 through 16 (see https://en.bitcoin.it/wiki/Script#Opcodes), which is
  // why we subtract by 80 to get the number of signatures (n) and the number of public keys (m) in an n-of-m setup.
  const len = decompiledPubScript.length;
  const nSignatures = decompiledPubScript[0] - 80;
  const nPubKeys = decompiledPubScript[len - 2] - 80;

  // Due to a bug in the implementation of multisignature in the bitcoin protocol, a 0 is added to the signature
  // script, so we add 1 when asserting the number of signatures matches the number of signatures expected by the
  // pub script. Also, note that we consider a signature script with the the same number of signatures as public
  // keys (+1 as noted above) valid because we use placeholder signatures when parsing a half-signed signature
  // script.
  if (signatures.length !== nSignatures + 1 && signatures.length !== nPubKeys + 1) {
    throw new Error(`expected ${nSignatures} or ${nPubKeys} signatures, got ${signatures.length - 1}`);
  }

  if (publicKeys.length !== nPubKeys) {
    throw new Error(`expected ${nPubKeys} public keys, got ${publicKeys.length}`);
  }

  const lastOpCode = decompiledPubScript[len - 1];
  if (lastOpCode !== opcodes.OP_CHECKMULTISIG) {
    throw new Error(`expected opcode #${opcodes.OP_CHECKMULTISIG}, got opcode #${lastOpCode}`);
  }

  return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
}

/**
 * Verify the signature on a (half-signed) transaction
 * @param transaction bitcoinjs-lib tx object
 * @param inputIndex The input whererfore to check the signature
 * @param amount For segwit and BCH, the input amount needs to be known for signature verification
 * @param verificationSettings
 * @param verificationSettings.signatureIndex The index of the signature to verify (only iterates over non-empty signatures)
 * @param verificationSettings.publicKey The hex of the public key to verify (will verify all signatures)
 * @returns {boolean}
 */
export function verifySignature(
  transaction: Transaction,
  inputIndex: number,
  amount: number,
  verificationSettings: {
    signatureIndex?: number;
    publicKey?: Buffer | string;
  } = {}
): boolean {
  if (typeof verificationSettings.publicKey === 'string') {
    return verifySignature(transaction, inputIndex, amount, {
      signatureIndex: verificationSettings.signatureIndex,
      publicKey: Buffer.from(verificationSettings.publicKey, 'hex'),
    });
  }

  const { signatures, publicKeys, isSegwitInput, inputClassification, pubScript } = parseSignatureScript(
    transaction.ins[inputIndex]
  );

  if (![script.types.P2WSH, script.types.P2SH, script.types.P2PKH].includes(inputClassification)) {
    return false;
  }

  if (!publicKeys || publicKeys.length === 0) {
    return false;
  }

  if (isSegwitInput && !amount) {
    return false;
  }

  if (!signatures) {
    return false;
  }

  // get the first non-empty signature and verify it against all public keys
  const nonEmptySignatures = signatures.filter((s) => s.length > 0);

  /*
  We either want to verify all signature/pubkey combinations, or do an explicit combination

  If a signature index is specified, only that signature is checked. It's verified against all public keys.
  If a single public key is found to be valid, the function returns true.

  If a public key is specified, we iterate over all signatures. If a single one matches the public key, the function
  returns true.

  If neither is specified, all signatures are checked against all public keys. Each signature must have its own distinct
  public key that it matches for the function to return true.
   */
  let signaturesToCheck = nonEmptySignatures;
  if (verificationSettings.signatureIndex !== undefined) {
    signaturesToCheck = [nonEmptySignatures[verificationSettings.signatureIndex]];
  }

  const matchedPublicKeyIndices = {};
  let areAllSignaturesValid = true;

  // go over all signatures
  for (const signatureBuffer of signaturesToCheck) {
    let isSignatureValid = false;

    const hasSignatureBuffer = Buffer.isBuffer(signatureBuffer) && signatureBuffer.length > 0;
    if (hasSignatureBuffer && Buffer.isBuffer(pubScript) && pubScript.length > 0) {
      // slice the last byte from the signature hash input because it's the hash type
      const signature = ECSignature.fromDER(signatureBuffer.slice(0, -1));
      const hashType = signatureBuffer[signatureBuffer.length - 1];
      if (!hashType) {
        // missing hashType byte - signature cannot be validated
        return false;
      }
      const signatureHash = transaction.hashForSignatureByNetwork(
        inputIndex,
        pubScript,
        amount,
        hashType,
        isSegwitInput
      );

      for (let publicKeyIndex = 0; publicKeyIndex < publicKeys.length; publicKeyIndex++) {
        const publicKeyBuffer = publicKeys[publicKeyIndex];
        if (verificationSettings.publicKey !== undefined && !publicKeyBuffer.equals(verificationSettings.publicKey)) {
          // we are only looking to verify one specific public key's signature (publicKeyHex)
          // this particular public key is not the one whose signature we're trying to verify
          continue;
        }

        if (matchedPublicKeyIndices[publicKeyIndex]) {
          continue;
        }

        const publicKey = ECPair.fromPublicKeyBuffer(publicKeyBuffer);
        if (publicKey.verify(signatureHash, signature)) {
          isSignatureValid = true;
          matchedPublicKeyIndices[publicKeyIndex] = true;
          break;
        }
      }
    }

    if (verificationSettings.publicKey !== undefined && isSignatureValid) {
      // We were trying to see if any of the signatures was valid for the given public key. Evidently yes.
      return true;
    }

    if (!isSignatureValid && verificationSettings.publicKey === undefined) {
      return false;
    }

    areAllSignaturesValid = isSignatureValid && areAllSignaturesValid;
  }

  return areAllSignaturesValid;
}
