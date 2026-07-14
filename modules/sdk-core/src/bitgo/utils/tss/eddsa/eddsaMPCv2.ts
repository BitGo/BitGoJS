import assert from 'assert';
import * as pgp from 'openpgp';
import * as sjcl from '@bitgo/sjcl';
import { NonEmptyString } from 'io-ts-types';
import {
  EddsaMPCv2KeyGenRound1Request,
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Request,
  EddsaMPCv2KeyGenRound2Response,
  EddsaMPCv2SignatureShareRound1Output,
  EddsaMPCv2SignatureShareRound2Output,
  MPCv2KeyGenStateEnum,
  MPCv2PartyFromStringOrNumber,
} from '@bitgo/public-types';
import { EddsaMPCv2KeyGenCallbacks } from '../../../wallet/iWallets';
import { ed25519 } from '@noble/curves/ed25519';
import { EddsaMPSDkg, EddsaMPSDsg, MPSComms, MPSTypes, MPSUtil } from '@bitgo/sdk-lib-mpc';
import { KeychainsTriplet } from '../../../baseCoin';
import { AddKeychainOptions, Keychain, KeyType, WebauthnKeyEncryptionInfo } from '../../../keychain';
import { envRequiresBitgoPubGpgKeyConfig, isBitgoEddsaMpcv2PubKey } from '../../../tss/bitgoPubKeys';
import { getBitgoSignatureShare, getTxRequest, sendSignatureShareV2, sendTxRequest } from '../../../tss/common';
import { decodeWithCodec } from '../../codecs';
import {
  getSignatureShareRoundOne,
  getSignatureShareRoundTwo,
  getSignatureShareRoundThree,
  verifyPeerMessageRoundOne,
  verifyPeerMessageRoundTwo,
} from '../../../tss/eddsa/eddsaMPCv2';
import { getInitializedMpcInstance } from '../../../tss/eddsa/eddsa';
import { generateGPGKeyPair } from '../../opengpgUtils';
import { MPCv2PartiesEnum } from '../ecdsa/typesMPCv2';
import {
  CustomEddsaMPCv2SigningRound1GeneratingFunction,
  CustomEddsaMPCv2SigningRound2GeneratingFunction,
  CustomEddsaMPCv2SigningRound3GeneratingFunction,
  RequestType,
  SignatureShareRecord,
  SignatureShareType,
  TSSParams,
  TSSParamsForMessage,
  TSSParamsForMessageWithPrv,
  TSSParamsWithPrv,
  TxRequest,
  isV2Envelope,
} from '../baseTypes';
import { EncryptionVersion } from '../../../../api';
import { BitGoBase } from '../../../bitgoBase';
import { BaseEddsaUtils } from './base';
import { EddsaMPCv2KeyGenSendFn, KeyGenSenderForEnterprise } from './eddsaMPCv2KeyGenSender';
import { EddsaMPCv2RecoveryKeyShares } from './types';

