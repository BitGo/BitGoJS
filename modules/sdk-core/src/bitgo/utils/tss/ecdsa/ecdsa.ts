import { ECDSA, Ecdsa } from '../../../../account-lib/mpc/tss';
import * as openpgp from 'openpgp';
import { Key, SerializedKeyPair } from 'openpgp';
import { AddKeychainOptions, ApiKeyShare, CreateBackupOptions, Keychain, KeyType } from '../../../keychain';
import ECDSAMethods, { ECDSAMethodTypes } from '../../../tss/ecdsa';
import { IBaseCoin, KeychainsTriplet } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { CreateEcdsaBitGoKeychainParams, CreateEcdsaKeychainParams, DecryptableNShare, KeyShare } from './types';
import {
  BackupGpgKey,
  BackupKeyShare,
  BitgoHeldBackupKeyShare,
  RequestType,
  TSSParams,
  TSSParamsForMessage,
  TxRequest,
} from '../baseTypes';
import { getTxRequest } from '../../../tss';
import { AShare, DShare, EncryptedNShare, SendShareType } from '../../../tss/ecdsa/types';
import { createShareProof, generateGPGKeyPair, getBitgoGpgPubKey, getTrustGpgPubKey } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { BackupProvider, IWallet } from '../../../wallet';
import assert from 'assert';
import { bip32 } from '@bitgo/utxo-lib';
import { buildNShareFromAPIKeyShare, getParticipantFromIndex, verifyWalletSignature } from '../../../tss/ecdsa/ecdsa';
import { getTxRequestChallenge } from '../../../tss/common';
import { createHash } from 'crypto';

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
    bitgoKeychain: Keychain,
    userGpgKey: SerializedKeyPair<string>,
    thirdPartyBackupPublicGpgKey: Key
  ): Promise<BitgoHeldBackupKeyShare> {
    const encryptedUserToBackupShare = await encryptNShare(
      userKeyShare,
      2,
      thirdPartyBackupPublicGpgKey.armor(),
      userGpgKey
    );
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
            privateShareProof: encryptedUserToBackupShare.privateShareProof,
            vssProof: encryptedUserToBackupShare.vssProof,
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
    backupProvider?: BackupProvider;
  }): Promise<KeychainsTriplet> {
    const MPC = new Ecdsa();
    const m = 2;
    const n = 3;

    const userKeyShare = await MPC.keyShare(1, m, n);
    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const isThirdPartyBackup = this.isValidThirdPartyBackupProvider(params.backupProvider);
    const backupKeyShare = await this.createBackupKeyShares(isThirdPartyBackup, userGpgKey, params.enterprise);
    const backupGpgKey = await this.getBackupGpgPubKey(isThirdPartyBackup);

    // Get the BitGo public key based on user/enterprise feature flags
    // If it doesn't work, use the default public key from the constants
    const bitgoPublicGpgKey =
      (await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise)) ?? this.bitgoPublicGpgKey;

    const bitgoKeychain = await this.createBitgoKeychain({
      userGpgKey,
      backupGpgKey,
      bitgoPublicGpgKey,
      userKeyShare,
      backupKeyShare,
      enterprise: params.enterprise,
      isThirdPartyBackup,
    });
    const userKeychainPromise = this.createUserKeychain({
      userGpgKey,
      backupGpgKey,
      bitgoPublicGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      passphrase: params.passphrase,
      originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
      isThirdPartyBackup,
    });
    const backupKeychainPromise = this.createBackupKeychain({
      userGpgKey,
      backupGpgKey,
      bitgoPublicGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      passphrase: params.passphrase,
      backupProvider: params.backupProvider,
    });

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
    userGpgPubKey: SerializedKeyPair<string>,
    enterprise: string | undefined
  ): Promise<BackupKeyShare> {
    let backupKeyShare: BackupKeyShare;
    if (isThirdPartyBackup) {
      const bitgoHeldBackupKeyShares = await this.createBitgoHeldBackupKeyShare(userGpgPubKey, enterprise);
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

  /**
   * Gets backup pub gpg key string
   * if a third party provided then get from trust
   * @param isThirdPartyBackup
   */
  async getBackupGpgPubKey(isThirdPartyBackup = false): Promise<BackupGpgKey> {
    return isThirdPartyBackup ? getTrustGpgPubKey(this.bitgo) : generateGPGKeyPair('secp256k1');
  }

  createUserKeychain({
    userGpgKey,
    backupGpgKey,
    bitgoPublicGpgKey,
    userKeyShare,
    backupKeyShare,
    bitgoKeychain,
    passphrase,
    originalPasscodeEncryptionCode,
    isThirdPartyBackup = false,
  }: CreateEcdsaKeychainParams): Promise<Keychain> {
    if (!passphrase) {
      throw new Error('Please provide a wallet passphrase');
    }
    if (isThirdPartyBackup && backupKeyShare.bitGoHeldKeyShares?.keyShares) {
      return this.createUserKeychainFromThirdPartyBackup(
        userGpgKey,
        bitgoPublicGpgKey,
        backupGpgKey as Key,
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
      backupGpgKey as SerializedKeyPair<string>,
      bitgoPublicGpgKey,
      1,
      userKeyShare,
      backupKeyShare.userHeldKeyShare,
      bitgoKeychain,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  async createBackupKeychain({
    userGpgKey,
    userKeyShare,
    backupGpgKey,
    backupKeyShare,
    bitgoKeychain,
    bitgoPublicGpgKey,
    passphrase,
    backupProvider,
  }: CreateEcdsaKeychainParams): Promise<Keychain> {
    if (this.isValidThirdPartyBackupProvider(backupProvider) && backupKeyShare.bitGoHeldKeyShares?.keyShares) {
      assert(bitgoKeychain.commonKeychain);
      const finalizedBackupKeyShare = await this.finalizeBitgoHeldBackupKeyShare(
        backupKeyShare.bitGoHeldKeyShares.id,
        bitgoKeychain.commonKeychain,
        userKeyShare,
        bitgoKeychain,
        userGpgKey,
        backupGpgKey as Key
      );
      if (finalizedBackupKeyShare.commonKeychain !== bitgoKeychain.commonKeychain) {
        throw new Error('Failed to create backup keychain - commonKeychains do not match');
      }
      const backupKeyParams: CreateBackupOptions = {
        source: 'backup',
        keyType: 'tss',
        commonKeychain: finalizedBackupKeyShare.commonKeychain,
        provider: backupProvider ?? 'BitGoTrustAsKrs',
      };
      const backupKeychain = await this.baseCoin.keychains().createBackup(backupKeyParams);
      backupKeychain.keyShares = finalizedBackupKeyShare.keyShares;
      return backupKeychain;
    }
    assert(backupKeyShare.userHeldKeyShare);
    assert(passphrase);
    return this.createParticipantKeychain(
      userGpgKey,
      backupGpgKey as SerializedKeyPair<string>,
      bitgoPublicGpgKey,
      2,
      userKeyShare,
      backupKeyShare.userHeldKeyShare,
      bitgoKeychain,
      passphrase
    );
  }

  /** @inheritdoc */
  async createBitgoKeychain({
    userGpgKey,
    backupGpgKey,
    userKeyShare,
    backupKeyShare,
    enterprise,
    bitgoPublicGpgKey,
    isThirdPartyBackup = false,
  }: CreateEcdsaBitGoKeychainParams): Promise<Keychain> {
    const recipientIndex = 3;
    const userToBitgoShare = await encryptNShare(userKeyShare, recipientIndex, bitgoPublicGpgKey.armor(), userGpgKey);

    const backupToBitgoShare = await this.getBackupEncryptedNShare(
      backupKeyShare,
      recipientIndex,
      bitgoPublicGpgKey.armor(),
      backupGpgKey as SerializedKeyPair<string>,
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
          privateShareProof: userToBitgoShare.privateShareProof,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupToBitgoShare.publicShare,
          privateShare: backupToBitgoShare.encryptedPrivateShare,
          n: backupToBitgoShare.n,
          vssProof: backupToBitgoShare.vssProof,
          privateShareProof: backupToBitgoShare.privateShareProof,
        },
      ],
      userGPGPublicKey: userGpgKey.publicKey,
      backupGPGPublicKey: isThirdPartyBackup
        ? (backupGpgKey as Key).armor()
        : (backupGpgKey as SerializedKeyPair<string>).publicKey,
      enterprise: enterprise,
      algoUsed: 'ecdsa',
    };

    return await this.baseCoin.keychains().add(createBitGoMPCParams);
  }

  /**
   * This builds the relevant backup encryptedNShare based on whether the
   * backup key is user or third party generated
   * @param backupShare can either have key shares from the user or third party
   * @param recipientIndex index of the party receiving the backup shares
   * @param recipientGpgPublicArmor gpg armor of the party receiving the backup shares
   * @param backupGpgKey backup gpg key
   * @param isThirdPartyBackup whether the backup is generated by third party
   */
  async getBackupEncryptedNShare(
    backupShare: BackupKeyShare,
    recipientIndex: number,
    recipientGpgPublicArmor: string,
    backupGpgKey: SerializedKeyPair<string>,
    isThirdPartyBackup = false
  ): Promise<EncryptedNShare> {
    let backupToRecipientShare: EncryptedNShare;
    if (isThirdPartyBackup) {
      if (!backupShare.bitGoHeldKeyShares) {
        throw new Error(`Missing third party backup key shares`);
      }
      const backupToRecipientApiShare = backupShare.bitGoHeldKeyShares.keyShares.find(
        (keyShare) => keyShare.from === 'backup' && keyShare.to === getParticipantFromIndex(recipientIndex)
      );
      if (!backupToRecipientApiShare) {
        throw new Error(`Missing backup to ${getParticipantFromIndex(recipientIndex)} key share`);
      }
      // Since backup is from a third party, it is already encrypted
      backupToRecipientShare = await buildNShareFromAPIKeyShare(backupToRecipientApiShare);
    } else {
      assert(backupShare.userHeldKeyShare);
      backupToRecipientShare = await encryptNShare(
        backupShare.userHeldKeyShare,
        recipientIndex,
        recipientGpgPublicArmor,
        backupGpgKey
      );
    }
    return backupToRecipientShare;
  }

  /**
   * This uses the backup key from a third party (bitgo in this case)
   * to create the user keychain via WP.
   */
  async createUserKeychainFromThirdPartyBackup(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    bitgoPublicGpgKey: Key,
    thirdPartyBackupPublicGpgKey: Key,
    userKeyShare: KeyShare,
    thirdPartybackupKeyShares: ApiKeyShare[],
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

    const backupToUserShare = thirdPartybackupKeyShares.find(
      (keyShare) => keyShare.from === 'backup' && keyShare.to === 'user'
    );
    if (!backupToUserShare) {
      throw new Error('Missing Backup to User key share');
    }

    const backupToUserNShare = await buildNShareFromAPIKeyShare(backupToUserShare);
    const bitGoToUserNShare = await buildNShareFromAPIKeyShare(bitGoToUserShare);
    const encryptedNShares: DecryptableNShare[] = [
      {
        nShare: backupToUserNShare,
        recipientPrivateArmor: userGpgKey.privateKey,
        senderPublicArmor: thirdPartyBackupPublicGpgKey.armor(),
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
    userLocalBackupGpgKey: openpgp.SerializedKeyPair<string>,
    bitgoPublicGpgKey: Key,
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
    let recipientGpgKey: openpgp.SerializedKeyPair<string>;
    let senderGpgKey: openpgp.SerializedKeyPair<string>;
    if (recipientIndex === 1) {
      keyShare = userKeyShare;
      otherShare = backupKeyShare;
      recipient = 'user';
      recipientGpgKey = userGpgKey;
      senderGpgKey = userLocalBackupGpgKey;
    } else if (recipientIndex === 2) {
      keyShare = backupKeyShare;
      otherShare = userKeyShare;
      recipient = 'backup';
      recipientGpgKey = userLocalBackupGpgKey;
      senderGpgKey = userGpgKey;
    } else {
      throw new Error('Invalid user index');
    }

    const bitGoToRecipientShare = bitgoKeyShares.find(
      (keyShare) => keyShare.from === 'bitgo' && keyShare.to === recipient
    );
    if (!bitGoToRecipientShare) {
      throw new Error(`Missing BitGo to ${recipient} key share`);
    }

    const decryptedShare = await this.decryptPrivateShare(bitGoToRecipientShare.privateShare, recipientGpgKey);

    await this.verifyWalletSignatures(
      userGpgKey.publicKey,
      userLocalBackupGpgKey.publicKey,
      bitgoKeychain,
      decryptedShare,
      recipientIndex
    );

    const senderToRecipientShare = await encryptNShare(
      otherShare,
      recipientIndex,
      recipientGpgKey.publicKey,
      senderGpgKey
    );
    const encryptedNShares: DecryptableNShare[] = [
      {
        // userToBackup or backupToUser
        nShare: senderToRecipientShare,
        recipientPrivateArmor: recipientGpgKey.privateKey,
        senderPublicArmor: senderGpgKey.publicKey,
      },
      {
        // bitgoToRecipient
        nShare: {
          i: recipientIndex,
          j: 3,
          publicShare: bitGoToRecipientShare.publicShare,
          encryptedPrivateShare: bitGoToRecipientShare.privateShare,
          n: bitGoToRecipientShare.n!,
          vssProof: bitGoToRecipientShare.vssProof,
          privateShareProof: bitGoToRecipientShare.privateShareProof,
        },
        recipientPrivateArmor: recipientGpgKey.privateKey,
        senderPublicArmor: bitgoPublicGpgKey.armor(),
        isbs58Encoded: false,
      },
    ];

    const recipientCombinedKey = await ECDSAMethods.createCombinedKey(
      keyShare,
      encryptedNShares,
      bitgoKeychain.commonKeychain
    );

    const prv = JSON.stringify(recipientCombinedKey.signingMaterial);
    const recipientKeychainParams = {
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
    return recipientIndex === 1
      ? await keychains.add(recipientKeychainParams)
      : await keychains.createBackup(recipientKeychainParams);
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

    let signablePayload;
    let derivationPath;

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
      derivationPath = txRequestResolved.transactions![0].unsignedTx.derivationPath;
    } else if (requestType === RequestType.message) {
      signablePayload = (params as TSSParamsForMessage).bufferToSign;
      // TODO BG-67299 Message signing with derivation path
      derivationPath = '';
    }

    const MPC = new Ecdsa();
    const signingKey = MPC.keyDerive(
      userSigningMaterial.pShare,
      [userSigningMaterial.bitgoNShare, userSigningMaterial.backupNShare],
      derivationPath
    );

    const bitgoIndex = 3;
    const userIndex = 1;
    const yShare = {
      i: userSigningMaterial.pShare.i,
      j: bitgoIndex,
      n: signingKey.nShares[bitgoIndex].n,
    };

    const [signingKeyWithChallenge, bitgoChallenge] = await Promise.all([
      MPC.signChallenge(signingKey.xShare, yShare),
      getTxRequestChallenge(this.bitgo, this.wallet.id(), txRequestId, '0', requestType, 'ecdsa'),
    ]);

    const userSignShare = await ECDSAMethods.createUserSignShare(signingKeyWithChallenge.xShare, {
      i: userIndex,
      j: bitgoIndex,
      n: userSigningMaterial.bitgoNShare.n,
      ntilde: bitgoChallenge.ntilde,
      h1: bitgoChallenge.h1,
      h2: bitgoChallenge.h2,
    });
    const u = signingKey.nShares[bitgoIndex].u;

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
    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const privateShareProof = await createShareProof(userGpgKey.privateKey, signingKey.nShares[bitgoIndex].u, 'ecdsa');
    const vssProof = signingKey.nShares[bitgoIndex].v;
    const userPublicGpgKey = userGpgKey.publicKey;
    const publicShare = signingKey.nShares[bitgoIndex].y + signingKey.nShares[bitgoIndex].chaincode;

    // signing stage one with K share send to bitgo and receives A share
    const bitgoToUserAShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.KShare,
      userSignShare.kShare,
      encryptedSignerShare,
      vssProof,
      privateShareProof,
      publicShare,
      userPublicGpgKey
    )) as Omit<AShare, 'ntilde' | 'h1' | 'h2'>; // WP/HSM does not return the initial challenge

    // Append the BitGo challenge to the Ashare to be used in subsequent proofs
    const bitgoToUserAShareWithNTilde: AShare = {
      ...bitgoToUserAShare,
      ...bitgoChallenge,
    };

    const userGammaAndMuShares = await ECDSAMethods.createUserGammaAndMuShare(
      userSignShare.wShare,
      bitgoToUserAShareWithNTilde
    );
    const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(
      userGammaAndMuShares.gShare as ECDSA.GShare
    );
    const muShare = userGammaAndMuShares.muShare!;
    const dShare = userOmicronAndDeltaShare.dShare;

    // signing stage two with muShare and dShare send to bitgo and receives D share
    const bitgoToUserDShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      requestType,
      SendShareType.MUShare,
      { muShare, dShare, i: muShare.i }
    )) as DShare;

    const userSShare = await ECDSAMethods.createUserSignatureShare(
      userOmicronAndDeltaShare.oShare,
      bitgoToUserDShare,
      signablePayload,
      createHash('sha256')
    );

    // signing stage three with SShare send to bitgo and receives SShare
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

  /**
   * Verifies the u-value proofs and GPG keys used in generating a TSS ECDSA wallet.
   * @param userGpgPub The user's public GPG key for encryption between user/server
   * @param backupGpgPub The backup's public GPG key for encryption between backup/server
   * @param bitgoKeychain previously created BitGo keychain; must be compatible with user and backup key shares
   * @param decryptedShare The decrypted bitgo-to-user/backup private share retrieved from the keychain
   * @param verifierIndex The index of the party to verify: 1 = user, 2 = backup
   */
  async verifyWalletSignatures(
    userGpgPub: string,
    backupGpgPub: string,
    bitgoKeychain: Keychain,
    decryptedShare: string,
    verifierIndex: 1 | 2
  ): Promise<void> {
    assert(bitgoKeychain.commonKeychain);
    assert(bitgoKeychain.walletHSMGPGPublicKeySigs);

    const bitgoGpgKey = await getBitgoGpgPubKey(this.bitgo);
    const userKeyPub = await openpgp.readKey({ armoredKey: userGpgPub });
    const userKeyId = userKeyPub.keyPacket.getFingerprint();
    const backupKeyPub = await openpgp.readKey({ armoredKey: backupGpgPub });
    const backupKeyId = backupKeyPub.keyPacket.getFingerprint();

    const walletSignatures = await openpgp.readKeys({ armoredKeys: bitgoKeychain.walletHSMGPGPublicKeySigs });
    if (walletSignatures.length !== 2) {
      throw new Error('Invalid wallet signatures');
    }
    if (userKeyId !== walletSignatures[0].keyPacket.getFingerprint()) {
      throw new Error(`first wallet signature's fingerprint does not match passed user gpg key's fingerprint`);
    }
    if (backupKeyId !== walletSignatures[1].keyPacket.getFingerprint()) {
      throw new Error(`second wallet signature's fingerprint does not match passed backup gpg key's fingerprint`);
    }

    await verifyWalletSignature({
      walletSignature: walletSignatures[0],
      commonKeychain: bitgoKeychain.commonKeychain,
      userKeyId,
      backupKeyId,
      bitgoPub: bitgoGpgKey,
      decryptedShare,
      verifierIndex,
    });

    await verifyWalletSignature({
      walletSignature: walletSignatures[1],
      commonKeychain: bitgoKeychain.commonKeychain,
      userKeyId,
      backupKeyId,
      bitgoPub: bitgoGpgKey,
      decryptedShare,
      verifierIndex,
    });
  }
}
