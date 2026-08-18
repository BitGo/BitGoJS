import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { INSTRUCTIONS_SYSVAR_ADDRESS, InstructionBuilderTypes, ZK_ELGAMAL_PROOF_PROGRAM_ID } from './constants';
import {
  ConfidentialMint,
  ConfigureConfidentialTransferAccount,
  CreateRecordAccount,
  WriteRecordData,
  VerifyEqualityProof,
  VerifyValidityProof,
  VerifyRangeProof,
  CloseRecordAccount,
  CloseContextState,
  InstructionParams,
} from './iface';
import { validateAddress } from './utils';
import assert from 'assert';

/**
 * Parameters for the confidential mint proof-account group.
 */
export interface ConfidentialMintParams {
  /** Token account receiving the confidential mint (must be Token-2022). */
  tokenAddress: string;
  /** Mint address (must be Token-2022 with ConfidentialTransferMint configured). */
  mintAddress: string;
  /** Mint authority that must sign the confidentialMint instruction. */
  authorityAddress: string;
  /** Payer / fee payer for creating proof accounts. */
  payerAddress: string;
  /** Address of the reusable record account for the range proof. */
  rangeRecordAddress: string;
  /** Address of the one-shot context state account for the equality proof. */
  equalityContextStateAddress: string;
  /** Address of the one-shot context state account for the ciphertext validity proof. */
  validityContextStateAddress: string;
  /** Authority that owns the context state accounts (usually the payer). */
  contextStateAuthorityAddress: string;
  /** Authority that owns the reusable record account. */
  recordAccountOwnerAddress?: string;
  /** Lamports for rent-exempt record account. If omitted, calculated from space. */
  recordAccountLamports?: number;
  /** 36-byte hex decryptable ciphertext of the new supply. */
  newDecryptableSupply: string;
  /** 64-byte hex low half of the auditor ciphertext. */
  mintAmountAuditorCiphertextLo: string;
  /** 64-byte hex high half of the auditor ciphertext. */
  mintAmountAuditorCiphertextHi: string;
  /** Hex data for the record account write (typically the 1000B BatchedRangeProofU128). */
  rangeRecordData: string;
  /** Optional second chunk of record data for 1-2 writes. */
  rangeRecordDataPart2?: string;
  /** Instruction offset to the equality proof verify instruction (relative to confidentialMint). */
  equalityProofInstructionOffset?: number;
  /** Instruction offset to the ciphertext validity proof verify instruction. */
  ciphertextValidityProofInstructionOffset?: number;
  /** Instruction offset to the range proof verify instruction. */
  rangeProofInstructionOffset?: number;
  /** Optional close the range record account after mint. */
  closeRecordAccount?: boolean;
  /** Optional close the equality context state account after mint. */
  closeEqualityContextState?: boolean;
  /** Optional close the validity context state account after mint. */
  closeValidityContextState?: boolean;
}

/**
 * Parameters for configuring a confidential transfer token account.
 */
export interface ConfigureConfidentialTransferAccountParams {
  /** Token account to configure. */
  tokenAddress: string;
  /** Mint address. */
  mintAddress: string;
  /** Account owner / authority that must sign. */
  authorityAddress: string;
  /** Optional instructions sysvar or context state address for proof verification. */
  instructionsSysvarOrContextStateAddress?: string;
  /** 36-byte hex decryptable zero balance ciphertext. */
  decryptableZeroBalance: string;
  /** Maximum pending balance credit counter as a decimal string. */
  maximumPendingBalanceCreditCounter: string;
  /** Offset to the proof instruction (usually 0 when proof is in same tx). */
  proofInstructionOffset?: number;
}

/**
 * Builder for Solana Token-2022 confidential mint transactions using the proof-account approach.
 *
 * This builder groups the proof-account tx sequence as one logical transaction:
 *   create-record → write(1-2) → verify equality → verify validity → verify range → confidentialMint
 *   → optional close record/context-state accounts.
 *
 * The actual zero-knowledge proofs are generated externally (e.g. KMS worker); the SDK only
 * assembles instruction data and account metadata.
 */
