import { getLightningAuthKeychains, ILightningWallet, LightningWallet } from './lightning';
import * as sdkcore from '@bitgo/sdk-core';
import { createMessageSignature, getUtxolibNetwork } from '../lightning';
import { UserAuthKeyResetRequest, UserAuthKeyResetResponse, UserAuthKeyResetSignedRequest } from '../codecs';
import { computeUserAuthResetVerificationCode } from './userAuthKeyReset';

export interface ICustodialLightningWallet extends ILightningWallet {
  requestUserAuthKeyReset(params: {
    passphrase: string;
    encryptionVersion?: sdkcore.EncryptionVersion;
  }): Promise<{ requestId: string; status: string; verificationCode: string }>;
  getUserAuthKeyResetRequest(): Promise<UserAuthKeyResetResponse>;
  cancelUserAuthKeyResetRequest(requestId: string): Promise<unknown>;
}

export class CustodialLightningWallet extends LightningWallet implements ICustodialLightningWallet {
  constructor(wallet: sdkcore.IWallet) {
    super(wallet);
    if (wallet.subType() !== 'lightningCustody') {
      throw new Error(`Invalid lightning wallet type for custodial lightning: ${wallet.subType()}`);
    }
  }

  async requestUserAuthKeyReset(params: {
    passphrase: string;
    encryptionVersion?: sdkcore.EncryptionVersion;
  }): Promise<{ requestId: string; status: string; verificationCode: string }> {
    const { userAuthKey } = await getLightningAuthKeychains(this.wallet);
    const coin = this.wallet.baseCoin;
    const { pub, prv } = coin.keychains().create();
    if (!pub || !prv) {
      throw new Error('Failed to generate user auth key');
    }
    const encryptedPrv = await this.wallet.bitgo.encrypt({
      password: params.passphrase,
      input: prv,
      encryptionVersion: params.encryptionVersion,
    });
    const { id: newUserAuthKeyId } = await coin.keychains().add({
      pub,
      encryptedPrv,
      source: 'user',
      keyType: 'independent',
      coinSpecific: { [coin.getChain()]: { purpose: 'userAuth' } },
    });
    const signedRequest: UserAuthKeyResetSignedRequest = {
      walletId: this.wallet.id(),
      oldUserAuthKeyPub: userAuthKey.pub,
      newUserAuthKeyPub: pub,
      newUserAuthKeyId,
      createdAt: new Date().toISOString(),
    };
    const request: UserAuthKeyResetRequest = {
      newUserAuthKeyId,
      signedRequest,
      signature: createMessageSignature(signedRequest, prv, getUtxolibNetwork(coin.getChain())),
    };
    const response = await this.wallet.bitgo
      .post(coin.url(`/wallet/${this.wallet.id()}/lightning/userAuthKey/resetRequest`))
      .send(UserAuthKeyResetRequest.encode(request))
      .result();
    const result = sdkcore.decodeOrElse(UserAuthKeyResetResponse.name, UserAuthKeyResetResponse, response, () => {
      throw new Error('Invalid user auth key reset response');
    });
    return {
      requestId: result.requestId,
      status: result.status,
      verificationCode: computeUserAuthResetVerificationCode(this.wallet.id(), pub),
    };
  }

  async getUserAuthKeyResetRequest(): Promise<UserAuthKeyResetResponse> {
    const response = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/userAuthKey/resetRequest`))
      .result();
    return sdkcore.decodeOrElse(UserAuthKeyResetResponse.name, UserAuthKeyResetResponse, response, () => {
      throw new Error('Invalid user auth key reset response');
    });
  }

  async cancelUserAuthKeyResetRequest(requestId: string): Promise<unknown> {
    return await this.wallet.bitgo
      .del(
        this.wallet.baseCoin.url(
          `/wallet/${this.wallet.id()}/lightning/userAuthKey/resetRequest/${encodeURIComponent(requestId)}`
        )
      )
      .result();
  }
}
