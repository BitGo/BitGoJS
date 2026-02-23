import {
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  ITokenEnablement,
  ParseTransactionError,
  SigningError,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  Blockhash,
  PublicKey,
  Signer,
  Transaction as SolTransaction,
  SystemInstruction,
  VersionedTransaction,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import base58 from 'bs58';
import { explainSolTransaction, KeyPair } from '.';
import {
  InstructionBuilderTypes,
  UNAVAILABLE_TEXT,
  validInstructionData,
  ValidInstructionTypesEnum,
} from './constants';
import {
  AtaInit,
  DurableNonceParams,
  InstructionParams,
  Memo,
  Nonce,
  StakingActivate,
  StakingAuthorizeParams,
  StakingWithdraw,
  TokenTransfer,
  TransactionExplanation,
  Transfer,
  TxData,
  VersionedTransactionData,
  WalletInit,
} from './iface';
import { instructionParamsFactory } from './instructionParamsFactory';
import {
  getInstructionType,
  getTransactionType,
  isValidRawTransaction,
  requiresAllSignatures,
  validateRawMsgInstruction,
} from './utils';
import { SolStakingTypeEnum } from '@bitgo/public-types';

export class Transaction extends BaseTransaction {
  protected _solTransaction: SolTransaction;
  private _lamportsPerSignature: number | undefined;
  private _tokenAccountRentExemptAmount: string | undefined;
  protected _type: TransactionType;
  protected _instructionsData: InstructionParams[] = [];
  private _useTokenAddressTokenName = false;
  private _versionedTransaction: VersionedTransaction | undefined;
  private _versionedTransactionData: VersionedTransactionData | undefined;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get solTransaction(): SolTransaction {
    return this._solTransaction;
  }

  set solTransaction(tx: SolTransaction) {
    this._solTransaction = tx;
  }

  private get numberOfRequiredSignatures(): number {
    return this._solTransaction.compileMessage().header.numRequiredSignatures;
  }

  private get numberOfATACreationInstructions(): number {
    return this._solTransaction.instructions.filter(
      (instruction) => getInstructionType(instruction) === ValidInstructionTypesEnum.InitializeAssociatedTokenAccount
    ).length;
  }

  /** @inheritDoc */
  get signablePayload(): Buffer {
    if (this._versionedTransaction) {
      return Buffer.from(this._versionedTransaction.message.serialize());
    }
    return this._solTransaction.serializeMessage();
  }

  /** @inheritDoc **/
  get id(): string {
    // Solana transaction ID === first signature: https://docs.solana.com/terminology#transaction-id
    if (this._versionedTransaction) {
      const sig = this._versionedTransaction.signatures?.[0];
      // Check if signature exists and is not a placeholder signature (all zeros)
      if (sig && sig.some((byte) => byte !== 0)) {
        return base58.encode(sig);
      }
    }

    if (this._solTransaction.signature) {
      return base58.encode(this._solTransaction.signature);
    }

    return UNAVAILABLE_TEXT;
  }

  get lamportsPerSignature(): number | undefined {
    return this._lamportsPerSignature;
  }

  set lamportsPerSignature(lamportsPerSignature: number | undefined) {
    this._lamportsPerSignature = lamportsPerSignature;
  }

  get tokenAccountRentExemptAmount(): string | undefined {
    return this._tokenAccountRentExemptAmount;
  }

  set tokenAccountRentExemptAmount(tokenAccountRentExemptAmount: string | undefined) {
    this._tokenAccountRentExemptAmount = tokenAccountRentExemptAmount;
  }

  /** @inheritDoc */
  get signature(): string[] {
    const signatures: string[] = [];

    if (this._versionedTransaction) {
      // Handle VersionedTransaction signatures
      for (const sig of this._versionedTransaction.signatures) {
        // Filters out placeholder signatures
        if (sig && sig.some((b) => b !== 0)) {
          signatures.push(base58.encode(sig));
        }
      }
    } else {
      // Handle legacy transaction signatures
      for (const solSignature of this._solTransaction.signatures) {
        if (solSignature.signature) {
          signatures.push(base58.encode(solSignature.signature));
        }
      }
    }

    return signatures;
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Set the instructionData.
   *
   * @param {InstructionParams[]} instructionData The instruction data to be set.
   */
  setInstructionsData(instructionData: InstructionParams[]): void {
    this._instructionsData = instructionData;
  }

  get useTokenAddressTokenName(): boolean {
    return this._useTokenAddressTokenName;
  }

  setUseTokenAddressTokenName(value: boolean): void {
    this._useTokenAddressTokenName = value;
  }

  /**
   * Check if this transaction is a VersionedTransaction
   * @returns {boolean} True if this is a VersionedTransaction
   */
  isVersionedTransaction(): boolean {
    return !!this._versionedTransaction || !!this._versionedTransactionData;
  }

  /**
   * Get the original VersionedTransaction if this transaction was parsed from one
   * @returns {VersionedTransaction | undefined} The VersionedTransaction or undefined
   */
  get versionedTransaction(): VersionedTransaction | undefined {
    return this._versionedTransaction;
  }

  /**
   * Set a built VersionedTransaction
   * @param {VersionedTransaction} versionedTx The VersionedTransaction to set
   */
  set versionedTransaction(versionedTx: VersionedTransaction | undefined) {
    this._versionedTransaction = versionedTx;
  }

  /**
   * Get the stored VersionedTransactionData
   * @returns {VersionedTransactionData | undefined} The stored data or undefined
   */
  getVersionedTransactionData(): VersionedTransactionData | undefined {
    return this._versionedTransactionData;
  }

  /**
   * Set the VersionedTransactionData for this transaction
   * @param {VersionedTransactionData | undefined} data The versioned transaction data to store, or undefined to clear
   */
  setVersionedTransactionData(data: VersionedTransactionData | undefined): void {
    this._versionedTransactionData = data;
  }

  /** @inheritdoc */
  canSign(): boolean {
    return true;
  }

  /**
   * Signs transaction.
   *
   * @param {KeyPair} keyPair Signer keys.
   */
  async sign(keyPair: KeyPair[] | KeyPair): Promise<void> {
    // Convert to array and build signers list
    const keyPairs = keyPair instanceof Array ? keyPair : [keyPair];
    const signers: Signer[] = [];
    for (const kp of keyPairs) {
      const keys = kp.getKeys(true);
      if (!keys.prv) {
        throw new SigningError('Missing private key');
      }
      signers.push({ publicKey: new PublicKey(keys.pub), secretKey: keys.prv as Uint8Array });
    }

    if (this._versionedTransaction) {
      if (!this._versionedTransaction.message.recentBlockhash) {
        throw new SigningError('Nonce is required before signing');
      }
      this._versionedTransaction.sign(signers);
      return;
    }

    if (!this._solTransaction || !this._solTransaction.recentBlockhash) {
      throw new SigningError('Nonce is required before signing');
    }
    if (!this._solTransaction || !this._solTransaction.feePayer) {
      throw new SigningError('feePayer is required before signing');
    }
    this._solTransaction.partialSign(...signers);
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (this._versionedTransaction) {
      // VersionedTransaction.serialize() doesn't need requireAllSignatures parameter
      // It automatically handles whatever signatures are present
      return Buffer.from(this._versionedTransaction.serialize()).toString('base64');
    }

    if (!this._solTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    // The signatures can have null signatures (which means they are required but yet unsigned)
    // In order to be able to serializer the txs, we have to change the requireAllSignatures based
    // on if the TX is fully signed or not
    const requireAllSignatures = requiresAllSignatures(this._solTransaction.signatures);
    // Based on the recomendation encoding found here https://docs.solana.com/developing/clients/jsonrpc-api#sendtransaction
    // We use base64 encoding
    return this._solTransaction.serialize({ requireAllSignatures }).toString('base64');
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      isValidRawTransaction(rawTransaction);
      this._solTransaction = SolTransaction.from(Buffer.from(rawTransaction, 'base64'));
      if (this._solTransaction.signature && this._solTransaction.signature !== null) {
        this._id = base58.encode(this._solTransaction.signature);
      }
      const transactionType = getTransactionType(this._solTransaction);
      switch (transactionType) {
        case TransactionType.WalletInitialization:
          this.setTransactionType(TransactionType.WalletInitialization);
          break;
        case TransactionType.Send:
          this.setTransactionType(TransactionType.Send);
          break;
        case TransactionType.StakingActivate:
          this.setTransactionType(TransactionType.StakingActivate);
          break;
        case TransactionType.StakingDeactivate:
          this.setTransactionType(TransactionType.StakingDeactivate);
          break;
        case TransactionType.StakingWithdraw:
          this.setTransactionType(TransactionType.StakingWithdraw);
          break;
        case TransactionType.AssociatedTokenAccountInitialization:
          this.setTransactionType(TransactionType.AssociatedTokenAccountInitialization);
          break;
        case TransactionType.CloseAssociatedTokenAccount:
          this.setTransactionType(TransactionType.CloseAssociatedTokenAccount);
          break;
        case TransactionType.StakingAuthorize:
          this.setTransactionType(TransactionType.StakingAuthorize);
          break;
        case TransactionType.StakingAuthorizeRaw:
          this.setTransactionType(TransactionType.StakingAuthorizeRaw);
          break;
        case TransactionType.StakingDelegate:
          this.setTransactionType(TransactionType.StakingDelegate);
          break;
        case TransactionType.CustomTx:
          this.setTransactionType(TransactionType.CustomTx);
          break;
      }
      if (transactionType !== TransactionType.StakingAuthorizeRaw) {
        this.loadInputsAndOutputs();
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._solTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }

    let durableNonce: DurableNonceParams | undefined;
    if (this._solTransaction.nonceInfo) {
      const nonceInstruction = SystemInstruction.decodeNonceAdvance(this._solTransaction.nonceInfo.nonceInstruction);
      durableNonce = {
        walletNonceAddress: nonceInstruction.noncePubkey.toString(),
        authWalletAddress: nonceInstruction.authorizedPubkey.toString(),
      };
    }
    const instructionData = instructionParamsFactory(
      this._type,
      this._solTransaction.instructions,
      this._coinConfig.name,
      this._instructionsData,
      this._useTokenAddressTokenName
    );
    if (this._type) {
      if (
        !durableNonce &&
        instructionData.length > 1 &&
        instructionData[0].type === InstructionBuilderTypes.NonceAdvance
      ) {
        durableNonce = instructionData[0].params;
      }
    }
    const result: TxData = {
      id: this._solTransaction.signature ? this.id : undefined,
      feePayer: this._solTransaction.feePayer?.toString(),
      lamportsPerSignature: this.lamportsPerSignature,
      nonce: this.getNonce(),
      durableNonce: durableNonce,
      numSignatures: this.signature.length,
      instructionsData: instructionData,
    };
    return result;
  }

  /**
   * Get the nonce from the Solana Transaction
   * Throws if not set
   */
  private getNonce(): Blockhash {
    if (this._solTransaction.recentBlockhash) {
      return this._solTransaction.recentBlockhash;
    } else if (this._solTransaction.nonceInfo) {
      return this._solTransaction.nonceInfo.nonce;
    } else {
      throw new InvalidTransactionError('Nonce is not set');
    }
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this._solTransaction || this._solTransaction.instructions?.length === 0) {
      return;
    }
    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    const instructionParams = instructionParamsFactory(
      this.type,
      this._solTransaction.instructions,
      this._coinConfig.name,
      this._instructionsData,
      this._useTokenAddressTokenName
    );

    for (const instruction of instructionParams) {
      switch (instruction.type) {
        case InstructionBuilderTypes.CreateNonceAccount:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;
        case InstructionBuilderTypes.Transfer:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: instruction.params.toAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;
        case InstructionBuilderTypes.TokenTransfer:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: instruction.params.tokenName,
          });
          outputs.push({
            address: instruction.params.toAddress,
            value: instruction.params.amount,
            coin: instruction.params.tokenName,
          });
          break;
        case InstructionBuilderTypes.StakingActivate:
          inputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          if (instruction.params.stakingType !== SolStakingTypeEnum.JITO) {
            outputs.push({
              address: instruction.params.stakingAddress,
              value: instruction.params.amount,
              coin: this._coinConfig.name,
            });
          }
          break;
        case InstructionBuilderTypes.StakingDeactivate:
          if (
            instruction.params.amount &&
            instruction.params.unstakingAddress &&
            instruction.params.stakingType !== SolStakingTypeEnum.JITO
          ) {
            inputs.push({
              address: instruction.params.stakingAddress,
              value: instruction.params.amount,
              coin: this._coinConfig.name,
            });
            outputs.push({
              address: instruction.params.unstakingAddress,
              value: instruction.params.amount,
              coin: this._coinConfig.name,
            });
          }
          break;
        case InstructionBuilderTypes.StakingWithdraw:
          inputs.push({
            address: instruction.params.stakingAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: instruction.params.fromAddress,
            value: instruction.params.amount,
            coin: this._coinConfig.name,
          });
          break;
        case InstructionBuilderTypes.CreateAssociatedTokenAccount:
          break;
        case InstructionBuilderTypes.CloseAssociatedTokenAccount:
          break;
        case InstructionBuilderTypes.StakingAuthorize:
          break;
        case InstructionBuilderTypes.StakingDelegate:
          break;
        case InstructionBuilderTypes.SetComputeUnitLimit:
          break;
        case InstructionBuilderTypes.SetPriorityFee:
          break;
        case InstructionBuilderTypes.CustomInstruction:
          break;
      }
    }
    this._outputs = outputs;
    this._inputs = inputs;
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    // Testnet uses WASM-based parsing (no @solana/web3.js dependency).
    // This validates the WASM path against production traffic before
    // replacing the legacy implementation for all networks.
    if (this._coinConfig.name === 'tsol') {
      return explainSolTransaction({
        txBase64: this.toBroadcastFormat(),
        feeInfo: this._lamportsPerSignature ? { fee: this._lamportsPerSignature.toString() } : undefined,
        tokenAccountRentExemptAmount: this._tokenAccountRentExemptAmount,
        coinName: this._coinConfig.name,
      });
    }

    if (validateRawMsgInstruction(this._solTransaction.instructions)) {
      return this.explainRawMsgAuthorizeTransaction();
    }
    const decodedInstructions = instructionParamsFactory(
      this._type,
      this._solTransaction.instructions,
      this._coinConfig.name,
      this._instructionsData,
      this._useTokenAddressTokenName
    );

    let memo: string | undefined = undefined;
    let durableNonce: DurableNonceParams | undefined = undefined;

    let outputAmount = new BigNumber(0);
    const outputs: TransactionRecipient[] = [];
    // Create a separate array for token enablements
    const tokenEnablements: ITokenEnablement[] = [];

    for (const instruction of decodedInstructions) {
      switch (instruction.type) {
        case InstructionBuilderTypes.NonceAdvance:
          durableNonce = (instruction as Nonce).params;
          break;
        case InstructionBuilderTypes.Memo:
          memo = (instruction as Memo).params.memo;
          break;
        case InstructionBuilderTypes.Transfer:
          const transferInstruction = instruction as Transfer;
          outputs.push({
            address: transferInstruction.params.toAddress,
            amount: transferInstruction.params.amount,
          });
          outputAmount = outputAmount.plus(transferInstruction.params.amount);
          break;
        case InstructionBuilderTypes.TokenTransfer:
          const tokenTransferInstruction = instruction as TokenTransfer;
          outputs.push({
            address: tokenTransferInstruction.params.toAddress,
            amount: tokenTransferInstruction.params.amount,
            tokenName: tokenTransferInstruction.params.tokenName,
          });
          break;
        case InstructionBuilderTypes.CreateNonceAccount:
          const createInstruction = instruction as WalletInit;
          outputs.push({
            address: createInstruction.params.nonceAddress,
            amount: createInstruction.params.amount,
          });
          outputAmount = outputAmount.plus(createInstruction.params.amount);
          break;
        case InstructionBuilderTypes.StakingActivate:
          const stakingActivateInstruction = instruction as StakingActivate;
          outputs.push({
            address: stakingActivateInstruction.params.stakingAddress,
            amount: stakingActivateInstruction.params.amount,
          });
          outputAmount = outputAmount.plus(stakingActivateInstruction.params.amount);
          break;
        case InstructionBuilderTypes.StakingWithdraw:
          const stakingWithdrawInstruction = instruction as StakingWithdraw;
          outputs.push({
            address: stakingWithdrawInstruction.params.fromAddress,
            amount: stakingWithdrawInstruction.params.amount,
          });
          outputAmount = outputAmount.plus(stakingWithdrawInstruction.params.amount);
          break;
        case InstructionBuilderTypes.CreateAssociatedTokenAccount:
          // Process token enablement instructions and collect them in the tokenEnablements array
          const ataInit = instruction as AtaInit;
          tokenEnablements.push({
            address: ataInit.params.ataAddress,
            tokenName: ataInit.params.tokenName,
            tokenAddress: ataInit.params.mintAddress,
          });
          break;
        case InstructionBuilderTypes.CustomInstruction:
          // Custom instructions are arbitrary and cannot be explained
          break;
        default:
          continue;
      }

      // After deserializing a transaction, durable nonce details are populated in the nonceInfo field
      if (!durableNonce && this._solTransaction.nonceInfo) {
        const nonceAdvanceInstruction = SystemInstruction.decodeNonceAdvance(
          this._solTransaction.nonceInfo.nonceInstruction
        );
        durableNonce = {
          authWalletAddress: nonceAdvanceInstruction.authorizedPubkey.toString(),
          walletNonceAddress: nonceAdvanceInstruction.noncePubkey.toString(),
        };
      }
    }

    return this.getExplainedTransaction(outputAmount, outputs, memo, durableNonce, tokenEnablements);
  }

  private calculateFee(): string {
    if (this.lamportsPerSignature || this.tokenAccountRentExemptAmount) {
      const signatureFees = this.lamportsPerSignature
        ? new BigNumber(this.lamportsPerSignature).multipliedBy(this.numberOfRequiredSignatures).toFixed(0)
        : 0;
      const rentFees = this.tokenAccountRentExemptAmount
        ? new BigNumber(this.tokenAccountRentExemptAmount).multipliedBy(this.numberOfATACreationInstructions).toFixed(0)
        : 0;
      return new BigNumber(signatureFees).plus(rentFees).toFixed(0);
    }
    return UNAVAILABLE_TEXT;
  }

  protected getExplainedTransaction(
    outputAmount: BigNumber,
    outputs: TransactionRecipient[],
    memo: undefined | string = undefined,
    durableNonce: undefined | DurableNonceParams = undefined,
    tokenEnablements: ITokenEnablement[] = []
  ): TransactionExplanation {
    const feeString = this.calculateFee();

    // Create displayOrder with tokenEnablements always included
    const displayOrder = [
      'id',
      'type',
      'blockhash',
      'durableNonce',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'tokenEnablements',
      'fee',
      'memo',
    ];

    // Create the base explanation object with tokenEnablements always included
    const explanation: TransactionExplanation = {
      displayOrder,
      id: this.id,
      type: TransactionType[this.type].toString(),
      changeOutputs: [],
      changeAmount: '0',
      outputAmount: outputAmount.toFixed(0),
      outputs: outputs,
      fee: {
        fee: feeString,
        feeRate: this.lamportsPerSignature,
      },
      memo: memo,
      blockhash: this.getNonce(),
      durableNonce: durableNonce,
      tokenEnablements: tokenEnablements,
    };

    return explanation;
  }

  private explainRawMsgAuthorizeTransaction(): TransactionExplanation {
    const { instructions } = this._solTransaction;
    const nonceInstruction = SystemInstruction.decodeNonceAdvance(instructions[0]);
    const durableNonce = {
      walletNonceAddress: nonceInstruction.noncePubkey.toString(),
      authWalletAddress: nonceInstruction.authorizedPubkey.toString(),
    };
    const data = instructions[1].data.toString('hex');
    const stakingAuthorizeParams: StakingAuthorizeParams =
      data === validInstructionData
        ? {
            stakingAddress: instructions[1].keys[0].pubkey.toString(),
            oldWithdrawAddress: instructions[1].keys[2].pubkey.toString(),
            newWithdrawAddress: instructions[1].keys[3].pubkey.toString(),
            custodianAddress: instructions[1].keys[4].pubkey.toString(),
          }
        : {
            stakingAddress: instructions[1].keys[0].pubkey.toString(),
            oldWithdrawAddress: '',
            newWithdrawAddress: '',
            oldStakingAuthorityAddress: instructions[1].keys[2].pubkey.toString(),
            newStakingAuthorityAddress: instructions[1].keys[3].pubkey.toString(),
          };
    const feeString = this.calculateFee();
    return {
      displayOrder: [
        'id',
        'type',
        'blockhash',
        'durableNonce',
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'tokenEnablements',
        'fee',
        'memo',
      ],
      id: this.id,
      type: TransactionType[this.type].toString(),
      changeOutputs: [],
      changeAmount: '0',
      outputAmount: 0,
      outputs: [],
      fee: {
        fee: feeString,
        feeRate: this.lamportsPerSignature,
      },
      blockhash: this.getNonce(),
      durableNonce: durableNonce,
      stakingAuthorize: stakingAuthorizeParams,
      tokenEnablements: [], // Always include tokenEnablements as an empty array for consistency
    };
  }
}
