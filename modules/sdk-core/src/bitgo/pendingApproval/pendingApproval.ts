/**
 * @prettier
 */
import * as _ from 'lodash';
import * as utxolib from '@bitgo/utxo-lib';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import {
  ApproveOptions,
  IPendingApproval,
  OwnerType,
  PendingApprovalData,
  PendingApprovalInfo,
  State,
  Type,
} from '../pendingApproval';
import { RequestTracer } from '../utils';
import { IWallet } from '../wallet';
import { BuildParams } from '../wallet/BuildParams';
import { IRequestTracer } from '../../api';
import BaseTssUtils from '../utils/tss/baseTSSUtils';
import EddsaUtils from '../utils/tss/eddsa';
import { EcdsaMPCv2Utils, EcdsaUtils } from '../utils/tss/ecdsa';
import { KeyShare as EcdsaKeyShare } from '../utils/tss/ecdsa/types';
import { KeyShare as EddsaKeyShare } from '../utils/tss/eddsa/types';

type PreApproveResult = {
  txHex: string;
  halfSigned?: string;
};

type ApprovePendingApprovalRequestBody = {
  state: 'approved';
  otp: string | undefined;
  halfSigned?: string | Omit<PreApproveResult, 'halfSigned'>;
};

export class PendingApproval implements IPendingApproval {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;
  private tssUtils?: BaseTssUtils<EcdsaKeyShare | EddsaKeyShare>;
  private wallet?: IWallet;
  private _pendingApproval: PendingApprovalData;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, pendingApprovalData: PendingApprovalData, wallet?: IWallet) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    this.wallet = wallet;

    if (this.baseCoin.supportsTss()) {
      if (this.baseCoin.getMPCAlgorithm() === 'ecdsa') {
        if (this.wallet?.multisigTypeVersion() === 'MPCv2') {
          this.tssUtils = new EcdsaMPCv2Utils(this.bitgo, this.baseCoin, wallet);
        } else {
          this.tssUtils = new EcdsaUtils(this.bitgo, this.baseCoin, wallet);
        }
      } else {
        this.tssUtils = new EddsaUtils(this.bitgo, this.baseCoin, wallet);
      }
    }

    this._pendingApproval = pendingApprovalData;
  }

  /**
   * Get the id for this PendingApproval
   */
  id(): string {
    return this._pendingApproval.id;
  }

  toJSON(): PendingApprovalData {
    return this._pendingApproval;
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
  url(extra = ''): string {
    return this.baseCoin.url('/pendingapprovals/' + this.id() + extra);
  }

  /**
   * Refetches this PendingApproval from the server and returns it.
   *
   * Note that this mutates the PendingApproval object in place.
   * @param params
   */
  async get(params: Record<string, never> = {}): Promise<PendingApproval> {
    this._pendingApproval = await this.bitgo.get(this.url()).result();
    return this;
  }

  /**
   * Sets this PendingApproval to an approved state
   */
  async approve(params: ApproveOptions = {}): Promise<any> {
    params.previewPendingTxs = true;
    params.pendingApprovalId = this.id();
    const canRecreateTransaction = this.canRecreateTransaction(params);
    const reqId = new RequestTracer();
    this.bitgo.setRequestTracer(reqId);
    await this.populateWallet();

    try {
      const transaction = await this.preApprove(params, reqId);

      const approvalParams: ApprovePendingApprovalRequestBody = { state: 'approved', otp: params.otp };
      if (transaction) {
        // if the transaction already has a half signed property, we take that directly
        approvalParams.halfSigned = transaction.halfSigned || transaction;
      }
      const response = await this.bitgo.put(this.url()).send(approvalParams).result();

      // if the response comes with an error, means that the transaction triggered another condition
      if (response.hasOwnProperty('error') && response.hasOwnProperty('pendingApproval')) {
        return response;
      }

      this._pendingApproval = response;
      await this.postApprove(params, reqId);

      return this._pendingApproval;
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
  }

  /**
   * Sets this PendingApproval to a rejected state
   * @param params
   */
  async reject(params: Record<string, never> = {}): Promise<any> {
    return await this.bitgo.put(this.url()).send({ state: 'rejected' }).result();
  }

  /**
   * Alias for PendingApproval.reject()
   *
   * @deprecated
   * @param params
   */
  async cancel(params: Record<string, never> = {}): Promise<any> {
    return await this.reject(params);
  }

  /**
   * Recreate and sign TSS transaction
   * @param {ApproveOptions} params needed to get txs and use the walletPassphrase to tss sign
   * @param {RequestTracer} reqId id tracer.
   */
  async recreateAndSignTSSTransaction(params: ApproveOptions, reqId: IRequestTracer): Promise<{ txHex: string }> {
    const { walletPassphrase } = params;
    const txRequestId = this._pendingApproval.txRequestId;

    if (!this.wallet) {
      throw new Error('Wallet not found');
    }

    if (!walletPassphrase) {
      throw new Error('walletPassphrase not found');
    }

    if (!txRequestId) {
      throw new Error('txRequestId not found');
    }

    const decryptedPrv = await this.wallet.getPrv({ walletPassphrase });
    const txRequest = await this.tssUtils!.recreateTxRequest(txRequestId, decryptedPrv, reqId);
    if (txRequest.apiVersion === 'lite') {
      if (!txRequest.unsignedTxs || txRequest.unsignedTxs.length === 0) {
        throw new Error('Unexpected error, no transactions found in txRequest.');
      }
      return {
        txHex: txRequest.unsignedTxs[0].serializedTxHex,
      };
    } else {
      if (!txRequest.transactions || txRequest.transactions.length === 0) {
        throw new Error('Unexpected error, no transactions found in txRequest.');
      }
      return {
        txHex: txRequest.transactions[0].unsignedTx.serializedTxHex,
      };
    }
  }

  /**
   * Recreate a transaction for a pending approval to respond to updated network conditions
   * @param params
   */
  async recreateAndSignTransaction(params: any = {}): Promise<any> {
    // this method only makes sense with existing transaction requests
    const transactionRequest = this.info().transactionRequest;
    if (_.isUndefined(transactionRequest)) {
      throw new Error('cannot recreate transaction without transaction request');
    }

    if (_.isUndefined(this.wallet)) {
      throw new Error('cannot recreate transaction without wallet');
    }

    const originalPrebuild = transactionRequest.coinSpecific[this.baseCoin.type];

    const recipients = transactionRequest.recipients;
    const prebuildParams = _.extend({}, params, { recipients: recipients }, transactionRequest.buildParams);

    if (!_.isUndefined(originalPrebuild.hopTransaction)) {
      prebuildParams.hop = true;
    }

    if (transactionRequest.buildParams && transactionRequest.buildParams.type === 'consolidate') {
      // consolidate tag is in the build params - this is a consolidation transaction, so
      // it needs to be rebuilt using the special consolidation build route
      prebuildParams.prebuildTx = await this.bitgo
        .post(this.wallet.url(`/consolidateUnspents`))
        .send(BuildParams.encode(prebuildParams))
        .result();
      delete prebuildParams.recipients;
    }

    const signedTransaction = await this.wallet.prebuildAndSignTransaction(prebuildParams);
    // compare PAYGo fees
    const originalParsedTransaction = (await this.baseCoin.parseTransaction({
      txParams: prebuildParams,
      wallet: this.wallet,
      txPrebuild: originalPrebuild,
    })) as any;
    const recreatedParsedTransaction = (await this.baseCoin.parseTransaction({
      txParams: prebuildParams,
      wallet: this.wallet,
      txPrebuild: signedTransaction,
    })) as any;

    if (_.isUndefined(recreatedParsedTransaction.implicitExternalSpendAmount)) {
      return signedTransaction;
    }

    if (
      typeof recreatedParsedTransaction.implicitExternalSpendAmount !== 'bigint' &&
      !_.isFinite(recreatedParsedTransaction.implicitExternalSpendAmount)
    ) {
      throw new Error('implicit external spend amount could not be determined');
    }
    if (
      !_.isUndefined(originalParsedTransaction.implicitExternalSpendAmount) &&
      recreatedParsedTransaction.implicitExternalSpendAmount > originalParsedTransaction.implicitExternalSpendAmount
    ) {
      throw new Error('recreated transaction is using a higher pay-as-you-go-fee');
    }
    return signedTransaction;
  }

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
  private canRecreateTransaction(params: ApproveOptions): boolean {
    const isColdWallet = !!_.get(this.wallet, '_wallet.isCold');
    const isOFCWallet = this.baseCoin.getFamily() === 'ofc'; // Off-chain transactions don't need to be rebuilt
    if (!params.xprv && !(params.walletPassphrase && !isColdWallet && !isOFCWallet)) {
      return false;
    }

    // If there are no recipients, then the transaction cannot be recreated
    const recipients = this.info()?.transactionRequest?.buildParams?.recipients || [];
    const type = this.info()?.transactionRequest?.buildParams?.type;

    // We only want to not recreate transactions with no recipients if it is a UTXO coin.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !(
      utxolib.isValidNetwork((this.baseCoin as any).network) &&
      recipients.length === 0 &&
      type !== 'consolidate'
    );
  }

  /*
   * Internal helper function to get the serialized transaction which is being approved.
   * If this PA is of type 'transactionRequest' this function will try to rebuild and resign the transaction
   * @param {ApproveOptions} params
   * @param {boolean} canRecreateTransaction -
   * @param {RequestTracer} reqId id tracer
   */
  private async preApprove(params: ApproveOptions = {}, reqId: IRequestTracer): Promise<PreApproveResult | undefined> {
    // TransactionRequestLite or Multisig tx's must sign before pending approval is approved
    // Re-signed tx is provided to the pending approval api
    if (this.type() === Type.TRANSACTION_REQUEST) {
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

      // this user may not have spending privileges or a passphrase may not have been passed in
      if (!this.canRecreateTransaction(params)) {
        // If this is a TransactionRequest, then the txRequest already has the unsigned transaction
        if (this._pendingApproval.txRequestId) {
          return undefined;
        }
        // If this is a MultiSig, then we need to fetch the half signed tx to propagate to the approval API
        const transaction = _.get(
          this.info(),
          `transactionRequest.coinSpecific.${this.baseCoin.type}`
        ) as PreApproveResult;
        if (!_.isObject(transaction)) {
          throw new Error('there is neither an original transaction object nor can a new one be recreated');
        }
        return transaction;
      }

      if (this._pendingApproval.txRequestId) {
        return await this.recreateAndSignTSSTransaction(params, reqId);
      }
      return await this.recreateAndSignTransaction(params);
    }
  }

  /**
   * Internal helper function to perform any post-approval actions.
   * If type is 'transactionRequestFull', this will sign the txRequestFull if possible
   * @param params
   * @param reqId
   * @private
   */
  private async postApprove(params: ApproveOptions = {}, reqId: IRequestTracer): Promise<void> {
    switch (this.type()) {
      case Type.TRANSACTION_REQUEST_FULL:
        // TransactionRequestFull for SMH or SMC wallets can only be signed after pending approval is approved
        if (
          this._pendingApproval.state === State.APPROVED &&
          this.canRecreateTransaction(params) &&
          this.baseCoin.supportsTss()
        ) {
          await this.recreateAndSignTSSTransaction(params, reqId);
        }
    }
  }

  /**
   * Helper function to ensure that self.wallet is set
   */
  private async populateWallet(): Promise<undefined> {
    if (this.wallet) {
      return;
    }
    // TODO(WP-1341): consolidate/simplify this logic
    switch (this.type()) {
      case Type.TRANSACTION_REQUEST:
        const transactionRequest = this.info().transactionRequest;
        if (_.isUndefined(transactionRequest)) {
          throw new Error('missing required object property transactionRequest');
        }

        const updatedWallet: IWallet = await this.baseCoin.wallets().get({ id: transactionRequest.sourceWallet });

        if (_.isUndefined(updatedWallet)) {
          throw new Error('unexpected - unable to get wallet using sourcewallet');
        }

        this.wallet = updatedWallet;

        if (this.wallet.id() !== transactionRequest.sourceWallet) {
          throw new Error('unexpected source wallet for pending approval');
        }
        break;
      case Type.TRANSACTION_REQUEST_FULL:
        const walletId = this.walletId();
        if (!walletId) {
          throw new Error('Unexpected error, pendingApproval.wallet is expected to be defined!');
        }
        this.wallet = await this.baseCoin.wallets().get({ id: this.walletId() });
        if (!this.wallet) {
          throw new Error('unexpected - unable to get wallet using pendingApproval.wallet');
        }
        break;
    }
    return;
  }
}
