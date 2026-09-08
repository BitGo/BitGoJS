import { DklsComms, DklsDkg, DklsDrv, DklsTypes, DklsVrf } from '@bitgo/sdk-lib-mpc';
import assert from 'assert';
import { NonEmptyString } from 'io-ts-types';
import {
  MPCv2DeriveRound1Request,
  MPCv2DeriveRound1Response,
  MPCv2DeriveRound2Request,
  MPCv2DeriveRound2Response,
  MPCv2DeriveRound3Response,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenStateEnum,
} from '@bitgo/public-types';
import { KeychainsTriplet } from '../../../baseCoin';
import { DecryptedRetrofitPayload } from '../../../keychain/iKeychains';
import { EncryptionVersion } from '../../../../api';
import { generateGPGKeyPair } from '../../opengpgUtils';
import { WebauthnKeyEncryptionInfo } from '../../../keychain';
import { envRequiresBitgoPubGpgKeyConfig, isBitgoMpcPubKey } from '../../../tss/bitgoPubKeys';
import { buildSafeMpcKeyEnvelopes } from '../keyShareEnvelope';
import { EcdsaMPCv2Utils } from './ecdsaMPCv2';
import {
  EcdsaMPCv2DeriveKeySendFn,
  KeyGenSenderForEnterprise,
  KeyGenSenderForSafeChild,
} from './ecdsaMPCv2KeyGenSender';
import { MPCv2PartiesEnum, MpcV2VrfKeyGenResponseFields } from './typesMPCv2';

/**
 * Wire format for VRF DKG messages riding the MPCv2-R1/R2 payloads: an opaque blob,
 * `base64(JSON.stringify(VrfMessageTransfer[]))`, carrying the party's full batch of
 * emitted messages. The VRF DKG emits broadcast commitments (R1) and per-recipient
 * opening messages addressed to each party including the sender (R2), so the receiving
 * side routes by `to` and keeps messages addressed to itself.
 */
interface VrfMessageTransfer {
  from: number;
  to?: number;
  payload: string; // base64
}

function serializeVrfMessages(messages: DklsTypes.DeserializedMessages): string {
  const transfers: VrfMessageTransfer[] = [
    ...messages.broadcastMessages.map((m) => ({ from: m.from, payload: Buffer.from(m.payload).toString('base64') })),
    ...messages.p2pMessages.map((m) => ({
      from: m.from,
      to: m.to,
      payload: Buffer.from(m.payload).toString('base64'),
    })),
  ];
  return Buffer.from(JSON.stringify(transfers)).toString('base64');
}

function deserializeVrfMessages(blob: string, forParty: number): DklsTypes.DeserializedMessages {
  const transfers: VrfMessageTransfer[] = JSON.parse(Buffer.from(blob, 'base64').toString());
  return {
    broadcastMessages: transfers
      .filter((t) => t.to === undefined)
      .map((t) => ({ from: t.from, payload: new Uint8Array(Buffer.from(t.payload, 'base64')) })),
    p2pMessages: transfers
      .filter((t): t is VrfMessageTransfer & { to: number } => t.to === forParty)
      .map((t) => ({ from: t.from, to: t.to, payload: new Uint8Array(Buffer.from(t.payload, 'base64')) })),
  };
}

/**
 * Encodes a hardened derivation index as the byte path the DKLS hard-derive wasm
 * expects: one big-endian u32 with the hardened bit (0x80000000) set — i.e. the
 * child path `m/<index>'`. The server derives the same hardened path from the
 * `derivationIndex` it receives on round 1.
 */
export function hardenedDerivationPath(index: number): Uint8Array {
  if (!Number.isInteger(index) || index < 0 || index > 0x7fffffff) {
    throw new Error(`Invalid derivation index: ${index}`);
  }
  return new Uint8Array([0x80 | (index >>> 24), (index >>> 16) & 0xff, (index >>> 8) & 0xff, index & 0xff]);
}

