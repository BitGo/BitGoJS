import assert from 'assert';
import { NonEmptyString } from 'io-ts-types';
import { Buffer } from 'buffer';
import { Hash } from 'crypto';
import createKeccakHash from 'keccak';
import { DklsDkg, DklsTypes, DklsComms, DklsDsg } from '@bitgo/sdk-lib-mpc';

import { AddKeychainOptions, Keychain, KeyType } from '../../../keychain';
import { KeychainsTriplet } from '../../../baseCoin';
import { generateGPGKeyPair } from '../../opengpgUtils';
import { BaseEcdsaUtils } from './base';
import {
  MPCv2KeyGenState,
  MPCv2BroadcastMessage,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Response,
  MPCv2P2PMessage,
  KeyGenTypeEnum,
  MPCv2KeyGenStateEnum,
  MPCv2SignatureShareRound1Output,
  MPCv2SignatureShareRound2Output,
  MPCv2PartyFromStringOrNumber,
} from '@bitgo/public-types';
import { GenerateMPCv2KeyRequestBody, GenerateMPCv2KeyRequestResponse, MPCv2PartiesEnum } from './typesMPCv2';
import { RequestType, TSSParams, TSSParamsForMessage, TxRequest } from '../baseTypes';
import { getTxRequest } from '../../../tss';
import {
  getSignatureShareRoundOne,
  getSignatureShareRoundThree,
  getSignatureShareRoundTwo,
  verifyBitGoMessagesAndSignaturesRoundOne,
  verifyBitGoMessagesAndSignaturesRoundTwo,
} from '../../../tss/ecdsa/ecdsaMPCv2';
import { sendSignatureShareV2, sendTxRequest } from '../../../tss/common';

export class EcdsaMPCv2Utils extends BaseEcdsaUtils {
  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet> {
    const m = 2;
    const n = 3;
    const userSession = new DklsDkg.Dkg(n, m, MPCv2PartiesEnum.USER);
    const backupSession = new DklsDkg.Dkg(n, m, MPCv2PartiesEnum.BACKUP);
    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const backupGpgKey = await generateGPGKeyPair('secp256k1');

    // Get the BitGo public key based on user/enterprise feature flags
    // If it doesn't work, use the default public key from the constants
    const bitgoPublicGpgKey = (
      (await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true)) ?? this.bitgoMPCv2PublicGpgKey
    ).armor();

