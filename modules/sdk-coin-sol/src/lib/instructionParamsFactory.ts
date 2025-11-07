import {
  DecodedTransferCheckedInstruction,
  decodeTransferCheckedInstruction,
  DecodedBurnInstruction,
  decodeBurnInstruction,
  DecodedMintToInstruction,
  decodeMintToInstruction,
  TOKEN_2022_PROGRAM_ID,
  decodeApproveInstruction,
} from '@solana/spl-token';
import {
  AllocateParams,
  AssignParams,
  CreateAccountParams,
  DeactivateStakeParams,
  DecodedTransferInstruction,
  DelegateStakeParams,
  InitializeStakeParams,
  SplitStakeParams,
  StakeInstruction,
  StakeProgram,
  SystemInstruction,
  TransactionInstruction,
  ComputeBudgetInstruction,
} from '@solana/web3.js';

import { SolStakingTypeEnum } from '@bitgo/public-types';
import { NotSupported, TransactionType } from '@bitgo/sdk-core';
import { coins, SolCoin } from '@bitgo/statics';
import assert from 'assert';
import { InstructionBuilderTypes, ValidInstructionTypesEnum, walletInitInstructionIndexes } from './constants';
import {
  AtaClose,
  AtaInit,
  Burn,
  InstructionParams,
  Memo,
  MintTo,
  Nonce,
  StakingActivate,
  StakingAuthorize,
  StakingDeactivate,
  StakingDelegate,
  StakingWithdraw,
  TokenTransfer,
  Transfer,
  WalletInit,
  SetComputeUnitLimit,
  SetPriorityFee,
  CustomInstruction,
  Approve,
} from './iface';
import { getInstructionType } from './utils';
import { DepositSolParams, WithdrawStakeParams } from '@solana/spl-stake-pool';
import { decodeDepositSol, decodeWithdrawStake } from './jitoStakePoolOperations';

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
  coinName?: string,
  instructionMetadata?: InstructionParams[],
  _useTokenAddressTokenName?: boolean
): InstructionParams[] {
  switch (type) {
    case TransactionType.WalletInitialization:
      return parseWalletInitInstructions(instructions);
    case TransactionType.Send:
      return parseSendInstructions(instructions, instructionMetadata, _useTokenAddressTokenName);
    case TransactionType.StakingActivate:
      return parseStakingActivateInstructions(instructions);
    case TransactionType.StakingDeactivate:
      return parseStakingDeactivateInstructions(instructions, coinName);
    case TransactionType.StakingWithdraw:
      return parseStakingWithdrawInstructions(instructions);
    case TransactionType.AssociatedTokenAccountInitialization:
      return parseAtaInitInstructions(instructions, instructionMetadata, _useTokenAddressTokenName);
    case TransactionType.CloseAssociatedTokenAccount:
      return parseAtaCloseInstructions(instructions);
    case TransactionType.StakingAuthorize:
      return parseStakingAuthorizeInstructions(instructions);
    case TransactionType.StakingAuthorizeRaw:
      return parseStakingAuthorizeRawInstructions(instructions);
    case TransactionType.StakingDelegate:
      return parseStakingDelegateInstructions(instructions);
    case TransactionType.CustomTx:
      return parseCustomInstructions(instructions, instructionMetadata);
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
    instructions[walletInitInstructionIndexes.InitializeNonceAccount]
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

  const memo = getMemo(instructions, walletInitInstructionIndexes);
  if (memo) {
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
function parseSendInstructions(
  instructions: TransactionInstruction[],
  instructionMetadata?: InstructionParams[],
  _useTokenAddressTokenName?: boolean
): Array<
  | Nonce
  | Memo
  | Transfer
  | TokenTransfer
  | AtaInit
  | AtaClose
  | SetComputeUnitLimit
  | SetPriorityFee
  | MintTo
  | Burn
  | Approve
> {
  const instructionData: Array<
    | Nonce
    | Memo
    | Transfer
    | TokenTransfer
    | AtaInit
    | AtaClose
    | SetComputeUnitLimit
    | SetPriorityFee
    | MintTo
    | Burn
    | Approve
  > = [];
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
        let tokenTransferInstruction: DecodedTransferCheckedInstruction;
        if (instruction.programId.toString() !== TOKEN_2022_PROGRAM_ID.toString()) {
          tokenTransferInstruction = decodeTransferCheckedInstruction(instruction);
        } else {
          tokenTransferInstruction = decodeTransferCheckedInstruction(instruction, TOKEN_2022_PROGRAM_ID);
        }
        const tokenAddress = tokenTransferInstruction.keys.mint.pubkey.toString();
        const tokenName = findTokenName(tokenAddress, instructionMetadata, _useTokenAddressTokenName);
        let programIDForTokenTransfer: string | undefined;
        if (instruction.programId) {
          programIDForTokenTransfer = instruction.programId.toString();
        }
        const tokenTransfer: TokenTransfer = {
          type: InstructionBuilderTypes.TokenTransfer,
          params: {
            fromAddress: tokenTransferInstruction.keys.owner.pubkey.toString(),
            toAddress: tokenTransferInstruction.keys.destination.pubkey.toString(),
            amount: tokenTransferInstruction.data.amount.toString(),
            tokenName,
            sourceAddress: tokenTransferInstruction.keys.source.pubkey.toString(),
            tokenAddress: tokenAddress,
            programId: programIDForTokenTransfer,
            decimalPlaces: tokenTransferInstruction.data.decimals,
          },
        };
        instructionData.push(tokenTransfer);
        break;
      case ValidInstructionTypesEnum.Approve:
        const programId = instruction.programId.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : undefined;
        const approveInstruction = decodeApproveInstruction(instruction, programId);
        const approve: Approve = {
          type: InstructionBuilderTypes.Approve,
          params: {
            accountAddress: approveInstruction.keys.account.toString(),
            delegateAddress: approveInstruction.keys.delegate.toString(),
            ownerAddress: approveInstruction.keys.owner.toString(),
            amount: approveInstruction.data.amount.toString(),
            programId: programId && programId.toString(),
          },
        };
        instructionData.push(approve);
        break;
      case ValidInstructionTypesEnum.InitializeAssociatedTokenAccount:
        const mintAddress = instruction.keys[ataInitInstructionKeysIndexes.MintAddress].pubkey.toString();
        const mintTokenName = findTokenName(mintAddress, instructionMetadata, _useTokenAddressTokenName);
        let programID: string | undefined;
        if (instruction.programId) {
          programID = instruction.programId.toString();
        }

        const ataInit: AtaInit = {
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            mintAddress,
            ataAddress: instruction.keys[ataInitInstructionKeysIndexes.ATAAddress].pubkey.toString(),
            ownerAddress: instruction.keys[ataInitInstructionKeysIndexes.OwnerAddress].pubkey.toString(),
            payerAddress: instruction.keys[ataInitInstructionKeysIndexes.PayerAddress].pubkey.toString(),
            tokenName: mintTokenName,
            programId: programID,
          },
        };
        instructionData.push(ataInit);
        break;
      case ValidInstructionTypesEnum.CloseAssociatedTokenAccount:
        const accountAddress = instruction.keys[closeAtaInstructionKeysIndexes.AccountAddress].pubkey.toString();
        const destinationAddress =
          instruction.keys[closeAtaInstructionKeysIndexes.DestinationAddress].pubkey.toString();
        const authorityAddress = instruction.keys[closeAtaInstructionKeysIndexes.AuthorityAddress].pubkey.toString();

        const ataClose: AtaClose = {
          type: InstructionBuilderTypes.CloseAssociatedTokenAccount,
          params: {
            accountAddress,
            destinationAddress,
            authorityAddress,
          },
        };
        instructionData.push(ataClose);
        break;
      case ValidInstructionTypesEnum.SetComputeUnitLimit:
        const setComputeUnitLimitParams = ComputeBudgetInstruction.decodeSetComputeUnitLimit(instruction);
        const setComputeUnitLimit: SetComputeUnitLimit = {
          type: InstructionBuilderTypes.SetComputeUnitLimit,
          params: {
            units: setComputeUnitLimitParams.units,
          },
        };
        instructionData.push(setComputeUnitLimit);
        break;
      case ValidInstructionTypesEnum.SetPriorityFee:
        const setComputeUnitPriceParams = ComputeBudgetInstruction.decodeSetComputeUnitPrice(instruction);
        const setPriorityFee: SetPriorityFee = {
          type: InstructionBuilderTypes.SetPriorityFee,
          params: {
            fee: setComputeUnitPriceParams.microLamports,
          },
        };
        instructionData.push(setPriorityFee);
        break;
      case ValidInstructionTypesEnum.MintTo:
        let mintToInstruction: DecodedMintToInstruction;
        if (instruction.programId.toString() !== TOKEN_2022_PROGRAM_ID.toString()) {
          mintToInstruction = decodeMintToInstruction(instruction);
        } else {
          mintToInstruction = decodeMintToInstruction(instruction, TOKEN_2022_PROGRAM_ID);
        }
        const mintAddressForMint = mintToInstruction.keys.mint.pubkey.toString();
        const tokenNameForMint = findTokenName(mintAddressForMint, instructionMetadata, _useTokenAddressTokenName);
        let programIDForMint: string | undefined;
        if (instruction.programId) {
          programIDForMint = instruction.programId.toString();
        }
        const mintTo: MintTo = {
          type: InstructionBuilderTypes.MintTo,
          params: {
            mintAddress: mintAddressForMint,
            destinationAddress: mintToInstruction.keys.destination.pubkey.toString(),
            authorityAddress: mintToInstruction.keys.authority.pubkey.toString(),
            amount: mintToInstruction.data.amount.toString(),
            tokenName: tokenNameForMint,
            decimalPlaces: undefined,
            programId: programIDForMint,
          },
        };
        instructionData.push(mintTo);
        break;
      case ValidInstructionTypesEnum.Burn:
        let burnInstruction: DecodedBurnInstruction;
        if (instruction.programId.toString() !== TOKEN_2022_PROGRAM_ID.toString()) {
          burnInstruction = decodeBurnInstruction(instruction);
        } else {
          burnInstruction = decodeBurnInstruction(instruction, TOKEN_2022_PROGRAM_ID);
        }
        const mintAddressForBurn = burnInstruction.keys.mint.pubkey.toString();
        const tokenNameForBurn = findTokenName(mintAddressForBurn, instructionMetadata, _useTokenAddressTokenName);
        let programIDForBurn: string | undefined;
        if (instruction.programId) {
          programIDForBurn = instruction.programId.toString();
        }
        const burn: Burn = {
          type: InstructionBuilderTypes.Burn,
          params: {
            mintAddress: mintAddressForBurn,
            accountAddress: burnInstruction.keys.account.pubkey.toString(),
            authorityAddress: burnInstruction.keys.owner.pubkey.toString(),
            amount: burnInstruction.data.amount.toString(),
            tokenName: tokenNameForBurn,
            decimalPlaces: undefined,
            programId: programIDForBurn,
          },
        };
        instructionData.push(burn);
        break;
      default:
        throw new NotSupported(
          'Invalid transaction, instruction type not supported: ' + getInstructionType(instruction)
        );
    }
  }
  return instructionData;
}

