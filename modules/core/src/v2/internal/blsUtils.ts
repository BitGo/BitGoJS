/**
 * @prettier
 */

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
   * @param userKeyShare - user's BLS-DKG key share
   * @param backupKeyShare - backup's BLS-DKG key share
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createUserKeychain(
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

    // TODO BG-43029: Aggregate pub shares and validate it is the same as commonPub when HSM includes the pub share from bitgo to user and backup
    const userPrivateKey = BaseCoinAccountLib.BlsKeyPair.aggregatePrvkeys([
      userKeyShare.secretShares[0],
      backupKeyShare.secretShares[0],
      bitGoToUserShare.privateShare,
    ]);

    const userKeychainParams: any = {
      source: 'user',
      type: 'blsdkg',
      commonPub: bitgoKeychain.commonPub,
      encryptedPrv: this.bitgo.encrypt({ input: JSON.stringify(userPrivateKey), password: passphrase }),
      originalPasscodeEncryptionCode: originalPasscodeEncryptionCode,
    };

    if (this.baseCoin.supportsDerivationKeypair()) {
      const addressDerivationKeypair = this.baseCoin.keychains().create();
      if (!addressDerivationKeypair.pub) {
        throw new Error('Expected address derivation keypair to contain a public key.');
      }

      const encryptedPrv = this.bitgo.encrypt({ password: passphrase, input: addressDerivationKeypair.prv });
      userKeychainParams.addressDerivationKeypair = {
        pub: addressDerivationKeypair.pub,
        encryptedPrv: encryptedPrv,
      };
    }

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /**
   * Creates a Keychain containing the Backup party's BLS-DKG signing materials.
   *
   * @param userKeyShare - User's BLS-DKG Keyshare
   * @param backupKeyShare - Backup's BLS-DKG Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createBackupKeychain(
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

    // TODO BG-43029: Aggregate pub shares and validate it is the same as commonPub when HSM includes the pub share from bitgo to user and backup
    const backupPrivateKey = BaseCoinAccountLib.BlsKeyPair.aggregatePrvkeys([
      userKeyShare.secretShares[1],
      backupKeyShare.secretShares[1],
      bitGoToBackupShare.privateShare,
    ]);

    return await this.baseCoin.keychains().createBackup({
      source: 'backup',
      type: 'blsdkg',
      commonPub: bitgoKeychain.commonPub,
      prv: backupPrivateKey,
      encryptedPrv: this.bitgo.encrypt({ input: JSON.stringify(backupPrivateKey), password: passphrase }),
    });
  }

  /**
   * Creates a Keychain containing BitGo's BLS-DKG signing materials.
   *
   * @param userKeyShare - user's BLS-DKG key share
   * @param backupKeyShare - backup's BLS-DKG key share
   */
  async createBitgoKeychain(
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

    const createBitGoMPCParams = {
      type: 'blsdkg',
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userKeyShare.pub,
          privateShare: userKeyShare.secretShares[2],
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupKeyShare.pub,
          privateShare: backupKeyShare.secretShares[2],
        },
      ],
      enterprise: enterprise,
    };

    return await this.baseCoin.keychains().add(createBitGoMPCParams);
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

    const bitgoKeychain = await this.createBitgoKeychain(userKeyShare, backupKeyShare, params.enterprise);
    const userKeychainPromise = this.createUserKeychain(
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.createBackupKeychain(
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
