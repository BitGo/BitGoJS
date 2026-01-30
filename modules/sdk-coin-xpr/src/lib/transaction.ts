/**
 * Proton (XPR Network) Transaction class using @greymass/eosio
 */

import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  Transaction as EosioTransaction,
  Checksum256,
  Serializer,
  Action,
  Name,
  Asset,
  Struct,
} from '@greymass/eosio';
import BigNumber from 'bignumber.js';
import { KeyPair } from './keyPair';
import { TxData, TransactionExplanation, BroadcastFormat, TransferActionData } from './iface';
import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID, TOKEN_CONTRACT, XPR_SYMBOL, XPR_PRECISION } from './constants';

/**
 * Define the transfer struct for eosio.token
 */
class Transfer extends Struct {
  static abiName = 'transfer';
  static abiFields = [
    { name: 'from', type: Name },
    { name: 'to', type: Name },
    { name: 'quantity', type: Asset },
    { name: 'memo', type: 'string' },
  ];

  declare from: Name;
  declare to: Name;
  declare quantity: Asset;
  declare memo: string;
}

export class Transaction extends BaseTransaction {
  private _transaction?: EosioTransaction;
  protected _chainId: string;
  protected _type: TransactionType = TransactionType.Send;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    // Determine chain ID based on coin name
    this._chainId = coinConfig.name === 'txpr' ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID;
  }

  /**
   * Get the underlying EOSIO transaction
   */
  get eosioTransaction(): EosioTransaction | undefined {
    return this._transaction;
  }

  /**
   * Set the underlying EOSIO transaction
   */
  set eosioTransaction(tx: EosioTransaction | undefined) {
    this._transaction = tx;
  }

  /**
   * Get the chain ID
   */
  get chainId(): string {
    return this._chainId;
  }

  /**
   * Set the chain ID
   */
  set chainId(chainId: string) {
    this._chainId = chainId;
  }

  /**
   * Get the transaction signatures
   */
  get signature(): string[] {
    return this._signatures;
  }

  /**
   * Add a signature to the transaction
   */
  addSignature(signature: string): void {
    this._signatures.push(signature);
  }

  /**
   * Set the transaction type
   */
  setTransactionType(type: TransactionType): void {
    this._type = type;
  }

  /**
   * Check if this transaction can be signed with the given key
   */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /**
   * Get the signable payload (the digest that should be signed)
   * For EOSIO, this is the SHA256 hash of: chainId + serializedTransaction + contextFreeDataHash
   */
  get signablePayload(): Buffer {
    if (!this._transaction) {
      throw new InvalidTransactionError('Transaction not set');
    }

    const chainIdChecksum = Checksum256.from(this._chainId);
    const signingDigest = this._transaction.signingDigest(chainIdChecksum);
    return Buffer.from(signingDigest.array);
  }

  /**
   * Get the transaction ID (hash of the serialized transaction)
   */
  get id(): string {
    if (!this._transaction) {
      return '';
    }
    return this._transaction.id.toString();
  }

  /**
   * Sign the transaction with a key pair
   */
  async sign(keyPair: KeyPair): Promise<void> {
    if (!this._transaction) {
      throw new SigningError('Transaction not set');
    }

    const digest = this.signablePayload;
    const signature = keyPair.sign(digest);
    this.addSignature(signature);
  }

  /**
   * Convert the transaction to JSON format
   */
  toJson(): TxData {
    if (!this._transaction) {
      throw new InvalidTransactionError('Transaction not set');
    }

    const tx = this._transaction;
    const actions = tx.actions.map((action) => {
      const data = Serializer.decode({
        data: action.data,
        type: Transfer,
      });
      return {
        account: action.account.toString(),
        name: action.name.toString(),
        authorization: action.authorization.map((auth) => ({
          actor: auth.actor.toString(),
          permission: auth.permission.toString(),
        })),
        data: {
          from: data.from.toString(),
          to: data.to.toString(),
          quantity: data.quantity.toString(),
          memo: data.memo,
        },
      };
    });

    // Extract sender from first action
    const sender = actions.length > 0 && actions[0].data
      ? (actions[0].data as TransferActionData).from
      : '';

    return {
      id: this.id,
      type: this._type,
      sender,
      expiration: tx.expiration.toString(),
      refBlockNum: tx.ref_block_num.toNumber(),
      refBlockPrefix: tx.ref_block_prefix.toNumber(),
      actions,
      signatures: this._signatures,
    };
  }

  /**
   * Convert the transaction to broadcast format
   * Returns the format expected by Proton/EOSIO nodes
   */
  toBroadcastFormat(): string {
    if (!this._transaction) {
      throw new InvalidTransactionError('Transaction not set');
    }

    const serializedTx = Serializer.encode({ object: this._transaction });
    const packedTrx = Buffer.from(serializedTx.array).toString('hex');

    const broadcastFormat: BroadcastFormat = {
      signatures: this._signatures,
      compression: 'none',
      packed_context_free_data: '',
      packed_trx: packedTrx,
    };

    return JSON.stringify(broadcastFormat);
  }

  /**
   * Load transaction from raw serialized hex string
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      const txData = Buffer.from(rawTransaction, 'hex');
      this._transaction = Serializer.decode({
        data: txData,
        type: EosioTransaction,
      });
      this.loadInputsAndOutputs();
    } catch (e) {
      throw new InvalidTransactionError(
        `Failed to parse raw transaction: ${e instanceof Error ? e.message : 'unknown error'}`
      );
    }
  }

  /**
   * Load inputs and outputs from the transaction actions
   */
  loadInputsAndOutputs(): void {
    if (!this._transaction) {
      return;
    }

    const inputs: Entry[] = [];
    const outputs: Entry[] = [];

    for (const action of this._transaction.actions) {
      if (action.account.toString() === TOKEN_CONTRACT && action.name.toString() === 'transfer') {
        try {
          const data = Serializer.decode({
            data: action.data,
            type: Transfer,
          });

          // Convert quantity to base units
          const amount = new BigNumber(data.quantity.value)
            .times(Math.pow(10, XPR_PRECISION))
            .toFixed(0);

          inputs.push({
            address: data.from.toString(),
            value: amount,
            coin: this._coinConfig.name,
          });

          outputs.push({
            address: data.to.toString(),
            value: amount,
            coin: this._coinConfig.name,
          });
        } catch {
          // Skip actions that can't be decoded as transfers
        }
      }
    }

    this._inputs = inputs;
    this._outputs = outputs;
  }

  /**
   * Explain the transaction
   */
  explainTransaction(): TransactionExplanation {
    if (!this._transaction) {
      throw new InvalidTransactionError('Transaction not set');
    }

    const json = this.toJson();
    const outputs = this._outputs.map((output) => ({
      address: output.address,
      amount: output.value,
    }));

    let outputAmount = new BigNumber(0);
    for (const output of this._outputs) {
      outputAmount = outputAmount.plus(output.value);
    }

    // Get memo from first transfer action
    let memo: string | undefined;
    if (json.actions.length > 0 && json.actions[0].data) {
      memo = (json.actions[0].data as TransferActionData).memo;
    }

    return {
      displayOrder: ['id', 'type', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo'],
      id: json.id || '',
      type: TransactionType[this._type],
      changeOutputs: [],
      changeAmount: '0',
      outputAmount: outputAmount.toFixed(0),
      outputs,
      fee: { fee: '0' },
      memo,
      sender: json.sender,
    };
  }
}
