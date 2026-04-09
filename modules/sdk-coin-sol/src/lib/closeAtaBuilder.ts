import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import assert from 'assert';
import { InstructionBuilderTypes } from './constants';
import { AtaClose } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { validateAddress } from './utils';

export class CloseAtaBuilder extends TransactionBuilder {
  protected _accountAddress: string;
  protected _destinationAddress: string;
  protected _authorityAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CloseAssociatedTokenAccount;
  }

  accountAddress(accountAddress: string): this {
    validateAddress(accountAddress, 'accountAddress');
    this._accountAddress = accountAddress;
    return this;
  }

  destinationAddress(destinationAddress: string): this {
    validateAddress(destinationAddress, 'destinationAddress');
    this._destinationAddress = destinationAddress;
    return this;
  }

  authorityAddress(authorityAddress: string): this {
    validateAddress(authorityAddress, 'authorityAddress');
    this._authorityAddress = authorityAddress;
    return this;
  }

  /** @inheritDoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CloseAssociatedTokenAccount) {
        const ataCloseInstruction: AtaClose = instruction;
        this.accountAddress(ataCloseInstruction.params.accountAddress);
        this.destinationAddress(ataCloseInstruction.params.destinationAddress);
        this.authorityAddress(ataCloseInstruction.params.authorityAddress);
      }
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._accountAddress, 'Account Address must be set before building the transaction');
    assert(this._destinationAddress, 'Destination Address must be set before building the transaction');
    assert(this._authorityAddress, 'Authority Address must be set before building the transaction');

    if (this._accountAddress === this._destinationAddress) {
      throw new BuildTransactionError('Account address to close cannot be the same as the destination address');
    }

    const closeAssociatedTokenAccountData: AtaClose = {
      type: InstructionBuilderTypes.CloseAssociatedTokenAccount,
      params: {
        accountAddress: this._accountAddress,
        destinationAddress: this._destinationAddress,
        authorityAddress: this._authorityAddress,
      },
    };

    this._instructionsData = [closeAssociatedTokenAccountData];

    return await super.buildImplementation();
  }
}
