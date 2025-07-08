import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBody, Transaction as VetTransaction, HexUInt } from '@vechain/sdk-core';
import { KeyPair } from '../keyPair';
import assert from 'assert';

export class AddressInitializationTransaction extends Transaction {
  private _baseAddress: string;
  private _feeAddress: string;
  private _salt: string;
  private _initCode: string;
  private _transactionData: string;
  private _signature: Buffer | undefined;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.AddressInitialization;
  }

  get baseAddress(): string {
    return this._baseAddress;
  }

  set baseAddress(address: string) {
    this._baseAddress = address;
  }

  get feeAddress(): string {
    return this._feeAddress;
  }

  set feeAddress(address: string) {
    this._feeAddress = address;
  }

  get salt(): string {
    return this._salt;
  }

  set salt(salt: string) {
    this._salt = salt;
  }

  get initCode(): string {
    return this._initCode;
  }

  set initCode(initCode: string) {
    this._initCode = initCode;
  }

  get transactionData(): string {
    return this._transactionData;
  }

  set transactionData(transactionData: string) {
    this._transactionData = transactionData;
  }

  buildClauses(): void {
    this._clauses = [
      {
        to: this._contract,
        value: '0x0',
        data: this._transactionData,
      },
    ];
  }

  protected async buildRawTransaction(): Promise<void> {
    const transactionBody: TransactionBody = {
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: 64, //move this value to constants
      clauses: this.clauses,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: null,
      nonce: this.nonce,
    };

    this.rawTransaction = VetTransaction.of(transactionBody);
  }

  sign(keyPair: KeyPair): void {
    const signedTx = this._rawTransaction.sign(HexUInt.of(keyPair.getKeys().prv as string).bytes);
    if (signedTx.isSigned) {
      assert(signedTx.signature);
      this._signature = Buffer.from(signedTx.signature);
    }
    this._id = signedTx.id.toString();
  }
}
