import assert from 'assert';
import { Buffer } from 'buffer';
import * as openpgp from 'openpgp';
import { Key, SerializedKeyPair } from 'openpgp';
import { Hash, createHash } from 'crypto';
import { EcdsaPaillierProof, EcdsaRangeProof, EcdsaTypes, hexToBigInt, minModulusBitLength } from '@bitgo/sdk-lib-mpc';
import { bip32 } from '@bitgo/utxo-lib';

import { ECDSA, Ecdsa } from '../../../../account-lib/mpc/tss';
import {
  AddKeychainOptions,
  EcdhDerivedKeypair,
  Keychain,
  KeyType,
  WebauthnKeyEncryptionInfo,
} from '../../../keychain';
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
  TSSParamsForMessageWithPrv,
  TSSParamsWithPrv,
  TssSignTxRequestParamsWithPrv,
  TssTxRecipientSource,
  TxRequest,
  UnsignedTransactionTss,
} from '../baseTypes';
import { getTxRequest } from '../../../tss';
import { AShare, DShare, EncryptedNShare, SendShareType, SShare, WShare, OShare } from '../../../tss/ecdsa/types';
import { createShareProof, generateGPGKeyPair, getBitgoGpgPubKey } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { InvalidTransactionError } from '../../../errors';
import { verifyWalletSignature } from '../../../tss/ecdsa/ecdsa';
import { signMessageWithDerivedEcdhKey, verifyEcdhSignature } from '../../../ecdh';
import { getTxRequestChallenge } from '../../../tss/common';
import {
  ShareKeyPosition,
  TssEcdsaStep1ReturnMessage,
  TssEcdsaStep2ReturnMessage,
  TxRequestChallengeResponse,
} from '../../../tss/types';
import { BaseEcdsaUtils } from './base';
import { EncryptionVersion, IRequestTracer } from '../../../../api';
import { resolveEffectiveTxParams } from '../recipientUtils';
import { shouldVerifyWithSerializedTxHex } from '../serializedTxHexVerify';

const encryptNShare = ECDSAMethods.encryptNShare;

/** Encrypted signing-share envelopes older than this are rejected along with their registry entries. */
export const OFFLINE_SIGNING_SHARE_MAX_AGE_MS = 30 * 24 * 3600 * 1000; // 30 days

