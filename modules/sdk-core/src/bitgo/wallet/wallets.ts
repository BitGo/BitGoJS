/**
 * @prettier
 */
import assert from 'assert';
import { BigNumber } from 'bignumber.js';
import { bip32 } from '@bitgo/utxo-lib';
import * as _ from 'lodash';
import { CoinFeature } from '@bitgo/statics';

import { sanitizeLegacyPath } from '../../api';
import * as common from '../../common';
import { IBaseCoin, KeychainsTriplet, SupplementGenerateWalletOptions } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { getSharedSecret } from '../ecdh';
import { AddKeychainOptions, Keychain, KeyIndices } from '../keychain';
import { decodeOrElse, promiseProps, RequestTracer } from '../utils';
import {
  AcceptShareOptions,
  AcceptShareOptionsRequest,
  AcceptShareResponse,
  AddWalletOptions,
  BulkAcceptShareOptions,
  BulkUpdateWalletShareOptions,
  BulkUpdateWalletShareOptionsRequest,
  BulkUpdateWalletShareResponse,
  GenerateBaseMpcWalletOptions,
  GenerateLightningWalletOptions,
  GenerateLightningWalletOptionsCodec,
  GenerateMpcWalletOptions,
  GenerateSMCMpcWalletOptions,
  GenerateWalletOptions,
  GetWalletByAddressOptions,
  GetWalletOptions,
  IWallets,
  LightningWalletWithKeychains,
  ListWalletOptions,
  UpdateShareOptions,
  WalletShares,
  WalletWithKeychains,
} from './iWallets';
import { WalletShare } from './iWallet';
import { Wallet } from './wallet';
import { TssSettings } from '@bitgo/public-types';

/**
 * Check if a wallet is a WalletWithKeychains
 */
export function isWalletWithKeychains(
  wallet: WalletWithKeychains | LightningWalletWithKeychains
): wallet is WalletWithKeychains {
  return wallet.responseType === 'WalletWithKeychains';
}

export class Wallets implements IWallets {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * Get a wallet by ID (proxy for getWallet)
   * @param params
   */
  async get(params: GetWalletOptions = {}): Promise<Wallet> {
    return this.getWallet(params);
  }

  /**
   * List a user's wallets
   * @param params
   * @returns {*}
   */
  async list(params: ListWalletOptions & { enterprise?: string } = {}): Promise<{ wallets: Wallet[] }> {
    if (params.skip && params.prevId) {
      throw new Error('cannot specify both skip and prevId');
    }
    const body = (await this.bitgo.get(this.baseCoin.url('/wallet')).query(params).result()) as any;
    body.wallets = body.wallets.map((w) => new Wallet(this.bitgo, this.baseCoin, w));
    return body;
  }

  /**
   * add
   * Add a new wallet (advanced mode).
   * This allows you to manually submit the keys, type, m and n of the wallet
   * Parameters include:
   *    "label": label of the wallet to be shown in UI
   *    "m": number of keys required to unlock wallet (2)
   *    "n": number of keys available on the wallet (3)
   *    "keys": array of keychain ids
   */
  async add(params: AddWalletOptions): Promise<any> {
    params = params || {};

    common.validateParams(params, [], ['label', 'enterprise', 'type']);

    if (typeof params.label !== 'string') {
      throw new Error('missing required string parameter label');
    }

    // no need to pass keys for (single) custodial wallets
    if (params.type !== 'custodial') {
      if (Array.isArray(params.keys) === false || !_.isNumber(params.m) || !_.isNumber(params.n)) {
        throw new Error('invalid argument');
      }

      // TODO: support more types of multisig
      if (!this.baseCoin.isValidMofNSetup(params)) {
        throw new Error('unsupported multi-sig type');
      }
    }

    if (params.gasPrice && !_.isNumber(params.gasPrice)) {
      throw new Error('invalid argument for gasPrice - number expected');
    }

    if (params.walletVersion) {
      if (!_.isNumber(params.walletVersion)) {
        throw new Error('invalid argument for walletVersion - number expected');
      }
      if (params.multisigType === 'tss' && this.baseCoin.getMPCAlgorithm() === 'ecdsa' && params.walletVersion === 3) {
        const tssSettings: TssSettings = await this.bitgo
          .get(this.bitgo.microservicesUrl('/api/v2/tss/settings'))
          .result();
        const multisigTypeVersion =
          tssSettings.coinSettings[this.baseCoin.getFamily()]?.walletCreationSettings?.multiSigTypeVersion;
        if (multisigTypeVersion === 'MPCv2') {
          params.walletVersion = 5;
        }
      }
    }

    if (params.tags && Array.isArray(params.tags) === false) {
      throw new Error('invalid argument for tags - array expected');
    }

    if (params.clientFlags && Array.isArray(params.clientFlags) === false) {
      throw new Error('invalid argument for clientFlags - array expected');
    }

    if (params.isCold && !_.isBoolean(params.isCold)) {
      throw new Error('invalid argument for isCold - boolean expected');
    }

    if (params.isCustodial && !_.isBoolean(params.isCustodial)) {
      throw new Error('invalid argument for isCustodial - boolean expected');
    }

    if (params.address && (!_.isString(params.address) || !this.baseCoin.isValidAddress(params.address))) {
      throw new Error('invalid argument for address - valid address string expected');
    }

    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet/add')).send(params).result();
    return {
      wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
    };
  }

  private async generateLightningWallet(params: GenerateLightningWalletOptions): Promise<LightningWalletWithKeychains> {
    const reqId = new RequestTracer();
    this.bitgo.setRequestTracer(reqId);

    const { label, passphrase, enterprise, passcodeEncryptionCode, subType } = params;

    // TODO BTC-1899: only userAuth key is required for custodial lightning wallet. all 3 keys are required for self custodial lightning.
    // to avoid changing the platform for custodial flow, let us all 3 keys both wallet types.
    const keychainPromises = ([undefined, 'userAuth', 'nodeAuth'] as const).map((purpose) => {
      return async (): Promise<Keychain> => {
        const keychain = this.baseCoin.keychains().create();
        const keychainParams: AddKeychainOptions = {
          pub: keychain.pub,
          encryptedPrv: this.bitgo.encrypt({ password: passphrase, input: keychain.prv }),
          originalPasscodeEncryptionCode: purpose === undefined ? passcodeEncryptionCode : undefined,
          coinSpecific: purpose === undefined ? undefined : { [this.baseCoin.getChain()]: { purpose } },
          keyType: 'independent',
          source: 'user',
        };
        return await this.baseCoin.keychains().add(keychainParams);
      };
    });

    const { userKeychain, userAuthKeychain, nodeAuthKeychain } = await promiseProps({
      userKeychain: keychainPromises[0](),
      userAuthKeychain: keychainPromises[1](),
      nodeAuthKeychain: keychainPromises[2](),
    });

    const walletParams: SupplementGenerateWalletOptions = {
      label,
      m: 1,
      n: 1,
      type: 'hot',
      subType,
      enterprise,
      keys: [userKeychain.id],
      coinSpecific: { [this.baseCoin.getChain()]: { keys: [userAuthKeychain.id, nodeAuthKeychain.id] } },
    };

    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet/add')).send(walletParams).result();
    const wallet = new Wallet(this.bitgo, this.baseCoin, newWallet);
    return {
      wallet,
      userKeychain,
      userAuthKeychain,
      nodeAuthKeychain,
      responseType: 'LightningWalletWithKeychains',
    };
  }

