import { DklsTypes, MPSComms, MpsVrf, type MPSTypes } from '@bitgo/sdk-lib-mpc';
import {
  MPCv2KeyGenStateEnum,
  type EddsaMPCv2KeyGenRound1Response,
  type EddsaMPCv2KeyGenRound2Response,
} from '@bitgo/public-types';
import { encode } from 'cbor-x';
import assert from 'assert';
import * as t from 'io-ts';
import * as pgp from 'openpgp';
import { NonEmptyString } from 'io-ts-types';

import type { KeychainsTriplet } from '../../../baseCoin';
import type { DecryptedRetrofitPayload } from '../../../keychain/iKeychains';
import type { EncryptionVersion } from '../../../../api';
import { generateGPGKeyPair } from '../../opengpgUtils';
import type { WebauthnKeyEncryptionInfo } from '../../../keychain';
import { envRequiresBitgoPubGpgKeyConfig, isBitgoEddsaMpcv2PubKey } from '../../../tss/bitgoPubKeys';
import { base64String, boundedInt, decodeWithCodec } from '../../codecs';
import { EddsaMPCv2Utils } from './eddsaMPCv2';
import { KeyGenSenderForEnterprise } from './eddsaMPCv2KeyGenSender';
import type { EddsaMPCv2VrfKeyGenResponseFields } from './typesEddsaMPCv2';
import { MPCv2PartiesEnum } from '../ecdsa/typesMPCv2';

const VRF_KEY_ENVELOPE_VERSION = 1;

const VrfPartyId = boundedInt(0, 2, 'VrfPartyId');
const VrfMessageTransferCodec = t.intersection([
  t.type({
    from: VrfPartyId,
    payload: base64String,
  }),
  t.partial({ to: VrfPartyId }),
]);
const VrfMessageTransfersCodec = t.array(VrfMessageTransferCodec);

type VrfMessageTransfer = t.TypeOf<typeof VrfMessageTransferCodec>;

export function serializeVrfMessages(messages: DklsTypes.DeserializedMessages): string {
  const transfers: VrfMessageTransfer[] = [
    ...messages.broadcastMessages.map((message) => ({
      from: message.from,
      payload: Buffer.from(message.payload).toString('base64'),
    })),
    ...messages.p2pMessages.map((message) => ({
      from: message.from,
      to: message.to,
      payload: Buffer.from(message.payload).toString('base64'),
    })),
  ];
  return Buffer.from(JSON.stringify(transfers)).toString('base64');
}

export function deserializeVrfMessages(blob: string, forParty: number): DklsTypes.DeserializedMessages {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(blob, 'base64').toString());
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'malformed JSON';
    throw new Error(`Invalid VRF DKG message blob: ${reason}`);
  }

  const transfers = decodeWithCodec(VrfMessageTransfersCodec, parsed, 'VRF DKG message blob');
  return {
    broadcastMessages: transfers
      .filter((message) => message.to === undefined)
      .map((message) => ({
        from: message.from,
        payload: new Uint8Array(Buffer.from(message.payload, 'base64')),
      })),
    p2pMessages: transfers
      .filter((message): message is VrfMessageTransfer & { to: number } => message.to === forParty)
      .map((message) => ({
        from: message.from,
        to: message.to,
        payload: new Uint8Array(Buffer.from(message.payload, 'base64')),
      })),
  };
}

/**
 * Combines the signing keyshare with the VRF keyshare in the CBOR envelope used
 * by safe MPC roots. The reduced envelope is used for reducedEncryptedPrv.
 */
export function buildVrfKeyEnvelopes(
  privateMaterial: Buffer,
  reducedPrivateMaterial: Buffer,
  vrfKeyShare: Buffer
): { envelope: Buffer; reducedEnvelope: Buffer } {
  const envelope = encode({
    version: VRF_KEY_ENVELOPE_VERSION,
    prvKeyShare: new Uint8Array(privateMaterial),
    vrf: new Uint8Array(vrfKeyShare),
  });
  const reducedEnvelope = encode({
    version: VRF_KEY_ENVELOPE_VERSION,
    prvKeyShare: new Uint8Array(reducedPrivateMaterial),
    vrf: new Uint8Array(vrfKeyShare),
  });
  return { envelope: Buffer.from(envelope), reducedEnvelope: Buffer.from(reducedEnvelope) };
}

