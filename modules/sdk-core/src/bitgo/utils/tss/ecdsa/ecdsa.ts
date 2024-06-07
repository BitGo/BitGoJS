import assert from 'assert';
import { Buffer } from 'buffer';
import * as openpgp from 'openpgp';
import { Key, SerializedKeyPair } from 'openpgp';
import { Hash } from 'crypto';
import { EcdsaPaillierProof, EcdsaRangeProof, EcdsaTypes, hexToBigInt, minModulusBitLength } from '@bitgo/sdk-lib-mpc';
import { bip32 } from '@bitgo/utxo-lib';

import { ECDSA, Ecdsa } from '../../../../account-lib/mpc/tss';
import { AddKeychainOptions, ApiKeyShare, CreateBackupOptions, Keychain, KeyType } from '../../../keychain';
import ECDSAMethods, { ECDSAMethodTypes } from '../../../tss/ecdsa';
import { KeychainsTriplet } from '../../../baseCoin';
import {
  BitGoProofSignatures,
  CreateEcdsaBitGoKeychainParams,
  CreateEcdsaKeychainParams,
  DecryptableNShare,
  GetBitGoChallengesApi,
  KeyShare,
} from './types';
import {
  BackupKeyShare,
  BitgoHeldBackupKeyShare,
  CustomKShareGeneratingFunction,
  CustomMuDeltaShareGeneratingFunction,
  CustomPaillierModulusGetterFunction,
  CustomSShareGeneratingFunction,
  RequestType,
  TSSParams,
  TSSParamsForMessage,
  TxRequest,
} from '../baseTypes';
import { getTxRequest } from '../../../tss';
import { AShare, DShare, EncryptedNShare, SendShareType, SShare, WShare, OShare } from '../../../tss/ecdsa/types';
import { createShareProof, generateGPGKeyPair, getBitgoGpgPubKey } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { BackupProvider } from '../../../wallet';
import { buildNShareFromAPIKeyShare, getParticipantFromIndex, verifyWalletSignature } from '../../../tss/ecdsa/ecdsa';
import { signMessageWithDerivedEcdhKey, verifyEcdhSignature } from '../../../ecdh';
import { getTxRequestChallenge } from '../../../tss/common';
import {
  ShareKeyPosition,
  TssEcdsaStep1ReturnMessage,
  TssEcdsaStep2ReturnMessage,
  TxRequestChallengeResponse,
} from '../../../tss/types';
import { BaseEcdsaUtils } from './base';
import { IRequestTracer } from '../../../../api';

const encryptNShare = ECDSAMethods.encryptNShare;

/** @inheritdoc */
export class EcdsaUtils extends BaseEcdsaUtils {
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