  /**
   * Generate a new wallet
   * 1. Creates the user keychain locally on the client, and encrypts it with the provided passphrase
   * 2. If no pub was provided, creates the backup keychain locally on the client, and encrypts it with the provided passphrase
   * 3. Uploads the encrypted user and backup keychains to BitGo
   * 4. Creates the BitGo key on the service
   * 5. Creates the wallet on BitGo with the 3 public keys above
   * @param params
   * @param params.label Label for the wallet
   * @param params.passphrase Passphrase to be used to encrypt the user and backup keychains
   * @param params.userKey User xpub
   * @param params.backupXpub Backup xpub
   * @param params.backupXpubProvider
   * @param params.enterprise the enterpriseId
   * @param params.disableTransactionNotifications
   * @param params.passcodeEncryptionCode optional this is a recovery code that can be used to decrypt the original passphrase in a recovery case.
   *                                      The user must generate and keep the encrypted original passphrase safe while this code is stored on BitGo
   * @param params.coldDerivationSeed optional seed for SMC wallets
   * @param params.gasPrice
   * @param params.disableKRSEmail
   * @param params.walletVersion
   * @param params.multisigType optional multisig type, 'onchain' or 'tss' or 'blsdkg'; if absent, we will defer to the coin's default type
   * @param params.isDistributedCustody optional parameter for creating bitgo key. This is only necessary if you want to create
   *                                    a distributed custody wallet. If provided, you must have the enterprise license and pass in
   *                                    `params.enterprise` into `generateWallet` as well.
   * @param params.type optional wallet type, 'hot' or 'cold' or 'custodial'; if absent, we will defer to 'hot'
   * @param params.bitgoKeyId optional bitgo key id for SMC TSS wallets
   * @param params.commonKeychain optional common keychain for SMC TSS wallets
   *
   * @returns {*}
   */
  async generateWallet(
    params: GenerateWalletOptions = {}
  ): Promise<WalletWithKeychains | LightningWalletWithKeychains> {
    // Assign the default multiSig type value based on the coin
    if (!params.multisigType) {
      params.multisigType = this.baseCoin.getDefaultMultisigType();
    }

    if (this.baseCoin.getFamily() === 'lnbtc') {
      const options = decodeOrElse(
        GenerateLightningWalletOptionsCodec.name,
        GenerateLightningWalletOptionsCodec,
        params,
        (errors) => {
          throw new Error(`error(s) parsing generate lightning wallet request params: ${errors}`);
        }
      );

      const walletData = await this.generateLightningWallet(options);
      walletData.encryptedWalletPassphrase = this.bitgo.encrypt({
        input: options.passphrase,
        password: options.passcodeEncryptionCode,
      });
      return walletData;
    }

    common.validateParams(params, ['label'], ['passphrase', 'userKey', 'backupXpub']);
    if (typeof params.label !== 'string') {
      throw new Error('missing required string parameter label');
    }

    const { type = 'hot', label, passphrase, enterprise, isDistributedCustody } = params;
    const isTss = params.multisigType === 'tss' && this.baseCoin.supportsTss();
    const canEncrypt = !!passphrase && typeof passphrase === 'string';

    const walletParams: SupplementGenerateWalletOptions = {
      label: label,
      m: 2,
      n: 3,
      keys: [],
      type: !!params.userKey && params.multisigType !== 'onchain' ? 'cold' : type,
    };

    if (!_.isUndefined(params.passcodeEncryptionCode)) {
      if (!_.isString(params.passcodeEncryptionCode)) {
        throw new Error('passcodeEncryptionCode must be a string');
      }
    }

    if (!_.isUndefined(enterprise)) {
      if (!_.isString(enterprise)) {
        throw new Error('invalid enterprise argument, expecting string');
      }
      walletParams.enterprise = enterprise;
    }

    // EVM TSS wallets must use wallet version 3, 5 and 6
    if (
      isTss &&
      this.baseCoin.isEVM() &&
      !(params.walletVersion === 3 || params.walletVersion === 5 || params.walletVersion === 6)
    ) {
      throw new Error('EVM TSS wallets are only supported for wallet version 3, 5 and 6');
    }

    if (isTss) {
      if (!this.baseCoin.supportsTss()) {
        throw new Error(`coin ${this.baseCoin.getFamily()} does not support TSS at this time`);
      }
      if (
        (params.walletVersion === 5 || params.walletVersion === 6) &&
        !this.baseCoin.getConfig().features.includes(CoinFeature.MPCV2)
      ) {
        throw new Error(`coin ${this.baseCoin.getFamily()} does not support TSS MPCv2 at this time`);
      }
      assert(enterprise, 'enterprise is required for TSS wallet');

      if (type === 'cold') {
        // validate
        assert(params.bitgoKeyId, 'bitgoKeyId is required for SMC TSS wallet');
        assert(params.commonKeychain, 'commonKeychain is required for SMC TSS wallet');
        return this.generateSMCMpcWallet({
          multisigType: 'tss',
          label,
          enterprise,
          walletVersion: params.walletVersion,
          bitgoKeyId: params.bitgoKeyId,
          commonKeychain: params.commonKeychain,
          coldDerivationSeed: params.coldDerivationSeed,
        });
      }

      if (type === 'custodial') {
        return this.generateCustodialMpcWallet({
          multisigType: 'tss',
          label,
          enterprise,
          walletVersion: params.walletVersion,
        });
      }

      assert(passphrase, 'cannot generate TSS keys without passphrase');
      const walletData = await this.generateMpcWallet({
        multisigType: 'tss',
        label,
        passphrase,
        originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
        enterprise,
        walletVersion: params.walletVersion,
      });
      if (params.passcodeEncryptionCode) {
        walletData.encryptedWalletPassphrase = this.bitgo.encrypt({
          input: passphrase,
          password: params.passcodeEncryptionCode,
        });
      }
      return walletData;
    }

    // Handle distributed custody
    if (isDistributedCustody) {
      if (!enterprise) {
        throw new Error('must provide enterprise when creating distributed custody wallet');
      }
      if (!type || type !== 'cold') {
        throw new Error('distributed custody wallets must be type: cold');
      }
    }

    const hasBackupXpub = !!params.backupXpub;
    const hasBackupXpubProvider = !!params.backupXpubProvider;
    if (hasBackupXpub && hasBackupXpubProvider) {
      throw new Error('Cannot provide more than one backupXpub or backupXpubProvider flag');
    }

    if (params.gasPrice && params.eip1559) {
      throw new Error('can not use both eip1559 and gasPrice values');
    }

    if (!_.isUndefined(params.disableTransactionNotifications)) {
      if (!_.isBoolean(params.disableTransactionNotifications)) {
        throw new Error('invalid disableTransactionNotifications argument, expecting boolean');
      }
      walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
    }

    if (!_.isUndefined(params.gasPrice)) {
      const gasPriceBN = new BigNumber(params.gasPrice);
      if (gasPriceBN.isNaN()) {
        throw new Error('invalid gas price argument, expecting number or number as string');
      }
      walletParams.gasPrice = gasPriceBN.toString();
    }

    if (!_.isUndefined(params.eip1559) && !_.isEmpty(params.eip1559)) {
      const maxFeePerGasBN = new BigNumber(params.eip1559.maxFeePerGas);
      if (maxFeePerGasBN.isNaN()) {
        throw new Error('invalid max fee argument, expecting number or number as string');
      }
      const maxPriorityFeePerGasBN = new BigNumber(params.eip1559.maxPriorityFeePerGas);
      if (maxPriorityFeePerGasBN.isNaN()) {
        throw new Error('invalid priority fee argument, expecting number or number as string');
      }
      walletParams.eip1559 = {
        maxFeePerGas: maxFeePerGasBN.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGasBN.toString(),
      };
    }

    if (!_.isUndefined(params.disableKRSEmail)) {
      if (!_.isBoolean(params.disableKRSEmail)) {
        throw new Error('invalid disableKRSEmail argument, expecting boolean');
      }
      walletParams.disableKRSEmail = params.disableKRSEmail;
    }

    if (!_.isUndefined(params.walletVersion)) {
      if (!_.isNumber(params.walletVersion)) {
        throw new Error('invalid walletVersion provided, expecting number');
      }
      walletParams.walletVersion = params.walletVersion;
    }

    // Ensure each krsSpecific param is either a string, boolean, or number
    const { krsSpecific } = params;
    if (!_.isUndefined(krsSpecific)) {
      Object.keys(krsSpecific).forEach((key) => {
        const val = krsSpecific[key];
        if (!_.isBoolean(val) && !_.isString(val) && !_.isNumber(val)) {
          throw new Error('krsSpecific object contains illegal values. values must be strings, booleans, or numbers');
        }
      });
    }

    let derivationPath: string | undefined = undefined;

    const reqId = new RequestTracer();

    if (params.type === 'custodial' && (params.multisigType ?? 'onchain') === 'onchain') {
      // for custodial multisig, when the wallet is created on the platfor side, the keys are not needed
      walletParams.n = undefined;
      walletParams.m = undefined;
      walletParams.keys = undefined;
      walletParams.keySignatures = undefined;

      const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet/add')).send(walletParams).result(); // returns the ids

      const userKeychain = this.baseCoin.keychains().get({ id: newWallet.keys[KeyIndices.USER], reqId });
      const backupKeychain = this.baseCoin.keychains().get({ id: newWallet.keys[KeyIndices.BACKUP], reqId });
      const bitgoKeychain = this.baseCoin.keychains().get({ id: newWallet.keys[KeyIndices.BITGO], reqId });

      const [userKey, bitgoKey, backupKey] = await Promise.all([userKeychain, bitgoKeychain, backupKeychain]);

      const result: WalletWithKeychains = {
        wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
        userKeychain: userKey,
        backupKeychain: bitgoKey,
        bitgoKeychain: backupKey,
        responseType: 'WalletWithKeychains',
      };

      return result;
    } else {
      const userKeychainPromise = async (): Promise<Keychain> => {
        let userKeychainParams;
        let userKeychain;
        // User provided user key
        if (params.userKey) {
          userKeychain = { pub: params.userKey };
          userKeychainParams = userKeychain;
          if (params.coldDerivationSeed) {
            // the derivation only makes sense when a key already exists
            const derivation = this.baseCoin.deriveKeyWithSeed({
              key: params.userKey,
              seed: params.coldDerivationSeed,
            });
            derivationPath = derivation.derivationPath;
            userKeychain.pub = derivation.key;
            userKeychain.derivedFromParentWithSeed = params.coldDerivationSeed;
          }
        } else {
          if (!canEncrypt) {
            throw new Error('cannot generate user keypair without passphrase');
          }
          // Create the user key.
          userKeychain = this.baseCoin.keychains().create();
          userKeychain.encryptedPrv = this.bitgo.encrypt({ password: passphrase, input: userKeychain.prv });
          userKeychainParams = {
            pub: userKeychain.pub,
            encryptedPrv: userKeychain.encryptedPrv,
            originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
          };
        }

        userKeychainParams.reqId = reqId;
        const newUserKeychain = await this.baseCoin.keychains().add(userKeychainParams);
        return _.extend({}, newUserKeychain, userKeychain);
      };

      const backupKeychainPromise = async (): Promise<Keychain> => {
        if (params.backupXpubProvider) {
          // If requested, use a KRS or backup key provider
          return this.baseCoin.keychains().createBackup({
            provider: params.backupXpubProvider || 'defaultRMGBackupProvider',
            disableKRSEmail: params.disableKRSEmail,
            krsSpecific: params.krsSpecific,
            type: this.baseCoin.getChain(),
            passphrase: params.passphrase,
            reqId,
          });
        }

        // User provided backup xpub
        if (params.backupXpub) {
          // user provided backup ethereum address
          return this.baseCoin.keychains().add({
            pub: params.backupXpub,
            source: 'backup',
            reqId,
          });
        } else {
          if (!canEncrypt) {
            throw new Error('cannot generate backup keypair without passphrase');
          }
          // No provided backup xpub or address, so default to creating one here
          return this.baseCoin.keychains().createBackup({ reqId, passphrase: params.passphrase });
        }
      };
      const { userKeychain, backupKeychain, bitgoKeychain }: KeychainsTriplet = await promiseProps({
        userKeychain: userKeychainPromise(),
        backupKeychain: backupKeychainPromise(),
        bitgoKeychain: this.baseCoin
          .keychains()
          .createBitGo({ enterprise: params.enterprise, reqId, isDistributedCustody: params.isDistributedCustody }),
      });

      walletParams.keys = [userKeychain.id, backupKeychain.id, bitgoKeychain.id];

      const { prv } = userKeychain;
      if (_.isString(prv)) {
        assert(backupKeychain.pub);
        assert(bitgoKeychain.pub);
        walletParams.keySignatures = {
          backup: (await this.baseCoin.signMessage({ prv }, backupKeychain.pub)).toString('hex'),
          bitgo: (await this.baseCoin.signMessage({ prv }, bitgoKeychain.pub)).toString('hex'),
        };
      }

      const keychains = {
        userKeychain,
        backupKeychain,
        bitgoKeychain,
      };

      const finalWalletParams = await this.baseCoin.supplementGenerateWallet(walletParams, keychains);

      if (_.includes(['xrp', 'xlm', 'cspr'], this.baseCoin.getFamily()) && !_.isUndefined(params.rootPrivateKey)) {
        walletParams.rootPrivateKey = params.rootPrivateKey;
      }

      this.bitgo.setRequestTracer(reqId);
      const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet/add')).send(finalWalletParams).result();

      const result: WalletWithKeychains = {
        wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
        userKeychain: userKeychain,
        backupKeychain: backupKeychain,
        bitgoKeychain: bitgoKeychain,
        responseType: 'WalletWithKeychains',
      };

      if (!_.isUndefined(backupKeychain.prv)) {
        result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
      }

      if (!_.isUndefined(derivationPath)) {
        userKeychain.derivationPath = derivationPath;
      }

      if (canEncrypt && params.passcodeEncryptionCode) {
        result.encryptedWalletPassphrase = this.bitgo.encrypt({
          input: passphrase,
          password: params.passcodeEncryptionCode,
        });
      }

      return result;
    }
  }

