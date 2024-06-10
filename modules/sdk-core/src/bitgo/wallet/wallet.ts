/**
 * @prettier
 */
import assert from 'assert';
import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as common from '../../common';
import {
  IBaseCoin,
  NFTTransferOptions,
  SignedMessage,
  SignedTransaction,
  SignedTransactionRequest,
  TransactionPrebuild,
  VerifyAddressOptions,
} from '../baseCoin';
import { makeRandomKey } from '../bitcoin';
import { BitGoBase } from '../bitgoBase';
import { getSharedSecret } from '../ecdh';
import { AddressGenerationError, MethodNotImplementedError } from '../errors';
import * as internal from '../internal/internal';
import { drawKeycard } from '../internal';
import { decryptKeychainPrivateKey, Keychain, KeychainWithEncryptedPrv } from '../keychain';
import { IPendingApproval, PendingApproval, PendingApprovals } from '../pendingApproval';
import { TradingAccount } from '../trading';
import {
  inferAddressType,
  RequestTracer,
  TxRequest,
  EddsaUnsignedTransaction,
  IntentOptionsForMessage,
  IntentOptionsForTypedData,
  RequestType,
} from '../utils';
import {
  AccelerateTransactionOptions,
  AddressesOptions,
  BuildConsolidationTransactionOptions,
  BuildTokenEnablementOptions,
  ChangeFeeOptions,
  ConsolidateUnspentsOptions,
  CreateAddressOptions,
  CreatePolicyRuleOptions,
  CreateShareOptions,
  CrossChainUTXO,
  DeployForwardersOptions,
  DownloadKeycardOptions,
  FanoutUnspentsOptions,
  FetchCrossChainUTXOsOptions,
  FlushForwarderTokenOptions,
  ForwarderBalance,
  ForwarderBalanceOptions,
  FreezeOptions,
  FundForwardersOptions,
  GetAddressOptions,
  GetPrvOptions,
  GetTransactionOptions,
  GetTransferOptions,
  GetUserPrvOptions,
  IWallet,
  MaximumSpendable,
  MaximumSpendableOptions,
  ModifyWebhookOptions,
  NftBalance,
  PaginationOptions,
  PrebuildAndSignTransactionOptions,
  PrebuildTransactionOptions,
  PrebuildTransactionResult,
  RecoverTokenOptions,
  RemovePolicyRuleOptions,
  RemoveUserOptions,
  SendManyOptions,
  SendNFTOptions,
  SendNFTResult,
  SendOptions,
  ShareWalletOptions,
  SimulateWebhookOptions,
  SubmitTransactionOptions,
  SubWalletType,
  SweepOptions,
  TransferBySequenceIdOptions,
  TransferCommentOptions,
  TransfersOptions,
  UnspentsOptions,
  UpdateAddressOptions,
  UpdateBuildDefaultOptions,
  WalletCoinSpecific,
  WalletData,
  WalletEcdsaChallenges,
  WalletSignMessageOptions,
  WalletSignTransactionOptions,
  WalletSignTypedDataOptions,
  WalletType,
} from './iWallet';
import { StakingWallet } from '../staking';
import { Lightning } from '../lightning';
import EddsaUtils from '../utils/tss/eddsa';
import { EcdsaMPCv2Utils, EcdsaUtils } from '../utils/tss/ecdsa';
import { getTxRequest } from '../tss';
import { buildParamKeys, BuildParams } from './BuildParams';
import { postWithCodec } from '../utils/postWithCodec';
import { TxSendBody } from '@bitgo/public-types';
import { AddressBook, IAddressBook } from '../address-book';
import { IRequestTracer } from '../../api';

const debug = require('debug')('bitgo:v2:wallet');

type ManageUnspents = 'consolidate' | 'fanout';

const whitelistedSendParams = TxSendBody.type.types.flatMap((t) => Object.keys(t.props));

export enum ManageUnspentsOptions {
  BUILD_ONLY,
  BUILD_SIGN_SEND,
}

function isPrebuildTransactionResult(
  prebuildTx: string | PrebuildTransactionResult | undefined
): prebuildTx is PrebuildTransactionResult {
  if (!prebuildTx || typeof prebuildTx === 'string') {
    return false;
  }
  return (prebuildTx as PrebuildTransactionResult).walletId !== undefined;
}

