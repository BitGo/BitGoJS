import { SystemInstruction, TransactionInstruction } from '@solana/web3.js';

import { TransactionType } from '../baseCoin';
import { NotSupported } from '../baseCoin/errors';
import { InstructionBuilderTypes, ValidInstructionTypesEnum, walletInitInstructionIndexes } from './constants';
import { InstructionParams, WalletInit, Transfer, Nonce, Memo, TokenTransfer } from './iface';
import { getInstructionType } from './utils';
const splToken = require('@solana/spl-token');
/**
 * Construct instructions params from Solana instructions
 *
 * @param {TransactionType} type - the transaction type
 * @param {TransactionInstruction[]} instructions - solana instructions
 * @returns {InstructionParams[]} An array containing instruction params
 */
export function instructionParamsFactory(
  type: TransactionType,
  instructions: TransactionInstruction[],
): InstructionParams[] {
  switch (type) {
    case TransactionType.WalletInitialization:
      return parseWalletInitInstructions(instructions);
    case TransactionType.Send:
      return parseSendInstructions(instructions);
    default:
      throw new NotSupported('Invalid transaction, transaction type not supported: ' + type);
  }
}

/**
 * Parses Solana instructions to Wallet initialization tx instructions params
 *
 * @param {TransactionInstruction[]} instructions - containing create and initialize nonce solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for Wallet initialization tx
 */
function parseWalletInitInstructions(instructions: TransactionInstruction[]): Array<WalletInit | Memo> {
  const instructionData: Array<WalletInit | Memo> = [];
  const createInstruction = SystemInstruction.decodeCreateAccount(instructions[walletInitInstructionIndexes.Create]);
  const nonceInitInstruction = SystemInstruction.decodeNonceInitialize(
    instructions[walletInitInstructionIndexes.InitializeNonce],
  );

  const walletInit: WalletInit = {
    type: InstructionBuilderTypes.CreateNonceAccount,
    params: {
      fromAddress: createInstruction.fromPubkey.toString(),
      nonceAddress: nonceInitInstruction.noncePubkey.toString(),
      authAddress: nonceInitInstruction.authorizedPubkey.toString(),
      amount: createInstruction.lamports.toString(),
    },
  };
  instructionData.push(walletInit);

  if (instructions.length === 3 && instructions[2]) {
    const memo: Memo = { type: InstructionBuilderTypes.Memo, params: { memo: instructions[2].data.toString() } };
    instructionData.push(memo);
  }

  return instructionData;
}

/**
 * Parses Solana instructions to Send tx instructions params
 * Only supports Memo, Transfer and Advance Nonce Solana instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for Send tx
 */
function parseSendInstructions(instructions: TransactionInstruction[]): Array<Nonce | Memo | Transfer | TokenTransfer> {
  const instructionData: Array<Nonce | Memo | Transfer | TokenTransfer> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = { type: InstructionBuilderTypes.Memo, params: { memo: instruction.data.toString() } };
        instructionData.push(memo);
        break;
      case ValidInstructionTypesEnum.AdvanceNonceAccount:
        const advanceNonceInstruction = SystemInstruction.decodeNonceAdvance(instruction);
        const nonce: Nonce = {
          type: InstructionBuilderTypes.NonceAdvance,
          params: {
            walletNonceAddress: advanceNonceInstruction.noncePubkey.toString(),
            authWalletAddress: advanceNonceInstruction.authorizedPubkey.toString(),
          },
        };
        instructionData.push(nonce);
        break;
      case ValidInstructionTypesEnum.Transfer:
        const transferInstruction = SystemInstruction.decodeTransfer(instruction);
        const transfer: Transfer = {
          type: InstructionBuilderTypes.Transfer,
          params: {
            fromAddress: transferInstruction.fromPubkey.toString(),
            toAddress: transferInstruction.toPubkey.toString(),
            amount: transferInstruction.lamports.toString(),
          },
        };
        instructionData.push(transfer);
        break;
      case ValidInstructionTypesEnum.TokenTransfer:
        const tokenTransferInstruction = splToken.decodeTransferCheckedInstruction(
          instruction,
          splToken.TOKEN_PROGRAM_ID,
        );
        const tokenTransfer: TokenTransfer = {
          type: InstructionBuilderTypes.TokenTransfer,
          params: {
            source: tokenTransferInstruction.keys.source.toString(),
            fromAddress: tokenTransferInstruction.keys.owner.toString(),
            toAddress: tokenTransferInstruction.keys.destination.toString(),
            mint: tokenTransferInstruction.keys.mint.toString(),
            amount: tokenTransferInstruction.data.amount.toString(),
            multiSigners: tokenTransferInstruction.multiSigners,
          },
        };
        instructionData.push(tokenTransfer);
        break;
      default:
        throw new NotSupported(
          'Invalid transaction, instruction type not supported: ' + getInstructionType(instruction),
        );
    }
  }
  return instructionData;
}
