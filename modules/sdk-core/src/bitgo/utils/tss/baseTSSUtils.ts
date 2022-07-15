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
  ITssUtils,
  PrebuildTransactionWithIntentOptions,
  SignatureShareRecord,
  TxRequest,
  TxRequestVersion,
} from './baseTypes';

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

  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string,
    recipientIndex?: number | undefined
  ): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise: string
  ): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createKeychains(params: {
    passphrase: string;
    enterprise?: string | undefined;
    originalPasscodeEncryptionCode?: string | undefined;
  }): Promise<KeychainsTriplet> {
    throw new Error('Method not implemented.');
  }

  signTxRequest(params: { txRequest: string | TxRequest; prv: string; reqId: IRequestTracer }): Promise<TxRequest> {
    throw new Error('Method not implemented.');
  }

  prebuildTxWithIntent(
    params: PrebuildTransactionWithIntentOptions,
    apiVersion?: TxRequestVersion | undefined,
    preview?: boolean | undefined
  ): Promise<TxRequest> {
    throw new Error('Method not implemented.');
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
}
