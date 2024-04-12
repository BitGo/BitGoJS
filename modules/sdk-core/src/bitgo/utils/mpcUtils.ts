/**
 * @prettier
 */
import assert from 'assert';
import { decrypt, readMessage, readPrivateKey, SerializedKeyPair } from 'openpgp';
import { IBaseCoin, KeychainsTriplet } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { AddKeychainOptions, Keychain, KeyType } from '../keychain';
import { BackupProvider } from '../wallet';
import { encryptText, getBitgoGpgPubKey } from './opengpgUtils';
import { IntentRecipient, PopulatedIntent, PrebuildTransactionWithIntentOptions } from './tss/baseTypes';

export interface MpcKeyShare {
  publicShare: string;
  privateShare: string;
  privateShareProof?: string;
  vssProof?: string;
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
    backupGpgKey: SerializedKeyPair<string>,
    userKeyShare: MpcKeyShare,
    backupKeyShare: MpcKeyShare,
    keyType: KeyType,
    enterprise?: string
  ): Promise<Keychain> {
    const bitgoKey = (await getBitgoGpgPubKey(this.bitgo)).mpcV1;
    const encUserToBitGoMessage = await encryptText(userKeyShare.privateShare, bitgoKey);
    const encBackupToBitGoMessage = await encryptText(backupKeyShare.privateShare, bitgoKey);

    const createBitGoMPCParams: AddKeychainOptions = {
      keyType,
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userKeyShare.publicShare,
          privateShare: encUserToBitGoMessage,
          privateShareProof: userKeyShare.privateShareProof,
          vssProof: userKeyShare.vssProof,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupKeyShare.publicShare,
          privateShare: encBackupToBitGoMessage,
          privateShareProof: backupKeyShare.privateShareProof,
          vssProof: backupKeyShare.vssProof,
        },
      ],
      userGPGPublicKey: userGpgKey.publicKey,
      backupGPGPublicKey: backupGpgKey.publicKey,
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
    backupProvider?: BackupProvider;
  }): Promise<KeychainsTriplet>;

  /**
   * This function would be responsible for populating intents
   * based on the type of coin / sig scheme the coin uses
   * @param {IBaseCoin} baseCoin
   * @param {PrebuildTransactionWithIntentOptions} params
   * @returns {Record<string, unknown>}
   */
  populateIntent(baseCoin: IBaseCoin, params: PrebuildTransactionWithIntentOptions): PopulatedIntent {
    const chain = this.baseCoin.getChain();

    if (!['acceleration', 'fillNonce', 'transferToken'].includes(params.intentType)) {
      assert(params.recipients, `'recipients' is a required parameter for ${params.intentType} intent`);
    }
    const intentRecipients = params.recipients?.map((recipient) => {
      const formattedRecipient: IntentRecipient = {
        address: { address: recipient.address },
        amount: { value: `${recipient.amount}`, symbol: recipient.tokenName ? recipient.tokenName : chain },
      };

      if (recipient.data) {
        formattedRecipient.data = recipient.data;
      }

      const { tokenData } = recipient;
      if (tokenData && (tokenData.tokenContractAddress || tokenData.tokenName)) {
        // token related recipient data gets validated in WP
        if (!(tokenData.tokenType && tokenData.tokenQuantity)) {
          throw new Error(
            'token type and quantity is required to request a transaction with intent to transfer a token'
          );
        }
        formattedRecipient.tokenData = tokenData;
      }
      return formattedRecipient;
    });

    const baseIntent = {
      intentType: params.intentType,
      sequenceId: params.sequenceId,
      comment: params.comment,
      nonce: params.nonce,
      recipients: intentRecipients,
    };

    if (baseCoin.getFamily() === 'eth' || baseCoin.getFamily() === 'polygon' || baseCoin.getFamily() === 'bsc') {
      switch (params.intentType) {
        case 'payment':
        case 'transferToken':
        case 'fillNonce':
          return {
            ...baseIntent,
            selfSend: params.selfSend,
            feeOptions: params.feeOptions,
            hopParams: params.hopParams,
            isTss: params.isTss,
            nonce: params.nonce,
            custodianTransactionId: params.custodianTransactionId,
            receiveAddress: params.receiveAddress,
          };
        case 'acceleration':
          return {
            ...baseIntent,
            txid: params.lowFeeTxid,
            receiveAddress: params.receiveAddress,
            feeOptions: params.feeOptions,
          };
        default:
          throw new Error(`Unsupported intent type ${params.intentType}`);
      }
    }

    if (params.feeOptions !== undefined) {
      return {
        ...baseIntent,
        memo: params.memo?.value,
        token: params.tokenName,
        enableTokens: params.enableTokens,
        feeOptions: params.feeOptions,
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