/** @inheritdoc */
export class EcdsaUtils extends BaseEcdsaUtils {
  private static readonly GG18_SIGNING_WSHARE_STATE = 'GG18_SIGNING_WSHARE_STATE';
  private static readonly GG18_SIGNING_OSHARE_STATE = 'GG18_SIGNING_OSHARE_STATE';

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
    webauthnInfo?: WebauthnKeyEncryptionInfo;
    encryptionVersion?: EncryptionVersion;
    // Accepted for signature-compatibility with the MPCv2 path (Wallet Safes v1); the legacy
    // MPCv1 ceremony does not support safe root tagging, so it is intentionally ignored here.
    safeId?: string;
  }): Promise<KeychainsTriplet> {
    const MPC = new Ecdsa();
    const m = 2;
    const n = 3;

    const userKeyShare = await MPC.keyShare(1, m, n);
    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const backupKeyShare = await this.createBackupKeyShares();
    const backupGpgKey = await this.getBackupGpgPubKey();

    // Get the BitGo public key based on user/enterprise feature flags
    // If it doesn't work, use the default public key from the constants
    const { mpcv2PublicKey: primaryGpgKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise);
    const bitgoPublicGpgKey = primaryGpgKey ?? this.bitgoPublicGpgKey;

    const bitgoKeychain = await this.createBitgoKeychain({
      userGpgKey,
      backupGpgKey,
      bitgoPublicGpgKey,
      userKeyShare,
      backupKeyShare,
      enterprise: params.enterprise,
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
      webauthnInfo: params.webauthnInfo,
      encryptionVersion: params.encryptionVersion,
      enterprise: params.enterprise,
    });
    const backupKeychainPromise = this.createBackupKeychain({
      userGpgKey,
      backupGpgKey,
      bitgoPublicGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      passphrase: params.passphrase,
      encryptionVersion: params.encryptionVersion,
    });

    const [userKeychain, backupKeychain] = await Promise.all([userKeychainPromise, backupKeychainPromise]);

    return {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
  }

  async createBackupKeyShares(): Promise<BackupKeyShare> {
    const MPC = new Ecdsa();
    const m = 2;
    const n = 3;
    const backupKeyShare = {
      userHeldKeyShare: await MPC.keyShare(2, m, n),
    };
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
    webauthnInfo,
    encryptionVersion,
    enterprise,
  }: CreateEcdsaKeychainParams): Promise<Keychain> {
    if (!passphrase) {
      throw new Error('Please provide a wallet passphrase');
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
      originalPasscodeEncryptionCode,
      webauthnInfo,
      encryptionVersion,
      enterprise
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
    encryptionVersion,
  }: CreateEcdsaKeychainParams): Promise<Keychain> {
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
      passphrase,
      undefined,
      undefined,
      encryptionVersion
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
  }: CreateEcdsaBitGoKeychainParams): Promise<Keychain> {
    const recipientIndex = 3;
    const userToBitgoShare = await encryptNShare(userKeyShare, recipientIndex, bitgoPublicGpgKey.armor(), userGpgKey);

    const backupToBitgoShare = await this.getBackupEncryptedNShare(
      backupKeyShare,
      recipientIndex,
      bitgoPublicGpgKey.armor(),
      backupGpgKey as SerializedKeyPair<string>
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
      backupGPGPublicKey: (backupGpgKey as SerializedKeyPair<string>).publicKey,
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
    backupGpgKey: SerializedKeyPair<string>
  ): Promise<EncryptedNShare> {
    assert(backupShare.userHeldKeyShare);
    const backupToRecipientShare = await encryptNShare(
      backupShare.userHeldKeyShare,
      recipientIndex,
      recipientGpgPublicArmor,
      backupGpgKey
    );
    return backupToRecipientShare;
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
    originalPasscodeEncryptionCode?: string,
    webauthnInfo?: WebauthnKeyEncryptionInfo,
    encryptionVersion?: EncryptionVersion,
    enterprise?: string
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
    const recipientKeychainParams: AddKeychainOptions & { prv: string } = {
      source: recipient,
      keyType: 'tss' as KeyType,
      commonKeychain: bitgoKeychain.commonKeychain,
      prv: prv,
      encryptedPrv: await this.bitgo.encrypt({
        input: prv,
        password: passphrase,
        encryptionVersion,
      }),
      originalPasscodeEncryptionCode,
    };

    if (webauthnInfo && recipientIndex === ShareKeyPosition.USER) {
      // Send the passkey as `webauthnInfo`; the deprecated `webauthnDevices` array is ignored by POST /key.
      assert(enterprise, 'enterprise is required to attach a webauthn device to the user keychain');
      recipientKeychainParams.webauthnInfo = {
        otpDeviceId: webauthnInfo.otpDeviceId,
        prfSalt: webauthnInfo.prfSalt,
        encryptedPrv: await this.bitgo.encrypt({
          input: prv,
          password: webauthnInfo.passphrase,
          encryptionVersion,
        }),
        enterpriseId: enterprise,
      };
    }

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
    encryptionVersion?: EncryptionVersion;
    signableAdata?: string;
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
        ? await this.bitgo.encrypt({
            input: JSON.stringify(userSignShare.wShare),
            password: params.walletPassphrase,
            encryptionVersion: params.encryptionVersion,
            adata: params.signableAdata
              ? this.formatOfflineSigningAdata(EcdsaUtils.GG18_SIGNING_WSHARE_STATE, params.signableAdata)
              : undefined,
          })
        : userSignShare.wShare,
    };
  }

  private async createTssEcdsaStep2SigningMaterial(params: {
    bitgoChallenge: TxRequestChallengeResponse;
    wShare: WShare;
    aShareFromBitgo: Omit<AShare, 'h1' | 'h2' | 'ntilde'>;
    walletPassphrase?: string;
    encryptionVersion?: EncryptionVersion;
    signableAdata?: string;
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
        ? await this.bitgo.encrypt({
            input: JSON.stringify(userOmicronAndDeltaShare.oShare),
            password: params.walletPassphrase,
            encryptionVersion: params.encryptionVersion,
            adata: params.signableAdata
              ? this.formatOfflineSigningAdata(EcdsaUtils.GG18_SIGNING_OSHARE_STATE, params.signableAdata)
              : undefined,
          })
        : userOmicronAndDeltaShare.oShare,
    };
  }

  getOfflineSignerPaillierModulus(params: { prv: string }): { userPaillierModulus: string } {
    assert(params.prv, 'Params to get paillier modulus are missing prv.');
    const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = JSON.parse(params.prv);
    return { userPaillierModulus: userSigningMaterial.pShare.n };
  }

  /**
   * Computes the adata binding string for offline (external-signer) signing: the
   * sha256 of the signable payload, plus the derivation path (empty for message
   * signing). Encrypted share envelopes created from the signer's own key
   * material carry this adata and later rounds validate it, so an envelope can
   * only be replayed against the exact signable it was created for.
   */
  private getOfflineSigningAdata(
    txRequest: TxRequest,
    requestType: RequestType,
    params: { bufferToSign?: unknown } = {}
  ): string {
    let signablePayload: Buffer;
    let derivationPath: string;
    if (requestType === RequestType.tx) {
      let unsignedTx: UnsignedTransactionTss | undefined;
      if (txRequest.apiVersion === 'full') {
        assert(txRequest.transactions && txRequest.transactions.length > 0, 'Missing transactions in txRequest');
        unsignedTx = txRequest.transactions[0].unsignedTx;
      } else {
        assert(txRequest.unsignedTxs && txRequest.unsignedTxs.length > 0, 'Missing unsignedTxs in txRequest');
        unsignedTx = txRequest.unsignedTxs[0];
      }
      assert(unsignedTx, 'Missing unsignedTx in txRequest');
      assert(unsignedTx.signableHex, 'Missing signableHex in txRequest');
      signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
      derivationPath = unsignedTx.derivationPath ?? '';
    } else if (requestType === RequestType.message) {
      // Declared as Buffer, but over HTTP it may arrive as the JSON round-trip form `{ type: 'Buffer', data: number[] }`
      const bufferToSign: unknown = params.bufferToSign;
      assert(bufferToSign, 'Missing bufferToSign for message signing');
      if (Buffer.isBuffer(bufferToSign)) {
        signablePayload = bufferToSign;
      } else if (
        typeof bufferToSign === 'object' &&
        bufferToSign !== null &&
        'data' in bufferToSign &&
        Array.isArray(bufferToSign.data)
      ) {
        // JSON round-trip of a Buffer arrives as `{ type: 'Buffer', data: number[] }`
        signablePayload = Buffer.from(bufferToSign.data);
      } else {
        throw new Error('Invalid bufferToSign type');
      }
      derivationPath = '';
    } else {
      throw new Error(`Invalid requestType: ${requestType}`);
    }
    return `${createHash('sha256').update(signablePayload).digest('hex')}:${derivationPath}`;
  }

  /**
   * Returns the Paillier modulus BitGo used at keygen time, as recorded in the
   * signer's own signing material. Counterparty inputs (challenges, A-shares)
   * must carry the same modulus.
   */
  private getBitgoPaillierModulusFromSigningMaterial(prv: string): string {
    const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = JSON.parse(prv);
    assert(userSigningMaterial.bitgoNShare?.n, 'Signer signing material is missing the BitGo Paillier modulus');
    return userSigningMaterial.bitgoNShare.n;
  }

  /** Envelope adata format: `<STATE>:<createdEpochMs>:<sha256(signable)>:<derivationPath>`. */
  private formatOfflineSigningAdata(state: string, core: string): string {
    return `${state}:${Date.now()}:${core}`;
  }

  /**
   * Validates an encrypted share envelope's adata against the expected signable binding.
   * adata is AEAD-authenticated (v1 CCM / v2 GCM), so it cannot be stripped or altered
   * without breaking decryption. The creation timestamp is checked separately from the
   * binding, so the two concerns stay independent.
   */
  private validateOfflineSigningAdata(cyphertext: string, state: string, expectedCore: string): string {
    let stored: string | undefined;
    try {
      const raw = JSON.parse(cyphertext).adata;
      // v1 (SJCL) envelopes escape() the adata (':' -> '%3A'); decode before parsing,
      // matching baseTSSUtils.validateAdata.
      stored = typeof raw === 'string' ? decodeURIComponent(raw) : undefined;
    } catch {
      throw new Error('Failed to parse cyphertext to JSON');
    }
    if (typeof stored !== 'string') {
      throw new Error('Missing adata on encrypted share envelope; restart the signing session');
    }
    if (!stored.startsWith(`${state}:`)) {
      throw new Error('Adata does not match cyphertext adata');
    }
    const remainder = stored.slice(state.length + 1);
    const separator = remainder.indexOf(':');
    assert(separator > 0, 'Adata does not match cyphertext adata');
    const created = Number(remainder.slice(0, separator));
    const core = remainder.slice(separator + 1);
    if (core !== expectedCore) {
      throw new Error('Adata does not match cyphertext adata');
    }
    const now = Date.now();
    assert(
      Number.isFinite(created) && created <= now,
      'Encrypted share envelope has a future timestamp; restart the signing session'
    );
    assert(
      now - created <= OFFLINE_SIGNING_SHARE_MAX_AGE_MS,
      'Encrypted share envelope has expired; restart the signing session'
    );
    return stored;
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
    encryptionVersion?: EncryptionVersion;
  }): Promise<TssEcdsaStep1ReturnMessage> {
    const { tssParams, prv, requestType, challenges } = params;
    assert(typeof tssParams.txRequest !== 'string', 'Invalid txRequest type');
    const txRequest: TxRequest = tssParams.txRequest;
    let derivationPath;

    if (requestType === RequestType.tx) {
      assert(
        (txRequest.transactions && txRequest.transactions.length > 0) ||
          (txRequest.unsignedTxs && txRequest.unsignedTxs.length > 0),
        'Unable to find transactions in txRequest'
      );
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
      assert(unsignedTx, 'Missing unsignedTx in txRequest');
      derivationPath = unsignedTx.derivationPath;
    } else if (requestType === RequestType.message) {
      // TODO BG-67299 Message signing with derivation path
      derivationPath = '';
    }
    const bufferToSign = tssParams && 'bufferToSign' in tssParams ? tssParams.bufferToSign : undefined;
    assert(
      challenges.bitgoChallenge?.n &&
        challenges.bitgoChallenge.n.toLowerCase() ===
          this.getBitgoPaillierModulusFromSigningMaterial(prv).toLowerCase(),
      "BitGo challenge Paillier modulus does not match the signer's BitGo key material"
    );
    return this.createTssEcdsaStep1SigningMaterial({
      prv: prv,
      challenges: challenges,
      derivationPath: derivationPath,
      walletPassphrase: params.walletPassphrase,
      encryptionVersion: params.encryptionVersion,
      signableAdata: this.getOfflineSigningAdata(txRequest, requestType, { bufferToSign }),
    });
  }

  async createOfflineMuDeltaShare(params: {
    /** Bound signable context; enables wShare adata validation. */
    tssParams?: TSSParams | TSSParamsForMessage;
    requestType?: RequestType;
    /** Legacy relays pass txRequest at top level; still fully validated. */
    txRequest?: TxRequest;
    /** Injected by the express signer route; enables Paillier-modulus validation. */
    prv?: string;
    /** Marks the wShare consumed with its validated adata; invoked only after the envelope fully authenticates. */
    markConsumed?: (adata: string) => void;
    aShareFromBitgo: Omit<AShare, 'ntilde' | 'h1' | 'h2'>;
    bitgoChallenge: TxRequestChallengeResponse;
    encryptedWShare: string;
    walletPassphrase: string;
    encryptionVersion?: EncryptionVersion;
  }): Promise<TssEcdsaStep2ReturnMessage> {
    // Resolve txRequest/requestType from the current shape (tssParams/requestType) or the
    // legacy relay shape (top-level txRequest; relays only sign transactions).
    const tssParams = params.tssParams;
    let txRequest: TxRequest | undefined;
    if (tssParams) {
      // fail loudly on a malformed (string) txRequest rather than skipping validation
      assert(typeof tssParams.txRequest !== 'string', 'Invalid txRequest type');
      txRequest = tssParams.txRequest;
    } else {
      txRequest = params.txRequest;
    }
    const requestType = params.requestType ?? RequestType.tx;
    let validatedAdata: string;
    const bufferToSign = tssParams && 'bufferToSign' in tssParams ? tssParams.bufferToSign : undefined;
    // With txRequest: validate the wShare binding and re-bind the oShare to the same signable.
    // Without txRequest (legacy direct callers): propagate the wShare envelope's own binding;
    // this path does not itself check the signable — the S round enforces that binding
    // (re-prefixed for the oShare), so the S round still validates strictly. adata is
    // AEAD-authenticated, so a captured envelope's binding cannot be stripped or altered.
    const expectedCore = txRequest ? this.getOfflineSigningAdata(txRequest, requestType, { bufferToSign }) : undefined;
    let signableAdata: string;
    if (expectedCore) {
      validatedAdata = this.validateOfflineSigningAdata(
        params.encryptedWShare,
        EcdsaUtils.GG18_SIGNING_WSHARE_STATE,
        expectedCore
      );
      signableAdata = expectedCore;
    } else {
      let wAdata: unknown;
      try {
        // v1 (SJCL) envelopes escape() the adata (':' -> '%3A'); decode before parsing,
        // matching baseTSSUtils.validateAdata.
        wAdata = decodeURIComponent(JSON.parse(params.encryptedWShare).adata ?? '');
      } catch {
        throw new Error('Failed to parse encryptedWShare to JSON');
      }
      const wPrefix = `${EcdsaUtils.GG18_SIGNING_WSHARE_STATE}:`;
      assert(
        typeof wAdata === 'string' && wAdata.startsWith(wPrefix),
        'wShare envelope is missing a binding; restart the signing session'
      );
      // Re-prefix the wShare binding for the oShare: strip the original timestamp (checking
      // its age), then let the builder stamp the oShare's own creation time.
      const wCore = wAdata.slice(wPrefix.length);
      const wSeparator = wCore.indexOf(':');
      assert(wSeparator > 0, 'Adata does not match cyphertext adata');
      const wCreated = Number(wCore.slice(0, wSeparator));
      const wNow = Date.now();
      assert(
        Number.isFinite(wCreated) && wCreated <= wNow,
        'Encrypted share envelope has a future timestamp; restart the signing session'
      );
      assert(
        wNow - wCreated <= OFFLINE_SIGNING_SHARE_MAX_AGE_MS,
        'Encrypted share envelope has expired; restart the signing session'
      );
      signableAdata = wCore.slice(wSeparator + 1);
      validatedAdata = `${EcdsaUtils.GG18_SIGNING_WSHARE_STATE}:${wCore.slice(0, wSeparator)}:${signableAdata}`;
    }
    if (params.prv) {
      const bitgoPaillierModulus = this.getBitgoPaillierModulusFromSigningMaterial(params.prv).toLowerCase();
      assert(
        params.bitgoChallenge?.n && params.bitgoChallenge.n.toLowerCase() === bitgoPaillierModulus,
        "BitGo challenge Paillier modulus does not match the signer's BitGo key material"
      );
      assert(
        params.aShareFromBitgo?.n && params.aShareFromBitgo.n.toLowerCase() === bitgoPaillierModulus,
        'A-share from BitGo has an unexpected Paillier modulus'
      );
    }
    const decryptedWShare = await this.bitgo.decrypt({
      input: params.encryptedWShare,
      password: params.walletPassphrase,
    });
    // The envelope has fully authenticated (AEAD tag verified); only now is it marked
    // consumed, so unauthenticated junk never reaches the registry.
    params.markConsumed?.(validatedAdata);
    return await this.createTssEcdsaStep2SigningMaterial({
      aShareFromBitgo: params.aShareFromBitgo,
      bitgoChallenge: params.bitgoChallenge,
      wShare: JSON.parse(decryptedWShare),
      walletPassphrase: params.walletPassphrase,
      encryptionVersion: params.encryptionVersion,
      signableAdata: signableAdata,
    });
  }

  async createOfflineSShare(params: {
    tssParams: TSSParams | TSSParamsForMessage;
    dShareFromBitgo: DShare;
    requestType: RequestType;
    encryptedOShare: string;
    walletPassphrase: string;
    /** Marks the oShare consumed with its validated adata; invoked only after the envelope fully authenticates. */
    markConsumed?: (adata: string) => void;
  }): Promise<SShare> {
    const { tssParams, requestType, dShareFromBitgo, encryptedOShare, walletPassphrase } = params;
    assert(typeof tssParams.txRequest !== 'string', 'Invalid txRequest type');
    const txRequest: TxRequest = tssParams.txRequest;
    let signablePayload;
    if (requestType === RequestType.tx) {
      assert(
        (txRequest.transactions && txRequest.transactions.length > 0) ||
          (txRequest.unsignedTxs && txRequest.unsignedTxs.length > 0),
        'Unable to find transactions in txRequest'
      );
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
      assert(unsignedTx, 'Missing unsignedTx in txRequest');
      signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
    } else if (requestType === RequestType.message) {
      signablePayload = (params.tssParams as TSSParamsForMessage).bufferToSign;
    }
    const bufferToSign =
      params.tssParams && 'bufferToSign' in params.tssParams ? params.tssParams.bufferToSign : undefined;
    const validatedAdata = this.validateOfflineSigningAdata(
      encryptedOShare,
      EcdsaUtils.GG18_SIGNING_OSHARE_STATE,
      this.getOfflineSigningAdata(txRequest, requestType, { bufferToSign })
    );
    let hash: Hash | undefined;
    try {
      hash = this.baseCoin.getHashFunction();
    } catch (err) {
      hash = undefined;
    }
    const decryptedOShare = await this.bitgo.decrypt({ input: encryptedOShare, password: walletPassphrase });
    // The envelope has fully authenticated (AEAD tag verified); only now is it marked
    // consumed, so unauthenticated junk never reaches the registry.
    params.markConsumed?.(validatedAdata);
    const { i, R, s, y } = await ECDSAMethods.createUserSignatureShare(
      JSON.parse(decryptedOShare),
      dShareFromBitgo,
      signablePayload,
      hash
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
      params.reqId,
      requestType === RequestType.tx ? params.attestation : undefined
    )) as Omit<AShare, 'ntilde' | 'h1' | 'h2'>; // WP/HSM does not return the initial challenge
    const step2Return = await externalSignerMuDeltaShareGenerator({
      txRequest: txRequestObj,
      tssParams: {
        ...params,
        txRequest: txRequestObj,
      },
      requestType: requestType,
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
  private async signRequestBase(
    params: TSSParamsWithPrv | TSSParamsForMessageWithPrv,
    requestType: RequestType
  ): Promise<TxRequest> {
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
        ? await getTxRequest(this.bitgo, this.wallet.id(), params.txRequest, params.reqId)
        : params.txRequest;

    let signablePayload = new Buffer('');
    let derivationPath = '';

    if (requestType === RequestType.tx) {
      assert(
        (txRequest.transactions && txRequest.transactions.length > 0) ||
          (txRequest.unsignedTxs && txRequest.unsignedTxs.length > 0),
        'Unable to find transactions in txRequest'
      );
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
      assert(unsignedTx, 'Missing unsignedTx in txRequest');

      if (
        'recipientSource' in params &&
        params.recipientSource === TssTxRecipientSource.Explicit &&
        !params.txParams?.recipients?.length
      ) {
        throw new InvalidTransactionError(
          'recipientSource "explicit" requires txParams.recipients with at least one recipient.'
        );
      }

      // For some coins, signableHex is not a parseable transaction. Pass
      // serializedTxHex so verifyTransaction can decode the full tx bytes.
      // Gated by CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX (ICP hash digests,
      // BSC/XDC legacy EIP-155 RLP with v=chainId, etc.).
      if (shouldVerifyWithSerializedTxHex(this.baseCoin)) {
        await this.baseCoin.verifyTransaction({
          txPrebuild: { txHex: unsignedTx.serializedTxHex, txInfo: unsignedTx.signableHex },
          txParams: resolveEffectiveTxParams(txRequest, params.txParams, this.baseCoin.getChain()),
          wallet: this.wallet,
          walletType: this.wallet.multisigType(),
        });
      } else {
        await this.baseCoin.verifyTransaction({
          txPrebuild: { txHex: unsignedTx.signableHex },
          txParams: resolveEffectiveTxParams(txRequest, params.txParams, this.baseCoin.getChain()),
          wallet: this.wallet,
          walletType: this.wallet.multisigType(),
        });
      }
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
      0,
      params.reqId
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
      step1Return.userPublicGpgKey,
      params.reqId,
      requestType === RequestType.tx ? params.attestation : undefined
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
      step2Return.muDShare,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      params.reqId
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
      userSShare,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      params.reqId
    );
    return await getTxRequest(this.bitgo, this.wallet.id(), txRequest.txRequestId, params.reqId);
  }

  /**
   * Signs the transaction associated to the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @param params.recipientSource - optional; use TssTxRecipientSource.Explicit with a non-empty
   *   txParams.recipients list when you want TypeScript to enforce passing recipient details at compile time.
   * @returns {Promise<TxRequest>} fully signed TxRequest object
   */
  async signTxRequest(params: TssSignTxRequestParamsWithPrv): Promise<TxRequest> {
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
  async signTxRequestForMessage(params: TSSParamsForMessageWithPrv): Promise<TxRequest> {
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
   * Derives the ECDH public key from the decrypted ECDH xprv.
   * Use this, never a server-supplied `derivedPubKey`, when the key is the trust anchor for a signature check.
   * @param ecdhKeypair - keypair whose xprv was decrypted locally with the user's password
   */
  static getEcdhPubKeyFromXprv(ecdhKeypair: Pick<EcdhDerivedKeypair, 'xprv' | 'derivationPath'>): Buffer {
    return bip32.fromBase58(ecdhKeypair.xprv).derivePath(ecdhKeypair.derivationPath).publicKey;
  }

  /**
   * Returns true iff `challenge.verifiers.adminSignature` is a valid signature over the challenge
   * by the given ECDH keypair. The verifying pubkey is derived from the xprv.
   * @param challenge - challenge with the stored admin signature
   * @param ecdhKeypair - expected signer
   */
  static isChallengeSignedByEcdhKeypair(
    challenge: EcdsaTypes.SerializedNtilde & { verifiers?: { adminSignature?: string } },
    ecdhKeypair: Pick<EcdhDerivedKeypair, 'xprv' | 'derivationPath'>
  ): boolean {
    const adminSignature = challenge.verifiers?.adminSignature;
    if (typeof adminSignature !== 'string' || adminSignature.length === 0) {
      return false;
    }
    return verifyEcdhSignature(
      this.getMessageToSignFromChallenge(challenge),
      adminSignature,
      this.getEcdhPubKeyFromXprv(ecdhKeypair)
    );
  }

  /**
   * Verifies an existing enterprise challenge before the admin's ECDH key re-signs it.
   * Throws unless:
   * 1. the stored admin signature was made by this admin's own ECDH key (provenance),
   * 2. the challenge is not one of BitGo's current HSM challenges (whose trapdoor BitGo knows),
   * 3. both ntilde discrete-log proofs verify (well-formedness; rejects degenerate h1/h2).
   * @param challenge - existing enterprise challenge as served by BitGo
   * @param ecdhKeypair - the admin's locally decrypted ECDH keypair
   * @param bitgoChallenges - BitGo's current HSM challenges
   */
  static async verifyEnterpriseChallengeForResign(
    challenge: EcdsaTypes.SerializedNtildeWithProofs & { verifiers?: { adminSignature?: string } },
    ecdhKeypair: Pick<EcdhDerivedKeypair, 'xprv' | 'derivationPath'>,
    bitgoChallenges: GetBitGoChallengesApi
  ): Promise<void> {
    if (!this.isChallengeSignedByEcdhKeypair(challenge, ecdhKeypair)) {
      throw new Error(
        'Cannot re-sign. The existing enterprise ECDSA challenge was not signed by your ECDH key. Generate a new challenge instead.'
      );
    }
    const ntilde = hexToBigInt(challenge.ntilde);
    if (
      hexToBigInt(bitgoChallenges.bitgoInstitutionalHsm.ntilde) === ntilde ||
      hexToBigInt(bitgoChallenges.bitgoNitroHsm.ntilde) === ntilde
    ) {
      throw new Error('Cannot re-sign. The existing enterprise ECDSA challenge matches a BitGo HSM challenge.');
    }
    let proofsValid: boolean;
    try {
      proofsValid = !!challenge.ntildeProof && (await this.verifyBitGoChallenge(challenge));
    } catch (e) {
      // malformed hex in the proof makes deserialization throw
      proofsValid = false;
    }
    if (!proofsValid) {
      throw new Error('Cannot re-sign. The existing enterprise ECDSA challenge has invalid ntilde proofs.');
    }
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
   * @param challenge - optional enterprise challenge generated locally by the caller (e.g. EcdsaRangeProof.generateNtilde). It is signed WITHOUT verification; never pass a challenge fetched from BitGo. To re-sign the enterprise's existing challenge use Enterprise.resignTssEcdsaChallenge.
   */
  static async initiateChallengesForEnterprise(
    bitgo: BitGoBase,
    entId: string,
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    openSSLBytes: Uint8Array,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void> {
    // Fetch user's ecdh public keychain needed for signing the challenges
    const ecdhKeypair = await bitgo.getEcdhKeypairPrivate(userPassword, entId);

    // Generate and sign enterprise challenge
    const entChallengeWithProof =
      challenge ?? (await EcdsaRangeProof.generateNtilde(openSSLBytes, minModulusBitLength));
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