export class EddsaMPCv2Utils extends BaseEddsaUtils {
  private static readonly MPS_DSG_SIGNING_USER_GPG_KEY = 'MPS_DSG_SIGNING_USER_GPG_KEY';
  private static readonly MPS_DSG_SIGNING_ROUND1_STATE = 'MPS_DSG_SIGNING_ROUND1_STATE';
  private static readonly MPS_DSG_SIGNING_ROUND2_STATE = 'MPS_DSG_SIGNING_ROUND2_STATE';
  private static readonly MPS_DKG_KEYGEN_ROUND1_STATE = 'MPS_DKG_KEYGEN_ROUND1_STATE';

  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise: string;
    originalPasscodeEncryptionCode?: string;
    webauthnInfo?: WebauthnKeyEncryptionInfo;
    encryptionVersion?: EncryptionVersion;
  }): Promise<KeychainsTriplet> {
    const userKeyPair = await generateGPGKeyPair('ed25519');
    const userGpgKey = await pgp.readPrivateKey({ armoredKey: userKeyPair.privateKey });
    const userGpgPublicKey = userKeyPair.publicKey;
    const [userPk, userSk] = await MPSComms.extractEd25519KeyPair(userGpgKey);

    const backupKeyPair = await generateGPGKeyPair('ed25519');
    const backupGpgKey = await pgp.readPrivateKey({ armoredKey: backupKeyPair.privateKey });
    const backupGpgPublicKey = backupKeyPair.publicKey;
    const [backupPk, backupSk] = await MPSComms.extractEd25519KeyPair(backupGpgKey);

    // Get the BitGo EdDSA MPCv2 public key (ed25519). Using the default mpcv2PublicKey (secp256k1)
    // here would cause a WASM "Invalid Input" error, so we require the dedicated eddsaMpcv2PublicKey.
    const { eddsaMpcv2PublicKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true);
    const bitgoPublicGpgKey = eddsaMpcv2PublicKey ?? this.bitgoEddsaMpcv2PublicGpgKey;
    assert(bitgoPublicGpgKey, 'Failed to get BitGo EdDSA MPCv2 GPG public key');
    const bitgoPublicGpgKeyArmored = bitgoPublicGpgKey.armor();

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      assert(isBitgoEddsaMpcv2PubKey(bitgoPublicGpgKeyArmored), 'Invalid BitGo GPG public key');
    }

    const bitgoKeyObj = await pgp.readKey({ armoredKey: bitgoPublicGpgKeyArmored });
    const bitgoPk = await MPSComms.extractEd25519PublicKey(bitgoKeyObj);

    // Create DKG sessions for user (party 0) and backup (party 1)
    const userDkg = new EddsaMPSDkg.DKG(3, 2, MPCv2PartiesEnum.USER);
    const backupDkg = new EddsaMPSDkg.DKG(3, 2, MPCv2PartiesEnum.BACKUP);

    // #region round 1
    await userDkg.initDkg(userSk, [backupPk, bitgoPk]);
    await backupDkg.initDkg(backupSk, [userPk, bitgoPk]);

    const userMsg1 = userDkg.getFirstMessage();
    const backupMsg1 = backupDkg.getFirstMessage();

    const userSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg1.payload), userGpgKey);
    const backupSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(backupMsg1.payload), backupGpgKey);

    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(backupGpgPublicKey), 'Backup GPG public key is required');

    const { sessionId, bitgoMsg1 } = await this.sendKeyGenerationRound1(params.enterprise, {
      userGpgPublicKey,
      backupGpgPublicKey,
      userMsg1: userSignedMsg1,
      backupMsg1: backupSignedMsg1,
    });
    // #endregion

    // #region round 2
    const bitgoRawMsg1Bytes = await MPSComms.verifyMpsMessage(bitgoMsg1, bitgoKeyObj);
    const bitgoDeserializedMsg1: MPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.BITGO,
      payload: new Uint8Array(bitgoRawMsg1Bytes),
    };

    const round1Messages: MPSTypes.DeserializedMessages = [userMsg1, backupMsg1, bitgoDeserializedMsg1];

    const userRound2Msgs = userDkg.handleIncomingMessages(round1Messages);
    const backupRound2Msgs = backupDkg.handleIncomingMessages(round1Messages);

    assert(userRound2Msgs.length === 1, 'User round 1 should produce exactly one round 2 message');
    assert(backupRound2Msgs.length === 1, 'Backup round 1 should produce exactly one round 2 message');

    const userMsg2 = userRound2Msgs[0];
    const backupMsg2 = backupRound2Msgs[0];

    const userSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg2.payload), userGpgKey);
    const backupSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(backupMsg2.payload), backupGpgKey);

    const {
      sessionId: sessionIdRound2,
      commonPublicKeychain,
      bitgoMsg2,
    } = await this.sendKeyGenerationRound2(params.enterprise, {
      sessionId,
      userMsg2: userSignedMsg2,
      backupMsg2: backupSignedMsg2,
    });
    // #endregion

    // #region keychain creation
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and round 2 session IDs do not match');

    const bitgoRawMsg2Bytes = await MPSComms.verifyMpsMessage(bitgoMsg2, bitgoKeyObj);
    const bitgoDeserializedMsg2: MPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.BITGO,
      payload: new Uint8Array(bitgoRawMsg2Bytes),
    };

    const round2Messages: MPSTypes.DeserializedMessages = [userMsg2, backupMsg2, bitgoDeserializedMsg2];

    const userFinalMsgs = userDkg.handleIncomingMessages(round2Messages);
    const backupFinalMsgs = backupDkg.handleIncomingMessages(round2Messages);

    assert(userFinalMsgs.length === 0, 'WASM round 2 should produce no output messages for user');
    assert(backupFinalMsgs.length === 0, 'WASM round 2 should produce no output messages for backup');

    const userCommonKeychain = userDkg.getCommonKeychain();
    const backupCommonKeychain = backupDkg.getCommonKeychain();

    assert.equal(
      userCommonKeychain,
      commonPublicKeychain,
      'User computed keychain does not match BitGo common keychain'
    );
    assert.equal(
      backupCommonKeychain,
      commonPublicKeychain,
      'Backup computed keychain does not match BitGo common keychain'
    );

    const userPrivateMaterial = userDkg.getKeyShare();
    const backupPrivateMaterial = backupDkg.getKeyShare();
    const userReducedPrivateMaterial = userDkg.getReducedKeyShare();
    const backupReducedPrivateMaterial = backupDkg.getReducedKeyShare();

    const userKeychainPromise = this.addUserKeychain(
      userCommonKeychain,
      userPrivateMaterial,
      userReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode,
      params.webauthnInfo,
      params.encryptionVersion,
      params.enterprise
    );
    const backupKeychainPromise = this.addBackupKeychain(
      backupCommonKeychain,
      backupPrivateMaterial,
      backupReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode,
      params.encryptionVersion
    );
    const bitgoKeychainPromise = this.addBitgoKeychain(userCommonKeychain);

    const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
      userKeychainPromise,
      backupKeychainPromise,
      bitgoKeychainPromise,
    ]);
    // #endregion

    return {
      userKeychain,
      backupKeychain,
      bitgoKeychain,
    };
  }

  async createKeychainsWithExternalSigner(params: {
    enterprise: string;
    callbacks: EddsaMPCv2KeyGenCallbacks;
  }): Promise<KeychainsTriplet> {
    const { enterprise, callbacks } = params;

    const { eddsaMpcv2PublicKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(enterprise, true);
    const bitgoPublicGpgKey = eddsaMpcv2PublicKey ?? this.bitgoEddsaMpcv2PublicGpgKey;
    assert(bitgoPublicGpgKey, 'Failed to get BitGo EdDSA MPCv2 GPG public key');
    const bitgoPublicGpgKeyArmored = bitgoPublicGpgKey.armor();

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      assert(isBitgoEddsaMpcv2PubKey(bitgoPublicGpgKeyArmored), 'Invalid BitGo EdDSA MPCv2 GPG public key');
    }

    // Round 0: both parties generate GPG keys
    const { userGpgPublicKey, backupGpgPublicKey, userState, backupState } = await callbacks.initializeCallback({
      enterprise,
      bitgoPublicGpgKey: bitgoPublicGpgKeyArmored,
    });

    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(backupGpgPublicKey), 'Backup GPG public key is required');

    // Round 1: both parties run DKG round 1
    const {
      userSignedMsg1,
      backupSignedMsg1,
      userState: userStateAfter1,
      backupState: backupStateAfter1,
    } = await callbacks.round1Callback({
      bitgoPublicGpgKey: bitgoPublicGpgKeyArmored,
      userGpgPublicKey,
      backupGpgPublicKey,
      userState,
      backupState,
    });

    const { sessionId, bitgoMsg1 } = await this.sendKeyGenerationRound1(enterprise, {
      userGpgPublicKey,
      backupGpgPublicKey,
      userMsg1: userSignedMsg1,
      backupMsg1: backupSignedMsg1,
    });

    // Round 2: both parties run DKG round 2
    const {
      userSignedMsg2,
      backupSignedMsg2,
      userState: userStateAfter2,
      backupState: backupStateAfter2,
    } = await callbacks.round2Callback({
      bitgoMsg1,
      userSignedMsg1,
      backupSignedMsg1,
      userState: userStateAfter1,
      backupState: backupStateAfter1,
    });

    const {
      sessionId: sessionIdRound2,
      commonPublicKeychain: bitgoCommonKeychain,
      bitgoMsg2,
    } = await this.sendKeyGenerationRound2(enterprise, {
      sessionId,
      userMsg2: userSignedMsg2,
      backupMsg2: backupSignedMsg2,
    });
    assert.strictEqual(sessionId, sessionIdRound2, 'Round 1 and round 2 session IDs do not match');

    // Finalize: both parties verify and derive the common keychain
    const { commonKeychain } = await callbacks.finalizeCallback({
      bitgoMsg2,
      bitgoCommonKeychain,
      userState: userStateAfter2,
      backupState: backupStateAfter2,
    });
    assert.strictEqual(commonKeychain, bitgoCommonKeychain, 'Common keychains do not match');

    const keychains = this.baseCoin.keychains();
    const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
      keychains.add({ source: 'user', keyType: 'tss' as KeyType, commonKeychain, isMPCv2: true }),
      keychains.add({ source: 'backup', keyType: 'tss' as KeyType, commonKeychain, isMPCv2: true }),
      this.addBitgoKeychain(commonKeychain),
    ]);

    return { userKeychain, backupKeychain, bitgoKeychain };
  }

  // #region keychain utils
  async createParticipantKeychain(
    participantIndex: MPCv2PartyFromStringOrNumber,
    commonKeychain: string,
    privateMaterial?: Buffer,
    reducedPrivateMaterial?: Buffer,
    passphrase?: string,
    originalPasscodeEncryptionCode?: string,
    webauthnInfo?: WebauthnKeyEncryptionInfo,
    encryptionVersion?: EncryptionVersion,
    enterprise?: string
  ): Promise<Keychain> {
    let source: string;
    let encryptedPrv: string | undefined = undefined;
    let reducedEncryptedPrv: string | undefined = undefined;
    let privateMaterialBase64: string | undefined = undefined;

    switch (participantIndex) {
      case MPCv2PartiesEnum.USER:
      case MPCv2PartiesEnum.BACKUP:
        source = participantIndex === MPCv2PartiesEnum.USER ? 'user' : 'backup';
        assert(privateMaterial, `Private material is required for ${source} keychain`);
        assert(reducedPrivateMaterial, `Reduced private material is required for ${source} keychain`);
        assert(passphrase, `Passphrase is required for ${source} keychain`);
        privateMaterialBase64 = privateMaterial.toString('base64');
        encryptedPrv = await this.bitgo.encrypt({
          input: privateMaterialBase64,
          password: passphrase,
          encryptionVersion,
        });
        // Encrypts the CBOR-encoded ReducedKeyShare (which contains the party's public
        // key) with the wallet passphrase. The result is stored as reducedEncryptedPrv
        // on the key card QR code and represents a second copy of key material
        // beyond the server-stored encryptedPrv.
        reducedEncryptedPrv = await this.bitgo.encrypt({
          // Buffer.toString('base64') can not be used here as it does not work on the browser.
          // The browser deals with a Buffer as Uint8Array, therefore in the browser .toString('base64') just creates a comma separated string of the array values.
          input: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(reducedPrivateMaterial)))),
          password: passphrase,
          encryptionVersion,
        });
        break;
      case MPCv2PartiesEnum.BITGO:
        source = 'bitgo';
        break;
      default:
        throw new Error('Invalid participant index');
    }

    const keychainParams: AddKeychainOptions = {
      source,
      keyType: 'tss' as KeyType,
      commonKeychain,
      encryptedPrv,
      originalPasscodeEncryptionCode,
      isMPCv2: true,
    };

    if (webauthnInfo && participantIndex === MPCv2PartiesEnum.USER && privateMaterialBase64) {
      // Send the passkey as `webauthnInfo`; the deprecated `webauthnDevices` array is ignored by POST /key.
      assert(enterprise, 'enterprise is required to attach a webauthn device to the user keychain');
      keychainParams.webauthnInfo = {
        otpDeviceId: webauthnInfo.otpDeviceId,
        prfSalt: webauthnInfo.prfSalt,
        encryptedPrv: await this.bitgo.encrypt({
          input: privateMaterialBase64,
          password: webauthnInfo.passphrase,
          encryptionVersion,
        }),
        enterpriseId: enterprise,
      };
    }

    const keychains = this.baseCoin.keychains();
    return { ...(await keychains.add(keychainParams)), reducedEncryptedPrv };
  }

  private async addUserKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string,
    webauthnInfo?: WebauthnKeyEncryptionInfo,
    encryptionVersion?: EncryptionVersion,
    enterprise?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.USER,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode,
      webauthnInfo,
      encryptionVersion,
      enterprise
    );
  }

  private async addBackupKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string,
    encryptionVersion?: EncryptionVersion
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.BACKUP,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode,
      undefined,
      encryptionVersion
    );
  }

  private async addBitgoKeychain(commonKeychain: string): Promise<Keychain> {
    return this.createParticipantKeychain(MPCv2PartiesEnum.BITGO, commonKeychain);
  }
  // #endregion

  async sendKeyGenerationRound1(
    enterprise: string,
    payload: EddsaMPCv2KeyGenRound1Request
  ): Promise<EddsaMPCv2KeyGenRound1Response> {
    return this.sendKeyGenerationRound1BySender(KeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  async sendKeyGenerationRound1BySender(
    senderFn: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound1Response>,
    payload: EddsaMPCv2KeyGenRound1Request
  ): Promise<EddsaMPCv2KeyGenRound1Response> {
    return senderFn(MPCv2KeyGenStateEnum['MPCv2-R1'], payload);
  }

  async sendKeyGenerationRound2(
    enterprise: string,
    payload: EddsaMPCv2KeyGenRound2Request
  ): Promise<EddsaMPCv2KeyGenRound2Response> {
    return this.sendKeyGenerationRound2BySender(KeyGenSenderForEnterprise(this.bitgo, enterprise), payload);
  }

  async sendKeyGenerationRound2BySender(
    senderFn: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound2Response>,
    payload: EddsaMPCv2KeyGenRound2Request
  ): Promise<EddsaMPCv2KeyGenRound2Response> {
    return senderFn(MPCv2KeyGenStateEnum['MPCv2-R2'], payload);
  }

  // #endregion

  // #region sign tx request

  /**
   * Signs the transaction associated with the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest
   */
  async signTxRequest(params: TSSParamsWithPrv): Promise<TxRequest> {
    this.bitgo.setRequestTracer(params.reqId);
    return this.signRequestBase(params, RequestType.tx);
  }

  /**
   * Signs the message associated with the transaction request.
   * @param {string | TxRequest} params.txRequest - transaction request object or id
   * @param {string} params.prv - decrypted private key
   * @param {string} params.reqId - request id
   * @returns {Promise<TxRequest>} fully signed TxRequest
   */
  async signTxRequestForMessage(params: TSSParamsForMessageWithPrv): Promise<TxRequest> {
    this.bitgo.setRequestTracer(params.reqId);
    return this.signRequestBase(params, RequestType.message);
  }

  /**
   * Full 3-round EdDSA MPCv2 (MPS) online signing orchestration.
   *
   * Protocol overview:
   *   WASM Round 0  → getFirstMessage()      (produces userMsg1)
   *   API  Round 1  → send userMsg1 / recv bitgoMsg1
   *   WASM Round 1  → handleIncomingMessages([userMsg1, bitgoMsg1])  (produces userMsg2)
   *   API  Round 2  → send userMsg2 / recv bitgoMsg2
   *   WASM Round 2  → handleIncomingMessages([userMsg2, bitgoMsg2])  (produces userMsg3)
   *   API  Round 3  → send userMsg3 (WP finalises; no BitGo msg returned to client)
   */
  private async signRequestBase(
    params: TSSParamsWithPrv | TSSParamsForMessageWithPrv,
    requestType: RequestType
  ): Promise<TxRequest> {
    const userKeyShare = Buffer.from(params.prv, 'base64');

    const txRequest: TxRequest =
      typeof params.txRequest === 'string'
        ? await getTxRequest(this.bitgo, this.wallet.id(), params.txRequest, params.reqId)
        : params.txRequest;

    let txOrMessageToSign;
    let derivationPath;
    let bufferContent;
    // One fresh ed25519 GPG key pair per signing session, reused across all signing rounds.
    const userGpgKey = await generateGPGKeyPair('ed25519');
    const userGpgPrvKey = await pgp.readPrivateKey({ armoredKey: userGpgKey.privateKey });
    const bitgoGpgPubKey = await this.pickBitgoPubGpgKeyForSigning(true, params.reqId, txRequest.enterpriseId, true);
    assert(bitgoGpgPubKey, 'Missing BitGo GPG key for MPCv2');

    if (requestType === RequestType.tx) {
      assert(txRequest.transactions || txRequest.unsignedTxs, 'Unable to find transactions in txRequest');
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs![0];
      txOrMessageToSign = unsignedTx.signableHex;
      assert(txOrMessageToSign, 'Missing signableHex in unsignedTx');
      derivationPath = unsignedTx.derivationPath;
      bufferContent = Buffer.from(txOrMessageToSign, 'hex');
      await this.baseCoin.verifyTransaction({
        txPrebuild: { txHex: unsignedTx.serializedTxHex ?? txOrMessageToSign },
        txParams: params.txParams || { recipients: [] },
        wallet: this.wallet,
        walletType: this.wallet.multisigType(),
      });
    } else if (requestType === RequestType.message) {
      assert(txRequest.messages && txRequest.messages.length > 0, 'Unable to find messages in txRequest');
      txOrMessageToSign = txRequest.messages[0].messageEncoded;
      assert(txOrMessageToSign, 'Missing messageEncoded in messages[0]');
      derivationPath = txRequest.messages[0].derivationPath || 'm/0';
      bufferContent = Buffer.from(txOrMessageToSign, 'hex');
    } else {
      throw new Error('Invalid request type');
    }

    // ── WASM Round 0 ──────────────────────────────────────────────────────────
    const partyId = params.mpcv2PartyId ?? MPCv2PartiesEnum.USER;
    const signerShareType = partyId === MPCv2PartiesEnum.USER ? SignatureShareType.USER : SignatureShareType.BACKUP;
    const userDsg = new EddsaMPSDsg.DSG(partyId);
    await userDsg.initDsg(userKeyShare, bufferContent, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    // ── API Round 1 ───────────────────────────────────────────────────────────
    const signatureShareRound1 = await getSignatureShareRoundOne(userMsg1, userGpgPrvKey, partyId);
    let latestTxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRound1],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      params.reqId
    );

    assert(latestTxRequest.transactions || latestTxRequest.messages, 'Invalid txRequest object after round 1');

    const signatureShares1 =
      requestType === RequestType.tx
        ? latestTxRequest.transactions![0].signatureShares
        : latestTxRequest.messages![0].signatureShares;

    const bitgoShareRoundOne = getBitgoSignatureShare(signatureShares1, signerShareType, 'round1Output');
    const parsedBitGoToUserSigShareRoundOne = decodeWithCodec(
      EddsaMPCv2SignatureShareRound1Output,
      JSON.parse(bitgoShareRoundOne.share),
      'Unexpected signature share response. Unable to parse data.'
    );

    if (parsedBitGoToUserSigShareRoundOne.type !== 'round1Output') {
      throw new Error('Unexpected signature share response. Unable to parse data.');
    }

    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(parsedBitGoToUserSigShareRoundOne, bitgoGpgPubKey);

    // ── WASM Round 1 ──────────────────────────────────────────────────────────
    const [userMsg2] = userDsg.handleIncomingMessages([userMsg1, bitgoDeserializedMsg1]);
    assert(userMsg2, 'WASM round 1 produced no message');

    // ── API Round 2 ───────────────────────────────────────────────────────────
    const signatureShareRoundTwo = await getSignatureShareRoundTwo(userMsg2, userGpgPrvKey, partyId);
    latestTxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRoundTwo],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      params.reqId
    );

    assert(latestTxRequest.transactions || latestTxRequest.messages, 'Invalid txRequest object after round 2');

    const txRequestSignatureShares =
      requestType === RequestType.tx
        ? latestTxRequest.transactions![0].signatureShares
        : latestTxRequest.messages![0].signatureShares;

    const bitgoShareRoundTwo = getBitgoSignatureShare(txRequestSignatureShares, signerShareType, 'round2Output');
    const parsedBitGoToUserSigShareRoundTwo = decodeWithCodec(
      EddsaMPCv2SignatureShareRound2Output,
      JSON.parse(bitgoShareRoundTwo.share),
      'Unexpected signature share response. Unable to parse data.'
    );

    if (parsedBitGoToUserSigShareRoundTwo.type !== 'round2Output') {
      throw new Error('Unexpected signature share response. Unable to parse data.');
    }

    const bitgoDeserializedMsg2 = await verifyPeerMessageRoundTwo(parsedBitGoToUserSigShareRoundTwo, bitgoGpgPubKey);

    // ── WASM Round 2 ──────────────────────────────────────────────────────────
    const [userMsg3] = userDsg.handleIncomingMessages([userMsg2, bitgoDeserializedMsg2]);
    assert(userMsg3, 'WASM round 2 produced no message');

    // ── API Round 3 ───────────────────────────────────────────────────────────
    // No BitGo response to verify; WP finalises the signing server-side
    const signatureShareRound3 = await getSignatureShareRoundThree(userMsg3, userGpgPrvKey, partyId);
    const round3TxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRound3],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      params.reqId
    );
    assert(round3TxRequest?.txRequestId === txRequest.txRequestId, 'Invalid txRequest object after round 3');

    return sendTxRequest(this.bitgo, txRequest.walletId, txRequest.txRequestId, requestType, params.reqId);
  }

  // #endregion

  // #region external signer

  // #region KeyGenRound1Share
  async createOfflineKeyGenRound1Share(params: {
    walletPassphrase: string;
    encryptedUserGpgPrvKey: string;
    bitgoGpgPubKey: string;
    counterPartyGpgPubKey: string;
    partyId?: MPCv2PartiesEnum.USER | MPCv2PartiesEnum.BACKUP;
  }): Promise<{
    signedMsg1: MPSTypes.MPSSignedMessage;
    encryptedRound1Session: string;
  }> {
    const { walletPassphrase, encryptedUserGpgPrvKey, bitgoGpgPubKey, counterPartyGpgPubKey } = params;
    const partyId = params.partyId ?? MPCv2PartiesEnum.USER;

    const decryptedGpgPrvKey = await this.bitgo.decrypt({ input: encryptedUserGpgPrvKey, password: walletPassphrase });
    const gpgPrvKey = await pgp.readPrivateKey({ armoredKey: decryptedGpgPrvKey });

    const [, ownSk] = await MPSComms.extractEd25519KeyPair(gpgPrvKey);

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      assert(isBitgoEddsaMpcv2PubKey(bitgoGpgPubKey), 'Invalid BitGo GPG public key');
    }

    const bitgoKeyObj = await pgp.readKey({ armoredKey: bitgoGpgPubKey });
    const bitgoPk = await MPSComms.extractEd25519PublicKey(bitgoKeyObj);

    const counterPartyKeyObj = await pgp.readKey({ armoredKey: counterPartyGpgPubKey });
    const counterPartyPk = await MPSComms.extractEd25519PublicKey(counterPartyKeyObj);

    const dkg = new EddsaMPSDkg.DKG(3, 2, partyId);
    await dkg.initDkg(ownSk, [counterPartyPk, bitgoPk]);

    const msg1 = dkg.getFirstMessage();
    const signedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(msg1.payload), gpgPrvKey);

    const sessionPayload = JSON.stringify({
      dkgSession: dkg.getSession(),
      ownMsgPayload: Buffer.from(msg1.payload).toString('base64'),
      ownMsgFrom: msg1.from,
    });

    const encryptedRound1Session = await this.bitgo.encrypt({
      input: sessionPayload,
      password: walletPassphrase,
      adata: `${EddsaMPCv2Utils.MPS_DKG_KEYGEN_ROUND1_STATE}:${partyId}`,
      encryptionVersion: 1,
    });

    return { signedMsg1, encryptedRound1Session };
  }
  // #endregion

  // #region Round1Share
  async createOfflineRound1Share(params: {
    txRequest: TxRequest;
    prv: string;
    walletPassphrase: string;
    encryptedPrv?: string;
  }): Promise<{
    signatureShareRound1: SignatureShareRecord;
    userGpgPubKey: string;
    encryptedRound1Session: string;
    encryptedUserGpgPrvKey: string;
  }> {
    const { prv, walletPassphrase, txRequest, encryptedPrv } = params;
    const { signableHex, derivationPath } = this.getSignableHexAndDerivationPath(
      txRequest,
      'Unable to find transactions in txRequest'
    );
    const adata = `${signableHex}:${derivationPath}`;

    const userKeyShare = Buffer.from(prv, 'base64');
    const userGpgKey = await generateGPGKeyPair('ed25519');
    const userGpgPrvKey = await pgp.readPrivateKey({ armoredKey: userGpgKey.privateKey });

    const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, Buffer.from(signableHex, 'hex'), derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();
    const signatureShareRound1 = await getSignatureShareRoundOne(userMsg1, userGpgPrvKey);
    const sessionPayload = JSON.stringify({
      dsgSession: userDsg.getSession(),
      userMsgPayload: Buffer.from(userMsg1.payload).toString('base64'),
    });
    const userGpgPubKey = userGpgKey.publicKey;

    const useV2 = encryptedPrv !== undefined && isV2Envelope(encryptedPrv);
    if (useV2) {
      const session = await this.bitgo.createEncryptionSession(walletPassphrase);
      try {
        const encryptedRound1Session = await session.encrypt(
          sessionPayload,
          `${EddsaMPCv2Utils.MPS_DSG_SIGNING_ROUND1_STATE}:${adata}`
        );
        const encryptedUserGpgPrvKey = await session.encrypt(
          userGpgKey.privateKey,
          `${EddsaMPCv2Utils.MPS_DSG_SIGNING_USER_GPG_KEY}:${adata}`
        );
        return { signatureShareRound1, userGpgPubKey, encryptedRound1Session, encryptedUserGpgPrvKey };
      } finally {
        session.destroy();
      }
    }

    const encryptedRound1Session = await this.bitgo.encrypt({
      input: sessionPayload,
      password: walletPassphrase,
      adata: `${EddsaMPCv2Utils.MPS_DSG_SIGNING_ROUND1_STATE}:${adata}`,
      encryptionVersion: 1,
    });
    const encryptedUserGpgPrvKey = await this.bitgo.encrypt({
      input: userGpgKey.privateKey,
      password: walletPassphrase,
      adata: `${EddsaMPCv2Utils.MPS_DSG_SIGNING_USER_GPG_KEY}:${adata}`,
      encryptionVersion: 1,
    });

    return { signatureShareRound1, userGpgPubKey, encryptedRound1Session, encryptedUserGpgPrvKey };
  }
  // #endregion

  // #region Round2Share
  async createOfflineRound2Share(params: {
    txRequest: TxRequest;
    walletPassphrase: string;
    bitgoPublicGpgKey: string;
    encryptedUserGpgPrvKey: string;
    encryptedRound1Session: string;
  }): Promise<{
    signatureShareRound2: SignatureShareRecord;
    encryptedRound2Session: string;
  }> {
    const { walletPassphrase, encryptedUserGpgPrvKey, encryptedRound1Session, bitgoPublicGpgKey, txRequest } = params;

    const { signableHex, derivationPath } = this.getSignableHexAndDerivationPath(
      txRequest,
      'Unable to find transactions in txRequest'
    );
    const adata = `${signableHex}:${derivationPath}`;

    const useV2 = isV2Envelope(encryptedRound1Session);

    const { bitgoGpgKey, userGpgPrvKey } = await this.getBitgoAndUserGpgKeys(
      bitgoPublicGpgKey,
      encryptedUserGpgPrvKey,
      walletPassphrase,
      adata,
      EddsaMPCv2Utils.MPS_DSG_SIGNING_USER_GPG_KEY
    );

    const transactions = txRequest.transactions;
    assert(Array.isArray(transactions) && transactions.length === 1, 'txRequest must have exactly one transaction');
    const signatureShares = transactions[0].signatureShares;
    assert(signatureShares, 'Missing signature shares in round 1 txRequest');

    const bitgoShareRoundOne = getBitgoSignatureShare(signatureShares, SignatureShareType.USER, 'round1Output');
    const parsedBitGoToUserSigShareRoundOne = decodeWithCodec(
      EddsaMPCv2SignatureShareRound1Output,
      JSON.parse(bitgoShareRoundOne.share),
      'Unexpected signature share response. Unable to parse data.'
    );

    if (parsedBitGoToUserSigShareRoundOne.type !== 'round1Output') {
      throw new Error('Unexpected signature share response. Unable to parse data.');
    }

    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(parsedBitGoToUserSigShareRoundOne, bitgoGpgKey);

    this.validateAdata(adata, encryptedRound1Session, EddsaMPCv2Utils.MPS_DSG_SIGNING_ROUND1_STATE);

    const decryptedRound1Session = await this.bitgo.decrypt({
      input: encryptedRound1Session,
      password: walletPassphrase,
    });

    const { dsgSession, userMsgPayload } = JSON.parse(decryptedRound1Session) as {
      dsgSession: string;
      userMsgPayload: string;
    };

    const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
    await userDsg.restoreSession(dsgSession);
    const userMsg1: MPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.USER,
      payload: new Uint8Array(Buffer.from(userMsgPayload, 'base64')),
    };

    const [userMsg2] = userDsg.handleIncomingMessages([userMsg1, bitgoDeserializedMsg1]);
    assert(userMsg2, 'DSG handleIncomingMessages produced no round-2 output');

    const signatureShareRound2 = await getSignatureShareRoundTwo(userMsg2, userGpgPrvKey);
    const sessionPayload = JSON.stringify({
      dsgSession: userDsg.getSession(),
      userMsgPayload: Buffer.from(userMsg2.payload).toString('base64'),
    });

    if (useV2) {
      const session = await this.bitgo.createEncryptionSession(walletPassphrase);
      try {
        const encryptedRound2Session = await session.encrypt(
          sessionPayload,
          `${EddsaMPCv2Utils.MPS_DSG_SIGNING_ROUND2_STATE}:${adata}`
        );
        return { signatureShareRound2, encryptedRound2Session };
      } finally {
        session.destroy();
      }
    }

    const encryptedRound2Session = await this.bitgo.encrypt({
      input: sessionPayload,
      password: walletPassphrase,
      adata: `${EddsaMPCv2Utils.MPS_DSG_SIGNING_ROUND2_STATE}:${adata}`,
      encryptionVersion: 1,
    });

    return { signatureShareRound2, encryptedRound2Session };
  }
  // #endregion

  // #region Round3Share
  async createOfflineRound3Share(params: {
    txRequest: TxRequest;
    walletPassphrase: string;
    bitgoPublicGpgKey: string;
    encryptedUserGpgPrvKey: string;
    encryptedRound2Session: string;
  }): Promise<{
    signatureShareRound3: SignatureShareRecord;
  }> {
    const { walletPassphrase, encryptedUserGpgPrvKey, encryptedRound2Session, bitgoPublicGpgKey, txRequest } = params;

    const { signableHex, derivationPath } = this.getSignableHexAndDerivationPath(
      txRequest,
      'Unable to find transactions in txRequest'
    );
    const adata = `${signableHex}:${derivationPath}`;

    const { bitgoGpgKey, userGpgPrvKey } = await this.getBitgoAndUserGpgKeys(
      bitgoPublicGpgKey,
      encryptedUserGpgPrvKey,
      walletPassphrase,
      adata,
      EddsaMPCv2Utils.MPS_DSG_SIGNING_USER_GPG_KEY
    );

    const transactions = txRequest.transactions;
    assert(Array.isArray(transactions) && transactions.length === 1, 'txRequest must have exactly one transaction');
    const signatureShares = transactions[0].signatureShares;
    assert(signatureShares, 'Missing signature shares in round 2 txRequest');

    const bitgoShareRoundTwo = getBitgoSignatureShare(signatureShares, SignatureShareType.USER, 'round2Output');

    const parsedBitGoToUserSigShareRoundTwo = decodeWithCodec(
      EddsaMPCv2SignatureShareRound2Output,
      JSON.parse(bitgoShareRoundTwo.share),
      'Unexpected signature share response. Unable to parse data.'
    );

    if (parsedBitGoToUserSigShareRoundTwo.type !== 'round2Output') {
      throw new Error('Unexpected signature share response. Unable to parse data.');
    }

    const bitgoDeserializedMsg2 = await verifyPeerMessageRoundTwo(parsedBitGoToUserSigShareRoundTwo, bitgoGpgKey);

    this.validateAdata(adata, encryptedRound2Session, EddsaMPCv2Utils.MPS_DSG_SIGNING_ROUND2_STATE);

    const decryptedRound2Session = await this.bitgo.decrypt({
      input: encryptedRound2Session,
      password: walletPassphrase,
    });

    const { dsgSession, userMsgPayload } = JSON.parse(decryptedRound2Session) as {
      dsgSession: string;
      userMsgPayload: string;
    };

    const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
    await userDsg.restoreSession(dsgSession);
    const userMsg2: MPSTypes.DeserializedMessage = {
      from: MPCv2PartiesEnum.USER,
      payload: new Uint8Array(Buffer.from(userMsgPayload, 'base64')),
    };

    const [userMsg3] = userDsg.handleIncomingMessages([userMsg2, bitgoDeserializedMsg2]);
    assert(userMsg3, 'DSG handleIncomingMessages produced no round-3 output');

    const signatureShareRound3 = await getSignatureShareRoundThree(userMsg3, userGpgPrvKey);

    return { signatureShareRound3 };
  }
  // #endregion

  /** @inheritdoc */
  async signEddsaMPCv2TssUsingExternalSigner(
    params: TSSParams | TSSParamsForMessage,
    externalSignerEddsaMPCv2SigningRound1Generator: CustomEddsaMPCv2SigningRound1GeneratingFunction,
    externalSignerEddsaMPCv2SigningRound2Generator: CustomEddsaMPCv2SigningRound2GeneratingFunction,
    externalSignerEddsaMPCv2SigningRound3Generator: CustomEddsaMPCv2SigningRound3GeneratingFunction,
    requestType: RequestType = RequestType.tx
  ): Promise<TxRequest> {
    const { txRequest, reqId } = params;

    // TODO(WP-2176): Add support for message signing
    assert(
      requestType === RequestType.tx,
      'Only transaction signing is supported for external signer, got: ' + requestType
    );

    let txRequestResolved: TxRequest;
    if (typeof txRequest === 'string') {
      txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest, reqId);
    } else {
      txRequestResolved = txRequest;
    }

    const bitgoPublicGpgKey = await this.pickBitgoPubGpgKeyForSigning(
      true,
      reqId,
      txRequestResolved.enterpriseId,
      true
    );

    if (!bitgoPublicGpgKey) {
      throw new Error('Missing BitGo GPG key for MPCv2');
    }

    // round 1
    const { signatureShareRound1, userGpgPubKey, encryptedRound1Session, encryptedUserGpgPrvKey } =
      await externalSignerEddsaMPCv2SigningRound1Generator({ txRequest: txRequestResolved });
    const round1TxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequestResolved.walletId,
      txRequestResolved.txRequestId,
      [signatureShareRound1],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgPubKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      reqId
    );

    // round 2
    const { signatureShareRound2, encryptedRound2Session } = await externalSignerEddsaMPCv2SigningRound2Generator({
      txRequest: round1TxRequest,
      encryptedRound1Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoPublicGpgKey.armor(),
    });
    const round2TxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequestResolved.walletId,
      txRequestResolved.txRequestId,
      [signatureShareRound2],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgPubKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      reqId
    );
    assert(
      round2TxRequest.transactions && round2TxRequest.transactions[0].signatureShares,
      'Missing signature shares in round 2 txRequest'
    );

    // round 3
    const { signatureShareRound3 } = await externalSignerEddsaMPCv2SigningRound3Generator({
      txRequest: round2TxRequest,
      encryptedRound2Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoPublicGpgKey.armor(),
    });
    await sendSignatureShareV2(
      this.bitgo,
      txRequestResolved.walletId,
      txRequestResolved.txRequestId,
      [signatureShareRound3],
      requestType,
      this.baseCoin.getMPCAlgorithm(),
      userGpgPubKey,
      undefined,
      this.wallet.multisigTypeVersion(),
      reqId
    );

    return sendTxRequest(this.bitgo, txRequestResolved.walletId, txRequestResolved.txRequestId, requestType, reqId);
  }
  // #endregion
}

