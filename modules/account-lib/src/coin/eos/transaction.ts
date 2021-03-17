import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

export class Transaction extends BaseTransaction {

  private _encodedTransaction?: string; // transaction in hex format

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);    
    // this._owners = [];
  }



    /**
   * Initialize the transaction fields based on another serialized transaction.
   *
   * @param serializedTransaction Transaction in broadcast format.
   */
  async initFromSerializedTransaction(serializedTransaction: string): Promise<void> {
    this._encodedTransaction = serializedTransaction;
    console.log('encoded', this._encodedTransaction);
    // this._encodedTransaction
    // try {
    //   const parsedTransaction = await localForger.parse(serializedTransaction);
    //   await this.initFromParsedTransaction(parsedTransaction);
    // } catch (e) {
    //   // If it throws, it is possible the serialized transaction is signed, which is not supported
    //   // by local-forging. Try extracting the last 64 bytes and parse it again.
    //   const unsignedSerializedTransaction = serializedTransaction.slice(0, -128);
    //   const signature = serializedTransaction.slice(-128);
    //   if (Utils.isValidSignature(signature)) {
    //     throw new ParseTransactionError('Invalid transaction');
    //   }
    //   // TODO: encode the signature and save it in _signature
    //   const parsedTransaction = await localForger.parse(unsignedSerializedTransaction);
    //   const transactionId = await Utils.calculateTransactionId(serializedTransaction);
    //   await this.initFromParsedTransaction(parsedTransaction, transactionId);
    // }
  }
  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    throw new NotImplementedError('canSign not implemented');
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    throw new NotImplementedError('toBroadcastFormat not implemented');
  }

  /** @inheritdoc */
  toJson(): any {
    throw new NotImplementedError('toJson not implemented');
  }
}

