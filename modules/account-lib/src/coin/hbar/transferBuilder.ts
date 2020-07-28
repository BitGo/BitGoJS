import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import Long from 'long';
import { AccountId } from '@hashgraph/sdk';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BuildTransactionError, InvalidParameterValueError } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount } from './utils';
import { KeyPair } from './';

export class TransferBuilder extends TransactionBuilder {
  private _txBodyData: proto.CryptoTransferTransactionBody;
  private _toAddress: string;
  private _sourceKeyPair: KeyPair;
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.CryptoTransferTransactionBody();
    this._txBody.cryptoTransfer = this._txBodyData;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.transfers = this.buildTransferData();
    const transaction = await super.buildImplementation();
    // Signing has to be done after all the transaction body is set
    if (this._sourceKeyPair && this._sourceKeyPair.getKeys().prv) {
      await transaction.sign(this._sourceKeyPair);
    }
    return transaction;
  }

  private buildTransferData(): proto.ITransferList {
    return {
      accountAmounts: [
        { accountID: this.buildAccountData(this._source.address), amount: Long.fromString(this._amount).negate() }, // sender
        { accountID: this.buildAccountData(this._toAddress), amount: Long.fromString(this._amount) }, // recipient
      ],
    };
  }

  private buildAccountData(address: string): proto.AccountID {
    const accountData = new AccountId(address);
    return new proto.AccountID({
      accountNum: accountData.account,
      realmNum: accountData.realm,
      shardNum: accountData.shard,
    });
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    const signer = new KeyPair({ prv: key.key });

    // Signing the transaction is an operation that relies on all the data being set,
    // so we set the source here and leave the actual signing for the build step
    this._sourceKeyPair = signer;
    return this.transaction;
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