  /**
   * List the user's wallet shares
   * @param params
   */
  async listShares(params: Record<string, unknown> = {}): Promise<any> {
    return await this.bitgo.get(this.baseCoin.url('/walletshare')).result();
  }

  /**
   * List the user's wallet shares v2
   * @returns {Promise<WalletShares>}
   */
  async listSharesV2(): Promise<WalletShares> {
    return await this.bitgo.get(this.bitgo.url('/walletshares', 2)).result();
  }

  /**
   * Gets a wallet share information, including the encrypted sharing keychain. requires unlock if keychain is present.
   * @param params
   * @param params.walletShareId - the wallet share to get information on
   */
  async getShare(params: { walletShareId?: string } = {}): Promise<any> {
    common.validateParams(params, ['walletShareId'], []);

    return await this.bitgo.get(this.baseCoin.url('/walletshare/' + params.walletShareId)).result();
  }

  /**
   * Update a wallet share
   * @param params.walletShareId - the wallet share to update
   * @param params.state - the new state of the wallet share
   * @param params
   */
  async updateShare(params: UpdateShareOptions = {}): Promise<any> {
    common.validateParams(params, ['walletShareId'], []);

    return await this.bitgo
      .post(this.baseCoin.url('/walletshare/' + params.walletShareId))
      .send(params)
      .result();
  }