type StakingInstructions = {
  depositSol?: DepositSolParams;
  create?: CreateAccountParams;
  initialize?: InitializeStakeParams;
  delegate?: DelegateStakeParams;
  hasAtaInit?: boolean;
};

type JitoStakingInstructions = StakingInstructions & {
  depositSol: NonNullable<StakingInstructions['depositSol']>;
};

function isJitoStakingInstructions(si: StakingInstructions): si is JitoStakingInstructions {
  return si.depositSol !== undefined;
}

type MarinadeStakingInstructions = StakingInstructions & {
  create: NonNullable<StakingInstructions['create']>;
  initialize: NonNullable<StakingInstructions['initialize']>;
};

function isMarinadeStakingInstructions(si: StakingInstructions): si is MarinadeStakingInstructions {
  return si.create !== undefined && si.initialize !== undefined && si.delegate === undefined;
}

type NativeStakingInstructions = StakingInstructions & {
  create: NonNullable<StakingInstructions['create']>;
  initialize: NonNullable<StakingInstructions['initialize']>;
  delegate: NonNullable<StakingInstructions['delegate']>;
};

function isNativeStakingInstructions(si: StakingInstructions): si is NativeStakingInstructions {
  return si.create !== undefined && si.initialize !== undefined && si.delegate !== undefined;
}

