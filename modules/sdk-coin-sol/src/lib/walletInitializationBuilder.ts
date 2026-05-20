import assert from 'assert';

import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { isValidAmount, validateAddress } from './utils';
import { WalletInit } from './iface';
import { InstructionBuilderTypes } from './constants';

export class WalletInitializationBuilder extends TransactionBuilder {
  private _nonceAddress: string;
  private _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  /** @inheritDoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CreateNonceAccount) {
        const walletInitInstruction: WalletInit = instruction;

        this.address(walletInitInstruction.params.nonceAddress);
        this.amount(walletInitInstruction.params.amount);
        this.sender(walletInitInstruction.params.authAddress);
      }
    }
  }

  /**
   * Sets the amount to fund the nonce account
   *
   * @param amount amount in lamports to fund the nonce account
   */
  amount(amount: string): this {
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }

    this._amount = amount;
    return this;
  }

  /**
   * Sets the address for the nonce account
   * @param nonceAddress address of the new nonce account
   */
  address(nonceAddress: string): this {
    validateAddress(nonceAddress, 'nonceAddress');
    this._nonceAddress = nonceAddress;

    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    assert(this._amount, 'Amount must be set before building the transaction');
    assert(this._nonceAddress, 'Nonce Address must be set before building the transaction');

    const walletInitData: WalletInit = {
      type: InstructionBuilderTypes.CreateNonceAccount,
      params: {
        fromAddress: this._sender,
        nonceAddress: this._nonceAddress,
        authAddress: this._sender,
        amount: this._amount,
      },
    };
    this._instructionsData = [walletInitData];

    return await super.buildImplementation();
  }
}
