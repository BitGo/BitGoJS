import { getLightningAuthKeychains, ILightningWallet, LightningWallet } from './lightning';
import * as sdkcore from '@bitgo/sdk-core';
import {
  CancelUserAuthKeyResetResponse,
  UserAuthKeyResetRequest,
  UserAuthKeyResetRequestInfo,
  UserAuthKeyResetResponse,
  UserAuthKeyResetSignedRequest,
  UserAuthKeyResetStatus,
} from '../codecs';
import { createMessageSignature, getUtxolibNetwork } from '../lightning';
import { computeUserAuthResetVerificationCode } from './userAuthKeyReset';

export interface ICustodialLightningWallet extends ILightningWallet {
  /**
   * Starts a customer-initiated userAuth key reset for a forgotten wallet password.
   *
   * Generates a new userAuth key locally, encrypts it with the new passphrase, registers it as an unattached key,
   * signs a proof with it and queues the request. The customer reads the returned verification code to BitGo support.
   * The private key and the passphrase never leave this method.
   *
   * @param params.passphrase the NEW wallet passphrase that encrypts the new key
   * @param params.encryptionVersion encryption version used for the new key
   * @returns the request id and status from the server, and the verification code computed locally
   */
  requestUserAuthKeyReset(params: {
    passphrase: string;
    encryptionVersion?: sdkcore.EncryptionVersion;
  }): Promise<{ requestId: string; status: UserAuthKeyResetStatus; verificationCode: string }>;

  /**
   * Gets the caller's latest userAuth key reset request. Rejects with an error whose `status` is 404 when there is none.
   */
  getUserAuthKeyResetRequest(): Promise<UserAuthKeyResetRequestInfo>;

  /**
   * Cancels a userAuth key reset request. Only possible while the request is still `requested`.
   */
  cancelUserAuthKeyResetRequest(requestId: string): Promise<CancelUserAuthKeyResetResponse>;
}

export class CustodialLightningWallet extends LightningWallet implements ICustodialLightningWallet {
  constructor(wallet: sdkcore.IWallet) {
    super(wallet);
    if (wallet.subType() !== 'lightningCustody') {
      throw new Error(`Invalid lightning wallet type for custodial lightning: ${wallet.subType()}`);
    }
  }

  private resetRequestUrl(requestId?: string): string {
    const suffix = requestId === undefined ? '' : `/${encodeURIComponent(requestId)}`;
    return this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/userAuthKey/resetRequest${suffix}`);
  }

  async requestUserAuthKeyReset(params: {
    passphrase: string;
    encryptionVersion?: sdkcore.EncryptionVersion;
  }): Promise<{ requestId: string; status: UserAuthKeyResetStatus; verificationCode: string }> {
    const coin = this.wallet.baseCoin;
    const { userAuthKey } = await getLightningAuthKeychains(this.wallet);

    const { pub, prv } = coin.keychains().create();
    if (!pub || !prv) {
      throw new Error('Failed to generate user auth key');
    }

    // Same shape wallet creation uses for the userAuth key; no passcode encryption code is sent.
    const newKeychain = await coin.keychains().add({
      pub,
      encryptedPrv: await this.wallet.bitgo.encrypt({
        password: params.passphrase,
        input: prv,
        encryptionVersion: params.encryptionVersion,
      }),
      source: 'user',
      keyType: 'independent',
      coinSpecific: { [coin.getChain()]: { purpose: 'userAuth' } },
    });

    const signedRequest: UserAuthKeyResetSignedRequest = {
      walletId: this.wallet.id(),
      oldUserAuthKeyPub: userAuthKey.pub,
      newUserAuthKeyPub: pub,
      newUserAuthKeyId: newKeychain.id,
      createdAt: new Date().toISOString(),
    };
    const body: UserAuthKeyResetRequest = {
      newUserAuthKeyId: newKeychain.id,
      signedRequest,
      signature: createMessageSignature(signedRequest, prv, getUtxolibNetwork(coin.getChain())),
    };

    const response = await this.wallet.bitgo
      .post(this.resetRequestUrl())
      .send(UserAuthKeyResetRequest.encode(body))
      .result();
    const result = sdkcore.decodeOrElse(UserAuthKeyResetResponse.name, UserAuthKeyResetResponse, response, () => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error('Invalid user auth key reset response');
    });

    return {
      requestId: result.requestId,
      status: result.status,
      // Never taken from the server: the customer compares it against what support is shown.
      verificationCode: computeUserAuthResetVerificationCode(this.wallet.id(), pub),
    };
  }

  async getUserAuthKeyResetRequest(): Promise<UserAuthKeyResetRequestInfo> {
    const response = await this.wallet.bitgo.get(this.resetRequestUrl()).result();
    return sdkcore.decodeOrElse(UserAuthKeyResetRequestInfo.name, UserAuthKeyResetRequestInfo, response, () => {
      throw new Error('Invalid user auth key reset request response');
    });
  }

  async cancelUserAuthKeyResetRequest(requestId: string): Promise<CancelUserAuthKeyResetResponse> {
    const response = await this.wallet.bitgo.del(this.resetRequestUrl(requestId)).send().result();
    return sdkcore.decodeOrElse(CancelUserAuthKeyResetResponse.name, CancelUserAuthKeyResetResponse, response, () => {
      throw new Error('Invalid user auth key reset cancel response');
    });
  }
}
