import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '@bitgo/sdk-core/src/account-lib/baseCoin';
import { BaseKey } from '@bitgo/sdk-core/src/account-lib/baseCoin/iface';
import { NotImplementedError, SigningError } from '@bitgo/sdk-core/src/account-lib/baseCoin/errors';
import { KeyPair } from './keyPair';
import { TxData } from './iface';
import { UnsignedTx } from 'avalanche/dist/apis/platformvm/tx';
import { BaseTx } from 'avalanche/dist/apis/platformvm/basetx';
import { InvalidTransactionError, TransactionExplanation } from '@bitgo/sdk-core';
import utils from './utils';
import { TransferableInput, TransferableOutput, KeyChain } from 'avalanche/dist/apis/platformvm';
// import { PlatformVMConstants } from 'avalanche/src/apis/platformvm/constants';

export class Transaction extends BaseTransaction {
  protected _avaxpTransaction!: UnsignedTx;
  protected _avaxpBaseTransaction!: BaseTx;
  private _signedTransaction?: string;
  private _sender!: string;
  protected _type: TransactionType;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    throw new NotImplementedError('canSign not implemented');
  }

  /**
   * Sign a avaxp transaction and update the transaction hex
   *
   * @param {KeyPair} keyPair
   */
  sign(keyPair: KeyPair): void {
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    // const pKeychain: KeyChain = keys;
    // pKeychain.importKey(keys.prv);
    // const tx = this._avaxpTransaction.sign(keys);

    // // get input we want to sign
    // // transferableInput[] add signature to that
    // // sign with one key for now
    // // signature in sandbox was in type cb58encoded string
    // const baseTx = this._avaxpTransaction.getTransaction();
    // const txHex = baseTx
    //   .getIns() // Transferable Input
    //   .secpTransferInput.addSignatureIdx(0, Uint8Array.from(Buffer.from(keys.pub, 'hex')));
    // this._signedTransaction = txHex;
    throw new NotImplementedError('Sign not implemented');
  }

  sender(sender: string): void {
    this._sender = sender;
  }

  // what is broadcast format for our current system?
  /** @inheritdoc */
  toBroadcastFormat(): string {
    throw new NotImplementedError('toBroadcastFormat not implemented');
  }

  // types - stakingTransaction, import, export
  /** @inheritdoc */
  toJson(): TxData {
    if (!this._avaxpTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const result: TxData = {
      // fill with baseTxData
      typeID: 0,
      network_id: 5,
      blockchain_id: '11111111111111111111111111111111LpoYY',
      outputs: this._avaxpBaseTransaction.getOuts(),
      inputs: this._avaxpBaseTransaction.getIns(),
      memo: 'baseTx',
    };
    // addDelegator addValidator
    // if (this.type === TransactionType.addDelegator) {
    // }
    // // reward UTXOs
    // if (this.type === TransactionType.addValidator) {
    // }
    // need to add?
    // // two import into P from X and C
    // if (this.type === TransactionType.import) {
    // }
    // // two exports out of P to X and C
    // if (this.type === TransactionType.export) {
    // }
    return result;
  }

  // maybe should be set to baseTx
  setTransaction(tx: UnsignedTx): void {
    this._avaxpTransaction = tx;
  }

  // /**
  //  * Returns the id of the [[BaseTx]]
  //  */
  // getTxType(): number {
  //   return PlatformVMConstants.BASETX;
  // }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    throw new NotImplementedError('explainTransaction not implemented');
  }

  protected getExplainedTransaction(
    typeID: number,
    network_id: number,
    blockchain_id: '11111111111111111111111111111111LpoYY',
    outputs: TransferableOutput[],
    inputs: TransferableInput[],
    memo: undefined | string = undefined,
  ): TransactionExplanation {
    throw new NotImplementedError('getExplainedTransaction not implemented');
  }
}
