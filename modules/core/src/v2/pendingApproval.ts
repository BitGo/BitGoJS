/**
 * @prettier
 */
import { BitGo } from '../bitgo';
import { validateParams } from '../common';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';

import { NodeCallback } from './types';
import { Wallet } from './wallet';
import { BaseCoin } from './baseCoin';

const co = Bluebird.coroutine;

export interface PendingApprovalInfo {
  type: Type;
  transactionRequest?: {
    coinSpecific: any;
    recipients: any;
    buildParams: any;
    sourceWallet?: string;
  };
}

export interface PendingApprovalData {
  id: string;
  wallet?: string;
  enterprise?: string;
  state: State;
  creator: string;
  info: PendingApprovalInfo;
  approvalsRequired?: number;
}

export const enum OwnerType {
  WALLET = 'wallet',
  ENTERPRISE = 'enterprise',
}

export const enum State {
  PENDING = 'pending',
  AWAITING_SIGNATURE = 'awaitingSignature',
  PENDING_BITGO_ADMIN_APPROVAL = 'pendingBitGoAdminApproval',
  PENDING_ID_VERIFICATION = 'pendingIdVerification',
  PENDING_CUSTODIAN_APPROVAL = 'pendingCustodianApproval',
  PENDING_FINAL_APPROVAL = 'pendingFinalApproval',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  REJECTED = 'rejected',
}

export const enum Type {
  USER_CHANGE_REQUEST = 'userChangeRequest',
  TRANSACTION_REQUEST = 'transactionRequest',
  POLICY_RULE_REQUEST = 'policyRuleRequest',
  UPDATE_APPROVALS_REQUIRED_REQUEST = 'updateApprovalsRequiredRequest',
}

export interface ApproveOptions {
  walletPassphrase?: string;
  otp?: string;
  tx?: string;
  xprv?: string;
}

export class PendingApproval {
  private readonly bitgo: BitGo;
  private readonly baseCoin: BaseCoin;
  private wallet?: Wallet;
  private _pendingApproval: PendingApprovalData;

