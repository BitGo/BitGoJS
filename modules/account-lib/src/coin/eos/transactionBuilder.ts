/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { BaseTransactionBuilder } from '../baseCoin';
import { BuildTransactionError, ParseTransactionError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { AddressValidationError } from './errors';
import utils from './utils';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { Action } from './ifaces';
import { Utils } from '.';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;

  private _keypair: KeyPair[];
  private _chainId: string;
  private actions: Action[];
  private _expiration: string;
  private _ref_block_num: number;
  private _ref_block_prefix: number;
  private _account: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._keypair = [];
    this.actions = [];
    this.testnet();
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  protected abstract actionName(): string;

  protected abstract createAction(builder: EosTxBuilder, action: Action): EosJs.Serialize.Action;

  action(account: string, actors: string[]): Action {
    this._account = account;
    const auth = actors.map((actor) => {
      return {
        actor: actor,
        permission: 'active',
      };
    });
    const action: Action = {
      account: account,
      authorization: auth,
      data: {},
      name: this.actionName(),
    };
    this.actions.push(action);
    return action;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    const keypair = new KeyPair({ prv: key });
    this._keypair.push(keypair);
    return this._transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    utils.deserializeTransaction(rawTransaction, this._chainId).then((tx) => {
      this.actions = tx.actions;
    });
    return this._transaction;
  }

  testnet(): this {
    this._chainId = '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840';
    return this;
  }

  mainnet(): this {
    this._chainId = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
    return this;
  }

  expiration(expiration: string): this {
    this._expiration = expiration;
    return this;
  }

  refBlockNum(ref_block_num: number): this {
    this.validateValue(new BigNumber(ref_block_num));
    this._ref_block_num = ref_block_num;
    return this;
  }

  refBlockPrefix(ref_block_prefix: number): this {
    this.validateValue(new BigNumber(ref_block_prefix));
    this._ref_block_prefix = ref_block_prefix;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    try {
      const eosApi = Utils.initApi(this._chainId);
      await eosApi.getAbi(this._account);
      const eosTxBuilder = new EosTxBuilder(eosApi);
      const result = await eosApi.transact(
        {
          expiration: this._expiration,
          ref_block_num: this._ref_block_num,
          ref_block_prefix: this._ref_block_prefix,
          actions: this.actions.map((action) => this.createAction(eosTxBuilder, action)),
        },
        {
          broadcast: false,
          sign: false,
        },
      );
      this._transaction.setEosTransaction(result as EosJs.RpcInterfaces.PushTransactionArgs);
      this._transaction.setChainId(this._chainId);
      this._transaction.sign(this._keypair);
    } catch (e) {
      throw new BuildTransactionError(`Could not build tx`);
    }

    return this._transaction;
  }

  // region Getters and Setters

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
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
    try {
      utils.deserializeTransaction(rawTransaction, this._chainId);
    } catch (e) {
      throw new ParseTransactionError('Invalid transaction');
    }
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
