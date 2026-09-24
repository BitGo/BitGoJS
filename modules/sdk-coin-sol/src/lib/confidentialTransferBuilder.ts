import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, SolTransactionVersion, SolV1TransactionConfig, TransactionType } from '@bitgo/sdk-core';
import { PublicKey, Transaction as SolTransaction, TransactionInstruction } from '@solana/web3.js';
import nacl from 'tweetnacl';
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
  Memo,
  VerifyEqualityProof,
  VerifyPubkeyValidity,
  VerifyRangeProof,
  VerifyValidityProof,
} from './iface';
import { compileV1Message } from './v1/compileV1Message';
import { serializeV1Transaction } from './v1/serializeV1Transaction';
import { solInstructionFactory } from './solInstructionFactory';
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
  private _version?: SolTransactionVersion;
  private _v1TransactionConfig?: SolV1TransactionConfig;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.ConfidentialTransfer;
  }

  /**
   * Set the Solana transaction version.
   *
   * Defaults to legacy until set. When set to `1`, the builder assembles a v1
   * (SIMD-0296/0385) transaction: version byte `0x81`, an inline `transactionConfig`
   * instead of ComputeBudget instructions, no address lookup tables, and a
   * message-first wire format with signatures appended.
   *
   * @param version - the transaction version (0 = v0, 1 = v1)
   * @returns {this} This builder
   */
  version(version: SolTransactionVersion): this {
    this._version = version;
    return this;
  }

  /**
   * Set the v1 transaction config (compute unit limit, heap size, loaded accounts
   * data size limit, and priority fee as total lamports). Required when
   * `version(1)` is set.
   *
   * @param config - the v1 transaction config
   * @returns {this} This builder
   */
  transactionConfig(config: SolV1TransactionConfig): this {
    this._v1TransactionConfig = config;
    return this;
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

    if (this._version === 1) {
      return this.buildV1();
    }

    this._instructionsData = [...this._ctInstructions];

    return await super.buildImplementation();
  }

  /**
   * Build a v1 (SIMD-0296/0385) confidential transfer transaction.
   *
   * Assembles the CT instructions via the shared instruction factory, compiles
   * and serializes a v1 message with the inline transaction config, signs the
   * message bytes with the builder's signers, and stores the resulting wire
   * bytes for broadcast. Also populates a metadata-only SolTransaction so the
   * transaction JSON and input/output extraction remain usable.
   *
   * @returns {Transaction} The built transaction holding the v1 wire bytes
   */
  private buildV1(): Transaction {
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._recentBlockhash, new BuildTransactionError('recent blockhash is required before building'));
    assert(this._v1TransactionConfig, 'transactionConfig is required to build a v1 confidential transfer transaction');

    // ApplyPendingBalance must remain instruction #1 in v1 spend txs (it is idempotent),
    // regardless of the order the caller added instructions.
    this._ctInstructions = [
      ...this._ctInstructions.filter((i) => i.type === InstructionBuilderTypes.ApplyPendingBalance),
      ...this._ctInstructions.filter((i) => i.type !== InstructionBuilderTypes.ApplyPendingBalance),
    ];

    const instructions: TransactionInstruction[] = [];
    for (const instruction of this._ctInstructions) {
      instructions.push(...solInstructionFactory(instruction, this._zkProofProgramId));
    }

    if (this._memo) {
      const memoData: Memo = {
        type: InstructionBuilderTypes.Memo,
        params: { memo: this._memo },
      };
      this._ctInstructions.push(memoData);
      instructions.push(...solInstructionFactory(memoData));
    }

    const feePayer = this._feePayer ? new PublicKey(this._feePayer) : new PublicKey(this._sender);
    const messageBytes = compileV1Message({
      instructions,
      feePayer,
      recentBlockhash: this._recentBlockhash,
      transactionConfig: this._v1TransactionConfig,
    });

    const signatures: Uint8Array[] = [];
    for (const signer of this._signers) {
      const secretKey = signer.getKeys(true).prv;
      assert(secretKey instanceof Uint8Array, 'Missing private key');
      signatures.push(nacl.sign.detached(messageBytes, secretKey));
    }
    for (const signature of this.getAdditionalSignatures()) {
      signatures.push(new Uint8Array(signature.signature));
    }

    const v1Wire = serializeV1Transaction(messageBytes, signatures);

    this._transaction.v1TransactionBytes = v1Wire;
    this._transaction.v1MessageBytes = messageBytes;

    // Populate a metadata-only SolTransaction so toJson / loadInputsAndOutputs work.
    const metaTx = new SolTransaction();
    metaTx.feePayer = feePayer;
    metaTx.recentBlockhash = this._recentBlockhash;
    metaTx.add(...instructions);
    this._transaction.solTransaction = metaTx;

    this._transaction.setTransactionType(this.transactionType);
    this._transaction.setInstructionsData(this._ctInstructions);
    this._transaction.loadInputsAndOutputs();

    return this._transaction;
  }
}