  /**
   * Bulk accept wallet shares
   * @param params AcceptShareOptionsRequest[]
   * @returns {Promise<AcceptShareResponse[]>}
   */
  async bulkAcceptShareRequest(params: AcceptShareOptionsRequest[]): Promise<AcceptShareResponse[]> {
    return await this.bitgo
      .put(this.bitgo.url('/walletshares/accept', 2))
      .send({
        keysForWalletShares: params,
      })
      .result();
  }

  async bulkUpdateWalletShareRequest(
    params: BulkUpdateWalletShareOptionsRequest[]
  ): Promise<BulkUpdateWalletShareResponse> {
    return await this.bitgo
      .put(this.bitgo.url('/walletshares/update', 2))
      .send({
        shares: params,
      })
      .result();
  }

  /**
   * Resend a wallet share invitation email
   * @param params
   * @param params.walletShareId - the wallet share whose invitiation should be resent
   */
  async resendShareInvite(params: { walletShareId?: string } = {}): Promise<any> {
    common.validateParams(params, ['walletShareId'], []);

    const urlParts = params.walletShareId + '/resendemail';
    return this.bitgo.post(this.baseCoin.url('/walletshare/' + urlParts)).result();
  }

  /**
   * Cancel a wallet share
   * @param params
   * @param params.walletShareId - the wallet share to update
   */
  async cancelShare(params: { walletShareId?: string } = {}): Promise<any> {
    common.validateParams(params, ['walletShareId'], []);

    return await this.bitgo
      .del(this.baseCoin.url('/walletshare/' + params.walletShareId))
      .send()
      .result();
  }

  /**
   * Re-share wallet with existing spenders of the wallet
   * @param walletId
   * @param userPassword
   */
  async reshareWalletWithSpenders(walletId: string, userPassword: string): Promise<void> {
    const wallet = await this.get({ id: walletId });
    if (!wallet?._wallet?.enterprise) {
      throw new Error('Enterprise not found for the wallet');
    }

    const enterpriseUsersResponse = await this.bitgo
      .get(this.bitgo.url(`/enterprise/${wallet?._wallet?.enterprise}/user`))
      .result();
    // create a map of users for easy lookup - we need the user email id to share the wallet
    const usersMap = new Map(
      [...enterpriseUsersResponse?.adminUsers, ...enterpriseUsersResponse?.nonAdminUsers].map((obj) => [obj.id, obj])
    );

    if (wallet._wallet.users) {
      for (const user of wallet._wallet.users) {
        const userObject = usersMap.get(user.user);
        if (user.permissions.includes('spend') && !user.permissions.includes('admin') && userObject) {
          const shareParams = {
            walletId: walletId,
            user: user.user,
            permissions: user.permissions.join(','),
            walletPassphrase: userPassword,
            email: userObject.email.email,
            reshare: true,
            skipKeychain: false,
          };
          await wallet.shareWallet(shareParams);
        }
      }
    }
  }

