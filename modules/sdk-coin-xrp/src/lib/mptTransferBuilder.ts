import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { MPTAmount, Payment } from 'xrpl';
import { XrpTransactionType } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class MPTokenTransferBuilder extends TransactionBuilder {
  private _mptIssuanceId?: string;
  private _value?: string;
  private _destination?: string;
  private _destinationTag?: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.SendMPT;
  }

  protected get xrpTransactionType(): XrpTransactionType.Payment {
    // MPT transfers use a standard Payment transaction with an MPT Amount object
    return XrpTransactionType.Payment;
  }

  /**
   * Set the recipient address (with optional destination tag).
   * @param {string} address - the recipient XRP address, optionally with destination tag
   */
  to(address: string): this {
    const { address: xrpAddress, destinationTag } = utils.getAddressDetails(address);
    this._destination = xrpAddress;
    this._destinationTag = destinationTag;
    return this;
  }

  /**
   * Set the MPT issuance ID and raw integer amount to transfer.
   * The value is a raw integer string — AssetScale is display-only and never applied here.
   * @param {string} issuanceId - 48-character hex MPTokenIssuanceID
   * @param {string} value - raw integer string (e.g. "1000" = 1000 base units)
   */
  mptAmount(issuanceId: string, value: string): this {
    if (!/^[0-9a-fA-F]{48}$/.test(issuanceId)) {
      throw new BuildTransactionError('MPTokenIssuanceID must be a 48-character hex string');
    }
    if (!/^\d+$/.test(value)) {
      throw new BuildTransactionError('MPT value must be a non-negative integer string');
    }
    this._mptIssuanceId = issuanceId;
    this._value = value;
    return this;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const { destination, destinationTag, mptAmount } = tx.toJson();
    if (destination) {
      const normalizedAddress = utils.normalizeAddress({ address: destination, destinationTag });
      this.to(normalizedAddress);
    }
    if (mptAmount) {
      this.mptAmount(mptAmount.mpt_issuance_id, mptAmount.value);
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }
    if (!this._destination || !this._mptIssuanceId || !this._value) {
      throw new BuildTransactionError(
        'Missing mandatory MPT payment parameters: destination, mptIssuanceId, and value are all required'
      );
    }

    const mptAmountObj: MPTAmount = {
      mpt_issuance_id: this._mptIssuanceId,
      value: this._value,
    };

    const paymentFields: Payment = {
      TransactionType: this.xrpTransactionType,
      Account: this._sender,
      Destination: this._destination,
      Amount: mptAmountObj,
    };

    if (typeof this._destinationTag === 'number') {
      paymentFields.DestinationTag = this._destinationTag;
    }

    this._specificFields = paymentFields;

    return await super.buildImplementation();
  }
}
