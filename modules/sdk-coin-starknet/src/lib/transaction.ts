import {
  BaseKey,
  BaseTransaction,
  TransactionRecipient,
  TransactionType,
  InvalidTransactionError,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { StarknetTransactionData, StarknetTransactionType, StarknetTransactionExplanation, TxData } from './iface';
import utils, { parseTransferCall } from './utils';

export class Transaction extends BaseTransaction {
  protected _starknetTransactionData!: StarknetTransactionData;
  protected _signedTransaction?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get starknetTransactionData(): StarknetTransactionData {
    return this._starknetTransactionData;
  }

  set starknetTransactionData(data: StarknetTransactionData) {
    this._starknetTransactionData = data;
    if (data.transactionHash) {
      this._id = data.transactionHash;
    }
  }

  get signableHex(): string {
    return this._starknetTransactionData?.transactionHash || '';
  }

  get signedTransaction(): string | undefined {
    return this._signedTransaction;
  }

  set signedTransaction(tx: string) {
    this._signedTransaction = tx;
  }

  async fromRawTransaction(rawTransaction: string): Promise<void> {
    try {
      const buffer = Buffer.from(rawTransaction, 'hex');
      const jsonString = buffer.toString('utf-8');
      const parsed = JSON.parse(jsonString);

      this._starknetTransactionData = {
        senderAddress: parsed.senderAddress,
        calls: parsed.calls || [],
        nonce: parsed.nonce,
        chainId: parsed.chainId,
        transactionType: parsed.transactionType || StarknetTransactionType.INVOKE,
        signature: parsed.signature,
        transactionHash: parsed.transactionHash,
        resourceBounds: parsed.resourceBounds,
        tip: parsed.tip,
        compiledCalldata: parsed.compiledCalldata,
        nonceDataAvailabilityMode: parsed.nonceDataAvailabilityMode,
        feeDataAvailabilityMode: parsed.feeDataAvailabilityMode,
      };

      if (parsed.signature && parsed.signature.length > 0) {
        this._signedTransaction = rawTransaction;
      }

      utils.validateRawTransaction(this._starknetTransactionData);
      this._id = parsed.transactionHash || '';
    } catch (error) {
      throw new InvalidTransactionError(`Invalid transaction: ${error.message}`);
    }
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._starknetTransactionData) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const transfer =
      this._starknetTransactionData.calls.length > 0
        ? parseTransferCall(this._starknetTransactionData.calls[0])
        : undefined;
    return {
      id: this._id,
      sender: this._starknetTransactionData.senderAddress,
      recipient: transfer?.recipient,
      amount: transfer?.amount,
      nonce: this._starknetTransactionData.nonce,
      type: TransactionType.Send,
    };
  }

  /** @inheritDoc */
  explainTransaction(): StarknetTransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];
    const outputs: TransactionRecipient[] = [];

    if (result.recipient && result.amount) {
      outputs.push({
        address: result.recipient,
        amount: result.amount,
      });
    }

    return {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: result.amount || '0',
      fee: { fee: '0' },
      type: result.type,
      changeOutputs: [],
      changeAmount: '0',
    };
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    const data = this._starknetTransactionData;
    if (!data) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const json = JSON.stringify(data);
    return Buffer.from(json, 'utf-8').toString('hex');
  }

  /** @inheritdoc */
  canSign(_key: BaseKey): boolean {
    return false;
  }
}
