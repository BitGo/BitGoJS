import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  ParseTransactionError,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { fromHex, toBase64 } from '@cosmjs/encoding';
import { makeSignBytes } from '@cosmjs/proto-signing';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { UNAVAILABLE_TEXT } from './constants';
import {
  CosmosLikeTransaction,
  DelegateOrUndelegeteMessage,
  ExecuteContractMessage,
  SendMessage,
  TransactionExplanation,
  TxData,
  WithdrawDelegatorRewardsMessage,
} from './iface';
import { CosmosUtils } from './utils';

export class CosmosTransaction extends BaseTransaction {
  protected _cosmosLikeTransaction: CosmosLikeTransaction;
  protected _accountNumber: number;
  protected _chainId: string;

  protected _utils: CosmosUtils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils) {
    super(_coinConfig);
    this._utils = utils;
  }

  get cosmosLikeTransaction(): CosmosLikeTransaction {
    return this._cosmosLikeTransaction;
  }

  set cosmosLikeTransaction(cosmosLikeTransaction: Readonly<CosmosLikeTransaction>) {
    this._cosmosLikeTransaction = cosmosLikeTransaction;
  }

  get chainId(): string {
    return this._chainId;
  }

  set chainId(chainId: string) {
    this._chainId = chainId;
  }

  get accountNumber(): number {
    return this._accountNumber;
  }

  set accountNumber(accountNumber: number) {
    this._accountNumber = accountNumber;
  }

  /** @inheritDoc **/
  get id(): string {
    if (this._id) {
      return this._id;
    } else if (this._cosmosLikeTransaction?.hash !== undefined) {
      return this._cosmosLikeTransaction.hash;
    }
    return UNAVAILABLE_TEXT;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._cosmosLikeTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._cosmosLikeTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    const tx = this._cosmosLikeTransaction;
    return {
      id: this.id,
      type: this._type,
      sequence: tx.sequence,
      sendMessages: tx.sendMessages,
      gasBudget: tx.gasBudget,
      publicKey: tx.publicKey,
      signature: tx.signature,
      accountNumber: this._accountNumber,
      chainId: this._chainId,
      hash: tx.hash,
      memo: tx.memo,
    };
  }

  /**
   * Add a signature to the transaction
   * @param {string} signature in hex format
   */
  addSignature(signature: string) {
    this._signatures = [];
    this._signatures.push(signature);
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'];
    const outputs: TransactionRecipient[] = [];

    const explanationResult: TransactionExplanation = {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: '0',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.cosmosLikeTransaction.gasBudget.amount[0].amount },
      type: this.type,
    };
    return this.explainTransactionInternal(result, explanationResult);
  }

  /**
   * Set the transaction type.
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  set transactionType(transactionType: TransactionType) {
    this._type = transactionType;
  }

  /**
   * Serialize the transaction to a JSON string
   * @returns {string} serialized base64 encoded transaction
   */
  serialize(): string {
    const txRaw = this._utils.createTxRawFromCosmosLikeTransaction(this.cosmosLikeTransaction);
    if (this.cosmosLikeTransaction?.publicKey !== undefined && this._signatures.length > 0) {
      const signedRawTx = this._utils.createSignedTxRaw(
        this.cosmosLikeTransaction.publicKey,
        this._signatures[0],
        txRaw
      );
      return toBase64(TxRaw.encode(signedRawTx).finish());
    }
    return toBase64(TxRaw.encode(txRaw).finish());
  }

  /** @inheritdoc **/
  get signablePayload(): Buffer {
    return Buffer.from(
      makeSignBytes(this._utils.createSignDoc(this.cosmosLikeTransaction, this._accountNumber, this._chainId))
    );
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * Currently only supports one message per transfer.
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransactionInternal(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    let outputs: TransactionRecipient[];
    let outputAmount;
    switch (json.type) {
      case TransactionType.Send:
        explanationResult.type = TransactionType.Send;
        outputAmount = BigInt(0);
        outputs = json.sendMessages.map((message) => {
          const sendMessage = message.value as SendMessage;
          outputAmount = outputAmount + BigInt(sendMessage.amount[0].amount);
          return {
            address: sendMessage.toAddress,
            amount: sendMessage.amount[0].amount,
          };
        });
        break;
      case TransactionType.StakingActivate:
        explanationResult.type = TransactionType.StakingActivate;
        outputAmount = BigInt(0);
        outputs = json.sendMessages.map((message) => {
          const delegateMessage = message.value as DelegateOrUndelegeteMessage;
          outputAmount = outputAmount + BigInt(delegateMessage.amount.amount);
          return {
            address: delegateMessage.validatorAddress,
            amount: delegateMessage.amount.amount,
          };
        });
        break;
      case TransactionType.StakingDeactivate:
        explanationResult.type = TransactionType.StakingDeactivate;
        outputAmount = BigInt(0);
        outputs = json.sendMessages.map((message) => {
          const delegateMessage = message.value as DelegateOrUndelegeteMessage;
          outputAmount = outputAmount + BigInt(delegateMessage.amount.amount);
          return {
            address: delegateMessage.validatorAddress,
            amount: delegateMessage.amount.amount,
          };
        });
        break;
      case TransactionType.StakingWithdraw:
        explanationResult.type = TransactionType.StakingWithdraw;
        outputs = json.sendMessages.map((message) => {
          const withdrawMessage = message.value as WithdrawDelegatorRewardsMessage;
          return {
            address: withdrawMessage.validatorAddress,
            amount: UNAVAILABLE_TEXT,
          };
        });
        break;
      case TransactionType.ContractCall:
        explanationResult.type = TransactionType.ContractCall;
        outputAmount = BigInt(0);
        outputs = json.sendMessages.map((message) => {
          const executeContractMessage = message.value as ExecuteContractMessage;
          outputAmount = outputAmount + BigInt(executeContractMessage.funds?.[0]?.amount ?? '0');
          return {
            address: executeContractMessage.contract,
            amount: executeContractMessage.funds?.[0]?.amount ?? '0',
          };
        });
        break;
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
    if (json.memo) {
      outputs.forEach((output) => {
        output.memo = json.memo;
      });
    }
    return {
      ...explanationResult,
      outputAmount: outputAmount?.toString(),
      outputs,
    };
  }

  /**
   * Load the input and output data on this transaction using the transaction json
   * if there are outputs. For transactions without outputs (e.g. wallet initializations),
   * this function will not do anything
   */
  loadInputsAndOutputs(): void {
    if (this.type === undefined || !this.cosmosLikeTransaction) {
      throw new InvalidTransactionError('Transaction type or cosmosLikeTransaction is not set');
    }

    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    switch (this.type) {
      case TransactionType.Send:
        this.cosmosLikeTransaction.sendMessages.forEach((message) => {
          const sendMessage = message.value as SendMessage;
          inputs.push({
            address: sendMessage.fromAddress,
            value: sendMessage.amount[0].amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: sendMessage.toAddress,
            value: sendMessage.amount[0].amount,
            coin: this._coinConfig.name,
          });
        });
        break;
      case TransactionType.StakingActivate:
      case TransactionType.StakingDeactivate:
        this.cosmosLikeTransaction.sendMessages.forEach((message) => {
          const delegateMessage = message.value as DelegateOrUndelegeteMessage;
          inputs.push({
            address: delegateMessage.delegatorAddress,
            value: delegateMessage.amount.amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: delegateMessage.validatorAddress,
            value: delegateMessage.amount.amount,
            coin: this._coinConfig.name,
          });
        });
        break;
      case TransactionType.StakingWithdraw:
        this.cosmosLikeTransaction.sendMessages.forEach((message) => {
          const withdrawMessage = message.value as WithdrawDelegatorRewardsMessage;
          inputs.push({
            address: withdrawMessage.delegatorAddress,
            value: UNAVAILABLE_TEXT,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: withdrawMessage.validatorAddress,
            value: UNAVAILABLE_TEXT,
            coin: this._coinConfig.name,
          });
        });
        break;
      case TransactionType.ContractCall:
        this.cosmosLikeTransaction.sendMessages.forEach((message) => {
          const executeContractMessage = message.value as ExecuteContractMessage;
          inputs.push({
            address: executeContractMessage.sender,
            value: executeContractMessage.funds?.[0]?.amount ?? '0',
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: executeContractMessage.contract,
            value: executeContractMessage.funds?.[0]?.amount ?? '0',
            coin: this._coinConfig.name,
          });
        });
        break;
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
    this._inputs = inputs;
    this._outputs = outputs;
  }

  /**
   * Sets this transaction payload
   * @param rawTransaction raw transaction in base64 encoded string
   */
  enrichTransactionDetailsFromRawTransaction(rawTransaction: string): void {
    if (this._utils.isValidHexString(rawTransaction)) {
      this.cosmosLikeTransaction = this._utils.deserializeTransaction(toBase64(fromHex(rawTransaction)));
    } else {
      this.cosmosLikeTransaction = this._utils.deserializeTransaction(rawTransaction);
    }
    if (this.cosmosLikeTransaction.signature) {
      this.addSignature(Buffer.from(this.cosmosLikeTransaction.signature).toString('hex'));
    }
    const typeUrl = this.cosmosLikeTransaction.sendMessages[0].typeUrl;
    const transactionType = this._utils.getTransactionTypeFromTypeUrl(typeUrl);

    if (transactionType === undefined) {
      throw new Error('Transaction type is not supported ' + typeUrl);
    }
    this.transactionType = transactionType;
  }
}