export class ConfidentialMintBuilder extends TransactionBuilder {
  private _mintParams?: ConfidentialMintParams;
  private _configureParams?: ConfigureConfidentialTransferAccountParams;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CustomTx;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      switch (instruction.type) {
        case InstructionBuilderTypes.ConfigureConfidentialTransferAccount:
          this._configureParams = this._extractConfigureParams(instruction);
          break;
        case InstructionBuilderTypes.ConfidentialMint:
          this._mintParams = this._extractMintParams(instruction);
          break;
      }
    }
  }

  /**
   * Configure a Token-2022 account for confidential transfers.
   *
   * @param params Configuration parameters.
   * @returns This builder.
   */
  configureConfidentialTransferAccount(params: ConfigureConfidentialTransferAccountParams): this {
    validateAddress(params.tokenAddress, 'tokenAddress');
    validateAddress(params.mintAddress, 'mintAddress');
    validateAddress(params.authorityAddress, 'authorityAddress');
    if (params.instructionsSysvarOrContextStateAddress) {
      validateAddress(params.instructionsSysvarOrContextStateAddress, 'instructionsSysvarOrContextStateAddress');
    }
    this._configureParams = params;
    return this;
  }

  /**
   * Set the confidential mint parameters and proof-account metadata.
   *
   * @param params Mint parameters.
   * @returns This builder.
   */
  confidentialMint(params: ConfidentialMintParams): this {
    validateAddress(params.tokenAddress, 'tokenAddress');
    validateAddress(params.mintAddress, 'mintAddress');
    validateAddress(params.authorityAddress, 'authorityAddress');
    validateAddress(params.payerAddress, 'payerAddress');
    validateAddress(params.rangeRecordAddress, 'rangeRecordAddress');
    validateAddress(params.equalityContextStateAddress, 'equalityContextStateAddress');
    validateAddress(params.validityContextStateAddress, 'validityContextStateAddress');
    validateAddress(params.contextStateAuthorityAddress, 'contextStateAuthorityAddress');
    if (params.recordAccountOwnerAddress) {
      validateAddress(params.recordAccountOwnerAddress, 'recordAccountOwnerAddress');
    }
    this._mintParams = params;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');

    const instructions: (
      | ConfigureConfidentialTransferAccount
      | CreateRecordAccount
      | WriteRecordData
      | VerifyEqualityProof
      | VerifyValidityProof
      | VerifyRangeProof
      | ConfidentialMint
      | CloseRecordAccount
      | CloseContextState
    )[] = [];

    if (this._configureParams) {
      instructions.push({
        type: InstructionBuilderTypes.ConfigureConfidentialTransferAccount,
        params: {
          tokenAddress: this._configureParams.tokenAddress,
          mintAddress: this._configureParams.mintAddress,
          authorityAddress: this._configureParams.authorityAddress,
          instructionsSysvarOrContextStateAddress:
            this._configureParams.instructionsSysvarOrContextStateAddress || INSTRUCTIONS_SYSVAR_ADDRESS,
          decryptableZeroBalance: this._configureParams.decryptableZeroBalance,
          maximumPendingBalanceCreditCounter: this._configureParams.maximumPendingBalanceCreditCounter,
          proofInstructionOffset: this._configureParams.proofInstructionOffset ?? 0,
        },
      });
    }

    if (this._mintParams) {
      const params = this._mintParams;
      const recordOwner = params.recordAccountOwnerAddress || ZK_ELGAMAL_PROOF_PROGRAM_ID;
      const rangeRecordBytes = Buffer.from(params.rangeRecordData, 'hex');
      const space = rangeRecordBytes.length;
      // Solana rent-exempt: (account_size + 128) * rent_per_byte_per_year * 2 years
      // rent_per_byte_per_year = 6960 lamports (fixed by Solana runtime)
      const lamports = params.recordAccountLamports ?? (space + 128) * 6960 * 2;

      instructions.push({
        type: InstructionBuilderTypes.CreateRecordAccount,
        params: {
          payerAddress: params.payerAddress,
          recordAccountAddress: params.rangeRecordAddress,
          recordAccountOwnerAddress: recordOwner,
          space,
          lamports,
        },
      });

      instructions.push({
        type: InstructionBuilderTypes.WriteRecordData,
        params: {
          recordAccountAddress: params.rangeRecordAddress,
          recordAccountOwnerAddress: recordOwner,
          offset: 0,
          data: params.rangeRecordData,
        },
      });

      if (params.rangeRecordDataPart2) {
        instructions.push({
          type: InstructionBuilderTypes.WriteRecordData,
          params: {
            recordAccountAddress: params.rangeRecordAddress,
            recordAccountOwnerAddress: recordOwner,
            offset: rangeRecordBytes.length,
            data: params.rangeRecordDataPart2,
          },
        });
      }

      instructions.push({
        type: InstructionBuilderTypes.VerifyEqualityProof,
        params: {
          proofAccountAddress: params.rangeRecordAddress,
          contextStateAccountAddress: params.equalityContextStateAddress,
          contextStateAuthorityAddress: params.contextStateAuthorityAddress,
        },
      });

      instructions.push({
        type: InstructionBuilderTypes.VerifyValidityProof,
        params: {
          proofAccountAddress: params.rangeRecordAddress,
          contextStateAccountAddress: params.validityContextStateAddress,
          contextStateAuthorityAddress: params.contextStateAuthorityAddress,
        },
      });

      // VerifyBatchedRangeProofU128 reads the proof from the record account only;
      // it does not use a context state account (unlike equality/validity proofs).
      instructions.push({
        type: InstructionBuilderTypes.VerifyRangeProof,
        params: {
          proofAccountAddress: params.rangeRecordAddress,
        },
      });

      instructions.push({
        type: InstructionBuilderTypes.ConfidentialMint,
        params: {
          tokenAddress: params.tokenAddress,
          mintAddress: params.mintAddress,
          authorityAddress: params.authorityAddress,
          equalityRecordAddress: params.equalityContextStateAddress,
          ciphertextValidityRecordAddress: params.validityContextStateAddress,
          rangeRecordAddress: params.rangeRecordAddress,
          newDecryptableSupply: params.newDecryptableSupply,
          mintAmountAuditorCiphertextLo: params.mintAmountAuditorCiphertextLo,
          mintAmountAuditorCiphertextHi: params.mintAmountAuditorCiphertextHi,
          // Offsets are signed i8 relative to confidentialMint; encoded as unsigned u8
          // (two's complement: -3 → 253, -2 → 254, -1 → 255)
          equalityProofInstructionOffset: (params.equalityProofInstructionOffset ?? -3) & 0xff,
          ciphertextValidityProofInstructionOffset: (params.ciphertextValidityProofInstructionOffset ?? -2) & 0xff,
          rangeProofInstructionOffset: (params.rangeProofInstructionOffset ?? -1) & 0xff,
        },
      });

      if (params.closeRecordAccount) {
        instructions.push({
          type: InstructionBuilderTypes.CloseRecordAccount,
          params: {
            recordAccountAddress: params.rangeRecordAddress,
            destinationAddress: params.payerAddress,
            authorityAddress: recordOwner,
          },
        });
      }

      if (params.closeEqualityContextState) {
        instructions.push({
          type: InstructionBuilderTypes.CloseContextState,
          params: {
            contextStateAccountAddress: params.equalityContextStateAddress,
            destinationAddress: params.payerAddress,
            authorityAddress: params.contextStateAuthorityAddress,
          },
        });
      }

      if (params.closeValidityContextState) {
        instructions.push({
          type: InstructionBuilderTypes.CloseContextState,
          params: {
            contextStateAccountAddress: params.validityContextStateAddress,
            destinationAddress: params.payerAddress,
            authorityAddress: params.contextStateAuthorityAddress,
          },
        });
      }
    }

    if (instructions.length === 0) {
      throw new BuildTransactionError(
        'A confidential mint or configure instruction must be set before building the transaction'
      );
    }

    this._instructionsData = instructions as InstructionParams[];
    return await super.buildImplementation();
  }

  private _extractConfigureParams(
    instruction: ConfigureConfidentialTransferAccount
  ): ConfigureConfidentialTransferAccountParams {
    return {
      tokenAddress: instruction.params.tokenAddress,
      mintAddress: instruction.params.mintAddress,
      authorityAddress: instruction.params.authorityAddress,
      instructionsSysvarOrContextStateAddress: instruction.params.instructionsSysvarOrContextStateAddress,
      decryptableZeroBalance: instruction.params.decryptableZeroBalance,
      maximumPendingBalanceCreditCounter: instruction.params.maximumPendingBalanceCreditCounter,
      proofInstructionOffset: instruction.params.proofInstructionOffset,
    };
  }

  private _extractMintParams(instruction: ConfidentialMint): ConfidentialMintParams {
    return {
      tokenAddress: instruction.params.tokenAddress,
      mintAddress: instruction.params.mintAddress,
      authorityAddress: instruction.params.authorityAddress,
      // Payer cannot be recovered from the instruction alone; default to authority.
      payerAddress: instruction.params.authorityAddress,
      rangeRecordAddress: instruction.params.rangeRecordAddress || '',
      equalityContextStateAddress: instruction.params.equalityRecordAddress || '',
      validityContextStateAddress: instruction.params.ciphertextValidityRecordAddress || '',
      contextStateAuthorityAddress: instruction.params.authorityAddress,
      newDecryptableSupply: instruction.params.newDecryptableSupply,
      mintAmountAuditorCiphertextLo: instruction.params.mintAmountAuditorCiphertextLo,
      mintAmountAuditorCiphertextHi: instruction.params.mintAmountAuditorCiphertextHi,
      rangeRecordData: '',
    };
  }
}