/**
 * EcdsaMPCv2Utils variant that runs the Ristretto VRF DKG alongside the signing DKLS
 * DKG inside the same MPCv2 keygen rounds, for safe MPC root creation.
 *
 * The round enum is unchanged: the VRF commitment rides MPCv2-R1, the opening rides
 * MPCv2-R2, and the VRF DKG finalizes locally before MPCv2-R3. VRF messages travel as
 * opaque base64 fields on the round payloads, never through the DKLS broadcast/p2p slots.
 * At the end, the signing and VRF keyshares are combined into a single CBOR envelope
 * before encryption.
 */
export class EcdsaVrfMPCv2Utils extends EcdsaMPCv2Utils {
  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise: string;
    originalPasscodeEncryptionCode?: string;
    retrofit?: DecryptedRetrofitPayload;
    webauthnInfo?: WebauthnKeyEncryptionInfo;
    encryptionVersion?: EncryptionVersion;
    // Tags the resulting user/backup/bitgo root keys with this safe.
    safeId: string;
  }): Promise<KeychainsTriplet> {
    const { userSession, backupSession } = this.createSigningDkgSessions(params.retrofit);
    const userVrfSession = new DklsVrf.VrfDkg(3, 2, MPCv2PartiesEnum.USER);
    const backupVrfSession = new DklsVrf.VrfDkg(3, 2, MPCv2PartiesEnum.BACKUP);

    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const backupGpgKey = await generateGPGKeyPair('secp256k1');

    // Get the BitGo public key based on user/enterprise feature flags
    // If it doesn't work, use the default public key from the constants
    const { mpcv2PublicKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true);
    const mpcv2Key = mpcv2PublicKey ?? this.bitgoMPCv2PublicGpgKey;
    assert(mpcv2Key, 'Failed to get BitGo MPCv2 GPG public key');
    const bitgoPublicGpgKey = mpcv2Key.armor();

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      // Ensure the public key is one of the expected BitGo public keys when in test or prod.
      assert(isBitgoMpcPubKey(bitgoPublicGpgKey, 'mpcv2'), 'Invalid BitGo GPG public key');
    }

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
    const userVrfRound1Msg = await userVrfSession.initDkg();
    const backupVrfRound1Msg = await backupVrfSession.initDkg();

    const round1SerializedMessages = DklsTypes.serializeMessages({
      broadcastMessages: [userRound1BroadcastMsg, backupRound1BroadcastMsg],
      p2pMessages: [],
    });
    const round1Messages = await DklsComms.encryptAndAuthOutgoingMessages(
      round1SerializedMessages,
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );
    const userMsg1 = round1Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER)?.payload;
    const backupMsg1 = round1Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BACKUP)?.payload;
    assert(userMsg1, 'User message 1 not found in broadcast messages');
    assert(backupMsg1, 'Backup message 1 not found in broadcast messages');

    const userGpgPublicKey = userGpgKey.publicKey;
    const backupGpgPublicKey = backupGpgKey.publicKey;
    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(backupGpgPublicKey), 'Backup GPG public key is required');
    // Keep VRF messages opaque on the key-generation request.
    const round1Sender = KeyGenSenderForEnterprise<MPCv2KeyGenRound1Response & MpcV2VrfKeyGenResponseFields>(
      this.bitgo,
      params.enterprise,
      params.safeId
    );
    const { sessionId, bitgoMsg1, bitgoToBackupMsg2, bitgoToUserMsg2, bitgoVrfMsg1 } = await round1Sender(
      MPCv2KeyGenStateEnum['MPCv2-R1'],
      {
        userMsg1: { from: MPCv2PartiesEnum.USER, ...userMsg1 },
        backupMsg1: { from: MPCv2PartiesEnum.BACKUP, ...backupMsg1 },
        userGpgPublicKey,
        backupGpgPublicKey,
        userVrfMsg1: serializeVrfMessages(userVrfRound1Msg),
        backupVrfMsg1: serializeVrfMessages(backupVrfRound1Msg),
        walletId: params.retrofit?.walletId,
      }
    );
    assert(bitgoVrfMsg1, 'BitGo VRF message 1 not found in round 1 response');
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

    // VRF: consume BitGo's and the counterparty's commitments, emit this party's openings.
    // Openings come back as p2p messages addressed to each party (including the sender).
    const userVrfRound2Messages = await userVrfSession.handleIncomingMessages({
      broadcastMessages: [
        ...backupVrfRound1Msg.broadcastMessages,
        ...deserializeVrfMessages(bitgoVrfMsg1, MPCv2PartiesEnum.USER).broadcastMessages,
      ],
      p2pMessages: [],
    });

    const backupVrfRound2Messages = await backupVrfSession.handleIncomingMessages({
      broadcastMessages: [
        ...userVrfRound1Msg.broadcastMessages,
        ...deserializeVrfMessages(bitgoVrfMsg1, MPCv2PartiesEnum.BACKUP).broadcastMessages,
      ],
      p2pMessages: [],
    });

    const round2Messages = await DklsComms.encryptAndAuthOutgoingMessages(
      { p2pMessages: [serializedUserToBitgoMsg2, serializedBackupToBitgoMsg2], broadcastMessages: [] },
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );
    const userRound2Msg = round2Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
    );
    const backupRound2Msg = round2Messages.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
    );
    assert(userRound2Msg, 'User to Bitgo message 2 not found in P2P messages');
    assert(userRound2Msg.commitment, 'User to Bitgo commitment not found in P2P messages');
    assert(backupRound2Msg, 'Backup to Bitgo message 2 not found in P2P messages');
    assert(backupRound2Msg.commitment, 'Backup to Bitgo commitment not found in P2P messages');
    assert(NonEmptyString.is(userRound2Msg.commitment), 'User to Bitgo commitment is required');
    assert(NonEmptyString.is(backupRound2Msg.commitment), 'Backup to Bitgo commitment is required');
    const round2Sender = KeyGenSenderForEnterprise<MPCv2KeyGenRound2Response & MpcV2VrfKeyGenResponseFields>(
      this.bitgo,
      params.enterprise
    );
    const {
      sessionId: sessionIdRound2,
      bitgoCommitment2,
      bitgoToUserMsg3,
      bitgoToBackupMsg3,
      bitgoVrfMsg2,
    } = await round2Sender(MPCv2KeyGenStateEnum['MPCv2-R2'], {
      sessionId,
      userMsg2: {
        from: MPCv2PartiesEnum.USER,
        to: MPCv2PartiesEnum.BITGO,
        signature: userRound2Msg.payload.signature,
        encryptedMessage: userRound2Msg.payload.encryptedMessage,
      },
      userCommitment2: userRound2Msg.commitment,
      backupMsg2: {
        from: MPCv2PartiesEnum.BACKUP,
        to: MPCv2PartiesEnum.BITGO,
        signature: backupRound2Msg.payload.signature,
        encryptedMessage: backupRound2Msg.payload.encryptedMessage,
      },
      backupCommitment2: backupRound2Msg.commitment,
      userVrfMsg2: serializeVrfMessages(userVrfRound2Messages),
      backupVrfMsg2: serializeVrfMessages(backupVrfRound2Messages),
    });
    // #endregion

    // #region round 3
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and 2 Session IDs do not match');
    assert(bitgoVrfMsg2, 'BitGo VRF message 2 not found in round 2 response');

    // VRF: finalize both DKGs locally by consuming the opening messages addressed to each
    // party (including each party's own) from the R2 exchanges. The VRF DKG completes here,
    // a full round of slack before MPCv2-R3.
    await userVrfSession.handleIncomingMessages({
      broadcastMessages: [],
      p2pMessages: [
        ...userVrfRound2Messages.p2pMessages.filter((m) => m.to === MPCv2PartiesEnum.USER),
        ...backupVrfRound2Messages.p2pMessages.filter((m) => m.to === MPCv2PartiesEnum.USER),
        ...deserializeVrfMessages(bitgoVrfMsg2, MPCv2PartiesEnum.USER).p2pMessages,
      ],
    });
    await backupVrfSession.handleIncomingMessages({
      broadcastMessages: [],
      p2pMessages: [
        ...userVrfRound2Messages.p2pMessages.filter((m) => m.to === MPCv2PartiesEnum.BACKUP),
        ...backupVrfRound2Messages.p2pMessages.filter((m) => m.to === MPCv2PartiesEnum.BACKUP),
        ...deserializeVrfMessages(bitgoVrfMsg2, MPCv2PartiesEnum.BACKUP).p2pMessages,
      ],
    });

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
    const userVrfKeyShare = userVrfSession.getKeyShare();
    const backupVrfKeyShare = backupVrfSession.getKeyShare();

    const userCommonKeychain = DklsTypes.getCommonKeychain(userPrivateMaterial);
    const backupCommonKeychain = DklsTypes.getCommonKeychain(backupPrivateMaterial);

    assert.equal(bitgoCommonKeychain, userCommonKeychain, 'User and Bitgo Common keychains do not match');
    assert.equal(bitgoCommonKeychain, backupCommonKeychain, 'Backup and Bitgo Common keychains do not match');

    const { envelope: userEnvelope, reducedEnvelope: userReducedEnvelope } = buildSafeMpcKeyEnvelopes(
      userPrivateMaterial,
      userReducedPrivateMaterial,
      userVrfKeyShare
    );
    const { envelope: backupEnvelope, reducedEnvelope: backupReducedEnvelope } = buildSafeMpcKeyEnvelopes(
      backupPrivateMaterial,
      backupReducedPrivateMaterial,
      backupVrfKeyShare
    );

    const encryptionSession =
      params.encryptionVersion === 2 ? await this.bitgo.createEncryptionSession(params.passphrase) : undefined;
    try {
      const userKeychainPromise = this.createParticipantKeychain(
        MPCv2PartiesEnum.USER,
        bitgoCommonKeychain,
        userEnvelope,
        userReducedEnvelope,
        params.passphrase,
        params.originalPasscodeEncryptionCode,
        params.webauthnInfo,
        encryptionSession,
        params.encryptionVersion,
        params.enterprise,
        params.safeId
      );
      const backupKeychainPromise = this.createParticipantKeychain(
        MPCv2PartiesEnum.BACKUP,
        bitgoCommonKeychain,
        backupEnvelope,
        backupReducedEnvelope,
        params.passphrase,
        params.originalPasscodeEncryptionCode,
        undefined,
        encryptionSession,
        params.encryptionVersion,
        undefined,
        params.safeId
      );
      const bitgoKeychainPromise = this.createParticipantKeychain(
        MPCv2PartiesEnum.BITGO,
        bitgoCommonKeychain,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        params.safeId
      );

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
    } finally {
      encryptionSession?.destroy();
    }
  }
  /**
   * Sends round 1 for the user/BitGo hard-derive ceremony.
   */
  async sendDerivationRound1BySender(
    senderFn: EcdsaMPCv2DeriveKeySendFn<MPCv2DeriveRound1Response>,
    userGpgPublicKey: string,
    payload: DklsTypes.AuthEncMessages,
    parentKeyId: string,
    derivationIndex: number
  ): Promise<MPCv2DeriveRound1Response> {
    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(parentKeyId), 'Parent key id is required');
    const userMsg1 = payload.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER)?.payload;
    assert(userMsg1, 'User message 1 not found in broadcast messages');

    assert(
      MPCv2DeriveRound1Request.props.derivationIndex.is(derivationIndex),
      'Derivation index must be a non-negative safe integer'
    );
    const request: MPCv2DeriveRound1Request = {
      userGpgPublicKey,
      userMsg1: { from: MPCv2PartiesEnum.USER, ...userMsg1 },
      parentKeyId,
      derivationIndex,
    };
    return senderFn(MPCv2KeyGenStateEnum['MPCv2Derive-R1'], request);
  }

  /**
   * Sends round 2 for the user/BitGo hard-derive ceremony.
   */
  async sendDerivationRound2BySender(
    senderFn: EcdsaMPCv2DeriveKeySendFn<MPCv2DeriveRound2Response>,
    sessionId: string,
    payload: DklsTypes.AuthEncMessages
  ): Promise<MPCv2DeriveRound2Response> {
    assert(NonEmptyString.is(sessionId), 'Session ID is required');
    const userMsg2 = payload.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER)?.payload;
    assert(userMsg2, 'User message 2 not found in broadcast messages');

    const request: MPCv2DeriveRound2Request = {
      sessionId,
      userMsg2: { from: MPCv2PartiesEnum.USER, ...userMsg2 },
    };
    return senderFn(MPCv2KeyGenStateEnum['MPCv2Derive-R2'], request);
  }

  /**
   * Completes round 3 and returns the child common keychain.
   */
  async sendDerivationRound3BySender(
    senderFn: EcdsaMPCv2DeriveKeySendFn<MPCv2DeriveRound3Response>,
    sessionId: string
  ): Promise<MPCv2DeriveRound3Response> {
    assert(NonEmptyString.is(sessionId), 'Session ID is required');
    return senderFn(MPCv2KeyGenStateEnum['MPCv2Derive-R3'], { sessionId });
  }

  /**
   * Runs the safe child hard-derive ceremony and registers child key documents.
   */
  async createSafeChildKeychains(params: {
    passphrase: string;
    enterprise: string;
    safeId: string;
    /** Root key ID used for the derive. */
    parentKeyId: string;
    derivationIndex: number;
    userRootKeyId: string;
    backupRootKeyId: string;
    userRootKeyShare: Buffer;
    userRootVrfKeyShare: Buffer;
    originalPasscodeEncryptionCode?: string;
    webauthnInfo?: WebauthnKeyEncryptionInfo;
    encryptionVersion?: EncryptionVersion;
  }): Promise<KeychainsTriplet> {
    const userGpgKey = await generateGPGKeyPair('secp256k1');
    const { mpcv2PublicKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true);
    const mpcv2Key = mpcv2PublicKey ?? this.bitgoMPCv2PublicGpgKey;
    assert(mpcv2Key, 'Failed to get BitGo MPCv2 GPG public key');
    const bitgoPublicGpgKey = mpcv2Key.armor();

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      assert(isBitgoMpcPubKey(bitgoPublicGpgKey, 'mpcv2'), 'Invalid BitGo GPG public key');
    }

    const userGpgPrvKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.USER,
      gpgKey: userGpgKey.privateKey,
    };
    const bitgoGpgPubKey: DklsTypes.PartyGpgKey = {
      partyId: MPCv2PartiesEnum.BITGO,
      gpgKey: bitgoPublicGpgKey,
    };

    const path = hardenedDerivationPath(params.derivationIndex);
    const userDeriveSession = new DklsDrv.Derive(
      3,
      2,
      MPCv2PartiesEnum.USER,
      params.userRootKeyShare,
      params.userRootVrfKeyShare,
      path
    );

    // Round 1: send the user's first message.
    const userRound1Msg = await userDeriveSession.initDerive();
    const round1Messages = await DklsComms.encryptAndAuthOutgoingMessages(
      {
        broadcastMessages: [DklsTypes.serializeBroadcastMessage(userRound1Msg)],
        p2pMessages: [],
      },
      [bitgoGpgPubKey],
      [userGpgPrvKey]
    );
    assert(NonEmptyString.is(userGpgKey.publicKey), 'User GPG public key is required');
    const { sessionId, bitgoMsg1 } = await this.sendDerivationRound1BySender(
      KeyGenSenderForSafeChild<MPCv2DeriveRound1Response>(this.bitgo, params.enterprise, params.safeId),
      userGpgKey.publicKey,
      round1Messages,
      params.parentKeyId,
      params.derivationIndex
    );

    // Round 2: process the peer's first message and return the user's second.
    const decryptedBitgoRound1 = await DklsComms.decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [this.formatBitgoBroadcastMessage(bitgoMsg1)] },
      [bitgoGpgPubKey],
      []
    );
    const bitgoRound1Msg = decryptedBitgoRound1.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BITGO);
    assert(bitgoRound1Msg, 'BitGo derive message 1 not found in broadcast messages');
    const userRound2Messages = userDeriveSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [DklsTypes.deserializeBroadcastMessage(bitgoRound1Msg)],
    });
    const round2Messages = await DklsComms.encryptAndAuthOutgoingMessages(
      DklsTypes.serializeMessages(userRound2Messages),
      [bitgoGpgPubKey],
      [userGpgPrvKey]
    );
    const { sessionId: sessionIdRound2, bitgoMsg2 } = await this.sendDerivationRound2BySender(
      KeyGenSenderForSafeChild<MPCv2DeriveRound2Response>(this.bitgo, params.enterprise, params.safeId),
      sessionId,
      round2Messages
    );
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and 2 Session IDs do not match');

    // Process the peer response to finalize the local child share.
    const decryptedBitgoRound2 = await DklsComms.decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [this.formatBitgoBroadcastMessage(bitgoMsg2)] },
      [bitgoGpgPubKey],
      []
    );
    const bitgoRound2Msg = decryptedBitgoRound2.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BITGO);
    assert(bitgoRound2Msg, 'BitGo derive message 2 not found in broadcast messages');
    userDeriveSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [DklsTypes.deserializeBroadcastMessage(bitgoRound2Msg)],
    });

    // Round 3: obtain the child common-keychain metadata.
    const { sessionId: sessionIdRound3, commonKeychain } = await this.sendDerivationRound3BySender(
      KeyGenSenderForSafeChild<MPCv2DeriveRound3Response>(this.bitgo, params.enterprise, params.safeId),
      sessionId
    );
    assert.equal(sessionId, sessionIdRound3, 'Round 1 and 3 Session IDs do not match');

    const userPrivateMaterial = userDeriveSession.getKeyShare();
    const userReducedPrivateMaterial = userDeriveSession.getReducedKeyShare();
    const userCommonKeychain = DklsTypes.getCommonKeychain(userPrivateMaterial);
    assert.equal(commonKeychain, userCommonKeychain, 'User and BitGo common keychains do not match');

    const encryptionSession =
      params.encryptionVersion === 2 ? await this.bitgo.createEncryptionSession(params.passphrase) : undefined;
    try {
      const userKeychainPromise = this.addUserKeychain(
        commonKeychain,
        userPrivateMaterial,
        userReducedPrivateMaterial,
        params.passphrase,
        params.originalPasscodeEncryptionCode,
        params.webauthnInfo,
        encryptionSession,
        params.encryptionVersion,
        params.enterprise,
        params.safeId,
        { parentKeyId: params.userRootKeyId, index: params.derivationIndex }
      );
      const backupKeychainPromise = this.addBackupKeychain(
        commonKeychain,
        undefined,
        undefined,
        params.passphrase,
        params.originalPasscodeEncryptionCode,
        encryptionSession,
        params.encryptionVersion,
        params.safeId,
        { parentKeyId: params.backupRootKeyId, index: params.derivationIndex }
      );
      const bitgoKeychainPromise = this.addBitgoKeychain(commonKeychain, params.safeId, {
        parentKeyId: params.parentKeyId,
        index: params.derivationIndex,
      });

      const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
        userKeychainPromise,
        backupKeychainPromise,
        bitgoKeychainPromise,
      ]);
      return { userKeychain, backupKeychain, bitgoKeychain };
    } finally {
      encryptionSession?.destroy();
    }
  }

  private createSigningDkgSessions(retrofit?: DecryptedRetrofitPayload) {
    if (retrofit) {
      const retrofitData = this.getMpcV2RetrofitDataFromMpcV1Keys({
        mpcv1UserKeyShare: retrofit.decryptedUserKey,
        mpcv1BackupKeyShare: retrofit.decryptedBackupKey,
      });
      return {
        userSession: new DklsDkg.Dkg(3, 2, MPCv2PartiesEnum.USER, undefined, retrofitData.mpcv2UserKeyShare),
        backupSession: new DklsDkg.Dkg(3, 2, MPCv2PartiesEnum.BACKUP, undefined, retrofitData.mpcv2BackupKeyShare),
      };
    }
    return {
      userSession: new DklsDkg.Dkg(3, 2, MPCv2PartiesEnum.USER),
      backupSession: new DklsDkg.Dkg(3, 2, MPCv2PartiesEnum.BACKUP),
    };
  }
}
