import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { Eth } from '../../index';
import { InvalidTransactionError } from '../baseCoin/errors';
import { KeyPair } from '../eth/keyPair';
import { Utils } from './';

export class Transaction extends Eth.Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Sign the transaction with the provided key. It does not check if the signer is allowed to sign
   * it or not.
   *
   * @param {KeyPair} keyPair The key to sign the transaction with
   */
  async sign(keyPair: KeyPair): Promise<void> {
    // Check if there is a transaction to sign
    if (!this._parsedTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    this._encodedTransaction = await Utils.sign(this._parsedTransaction, keyPair);
  }
}
