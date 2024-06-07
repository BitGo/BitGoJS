import * as _ from 'lodash';
import assert from 'assert';
import * as common from '../../common';
import { IBaseCoin, KeychainsTriplet, KeyPair } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { BlsUtils, RequestTracer, EDDSAUtils, ECDSAUtils, decodeOrElse, generateRandomPassword } from '../utils';
import {
  AddKeychainOptions,
  ApiKeyShare,
  ChangedKeychains,
  CreateBackupOptions,
  CreateBitGoOptions,
  CreateMpcOptions,
  GetKeychainOptions,
  GetKeysForSigningOptions,
  IKeychains,
  Keychain,
  ListKeychainOptions,
  ListKeychainsResult,
  UpdatePasswordOptions,
  UpdateSingleKeychainPasswordOptions,
} from './iKeychains';
import { BitGoKeyFromOvcShares, BitGoToOvcJSON, OvcToBitGoJSON } from './ovcJsonCodec';
import { TssSettings } from '@bitgo/public-types';

export class Keychains implements IKeychains {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * Get a keychain by ID
   * @param params
   * @param params.id
   * @param params.xpub (optional)
   * @param params.ethAddress (optional)
   * @param params.reqId (optional)
   */
  async get(params: GetKeychainOptions): Promise<Keychain> {
    common.validateParams(params, [], ['xpub', 'ethAddress']);

    if (_.isUndefined(params.id)) {
      throw new Error('id must be defined');
    }

    const id = params.id;
    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }
    return await this.bitgo.get(this.baseCoin.url('/key/' + encodeURIComponent(id))).result();
  }

  /**
   * list the users keychains
   * @param params
   * @param params.limit - Max number of results in a single call.
   * @param params.prevId - Continue iterating (provided by nextBatchPrevId in the previous list)
   * @returns {*}
   */
  async list(params: ListKeychainOptions = {}): Promise<ListKeychainsResult> {
    const queryObject: any = {};

    if (!_.isUndefined(params.limit)) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      queryObject.limit = params.limit;
    }
    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      queryObject.prevId = params.prevId;
    }

    return this.bitgo.get(this.baseCoin.url('/key')).query(queryObject).result();
  }

  /**
   * Change the decryption password for all possible keychains associated with a user.
   *
   * This function iterates through all keys associated with the user, decrypts
   * them with the old password and re-encrypts them with the new password.
   *
   * This should be called when a user changes their login password, and are expecting
   * that their wallet passwords are changed to match the new login password.
   *
   * @param params
   * @param params.oldPassword - The old password used for encrypting the key
   * @param params.newPassword - The new password to be used for encrypting the key
   * @returns changedKeys Object - e.g.:
   *  {
   *    xpub1: encryptedPrv,
   *    ...
   *  }
   */
  async updatePassword(params: UpdatePasswordOptions): Promise<ChangedKeychains> {
    common.validateParams(params, ['oldPassword', 'newPassword'], []);
    const changedKeys: ChangedKeychains = {};
    let prevId;
    let keysLeft = true;
    while (keysLeft) {
      const result: ListKeychainsResult = await this.list({ limit: 500, prevId });
      for (const key of result.keys) {
        const oldEncryptedPrv = key.encryptedPrv;
        if (_.isUndefined(oldEncryptedPrv)) {
          continue;
        }
        try {
          const updatedKeychain = this.updateSingleKeychainPassword({
            keychain: key,
            oldPassword: params.oldPassword,
            newPassword: params.newPassword,
          });
          if (updatedKeychain.encryptedPrv) {
            const changedKeyIdentifier = updatedKeychain.type === 'tss' ? updatedKeychain.id : updatedKeychain.pub;
            if (changedKeyIdentifier) {
              changedKeys[changedKeyIdentifier] = updatedKeychain.encryptedPrv;
            }
          }
        } catch (e) {
          // if the password was incorrect, silence the error, throw otherwise
          if (!e.message.includes('private key is incorrect')) {
            throw e;
          }
        }
      }
      if (result.nextBatchPrevId) {
        prevId = result.nextBatchPrevId;
      } else {
        keysLeft = false;
      }
    }
    return changedKeys;
  }

  /**
   * Update the password used to decrypt a single keychain
   * @param params
   * @param params.keychain - The keychain whose password should be updated
   * @param params.oldPassword - The old password used for encrypting the key
   * @param params.newPassword - The new password to be used for encrypting the key
   * @returns {object}
   */
  updateSingleKeychainPassword(params: UpdateSingleKeychainPasswordOptions = {}): Keychain {
    if (!_.isString(params.oldPassword)) {
      throw new Error('expected old password to be a string');
    }

    if (!_.isString(params.newPassword)) {
      throw new Error('expected new password to be a string');
    }

    if (!_.isObject(params.keychain) || !_.isString(params.keychain.encryptedPrv)) {
      throw new Error('expected keychain to be an object with an encryptedPrv property');
    }

    const oldEncryptedPrv = params.keychain.encryptedPrv;
    try {
      const decryptedPrv = this.bitgo.decrypt({ input: oldEncryptedPrv, password: params.oldPassword });
      const newEncryptedPrv = this.bitgo.encrypt({ input: decryptedPrv, password: params.newPassword });
      return _.assign({}, params.keychain, { encryptedPrv: newEncryptedPrv });
    } catch (e) {
      // catching an error here means that the password was incorrect or, less likely, the input to decrypt is corrupted
      throw new Error('password used to decrypt keychain private key is incorrect');
    }
  }

  /**
   * Create a public/private key pair
   * @param params - optional params
   * @param params.seed optional - seed to use for keypair generation
   * @param params.isRootKey optional - whether the resulting keypair should be a root key
   * @returns {KeyPair} - the generated keypair
   */
  create(params: { seed?: Buffer; isRootKey?: boolean } = {}): KeyPair {
    if (params?.isRootKey) {
      return this.baseCoin.generateRootKeyPair(params.seed);
    }
    return this.baseCoin.generateKeyPair(params.seed);
  }

  /**
   * Add a keychain to BitGo's records
   * @param params
   */
  async add(params: AddKeychainOptions = {}): Promise<Keychain> {
    params = params || {};
    common.validateParams(
      params,
      [],
      [
        'pub',
        'encryptedPrv',
        'keyType',
        'type',
        'source',
        'originalPasscodeEncryptionCode',
        'enterprise',
        'derivedFromParentWithSeed',
      ]
    );

    if (!_.isUndefined(params.disableKRSEmail)) {
      if (!_.isBoolean(params.disableKRSEmail)) {
        throw new Error('invalid disableKRSEmail argument, expecting boolean');
      }
    }

    if (params.reqId) {
      this.bitgo.setRequestTracer(params.reqId);
    }

    return await this.bitgo
      .post(this.baseCoin.url('/key'))
      .send({
        pub: params.pub,
        commonPub: params.commonPub,
        commonKeychain: params.commonKeychain,
        encryptedPrv: params.encryptedPrv,
        type: params.type,
        keyType: params.keyType,
        source: params.source,
        provider: params.provider,
        originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
        enterprise: params.enterprise,
        derivedFromParentWithSeed: params.derivedFromParentWithSeed,
        disableKRSEmail: params.disableKRSEmail,
        krsSpecific: params.krsSpecific,
        keyShares: params.keyShares,
        userGPGPublicKey: params.userGPGPublicKey,
        backupGPGPublicKey: params.backupGPGPublicKey,
        algoUsed: params.algoUsed,
        isDistributedCustody: params.isDistributedCustody,
        isMPCv2: params.isMPCv2,
      })
      .result();
  }

  /**
   * Create a BitGo key
   * @param params (empty)
   */
  async createBitGo(params: CreateBitGoOptions = {}): Promise<Keychain> {
    params.source = 'bitgo';

    this.baseCoin.preCreateBitGo(params as any);
    return await this.add(params);
  }

  /**
   * Create a backup key
   * @param params
   * @param params.provider (optional)
   */
  async createBackup(params: CreateBackupOptions = {}): Promise<Keychain> {
    params.source = 'backup';

    const isTssBackupKey = params.prv && (params.commonKeychain || params.commonPub);

    if (_.isUndefined(params.provider) && !isTssBackupKey) {
      // if the provider is undefined, we generate a local key and add the source details
      const key = this.create();
      _.extend(params, key);
      if (params.passphrase !== undefined) {
        _.extend(params, { encryptedPrv: this.bitgo.encrypt({ input: key.prv, password: params.passphrase }) });
      }
    }

    const serverResponse = await this.add(params);
    return _.extend({}, serverResponse, _.pick(params, ['prv', 'encryptedPrv', 'provider', 'source']));
  }

  /**
   * Gets keys for signing from a wallet
   * @param params
   * @returns {Promise<Keychain[]>}
   */
  async getKeysForSigning(params: GetKeysForSigningOptions = {}): Promise<Keychain[]> {
    if (!_.isObject(params.wallet)) {
      throw new Error('missing required param wallet');
    }
    const wallet = params.wallet;
    const reqId = params.reqId || new RequestTracer();
    const ids = wallet.baseCoin.keyIdsForSigning();
    const keychainQueriesBluebirds = ids.map((id) => this.get({ id: wallet.keyIds()[id], reqId }));
    return Promise.all(keychainQueriesBluebirds);
  }

  /**
   * Convenience function to create and store MPC keychains with BitGo.
   * @param params passphrase used to encrypt secret materials
   * @return {Promise<KeychainsTriplet>} newly created User, Backup, and BitGo keys
   */
  async createMpc(params: CreateMpcOptions): Promise<KeychainsTriplet> {
    let MpcUtils;
    let multisigTypeVersion: 'MPCv2' | undefined = undefined;
    if (params.multisigType === 'tss' && this.baseCoin.getMPCAlgorithm() === 'ecdsa') {
      const tssSettings: TssSettings = await this.bitgo
        .get(this.bitgo.microservicesUrl('/api/v2/tss/settings'))
        .result();
      multisigTypeVersion =
        tssSettings.coinSettings[this.baseCoin.getFamily()]?.walletCreationSettings?.multiSigTypeVersion;
    }

    switch (params.multisigType) {
      case 'tss':
        MpcUtils =
          this.baseCoin.getMPCAlgorithm() === 'eddsa'
            ? EDDSAUtils.default
            : multisigTypeVersion === 'MPCv2'
            ? ECDSAUtils.EcdsaMPCv2Utils
            : ECDSAUtils.EcdsaUtils;
        break;
      case 'blsdkg':
        if (_.isUndefined(params.passphrase)) {
          throw new Error('missing required param passphrase');
        }
        MpcUtils = BlsUtils;
        break;
      default:
        throw new Error('Unsupported multi-sig type');
    }
    const mpcUtils = new MpcUtils(this.bitgo, this.baseCoin);
    return await mpcUtils.createKeychains({
      passphrase: params.passphrase,
      enterprise: params.enterprise,
      originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
      backupProvider: params.backupProvider,
    });
  }

  /**
   * It parses the JSON downloaded from the OVC for platform (BitGo),
   * and creates a corresponding TSS BitGo key. It also returns the JSON that needs
   * to be uploaded back to the OVCs containing the BitGo -> OVC shares.
   * @param ovcOutputJson JSON format of the file downloaded from the OVC for platform
   * @returns {BitGoKeyFromOvcShares}
   */
  async createTssBitGoKeyFromOvcShares(ovcOutputJson: unknown): Promise<BitGoKeyFromOvcShares> {
    const decodedOvcOutput = decodeOrElse(OvcToBitGoJSON.name, OvcToBitGoJSON, ovcOutputJson, (errors) => {
      throw new Error(`Error(s) parsing OVC JSON: ${errors}`);
    });

    if (decodedOvcOutput.state !== 1) {
      throw new Error('State expected to be "1". Please complete the first two OVC operations');
    }

    // OVC-1 is responsible for the User key
    const ovc1 = decodedOvcOutput.ovc[1];
    // OVC-2 is responsible for the Backup key
    const ovc2 = decodedOvcOutput.ovc[2];

    const keyShares: ApiKeyShare[] = [
      {
        from: 'user',
        to: 'bitgo',
        publicShare: ovc1.ovcToBitgoShare.publicShare,
        privateShare: ovc1.ovcToBitgoShare.privateShare,
        privateShareProof: ovc1.ovcToBitgoShare.uSig.toString() ?? '',
        vssProof: ovc1.ovcToBitgoShare.vssProof ?? '',
      },
      {
        from: 'backup',
        to: 'bitgo',
        publicShare: ovc2.ovcToBitgoShare.publicShare,
        privateShare: ovc2.ovcToBitgoShare.privateShare,
        privateShareProof: ovc2.ovcToBitgoShare.uSig.toString() ?? '',
        vssProof: ovc2.ovcToBitgoShare.vssProof ?? '',
      },
    ];

    const key = await this.baseCoin.keychains().add({
      source: 'bitgo',
      keyShares,
      keyType: 'tss',
      userGPGPublicKey: ovc1.gpgPubKey,
      backupGPGPublicKey: ovc2.gpgPubKey,
    });
    assert(key.keyShares);
    assert(key.commonKeychain);
    assert(key.walletHSMGPGPublicKeySigs);

    const bitgoToUserShare = key.keyShares.find(
      (value: { from: string; to: string }) => value.from === 'bitgo' && value.to === 'user'
    );
    assert(bitgoToUserShare);
    assert(bitgoToUserShare.vssProof);
    assert(bitgoToUserShare.paillierPublicKey);
    const bitgoToBackupShare = key.keyShares.find(
      (value: { from: string; to: string }) => value.from === 'bitgo' && value.to === 'backup'
    );
    assert(bitgoToBackupShare);
    assert(bitgoToBackupShare.vssProof);
    assert(bitgoToBackupShare.paillierPublicKey);

    // Create JSON data with platform shares for OVC-1 and OVC-2
    const bitgoToOvcOutput: BitGoToOvcJSON = {
      wallet: {
        ...decodedOvcOutput,
        platform: {
          commonKeychain: key.commonKeychain,
          walletGpgPubKeySigs: key.walletHSMGPGPublicKeySigs,
          ovc: {
            // BitGo to User (OVC-1)
            1: {
              bitgoToOvcShare: {
                i: 1,
                j: 3,
                publicShare: bitgoToUserShare.publicShare,
                privateShare: bitgoToUserShare.privateShare,
                paillierPublicKey: bitgoToUserShare.paillierPublicKey,
                vssProof: bitgoToUserShare.vssProof,
              },
            },
            // BitGo to Backup (OVC-2)
            2: {
              bitgoToOvcShare: {
                i: 2,
                j: 3,
                publicShare: bitgoToBackupShare.publicShare,
                privateShare: bitgoToBackupShare.privateShare,
                paillierPublicKey: bitgoToBackupShare.paillierPublicKey,
                vssProof: bitgoToBackupShare.vssProof,
              },
            },
          },
        },
      },
    };

    // Mark it ready for next operation, should be 2
    bitgoToOvcOutput.wallet.state += 1;

    const output: BitGoKeyFromOvcShares = {
      bitGoKeyId: key.id,
      bitGoOutputJsonForOvc: bitgoToOvcOutput,
    };

    return decodeOrElse(BitGoKeyFromOvcShares.name, BitGoKeyFromOvcShares, output, (errors) => {
      throw new Error(`Error producing the output: ${errors}`);
    });
  }

  /**
   * Create keychain for ofc wallet using the password
   * @param userPassword
   * @returns
   */
  async createUserKeychain(userPassword: string): Promise<Keychain> {
    const keychains = this.baseCoin.keychains();
    const newKeychain = keychains.create();
    const originalPasscodeEncryptionCode = generateRandomPassword(5);

    const encryptedPrv = this.bitgo.encrypt({
      password: userPassword,
      input: newKeychain.prv,
    });

    return await keychains.add({
      encryptedPrv,
      originalPasscodeEncryptionCode,
      pub: newKeychain.pub,
      source: 'user',
    });
  }
}
