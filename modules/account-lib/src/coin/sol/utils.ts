import {
  Keypair,
  PublicKey,
  SignaturePubkeyPair,
  StakeInstruction,
  StakeProgram,
  SystemInstruction,
  SystemProgram,
  Transaction as SolTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import BigNumber from 'bignumber.js';
import {
  MAX_MEMO_LENGTH,
  MEMO_PROGRAM_PK,
  stakingActivateInstructionsIndexes,
  stakingDeactivateInstructionsIndexes,
  ValidInstructionTypesEnum,
  VALID_SYSTEM_INSTRUCTION_TYPES,
  walletInitInstructionIndexes,
} from './constants';
import { TransactionType } from '../baseCoin';
import { NotSupported, ParseTransactionError, UtilsError, BuildTransactionError } from '../baseCoin/errors';
import { ValidInstructionTypes } from './iface';
import nacl from 'tweetnacl';
import * as Crypto from './../../utils/crypto';

const DECODED_BLOCK_HASH_LENGTH = 32; // https://docs.solana.com/developing/programming-model/transactions#blockhash-format
const DECODED_SIGNATURE_LENGTH = 64; // https://docs.solana.com/terminology#signature
const BASE_58_ENCONDING_REGEX = '[1-9A-HJ-NP-Za-km-z]';

/** @inheritdoc */
export function isValidAddress(address: string): boolean {
  return isValidPublicKey(address);
}

/** @inheritdoc */
export function isValidBlockId(hash: string): boolean {
  try {
    return (
      !!hash && new RegExp(BASE_58_ENCONDING_REGEX).test(hash) && bs58.decode(hash).length === DECODED_BLOCK_HASH_LENGTH
    );
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
export function isValidPrivateKey(prvKey: string | Uint8Array): boolean {
  try {
    const key: Uint8Array = typeof prvKey === 'string' ? this.base58ToUint8Array(prvKey) : prvKey;
    return !!Keypair.fromSecretKey(key);
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
export function isValidPublicKey(pubKey: string): boolean {
  try {
    if (Crypto.isValidXpub(pubKey)) return true;
    new PublicKey(pubKey);
    return true;
  } catch {
    return false;
  }
}

/** @inheritdoc */
export function isValidSignature(signature: string): boolean {
  try {
    return !!signature && bs58.decode(signature).length === DECODED_SIGNATURE_LENGTH;
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
// TransactionId are the first signature on a Transaction
export function isValidTransactionId(txId: string): boolean {
  return this.isValidSignature(txId);
}

/**
 * Returns whether or not the string is a valid amount of lamports number
 *
 * @param {string} amount - the string to validate
 * @returns {boolean} - the validation result
 */
export function isValidAmount(amount: string): boolean {
  const bigNumberAmount = new BigNumber(amount);
  return bigNumberAmount.isInteger() && bigNumberAmount.isGreaterThanOrEqualTo(0);
}

/**
 * Check if the string is a valid amount of lamports number on staking
 *
 * @param {string} amount - the string to validate
 * @returns {boolean} - the validation result
 */
export function isValidStakingAmount(amount: string): boolean {
  const bigNumberAmount = new BigNumber(amount);
  return bigNumberAmount.isInteger() && bigNumberAmount.isGreaterThan(0);
}

/**
 * Check if this is a valid memo or not.
 *
 * @param memo - the memo string
 * @returns {boolean} - the validation result
 */
export function isValidMemo(memo: string): boolean {
  return Buffer.from(memo).length <= MAX_MEMO_LENGTH;
}

/**
 * Checks if raw transaction can be deserialized
 *
 * @param {string} rawTransaction - transaction in base64 string format
 * @returns {boolean} - the validation result
 */
export function isValidRawTransaction(rawTransaction: string): boolean {
  try {
    const tx = SolTransaction.from(Buffer.from(rawTransaction, 'base64'));
    tx.serialize({ requireAllSignatures: false });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verifies if signature for message is valid.
 *
 * @param {Buffer} serializedTx - tx as a base64 string
 * @param {string} signature - signature as a string
 * @param {string} publicKey - public key as base 58
 * @returns {Boolean} true if signature is valid.
 */
export function verifySignature(serializedTx: string, signature: string, publicKey: string): boolean {
  if (!isValidRawTransaction(serializedTx)) {
    throw new UtilsError('Invalid serializedTx');
  }
  if (!isValidPublicKey(publicKey)) {
    throw new UtilsError('Invalid publicKey');
  }
  if (!isValidSignature(signature)) {
    throw new UtilsError('Invalid signature');
  }
  const msg = SolTransaction.from(Buffer.from(serializedTx, 'base64')).serializeMessage();
  const sig = base58ToUint8Array(signature);
  const pub = new PublicKey(publicKey);
  return nacl.sign.detached.verify(msg, sig, pub.toBuffer());
}

/**
 * Converts a base58 string into a Uint8Array.
 *
 * @param {string} input - a string in base58
 * @returns {Uint8Array} - an Uint8Array
 */
export function base58ToUint8Array(input: string): Uint8Array {
  return new Uint8Array(bs58.decode(input));
}

/**
 * Converts a Uint8Array to a base58 string.
 *
 * @param {Uint8Array} input - an Uint8Array
 * @returns {string} - a string in base58
 */
export function Uint8ArrayTobase58(input: Uint8Array): string {
  return bs58.encode(input);
}

/**
 * Count the amount of signatures are not null.
 *
 * @param {SignaturePubkeyPair[]} signatures - an array of SignaturePubkeyPair
 * @returns {number} - the amount of valid signatures
 */
export function countNotNullSignatures(signatures: SignaturePubkeyPair[]): number {
  return signatures.filter((sig) => !!sig.signature).length;
}

/**
 * Check if all signatures are completed.
 *
 * @param {SignaturePubkeyPair[]} signatures - signatures
 * @returns {boolean}
 */
export function requiresAllSignatures(signatures: SignaturePubkeyPair[]): boolean {
  return signatures.length > 0 && countNotNullSignatures(signatures) === signatures.length;
}

/**
 * Returns the transaction Type based on the  transaction instructions.
 * Wallet initialization, Transfer and Staking transactions are supported.
 *
 * @param {SolTransaction} transaction - the solana transaction
 * @returns {TransactionType} - the type of transaction
 */
export function getTransactionType(transaction: SolTransaction): TransactionType {
  const { instructions } = transaction;
  validateIntructionTypes(instructions);
  if (
    instructions.length <= 3 &&
    getInstructionType(instructions[walletInitInstructionIndexes.Create]) === ValidInstructionTypesEnum.Create &&
    getInstructionType(instructions[walletInitInstructionIndexes.InitializeNonce]) ===
      ValidInstructionTypesEnum.InitializeNonceAccount
  ) {
    return TransactionType.WalletInitialization;
  } else if (
    getInstructionType(instructions[stakingActivateInstructionsIndexes.Create]) === ValidInstructionTypesEnum.Create &&
    getInstructionType(instructions[stakingActivateInstructionsIndexes.Initialize]) ===
      ValidInstructionTypesEnum.StakingInitialize &&
    getInstructionType(instructions[stakingActivateInstructionsIndexes.Delegate]) ===
      ValidInstructionTypesEnum.StakingDelegate
  ) {
    return TransactionType.StakingActivate;
  } else if (
    getInstructionType(instructions[stakingDeactivateInstructionsIndexes.Deactivate]) ===
    ValidInstructionTypesEnum.StakingDeactivate
  ) {
    return TransactionType.StakingDeactivate;
  }
  return TransactionType.Send;
}

/**
 * Returns the a instruction Type based on the solana instructions.
 * Throws if the solana instruction program is not supported
 *
 * @param {TransactionInstruction} instruction - a solana instruction
 * @returns {ValidInstructionTypes} - a  solana instruction type
 */
export function getInstructionType(instruction: TransactionInstruction): ValidInstructionTypes {
  switch (instruction.programId.toString()) {
    case new PublicKey(MEMO_PROGRAM_PK).toString():
      return 'Memo';
    case SystemProgram.programId.toString():
      return SystemInstruction.decodeInstructionType(instruction);
    case StakeProgram.programId.toString():
      return StakeInstruction.decodeInstructionType(instruction);
    default:
      throw new NotSupported(
        'Invalid transaction, instruction program id not supported: ' + instruction.programId.toString(),
      );
  }
}

/**
 * Validate solana instructions types to see if they are supported by the builder.
 * Throws if the instruction type is invalid.
 *
 * @param {TransactionInstruction} instruction - a solana instruction
 * @returns {void}
 */
export function validateIntructionTypes(instructions: TransactionInstruction[]): void {
  for (const instruction of instructions) {
    if (!VALID_SYSTEM_INSTRUCTION_TYPES.includes(getInstructionType(instruction))) {
      throw new NotSupported('Invalid transaction, instruction type not supported: ' + getInstructionType(instruction));
    }
  }
}

/**
 * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
 *
 * @param {string} rawTransaction - Transaction in base64 string  format
 */
export function validateRawTransaction(rawTransaction: string): void {
  if (!rawTransaction) {
    throw new ParseTransactionError('Invalid raw transaction: Undefined');
  }
  if (!isValidRawTransaction(rawTransaction)) {
    throw new ParseTransactionError('Invalid raw transaction');
  }
}

/**
 * Validates staking address exists and is a valid Solana public key
 *
 * @param {string} stakingAddress The staking address to be validated
 */
export function validateStakingAddress(stakingAddress: string): void {
  if (!stakingAddress || !isValidPublicKey(stakingAddress)) {
    throw new BuildTransactionError('Invalid or missing stakingAddress, got: ' + stakingAddress);
  }
}
