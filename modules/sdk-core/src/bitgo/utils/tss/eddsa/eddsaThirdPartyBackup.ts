import { KeyShare, YShare } from './types';
import { KeychainsTriplet } from '../../../baseCoin';
import Eddsa from '../../../../account-lib/mpc/tss';
import { createShareProof, generateGPGKeyPair } from '../../opengpgUtils';
import { AddKeychainOptions, ApiKeyShare, CreateBackupOptions, Keychain, KeyType } from '../../../keychain';
import * as openpgp from 'openpgp';
import { SigningMaterial } from '../../../tss';
import ThirdPartyBackupTSSUtils from '../thirdPartyBackupTSSUtils';

/**
 * Utility functions for TSS work flows where backup key is held by a third party.
 * As of 14th Oct'22, BitGo is acting as the third party holding the backup key.
 */
export class EddsaThirdPartyBackupUtils extends ThirdPartyBackupTSSUtils<KeyShare> {
  /**
   * Creates a Keychain containing the User's TSS signing materials.
   * Backup key is NOT with the user.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShares - backup shares received from Third Party
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param [passphrase] - optional wallet passphrase used to encrypt user's signing materials
   * @param [originalPasscodeEncryptionCode] - optional encryption code needed for wallet password reset for hot wallets
   */
  async createUserKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShares: ApiKeyShare[],
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    const MPC = await Eddsa.initialize();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'user');
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToUserPrivateShare = await this.decryptPrivateShare(bitGoToUserShare.privateShare, userGpgKey);

    const bitgoToUserYShare: YShare = {
      i: 1,
      j: 3,
      y: bitGoToUserShare.publicShare.slice(0, 64),
      u: bitGoToUserPrivateShare.slice(0, 64),
      chaincode: bitGoToUserPrivateShare.slice(64),
    };

    const backupToUserShare = backupKeyShares.find((keyShare) => keyShare.from === 'backup' && keyShare.to === 'user');
    if (!backupToUserShare) {
      throw new Error('Missing Backup to User key share');
    }
    const backupToUserPrivateShare = await this.decryptPrivateShare(backupToUserShare.privateShare, userGpgKey);

    const backupToUserYShare: YShare = {
      i: 1,
      j: 2,
      y: backupToUserShare.publicShare.slice(0, 64),
      u: backupToUserPrivateShare.slice(0, 64),
      chaincode: backupToUserPrivateShare.slice(0, 64),
    };

    // TODO(BG-47170): use tss.createCombinedKey helper when signatures are supported
    const userCombined = MPC.keyCombine(userKeyShare.uShare, [backupToUserYShare, bitgoToUserYShare]);
    const commonKeychain = userCombined.pShare.y + userCombined.pShare.chaincode;
    if (commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create user keychain - commonKeychains do not match.');
    }

    const userSigningMaterial: SigningMaterial = {
      uShare: userKeyShare.uShare,
      bitgoYShare: bitgoToUserYShare,
      backupYShare: backupToUserYShare,
    };

    const userKeychainParams: AddKeychainOptions = {
      source: 'user',
      keyType: 'tss' as KeyType,
      commonKeychain: bitgoKeychain.commonKeychain,
      originalPasscodeEncryptionCode,
    };
    if (passphrase !== undefined) {
      userKeychainParams.encryptedPrv = this.bitgo.encrypt({
        input: JSON.stringify(userSigningMaterial),
        password: passphrase,
      });
    }

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /**
   * Creates a Keychain containing BitGo's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShares
   * @param enterprise
   */
  async createBitgoKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShares: ApiKeyShare[],
    enterprise?: string
  ): Promise<Keychain> {
    // TODO(BG-47170): use tss.encryptYShare helper when signatures are supported
    const userToBitgoPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.uShare.y, 'hex'),
      Buffer.from(userKeyShare.uShare.chaincode, 'hex'),
    ]).toString('hex');
    const userToBitgoPrivateShare = Buffer.concat([
      Buffer.from(userKeyShare.yShares[3].u, 'hex'),
      Buffer.from(userKeyShare.yShares[3].chaincode, 'hex'),
    ]).toString('hex');
    const userToBitgoKeyShare = {
      publicShare: userToBitgoPublicShare,
      privateShare: userToBitgoPrivateShare,
      privateShareProof: await createShareProof(userGpgKey.privateKey, userToBitgoPrivateShare.slice(0, 64)),
    };

    const backupToBitgoShare = backupKeyShares.find(
      (keyShare) => keyShare.from === 'backup' && keyShare.to === 'bitgo'
    );
    if (!backupToBitgoShare) {
      throw new Error('Missing Backup to Bitgo key share');
    }

    const backupToBitgoKeyShare = {
      publicShare: backupToBitgoShare.publicShare,
      privateShare: backupToBitgoShare.privateShare,
      privateShareProof: await createShareProof(userGpgKey.privateKey, backupToBitgoShare.privateShare.slice(0, 64)),
    };

    return await this.createBitgoKeychainInWP(
      userGpgKey,
      userToBitgoKeyShare,
      backupToBitgoKeyShare,
      'tss',
      enterprise
    );
  }

  /**
   * Creates User, Backup, and BitGo TSS Keychains.
   * In this flow, backup keys are not client-generated, but instead third party
   * @param params.passphrase - passphrase used to encrypt signing materials created for User
   */
  async createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const MPC = await Eddsa.initialize();
    const m = 2;
    const n = 3;

    const userKeyShare = MPC.keyShare(1, m, n);
    const userGpgKey = await generateGPGKeyPair('secp256k1');

    const backupApiKeyShares = await this.createBitgoHeldBackupKeyShare(userGpgKey);

    const bitgoKeychain = await this.createBitgoKeychain(
      userGpgKey,
      userKeyShare,
      backupApiKeyShares.keyShares,
      params.enterprise
    );

    // This verifies the commonKeychain for the user and creates the encrypted user key in WP
    const userKeychain = await this.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupApiKeyShares.keyShares,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );

    // TODO: Use helper 2 to call WP to store the bitgoToBackup share on the Backup Key collection..
    // TODO: Verify the commonKeychain returned from helper 2 is the same as the common keychain from bitgo.

    // Create the backup key in Platform
    const backupKeyParams: CreateBackupOptions = {
      source: 'backup',
      keyType: 'tss',
      commonKeychain: bitgoKeychain.commonKeychain,
      provider: 'BitGoKRS',
    };
    const backupKeychain = await this.baseCoin.keychains().createBackup(backupKeyParams);

    // create wallet
    return {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
  }
}
