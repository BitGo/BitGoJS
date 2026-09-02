import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { InstructionBuilderTypes } from './constants';
import {
  ApplyPendingBalance,
  ConfidentialDeposit,
  ConfidentialTransfer,
  ConfidentialWithdraw,
  ConfigureConfidentialTransferAccount,
  InstructionParams,
  VerifyEqualityProof,
  VerifyPubkeyValidity,
  VerifyRangeProof,
  VerifyValidityProof,
} from './iface';
import assert from 'assert';

/**
 * Builder for Token-2022 confidential transfer transactions.
 *
 * Provides type-safe fluent setters for the following CT instructions:
 * - ConfigureAccount (standalone, with VerifyPubkeyValidity proof)
 * - ApplyPendingBalance (always instruction #1 in v1 spend txs, idempotent)
 * - Deposit (public → confidential conversion)
 * - Withdraw (confidential → public conversion, with equality + range proofs)
 * - Transfer (confidential → confidential, with equality + validity + range proofs)
 * - VerifyPubkeyValidity / VerifyEquality / VerifyValidity / VerifyRange proof instructions
 *
 * Instruction builders are v0/v1-agnostic: they produce instruction data and
 * account metas only. The caller (Wallet Platform) assembles them into v1
 * transactions in the correct order.
 *
 * @example
 * ```ts
 * const builder = factory.getConfidentialTransferBuilder();
 * builder.nonce(recentBlockhash).sender(payer);
 * builder.configureAccount({ tokenAddress, mintAddress, authorityAddress, ... });
 * builder.verifyPubkeyValidity({ proofData });
 * const tx = await builder.build();
 * ```
 */
export class ConfidentialTransferBuilder extends TransactionBuilder {
  private _ctInstructions: InstructionParams[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.ConfidentialTransfer;
  }

  /**
   * Override the zk-elgamal-proof program id.
   *
   * Defaults to the canonical on-chain program id (`ZkE1Gama1Proof111...`)
   * which is the same across mainnet, devnet, and testnet. Override only
   * when targeting a custom deployment.
   *
   * @param programId - base58 encoded program id
   */
  zkProofProgramId(programId: string): this {
    assert(programId, 'Missing programId param');
    this._zkProofProgramId = programId;
    return this;
  }

  /** @inheritDoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this._ctInstructions = [];
    for (const instruction of this._instructionsData) {
      switch (instruction.type) {
        case InstructionBuilderTypes.ConfigureConfidentialTransferAccount:
        case InstructionBuilderTypes.ApplyPendingBalance:
        case InstructionBuilderTypes.ConfidentialDeposit:
        case InstructionBuilderTypes.ConfidentialWithdraw:
        case InstructionBuilderTypes.ConfidentialTransfer:
        case InstructionBuilderTypes.VerifyPubkeyValidity:
        case InstructionBuilderTypes.VerifyEqualityProof:
        case InstructionBuilderTypes.VerifyValidityProof:
        case InstructionBuilderTypes.VerifyRangeProof:
          this._ctInstructions.push(instruction);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Add a ConfigureAccount instruction to the transaction.
   * One-time ATA setup — registers ElGamal pubkey + AES zero ciphertext.
   * Must be accompanied by a VerifyPubkeyValidity proof instruction.
   */
  configureAccount(params: ConfigureConfidentialTransferAccount['params']): this {
    assert(params.tokenAddress, 'Missing tokenAddress param');
    assert(params.mintAddress, 'Missing mintAddress param');
    assert(params.authorityAddress, 'Missing authorityAddress param');
    assert(params.decryptableZeroBalance, 'Missing decryptableZeroBalance param');
    assert(params.maximumPendingBalanceCreditCounter, 'Missing maximumPendingBalanceCreditCounter param');

    this._ctInstructions.push({
      type: InstructionBuilderTypes.ConfigureConfidentialTransferAccount,
      params,
    });
    return this;
  }

