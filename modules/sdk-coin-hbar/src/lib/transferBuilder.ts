import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { proto } from '@hashgraph/proto';
import {
  BaseKey,
  BuildTransactionError,
  InvalidParameterValueError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { Recipient } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount } from './utils';
import { DEFAULT_SIGNER_NUMBER } from './constants';

export class TransferBuilder extends TransactionBuilder {
  protected readonly _txBodyData: proto.CryptoTransferTransactionBody;
  protected _recipients: Recipient[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.CryptoTransferTransactionBody();
    this._txBody.cryptoTransfer = this._txBodyData;
    this._recipients = [];
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.setTransactionType(TransactionType.Send);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._multiSignerKeyPairs.length >= DEFAULT_SIGNER_NUMBER) {
      throw new SigningError('A maximum of ' + DEFAULT_SIGNER_NUMBER + ' can sign the transaction.');
    }
    return super.signImplementation(key);
  }

  // region Transfer fields
  /**
   * Set the recipient to be transferred
   *
   * @param {Recipient} recipient - recipient to transfer consisting destination address and amount
   * @returns {TransferBuilder} - The builder with the new parameter set
   */
  send(recipient: Recipient): this {
    if (!isValidAddress(recipient.address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    if (!isValidAmount(recipient.amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._recipients.push(recipient);
    return this;
  }
  // endregion

  // region Validators
  validateMandatoryFields(): void {
    if (this._recipients.length === 0) {
      throw new BuildTransactionError('Invalid transaction: missing recipients');
    }
    super.validateMandatoryFields();
  }
  // endregion
}
