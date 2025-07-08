import { TransactionClause } from '@vechain/sdk-core';

import { getProxyInitcode, getCreateForwarderParamsAndTypes } from '@bitgo/abstract-eth';
import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { setLengthLeft, toBuffer, addHexPrefix } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';

import { TransactionBuilder } from './transactionBuilder';
import { AddressInitializationTransaction } from '../transaction/addressInitializationTransaction';
import { KeyPair } from '../keyPair';
import { Transaction } from '../transaction/transaction';

export class AddressInitializationBuilder extends TransactionBuilder {
  protected _sourceKeyPair: KeyPair;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: AddressInitializationTransaction): void {
    this._transaction = tx;
  }

  get addressInitializationTransaction(): AddressInitializationTransaction {
    return this._transaction as AddressInitializationTransaction;
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

  baseAddress(address: string): this {
    this.validateAddress({ address });
    this.addressInitializationTransaction.baseAddress = address;
    return this;
  }

  feeAddress(address: string): this {
    this.validateAddress({ address });
    this.addressInitializationTransaction.feeAddress = address;
    return this;
  }

  salt(salt: string): this {
    this.addressInitializationTransaction.salt = salt;
    return this;
  }

  initCode(address: string): this {
    this.validateAddress({ address });
    this.addressInitializationTransaction.initCode = getProxyInitcode(address);
    return this;
  }

  //logic to get deployed address

  protected async buildImplementation(): Promise<Transaction> {
    const transactionData = this.getAddressInitializationData();
    this.transaction.type = this.transactionType;
    this.addressInitializationTransaction.transactionData = transactionData;
    await this.addressInitializationTransaction.build();
    return this.transaction;
  }

  private getAddressInitializationData(): string {
    const saltBuffer = setLengthLeft(toBuffer(this.addressInitializationTransaction.salt), 32);
    const { createForwarderParams, createForwarderTypes } = getCreateForwarderParamsAndTypes(
      this.addressInitializationTransaction.baseAddress,
      saltBuffer,
      this.addressInitializationTransaction.feeAddress
    );
    const method = EthereumAbi.methodID('createForwarder', createForwarderTypes);
    const args = EthereumAbi.rawEncode(createForwarderTypes, createForwarderParams);
    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }
}
