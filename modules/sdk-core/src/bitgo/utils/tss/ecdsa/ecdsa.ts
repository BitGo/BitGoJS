import { ECDSA, Ecdsa } from '../../../../account-lib/mpc/tss';
import { bigIntToBufferBE } from '../../../../account-lib/mpc/util';
import * as openpgp from 'openpgp';
import { SerializedKeyPair } from 'openpgp';
import { AddKeychainOptions, ApiKeyShare, CreateBackupOptions, Keychain, KeyType } from '../../../keychain';
import ECDSAMethods, { ECDSAMethodTypes } from '../../../tss/ecdsa';
import { IBaseCoin, KeychainsTriplet } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { DecryptableNShare, KeyShare } from './types';
import {
  BackupKeyShare,
  BitgoHeldBackupKeyShare,
  RequestType,
  TSSParams,
  TxRequest,
  TSSParamsForMessage,
} from '../baseTypes';
import { getTxRequest } from '../../../tss/common';
import { AShare, DShare, EncryptedNShare, SendShareType } from '../../../tss/ecdsa/types';
import { generateGPGKeyPair, getBitgoGpgPubKey } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';
import assert from 'assert';
import { bip32 } from '@bitgo/utxo-lib';
import { buildNShareFromAPIKeyShare, getParticipantFromIndex } from '../../../tss/ecdsa/ecdsa';

const encryptNShare = ECDSAMethods.encryptNShare;

/** @inheritdoc */
export class EcdsaUtils extends baseTSSUtils<KeyShare> {
  // We do not have full support for 3-party verification (w/ external source) of key shares and signature shares. There is no 3rd party key service support with this release.
  private bitgoPublicGpgKey: openpgp.Key | undefined = undefined;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  private async setBitgoGpgPubKey(bitgo) {
    this.bitgoPublicGpgKey = await getBitgoGpgPubKey(bitgo);
  }

  async getBitgoPublicGpgKey(): Promise<openpgp.Key> {
    if (!this.bitgoPublicGpgKey) {
      // retry getting bitgo's gpg key
      await this.setBitgoGpgPubKey(this.bitgo);
      if (!this.bitgoPublicGpgKey) {
        throw new Error("Failed to get Bitgo's gpg key");
      }
    }

    return this.bitgoPublicGpgKey;
  }

  /**
   * Gets the common public key from commonKeychain.
   *
   * @param {String} commonKeychain common key chain between n parties
   * @returns {string} encoded public key
   */
  static getPublicKeyFromCommonKeychain(commonKeychain: string): string {
    if (commonKeychain.length !== 130) {
      throw new Error(`Invalid commonKeychain length, expected 130, got ${commonKeychain.length}`);
    }
    const commonPubHexStr = commonKeychain.slice(0, 66);
    return commonPubHexStr;
  }

