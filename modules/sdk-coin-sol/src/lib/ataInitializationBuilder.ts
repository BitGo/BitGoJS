import { TransactionBuilder } from './transactionBuilder';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
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

export class AtaInitializationBuilder extends TransactionBuilder {
  private _tokenName: string;
  private _mint: string;
  private _owner: string;
  private _rentExemptAmount: string;
  protected _transaction: AtaInitializationTransaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new AtaInitializationTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AssociatedTokenAccountInitialization;
  }

  /** @inheritDoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CreateAssociatedTokenAccount) {
        const ataInitInstruction: AtaInit = instruction;

        this.mint(ataInitInstruction.params.tokenName);
        this.validateMintOrThrow();
        this.owner(ataInitInstruction.params.ownerAddress);
      }
    }
  }

  /**
   * Sets the mint address of the associated token account
   *
   * @param tokenName name of the token
   */
  mint(tokenName: string): this {
    const token = getSolTokenFromTokenName(tokenName);
    if (!token) {
      throw new BuildTransactionError('Invalid transaction: invalid token name, got: ' + tokenName);
    }
    this._mint = token.tokenAddress;
    this._tokenName = token.name;
    return this;
  }

  private validateMintOrThrow() {
    if (!this._mint || !isValidPublicKey(this._mint)) {
      throw new BuildTransactionError('Invalid transaction: invalid or missing mint, got: ' + this._mint);
    }
  }

  /**
   * Sets the owner address of the associated token account
   *
   * @param owner owner address of associated token account
   */
  owner(owner: string): this {
    this._owner = owner;
    this.validateOwnerOrThrow();
    return this;
  }

  private validateOwnerOrThrow() {
    if (!this._owner || !isValidAddress(this._owner)) {
      throw new BuildTransactionError('Invalid transaction: invalid owner, got: ' + this._owner);
    }
  }

  /**
   * Used to set the minimum rent exempt amount
   *
   * @param rentExemptAmount minimum rent exempt amount in lamports
   */
  rentExemptAmount(rentExemptAmount: string): this {
    this._rentExemptAmount = rentExemptAmount;
    this.validateRentExemptAmountOrThrow();
    return this;
  }

  private validateRentExemptAmountOrThrow() {
    // _rentExemptAmount is allowed to be undefined or a valid amount if it's defined
    if (this._rentExemptAmount && !isValidAmount(this._rentExemptAmount)) {
      throw new BuildTransactionError('Invalid transaction: invalid rentExemptAmount, got: ' + this._rentExemptAmount);
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
    this.validateMintOrThrow();
    this.validateRentExemptAmountOrThrow();
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._mint && this._tokenName, 'Mint must be set before building the transaction');
    this._owner = this._owner || this._sender;
    assert(this._owner, 'Owner must be set before building the transaction');

    const ataPk = await getAssociatedTokenAccountAddress(this._mint, this._owner);
    const ataInitData: AtaInit = {
      type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
      params: {
        mintAddress: this._mint,
        ataAddress: ataPk,
        ownerAddress: this._owner,
        payerAddress: this._sender,
        tokenName: this._tokenName,
      },
    };
    this._instructionsData = [ataInitData];
    this._transaction.tokenAccountRentExemptAmount = this._rentExemptAmount;
    return await super.buildImplementation();
  }
}
