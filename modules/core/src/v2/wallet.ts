import { BigNumber } from 'bignumber.js';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as debugLib from 'debug';

import { makeRandomKey } from '../bitcoin';
import { BitGo } from '../bitgo';
import * as common from '../common';
import { AddressGenerationError } from '../errors';
import {
  BaseCoin,
  SignedTransaction, TransactionPrebuild,
  VerificationOptions, VerifyAddressOptions,
} from './baseCoin';
import { AbstractUtxoCoin } from './coins/abstractUtxoCoin';
import { Eth } from './coins';
import * as internal from './internal/internal';
import { drawKeycard } from './internal/keycard';
import { Keychain } from './keychains';
import { TradingAccount } from './trading/tradingAccount';
import { NodeCallback } from './types';
import { PendingApproval, PendingApprovalData } from './pendingApproval';
import { RequestTracer } from './internal/util';

const debug = debugLib('bitgo:v2:wallet');
const co = Bluebird.coroutine;

type ManageUnspents = 'consolidate' | 'fanout';

export interface MaximumSpendableOptions {
    minValue?: number;
    maxValue?: number;
    minHeight?: number;
    minConfirms?: number;
    enforceMinConfirmsForChange?: boolean;
    feeRate?: number;
    maxFeeRate?: number;
    recipientAddress?: string;
    limit?: number;
    target?: number;
    plainTarget?: number;
}

export interface MaximumSpendable {
    maximumSpendable: number;
    coin: string;
}

export interface Memo {
    value: string;
    type: string;
}

/**
 * A small set of parameters should be used for building a consolidation transaction:
 * - walletPassphrase - necessary for signing
 * - feeRate
 * - maxFeeRate
 * - validFromBlock
 * - validToBlock
 *
 * What shouldn't be passed (these will be ignored):
 * - recipients
 */
export interface BuildConsolidationTransactionOptions extends PrebuildTransactionOptions {
  consolidateAddresses?: string[];
}

export interface PrebuildTransactionOptions {
    reqId?: RequestTracer;
    recipients?: {
        address: string;
        amount: string | number;
    }[];
    numBlocks?: number;
    feeRate?: number;
    maxFeeRate?: number;
    minConfirms?: number;
    enforceMinConfirmsForChange?: boolean;
    targetWalletUnspents?: number;
    minValue?: number;
    maxValue?: number;
    sequenceId?: number;
    lastLedgerSequence?: number;
    ledgerSequenceDelta?: string;
    gasPrice?: number;
    noSplitChange?: boolean;
    unspents?: any[];
    changeAddress?: string;
    type?: string;
    nonParticipation?: boolean;
    validFromBlock?: number;
    validToBlock?: number;
    instant?: boolean;
    memo?: Memo;
    addressType?: string;
    hop?: boolean;
    walletPassphrase?: string;
    reservation?: {
      expireTime?: string;
      pendingApprovalId?: string;
    };
    offlineVerification?: boolean;
    walletContractAddress?: string;
    [index: string]: unknown;
}

export interface PrebuildAndSignTransactionOptions extends PrebuildTransactionOptions {
    prebuildTx?: string | PrebuildTransactionResult;
    verification?: VerificationOptions;
}

export interface PrebuildTransactionResult extends TransactionPrebuild {
    walletId: string;
    // Consolidate ID is used for consolidate account transactions and indicates if this is
    // a consolidation and what consolidate group it should be referenced by.
    consolidateId?: string;
}

export interface WalletSignTransactionOptions {
    txPrebuild?: TransactionPrebuild;
    prv?: string;
    isLastSignature?: boolean;
    [index: string]: unknown;
}

export interface GetUserPrvOptions {
    keychain?: Keychain;
    key?: Keychain;
    prv?: string;
    coldDerivationSeed?: string;
    walletPassphrase?: string;
}

export interface WalletCoinSpecific {
  tokenFlushThresholds?: any;
  addressVersion?: number;
  baseAddress?: string;
  rootAddress?: string;
  customChangeWalletId: string;
}

export interface PaginationOptions {
  prevId?: string;
  limit?: number;
}

export interface GetTransactionOptions extends PaginationOptions {
  txHash?: string;
}

export interface TransfersOptions extends PaginationOptions {
  txHash?: string;
  allTokens?: string;
  searchLabel?: string;
  address?: string[] | string;
  dateGte?: string;
  dateLt?: string;
  valueGte?: string;
  valueLt?: string;
  includeHex?: boolean;
  state?: string[] | string;
  type?: string;
}

export interface GetTransferOptions {
  id?: string;
}

export interface TransferBySequenceIdOptions {
  sequenceId?: string;
}

export interface UnspentsOptions extends PaginationOptions {
  minValue?: number;
  maxValue?: number;
  minHeight?: number;
  minConfirms?: number;
  target?: number;
  segwit?: boolean;
  chains?: number[];
}

export interface ConsolidateUnspentsOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number;
  maxValue?: number;
  minHeight?: number
  numUnspentsToMake?: number;
  feeTxConfirmTarget?: number;
  limit?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  feeRate?: number;
  maxFeeRate?: number;
  maxFeePercentage?: number;
  comment?: string;
  otp?: string;
  targetAddress?: string;
  [index: string]: unknown;
}

export interface FanoutUnspentsOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number;
  maxValue?: number;
  minHeight?: number
  maxNumInputsToUse?: number;
  numUnspentsToMake?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  feeRate?: number;
  maxFeeRate?: number;
  maxFeePercentage?: number;
  feeTxConfirmTarget?: number;
  comment?: string;
  otp?: string;
  targetAddress?: string;
  [index: string]: unknown;
}

export interface SweepOptions {
  address?: string;
  walletPassphrase?: string;
  xprv?: string;
  otp?: string;
  feeRate?: number;
  maxFeeRate?: number;
  feeTxConfirmTarget?: number;
  allowPartialSweep?: boolean;
  [index: string]: unknown;
}

export interface FreezeOptions {
  duration?: number;
}

export interface TransferCommentOptions {
  id?: string;
  comment?: string;
}

export interface AddressesOptions extends PaginationOptions {
  mine?: boolean;
  sort?: number;
  labelContains?: string;
  segwit?: boolean;
  chains?: number[];
}

export interface GetAddressOptions {
  address?: string;
  id?: string;
  reqId?: RequestTracer;
}

export interface CreateAddressOptions {
  chain?: number;
  gasPrice?: number | string;
  count?: number;
  label?: string;
  lowPriority?: boolean;
  forwarderVersion?: number;
}

export interface UpdateAddressOptions {
  label?: string;
  address?: string;
}

export interface SimulateWebhookOptions {
  webhookId?: string;
  transferId?: string;
  pendingApprovalId?: string;
}

export interface ModifyWebhookOptions {
  url?: string;
  type?: string;
}

export interface GetPrvOptions {
  prv?: string;
  walletPassphrase?: string;
}

export interface CreateShareOptions {
  user?: string;
  permissions?: string;
  keychain?: {
    pub?: string;
    encryptedPrv?: string;
    fromPubKey?: string;
    toPubKey?: string;
    path?: string;
  },
  reshare?: boolean;
  message?: string;
  disableEmail?: boolean;
}

export interface ShareWalletOptions {
  email?: string;
  permissions?: string;
  walletPassphrase?: string;
  message?: string;
  reshare?: boolean;
  skipKeychain?: boolean;
  disableEmail?: boolean;
}

export interface RemoveUserOptions {
  userId?: string;
}

export interface AccelerateTransactionOptions {
  cpfpTxIds?: string[];
  cpfpFeeRate?: number;
  noCpfpFeeRate?: boolean;
  maxFee?: number;
  noMaxFee?: boolean;
  recipients?: {
    address: string;
    amount: string;
  }[];
  [index: string]: unknown;
}

export interface SubmitTransactionOptions {
  otp?: string;
  txHex?: string;
  halfSigned?: string;
  comment?: string;
}

export interface SendOptions {
  address?: string;
  amount?: number | string;
  data?: string;
  message?: string;
  walletPassphrase?: string;
  prv?: string;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  [index: string]: unknown;
}

export interface SendManyOptions {
  reqId?: RequestTracer;
  recipients?: {
    address: string;
    amount: string | number;
    data?: string;
  }[];
  numBlocks?: number;
  feeRate?: number;
  maxFeeRate?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  targetWalletUnspents?: number;
  message?: string;
  minValue?: number;
  maxValue?: number;
  sequenceId?: number;
  lastLedgerSequence?: number;
  ledgerSequenceDelta?: string;
  gasPrice?: number;
  noSplitChange?: boolean;
  unspents?: string[];
  comment?: string;
  otp?: string;
  changeAddress?: string;
  instant?: boolean;
  memo?: Memo;
  transferId?: number;
  [index: string]: unknown;
}

export interface WalletData {
  id: string;
  approvalsRequired: number;
  balance: number;
  confirmedBalance: number;
  spendableBalance: number;
  balanceString: string;
  confirmedBalanceString: string;
  spendableBalanceString: string;
  coin: string;
  label: string;
  keys: string[];
  receiveAddress: {
    address: string;
  };
  migratedFrom?: string;
  coinSpecific: WalletCoinSpecific;
  pendingApprovals: PendingApprovalData[];
  enterprise: string;
  customChangeKeySignatures?: {
    user?: string;
    backup?: string;
    bitgo?: string;
  };
}

