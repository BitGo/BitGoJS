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
  // transferFee is the issuance-level per-100,000 fee (e.g. 100 = 0.1%).
  // When set, DeliverMax is computed as Amount + ⌈Amount × transferFee / 100_000⌉
  // so the sender covers the fee charged by the protocol on delivery.
  private _transferFee?: number;
  // Preserved SendMax from a deserialized transaction (multi-sig rebuild path).
  private _restoredSendMax?: MPTAmount;

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
   * Set the per-issuance transfer fee so DeliverMax is computed correctly.
   * Matches the MPTokenIssuance.TransferFee ledger field: an integer in [0, 50_000]
   * representing a fraction of 100,000 (e.g. 100 = 0.1%).
   * When non-zero, DeliverMax is set to Amount + ⌈Amount × fee / 100_000⌉.
   * @param {number} fee - TransferFee value from the MPTokenIssuance ledger object
   */
  transferFee(fee: number): this {
    if (!Number.isInteger(fee) || fee < 0 || fee > 50_000) {
      throw new BuildTransactionError('MPT transferFee must be an integer between 0 and 50,000');
    }
    this._transferFee = fee;
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
    // Restore SendMax from the raw payment so it survives a build→serialize→rebuild round-trip.
    // This is necessary for multi-sig flows where a second signer rebuilds the transaction.
    const rawPayload = tx.getSignablePayload() as Payment;
    const sendMax = rawPayload?.SendMax;
    if (sendMax !== undefined && typeof sendMax === 'object' && 'mpt_issuance_id' in (sendMax as MPTAmount)) {
      this._restoredSendMax = sendMax as MPTAmount;
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

    // Set SendMax so the sender covers the TransferFee charged by the issuer.
    // Without SendMax, rippled defaults to SendMax = Amount; when TransferFee > 0 the
    // protocol deducts Amount + fee from the sender, so the tx fails with tecPATH_PARTIAL.
    // Note: DeliverMax is a JSON-level alias that the binary codec does not recognise;
    // SendMax (field code 9) must be used for binary serialisation.
    if (this._transferFee !== undefined && this._transferFee > 0) {
      const amountBig = BigInt(this._value);
      const feeBig = (amountBig * BigInt(this._transferFee) + BigInt(99_999)) / BigInt(100_000);
      paymentFields.SendMax = {
        mpt_issuance_id: this._mptIssuanceId,
        value: String(amountBig + feeBig),
      };
    } else if (this._restoredSendMax) {
      paymentFields.SendMax = this._restoredSendMax;
    }

    this._specificFields = paymentFields;

    return await super.buildImplementation();
  }
}