function getStakingTypeFromStakingInstructions(si: StakingInstructions): SolStakingTypeEnum {
  const isJito = isJitoStakingInstructions(si);
  const isMarinade = isMarinadeStakingInstructions(si);
  const isNative = isNativeStakingInstructions(si);
  assert([isJito, isMarinade, isNative].filter((x) => x).length === 1, 'StakingType is ambiguous');
  if (isJito) return SolStakingTypeEnum.JITO;
  if (isMarinade) return SolStakingTypeEnum.MARINADE;
  if (isNative) return SolStakingTypeEnum.NATIVE;
  assert(false, 'No StakingType found');
}

/**
 * Parses Solana instructions to create staking tx and delegate tx instructions params
 * Only supports Nonce, StakingActivate and Memo Solana instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking activate tx
 */
function parseStakingActivateInstructions(
  instructions: TransactionInstruction[]
): Array<Nonce | StakingActivate | Memo | AtaInit> {
  const instructionData: Array<Nonce | StakingActivate | Memo | AtaInit> = [];
  const stakingInstructions = {} as StakingInstructions;
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
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

      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = { type: InstructionBuilderTypes.Memo, params: { memo: instruction.data.toString() } };
        instructionData.push(memo);
        break;

      case ValidInstructionTypesEnum.Create:
        stakingInstructions.create = SystemInstruction.decodeCreateAccount(instruction);
        break;

      case ValidInstructionTypesEnum.StakingInitialize:
        stakingInstructions.initialize = StakeInstruction.decodeInitialize(instruction);
        break;

      case ValidInstructionTypesEnum.StakingDelegate:
        stakingInstructions.delegate = StakeInstruction.decodeDelegate(instruction);
        break;

      case ValidInstructionTypesEnum.DepositSol:
        stakingInstructions.depositSol = decodeDepositSol(instruction);
        break;

      case ValidInstructionTypesEnum.InitializeAssociatedTokenAccount:
        stakingInstructions.hasAtaInit = true;
        instructionData.push({
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            mintAddress: instruction.keys[ataInitInstructionKeysIndexes.MintAddress].pubkey.toString(),
            ataAddress: instruction.keys[ataInitInstructionKeysIndexes.ATAAddress].pubkey.toString(),
            ownerAddress: instruction.keys[ataInitInstructionKeysIndexes.OwnerAddress].pubkey.toString(),
            payerAddress: instruction.keys[ataInitInstructionKeysIndexes.PayerAddress].pubkey.toString(),
            tokenName: findTokenName(instruction.keys[ataInitInstructionKeysIndexes.MintAddress].pubkey.toString()),
          },
        });
        break;
    }
  }

  validateStakingInstructions(stakingInstructions);
  const stakingType = getStakingTypeFromStakingInstructions(stakingInstructions);

  let stakingActivate: StakingActivate | undefined;

  switch (stakingType) {
    case SolStakingTypeEnum.JITO: {
      assert(isJitoStakingInstructions(stakingInstructions));
      const { depositSol, hasAtaInit } = stakingInstructions;
      stakingActivate = {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          stakingType,
          fromAddress: depositSol.fundingAccount.toString(),
          stakingAddress: depositSol.stakePool.toString(),
          amount: depositSol.lamports.toString(),
          validator: depositSol.stakePool.toString(),
          extraParams: {
            stakePoolData: {
              managerFeeAccount: depositSol.managerFeeAccount.toString(),
              poolMint: depositSol.poolMint.toString(),
              reserveStake: depositSol.reserveStake.toString(),
            },
            createAssociatedTokenAccount: !!hasAtaInit,
          },
        },
      };
      break;
    }

    case SolStakingTypeEnum.MARINADE: {
      assert(isMarinadeStakingInstructions(stakingInstructions));
      const { create, initialize } = stakingInstructions;
      stakingActivate = {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          stakingType,
          fromAddress: create.fromPubkey.toString(),
          stakingAddress: initialize.stakePubkey.toString(),
          amount: create.lamports.toString(),
          validator: initialize.authorized.staker.toString(),
        },
      };
      break;
    }

    case SolStakingTypeEnum.NATIVE: {
      assert(isNativeStakingInstructions(stakingInstructions));
      const { create, initialize, delegate } = stakingInstructions;
      stakingActivate = {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          stakingType,
          fromAddress: create.fromPubkey.toString(),
          stakingAddress: initialize.stakePubkey.toString(),
          amount: create.lamports.toString(),
          validator: delegate.votePubkey.toString(),
        },
      };
      break;
    }

    default: {
      const unreachable: never = stakingType;
      throw new Error(`Unknown staking type ${unreachable}`);
    }
  }

  instructionData.push(stakingActivate);

  return instructionData;
}
/**
 * Parses Solana instructions to create delegate tx
 * Only supports Nonce, StakingDelegate
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking delegate tx
 */
