import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { proto } from '@hashgraph/proto';
import { BaseKey, BuildTransactionError, SigningError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import {
  buildHederaAccountID,
  buildHederaTokenID,
  getHederaTokenIdFromName,
  isValidAddress,
  isValidHederaTokenID,
  stringifyAccountId,
  stringifyTokenId,
} from './utils';
import { TransactionBuilder } from './transactionBuilder';
import { DEFAULT_SIGNER_NUMBER } from './constants';

export class TokenAssociateBuilder extends TransactionBuilder {
  private readonly _txBodyData: proto.TokenAssociateTransactionBody;
  private _account: string;
  private _tokenIds: string[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.TokenAssociateTransactionBody();
    this._txBody.tokenAssociate = this._txBodyData;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const tokenAssociateAccount = tx.txBody.tokenAssociate;
    if (tokenAssociateAccount && tokenAssociateAccount.tokens) {
      this.initTokenAssociation(tokenAssociateAccount as proto.TokenAssociateTransactionBody);
    }
  }

  private initTokenAssociation(tokenAssociateAccount: proto.ITokenAssociateTransactionBody): void {
    tokenAssociateAccount.tokens!.forEach((tokenId: proto.ITokenID) => {
      const token = stringifyTokenId(tokenId);
      this.validateToken(token);
      this._tokenIds.push(token);
    });

    if (tokenAssociateAccount.account) {
      const accountId = stringifyAccountId(tokenAssociateAccount.account);
      this.account(accountId);
    }
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._multiSignerKeyPairs.length >= DEFAULT_SIGNER_NUMBER) {
      throw new SigningError('A maximum of ' + DEFAULT_SIGNER_NUMBER + ' can sign the transaction.');
    }
    return super.signImplementation(key);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.tokens = this.buildTokenData();
    this._txBodyData.account = this.buildAccountData();
    this.transaction.setTransactionType(TransactionType.AssociatedTokenAccountInitialization);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  validateMandatoryFields(): void {
    if (!this._tokenIds || this._tokenIds.length < 1) {
      throw new BuildTransactionError('Invalid transaction: missing tokens to associate');
    }

    super.validateMandatoryFields();
  }

  /**
   * Set account to associate with tokens, defaults to this._source.address value
   *
   * @param {string} accountID - The name of the account to associate to the transaction
   * @returns {TokenAssociateBuilder} - This token association builder
   */
  account(accountID: string): this {
    this.validateAccount(accountID);
    this._account = accountID;
    return this;
  }

  /**
   * Add a token to associate to the multisig wallet.
   *
   * @param {string} tokenName - The name of the token to associate to the transaction
   * @returns {TokenAssociateBuilder} - This token association builder
   */
  tokens(tokenName: string): this {
    const tokenId = getHederaTokenIdFromName(tokenName);
    if (!tokenId) {
      throw new BuildTransactionError('Unsupported token: ' + tokenName);
    }
    this.validateToken(tokenId);
    this._tokenIds.push(tokenId!);
    return this;
  }

  private buildTokenData(): proto.TokenID[] {
    return this._tokenIds.map(buildHederaTokenID);
  }

  private buildAccountData(): proto.AccountID {
    let accountId = this._account;
    if (!accountId) {
      accountId = this._source.address;
    }

    return buildHederaAccountID(accountId);
  }

  private validateAccount(accountID: string): void {
    if (!isValidAddress(accountID)) {
      throw new BuildTransactionError('Unsupported account address: ' + accountID);
    }
  }

  private validateToken(tokenId: string): void {
    if (this._tokenIds.includes(tokenId)) {
      throw new BuildTransactionError('Repeated token ID: ' + tokenId);
    } else if (!isValidHederaTokenID(tokenId)) {
      throw new BuildTransactionError('Invalid token ID: ' + tokenId);
    }
  }
}
