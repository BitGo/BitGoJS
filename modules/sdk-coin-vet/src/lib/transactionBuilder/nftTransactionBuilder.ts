import BigNumber from 'bignumber.js';
import { TransactionClause } from '@vechain/sdk-core';

import { BuildTransactionError, Recipient, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { TransactionBuilder } from './transactionBuilder';
import { NFTTransaction } from '../transaction/nftTransaction';
import utils from '../utils';

export class NFTTransactionBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: NFTTransaction): void {
    super.initBuilder(tx);
  }

  get nftTransaction(): NFTTransaction {
    return this._transaction as NFTTransaction;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.SendNFT;
  }

  validateRecipientValue(value: BigNumber): void {
    if (value.isNaN()) {
      throw new BuildTransactionError('Invalid amount format');
    } else if (!value.isEqualTo(1)) {
      throw new BuildTransactionError('Value cannot be anything other than 1 for NFT transfer');
    }
  }

  recipients(recipients: Recipient[]): this {
    for (const recipient of recipients) {
      this.validateAddress({ address: recipient.address });
      this.validateRecipientValue(new BigNumber(recipient.amount));
    }
    this.transaction.recipients = recipients;
    return this;
  }

  /**
   * Validates the transaction clauses for NFT transaction.
   * @param {TransactionClause[]} clauses - The transaction clauses to validate.
   * @returns {boolean} - Returns true if the clauses are valid, false otherwise.
   */
  protected isValidTransactionClauses(clauses: TransactionClause[]): boolean {
    try {
      if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
        return false;
      }

      const clause = clauses[0];

      if (!clause.to || !utils.isValidAddress(clause.to)) {
        return false;
      }

      // For NFT transactions, the value should be 0
      if (clause.value !== 0) {
        return false;
      }

      const { recipients, sender } = utils.decodeTransferNFTData(clause.data);

      const recipientAddress = recipients[0].address.toLowerCase();

      if (!recipientAddress || !utils.isValidAddress(recipientAddress)) {
        return false;
      }

      if (!sender || !utils.isValidAddress(sender)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  nftCollectionId(nftCollectionId: string): this {
    // nftCollectionId is basically a contract address, so we can use the same validation
    try {
      this.validateAddress({ address: nftCollectionId });
    } catch (e) {
      throw new BuildTransactionError('Invalid nftCollectionId, must be a valid contract address');
    }
    this.nftTransaction.nftCollectionId = nftCollectionId;
    return this;
  }

  tokenId(tokenId: string): this {
    const tokenIdBN = new BigNumber(tokenId);
    if (!tokenIdBN.isInteger() || tokenIdBN.isNegative()) {
      throw new Error('Invalid tokenId, must be a non-negative integer');
    }
    this.nftTransaction.tokenId = tokenIdBN.toFixed(0);
    return this;
  }
}