  /**
   * Add an ApplyPendingBalance instruction to the transaction.
   * Credits pending balance into available balance. Idempotent (no-op if 0 pending).
   * In v1 transactions, this should always be instruction #1.
   */
  applyPendingBalance(params: ApplyPendingBalance['params']): this {
    assert(params.tokenAddress, 'Missing tokenAddress param');
    assert(params.authorityAddress, 'Missing authorityAddress param');
    assert(params.expectedPendingBalanceCreditCounter, 'Missing expectedPendingBalanceCreditCounter param');
    assert(params.newDecryptableAvailableBalance, 'Missing newDecryptableAvailableBalance param');

    this._ctInstructions.push({
      type: InstructionBuilderTypes.ApplyPendingBalance,
      params,
    });
    return this;
  }

  /**
   * Add a Deposit instruction to the transaction.
   * Moves public SPL tokens into confidential pending balance. No proof required.
   */
  confidentialDeposit(params: ConfidentialDeposit['params']): this {
    assert(params.tokenAddress, 'Missing tokenAddress param');
    assert(params.mintAddress, 'Missing mintAddress param');
    assert(params.authorityAddress, 'Missing authorityAddress param');
    assert(params.amount, 'Missing amount param');

    this._ctInstructions.push({
      type: InstructionBuilderTypes.ConfidentialDeposit,
      params,
    });
    return this;
  }

  /**
   * Add a Withdraw instruction to the transaction.
   * Moves confidential available balance to public balance.
   * Requires equality + range proof verification instructions.
   */
  confidentialWithdraw(params: ConfidentialWithdraw['params']): this {
    assert(params.tokenAddress, 'Missing tokenAddress param');
    assert(params.mintAddress, 'Missing mintAddress param');
    assert(params.authorityAddress, 'Missing authorityAddress param');
    assert(params.amount, 'Missing amount param');
    assert(params.newDecryptableAvailableBalance, 'Missing newDecryptableAvailableBalance param');

    this._ctInstructions.push({
      type: InstructionBuilderTypes.ConfidentialWithdraw,
      params,
    });
    return this;
  }

  /**
   * Add a confidential Transfer instruction to the transaction.
   * Requires equality + ciphertext validity + range proof verification instructions.
   */
  confidentialTransfer(params: ConfidentialTransfer['params']): this {
    assert(params.sourceTokenAddress, 'Missing sourceTokenAddress param');
    assert(params.mintAddress, 'Missing mintAddress param');
    assert(params.destinationTokenAddress, 'Missing destinationTokenAddress param');
    assert(params.authorityAddress, 'Missing authorityAddress param');
    assert(params.newSourceDecryptableAvailableBalance, 'Missing newSourceDecryptableAvailableBalance param');
    assert(params.transferAmountAuditorCiphertextLo, 'Missing transferAmountAuditorCiphertextLo param');
    assert(params.transferAmountAuditorCiphertextHi, 'Missing transferAmountAuditorCiphertextHi param');

    this._ctInstructions.push({
      type: InstructionBuilderTypes.ConfidentialTransfer,
      params,
    });
    return this;
  }

  /**
   * Add a VerifyPubkeyValidity proof instruction (used with ConfigureAccount).
   */
  verifyPubkeyValidity(params: VerifyPubkeyValidity['params']): this {
    this._ctInstructions.push({
      type: InstructionBuilderTypes.VerifyPubkeyValidity,
      params,
    });
    return this;
  }

  /**
   * Add a VerifyCiphertextCommitmentEquality proof instruction (used with Transfer and Withdraw).
   */
  verifyEqualityProof(params: VerifyEqualityProof['params']): this {
    this._ctInstructions.push({
      type: InstructionBuilderTypes.VerifyEqualityProof,
      params,
    });
    return this;
  }

  /**
   * Add a VerifyBatchedGroupedCiphertext3HandlesValidity proof instruction (used with Transfer).
   */
  verifyValidityProof(params: VerifyValidityProof['params']): this {
    this._ctInstructions.push({
      type: InstructionBuilderTypes.VerifyValidityProof,
      params,
    });
    return this;
  }

  /**
   * Add a VerifyBatchedRangeProofU128 proof instruction (used with Transfer).
   */
  verifyRangeProof(params: VerifyRangeProof['params']): this {
    this._ctInstructions.push({
      type: InstructionBuilderTypes.VerifyRangeProof,
      params,
    });
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._ctInstructions.length > 0, 'At least one confidential transfer instruction must be specified');

    this._instructionsData = [...this._ctInstructions];

    return await super.buildImplementation();
  }
}
