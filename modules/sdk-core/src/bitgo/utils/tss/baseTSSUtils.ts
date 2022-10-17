import { IRequestTracer } from '../../../api';
import { SerializedKeyPair } from 'openpgp';
import { KeychainsTriplet, IBaseCoin } from '../../baseCoin';
import { BitGoBase } from '../../bitgoBase';
import { Keychain } from '../../keychain';
import { getTxRequest } from '../../tss';
import { IWallet } from '../../wallet';
import { MpcUtils } from '../mpcUtils';
import * as _ from 'lodash';
import {
  CustomGShareGeneratingFunction,
  CustomRShareGeneratingFunction,
  ITssUtils,
  PrebuildTransactionWithIntentOptions,
  SignatureShareRecord,
  BitgoHeldBackupKeyShare,
  TSSParams,
  TxRequest,
  TxRequestVersion,
  BackupKeyShare,
} from './baseTypes';
import { SignShare, YShare, GShare } from '../../../account-lib/mpc/tss/eddsa/types';

/**
 * BaseTssUtil class which different signature schemes have to extend
 */
export default class BaseTssUtils<KeyShare> extends MpcUtils implements ITssUtils<KeyShare> {
  private _wallet?: IWallet;

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

  async createBitgoHeldBackupKeyShare(userGpgKey: SerializedKeyPair<string>): Promise<BitgoHeldBackupKeyShare> {
    return await this.bitgo
      .post(this.baseCoin.url('/krs/backupkeys'))
      .send({
        userPub: userGpgKey.publicKey,
      })
      .result();
  }

  public finalizeBitgoHeldBackupKeyShare(
    keyId: string,
    commonKeychain: string,
    userKeyShare: KeyShare,
    bitgoKeychain: Keychain
  ): Promise<BitgoHeldBackupKeyShare> {
    throw new Error('Method not implemented.');
  }

  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare | BackupKeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string,
    isThirdPartyBackup?: boolean
  ): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare | BackupKeyShare,
    bitgoKeychain: Keychain,
    passphrase?: string,
    backupXpubProvider?: string,
    isThirdPartyBackup?: boolean
  ): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare | BackupKeyShare,
    enterprise: string,
    isThirdPartyBackup?: boolean
  ): Promise<Keychain> {
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

  signTxRequest(params: TSSParams): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  signTxRequestForMessage(params: TSSParams): Promise<TxRequest> {
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
  signUsingExternalSigner(
    txRequest: string | TxRequest,
    externalSignerRShareGenerator: CustomRShareGeneratingFunction,
    externalSignerGShareGenerator: CustomGShareGeneratingFunction
  ): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  /**
   * Create an R (User to BitGo) share from an unsigned transaction and private user signing material
   *
   * @param {TxRequest} txRequest - transaction request with unsigned transaction
   * @param {string} prv - user signing material
   * @returns {Promise<{ rShare: SignShare; signingKeyYShare: YShare }>} - R Share and the Signing Key's Y share to BitGo
   */
  createRShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
  }): Promise<{ rShare: SignShare; signingKeyYShare: YShare }> {
    throw new Error('Method not implemented.');
  }

  /**
   * Create a G (User to BitGo) share from an unsigned transaction and private user signing material
   *
   * @param {TxRequest} txRequest - transaction request with unsigned transaction
   * @param {string} prv - user signing material
   * @param {SignatureShareRecord} bitgoToUserRShare - BitGo to User R Share
   * @param {SignShare} userToBitgoRShare - User to BitGo R Share
   * @returns {Promise<GShare>} - GShare from User to BitGo
   */
  createGShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
    bitgoToUserRShare: SignatureShareRecord;
    userToBitgoRShare: SignShare;
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

    const unsignedTx = (await this.bitgo
      .post(this.bitgo.url('/wallet/' + this.wallet.id() + '/txrequests', 2))
      .send(whitelistedParams)
      .result()) as TxRequest;

    return unsignedTx;
  }

  /**
   * Call delete signature shares for a txRequest, the endpoint delete the signatures and return them
   *
   * @param {string} txRequestId tx id reference to delete signature shares
   * @returns {SignatureShareRecord[]}
   */
  async deleteSignatureShares(txRequestId: string): Promise<SignatureShareRecord[]> {
    return this.bitgo
      .del(this.bitgo.url(`/wallet/${this.wallet.id()}/txrequests/${txRequestId}/signatureshares`, 2))
      .send()
      .result();
  }

  /**
   * Initialize the send procedure once Bitgo has the User To Bitgo GShare
   *
   * @param {String} txRequestId - the txRequest Id
   * @returns {Promise<any>}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendTxRequest(txRequestId: string): Promise<any> {
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
    await this.deleteSignatureShares(txRequestId);
    // after delete signatures shares get the tx without them
    const txRequest = await getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
    return await this.signTxRequest({ txRequest, prv: decryptedPrv, reqId });
  }

  /**
   * Gets the latest Tx Request by id
   *
   * @param {String} txRequestId - the txRequest Id
   * @returns {Promise<TxRequest>}
   */
  async getTxRequest(txRequestId: string): Promise<TxRequest> {
    return getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
  }

  /**
   * Checks whether the third party backup provider is valid/supported
   * @param backupProvider - the backup provider client selected
   */
  isValidThirdPartyBackupProvider(backupProvider: string | undefined): boolean {
    // As of now, BitGo is the only supported KRS provider for TSS
    return !!(backupProvider && backupProvider === 'BitGoKRS');
  }
}
