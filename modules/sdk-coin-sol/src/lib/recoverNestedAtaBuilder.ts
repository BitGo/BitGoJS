import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import assert from 'assert';
import { InstructionBuilderTypes } from './constants';
import { AtaRecoverNested } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { validateAddress } from './utils';

export class RecoverNestedAtaBuilder extends TransactionBuilder {
  protected _nestedAccountAddress: string;
  protected _nestedMintAddress: string;
  protected _destinationAccountAddress: string;
  protected _ownerAccountAddress: string;
  protected _ownerMintAddress: string;
  protected _walletAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CloseAssociatedTokenAccount;
  }

  nestedAccountAddress(nestedAccountAddress: string): this {
    validateAddress(nestedAccountAddress, 'nestedAccountAddress');
    this._nestedAccountAddress = nestedAccountAddress;
    return this;
  }

  nestedMintAddress(nestedMintAddress: string): this {
    validateAddress(nestedMintAddress, 'nestedMintAddress');
    this._nestedMintAddress = nestedMintAddress;
    return this;
  }

  destinationAccountAddress(destinationAccountAddress: string): this {
    validateAddress(destinationAccountAddress, 'destinationAccountAddress');
    this._destinationAccountAddress = destinationAccountAddress;
    return this;
  }

  ownerAccountAddress(ownerAccountAddress: string): this {
    validateAddress(ownerAccountAddress, 'ownerAccountAddress');
    this._ownerAccountAddress = ownerAccountAddress;
    return this;
  }

  ownerMintAddress(ownerMintAddress: string): this {
    validateAddress(ownerMintAddress, 'ownerMintAddress');
    this._ownerMintAddress = ownerMintAddress;
    return this;
  }

  walletAddress(walletAddress: string): this {
    validateAddress(walletAddress, 'walletAddress');
    this._walletAddress = walletAddress;
    return this;
  }

  /** @inheritDoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.RecoverNestedAssociatedTokenAccount) {
        const recoverNestedInstruction: AtaRecoverNested = instruction;
        this.nestedAccountAddress(recoverNestedInstruction.params.nestedAccountAddress);
        this.nestedMintAddress(recoverNestedInstruction.params.nestedMintAddress);
        this.destinationAccountAddress(recoverNestedInstruction.params.destinationAccountAddress);
        this.ownerAccountAddress(recoverNestedInstruction.params.ownerAccountAddress);
        this.ownerMintAddress(recoverNestedInstruction.params.ownerMintAddress);
        this.walletAddress(recoverNestedInstruction.params.walletAddress);
      }
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._nestedAccountAddress, 'nestedAccountAddress must be set before building the transaction');
    assert(this._nestedMintAddress, 'nestedMintAddress must be set before building the transaction');
    assert(this._destinationAccountAddress, 'destinationAccountAddress must be set before building the transaction');
    assert(this._ownerAccountAddress, 'ownerAccountAddress must be set before building the transaction');
    assert(this._ownerMintAddress, 'ownerMintAddress must be set before building the transaction');
    assert(this._walletAddress, 'walletAddress must be set before building the transaction');

    const recoverNestedData: AtaRecoverNested = {
      type: InstructionBuilderTypes.RecoverNestedAssociatedTokenAccount,
      params: {
        nestedAccountAddress: this._nestedAccountAddress,
        nestedMintAddress: this._nestedMintAddress,
        destinationAccountAddress: this._destinationAccountAddress,
        ownerAccountAddress: this._ownerAccountAddress,
        ownerMintAddress: this._ownerMintAddress,
        walletAddress: this._walletAddress,
      },
    };

    this._instructionsData = [recoverNestedData];

    return await super.buildImplementation();
  }
}
