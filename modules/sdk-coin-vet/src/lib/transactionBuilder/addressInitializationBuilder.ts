import { TransactionClause } from '@vechain/sdk-core';

import { BaseKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { TransactionBuilder } from './transactionBuilder';
import { AddressInitializationTransaction } from '../transaction/addressInitializationTransaction';
import { KeyPair } from '../keyPair';
import { Transaction } from '../transaction/transaction';

export class AddressInitializationBuilder extends TransactionBuilder {
  protected _addressInitializationTransaction: AddressInitializationTransaction;
  protected _sourceKeyPair: KeyPair;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: AddressInitializationTransaction): void {
    this._addressInitializationTransaction = tx;
  }

  get addressInitializationTransaction(): AddressInitializationTransaction {
    return this._addressInitializationTransaction;
  }

  get sourceKeyPair(): KeyPair {
    return this._sourceKeyPair;
  }

  set sourceKeyPair(keyPair: KeyPair) {
    this._sourceKeyPair = keyPair;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AddressInitialization;
  }

  protected isValidTransactionClauses(clauses: TransactionClause[]): boolean {
    return true;
  }

  counter(c: number): this {
    this.transaction.nonce = c;
    return this;
  }

  forwarderFactoryAddress(address: string): this {
    this.addressInitializationTransaction.forwarderFactoryAddress = address;
    return this;
  }

  baseAddress(address: string): this {
    this.addressInitializationTransaction.baseAddress = address;
    return this;
  }

  feeAddress(address: string): this {
    this.addressInitializationTransaction.feeAddress = address;
    return this;
  }

  salt(salt: string): this {
    this.addressInitializationTransaction.salt = salt;
    return this;
  }

  forwarderImplementtationAddress(address: string): this {
    this.addressInitializationTransaction.forwarderImplementationAddress = address;
    return this;
  }

  //logic to get deployed address

  protected signImplementation(key: BaseKey): AddressInitializationTransaction {
    const signer = new KeyPair({ prv: key.key });
    // Signing the transaction is an async operation, so save the source and leave the actual
    // signing for the build step
    this.sourceKeyPair = signer;
    return this.addressInitializationTransaction;
  }

  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.addressInitializationTransaction.build();
    this.addressInitializationTransaction.sign(this.sourceKeyPair);
    return this.transaction;
  }
}
