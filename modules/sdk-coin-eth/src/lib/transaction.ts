/**
 * Ethereum transaction model. This is the base model for all ethereum based coins (Celo, ETC, RSK, ETH)
 */
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';
import {
  BaseKey,
  Entry,
  BaseTransaction,
  TransactionType,
  InvalidTransactionError,
  SigningError,
} from '@bitgo/sdk-core';
import { KeyPair } from './keyPair';
import { EthLikeTransactionData, TxData } from './iface';
import { EthTransactionData } from './types';
import { classifyTransaction, decodeTransferData, getToken, hasSignature, toStringSig } from './utils';

const UNSUPPORTED_COIN_NAME = 'unsupported';

export class Transaction extends BaseTransaction {
  protected _id: string; // The transaction id as seen in the blockchain
  protected _inputs: Entry[];
  protected _outputs: Entry[];
  protected _signatures: string[];
  protected _type: TransactionType;
  protected _common: EthereumCommon;

  protected _transactionData?: EthLikeTransactionData;

  /**
   * return a new Transaction initialized with the serialized tx string
   *
   * @param coinConfig The coin configuration object
   * @param common network commons
   * @param serializedTx The serialized tx string with which to initialize the transaction
   * @returns a new transaction object
   */
  public static fromSerialized(
    coinConfig: Readonly<CoinConfig>,
    common: EthereumCommon,
    serializedTx: string
  ): Transaction {
    return new Transaction(coinConfig, common, EthTransactionData.fromSerialized(serializedTx, common).toJson());
  }

  /**
   * Public constructor.
   *
   * @param {Readonly<CoinConfig>} coinConfig
   * @param common the network commons
   * @param {TxData} txData The object transaction data or encoded transaction data
   */
  constructor(coinConfig: Readonly<CoinConfig>, common: EthereumCommon, txData?: TxData) {
    super(coinConfig);
    this._common = common;
    if (txData) {
      this.setTransactionData(txData);
    }
  }

  /**
   * Set the transaction data
   *
   * @param {TxData} txData The transaction data to set
   */
  setTransactionData(txData: TxData): void {
    this._transactionData = EthTransactionData.fromJson(txData, this._common);
    this.updateFields();
  }

  /**
   * Update the internal fields based on the currently set transaction data, if there is any
   */
  protected updateFields(): void {
    if (!this._transactionData) {
      return;
    }

    const txData = this._transactionData.toJson();
    if (txData.id) {
      this._id = txData.id;
    }
    this._type = classifyTransaction(txData.data);

    // reset arrays to empty to ensure that they are only set with one set of fresh values
    this._inputs = [];
    this._outputs = [];
    this._signatures = [];

    if (hasSignature(txData)) {
      this._signatures.push(toStringSig({ v: txData.v!, r: txData.r!, s: txData.s! }));
    }

    // only send transactions have inputs / outputs / signatures to parse
    if (
      this._type === TransactionType.Send ||
      this._type === TransactionType.SendERC721 ||
      this._type === TransactionType.SendERC1155
    ) {
      const { to, amount, tokenContractAddress, signature } = decodeTransferData(txData.data);
      let coinName: string;
      if (tokenContractAddress) {
        const token = getToken(tokenContractAddress, this._coinConfig.network);
        coinName = token ? token.name : UNSUPPORTED_COIN_NAME;
      } else {
        coinName = this._coinConfig.name;
      }

      this.outputs.push({
        address: to,
        value: amount,
        coin: coinName,
      });

      this.inputs.push({
        address: txData.to!, // the sending wallet contract is the recipient of the outer transaction
        value: amount,
        coin: coinName,
      });

      this._signatures.push(signature);
    }
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    // TODO: implement this validation for the ethereum network
    return true;
  }

  /**
   * Sign the transaction with the provided key. It does not check if the signer is allowed to sign
   * it or not.
   *
   * @param {KeyPair} keyPair The key to sign the transaction with
   */
  async sign(keyPair: KeyPair): Promise<void> {
    if (!this._transactionData) {
      throw new InvalidTransactionError('No transaction data to sign');
    }
    if (!keyPair.getKeys().prv) {
      throw new SigningError('Missing private key');
    }
    await this._transactionData.sign(keyPair);
    const txData = this._transactionData.toJson();
    if (txData.id) {
      this._id = txData.id;
    }
    this._signatures.push(toStringSig({ v: txData.v!, r: txData.r!, s: txData.s! }));
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (this._transactionData) {
      return this._transactionData.toSerialized();
    }
    throw new InvalidTransactionError('No transaction data to format');
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (this._transactionData) {
      return this._transactionData.toJson();
    }
    throw new InvalidTransactionError('Empty transaction');
  }
}