/**
 * EdDSA MPCv2 key generation for safe roots. The two-round MPS VRF DKG rides
 * the existing MPCv2-R1/R2 payloads and is only selected when safeId is set.
 */
export class EddsaVrfMPCv2Utils extends EddsaMPCv2Utils {
  /** @inheritdoc */
  async createKeychains(params: {
    passphrase: string;
    enterprise: string;
    originalPasscodeEncryptionCode?: string;
    retrofit?: DecryptedRetrofitPayload;
    webauthnInfo?: WebauthnKeyEncryptionInfo;
    encryptionVersion?: EncryptionVersion;
    safeId: string;
  }): Promise<KeychainsTriplet> {
    const { userDkg, backupDkg } = await this.getUserAndBackupSession(params.retrofit);
    const userVrfSession = new MpsVrf.VrfDkg(3, 2, MPCv2PartiesEnum.USER);
    const backupVrfSession = new MpsVrf.VrfDkg(3, 2, MPCv2PartiesEnum.BACKUP);

    const userKeyPair = await generateGPGKeyPair('ed25519');
    const userGpgKey = await pgp.readPrivateKey({ armoredKey: userKeyPair.privateKey });
    const userGpgPublicKey = userKeyPair.publicKey;
    const [userPk, userSk] = await MPSComms.extractEd25519KeyPair(userGpgKey);

    const backupKeyPair = await generateGPGKeyPair('ed25519');
    const backupGpgKey = await pgp.readPrivateKey({ armoredKey: backupKeyPair.privateKey });
    const backupGpgPublicKey = backupKeyPair.publicKey;
    const [backupPk, backupSk] = await MPSComms.extractEd25519KeyPair(backupGpgKey);

    const { eddsaMpcv2PublicKey } = await this.getBitgoGpgPubkeyBasedOnFeatureFlags(params.enterprise, true);
    const bitgoPublicGpgKey = eddsaMpcv2PublicKey ?? this.bitgoEddsaMpcv2PublicGpgKey;
    assert(bitgoPublicGpgKey, 'Failed to get BitGo EdDSA MPCv2 GPG public key');
    const bitgoPublicGpgKeyArmored = bitgoPublicGpgKey.armor();

    if (envRequiresBitgoPubGpgKeyConfig(this.bitgo.getEnv())) {
      assert(isBitgoEddsaMpcv2PubKey(bitgoPublicGpgKeyArmored), 'Invalid BitGo EdDSA MPCv2 GPG public key');
    }

    const bitgoKeyObj = await pgp.readKey({ armoredKey: bitgoPublicGpgKeyArmored });
    const bitgoPk = await MPSComms.extractEd25519PublicKey(bitgoKeyObj);

    // #region round 1
    await userDkg.initDkg(userSk, [backupPk, bitgoPk]);
    await backupDkg.initDkg(backupSk, [userPk, bitgoPk]);

    const userMsg1 = userDkg.getFirstMessage();
    const backupMsg1 = backupDkg.getFirstMessage();
    const userVrfMsg1 = await userVrfSession.initDkg();
    const backupVrfMsg1 = await backupVrfSession.initDkg();

    const userSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg1.payload), userGpgKey);
    const backupSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(backupMsg1.payload), backupGpgKey);

    assert(NonEmptyString.is(userGpgPublicKey), 'User GPG public key is required');
    assert(NonEmptyString.is(backupGpgPublicKey), 'Backup GPG public key is required');

    const round1Sender = KeyGenSenderForEnterprise<EddsaMPCv2KeyGenRound1Response & EddsaMPCv2VrfKeyGenResponseFields>(
      this.bitgo,
      params.enterprise,
      params.safeId
    );
    const { sessionId, bitgoMsg1, bitgoVrfMsg1 } = await round1Sender(MPCv2KeyGenStateEnum['MPCv2-R1'], {
      userGpgPublicKey,
      backupGpgPublicKey,
      userMsg1: userSignedMsg1,
      backupMsg1: backupSignedMsg1,
      userVrfMsg1: serializeVrfMessages(userVrfMsg1),
      backupVrfMsg1: serializeVrfMessages(backupVrfMsg1),
      ...(params.retrofit?.walletId ? { walletId: params.retrofit.walletId } : {}),
    });
    assert(bitgoVrfMsg1, 'BitGo VRF message 1 not found in round 1 response');
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

    const userVrfMsg2 = await userVrfSession.handleIncomingMessages({
      broadcastMessages: [
        ...backupVrfMsg1.broadcastMessages,
        ...deserializeVrfMessages(bitgoVrfMsg1, MPCv2PartiesEnum.USER).broadcastMessages,
      ],
      p2pMessages: [],
    });
    const backupVrfMsg2 = await backupVrfSession.handleIncomingMessages({
      broadcastMessages: [
        ...userVrfMsg1.broadcastMessages,
        ...deserializeVrfMessages(bitgoVrfMsg1, MPCv2PartiesEnum.BACKUP).broadcastMessages,
      ],
      p2pMessages: [],
    });

    const round2Sender = KeyGenSenderForEnterprise<EddsaMPCv2KeyGenRound2Response & EddsaMPCv2VrfKeyGenResponseFields>(
      this.bitgo,
      params.enterprise
    );
    const {
      sessionId: sessionIdRound2,
      commonPublicKeychain,
      bitgoMsg2,
      bitgoVrfMsg2,
    } = await round2Sender(MPCv2KeyGenStateEnum['MPCv2-R2'], {
      sessionId,
      userMsg2: userSignedMsg2,
      backupMsg2: backupSignedMsg2,
      userVrfMsg2: serializeVrfMessages(userVrfMsg2),
      backupVrfMsg2: serializeVrfMessages(backupVrfMsg2),
    });
    assert.equal(sessionId, sessionIdRound2, 'Round 1 and round 2 session IDs do not match');
    assert(bitgoVrfMsg2, 'BitGo VRF message 2 not found in round 2 response');

    // VRF finalizes locally after the second existing MPCv2 round.
    await userVrfSession.handleIncomingMessages({
      broadcastMessages: [],
      p2pMessages: [
        ...userVrfMsg2.p2pMessages.filter((message) => message.to === MPCv2PartiesEnum.USER),
        ...backupVrfMsg2.p2pMessages.filter((message) => message.to === MPCv2PartiesEnum.USER),
        ...deserializeVrfMessages(bitgoVrfMsg2, MPCv2PartiesEnum.USER).p2pMessages,
      ],
    });
    await backupVrfSession.handleIncomingMessages({
      broadcastMessages: [],
      p2pMessages: [
        ...userVrfMsg2.p2pMessages.filter((message) => message.to === MPCv2PartiesEnum.BACKUP),
        ...backupVrfMsg2.p2pMessages.filter((message) => message.to === MPCv2PartiesEnum.BACKUP),
        ...deserializeVrfMessages(bitgoVrfMsg2, MPCv2PartiesEnum.BACKUP).p2pMessages,
      ],
    });
    // #endregion

    // #region keychain creation
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

    const { envelope: userEnvelope, reducedEnvelope: userReducedEnvelope } = buildVrfKeyEnvelopes(
      userDkg.getKeyShare(),
      userDkg.getReducedKeyShare(),
      userVrfSession.getKeyShare()
    );
    const { envelope: backupEnvelope, reducedEnvelope: backupReducedEnvelope } = buildVrfKeyEnvelopes(
      backupDkg.getKeyShare(),
      backupDkg.getReducedKeyShare(),
      backupVrfSession.getKeyShare()
    );

    const userKeychainPromise = this.addUserKeychain(
      userCommonKeychain,
      userEnvelope,
      userReducedEnvelope,
      params.passphrase,
      params.originalPasscodeEncryptionCode,
      params.webauthnInfo,
      params.encryptionVersion,
      params.enterprise,
      params.safeId
    );
    const backupKeychainPromise = this.addBackupKeychain(
      backupCommonKeychain,
      backupEnvelope,
      backupReducedEnvelope,
      params.passphrase,
      params.originalPasscodeEncryptionCode,
      params.encryptionVersion,
      params.enterprise,
      params.safeId
    );
    const bitgoKeychainPromise = this.addBitgoKeychain(commonPublicKeychain, params.safeId);

    const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
      userKeychainPromise,
      backupKeychainPromise,
      bitgoKeychainPromise,
    ]);
    // #endregion

    return { userKeychain, backupKeychain, bitgoKeychain };
  }
}