  /**
   * Accepts a wallet share, adding the wallet to the user's list
   * Needs a user's password to decrypt the shared key
   *
   * @param params
   * @param params.walletShareId - the wallet share to accept
   * @param params.userPassword - (required if more a keychain was shared) user's password to decrypt the shared wallet
   * @param params.newWalletPassphrase - new wallet passphrase for saving the shared wallet prv.
   *                                     If left blank and a wallet with more than view permissions was shared,
   *                                     then the user's login password is used.
   * @param params.overrideEncryptedPrv - set only if the prv was received out-of-band.
   */
  async acceptShare(params: AcceptShareOptions = {}): Promise<any> {
    common.validateParams(params, ['walletShareId'], ['overrideEncryptedPrv', 'userPassword', 'newWalletPassphrase']);

    let encryptedPrv = params.overrideEncryptedPrv;
    const walletShare = await this.getShare({ walletShareId: params.walletShareId });
    if (
      walletShare.keychainOverrideRequired &&
      walletShare.permissions.indexOf('admin') !== -1 &&
      walletShare.permissions.indexOf('spend') !== -1
    ) {
      if (_.isUndefined(params.userPassword)) {
        throw new Error('userPassword param must be provided to decrypt shared key');
      }

      const walletKeychain = await this.baseCoin.keychains().createUserKeychain(params.userPassword);
      if (_.isUndefined(walletKeychain.encryptedPrv)) {
        throw new Error('encryptedPrv was not found on wallet keychain');
      }

      const payload = {
        tradingAccountId: walletShare.wallet,
        pubkey: walletKeychain.pub,
        timestamp: new Date().toISOString(),
      };
      const payloadString = JSON.stringify(payload);

      const privateKey = this.bitgo.decrypt({
        password: params.userPassword,
        input: walletKeychain.encryptedPrv,
      });
      const signature = await this.baseCoin.signMessage({ prv: privateKey }, payloadString);

      const response = await this.updateShare({
        walletShareId: params.walletShareId,
        state: 'accepted',
        keyId: walletKeychain.id,
        signature: signature.toString('hex'),
        payload: payloadString,
      });
      // If the wallet share was accepted successfully (changed=true), reshare the wallet with the spenders
      if (response.changed && response.state === 'accepted') {
        try {
          await this.reshareWalletWithSpenders(walletShare.wallet, params.userPassword);
        } catch (e) {
          // TODO: PX-3826
          // Do nothing
        }
      }
      return response;
    }
    // Return right away if there is no keychain to decrypt, or if explicit encryptedPrv was provided
    if (!walletShare.keychain || !walletShare.keychain.encryptedPrv || encryptedPrv) {
      return this.updateShare({
        walletShareId: params.walletShareId,
        state: 'accepted',
      });
    }

    // More than viewing was requested, so we need to process the wallet keys using the shared ecdh scheme
    if (_.isUndefined(params.userPassword)) {
      throw new Error('userPassword param must be provided to decrypt shared key');
    }

    const sharingKeychain = (await this.bitgo.getECDHKeychain()) as any;
    if (_.isUndefined(sharingKeychain.encryptedXprv)) {
      throw new Error('encryptedXprv was not found on sharing keychain');
    }

    // Now we have the sharing keychain, we can work out the secret used for sharing the wallet with us
    sharingKeychain.prv = this.bitgo.decrypt({
      password: params.userPassword,
      input: sharingKeychain.encryptedXprv,
    });
    const secret = getSharedSecret(
      // Derive key by path (which is used between these 2 users only)
      bip32.fromBase58(sharingKeychain.prv).derivePath(sanitizeLegacyPath(walletShare.keychain.path)),
      Buffer.from(walletShare.keychain.fromPubKey, 'hex')
    ).toString('hex');

    // Yes! We got the secret successfully here, now decrypt the shared wallet prv
    const decryptedSharedWalletPrv = this.bitgo.decrypt({
      password: secret,
      input: walletShare.keychain.encryptedPrv,
    });

    // We will now re-encrypt the wallet with our own password
    const newWalletPassphrase = params.newWalletPassphrase || params.userPassword;
    encryptedPrv = this.bitgo.encrypt({
      password: newWalletPassphrase,
      input: decryptedSharedWalletPrv,
    });
    const updateParams: UpdateShareOptions = {
      walletShareId: params.walletShareId,
      state: 'accepted',
    };

    if (encryptedPrv) {
      updateParams.encryptedPrv = encryptedPrv;
    }
    return this.updateShare(updateParams);
  }

  /**
   * Bulk Accept wallet shares, adding the wallets to the user's list
   * Needs a user's password to decrypt the shared key
   *
   * @param params BulkAcceptShareOptions
   * @param params.walletShareId - array of the wallet shares to accept
   * @param params.userPassword - user's password to decrypt the shared wallet key
   * @param params.newWalletPassphrase - new wallet passphrase for saving the shared wallet prv.
   *                                     If left blank then the user's login password is used.
   *
   *@returns {Promise<AcceptShareResponse[]>}
   */
  async bulkAcceptShare(params: BulkAcceptShareOptions): Promise<AcceptShareResponse[]> {
    common.validateParams(params, ['userLoginPassword'], ['newWalletPassphrase']);
    assert(params.walletShareIds.length > 0, 'no walletShareIds are passed');

    const allWalletShares = await this.listSharesV2();
    const walletShareMap = allWalletShares.incoming.reduce(
      (map: { [key: string]: WalletShare }, share) => ({ ...map, [share.id]: share }),
      {}
    );

    const walletShares = params.walletShareIds
      .map((walletShareId) => walletShareMap[walletShareId])
      .filter((walletShare) => walletShare && walletShare.keychain);
    if (!walletShares.length) {
      throw new Error('invalid wallet shares provided');
    }
    const sharingKeychain = await this.bitgo.getECDHKeychain();
    if (_.isUndefined(sharingKeychain.encryptedXprv)) {
      throw new Error('encryptedXprv was not found on sharing keychain');
    }

    sharingKeychain.prv = this.bitgo.decrypt({
      password: params.userLoginPassword,
      input: sharingKeychain.encryptedXprv,
    });
    const newWalletPassphrase = params.newWalletPassphrase || params.userLoginPassword;
    const keysForWalletShares = walletShares.flatMap((walletShare) => {
      if (!walletShare.keychain) {
        return [];
      }
      const secret = getSharedSecret(
        bip32.fromBase58(sharingKeychain.prv).derivePath(sanitizeLegacyPath(walletShare.keychain.path)),
        Buffer.from(walletShare.keychain.fromPubKey, 'hex')
      ).toString('hex');

      const decryptedSharedWalletPrv = this.bitgo.decrypt({
        password: secret,
        input: walletShare.keychain.encryptedPrv,
      });
      const newEncryptedPrv = this.bitgo.encrypt({
        password: newWalletPassphrase,
        input: decryptedSharedWalletPrv,
      });
      return [
        {
          walletShareId: walletShare.id,
          encryptedPrv: newEncryptedPrv,
        },
      ];
    });

    return this.bulkAcceptShareRequest(keysForWalletShares);
  }

