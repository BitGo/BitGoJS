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
import { AddKeychainOptions, Keychain } from '../keychain';
import { promiseProps, RequestTracer } from '../utils';
import {
  AcceptShareOptions,
  AddWalletOptions,
  GenerateBaseMpcWalletOptions,
  GenerateMpcWalletOptions,
  GenerateSMCMpcWalletOptions,
  GenerateWalletOptions,
  GetWalletByAddressOptions,
  GetWalletOptions,
  IWallets,
  ListWalletOptions,
  UpdateShareOptions,
  WalletWithKeychains,
} from './iWallets';
import { Wallet } from './wallet';
import { TssSettings } from '@bitgo/public-types';

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
  async list(params: ListWalletOptions = {}): Promise<{ wallets: Wallet[] }> {
    const queryObject: ListWalletOptions = {};

    if (params.skip && params.prevId) {
      throw new Error('cannot specify both skip and prevId');
    }

    if (params.getbalances) {
      if (!_.isBoolean(params.getbalances)) {
        throw new Error('invalid getbalances argument, expecting boolean');
      }
      queryObject.getbalances = params.getbalances;
    }
    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      queryObject.prevId = params.prevId;
    }
    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      queryObject.limit = params.limit;
    }

    if (params.allTokens) {
      if (!_.isBoolean(params.allTokens)) {
        throw new Error('invalid allTokens argument, expecting boolean');
      }
      queryObject.allTokens = params.allTokens;
    }

    const body = (await this.bitgo.get(this.baseCoin.url('/wallet')).query(queryObject).result()) as any;
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

    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet')).send(params).result();
    return {
      wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
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
   * @param params.backupProvider Third party backup provider for TSS
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
  async generateWallet(params: GenerateWalletOptions = {}): Promise<WalletWithKeychains> {
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

    // EVM TSS wallets must use wallet version 3 and 5
    if (isTss && this.baseCoin.isEVM() && !(params.walletVersion === 3 || params.walletVersion === 5)) {
      throw new Error('EVM TSS wallets are only supported for wallet version 3 and 5');
    }

    if (isTss) {
      if (!this.baseCoin.supportsTss()) {
        throw new Error(`coin ${this.baseCoin.getFamily()} does not support TSS at this time`);
      }
      if (params.walletVersion === 5 && !this.baseCoin.getConfig().features.includes(CoinFeature.MPCV2)) {
        throw new Error(`coin ${this.baseCoin.getFamily()} does not support TSS MPCv2 at this time`);
      }
      assert(enterprise, 'enterprise is required for TSS wallet');

      if (type === 'cold') {
        if (params.walletVersion === 5) {
          throw new Error('EVM TSS MPCv2 wallets are not supported for cold wallets');
        }
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
        if (params.walletVersion === 5) {
          throw new Error('EVM TSS MPCv2 wallets are not supported for custodial wallets');
        }
        return this.generateCustodialMpcWallet({
          multisigType: 'tss',
          label,
          enterprise,
          walletVersion: params.walletVersion,
        });
      }

      assert(passphrase, 'cannot generate TSS keys without passphrase');

      return this.generateMpcWallet({
        multisigType: 'tss',
        label,
        passphrase,
        originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
        enterprise,
        walletVersion: params.walletVersion,
        backupProvider: params.backupProvider,
      });
    }

    const isBlsDkg = params.multisigType ? params.multisigType === 'blsdkg' : this.baseCoin.supportsBlsDkg();
    if (isBlsDkg) {
      if (!this.baseCoin.supportsBlsDkg()) {
        throw new Error(`coin ${this.baseCoin.getFamily()} does not support BLS-DKG at this time`);
      }
      assert(enterprise, 'enterprise is required for BLS-DKG wallet');

      if (type === 'cold') {
        throw new Error('BLS-DKG SMC wallets are not supported at this time');
      }

      if (type === 'custodial') {
        throw new Error('BLS-DKG custodial wallets are not supported at this time');
      }

      assert(passphrase, 'cannot generate BLS-DKG keys without passphrase');
      return this.generateMpcWallet({ multisigType: 'blsdkg', label, passphrase, enterprise });
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

    // Add the user keychain
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

    if (_.includes(['xrp', 'xlm', 'cspr'], this.baseCoin.getFamily()) && !_.isUndefined(params.rootPrivateKey)) {
      walletParams.rootPrivateKey = params.rootPrivateKey;
    }

    // Custodial onchain wallets do not need m, n, keys, or keySignatures
    if (params.type === 'custodial' && (params.multisigType ?? 'onchain') === 'onchain') {
      walletParams.n = undefined;
      walletParams.m = undefined;
      walletParams.keys = undefined;
      walletParams.keySignatures = undefined;
    }

    const keychains = {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
    const finalWalletParams = await this.baseCoin.supplementGenerateWallet(walletParams, keychains);
    this.bitgo.setRequestTracer(reqId);
    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet')).send(finalWalletParams).result();

    const result: WalletWithKeychains = {
      wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
      userKeychain: userKeychain,
      backupKeychain: backupKeychain,
      bitgoKeychain: bitgoKeychain,
    };

    if (!_.isUndefined(backupKeychain.prv)) {
      result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
    }

    if (!_.isUndefined(derivationPath)) {
      userKeychain.derivationPath = derivationPath;
    }

    return result;
  }

  /**
   * List the user's wallet shares
   * @param params
   */
  async listShares(params: Record<string, unknown> = {}): Promise<any> {
    return await this.bitgo.get(this.baseCoin.url('/walletshare')).result();
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
    backupProvider,
  }: GenerateMpcWalletOptions): Promise<WalletWithKeychains> {
    if (multisigType === 'tss' && this.baseCoin.getMPCAlgorithm() === 'ecdsa' && walletVersion === 3) {
      const tssSettings: TssSettings = await this.bitgo
        .get(this.bitgo.microservicesUrl('/api/v2/tss/settings'))
        .result();
      const multisigTypeVersion =
        tssSettings.coinSettings[this.baseCoin.getFamily()]?.walletCreationSettings?.multiSigTypeVersion;
      if (multisigTypeVersion === 'MPCv2') {
        walletVersion = 5;
      }
    }

    const reqId = new RequestTracer();
    this.bitgo.setRequestTracer(reqId);

    // Create MPC Keychains
    const keychains = await this.baseCoin.keychains().createMpc({
      multisigType,
      passphrase,
      enterprise,
      originalPasscodeEncryptionCode,
      backupProvider,
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
    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet')).send(finalWalletParams).result();

    const result: WalletWithKeychains = {
      wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };

    if (!_.isUndefined(backupKeychain.prv) && !_.isUndefined(backupProvider)) {
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
    };
    const userKeychain = await this.baseCoin.keychains().add(userKeychainParams);

    const backupKeyChainParams: AddKeychainOptions = {
      source: 'backup',
      keyType: 'tss',
      commonKeychain: commonKeychain,
      derivedFromParentWithSeed: coldDerivationSeed,
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
    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet')).send(finalWalletParams).result();

    const result: WalletWithKeychains = {
      wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
      userKeychain,
      backupKeychain,
      bitgoKeychain,
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

    const finalWalletParams = {
      label,
      multisigType,
      enterprise,
      walletVersion,
      type: 'custodial',
    };

    // Create Wallet
    const newWallet = await this.bitgo.post(this.baseCoin.url('/wallet')).send(finalWalletParams).result();
    const wallet = new Wallet(this.bitgo, this.baseCoin, newWallet);
    const keychains = wallet.keyIds();
    const result: WalletWithKeychains = {
      wallet,
      userKeychain: { id: keychains[0], type: multisigType, source: 'user' },
      backupKeychain: { id: keychains[1], type: multisigType, source: 'backup' },
      bitgoKeychain: { id: keychains[2], type: multisigType, source: 'bitgo' },
    };

    return result;
  }
}
