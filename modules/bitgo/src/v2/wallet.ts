/**
 * @prettier
 */

import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as debugLib from 'debug';

import { makeRandomKey } from '../bitcoin';
import { BitGo } from '../bitgo';
import { common } from '@bitgo/sdk-core';
import { AddressGenerationError, MethodNotImplementedError } from '../errors';
import {
  BaseCoin,
  SignedTransaction,
  SignedTransactionRequest,
  TransactionPrebuild,
  VerificationOptions,
  VerifyAddressOptions,
} from './baseCoin';
import { Eth } from './coins';
import * as internal from './internal/internal';
import { drawKeycard } from './internal/keycard';
import { Keychain } from './keychains';
import { TradingAccount } from './trading/tradingAccount';
import { PendingApproval, PendingApprovalData } from './pendingApproval';
import { RequestTracer } from './internal/util';
import { getSharedSecret } from '../ecdh';
import { TssUtils, TxRequest } from './internal/tssUtils';

const debug = debugLib('bitgo:v2:wallet');

type ManageUnspents = 'consolidate' | 'fanout';

export interface MaximumSpendableOptions {
  minValue?: number | string;
  maxValue?: number | string;
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
  maxFeeRate?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  targetWalletUnspents?: number;
  minValue?: number;
  maxValue?: number;
  sequenceId?: string;
  lastLedgerSequence?: number;
  ledgerSequenceDelta?: number;
  gasPrice?: number;
  noSplitChange?: boolean;
  unspents?: any[];
  changeAddress?: string;
  type?: string;
  closeRemainderTo?: string;
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
  idfSignedTimestamp?: string;
  idfUserId?: string;
  idfVersion?: number;
  comment?: string;
  [index: string]: unknown;
  tokenName?: string;
  nonce?: string;
}

export interface PrebuildAndSignTransactionOptions extends PrebuildTransactionOptions, WalletSignTransactionOptions {
  prebuildTx?: string | PrebuildTransactionResult;
  verification?: VerificationOptions;
}

export interface PrebuildTransactionResult extends TransactionPrebuild {
  walletId: string;
  // Consolidate ID is used for consolidate account transactions and indicates if this is
  // a consolidation and what consolidate group it should be referenced by.
  consolidateId?: string;
  consolidationDetails?: {
    senderAddressIndex: number;
  };
  feeInfo?: {
    fee?: number;
    feeString?: string;
  };
}

export interface CustomSigningFunction {
  (params: { coin: BaseCoin; txPrebuild: TransactionPrebuild; pubs?: string[] }): Promise<SignedTransaction>;
}

export interface WalletSignTransactionOptions {
  reqId?: RequestTracer;
  txPrebuild?: TransactionPrebuild;
  prv?: string;
  pubs?: string[];
  cosignerPub?: string;
  isLastSignature?: boolean;
  customSigningFunction?: CustomSigningFunction;
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
  allTokens?: boolean;
  searchLabel?: string;
  address?: string[] | string;
  dateGte?: string;
  dateLt?: string;
  valueGte?: number;
  valueLt?: number;
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

export interface ConsolidateUnspentsOptions extends WalletSignTransactionOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number;
  maxValue?: number;
  minHeight?: number;
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

export interface FanoutUnspentsOptions extends WalletSignTransactionOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number;
  maxValue?: number;
  minHeight?: number;
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

export interface DeployForwardersOptions {
  address?: string;
  id?: string;
}

export interface FlushForwarderTokenOptions {
  address?: string;
  id?: string;
  tokenName: string;
  gasPrice?: number;
  eip1559?: {
    maxPriorityFeePerGas: number;
    maxFeePerGas: number;
  };
}

export interface CreateAddressOptions {
  chain?: number;
  gasPrice?: number | string;
  count?: number;
  label?: string;
  lowPriority?: boolean;
  forwarderVersion?: number;
  format?: 'base58' | 'cashaddr';
  baseAddress?: string;
  allowSkipVerifyAddress?: boolean;
  derivedAddress?: string;
  index?: number;
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
    // In the context of wallet sharing, pub can represent one of:
    // pub (independant multi sig), commonPub (bls), or commonPub portion of commonKeychain (TSS)
    pub?: string;
    encryptedPrv?: string;
    fromPubKey?: string;
    toPubKey?: string;
    path?: string;
  };
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
  halfSigned?: {
    txHex?: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
    payload?: string;
    txBase64?: string;
  };
  comment?: string;
  txRequestId?: string;
}

export interface SendOptions {
  address?: string;
  amount?: number | string;
  data?: string;
  feeLimit?: string;
  message?: string;
  walletPassphrase?: string;
  prv?: string;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  custodianTransactionId?: string;
  [index: string]: unknown;
  tokenName?: string;
}

export interface SendManyOptions extends PrebuildAndSignTransactionOptions {
  reqId?: RequestTracer;
  recipients?: {
    address: string;
    amount: string | number;
    feeLimit?: string;
    data?: string;
    tokenName?: string;
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
  sequenceId?: string;
  lastLedgerSequence?: number;
  ledgerSequenceDelta?: number;
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

type WalletType = 'backing' | 'cold' | 'custodial' | 'custodialPaired' | 'hot' | 'trading';

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
  multisigType: 'onchain' | 'tss';
  type?: WalletType;
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

// #endregion

export class Wallet {
  public readonly bitgo: BitGo;
  public readonly baseCoin: BaseCoin;
  private _wallet: WalletData;
  private readonly tssUtils: TssUtils;
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
    this.tssUtils = new TssUtils(bitgo, baseCoin, this);
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
      'addressType',
      'changeAddress',
      'consolidateAddresses',
      'cpfpFeeRate',
      'cpfpTxIds',
      'enforceMinConfirmsForChange',
      'feeRate',
      'gasLimit',
      'gasPrice',
      'idfSignedTimestamp',
      'idfUserId',
      'idfVersion',
      'instant',
      'lastLedgerSequence',
      'ledgerSequenceDelta',
      'maxFee',
      'maxFeeRate',
      'maxValue',
      'memo',
      'transferId',
      'message',
      'minConfirms',
      'minValue',
      'noSplitChange',
      'numBlocks',
      'nonce',
      'recipients',
      'reservation',
      'sequenceId',
      'strategy',
      'targetWalletUnspents',
      'trustlines',
      'type',
      'unspents',
      'nonParticipation',
      'validFromBlock',
      'validToBlock',
      'messageKey',
      'stakingOptions',
      'eip1559',
      'keyregTxBase64',
      'closeRemainderTo',
      'tokenName',
      // param to set emergency flag on a custodial transaction.
      // This transaction should be performed in less than 1 hour or it will fail.
      'emergency',
    ];
  }