  private async createTssEcdsaStep1SigningMaterial(params: {
    challenges: {
      enterpriseChallenge: EcdsaTypes.SerializedEcdsaChallenges;
      bitgoChallenge: TxRequestChallengeResponse;
    };
    prv: string;
    derivationPath: string;
    walletPassphrase?: string;
  }): Promise<TssEcdsaStep1ReturnMessage> {
    const { challenges, derivationPath, prv } = params;
    const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = JSON.parse(prv);
    if (userSigningMaterial.pShare.i !== 1) {
      throw new Error('Invalid user key');
    }
    if (!userSigningMaterial.backupNShare) {
      throw new Error('Invalid user key - missing backupNShare');
    }
    const MPC = new Ecdsa();
    const signingKey = MPC.keyDerive(
      userSigningMaterial.pShare,
      [userSigningMaterial.bitgoNShare, userSigningMaterial.backupNShare],
      derivationPath
    );

    const bitgoIndex = ShareKeyPosition.BITGO;
    const userIndex = userSigningMaterial.pShare.i;

    const { ntilde: ntildea, h1: h1a, h2: h2a, p: pa } = challenges.enterpriseChallenge;
    const { ntilde: ntildeb, h1: h1b, h2: h2b, p: pb, n: nb } = challenges.bitgoChallenge;
    const userXShare = MPC.appendChallenge(signingKey.xShare, { ntilde: ntildea, h1: h1a, h2: h2a }, { p: pa });
    const bitgoYShare = MPC.appendChallenge(
      {
        i: userIndex,
        j: bitgoIndex,
        n: nb,
      },
      { ntilde: ntildeb, h1: h1b, h2: h2b },
      { p: pb }
    );

    const userSignShare = await ECDSAMethods.createUserSignShare(userXShare, bitgoYShare);
    const u = signingKey.nShares[bitgoIndex].u;

    let chaincode = userSigningMaterial.bitgoNShare.chaincode;
    while (chaincode.length < 64) {
      chaincode = '0' + chaincode;
    }
    const signerShare = bip32.fromPrivateKey(Buffer.from(u, 'hex'), Buffer.from(chaincode, 'hex')).toBase58();
    const bitgoGpgKey = (await getBitgoGpgPubKey(this.bitgo)).mpcV1;
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
    return {
      privateShareProof: privateShareProof,
      vssProof: vssProof,
      publicShare: publicShare,
      encryptedSignerOffsetShare: encryptedSignerShare,
      userPublicGpgKey: userPublicGpgKey,
      kShare: userSignShare.kShare,
      wShare: params.walletPassphrase
        ? this.bitgo.encrypt({ input: JSON.stringify(userSignShare.wShare), password: params.walletPassphrase })
        : userSignShare.wShare,
    };
  }

  private async createTssEcdsaStep2SigningMaterial(params: {
    bitgoChallenge: TxRequestChallengeResponse;
    wShare: WShare;
    aShareFromBitgo: Omit<AShare, 'h1' | 'h2' | 'ntilde'>;
    walletPassphrase?: string;
  }): Promise<TssEcdsaStep2ReturnMessage> {
    // Append the BitGo challenge to the Ashare to be used in subsequent proofs
    const bitgoToUserAShareWithNtilde: AShare = {
      ...params.aShareFromBitgo,
      ...params.bitgoChallenge,
    };
    const userGammaAndMuShares = await ECDSAMethods.createUserGammaAndMuShare(
      params.wShare,
      bitgoToUserAShareWithNtilde
    );
    const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(
      userGammaAndMuShares.gShare as ECDSA.GShare
    );
    return {
      muDShare: {
        muShare: userGammaAndMuShares.muShare,
        dShare: userOmicronAndDeltaShare.dShare,
        i: userGammaAndMuShares.muShare.i,
      },
      oShare: params.walletPassphrase
        ? this.bitgo.encrypt({
            input: JSON.stringify(userOmicronAndDeltaShare.oShare),
            password: params.walletPassphrase,
          })
        : userOmicronAndDeltaShare.oShare,
    };
  }

  getOfflineSignerPaillierModulus(params: { prv: string }): { userPaillierModulus: string } {
    assert(params.prv, 'Params to get paillier modulus are missing prv.');
    const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = JSON.parse(params.prv);
    return { userPaillierModulus: userSigningMaterial.pShare.n };
  }

  async createOfflineKShare(params: {
    tssParams: TSSParams | TSSParamsForMessage;
    challenges: {
      enterpriseChallenge: EcdsaTypes.SerializedEcdsaChallenges;
      bitgoChallenge: TxRequestChallengeResponse;
    };
    requestType: RequestType;
    prv: string;
    walletPassphrase: string;
  }): Promise<TssEcdsaStep1ReturnMessage> {
    const { tssParams, prv, requestType, challenges } = params;
    assert(typeof tssParams.txRequest !== 'string', 'Invalid txRequest type');
    const txRequest: TxRequest = tssParams.txRequest;
    let derivationPath;

    if (requestType === RequestType.tx) {
      assert(
        txRequest.transactions || (txRequest as TxRequest).unsignedTxs,
        'Unable to find transactions in txRequest'
      );
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
      derivationPath = unsignedTx.derivationPath;
    } else if (requestType === RequestType.message) {
      // TODO BG-67299 Message signing with derivation path
      derivationPath = '';
    }
    return this.createTssEcdsaStep1SigningMaterial({
      prv: prv,
      challenges: challenges,
      derivationPath: derivationPath,
      walletPassphrase: params.walletPassphrase,
    });
  }

