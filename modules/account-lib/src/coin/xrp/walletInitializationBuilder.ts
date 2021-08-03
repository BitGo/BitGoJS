import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { TransactionJSON } from 'ripple-lib';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import RippleBinaryCodec from 'ripple-binary-codec';
import { TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { WalletInitializationSchema } from './txnSchema';

export class WalletInitializationBuilder extends TransactionBuilder {
  protected _domain?: string;
  protected _setFlag?: number;
  protected _messageKey?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  domain(domain: string): this {
    this._domain = domain;
    return this;
  }

  setFlag(setFlag: number): this {
    this.validateValue(new BigNumber(setFlag));
    this._setFlag = setFlag;
    return this;
  }

  messageKey(messageKey: string): this {
    this._messageKey = messageKey;
    return this;
  }

  protected buildXRPTxn(): TransactionJSON {
    const tx: TransactionJSON = {
      Account: this._sender,
      TransactionType: 'AccountSet',
    };

    if (this._domain) tx.Domain = this._domain;
    if (this._setFlag) tx.SetFlag = this._setFlag;
    if (this._messageKey) tx.MessageKey = this._messageKey;

    return tx;
  }
  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const xrpTx = tx.getXRPTransaction();
    if (xrpTx) {
      this.domain(xrpTx.Domain as string);
      this.setFlag(xrpTx.SetFlag as number);
      this.messageKey(xrpTx.MessageKey as string);
    }
    return tx;
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    super.validateRawTransaction(rawTransaction);
    const decodedXrpTrx = RippleBinaryCodec.decode(rawTransaction) as rippleTypes.TransactionJSON;

    if (decodedXrpTrx.TransactionType !== 'AccountSet') {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${decodedXrpTrx.TransactionType}. Expected AccountSet`,
      );
    }

    this.validateFields(
      decodedXrpTrx.Domain as string,
      decodedXrpTrx.SetFlag as number,
      decodedXrpTrx.MessageKey as string,
    );
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    this.validateFields(this._domain, this._setFlag, this._messageKey);
  }

  private validateFields(domain?: string, setFlag?: number, messageKey?: string): void {
    const validationResult = WalletInitializationSchema.validate({
      domain,
      setFlag,
      messageKey,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
