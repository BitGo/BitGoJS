import { IRequestTracer } from '../../../api';
import * as openpgp from 'openpgp';
import { Key, readKey, SerializedKeyPair } from 'openpgp';
import { IBaseCoin, KeychainsTriplet } from '../../baseCoin';
import { BitGoBase } from '../../bitgoBase';
import { Keychain, KeyIndices } from '../../keychain';
import { getTxRequest } from '../../tss';
import { IWallet } from '../../wallet';
import { MpcUtils } from '../mpcUtils';
import * as _ from 'lodash';
import {
  BitgoGPGPublicKey,
  BitgoHeldBackupKeyShare,
  CommitmentShareRecord,
  CreateBitGoKeychainParamsBase,
  CreateKeychainParamsBase,
  CustomCommitmentGeneratingFunction,
  CustomGShareGeneratingFunction,
  CustomKShareGeneratingFunction,
  CustomMPCv2SigningRound1GeneratingFunction,
  CustomMPCv2SigningRound2GeneratingFunction,
  CustomMPCv2SigningRound3GeneratingFunction,
  CustomMuDeltaShareGeneratingFunction,
  CustomPaillierModulusGetterFunction,
  CustomRShareGeneratingFunction,
  CustomSShareGeneratingFunction,
  EncryptedSignerShareRecord,
  IntentOptionsForMessage,
  IntentOptionsForTypedData,
  ITssUtils,
  PopulatedIntentForMessageSigning,
  PopulatedIntentForTypedDataSigning,
  PrebuildTransactionWithIntentOptions,
  RequestType,
  SignatureShareRecord,
  TSSParams,
  TSSParamsForMessage,
  TSSParamsWithPrv,
  TxRequest,
  TxRequestVersion,
} from './baseTypes';
import { GShare, SignShare } from '../../../account-lib/mpc/tss';
import { RequestTracer } from '../util';
import { envRequiresBitgoPubGpgKeyConfig, getBitgoMpcGpgPubKey } from '../../tss/bitgoPubKeys';
import { getBitgoGpgPubKey } from '../opengpgUtils';
import assert from 'assert';
import { MessageStandardType } from '../../../account-lib';

/**
 * BaseTssUtil class which different signature schemes have to extend
 */
