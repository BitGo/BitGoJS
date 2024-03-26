import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { Tx } from './iface';
// import { BaseTx } from '@bitgo/avalanchejs/dist/serializable/avm/baseTx';
// import { PVMTx } from '@bitgo/avalanchejs/dist/serializable/pvm/abstractTx';
// import { AbstractTx } from '@bitgo/avalanchejs/dist/serializable/pvm/abstractTx';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  public _signer: KeyPair[] = [];
  protected recoverSigner = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   * @returns itself
   */
  initBuilder(tx: Tx): this {
    const baseTx = tx.baseTx;
    if (
      // TODO check blockchainId
      baseTx.NetworkId.value() !== this._transaction._networkID
      // ||
      // baseTx.BlockchainId.value() !== this._transaction._blockchainID
      // !baseTx.BlockchainId.toBytes().equals(this._transaction._blockchainID)
    ) {
      throw new Error('Network or blockchain is not equals');
    }
    this._transaction.setTransaction(tx);
    return this;
  }

  // TODO(CR-1073) Implement:
  //  fromImplementation
  //  buildImplementation
  //  signImplementation
  //  get transaction
  //  set transaction
  //  validateRawTransaction

  /** @inheritdoc */
  // protected fromImplementation(rawTransaction: string): Transaction {
  // TODO(CR-1073): Create instance of Transaction from raw hex
  // this.initBuilder(tx);
  // return this.transaction;
  // }
}