function parseStakingDelegateInstructions(instructions: TransactionInstruction[]): Array<Nonce | StakingDelegate> {
  const instructionData: Array<Nonce | StakingDelegate> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
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

      case ValidInstructionTypesEnum.StakingDelegate:
        const stakingDelegateParams = StakeInstruction.decodeDelegate(instruction);
        const stakingDelegate: StakingDelegate = {
          type: InstructionBuilderTypes.StakingDelegate,
          params: {
            fromAddress: stakingDelegateParams.authorizedPubkey.toString() || '',
            stakingAddress: stakingDelegateParams.stakePubkey.toString() || '',
            validator: stakingDelegateParams.votePubkey.toString() || '',
          },
        };
        instructionData.push(stakingDelegate);
        break;
    }
  }
  return instructionData;
}

function validateStakingInstructions(stakingInstructions: StakingInstructions) {
  if (stakingInstructions.delegate === undefined && stakingInstructions.depositSol !== undefined) {
    return;
  }

  if (!stakingInstructions.create) {
    throw new NotSupported('Invalid staking activate transaction, missing create stake account instruction');
  }

  if (!stakingInstructions.delegate && !stakingInstructions.initialize) {
    throw new NotSupported(
      'Invalid staking activate transaction, missing initialize stake account/delegate instruction'
    );
  }
}

type UnstakingInstructions = {
  allocate?: AllocateParams;
  assign?: AssignParams;
  split?: SplitStakeParams;
  deactivate?: DeactivateStakeParams;
  transfer?: DecodedTransferInstruction;
  withdrawStake?: WithdrawStakeParams;
};

type JitoUnstakingInstructions = UnstakingInstructions & {
  withdrawStake: NonNullable<UnstakingInstructions['withdrawStake']>;
};

function isJitoUnstakingInstructions(ui: UnstakingInstructions): ui is JitoUnstakingInstructions {
  return ui.withdrawStake !== undefined && ui.deactivate !== undefined;
}

type MarinadeUnstakingInstructions = UnstakingInstructions & {
  transfer: NonNullable<UnstakingInstructions['transfer']>;
};

function isMarinadeUnstakingInstructions(ui: UnstakingInstructions): ui is MarinadeUnstakingInstructions {
  return ui.transfer !== undefined && ui.deactivate === undefined;
}

type NativeUnstakingInstructions = UnstakingInstructions & {
  deactivate: NonNullable<UnstakingInstructions['deactivate']>;
  split: UnstakingInstructions['split'];
};

function isNativeUnstakingInstructions(ui: UnstakingInstructions): ui is NativeUnstakingInstructions {
  return ui.withdrawStake === undefined && ui.deactivate !== undefined;
}