export default class BaseTssUtils<KeyShare> extends MpcUtils implements ITssUtils<KeyShare> {
  private _wallet?: IWallet;
  protected bitgoPublicGpgKey: openpgp.Key;
  protected bitgoMPCv2PublicGpgKey: openpgp.Key | undefined;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin);
    this._wallet = wallet;
  }

  get wallet(): IWallet {
    if (_.isNil(this._wallet)) {
      throw new Error('Wallet not defined');
    }
    return this._wallet;
  }

  protected async setBitgoGpgPubKey(bitgo) {
    const { mpcV1, mpcV2 } = await getBitgoGpgPubKey(bitgo);
    // Do not unset the MPCv1 key if it is already set. This is to avoid unsetting if extra constants api calls fail.
    if (mpcV1 !== undefined) {
      this.bitgoPublicGpgKey = mpcV1;
    }
    // Do not unset the MPCv2 key if it is already set
    if (mpcV2 !== undefined) {
      this.bitgoMPCv2PublicGpgKey = mpcV2;
    }
  }

  public async pickBitgoPubGpgKeyForSigning(
    isMpcv2: boolean,
    reqId?: IRequestTracer,
    enterpriseId?: string
  ): Promise<openpgp.Key> {
    let bitgoGpgPubKey;
    try {
      const bitgoKeyChain = await this.baseCoin.keychains().get({ id: this.wallet.keyIds()[KeyIndices.BITGO], reqId });
      if (!bitgoKeyChain || !bitgoKeyChain.hsmType) {
        throw new Error('Missing Bitgo GPG Pub Key Type.');
      }
      bitgoGpgPubKey = await openpgp.readKey({
        armoredKey: getBitgoMpcGpgPubKey(
          this.bitgo.getEnv(),
          bitgoKeyChain.hsmType === 'nitro' ? 'nitro' : 'onprem',
          isMpcv2 ? 'mpcv2' : 'mpcv1'
        ),
      });
    } catch (e) {
      if (!envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
        console.warn(
          `Unable to get BitGo GPG key based on key data with error: ${e}. Fetching BitGo GPG key based on feature flags.`
        );
        // First try to get the key based on feature flags, if that fails, fallback to the default key from constants api.
        bitgoGpgPubKey = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(enterpriseId, isMpcv2, reqId)
          .then(
            async (pubKey) =>
              pubKey ?? (isMpcv2 ? await this.getBitgoMpcv2PublicGpgKey() : await this.getBitgoPublicGpgKey())
          )
          .catch(async (e) => (isMpcv2 ? await this.getBitgoMpcv2PublicGpgKey() : await this.getBitgoPublicGpgKey()));
      } else {
        throw new Error(
          `Environment "${this.bitgo.getEnv()}" requires a BitGo GPG Pub Key Config in BitGoJS for TSS. Error thrown while getting the key from config: ${e}`
        );
      }
    }
    return bitgoGpgPubKey;
  }

  async getBitgoPublicGpgKey(): Promise<openpgp.Key> {
    if (!this.bitgoPublicGpgKey) {
      // retry getting bitgo's gpg key
      await this.setBitgoGpgPubKey(this.bitgo);
      if (!this.bitgoPublicGpgKey) {
        throw new Error("Failed to get Bitgo's gpg key");
      }
    }

    return this.bitgoPublicGpgKey;
  }

  async getBitgoMpcv2PublicGpgKey(): Promise<openpgp.Key> {
    if (!this.bitgoMPCv2PublicGpgKey) {
      // retry getting bitgo's gpg key
      await this.setBitgoGpgPubKey(this.bitgo);
      if (!this.bitgoMPCv2PublicGpgKey) {
        throw new Error("Failed to get Bitgo's gpg key");
      }
    }

    return this.bitgoMPCv2PublicGpgKey;
  }

  async createBitgoHeldBackupKeyShare(
    userGpgKey: SerializedKeyPair<string>,
    enterprise: string | undefined
  ): Promise<BitgoHeldBackupKeyShare> {
    const keyResponse = await this.bitgo
      .post(this.baseCoin.url('/krs/backupkeys'))
      .send({
        enterprise,
        userGPGPublicKey: userGpgKey.publicKey,
      })
      .result();
    if (!keyResponse || !keyResponse.keyShares) {
      throw new Error('Failed to get backup shares from BitGo.');
    }
    return {
      id: keyResponse.id,
      keyShares: keyResponse.keyShares,
    };
  }

  public finalizeBitgoHeldBackupKeyShare(
    keyId: string,
    commonKeychain: string,
    userKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    userGpgKey: SerializedKeyPair<string>,
    backupGpgKey: Key
  ): Promise<BitgoHeldBackupKeyShare> {
    throw new Error('Method not implemented.');
  }

  createUserKeychain(params: CreateKeychainParamsBase): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createBackupKeychain(params: CreateKeychainParamsBase): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createBitgoKeychain(params: CreateBitGoKeychainParamsBase): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createKeychains(params: {
    passphrase: string;
    enterprise?: string | undefined;
    originalPasscodeEncryptionCode?: string | undefined;
    isThirdPartyBackup?: boolean;
  }): Promise<KeychainsTriplet> {
    throw new Error('Method not implemented.');
  }

  signTxRequest(params: TSSParamsWithPrv): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  signTxRequestForMessage(params: TSSParamsForMessage): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  /**
   * Signs a transaction using TSS for EdDSA and through utilization of custom share generators
   *
   * @param {string | TxRequest} txRequest - transaction request with unsigned transaction
   * @param {CustomRShareGeneratingFunction} externalSignerRShareGenerator a function that creates R shares in the EdDSA TSS flow
   * @param {CustomGShareGeneratingFunction} externalSignerGShareGenerator a function that creates G shares in the EdDSA TSS flow
   * @returns {Promise<TxRequest>} - a signed tx request
   */
  signEddsaTssUsingExternalSigner(
    txRequest: string | TxRequest,
    externalSignerCommitmentGenerator: CustomCommitmentGeneratingFunction,
    externalSignerRShareGenerator: CustomRShareGeneratingFunction,
    externalSignerGShareGenerator: CustomGShareGeneratingFunction
  ): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  /**
   * Signs a transaction using TSS for ECDSA and through utilization of custom share generators
   *
   * @param {params: TSSParams | TSSParamsForMessage} params - params object that represents parameters to sign a transaction or a message.
   * @param {RequestType} requestType - the type of the request to sign (transaction or message).
   * @param {CustomPaillierModulusGetterFunction} externalSignerPaillierModulusGetter a function that creates Paillier Modulus shares in the ECDSA TSS flow.
   * @param {CustomKShareGeneratingFunction} externalSignerKShareGenerator a function that creates K shares in the ECDSA TSS flow.
   * @param {CustomMuDeltaShareGeneratingFunction} externalSignerMuDeltaShareGenerator a function that creates Mu and Delta shares in the ECDSA TSS flow.
   * @param {CustomSShareGeneratingFunction} externalSignerSShareGenerator a function that creates S shares in the ECDSA TSS flow.
   */
  signEcdsaTssUsingExternalSigner(
    params: TSSParams | TSSParamsForMessage,
    requestType: RequestType,
    externalSignerPaillierModulusGetter: CustomPaillierModulusGetterFunction,
    externalSignerKShareGenerator: CustomKShareGeneratingFunction,
    externalSignerMuDeltaShareGenerator: CustomMuDeltaShareGeneratingFunction,
    externalSignerSShareGenerator: CustomSShareGeneratingFunction
  ): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  /**
   * Signs a transaction using TSS MPCv2 for ECDSA and through utilization of custom share generators
   *
   * @param {TSSParams | TSSParamsForMessage} params - params object that represents parameters to sign a transaction or a message.
   * @param {CustomMPCv2SigningRound1GeneratingFunction} externalSignerMPCv2SigningRound1Generator - a function that creates MPCv2 Round 1 shares in the ECDSA TSS MPCv2 flow.
   * @param {CustomMPCv2SigningRound2GeneratingFunction} externalSignerMPCv2SigningRound2Generator - a function that creates MPCv2 Round 2 shares in the ECDSA TSS MPCv2 flow.
   * @param {CustomMPCv2SigningRound3GeneratingFunction} externalSignerMPCv2SigningRound3Generator - a function that creates MPCv2 Round 3 shares in the ECDSA TSS MPCv2 flow.
   * @param {RequestType} requestType - the type of the request to sign (transaction or message).
   * @returns {Promise<TxRequest>} - a signed tx request
   */
  signEcdsaMPCv2TssUsingExternalSigner(
    params: TSSParams | TSSParamsForMessage,
    externalSignerMPCv2SigningRound1Generator: CustomMPCv2SigningRound1GeneratingFunction,
    externalSignerMPCv2SigningRound2Generator: CustomMPCv2SigningRound2GeneratingFunction,
    externalSignerMPCv2SigningRound3Generator: CustomMPCv2SigningRound3GeneratingFunction,
    requestType?: RequestType
  ): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  /**
   * Create an Commitment (User to BitGo) share from an unsigned transaction and private user signing material
   * EDDSA only
   *
   * @param {Object} params - params object
   * @param {TxRequest} params.txRequest - transaction request with unsigned transaction
   * @param {string} params.prv - user signing material
   * @param {string} params.walletPassphrase - wallet passphrase
   *
   * @returns {Promise<{ userToBitgoCommitment: CommitmentShareRecor, encryptedSignerShare: EncryptedSignerShareRecord }>} - Commitment Share and the Encrypted Signer Share to BitGo
   */
  createCommitmentShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
    walletPassphrase: string;
    bitgoGpgPubKey: string;
  }): Promise<{
    userToBitgoCommitment: CommitmentShareRecord;
    encryptedSignerShare: EncryptedSignerShareRecord;
    encryptedUserToBitgoRShare: EncryptedSignerShareRecord;
  }> {
    throw new Error('Method not implemented.');
  }

  /**
   * Create an R (User to BitGo) share from an unsigned transaction and private user signing material
   *
   * @param {Object} params - params object
   * @param {TxRequest} params.txRequest - transaction request with unsigned transaction
   * @param {string} params.prv - user signing material
   * @param {string} [params.walletPassphrase] - wallet passphrase
   * @param {EncryptedSignerShareRecord} [params.encryptedUserToBitgoRShare] - encrypted user to bitgo R share generated in the commitment phase
   * @returns {Promise<{ rShare: SignShare }>} - R Share to BitGo
   */
  createRShareFromTxRequest(params: {
    txRequest: TxRequest;
    walletPassphrase: string;
    encryptedUserToBitgoRShare: EncryptedSignerShareRecord;
  }): Promise<{ rShare: SignShare }> {
    throw new Error('Method not implemented.');
  }

  /**
   * Create a G (User to BitGo) share from an unsigned transaction and private user signing material
   *
   * @param {Object} params - params object
   * @param {TxRequest} params.txRequest - transaction request with unsigned transaction
   * @param {string} params.prv - user signing material
   * @param {SignatureShareRecord} params.bitgoToUserRShare - BitGo to User R Share
   * @param {SignShare} params.userToBitgoRShare - User to BitGo R Share
   * @param {CommitmentShareRecord} params.bitgoToUserCommitment - BitGo to User Commitment
   * @returns {Promise<GShare>} - GShare from User to BitGo
   */
  createGShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
    bitgoToUserRShare: SignatureShareRecord;
    userToBitgoRShare: SignShare;
    bitgoToUserCommitment: CommitmentShareRecord;
  }): Promise<GShare> {
    throw new Error('Method not implemented.');
  }

  /**
   * Builds a tx request from params and verify it
   *
   * @param {PrebuildTransactionWithIntentOptions} params - parameters to build the tx
   * @param {TxRequestVersion} apiVersion lite or full
   * @param {boolean} preview boolean indicating if this is to preview a tx request, which will not initiate policy checks or pending approvals
   * @returns {Promise<TxRequest>} - a built tx request
   */
  async prebuildTxWithIntent(
    params: PrebuildTransactionWithIntentOptions,
    apiVersion: TxRequestVersion = 'lite',
    preview?: boolean
  ): Promise<TxRequest> {
    const intentOptions = this.populateIntent(this.baseCoin, params);

    const whitelistedParams = {
      intent: {
        ...intentOptions,
      },
      apiVersion: apiVersion,
      preview,
    };

    const reqTracer = params.reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    const unsignedTx = (await this.bitgo
      .post(this.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests', 2))
      .send(whitelistedParams)
      .result()) as TxRequest;

    return unsignedTx;
  }

  /**
   * Create a tx request from params for message signing
   * @deprecated Use createSignMessageRequest instead
   *
   * @param params
   * @param apiVersion
   * @param preview
   */
  async createTxRequestWithIntentForMessageSigning(
    params: IntentOptionsForMessage,
    apiVersion: TxRequestVersion = 'full',
    preview?: boolean
  ): Promise<TxRequest> {
    const intentOptions: PopulatedIntentForMessageSigning = {
      custodianMessageId: params.custodianMessageId,
      intentType: params.intentType,
      sequenceId: params.sequenceId,
      comment: params.comment,
      memo: params.memo?.value,
      isTss: params.isTss,
      messageRaw: params.messageRaw,
      messageEncoded: params.messageEncoded ?? '',
    };

    return this.createTxRequestBase(intentOptions, apiVersion, preview, params.reqId);
  }

  /**
   * Create a sign message request
   *
   * @param params - the parameters for the sign message request
   * @param apiVersion - the API version to use, defaults to 'full'
   */
  async buildSignMessageRequest(
    params: IntentOptionsForMessage,
    apiVersion: TxRequestVersion = 'full'
  ): Promise<TxRequest> {
    assert(
      params.intentType === 'signMessage',
      'Intent type must be signMessage for createMsgRequestWithSignMessageIntent'
    );
    const intent: PopulatedIntentForMessageSigning = {
      custodianMessageId: params.custodianMessageId,
      intentType: params.intentType,
      sequenceId: params.sequenceId,
      comment: params.comment,
      memo: params.memo?.value,
      isTss: params.isTss,
      messageRaw: params.messageRaw,
      messageStandardType: params.messageStandardType ?? MessageStandardType.UNKNOWN,
      messageEncoded: params.messageEncoded ?? '',
    };

    return this.buildSignMessageRequestBase(intent, apiVersion, params.reqId);
  }

  /**
   * Create a tx request from params for type data signing
   *
   * @param params
   * @param apiVersion
   * @param preview
   */
  async createTxRequestWithIntentForTypedDataSigning(
    params: IntentOptionsForTypedData,
    apiVersion: TxRequestVersion = 'full',
    preview?: boolean
  ): Promise<TxRequest> {
    const intentOptions: PopulatedIntentForTypedDataSigning = {
      custodianMessageId: params.custodianMessageId,
      intentType: params.intentType,
      sequenceId: params.sequenceId,
      comment: params.comment,
      memo: params.memo?.value,
      isTss: params.isTss,
      messageRaw: params.typedDataRaw,
      messageEncoded: params.typedDataEncoded ?? '',
    };

    return this.createTxRequestBase(intentOptions, apiVersion, preview, params.reqId);
  }

  /**
   * Calls Bitgo API to create tx request.
   *
   * @private
   */
  private async createTxRequestBase(
    intentOptions: PopulatedIntentForTypedDataSigning | PopulatedIntentForMessageSigning,
    apiVersion: TxRequestVersion,
    preview?: boolean,
    reqId?: IRequestTracer
  ): Promise<TxRequest> {
    const whitelistedParams = {
      intent: {
        ...intentOptions,
      },
      apiVersion,
      preview,
    };

    const reqTracer = reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    return this.bitgo
      .post(this.bitgo.url(`/wallet/${this.wallet.id()}/txrequests`, 2))
      .send(whitelistedParams)
      .result();
  }

  /**
   * Calls Bitgo API to create msg request.
   *
   * @private
   */
  private async buildSignMessageRequestBase(
    intent: PopulatedIntentForMessageSigning,
    apiVersion: TxRequestVersion,
    reqId?: IRequestTracer
  ): Promise<TxRequest> {
    const whitelistedParams = {
      intent: {
        ...intent,
      },
      apiVersion,
    };

    const reqTracer = reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    return this.bitgo
      .post(this.bitgo.url(`/wallet/${this.wallet.id()}/msgrequests`, 2))
      .send(whitelistedParams)
      .result();
  }

  /**
   * Call delete signature shares for a txRequest, the endpoint delete the signatures and return them
   *
   * @param {string} txRequestId tx id reference to delete signature shares
   * @param {IRequestTracer} reqId - the request tracer request id
   * @returns {SignatureShareRecord[]}
   */
  async deleteSignatureShares(txRequestId: string, reqId?: IRequestTracer): Promise<SignatureShareRecord[]> {
    const reqTracer = reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    return this.bitgo
      .del(this.bitgo.url(`/wallet/${this.wallet.id()}/txrequests/${txRequestId}/signatureshares`, 2))
      .send()
      .result();
  }

  /**
   * Initialize the send procedure once Bitgo has the User To Bitgo GShare
   *
   * @param {String} txRequestId - the txRequest Id
   * @param {IRequestTracer} reqId - the request tracer request id
   * @returns {Promise<any>}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendTxRequest(txRequestId: string, reqId?: IRequestTracer): Promise<any> {
    const reqTracer = reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    return this.bitgo
      .post(this.baseCoin.url('/wallet/' + this.wallet.id() + '/tx/send'))
      .send({ txRequestId })
      .result();
  }

  /**
   * Delete signature shares, get the tx request without them from the db and sign it to finally send it.
   *
   * Note : This can be performed in order to reach latest network conditions required on pending approval flow.
   *
   * @param {String} txRequestId - the txRequest Id to make the requests.
   * @param {String} decryptedPrv - decrypted prv to sign the tx request.
   * @param {RequestTracer} reqId id tracer.
   * @returns {Promise<any>}
   */
  async recreateTxRequest(txRequestId: string, decryptedPrv: string, reqId: IRequestTracer): Promise<TxRequest> {
    await this.deleteSignatureShares(txRequestId, reqId);
    // after delete signatures shares get the tx without them
    const txRequest = await getTxRequest(this.bitgo, this.wallet.id(), txRequestId, reqId);
    return await this.signTxRequest({ txRequest, prv: decryptedPrv, reqId });
  }

  /**
   * Gets the latest Tx Request by id
   *
   * @param {String} txRequestId - the txRequest Id
   * @param {IRequestTracer} reqId - request tracer request id
   * @returns {Promise<TxRequest>}
   */
  async getTxRequest(txRequestId: string, reqId?: IRequestTracer): Promise<TxRequest> {
    return getTxRequest(this.bitgo, this.wallet.id(), txRequestId, reqId);
  }

  /**
   * It gets the appropriate BitGo GPG public key for key creation based on a
   * combination of coin and the feature flags on the user and their enterprise if set.
   * @param enterpriseId - enterprise under which user wants to create the wallet
   * @param isMPCv2 - true to get the MPCv2 GPG public key, defaults to false
   * @param reqId - request tracer request id
   */
  public async getBitgoGpgPubkeyBasedOnFeatureFlags(
    enterpriseId: string | undefined,
    isMPCv2 = false,
    reqId?: IRequestTracer
  ): Promise<Key> {
    const reqTracer = reqId || new RequestTracer();
    this.bitgo.setRequestTracer(reqTracer);
    const response: BitgoGPGPublicKey = await this.bitgo
      .get(this.baseCoin.url('/tss/pubkey'))
      .query({ enterpriseId })
      .retry(3)
      .result();
    const bitgoPublicKeyStr = isMPCv2 ? response.mpcv2PublicKey : response.publicKey;
    return readKey({ armoredKey: bitgoPublicKeyStr as string });
  }

  /**
   * Returns supported TxRequest versions for this wallet
   * @deprecated Whenever needed, use apiVersion 'full' for TSS wallets
   */
  public supportedTxRequestVersions(): TxRequestVersion[] {
    if (!this._wallet || this._wallet.type() === 'trading' || this._wallet.multisigType() !== 'tss') {
      return [];
    } else if (this._wallet.baseCoin.getMPCAlgorithm() === 'ecdsa') {
      return ['full'];
    } else if (this._wallet.baseCoin.getMPCAlgorithm() === 'eddsa' && this._wallet.type() === 'hot') {
      return ['lite', 'full'];
    } else {
      return ['full'];
    }
  }

  /**
   * Returns true if the txRequest is using apiVersion == full and is pending approval
   * @param txRequest
   * @returns boolean
   */
  isPendingApprovalTxRequestFull(txRequest: TxRequest): boolean {
    const { apiVersion, state } = txRequest;
    return apiVersion === 'full' && 'pendingApproval' === state;
  }
}