export class Wallet implements IWallet {
  public readonly bitgo: BitGoBase;
  public readonly baseCoin: IBaseCoin;
  public _wallet: WalletData;
  private readonly tssUtils: EcdsaUtils | EcdsaMPCv2Utils | EddsaUtils | undefined;
  private readonly _permissions?: string[];

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, walletData: any) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    this._wallet = walletData;
    const userId = _.get(bitgo, '_user.id');
    if (_.isString(userId)) {
      const userDetails = _.find(walletData.users, { user: userId });
      this._permissions = _.get(userDetails, 'permissions');
    }
    if (baseCoin?.supportsTss() && this._wallet.multisigType === 'tss') {
      switch (baseCoin.getMPCAlgorithm()) {
        case 'ecdsa':
          if (walletData.multisigTypeVersion === 'MPCv2') {
            this.tssUtils = new EcdsaMPCv2Utils(bitgo, baseCoin, this);
          } else {
            this.tssUtils = new EcdsaUtils(bitgo, baseCoin, this);
          }
          break;
        case 'eddsa':
          this.tssUtils = new EddsaUtils(bitgo, baseCoin, this);
          break;
        default:
          this.tssUtils = undefined;
      }
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

  /** @deprecated use codec instead: t.exact(BuildParams).encode(v) */
  prebuildWhitelistedParams(): string[] {
    return buildParamKeys;
  }

  /**
   * This is a strict sub-set of prebuildWhitelistedParams
   */
  prebuildConsolidateAccountParams(): string[] {
    return [
      'consolidateAddresses',
      'feeRate',
      'maxFeeRate',
      'memo',
      'validFromBlock',
      'validToBlock',
      'preview',
      'keepAlive',
      'apiVersion',
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

  type(): WalletType | undefined {
    return this._wallet.type;
  }

  multisigType(): 'onchain' | 'tss' {
    return this._wallet.multisigType;
  }

  multisigTypeVersion(): 'MPCv2' | undefined {
    return this._wallet.multisigTypeVersion;
  }

  subType(): SubWalletType | undefined {
    return this._wallet.subType;
  }

  /**
   * Get the label (name) for this wallet
   */
  public label(): string {
    return this._wallet.label;
  }

  public flags(): { name: string; value: string }[] {
    return this._wallet.walletFlags ?? [];
  }

  public flag(name: string): string | undefined {
    return this.flags().find((flag) => flag.name === name)?.value;
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
  pendingApprovals(): IPendingApproval[] {
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
   * Return a list of nft tokens for this wallet. Will always return undefined if the wallet
   * was not initialized with the allTokens flag.
   *
   * @returns {NftBalance[] | undefined}
   */
  nftBalances(): NftBalance[] | undefined {
    if (this._wallet.nfts) {
      return Object.values(this._wallet.nfts).map((nftData) => nftData);
    }
    return undefined;
  }

  /**
   * Return a list of unsupported nft tokens for this wallet. Will always return undefined if the wallet
   * was not initialized with the allTokens flag.
   *
   * @returns {NftBalance[] | undefined}
   */
  unsupportedNftBalances(): NftBalance[] | undefined {
    if (this._wallet.unsupportedNfts) {
      return Object.values(this._wallet.unsupportedNfts).map((nftData) => nftData);
    }
    return undefined;
  }

  /**
   * Returns a list of the wallets nft & unsupported nfts.
   *
   * @returns {NftBalance[]}
   */
  async getNftBalances(): Promise<NftBalance[]> {
    const walletData: Partial<WalletData> = await this.bitgo.get(this.url()).query({ allTokens: true }).result();

    const supportedNfts = walletData?.nfts ? Object.values(walletData.nfts).map((balance) => balance) : [];

    const unsupportedNfts = walletData?.unsupportedNfts
      ? Object.values(walletData.unsupportedNfts).map((balance) => balance)
      : [];
    return [...supportedNfts, ...unsupportedNfts];
  }

  /**
   * List the transactions for a given wallet
   * @param params
   *  - txHash the transaction hash to search for
   * @returns {*}
   */
  async getTransaction(params: GetTransactionOptions = {}): Promise<any> {
    common.validateParams(params, ['txHash'], []);

    const paginatedOptions: PaginationOptions = {};
    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      paginatedOptions.prevId = params.prevId;
    }

    if (!_.isUndefined(params.limit)) {
      if (!_.isInteger(params.limit) || params.limit < 1) {
        throw new Error('invalid limit argument, expecting positive integer');
      }
      paginatedOptions.limit = params.limit;
    }

    const query = paginatedOptions;
    if (params.includeRbf) {
      query['includeRbf'] = params.includeRbf;
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
   * @param {Number | String} params.minValue - the minimum value of unspents to use in satoshis
   * @param {Number | String} params.maxValue - the maximum value of unspents to use in satoshis
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
   * @param {Number | String} params.minValue - the minimum value of unspents to use in satoshis
   * @param {Number | String} params.maxValue - the maximum value of unspents to use in satoshis
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - if true, minConfirms also applies to change outputs
   * @param {Number} params.limit                for routeName === 'consolidate'
   *                 params.maxNumInputsToUse    for routeName === 'fanout'
   *                  - maximum number of unspents you want to use in the transaction
   * Output parameters:
   * @param {Number} params.numUnspentsToMake - the number of new unspents to make
   * @param {Boolean} params.bulk - if set to True, this enables the consolidation of large number of unspents by creating multiple transactions,
   *                                with each transaction composed of 200 unspents, except for the last transaction which may have fewer unspents.
   */
  private async manageUnspents(
    routeName: ManageUnspents,
    params: ConsolidateUnspentsOptions | FanoutUnspentsOptions = {},
    option = ManageUnspentsOptions.BUILD_SIGN_SEND
  ): Promise<unknown> {
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
      'txFormat',
      'bulk',

      routeName === 'consolidate' ? 'limit' : 'maxNumInputsToUse',
      'numUnspentsToMake',
    ]);
    this.bitgo.setRequestTracer(reqId);

    const buildResponse: TransactionPrebuild | TransactionPrebuild[] = await this.bitgo
      .post(this.url(`/${routeName}Unspents`))
      .send(filteredParams)
      .result();

    if (option === ManageUnspentsOptions.BUILD_ONLY) {
      return buildResponse;
    }

    const keychains = (await this.baseCoin
      .keychains()
      .getKeysForSigning({ wallet: this, reqId })) as unknown as Keychain[];

    const transactionParams = {
      ...params,
      keychain: keychains[0],
      pubs: keychains.map((k) => {
        assert(k.pub);
        return k.pub;
      }),
      // Building PSBTs with the bulk flag does not include the previous transaction for non-segwit inputs.
      // Manually override the signing and validating to not fail.
      allowNonSegwitSigningWithoutPrevTx: !!params.bulk,
    };

    const txPrebuilds = Array.isArray(buildResponse) ? buildResponse : [buildResponse];

    const selectParams = _.pick(params, ['comment', 'otp', 'bulk']);

    const response = await Promise.all(
      txPrebuilds.map(async (txPrebuild) => {
        const signedTransaction = await this.signTransaction({ ...transactionParams, txPrebuild });
        const finalTxParams = _.extend({}, signedTransaction, selectParams, { type: routeName });
        this.bitgo.setRequestTracer(reqId);
        return this.sendTransaction(finalTxParams, reqId);
      })
    );

    return Array.isArray(buildResponse) ? response : response[0];
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
   * @param {Number | String} params.minValue - the minimum value of unspents to use in satoshis
   * @param {Number | String} params.maxValue - the maximum value of unspents to use in satoshis
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - if true, minConfirms also applies to change outputs
   * @param {Number} params.limit                for routeName === 'consolidate'
   *                 params.maxNumInputsToUse    for routeName === 'fanout'
   *                  - maximum number of unspents you want to use in the transaction
   * @param {Number} params.numUnspentsToMake - the number of new unspents to make. It is not applicable for if bulk consolidate.
   * @param {Boolean} params.bulk - if set to True, this enables the consolidation of large number of unspents by creating multiple transactions,
   *                                with each transaction composed of 200 unspents, except for the last transaction which may have fewer unspents.
   */
  async consolidateUnspents(
    params: ConsolidateUnspentsOptions = {},
    option = ManageUnspentsOptions.BUILD_SIGN_SEND
  ): Promise<unknown> {
    return this.manageUnspents('consolidate', params, option);
  }

  /**
   * Fanout unspents on a wallet
   *
   * @param {Object} params - parameters object
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.xprv - the private key in string form if the walletPassphrase is not available
   * @param {Number | String} params.minValue - the minimum value of unspents to use
   * @param {Number | String} params.maxValue - the maximum value of unspents to use
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Number} params.maxFeePercentage - the maximum proportion of an unspent you are willing to lose to fees
   * @param {Number} params.feeTxConfirmTarget - estimate the fees to aim for first confirmation with this number of blocks
   * @param {Number} params.feeRate - The desired fee rate for the transaction in satoshis/kB
   * @param {Number} params.maxFeeRate - The max limit for a fee rate in satoshis/kB
   * @param {Number} params.maxNumInputsToUse - the number of unspents you want to use in the transaction
   * @param {Number} params.numUnspentsToMake - the number of new unspents to make
   */
  async fanoutUnspents(params: FanoutUnspentsOptions = {}): Promise<unknown> {
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
      'txFormat',
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
    return this.sendTransaction(finalTxParams, reqId);
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

    if (!_.isNil(params.includeBalances)) {
      if (!_.isBoolean(params.includeBalances)) {
        throw new Error('invalid includeBalances argument, expecting boolean');
      }
      query.includeBalances = params.includeBalances;
    }

    if (!_.isNil(params.includeTokens)) {
      if (!_.isBoolean(params.includeTokens)) {
        throw new Error('invalid includeTokens argument, expecting boolean');
      }
      query.includeTokens = params.includeTokens;
    }

    if (!_.isNil(params.includeTotalAddressCount)) {
      if (!_.isBoolean(params.includeTotalAddressCount)) {
        throw new Error('invalid includeTotalAddressCount argument, expecting boolean');
      }
      query.includeTotalAddressCount = params.includeTotalAddressCount;
    }

    if (params.returnBalancesForToken) {
      if (!_.isString(params.returnBalancesForToken)) {
        throw new Error('invalid returnBalancesForToken argument, expecting string');
      }
      query.returnBalancesForToken = params.returnBalancesForToken;
    }

    if (!_.isNil(params.pendingDeployment)) {
      if (!_.isBoolean(params.pendingDeployment)) {
        throw new Error('invalid pendingDeployment argument, expecting boolean');
      }
      query.pendingDeployment = params.pendingDeployment;
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
   * @param {Number} params.count=1 number of new addresses which should be created (maximum 250)
   * @param {Number} params.forwarderVersion The version of address to create, if applicable
   * @param {Boolean} params.lowPriority Ethereum-specific param to create address using low priority fee address
   * @param {String} params.baseAddress base address of the wallet(optional parameter)
   * @param {Boolean} params.allowSkipVerifyAddress When set to false, it throws error if address verification is skipped for any reason. Default is true.
   * @param {String} params.onToken mandatory in case of the OFC wallet, the name of token to create address for
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
      onToken,
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
      if (!_.isInteger(forwarderVersion) || forwarderVersion < 0 || forwarderVersion > 4) {
        throw new Error('forwarderVersion has to be an integer 0, 1, 2, 3 or 4');
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

    if (this.baseCoin.getFamily() === 'ofc') {
      if (!_.isUndefined(onToken)) {
        if (!_.isString(onToken)) {
          throw new Error('onToken has to be a string');
        }
        addressParams.onToken = onToken;
      } else {
        throw new Error('onToken is a mandatory parameter for OFC wallets');
      }
      if (!_.isString(onToken)) {
        throw new Error('onToken has to be a string');
      }
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
        newAddress.addressType = inferAddressType(newAddress);
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
          isWalletAddress = await this.baseCoin.isWalletAddress(verificationData);
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

  async updateWalletBuildDefaults(params: UpdateBuildDefaultOptions): Promise<unknown> {
    common.validateParams(params, [], ['minFeeRate', 'changeAddressType', 'txFormat']);
    return this.bitgo
      .put(this.url())
      .send({
        buildDefaults: {
          minFeeRate: params.minFeeRate,
          changeAddressType: params.changeAddressType,
          txFormat: params.txFormat,
        },
      })
      .result();
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
   * Gets the user keychain for this wallet
   *
   * The user keychain is the first keychain of the wallet and usually has the encrypted prv stored on BitGo.
   * Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
   */
  async getEncryptedUserKeychain(): Promise<KeychainWithEncryptedPrv> {
    const tryKeyChain = async (index: number): Promise<KeychainWithEncryptedPrv> => {
      if (!this._wallet.keys || index >= this._wallet.keys.length) {
        throw new Error('No encrypted keychains on this wallet.');
      }

      const params = { id: this._wallet.keys[index] };

      const keychain = await this.baseCoin.keychains().get(params);
      // If we find the prv, then this is probably the user keychain we're looking for
      if (keychain.encryptedPrv) {
        return keychain as KeychainWithEncryptedPrv;
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

    const userKeychain = await this.getEncryptedUserKeychain();
    if (!params.walletPassphrase) {
      throw new Error('wallet passphrase was not provided');
    }
    const userPrv = decryptKeychainPrivateKey(this.bitgo, userKeychain, params.walletPassphrase);
    if (!userPrv) {
      throw new Error('error decrypting wallet private key');
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
        const keychain = await this.getEncryptedUserKeychain();
        // Decrypt the user key with a passphrase
        if (keychain.encryptedPrv) {
          if (!params.walletPassphrase) {
            throw new Error('Missing walletPassphrase argument');
          }
          const userPrv = decryptKeychainPrivateKey(this.bitgo, keychain, params.walletPassphrase);
          if (!userPrv) {
            throw new Error('Unable to decrypt user keychain');
          }
          keychain.prv = userPrv;

          const eckey = makeRandomKey();
          const secret = getSharedSecret(eckey, Buffer.from(sharing.pubkey, 'hex')).toString('hex');
          const newEncryptedPrv = this.bitgo.encrypt({ password: secret, input: keychain.prv });
          // Only one of pub/commonPub/commonKeychain should be present in the keychain
          let pub = keychain.pub ?? keychain.commonPub;
          if (keychain.commonKeychain) {
            pub =
              this.baseCoin.getMPCAlgorithm() === 'eddsa'
                ? EddsaUtils.getPublicKeyFromCommonKeychain(keychain.commonKeychain)
                : EcdsaUtils.getPublicKeyFromCommonKeychain(keychain.commonKeychain);
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
      skipKeychain: Object.keys(sharedKeychain ?? {}).length === 0,
      keychain: Object.keys(sharedKeychain ?? {}).length === 0 ? undefined : sharedKeychain,
    };

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
   * @param {Number | String} params.minValue - Ignore unspents smaller than this amount of base units
   * @param {Number | String} params.maxValue - Ignore unspents larger than this amount of base units
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
   * @param {Boolean} params.keepAlive - (Polkadot) keep address alive by sending the address minimum funding amount, used during wallet consolidation, true by default
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
    prebuild = _.extend({}, prebuild, { reqId: params.reqId });
    debug('final transaction prebuild: %O', prebuild);
    return prebuild as PrebuildTransactionResult;
  }

  /**
   * Gets the User Keychain and sign a TSS transaction
   * @param txRequestId The transaction request id
   * @param walletPassphrase The wallet passphrase
   * @return Promise<SignedTransaction>
   */
  async getUserKeyAndSignTssTransaction({
    txRequestId,
    walletPassphrase,
  }: {
    txRequestId: string;
    walletPassphrase: string;
  }): Promise<SignedTransaction> {
    if (this._wallet.multisigType !== 'tss') {
      throw new Error('getUserKeyAndSignTssTransaction is only supported for TSS wallets');
    }
    const reqId = new RequestTracer();
    // Doing a sanity check for password here to avoid doing further work if we know it's wrong
    const keychains = await this.getKeychainsAndValidatePassphrase({ reqId, walletPassphrase });
    const userKeychain = keychains[0];
    if (!userKeychain || !userKeychain.encryptedPrv) {
      throw new Error('the user keychain does not have property encryptedPrv');
    }

    return this.signTransaction({ txPrebuild: { txRequestId }, walletPassphrase, reqId, keychain: userKeychain });
  }

  /**
   * Sign a transaction
   * @param params
   * - txPrebuild
   * - [keychain / key] (object) or prv (string)
   * - walletPassphrase
   * @return {*}
   */
  async signTransaction(params: WalletSignTransactionOptions = {}): Promise<SignedTransaction | TxRequest> {
    const { txPrebuild, apiVersion, txRequestId } = params;

    if (
      _.isFunction(params.customCommitmentGeneratingFunction) &&
      _.isFunction(params.customGShareGeneratingFunction) &&
      _.isFunction(params.customRShareGeneratingFunction)
    ) {
      // invoke external signer TSS for EdDSA workflow
      return this.signTransactionTssExternalSignerEdDSA(params, this.baseCoin);
    }

    if (
      _.isFunction(params.customPaillierModulusGeneratingFunction) &&
      _.isFunction(params.customKShareGeneratingFunction) &&
      _.isFunction(params.customMuDeltaShareGeneratingFunction) &&
      _.isFunction(params.customSShareGeneratingFunction)
    ) {
      // invoke external signer TSS for ECDSA workflow
      return this.signTransactionTssExternalSignerECDSA(this.baseCoin, params);
    }

    if (!txPrebuild || typeof txPrebuild !== 'object') {
      if (this.multisigType() === 'onchain') {
        throw new Error('txPrebuild is required for on-chain multisig wallets');
      }
      if (!txRequestId) {
        throw new Error('txPrebuild or txRequestId is required for TSS wallets');
      }
      // We only do this if we're not using the external signer TSS flow
      params.txPrebuild = { txRequestId };
    }

    const presign = await this.baseCoin.presignTransaction({
      ...params,
      walletData: this._wallet,
      tssUtils: this.tssUtils,
    });

    if (this.multisigType() === 'tss') {
      return this.signTransactionTss({
        ...presign,
        prv: this.getUserPrv(presign as GetUserPrvOptions),
        apiVersion,
      });
    }

    let { pubs } = params;
    if (!pubs && this.baseCoin.keyIdsForSigning().length > 1) {
      const keychains = await this.baseCoin.keychains().getKeysForSigning({ wallet: this });
      pubs = keychains.map((k) => {
        assert(k.pub);
        return k.pub;
      });
    }

    const signTransactionParams = {
      ...presign,
      txPrebuild: { ...txPrebuild, walletId: this.id() },
      pubs,
      coin: this.baseCoin,
    };

    if (_.isFunction(params.customSigningFunction)) {
      if (typeof this.baseCoin.signWithCustomSigningFunction === 'function') {
        return this.baseCoin.signWithCustomSigningFunction(params.customSigningFunction, signTransactionParams);
      }
      const keys = await this.baseCoin.keychains().getKeysForSigning({ wallet: this });
      const signTransactionParamsWithSeed = {
        ...signTransactionParams,
        derivationSeed: keys[0]?.derivedFromParentWithSeed,
      };
      return params.customSigningFunction(signTransactionParamsWithSeed);
    }
    return this.baseCoin.signTransaction({
      ...signTransactionParams,
      prv: this.getUserPrv(presign as GetUserPrvOptions),
    });
  }

  /**
   * Sign a typed structured data using TSS
   * @param params
   */
  async signTypedData(params: WalletSignTypedDataOptions): Promise<SignedMessage> {
    if (!this.baseCoin.supportsSigningTypedData()) {
      throw new Error(`Sign typed data not supported for ${this.baseCoin.getFullName()}`);
    }
    if (!params.typedData) {
      throw new Error(`Typed data required`);
    }
    if (this._wallet.multisigType !== 'tss') {
      throw new Error('Message signing only supported for TSS wallets');
    }
    if (_.isFunction(params.typedData.typedDataRaw)) {
      throw new Error('typedData.typedDataRaw must be JSON string');
    }
    if (_.isFunction((this.baseCoin as any).encodeTypedData)) {
      params.typedData.typedDataEncoded = (this.baseCoin as any).encodeTypedData(params.typedData);
    }
    const keychains = await this.baseCoin.keychains().getKeysForSigning({ wallet: this, reqId: params.reqId });
    const userPrvOptions: GetUserPrvOptions = { ...params, keychain: keychains[0] };
    assert(keychains[0].commonKeychain, 'Unable to find commonKeychain in keychains');
    const presign = {
      ...params,
      walletData: this._wallet,
      tssUtils: this.tssUtils,
      prv: this.getUserPrv(userPrvOptions),
      keychain: keychains[0],
      backupKeychain: keychains.length > 1 ? keychains[1] : null,
      bitgoKeychain: keychains.length > 2 ? keychains[2] : null,
      pub: keychains.map((k) => k.pub),
      reqId: params.reqId,
    };
    return this.signTypedDataTss(presign);
  }

  /**
   *  Sign a message using TSS
   * @param params
   * - Message
   * - custodianMessageId
   */
  async signMessage(params: WalletSignMessageOptions = {}): Promise<SignedMessage> {
    if (!this.baseCoin.supportsMessageSigning()) {
      throw new Error(`Message signing not supported for ${this.baseCoin.getFullName()}`);
    }
    if (!params.message) {
      throw new Error('message required to sign message');
    }
    if (this._wallet.multisigType !== 'tss') {
      throw new Error('Message signing only supported for TSS wallets');
    }
    if (_.isFunction((this.baseCoin as any).encodeMessage)) {
      params.message.messageEncoded = (this.baseCoin as any).encodeMessage(params.message.messageRaw);
    }
    const keychains = await this.baseCoin.keychains().getKeysForSigning({ wallet: this, reqId: params.reqId });
    const userPrvOptions: GetUserPrvOptions = { ...params, keychain: keychains[0] };
    assert(keychains[0].commonKeychain, 'Unable to find commonKeychain in keychains');
    const presign = {
      ...params,
      walletData: this._wallet,
      tssUtils: this.tssUtils,
      prv: this.getUserPrv(userPrvOptions),
      keychain: keychains[0],
      backupKeychain: keychains.length > 1 ? keychains[1] : null,
      bitgoKeychain: keychains.length > 2 ? keychains[2] : null,
      reqId: params.reqId,
    };
    return this.signMessageTss(presign);
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
    // Only for onchain multisig wallets, TSS key derivation happens during the signing process
    if (
      params.coldDerivationSeed === undefined &&
      params.keychain !== undefined &&
      params.keychain.derivedFromParentWithSeed !== undefined &&
      this.multisigType() === 'onchain'
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
      userPrv = decryptKeychainPrivateKey(this.bitgo, userKeychain, params.walletPassphrase);
      if (!userPrv) {
        throw new Error('failed to decrypt user keychain');
      }
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

    if (params.receiveAddress && (params.type === 'transfer' || params.type === 'transferToken')) {
      const error: any = new Error(`cannot use receive address for TSS transactions of type ${params.type}`);
      error.code = 'receive_address_not_allowed_for_tss_withdrawals';
      throw error;
    }

    if (params.recipients && (params.type === 'fillNonce' || params.type === 'acceleration')) {
      const error: any = new Error(`cannot provide recipients for transaction type ${params.type}`);
      error.code = 'recipients_not_allowed_for_fillnonce_and_acceleration_tx_type';
      throw error;
    }
    const supportedTxRequestVersions = this.tssUtils?.supportedTxRequestVersions() || [];
    if (params.apiVersion && !supportedTxRequestVersions.includes(params.apiVersion)) {
      throw new Error(
        `prebuildAndSignTransaction params.apiVersion=${params.apiVersion} must be one of ${supportedTxRequestVersions}`
      );
    }

    // Doing a sanity check for password here to avoid doing further work if we know it's wrong
    const keychains = await this.getKeychainsAndValidatePassphrase({
      reqId: params.reqId,
      walletPassphrase: params.walletPassphrase,
      customSigningFunction: params.customSigningFunction,
    });

    let txPrebuildQuery: Promise<PrebuildTransactionResult | string>;
    if (isPrebuildTransactionResult(params.prebuildTx) && params.prebuildTx.buildParams?.preview) {
      // If we prebuilt the txRequest with preview=true, then we should rebuild with preview=false to persist the request
      txPrebuildQuery = this.prebuildTransaction({
        ...params,
        ...{ ...params.prebuildTx.buildParams, preview: false },
      });
    } else {
      txPrebuildQuery = params.prebuildTx ? Promise.resolve(params.prebuildTx) : this.prebuildTransaction(params);
    }

    // the prebuild can be overridden by providing an explicit tx
    const txPrebuild = (await txPrebuildQuery) as PrebuildTransactionResult;

    try {
      await this.baseCoin.verifyTransaction({
        txParams: txPrebuild.buildParams || params,
        txPrebuild,
        wallet: this,
        verification: params.verification ?? {},
        reqId: params.reqId,
        walletType: this._wallet.multisigType,
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
      txPrebuild,
      wallet: {
        // this is the version of the multisig address at wallet creation time
        addressVersion: this._wallet.coinSpecific.addressVersion,
      },
      keychain: keychains[0],
      backupKeychain: keychains.length > 1 ? keychains[1] : null,
      bitgoKeychain: keychains.length > 2 ? keychains[2] : null,
      reqId: params.reqId,
    };
    if (this._wallet.multisigType === 'onchain') {
      signingParams.pubs = keychains.map((k) => {
        assert(k.pub);
        return k.pub;
      });
    }

    if (signingParams.txPrebuild.txRequestId) {
      assert(this.tssUtils, 'tssUtils must be defined for TSS wallets');
      const txRequest = await this.tssUtils.getTxRequest(signingParams.txPrebuild.txRequestId, params.reqId);
      if (this.tssUtils.isPendingApprovalTxRequestFull(txRequest)) {
        return txRequest;
      }
    }

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
    this.validateAccelerationParams(params);

    params.recipients = [];

    return await this.submitTransaction({
      ...(await this.prebuildAndSignTransaction(params)),
      ...BuildParams.encode(params),
    });
  }

  private validateAccelerationParams(params: AccelerateTransactionOptions) {
    if (!params.cpfpTxIds && !params.rbfTxIds) {
      const error: any = new Error('must pass cpfpTxIds or rbfTxIds');
      error.code = 'cpfptxids_or_rbftxids_required';
      throw error;
    }

    if (params.cpfpTxIds && params.rbfTxIds) {
      const error: any = new Error('cannot specify both cpfpTxIds and rbfTxIds');
      error.code = 'cannot_specify_both_cpfp_and_rbf_txids';
      throw error;
    }

    if (params.cpfpTxIds) {
      this.validateCpfpParams(params);
    }

    if (params.rbfTxIds) {
      this.validateRbfParams(params);
    }

    if (params.recipients !== undefined) {
      if (!Array.isArray(params.recipients) || params.recipients.length !== 0) {
        throw new Error(`invalid value for 'recipients': must be empty array when set`);
      }
    }
  }

  private validateRbfParams(params: AccelerateTransactionOptions) {
    if (!Array.isArray(params.rbfTxIds) || params.rbfTxIds.length !== 1) {
      const error: any = new Error('expecting rbfTxIds to be an array of length 1');
      error.code = 'rbftxids_not_array';
      throw error;
    }

    if (!params.feeMultiplier) {
      const error: any = new Error('feeMultiplier must be set');
      error.code = 'feemultiplier_not_set';
      throw error;
    }

    if (params.feeMultiplier <= 1) {
      const error: any = new Error('feeMultiplier must be a greater than 1');
      error.code = 'feemultiplier_greater_than_one';
      throw error;
    }
  }

  private validateCpfpParams(params: AccelerateTransactionOptions) {
    // TODO(BG-9349): change the last check to > 0 and the error message once platform allows multiple transactions to
    // be bumped in the same CPFP transaction
    if (!Array.isArray(params.cpfpTxIds) || params.cpfpTxIds.length !== 1) {
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
  }

  /**
   * Submit a half-signed transaction to BitGo
   * @param params
   * - txHex: transaction hex to submit
   * - halfSigned: object containing transaction (txHex or txBase64) to submit
   * @param reqId - request tracer request id
   */
  async submitTransaction(params: SubmitTransactionOptions = {}, reqId?: IRequestTracer): Promise<any> {
    common.validateParams(params, [], ['otp', 'txHex', 'txRequestId']);
    const hasTxHex = !!params.txHex;
    const hasHalfSigned = !!params.halfSigned;

    if (params.txRequestId && (hasTxHex || hasHalfSigned)) {
      throw new Error('must supply exactly one of txRequestId, txHex, or halfSigned');
    } else if (!params.txRequestId && ((hasTxHex && hasHalfSigned) || (!hasTxHex && !hasHalfSigned))) {
      throw new Error('must supply either txHex or halfSigned, but not both');
    }
    return this.sendTransaction(params, reqId);
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
      },
    ];
    if (params.tokenName) {
      recipients[0].tokenName = params.tokenName;
    }
    if (params.data && coin.transactionDataAllowed()) {
      recipients[0].data = params.data;
    }
    const sendManyOptions: SendManyOptions = Object.assign({}, params, { recipients });
    return this.sendMany(sendManyOptions);
  }

  /**
   * Send an ERC-721 NFT or ERC-1155 NFT(s).
   *
   * This function constructs the appropriate call data for an ERC-721/1155 token transfer,
   * and calls the token contract with the data, and amount 0. This transaction will always produce
   * a pending approval.
   *
   * @param sendOptions Options to specify how the transaction should be sent.
   * @param sendNftOptions Options to specify the NFT(s) to be sent.
   *
   * @return A pending approval for the transaction.
   */
  async sendNft(sendOptions: SendNFTOptions, sendNftOptions: NFTTransferOptions): Promise<SendNFTResult> {
    const nftCollections = await this.getNftBalances();
    const { tokenContractAddress, recipientAddress, type } = sendNftOptions;

    const nftBalance = nftCollections.find((c) => c.metadata.tokenContractAddress === tokenContractAddress);
    if (!nftBalance) {
      throw new Error(`Collection not found for token contract ${tokenContractAddress}`);
    }

    if (!this.baseCoin.isValidAddress(recipientAddress)) {
      throw new Error(`Invalid recipient address ${recipientAddress}`);
    }
    const baseAddress = this.coinSpecific()?.baseAddress;
    if (!baseAddress) {
      throw new Error('Missing base address for wallet');
    }

    if (nftBalance.type !== type) {
      throw new Error(`Specified NFT type ${type} does not match collection type ${nftBalance.type}`);
    }

    switch (sendNftOptions.type) {
      case 'ERC721': {
        if (!nftBalance.collections[sendNftOptions.tokenId]) {
          throw new Error(
            `Token ${sendNftOptions.tokenId} not found in collection ${tokenContractAddress} or does not have a spendable balance`
          );
        }

        const data = this.baseCoin.buildNftTransferData({ ...sendNftOptions, fromAddress: baseAddress });
        return this.sendMany({
          ...sendOptions,
          recipients: [
            {
              address: sendNftOptions.tokenContractAddress,
              amount: '0',
              data: data,
            },
          ],
        });
      }
      case 'ERC1155': {
        const entries = sendNftOptions.entries;
        for (const entry of entries) {
          if (!nftBalance.collections[entry.tokenId]) {
            throw new Error(
              `Token ${entry.tokenId} not found in collection ${sendNftOptions.tokenContractAddress} or does not have a spendable balance`
            );
          }
          if (nftBalance.collections[entry.tokenId] < entry.amount) {
            throw new Error(
              `Amount ${entry.amount} exceeds spendable balance of ${nftBalance.collections[entry.tokenId]} for token ${
                entry.tokenId
              }`
            );
          }
        }

        const data = this.baseCoin.buildNftTransferData({ ...sendNftOptions, fromAddress: baseAddress });
        return this.sendMany({
          ...sendOptions,
          recipients: [
            {
              address: sendNftOptions.tokenContractAddress,
              amount: '0',
              data: data,
            },
          ],
        });
      }
    }
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
   * @param {Number | String} params.minValue - Ignore unspents smaller than this amount of satoshis
   * @param {Number | String} params.maxValue - Ignore unspents larger than this amount of satoshis
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

    const selectParams = _.pick(params, [...this.prebuildWhitelistedParams(), 'comment', 'otp', 'hop']);

    if (this._wallet.type === 'custodial') {
      const extraParams = await this.baseCoin.getExtraPrebuildParams(Object.assign(params, { wallet: this }));
      Object.assign(selectParams, extraParams);
      return this.initiateTransaction(selectParams, reqId);
    }

    const halfSignedTransaction = await this.prebuildAndSignTransaction(params);
    const extraParams = await this.baseCoin.getExtraPrebuildParams(Object.assign(params, { wallet: this }));
    const finalTxParams = _.extend({}, halfSignedTransaction, selectParams, extraParams);
    return this.sendTransaction(finalTxParams, reqId);
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
    return this.baseCoin.recoverToken(recoverTokenOptions);
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
   * @param {String} [params.fee] Optional - The new fee to apply to the denoted transaction
   * @param {Object} [params.eip1559] Optional - the eip1559 values to apply to the denoted transaction
   * @returns {String} The transaction ID of the new transaction that contains the new fee rate
   */
  async changeFee(params: ChangeFeeOptions = {}): Promise<any> {
    if (params.fee) common.validateParams(params, ['txid', 'fee'], []);
    if (params.eip1559) common.validateParams(params.eip1559, ['maxFeePerGas', 'maxPriorityFeePerGas']);
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
   * Fetches crossChain UTXOs
   * Currently only for AVAX
   * @param {string} params.sourceChain the sourcechain to pick UTXOs, if not given, then pick from all available chains [P, C]
   */
  fetchCrossChainUTXOs(params: FetchCrossChainUTXOsOptions): Promise<CrossChainUTXO[]> {
    const query = _.pick(params, ['sourceChain']);
    return this.bitgo.get(this.url('/crossChainUnspents')).query(query).result();
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
   * Get the address book for this wallet
   */
  toAddressBook(): IAddressBook {
    if (this.baseCoin.getFamily() !== 'ofc') {
      throw new Error('Can only use an Offchain (OFC) wallet for the address book');
    }
    return new AddressBook(this._wallet.enterprise, this.bitgo, this);
  }

  /**
   * Create a staking wallet from this wallet
   */
  toStakingWallet(): StakingWallet {
    const isEthTss =
      this.baseCoin.getFamily() == 'eth' && this._wallet.coinSpecific?.walletVersion
        ? this._wallet.coinSpecific.walletVersion >= 3
        : false;
    return new StakingWallet(this, isEthTss);
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

    if (buildResponse.length === 0) {
      throw new Error('No receive addresses with balance found to consolidate.');
    }

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

    if (this._wallet.type === 'custodial' && this._wallet.multisigType !== 'tss') {
      params.type = 'consolidate';
      return this.initiateTransaction(params as TxSendBody, params.reqId);
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

    return await this.submitTransaction(signedPrebuild, params.reqId);
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

    // Doing a sanity check for password here to avoid doing further work if we know it's wrong
    await this.getKeychainsAndValidatePassphrase({
      reqId: params.reqId,
      walletPassphrase: params.walletPassphrase,
      customSigningFunction: params.customSigningFunction,
    });

    // this gives us a set of account consolidation transactions
    const unsignedBuilds = await this.buildAccountConsolidations(params);
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

  /**
   * Builds a set of transactions that enables the specified tokens
   * @param params -
   *    enableTokens: Token enablement operations we want to perform
   * @returns Unsigned transactions that enables the specified tokens
   */
  public async buildTokenEnablements(
    params: BuildTokenEnablementOptions = { enableTokens: [] }
  ): Promise<PrebuildTransactionResult[]> {
    const teConfig = this.baseCoin.getTokenEnablementConfig();
    if (!teConfig.requiresTokenEnablement) {
      throw new Error(`${this.baseCoin.getFullName()} does not require token enablements`);
    }
    if (params.enableTokens.length === 0) {
      throw new Error('No tokens are being specified');
    }
    if (params.recipients) {
      throw new Error('Can not specify recipients for token enablement transactions');
    }

    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }

    // Split query if we can't enable multiple tokens in one tx
    if (!teConfig.supportsMultipleTokenEnablements && params.enableTokens.length > 1) {
      const queries = params.enableTokens.map(async (enableToken) => {
        return this.buildTokenEnablements({
          ...params,
          enableTokens: [enableToken],
        });
      });
      const results = await Promise.all(queries);
      return results.flat();
    }

    const buildParams: PrebuildTransactionOptions = _.pick(params, this.prebuildWhitelistedParams());
    buildParams.type = 'enabletoken';
    // Check if we build with intent
    if (this._wallet.multisigType === 'tss') {
      return [await this.prebuildTransaction(buildParams)];
    } else {
      // Rewrite tokens into recipients for buildTransaction
      buildParams.recipients = params.enableTokens.map((token) => {
        // If token has non address, take the first wallet address is stored in its coin-specific property
        // In account-based coin implementations that use wallet contracts, the address is called baseAddress (e.g. eth-like, xtz)
        // for others it's called rootAddress (e.g. xrp, xlm, algo, trx)
        const address =
          token.address || this._wallet.coinSpecific?.baseAddress || this._wallet.coinSpecific?.rootAddress;
        if (!address) {
          throw new Error('Wallet does not have base address, must specify with token param');
        }
        return {
          tokenName: token.name,
          address,
          amount: '0',
        };
      });
      delete buildParams.enableTokens;
      const prebuildTx = await this.prebuildTransaction(buildParams);
      prebuildTx.buildParams = buildParams;
      return [prebuildTx];
    }
  }

  /**
   * Signs and sends a single unsigned token enablement transaction
   * @param params
   * @returns
   *   - The response from sending the transaction for hot/cold wallets
   *   - The response from initiating the transaction for custodial wallets
   */
  public async sendTokenEnablement(params: PrebuildAndSignTransactionOptions = {}): Promise<any> {
    const teConfig = this.baseCoin.getTokenEnablementConfig();
    if (!teConfig.requiresTokenEnablement) {
      throw new Error(`${this.baseCoin.getFullName()} does not require token enablement transactions`);
    }

    if (typeof params.prebuildTx === 'string' || params.prebuildTx?.buildParams?.type !== 'enabletoken') {
      throw new Error('Invalid build of token enablement.');
    }

    if (this._wallet.multisigType === 'tss') {
      return await this.sendManyTss(params);
    } else {
      switch (this._wallet.type) {
        case 'hot':
        case 'cold':
          const signedPrebuild = await this.prebuildAndSignTransaction(params);
          return await this.submitTransaction(signedPrebuild, params.reqId);
        case 'custodial':
          return this.initiateTransaction(params.prebuildTx.buildParams, params.reqId);
      }
    }
  }

  /**
   * Some chains require tokens to be enabled before they can be received/sent.
   * This is a dedicated function that enables tokens.
   *
   * Builds, signs, and sends a set of transactions that enables the specified tokens
   * @param params -
   *    enableTokens: Token enablement operations we want to perform
   * @return
   *    success: Successful responses from sendTokenEnablement
   *    failure: Errors from failed transactions
   */
  public async sendTokenEnablements(params: BuildTokenEnablementOptions = { enableTokens: [] }): Promise<{
    success: any[];
    failure: Error[];
  }> {
    const unsignedBuilds = await this.buildTokenEnablements(params);

    const successfulTxs: any[] = [];
    const failedTxs = new Array<Error>();
    for (const unsignedBuild of unsignedBuilds) {
      const unsignedBuildWithOptions: PrebuildAndSignTransactionOptions = {
        ...params,
        prebuildTx: unsignedBuild,
      };
      try {
        const sendTx = await this.sendTokenEnablement(unsignedBuildWithOptions);
        successfulTxs.push(sendTx);
      } catch (e) {
        failedTxs.push(e);
      }
    }

    return {
      success: successfulTxs,
      failure: failedTxs,
    };
  }

  /**
   * Create lightning for btc/tbtc from this wallet
   */
  public lightning(): Lightning {
    if (!this.baseCoin.supportsLightning()) {
      throw new Error(`Lightning not supported for ${this.coin()}`);
    }
    return new Lightning(this.bitgo, this);
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

    if (
      params.apiVersion === 'lite' &&
      (this._wallet.type === 'custodial' || this._wallet.type === 'cold' || this.baseCoin.getMPCAlgorithm() === 'ecdsa')
    ) {
      throw new Error(`Custodial and ECDSA MPC algorithm must always use 'full' api version`);
    }

    const apiVersion =
      params.apiVersion ||
      (this._wallet.type === 'custodial' || this._wallet.type === 'cold' || this.baseCoin.getMPCAlgorithm() === 'ecdsa'
        ? 'full'
        : 'lite');
    // Two options different implementations of fees seems to now be supported, for now we will support both to be backwards compatible
    // TODO(BG-59685): deprecate one of these so that we have a single way to pass fees
    let feeOptions;
    if (params.feeOptions) {
      feeOptions = params.feeOptions;
    } else if (params.gasPrice !== undefined || params.eip1559 !== undefined) {
      feeOptions =
        params.gasPrice !== undefined
          ? { gasPrice: params.gasPrice, gasLimit: params.gasLimit }
          : {
              maxFeePerGas: Number(params.eip1559?.maxFeePerGas),
              maxPriorityFeePerGas: Number(params.eip1559?.maxPriorityFeePerGas),
              gasLimit: params.gasLimit,
            };
    } else if (params.gasLimit !== undefined) {
      feeOptions = { gasLimit: params.gasLimit };
    } else {
      feeOptions = undefined;
    }

    let txRequest: TxRequest;
    switch (params.type) {
      case 'transfer':
        txRequest = await this.tssUtils!.prebuildTxWithIntent(
          {
            reqId,
            intentType: 'payment',
            sequenceId: params.sequenceId,
            comment: params.comment,
            recipients: params.recipients || [],
            memo: params.memo,
            nonce: params.nonce,
            feeOptions,
            custodianTransactionId: params.custodianTransactionId,
          },
          apiVersion,
          params.preview
        );
        break;
      case 'transfertoken':
        txRequest = await this.tssUtils!.prebuildTxWithIntent(
          {
            reqId,
            isTss: params.isTss,
            intentType: 'transferToken',
            recipients: params.recipients || [],
            nonce: params.nonce,
            feeOptions,
          },
          apiVersion,
          params.preview
        );
        break;
      case 'enabletoken':
        txRequest = await this.tssUtils!.prebuildTxWithIntent(
          {
            reqId,
            intentType: 'enableToken',
            recipients: params.recipients || [],
            enableTokens: params.enableTokens,
            memo: params.memo,
          },
          apiVersion,
          params.preview
        );
        break;
      case 'acceleration':
        txRequest = await this.tssUtils!.prebuildTxWithIntent(
          {
            reqId,
            intentType: 'acceleration',
            comment: params.comment,
            lowFeeTxid: params.lowFeeTxid,
            receiveAddress: params.receiveAddress,
            feeOptions,
          },
          apiVersion,
          params.preview
        );
        break;
      case 'fillNonce':
        txRequest = await this.tssUtils!.prebuildTxWithIntent(
          {
            reqId,
            intentType: 'fillNonce',
            comment: params.comment,
            nonce: params.nonce,
            receiveAddress: params.receiveAddress,
            feeOptions,
          },
          apiVersion,
          params.preview
        );
        break;
      default:
        throw new Error(`transaction type not supported: ${params.type}`);
    }

    let unsignedTx: EddsaUnsignedTransaction;

    if (txRequest.apiVersion === 'full') {
      if (txRequest.transactions?.length !== 1) {
        throw new Error(`Expected a single unsigned tx for tx request with id: ${txRequest.txRequestId}`);
      }

      unsignedTx = txRequest.transactions[0].unsignedTx;
    } else {
      if (txRequest.unsignedTxs.length !== 1) {
        throw new Error(`Expected a single unsigned tx for tx request with id: ${txRequest.txRequestId}`);
      }
      unsignedTx = txRequest.unsignedTxs[0];
    }

    const whitelistedParams = _.pick(params, this.prebuildWhitelistedParams());
    return {
      walletId: this.id(),
      wallet: this,
      txRequestId: txRequest.txRequestId,
      txHex: unsignedTx.serializedTxHex,
      buildParams: whitelistedParams,
      feeInfo: unsignedTx.feeInfo,
      ...(txRequest.pendingApprovalId && { pendingApprovalId: txRequest.pendingApprovalId }),
    };
  }

  /**
   * Signs a transaction from a TSS EdDSA wallet using external signer.
   *
   * @param params signing options
   */
  private async signTransactionTssExternalSignerEdDSA(
    params: WalletSignTransactionOptions = {},
    coin: IBaseCoin
  ): Promise<TxRequest> {
    let txRequestId = '';
    if (params.txRequestId) {
      txRequestId = params.txRequestId;
    } else if (params.txPrebuild && params.txPrebuild.txRequestId) {
      txRequestId = params.txPrebuild.txRequestId;
    } else {
      throw new Error('TxRequestId required to sign TSS transactions with External Signer.');
    }

    if (!params.customCommitmentGeneratingFunction) {
      throw new Error('Generator function for commitment required to sign transactions with External Signer.');
    }

    if (!params.customRShareGeneratingFunction) {
      throw new Error('Generator function for R share required to sign transactions with External Signer.');
    }

    if (!params.customGShareGeneratingFunction) {
      throw new Error('Generator function for G share required to sign transactions with External Signer.');
    }

    assert(this.tssUtils, 'tssUtils must be defined');
    // adding this to rebuild the transaction just before signing for EdDSA transaction using external signer
    const reqId = params.reqId || undefined;
    await this.tssUtils.deleteSignatureShares(txRequestId, reqId);

    try {
      const signedTxRequest = await this.tssUtils.signEddsaTssUsingExternalSigner(
        txRequestId,
        params.customCommitmentGeneratingFunction,
        params.customRShareGeneratingFunction,
        params.customGShareGeneratingFunction,
        reqId
      );
      return signedTxRequest;
    } catch (e) {
      throw new Error('failed to sign transaction ' + e);
    }
  }

  /**
   * Signs a transaction from a TSS ECDSA wallet using external signer.
   *
   * @param params signing options
   */
  private async signTransactionTssExternalSignerECDSA(
    coin: IBaseCoin,
    params: WalletSignTransactionOptions = {}
  ): Promise<TxRequest> {
    let txRequestId = '';
    if (params.txRequestId) {
      txRequestId = params.txRequestId;
    } else if (params.txPrebuild && params.txPrebuild.txRequestId) {
      txRequestId = params.txPrebuild.txRequestId;
    } else {
      throw new Error('TxRequestId required to sign TSS transactions with External Signer.');
    }

    if (!params.customPaillierModulusGeneratingFunction) {
      throw new Error('Generator function for paillier modulus required to sign transactions with External Signer.');
    }

    if (!params.customKShareGeneratingFunction) {
      throw new Error('Generator function for K share required to sign transactions with External Signer.');
    }

    if (!params.customMuDeltaShareGeneratingFunction) {
      throw new Error('Generator function for MuDelta share required to sign transactions with External Signer.');
    }

    if (!params.customSShareGeneratingFunction) {
      throw new Error('Generator function for S share required to sign transactions with External Signer.');
    }

    try {
      assert(this.tssUtils, 'tssUtils must be defined');
      const signedTxRequest = await this.tssUtils.signEcdsaTssUsingExternalSigner(
        {
          txRequest: txRequestId,
          prv: '',
          reqId: params.reqId || new RequestTracer(),
        },
        RequestType.tx,
        params.customPaillierModulusGeneratingFunction,
        params.customKShareGeneratingFunction,
        params.customMuDeltaShareGeneratingFunction,
        params.customSShareGeneratingFunction
      );
      return signedTxRequest;
    } catch (e) {
      throw new Error('failed to sign transaction ' + e);
    }
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
      const signedTxRequest = await this.tssUtils!.signTxRequest({
        txRequest: params.txPrebuild.txRequestId,
        prv: params.prv,
        reqId: params.reqId || new RequestTracer(),
        apiVersion: params.apiVersion,
      });
      return {
        txRequestId: signedTxRequest.txRequestId,
      };
    } catch (e) {
      throw new Error('failed to sign transaction ' + e);
    }
  }

  /**
   * Signs a message from a TSS wallet.
   *
   * @param params signing options
   */
  private async signMessageTss(params: WalletSignMessageOptions = {}): Promise<SignedMessage> {
    if (!params.reqId) {
      params.reqId = new RequestTracer();
    }

    if (!params.prv) {
      throw new Error('prv required to sign message with TSS');
    }

    try {
      let txRequest;
      assert(params.message, 'message required for message signing');
      if (!params.message.txRequestId) {
        const intentOption: IntentOptionsForMessage = {
          custodianMessageId: params.custodianMessageId,
          reqId: params.reqId,
          intentType: 'signMessage',
          isTss: true,
          messageRaw: params.message.messageRaw,
          messageEncoded: Buffer.from(params.message?.messageEncoded ?? '').toString('hex'),
        };
        txRequest = await this.tssUtils!.createTxRequestWithIntentForMessageSigning(intentOption);
        params.message.txRequestId = txRequest.txRequestId;
      } else {
        txRequest = await getTxRequest(this.bitgo, this.id(), params.message.txRequestId, params.reqId);
      }

      const signedMessageRequest = await this.tssUtils!.signTxRequestForMessage({
        txRequest,
        prv: params.prv,
        reqId: params.reqId || new RequestTracer(),
        messageRaw: params.message.messageRaw,
        messageEncoded: params.message.messageEncoded,
        bufferToSign: Buffer.from(params.message.messageEncoded ?? ''),
      });
      assert(signedMessageRequest.messages, 'Unable to find messages in signedMessageRequest');
      assert(
        signedMessageRequest.messages[0].combineSigShare,
        'Unable to find combineSigShare in signedMessageRequest.messages'
      );
      assert(signedMessageRequest.messages[0].txHash, 'Unable to find txHash in signedMessageRequest.messages');
      return {
        coin: this.coin(),
        txHash: signedMessageRequest.messages[0].txHash,
        messageRaw: params.message?.messageRaw,
        txRequestId: signedMessageRequest.txRequestId,
      };
    } catch (e) {
      throw new Error('failed to sign message ' + e);
    }
  }

  /**
   * Signs a typed data from a TSS wallet.
   * @param params
   * @private
   */
  private async signTypedDataTss(params: WalletSignTypedDataOptions): Promise<SignedMessage> {
    if (!params.reqId) {
      params.reqId = new RequestTracer();
    }
    if (!params.prv) {
      throw new Error('prv required to sign typed data with TSS');
    }

    try {
      let txRequest;
      assert(params.typedData, 'typedData required for typed data signing');
      if (!params.typedData.txRequestId) {
        const intentOptions: IntentOptionsForTypedData = {
          custodianMessageId: params.custodianMessageId,
          reqId: params.reqId,
          intentType: 'signTypedStructuredData',
          isTss: true,
          typedDataRaw: params.typedData.typedDataRaw,
          typedDataEncoded: params.typedData.typedDataEncoded!.toString('hex'),
        };
        txRequest = await this.tssUtils!.createTxRequestWithIntentForTypedDataSigning(intentOptions);
        params.typedData.txRequestId = txRequest.txRequestId;
      } else {
        txRequest = await getTxRequest(this.bitgo, this.id(), params.typedData.txRequestId, params.reqId);
      }

      const signedTypedDataRequest = await this.tssUtils!.signTxRequestForMessage({
        txRequest,
        prv: params.prv,
        reqId: params.reqId || new RequestTracer(),
        messageRaw: JSON.stringify(params.typedData.typedDataRaw),
        messageEncoded: params.typedData.typedDataEncoded!.toString('hex'),
        bufferToSign: params.typedData.typedDataEncoded!,
      });
      assert(signedTypedDataRequest.messages, 'Unable to find messages in signedTypedDataRequest');
      assert(
        signedTypedDataRequest.messages[0].combineSigShare,
        'Unable to find combineSigShare in signedTypedDataRequest.messages'
      );
      assert(signedTypedDataRequest.messages[0].txHash, 'Unable to find txHash in signedTypedDataRequest.messages');
      return {
        coin: this.coin(),
        txHash: signedTypedDataRequest.messages[0].txHash,
        messageRaw: params.typedData.typedDataRaw,
        txRequestId: signedTypedDataRequest.txRequestId,
      };
    } catch (e) {
      throw new Error('failed to sign typed data ' + e);
    }
  }

  /**
   * Builds, signs, and sends a transaction from a TSS wallet.
   *
   * @param params send options
   */
  private async sendManyTss(params: SendManyOptions = {}): Promise<any> {
    const { apiVersion } = params;
    const supportedTxRequestVersions = this.tssUtils?.supportedTxRequestVersions() ?? [];
    const onlySupportsTxRequestFull =
      supportedTxRequestVersions.length === 1 && supportedTxRequestVersions.includes('full');
    if (apiVersion === 'lite' && onlySupportsTxRequestFull) {
      throw new Error('TxRequest Lite API is not supported for this wallet');
    }

    const signedTransaction = (await this.prebuildAndSignTransaction(params)) as SignedTransactionRequest;
    if (!signedTransaction.txRequestId) {
      throw new Error('txRequestId missing from signed transaction');
    }

    if (onlySupportsTxRequestFull || apiVersion === 'full') {
      const latestTxRequest = await getTxRequest(this.bitgo, this.id(), signedTransaction.txRequestId, params.reqId);
      const reqId = params.reqId || new RequestTracer();
      this.bitgo.setRequestTracer(reqId);
      const transfer: { state: string; pendingApproval?: string; txid?: string } = await this.bitgo
        .post(
          this.bitgo.url(
            '/wallet/' + this._wallet.id + '/txrequests/' + signedTransaction.txRequestId + '/transfers',
            2
          )
        )
        .send()
        .result();
      if (latestTxRequest.state === 'pendingApproval') {
        const pendingApprovals = new PendingApprovals(this.bitgo, this.baseCoin);
        const pendingApproval = await pendingApprovals.get({ id: latestTxRequest.pendingApprovalId });
        return {
          pendingApproval: pendingApproval.toJSON(),
          txRequest: latestTxRequest,
        };
      }
      return {
        transfer,
        txRequest: latestTxRequest,
        txid: (latestTxRequest.transactions ?? [])[0]?.signedTx?.id,
        tx: (latestTxRequest.transactions ?? [])[0]?.signedTx?.tx,
        status: transfer.state,
      };
    }

    const reqId = params.reqId || undefined;
    return this.tssUtils?.sendTxRequest(signedTransaction.txRequestId, reqId);
  }

  /**
   * Send funds from a fee address to a forwarder. Only supports eth-like coins.
   *
   * @param {Object} params - parameters object
   * @param {String} params.forwarderAddress - Address of the forwarder to send funds to.
   * @param {String} params.amount - Amount to send the forwarder (optional). If not given, defaults to sending an estimate of the amount needed for a fund recovery
   * @returns {*}
   */
  public async fundForwarder(params: FundForwardersOptions): Promise<any> {
    if (_.isUndefined(params.forwarderAddress)) {
      throw new Error('forwarder address required');
    }
    const url = this.url('/fundForwarder');
    this._wallet = await this.bitgo.post(url).send(params).result();
    return this._wallet;
  }

  /**
   * Gets forwarder's balance
   * @param params - optional query parameters
   * @returns List of forwarder address and balance
   * if params is not set then returns low balance forwarders
   */
  public async getForwarderBalance(params?: ForwarderBalanceOptions): Promise<ForwarderBalance[]> {
    const query: ForwarderBalanceOptions = {};
    if (params?.maximumBalance) {
      query.maximumBalance = params?.maximumBalance;
    }

    if (params?.minimumBalance) {
      query.minimumBalance = params?.minimumBalance;
    }

    const url = this.url(`/forwarders/balances`);
    const response = await this.bitgo.get(url).query(query).result();
    return response as ForwarderBalance[];
  }

  /**
   * Gets the ecdsa tss challenges for a wallet.
   * These are static challenges that have been verified by an enterprise admin.
   * Callers should verify that an enterprise admin signed the challenge values before using them.
   *
   * @returns {Promise<WalletEcdsaChallenges>}
   */
  async getChallengesForEcdsaSigning(): Promise<WalletEcdsaChallenges> {
    // note: this is not a coin specific route, we cannot use this.url(..)
    const url = this.bitgo.url(`/wallet/${this.id()}/challenges`, 2);
    return await this.bitgo.get(url).query({}).result();
  }

  private sendTransaction(params: TxSendBody, reqId?: IRequestTracer) {
    // extract the whitelisted params from the top level, in case
    // other invalid params are present that would fail encoding
    // and fall back to the body params
    const whitelistedParams = _.pick(params, whitelistedSendParams);
    const reqTracer = reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    return postWithCodec(
      this.bitgo,
      this.baseCoin.url('/wallet/' + this.id() + '/tx/send'),
      TxSendBody,
      whitelistedParams
    ).result();
  }

  private initiateTransaction(params: TxSendBody, reqId?: IRequestTracer) {
    // extract the whitelisted params from the top level, in case
    // other invalid params are present that would fail encoding
    // and fall back to the body params
    const whitelistedParams = _.pick(params, whitelistedSendParams);
    const reqTracer = reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    return postWithCodec(
      this.bitgo,
      this.baseCoin.url('/wallet/' + this.id() + '/tx/initiate'),
      TxSendBody,
      whitelistedParams
    ).result();
  }

  /**
   * Get wallet keychains and validate passphrase if necessary
   * @param {PrebuildTransactionOptions} params - prebuild transaction options
   * @param {string} params.walletPassphrase - wallet passphrase
   * @param {string} params.reqId - request id for tracing purposes
   * @param {Function} params.customSigningFunction - custom signing function for external signing
   * @returns {Promise<Keychain[]>}
   */
  private async getKeychainsAndValidatePassphrase({
    customSigningFunction,
    walletPassphrase,
    reqId,
  }: PrebuildTransactionOptions & WalletSignTransactionOptions): Promise<Keychain[]> {
    const keychains = await this.baseCoin.keychains().getKeysForSigning({ wallet: this, reqId });

    // Doing a sanity check for password here to avoid doing further work if we know it's wrong
    // we ignore this check with if customSigningFunction is provided
    //  which means that the user is handling the signing in external signing mode
    if (keychains[0].encryptedPrv && !customSigningFunction && walletPassphrase) {
      if (!decryptKeychainPrivateKey(this.bitgo, keychains[0], walletPassphrase)) {
        const error: Error & { code?: string } = new Error(
          `unable to decrypt keychain with the given wallet passphrase`
        );
        error.code = 'wallet_passphrase_incorrect';
        throw error;
      }
    }
    return keychains;
  }
}
