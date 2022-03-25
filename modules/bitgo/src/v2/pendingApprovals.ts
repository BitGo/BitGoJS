/**
 * @prettier
 */
import * as _ from 'lodash';
import * as debugLib from 'debug';
import { BitGo } from '../bitgo';

import { common } from '@bitgo/sdk-core';
import { PendingApproval } from './pendingApproval';
import { BaseCoin } from './baseCoin';

const { validateParams } = common;
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
  private readonly bitgo: BitGo;
  private readonly baseCoin: BaseCoin;

  constructor(bitgo: BitGo, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * List the pending approvals available to the user
   * @param params
   */
  async list(params: ListPendingApprovalsOptions = {}): Promise<ListPendingApprovalsResult> {
    validateParams(params, [], ['walletId', 'enterpriseId']);
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

    const body = (await this.bitgo.get(this.baseCoin.url('/pendingapprovals')).query(queryParams).result()) as any;
    body.pendingApprovals = body.pendingApprovals.map(
      (currentApproval) => new PendingApproval(this.bitgo, this.baseCoin, currentApproval)
    );
    return body;
  }

  /**
   * Fetch an existing pending approval
   * @param params
   */
  async get(params: GetPendingApprovalOptions = {}): Promise<PendingApproval> {
    validateParams(params, ['id'], []);

    const approvalData = (await this.bitgo.get(this.baseCoin.url('/pendingapprovals/' + params.id)).result()) as any;
    let approvalWallet;
    if (approvalData.wallet) {
      try {
        approvalWallet = await this.baseCoin.wallets().get({ id: approvalData.wallet });
      } catch (e) {
        // nothing to be done here, although it's probably noteworthy that a non-existent wallet is referenced
        debug('failed to get wallet %s, referenced by pending approval %s', approvalData.wallet, params.id);
      }
    }
    return new PendingApproval(this.bitgo, this.baseCoin, approvalData, approvalWallet);
  }
}
