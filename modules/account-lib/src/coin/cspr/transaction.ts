import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError, NotImplementedError } from '../baseCoin/errors';
// import { stringifyAccountId, stringifyTxTime, toHex, toUint8Array } from './utils';
// import { KeyPair } from './';

export class Transaction extends BaseTransaction {
  protected _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair): Promise<void> {
    throw new NotImplementedError("sign not implemented")
  }

  /**
   * Add a signature to this transaction
   * @param signature The signature to add, in string hex format
   * @param key The key of the key that created the signature
   */
  addSignature(signature: string, key): void {
    throw new NotImplementedError("addSignature not implemented")
    
  }


  /** @inheritdoc */
  toBroadcastFormat() {
    throw new NotImplementedError("toBroadcastFormat not implemented")
  }

  /** @inheritdoc */
  toJson() {
    throw new NotImplementedError("toJson not implemented")
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    throw new NotImplementedError("getTransferData not implemented")
  }

  /**
   * Decode previous signatures from the inner transaction
   * and save them into the base transaction signature list.
   */
  loadPreviousSignatures(): void {
    throw new NotImplementedError("getTransferData not implemented")
  }

  /**
   * Load the input and output data on this transaction using the transaction json
   * if there are outputs. For transactions without outputs (e.g. wallet initializations),
   * this function will not do anything
   */
  loadInputsAndOutputs(): void {
    throw new NotImplementedError("loadInputsAndOutputs not implemented")
  }

  //endregion
}