function getStakingTypeFromUnstakingInstructions(ui: UnstakingInstructions): SolStakingTypeEnum {
  const isJito = isJitoUnstakingInstructions(ui);
  const isMarinade = isMarinadeUnstakingInstructions(ui);
  const isNative = isNativeUnstakingInstructions(ui);
  assert([isJito, isMarinade, isNative].filter((x) => x).length === 1, 'StakingType is ambiguous');
  if (isJito) return SolStakingTypeEnum.JITO;
  if (isMarinade) return SolStakingTypeEnum.MARINADE;
  if (isNative) return SolStakingTypeEnum.NATIVE;
  assert(false, 'No StakingType found');
}

/**
 * Parses Solana instructions to create deactivate stake tx instructions params. Supports full stake
 * account deactivation and partial stake account deactivation.
 *
 * When partially deactivating a stake account this method expects the following instructions: Allocate,
 * to allocate a new staking account, Assign, to assign the newly created staking account to the
 * Stake Program, Split, to split the current stake account, and StakingDeactivate to deactivate the
 * newly created stake account.
 *
 * Supports Nonce, StakingDeactivate, Memo, Allocate, Assign, and Split Solana instructions.
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking deactivate tx
 */
function parseStakingDeactivateInstructions(
  instructions: TransactionInstruction[],
  coinName?: string
): Array<Nonce | StakingDeactivate | Memo> {
  const instructionData: Array<Nonce | StakingDeactivate | Memo> = [];
  const unstakingInstructions: UnstakingInstructions[] = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
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

      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = {
          type: InstructionBuilderTypes.Memo,
          params: { memo: instruction.data.toString() },
        };
        instructionData.push(memo);
        break;

      case ValidInstructionTypesEnum.Allocate:
        if (
          unstakingInstructions.length > 0 &&
          unstakingInstructions[unstakingInstructions.length - 1].allocate === undefined
        ) {
          unstakingInstructions[unstakingInstructions.length - 1].allocate =
            SystemInstruction.decodeAllocate(instruction);
        } else {
          unstakingInstructions.push({
            allocate: SystemInstruction.decodeAllocate(instruction),
          });
        }
        break;

      case ValidInstructionTypesEnum.Assign:
        if (
          unstakingInstructions.length > 0 &&
          unstakingInstructions[unstakingInstructions.length - 1].assign === undefined
        ) {
          unstakingInstructions[unstakingInstructions.length - 1].assign = SystemInstruction.decodeAssign(instruction);
        } else {
          unstakingInstructions.push({
            assign: SystemInstruction.decodeAssign(instruction),
          });
        }
        break;

      case ValidInstructionTypesEnum.Split:
        if (
          unstakingInstructions.length > 0 &&
          unstakingInstructions[unstakingInstructions.length - 1].split === undefined
        ) {
          unstakingInstructions[unstakingInstructions.length - 1].split = StakeInstruction.decodeSplit(instruction);
        } else {
          unstakingInstructions.push({
            split: StakeInstruction.decodeSplit(instruction),
          });
        }
        break;

      case ValidInstructionTypesEnum.StakingDeactivate:
        if (
          unstakingInstructions.length > 0 &&
          unstakingInstructions[unstakingInstructions.length - 1].deactivate === undefined
        ) {
          unstakingInstructions[unstakingInstructions.length - 1].deactivate =
            StakeInstruction.decodeDeactivate(instruction);
        } else {
          unstakingInstructions.push({
            deactivate: StakeInstruction.decodeDeactivate(instruction),
          });
        }
        break;

      case ValidInstructionTypesEnum.Transfer:
        if (
          unstakingInstructions.length > 0 &&
          unstakingInstructions[unstakingInstructions.length - 1].transfer === undefined
        ) {
          unstakingInstructions[unstakingInstructions.length - 1].transfer =
            SystemInstruction.decodeTransfer(instruction);
        } else {
          unstakingInstructions.push({
            transfer: SystemInstruction.decodeTransfer(instruction),
          });
        }
        break;

      case ValidInstructionTypesEnum.WithdrawStake:
        if (
          unstakingInstructions.length > 0 &&
          unstakingInstructions[unstakingInstructions.length - 1].withdrawStake === undefined
        ) {
          unstakingInstructions[unstakingInstructions.length - 1].withdrawStake = decodeWithdrawStake(instruction);
        } else {
          unstakingInstructions.push({
            withdrawStake: decodeWithdrawStake(instruction),
          });
        }
        break;
    }
  }

  for (const unstakingInstruction of unstakingInstructions) {
    validateUnstakingInstructions(unstakingInstruction);
    const stakingType = getStakingTypeFromUnstakingInstructions(unstakingInstruction);

    let stakingDeactivate: StakingDeactivate | undefined;

    switch (stakingType) {
      case SolStakingTypeEnum.JITO: {
        assert(isJitoUnstakingInstructions(unstakingInstruction));
        const { withdrawStake } = unstakingInstruction;
        stakingDeactivate = {
          type: InstructionBuilderTypes.StakingDeactivate,
          params: {
            stakingType,
            fromAddress: withdrawStake.destinationStakeAuthority.toString(),
            stakingAddress: withdrawStake.stakePool.toString(),
            amount: withdrawStake.poolTokens.toString(),
            unstakingAddress: withdrawStake.destinationStake.toString(),
            extraParams: {
              stakePoolData: {
                managerFeeAccount: withdrawStake.managerFeeAccount.toString(),
                poolMint: withdrawStake.poolMint.toString(),
                validatorListAccount: withdrawStake.validatorList.toString(),
              },
              validatorAddress: withdrawStake.validatorStake.toString(),
              transferAuthorityAddress: withdrawStake.sourceTransferAuthority.toString(),
            },
          },
        };
        break;
      }

      case SolStakingTypeEnum.MARINADE: {
        assert(isMarinadeUnstakingInstructions(unstakingInstruction));
        const { transfer } = unstakingInstruction;

        stakingDeactivate = {
          type: InstructionBuilderTypes.StakingDeactivate,
          params: {
            stakingType,
            fromAddress: '',
            stakingAddress: '',
            recipients: [
              {
                address: transfer.toPubkey.toString() || '',
                amount: transfer.lamports.toString() || '',
              },
            ],
          },
        };
        break;
      }

      case SolStakingTypeEnum.NATIVE: {
        assert(isNativeUnstakingInstructions(unstakingInstruction));
        const { deactivate, split } = unstakingInstruction;
        stakingDeactivate = {
          type: InstructionBuilderTypes.StakingDeactivate,
          params: {
            stakingType,
            fromAddress: deactivate.authorizedPubkey.toString() || '',
            stakingAddress: split?.stakePubkey.toString() || deactivate.stakePubkey.toString(),
            amount: split?.lamports.toString(),
            unstakingAddress: split?.splitStakePubkey.toString(),
          },
        };
        break;
      }

      default: {
        const unreachable: never = stakingType;
        throw new Error(`Unknown staking type ${unreachable}`);
      }
    }

    instructionData.push(stakingDeactivate);
  }

  return instructionData;
}