  async finalizeBitgoHeldBackupKeyShare(
    keyId: string,
    commonKeychain: string,
    userKeyShare: KeyShare,
    bitgoKeychain: Keychain
  ): Promise<BitgoHeldBackupKeyShare> {
    const bitgoGpgKey = await this.getBitgoPublicGpgKey();
    const encryptedUserToBackupShare = await encryptNShare(userKeyShare, 2, bitgoGpgKey.armor());
    const bitgoToBackupKeyShare = bitgoKeychain.keyShares?.find(
      (keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup'
    );
    const userPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.nShares[2].y, 'hex'),
      Buffer.from(userKeyShare.nShares[2].chaincode, 'hex'),
    ]).toString('hex');
    assert(bitgoToBackupKeyShare);
    const keyResponse = await this.bitgo
      .put(this.baseCoin.url(`/krs/backupkeys/${keyId}`))
      .send({
        commonKeychain,
        keyShares: [
          {
            from: 'user',
            to: 'backup',
            publicShare: userPublicShare,
            privateShare: encryptedUserToBackupShare.encryptedPrivateShare,
          },
          bitgoToBackupKeyShare,
        ],
      })
      .result();
    if (!keyResponse || !keyResponse.commonKeychain) {
      throw new Error('Failed backup key verification.');
    }
    return {
      id: keyResponse.id,
      keyShares: keyResponse.keyShares,
      commonKeychain: keyResponse.commonKeychain,
    };
  }

  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise?: string | undefined;
    originalPasscodeEncryptionCode?: string | undefined;
    backupProvider?: string;
  }): Promise<KeychainsTriplet> {
    const MPC = new Ecdsa();
    const m = 2;
    const n = 3;

    const userKeyShare = await MPC.keyShare(1, m, n);
    const userGpgKey = await generateGPGKeyPair('secp256k1');

    const isThirdPartyBackup = this.isValidThirdPartyBackupProvider(params.backupProvider);
    const backupKeyShare = await this.createBackupKeyShares(isThirdPartyBackup, userGpgKey);

    const bitgoKeychain = await this.createBitgoKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      params.enterprise,
      isThirdPartyBackup
    );
    const userKeychainPromise = this.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.originalPasscodeEncryptionCode,
      isThirdPartyBackup
    );
    const backupKeychainPromise = this.createBackupKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      params.passphrase,
      params.backupProvider
    );

    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    return {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
  }

  /**
   * If a third party backup is requested, it will create backup shares from
   * a third party (BitGo as of now), otherwise the key shares will be client generated
   */
  async createBackupKeyShares(
    isThirdPartyBackup = false,
    userGpgPubKey: SerializedKeyPair<string>
  ): Promise<BackupKeyShare> {
    let backupKeyShare: BackupKeyShare;
    if (isThirdPartyBackup) {
      const bitgoHeldBackupKeyShares = await this.createBitgoHeldBackupKeyShare(userGpgPubKey);
      backupKeyShare = {
        bitGoHeldKeyShares: bitgoHeldBackupKeyShares,
      };
    } else {
      const MPC = new Ecdsa();
      const m = 2;
      const n = 3;
      backupKeyShare = {
        userHeldKeyShare: await MPC.keyShare(2, m, n),
      };
    }
    return backupKeyShare;
  }

  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: BackupKeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode?: string,
    isThirdPartyBackup = false
  ): Promise<Keychain> {
    if (isThirdPartyBackup && backupKeyShare.bitGoHeldKeyShares?.keyShares) {
      return this.createUserKeychainFromThirdPartyBackup(
        userGpgKey,
        userKeyShare,
        backupKeyShare.bitGoHeldKeyShares.keyShares,
        bitgoKeychain,
        passphrase,
        originalPasscodeEncryptionCode
      );
    }
    assert(backupKeyShare.userHeldKeyShare);
    return this.createParticipantKeychain(
      userGpgKey,
      1,
      userKeyShare,
      backupKeyShare.userHeldKeyShare,
      bitgoKeychain,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  async createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: BackupKeyShare,
    bitgoKeychain: Keychain,
    passphrase?: string,
    backupProvider?: string
  ): Promise<Keychain> {
    if (this.isValidThirdPartyBackupProvider(backupProvider) && backupKeyShare.bitGoHeldKeyShares?.keyShares) {
      assert(bitgoKeychain.commonKeychain);
      const finalizedBackupKeyShare = await this.finalizeBitgoHeldBackupKeyShare(
        backupKeyShare.bitGoHeldKeyShares.id,
        bitgoKeychain.commonKeychain,
        userKeyShare,
        bitgoKeychain
      );
      if (finalizedBackupKeyShare.commonKeychain !== bitgoKeychain.commonKeychain) {
        throw new Error('Failed to create backup keychain - commonKeychains do not match');
      }
      const backupKeyParams: CreateBackupOptions = {
        source: 'backup',
        keyType: 'tss',
        commonKeychain: finalizedBackupKeyShare.commonKeychain,
        provider: backupProvider ?? 'BitGoKRS',
      };
      return await this.baseCoin.keychains().createBackup(backupKeyParams);
    }
    assert(backupKeyShare.userHeldKeyShare);
    assert(passphrase);
    return this.createParticipantKeychain(
      userGpgKey,
      2,
      userKeyShare,
      backupKeyShare.userHeldKeyShare,
      bitgoKeychain,
      passphrase
    );
  }

  /** @inheritdoc */
  async createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: BackupKeyShare,
    enterprise?: string,
    isThirdPartyBackup = false
  ): Promise<Keychain> {
    const bitgoPublicGpgKey = await this.getBitgoPublicGpgKey();
    const recipientIndex = 3;
    const userToBitgoShare = await encryptNShare(userKeyShare, recipientIndex, bitgoPublicGpgKey.armor());

    const backupToBitgoShare = await this.getBackupEncryptedNShare(
      backupKeyShare,
      recipientIndex,
      bitgoPublicGpgKey.armor(),
      isThirdPartyBackup
    );

    const createBitGoMPCParams: AddKeychainOptions = {
      keyType: 'tss' as KeyType,
      source: 'bitgo',
      keyShares: [
        {
          from: 'user',
          to: 'bitgo',
          publicShare: userToBitgoShare.publicShare,
          privateShare: userToBitgoShare.encryptedPrivateShare,
          n: userToBitgoShare.n,
          vssProof: userToBitgoShare.vssProof,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupToBitgoShare.publicShare,
          privateShare: backupToBitgoShare.encryptedPrivateShare,
          n: backupToBitgoShare.n,
          vssProof: backupToBitgoShare.vssProof,
        },
      ],
      userGPGPublicKey: userGpgKey.publicKey,
      // BitGo is the only supported third party backup as of now, so the
      // backup GPG key is the same as bitgo GPG key. Else user holds backup.
      backupGPGPublicKey: isThirdPartyBackup ? bitgoPublicGpgKey.armor() : userGpgKey.publicKey,
      enterprise: enterprise,
    };

    return await this.baseCoin.keychains().add(createBitGoMPCParams);
  }

  /**
   * This builds the relevant backup encryptedNShare based on whether the
   * backup key is user or third party generated
   * @param backupShare can either have key shares from the user or third party
   * @param recipientIndex index of the party receiving the backup shares
   * @param recipientGpgPublicArmor gpg armor of the party receiving the backup shares
   * @param isThirdPartyBackup whether the backup is generated by third party
   */
  async getBackupEncryptedNShare(
    backupShare: BackupKeyShare,
    recipientIndex: number,
    recipientGpgPublicArmor: string,
    isThirdPartyBackup = false
  ): Promise<EncryptedNShare> {
    let backupToBitgoShare: EncryptedNShare;
    if (isThirdPartyBackup) {
      if (!backupShare.bitGoHeldKeyShares) {
        throw new Error(`Missing third party backup key shares`);
      }
      const backupToOtherApiShare = backupShare.bitGoHeldKeyShares.keyShares.find(
        (keyShare) => keyShare.from === 'backup' && keyShare.to === getParticipantFromIndex(recipientIndex)
      );
      if (!backupToOtherApiShare) {
        throw new Error(`Missing backup to ${getParticipantFromIndex(recipientIndex)} key share`);
      }
      // Since backup is from a third party, it is already encrypted
      backupToBitgoShare = await buildNShareFromAPIKeyShare(backupToOtherApiShare);
    } else {
      assert(backupShare.userHeldKeyShare);
      backupToBitgoShare = await encryptNShare(backupShare.userHeldKeyShare, recipientIndex, recipientGpgPublicArmor);
    }
    return backupToBitgoShare;
  }

  /**
   * This uses the backup key from a third party (bitgo in this case)
   * to create the user keychain via WP.
   */
  async createUserKeychainFromThirdPartyBackup(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShares: ApiKeyShare[],
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

    const backupToUserShare = backupKeyShares.find((keyShare) => keyShare.from === 'backup' && keyShare.to === 'user');
    if (!backupToUserShare) {
      throw new Error('Missing Backup to User key share');
    }

    const bitgoPublicGpgKey = await this.getBitgoPublicGpgKey();

    const backupToUserNShare = await buildNShareFromAPIKeyShare(backupToUserShare);
    const bitGoToUserNShare = await buildNShareFromAPIKeyShare(bitGoToUserShare);
    const encryptedNShares: DecryptableNShare[] = [
      {
        nShare: backupToUserNShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: bitgoPublicGpgKey.armor(), // since bitgo is acting as Backup KRS for now
        isbs58Encoded: false,
      },
      {
        nShare: bitGoToUserNShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: bitgoPublicGpgKey.armor(),
        isbs58Encoded: false,
      },
    ];

    const userCombinedKey = await ECDSAMethods.createCombinedKey(
      userKeyShare,
      encryptedNShares,
      bitgoKeychain.commonKeychain
    );
    if (userCombinedKey.commonKeychain !== bitgoKeychain.commonKeychain) {
      throw new Error('Failed to create user keychain - commonKeychains do not match.');
    }

    const prv = JSON.stringify(userCombinedKey.signingMaterial);
    const userKeychainParams = {
      source: 'user',
      keyType: 'tss' as KeyType,
      commonKeychain: userCombinedKey.commonKeychain,
      prv: prv,
      encryptedPrv: this.bitgo.encrypt({
        input: prv,
        password: passphrase,
      }),
      originalPasscodeEncryptionCode,
    };

    const keychains = this.baseCoin.keychains();
    return await keychains.add(userKeychainParams);
  }

  /** @inheritdoc */
  async createParticipantKeychain(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    recipientIndex: number,
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

    let recipient: string;
    let keyShare: KeyShare;
    let otherShare: KeyShare;
    if (recipientIndex === 1) {
      keyShare = userKeyShare;
      otherShare = backupKeyShare;
      recipient = 'user';
    } else if (recipientIndex === 2) {
      keyShare = backupKeyShare;
      otherShare = userKeyShare;
      recipient = 'backup';
    } else {
      throw new Error('Invalid user index');
    }

    const bitGoToRecipientShare = bitgoKeyShares.find(
      (keyShare) => keyShare.from === 'bitgo' && keyShare.to === recipient
    );
    if (!bitGoToRecipientShare) {
      throw new Error('Missing BitGo to User key share');
    }

    const bitgoPublicGpgKey = await this.getBitgoPublicGpgKey();

    const backupToUserShare = await encryptNShare(otherShare, recipientIndex, userGpgKey.publicKey);
    const encryptedNShares: DecryptableNShare[] = [
      {
        nShare: backupToUserShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: userGpgKey.publicKey,
      },
      {
        nShare: {
          i: recipientIndex,
          j: 3,
          publicShare: bitGoToRecipientShare.publicShare,
          encryptedPrivateShare: bitGoToRecipientShare.privateShare,
          n: bitGoToRecipientShare.n!,
          vssProof: bitGoToRecipientShare.vssProof,
        },
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: bitgoPublicGpgKey.armor(),
        isbs58Encoded: false,
      },
    ];

    const userCombinedKey = await ECDSAMethods.createCombinedKey(
      keyShare,
      encryptedNShares,
      bitgoKeychain.commonKeychain
    );

    const prv = JSON.stringify(userCombinedKey.signingMaterial);
    const userKeychainParams = {
      source: recipient,
      keyType: 'tss' as KeyType,
      commonKeychain: bitgoKeychain.commonKeychain,
      prv: prv,
      encryptedPrv: this.bitgo.encrypt({
        input: prv,
        password: passphrase,
      }),
      originalPasscodeEncryptionCode,
    };

    const keychains = this.baseCoin.keychains();
    const result =
      recipientIndex === 1 ? await keychains.add(userKeychainParams) : await keychains.createBackup(userKeychainParams);
    return result;
  }

  /**
   * Gets signing key, txRequestResolved and txRequestId
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param { string} params.reqId - request id
   * @returns {Promise<ECDSASigningRequestBaseResult>}
   */
  private async signRequestBase(params: TSSParams | TSSParamsForMessage, requestType: RequestType): Promise<TxRequest> {
    let txRequestResolved: TxRequest;
    let txRequestId: string;

    const { txRequest, prv } = params;

    if (typeof txRequest === 'string') {
      txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest);
      txRequestId = txRequestResolved.txRequestId;
    } else {
      txRequestResolved = txRequest;
      txRequestId = txRequest.txRequestId;
    }

    const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = JSON.parse(prv);
    if (userSigningMaterial.pShare.i !== 1) {
      throw new Error('Invalid user key');
    }
    if (!userSigningMaterial.backupNShare) {
      throw new Error('Invalid user key - missing backupNShare');
    }

    const MPC = new Ecdsa();
    const signingKey = MPC.keyCombine(userSigningMaterial.pShare, [
      userSigningMaterial.bitgoNShare,
      userSigningMaterial.backupNShare,
    ]);

    const threshold = 2;
    const numShares = 3;
    const uShares = Ecdsa.shamir.split(BigInt(userSigningMaterial.pShare.uu), threshold, numShares);
    const userSignShare = await ECDSAMethods.createUserSignShare(signingKey.xShare, signingKey.yShares[3]);

    const u = bigIntToBufferBE(uShares.shares[3], 32).toString('hex');

    let chaincode = userSigningMaterial.bitgoNShare.chaincode;
    while (chaincode.length < 64) {
      chaincode = '0' + chaincode;
    }
    const signerShare = bip32.fromPrivateKey(Buffer.from(u, 'hex'), Buffer.from(chaincode, 'hex')).toBase58();
    const bitgoGpgKey = await getBitgoGpgPubKey(this.bitgo);
    const encryptedSignerShare = (await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: signerShare,
      }),
      config: {
        rejectCurves: new Set(),
      },
      encryptionKeys: [bitgoGpgKey],
    })) as string;

    const bitgoToUserAShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.KShare,
      userSignShare.kShare,
      encryptedSignerShare
    )) as AShare;

    const userGammaAndMuShares = await ECDSAMethods.createUserGammaAndMuShare(userSignShare.wShare, bitgoToUserAShare);
    const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(
      userGammaAndMuShares.gShare as ECDSA.GShare
    );

    const muShare = userGammaAndMuShares.muShare!;
    const dShare = userOmicronAndDeltaShare.dShare;
    const bitgoToUserDShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.MUShare,
      { muShare, dShare, i: muShare.i }
    )) as DShare;

    let signablePayload;

    if (requestType === RequestType.tx) {
      assert(
        txRequestResolved.transactions || txRequestResolved.unsignedTxs,
        'Unable to find transactions in txRequest'
      );
      const unsignedTx =
        txRequestResolved.apiVersion === 'full'
          ? txRequestResolved.transactions![0].unsignedTx
          : txRequestResolved.unsignedTxs[0];
      signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
    } else if (requestType === RequestType.message) {
      const finalMessage = (params as TSSParamsForMessage).messageEncoded;
      assert(finalMessage, 'finalMessage is required');
      signablePayload = Buffer.from(finalMessage);
    }
    const userSShare = await ECDSAMethods.createUserSignatureShare(
      userOmicronAndDeltaShare.oShare,
      bitgoToUserDShare,
      signablePayload
    );

    await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.SShare,
      userSShare
    );
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequestId);
  }

  /**
   * Signs the transaction associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(params: TSSParams): Promise<TxRequest> {
    return this.signRequestBase(params, RequestType.tx);
  }

  /**
   * Signs the message associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequestForMessage(params: TSSParamsForMessage): Promise<TxRequest> {
    if (!params.messageRaw) {
      throw new Error('Raw message required to sign message');
    }
    return this.signRequestBase(params, RequestType.message);
  }
}