  /**
   * This is a strict sub-set of prebuildWhitelistedParams
   */
  prebuildConsolidateAccountParams(): string[] {
    return ['consolidateAddresses', 'feeRate', 'maxFeeRate', 'memo', 'validFromBlock', 'validToBlock'];
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
   * @returns {Wallet}
   */
  async refresh(params: Record<string, never> = {}): Promise<Wallet> {
    this._wallet = await this.bitgo.get(this.url()).result();
    return this;
  }

  /**
   * List the transactions for a given wallet
   * @param params
   * @returns {*}
   */
  async transactions(params: PaginationOptions = {}): Promise<any> {
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

    return await this.bitgo
      .get(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx'))
      .query(query)
      .result();
  }

  /**
   * List the transactions for a given wallet
   * @param params
   *  - txHash the transaction hash to search for
   * @returns {*}
   */
  async getTransaction(params: GetTransactionOptions = {}): Promise<any> {
    common.validateParams(params, ['txHash'], []);

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

    return await this.bitgo
      .get(this.url('/tx/' + params.txHash))
      .query(query)
      .result();
  }

  /**
   * List the transfers for a given wallet
   * @param params
   * @returns {*}
   */
  async transfers(params: TransfersOptions = {}): Promise<any> {
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
        params.address.forEach((address) => {
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
        params.state.forEach((state) => {
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

    return await this.bitgo.get(this.url('/transfer')).query(query).result();
  }

  /**
   * Get transfers on this wallet
   * @param params
   */
  async getTransfer(params: GetTransferOptions = {}): Promise<any> {
    common.validateParams(params, ['id'], []);
    return await this.bitgo.get(this.url('/transfer/' + params.id)).result();
  }

  /**
   * Get a transaction by sequence id for a given wallet
   * @param params
   */
  async transferBySequenceId(params: TransferBySequenceIdOptions = {}): Promise<any> {
    common.validateParams(params, ['sequenceId'], []);
    return await this.bitgo.get(this.url('/transfer/sequenceId/' + params.sequenceId)).result();
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
   * @returns {{maximumSpendable: Number, coin: String}}
   * NOTE : feeTxConfirmTarget omitted on purpose because gauging the maximum spendable amount with dynamic fees does not make sense
   */
  async maximumSpendable(params: MaximumSpendableOptions = {}): Promise<MaximumSpendable> {
    const filteredParams = _.pick(params, [
      'enforceMinConfirmsForChange',
      'feeRate',
      'limit',
      'maxFeeRate',
      'maxValue',
      'minConfirms',
      'minHeight',
      'minValue',
      'plainTarget',
      'recipientAddress',
      'target',
    ]);

    return await this.bitgo.get(this.url('/maximumSpendable')).query(filteredParams).result();
  }

  /**
   * List the unspents for a given wallet
   * @param params
   * @returns {*}
   */
  async unspents(params: UnspentsOptions = {}): Promise<any> {
    const query = _.pick(params, [
      'chains',
      'limit',
      'maxValue',
      'minConfirms',
      'minHeight',
      'minValue',
      'prevId',
      'segwit',
      'target',
    ]);

    return this.bitgo.get(this.url('/unspents')).query(query).result();
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
   */
  private async manageUnspents(
    routeName: ManageUnspents,
    params: ConsolidateUnspentsOptions | FanoutUnspentsOptions = {}
  ): Promise<any> {
    common.validateParams(params, [], ['walletPassphrase', 'xprv']);

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
    this.bitgo.setRequestTracer(reqId);
    const response = await this.bitgo
      .post(this.url(`/${routeName}Unspents`))
      .send(filteredParams)
      .result();

    const keychains = (await this.baseCoin
      .keychains()
      .getKeysForSigning({ wallet: this, reqId })) as unknown as Keychain[];

    const transactionParams = {
      ...params,
      txPrebuild: response,
      keychain: keychains[0],
      pubs: keychains.map((k) => k.pub),
    };
    const signedTransaction = await this.signTransaction(transactionParams);
    const selectParams = _.pick(params, ['comment', 'otp']);
    const finalTxParams = _.extend({}, signedTransaction, selectParams, { type: routeName });

    this.bitgo.setRequestTracer(reqId);
    return this.bitgo
      .post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/send'))
      .send(finalTxParams)
      .result();
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
   */
  async consolidateUnspents(params: ConsolidateUnspentsOptions = {}): Promise<any> {
    return this.manageUnspents('consolidate', params);
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
   */
  async fanoutUnspents(params: FanoutUnspentsOptions = {}): Promise<any> {
    return this.manageUnspents('fanout', params);
  }

  /**
   * Set the token flush thresholds for the wallet. Updates the wallet.
   * Tokens will only be flushed from forwarder contracts if the balance is greater than the threshold defined here.
   * @param thresholds {Object} - pairs of { [tokenName]: threshold } (base units)
   */
  async updateTokenFlushThresholds(thresholds: any = {}): Promise<any> {
    if (this.baseCoin.getFamily() !== 'eth') {
      throw new Error('not supported for this wallet');
    }

    this._wallet = await this.bitgo
      .put(this.url())
      .send({
        tokenFlushThresholds: thresholds,
      })
      .result();
  }
  /**
     * Updates the wallet. Sets flags for deployForwardersManually and flushForwardersManually of the wallet.
     * @param forwarderFlags {Object} - {
       "coinSpecific": {
         [coinName]: {
           "deployForwardersManually": {Boolean},
           "flushForwardersManually": {Boolean}
         }
       }
     }
     */
  async updateForwarders(forwarderFlags: any = {}): Promise<any> {
    if (this.baseCoin.getFamily() !== 'eth') {
      throw new Error('not supported for this wallet');
    }
    this._wallet = await this.bitgo.put(this.url()).send(forwarderFlags).result();
  }

  /**
   * To manually deploy an ETH address
   *
   * @param {Object} params - parameters object
   * @param {String} [params.address] - addressId
   * @param {String} [params.id] - addressId could be received also as id
   * @returns {Object} Http response
   */
  async deployForwarders(params: DeployForwardersOptions): Promise<any> {
    if (_.isUndefined(params.address) && _.isUndefined(params.id)) {
      throw new Error('address or id of address required');
    }
    let query;
    if (params.address) {
      query = params.address;
    } else {
      query = params.id;
    }
    const url = this.url(`/address/${encodeURIComponent(query)}/deployment`);
    this._wallet = await this.bitgo.post(url).send(params).result();
    return this._wallet;
  }

  /**
   * To manually forward tokens from an ETH or CELO address
   *
   * @param {Object} params - parameters object
   * @param {String} params.tokenName - Name of token that needs to be forwarded from the address
   * @param {String} [params.address] -
   * @param {String} [params.address] - addressId
   * @param {String} [params.id] - addressId could be received also as id
   * @param {String} [params.gasPrice] - Explicit gas price to use when forwarding token from the forwarder contract (ETH and Celo only). If not given, defaults to the current estimated network gas price.
   * @param {String} [params.eip1559] - Specify eip1559 fee parameters in token forwarding transaction.
   * @returns {Object} Http response
   */
  async flushForwarderToken(params: FlushForwarderTokenOptions): Promise<any> {
    if (_.isUndefined(params.address) && _.isUndefined(params.id)) {
      throw new Error('address or id of address required');
    }
    let query;
    if (params.address) {
      query = params.address;
    } else {
      query = params.id;
    }
    const url = this.url(`/address/${encodeURIComponent(query)}/tokenforward`);
    this._wallet = await this.bitgo.post(url).send(params).result();
    return this._wallet;
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
   * @returns txHex {String} the txHex of the signed transaction
   */
  async sweep(params: SweepOptions = {}): Promise<any> {
    params = params || {};
    common.validateParams(params, ['address'], ['walletPassphrase', 'xprv', 'otp']);

    // The sweep API endpoint is only available to utxo-based coins

    if (!this.baseCoin.sweepWithSendMany()) {
      if (this.confirmedBalanceString() !== this.balanceString()) {
        throw new Error(
          'cannot sweep when unconfirmed funds exist on the wallet, please wait until all inbound transactions confirm'
        );
      }

      const value = this.spendableBalanceString();
      if (_.isUndefined(value) || value === '0') {
        throw new Error('no funds to sweep');
      }
      (params as any).recipients = [
        {
          address: params.address,
          amount: value,
        },
      ];

      return this.sendMany(params);
    }
    // the following flow works for all UTXO coins

    const reqId = new RequestTracer();
    const filteredParams = _.pick(params, [
      'address',
      'feeRate',
      'maxFeeRate',
      'feeTxConfirmTarget',
      'allowPartialSweep',
    ]);
    this.bitgo.setRequestTracer(reqId);
    const response = await this.bitgo.post(this.url('/sweepWallet')).send(filteredParams).result();

    // TODO(BG-3588): add txHex validation to protect man in the middle attacks replacing the txHex

    const keychains = (await this.baseCoin.keychains().getKeysForSigning({ wallet: this, reqId })) as any;

    const transactionParams = {
      ...params,
      txPrebuild: response,
      keychain: keychains[0],
      userKeychain: keychains[0],
      backupKeychain: keychains.length > 1 ? keychains[1] : null,
      bitgoKeychain: keychains.length > 2 ? keychains[2] : null,
      prv: params.xprv,
    };
    const signedTransaction = await this.signTransaction(transactionParams);

    const selectParams = _.pick(params, ['otp']);
    const finalTxParams = _.extend({}, signedTransaction, selectParams);
    this.bitgo.setRequestTracer(reqId);
    return this.bitgo
      .post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/send'))
      .send(finalTxParams)
      .result();
  }

  /**
   * Freeze a given wallet
   * @param params
   * @returns {*}
   */
  async freeze(params: FreezeOptions = {}): Promise<any> {
    common.validateParams(params, [], []);

    if (params.duration) {
      if (!_.isNumber(params.duration)) {
        throw new Error('invalid duration: should be number of seconds');
      }
    }

    return await this.bitgo.post(this.url('/freeze')).send(params).result();
  }

  /**
   * Update comment of a transfer
   * @param params
   * @returns {*}
   */
  async transferComment(params: TransferCommentOptions = {}): Promise<any> {
    common.validateParams(params, ['id'], ['comment']);

    return await this.bitgo
      .post(this.baseCoin.url('/wallet/' + this._wallet.id + '/transfer/' + params.id + '/comment'))
      .send(params)
      .result();
  }

  /**
   * List the addresses for a given wallet
   * @param params
   * @returns {*}
   */
  async addresses(params: AddressesOptions = {}): Promise<any> {
    common.validateParams(params, [], []);

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

    return this.bitgo
      .get(this.baseCoin.url('/wallet/' + this._wallet.id + '/addresses'))
      .query(query)
      .result();
  }

  /**
   * Get a single wallet address by its id
   * @param params
   * @returns {*}
   */
  async getAddress(params: GetAddressOptions = {}): Promise<any> {
    common.validateParams(params, [], ['address', 'id']);
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

    return this.bitgo
      .get(this.baseCoin.url(`/wallet/${this._wallet.id}/address/${encodeURIComponent(query)}`))
      .result();
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
   * @param {String} params.baseAddress base address of the wallet(optional parameter)
   * @param {Boolean} params.allowSkipVerifyAddress When set to false, it throws error if address verification is skipped for any reason. Default is true.
   * @param {String} [params.derivedAddress]  Derived address
   * @param {Number} [params.index] Index of the derived address
   * @param {String} [params.passphrase] passphrase
   * Address verification can be skipped when forwarderVersion is 0 and pendingChainInitialization is true OR
   * if 'coinSpecific' is not part of the response from api call to create address
   */
  async createAddress(params: CreateAddressOptions = {}): Promise<any> {
    const addressParams: CreateAddressOptions = {};
    const reqId = new RequestTracer();

    const {
      chain,
      gasPrice,
      label,
      lowPriority,
      forwarderVersion,
      format,
      count = 1,
      baseAddress,
      allowSkipVerifyAddress = true,
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

    if (!_.isUndefined(baseAddress)) {
      if (!_.isString(baseAddress)) {
        throw new Error('baseAddress has to be a string');
      }
    }

    if (!_.isUndefined(allowSkipVerifyAddress)) {
      if (!_.isBoolean(allowSkipVerifyAddress)) {
        throw new Error('allowSkipVerifyAddress has to be a boolean');
      }
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

    if (!_.isUndefined(format)) {
      if (!_.isString(format)) {
        throw new Error('format has to be a string');
      }
      addressParams.format = format;
    }

    // get keychains for address verification
    const keychains = await Promise.all(this._wallet.keys.map((k) => this.baseCoin.keychains().get({ id: k, reqId })));
    const rootAddress = _.get(this._wallet, 'receiveAddress.address');

    const newAddresses = _.times(count, async () => {
      this.bitgo.setRequestTracer(reqId);
      const newAddress = (await this.bitgo
        .post(this.baseCoin.url('/wallet/' + this._wallet.id + '/address'))
        .send(addressParams)
        .result()) as any;

      // infer its address type
      if (_.isObject(newAddress.coinSpecific)) {
        // need dynamic import to break circular dependency, this is ugly
        const { AbstractUtxoCoin } = require('./coins/abstractUtxoCoin');
        newAddress.addressType = AbstractUtxoCoin.inferAddressType(newAddress);
      }

      newAddress.keychains = keychains;
      newAddress.baseAddress = baseAddress ?? _.get(this._wallet, 'coinSpecific.baseAddress');

      const verificationData: VerifyAddressOptions = _.merge({}, newAddress, { rootAddress });

      if (verificationData.error) {
        throw new AddressGenerationError(verificationData.error);
      }

      verificationData.impliedForwarderVersion = forwarderVersion ?? verificationData.coinSpecific?.forwarderVersion;
      // This condition was added in first place because in celo, when verifyAddress method was called on addresses which were having pendingChainInitialization as true, it used to throw some error
      // In case of forwarder version 1 eth addresses, addresses need to be verified even if the pendingChainInitialization flag is true
      if (
        verificationData.coinSpecific &&
        (!verificationData.coinSpecific.pendingChainInitialization || verificationData.impliedForwarderVersion === 1)
      ) {
        // can't verify addresses which are pending chain initialization, as the address is hidden
        let isWalletAddress = false;
        try {
          isWalletAddress = this.baseCoin.isWalletAddress(verificationData);
        } catch (e) {
          if (!(e instanceof MethodNotImplementedError)) {
            throw e;
          }
          // FIXME(BG-43225): implement this correctly
          isWalletAddress = true;
        }
        if (!isWalletAddress) {
          throw new Error(`not a wallet address`);
        }
      } else if (!allowSkipVerifyAddress) {
        throw new Error(`address verification skipped for count = ${count}`);
      }

      return newAddress;
    });

    if (newAddresses.length === 1) {
      return newAddresses[0];
    }

    return {
      addresses: await Promise.all(newAddresses),
    };
  }

  /**
   * Update properties on an address
   * @param params
   * @returns {*}
   */
  async updateAddress(params: UpdateAddressOptions = {}): Promise<any> {
    const address = params.address;

    if (!_.isString(address)) {
      throw new Error('missing required string parameter address');
    }

    const putParams = _.pick(params, ['label']);
    const url = this.url('/address/' + encodeURIComponent(address));

    return this.bitgo.put(url).send(putParams).result();
  }

  /**
   * List webhooks on this wallet
   * @param params
   */
  async listWebhooks(params: PaginationOptions = {}): Promise<any> {
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

    return this.bitgo.get(this.url('/webhooks')).query(query).result();
  }

  /**
   * Simulate wallet webhook, currently for webhooks of type transfer and pending approval
   * @param params
   * - webhookId (required) id of the webhook to be simulated
   * - transferId (optional but required for transfer webhooks) id of the simulated transfer
   * - pendingApprovalId (optional but required for pending approval webhooks) id of the simulated pending approval
   * @returns {*}
   */
  async simulateWebhook(params: SimulateWebhookOptions = {}): Promise<any> {
    common.validateParams(params, ['webhookId'], ['transferId', 'pendingApprovalId']);

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
    return this.bitgo
      .post(this.url('/webhooks/' + webhookId + '/simulate'))
      .send(filteredParams)
      .result();
  }

  /**
   * Add a webhook to this wallet
   * @param params
   */
  async addWebhook(params: ModifyWebhookOptions = {}): Promise<any> {
    common.validateParams(params, ['url', 'type'], []);

    return this.bitgo.post(this.url('/webhooks')).send(params).result();
  }

  /**
   * Remove a webhook from this wallet
   * @param params
   */
  async removeWebhook(params: ModifyWebhookOptions = {}): Promise<any> {
    common.validateParams(params, ['url', 'type'], []);

    return this.bitgo.del(this.url('/webhooks')).send(params).result();
  }

  /**
   * Gets the user key chain for this wallet
   *
   * The user key chain is the first keychain of the wallet and usually has the encrypted prv stored on BitGo.
   * Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
   * @param params
   */
  async getEncryptedUserKeychain(params: Record<string, never> = {}): Promise<{ encryptedPrv: string }> {
    const tryKeyChain = async (index: number): Promise<{ encryptedPrv: string }> => {
      if (!this._wallet.keys || index >= this._wallet.keys.length) {
        throw new Error('No encrypted keychains on this wallet.');
      }

      const params = { id: this._wallet.keys[index] };

      const keychain = await this.baseCoin.keychains().get(params);
      // If we find the prv, then this is probably the user keychain we're looking for
      if (keychain.encryptedPrv) {
        return keychain as { encryptedPrv: string };
      }
      return tryKeyChain(index + 1);
    };

    return tryKeyChain(0);
  }

  /**
   * Gets the unencrypted private key for this wallet (be careful!)
   * Requires wallet passphrase
   *
   * @param params
   */
  async getPrv(params: GetPrvOptions = {}): Promise<any> {
    common.validateParams(params, [], ['walletPassphrase', 'prv']);

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

    const userKeychain = (await this.getEncryptedUserKeychain()) as any;
    const userEncryptedPrv = userKeychain.encryptedPrv;

    let userPrv;
    try {
      userPrv = this.bitgo.decrypt({ input: userEncryptedPrv, password: params.walletPassphrase });
    } catch (e) {
      throw new Error('error decrypting wallet passphrase');
    }

    return userPrv;
  }

  /**
   * Send an encrypted wallet share to BitGo.
   * @param params
   */
  async createShare(params: CreateShareOptions = {}): Promise<any> {
    common.validateParams(params, ['user', 'permissions'], []);

    if (params.keychain && !_.isEmpty(params.keychain)) {
      if (
        !params.keychain.pub ||
        !params.keychain.encryptedPrv ||
        !params.keychain.fromPubKey ||
        !params.keychain.toPubKey ||
        !params.keychain.path
      ) {
        throw new Error('requires keychain parameters - pub, encryptedPrv, fromPubKey, toPubKey, path');
      }
    }

    return this.bitgo.post(this.url('/share')).send(params).result();
  }

  /**
   * Share this wallet with another BitGo user.
   * @param params
   * @returns {*}
   */
  async shareWallet(params: ShareWalletOptions = {}): Promise<any> {
    common.validateParams(params, ['email', 'permissions'], ['walletPassphrase', 'message']);

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

    const sharing = (await this.bitgo.getSharingKey({ email: params.email.toLowerCase() })) as any;
    let sharedKeychain;
    if (needsKeychain) {
      try {
        const keychain = (await this.getEncryptedUserKeychain({})) as any;
        // Decrypt the user key with a passphrase
        if (keychain.encryptedPrv) {
          if (!params.walletPassphrase) {
            throw new Error('Missing walletPassphrase argument');
          }
          try {
            keychain.prv = this.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedPrv });
          } catch (e) {
            throw new Error('Unable to decrypt user keychain');
          }

          const eckey = makeRandomKey();
          const secret = getSharedSecret(eckey, Buffer.from(sharing.pubkey, 'hex')).toString('hex');
          const newEncryptedPrv = this.bitgo.encrypt({ password: secret, input: keychain.prv });
          // Only one of pub/commonPub/commonKeychain should be present in the keychain
          let pub = keychain.pub ?? keychain.commonPub;
          if (keychain.commonKeychain) {
            pub = TssUtils.getPublicKeyFromCommonKeychain(keychain.commonKeychain);
          }
          sharedKeychain = {
            pub,
            encryptedPrv: newEncryptedPrv,
            fromPubKey: eckey.publicKey.toString('hex'),
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

    return await this.createShare(options);
  }

  /**
   * Remove user from wallet
   * @param params
   * - userId Id of the user to remove
   * @return {*}
   */
  async removeUser(params: RemoveUserOptions = {}): Promise<any> {
    common.validateParams(params, ['userId'], []);

    const userId = params.userId;
    return await this.bitgo.del(this.url('/user/' + userId)).result();
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
   * @param {Number} params.ledgerSequenceDelta - Relative ledger height (in relation to the current ledger) that the transaction should be accepted in, whereafter it will be rejected.
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
   * @returns {*}
   */
  async prebuildTransaction(params: PrebuildTransactionOptions = {}): Promise<PrebuildTransactionResult> {
    if (this._wallet.multisigType === 'tss') {
      return this.prebuildTransactionTss(params);
    }

    // Whitelist params to build tx
    const whitelistedParams = _.pick(params, this.prebuildWhitelistedParams());
    debug('prebuilding transaction: %O', whitelistedParams);

    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }
    const extraParams = await this.baseCoin.getExtraPrebuildParams(Object.assign(params, { wallet: this }));
    Object.assign(whitelistedParams, extraParams);
    const queryParams = {
      offlineVerification: params.offlineVerification ? true : undefined,
    };

    const buildQuery = this.bitgo
      .post(this.baseCoin.url('/wallet/' + this.id() + '/tx/build'))
      .query(queryParams)
      .send(whitelistedParams)
      .result();

    const blockHeightQuery = _.isFunction((this.baseCoin as any).getLatestBlockHeight)
      ? (this.baseCoin as any).getLatestBlockHeight(params.reqId)
      : Promise.resolve(undefined);
    const queries = [buildQuery, blockHeightQuery];
    const [buildResponse, blockHeight] = (await Promise.all(queries)) as any;
    debug('postprocessing transaction prebuild: %O', buildResponse);
    if (!_.isUndefined(blockHeight)) {
      buildResponse.blockHeight = blockHeight;
    }
    let prebuild: TransactionPrebuild = (await this.baseCoin.postProcessPrebuild(
      Object.assign(buildResponse, { wallet: this, buildParams: whitelistedParams })
    )) as any;
    delete prebuild.wallet;
    delete prebuild.buildParams;
    prebuild = _.extend({}, prebuild, { walletId: this.id() });
    if (this._wallet && this._wallet.coinSpecific && !params.walletContractAddress) {
      prebuild = _.extend({}, prebuild, { walletContractAddress: this._wallet.coinSpecific.baseAddress });
    }
    debug('final transaction prebuild: %O', prebuild);
    return prebuild as PrebuildTransactionResult;
  }

  /**
   * Sign a transaction
   * @param params
   * - txPrebuild
   * - [keychain / key] (object) or prv (string)
   * - walletPassphrase
   * @return {*}
   */
  async signTransaction(params: WalletSignTransactionOptions = {}): Promise<SignedTransaction> {
    const { txPrebuild } = params;
    if (!txPrebuild || typeof txPrebuild !== 'object') {
      throw new Error('txPrebuild must be an object');
    }

    const presign = await this.baseCoin.presignTransaction({
      ...params,
      walletData: this._wallet,
      tssUtils: this.tssUtils,
    });

    if (this._wallet.multisigType === 'tss') {
      return this.signTransactionTss({ ...presign, prv: this.getUserPrv(presign as GetUserPrvOptions) });
    }

    let { pubs } = params;
    if (!pubs && this.baseCoin.keyIdsForSigning().length > 1) {
      const keychains = await this.baseCoin.keychains().getKeysForSigning({ wallet: this });
      pubs = keychains.map((k) => k.pub);
    }

    const signTransactionParams = {
      ...presign,
      txPrebuild,
      pubs,
      coin: this.baseCoin,
    };

    if (_.isFunction(params.customSigningFunction)) {
      return params.customSigningFunction(signTransactionParams);
    }
    return this.baseCoin.signTransaction({
      ...signTransactionParams,
      prv: this.getUserPrv(presign as GetUserPrvOptions),
    });
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
   */
  async prebuildAndSignTransaction(params: PrebuildAndSignTransactionOptions = {}): Promise<SignedTransaction> {
    if (params.eip1559 && params.gasPrice) {
      const error: any = new Error('Only one of params.eip1559 and params.gasPrice may be specified');
      error.code = 'both_gasPrice_and_eip1559gasModel_specified';
      throw error;
    }

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

    if (_.isArray(this._permissions) && !this._permissions.includes('spend')) {
      const error: any = new Error('no spend permission on this wallet');
      error.code = 'user_not_allowed_to_spend_from_wallet';
      throw error;
    }

    // call prebuildTransaction and keychains-get in parallel
    // the prebuild can be overridden by providing an explicit tx
    const txPrebuildQuery = params.prebuildTx ? Promise.resolve(params.prebuildTx) : this.prebuildTransaction(params);

    const keychains = await this.baseCoin.keychains().getKeysForSigning({ wallet: this, reqId: params.reqId });

    const txPrebuild = (await txPrebuildQuery) as PrebuildTransactionResult;

    try {
      await this.baseCoin.verifyTransaction({
        txParams: txPrebuild.buildParams || params,
        txPrebuild,
        wallet: this,
        verification: params.verification ?? {},
        reqId: params.reqId,
      });
    } catch (e) {
      console.error('transaction prebuild failed local validation:', e.message);
      console.error(
        'transaction params:',
        _.omit(params, ['keychain', 'prv', 'passphrase', 'walletPassphrase', 'key', 'wallet'])
      );
      console.error('transaction prebuild:', txPrebuild);
      console.trace(e);
      throw e;
    }
    // pass our three keys
    const signingParams = {
      ...params,
      txPrebuild: txPrebuild,
      wallet: {
        // this is the version of the multisig address at wallet creation time
        addressVersion: this._wallet.coinSpecific.addressVersion,
      },
      keychain: keychains[0],
      backupKeychain: keychains.length > 1 ? keychains[1] : null,
      bitgoKeychain: keychains.length > 2 ? keychains[2] : null,
      pubs: keychains.map((k) => k.pub),
      reqId: params.reqId,
    };

    try {
      return await this.signTransaction(signingParams);
    } catch (error) {
      if (error.message.includes('insufficient funds')) {
        error.code = 'insufficient_funds';
        error.walletBalances = {
          balanceString: this.balanceString(),
          confirmedBalanceString: this.confirmedBalanceString(),
          spendableBalanceString: this.spendableBalanceString(),
          balance: this.balance(),
          confirmedBalance: this.confirmedBalance(),
          spendableBalance: this.spendableBalance(),
        };
        error.txParams = _.omit(params, ['keychain', 'prv', 'passphrase', 'walletPassphrase', 'key']);
      }
      throw error;
    }
  }

  /**
   * Accelerate a transaction's confirmation using Child-Pays-For-Parent (CPFP)
   * @param params
   */
  async accelerateTransaction(params: AccelerateTransactionOptions = {}): Promise<any> {
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
    const submitParams = Object.assign(params, await this.prebuildAndSignTransaction(params));
    delete (submitParams as any).wallet;
    return await this.submitTransaction(submitParams);
  }

  /**
   * Submit a half-signed transaction to BitGo
   * @param params
   * - txHex: transaction hex to submit
   * - halfSigned: object containing transaction (txHex or txBase64) to submit
   */
  async submitTransaction(params: SubmitTransactionOptions = {}): Promise<any> {
    common.validateParams(params, [], ['otp', 'txHex', 'txRequestId']);
    const hasTxHex = !!params.txHex;
    const hasHalfSigned = !!params.halfSigned;

    if (params.txRequestId && (hasTxHex || hasHalfSigned)) {
      throw new Error('must supply exactly one of txRequestId, txHex, or halfSigned');
    } else if (!params.txRequestId && ((hasTxHex && hasHalfSigned) || (!hasTxHex && !hasHalfSigned))) {
      throw new Error('must supply either txHex or halfSigned, but not both');
    }

    return this.bitgo
      .post(this.baseCoin.url('/wallet/' + this.id() + '/tx/send'))
      .send(params)
      .result();
  }

  /**
   * Send coins to a recipient
   * @param params
   * @param params.address - the destination address
   * @param params.amount - the amount in satoshis/wei/base value to be sent
   * @param params.message - optional message to attach to transaction
   * @param params.data - [Ethereum Specific] optional data to pass to transaction
   * @param params.custodianTransactionId - [Ethereum/MMI Specific] id of transaction created via metamask
   * @param params.walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
   * @param params.prv - the private key in string form, if walletPassphrase is not available
   * @param params.minConfirms - the minimum confirmation threshold for inputs
   * @param params.enforceMinConfirmsForChange - whether to enforce minConfirms for change inputs
   * @returns {*}
   */
  async send(params: SendOptions = {}): Promise<any> {
    common.validateParams(params, ['address'], ['message', 'data']);

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
    const recipients: SendManyOptions['recipients'] = [
      {
        address: params.address,
        amount: params.amount,
        tokenName: params.tokenName,
      },
    ];

    if (params.data && coin.transactionDataAllowed()) {
      recipients[0].data = params.data;
    }
    const sendManyOptions: SendManyOptions = Object.assign({}, params, { recipients });
    return this.sendMany(sendManyOptions);
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
   * @param {Number} params.ledgerSequenceDelta - Relative ledger height (in relation to the current ledger) that the transaction should be accepted in, whereafter it will be rejected.
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
   * @returns {*}
   */
  async sendMany(params: SendManyOptions = {}): Promise<any> {
    common.validateParams(params, [], ['comment', 'otp']);
    debug('sendMany called');
    const reqId = params.reqId || new RequestTracer();
    params.reqId = reqId;
    this.bitgo.setRequestTracer(reqId);
    const coin = this.baseCoin;
    if (_.isObject(params.recipients)) {
      params.recipients.map(function (recipient) {
        const amount = new BigNumber(recipient.amount);
        if (amount.isNegative()) {
          throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
        }
        if (!coin.valuelessTransferAllowed() && amount.isZero()) {
          throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
        }
      });
    }

    if (this._wallet.multisigType === 'tss') {
      return this.sendManyTss(params);
    }

    const halfSignedTransaction = await this.prebuildAndSignTransaction(params);
    const selectParams = _.pick(params, [
      'recipients',
      'numBlocks',
      'feeRate',
      'maxFeeRate',
      'minConfirms',
      'enforceMinConfirmsForChange',
      'targetWalletUnspents',
      'message',
      'minValue',
      'maxValue',
      'sequenceId',
      'lastLedgerSequence',
      'ledgerSequenceDelta',
      'gasPrice',
      'noSplitChange',
      'unspents',
      'comment',
      'otp',
      'changeAddress',
      'instant',
      'memo',
      'type',
      'trustlines',
      'transferId',
      'stakingOptions',
    ]);
    const finalTxParams = _.extend({}, halfSignedTransaction, selectParams);

    return this.bitgo.post(this.url('/tx/send')).send(finalTxParams).result();
  }

  /**
   * Recover an unsupported token from a BitGo multisig wallet
   * params are validated in Eth.prototype.recoverToken
   * @param params
   * @param params.tokenContractAddress the contract address of the unsupported token
   * @param params.recipient the destination address recovered tokens should be sent to
   * @param params.walletPassphrase the wallet passphrase
   * @param params.prv the xprv
   */
  async recoverToken(params: RecoverTokenOptions = {}): Promise<any> {
    if (this.baseCoin.getFamily() !== 'eth') {
      throw new Error('token recovery only supported for eth wallets');
    }

    const { tokenContractAddress, recipient } = params;

    if (_.isUndefined(tokenContractAddress)) {
      throw new Error('missing required string parameter tokenContractAddress');
    }

    if (_.isUndefined(recipient)) {
      throw new Error('missing required string parameter recipient');
    }

    const recoverTokenOptions = Object.assign({ tokenContractAddress, recipient }, params, { wallet: this });
    return (this.baseCoin as Eth).recoverToken(recoverTokenOptions);
  }

  /**
   * Get transaction metadata for the oldest transaction that is still pending or attempted
   * @param params
   * @returns {Object} Object with txid, walletId, tx, and fee (if supported for coin)
   */
  async getFirstPendingTransaction(params: Record<string, never> = {}): Promise<any> {
    return internal.getFirstPendingTransaction({ walletId: this.id() }, this.baseCoin, this.bitgo);
  }

  /**
   * Change the fee on the pending transaction that corresponds to the given txid to the given new fee
   * @param params
   * @param {String} params.txid The transaction Id corresponding to the transaction whose fee is to be changed
   * @param {String} params.fee The new fee to apply to the denoted transaction
   * @returns {String} The transaction ID of the new transaction that contains the new fee rate
   */
  async changeFee(params: ChangeFeeOptions = {}): Promise<any> {
    common.validateParams(params, ['txid', 'fee'], []);

    return await this.bitgo
      .post(this.baseCoin.url('/wallet/' + this.id() + '/tx/changeFee'))
      .send(params)
      .result();
  }

  /**
   * Fetch info from merchant server
   * @param {Object} params The params passed into the function
   * @param {String} params.url The Url to retrieve info from
   * @returns {Object} The info returned from the merchant server
   * @deprecated
   */
  async getPaymentInfo(params: { url?: string } = {}): Promise<any> {
    params = params || {};
    common.validateParams(params, ['url'], []);

    return await this.bitgo.get(this.url('/paymentInfo')).query(params).result();
  }

  /**
   * Send json payment response
   * @param {Object} params The params passed into the function
   * @param {String} params.paymentUrl - The url to send the fully signed transaction to
   * @param {String} params.txHex - The transaction hex of the payment
   * @param {String} params.memo {String} - A memo supplied by the merchant, to be inserted into the transfer as the comment
   * @param {String} params.expires {String} - ISO Date format of when the payment request expires
   * @returns {Object} The info returned from the merchant server Payment Ack
   * @deprecated
   */
  async sendPaymentResponse(params: any = {}): Promise<any> {
    return await this.bitgo.post(this.url('/sendPayment')).send(params).result();
  }

  /**
   * Create a policy rule
   * @param params
   * @param params.condition condition object
   * @param params.action action object
   * @returns {*}
   */
  async createPolicyRule(params: CreatePolicyRuleOptions = {}): Promise<any> {
    common.validateParams(params, ['id', 'type'], ['message']);

    if (!_.isObject(params.condition)) {
      throw new Error('missing parameter: conditions object');
    }

    if (!_.isObject(params.action)) {
      throw new Error('missing parameter: action object');
    }

    return await this.bitgo.post(this.url('/policy/rule')).send(params).result();
  }

  /**
   * Update a policy rule
   * @param params
   * @param params.condition condition object
   * @param params.action action object
   * @returns {*}
   */
  async setPolicyRule(params: any = {}) {
    common.validateParams(params, ['id', 'type'], ['message']);

    if (!_.isObject(params.condition)) {
      throw new Error('missing parameter: conditions object');
    }

    if (!_.isObject(params.action)) {
      throw new Error('missing parameter: action object');
    }

    return await this.bitgo.put(this.url('/policy/rule')).send(params).result();
  }

  /**
   * Remove Policy Rule
   * @param params
   * @returns {*}
   */
  async removePolicyRule(params: RemovePolicyRuleOptions = {}): Promise<any> {
    common.validateParams(params, ['id'], ['message']);

    return await this.bitgo.del(this.url('/policy/rule')).send(params).result();
  }

  /**
   * Remove this wallet
   * @param params
   * @returns {*}
   */
  async remove(params: Record<string, never> = {}): Promise<any> {
    return this.bitgo.del(this.url()).result();
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
   */
  async buildAccountConsolidations(
    params: BuildConsolidationTransactionOptions = {}
  ): Promise<PrebuildTransactionResult[]> {
    if (!this.baseCoin.allowsAccountConsolidations()) {
      throw new Error(`${this.baseCoin.getFullName()} does not allow account consolidations.`);
    }

    // Whitelist params to build tx
    const whitelistedParams = _.pick(params, this.prebuildConsolidateAccountParams());
    debug('prebuilding consolidation transaction: %O', whitelistedParams);

    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }

    // this could return 100 build transactions
    const buildResponse = (await this.bitgo
      .post(this.baseCoin.url('/wallet/' + this.id() + '/consolidateAccount/build'))
      .send(whitelistedParams)
      .result()) as any;

    // we need to step over each prebuild now - should be in an array in the body
    const consolidations: PrebuildTransactionResult[] = [];
    for (const consolidateAccountBuild of buildResponse) {
      let prebuild: PrebuildTransactionResult = (await this.baseCoin.postProcessPrebuild(
        Object.assign(consolidateAccountBuild, { wallet: this, buildParams: whitelistedParams })
      )) as PrebuildTransactionResult;

      delete prebuild.wallet;
      delete prebuild.buildParams;

      prebuild = _.extend({}, prebuild, { walletId: this.id() });
      debug('final consolidation transaction prebuild: %O', prebuild);

      consolidations.push(prebuild);
    }

    return consolidations;
  }

  /**
   * Builds and sends a set of consolidation transactions for a wallet.
   * @param params
   *     prebuildTx   - this is the pre-build consolidation tx. this is a normally built tx with
   *                    an additional parameter of consolidateId.
   *     verification - normal keychains, etc. for verification
   */
  async sendAccountConsolidation(params: PrebuildAndSignTransactionOptions = {}): Promise<any> {
    if (!this.baseCoin.allowsAccountConsolidations()) {
      throw new Error(`${this.baseCoin.getFullName()} does not allow account consolidations.`);
    }

    // one of a set of consolidation transactions
    if (typeof params.prebuildTx === 'string' || params.prebuildTx === undefined) {
      throw new Error('Invalid build of account consolidation.');
    }

    if (!params.prebuildTx.consolidateId) {
      throw new Error('Failed to find consolidation id on consolidation transaction.');
    }

    if (this._wallet.multisigType === 'tss') {
      if (!params.prebuildTx.txRequestId) {
        throw new Error('Consolidation request missing txRequestId.');
      }

      return await this.sendManyTss(params);
    }

    const signedPrebuild = (await this.prebuildAndSignTransaction(params)) as any;

    // decorate with our consolidation id
    signedPrebuild.consolidateId = params.prebuildTx.consolidateId;

    delete signedPrebuild.wallet;

    return await this.submitTransaction(signedPrebuild);
  }

  /**
   * Builds and sends a set of account consolidations. This is intended to flush many balances to the root wallet balance.
   * @param params -
   *     consolidateAddresses - these are the on-chain receive addresses we want to pick a consolidation amount from
   */
  async sendAccountConsolidations(params: BuildConsolidationTransactionOptions = {}): Promise<any> {
    if (!this.baseCoin.allowsAccountConsolidations()) {
      throw new Error(`${this.baseCoin.getFullName()} does not allow account consolidations.`);
    }

    // this gives us a set of account consolidation transactions
    const unsignedBuilds = (await this.buildAccountConsolidations(params)) as any;
    if (unsignedBuilds && unsignedBuilds.length > 0) {
      const successfulTxs: any[] = [];
      const failedTxs = new Array<Error>();
      for (const unsignedBuild of unsignedBuilds) {
        // fold any of the parameters we used to build this transaction into the unsignedBuild
        const unsignedBuildWithOptions: PrebuildAndSignTransactionOptions = Object.assign({}, params);
        unsignedBuildWithOptions.prebuildTx = unsignedBuild;
        try {
          const sendTx = await this.sendAccountConsolidation(unsignedBuildWithOptions);
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
  }

  /* MARK: TSS Helpers */

  /**
   * Prebuilds a transaction for a TSS wallet.
   *
   * @param params prebuild transaction options
   */
  private async prebuildTransactionTss(params: PrebuildTransactionOptions = {}): Promise<PrebuildTransactionResult> {
    const reqId = params.reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqId);

    let unsignedTxRequest: TxRequest;
    switch (params.type) {
      case 'transfer':
        unsignedTxRequest = await this.tssUtils.prebuildTxWithIntent({
          reqId,
          intentType: 'payment',
          sequenceId: params.sequenceId,
          comment: params.comment,
          recipients: params.recipients || [],
          memo: params.memo,
          nonce: params.nonce,
        });
        break;
      case 'enabletoken':
        unsignedTxRequest = await this.tssUtils.prebuildTxWithIntent({
          reqId,
          intentType: 'createAccount',
          recipients: params.recipients || [],
          tokenName: params.tokenName,
          memo: params.memo,
        });
        break;
      default:
        throw new Error(`transaction type not supported: ${params.type}`);
    }

    const unsignedTxs = unsignedTxRequest.unsignedTxs;
    if (unsignedTxs.length !== 1) {
      throw new Error(`Expected a single unsigned tx for tx request with id: ${unsignedTxRequest.txRequestId}`);
    }

    const whitelistedParams = _.pick(params, this.prebuildWhitelistedParams());
    return {
      walletId: this.id(),
      wallet: this,
      txRequestId: unsignedTxRequest.txRequestId,
      txHex: unsignedTxs[0].serializedTxHex,
      buildParams: whitelistedParams,
      feeInfo: unsignedTxs[0].feeInfo,
    };
  }

  /**
   * Signs a transaction from a TSS wallet.
   *
   * @param params signing options
   */
  private async signTransactionTss(params: WalletSignTransactionOptions = {}): Promise<SignedTransaction> {
    if (!params.txPrebuild) {
      throw new Error('txPrebuild required to sign transactions with TSS');
    }

    if (!params.txPrebuild.txRequestId) {
      throw new Error('txRequestId required to sign transactions with TSS');
    }

    if (!params.prv) {
      throw new Error('prv required to sign transactions with TSS');
    }

    try {
      const signedTxRequest = await this.tssUtils.signTxRequest({
        txRequest: params.txPrebuild.txRequestId,
        prv: params.prv,
        reqId: params.reqId || new RequestTracer(),
      });
      return {
        txRequestId: signedTxRequest.txRequestId,
      };
    } catch (e) {
      throw new Error('failed to sign transaction ' + e);
    }
  }

  /**
   * Builds, signs, and sends a transaction from a TSS wallet.
   *
   * @param params send options
   */
  private async sendManyTss(params: SendManyOptions = {}): Promise<any> {
    const signedTransaction = (await this.prebuildAndSignTransaction(params)) as SignedTransactionRequest;
    if (!signedTransaction.txRequestId) {
      throw new Error('txRequestId missing from signed transaction');
    }

    return this.tssUtils.sendTxRequest(signedTransaction.txRequestId);
  }
}
