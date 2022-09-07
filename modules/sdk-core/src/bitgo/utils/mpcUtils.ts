/**
 * @prettier
 */
import { decrypt, readMessage, readPrivateKey, SerializedKeyPair } from 'openpgp';
import { IBaseCoin, KeychainsTriplet } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { Keychain, KeyType } from '../keychain';
import { encryptText, getBitgoGpgPubKey } from './opengpgUtils';
import { PrebuildTransactionWithIntentOptions } from './tss/baseTypes';

export interface MpcKeyShare {
  publicShare: string;
  privateShare: string;
  privateShareProof?: string;
}

export abstract class MpcUtils {
  protected bitgo: BitGoBase;
  protected baseCoin: IBaseCoin;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
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
    keyType: KeyType,
    enterprise?: string
  ): Promise<Keychain> {
    const bitgoKey = await getBitgoGpgPubKey(this.bitgo);
    const encUserToBitGoMessage = await encryptText(userKeyShare.privateShare, bitgoKey);
    const encBackupToBitGoMessage = await encryptText(backupKeyShare.privateShare, bitgoKey);

    const createBitGoMPCParams = {
      keyType,
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userKeyShare.publicShare,
          privateShare: encUserToBitGoMessage,
          privateShareProof: userKeyShare.privateShareProof,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupKeyShare.publicShare,
          privateShare: encBackupToBitGoMessage,
          privateShareProof: backupKeyShare.privateShareProof,
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

  /**
   * This function would be responsible for populating intents
   * based on the type of coin / sig scheme the coin uses
   * @param {IBaseCoin} baseCoin
   * @param {PrebuildTransactionWithIntentOptions} params
   * @returns {Record<string, unknown>}
   */
  populateIntent(baseCoin: IBaseCoin, params: PrebuildTransactionWithIntentOptions): Record<string, unknown> {
    const chain = this.baseCoin.getChain();
    const intentRecipients = params.recipients.map((recipient) => ({
      address: { address: recipient.address },
      amount: { value: `${recipient.amount}`, symbol: recipient.tokenName ? recipient.tokenName : chain },
    }));

    const baseIntent = {
      intentType: params.intentType,
      sequenceId: params.sequenceId,
      comment: params.comment,
      nonce: params.nonce,
      recipients: intentRecipients,
    };
    if (baseCoin.getFamily() === 'eth') {
      return {
        ...baseIntent,
        selfSend: params.selfSend,
        feeOptions: params.feeOptions,
        hopParams: params.hopParams,
        isTss: params.isTss,
        nonce: params.nonce,
      };
    }

    return {
      ...baseIntent,
      memo: params.memo?.value,
      token: params.tokenName,
      enableTokens: params.enableTokens,
    };
  }
}
