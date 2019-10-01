/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { BitGo } from '../bitgo';
import { BaseCoin } from './baseCoin';
import { NodeCallback } from './types';
import { Wallet } from './wallet';
import { getFirstPendingTransaction } from './internal/internal';

import { Settlements } from './trading/settlements';
import { Affirmations } from './trading/affirmations';

const co = Bluebird.coroutine;

export class Enterprise {
  private readonly bitgo: BitGo;
  private readonly baseCoin: BaseCoin;
  readonly id: string;
  readonly name: string;

  constructor(bitgo: BitGo, baseCoin: BaseCoin, enterpriseData: { id: string; name: string }) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    if (!_.isObject(enterpriseData)) {
      throw new Error('enterpriseData has to be an object');
    }
    if (!_.isString(enterpriseData.id)) {
      throw new Error('enterprise id has to be a string');
    }
    if (!_.isString(enterpriseData.name)) {
      throw new Error('enterprise name has to be a string');
    }
    this.id = enterpriseData.id;
    this.name = enterpriseData.name;
  }

  /**
   * Enterprise URL for v1 methods, such as getting users
   * @param query
   */
  url(query: string = ''): string {
    return this.bitgo.url(`/enterprise/${this.id}${query}`);
  }

  /**
   * Enterprise URL for v2 methods, such as getting fee address balances
   * @param query
   */
  coinUrl(query: string = ''): string {
    return this.baseCoin.url(`/enterprise/${this.id}${query}`);
  }

  /**
   * Get the wallets associated with this Enterprise
   * @param params
   * @param callback
   */
  coinWallets(params: {} = {}, callback?: NodeCallback<Wallet[]>): Bluebird<Wallet[]> {
    return co<Wallet[]>(function* coCoinWallets() {
      const walletData = yield this.bitgo.get(this.baseCoin.url('/wallet/enterprise/' + this.id)).result();
      walletData.wallets = walletData.wallets.map(w => {
        return new Wallet(this.bitgo, this.baseCoin, w);
      });
      return walletData;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Get the users associated with this Enterprise
   * @param params
   * @param callback
   */
  users(params: {} = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .get(this.url('/user'))
      .result()
      .asCallback(callback);
  }

  /**
   * Get the fee address balance for this Enterprise
   * @param params
   * @param callback
   */
  getFeeAddressBalance(params: {} = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .get(this.coinUrl('/feeAddressBalance'))
      .result()
      .asCallback(callback);
  }

  /**
   * Add a user to this Enterprise
   * @param params
   * @param callback
   */
  addUser(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .post(this.url('/user'))
      .send(params)
      .result()
      .asCallback(callback);
  }

  /**
   * Remove a user from this Enterprise
   * @param params
   * @param callback
   */
  removeUser(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .del(this.url('/user'))
      .send(params)
      .result()
      .asCallback(callback);
  }

  /**
   * Get the first pending transaction for this Enterprise
   * @param params
   * @param callback
   */
  getFirstPendingTransaction(params: {} = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return getFirstPendingTransaction({ enterpriseId: this.id }, this.baseCoin, this.bitgo).asCallback(callback);
  }

  /**
   * Manage settlements for an enterprise
   */
  settlements(): Settlements {
    return new Settlements(this.bitgo, this.id);
  }

  /**
   * Manage affirmations for an enterprise
   */
  affirmations(): Affirmations {
    return new Affirmations(this.bitgo, this.id);
  }
}