export interface RecoverTokenOptions {
  tokenContractAddress?: string;
  recipient?: string;
  broadcast?: boolean;
  walletPassphrase?: string;
  prv?: string;
}

export interface ChangeFeeOptions {
  txid?: string;
  fee?: string;
}

export interface CreatePolicyRuleOptions {
  id?: string;
  type?: string;
  message?: string;
  condition?: unknown;
  action?: unknown;
}

export interface SetPolicyRuleOptions {
  id?: string;
  type?: string;
  message?: string;
  condition?: unknown;
  action?: unknown;
}

export interface RemovePolicyRuleOptions {
  id?: string;
  message?: string;
}

export interface DownloadKeycardOptions {
  jsPDF?: any;
  QRCode?: any;
  userKeychain?: Keychain;
  backupKeychain?: Keychain;
  bitgoKeychain?: Keychain;
  passphrase?: string;
  passcodeEncryptionCode?: string;
  activationCode?: string;
  walletKeyID?: string;
  backupKeyID?: string;
}

export class Wallet {
  public readonly bitgo: BitGo;
  public readonly baseCoin: BaseCoin;
  private _wallet: WalletData;
  private readonly _permissions?: string[];

  constructor(bitgo: BitGo, baseCoin: BaseCoin, walletData: any) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    this._wallet = walletData;
    const userId = _.get(bitgo, '_user.id');
    if (_.isString(userId)) {
      const userDetails = _.find(walletData.users, { user: userId });
      this._permissions = _.get(userDetails, 'permissions');
    }
  }

  /**
   * Build a URL using this wallet's id which can be used for BitGo API operations
   * @param extra API specific string to append to the wallet id
   */
  url(extra = ''): string {
    return this.baseCoin.url('/wallet/' + this.id() + extra);
  }

  /**
   * Get this wallet's id
   */
  id(): string {
    return this._wallet.id;
  }

  /**
   * Get the number of approvals required for spending funds from this wallet
   */
  approvalsRequired(): number {
    return this._wallet.approvalsRequired;
  }

  /**
   * Get the current balance of this wallet
   */
  balance(): number {
    return this._wallet.balance;
  }

  prebuildWhitelistedParams(): string[] {
    return [
      'addressType', 'changeAddress', 'consolidateAddresses', 'cpfpFeeRate', 'cpfpTxIds', 'enforceMinConfirmsForChange',
      'feeRate', 'gasLimit', 'gasPrice', 'idfSignedTimestamp', 'idfUserId', 'idfVersion', 'instant',
      'lastLedgerSequence', 'ledgerSequenceDelta', 'maxFee', 'maxFeeRate', 'maxValue', 'memo', 'transferId', 'message', 'minConfirms',
      'minValue', 'noSplitChange', 'numBlocks', 'recipients', 'reservation', 'sequenceId', 'strategy',
      'targetWalletUnspents', 'trustlines', 'type', 'unspents', 'nonParticipation', 'validFromBlock', 'validToBlock', 'messageKey',
      'stakingOptions'
    ];
  }

  /**
   * This is a strict sub-set of prebuildWhitelistedParams
   */
  prebuildConsolidateAccountParams(): string[] {
    return [
      'consolidateAddresses', 'feeRate', 'maxFeeRate', 'memo', 'validFromBlock', 'validToBlock',
    ];
  }

  /**
   * Get the confirmed balance of this wallet
   */
  confirmedBalance(): number {
    return this._wallet.confirmedBalance;
  }

  /**
   * Get the spendable balance of this wallet
   */
  spendableBalance(): number {
    return this._wallet.spendableBalance;
  }

  /**
   * Get a string representation of the balance of this wallet
   *
   * This is useful when balances have the potential to overflow standard javascript numbers
   */
  balanceString(): string {
    return this._wallet.balanceString;
  }

  /**
   * Get a string representation of the confirmed balance of this wallet
   *
   * This is useful when balances have the potential to overflow standard javascript numbers
   */
  confirmedBalanceString(): string {
    return this._wallet.confirmedBalanceString;
  }

  /**
   * Get a string representation of the spendable balance of this wallet
   *
   * This is useful when balances have the potential to overflow standard javascript numbers
   */
  spendableBalanceString(): string {
    return this._wallet.spendableBalanceString;
  }

  /**
   * Get the coin identifier for the type of coin this wallet holds
   */
  coin(): string {
    return this._wallet.coin;
  }

  /**
   * Get the label (name) for this wallet
   */
  public label(): string {
    return this._wallet.label;
  }

  /**
   * Get the public object ids for the keychains on this wallet.
   */
  public keyIds(): string[] {
    return this._wallet.keys;
  }

  /**
   * Get a receive address for this wallet
   */
  public receiveAddress(): string {
    return this._wallet.receiveAddress.address;
  }

  /**
   * Get the wallet id of the wallet that this wallet was migrated from.
   *
   * For example, if this is a BCH wallet that was created from a BTC wallet,
   * the BCH wallet migrated from field would have the BTC wallet id.
   */
  public migratedFrom(): string | undefined {
    return this._wallet.migratedFrom;
  }

  /**
   * Return the token flush thresholds for this wallet
   * @return {*|Object} pairs of { [tokenName]: thresholds } base units
   */
  tokenFlushThresholds(): any {
    if (this.baseCoin.getFamily() !== 'eth') {
      throw new Error('not supported for this wallet');
    }
    return this._wallet.coinSpecific.tokenFlushThresholds;
  }

  /**
   * Get wallet properties which are specific to certain coin implementations
   */
  coinSpecific(): WalletCoinSpecific | undefined {
    return this._wallet.coinSpecific;
  }

  /**
   * Get all pending approvals on this wallet
   */
  pendingApprovals(): PendingApproval[] {
    return this._wallet.pendingApprovals.map((currentApproval) => {
      return new PendingApproval(this.bitgo, this.baseCoin, currentApproval, this);
    });
  }

  /**
   * Refresh the wallet object by syncing with the back-end
   * @param params
   * @param callback
   * @returns {Wallet}
   */
  refresh(params: Record<string, never> = {}, callback?: NodeCallback<Wallet>): Bluebird<Wallet> {
    const self = this;
    return co<Wallet>(function *(): any {
      self._wallet = yield self.bitgo.get(self.url()).result();
      return this;
    }).call(this).asCallback(callback);
  }

  /**
   * List the transactions for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  transactions(params: PaginationOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query: PaginationOptions = {};

    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * List the transactions for a given wallet
   * @param params
   *  - txHash the transaction hash to search for
   * @param callback
   * @returns {*}
   */
  getTransaction(params: GetTransactionOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['txHash'], [], callback);

    const query: PaginationOptions = {};
    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (!_.isUndefined(params.limit)) {
      if (!_.isInteger(params.limit) || params.limit < 1) {
        throw new Error('invalid limit argument, expecting positive integer');
      }
      query.limit = params.limit;
    }

    return this.bitgo.get(this.url('/tx/' + params.txHash))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * List the transfers for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  transfers(params: TransfersOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query: TransfersOptions = {};
    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    if (params.allTokens) {
      if (!_.isBoolean(params.allTokens)) {
        throw new Error('invalid allTokens argument, expecting boolean');
      }
      query.allTokens = params.allTokens;
    }

    if (params.searchLabel) {
      if (!_.isString(params.searchLabel)) {
        throw new Error('invalid searchLabel argument, expecting string');
      }
      query.searchLabel = params.searchLabel;
    }

    if (params.address) {
      if (!_.isArray(params.address) && !_.isString(params.address)) {
        throw new Error('invalid address argument, expecting string or array');
      }
      if (_.isArray(params.address)) {
        params.address.forEach(address => {
          if (!_.isString(address)) {
            throw new Error('invalid address argument, expecting array of address strings');
          }
        });
      }
      query.address = params.address;
    }

    if (params.dateGte) {
      if (!_.isString(params.dateGte)) {
        throw new Error('invalid dateGte argument, expecting string');
      }
      query.dateGte = params.dateGte;
    }

    if (params.dateLt) {
      if (!_.isString(params.dateLt)) {
        throw new Error('invalid dateLt argument, expecting string');
      }
      query.dateLt = params.dateLt;
    }

    if (!_.isNil(params.valueGte)) {
      if (!_.isNumber(params.valueGte)) {
        throw new Error('invalid valueGte argument, expecting number');
      }
      query.valueGte = params.valueGte;
    }

    if (!_.isNil(params.valueLt)) {
      if (!_.isNumber(params.valueLt)) {
        throw new Error('invalid valueLt argument, expecting number');
      }
      query.valueLt = params.valueLt;
    }

    if (!_.isNil(params.includeHex)) {
      if (!_.isBoolean(params.includeHex)) {
        throw new Error('invalid includeHex argument, expecting boolean');
      }
      query.includeHex = params.includeHex;
    }

    if (!_.isNil(params.state)) {
      if (!Array.isArray(params.state) && !_.isString(params.state)) {
        throw new Error('invalid state argument, expecting string or array');
      }

      if (Array.isArray(params.state)) {
        params.state.forEach(state => {
          if (!_.isString(state)) {
            throw new Error('invalid state argument, expecting array of state strings');
          }
        });
      }
      query.state = params.state;
    }

    if (!_.isNil(params.type)) {
      if (!_.isString(params.type)) {
        throw new Error('invalid type argument, expecting string');
      }
      query.type = params.type;
    }

    return this.bitgo.get(this.url('/transfer'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Get transfers on this wallet
   * @param params
   * @param callback
   */
  getTransfer(params: GetTransferOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['id'], [], callback);

    return this.bitgo.get(this.url('/transfer/' + params.id))
      .result()
      .nodeify(callback);
  }

  /**
   * Get a transaction by sequence id for a given wallet
   * @param params
   * @param callback
   */
  transferBySequenceId(params: TransferBySequenceIdOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['sequenceId'], [], callback);

    return this.bitgo.get(this.url('/transfer/sequenceId/' + params.sequenceId))
      .result()
      .nodeify(callback);
  }

  /**
   * Get the maximum amount you can spend in a single transaction
   *
   * @param {Object} params - parameters object
   * @param {Number} params.limit - maximum number of selectable unspents
   * @param {Number} params.minValue - the minimum value of unspents to use in satoshis
   * @param {Number} params.maxValue - the maximum value of unspents to use in satoshis
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - Enforces minConfirms on change inputs
   * @param {Number} params.feeRate - fee rate to use in calculation of maximum spendable in satoshis/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in satoshis/kB
   * @param {String} params.recipientAddress - recipient addresses for a more accurate calculation of the maximum available to send
   * @param callback
   * @returns {{maximumSpendable: Number, coin: String}}
   * NOTE : feeTxConfirmTarget omitted on purpose because gauging the maximum spendable amount with dynamic fees does not make sense
   */
  maximumSpendable(params: MaximumSpendableOptions = {}, callback?: NodeCallback<MaximumSpendable>): Bluebird<MaximumSpendable> {
    const self = this;
    return co<MaximumSpendable>(function *() {
      const filteredParams = _.pick(params, [
        'enforceMinConfirmsForChange', 'feeRate', 'limit', 'maxFeeRate', 'maxValue', 'minConfirms', 'minHeight',
        'minValue', 'plainTarget', 'recipientAddress', 'target',
      ]);

      return self.bitgo.get(self.url('/maximumSpendable'))
        .query(filteredParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * List the unspents for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  unspents(params: UnspentsOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query = _.pick(params, [
      'chains', 'limit', 'maxValue', 'minConfirms', 'minHeight', 'minValue', 'prevId', 'segwit', 'target',
    ]);

    return this.bitgo.get(this.url('/unspents'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Consolidate or fanout unspents on a wallet
   *
   * @param {String} routeName - either `consolidate` or `fanout`
   *
   * @param {Object} params - parameters object
   *
   * Wallet parameters:
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.xprv - the private key in string form if the walletPassphrase is not available
   *
   * Fee parameters:
   * @param {Number} params.feeRate - The fee rate to use for the consolidation in satoshis/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in satoshis/kB
   * @param {Number} params.maxFeePercentage - the maximum relative portion that you're willing to spend towards fees
   * @param {Number} params.feeTxConfirmTarget - estimate the fees to aim for first confirmation with this number of blocks
   *
   * Input parameters:
   * @param {Number} params.minValue - the minimum value of unspents to use in satoshis
   * @param {Number} params.maxValue - the maximum value of unspents to use in satoshis
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - if true, minConfirms also applies to change outputs
   * @param {Number} params.limit                for routeName === 'consolidate'
   *                 params.maxNumInputsToUse    for routeName === 'fanout'
   *                  - maximum number of unspents you want to use in the transaction
   * Output parameters:
   * @param {Number} params.numUnspentsToMake - the number of new unspents to make
   *
   * @param callback
   */
  private manageUnspents(routeName: ManageUnspents, params: ConsolidateUnspentsOptions | FanoutUnspentsOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, [], ['walletPassphrase', 'xprv'], callback);

      const reqId = new RequestTracer();
      const filteredParams = _.pick(params, [
        'feeRate',
        'maxFeeRate',
        'maxFeePercentage',
        'feeTxConfirmTarget',

        'minValue',
        'maxValue',
        'minHeight',
        'minConfirms',
        'enforceMinConfirmsForChange',
        'targetAddress',

        routeName === 'consolidate' ? 'limit' : 'maxNumInputsToUse',
        'numUnspentsToMake',
      ]);
      self.bitgo.setRequestTracer(reqId);
      const response = yield self.bitgo.post(self.url(`/${routeName}Unspents`))
        .send(filteredParams)
        .result();

      const keychain = yield self.baseCoin.keychains().get({ id: self._wallet.keys[0], reqId });
      const transactionParams = _.extend({}, params, { txPrebuild: response, keychain });
      const signedTransaction = yield self.signTransaction(transactionParams);
      const selectParams = _.pick(params, ['comment', 'otp']);
      const finalTxParams = _.extend({}, signedTransaction, selectParams, { type: routeName });

      self.bitgo.setRequestTracer(reqId);
      return self.bitgo.post(self.baseCoin.url('/wallet/' + self._wallet.id + '/tx/send'))
        .send(finalTxParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Consolidate unspents on a wallet
   *
   * @param {Object} params - parameters object
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.xprv - the private key in string form if the walletPassphrase is not available
   * @param {Number} params.feeRate - The fee rate to use for the consolidation in satoshis/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in satoshis/kB
   * @param {Number} params.maxFeePercentage - the maximum relative portion that you're willing to spend towards fees
   * @param {Number} params.feeTxConfirmTarget - estimate the fees to aim for first confirmation with this number of blocks
   * @param {Number} params.minValue - the minimum value of unspents to use in satoshis
   * @param {Number} params.maxValue - the maximum value of unspents to use in satoshis
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - if true, minConfirms also applies to change outputs
   * @param {Number} params.limit                for routeName === 'consolidate'
   *                 params.maxNumInputsToUse    for routeName === 'fanout'
   *                  - maximum number of unspents you want to use in the transaction
   * @param {Number} params.numUnspentsToMake - the number of new unspents to make
   * @param callback
   */
  consolidateUnspents(params: ConsolidateUnspentsOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.manageUnspents('consolidate', params, callback);
  }

  /**
   * Fanout unspents on a wallet
   *
   * @param {Object} params - parameters object
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.xprv - the private key in string form if the walletPassphrase is not available
   * @param {Number} params.minValue - the minimum value of unspents to use
   * @param {Number} params.maxValue - the maximum value of unspents to use
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Number} params.maxFeePercentage - the maximum proportion of an unspent you are willing to lose to fees
   * @param {Number} params.feeTxConfirmTarget - estimate the fees to aim for first confirmation with this number of blocks
   * @param {Number} params.feeRate - The desired fee rate for the transaction in satoshis/kB
   * @param {Number} params.maxFeeRate - The max limit for a fee rate in satoshis/kB
   * @param {Number} params.maxNumInputsToUse - the number of unspents you want to use in the transaction
   * @param {Number} params.numUnspentsToMake - the number of new unspents to make
   * @param callback
   */
  fanoutUnspents(params: FanoutUnspentsOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.manageUnspents('fanout', params, callback);
  }

  /**
   * Set the token flush thresholds for the wallet. Updates the wallet.
   * Tokens will only be flushed from forwarder contracts if the balance is greater than the threshold defined here.
   * @param thresholds {Object} - pairs of { [tokenName]: threshold } (base units)
   * @param [callback]
   */
  updateTokenFlushThresholds(thresholds: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *(): any {
      if (self.baseCoin.getFamily() !== 'eth') {
        throw new Error('not supported for this wallet');
      }

      self._wallet = yield self.bitgo.put(self.url()).send({
        tokenFlushThresholds: thresholds,
      }).result();
    }).call(this).asCallback(callback);
  }

  /**
   * Sweep funds for a wallet
   *
   * @param {Object} params - parameters object
   * @param {String} params.address - The address to send all the funds in the wallet to
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.xprv - the private key in string form if the walletPassphrase is not available
   * @param {String} params.otp - Two factor auth code to enable sending the transaction
   * @param {Number} params.feeTxConfirmTarget - Estimate the fees to aim for first confirmation within this number of blocks
   * @param {Number} params.feeRate - The desired fee rate for the transaction in satoshis/kB
   * @param {Number} [params.maxFeeRate] - upper limit for feeRate in satoshis/kB
   * @param {Boolean} [params.allowPartialSweep] - allows sweeping 200 unspents when the wallet has more than that
   * @param [callback]
   * @returns txHex {String} the txHex of the signed transaction
   */
  sweep(params: SweepOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      params = params || {};
      common.validateParams(params, ['address'], ['walletPassphrase', 'xprv', 'otp'], callback);

      if (['eth', 'xrp'].includes(self.baseCoin.getFamily())) {
        if (self.confirmedBalanceString() !== self.balanceString()) {
          throw new Error('cannot sweep when unconfirmed funds exist on the wallet, please wait until all inbound transactions confirm');
        }

        const value = self.spendableBalanceString();
        if (_.isUndefined(value) || value === '0') {
          throw new Error('no funds to sweep');
        }
        (params as any).recipients = [{
          address: params.address,
          amount: value,
        }];

        return self.sendMany(params);
      }
      // the following flow works for all UTXO coins

      const reqId = new RequestTracer();
      const filteredParams = _.pick(params, ['address', 'feeRate', 'maxFeeRate', 'feeTxConfirmTarget', 'allowPartialSweep']);
      self.bitgo.setRequestTracer(reqId);
      const response = yield self.bitgo.post(self.url('/sweepWallet'))
        .send(filteredParams)
        .result();
      // TODO(BG-3588): add txHex validation to protect man in the middle attacks replacing the txHex

      const keychain = yield self.baseCoin.keychains().get({ id: self._wallet.keys[0], reqId });
      const transactionParams = _.extend({}, params, { txPrebuild: response, keychain: keychain, prv: params.xprv });
      const signedTransaction = yield self.signTransaction(transactionParams);

      const selectParams = _.pick(params, ['otp']);
      const finalTxParams = _.extend({}, signedTransaction, selectParams);
      self.bitgo.setRequestTracer(reqId);
      return self.bitgo.post(self.baseCoin.url('/wallet/' + self._wallet.id + '/tx/send'))
        .send(finalTxParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Freeze a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  freeze(params: FreezeOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    params = params || {};
    common.validateParams(params, [], [], callback);

    if (params.duration) {
      if (!_.isNumber(params.duration)) {
        throw new Error('invalid duration: should be number of seconds');
      }
    }

    return this.bitgo.post(this.url('/freeze'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Update comment of a transfer
   * @param params
   * @param callback
   * @returns {*}
   */
  transferComment(params: TransferCommentOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['id'], ['comment'], callback);

    return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/transfer/' + params.id + '/comment'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * List the addresses for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  addresses(params: AddressesOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, [], [], callback);

    const query: AddressesOptions = {};

    if (params.mine) {
      query.mine = !!params.mine;
    }

    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.sort) {
      if (!_.isNumber(params.sort)) {
        throw new Error('invalid sort argument, expecting number');
      }
      query.sort = params.sort;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    if (params.labelContains) {
      if (!_.isString(params.labelContains)) {
        throw new Error('invalid labelContains argument, expecting string');
      }
      query.labelContains = params.labelContains;
    }

    if (!_.isUndefined(params.segwit)) {
      if (!_.isBoolean(params.segwit)) {
        throw new Error('invalid segwit argument, expecting boolean');
      }
      query.segwit = params.segwit;
    }

    if (!_.isUndefined(params.chains)) {
      if (!_.isArray(params.chains)) {
        throw new Error('invalid chains argument, expecting array of numbers');
      }
      query.chains = params.chains;
    }

    return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/addresses'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Get a single wallet address by its id
   * @param params
   * @param callback
   * @returns {*}
   */
  getAddress(params: GetAddressOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, [], ['address', 'id'], callback);
    let query;
    if (_.isUndefined(params.address) && _.isUndefined(params.id)) {
      throw new Error('address or id of address required');
    }
    if (params.address) {
      query = params.address;
    } else {
      query = params.id;
    }

    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }

    return this.bitgo.get(this.baseCoin.url(`/wallet/${this._wallet.id}/address/${encodeURIComponent(query)}`))
      .result()
      .nodeify(callback);
  }

  /**
   * Create one or more new address(es) for use with this wallet.
   *
   * If the `count` field is defined and greater than 1, an object with a single
   * array property named `addresses` containing `count` address objects
   * will be returned. Otherwise, a single address object is returned.
   *
   * @param params
   * @param {Number} params.chain on which the new address should be created
   * @param {(Number|String)} params.gasPrice gas price for new address creation, if applicable
   * @param {String} params.label label for the new address(es)
   * @param {String} params.label label for the new address(es)
   * @param {Number} params.count=1 number of new addresses which should be created (maximum 250)
   * @param {Number} params.forwarderVersion The version of address to create, if applicable
   * @param {Boolean} params.lowPriority Ethereum-specific param to create address using low priority fee address
   * @param callback
   */
  createAddress(params: CreateAddressOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      const addressParams: CreateAddressOptions = {};
      const reqId = new RequestTracer();

      const {
        chain,
        gasPrice,
        label,
        lowPriority,
        forwarderVersion,
        count = 1,
      } = params;

      if (!_.isUndefined(chain)) {
        if (!_.isInteger(chain)) {
          throw new Error('chain has to be an integer');
        }
        addressParams.chain = chain;
      }

      if (!_.isUndefined(gasPrice)) {
        if (!_.isInteger(gasPrice) && (isNaN(Number(gasPrice)) || !_.isString(gasPrice))) {
          throw new Error('gasPrice has to be an integer or numeric string');
        }
        addressParams.gasPrice = gasPrice;
      }

      if (!_.isUndefined(forwarderVersion)) {
        if (!_.isInteger(forwarderVersion) || forwarderVersion < 0 || forwarderVersion > 1) {
          throw new Error('forwarderVersion has to be an integer between 0 and 1');
        }
        addressParams.forwarderVersion = forwarderVersion;
      }

      if (!_.isUndefined(label)) {
        if (!_.isString(label)) {
          throw new Error('label has to be a string');
        }
        addressParams.label = label;
      }

      if (!_.isInteger(count) || count <= 0 || count > 250) {
        throw new Error('count has to be a number between 1 and 250');
      }

      if (!_.isUndefined(lowPriority)) {
        if (!_.isBoolean(lowPriority)) {
          throw new Error('lowPriority has to be a boolean');
        }
        addressParams.lowPriority = lowPriority;
      }

      // get keychains for address verification
      const keychains = yield Bluebird.map(self._wallet.keys as string[],
        k => self.baseCoin.keychains().get({ id: k, reqId })
      );
      const rootAddress = _.get(self._wallet, 'receiveAddress.address');

      const newAddresses = _.times(count, co(function *createAndVerifyAddress() {
        self.bitgo.setRequestTracer(reqId);
        const newAddress = (yield self.bitgo.post(self.baseCoin.url('/wallet/' + self._wallet.id + '/address'))
          .send(addressParams)
          .result()) as any;

        // infer its address type
        if (_.isObject(newAddress.coinSpecific)) {
          // need dynamic import to break circular dependency, this is ugly
          const { AbstractUtxoCoin } = require('./coins/abstractUtxoCoin');
          newAddress.addressType = AbstractUtxoCoin.inferAddressType(newAddress);
        }

        newAddress.keychains = keychains;
        const verificationData: VerifyAddressOptions = _.merge({}, newAddress, { rootAddress });

        if (verificationData.error) {
          throw new AddressGenerationError(verificationData.error);
        }

        if (verificationData.coinSpecific && !verificationData.coinSpecific.pendingChainInitialization) {
          // can't verify addresses which are pending chain initialization, as the address is hidden
          self.baseCoin.verifyAddress(verificationData);
        }

        return newAddress;
      }).bind(this));

      if (newAddresses.length === 1) {
        return newAddresses[0];
      }

      return {
        addresses: yield Promise.all(newAddresses),
      };
    }).call(this).asCallback(callback);
  }

  /**
   * Update properties on an address
   * @param params
   * @param callback
   * @returns {*}
   */
  updateAddress(params: UpdateAddressOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      const address = params.address;

      if (!_.isString(address)) {
        throw new Error('missing required string parameter address');
      }

      const putParams = _.pick(params, ['label']);
      const url = self.url('/address/' + encodeURIComponent(address));

      return self.bitgo.put(url).send(putParams).result();
    }).call(this).asCallback(callback);
  }

  /**
   * List webhooks on this wallet
   * @param params
   * @param callback
   */
  listWebhooks(params: PaginationOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query: PaginationOptions = {};
    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    return this.bitgo.get(this.url('/webhooks'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Simulate wallet webhook, currently for webhooks of type transfer and pending approval
   * @param params
   * - webhookId (required) id of the webhook to be simulated
   * - transferId (optional but required for transfer webhooks) id of the simulated transfer
   * - pendingApprovalId (optional but required for pending approval webhooks) id of the simulated pending approval
   * @param callback
   * @returns {*}
   */
  simulateWebhook(params: SimulateWebhookOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['webhookId'], ['transferId', 'pendingApprovalId'], callback);

    const hasTransferId = !!params.transferId;
    const hasPendingApprovalId = !!params.pendingApprovalId;
    if (!hasTransferId && !hasPendingApprovalId) {
      throw new Error('must supply either transferId or pendingApprovalId');
    }

    if (hasTransferId && hasPendingApprovalId) {
      throw new Error('must supply either transferId or pendingApprovalId, but not both');
    }

    // depending on the coin type of the wallet, the txHash has to adhere to its respective format
    // but the server takes care of that

    // only take the transferId and pendingApprovalId properties
    const filteredParams = _.pick(params, ['transferId', 'pendingApprovalId']);

    const webhookId = params.webhookId;
    return this.bitgo.post(this.url('/webhooks/' + webhookId + '/simulate'))
      .send(filteredParams)
      .result()
      .nodeify(callback);
  }

  /**
   * Add a webhook to this wallet
   * @param params
   * @param callback
   */
  addWebhook(params: ModifyWebhookOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['url', 'type'], [], callback);

    return this.bitgo.post(this.url('/webhooks'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Remove a webhook from this wallet
   * @param params
   * @param callback
   */
  removeWebhook(params: ModifyWebhookOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['url', 'type'], [], callback);

    return this.bitgo.del(this.url('/webhooks'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Gets the user key chain for this wallet
   *
   * The user key chain is the first keychain of the wallet and usually has the encrypted prv stored on BitGo.
   * Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
   * @param params
   * @param callback
   */
  getEncryptedUserKeychain(params: Record<string, never> = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    const tryKeyChain = co(function *(index: number) {
      if (!self._wallet.keys || index >= self._wallet.keys.length) {
        throw new Error('No encrypted keychains on this wallet.');
      }

      const params = { id: self._wallet.keys[index] };

      const keychain = yield self.baseCoin.keychains().get(params);
      // If we find the prv, then this is probably the user keychain we're looking for
      if (keychain.encryptedPrv) {
        return keychain;
      }
      return tryKeyChain(index + 1);
    }).bind(this);

    return tryKeyChain(0).nodeify(callback);
  }

  /**
   * Gets the unencrypted private key for this wallet (be careful!)
   * Requires wallet passphrase
   *
   * @param params
   * @param callback
   */
  getPrv(params: GetPrvOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, [], ['walletPassphrase', 'prv'], callback);

      // Prepare signing key
      if (_.isUndefined(params.prv) && _.isUndefined(params.walletPassphrase)) {
        throw new Error('must either provide prv or wallet passphrase');
      }

      if (!_.isUndefined(params.prv) && !_.isString(params.prv)) {
        throw new Error('prv must be a string');
      }

      if (!_.isUndefined(params.walletPassphrase) && !_.isString(params.walletPassphrase)) {
        throw new Error('walletPassphrase must be a string');
      }

      if (params.prv) {
        return params.prv;
      }

      const userKeychain = (yield self.getEncryptedUserKeychain()) as any;
      const userEncryptedPrv = userKeychain.encryptedPrv;

      let userPrv;
      try {
        userPrv = self.bitgo.decrypt({ input: userEncryptedPrv, password: params.walletPassphrase });
      } catch (e) {
        throw new Error('error decrypting wallet passphrase');
      }

      return userPrv;
    }).call(this).asCallback(callback);
  }

  /**
   * Send an encrypted wallet share to BitGo.
   * @param params
   * @param callback
   */
  createShare(params: CreateShareOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['user', 'permissions'], [], callback);

    if (params.keychain && !_.isEmpty(params.keychain)) {
      if (!params.keychain.pub || !params.keychain.encryptedPrv || !params.keychain.fromPubKey || !params.keychain.toPubKey || !params.keychain.path) {
        throw new Error('requires keychain parameters - pub, encryptedPrv, fromPubKey, toPubKey, path');
      }
    }

    return this.bitgo.post(this.url('/share'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Share this wallet with another BitGo user.
   * @param params
   * @param callback
   * @returns {*}
   */
  shareWallet(params: ShareWalletOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, ['email', 'permissions'], ['walletPassphrase', 'message'], callback);

      if (params.reshare !== undefined && !_.isBoolean(params.reshare)) {
        throw new Error('Expected reshare to be a boolean.');
      }

      if (params.skipKeychain !== undefined && !_.isBoolean(params.skipKeychain)) {
        throw new Error('Expected skipKeychain to be a boolean. ');
      }
      const needsKeychain = !params.skipKeychain && params.permissions && params.permissions.indexOf('spend') !== -1;

      if (params.disableEmail !== undefined && !_.isBoolean(params.disableEmail)) {
        throw new Error('Expected disableEmail to be a boolean.');
      }

      if (!_.isString(params.email)) {
        throw new Error('missing required string parameter email');
      }

      const sharing = (yield self.bitgo.getSharingKey({ email: params.email.toLowerCase() })) as any;
      let sharedKeychain;
      if (needsKeychain) {
        try {
          const keychain = (yield self.getEncryptedUserKeychain({})) as any;
          // Decrypt the user key with a passphrase
          if (keychain.encryptedPrv) {
            if (!params.walletPassphrase) {
              throw new Error('Missing walletPassphrase argument');
            }
            try {
              keychain.prv = self.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedPrv });
            } catch (e) {
              throw new Error('Unable to decrypt user keychain');
            }

            const eckey = makeRandomKey();
            const secret = self.bitgo.getECDHSecret({ eckey: eckey, otherPubKeyHex: sharing.pubkey });
            const newEncryptedPrv = self.bitgo.encrypt({ password: secret, input: keychain.prv });

            sharedKeychain = {
              pub: keychain.pub,
              encryptedPrv: newEncryptedPrv,
              fromPubKey: eckey.getPublicKeyBuffer().toString('hex'),
              toPubKey: sharing.pubkey,
              path: sharing.path,
            };
          }
        } catch (e) {
          if (e.message === 'No encrypted keychains on this wallet.') {
            sharedKeychain = {};
            // ignore this error because this looks like a cold wallet
          } else {
            throw e;
          }
        }
      }

      const options: CreateShareOptions = {
        user: sharing.userId,
        permissions: params.permissions,
        reshare: params.reshare,
        message: params.message,
        disableEmail: params.disableEmail,
      };

      if (sharedKeychain) {
        options.keychain = sharedKeychain;
      } else if (params.skipKeychain) {
        options.keychain = {};
      }

      return self.createShare(options);
    }).call(this).asCallback(callback);
  }

  /**
   * Remove user from wallet
   * @param params
   * - userId Id of the user to remove
   * @param callback
   * @return {*}
   */
  removeUser(params: RemoveUserOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['userId'], [], callback);

    const userId = params.userId;
    return this.bitgo.del(this.url('/user/' + userId))
      .result()
      .nodeify(callback);
  }

  /**
   * Fetch a transaction prebuild (unsigned transaction) from BitGo
   *
   * @param {Object} params
   * @param {{address: string, amount: string}} params.recipients - list of recipients and necessary recipient information
   * @param {Number} params.numBlocks - Estimates the approximate fee per kilobyte necessary for a transaction confirmation within numBlocks blocks
   * @param {Number} params.feeRate - the desired feeRate for the transaction in base units/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in base units/kB
   * @param {Number} params.minConfirms - Minimum number of confirmations unspents going into this transaction should have
   * @param {Boolean} params.enforceMinConfirmsForChange - Enforce minimum number of confirmations on change (internal) inputs.
   * @param {Number} params.targetWalletUnspents - The desired count of unspents in the wallet. If the wallet’s current unspent count is lower than the target, up to four additional change outputs will be added to the transaction.
   * @param {Number} params.minValue - Ignore unspents smaller than this amount of base units
   * @param {Number} params.maxValue - Ignore unspents larger than this amount of base units
   * @param {Number} params.sequenceId - The sequence ID of the transaction
   * @param {Number} params.lastLedgerSequence - Absolute max ledger the transaction should be accepted in, whereafter it will be rejected.
   * @param {String} params.ledgerSequenceDelta - Relative ledger height (in relation to the current ledger) that the transaction should be accepted in, whereafter it will be rejected.
   * @param {Number} params.gasPrice - Custom gas price to be used for sending the transaction
   * @param {Number} params.gasLimit - Custom gas limit to be used for sending the transaction
   * @param {Boolean} params.noSplitChange - Set to true to disable automatic change splitting for purposes of unspent management
   * @param {Array} params.unspents - The unspents to use in the transaction. Each unspent should be in the form prevTxId:nOutput
   * @param {String} params.changeAddress - Specifies the destination of the change output
   * @param {Boolean} params.nonParticipation - (Algorand) Non participating key reg transaction
   * @param {Number} params.validFromBlock - (Algorand) The minimum round this will run on
   * @param {Number} params.validToBlock - (Algorand) The maximum round this will run on
   * @param {Boolean} params.instant - Build this transaction to conform with instant sending coin-specific method (if available)
   * @param {{value: String, type: String}} params.memo - Memo to use in transaction (supported by Stellar)
   * @param {String} param.transferId - transfer Id to use in transaction (supported by casper)
   * @param {String} params.addressType - The type of address to create for change. One of `p2sh`, `p2shP2wsh`, and `p2wsh`. Case-sensitive.
   * @param {Boolean} params.hop - Build this as an Ethereum hop transaction
   * @param {Object} params.reservation - Object to reserve the unspents that this tx build uses. Format is reservation = { expireTime: ISODateString, pendingApprovalId: String }
   * @param {String} params.walletPassphrase The passphrase to the wallet user key, to sign commitment data for Ethereum hop transactions
   * @param {String} params.walletContractAddress - The contract address used as the "to" field of a transaction
   * @param callback
   * @returns {*}
   */
  prebuildTransaction(params: PrebuildTransactionOptions = {}, callback?: NodeCallback<PrebuildTransactionResult>): Bluebird<PrebuildTransactionResult> {
    const self = this;
    return co<PrebuildTransactionResult>(function *() {
      // Whitelist params to build tx
      const whitelistedParams = _.pick(params, self.prebuildWhitelistedParams());
      debug('prebuilding transaction: %O', whitelistedParams);

      if (params.reqId) {
        self.bitgo.setRequestTracer(params.reqId);
      }
      const extraParams = yield self.baseCoin.getExtraPrebuildParams(Object.assign(params, { wallet: self }));
      Object.assign(whitelistedParams, extraParams);
      const queryParams = {
        offlineVerification: params.offlineVerification ? true : undefined,
      };

      const buildQuery = self.bitgo.post(self.baseCoin.url('/wallet/' + self.id() + '/tx/build'))
        .query(queryParams)
        .send(whitelistedParams)
        .result();
      const utxoCoin = self.baseCoin as AbstractUtxoCoin;
      const blockHeightQuery = _.isFunction(utxoCoin.getLatestBlockHeight) ?
        utxoCoin.getLatestBlockHeight(params.reqId) :
        Promise.resolve(undefined);
      const queries = [buildQuery, blockHeightQuery];
      const [buildResponse, blockHeight] = (yield Promise.all(queries)) as any;
      debug('postprocessing transaction prebuild: %O', buildResponse);
      if (!_.isUndefined(blockHeight)) {
        buildResponse.blockHeight = blockHeight;
      }
      let prebuild: TransactionPrebuild = (yield self.baseCoin.postProcessPrebuild(
        Object.assign(buildResponse, { wallet: self, buildParams: whitelistedParams })
      )) as any;
      delete prebuild.wallet;
      delete prebuild.buildParams;
      prebuild = _.extend({}, prebuild, { walletId: self.id() });
      if (self._wallet && self._wallet.coinSpecific && !params.walletContractAddress) {
        prebuild = _.extend({}, prebuild, { walletContractAddress: self._wallet.coinSpecific.baseAddress });
      }
      debug('final transaction prebuild: %O', prebuild);
      return prebuild as PrebuildTransactionResult;
    }).call(this).asCallback(callback);
  }

  /**
   * Sign a transaction
   * @param params
   * - txPrebuild
   * - [keychain / key] (object) or prv (string)
   * - walletPassphrase
   * @param callback
   * @return {*}
   */
  signTransaction(
    params: WalletSignTransactionOptions = {},
    callback?: NodeCallback<SignedTransaction>
  ): Bluebird<SignedTransaction> {
    const self = this;
    return co<SignedTransaction>(function *() {
      const txPrebuild = params.txPrebuild;
      if (!txPrebuild || typeof txPrebuild !== 'object') {
        throw new Error('txPrebuild must be an object');
      }
      const presign = yield self.baseCoin.presignTransaction(params);
      const userPrv = self.getUserPrv(presign);
      const signingParams = _.extend({}, presign, { txPrebuild: txPrebuild, prv: userPrv });
      return self.baseCoin.signTransaction(signingParams);
    }).call(this).asCallback(callback);
  }

  /**
   * Get the user private key from either a derivation or an encrypted keychain
   * @param [params.keychain / params.key] (object) or params.prv (string)
   * @param params.walletPassphrase (string)
   */
  getUserPrv(params: GetUserPrvOptions = {}): string {
    const userKeychain = params.keychain || params.key;
    let userPrv = params.prv;
    if (userPrv && typeof userPrv !== 'string') {
      throw new Error('prv must be a string');
    }

    // use the `derivedFromParentWithSeed` property from the user keychain as the `coldDerivationSeed`
    // if no other `coldDerivationSeed` was explicitly provided
    if (
      params.coldDerivationSeed === undefined &&
      params.keychain !== undefined &&
      params.keychain.derivedFromParentWithSeed !== undefined
    ) {
      params.coldDerivationSeed = params.keychain.derivedFromParentWithSeed;
    }

    if (userPrv && params.coldDerivationSeed) {
      // the derivation only makes sense when a key already exists
      const derivation = this.baseCoin.deriveKeyWithSeed({ key: userPrv, seed: params.coldDerivationSeed });
      userPrv = derivation.key;
    } else if (!userPrv) {
      if (!userKeychain || typeof userKeychain !== 'object') {
        throw new Error('keychain must be an object');
      }
      const userEncryptedPrv = userKeychain.encryptedPrv;
      if (!userEncryptedPrv) {
        throw new Error('keychain does not have property encryptedPrv');
      }
      if (!params.walletPassphrase) {
        throw new Error('walletPassphrase property missing');
      }

      userPrv = this.bitgo.decrypt({ input: userEncryptedPrv, password: params.walletPassphrase });
    }
    return userPrv;
  }

  /**
   * Get a transaction prebuild from BitGo, validate it, and then decrypt the user key and sign the transaction
   * @param params
   * @param callback
   */
  prebuildAndSignTransaction(params: PrebuildAndSignTransactionOptions = {}, callback?: NodeCallback<SignedTransaction>): Bluebird<SignedTransaction> {
    const self = this;
    return co<SignedTransaction>(function *() {
      if (params.prebuildTx && params.recipients) {
        const error: any = new Error('Only one of prebuildTx and recipients may be specified');
        error.code = 'both_prebuildtx_and_recipients_specified';
        throw error;
      }

      if (params.recipients && !Array.isArray(params.recipients)) {
        const error: any = new Error('expecting recipients array');
        error.code = 'recipients_not_array';
        throw error;
      }

      if (_.isArray(self._permissions) && !self._permissions.includes('spend')) {
        const error: any = new Error('no spend permission on this wallet');
        error.code = 'user_not_allowed_to_spend_from_wallet';
        throw error;
      }

      // call prebuildTransaction and keychains-get in parallel
      // the prebuild can be overridden by providing an explicit tx
      const txPrebuildQuery = params.prebuildTx ? Promise.resolve(params.prebuildTx) : self.prebuildTransaction(params);

      // retrieve our keychains needed to run the prebuild - some coins use all pubs
      const keychains = (yield self.baseCoin.keychains().getKeysForSigning({ wallet: self, reqId: params.reqId })) as any;

      const txPrebuild = (yield txPrebuildQuery) as any;

      try {
        const verificationParams = _.pick(params.verification || {}, ['disableNetworking', 'keychains', 'addresses']);
        yield self.baseCoin.verifyTransaction({
          txParams: params,
          txPrebuild,
          wallet: self,
          verification: verificationParams,
          reqId: params.reqId,
        });
      } catch (e) {
        console.error('transaction prebuild failed local validation:', e.message);
        console.error('transaction params:', _.omit(params, ['keychain', 'prv', 'passphrase', 'walletPassphrase', 'key', 'wallet']));
        console.error('transaction prebuild:', txPrebuild);
        console.trace(e);
        throw e;
      }

      // pass our three keys
      const signingParams = _.extend({}, params, {
        txPrebuild: txPrebuild,
        wallet: {
          // this is the version of the multisig address at wallet creation time
          addressVersion: self._wallet.coinSpecific.addressVersion,
        },
        keychain: keychains[0],
        backupKeychain: (keychains.length > 1) ? keychains[1] : null,
        bitgoKeychain: (keychains.length > 2) ? keychains[2] : null,
      });

      try {
        return yield self.signTransaction(signingParams);
      } catch (error) {
        if (error.message.includes('insufficient funds')) {
          error.code = 'insufficient_funds';
          error.walletBalances = {
            balanceString: self.balanceString(),
            confirmedBalanceString: self.confirmedBalanceString(),
            spendableBalanceString: self.spendableBalanceString(),
            balance: self.balance(),
            confirmedBalance: self.confirmedBalance(),
            spendableBalance: self.spendableBalance(),
          };
          error.txParams = _.omit(params, ['keychain', 'prv', 'passphrase', 'walletPassphrase', 'key']);
        }
        throw error;
      }
    }).call(this).asCallback(callback);
  }

  /**
   * Accelerate a transaction's confirmation using Child-Pays-For-Parent (CPFP)
   * @param params
   * @param callback
   */
  accelerateTransaction(params: AccelerateTransactionOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      // TODO(BG-9349): change the last check to > 0 and the error message once platform allows multiple transactions to
      //                be bumped in the same CPFP transaction
      if (_.isUndefined(params.cpfpTxIds) || !Array.isArray(params.cpfpTxIds) || params.cpfpTxIds.length !== 1) {
        const error: any = new Error('expecting cpfpTxIds to be an array of length 1');
        error.code = 'cpfptxids_not_array';
        throw error;
      }

      if (_.isUndefined(params.cpfpFeeRate)) {
        if (params.noCpfpFeeRate !== true) {
          const error: any = new Error('cpfpFeeRate must be set unless noCpfpFeeRate is set');
          error.code = 'cpfpfeerate_not_set';
          throw error;
        }
      } else {
        if (!_.isInteger(params.cpfpFeeRate) || params.cpfpFeeRate < 0) {
          const error: any = new Error('cpfpFeeRate must be a non-negative integer');
          error.code = 'cpfpfeerate_not_nonnegative_integer';
          throw error;
        }
      }

      if (_.isUndefined(params.maxFee)) {
        if (params.noMaxFee !== true) {
          const error: any = new Error('maxFee must be set unless noMaxFee is set');
          error.code = 'maxfee_not_set';
          throw error;
        }
      } else {
        if (!_.isInteger(params.maxFee) || params.maxFee < 0) {
          const error: any = new Error('maxFee must be a non-negative integer');
          error.code = 'maxfee_not_nonnegative_integer';
          throw error;
        }
      }

      if (params.recipients !== undefined) {
        if (!Array.isArray(params.recipients) || params.recipients.length !== 0) {
          throw new Error(`invalid value for 'recipients': must be empty array when set`);
        }
      }

      params.recipients = [];

      // We must pass the build params through to submit in case the CPFP tx ever has to be rebuilt.
      const submitParams = Object.assign(params, yield self.prebuildAndSignTransaction(params));
      delete (submitParams as any).wallet;
      return yield self.submitTransaction(submitParams);
    }).call(this).asCallback(callback);
  }

  /**
   * Submit a half-signed transaction to BitGo
   * @param params
   * - txHex: transaction hex to submit
   * - halfSigned: object containing transaction (txHex or txBase64) to submit
   * @param callback
   */
  submitTransaction(params: SubmitTransactionOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, [], ['otp', 'txHex'], callback);
    const hasTxHex = !!params.txHex;
    const hasHalfSigned = !!params.halfSigned;

    if ((hasTxHex && hasHalfSigned) || (!hasTxHex && !hasHalfSigned)) {
      throw new Error('must supply either txHex or halfSigned, but not both');
    }
    return this.bitgo.post(this.baseCoin.url('/wallet/' + this.id() + '/tx/send'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Send coins to a recipient
   * @param params
   * @param params.address - the destination address
   * @param params.amount - the amount in satoshis/wei/base value to be sent
   * @param params.message - optional message to attach to transaction
   * @param params.data - [Ethereum Specific] optional data to pass to transaction
   * @param params.walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
   * @param params.prv - the private key in string form, if walletPassphrase is not available
   * @param params.minConfirms - the minimum confirmation threshold for inputs
   * @param params.enforceMinConfirmsForChange - whether to enforce minConfirms for change inputs
   * @param callback
   * @returns {*}
   */
  send(params: SendOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['address'], ['message', 'data'], callback);

    if (_.isUndefined(params.amount)) {
      throw new Error('missing required parameter amount');
    }

    if (_.isUndefined(params.address)) {
      throw new Error('missing required parameter address');
    }

    const coin = this.baseCoin;

    const amount = new BigNumber(params.amount);
    if (amount.isNegative()) {
      throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
    }

    if (!coin.valuelessTransferAllowed() && amount.isZero()) {
      throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
    }

    const recipients: SendManyOptions['recipients'] = [{
      address: params.address,
      amount: params.amount,
    }];

    if (params.data && coin.transactionDataAllowed()) {
      recipients[0].data = params.data;
    }

    const sendManyOptions: SendManyOptions = Object.assign({}, params, { recipients });
    return this.sendMany(sendManyOptions).nodeify(callback);
  }

  /**
   * Send money to multiple recipients
   * 1. Gets the user keychain by checking the wallet for a key which has an encrypted prv
   * 2. Decrypts user key
   * 3. Creates the transaction with default fee
   * 4. Signs transaction with decrypted user key
   * 5. Sends the transaction to BitGo
   * @param {object} params
   * @param {{address: string, amount: string}} params.recipients - list of recipients and necessary recipient information
   * @param {Number} params.numBlocks - Estimates the approximate fee per kilobyte necessary for a transaction confirmation within numBlocks blocks
   * @param {Number} params.feeRate - the desired feeRate for the transaction in satothis/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in satoshis/kB
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - Enforces minConfirms on change inputs
   * @param {Number} params.targetWalletUnspents - The desired count of unspents in the wallet
   * @param {String} params.message - optional message to attach to transaction
   * @param {Number} params.minValue - Ignore unspents smaller than this amount of satoshis
   * @param {Number} params.maxValue - Ignore unspents larger than this amount of satoshis
   * @param {Number} params.sequenceId - The sequence ID of the transaction
   * @param {Number} params.lastLedgerSequence - Absolute max ledger the transaction should be accepted in, whereafter it will be rejected.
   * @param {String} params.ledgerSequenceDelta - Relative ledger height (in relation to the current ledger) that the transaction should be accepted in, whereafter it will be rejected.
   * @param {Number} params.gasPrice - Custom gas price to be used for sending the transaction
   * @param {Boolean} params.noSplitChange - Set to true to disable automatic change splitting for purposes of unspent management
   * @param {Array} params.unspents - The unspents to use in the transaction. Each unspent should be in the form prevTxId:nOutput
   * @param {String} params.comment - Any additional comment to attach to the transaction
   * @param {String} params.otp - Two factor auth code to enable sending the transaction
   * @param {String} params.changeAddress - Specifies the destination of the change output
   * @param {Boolean} params.instant - Send this transaction using coin-specific instant sending method (if available)
   * @param {{value: String, type: String}} params.memo - Memo to use in transaction (supported by Stellar)
   * @param {String} params.type - Type of the transaction (e.g. trustline)
   * @param {{token: params, action: String, limit: String}[]} options.trustlines - Array of trustlines to manage (supported by Stellar)
   * @param callback
   * @returns {*}
   */
  sendMany(params: SendManyOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, [], ['comment', 'otp'], callback);
      debug('sendMany called');
      const reqId = params.reqId || new RequestTracer();
      params.reqId = reqId;
      const coin = self.baseCoin;
      if (_.isObject(params.recipients)) {
        params.recipients.map(function(recipient) {
          const amount = new BigNumber(recipient.amount);
          if (amount.isNegative()) {
            throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
          }
          if (!coin.valuelessTransferAllowed() && amount.isZero()) {
            throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
          }
        });
      }

      const halfSignedTransaction = yield self.prebuildAndSignTransaction(params);
      const selectParams = _.pick(params, [
        'recipients', 'numBlocks', 'feeRate', 'maxFeeRate', 'minConfirms',
        'enforceMinConfirmsForChange', 'targetWalletUnspents',
        'message', 'minValue', 'maxValue', 'sequenceId',
        'lastLedgerSequence', 'ledgerSequenceDelta', 'gasPrice',
        'noSplitChange', 'unspents', 'comment', 'otp', 'changeAddress',
        'instant', 'memo', 'type', 'trustlines', 'transferId',
        'stakingOptions'
      ]);
      const finalTxParams = _.extend({}, halfSignedTransaction, selectParams);
      self.bitgo.setRequestTracer(reqId);
      return self.bitgo.post(self.url('/tx/send'))
        .send(finalTxParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Recover an unsupported token from a BitGo multisig wallet
   * params are validated in Eth.prototype.recoverToken
   * @param params
   * @param params.tokenContractAddress the contract address of the unsupported token
   * @param params.recipient the destination address recovered tokens should be sent to
   * @param params.walletPassphrase the wallet passphrase
   * @param params.prv the xprv
   * @param callback
   */
  recoverToken(params: RecoverTokenOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      if (self.baseCoin.getFamily() !== 'eth') {
        throw new Error('token recovery only supported for eth wallets');
      }

      const {
        tokenContractAddress,
        recipient,
      } = params;

      if (_.isUndefined(tokenContractAddress)) {
        throw new Error('missing required string parameter tokenContractAddress');
      }

      if (_.isUndefined(recipient)) {
        throw new Error('missing required string parameter recipient');
      }

      const recoverTokenOptions = Object.assign({ tokenContractAddress, recipient }, params, { wallet: self });
      return (self.baseCoin as Eth).recoverToken(recoverTokenOptions);
    }).call(this).asCallback(callback);
  }

  /**
   * Get transaction metadata for the oldest transaction that is still pending or attempted
   * @param params
   * @param callback
   * @returns {Object} Object with txid, walletId, tx, and fee (if supported for coin)
   */
  getFirstPendingTransaction(params: Record<string, never> = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return internal.getFirstPendingTransaction({ walletId: this.id() }, this.baseCoin, this.bitgo).asCallback(callback);
  }

  /**
   * Change the fee on the pending transaction that corresponds to the given txid to the given new fee
   * @param params
   * @param {String} params.txid The transaction Id corresponding to the transaction whose fee is to be changed
   * @param {String} params.fee The new fee to apply to the denoted transaction
   * @param callback
   * @returns {String} The transaction ID of the new transaction that contains the new fee rate
   */
  changeFee(params: ChangeFeeOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, ['txid', 'fee'], [], callback);

      return self.bitgo.post(self.baseCoin.url('/wallet/' + self.id() + '/tx/changeFee'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Fetch info from merchant server
   * @param {Object} params The params passed into the function
   * @param {String} params.url The Url to retrieve info from
   * @param callback
   * @returns {Object} The info returned from the merchant server
   * @deprecated
   */
  getPaymentInfo(params: { url?: string; } = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *coGetPaymentInfo() {
      params = params || {};
      common.validateParams(params, ['url'], [], callback);

      return self.bitgo.get(self.url('/paymentInfo'))
        .query(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Send json payment response
   * @param {Object} params The params passed into the function
   * @param {String} params.paymentUrl - The url to send the fully signed transaction to
   * @param {String} params.txHex - The transaction hex of the payment
   * @param {String} params.memo {String} - A memo supplied by the merchant, to be inserted into the transfer as the comment
   * @param {String} params.expires {String} - ISO Date format of when the payment request expires
   * @param callback
   * @returns {Object} The info returned from the merchant server Payment Ack
   * @deprecated
   */
  sendPaymentResponse(params: Record<string, never> = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo.post(this.url('/sendPayment'))
      .send(params)
      .result()
      .asCallback(callback);
  }

  /**
   * Create a policy rule
   * @param params
   * @param params.condition condition object
   * @param params.action action object
   * @param callback
   * @returns {*}
   */
  createPolicyRule(params: CreatePolicyRuleOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, ['id', 'type'], ['message'], callback);

      if (!_.isObject(params.condition)) {
        throw new Error('missing parameter: conditions object');
      }

      if (!_.isObject(params.action)) {
        throw new Error('missing parameter: action object');
      }

      return self.bitgo.post(self.url('/policy/rule'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Update a policy rule
   * @param params
   * @param params.condition condition object
   * @param params.action action object
   * @param callback
   * @returns {*}
   */
  setPolicyRule(params: any = {}, callback?: NodeCallback<any>) {
    const self = this;
    return co(function *() {
      common.validateParams(params, ['id', 'type'], ['message'], callback);

      if (!_.isObject(params.condition)) {
        throw new Error('missing parameter: conditions object');
      }

      if (!_.isObject(params.action)) {
        throw new Error('missing parameter: action object');
      }

      return self.bitgo.put(self.url('/policy/rule'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Remove Policy Rule
   * @param params
   * @param callback
   * @returns {*}
   */
  removePolicyRule(params: RemovePolicyRuleOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, ['id'], ['message'], callback);

      return self.bitgo.del(self.url('/policy/rule'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Remove this wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  remove(params: Record<string, never> = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo.del(this.url()).result().asCallback(callback);
  }

  /**
   * Extract a JSON representable version of this wallet
   */
  toJSON(): WalletData {
    return this._wallet;
  }

  /**
   * Create a trading account from this wallet
   */
  toTradingAccount(): TradingAccount {
    if (this.baseCoin.getFamily() !== 'ofc') {
      throw new Error('Can only convert an Offchain (OFC) wallet to a trading account');
    }
    return new TradingAccount(this._wallet.enterprise, this, this.bitgo);
  }

  /**
   * Creates and downloads PDF keycard for wallet (requires response from wallets.generateWallet)
   *
   * Note: this is example code and is not the version used on bitgo.com
   *
   * @param params
   *   * jsPDF - an instance of the jsPDF library
   *   * QRCode - an instance of the QRious library
   *   * userKeychain - a wallet's private user keychain
   *   * backupKeychain - a wallet's private backup keychain
   *   * bitgoKeychain - a wallet's private bitgo keychain
   *   * passphrase - the wallet passphrase
   *   * passcodeEncryptionCode - the encryption secret used for Box D
   *   * activationCode - a randomly generated six-digit activation code
   *   * walletKeyID - the Key ID used for deriving a cold wallet's signing key
   *   * backupKeyID - the Key ID used for deriving a cold wallet's backup key
   * @returns {*}
   */
  downloadKeycard(params: DownloadKeycardOptions = {}): void {
    if (!window || !window.location) {
      throw new Error('The downloadKeycard function is only callable within a browser.');
    }

    // Grab parameters with default for activationCode
    const {
      jsPDF,
      QRCode,
      userKeychain,
      backupKeychain,
      bitgoKeychain,
      passphrase,
      passcodeEncryptionCode,
      walletKeyID,
      backupKeyID,
      activationCode = Math.floor(Math.random() * 900000 + 100000).toString(),
    } = params;

    if (!jsPDF || typeof jsPDF !== 'function') {
      throw new Error('Please pass in a valid jsPDF instance');
    }

    // Validate keychains
    if (!userKeychain || typeof userKeychain !== 'object') {
      throw new Error(`Wallet keychain must have a 'user' property`);
    }

    if (!backupKeychain || typeof backupKeychain !== 'object') {
      throw new Error('Backup keychain is required and must be an object');
    }

    if (!bitgoKeychain || typeof bitgoKeychain !== 'object') {
      throw new Error('Bitgo keychain is required and must be an object');
    }

    if (walletKeyID && typeof walletKeyID !== 'string') {
      throw new Error('walletKeyID must be a string');
    }

    if (backupKeyID && typeof backupKeyID !== 'string') {
      throw new Error('backupKeyID must be a string');
    }

    // Validate activation code if provided
    if (typeof activationCode !== 'string') {
      throw new Error('Activation Code must be a string');
    }

    if (activationCode.length !== 6) {
      throw new Error('Activation code must be six characters');
    }

    const coinShortName = this.baseCoin.type;
    const coinName = this.baseCoin.getFullName();
    const walletLabel = this._wallet.label;

    const doc = drawKeycard({
      jsPDF,
      QRCode,
      encrypt: this.bitgo.encrypt,
      coinShortName,
      coinName,
      activationCode,
      walletLabel,
      passphrase,
      passcodeEncryptionCode,
      userKeychain,
      backupKeychain,
      bitgoKeychain,
      walletKeyID,
      backupKeyID,
    });

    // Save the PDF on the user's browser
    doc.save(`BitGo Keycard for ${walletLabel}.pdf`);
  }

  /**
   * Builds a set of consolidation transactions for a wallet.
   * @param params
   *     consolidateAddresses - these are the on-chain receive addresses we want to pick a consolidation amount from
   * @param callback
   */
  buildAccountConsolidations(params: BuildConsolidationTransactionOptions = {}, callback?: NodeCallback<PrebuildTransactionResult[]>): Bluebird<PrebuildTransactionResult[]> {
    const self = this;
    return co<PrebuildTransactionResult[]>(function *() {
      if (!self.baseCoin.allowsAccountConsolidations()) {
        throw new Error(`${self.baseCoin.getFullName()} does not allow account consolidations.`);
      }

      // Whitelist params to build tx
      const whitelistedParams = _.pick(params, self.prebuildConsolidateAccountParams());
      debug('prebuilding consolidation transaction: %O', whitelistedParams);

      if (params.reqId) {
        self.bitgo.setRequestTracer(params.reqId);
      }

      // this could return 100 build transactions
      const buildResponse = (yield self.bitgo.post(self.baseCoin.url('/wallet/' + self.id() + '/consolidateAccount/build'))
        .send(whitelistedParams)
        .result()) as any;

      // we need to step over each prebuild now - should be in an array in the body
      const consolidations:TransactionPrebuild[] = [];
      for (const consolidateAccountBuild of buildResponse) {
        let prebuild: TransactionPrebuild = (yield self.baseCoin.postProcessPrebuild(
          Object.assign(consolidateAccountBuild, { wallet: self, buildParams: whitelistedParams })
        )) as any;

        delete prebuild.wallet;
        delete prebuild.buildParams;

        prebuild = _.extend({}, prebuild, { walletId: self.id() });
        debug('final consolidation transaction prebuild: %O', prebuild);

        consolidations.push(prebuild);
      }

      return consolidations;
    }).call(this).asCallback(callback);
  }

  /**
   * Builds and sends a set of consolidation transactions for a wallet.
   * @param params
   *     prebuildTx   - this is the pre-build consolidation tx. this is a normally built tx with
   *                    an additional parameter of consolidateId.
   *     verification - normal keychains, etc. for verification
   */
  sendAccountConsolidation(params: PrebuildAndSignTransactionOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co<any>(function *() {
      if (!self.baseCoin.allowsAccountConsolidations()) {
        throw new Error(`${self.baseCoin.getFullName()} does not allow account consolidations.`);
      }

      // one of a set of consolidation transactions
      if (typeof params.prebuildTx === 'string' || params.prebuildTx === undefined) {
        throw new Error('Invalid build of account consolidation.');
      }

      if (!params.prebuildTx.consolidateId) {
        throw new Error('Failed to find consolidation id on consolidation transaction.');
      }

      const signedPrebuild = (yield self.prebuildAndSignTransaction(params)) as any;

      // decorate with our consolidation id
      signedPrebuild.consolidateId = params.prebuildTx.consolidateId;

      delete signedPrebuild.wallet;

      return yield self.submitTransaction(signedPrebuild);
    }).call(this).asCallback(callback);
  }

  /**
   * Builds and sends a set of account consolidations. This is intended to flush many balances to the root wallet balance.
   * @param params -
   *     consolidateAddresses - these are the on-chain receive addresses we want to pick a consolidation amount from
   * @param callback
   */
  sendAccountConsolidations(params: BuildConsolidationTransactionOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co<any>(function *() {
      if (!self.baseCoin.allowsAccountConsolidations()) {
        throw new Error(`${self.baseCoin.getFullName()} does not allow account consolidations.`);
      }

      // this gives us a set of account consolidation transactions
      const unsignedBuilds = (yield self.buildAccountConsolidations(params)) as any;
      if (unsignedBuilds && unsignedBuilds.length > 0) {
        const successfulTxs: any[] = [];
        const failedTxs = new Array<Error>();
        for (const unsignedBuild of unsignedBuilds) {
          // fold any of the parameters we used to build this transaction into the unsignedBuild
          const unsignedBuildWithOptions: PrebuildAndSignTransactionOptions = Object.assign({}, params);
          unsignedBuildWithOptions.prebuildTx = unsignedBuild;
          try {
            const sendTx = yield self.sendAccountConsolidation(unsignedBuildWithOptions);
            successfulTxs.push(sendTx);
          } catch (e) {
            console.dir(e);
            failedTxs.push(e);
          }
        }

        return {
          success: successfulTxs,
          failure: failedTxs,
        };
      }
    }).call(this).asCallback(callback);
  }
}
