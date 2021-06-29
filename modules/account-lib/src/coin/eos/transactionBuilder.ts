import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { BaseTransactionBuilder } from '../baseCoin';
import { NotImplementedError, BuildTransactionError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { Action } from './ifaces';
import { OfflineAbiProvider } from './OfflineAbiProvider';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;

  private _keypair: KeyPair[];
  private eosApi: EosJs.Api;
  private _eosTxBuilder?: EosTxBuilder;
  private _rpc: EosJs.JsonRpc;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._keypair = [];
    this.mocknet();
  }

  protected abstract actionData(action: EosJs.ApiInterfaces.ActionSerializerType, data: any): any;

  protected action(account: string, actor: string, data: any): this {
    if (this._eosTxBuilder) {
      this.actionData(this._eosTxBuilder.with(account).as(actor), data);
    }
    return this;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    const keypair = new KeyPair({ prv: key });
    this._keypair.push(keypair);
    return this._transaction;
  }

  private initEosApi(): void {
    if (this._keypair.length === 0) {
      throw new BuildTransactionError('Keypair cannot be less than zero');
    }
    const requiredKeys = this._keypair.reduce((result, kp) => {
      const prv = kp.getKeys().prv;
      if (prv) result.push(prv);
      return result;
    }, <string[]>[]);
    const signatureProvider = new JsSignatureProvider(requiredKeys);
    this.eosApi = new EosJs.Api({
      rpc: this._rpc,
      signatureProvider: signatureProvider,
      abiProvider: new OfflineAbiProvider(),
      chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });
    this._eosTxBuilder = new EosTxBuilder(this.eosApi);
  }

  mocknet(): void {
    this._rpc = new EosJs.JsonRpc('http://127.0.0.1:8888', { fetch });
  }

  testnet(): void {
    this._rpc = new EosJs.JsonRpc('https://api.testnet.eos.io', { fetch });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await this._eosTxBuilder?.send();
    this._transaction.setEosTransaction(tx as EosJs.RpcInterfaces.PushTransactionArgs);
    return this._transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    throw new NotImplementedError('initBuilder not implemented');
  }

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new NotImplementedError('validateAddress not implemented');
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  private validateBaseFields(actions: Action[]): void {
    if (actions.length === 0) {
      throw new BuildTransactionError('Actions cannot be less than zero');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
  // endregion
}
