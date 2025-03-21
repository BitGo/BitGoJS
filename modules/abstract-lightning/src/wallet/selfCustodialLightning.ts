import * as sdkcore from '@bitgo/sdk-core';
import { BackupResponse, UpdateLightningWalletClientRequest, UpdateLightningWalletEncryptedRequest } from '../codecs';
import { getLightningAuthKeychains, ILightningWallet, LightningWallet } from './lightning';
import { createMessageSignature, deriveLightningServiceSharedSecret, isLightningCoinName } from '../lightning';
import * as t from 'io-ts';

function encryptWalletUpdateRequest(
  wallet: sdkcore.IWallet,
  params: UpdateLightningWalletClientRequest,
  userAuthKeyEncryptedPrv: string
): UpdateLightningWalletEncryptedRequest {
  const coinName = wallet.coin() as 'tlnbtc' | 'lnbtc';

  const requestWithEncryption: Partial<UpdateLightningWalletClientRequest & UpdateLightningWalletEncryptedRequest> = {
    ...params,
  };

  const userAuthXprv = wallet.bitgo.decrypt({
    password: params.passphrase,
    input: userAuthKeyEncryptedPrv,
  });

  if (params.signerTlsKey) {
    requestWithEncryption.encryptedSignerTlsKey = wallet.bitgo.encrypt({
      password: params.passphrase,
      input: params.signerTlsKey,
    });
  }

  if (params.signerAdminMacaroon) {
    requestWithEncryption.encryptedSignerAdminMacaroon = wallet.bitgo.encrypt({
      password: params.passphrase,
      input: params.signerAdminMacaroon,
    });
  }

  if (params.signerMacaroon) {
    requestWithEncryption.encryptedSignerMacaroon = wallet.bitgo.encrypt({
      password: deriveLightningServiceSharedSecret(coinName, userAuthXprv).toString('hex'),
      input: params.signerMacaroon,
    });
  }

  return t.exact(UpdateLightningWalletEncryptedRequest).encode(requestWithEncryption);
}

/**
 * Updates the coin-specific configuration for a Lightning Wallet.
 *
 * @param {Wallet} wallet - Wallet.
 * @param {UpdateLightningWalletClientRequest} params - The parameters containing the updated wallet-specific details.
 *   - `encryptedSignerMacaroon` (optional): This macaroon is used by the watch-only node to ask the signer node to sign transactions.
 *     Encrypted with ECDH secret key from private key of wallet's user auth key and public key of lightning service.
 *   - `encryptedSignerAdminMacaroon` (optional): Generated when initializing the wallet of the signer node.
 *     Encrypted with client's wallet passphrase.
 *   - `signerHost` (optional): The host address of the Lightning signer node.
 *   - `encryptedSignerTlsKey` (optional): The wallet passphrase encrypted TLS key of the signer.
 *   - `passphrase` (required): The wallet passphrase.
 *   - `signerTlsCert` (optional): The TLS certificate of the signer.
 *   - `watchOnlyAccounts` (optional): These are the accounts used to initialize the watch-only wallet.
 * @returns {Promise<unknown>} A promise resolving to the updated wallet response or throwing an error if the update fails.
 */
export async function updateWalletCoinSpecific(
  wallet: sdkcore.IWallet,
  params: UpdateLightningWalletClientRequest
): Promise<unknown> {
  if (!isLightningCoinName(wallet.coin())) {
    throw new Error(`cant update lightning wallet coin specific for coin ${wallet.subType()}`);
  }
  if (wallet.subType() !== 'lightningSelfCustody') {
    throw new Error(`cant update lightning wallet coin specific for wallet type ${wallet.subType()}`);
  }

  sdkcore.decodeOrElse(
    UpdateLightningWalletClientRequest.name,
    UpdateLightningWalletClientRequest,
    params,
    (errors) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error(`Invalid params for lightning specific update wallet`);
    }
  );

  const { userAuthKey } = await getLightningAuthKeychains(wallet);
  const userAuthKeyEncryptedPrv = userAuthKey.encryptedPrv;
  if (!userAuthKeyEncryptedPrv) {
    throw new Error(`user auth key is missing encrypted private key`);
  }
  const updateRequestWithEncryption = encryptWalletUpdateRequest(wallet, params, userAuthKeyEncryptedPrv);
  const signature = createMessageSignature(
    updateRequestWithEncryption,
    wallet.bitgo.decrypt({ password: params.passphrase, input: userAuthKeyEncryptedPrv })
  );
  const coinSpecific = {
    [wallet.coin()]: {
      signedRequest: updateRequestWithEncryption,
      signature,
    },
  };
  return await wallet.bitgo.put(wallet.url()).send({ coinSpecific }).result();
}

export interface ISelfCustodialLightningWallet extends ILightningWallet {
  /**
   * Get the channel backup for the given wallet.
   * @returns {Promise<BackupResponse>} A promise resolving to the channel backup
   */
  getChannelBackup(): Promise<BackupResponse>;
}

export class SelfCustodialLightningWallet extends LightningWallet implements ISelfCustodialLightningWallet {
  constructor(wallet: sdkcore.IWallet) {
    super(wallet);
    if (wallet.subType() !== 'lightningSelfCustody') {
      throw new Error(`Invalid lightning wallet type for self custodial lightning: ${wallet.subType()}`);
    }
  }

  async getChannelBackup(): Promise<BackupResponse> {
    const backupResponse = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/backup`))
      .result();
    return sdkcore.decodeOrElse(BackupResponse.name, BackupResponse, backupResponse, (error) => {
      throw new Error(`Invalid backup response: ${error}`);
    });
  }
}
