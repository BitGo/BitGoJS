import { Ecdsa, ECDSA } from '../../../account-lib/mpc/tss';
import { SerializedKeyPair } from 'openpgp';
import { AddKeychainOptions, Keychain, KeyType } from '../../keychain';
import { MpcUtils } from '../../utils/mpcUtils';
import * as ECDSAMethods from './ecdsa';
import * as ECDSAMethodTypes from './types';
import * as openpgp from 'openpgp';
import { IBaseCoin, KeychainsTriplet } from '../../baseCoin';
import * as crypto from 'crypto';
import { IWallet } from '../../wallet';
import { BitGoBase } from '../../bitgoBase';
import * as _ from 'lodash';

type KeyShare = ECDSA.KeyShare;
type DecryptableNShare = ECDSAMethodTypes.DecryptableNShare;
const encryptNShare = ECDSAMethods.encryptNShare;
export interface ITssUtils {
  /**
   * Creates a Keychain containing the User's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   * @param [originalPasscodeEncryptionCode] - optional encryption code needed for wallet password reset for hot wallets
   */
  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string
  ): Promise<Keychain>;

  /**
   * Creates a Keychain containing the Backup party's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - User's TSS Keyshare
   * @param backupKeyShare - Backup's TSS Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain>;

  /**
   * Creates a Keychain containing BitGo's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   */
  createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise: string
  ): Promise<Keychain>;

  /**
   * Creates User, Backup, and BitGo TSS Keychains.
   *
   * @param params.passphrase - passphrase used to encrypt signing materials created for User and Backup
   */
  createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet>;
}

/** @inheritdoc */
export class EcdsaUtils extends MpcUtils implements ITssUtils {
  private _wallet?: IWallet;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin);
    this._wallet = wallet;
  }

  private get wallet(): IWallet {
    if (_.isNil(this._wallet)) {
      throw new Error('Wallet not defined');
    }
    return this._wallet;
  }

  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise?: string | undefined;
    originalPasscodeEncryptionCode?: string | undefined;
  }): Promise<KeychainsTriplet> {
    const MPC = new Ecdsa();
    const m = 2;
    const n = 3;

    const userKeyShare = await MPC.keyShare(1, m, n);
    const backupKeyShare = await MPC.keyShare(2, m, n);

    const randomHexString = crypto.randomBytes(12).toString('hex');

    openpgp.config.rejectCurves = new Set();

    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: randomHexString,
          email: `user-${randomHexString}@${randomHexString}.com`,
        },
      ],
      curve: 'secp256k1',
    });

    const bitgoKeychain = await this.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare, params.enterprise);
    const userKeychainPromise = this.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = await this.createBackupKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase
    );

    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    return {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
  }

  /** @inheritdoc */
  async createUserKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }
    if (!bitgoKeychain.commonKeychain) {
      throw new Error(`Missing common key chain: ${bitgoKeychain.commonKeychain}`);
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'user');
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitgoToUserShare: ECDSAMethodTypes.EncryptedNShare = {
      i: 1,
      j: 3,
      publicShare: bitGoToUserShare.publicShare,
      encryptedPrivateShare: bitGoToUserShare.privateShare,
    };
    const backupToUserShare = await encryptNShare(backupKeyShare, 1, userGpgKey.publicKey, userGpgKey.privateKey);

    const encryptedNShares: DecryptableNShare[] = [
      {
        nShare: bitgoToUserShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: userGpgKey.publicKey,
      },
      {
        nShare: backupToUserShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: userGpgKey.publicKey,
      },
    ];

    const userCombinedKey = await ECDSAMethods.createCombinedKey(
      userKeyShare,
      encryptedNShares,
      bitgoKeychain.commonKeychain
    );

    const userKeychainParams: AddKeychainOptions = {
      source: 'user',
      keyType: 'tss' as KeyType,
      commonKeychain: bitgoKeychain.commonKeychain,
      encryptedPrv: this.bitgo.encrypt({
        input: JSON.stringify(userCombinedKey.signingMaterial),
        password: passphrase,
      }),
      originalPasscodeEncryptionCode,
    };

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /** @inheritdoc */
  async createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    const bitgoKeyShares = bitgoKeychain.keyShares;

    if (!bitgoKeyShares) {
      throw new Error('Invalid bitgo keyshares');
    }
    const bitGoToBackupShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    if (!bitGoToBackupShare) {
      throw new Error('Missing BitGo to User key share');
    }

    if (!bitgoKeychain.commonKeychain) {
      throw new Error(`Missing common key chain: ${bitgoKeychain.commonKeychain}`);
    }

    const bitgoToBackupShare: ECDSAMethodTypes.EncryptedNShare = {
      i: 2,
      j: 3,
      publicShare: bitGoToBackupShare.publicShare,
      encryptedPrivateShare: bitGoToBackupShare.privateShare,
    };
    const userToBackupShare = await encryptNShare(userKeyShare, 2, userGpgKey.publicKey, userGpgKey.privateKey);

    const encryptedNShares: DecryptableNShare[] = [
      {
        nShare: bitgoToBackupShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: userGpgKey.publicKey,
      },
      {
        nShare: userToBackupShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: userGpgKey.publicKey,
      },
    ];

    const backupCombinedKey = await ECDSAMethods.createCombinedKey(
      backupKeyShare,
      encryptedNShares,
      bitgoKeychain.commonKeychain
    );
    const prv = JSON.stringify(backupCombinedKey.signingMaterial);
    const keychain = await this.baseCoin.keychains().createBackup({
      source: 'backup',
      keyType: 'tss',
      commonKeychain: bitgoKeychain.commonKeychain,
      prv: prv,
      encryptedPrv: this.bitgo.encrypt({ input: prv, password: passphrase }),
    });

    return keychain;
  }

  /** @inheritdoc */
  async createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise?: string
  ): Promise<Keychain> {
    const recipientIndex = 3;
    const userToBitgoShare = await encryptNShare(
      userKeyShare,
      recipientIndex,
      userGpgKey.publicKey,
      userGpgKey.privateKey
    );
    const backupToBitgoShare = await encryptNShare(
      backupKeyShare,
      recipientIndex,
      userGpgKey.publicKey,
      userGpgKey.privateKey
    );

    const userToBitgoKeySharePair = {
      publicShare: userToBitgoShare.publicShare,
      privateShare: userToBitgoShare.encryptedPrivateShare,
    };

    const backupToBitgoSharePair = {
      publicShare: backupToBitgoShare.publicShare,
      privateShare: backupToBitgoShare.encryptedPrivateShare,
    };

    const keychain = await this.createBitgoKeychainInWP(
      userGpgKey,
      userToBitgoKeySharePair,
      backupToBitgoSharePair,
      'tss',
      enterprise
    );

    return keychain;
  }
}
