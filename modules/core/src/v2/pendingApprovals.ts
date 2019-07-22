/**
 * @prettier
 */
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as debugLib from 'debug';

import { validateParams } from '../common';
import { PendingApproval } from './pendingApproval';
import { BaseCoin } from './baseCoin';
import { NodeCallback } from './types';

const co = Bluebird.coroutine;
const debug = debugLib('bitgo:v2:pendingApprovals');

export interface ListPendingApprovalsOptions {
  walletId?: string;
  enterpriseId?: string;
}

export interface GetPendingApprovalOptions {
  id?: string;
}

export interface ListPendingApprovalsResult {
  pendingApprovals: PendingApproval[];
}

export class PendingApprovals {
  private readonly bitgo: any;
  private readonly baseCoin: BaseCoin;

  constructor(bitgo: any, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * List the pending approvals available to the user
   * @param params
   * @param callback
   */
  list(
    params: ListPendingApprovalsOptions = {},
    callback?: NodeCallback<ListPendingApprovalsResult>
  ): Bluebird<ListPendingApprovalsResult> {
    const self = this;
    return co(function*() {
      validateParams(params, [], ['walletId', 'enterpriseId'], callback);

      const queryParams: any = {};
      if (_.isString(params.walletId)) {
        queryParams.walletId = params.walletId;
      }
      if (_.isString(params.enterpriseId)) {
        queryParams.enterprise = params.enterpriseId;
      }

      if (Object.keys(queryParams).length !== 1) {
        throw new Error('must provide exactly 1 of walletId or enterpriseId to get pending approvals on');
      }

      const body = self.bitgo
        .get(self.baseCoin.url('/pendingapprovals'))
        .query(queryParams)
        .result();
      body.pendingApprovals = body.pendingApprovals.map(
        currentApproval => new PendingApproval(self.bitgo, self.baseCoin, currentApproval)
      );
      return body;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Fetch an existing pending approval
   * @param params
   * @param callback
   */
  get(params: GetPendingApprovalOptions = {}, callback?: NodeCallback<PendingApproval>): Bluebird<PendingApproval> {
    const self = this;
    return co(function*() {
      validateParams(params, ['id'], [], callback);

      const approvalData = yield self.bitgo.get(self.baseCoin.url('/pendingapprovals/' + params.id)).result();
      let approvalWallet;
      if (approvalData.wallet) {
        try {
          approvalWallet = yield self.baseCoin.wallets().get({ id: approvalData.wallet });
        } catch (e) {
          // nothing to be done here, although it's probably noteworthy that a non-existent wallet is referenced
          debug('failed to get wallet %s, referenced by pending approval %s', approvalData.wallet, params.id);
        }
      }
      return new PendingApproval(self.bitgo, self.baseCoin, approvalData, approvalWallet);
    })
      .call(this)
      .asCallback(callback);
  }
}