  /**
   * Updates multiple wallet shares in bulk
   * This method allows users to accept or reject multiple wallet shares in a single operation.
   * It handles different types of wallet shares including those requiring special keychain overrides
   * and those with encrypted private keys that need to be decrypted and re-encrypted.
   * After processing, it also reshares accepted wallets with spenders for special override cases.
   *
   * @param params - Options for bulk updating wallet shares
   * @param params.shares - Array of wallet shares to update with their status (accept/reject)
   * @param params.userLoginPassword - User's login password for decryption operations
   * @param params.newWalletPassphrase - New wallet passphrase for re-encryption
   * @returns Array of responses for each wallet share update
   */
  async bulkUpdateWalletShare(params: BulkUpdateWalletShareOptions): Promise<BulkUpdateWalletShareResponse> {
    if (!params.shares) {
      throw new Error('Missing parameter: shares');
    }

    if (!Array.isArray(params.shares)) {
      throw new Error('Expecting parameter array: shares but found ' + typeof params.shares);
    }

    // Validate each share in the array
    for (const share of params.shares) {
      if (!share.walletShareId) {
        throw new Error('Missing walletShareId in share');
      }

      if (!share.status) {
        throw new Error('Missing status in share');
      }

      if (share.status !== 'accept' && share.status !== 'reject') {
        throw new Error('Invalid status in share: ' + share.status + '. Must be either "accept" or "reject"');
      }

      if (typeof share.walletShareId !== 'string') {
        throw new Error('Expecting walletShareId to be a string but found ' + typeof share.walletShareId);
      }
    }

    // Validate optional parameters if provided
    if (params.userLoginPassword !== undefined && typeof params.userLoginPassword !== 'string') {
      throw new Error('Expecting parameter string: userLoginPassword but found ' + typeof params.userLoginPassword);
    }

    if (params.newWalletPassphrase !== undefined && typeof params.newWalletPassphrase !== 'string') {
      throw new Error('Expecting parameter string: newWalletPassphrase but found ' + typeof params.newWalletPassphrase);
    }
    assert(params.shares.length > 0, 'no shares are passed');

    const { shares: inputShares, userLoginPassword, newWalletPassphrase } = params;

    const allWalletShares = await this.listSharesV2();

    // Only include shares that are in the input array for efficiency
    const shareIds = new Set(inputShares.map((share) => share.walletShareId));
    const walletShareMap = new Map();

    allWalletShares.incoming
      .filter((share) => shareIds.has(share.id))
      .forEach((share) => walletShareMap.set(share.id, share));

    allWalletShares.outgoing
      .filter((share) => shareIds.has(share.id))
      .forEach((share) => walletShareMap.set(share.id, share));

    const resolvedShares = inputShares.map((share) => {
      const walletShare = walletShareMap.get(share.walletShareId);
      if (!walletShare) {
        throw new Error(`invalid wallet share provided: ${share.walletShareId}`);
      }
      return { ...share, walletShare };
    });

    // Identify special override cases that need resharing after acceptance
    const specialOverrideCases = new Map();
    resolvedShares.forEach((share) => {
      if (
        share.status === 'accept' &&
        share.walletShare.keychainOverrideRequired &&
        share.walletShare.permissions.includes('admin') &&
        share.walletShare.permissions.includes('spend')
      ) {
        specialOverrideCases.set(share.walletShareId, share.walletShare.wallet);
      }
    });

    // Decrypt sharing keychain if needed (only once)
    let sharingKeychainPrv: string | undefined;

    // Only decrypt if there are shares to accept that might need it
    const hasSharesRequiringDecryption =
      specialOverrideCases.size > 0 ||
      resolvedShares.some((share) => share.status === 'accept' && share.walletShare.keychain?.encryptedPrv);

    if (userLoginPassword && hasSharesRequiringDecryption) {
      const sharingKeychain = await this.bitgo.getECDHKeychain();
      if (!sharingKeychain.encryptedXprv) {
        throw new Error('encryptedXprv was not found on sharing keychain');
      }
      sharingKeychainPrv = this.bitgo.decrypt({
        password: userLoginPassword,
        input: sharingKeychain.encryptedXprv,
      });
    }

    const settledUpdates = await Promise.allSettled(
      resolvedShares.map(async (share) => {
        const { walletShareId, status, walletShare } = share;

        // Handle accept case
        if (status === 'accept') {
          return this.processAcceptShare(
            walletShareId,
            walletShare,
            userLoginPassword,
            newWalletPassphrase,
            sharingKeychainPrv
          );
        }

        // Handle reject case
        return [
          {
            walletShareId,
            status: 'reject' as const,
          },
        ];
      })
    );

    // Extract successful updates
    const successfulUpdates = settledUpdates.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));

    // Extract failed updates - only from rejected promises
    const failedUpdates = settledUpdates.reduce<Array<{ walletShareId: string; reason: string }>>(
      (acc, result, index) => {
        if (result.status === 'rejected') {
          const rejectedResult = result;
          acc.push({
            walletShareId: resolvedShares[index].walletShareId,
            reason: rejectedResult.reason?.message || String(rejectedResult.reason),
          });
        }
        return acc;
      },
      []
    );

    // Send successful updates to the server
    const response = await this.bulkUpdateWalletShareRequest(successfulUpdates);

    // Process accepted special override cases - reshare with spenders
    if (response.acceptedWalletShares && response.acceptedWalletShares.length > 0 && userLoginPassword) {
      // For each accepted wallet share that is a special override case, reshare with spenders
      for (const walletShareId of response.acceptedWalletShares) {
        if (specialOverrideCases.has(walletShareId)) {
          const walletId = specialOverrideCases.get(walletShareId);
          try {
            await this.reshareWalletWithSpenders(walletId, userLoginPassword);
          } catch (e) {
            // Log error but continue processing other shares
            console.error(`Error resharing wallet ${walletId} with spenders: ${e?.message}`);
          }
        }
      }
    }

    // Add information about failed updates to the response
    if (failedUpdates.length > 0) {
      response.walletShareUpdateErrors.push(...failedUpdates);
    }

    return response;
  }

  /**
   * Process a wallet share that is being accepted
   * This method handles the different cases for accepting a wallet share:
   * 1. Special override case requiring user keychain and signing
   * 2. Simple case with no keychain to decrypt
   * 3. Standard case requiring decryption and re-encryption
   *
   * @param walletShareId - ID of the wallet share
   * @param walletShare - Wallet share object
   * @param userLoginPassword - User's login password
   * @param newWalletPassphrase - New wallet passphrase
   * @param sharingKeychainPrv - Decrypted sharing keychain private key
   * @returns Array of wallet share update requests
   */
  private async processAcceptShare(
    walletShareId: string,
    walletShare: WalletShare,
    userLoginPassword?: string,
    newWalletPassphrase?: string,
    sharingKeychainPrv?: string
  ): Promise<BulkUpdateWalletShareOptionsRequest[]> {
    // Special override case: requires user keychain and signing
    if (
      walletShare.keychainOverrideRequired &&
      walletShare.permissions.includes('admin') &&
      walletShare.permissions.includes('spend')
    ) {
      if (!userLoginPassword) {
        throw new Error('userLoginPassword param must be provided to decrypt shared key');
      }

      const walletKeychain = await this.baseCoin.keychains().createUserKeychain(userLoginPassword);
      if (!walletKeychain.encryptedPrv) {
        throw new Error('encryptedPrv was not found on wallet keychain');
      }

      const payload = JSON.stringify({
        tradingAccountId: walletShare.wallet,
        pubkey: walletKeychain.pub,
        timestamp: new Date().toISOString(),
      });

      const prv = this.bitgo.decrypt({
        password: userLoginPassword,
        input: walletKeychain.encryptedPrv,
      });

      const signature = await this.baseCoin.signMessage({ prv }, payload);

      return [
        {
          walletShareId,
          status: 'accept' as const,
          keyId: walletKeychain.id,
          signature: signature.toString('hex'),
          payload,
        },
      ];
    }

    // Return right away if there is no keychain to decrypt
    if (!walletShare.keychain || !walletShare.keychain.encryptedPrv) {
      return [
        {
          walletShareId,
          status: 'accept' as const,
        },
      ];
    }

    // More than viewing was requested, so we need to process the wallet keys using the shared ecdh scheme
    if (!userLoginPassword) {
      throw new Error('userLoginPassword param must be provided to decrypt shared key');
    }
    if (!sharingKeychainPrv) {
      throw new Error('failed to retrieve and decrypt sharing keychain');
    }

    const derivedKey = bip32.fromBase58(sharingKeychainPrv).derivePath(sanitizeLegacyPath(walletShare.keychain.path));

    const sharedSecret = getSharedSecret(derivedKey, Buffer.from(walletShare.keychain.fromPubKey, 'hex')).toString(
      'hex'
    );

    const decryptedPrv = this.bitgo.decrypt({
      password: sharedSecret,
      input: walletShare.keychain.encryptedPrv,
    });

    // We will now re-encrypt the wallet with our own password
    const encryptedPrv = this.bitgo.encrypt({
      password: newWalletPassphrase || userLoginPassword,
      input: decryptedPrv,
    });

    return [
      {
        walletShareId,
        status: 'accept' as const,
        encryptedPrv,
      },
    ];
  }

  /**
   * Get a wallet by its ID
   * @param params
   * @param params.id wallet id
   * @returns {*}
   */
  async getWallet(params: GetWalletOptions = {}): Promise<Wallet> {
    common.validateParams(params, ['id'], []);

    const query: GetWalletOptions = {};
    if (params.allTokens) {
      if (!_.isBoolean(params.allTokens)) {
        throw new Error('invalid allTokens argument, expecting boolean');
      }
      query.allTokens = params.allTokens;
    }

    if (params.includeBalance !== undefined) {
      query.includeBalance = params.includeBalance;
    }

    this.bitgo.setRequestTracer(params.reqId || new RequestTracer());

    const wallet = await this.bitgo
      .get(this.baseCoin.url('/wallet/' + params.id))
      .query(query)
      .result();
    return new Wallet(this.bitgo, this.baseCoin, wallet);
  }

  /**
   * Get a wallet by its address
   * @param params
   * @param params.address wallet address
   * @returns {*}
   */
  async getWalletByAddress(params: GetWalletByAddressOptions = {}): Promise<Wallet> {
    common.validateParams(params, ['address'], []);

    this.bitgo.setRequestTracer(params.reqId || new RequestTracer());

    const wallet = await this.bitgo.get(this.baseCoin.url('/wallet/address/' + params.address)).result();
    return new Wallet(this.bitgo, this.baseCoin, wallet);
  }

  /**
   * For any given supported coin, get total balances for all wallets of that
   * coin type on the account.
   * @param params
   * @returns {*}
   */
  async getTotalBalances(params: Record<string, never> = {}): Promise<any> {
    return await this.bitgo.get(this.baseCoin.url('/wallet/balances')).result();
  }

  /**
   * Generates a TSS or BLS-DKG Wallet.
   * @param params
   * @private
   */
  private async generateMpcWallet({
    passphrase,
    label,
    multisigType,
    enterprise,
    walletVersion,
    originalPasscodeEncryptionCode,
  }: GenerateMpcWalletOptions): Promise<WalletWithKeychains> {
    if (multisigType === 'tss' && this.baseCoin.getMPCAlgorithm() === 'ecdsa') {
      const tssSettings: TssSettings = await this.bitgo
        .get(this.bitgo.microservicesUrl('/api/v2/tss/settings'))
        .result();
      const multisigTypeVersion =
        tssSettings.coinSettings[this.baseCoin.getFamily()]?.walletCreationSettings?.multiSigTypeVersion;
      walletVersion = this.determineEcdsaMpcWalletVersion(walletVersion, multisigTypeVersion);
    }

    const reqId = new RequestTracer();
    this.bitgo.setRequestTracer(reqId);

    // Create MPC Keychains
    const keychains = await this.baseCoin.keychains().createMpc({
      multisigType,
      passphrase,
      enterprise,
      originalPasscodeEncryptionCode,
    });

    // Create Wallet
    const { userKeychain, backupKeychain, bitgoKeychain } = keychains;
    const walletParams: SupplementGenerateWalletOptions = {
      label,
      m: 2,
      n: 3,
      keys: [userKeychain.id, backupKeychain.id, bitgoKeychain.id],
      type: 'hot',
      multisigType,
      enterprise,
      walletVersion,
    };
    const finalWalletParams = await this.baseCoin.supplementGenerateWallet(walletParams, keychains);
    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet/add')).send(finalWalletParams).result();

    const result: WalletWithKeychains = {
      wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
      userKeychain,
      backupKeychain,
      bitgoKeychain,
      responseType: 'WalletWithKeychains',
    };

    if (!_.isUndefined(backupKeychain.prv)) {
      result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
    }

    return result;
  }

  /**
   * Generates a Self-Managed Cold TSS Wallet.
   * @param params
   * @private
   */
  private async generateSMCMpcWallet({
    label,
    multisigType,
    enterprise,
    walletVersion,
    bitgoKeyId,
    commonKeychain,
    coldDerivationSeed,
  }: GenerateSMCMpcWalletOptions): Promise<WalletWithKeychains> {
    const reqId = new RequestTracer();
    this.bitgo.setRequestTracer(reqId);

    let multisigTypeVersion: 'MPCv2' | undefined;
    if (multisigType === 'tss' && this.baseCoin.getMPCAlgorithm() === 'ecdsa') {
      const tssSettings: TssSettings = await this.bitgo
        .get(this.bitgo.microservicesUrl('/api/v2/tss/settings'))
        .result();
      multisigTypeVersion =
        tssSettings.coinSettings[this.baseCoin.getFamily()]?.walletCreationSettings?.coldMultiSigTypeVersion;
      walletVersion = this.determineEcdsaMpcWalletVersion(walletVersion, multisigTypeVersion);
    }

    // Create MPC Keychains
    const bitgoKeychain = await this.baseCoin.keychains().get({ id: bitgoKeyId });

    if (!bitgoKeychain || !bitgoKeychain.commonKeychain) {
      throw new Error('BitGo keychain not found');
    }

    if (bitgoKeychain.source !== 'bitgo') {
      throw new Error('The provided bitgoKeyId is not a BitGo keychain');
    }

    if (bitgoKeychain.commonKeychain !== commonKeychain) {
      throw new Error('The provided Common keychain mismatch with the provided Bitgo key');
    }

    if (!coldDerivationSeed) {
      throw new Error('derivedFromParentWithSeed is required');
    }

    const userKeychainParams: AddKeychainOptions = {
      source: 'user',
      keyType: 'tss',
      commonKeychain: commonKeychain,
      derivedFromParentWithSeed: coldDerivationSeed,
      isMPCv2: multisigTypeVersion === 'MPCv2' ? true : undefined,
    };
    const userKeychain = await this.baseCoin.keychains().add(userKeychainParams);

    const backupKeyChainParams: AddKeychainOptions = {
      source: 'backup',
      keyType: 'tss',
      commonKeychain: commonKeychain,
      derivedFromParentWithSeed: coldDerivationSeed,
      isMPCv2: multisigTypeVersion === 'MPCv2' ? true : undefined,
    };

    const backupKeychain = await this.baseCoin.keychains().add(backupKeyChainParams);

    // Create Wallet
    const keychains = { userKeychain, backupKeychain, bitgoKeychain };
    const walletParams: SupplementGenerateWalletOptions = {
      label,
      m: 2,
      n: 3,
      keys: [userKeychain.id, backupKeychain.id, bitgoKeychain.id],
      type: 'cold',
      multisigType,
      enterprise,
      walletVersion,
    };

    const finalWalletParams = await this.baseCoin.supplementGenerateWallet(walletParams, keychains);
    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet/add')).send(finalWalletParams).result();

    const result: WalletWithKeychains = {
      wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
      userKeychain,
      backupKeychain,
      bitgoKeychain,
      responseType: 'WalletWithKeychains',
    };

    return result;
  }

  /**
   * Generates a Custodial TSS Wallet.
   * @param params
   * @private
   */
  private async generateCustodialMpcWallet({
    label,
    multisigType,
    enterprise,
    walletVersion,
  }: GenerateBaseMpcWalletOptions): Promise<WalletWithKeychains> {
    const reqId = new RequestTracer();
    this.bitgo.setRequestTracer(reqId);

    if (multisigType === 'tss' && this.baseCoin.getMPCAlgorithm() === 'ecdsa') {
      const tssSettings: TssSettings = await this.bitgo
        .get(this.bitgo.microservicesUrl('/api/v2/tss/settings'))
        .result();
      const multisigTypeVersion =
        tssSettings.coinSettings[this.baseCoin.getFamily()]?.walletCreationSettings?.custodialMultiSigTypeVersion;
      walletVersion = this.determineEcdsaMpcWalletVersion(walletVersion, multisigTypeVersion);
    }

    const finalWalletParams = {
      label,
      multisigType,
      enterprise,
      walletVersion,
      type: 'custodial',
    };

    // Create Wallet
    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet/add')).send(finalWalletParams).result();
    const wallet = new Wallet(this.bitgo, this.baseCoin, newWallet);
    const keychains = wallet.keyIds();
    const result: WalletWithKeychains = {
      wallet,
      userKeychain: { id: keychains[0], type: multisigType, source: 'user' },
      backupKeychain: { id: keychains[1], type: multisigType, source: 'backup' },
      bitgoKeychain: { id: keychains[2], type: multisigType, source: 'bitgo' },
      responseType: 'WalletWithKeychains',
    };

    return result;
  }

  private determineEcdsaMpcWalletVersion(walletVersion?: number, multisigTypeVersion?: string): number | undefined {
    if (this.baseCoin.isEVM() && multisigTypeVersion === 'MPCv2') {
      if (!walletVersion || (walletVersion !== 5 && walletVersion !== 6)) {
        return 5;
      }
    }
    return walletVersion;
  }
}
