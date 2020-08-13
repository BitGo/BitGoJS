import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import Long from 'long';
import { CryptoTransferTransaction } from '@hashgraph/sdk';
import { BuildTransactionError, InvalidParameterValueError, SigningError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount, stringifyAccountId } from './utils';

export class TransferBuilder extends TransactionBuilder {
  private _cryptoTransferBuilder: CryptoTransferTransaction;
  private _toAddress: string;
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._cryptoTransferBuilder = new CryptoTransferTransaction();
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._cryptoTransferBuilder
      .addSender(this._source.address, this._amount.toString())
      .addRecipient(this._toAddress, this._amount.toString());
    this._sdkTransactionBuilder = this._cryptoTransferBuilder;
    this.transaction = await super.buildImplementation();
    return this.transaction;
  }

  /**
   * Initialize the transfer specific data, getting the recipient account
   * represented by the element with a positive amount on the transfer element.
   * The negative amount represents the source account so it's ignored.
   *
   * @param {Transaction} tx - the transaction data
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const transferData = tx.txBody.getCryptotransfer();
    if (transferData && transferData.getTransfers() && transferData.getTransfers()!.getAccountamountsList()) {
      transferData
        .getTransfers()!
        .getAccountamountsList()
        .forEach(transferData => {
          const amount = Long.fromValue(transferData.getAmount());
          if (amount.isPositive()) {
            this.to(stringifyAccountId(transferData.getAccountid()!.toObject()));
            this.amount(amount.toString());
          }
        });
    }
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._multiSignerKeyPairs.length >= DEFAULT_M) {
      throw new SigningError('A maximum of ' + DEFAULT_M + ' can sign the transaction.');
    }
    return super.signImplementation(key);
  }

  //region Transfer fields
  /**
   * Set the destination address where the funds will be sent,
   * it may take the format `'<shard>.<realm>.<account>'` or `'<account>'`
   *
   * @param {string} address the address to transfer funds to
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  to(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid address');
    }
    this._toAddress = address;
    return this;
  }

  /**
   * Set the amount to be transferred
   *
   * @param {string} amount amount to transfer in tinyBars (there are 100,000,000 tinyBars in one Hbar)
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  amount(amount: string): this {
    if (!isValidAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._amount = amount;
    return this;
  }

  //endregion

  //region Validators
  validateMandatoryFields(): void {
    if (this._toAddress === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing to');
    }
    if (this._amount === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing amount');
    }
    super.validateMandatoryFields();
  }
  //endregion
}
