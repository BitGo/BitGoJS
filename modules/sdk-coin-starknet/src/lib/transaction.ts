import {
  BaseKey,
  BaseTransaction,
  TransactionRecipient,
  TransactionType,
  InvalidTransactionError,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { defaultResourceBounds } from './constants';
import {
  StarknetResourceBounds,
  StarknetTransactionData,
  StarknetTransactionType,
  StarknetTransactionExplanation,
  TxData,
} from './iface';
import utils, { compileExecuteCalldata, parseTransferCall } from './utils';

function resolveCompiledCalldata(data: StarknetTransactionData): string[] {
  if (data.compiledCalldata && data.compiledCalldata.length > 0) {
    return data.compiledCalldata;
  }
  if (data.calls.length > 0) {
    return compileExecuteCalldata(data.calls);
  }
  throw new InvalidTransactionError('Missing calldata: no compiledCalldata or calls');
}

function resolveResourceBounds(data: StarknetTransactionData): StarknetResourceBounds {
  return data.resourceBounds ?? defaultResourceBounds();
}

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
        contractAddress: parsed.contractAddress,
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
        classHash: parsed.classHash,
        constructorCalldata: parsed.constructorCalldata,
        contractAddressSalt: parsed.contractAddressSalt,
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

  /** Hex-encoded internal JSON — used by WP for round-trip via fromRawTransaction. */
  toInternalHex(): string {
    const data = this._starknetTransactionData;
    if (!data) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return Buffer.from(JSON.stringify(data), 'utf-8').toString('hex');
  }

  /** @inheritdoc — returns Starknet RPC-ready JSON for addInvoke or addDeployAccount. */
  toBroadcastFormat(): string {
    const data = this._starknetTransactionData;
    if (!data) {
      throw new InvalidTransactionError('Empty transaction');
    }

    const payload =
      data.transactionType === StarknetTransactionType.DEPLOY_ACCOUNT
        ? this.buildDeployAccountPayload(data)
        : this.buildInvokePayload(data);

    return JSON.stringify(payload);
  }
  private buildDeployAccountPayload(data: StarknetTransactionData) {
    if (!data.classHash || !data.constructorCalldata || !data.contractAddressSalt) {
      throw new InvalidTransactionError('Incomplete deploy account transaction');
    }

    return {
      type: 'DEPLOY_ACCOUNT',
      version: '0x3',
      signature: data.signature || [],
      nonce: data.nonce,
      contract_address_salt: data.contractAddressSalt,
      constructor_calldata: data.constructorCalldata,
      class_hash: data.classHash,
      sender_address: data.senderAddress,
      resource_bounds: resolveResourceBounds(data),
      tip: data.tip || '0x0',
      paymaster_data: [],
      nonce_data_availability_mode: 'L1',
      fee_data_availability_mode: 'L1',
    };
  }

  private buildInvokePayload(data: StarknetTransactionData) {
    return {
      type: 'INVOKE',
      version: '0x3',
      sender_address: data.senderAddress,
      calldata: resolveCompiledCalldata(data),
      signature: data.signature || [],
      nonce: data.nonce,
      resource_bounds: resolveResourceBounds(data),
      tip: data.tip || '0x0',
      paymaster_data: [],
      account_deployment_data: [],
      nonce_data_availability_mode: 'L1',
      fee_data_availability_mode: 'L1',
    };
  }

  /** @inheritdoc */
  canSign(_key: BaseKey): boolean {
    return false;
  }
}
