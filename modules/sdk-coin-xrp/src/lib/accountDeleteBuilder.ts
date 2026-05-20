import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AccountDelete } from 'xrpl';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

/**
 * Builder for XRPL AccountDelete transactions.
 *
 * An AccountDelete transaction removes an XRP Ledger account and any objects
 * it owns, sending the full remaining balance (including the base reserve) to
 * the specified destination address.  The protocol requires a minimum fee equal
 * to the owner-reserve increment (currently 2 XRP / 2 000 000 drops) and the
 * account sequence number must satisfy: Sequence + 256 <= current ledger.
 */
export class AccountDeleteBuilder extends TransactionBuilder {
  private _destination: string;
  private _destinationTag?: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AccountDelete;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    const { destination, destinationTag } = tx.toJson();
    if (!destination) {
      throw new BuildTransactionError('Missing destination');
    }

    const normalizeAddress = utils.normalizeAddress({ address: destination, destinationTag });
    this.to(normalizeAddress);
  }

  /**
   * Set the destination address (and optional destination tag).
   * @param address - bech32 XRP address, optionally with ?dt=<tag> query string
   */
  to(address: string): AccountDeleteBuilder {
    const { address: xrpAddress, destinationTag } = utils.getAddressDetails(address);
    this._destination = xrpAddress;
    this._destinationTag = destinationTag;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }
    if (!this._destination) {
      throw new BuildTransactionError('Destination must be set before building the transaction');
    }

    const accountDeleteFields: AccountDelete = {
      TransactionType: 'AccountDelete',
      Account: this._sender,
      Destination: this._destination,
    };

    if (typeof this._destinationTag === 'number') {
      accountDeleteFields.DestinationTag = this._destinationTag;
    }

    this._specificFields = accountDeleteFields;

    return await super.buildImplementation();
  }
}