/**
 * Detect whether an encrypted keycard contains MPCv1 signing material.
 *
 * Decrypts the keycard and checks for the JSON shape produced by the MPCv1 TSS
 * key-generation flow (uShare.seed + bitgoYShare.u + backupYShare.u / userYShare.u).
 * Returns false for MPCv2 CBOR keycards, wrong passwords, or any decryption error.
 *
 * @param encryptedKeyShare encrypted user or backup keycard
 * @param walletPassphrase passphrase used to encrypt the keycard
 * @param bitgo optional BitGoBase instance; when provided, decrypts via
 *   bitgo.decrypt (supports both v1 SJCL and v2 Argon2id envelopes);
 *   when absent, falls back to sjcl.decrypt (v1 only)
 */
export async function isEddsaMpcV1SigningMaterial(
  encryptedKeyShare: string,
  walletPassphrase: string,
  bitgo?: BitGoBase
): Promise<boolean> {
  const prv = bitgo
    ? await bitgo.decrypt({ input: encryptedKeyShare, password: walletPassphrase })
    : sjcl.decrypt(walletPassphrase, encryptedKeyShare);

  try {
    const m = JSON.parse(prv);
    return (
      typeof m?.uShare?.seed === 'string' &&
      typeof m?.bitgoYShare?.u === 'string' &&
      (typeof m?.backupYShare?.u === 'string' || typeof m?.userYShare?.u === 'string')
    );
  } catch {
    // JSON parse error indicates MPCv2 CBOR format, not JSON.
    return false;
  }
}

