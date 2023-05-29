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
import { toBase64 } from '@cosmjs/encoding';
import { makeSignBytes } from '@cosmjs/proto-signing';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { UNAVAILABLE_TEXT } from './constants';

import {
  CosmosLikeTransaction,
  DelegateOrUndelegeteMessage,
  SendMessage,
  TransactionExplanation,
  TxData,
  WithdrawDelegatorRewardsMessage,
} from './iface';
import utils from './utils';

export class CosmosTransaction extends BaseTransaction {
  private _cosmosLikeTransaction: CosmosLikeTransaction;
  private _accountNumber: number;
  private _chainId: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
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
    const txRaw = utils.createTxRawFromCosmosLikeTransaction(this.cosmosLikeTransaction);
    if (this.cosmosLikeTransaction?.publicKey !== undefined && this._signatures.length > 0) {
      const signedRawTx = utils.createSignedTxRaw(this.cosmosLikeTransaction.publicKey, this._signatures[0], txRaw);
      return toBase64(TxRaw.encode(signedRawTx).finish());
    }
    return toBase64(TxRaw.encode(txRaw).finish());
  }

  /** @inheritdoc **/
  get signablePayload(): Buffer {
    return Buffer.from(
      makeSignBytes(utils.createSignDoc(this.cosmosLikeTransaction, this._accountNumber, this._chainId))
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
    let message;
    let outputAmount;
    switch (json.type) {
      case TransactionType.Send:
        explanationResult.type = TransactionType.Send;
        message = json.sendMessages[0].value as SendMessage;
        outputAmount = message.amount[0].amount;
        outputs = [
          {
            address: message.toAddress,
            amount: outputAmount,
          },
        ];
        break;
      case TransactionType.StakingActivate:
        explanationResult.type = TransactionType.StakingActivate;
        message = json.sendMessages[0].value as DelegateOrUndelegeteMessage;
        outputAmount = message.amount.amount;
        outputs = [
          {
            address: message.validatorAddress,
            amount: outputAmount,
          },
        ];
        break;
      case TransactionType.StakingDeactivate:
        explanationResult.type = TransactionType.StakingDeactivate;
        message = json.sendMessages[0].value as DelegateOrUndelegeteMessage;
        outputAmount = message.amount.amount;
        outputs = [
          {
            address: message.validatorAddress,
            amount: outputAmount,
          },
        ];
        break;
      case TransactionType.StakingWithdraw:
        explanationResult.type = TransactionType.StakingWithdraw;
        message = json.sendMessages[0].value as WithdrawDelegatorRewardsMessage;
        outputs = [
          {
            address: message.validatorAddress,
            amount: UNAVAILABLE_TEXT,
          },
        ];
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
      outputAmount,
      outputs,
    };
  }

  loadInputsAndOutputs(): void {
    if (this.type === undefined || !this.cosmosLikeTransaction) {
      throw new InvalidTransactionError('Transaction type or cosmosLikeTransaction is not set');
    }

    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    switch (this.type) {
      case TransactionType.Send:
        const message = this.cosmosLikeTransaction.sendMessages[0].value as SendMessage;
        inputs.push({
          address: message.fromAddress,
          value: message.amount[0].amount,
          coin: this._coinConfig.name,
        });
        outputs.push({
          address: message.toAddress,
          value: message.amount[0].amount,
          coin: this._coinConfig.name,
        });
        break;
      case TransactionType.StakingActivate:
      case TransactionType.StakingDeactivate:
        const delegateMessage = this.cosmosLikeTransaction.sendMessages[0].value as DelegateOrUndelegeteMessage;
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
        break;
      case TransactionType.StakingWithdraw:
        const withdrawMessage = this.cosmosLikeTransaction.sendMessages[0].value as WithdrawDelegatorRewardsMessage;
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
        break;
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
    this._inputs = inputs;
    this._outputs = outputs;
  }
}
