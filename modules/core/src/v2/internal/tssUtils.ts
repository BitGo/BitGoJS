import * as bs58 from 'bs58';
import * as crypto from 'crypto';
import * as openpgp from 'openpgp';
import Eddsa, { KeyShare } from '@bitgo/account-lib/dist/src/mpc/tss';

import { BaseCoin, KeychainsTriplet } from '../baseCoin';
import { Keychain } from '../keychains';
import { BitGo } from '../../bitgo';
import { MpcUtils } from './mpcUtils';

/**
 * Utility functions for TSS work flows.
 */
export class TssUtils extends MpcUtils {

  constructor(bitgo: BitGo, baseCoin: BaseCoin) {
    super(bitgo, baseCoin);
  }

  /**
   * Creates a Keychain containing the User's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createUserKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    const MPC = await Eddsa();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Missing BitGo key shares');
    }

    const bitGoToUserShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'user');
    if (!bitGoToUserShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToUserPrivateShareMessage = await openpgp.readMessage({
      armoredMessage: bitGoToUserShare.privateShare,
    });
    const userGpgPrivateKey = await openpgp.readPrivateKey({ armoredKey: userGpgKey.privateKey });

    const bitGoToUserPrivateShare = (
      await openpgp.decrypt({
        message: bitGoToUserPrivateShareMessage,
        decryptionKeys: [userGpgPrivateKey],
        format: 'utf8',
      })
    ).data;


    const bitgoToUser = {
      i: '1',
      j: '3',
      y: Buffer.from(bs58.decode(bitGoToUserShare.publicShare)).toString('hex'),
      u: bitGoToUserPrivateShare,
    };

    const userCombined = MPC.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoToUser]);
    const commonPub = bs58.encode(Buffer.from(userCombined.pShare.y, 'hex'));
    if (commonPub !== bitgoKeychain.commonPub) {
      throw new Error('Failed to create user keychain - commonPubs do not match.');
    }

    const userKeychainParams: any = {
      source: 'user',
      type: 'tss',
      commonPub: bs58.encode(Buffer.from(userCombined.pShare.y, 'hex')),
      encryptedPrv: this.bitgo.encrypt({ input: JSON.stringify(userCombined.pShare), password: passphrase }),
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
   * Creates a Keychain containing the Backup party's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - User's TSS Keyshare
   * @param backupKeyShare - Backup's TSS Keyshare
   * @param bitgoKeychain - previously created BitGo keychain; must be compatible with user and backup key shares
   * @param passphrase - wallet passphrase used to encrypt user's signing materials
   */
  async createBackupKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain> {
    const MPC = await Eddsa();
    const bitgoKeyShares = bitgoKeychain.keyShares;
    if (!bitgoKeyShares) {
      throw new Error('Invalid bitgo keyshares');
    }

    const bitGoToBackupShare = bitgoKeyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    if (!bitGoToBackupShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitGoToBackupPrivateShareMessage = await openpgp.readMessage({
      armoredMessage: bitGoToBackupShare.privateShare,
    });
    const userGpgPrivateKey = await openpgp.readPrivateKey({ armoredKey: userGpgKey.privateKey });

    const bitGoToBackupPrivateShare = (
      await openpgp.decrypt({
        message: bitGoToBackupPrivateShareMessage,
        decryptionKeys: [userGpgPrivateKey],
        format: 'utf8',
      })
    ).data;

    const bitgoToBackup = {
      i: '2',
      j: '3',
      y: Buffer.from(bs58.decode(bitGoToBackupShare.publicShare)).toString('hex'),
      u: bitGoToBackupPrivateShare,
    };

    const backupCombined = MPC.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoToBackup]);
    const commonPub = bs58.encode(Buffer.from(backupCombined.pShare.y, 'hex'));
    if (commonPub !== bitgoKeychain.commonPub) {
      throw new Error('Failed to create backup keychain - commonPubs do not match.');
    }

    const prv = JSON.stringify(backupCombined.pShare);

    return await this.baseCoin.keychains().createBackup({
      source: 'backup',
      type: 'tss',
      commonPub,
      prv: prv,
      encryptedPrv: this.bitgo.encrypt({ input: prv, password: passphrase }),
    });
  }

  /**
   * Creates a Keychain containing BitGo's TSS signing materials.
   *
   * @param userGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
   * @param userKeyShare - user's TSS key share
   * @param backupKeyShare - backup's TSS key share
   */
  async createBitgoKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare
  ): Promise<Keychain> {
    const constants = await this.bitgo.fetchConstants();
    if (!constants.tss || !constants.tss.bitgoPublicKey) {
      throw new Error('Unable to create TSS keys - bitgoPublicKey is missing from constants');
    }

    const bitgoPublicKeyStr = constants.tss.bitgoPublicKey as string;
    const bitgoKey = await openpgp.readKey({ armoredKey: bitgoPublicKeyStr });

    const userToBitGoMessage = await openpgp.createMessage({
      text: Buffer.concat([Buffer.from(userKeyShare.yShares[3].u, 'hex'), Buffer.alloc(32)]).toString('hex'),
    });
    const encUserToBitGoMessage = await openpgp.encrypt({
      message: userToBitGoMessage,
      encryptionKeys: [bitgoKey],
      format: 'armored',
      config: {
        rejectCurves: new Set(),
        showVersion: false,
        showComment: false,
      },
    });

    const backupToBitGoMessage = await openpgp.createMessage({
      text: Buffer.concat([Buffer.from(backupKeyShare.yShares[3].u, 'hex'), Buffer.alloc(32)]).toString('hex'),
    });
    const encBackupToBitGoMessage = await openpgp.encrypt({
      message: backupToBitGoMessage,
      encryptionKeys: [bitgoKey],
      format: 'armored',
      config: {
        rejectCurves: new Set(),
        showVersion: false,
        showComment: false,
      },
    });

    const userPublicShare = bs58.encode(Buffer.from(userKeyShare.yShares[3].y, 'hex'));
    const backupPublicShare = bs58.encode(Buffer.from(backupKeyShare.yShares[3].y, 'hex'));

    const createBitGoTssParams = {
      type: 'tss',
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userPublicShare,
          privateShare: encUserToBitGoMessage,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupPublicShare,
          privateShare: encBackupToBitGoMessage,
        },
      ],
      userGPGPublicKey: userGpgKey.publicKey,
      backupGPGPublicKey: userGpgKey.publicKey,
    };

    return await this.baseCoin.keychains().add(createBitGoTssParams);
  }

  /**
   * Creates User, Backup, and BitGo TSS Keychains.
   *
   * @param params.passphrase - passphrase used to encrypt signing materials created for User and Backup
   */
  async createKeychains(params: { passphrase: string }): Promise<KeychainsTriplet> {
    const MPC = await Eddsa();
    const m = 2;
    const n = 3;

    const userKeyShare = MPC.keyShare(1, m, n);
    const backupKeyShare = MPC.keyShare(2, m, n);

    const randomHexString = crypto.randomBytes(12).toString('hex');

    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: randomHexString,
          email: `${randomHexString}@${randomHexString}.com`,
        },
      ],
    });

    const bitgoKeychain = await this.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
    const userKeychainPromise = this.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase
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
