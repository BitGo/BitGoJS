import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { MPTokenAuthorize } from 'xrpl';
import { XrpTransactionType } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class MPTAuthorizeBuilder extends TransactionBuilder {
  private _mptIssuanceId?: string;
  private _mptHolder?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.MPTokenAuthorize;
  }

  protected get xrpTransactionType(): XrpTransactionType.MPTokenAuthorize {
    return XrpTransactionType.MPTokenAuthorize;
  }

  /**
   * Set the MPTokenIssuanceID to authorize.
   * @param {string} id - 48-character hex MPTokenIssuanceID
   */
  mptIssuanceId(id: string): this {
    if (!/^[0-9a-fA-F]{48}$/.test(id)) {
      throw new BuildTransactionError('MPTokenIssuanceID must be a 48-character hex string (192 bits)');
    }
    this._mptIssuanceId = id;
    return this;
  }

  /**
   * Set the Holder field for issuer-side authorization (Phase 2 only).
   * Omit for standard holder self-authorization.
   * @param {string} address - the holder account address (must be a valid XRP address)
   */
  mptHolder(address: string): this {
    if (!utils.isValidAddress(address)) {
      throw new BuildTransactionError('Invalid holder address: ' + address);
    }
    this._mptHolder = address;
    return this;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const { mptIssuanceId, mptHolder } = tx.toJson();
    if (mptIssuanceId) {
      this._mptIssuanceId = mptIssuanceId;
    }
    if (mptHolder) {
      this._mptHolder = mptHolder;
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }
    if (!this._mptIssuanceId) {
      throw new BuildTransactionError('MPTokenIssuanceID must be set before building the transaction');
    }

    const authorizeFields: MPTokenAuthorize = {
      TransactionType: this.xrpTransactionType,
      Account: this._sender,
      MPTokenIssuanceID: this._mptIssuanceId,
    };

    // Omit Holder for self-authorization — setting it causes XRPL rejection on holder self-auth.
    if (this._mptHolder) {
      authorizeFields.Holder = this._mptHolder;
    }

    this._specificFields = authorizeFields;

    return await super.buildImplementation();
  }
}