    const userGpgPrvKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.USER,
      gpgKey: userGpgKey.privateKey,
    };
    const backupGpgPrvKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.BACKUP,
      gpgKey: backupGpgKey.privateKey,
    };
    const bitgoGpgPubKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.BITGO,
      gpgKey: bitgoPublicGpgKey,
    };

    // #region round 1
    const userRound1BroadcastMsg = await userSession.initDkg();
    const backupRound1BroadcastMsg = await backupSession.initDkg();

    const round1SerializedMessages = DklsTypes.serializeMessages({
      broadcastMessages: [userRound1BroadcastMsg, backupRound1BroadcastMsg],
      p2pMessages: [],
    });
    const round1Messages = await DklsComms.encryptAndAuthOutgoingMessages(
      round1SerializedMessages,
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );

    const { sessionId, bitgoMsg1, bitgoToBackupMsg2, bitgoToUserMsg2 } = await this.sendKeyGenerationRound1(
      params.enterprise,
      userGpgKey.publicKey,
      backupGpgKey.publicKey,
      round1Messages
    );
    // #endregion

    // #region round 2
    const bitgoRound1BroadcastMessages = await DklsComms.decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [this.formatBitgoBroadcastMessage(bitgoMsg1)] },
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );
    const bitgoRound1BroadcastMsg = bitgoRound1BroadcastMessages.broadcastMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO
    );
    assert(bitgoRound1BroadcastMsg, 'BitGo message 1 not found in broadcast messages');

    const userRound2P2PMessages = userSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [DklsTypes.deserializeBroadcastMessage(bitgoRound1BroadcastMsg), backupRound1BroadcastMsg],
    });

    const userToBitgoMsg2 = userRound2P2PMessages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
    );
    assert(userToBitgoMsg2, 'User message 2 not found in P2P messages');
    const serializedUserToBitgoMsg2 = DklsTypes.serializeP2PMessage(userToBitgoMsg2);

    const backupRound2P2PMessages = backupSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [userRound1BroadcastMsg, DklsTypes.deserializeBroadcastMessage(bitgoRound1BroadcastMsg)],
    });
    const serializedBackupToBitgoMsg2 = DklsTypes.serializeMessages(backupRound2P2PMessages).p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
    );
    assert(serializedBackupToBitgoMsg2, 'Backup message 2 not found in P2P messages');

    const round2Messages = await DklsComms.encryptAndAuthOutgoingMessages(
      { p2pMessages: [serializedUserToBitgoMsg2, serializedBackupToBitgoMsg2], broadcastMessages: [] },
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );

    const {
      sessionId: sessionIdRound2,
      bitgoCommitment2,
      bitgoToUserMsg3,
      bitgoToBackupMsg3,
    } = await this.sendKeyGenerationRound2(params.enterprise, sessionId, round2Messages);
    // #endregion

    // #region round 3
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and 2 Session IDs do not match');
    const decryptedBitgoToUserRound2Msgs = await DklsComms.decryptAndVerifyIncomingMessages(
      { p2pMessages: [this.formatP2PMessage(bitgoToUserMsg2)], broadcastMessages: [] },
      [bitgoGpgPubKey],
      [userGpgPrvKey]
    );
    const serializedBitgoToUserRound2Msg = decryptedBitgoToUserRound2Msgs.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.USER
    );
    assert(serializedBitgoToUserRound2Msg, 'BitGo to User message 2 not found in P2P messages');
    const bitgoToUserRound2Msg = DklsTypes.deserializeP2PMessage(serializedBitgoToUserRound2Msg);

    const decryptedBitgoToBackupRound2Msg = await DklsComms.decryptAndVerifyIncomingMessages(
      { p2pMessages: [this.formatP2PMessage(bitgoToBackupMsg2)], broadcastMessages: [] },
      [bitgoGpgPubKey],
      [backupGpgPrvKey]
    );
    const serializedBitgoToBackupRound2Msg = decryptedBitgoToBackupRound2Msg.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.BACKUP
    );
    assert(serializedBitgoToBackupRound2Msg, 'BitGo to Backup message 2 not found in P2P messages');
    const bitgoToBackupRound2Msg = DklsTypes.deserializeP2PMessage(serializedBitgoToBackupRound2Msg);

    const userToBackupMsg2 = userRound2P2PMessages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BACKUP
    );
    assert(userToBackupMsg2, 'User to Backup message 2 not found in P2P messages');

    const backupToUserMsg2 = backupRound2P2PMessages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.USER
    );
    assert(backupToUserMsg2, 'Backup to User message 2 not found in P2P messages');

    const userRound3Messages = userSession.handleIncomingMessages({
      broadcastMessages: [],
      p2pMessages: [bitgoToUserRound2Msg, backupToUserMsg2],
    });
    const userToBackupMsg3 = userRound3Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BACKUP
    );
    assert(userToBackupMsg3, 'User to Backup message 3 not found in P2P messages');
    const userToBitgoMsg3 = userRound3Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
    );
    assert(userToBitgoMsg3, 'User to Bitgo message 3 not found in P2P messages');
    const serializedUserToBitgoMsg3 = DklsTypes.serializeP2PMessage(userToBitgoMsg3);

    const backupRound3Messages = backupSession.handleIncomingMessages({
      broadcastMessages: [],
      p2pMessages: [bitgoToBackupRound2Msg, userToBackupMsg2],
    });

    const backupToUserMsg3 = backupRound3Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.USER
    );
    assert(backupToUserMsg3, 'Backup to User message 3 not found in P2P messages');
    const backupToBitgoMsg3 = backupRound3Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
    );
    assert(backupToBitgoMsg3, 'Backup to Bitgo message 3 not found in P2P messages');
    const serializedBackupToBitgoMsg3 = DklsTypes.serializeP2PMessage(backupToBitgoMsg3);

    const decryptedBitgoToUserRound3Messages = await DklsComms.decryptAndVerifyIncomingMessages(
      { broadcastMessages: [], p2pMessages: [this.formatP2PMessage(bitgoToUserMsg3, bitgoCommitment2)] },
      [bitgoGpgPubKey],
      [userGpgPrvKey]
    );
    const serializedBitgoToUserRound3Msg = decryptedBitgoToUserRound3Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.USER
    );
    assert(serializedBitgoToUserRound3Msg, 'BitGo to User message 3 not found in P2P messages');
    const bitgoToUserRound3Msg = DklsTypes.deserializeP2PMessage(serializedBitgoToUserRound3Msg);

    const decryptedBitgoToBackupRound3Messages = await DklsComms.decryptAndVerifyIncomingMessages(
      { broadcastMessages: [], p2pMessages: [this.formatP2PMessage(bitgoToBackupMsg3, bitgoCommitment2)] },
      [bitgoGpgPubKey],
      [backupGpgPrvKey]
    );
    const serializedBitgoToBackupRound3Msg = decryptedBitgoToBackupRound3Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.BACKUP
    );
    assert(serializedBitgoToBackupRound3Msg, 'BitGo to Backup message 3 not found in P2P messages');
    const bitgoToBackupRound3Msg = DklsTypes.deserializeP2PMessage(serializedBitgoToBackupRound3Msg);

    const userRound4Messages = userSession.handleIncomingMessages({
      p2pMessages: [backupToUserMsg3, bitgoToUserRound3Msg],
      broadcastMessages: [],
    });

    const userRound4BroadcastMsg = userRound4Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER);
    assert(userRound4BroadcastMsg, 'User message 4 not found in broadcast messages');
    const serializedUserRound4BroadcastMsg = DklsTypes.serializeBroadcastMessage(userRound4BroadcastMsg);

    const backupRound4Messages = backupSession.handleIncomingMessages({
      p2pMessages: [userToBackupMsg3, bitgoToBackupRound3Msg],
      broadcastMessages: [],
    });
    const backupRound4BroadcastMsg = backupRound4Messages.broadcastMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP
    );
    assert(backupRound4BroadcastMsg, 'Backup message 4 not found in broadcast messages');
    const serializedBackupRound4BroadcastMsg = DklsTypes.serializeBroadcastMessage(backupRound4BroadcastMsg);

    const round3Messages = await DklsComms.encryptAndAuthOutgoingMessages(
      {
        p2pMessages: [serializedUserToBitgoMsg3, serializedBackupToBitgoMsg3],
        broadcastMessages: [serializedUserRound4BroadcastMsg, serializedBackupRound4BroadcastMsg],
      },
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );

    const {
      sessionId: sessionIdRound3,
      bitgoMsg4,
      commonKeychain: bitgoCommonKeychain,
    } = await this.sendKeyGenerationRound3(params.enterprise, sessionId, round3Messages);

    // #endregion

    // #region keychain creation
    assert.equal(sessionId, sessionIdRound3, 'Round 1 and 3 Session IDs do not match');
    const bitgoRound4BroadcastMessages = DklsTypes.deserializeMessages(
      await DklsComms.decryptAndVerifyIncomingMessages(
        { p2pMessages: [], broadcastMessages: [this.formatBitgoBroadcastMessage(bitgoMsg4)] },
        [bitgoGpgPubKey],
        []
      )
    ).broadcastMessages;
    const bitgoRound4BroadcastMsg = bitgoRound4BroadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BITGO);

    assert(bitgoRound4BroadcastMsg, 'BitGo message 4 not found in broadcast messages');
    userSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoRound4BroadcastMsg, backupRound4BroadcastMsg],
    });

    backupSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoRound4BroadcastMsg, userRound4BroadcastMsg],
    });

    const userPrivateMaterial = userSession.getKeyShare();
    const backupPrivateMaterial = backupSession.getKeyShare();
    const userReducedPrivateMaterial = userSession.getReducedKeyShare();
    const backupReducedPrivateMaterial = backupSession.getReducedKeyShare();

    const userCommonKeychain = DklsTypes.getCommonKeychain(userPrivateMaterial);
    const backupCommonKeychain = DklsTypes.getCommonKeychain(backupPrivateMaterial);

    assert.equal(bitgoCommonKeychain, userCommonKeychain, 'User and Bitgo Common keychains do not match');
    assert.equal(bitgoCommonKeychain, backupCommonKeychain, 'Backup and Bitgo Common keychains do not match');

    const userKeychainPromise = this.addUserKeychain(
      bitgoCommonKeychain,
      userPrivateMaterial,
      userReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const backupKeychainPromise = this.addBackupKeychain(
      bitgoCommonKeychain,
      userPrivateMaterial,
      backupReducedPrivateMaterial,
      params.passphrase,
      params.originalPasscodeEncryptionCode
    );
    const bitgoKeychainPromise = this.addBitgoKeychain(bitgoCommonKeychain);

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

  // #region keychain utils
  async createParticipantKeychain(
    participantIndex: MPCv2PartyFromStringOrNumber,
    commonKeychain: string,
    privateMaterial?: Buffer,
    reducedPrivateMaterial?: Buffer,
    passphrase?: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    let source: string;
    let encryptedPrv: string | undefined = undefined;
    let reducedEncryptedPrv: string | undefined = undefined;
    switch (participantIndex) {
      case MPCv2PartiesEnum.USER:
      case MPCv2PartiesEnum.BACKUP:
        source = participantIndex === MPCv2PartiesEnum.USER ? 'user' : 'backup';
        assert(privateMaterial, `Private material is required for ${source} keychain`);
        assert(reducedPrivateMaterial, `Reduced private material is required for ${source} keychain`);
        assert(passphrase, `Passphrase is required for ${source} keychain`);
        encryptedPrv = this.bitgo.encrypt({
          input: privateMaterial.toString('base64'),
          password: passphrase,
        });
        reducedEncryptedPrv = this.bitgo.encrypt({
          // Buffer.toString('base64') can not be used here as it does not work on the browser.
          // The browser deals with a Buffer as Uint8Array, therefore in the browser .toString('base64') just creates a comma seperated string of the array values.
          input: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(reducedPrivateMaterial)))),
          password: passphrase,
        });
        break;
      case MPCv2PartiesEnum.BITGO:
        source = 'bitgo';
        break;
      default:
        throw new Error('Invalid participant index');
    }

    const recipientKeychainParams: AddKeychainOptions = {
      source,
      keyType: 'tss' as KeyType,
      commonKeychain,
      encryptedPrv,
      originalPasscodeEncryptionCode,
      isMPCv2: true,
    };

    const keychains = this.baseCoin.keychains();
    return { ...(await keychains.add(recipientKeychainParams)), reducedEncryptedPrv: reducedEncryptedPrv };
  }

  private async addUserKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.USER,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  private async addBackupKeychain(
    commonKeychain: string,
    privateMaterial: Buffer,
    reducedPrivateMaterial: Buffer,
    passphrase: string,
    originalPasscodeEncryptionCode?: string
  ): Promise<Keychain> {
    return this.createParticipantKeychain(
      MPCv2PartiesEnum.BACKUP,
      commonKeychain,
      privateMaterial,
      reducedPrivateMaterial,
      passphrase,
      originalPasscodeEncryptionCode
    );
  }

  private async addBitgoKeychain(commonKeychain: string): Promise<Keychain> {
    return this.createParticipantKeychain(MPCv2PartiesEnum.BITGO, commonKeychain);
  }
  // #endregion

  // #region generate key request utils
  private async sendKeyGenerationRequest<T extends GenerateMPCv2KeyRequestResponse>(
    enterprise: string,
    round: MPCv2KeyGenState,
    payload: GenerateMPCv2KeyRequestBody
  ): Promise<T> {
    return this.bitgo
      .post(this.bitgo.url('/mpc/generatekey', 2))
      .send({ enterprise, type: KeyGenTypeEnum.MPCv2, round, payload })
      .result();
  }

  private async sendKeyGenerationRound1(
    enterprise: string,
    userGpgPublicKey: string,
    backupGpgPublicKey: string,
    payload: DklsTypes.AuthEncMessages
  ): Promise<MPCv2KeyGenRound1Response> {
    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(backupGpgPublicKey), 'Backup GPG public key is required');
    const userMsg1 = payload.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER)?.payload;
    assert(userMsg1, 'User message 1 not found in broadcast messages');
    const backupMsg1 = payload.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BACKUP)?.payload;
    assert(backupMsg1, 'Backup message 1 not found in broadcast messages');

    return this.sendKeyGenerationRequest<MPCv2KeyGenRound1Response>(enterprise, MPCv2KeyGenStateEnum['MPCv2-R1'], {
      userGpgPublicKey,
      backupGpgPublicKey,
      userMsg1: { from: 0, ...userMsg1 },
      backupMsg1: { from: 1, ...backupMsg1 },
    });
  }

  private async sendKeyGenerationRound2(
    enterprise: string,
    sessionId: string,
    payload: DklsTypes.AuthEncMessages
  ): Promise<MPCv2KeyGenRound2Response> {
    assert(NonEmptyString.is(sessionId), 'Session ID is required');
    const userMsg2 = payload.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
    );
    assert(userMsg2, 'User to Bitgo message 2 not found in P2P messages');
    assert(userMsg2.commitment, 'User to Bitgo commitment not found in P2P messages');
    assert(NonEmptyString.is(userMsg2.commitment), 'User to Bitgo commitment is required');
    const backupMsg2 = payload.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
    );
    assert(backupMsg2, 'Backup to Bitgo message 2 not found in P2P messages');
    assert(backupMsg2.commitment, 'Backup to Bitgo commitment not found in P2P messages');
    assert(NonEmptyString.is(backupMsg2.commitment), 'Backup to Bitgo commitment is required');

    return this.sendKeyGenerationRequest<MPCv2KeyGenRound2Response>(enterprise, MPCv2KeyGenStateEnum['MPCv2-R2'], {
      sessionId,
      userMsg2: {
        from: MPCv2PartiesEnum.USER,
        to: MPCv2PartiesEnum.BITGO,
        signature: userMsg2.payload.signature,
        encryptedMessage: userMsg2.payload.encryptedMessage,
      },
      userCommitment2: userMsg2.commitment,
      backupMsg2: {
        from: MPCv2PartiesEnum.BACKUP,
        to: MPCv2PartiesEnum.BITGO,
        signature: backupMsg2.payload.signature,
        encryptedMessage: backupMsg2.payload.encryptedMessage,
      },
      backupCommitment2: backupMsg2.commitment,
    });
  }

  private async sendKeyGenerationRound3(
    enterprise: string,
    sessionId: string,
    payload: DklsTypes.AuthEncMessages
  ): Promise<MPCv2KeyGenRound3Response> {
    assert(NonEmptyString.is(sessionId), 'Session ID is required');
    const userMsg3 = payload.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
    )?.payload;
    assert(userMsg3, 'User to Bitgo message 3 not found in P2P messages');
    const backupMsg3 = payload.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
    )?.payload;
    assert(backupMsg3, 'Backup to Bitgo message 3 not found in P2P messages');
    const userMsg4 = payload.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER)?.payload;
    assert(userMsg4, 'User message 1 not found in broadcast messages');
    const backupMsg4 = payload.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BACKUP)?.payload;
    assert(backupMsg4, 'Backup message 1 not found in broadcast messages');

    return this.sendKeyGenerationRequest<MPCv2KeyGenRound3Response>(enterprise, MPCv2KeyGenStateEnum['MPCv2-R3'], {
      sessionId,
      userMsg3: { from: 0, to: 2, ...userMsg3 },
      backupMsg3: { from: 1, to: 2, ...backupMsg3 },
      userMsg4: { from: 0, ...userMsg4 },
      backupMsg4: { from: 1, ...backupMsg4 },
    });
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

  private async signRequestBase(params: TSSParams | TSSParamsForMessage, requestType: RequestType): Promise<TxRequest> {
    const userKeyShare = Buffer.from(params.prv, 'base64');
    const txRequest: TxRequest =
      typeof params.txRequest === 'string'
        ? await getTxRequest(this.bitgo, this.wallet.id(), params.txRequest)
        : params.txRequest;

    let derivationPath: string;
    let txToSign: string;
    const [userGpgKey, bitgoGpgPubKey] = await Promise.all([
      generateGPGKeyPair('secp256k1'),
      this.getBitgoGpgPubkeyBasedOnFeatureFlags(txRequest.enterpriseId, true).then(
        (pubKey) => pubKey ?? this.bitgoMPCv2PublicGpgKey
      ),
    ]);
    if (!bitgoGpgPubKey) {
      throw new Error('Missing BitGo GPG key for MPCv2');
    }

    if (requestType === RequestType.tx) {
      assert(txRequest.transactions || txRequest.unsignedTxs, 'Unable to find transactions in txRequest');
      const unsignedTx =
        txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
      txToSign = unsignedTx.signableHex;
      derivationPath = unsignedTx.derivationPath;
    } else if (requestType === RequestType.message) {
      throw new Error('MPCv2 message signing not supported yet.');
    } else {
      throw new Error('Invalid request type');
    }

    let hash: Hash;
    try {
      hash = this.baseCoin.getHashFunction();
    } catch (err) {
      hash = createKeccakHash('keccak256') as Hash;
    }
    const hashBuffer = hash.update(Buffer.from(txToSign, 'hex')).digest();

    const otherSigner = new DklsDsg.Dsg(userKeyShare, 0, derivationPath, hashBuffer);
    const userSignerBroadcastMsg1 = await otherSigner.init();
    const signatureShareRound1 = await getSignatureShareRoundOne(userSignerBroadcastMsg1, userGpgKey);

    let latestTxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRound1],
      RequestType.tx,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion()
    );
    assert(latestTxRequest.transactions);

    const bitgoToUserMessages1And2 = latestTxRequest.transactions[0].signatureShares;
    // TODO: Use codec for parsing
    const parsedBitGoToUserSigShareRoundOne = JSON.parse(
      bitgoToUserMessages1And2[bitgoToUserMessages1And2.length - 1].share
    ) as MPCv2SignatureShareRound1Output;
    if (parsedBitGoToUserSigShareRoundOne.type !== 'round1Output') {
      throw new Error('Unexpected signature share response. Unable to parse data.');
    }
    const serializedBitGoToUserMessagesRound1And2 = await verifyBitGoMessagesAndSignaturesRoundOne(
      parsedBitGoToUserSigShareRoundOne,
      userGpgKey,
      bitgoGpgPubKey
    );

    /** Round 2 **/
    const deserializedMessages = DklsTypes.deserializeMessages(serializedBitGoToUserMessagesRound1And2);
    const userToBitGoMessagesRound2 = otherSigner.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: deserializedMessages.broadcastMessages,
    });
    const userToBitGoMessagesRound3 = otherSigner.handleIncomingMessages({
      p2pMessages: deserializedMessages.p2pMessages,
      broadcastMessages: [],
    });
    const signatureShareRoundTwo = await getSignatureShareRoundTwo(
      userToBitGoMessagesRound2,
      userToBitGoMessagesRound3,
      userGpgKey,
      bitgoGpgPubKey
    );
    latestTxRequest = await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRoundTwo],
      RequestType.tx,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion()
    );
    assert(latestTxRequest.transactions);

    const txRequestSignatureShares = latestTxRequest.transactions[0].signatureShares;
    // TODO: Use codec for parsing
    const parsedBitGoToUserSigShareRoundTwo = JSON.parse(
      txRequestSignatureShares[txRequestSignatureShares.length - 1].share
    ) as MPCv2SignatureShareRound2Output;
    if (parsedBitGoToUserSigShareRoundTwo.type !== 'round2Output') {
      throw new Error('Unexpected signature share response. Unable to parse data.');
    }
    const serializedBitGoToUserMessagesRound3 = await verifyBitGoMessagesAndSignaturesRoundTwo(
      parsedBitGoToUserSigShareRoundTwo,
      userGpgKey,
      bitgoGpgPubKey
    );

    /** Round 3 **/
    const deserializedBitGoToUserMessagesRound3 = DklsTypes.deserializeMessages({
      p2pMessages: serializedBitGoToUserMessagesRound3.p2pMessages,
      broadcastMessages: [],
    });
    const userToBitGoMessagesRound4 = otherSigner.handleIncomingMessages({
      p2pMessages: deserializedBitGoToUserMessagesRound3.p2pMessages,
      broadcastMessages: [],
    });

    const signatureShareRoundThree = await getSignatureShareRoundThree(
      userToBitGoMessagesRound4,
      userGpgKey,
      bitgoGpgPubKey
    );
    // Submit for final signature share combine
    await sendSignatureShareV2(
      this.bitgo,
      txRequest.walletId,
      txRequest.txRequestId,
      [signatureShareRoundThree],
      RequestType.tx,
      this.baseCoin.getMPCAlgorithm(),
      userGpgKey.publicKey,
      undefined,
      this.wallet.multisigTypeVersion()
    );

    return sendTxRequest(this.bitgo, txRequest.walletId, txRequest.txRequestId, RequestType.tx);
  }

  // #endregion

  // #region utils
  private formatBitgoBroadcastMessage(broadcastMessage: MPCv2BroadcastMessage) {
    return {
      from: broadcastMessage.from,
      payload: { message: broadcastMessage.message, signature: broadcastMessage.signature },
    };
  }

  private formatP2PMessage(p2pMessage: MPCv2P2PMessage, commitment?: string) {
    return {
      payload: { encryptedMessage: p2pMessage.encryptedMessage, signature: p2pMessage.signature },
      from: p2pMessage.from,
      to: p2pMessage.to,
      commitment,
    };
  }
  // #endregion
}
