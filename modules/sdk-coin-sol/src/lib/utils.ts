import {
  BuildTransactionError,
  isValidXpub,
  NotSupported,
  ParseTransactionError,
  TransactionType,
  UtilsError,
} from '@bitgo/sdk-core';
import { BaseCoin, BaseNetwork, CoinNotDefinedError, coins, SolCoin } from '@bitgo/statics';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Keypair,
  PublicKey,
  SignaturePubkeyPair,
  Transaction as SolTransaction,
  StakeInstruction,
  StakeProgram,
  SystemInstruction,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import assert from 'assert';
import BigNumber from 'bignumber.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import {
  ataCloseInstructionIndexes,
  ataInitInstructionIndexes,
  MAX_MEMO_LENGTH,
  MEMO_PROGRAM_PK,
  nonceAdvanceInstruction,
  stakingActivateInstructionsIndexes,
  stakingAuthorizeInstructionsIndexes,
  stakingDeactivateInstructionsIndexes,
  stakingDelegateInstructionsIndexes,
  stakingPartialDeactivateInstructionsIndexes,
  stakingWithdrawInstructionsIndexes,
  VALID_SYSTEM_INSTRUCTION_TYPES,
  validInstructionData,
  validInstructionData2,
  ValidInstructionTypesEnum,
  walletInitInstructionIndexes,
} from './constants';
import { ValidInstructionTypes } from './iface';

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
    const key: Uint8Array = typeof prvKey === 'string' ? base58ToUint8Array(prvKey) : prvKey;
    return !!Keypair.fromSecretKey(key);
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
export function isValidPublicKey(pubKey: string): boolean {
  try {
    if (isValidXpub(pubKey)) return true;
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
  return isValidSignature(txId);
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
 * @param {boolean} requireAllSignatures - require all signatures to be present
 * @param {boolean} verifySignatures - verify signatures
 * @returns {boolean} - the validation result
 */
export function isValidRawTransaction(
  rawTransaction: string,
  requireAllSignatures = false,
  verifySignatures = false
): boolean {
  try {
    const tx = SolTransaction.from(Buffer.from(rawTransaction, 'base64'));
    tx.serialize({ requireAllSignatures, verifySignatures });
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
 * Check the transaction type matching instructions by order. Memo and AdvanceNonceAccount instructions
 * are ignored.
 *
 * @param {TransactionInstruction[]} instructions - the array of supported Solana instructions to be parsed
 * @param {Record<string, number>} instructionIndexes - the instructions indexes of the current transaction
 * @returns true if it matches by order.
 */
export function matchTransactionTypeByInstructionsOrder(
  instructions: TransactionInstruction[],
  instructionIndexes: Record<string, number>
): boolean {
  const instructionsCopy = [...instructions]; // Make a copy since we may modify the array below
  // AdvanceNonceAccount is optional and the first instruction added, it does not matter to match the type
  if (instructionsCopy.length > 0) {
    if (getInstructionType(instructions[0]) === 'AdvanceNonceAccount') {
      instructionsCopy.shift();
    }
  }

  // Memo is optional and the last instruction added, it does not matter to match the type
  // Why have it in instructionKeys if we are going to ignore it?
  const instructionsKeys = Object.keys(instructionIndexes);
  if (instructionsKeys[instructionsKeys.length - 1] === 'Memo') {
    instructionsKeys.pop();
  }

  // Check instructions by order using the index.
  for (const keyName of instructionsKeys) {
    const result = getInstructionType(instructionsCopy[instructionIndexes[keyName]]);
    if (result !== keyName) {
      return false;
    }
  }
  return true;
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
  if (validateRawMsgInstruction(instructions)) {
    return TransactionType.StakingAuthorizeRaw;
  }
  validateIntructionTypes(instructions);
  // check if deactivate instruction does not exist because deactivate can be include a transfer instruction
  if (instructions.filter((instruction) => getInstructionType(instruction) === 'Deactivate').length == 0) {
    for (const instruction of instructions) {
      const instructionType = getInstructionType(instruction);
      if (
        instructionType === ValidInstructionTypesEnum.Transfer ||
        instructionType === ValidInstructionTypesEnum.TokenTransfer
      ) {
        return TransactionType.Send;
      }
    }
  }
  if (matchTransactionTypeByInstructionsOrder(instructions, walletInitInstructionIndexes)) {
    return TransactionType.WalletInitialization;
  } else if (matchTransactionTypeByInstructionsOrder(instructions, stakingActivateInstructionsIndexes)) {
    return TransactionType.StakingActivate;
  } else if (matchTransactionTypeByInstructionsOrder(instructions, stakingAuthorizeInstructionsIndexes)) {
    return TransactionType.StakingAuthorize;
  } else if (matchTransactionTypeByInstructionsOrder(instructions, stakingDelegateInstructionsIndexes)) {
    return TransactionType.StakingDelegate;
  } else if (
    matchTransactionTypeByInstructionsOrder(instructions, stakingDeactivateInstructionsIndexes) ||
    matchTransactionTypeByInstructionsOrder(instructions, stakingPartialDeactivateInstructionsIndexes)
  ) {
    return TransactionType.StakingDeactivate;
  } else if (matchTransactionTypeByInstructionsOrder(instructions, stakingWithdrawInstructionsIndexes)) {
    return TransactionType.StakingWithdraw;
  } else if (matchTransactionTypeByInstructionsOrder(instructions, ataInitInstructionIndexes)) {
    return TransactionType.AssociatedTokenAccountInitialization;
  } else if (matchTransactionTypeByInstructionsOrder(instructions, ataCloseInstructionIndexes)) {
    return TransactionType.CloseAssociatedTokenAccount;
  } else {
    throw new NotSupported('Invalid transaction, transaction not supported or invalid');
  }
}

/**
 * Returns the instruction Type based on the solana instructions.
 * Throws if the solana instruction program is not supported
 *
 * @param {TransactionInstruction} instruction - a solana instruction
 * @returns {ValidInstructionTypes} - a solana instruction type
 */
export function getInstructionType(instruction: TransactionInstruction): ValidInstructionTypes {
  switch (instruction.programId.toString()) {
    case new PublicKey(MEMO_PROGRAM_PK).toString():
      return 'Memo';
    case SystemProgram.programId.toString():
      return SystemInstruction.decodeInstructionType(instruction);
    case TOKEN_PROGRAM_ID.toString():
      return 'TokenTransfer';
    case StakeProgram.programId.toString():
      return StakeInstruction.decodeInstructionType(instruction);
    case ASSOCIATED_TOKEN_PROGRAM_ID.toString():
      // TODO: change this when @spl-token supports decoding associated token instructions
      if (instruction.data.length === 0) {
        return 'InitializeAssociatedTokenAccount';
      } else {
        throw new NotSupported(
          'Invalid transaction, instruction program id not supported: ' + instruction.programId.toString()
        );
      }
    default:
      throw new NotSupported(
        'Invalid transaction, instruction program id not supported: ' + instruction.programId.toString()
      );
  }
}

/**
 * Validate solana instructions types to see if they are supported by the builder.
 * Throws if the instruction type is invalid.
 *
 * @param {TransactionInstruction} instructions - a solana instruction
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
 * Validate solana instructions match raw msg authorize transaction
 *
 * @param {TransactionInstruction} instructions - a solana instruction
 * @returns {boolean} true if the instructions match the raw msg authorize transaction
 */
export function validateRawMsgInstruction(instructions: TransactionInstruction[]): boolean {
  // as web3.js cannot decode authorize instruction from CLI, we need to check it manually first
  if (instructions.length === 2) {
    const programId1 = instructions[0].programId.toString();
    const programId2 = instructions[1].programId.toString();
    if (programId1 === SystemProgram.programId.toString() && programId2 === StakeProgram.programId.toString()) {
      const instructionName1 = SystemInstruction.decodeInstructionType(instructions[0]);
      const data = instructions[1].data.toString('hex');
      if (
        instructionName1 === nonceAdvanceInstruction &&
        (data === validInstructionData || data === validInstructionData2)
      ) {
        return true;
      }
    }
  }
  if (instructions.length === 3) {
    const programId1 = instructions[0].programId.toString();
    const programId2 = instructions[1].programId.toString();
    const programId3 = instructions[2].programId.toString();
    if (
      programId1 === SystemProgram.programId.toString() &&
      programId2 === StakeProgram.programId.toString() &&
      programId3 === StakeProgram.programId.toString()
    ) {
      const instructionName1 = SystemInstruction.decodeInstructionType(instructions[0]);
      const data = instructions[1].data.toString('hex');
      const data2 = instructions[2].data.toString('hex');
      if (
        instructionName1 === nonceAdvanceInstruction &&
        (data === validInstructionData || data === validInstructionData2) &&
        (data2 === validInstructionData || data2 === validInstructionData2)
      ) {
        return true;
      }
    }
  }
  return false;
}
/**
 * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
 *
 * @param {string} rawTransaction - Transaction in base64 string  format
 */
export function validateRawTransaction(
  rawTransaction: string,
  requireAllSignatures = false,
  verifySignatures = false
): void {
  if (!rawTransaction) {
    throw new ParseTransactionError('Invalid raw transaction: Undefined');
  }
  if (!isValidRawTransaction(rawTransaction, requireAllSignatures, verifySignatures)) {
    throw new ParseTransactionError('Invalid raw transaction');
  }
}

/**
 * Validates address to check if it exists and is a valid Solana public key
 *
 * @param {string} address The address to be validated
 * @param {string} fieldName Name of the field to validate, its needed to return which field is failing on case of error.
 */
export function validateAddress(address: string, fieldName: string): void {
  if (!address || !isValidPublicKey(address)) {
    throw new BuildTransactionError(`Invalid or missing ${fieldName}, got: ${address}`);
  }
}

/**
 * Get the statics coin object matching a given Solana token address if it exists
 *
 * @param tokenAddress The token address to match against
 * @param network Solana Mainnet or Testnet
 * @returns statics BaseCoin object for the matching token
 */
export function getSolTokenFromAddress(tokenAddress: string, network: BaseNetwork): Readonly<BaseCoin> | undefined {
  const tokens = coins.filter((coin) => {
    if (coin instanceof SolCoin) {
      return coin.network.type === network.type && coin.tokenAddress.toLowerCase() === tokenAddress.toLowerCase();
    }
    return false;
  });
  const tokensArray = tokens.map((token) => token);
  if (tokensArray.length >= 1) {
    // there should never be two tokens with the same contract address, so we assert that here
    assert(tokensArray.length === 1);
    return tokensArray[0];
  }
  return undefined;
}

/**
 * Get the solana token object from token name
 * @param tokenName The token name to match against
 * */
export function getSolTokenFromTokenName(tokenName: string): Readonly<SolCoin> | undefined {
  try {
    const token = coins.get(tokenName);
    if (!(token.isToken && token instanceof SolCoin)) {
      return undefined;
    }
    return token;
  } catch (e) {
    if (!(e instanceof CoinNotDefinedError)) {
      throw e;
    }
    return undefined;
  }
}

/**
 * Get the solana associated token account address
 * @param tokenAddress The token address
 * @param ownerAddress The owner of the associated token account
 * @returns The associated token account address
 * */
export async function getAssociatedTokenAccountAddress(tokenAddress: string, ownerAddress: string): Promise<string> {
  const ownerPublicKey = new PublicKey(ownerAddress);

  // tokenAddress are not on ed25519 curve, so they can't be used as ownerAddress
  if (!PublicKey.isOnCurve(ownerPublicKey.toBuffer())) {
    throw new UtilsError('Invalid ownerAddress - address off ed25519 curve, got: ' + ownerAddress);
  }
  const ataAddress = await getAssociatedTokenAddress(new PublicKey(tokenAddress), ownerPublicKey);
  return ataAddress.toString();
}

export function validateMintAddress(mintAddress: string) {
  if (!mintAddress || !isValidAddress(mintAddress)) {
    throw new BuildTransactionError('Invalid or missing mintAddress, got: ' + mintAddress);
  }
}

export function validateOwnerAddress(ownerAddress: string) {
  if (!ownerAddress || !isValidAddress(ownerAddress)) {
    throw new BuildTransactionError('Invalid or missing ownerAddress, got: ' + ownerAddress);
  }
}