  constructor(bitgo: BitGo, baseCoin: BaseCoin, pendingApprovalData: PendingApprovalData, wallet?: Wallet) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    this.wallet = wallet;
    this._pendingApproval = pendingApprovalData;
  }

  /**
   * Get the id for this PendingApproval
   */
  id(): string {
    return this._pendingApproval.id;
  }

  /**
   * Get the owner type (wallet or enterprise)
   * Pending approvals can be approved or modified by different scopes (depending on how they were created)
   * If a pending approval is owned by a wallet, then it can be approved by administrators of the wallet
   * If a pending approval is owned by an enterprise, then it can be approved by administrators of the enterprise
   */
  ownerType(): OwnerType {
    if (this._pendingApproval.wallet) {
      return OwnerType.WALLET;
    } else if (this._pendingApproval.enterprise) {
      return OwnerType.ENTERPRISE;
    } else {
      throw new Error('unexpected pending approval owner: neither wallet nor enterprise was present');
    }
  }

  /**
   * Get the id of the wallet which is associated with this PendingApproval
   */
  walletId(): string | undefined {
    return this._pendingApproval.wallet;
  }

  /**
   * Get the enterprise ID that is associated with this PendingApproval
   */
  enterpriseId(): string | undefined {
    return this._pendingApproval.enterprise;
  }

  /**
   * Get the state of this PendingApproval
   */
  state(): State {
    return this._pendingApproval.state;
  }

  /**
   * Get the id of the user that performed the action resulting in this PendingApproval
   */
  creator(): string {
    return this._pendingApproval.creator;
  }

  /**
   * Get the type of the pending approval (what it approves)
   */
  type(): Type {
    if (!this._pendingApproval.info) {
      throw new Error('pending approval info is not available');
    }

    return this._pendingApproval.info.type;
  }

  /**
   * Get information about this PendingApproval
   */
  info(): PendingApprovalInfo {
    return this._pendingApproval.info;
  }

  /**
   * Get the number of approvals that are required for this PendingApproval to be approved.
   * Defaults to 1 if approvalsRequired doesn't exist on the object
   */
  approvalsRequired(): number {
    return this._pendingApproval.approvalsRequired || 1;
  }

  /**
   * Generate a url for this PendingApproval for making requests to the server.
   * @param extra
   */
  url(extra: string = ''): string {
    return this.baseCoin.url('/pendingapprovals/' + this.id() + extra);
  }

  /**
   * Refetches this PendingApproval from the server and returns it.
   *
   * Note that this mutates the PendingApproval object in place.
   * @param params
   * @param callback
   */
  get(params: {} = {}, callback?: NodeCallback<PendingApproval>): Bluebird<PendingApproval> {
    const self = this;
    return co<PendingApproval>(function*() {
      self._pendingApproval = yield self.bitgo.get(self.url()).result();
      return self;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Helper function to ensure that self.wallet is set
   */
  private populateWallet(): Bluebird<undefined> {
    const self = this;
    return co<undefined>(function*() {
      const transactionRequest = self.info().transactionRequest;
      if (_.isUndefined(transactionRequest)) {
        throw new Error('missing required object property transactionRequest');
      }

      if (_.isUndefined(self.wallet)) {
        const updatedWallet: Wallet = yield self.baseCoin.wallets().get({ id: transactionRequest.sourceWallet });

        if (_.isUndefined(updatedWallet)) {
          throw new Error('unexpected - unable to get wallet using sourcewallet');
        }

        self.wallet = updatedWallet;
      }

      if (self.wallet.id() !== transactionRequest.sourceWallet) {
        throw new Error('unexpected source wallet for pending approval');
      }

      // otherwise returns undefined
    }).call(this);
  }

  /**
   * Sets this PendingApproval to an approved state
   */
  approve(params: ApproveOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function*() {
      validateParams(params, [], ['walletPassphrase', 'otp'], callback);

      let canRecreateTransaction = true;
      /*
       * Cold wallets cannot recreate transactions if the only thing provided is the wallet passphrase
       *
       * The transaction can be recreated if either
       * – there is an xprv
       * – there is a walletPassphrase and the wallet is not cold (because if it's cold, the passphrase is of little use)
       *
       * Therefore, if neither of these is true, the transaction cannot be recreated, which is reflected in the if
       * statement below.
       */
      const isColdWallet = !!_.get(self.wallet, '_wallet.isCold');
      const isOFCWallet = self.baseCoin.getFamily() === 'ofc'; // Off-chain transactions don't need to be rebuilt
      if (!params.xprv && !(params.walletPassphrase && !isColdWallet && !isOFCWallet)) {
        canRecreateTransaction = false;
      }

      /*
       * Internal helper function to get the serialized transaction which is being approved
       */
      function getApprovalTransaction(): Bluebird<{ txHex: string }> {
        return co<{ txHex: string }>(function*() {
          if (self.type() === 'transactionRequest') {
            /*
             * If this is a request for approving a transaction, depending on whether this user has a private key to the wallet
             * (some admins may not have the spend permission), the transaction could either be rebroadcast as is, or it could
             * be reconstructed. It is preferable to reconstruct a tx in order to adhere to the latest network conditions
             * such as newer unspents, different fees, or a higher sequence id
             */
            if (params.tx) {
              // the approval tx was reconstructed and explicitly specified - pass it through
              return {
                txHex: params.tx,
              };
            }

            const transaction = _.get(self.info(), `transactionRequest.coinSpecific.${self.baseCoin.type}`);

            // this user may not have spending privileges or a passphrase may not have been passed in
            if (!canRecreateTransaction) {
              if (!_.isObject(transaction)) {
                throw new Error('there is neither an original transaction object nor can a new one be recreated');
              }
              return transaction;
            }

            yield self.populateWallet();
            return yield self.recreateAndSignTransaction(params);
          }
        }).call(this);
      }

      /*
       * Internal helper function to prepare the approval payload and send it to bitgo
       */
      function sendApproval(transaction: { txHex: string; halfSigned?: string }): Bluebird<any> {
        return co(function*() {
          const approvalParams: any = { state: 'approved', otp: params.otp };
          if (transaction) {
            // if the transaction already has a half signed property, we take that directly
            approvalParams.halfSigned = transaction.halfSigned || transaction;
          }
          return self.bitgo
            .put(self.url())
            .send(approvalParams)
            .result()
            .nodeify(callback);
        }).call(this);
      }

      try {
        const approvalTransaction = yield getApprovalTransaction();
        return yield sendApproval(approvalTransaction);
      } catch (e) {
        if (
          !canRecreateTransaction &&
          (e.message.indexOf('could not find unspent output for input') !== -1 ||
            e.message.indexOf('transaction conflicts with an existing transaction in the send queue') !== -1)
        ) {
          throw new Error('unspents expired, wallet passphrase or xprv required to recreate transaction');
        }
        throw e;
      }
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Sets this PendingApproval to a rejected state
   * @param params
   * @param callback
   */
  reject(params: {} = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .put(this.url())
      .send({ state: 'rejected' })
      .result()
      .nodeify(callback);
  }

  /**
   * Alias for PendingApproval.reject()
   *
   * @deprecated
   * @param params
   * @param callback
   */
  cancel(params: {} = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.reject(params, callback);
  }

  /**
   * Recreate a transaction for a pending approval to respond to updated network conditions
   * @param params
   * @param callback
   */
  recreateAndSignTransaction(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function*() {
      // this method only makes sense with existing transaction requests
      const transactionRequest = self.info().transactionRequest;
      if (_.isUndefined(transactionRequest)) {
        throw new Error('cannot recreate transaction without transaction request');
      }

      if (_.isUndefined(self.wallet)) {
        throw new Error('cannot recreate transaction without wallet');
      }

      const originalPrebuild = transactionRequest.coinSpecific[self.baseCoin.type];

      const recipients = transactionRequest.recipients;
      const prebuildParams = _.extend({}, params, { recipients: recipients }, transactionRequest.buildParams);

      if (!_.isUndefined(originalPrebuild.hopTransaction)) {
        prebuildParams.hop = true;
      }

      const signedTransaction = yield self.wallet.prebuildAndSignTransaction(prebuildParams);
      // compare PAYGo fees
      const originalParsedTransaction = yield self.baseCoin.parseTransaction({
        txParams: prebuildParams,
        wallet: self.wallet,
        txPrebuild: originalPrebuild,
      });
      const recreatedParsedTransaction = yield self.baseCoin.parseTransaction({
        txParams: prebuildParams,
        wallet: self.wallet,
        txPrebuild: signedTransaction,
      });

      if (_.isUndefined(recreatedParsedTransaction.implicitExternalSpendAmount)) {
        return signedTransaction;
      }

      if (!_.isFinite(recreatedParsedTransaction.implicitExternalSpendAmount)) {
        throw new Error('implicit external spend amount could not be determined');
      }
      if (
        !_.isUndefined(originalParsedTransaction.implicitExternalSpendAmount) &&
        recreatedParsedTransaction.implicitExternalSpendAmount > originalParsedTransaction.implicitExternalSpendAmount
      ) {
        throw new Error('recreated transaction is using a higher pay-as-you-go-fee');
      }
      return signedTransaction;
    })
      .call(this)
      .asCallback(callback);
  }
}