/**
 * Get EdDSA MPCv2 recovery key shares from encrypted reduced user and backup keys.
 *
 * The encrypted inputs are the `reducedEncryptedPrv` values stored on EdDSA MPCv2
 * key cards. They decrypt to CBOR-encoded reduced shares that contain the opaque
 * MPS signing key-share bytes plus the common public keychain material.
 *
 * @param encryptedUserKey encrypted EdDSA MPCv2 reduced user key
 * @param encryptedBackupKey encrypted EdDSA MPCv2 reduced backup key
 * @param walletPassphrase password for user and backup keys
 * @returns EdDSA MPCv2 recovery key shares and common keychain
 */
export async function getEddsaMpcV2RecoveryKeySharesFromReducedKey(
  encryptedUserKey: string,
  encryptedBackupKey: string,
  walletPassphrase?: string,
  bitgo?: BitGoBase
): Promise<EddsaMPCv2RecoveryKeyShares> {
  const decodeKey = async (encryptedKey: string): Promise<MPSTypes.EddsaReducedKeyShare> => {
    const decrypted = bitgo
      ? await bitgo.decrypt({ input: encryptedKey, password: walletPassphrase })
      : sjcl.decrypt(walletPassphrase, encryptedKey);
    let reduced: MPSTypes.EddsaReducedKeyShare;
    try {
      reduced = MPSTypes.getDecodedReducedKeyShare(Buffer.from(decrypted, 'base64'));
    } catch {
      throw new Error(
        'EdDSA MPCv2 recovery: unable to decode reduced key share from keycard material. The encrypted key may be corrupted, malformed, or not an EdDSA MPCv2 reduced key.'
      );
    }
    if (!reduced.keyShare?.length || !reduced.pub?.length || !reduced.rootChainCode?.length) {
      throw new Error(
        'EdDSA MPCv2 recovery: reduced key share is missing keyShare, pub, or rootChainCode. This keycard may be public-only and cannot be used for recovery.'
      );
    }
    return reduced;
  };

  const [userReduced, backupReduced] = await Promise.all([decodeKey(encryptedUserKey), decodeKey(encryptedBackupKey)]);

  const userPub = Buffer.from(userReduced.pub).toString('hex');
  const backupPub = Buffer.from(backupReduced.pub).toString('hex');
  if (userPub !== backupPub) {
    throw new Error('EdDSA MPCv2 recovery: user and backup pub keys do not match');
  }

  const userChainCode = Buffer.from(userReduced.rootChainCode).toString('hex');
  const backupChainCode = Buffer.from(backupReduced.rootChainCode).toString('hex');
  if (userChainCode !== backupChainCode) {
    throw new Error('EdDSA MPCv2 recovery: user and backup rootChainCodes do not match');
  }

  return {
    userKeyShare: Buffer.from(userReduced.keyShare),
    backupKeyShare: Buffer.from(backupReduced.keyShare),
    commonKeyChain: userPub + userChainCode,
  };
}

