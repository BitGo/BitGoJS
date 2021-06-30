/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { BaseTransactionBuilder } from '../baseCoin';
import { NotImplementedError, BuildTransactionError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { AddressValidationError } from './errors';
import utils from './utils';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { Action } from './ifaces';
import { OfflineAbiProvider } from './OfflineAbiProvider';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;

  private _keypair: KeyPair[];
  private _rpc: EosJs.JsonRpc;
  private _chainId: string;
  private actions: Action[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._keypair = [];
    this.mocknet();
  }

  protected abstract actionData(action: EosJs.ApiInterfaces.ActionSerializerType, data: any): any;

  protected abstract actionName(): string;

  protected action(account: string, actors: string[], data: any): this {
    const auth = actors.map((a) => {
      return {
        actor: a,
        permission: 'active',
      };
    });
    const action: Action = {
      account: account,
      authorization: auth,
      data: data,
      name: this.actionName(),
    };
    this.actions.push(action);
    return this;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    const keypair = new KeyPair({ prv: key });
    this._keypair.push(keypair);
    return this._transaction;
  }

  /**
   * Initialize Eos API
   *
   * @returns {EosJs.Api} initialized Api
   */
  private getEosApi(): EosJs.Api {
    if (this._keypair.length === 0) {
      throw new BuildTransactionError('Keypair cannot be less than zero');
    }
    const requiredKeys = this._keypair.reduce((result, kp) => {
      const prv = kp.getKeys().prv;
      if (prv) result.push(prv);
      return result;
    }, <string[]>[]);
    const signatureProvider = new JsSignatureProvider(requiredKeys);
    const eosApi = new EosJs.Api({
      rpc: this._rpc,
      signatureProvider: signatureProvider,
      abiProvider: new OfflineAbiProvider(),
      chainId: this._chainId,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });
    return eosApi;
  }

  mocknet(): this {
    this._rpc = new EosJs.JsonRpc('http://127.0.0.1:8888', { fetch });
    this._chainId = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
    return this;
  }

  testnet(): this {
    this._rpc = new EosJs.JsonRpc('https://api.testnet.eos.io', { fetch });
    // TODO: update chain id of testnet
    this._chainId = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
    return this;
  }

  mainnet(): this {
    this._rpc = new EosJs.JsonRpc('https://api.eosnewyork.io', { fetch });
    this._chainId = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const eosApi = this.getEosApi();
    const eosTxBuilder = new EosTxBuilder(eosApi);
    this.actions.forEach((action) => {
      this.actionData(eosTxBuilder.with(action.account).as(action.authorization), action.data);
    });
    await this._transaction.build(eosTxBuilder);
    return this._transaction;
  }

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress({ address }: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address)) {
      throw new AddressValidationError(address);
    }
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!utils.isValidPrivateKey(key) && !utils.isValidPublicKey(key)) {
      throw new BuildTransactionError(`Invalid key`);
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateBaseFields();
  }

  private validateBaseFields(): void {
    if (this.actions.length === 0) {
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
