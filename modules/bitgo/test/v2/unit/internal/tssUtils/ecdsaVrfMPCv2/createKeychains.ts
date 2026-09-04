import * as assert from 'assert';
import nock = require('nock');
import * as openpgp from 'openpgp';
import { decode } from 'cbor-x';

import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { AddKeychainOptions, BaseCoin, common, ECDSAUtils, Keychain, Wallet } from '@bitgo/sdk-core';
import { DklsComms, DklsDkg, DklsTypes, DklsVrf } from '@bitgo/sdk-lib-mpc';
import {
  MPCv2KeyGenRound1Request,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Request,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Request,
  MPCv2KeyGenRound3Response,
} from '@bitgo/public-types';
import { NonEmptyString } from 'io-ts-types';
import { BitGo, BitgoGPGPublicKey } from '../../../../../../src';

/**
 * VRF DKG message blobs riding the MPCv2-R1/R2 keygen payloads. Mirrors the wire
 * format produced by sdk-core's ecdsaVrfMPCv2.ts.
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

type VrfKeyGenRequestFields = {
  userVrfMsg1?: string;
  backupVrfMsg1?: string;
  userVrfMsg2?: string;
  backupVrfMsg2?: string;
};

type VrfKeyshareDecoded = {
  threshold: number;
  total_parties: number;
  party_id: number;
  d_i: Uint8Array;
  public_key: Uint8Array;
  party_public_shares: Uint8Array[];
  key_id: Uint8Array;
  root_chain_code: Uint8Array;
  final_session_id: Uint8Array;
};
type VrfKeyGenResponseFields = {
  bitgoVrfMsg1?: string;
  bitgoVrfMsg2?: string;
};

describe('TSS Ecdsa VRF MPCv2 Utils:', async function () {
  const coinName = 'hteth';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  const safeId = '6fa8537e3ef5a878fd3ae899f3ab7e5a';
  let storedUserCommitment2: string;
  let storedBackupCommitment2: string;
  let storedBitgoCommitment2: string;
  let storedBitgoVrfOpenings: DklsTypes.DeserializedMessages | undefined;

  let bgUrl: string;
  let tssUtils: ECDSAUtils.EcdsaVrfMPCv2Utils;
  let wallet: Wallet;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;
  let bitgoVrfShare: VrfKeyshareDecoded | undefined;
  let bitGoGgpKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let constants: { mpc: { bitgoPublicKey: string; bitgoMPCv2PublicKey: string } };
  let bitgoGpgPrvKey: { partyId: number; gpgKey: string };
  let userGpgPubKey: { partyId: number; gpgKey: string };
  let backupGpgPubKey: { partyId: number; gpgKey: string };

  beforeEach(async function () {
    nock.cleanAll();
    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, enterpriseId, bitGoGgpKey);
    nock(bgUrl).get('/api/v1/client/constants').times(16).reply(200, { ttl: 3600, constants });
  });

  before(async function () {
    // Allow secp256k1 GPG keys used by these fixtures (the full suite enables this
    // globally via sibling test files; set it here so this file also runs in isolation).
    openpgp.config.rejectCurves = new Set();
    bitGoGgpKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
      curve: 'secp256k1',
    });
    constants = {
      mpc: {
        bitgoPublicKey: bitGoGgpKey.publicKey,
        bitgoMPCv2PublicKey: bitGoGgpKey.publicKey,
      },
    };

    bitgoGpgPrvKey = {
      partyId: 2,
      gpgKey: bitGoGgpKey.privateKey,
    };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      enterprise: enterpriseId,
      coin: coinName,
      coinSpecific: {},
      multisigType: 'tss',
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaVrfMPCv2Utils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  it('should generate TSS MPCv2 keys with VRF keyshares for safe roots', async function () {
    const bitgoSession = new DklsDkg.Dkg(3, 2, 2);
    const bitgoVrfSession = new DklsVrf.VrfDkg(3, 2, 2);

    const round1Nock = await nockKeyGenRound1(bitgoSession, bitgoVrfSession);
    const round2Nock = await nockKeyGenRound2(bitgoSession, bitgoVrfSession);
    const round3Nock = await nockKeyGenRound3(bitgoSession, bitgoVrfSession);
    const addKeyNock = await nockAddKeyChain(coinName, 3);
    const params = {
      passphrase: 'test',
      enterprise: enterpriseId,
      originalPasscodeEncryptionCode: '123456',
      safeId,
    };
    const { userKeychain, backupKeychain, bitgoKeychain } = await tssUtils.createKeychains(params);
    assert.ok(round1Nock.isDone());
    assert.ok(round2Nock.isDone());
    assert.ok(round3Nock.isDone());
    assert.ok(addKeyNock.isDone());

    assert.ok(userKeychain);
    assert.equal(userKeychain.source, 'user');
    assert.ok(userKeychain.commonKeychain);
    assert.ok(ECDSAUtils.EcdsaMPCv2Utils.validateCommonKeychainPublicKey(userKeychain.commonKeychain));
    assert.ok(userKeychain.encryptedPrv);
    assert.ok(backupKeychain);
    assert.ok(backupKeychain.encryptedPrv);
    assert.ok(bitgoKeychain);

    // The VRF DKG must have completed on the (simulated) HSM side as well.
    assert.ok(bitgoVrfShare, 'BitGo VRF keyshare was not produced');

    assert.ok(userKeychain.encryptedPrv);
    const decryptedUserPrv = await bitgo.decrypt({ input: userKeychain.encryptedPrv, password: params.passphrase });
    const userEnvelope = decode(Buffer.from(decryptedUserPrv, 'base64'));
    assert.equal(userEnvelope.version, 1);
    assert.ok(userEnvelope.prvKeyShare);
    assert.ok(userEnvelope.vrf);
    const userKeyShare = Buffer.from(userEnvelope.prvKeyShare);
    assert.equal(DklsTypes.getCommonKeychain(userKeyShare), userKeychain.commonKeychain);
    const userVrfShare = decode(userEnvelope.vrf);
    assert.equal(userVrfShare.party_id, 0);
    // All three parties' VRF DKGs agree on the VRF public key.
    assert.equal(
      Buffer.from(userVrfShare.public_key).toString('hex'),
      Buffer.from(bitgoVrfShare.public_key).toString('hex')
    );

    assert.ok(backupKeychain.encryptedPrv);
    const decryptedBackupPrv = await bitgo.decrypt({
      input: backupKeychain.encryptedPrv,
      password: params.passphrase,
    });
    const backupEnvelope = decode(Buffer.from(decryptedBackupPrv, 'base64'));
    assert.equal(backupEnvelope.version, 1);
    const backupVrfShare = decode(backupEnvelope.vrf);
    assert.equal(backupVrfShare.party_id, 1);
    assert.equal(
      Buffer.from(backupVrfShare.public_key).toString('hex'),
      Buffer.from(bitgoVrfShare.public_key).toString('hex')
    );
    assert.notDeepStrictEqual(userVrfShare.d_i, backupVrfShare.d_i);

    // reducedEncryptedPrv takes the same envelope and carries VRF material.
    const reducedEncryptedPrv = (userKeychain as Keychain & { reducedEncryptedPrv?: string }).reducedEncryptedPrv;
    assert.ok(reducedEncryptedPrv);
    const reducedDecrypted = await bitgo.decrypt({ input: reducedEncryptedPrv, password: params.passphrase });
    const reducedEnvelope = decode(Buffer.from(reducedDecrypted, 'base64'));
    assert.equal(reducedEnvelope.version, 1);
    const reducedKeyShare = DklsTypes.getDecodedReducedKeyShare(Buffer.from(reducedEnvelope.prvKeyShare));
    assert.ok(reducedKeyShare.prv.length > 0);
    assert.ok(Buffer.from(reducedEnvelope.vrf).length > 0);

    // common keychains agree across parties
    assert.equal(userKeychain.commonKeychain, backupKeychain.commonKeychain);
    assert.equal(userKeychain.commonKeychain, bitgoKeychain.commonKeychain);
  });

  async function nockGetBitgoPublicKeyBasedOnFeatureFlags(
    coin: string,
    enterpriseId: string,
    bitgoGpgKeyPair: openpgp.SerializedKeyPair<string>
  ): Promise<BitgoGPGPublicKey> {
    const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
      name: 'irrelevant',
      publicKey: bitgoGpgKeyPair.publicKey,
      mpcv2PublicKey: bitgoGpgKeyPair.publicKey,
      enterpriseId,
    };
    nock(bgUrl).get(`/api/v2/${coin}/tss/pubkey`).query({ enterpriseId }).reply(200, bitgoGPGPublicKeyResponse);

    return bitgoGPGPublicKeyResponse;
  }

  async function nockKeyGenRound1(bitgoSession: DklsDkg.Dkg, bitgoVrfSession: DklsVrf.VrfDkg, times = 1) {
    return nock(bgUrl)
      .post(`/api/v2/mpc/generatekey`, (body) => body.round === 'MPCv2-R1')
      .times(times)
      .reply(
        200,
        async (
          uri,
          { payload }: { payload: MPCv2KeyGenRound1Request & VrfKeyGenRequestFields }
        ): Promise<MPCv2KeyGenRound1Response & VrfKeyGenResponseFields> => {
          const { userGpgPublicKey, backupGpgPublicKey, userMsg1, backupMsg1, userVrfMsg1, backupVrfMsg1 } = payload;
          assert.ok(userVrfMsg1, 'userVrfMsg1 must be present on a safe keygen round 1 payload');
          assert.ok(backupVrfMsg1, 'backupVrfMsg1 must be present on a safe keygen round 1 payload');
          userGpgPubKey = {
            partyId: 0,
            gpgKey: userGpgPublicKey,
          };
          backupGpgPubKey = {
            partyId: 1,
            gpgKey: backupGpgPublicKey,
          };

          const bitgoBroadcastMsg1Unsigned = await bitgoSession.initDkg();
          const bitgoMsgs1Signed = await DklsComms.encryptAndAuthOutgoingMessages(
            { broadcastMessages: [DklsTypes.serializeBroadcastMessage(bitgoBroadcastMsg1Unsigned)], p2pMessages: [] },
            [],
            [bitgoGpgPrvKey]
          );
          const bitgoMsg1 = bitgoMsgs1Signed.broadcastMessages.find((m) => m.from === 2);
          assert.ok(bitgoMsg1, 'bitgoMsg1 not found');

          const round1IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [],
              broadcastMessages: [
                { from: 0, payload: userMsg1 },
                { from: 1, payload: backupMsg1 },
              ],
            },
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const round2Messages = DklsTypes.serializeMessages(
            bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round1IncomingMsgs))
          );

          const round2SignedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
            round2Messages,
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const bitgoToUserMsg2 = round2SignedMessages.p2pMessages.find((m) => m.to === 0);
          const bitgoToBackupMsg2 = round2SignedMessages.p2pMessages.find((m) => m.to === 1);
          assert.ok(bitgoToUserMsg2, 'bitgoToUserMsg2 not found');
          assert.ok(bitgoToBackupMsg2, 'bitgoToBackupMsg2 not found');
          assert.ok(bitgoToUserMsg2.commitment, 'bitgoToUserMsg2.commitment not found');

          storedBitgoCommitment2 = bitgoToUserMsg2?.commitment;

          // VRF DKG: BitGo commits, then consumes user and backup commitments.
          const bitgoVrfMsg1Unsigned = await bitgoVrfSession.initDkg();
          const userVrfCommitments = deserializeVrfMessages(userVrfMsg1, 2);
          const backupVrfCommitments = deserializeVrfMessages(backupVrfMsg1, 2);
          assert.equal(userVrfCommitments.broadcastMessages.length, 1);
          assert.equal(userVrfCommitments.broadcastMessages[0].from, 0);
          assert.equal(backupVrfCommitments.broadcastMessages.length, 1);
          assert.equal(backupVrfCommitments.broadcastMessages[0].from, 1);
          storedBitgoVrfOpenings = await bitgoVrfSession.handleIncomingMessages({
            broadcastMessages: [...userVrfCommitments.broadcastMessages, ...backupVrfCommitments.broadcastMessages],
            p2pMessages: [],
          });
          // BitGo's openings are addressed to each party, itself included.
          assert.equal(storedBitgoVrfOpenings.p2pMessages.length, 3);

          return {
            sessionId: 'testid' as NonEmptyString,
            bitgoMsg1: { from: 2, ...bitgoMsg1.payload },
            bitgoToBackupMsg2: {
              from: 2,
              to: 1,
              encryptedMessage: bitgoToBackupMsg2.payload.encryptedMessage,
              signature: bitgoToBackupMsg2.payload.signature,
            },
            bitgoToUserMsg2: {
              from: 2,
              to: 0,
              encryptedMessage: bitgoToUserMsg2.payload.encryptedMessage,
              signature: bitgoToUserMsg2.payload.signature,
            },
            walletGpgPubKeySigs: 'something' as NonEmptyString,
            bitgoVrfMsg1: serializeVrfMessages(bitgoVrfMsg1Unsigned),
          };
        }
      );
  }

  async function nockKeyGenRound2(bitgoSession: DklsDkg.Dkg, bitgoVrfSession: DklsVrf.VrfDkg, times = 1) {
    return nock(bgUrl)
      .post(`/api/v2/mpc/generatekey`, (body) => body.round === 'MPCv2-R2')
      .times(times)
      .reply(
        200,
        async (
          uri,
          { payload }: { payload: MPCv2KeyGenRound2Request & VrfKeyGenRequestFields }
        ): Promise<MPCv2KeyGenRound2Response & VrfKeyGenResponseFields> => {
          const { sessionId, userMsg2, backupMsg2, userCommitment2, backupCommitment2, userVrfMsg2, backupVrfMsg2 } =
            payload;
          assert.ok(userVrfMsg2, 'userVrfMsg2 must be present on a safe keygen round 2 payload');
          assert.ok(backupVrfMsg2, 'backupVrfMsg2 must be present on a safe keygen round 2 payload');
          storedUserCommitment2 = userCommitment2;
          storedBackupCommitment2 = backupCommitment2;
          const round2IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [
                {
                  from: userMsg2.from,
                  to: userMsg2.to,
                  payload: { signature: userMsg2.signature, encryptedMessage: userMsg2.encryptedMessage },
                },
                {
                  from: backupMsg2.from,
                  to: backupMsg2.to,
                  payload: { signature: backupMsg2.signature, encryptedMessage: backupMsg2.encryptedMessage },
                },
              ],
              broadcastMessages: [],
            },
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const round3Messages = DklsTypes.serializeMessages(
            bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round2IncomingMsgs))
          );

          const round3SignedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
            round3Messages,
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const bitgoToUserMsg3 = round3SignedMessages.p2pMessages.find((m) => m.to === 0);
          const bitgoToBackupMsg3 = round3SignedMessages.p2pMessages.find((m) => m.to === 1);
          assert.ok(bitgoToUserMsg3, 'bitgoToUserMsg3 not found');
          assert.ok(bitgoToBackupMsg3, 'bitgoToBackupMsg3 not found');

          // VRF DKG: BitGo consumes the openings addressed to it (its own included) and finalizes.
          const userOpenings = deserializeVrfMessages(userVrfMsg2, 2).p2pMessages;
          const backupOpenings = deserializeVrfMessages(backupVrfMsg2, 2).p2pMessages;
          assert.ok(userOpenings.some((m) => m.from === 0 && m.to === 2));
          assert.ok(backupOpenings.some((m) => m.from === 1 && m.to === 2));
          assert.ok(storedBitgoVrfOpenings, 'BitGo VRF openings from round 1 not found');
          await bitgoVrfSession.handleIncomingMessages({
            broadcastMessages: [],
            p2pMessages: [
              ...userOpenings,
              ...backupOpenings,
              ...storedBitgoVrfOpenings.p2pMessages.filter((m) => m.to === 2),
            ],
          });
          const share = decode(bitgoVrfSession.getKeyShare());
          assert.equal(share.party_id, 2);
          bitgoVrfShare = share;

          return {
            sessionId,
            bitgoCommitment2: storedBitgoCommitment2 as NonEmptyString,
            bitgoToUserMsg3: {
              from: 2,
              to: 0,
              encryptedMessage: bitgoToUserMsg3.payload.encryptedMessage,
              signature: bitgoToUserMsg3.payload.signature,
            },
            bitgoToBackupMsg3: {
              from: 2,
              to: 1,
              encryptedMessage: bitgoToBackupMsg3.payload.encryptedMessage,
              signature: bitgoToBackupMsg3.payload.signature,
            },
            // BitGo's full opening batch, so user (0) and backup (1) can each pick theirs.
            bitgoVrfMsg2: serializeVrfMessages(storedBitgoVrfOpenings),
          };
        }
      );
  }

  async function nockKeyGenRound3(bitgoSession: DklsDkg.Dkg, bitgoVrfSession: DklsVrf.VrfDkg, times = 1) {
    return nock(bgUrl)
      .post(`/api/v2/mpc/generatekey`, (body) => body.round === 'MPCv2-R3')
      .times(times)
      .reply(
        200,
        async (uri, { payload }: { payload: MPCv2KeyGenRound3Request }): Promise<MPCv2KeyGenRound3Response> => {
          const { sessionId, userMsg3, userMsg4, backupMsg3, backupMsg4 } = payload;
          // The VRF DKG has no messages on round 3; it already finalized after round 2.
          assert.ok(bitgoVrfShare, 'BitGo VRF keyshare should be complete before round 3');

          const round3IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [
                {
                  from: userMsg3.from,
                  to: userMsg3.to,
                  payload: { signature: userMsg3.signature, encryptedMessage: userMsg3.encryptedMessage },
                  commitment: storedUserCommitment2,
                },
                {
                  from: backupMsg3.from,
                  to: backupMsg3.to,
                  payload: { signature: backupMsg3.signature, encryptedMessage: backupMsg3.encryptedMessage },
                  commitment: storedBackupCommitment2,
                },
              ],
              broadcastMessages: [],
            },
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const round4Messages = DklsTypes.serializeMessages(
            bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round3IncomingMsgs))
          );
          const round4SignedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
            round4Messages,
            [],
            [bitgoGpgPrvKey]
          );
          const bitgoMsg4 = round4SignedMessages.broadcastMessages.find((m) => m.from === 2);
          assert.ok(bitgoMsg4, 'bitgoMsg4 not found');

          const round4IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [],
              broadcastMessages: [
                {
                  from: userMsg4.from,
                  payload: { signature: userMsg4.signature, message: userMsg4.message },
                },
                {
                  from: backupMsg4.from,

                  payload: { signature: backupMsg4.signature, message: backupMsg4.message },
                },
              ],
            },
            [userGpgPubKey, backupGpgPubKey],
            []
          );
          bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round4IncomingMsgs));
          const keyShare = bitgoSession.getKeyShare();
          const commonKeychain = DklsTypes.getCommonKeychain(keyShare);

          return {
            sessionId,
            commonKeychain: commonKeychain as NonEmptyString,
            bitgoMsg4: { from: 2, ...bitgoMsg4.payload },
          };
        }
      );
  }

  async function nockAddKeyChain(coin: string, times = 1) {
    return nock('https://bitgo.fakeurl')
      .post(`/api/v2/${coin}/key`, (body) => body.keyType === 'tss' && body.isMPCv2 && body.safeId === safeId)
      .times(times)
      .reply(200, async (uri, requestBody: AddKeychainOptions) => {
        const key = {
          id: requestBody.source,
          source: requestBody.source,
          type: requestBody.keyType,
          commonKeychain: requestBody.commonKeychain,
          encryptedPrv: requestBody.encryptedPrv,
        };
        // nock gets
        nock('https://bitgo.fakeurl').get(`/api/v2/${coin}/key/${requestBody.source}`).reply(200, key);
        return key;
      });
  }
});