/**
 * Sign a message for recovery using EdDSA MPCv2 (MPS) with user and backup key shares.
 *
 * Runs the MPS DSG protocol locally to round 3, then verifies the resulting
 * Ed25519 signature against the public key derived from the common keychain.
 *
 * @param message raw bytes to sign
 * @param derivationPath BIP-32-style derivation path, e.g. `"m/0"`
 * @param userKeyShare opaque MPS signing key-share bytes for the user party
 * @param backupKeyShare opaque MPS signing key-share bytes for the backup party
 * @param commonKeyChain 128-hex-char string: 32-byte pub + 32-byte rootChainCode
 * @returns 64-byte Ed25519 signature Buffer
 */
export async function signRecoveryEddsaMPCv2(
  message: Buffer,
  derivationPath: string,
  userKeyShare: Buffer,
  backupKeyShare: Buffer,
  commonKeyChain: string
): Promise<Buffer> {
  const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
  const backupDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BACKUP);

  const signature = (await MPSUtil.executeTillRound(
    3,
    userDsg,
    backupDsg,
    userKeyShare,
    backupKeyShare,
    message,
    derivationPath
  )) as Buffer;

  // Use Eddsa.deriveUnhardened (BIP32-Ed25519), which matches what DSG uses
  // internally for path derivation since wasm-mps 1.9.0.
  const mpc = await getInitializedMpcInstance();
  const derivedKeychain = mpc.deriveUnhardened(commonKeyChain, derivationPath);
  const publicKeyBytes = Buffer.from(derivedKeychain.slice(0, 64), 'hex');

  const verified = ed25519.verify(new Uint8Array(signature), new Uint8Array(message), new Uint8Array(publicKeyBytes));
  if (!verified) {
    throw new Error('EdDSA MPCv2 recovery signature verification failed');
  }

  return signature;
}

export const EddsaMPCv2RecoveryFunctions = {
  isEddsaMpcV1SigningMaterial,
  getEddsaMpcV2RecoveryKeySharesFromReducedKey,
  signRecoveryEddsaMPCv2,
};
