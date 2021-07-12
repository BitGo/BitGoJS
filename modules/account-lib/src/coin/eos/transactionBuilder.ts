import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { BaseTransactionBuilder } from '../baseCoin';
import { BuildTransactionError, InvalidTransactionError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { AddressValidationError } from './errors';
import utils from './utils';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { Action } from './ifaces';
import { EosActionBuilder } from './eosActionBuilder';
import { BaseTransactionSchema } from './txnSchema';
import { Utils } from '.';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;

  private _keypair: KeyPair[];
  private _chainId: string;
  private actions: EosJs.Serialize.Action[];
  protected actionBuilders: EosActionBuilder[];
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

  protected action(account: string, actors: string[]): Action {
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
      name: '',
    };
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
    const tx = utils.deserializeTransaction(rawTransaction, this._chainId);
    if (!tx) {
      throw new InvalidTransactionError('Invalid tx ');
    }
    this.expiration(tx.expiration || '');
    this.refBlockNum(tx.ref_block_num || 0);
    this.refBlockPrefix(tx.ref_block_prefix || 0);
    this.actions.push(...tx.actions);
    this._account = tx.actions[0].account;
    this._transaction.setEosTransaction({
      signatures: [],
      serializedTransaction: rawTransaction,
    });
    return this._transaction;
  }

  /**
   * set chainId of testnet
   *
   * @returns {TransactionBuilder} transaction builder
   */
  testnet(): this {
    this._chainId = '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840';
    return this;
  }

  /**
   * Set chainId of mainnet
   *
   * @returns {TransactionBuilder} transaction builder
   */
  mainnet(): this {
    this._chainId = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
    return this;
  }

  expiration(expiration: string): this {
    this._expiration = expiration;
    return this;
  }

  refBlockNum(ref_block_num: number): this {
    if (ref_block_num) {
      this.validateValue(new BigNumber(ref_block_num));
      this._ref_block_num = ref_block_num;
    }
    return this;
  }

  refBlockPrefix(ref_block_prefix: number): this {
    if (ref_block_prefix) {
      this.validateValue(new BigNumber(ref_block_prefix));
      this._ref_block_prefix = ref_block_prefix;
    }
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    try {
      const eosApi = Utils.initApi(this._chainId);
      await eosApi.getAbi(this._account);
      const eosTxBuilder = new EosTxBuilder(eosApi);
      this.actions.push(...this.actionBuilders.map((b) => b.build(eosTxBuilder)));
      const result = await eosApi.transact(
        {
          expiration: this._expiration,
          ref_block_num: this._ref_block_num,
          ref_block_prefix: this._ref_block_prefix,
          actions: this.actions,
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
    await this._transaction.loadInputsAndOutputs();
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
    const decodedTx = utils.deserializeTransaction(rawTransaction, this._chainId);
    const validationResult = BaseTransactionSchema.validate({
      expiration: decodedTx.expiration,
      refBlockNum: decodedTx.ref_block_num,
      refBlockPrefix: decodedTx.ref_block_prefix,
      actions: decodedTx.actions,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateBaseFields(this._expiration, this._ref_block_num, this._ref_block_prefix, this.actions);
  }

  private validateBaseFields(expiration: string, refBlockNum: number, refBlockPrefix: number, actions: Action[]): void {
    const validationResult = BaseTransactionSchema.validate({
      expiration,
      refBlockNum,
      refBlockPrefix,
      actions,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
}
