import { TransactionBuilder } from './transactionBuilder';
import { BuildTransactionError, DuplicateMethodError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { AtaInit } from './iface';
import { InstructionBuilderTypes } from './constants';
import {
  getAssociatedTokenAccountAddress,
  getSolTokenFromTokenName,
  isValidAddress,
  isValidAmount,
  isValidPublicKey,
} from './utils';
import assert from 'assert';
import { AtaInitializationTransaction } from './ataInitializationTransaction';
import * as _ from 'lodash';

export class TokenAssociateRecipient {
  ownerAddress: string;
  tokenName: string;
}

export class AtaInitializationBuilder extends TransactionBuilder {
  // @deprecated - Use the _tokenAssociateRecipients field instead
  private _tokenName: string;
  // @deprecated - Use the _tokenAssociateRecipients field instead
  private _mint: string;
  // @deprecated - Use the _tokenAssociateRecipients field instead
  private _owner: string;
  private _rentExemptAmount: string;
  private _tokenAssociateRecipients: TokenAssociateRecipient[];
  protected _transaction: AtaInitializationTransaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new AtaInitializationTransaction(_coinConfig);
    this._tokenAssociateRecipients = [];
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AssociatedTokenAccountInitialization;
  }

  /** @inheritDoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this._tokenAssociateRecipients = [];
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CreateAssociatedTokenAccount) {
        const ataInitInstruction: AtaInit = instruction;
        this._tokenAssociateRecipients.push({
          ownerAddress: ataInitInstruction.params.ownerAddress,
          tokenName: ataInitInstruction.params.tokenName,
        });
      }
    }
  }

  /**
   * @deprecated - Use the enableToken method instead
   * Sets the mint address of the associated token account
   *
   * @param tokenName name of the token
   */
  mint(tokenName: string): this {
    if (this._tokenAssociateRecipients.length > 0) {
      throw new DuplicateMethodError('Invalid method: enableToken already used');
    }
    const token = getSolTokenFromTokenName(tokenName);
    if (!token) {
      throw new BuildTransactionError('Invalid transaction: invalid token name, got: ' + tokenName);
    }
    this._mint = token.tokenAddress;
    this._tokenName = token.name;
    this.validateMintOrThrow(this._mint);
    return this;
  }

  private validateMintOrThrow(mint: string) {
    if (!mint || !isValidPublicKey(mint)) {
      throw new BuildTransactionError('Invalid transaction: invalid or missing mint, got: ' + mint);
    }
  }

  /**
   * @deprecated - Use the enableToken method instead
   * Sets the owner address of the associated token account
   *
   * @param owner owner address of associated token account
   */
  owner(owner: string): this {
    if (this._tokenAssociateRecipients.length > 0) {
      throw new DuplicateMethodError('Invalid method: enableToken already used');
    }
    this._owner = owner;
    this.validateOwnerOrThrow(owner);
    return this;
  }

  private validateOwnerOrThrow(owner: string) {
    if (!owner || !isValidAddress(owner)) {
      throw new BuildTransactionError('Invalid transaction: invalid owner, got: ' + owner);
    }
  }

  /**
   * Used to set the minimum rent exempt amount
   *
   * @param rentExemptAmount minimum rent exempt amount in lamports
   */
  rentExemptAmount(rentExemptAmount: string): this {
    this._rentExemptAmount = rentExemptAmount;
    this.validateRentExemptAmountOrThrow(rentExemptAmount);
    return this;
  }

  private validateRentExemptAmountOrThrow(rentExemptAmount: string) {
    // _rentExemptAmount is allowed to be undefined or a valid amount if it's defined
    if (rentExemptAmount && !isValidAmount(rentExemptAmount)) {
      throw new BuildTransactionError('Invalid transaction: invalid rentExemptAmount, got: ' + rentExemptAmount);
    }
  }

  /**
   * Used for adding token association recipients consisting
   *  1. ownerAddress: owner of the token address
   *  2. tokenName: the name of token enabled that is supported by BitGo
   *
   *  @param TokenAssociateRecipient token associate recipient info
   */

  enableToken(recipient: TokenAssociateRecipient) {
    if (this._tokenAssociateRecipients.some((tokenAssociate) => _.isEqual(tokenAssociate, recipient))) {
      throw new BuildTransactionError(
        'Invalid transaction: invalid duplicate recipients, got: owner ' +
          recipient.ownerAddress +
          ' and tokenName ' +
          recipient.tokenName +
          ' twice'
      );
    }
    if (this._tokenName || this._mint) {
      throw new DuplicateMethodError('Invalid method: single mint already used');
    }
    this.validateOwnerOrThrow(recipient.ownerAddress);
    const token = getSolTokenFromTokenName(recipient.tokenName);
    if (!token) {
      throw new BuildTransactionError('Invalid transaction: invalid token name, got: ' + recipient.tokenName);
    }
    this.validateMintOrThrow(token.tokenAddress);

    this._tokenAssociateRecipients.push(recipient);
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
    this.validateRentExemptAmountOrThrow(this._rentExemptAmount);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    if (this._tokenAssociateRecipients.length == 0) {
      assert(this._mint && this._tokenName, 'Mint must be set before building the transaction');
      this._owner = this._owner || this._sender;
      this._tokenAssociateRecipients.push({
        ownerAddress: this._owner,
        tokenName: this._tokenName,
      });
    }

    this._instructionsData = [];
    await Promise.all(
      this._tokenAssociateRecipients.map(async (recipient) => {
        const token = getSolTokenFromTokenName(recipient.tokenName);
        if (!token) {
          throw new BuildTransactionError('Invalid transaction: invalid token name, got: ' + recipient.tokenName);
        }
        const ataPk = await getAssociatedTokenAccountAddress(token.tokenAddress, recipient.ownerAddress);
        this._instructionsData.push({
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            mintAddress: token.tokenAddress,
            ataAddress: ataPk,
            ownerAddress: recipient.ownerAddress,
            payerAddress: this._sender,
            tokenName: recipient.tokenName!,
          },
        });
      })
    );

    this._transaction.tokenAccountRentExemptAmount = this._rentExemptAmount;
    return await super.buildImplementation();
  }
}