function validateUnstakingInstructions(unstakingInstructions: UnstakingInstructions) {
  // Cases where exactly one field should be present
  const unstakingInstructionsKeys: (keyof UnstakingInstructions)[] = [
    'allocate',
    'assign',
    'split',
    'deactivate',
    'transfer',
  ] as const;
  if (unstakingInstructionsKeys.every((k) => !!unstakingInstructions[k] === (k === 'transfer'))) {
    return;
  }
  if (unstakingInstructionsKeys.every((k) => !!unstakingInstructions[k] === (k === 'withdrawStake'))) {
    return;
  }
  if (unstakingInstructionsKeys.every((k) => !!unstakingInstructions[k] === (k === 'deactivate'))) {
    return;
  }

  // Cases where deactivate field must be present with another field
  if (!unstakingInstructions.deactivate) {
    throw new NotSupported('Invalid deactivate stake transaction, missing deactivate stake account instruction');
  }

  // This is a stake pool instruction, not a partial unstake
  if (unstakingInstructions.withdrawStake) {
    return;
  }

  if (!unstakingInstructions.allocate) {
    throw new NotSupported(
      'Invalid partial deactivate stake transaction, missing allocate unstake account instruction'
    );
  } else if (!unstakingInstructions.assign) {
    throw new NotSupported('Invalid partial deactivate stake transaction, missing assign unstake account instruction');
  } else if (!unstakingInstructions.split) {
    throw new NotSupported('Invalid partial deactivate stake transaction, missing split stake account instruction');
  } else if (
    unstakingInstructions.allocate.accountPubkey.toString() !== unstakingInstructions.assign.accountPubkey.toString()
  ) {
    throw new NotSupported(
      'Invalid partial deactivate stake transaction, must allocate and assign the same public key'
    );
  } else if (unstakingInstructions.allocate.space !== StakeProgram.space) {
    throw new NotSupported(
      `Invalid partial deactivate stake transaction, unstaking account must allocate ${StakeProgram.space} bytes`
    );
  } else if (unstakingInstructions.assign.programId.toString() !== StakeProgram.programId.toString()) {
    throw new NotSupported(
      'Invalid partial deactivate stake transaction, the unstake account must be assigned to the Stake Program'
    );
  } else if (
    unstakingInstructions.allocate.accountPubkey.toString() !== unstakingInstructions.split.splitStakePubkey.toString()
  ) {
    throw new NotSupported('Invalid partial deactivate stake transaction, must allocate the unstaking account');
  } else if (
    unstakingInstructions.split.stakePubkey.toString() === unstakingInstructions.split.splitStakePubkey.toString()
  ) {
    throw new NotSupported(
      'Invalid partial deactivate stake transaction, the unstaking account must be different from the Stake Account'
    );
  } else if (!unstakingInstructions.transfer) {
    throw new NotSupported(
      'Invalid partial deactivate stake transaction, missing funding of unstake address instruction'
    );
  }
}

/**
 * Parses Solana instructions to create staking  withdraw tx instructions params
 * Only supports Nonce, StakingWithdraw, and Memo Solana instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking withdraw tx
 */
