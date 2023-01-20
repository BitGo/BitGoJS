/**
 * @prettier
 */
import { randomBytes } from 'crypto';
import { generateKey, SerializedKeyPair } from 'openpgp';
import { BlsKeyPair as BlsKeyPairClass } from '../../account-lib/baseCoin';
import { IBaseCoin, IBlsKeyPair, KeychainsTriplet } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { Keychain } from '../keychain';
import { AddKeychainOptions } from '../keychain/iKeychains';
import { IBlsUtils } from './iBlsUtils';
import { MpcUtils } from './mpcUtils';

type SigningShare = {
  seed?: string;
  pub: string;
  priv: string;
  chaincode: string;
};

type SigningMaterial = {
  userShare: SigningShare;
  backupShare: SigningShare;
  bitgoShare: SigningShare;
};

/**
 * Utility functions for BLS-DKG work flows.
 */
export class BlsUtils extends MpcUtils implements IBlsUtils {
  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
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
    userKeyShare: IBlsKeyPair,
    backupKeyShare: IBlsKeyPair,
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

    const bitGoToUserPublicShare = bitGoToUserShare.publicShare.slice(0, 96);
    const bitGoToUserChaincode = bitGoToUserShare.publicShare.slice(96);
    const commonPub = BlsKeyPairClass.aggregatePubkeys([userKeyShare.pub, backupKeyShare.pub, bitGoToUserPublicShare]);
    const commonChaincode = BlsKeyPairClass.aggregateChaincodes([
      userKeyShare.chaincode,
      backupKeyShare.chaincode,
      bitGoToUserChaincode,
    ]);
    const commonKeychain = commonPub + commonChaincode;
    if (commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create user keychain - commonKeychains do not match.');
    }

    const bitGoToUserPrivateShare = await this.decryptPrivateShare(bitGoToUserShare.privateShare, userGpgKey);
    if (bitGoToUserPrivateShare.slice(64) !== bitGoToUserChaincode) {
      throw new Error('Failed to create user keychain - bitgo to user chaincode do not match.');
    }
    const userSigningMaterial: SigningMaterial = {
      userShare: {
        pub: userKeyShare.pub,
        priv: userKeyShare.secretShares[0],
        seed: userKeyShare.seed,
        chaincode: userKeyShare.chaincode,
      },
      backupShare: {
        pub: backupKeyShare.pub,
        priv: backupKeyShare.secretShares[0],
        chaincode: backupKeyShare.chaincode,
      },
      bitgoShare: {
        pub: bitGoToUserPublicShare,
        priv: bitGoToUserPrivateShare.slice(0, 64),
        chaincode: bitGoToUserChaincode,
      },
    };

    const userKeychainParams: AddKeychainOptions = {
      source: 'user',
      keyType: 'blsdkg',
      commonKeychain: commonKeychain,
      encryptedPrv: this.bitgo.encrypt({ input: JSON.stringify(userSigningMaterial), password: passphrase }),
      originalPasscodeEncryptionCode,
    };

