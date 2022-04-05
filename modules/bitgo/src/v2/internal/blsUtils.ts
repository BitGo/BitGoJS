/**
 * @prettier
 */

import { randomBytes } from 'crypto';
import { SerializedKeyPair, generateKey } from 'openpgp';

import { BaseCoin as BaseCoinAccountLib } from '@bitgo/account-lib';

import { BaseCoin, KeychainsTriplet, BlsKeyPair } from '../baseCoin';
import { Keychain } from '../keychains';
import { BitGo } from '../../bitgo';
import { MpcUtils } from './mpcUtils';

/**
 * Utility functions for BLS-DKG work flows.
 */
export class BlsUtils extends MpcUtils {
  constructor(bitgo: BitGo, baseCoin: BaseCoin) {
    super(bitgo, baseCoin);
  }

  /**
   * Creates a Keychain containing the User's BLS-DKG signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's BLS-DKG key share
   * @param backupKeyShare - backup's BLS-DKG key share
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: BlsKeyPair,
    backupKeyShare: BlsKeyPair,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'user');
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    if (!userKeyShare.secretShares || !userKeyShare.pub) {
      throw new Error('Invalid user key shares');
    }
    if (!backupKeyShare.secretShares || !backupKeyShare.pub) {
      throw new Error('Invalid backup key shares');
    }

    const bitGoToUserPrivateShare = await this.decryptPrivateShare(bitGoToUserShare.privateShare, userGpgKey);

    const userPrivateKey = BaseCoinAccountLib.BlsKeyPair.aggregatePrvkeys([
      userKeyShare.secretShares[0],
      backupKeyShare.secretShares[0],
      bitGoToUserPrivateShare,
    ]);
    const commonPub = BaseCoinAccountLib.BlsKeyPair.aggregatePubkeys([
      userKeyShare.pub,
      backupKeyShare.pub,
      bitGoToUserShare.publicShare,
    ]);
    if (commonPub !== bitgoKeychain.commonPub) {
      throw new Error('Failed to create user keychain - commonPubs do not match.');
    }

    const userKeychainParams: any = {
      source: 'user',
      type: 'blsdkg',
      commonPub: commonPub,
      encryptedPrv: this.bitgo.encrypt({ input: userPrivateKey, password: passphrase }),
      originalPasscodeEncryptionCode: originalPasscodeEncryptionCode,
    };

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /**
   * Creates a Keychain containing the Backup party's BLS-DKG signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - User's BLS-DKG Keyshare
   * @param backupKeyShare - Backup's BLS-DKG Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: BlsKeyPair,
    backupKeyShare: BlsKeyPair,
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

    if (!userKeyShare.secretShares || !userKeyShare.pub) {
      throw new Error('Invalid user key shares');
    }
    if (!backupKeyShare.secretShares || !backupKeyShare.pub) {
      throw new Error('Invalid backup key shares');
    }

    const bitGoToBackupPrivateShare = await this.decryptPrivateShare(bitGoToBackupShare.privateShare, userGpgKey);

    const backupPrivateKey = BaseCoinAccountLib.BlsKeyPair.aggregatePrvkeys([
      userKeyShare.secretShares[1],
      backupKeyShare.secretShares[1],
      bitGoToBackupPrivateShare,
    ]);
    const commonPub = BaseCoinAccountLib.BlsKeyPair.aggregatePubkeys([
      userKeyShare.pub,
      backupKeyShare.pub,
      bitGoToBackupShare.publicShare,
    ]);
    if (commonPub !== bitgoKeychain.commonPub) {
      throw new Error('Failed to create backup keychain - commonPubs do not match.');
    }

    return await this.baseCoin.keychains().createBackup({
      source: 'backup',
      type: 'blsdkg',
      commonPub: commonPub,
      prv: backupPrivateKey,
      encryptedPrv: this.bitgo.encrypt({ input: backupPrivateKey, password: passphrase }),
    });
  }

  /**
   * Creates a Keychain containing BitGo's BLS-DKG signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's BLS-DKG key share
   * @param backupKeyShare - backup's BLS-DKG key share
   */
  async createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: BlsKeyPair,
    backupKeyShare: BlsKeyPair,
    enterprise?: string
  ): Promise<Keychain> {
    if (!userKeyShare.secretShares || !userKeyShare.pub) {
      throw new Error('Invalid user key shares');
    }
    if (!backupKeyShare.secretShares || !backupKeyShare.pub) {
      throw new Error('Invalid backup key shares');
    }

    const userToBitgoKeyShare = {
      publicShare: userKeyShare.pub,
      privateShare: userKeyShare.secretShares[2],
    };

    const backupToBitgoKeyShare = {
      publicShare: backupKeyShare.pub,
      privateShare: backupKeyShare.secretShares[2],
    };

    return await this.createBitgoKeychainInWP(
      userGpgKey,
      userToBitgoKeyShare,
      backupToBitgoKeyShare,
      'blsdkg',
      enterprise
    );
  }

  /**
   * Creates User, Backup, and BitGo BLS-DKG Keychains.
   *
   * @param params.passphrase - passphrase used to encrypt signing materials created for User and Backup
   */
  async createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const userKeyShare = this.baseCoin.generateKeyPair();
    const backupKeyShare = this.baseCoin.generateKeyPair();

    const randomHexString = randomBytes(12).toString('hex');

    const userGpgKey = await generateKey({
      userIDs: [
        {
          name: randomHexString,
          email: `${randomHexString}@${randomHexString}.com`,
        },
      ],
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
    const backupKeychainPromise = this.createBackupKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase
    );
    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    // create wallet
    const keychains = {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };

    return keychains;
  }
}
