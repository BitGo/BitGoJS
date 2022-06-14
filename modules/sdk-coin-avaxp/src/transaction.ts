import { BaseCoin as CoinConfig, AvalancheNetwork } from '@bitgo/statics';
import { BaseKey, SigningError, BaseTransaction, TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { KeyPair } from './keyPair';
import { TxData } from './iface';
import { UnsignedTx, BaseTx, KeyChain } from 'avalanche/dist/apis/platformvm';
import utils from './utils';

export class Transaction extends BaseTransaction {
  protected _avaxpTransaction!: UnsignedTx;
  protected _avaxpBaseTransaction!: BaseTx;
  private _sender!: string;
  protected _type: TransactionType;
  protected _chainID: string;
  protected _hrp: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    const network = coinConfig.network as AvalancheNetwork;
    this._chainID = network.alias;
    this._hrp = network.hrp;
  }

  get avaxPTransaction(): BaseTx {
    return this._avaxpBaseTransaction;
  }

  set avaxPTransaction(tx: BaseTx) {
    this._avaxpBaseTransaction = tx;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    try {
      new KeyPair({ prv: key.key });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sign a avaxp transaction and update the transaction hex
   * validator, delegator, import, exports extend baseTx
   * unsignedTx: UnsignedTx = new UnsignedTx(baseTx)  (baseTx = addValidatorTx)
   * const tx: Tx = unsignedTx.sign(keychain) (tx is type standard signed tx)
   * get baseTx then create new unsignedTx then sign
   *
   * @param {KeyPair} keyPair
   */
  sign(keyPair: KeyPair): void {
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    const pKeychain = new KeyChain(this._hrp, this._chainID);
    this._avaxpTransaction = new UnsignedTx(this._avaxpBaseTransaction);
    this._avaxpTransaction.sign(pKeychain);
  }

  sender(sender: string): void {
    this._sender = sender;
  }

  /** @inheritdoc */
  /**
   * should be of signedTx doing this with baseTx
   */
  toBroadcastFormat(): string {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const un = new UnsignedTx(this._avaxpBaseTransaction);
    const buffer = un.toBuffer(); // this._avaxpBaseTransaction.toBuffer();
    const txSerialized = utils.cb58Encode(buffer).toString();
    return txSerialized;
  }

  // types - stakingTransaction, import, export
  toJson(): TxData {
    if (!this.avaxPTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return {
      blockchain_id: utils.cb58Encode(this._avaxpBaseTransaction.getBlockchainID()),
      network_id: this._avaxpBaseTransaction.getNetworkID(),
      inputs: this._avaxpBaseTransaction.getIns(),
      outputs: this._avaxpBaseTransaction.getOuts(),
      memo: utils.bufferToString(this._avaxpBaseTransaction.getMemo()),
      typeID: this._avaxpBaseTransaction.getTxType(),
    };
  }

  setTransaction(tx: UnsignedTx): void {
    this._avaxpTransaction = tx;
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }
}