  async createOfflineMuDeltaShare(params: {
    aShareFromBitgo: Omit<AShare, 'ntilde' | 'h1' | 'h2'>;
    bitgoChallenge: TxRequestChallengeResponse;
    encryptedWShare: string;
    walletPassphrase: string;
  }): Promise<TssEcdsaStep2ReturnMessage> {
    const decryptedWShare = this.bitgo.decrypt({ input: params.encryptedWShare, password: params.walletPassphrase });
    return await this.createTssEcdsaStep2SigningMaterial({
      aShareFromBitgo: params.aShareFromBitgo,
      bitgoChallenge: params.bitgoChallenge,
      wShare: JSON.parse(decryptedWShare),
      walletPassphrase: params.walletPassphrase,
    });
  }

  async createOfflineSShare(params: {
    tssParams: TSSParams | TSSParamsForMessage;
    dShareFromBitgo: DShare;
    requestType: RequestType;
    encryptedOShare: string;
    walletPassphrase: string;
  }): Promise<SShare> {
    const { tssParams, requestType, dShareFromBitgo, encryptedOShare, walletPassphrase } = params;
    assert(typeof tssParams.txRequest !== 'string', 'Invalid txRequest type');
    const txRequest: TxRequest = tssParams.txRequest;
    let signablePayload;
    if (requestType === RequestType.tx) {
      assert(txRequest.transactions || txRequest.unsignedTxs, 'Unable to find transactions in txRequest');
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
      signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
    } else if (requestType === RequestType.message) {
      signablePayload = (params.tssParams as TSSParamsForMessage).bufferToSign;
    }
    const decryptedOShare = this.bitgo.decrypt({ input: encryptedOShare, password: walletPassphrase });
    const { i, R, s, y } = await ECDSAMethods.createUserSignatureShare(
      JSON.parse(decryptedOShare),
      dShareFromBitgo,
      signablePayload
    );
    // return only required SShare without bigints from VAShare
    return {
      i,
      R,
      s,
      y,
    };
  }
  async signEcdsaTssUsingExternalSigner(
    params: TSSParams | TSSParamsForMessage,
    requestType: RequestType,
    externalSignerPaillierModulusGetter: CustomPaillierModulusGetterFunction,
    externalSignerKShareGenerator: CustomKShareGeneratingFunction,
    externalSignerMuDeltaShareGenerator: CustomMuDeltaShareGeneratingFunction,
    externalSignerSShareGenerator: CustomSShareGeneratingFunction
  ): Promise<TxRequest> {
    const { txRequest } = params;
    const pendingEcdsaTssInitialization = this.wallet.coinSpecific()?.pendingEcdsaTssInitialization;
    if (pendingEcdsaTssInitialization) {
      throw new Error(
        'Wallet is not ready for TSS ECDSA signing. Please contact your enterprise admin to finish the enterprise TSS initialization.'
      );
    }
    const txRequestObj: TxRequest = await getTxRequest(this.bitgo, this.wallet.id(), txRequest as string, params.reqId);
    const { userPaillierModulus } = await externalSignerPaillierModulusGetter({ txRequest: txRequestObj });
    const { enterpriseChallenge, bitgoChallenge } = await this.getEcdsaSigningChallenges(
      txRequest as string,
      requestType,
      userPaillierModulus,
      0,
      params.reqId
    );
    const step1SigningMaterial = await externalSignerKShareGenerator({
      tssParams: {
        ...params,
        txRequest: txRequestObj,
      },
      challenges: { enterpriseChallenge, bitgoChallenge },
      requestType: requestType,
    });
    // signing stage one with K share send to bitgo and receives A share
    const bitgoToUserAShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestObj.txRequestId,
      requestType,
      SendShareType.KShare,
      step1SigningMaterial.kShare,
      step1SigningMaterial.encryptedSignerOffsetShare,
      step1SigningMaterial.vssProof,
      step1SigningMaterial.privateShareProof,
      step1SigningMaterial.publicShare,
      step1SigningMaterial.userPublicGpgKey,
      params.reqId
    )) as Omit<AShare, 'ntilde' | 'h1' | 'h2'>; // WP/HSM does not return the initial challenge
    const step2Return = await externalSignerMuDeltaShareGenerator({
      txRequest: txRequestObj,
      aShareFromBitgo: bitgoToUserAShare,
      bitgoChallenge: bitgoChallenge,
      encryptedWShare: step1SigningMaterial.wShare as string,
    });
    // signing stage two with muShare and dShare send to bitgo and receives D share
    const bitgoToUserDShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestObj.txRequestId,
      requestType,
      SendShareType.MUShare,
      step2Return.muDShare,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      params.reqId
    )) as DShare;
    const userSShare = await externalSignerSShareGenerator({
      tssParams: {
        ...params,
        txRequest: txRequestObj,
      },
      dShareFromBitgo: bitgoToUserDShare,
      requestType: requestType,
      encryptedOShare: step2Return.oShare as string,
    });
    // signing stage three with SShare send to bitgo and receives SShare
    await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequestObj.txRequestId,
      requestType,
      SendShareType.SShare,
      userSShare,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      params.reqId
    );
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequestObj.txRequestId, params.reqId);
  }

  /**
   * Gets signing key, txRequestResolved and txRequestId
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param { string} params.reqId - request id
   * @returns {Promise<TxRequest>}
   */
  private async signRequestBase(params: TSSParams | TSSParamsForMessage, requestType: RequestType): Promise<TxRequest> {
    const pendingEcdsaTssInitialization = this.wallet.coinSpecific()?.pendingEcdsaTssInitialization;
    if (pendingEcdsaTssInitialization) {
      throw new Error(
        'Wallet is not ready for TSS ECDSA signing. Please contact your enterprise admin to finish the enterprise TSS initialization.'
      );
    }
    const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = JSON.parse(params.prv);
    if (userSigningMaterial.pShare.i !== 1) {
      throw new Error('Invalid user key');
    }
    if (!userSigningMaterial.backupNShare) {
      throw new Error('Invalid user key - missing backupNShare');
    }

    const txRequest: TxRequest =
      typeof params.txRequest === 'string'
        ? await getTxRequest(this.bitgo, this.wallet.id(), params.txRequest)
        : params.txRequest;

    let signablePayload = new Buffer('');
    let derivationPath = '';

    if (requestType === RequestType.tx) {
      assert(txRequest.transactions || txRequest.unsignedTxs, 'Unable to find transactions in txRequest');
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
      signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
      derivationPath = unsignedTx.derivationPath;
    } else if (requestType === RequestType.message) {
      signablePayload = (params as TSSParamsForMessage).bufferToSign;
      // TODO BG-67299 Message signing with derivation path
    }
    const paillierModulus = this.getOfflineSignerPaillierModulus({ prv: params.prv });
    const challenges = await this.getEcdsaSigningChallenges(
      txRequest.txRequestId,
      requestType,
      paillierModulus.userPaillierModulus,
      0
    );

    const step1Return = await this.createTssEcdsaStep1SigningMaterial({
      prv: params.prv,
      challenges: challenges,
      derivationPath: derivationPath,
    });

    // signing stage one with K share send to bitgo and receives A share
    const bitgoToUserAShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequest.txRequestId,
      requestType,
      SendShareType.KShare,
      step1Return.kShare,
      step1Return.encryptedSignerOffsetShare,
      step1Return.vssProof,
      step1Return.privateShareProof,
      step1Return.publicShare,
      step1Return.userPublicGpgKey
    )) as Omit<AShare, 'ntilde' | 'h1' | 'h2'>; // WP/HSM does not return the initial challenge

    const step2Return = await this.createTssEcdsaStep2SigningMaterial({
      aShareFromBitgo: bitgoToUserAShare,
      bitgoChallenge: challenges.bitgoChallenge,
      wShare: step1Return.wShare as WShare,
    });

    // signing stage two with muShare and dShare send to bitgo and receives D share
    const bitgoToUserDShare = (await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequest.txRequestId,
      requestType,
      SendShareType.MUShare,
      step2Return.muDShare
    )) as DShare;

    // If only the getHashFunction() is defined for the coin use it otherwise
    // pass undefined hash, default hash will be used in that case.
    let hash: Hash | undefined;
    try {
      hash = this.baseCoin.getHashFunction();
    } catch (err) {
      hash = undefined;
    }

    const userSShare = await ECDSAMethods.createUserSignatureShare(
      step2Return.oShare as OShare,
      bitgoToUserDShare,
      signablePayload,
      hash
    );

    // signing stage three with SShare send to bitgo and receives SShare
    await ECDSAMethods.sendShareToBitgo(
      this.bitgo,
      this.wallet.id(),
      txRequest.txRequestId,
      requestType,
      SendShareType.SShare,
      userSShare
    );
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequest.txRequestId);
  }

  /**
   * Signs the transaction associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(params: TSSParams): Promise<TxRequest> {
    this.bitgo.setRequestTracer(params.reqId);
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
   * Get the challenge values for enterprise and BitGo in ECDSA signing
   * Only returns the challenges if they are verified by the user's enterprise admin's ecdh key
   * @param {string} txRequestId - transaction request id
   * @param {RequestType} requestType -  (0 for tx, 1 for message)
   * @param {string} walletPaillierModulus - paillier pubkey $n$
   * @param {number} index - index of the requestType
   * @param {IRequestTracer} reqId - request tracer request id
   */
  async getEcdsaSigningChallenges(
    txRequestId: string,
    requestType: RequestType,
    walletPaillierModulus: string,
    index = 0,
    reqId?: IRequestTracer
  ): Promise<{
    enterpriseChallenge: EcdsaTypes.SerializedEcdsaChallenges;
    bitgoChallenge: TxRequestChallengeResponse;
  }> {
    const enterpriseId = this.wallet.toJSON().enterprise;
    if (!enterpriseId) {
      throw new Error('Wallet must be an enterprise wallet.');
    }

    // create BitGo range proof and paillier proof challenge
    const createBitgoChallengeResponse = await getTxRequestChallenge(
      this.bitgo,
      this.wallet.id(),
      txRequestId,
      index.toString(),
      requestType,
      walletPaillierModulus,
      reqId
    );

    const bitgoToEnterprisePaillierChallenge = { p: createBitgoChallengeResponse.p };
    const enterpriseToBitgoPaillierChallenge = EcdsaTypes.serializePaillierChallenge({
      p: await EcdsaPaillierProof.generateP(hexToBigInt(createBitgoChallengeResponse.n)),
    });

    // TODO(BG-78764): once the paillier proofs are complete, reduce challenge creation to one API call
    const walletChallenges = await this.wallet.getChallengesForEcdsaSigning();

    const challengeVerifierUserId = walletChallenges.createdBy;
    const adminSigningKeyResponse = await this.bitgo.getSigningKeyForUser(enterpriseId, challengeVerifierUserId);
    const pubkeyOfAdminEcdhKeyHex = adminSigningKeyResponse.derivedPubkey;

    // Verify enterprise's challenge is signed by the respective admins ecdh keychain
    const enterpriseRawChallenge = {
      ntilde: walletChallenges.enterpriseChallenge.ntilde,
      h1: walletChallenges.enterpriseChallenge.h1,
      h2: walletChallenges.enterpriseChallenge.h2,
    };
    const adminSignatureOnEntChallenge: string = walletChallenges.enterpriseChallenge.verifiers.adminSignature;
    if (
      !verifyEcdhSignature(
        EcdsaUtils.getMessageToSignFromChallenge(enterpriseRawChallenge),
        adminSignatureOnEntChallenge,
        Buffer.from(pubkeyOfAdminEcdhKeyHex, 'hex')
      )
    ) {
      throw new Error(`Admin signature for enterprise challenge is not valid. Please contact your enterprise admin.`);
    }

    // Verify that the BitGo challenge's ZK proofs have been verified by the admin
    const bitgoChallenge: TxRequestChallengeResponse = {
      ntilde: walletChallenges.bitgoChallenge.ntilde,
      h1: walletChallenges.bitgoChallenge.h1,
      h2: walletChallenges.bitgoChallenge.h2,
      p: bitgoToEnterprisePaillierChallenge.p,
      n: createBitgoChallengeResponse.n,
    };
    const adminVerificationSignatureForBitGoChallenge = walletChallenges.bitgoChallenge.verifiers.adminSignature;
    if (
      !verifyEcdhSignature(
        EcdsaUtils.getMessageToSignFromChallenge(bitgoChallenge),
        adminVerificationSignatureForBitGoChallenge,
        Buffer.from(pubkeyOfAdminEcdhKeyHex, 'hex')
      )
    ) {
      throw new Error(`Admin signature for BitGo's challenge is not valid. Please contact your enterprise admin.`);
    }

    return {
      enterpriseChallenge: {
        ...enterpriseRawChallenge,
        p: enterpriseToBitgoPaillierChallenge.p,
      },
      bitgoChallenge,
    };
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

    const bitgoGpgKey = (await getBitgoGpgPubKey(this.bitgo)).mpcV1;
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

  /**
   * Signs a challenge with the provided v1 ecdh key at a derived path
   * @param challenge challenge to sign
   * @param ecdhXprv xprv of the ecdh key
   * @param derivationPath the derived path at which the ecdh key will sign
   */
  static signChallenge(challenge: EcdsaTypes.SerializedNtilde, ecdhXprv: string, derivationPath: string): Buffer {
    const messageToSign = this.getMessageToSignFromChallenge(challenge);
    return signMessageWithDerivedEcdhKey(messageToSign, ecdhXprv, derivationPath);
  }

  /**
   * Converts challenge to a common message format which can be signed.
   * @param challenge
   */
  static getMessageToSignFromChallenge(challenge: EcdsaTypes.SerializedNtilde): string {
    return challenge.ntilde.concat(challenge.h1).concat(challenge.h2);
  }

  /**
   Verifies ZK proofs of BitGo's challenges for both nitro and institutional HSMs
   which are fetched from the WP API.
   */
  static async verifyBitGoChallenges(bitgoChallenges: GetBitGoChallengesApi): Promise<boolean> {
    // Verify institutional hsm challenge proof
    const instChallengeVerified = await this.verifyBitGoChallenge({
      ntilde: bitgoChallenges.bitgoInstitutionalHsm.ntilde,
      h1: bitgoChallenges.bitgoInstitutionalHsm.h1,
      h2: bitgoChallenges.bitgoInstitutionalHsm.h2,
      ntildeProof: bitgoChallenges.bitgoInstitutionalHsm.ntildeProof,
    });

    // Verify nitro hsm challenge proof
    const nitroChallengeVerified = await this.verifyBitGoChallenge({
      ntilde: bitgoChallenges.bitgoNitroHsm.ntilde,
      h1: bitgoChallenges.bitgoNitroHsm.h1,
      h2: bitgoChallenges.bitgoNitroHsm.h2,
      ntildeProof: bitgoChallenges.bitgoNitroHsm.ntildeProof,
    });

    return instChallengeVerified && nitroChallengeVerified;
  }

  /**
   * Verifies ZK proof for a single BitGo challenge
   * @param bitgoChallenge
   */
  static async verifyBitGoChallenge(bitgoChallenge: EcdsaTypes.SerializedNtildeWithProofs): Promise<boolean> {
    const deserializedInstChallenge = EcdsaTypes.deserializeNtildeWithProofs(bitgoChallenge);
    const ntildeProofH1WrtH2Verified = await EcdsaRangeProof.verifyNtildeProof(
      {
        ntilde: deserializedInstChallenge.ntilde,
        h1: deserializedInstChallenge.h1,
        h2: deserializedInstChallenge.h2,
      },
      deserializedInstChallenge.ntildeProof.h1WrtH2
    );
    const ntildeProofH2WrtH1Verified = await EcdsaRangeProof.verifyNtildeProof(
      {
        ntilde: deserializedInstChallenge.ntilde,
        h1: deserializedInstChallenge.h2,
        h2: deserializedInstChallenge.h1,
      },
      deserializedInstChallenge.ntildeProof.h2WrtH1
    );
    return ntildeProofH1WrtH2Verified && ntildeProofH2WrtH1Verified;
  }

  /**
   * Gets the bitgo challenges for both nitro and institutional HSMs from WP API.
   * @param bitgo
   */
  static async getBitGoChallenges(bitgo: BitGoBase): Promise<GetBitGoChallengesApi> {
    const res = await bitgo.get(bitgo.url('/tss/ecdsa/challenges', 2)).send().result();
    if (
      !res.bitgoNitroHsm ||
      !res.bitgoNitroHsm.ntilde ||
      !res.bitgoNitroHsm.h1 ||
      !res.bitgoNitroHsm.h2 ||
      !res.bitgoNitroHsm.ntildeProof ||
      !res.bitgoInstitutionalHsm ||
      !res.bitgoInstitutionalHsm.ntilde ||
      !res.bitgoInstitutionalHsm.h1 ||
      !res.bitgoInstitutionalHsm.h2 ||
      !res.bitgoInstitutionalHsm.ntildeProof
    ) {
      throw new Error('Expected BitGo challenge proof to be present. Contact support@bitgo.com.');
    }
    return res;
  }

  /**
   * Gets BitGo's proofs from API and signs them if the proofs are valid.
   * @param bitgo
   * @param enterpriseId
   * @param userPassword
   */
  static async getVerifyAndSignBitGoChallenges(
    bitgo: BitGoBase,
    enterpriseId: string,
    userPassword: string
  ): Promise<BitGoProofSignatures> {
    // Fetch BitGo's challenge and verify
    const bitgoChallengesWithProofs = await EcdsaUtils.getBitGoChallenges(bitgo);
    if (!(await EcdsaUtils.verifyBitGoChallenges(bitgoChallengesWithProofs))) {
      throw new Error(
        `Failed to verify BitGo's challenge needed to enable ECDSA signing. Please contact support@bitgo.com`
      );
    }
    return await EcdsaUtils.signBitgoChallenges(bitgo, enterpriseId, userPassword, bitgoChallengesWithProofs);
  }

  /**
   * Sign Bitgo's proofs, verification of proofs is left to the caller
   * @param bitgo
   * @param enterpriseId
   * @param userPassword
   * @param bitgoChallengesWithProofs Optionally provide Bitgo Challaenge & Proofs instead of fetching from API
   */
  static async signBitgoChallenges(
    bitgo: BitGoBase,
    enterpriseId: string,
    userPassword: string,
    bitgoChallengesWithProofs?: GetBitGoChallengesApi
  ): Promise<BitGoProofSignatures> {
    // fetch challenge & proof if none are provided
    const challengesWithProofs = bitgoChallengesWithProofs
      ? bitgoChallengesWithProofs
      : await EcdsaUtils.getBitGoChallenges(bitgo);

    // Fetch user's ecdh public keychain needed for signing the challenges
    const ecdhKeypair = await bitgo.getEcdhKeypairPrivate(userPassword, enterpriseId);

    const signedBitGoInstChallenge = EcdsaUtils.signChallenge(
      challengesWithProofs.bitgoInstitutionalHsm,
      ecdhKeypair.xprv,
      ecdhKeypair.derivationPath
    );
    const signedBitGoNitroChallenge = EcdsaUtils.signChallenge(
      challengesWithProofs.bitgoNitroHsm,
      ecdhKeypair.xprv,
      ecdhKeypair.derivationPath
    );
    return {
      bitgoInstHsmAdminSignature: signedBitGoInstChallenge,
      bitgoNitroHsmAdminSignature: signedBitGoNitroChallenge,
    };
  }

  /**
   * This is needed to enable ecdsa signing on the enterprise.
   * It receives the enterprise challenge and signatures of verified bitgo proofs
   * and uploads them on the enterprise.
   * @param bitgo
   * @param entId - enterprise id to enable ecdsa signing on
   * @param userPassword - enterprise admin's login pw
   * @param bitgoInstChallengeProofSignature - signature on bitgo's institutional HSM challenge after verification
   * @param bitgoNitroChallengeProofSignature - signature on bitgo's nitro HSM challenge after verification
   * @param challenge - optionally use the challenge for enterprise challenge
   */
  static async initiateChallengesForEnterprise(
    bitgo: BitGoBase,
    entId: string,
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void> {
    // Fetch user's ecdh public keychain needed for signing the challenges
    const ecdhKeypair = await bitgo.getEcdhKeypairPrivate(userPassword, entId);

    // Generate and sign enterprise challenge
    const entChallengeWithProof = challenge ?? (await EcdsaRangeProof.generateNtilde(minModulusBitLength));
    const serializedEntChallengeWithProof = EcdsaTypes.serializeNtildeWithProofs(entChallengeWithProof);
    const signedEnterpriseChallenge = EcdsaUtils.signChallenge(
      serializedEntChallengeWithProof,
      ecdhKeypair.xprv,
      ecdhKeypair.derivationPath
    );

    await this.uploadChallengesToEnterprise(
      bitgo,
      entId,
      serializedEntChallengeWithProof,
      signedEnterpriseChallenge.toString('hex'),
      bitgoInstChallengeProofSignature.toString('hex'),
      bitgoNitroChallengeProofSignature.toString('hex')
    );
  }

  /**
   * Uploads the signed challenges and their proofs on the enterprise.
   * This initiates ecdsa signing for the enterprise users.
   * @param bitgo
   * @param entId - enterprise to enable ecdsa signing on
   * @param entChallenge - client side generated ent challenge with ZK proofs
   * @param entChallengeSignature - signature on enterprise challenge
   * @param bitgoIntChallengeSignature - signature on BitGo's institutional HSM challenge
   * @param bitgoNitroChallengeSignature - signature on BitGo's nitro HSM challenge
   */
  static async uploadChallengesToEnterprise(
    bitgo: BitGoBase,
    entId: string,
    entChallenge: EcdsaTypes.SerializedNtilde | EcdsaTypes.SerializedNtildeWithProofs,
    entChallengeSignature: string,
    bitgoIntChallengeSignature: string,
    bitgoNitroChallengeSignature: string
  ): Promise<void> {
    const body = {
      enterprise: {
        ntilde: entChallenge.ntilde,
        h1: entChallenge.h1,
        h2: entChallenge.h2,
        verifiers: {
          adminSignature: entChallengeSignature,
        },
      },
      bitgoInstitutionalHsm: {
        verifiers: {
          adminSignature: bitgoIntChallengeSignature,
        },
      },
      bitgoNitroHsm: {
        verifiers: {
          adminSignature: bitgoNitroChallengeSignature,
        },
      },
    };
    if ('ntildeProof' in entChallenge) {
      body.enterprise['ntildeProof'] = entChallenge.ntildeProof;
    }
    await bitgo
      .put(bitgo.url(`/enterprise/${entId}/tssconfig/ecdsa/challenge`, 2))
      .send(body)
      .result();
  }
}