    return await this.baseCoin.keychains().add(userKeychainParams);
  }

  /**
   * Creates a Keychain containing the Backup party's BLS-DKG signing materials.
   *
   * @param backupGpgKey - ephemeral GPG key to encrypt / decrypt sensitive data exchanged between backup and server
   * @param userKeyShare - User's BLS-DKG Keyshare
   * @param backupKeyShare - Backup's BLS-DKG Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createBackupKeychain(
    backupGpgKey: SerializedKeyPair<string>,
    userKeyShare: IBlsKeyPair,
    backupKeyShare: IBlsKeyPair,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Invalid bitgo keyshares');
    }

    const bitGoToBackupShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    if (!bitGoToBackupShare) {
      throw new Error('Missing BitGo to backup key share');
    }

    if (!userKeyShare.secretShares || !userKeyShare.pub) {
      throw new Error('Invalid user key shares');
    }
    if (!backupKeyShare.secretShares || !backupKeyShare.pub) {
      throw new Error('Invalid backup key shares');
    }

    const bitGoToBackupPublicShare = bitGoToBackupShare.publicShare.slice(0, 96);
    const bitGoToBackupChaincode = bitGoToBackupShare.publicShare.slice(96);
    const commonPub = BlsKeyPairClass.aggregatePubkeys([
      userKeyShare.pub,
      backupKeyShare.pub,
      bitGoToBackupPublicShare,
    ]);
    const commonChaincode = BlsKeyPairClass.aggregateChaincodes([
      userKeyShare.chaincode,
      backupKeyShare.chaincode,
      bitGoToBackupChaincode,
    ]);
    const commonKeychain = commonPub + commonChaincode;
    if (commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create backup keychain - commonKeychains do not match.');
    }

    const bitGoToBackupPrivateShare = await this.decryptPrivateShare(bitGoToBackupShare.privateShare, backupGpgKey);
    if (bitGoToBackupPrivateShare.slice(64) !== bitGoToBackupChaincode) {
      throw new Error('Failed to create user keychain - bitgo to user chaincode do not match.');
    }
    const backupSigningMaterial: SigningMaterial = {
      userShare: {
        pub: userKeyShare.pub,
        priv: userKeyShare.secretShares[1],
        chaincode: userKeyShare.chaincode,
      },
      backupShare: {
        pub: backupKeyShare.pub,
        priv: backupKeyShare.secretShares[1],
        chaincode: backupKeyShare.chaincode,
        seed: backupKeyShare.seed,
      },
      bitgoShare: {
        pub: bitGoToBackupPublicShare,
        priv: bitGoToBackupPrivateShare.slice(0, 64),
        chaincode: bitGoToBackupChaincode,
      },
    };
    const prv = JSON.stringify(backupSigningMaterial);

    return await this.baseCoin.keychains().createBackup({
      source: 'backup',
      keyType: 'blsdkg',
      commonKeychain: commonKeychain,
      prv,
      encryptedPrv: this.bitgo.encrypt({ input: prv, password: passphrase }),
    });
  }

  /**
   * Creates a Keychain containing BitGo's BLS-DKG signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param backupGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between backup and server
   * @param userKeyShare - user's BLS-DKG key share
   * @param backupKeyShare - backup's BLS-DKG key share
   */
  async createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    backupGpgKey: SerializedKeyPair<string>,
    userKeyShare: IBlsKeyPair,
    backupKeyShare: IBlsKeyPair,
    enterprise?: string
  ): Promise<Keychain> {
    if (!userKeyShare.secretShares || !userKeyShare.pub) {
      throw new Error('Invalid user key shares');
    }
    if (!backupKeyShare.secretShares || !backupKeyShare.pub) {
      throw new Error('Invalid backup key shares');
    }

    const userToBitgoPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.pub, 'hex'),
      Buffer.from(userKeyShare.chaincode, 'hex'),
    ]).toString('hex');
    const userToBitgoPrivateShare = Buffer.concat([
      Buffer.from(userKeyShare.secretShares[2], 'hex'),
      Buffer.from(userKeyShare.chaincode, 'hex'),
    ]).toString('hex');

    const userToBitgoKeyShare = {
      publicShare: userToBitgoPublicShare,
      privateShare: userToBitgoPrivateShare,
    };

    const backupToBitgoPublicShare = Buffer.concat([
      Buffer.from(backupKeyShare.pub, 'hex'),
      Buffer.from(backupKeyShare.chaincode, 'hex'),
    ]).toString('hex');
    const backupToBitgoPrivateShare = Buffer.concat([
      Buffer.from(backupKeyShare.secretShares[2], 'hex'),
      Buffer.from(backupKeyShare.chaincode, 'hex'),
    ]).toString('hex');
    const backupToBitgoKeyShare = {
      publicShare: backupToBitgoPublicShare,
      privateShare: backupToBitgoPrivateShare,
    };

    return await this.createBitgoKeychainInWP(
      userGpgKey,
      backupGpgKey,
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
    const userKeyShare = this.baseCoin.generateKeyPair() as IBlsKeyPair;
    const backupKeyShare = this.baseCoin.generateKeyPair() as IBlsKeyPair;

    const randomHexString = randomBytes(12).toString('hex');
    const randomHexString2 = randomBytes(12).toString('hex');

    const userGpgKey = await generateKey({
      userIDs: [
        {
          name: randomHexString,
          email: `${randomHexString}@${randomHexString}.com`,
        },
      ],
    });

    const backupGpgKey = await generateKey({
      userIDs: [
        {
          name: randomHexString2,
          email: `${randomHexString2}@${randomHexString2}.com`,
        },
      ],
    });

    const bitgoKeychain = await this.createBitgoKeychain(
      userGpgKey,
      backupGpgKey,
      userKeyShare,
      backupKeyShare,
      params.enterprise
    );
    const userKeychainPromise = this.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.createBackupKeychain(
      backupGpgKey,
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
