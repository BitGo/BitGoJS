import { TransactionBuilder } from './transactionBuilder';
import { TransactionType } from '../baseCoin';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { AtaInit } from './iface';
import { InstructionBuilderTypes } from './constants';
import { PublicKey } from '@solana/web3.js';
import { isValidPublicKey } from './utils';
import { BuildTransactionError } from '../baseCoin/errors';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import assert from 'assert';

export class AtaInitializationBuilder extends TransactionBuilder {
  private _mint: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
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

        this.mint(ataInitInstruction.params.mintAddress);
        this.sender(ataInitInstruction.params.ownerAddress);
      }
    }
  }

  /**
   * Sets the mint address of the associated token account
   *
   * @param mint mint address of associated token account
   */
  mint(mint: string): this {
    if (!mint || !isValidPublicKey(mint)) {
      throw new BuildTransactionError('Invalid or missing mint, got: ' + mint);
    }

    this._mint = mint;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
    if (this._mint === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing mint');
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._mint, 'Mint must be set before building the transaction');

    const ataPk = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(this._mint),
      new PublicKey(this._sender),
    );
    const ataInitData: AtaInit = {
      type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
      params: {
        mintAddress: this._mint,
        ataAddress: ataPk.toString(),
        ownerAddress: this._sender,
        payerAddress: this._sender,
      },
    };
    this._instructionsData = [ataInitData];
    return await super.buildImplementation();
  }
}