function parseStakingWithdrawInstructions(
  instructions: TransactionInstruction[]
): Array<Nonce | StakingWithdraw | Memo> {
  const instructionData: Array<Nonce | StakingWithdraw | Memo> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
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

      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = {
          type: InstructionBuilderTypes.Memo,
          params: { memo: instruction.data.toString() },
        };
        instructionData.push(memo);
        break;

      case ValidInstructionTypesEnum.StakingWithdraw:
        const withdrawInstruction = StakeInstruction.decodeWithdraw(instruction);
        const stakingWithdraw: StakingWithdraw = {
          type: InstructionBuilderTypes.StakingWithdraw,
          params: {
            fromAddress: withdrawInstruction.authorizedPubkey.toString(),
            stakingAddress: withdrawInstruction.stakePubkey.toString(),
            amount: withdrawInstruction.lamports.toString(),
          },
        };
        instructionData.push(stakingWithdraw);
        break;
    }
  }

  return instructionData;
}

/**
 * Get the memo object from instructions if it exists
 *
 * @param {TransactionInstruction[]} instructions - the array of supported Solana instructions to be parsed
 * @param {Record<string, number>} instructionIndexes - the instructions indexes of the current transaction
 * @returns {Memo | undefined} - memo object or undefined
 */
function getMemo(instructions: TransactionInstruction[], instructionIndexes: Record<string, number>): Memo | undefined {
  const instructionsLength = Object.keys(instructionIndexes).length;
  if (instructions.length === instructionsLength && instructions[instructionIndexes.Memo]) {
    return {
      type: InstructionBuilderTypes.Memo,
      params: { memo: instructions[instructionIndexes.Memo].data.toString() },
    };
  }
}

const ataInitInstructionKeysIndexes = {
  PayerAddress: 0,
  ATAAddress: 1,
  OwnerAddress: 2,
  MintAddress: 3,
};

const closeAtaInstructionKeysIndexes = {
  AccountAddress: 0,
  DestinationAddress: 1,
  AuthorityAddress: 2,
};

/**
 * Parses Solana instructions to initialize associated token account tx instructions params
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for Send tx
 */
function parseAtaInitInstructions(
  instructions: TransactionInstruction[],
  instructionMetadata?: InstructionParams[],
  _useTokenAddressTokenName?: boolean
): Array<AtaInit | Memo | Nonce> {
  const instructionData: Array<AtaInit | Memo | Nonce> = [];
  let memo: Memo | undefined;

  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
      case ValidInstructionTypesEnum.Memo:
        memo = { type: InstructionBuilderTypes.Memo, params: { memo: instruction.data.toString() } };
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
      case ValidInstructionTypesEnum.InitializeAssociatedTokenAccount:
        const mintAddress = instruction.keys[ataInitInstructionKeysIndexes.MintAddress].pubkey.toString();
        const tokenName = findTokenName(mintAddress, instructionMetadata, _useTokenAddressTokenName);
        let programID: string | undefined;
        if (instruction.programId) {
          programID = instruction.programId.toString();
        }
        const ataInit: AtaInit = {
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            mintAddress,
            ataAddress: instruction.keys[ataInitInstructionKeysIndexes.ATAAddress].pubkey.toString(),
            ownerAddress: instruction.keys[ataInitInstructionKeysIndexes.OwnerAddress].pubkey.toString(),
            payerAddress: instruction.keys[ataInitInstructionKeysIndexes.PayerAddress].pubkey.toString(),
            tokenName,
            programId: programID,
          },
        };
        instructionData.push(ataInit);
        break;
      case ValidInstructionTypesEnum.DepositSol:
        // AtaInit is a part of spl-stake-pool's depositSol process
        break;
      default:
        throw new NotSupported(
          'Invalid transaction, instruction type not supported: ' + getInstructionType(instruction)
        );
    }
  }
  if (memo) {
    instructionData.push(memo);
  }
  return instructionData;
}

const ataCloseInstructionKeysIndexes = {
  AccountAddress: 0,
  DestinationAddress: 1,
  AuthorityAddress: 2,
};

/**
 * Parses Solana instructions to close associated token account tx instructions params
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for Send tx
 */
function parseAtaCloseInstructions(instructions: TransactionInstruction[]): Array<AtaClose | Nonce> {
  const instructionData: Array<AtaClose | Nonce> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
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
      case ValidInstructionTypesEnum.CloseAssociatedTokenAccount:
        const ataClose: AtaClose = {
          type: InstructionBuilderTypes.CloseAssociatedTokenAccount,
          params: {
            accountAddress: instruction.keys[ataCloseInstructionKeysIndexes.AccountAddress].pubkey.toString(),
            destinationAddress: instruction.keys[ataCloseInstructionKeysIndexes.DestinationAddress].pubkey.toString(),
            authorityAddress: instruction.keys[ataCloseInstructionKeysIndexes.AuthorityAddress].pubkey.toString(),
          },
        };
        instructionData.push(ataClose);
        break;
      default:
        throw new NotSupported(
          'Invalid transaction, instruction type not supported: ' + getInstructionType(instruction)
        );
    }
  }
  return instructionData;
}

