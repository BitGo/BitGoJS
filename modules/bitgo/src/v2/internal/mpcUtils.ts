/**
 * @prettier
 */

import { SerializedKeyPair, readPrivateKey, decrypt, readMessage } from 'openpgp';
import { BitGo } from '../../bitgo';
import { BaseCoin, KeychainsTriplet } from '../baseCoin';
import { Keychain } from '../keychains';
import { encryptText, getBitgoGpgPubKey } from './opengpgUtils';

export interface MpcKeyShare {
  publicShare: string;
  privateShare: string;
}

export abstract class MpcUtils {
  protected bitgo: BitGo;
  protected baseCoin: BaseCoin;

  constructor(bitgo: BitGo, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  protected async decryptPrivateShare(privateShare: string, userGpgKey: SerializedKeyPair<string>): Promise<string> {
    const privateShareMessage = await readMessage({
      armoredMessage: privateShare,
    });
    const userGpgPrivateKey = await readPrivateKey({ armoredKey: userGpgKey.privateKey });

    const decryptedPrivateShare = (
      await decrypt({
        message: privateShareMessage,
        decryptionKeys: [userGpgPrivateKey],
        format: 'utf8',
      })
    ).data;

    return decryptedPrivateShare;
  }

  protected async createBitgoKeychainInWP(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: MpcKeyShare,
    backupKeyShare: MpcKeyShare,
    keyType: string,
    enterprise?: string
  ): Promise<Keychain> {
    const bitgoKey = await getBitgoGpgPubKey(this.bitgo);
    const encUserToBitGoMessage = await encryptText(userKeyShare.privateShare, bitgoKey);
    const encBackupToBitGoMessage = await encryptText(backupKeyShare.privateShare, bitgoKey);

    const createBitGoMPCParams = {
      type: keyType,
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userKeyShare.publicShare,
          privateShare: encUserToBitGoMessage,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupKeyShare.publicShare,
          privateShare: encBackupToBitGoMessage,
        },
      ],
      userGPGPublicKey: userGpgKey.publicKey,
      backupGPGPublicKey: userGpgKey.publicKey,
      enterprise: enterprise,
    };

    return await this.baseCoin.keychains().add(createBitGoMPCParams);
  }

  /**
   * Creates User, Backup, and BitGo MPC Keychains.
   *
   * @param params.passphrase - passphrase used to encrypt signing materials created for User and Backup
   * @param params.enterprise - optional enterprise id that will be attached to the BitGo Keychain
   * @param params.originalPasscodeEncryptionCode - optional encryption code used to reset the user's password, if absent, password recovery will not work
   */
  abstract createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet>;
}