/**
 * Parses Solana instructions to authorized staking account params
 * Only supports Nonce, Authorize instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking authorize tx
 */
function parseStakingAuthorizeInstructions(
  instructions: TransactionInstruction[]
): Array<Nonce | StakingAuthorize | Memo> {
  const instructionData: Array<Nonce | StakingAuthorize | Memo> = [];
  for (const instruction of instructions) {
    const type = getInstructionType(instruction);
    switch (type) {
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

      case ValidInstructionTypesEnum.Memo:
        const memo: Memo = { type: InstructionBuilderTypes.Memo, params: { memo: instruction.data.toString() } };
        instructionData.push(memo);
        break;

      case ValidInstructionTypesEnum.Authorize:
        const authorize = StakeInstruction.decodeAuthorize(instruction);
        instructionData.push({
          type: InstructionBuilderTypes.StakingAuthorize,
          params: {
            stakingAddress: authorize.stakePubkey.toString(),
            oldAuthorizeAddress: authorize.authorizedPubkey.toString(),
            newAuthorizeAddress: authorize.newAuthorizedPubkey.toString(),
            newWithdrawAddress: authorize.custodianPubkey?.toString() || '',
          },
        });
        break;
    }
  }

  return instructionData;
}

/**
 * Parses Solana instructions to authorized staking account params
 * Only supports Nonce, Authorize instructions
 *
 * @param {TransactionInstruction[]} instructions - an array of supported Solana instructions
 * @returns {InstructionParams[]} An array containing instruction params for staking authorize tx
 */
function parseStakingAuthorizeRawInstructions(instructions: TransactionInstruction[]): Array<Nonce | StakingAuthorize> {
  const instructionData: Array<Nonce | StakingAuthorize> = [];
  assert(instructions.length === 2, 'Invalid number of instructions');
  const advanceNonceInstruction = SystemInstruction.decodeNonceAdvance(instructions[0]);
  const nonce: Nonce = {
    type: InstructionBuilderTypes.NonceAdvance,
    params: {
      walletNonceAddress: advanceNonceInstruction.noncePubkey.toString(),
      authWalletAddress: advanceNonceInstruction.authorizedPubkey.toString(),
    },
  };
  instructionData.push(nonce);
  const authorize = instructions[1];
  assert(authorize.keys.length === 5, 'Invalid number of keys in authorize instruction');
  instructionData.push({
    type: InstructionBuilderTypes.StakingAuthorize,
    params: {
      stakingAddress: authorize.keys[0].pubkey.toString(),
      oldAuthorizeAddress: authorize.keys[2].pubkey.toString(),
      newAuthorizeAddress: authorize.keys[3].pubkey.toString(),
      custodianAddress: authorize.keys[4].pubkey.toString(),
    },
  });
  return instructionData;
}

/**
 * Parses Solana instructions to custom instruction params
 *
 * @param {TransactionInstruction[]} instructions - containing custom solana instructions
 * @param {InstructionParams[]} instructionMetadata - the instruction metadata for the transaction
 * @returns {InstructionParams[]} An array containing instruction params for custom instructions
 */
function parseCustomInstructions(
  instructions: TransactionInstruction[],
  instructionMetadata?: InstructionParams[]
): CustomInstruction[] {
  const instructionData: CustomInstruction[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];

    // Check if we have metadata for this instruction position
    if (
      instructionMetadata &&
      instructionMetadata[i] &&
      instructionMetadata[i].type === InstructionBuilderTypes.CustomInstruction
    ) {
      instructionData.push(instructionMetadata[i] as CustomInstruction);
    } else {
      // Convert the raw instruction to CustomInstruction format
      const customInstruction: CustomInstruction = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: {
          programId: instruction.programId.toString(),
          keys: instruction.keys.map((key) => ({
            pubkey: key.pubkey.toString(),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
          data: instruction.data.toString('base64'),
        },
      };
      instructionData.push(customInstruction);
    }
  }

  return instructionData;
}

function findTokenName(
  mintAddress: string,
  instructionMetadata?: InstructionParams[],
  _useTokenAddressTokenName?: boolean
): string {
  let token: string | undefined;

  coins.forEach((value, key) => {
    if (value instanceof SolCoin && value.tokenAddress === mintAddress) {
      token = value.name;
    }
  });

  if (!token && instructionMetadata) {
    instructionMetadata.forEach((instruction) => {
      if (
        instruction.type === InstructionBuilderTypes.CreateAssociatedTokenAccount &&
        instruction.params.mintAddress === mintAddress
      ) {
        token = instruction.params.tokenName;
      } else if (
        instruction.type === InstructionBuilderTypes.TokenTransfer &&
        instruction.params.tokenAddress === mintAddress
      ) {
        token = instruction.params.tokenName;
      }
    });
  }

  if (!token && _useTokenAddressTokenName) {
    token = mintAddress;
  }

  assert(token);

  return token;
}
