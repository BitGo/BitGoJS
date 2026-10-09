import assert from 'assert';
import * as pgp from 'openpgp';
import * as sinon from 'sinon';
import { EddsaMPSDkg, MPSComms, MPSUtil, MPSTypes, MpsDerive, MpsVrf, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import {
  EddsaMPCv2DeriveRound1Request,
  EddsaMPCv2DeriveRound2Request,
  EddsaMPCv2SignedMessage,
  KeyCurveEnum,
  KeyGenTypeEnum,
  MPCv2KeyGenStateEnum,
} from '@bitgo/public-types';
import { decode } from 'cbor-x';
import * as t from 'io-ts';

import { EddsaMPCv2Utils, BitGoBase, IBaseCoin, Keychain } from '../../../../../../src';
import { decodeWithCodec } from '../../../../../../src/bitgo/utils/codecs';
import { buildSafeMpcKeyEnvelopes } from '../../../../../../src/bitgo/utils/tss/keyShareEnvelope';
import { EddsaVrfMPCv2Utils } from '../../../../../../src/bitgo/utils/tss/eddsa/eddsaVrfMPCv2';
import { MPCv2PartiesEnum } from '../../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';
import { generateGPGKeyPair } from '../../../../../../src/bitgo/utils/opengpgUtils';

const Uint8ArrayCodec = new t.Type<Uint8Array, Uint8Array, unknown>(
  'Uint8Array',
  (value): value is Uint8Array => value instanceof Uint8Array,
  (value, context) => (value instanceof Uint8Array ? t.success(value) : t.failure(value, context)),
  t.identity
);

const VrfEnvelope = t.type({
  version: t.literal(1),
  prvKeyShare: Uint8ArrayCodec,
  vrf: Uint8ArrayCodec,
});

type AddedKeychainParams = {
  source?: string;
  encryptedPrv?: string;
  reducedEncryptedPrv?: string;
  safeId?: string;
  parent?: string;
  derivedFromParentWithPath?: string;
  commonKeychain?: string;
  isMPCv2?: boolean;
  keyType?: string;
};

function decodeVrfEnvelope(encoded: Buffer): t.TypeOf<typeof VrfEnvelope> {
  return decodeWithCodec(VrfEnvelope, decode(encoded), 'VRF key envelope');
}

function createKeychainFixture() {
  const encryptedInputs: string[] = [];
  const addedKeychains: AddedKeychainParams[] = [];
  const post = sinon.stub();
  const bitgo = {
    getEnv: () => 'dev',
    url: (path: string) => path,
    post,
    encrypt: async (params: { input: string }): Promise<string> => {
      encryptedInputs.push(params.input);
      return `encrypted:${params.input}`;
    },
  } as unknown as BitGoBase;
  const keychains = {
    add: async (params: AddedKeychainParams): Promise<Keychain> => {
      addedKeychains.push(params);
      return { id: `${params.source}-child`, type: 'tss', encryptedPrv: params.encryptedPrv };
    },
  };
  const baseCoin = {
    keychains: () => keychains,
  } as unknown as IBaseCoin;
  return { bitgo, baseCoin, post, encryptedInputs, addedKeychains };
}

describe('EdDSA MPCv2 VRF root material', function () {
  it('encodes signing and VRF shares in both full and reduced envelopes', function () {
    const privateMaterial = Buffer.from('signing-share');
    const reducedPrivateMaterial = Buffer.from('reduced-signing-share');
    const vrfKeyShare = Buffer.from('vrf-share');

    const { envelope, reducedEnvelope } = buildSafeMpcKeyEnvelopes(
      privateMaterial,
      reducedPrivateMaterial,
      vrfKeyShare
    );
    const decodedEnvelope = decodeVrfEnvelope(envelope);
    const decodedReducedEnvelope = decodeVrfEnvelope(reducedEnvelope);

    assert.deepStrictEqual(Buffer.from(decodedEnvelope.prvKeyShare), privateMaterial);
    assert.deepStrictEqual(Buffer.from(decodedEnvelope.vrf), vrfKeyShare);
    assert.deepStrictEqual(Buffer.from(decodedReducedEnvelope.prvKeyShare), reducedPrivateMaterial);
    assert.deepStrictEqual(Buffer.from(decodedReducedEnvelope.vrf), vrfKeyShare);
  });

  it('keeps ordinary MPCv2 participant material as bare base64', async function () {
    const { bitgo, baseCoin, encryptedInputs, addedKeychains } = createKeychainFixture();
    const utils = new EddsaMPCv2Utils(bitgo, baseCoin);
    const privateMaterial = Buffer.from('signing-share');
    const reducedPrivateMaterial = Buffer.from('reduced-signing-share');

    await utils.createParticipantKeychain(
      MPCv2PartiesEnum.USER,
      'common-keychain',
      privateMaterial,
      reducedPrivateMaterial,
      'passphrase'
    );

    assert.deepStrictEqual(encryptedInputs, [
      privateMaterial.toString('base64'),
      reducedPrivateMaterial.toString('base64'),
    ]);
    assert.strictEqual(addedKeychains[0].encryptedPrv, `encrypted:${privateMaterial.toString('base64')}`);
    assert.strictEqual(addedKeychains[0].safeId, undefined);
  });

  it('rejects a public-only backup outside a safe child derivation', async function () {
    const { bitgo, baseCoin, encryptedInputs, addedKeychains } = createKeychainFixture();
    const utils = new EddsaMPCv2Utils(bitgo, baseCoin);

    await assert.rejects(
      utils.createParticipantKeychain(MPCv2PartiesEnum.BACKUP, 'common-keychain', undefined, undefined, 'passphrase'),
      /Private material is required for backup keychain/
    );
    assert.deepStrictEqual(encryptedInputs, []);
    assert.deepStrictEqual(addedKeychains, []);
  });

  it('encrypts the VRF envelope and tags the keychain with safeId', async function () {
    const encryptedInputs: string[] = [];
    const addedKeychains: AddedKeychainParams[] = [];
    const bitgo = {
      encrypt: async (params: { input: string }): Promise<string> => {
        encryptedInputs.push(params.input);
        return `encrypted:${params.input}`;
      },
    } as unknown as BitGoBase;
    const keychains = {
      add: async (params: AddedKeychainParams): Promise<Keychain> => {
        addedKeychains.push(params);
        return { id: 'user-key' } as unknown as Keychain;
      },
    };
    const baseCoin = {
      keychains: () => keychains,
    } as unknown as IBaseCoin;
    const utils = new EddsaMPCv2Utils(bitgo, baseCoin);
    const { envelope, reducedEnvelope } = buildSafeMpcKeyEnvelopes(
      Buffer.from('signing-share'),
      Buffer.from('reduced-signing-share'),
      Buffer.from('vrf-share')
    );

    await utils.createParticipantKeychain(
      MPCv2PartiesEnum.USER,
      'common-keychain',
      envelope,
      reducedEnvelope,
      'passphrase',
      undefined,
      undefined,
      undefined,
      undefined,
      'safe-id'
    );

    assert.deepStrictEqual(encryptedInputs[0], envelope.toString('base64'));
    assert.strictEqual(addedKeychains[0].safeId, 'safe-id');
    const decoded = decodeVrfEnvelope(Buffer.from(encryptedInputs[0], 'base64'));
    assert.deepStrictEqual(Buffer.from(decoded.vrf), Buffer.from('vrf-share'));
  });

  it('tags the BitGo keychain with safeId and does not encrypt', async function () {
    const encryptedInputs: string[] = [];
    const addedKeychains: AddedKeychainParams[] = [];
    const bitgo = {
      encrypt: async (params: { input: string }): Promise<string> => {
        encryptedInputs.push(params.input);
        return `encrypted:${params.input}`;
      },
    } as unknown as BitGoBase;
    const keychains = {
      add: async (params: AddedKeychainParams): Promise<Keychain> => {
        addedKeychains.push(params);
        return { id: 'bitgo-key' } as unknown as Keychain;
      },
    };
    const baseCoin = {
      keychains: () => keychains,
    } as unknown as IBaseCoin;
    const utils = new EddsaMPCv2Utils(bitgo, baseCoin);

    await utils.createParticipantKeychain(
      MPCv2PartiesEnum.BITGO,
      'common-keychain',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'safe-id'
    );

    assert.deepStrictEqual(encryptedInputs, []);
    assert.strictEqual(addedKeychains[0].source, 'bitgo');
    assert.strictEqual(addedKeychains[0].safeId, 'safe-id');
    assert.strictEqual(addedKeychains[0].encryptedPrv, undefined);
  });

  describe('safe root keygen against the HSM contract', function () {
    const KeyGenRequest = t.intersection([
      t.type({ enterprise: t.string, type: t.string, curveType: t.string, round: t.string }),
      t.partial({ safeId: t.string, payload: t.UnknownRecord }),
    ]);
    const R1Payload = t.intersection([
      t.type({
        userGpgPublicKey: t.string,
        backupGpgPublicKey: t.string,
        userMsg1: EddsaMPCv2SignedMessage,
        backupMsg1: EddsaMPCv2SignedMessage,
      }),
      t.type({
        userVrfMsg1: EddsaMPCv2SignedMessage,
        backupVrfMsg1: EddsaMPCv2SignedMessage,
      }),
    ]);
    const R2Payload = t.intersection([
      t.type({ sessionId: t.string, userMsg2: EddsaMPCv2SignedMessage, backupMsg2: EddsaMPCv2SignedMessage }),
      t.type({
        userVrfMsg2: EddsaMPCv2SignedMessage,
        backupVrfMsg2: EddsaMPCv2SignedMessage,
      }),
    ]);

    let bitgoPrivateKey: pgp.PrivateKey;
    let bitgoPublicKey: pgp.Key;

    before(async function () {
      const bitgoGpg = await generateGPGKeyPair('ed25519');
      bitgoPrivateKey = await pgp.readPrivateKey({ armoredKey: bitgoGpg.privateKey });
      bitgoPublicKey = await pgp.readKey({ armoredKey: bitgoGpg.publicKey });
    });

    afterEach(function () {
      sinon.restore();
    });

    /** BitGo's side of the ceremony: signing DKG + VRF DKG, verifying every client signature like the HSM does. */
    async function keygenWithHsmPeer(
      fault?: 'bitgo-vrf-msg1-signature' | 'bitgo-vrf-opening-signature' | 'missing-opening'
    ) {
      const { bitgo, baseCoin, post, encryptedInputs, addedKeychains } = createKeychainFixture();
      const utils = new EddsaVrfMPCv2Utils(bitgo, baseCoin);
      sinon.stub(utils, 'getBitgoGpgPubkeyBasedOnFeatureFlags').resolves({
        mpcv2PublicKey: bitgoPublicKey,
        eddsaMpcv2PublicKey: bitgoPublicKey,
        redpallasMpcv2PublicKey: undefined,
      });

      const bitgoDkg = new EddsaMPSDkg.DKG(3, 2, MPCv2PartiesEnum.BITGO);
      const bitgoVrf = new MpsVrf.VrfDkg(3, 2, MPCv2PartiesEnum.BITGO);
      const requests: Record<string, unknown>[] = [];
      let bitgoMsg2: MPSTypes.DeserializedMessage | undefined;
      let userGpgKey: pgp.Key | undefined;
      let backupGpgKey: pgp.Key | undefined;
      let userCommitment: Uint8Array | undefined;
      let backupCommitment: Uint8Array | undefined;

      const signAsBitgo = (payload: Uint8Array) => MPSComms.detachSignMpsMessage(payload, bitgoPrivateKey);
      const encryptTo = async (recipient: pgp.Key, plaintext: Uint8Array): Promise<EddsaMPCv2SignedMessage> => {
        const { signature } = await signAsBitgo(plaintext);
        const message = await pgp.encrypt({
          message: await pgp.createMessage({ binary: plaintext }),
          encryptionKeys: recipient,
          format: 'armored',
        });
        return {
          message,
          signature:
            fault === 'bitgo-vrf-opening-signature' ? (await signAsBitgo(new Uint8Array([9]))).signature : signature,
        };
      };

      post.callsFake(() => ({
        send: (rawBody: unknown) => ({
          result: async () => {
            const body = decodeWithCodec(KeyGenRequest, rawBody, 'EdDSA keygen request');
            assert.strictEqual(body.type, KeyGenTypeEnum.MPCv2);
            assert.strictEqual(body.curveType, KeyCurveEnum.EdDSA);
            // WP only reads safeId in round 1; round 2 is routed by the stored session.
            assert.strictEqual(body.safeId, body.round === MPCv2KeyGenStateEnum['MPCv2-R1'] ? 'safe-id' : undefined);
            requests.push({ round: body.round, ...body.payload });

            if (body.round === MPCv2KeyGenStateEnum['MPCv2-R1']) {
              const payload = decodeWithCodec(R1Payload, body.payload, 'EdDSA keygen round 1');
              userGpgKey = await pgp.readKey({ armoredKey: payload.userGpgPublicKey });
              backupGpgKey = await pgp.readKey({ armoredKey: payload.backupGpgPublicKey });
              const [userPk, backupPk] = await Promise.all([
                MPSComms.extractEd25519PublicKey(userGpgKey),
                MPSComms.extractEd25519PublicKey(backupGpgKey),
              ]);
              const [, bitgoSk] = await MPSComms.extractEd25519KeyPair(bitgoPrivateKey);

              const userMsg1 = await MPSComms.verifyMpsMessage(payload.userMsg1, userGpgKey);
              const backupMsg1 = await MPSComms.verifyMpsMessage(payload.backupMsg1, backupGpgKey);
              // The VRF messages must be signed by the same party key as userMsg1/backupMsg1.
              userCommitment = new Uint8Array(await MPSComms.verifyMpsMessage(payload.userVrfMsg1, userGpgKey));
              backupCommitment = new Uint8Array(await MPSComms.verifyMpsMessage(payload.backupVrfMsg1, backupGpgKey));
              await assert.rejects(MPSComms.verifyMpsMessage(payload.userVrfMsg1, backupGpgKey));

              await bitgoDkg.initDkg(bitgoSk, [userPk, backupPk]);
              const bitgoRawMsg1 = bitgoDkg.getFirstMessage();
              [bitgoMsg2] = bitgoDkg.handleIncomingMessages([
                { from: MPCv2PartiesEnum.USER, payload: new Uint8Array(userMsg1) },
                { from: MPCv2PartiesEnum.BACKUP, payload: new Uint8Array(backupMsg1) },
                bitgoRawMsg1,
              ]);

              const [bitgoVrfCommitment] = (await bitgoVrf.initDkg()).broadcastMessages;
              const signedVrfMsg1 = await signAsBitgo(bitgoVrfCommitment.payload);
              return {
                sessionId: 'session-id',
                bitgoMsg1: await signAsBitgo(bitgoRawMsg1.payload),
                bitgoVrfMsg1:
                  fault === 'bitgo-vrf-msg1-signature'
                    ? { ...signedVrfMsg1, message: Buffer.from('tampered').toString('base64') }
                    : signedVrfMsg1,
              };
            }

            assert.strictEqual(body.round, MPCv2KeyGenStateEnum['MPCv2-R2']);
            const payload = decodeWithCodec(R2Payload, body.payload, 'EdDSA keygen round 2');
            assert.ok(userGpgKey && backupGpgKey && userCommitment && backupCommitment && bitgoMsg2);
            assert.deepStrictEqual(Object.keys(payload).sort(), [
              'backupMsg2',
              'backupVrfMsg2',
              'sessionId',
              'userMsg2',
              'userVrfMsg2',
            ]);

            const userMsg2 = await MPSComms.verifyMpsMessage(payload.userMsg2, userGpgKey);
            const backupMsg2 = await MPSComms.verifyMpsMessage(payload.backupMsg2, backupGpgKey);
            const userOpening = new Uint8Array(await MPSComms.verifyMpsMessage(payload.userVrfMsg2, userGpgKey));
            const backupOpening = new Uint8Array(await MPSComms.verifyMpsMessage(payload.backupVrfMsg2, backupGpgKey));

            bitgoDkg.handleIncomingMessages([
              { from: MPCv2PartiesEnum.USER, payload: new Uint8Array(userMsg2) },
              { from: MPCv2PartiesEnum.BACKUP, payload: new Uint8Array(backupMsg2) },
              bitgoMsg2,
            ]);

            const openings = await bitgoVrf.handleIncomingMessages({
              broadcastMessages: [
                { from: MPCv2PartiesEnum.USER, payload: userCommitment },
                { from: MPCv2PartiesEnum.BACKUP, payload: backupCommitment },
              ],
              p2pMessages: [],
            });
            const toUser = openings.p2pMessages.find(({ to }) => to === MPCv2PartiesEnum.USER);
            const toBackup = openings.p2pMessages.find(({ to }) => to === MPCv2PartiesEnum.BACKUP);
            assert.ok(toUser && toBackup);
            await bitgoVrf.handleIncomingMessages({
              broadcastMessages: [],
              p2pMessages: [
                { from: MPCv2PartiesEnum.USER, to: MPCv2PartiesEnum.BITGO, payload: userOpening },
                { from: MPCv2PartiesEnum.BACKUP, to: MPCv2PartiesEnum.BITGO, payload: backupOpening },
              ],
            });

            return {
              sessionId: payload.sessionId,
              commonPublicKeychain: bitgoDkg.getCommonKeychain(),
              bitgoMsg2: await signAsBitgo(bitgoMsg2.payload),
              ...(fault === 'missing-opening'
                ? {}
                : { bitgoVrfMsgToUser: await encryptTo(userGpgKey, toUser.payload) }),
              bitgoVrfMsgToBackup: await encryptTo(backupGpgKey, toBackup.payload),
            };
          },
        }),
      }));

      await utils.createKeychains({
        passphrase: 'passphrase',
        enterprise: 'enterprise-id',
        safeId: 'safe-id',
      });
      return { requests, encryptedInputs, addedKeychains };
    }

    it('signs VRF messages with the party keys and decrypts BitGo openings without handling the HSM VRF state', async function () {
      const { requests, encryptedInputs, addedKeychains } = await keygenWithHsmPeer();

      assert.deepStrictEqual(
        requests.map(({ round }) => round),
        [MPCv2KeyGenStateEnum['MPCv2-R1'], MPCv2KeyGenStateEnum['MPCv2-R2']]
      );
      // WP keeps the HSM VRF state between rounds, so neither client round carries it.
      for (const request of requests) {
        assert.strictEqual('bitgoEncryptedVrfDkgState' in request, false);
      }

      // Both client roots end up with a signing share and a VRF share, tagged with the safe.
      assert.deepStrictEqual(addedKeychains.map(({ source }) => source).sort(), ['backup', 'bitgo', 'user']);
      for (const keychain of addedKeychains) {
        assert.strictEqual(keychain.safeId, 'safe-id');
      }
      // User and backup each encrypt a full and a reduced envelope; every one carries a VRF share, and
      // the two parties' shares differ. Order-independent: the roots are registered concurrently.
      const vrfShares = new Set(
        encryptedInputs.map((input) => {
          const { vrf, prvKeyShare } = decodeVrfEnvelope(Buffer.from(input, 'base64'));
          assert.ok(vrf.length > 0);
          assert.ok(prvKeyShare.length > 0);
          return Buffer.from(vrf).toString('hex');
        })
      );
      assert.strictEqual(encryptedInputs.length, 4);
      assert.strictEqual(vrfShares.size, 2);
    });

    it('rejects a BitGo VRF round 1 message whose signature does not verify', async function () {
      await assert.rejects(keygenWithHsmPeer('bitgo-vrf-msg1-signature'), /signature|verification|signed/i);
    });

    it('rejects a BitGo VRF opening whose signature does not verify', async function () {
      await assert.rejects(keygenWithHsmPeer('bitgo-vrf-opening-signature'), /signature|verification|signed/i);
    });

    it('fails when the HSM omits a BitGo VRF opening in round 2', async function () {
      await assert.rejects(keygenWithHsmPeer('missing-opening'), /VRF message to user/);
    });
  });
});

describe('EdDSA safe-child MPS derivation', function () {
  let userSigningShare: Buffer;
  let userVrfShare: Buffer;
  let bitgoSigningShare: Buffer;
  let bitgoVrfShare: Buffer;
  let bitgoPrivateKey: pgp.PrivateKey;
  let bitgoPublicKey: pgp.Key;

  const sessionId = 'derive-session';
  const derivationIndex = 7;
  const path = "m/7'";
  const Request = t.intersection([
    t.type({ enterprise: t.string, type: t.string, curveType: t.string, round: t.string, payload: t.unknown }),
    t.partial({ safeId: t.string }),
  ]);

  before(async function () {
    const signing = await MPSUtil.generateEdDsaDKGKeyShares();
    const vrf = await MpsVrfUtils.generateVrfDKGKeyShares();
    userSigningShare = signing[MPCv2PartiesEnum.USER].getKeyShare();
    bitgoSigningShare = signing[MPCv2PartiesEnum.BITGO].getKeyShare();
    userVrfShare = vrf[MPCv2PartiesEnum.USER].getKeyShare();
    bitgoVrfShare = vrf[MPCv2PartiesEnum.BITGO].getKeyShare();
    const bitgoGpg = await generateGPGKeyPair('ed25519');
    bitgoPrivateKey = await pgp.readPrivateKey({ armoredKey: bitgoGpg.privateKey });
    bitgoPublicKey = await pgp.readKey({ armoredKey: bitgoGpg.publicKey });
  });

  async function deriveWithPeer(
    fault?: 'r1-signature' | 'r2-signature' | 'session' | 'commonKeychain',
    recordedKeychains?: AddedKeychainParams[]
  ) {
    const { bitgo, baseCoin, post, encryptedInputs, addedKeychains } = createKeychainFixture();
    const utils = new EddsaVrfMPCv2Utils(bitgo, baseCoin);
    sinon.stub(utils, 'getBitgoGpgPubkeyBasedOnFeatureFlags').resolves({
      mpcv2PublicKey: bitgoPublicKey,
      eddsaMpcv2PublicKey: bitgoPublicKey,
      redpallasMpcv2PublicKey: undefined,
    });
    const bitgoPeer = new MpsDerive.Derive(3, 2, MPCv2PartiesEnum.BITGO, bitgoSigningShare, bitgoVrfShare, path);
    let bitgoMsg2: Uint8Array | undefined;
    let userGpgPublicKey = '';
    let rounds = 0;
    post.callsFake((_url: string) => ({
      send: (rawBody: unknown) => ({
        result: async () => {
          const body = decodeWithCodec(Request, rawBody, 'EdDSA derive request');
          assert.strictEqual(_url, '/mpc/generatekey');
          assert.strictEqual(body.enterprise, 'enterprise-id');
          assert.strictEqual(body.type, KeyGenTypeEnum.MPCv2);
          assert.strictEqual(body.curveType, KeyCurveEnum.EdDSA);
          if (rounds++ === 0) {
            assert.strictEqual(body.round, MPCv2KeyGenStateEnum['MPCv2Derive-R1']);
            assert.strictEqual(body.safeId, 'safe-id');
            const request = decodeWithCodec(EddsaMPCv2DeriveRound1Request, body.payload, 'EdDSA derive round 1');
            assert.deepStrictEqual(Object.keys(request).sort(), [
              'derivationIndex',
              'parentKeyId',
              'userGpgPublicKey',
              'userMsg1',
            ]);
            assert.strictEqual(request.parentKeyId, 'bitgo-root-id');
            assert.strictEqual(request.derivationIndex, derivationIndex);
            userGpgPublicKey = request.userGpgPublicKey;
            const userGpgKey = await pgp.readKey({ armoredKey: request.userGpgPublicKey });
            const userPayload = await MPSComms.verifyMpsMessage(request.userMsg1, userGpgKey);
            const bitgoFirst = await bitgoPeer.initDerive();
            const [outgoing] = bitgoPeer.handleIncomingMessages([
              { from: MPCv2PartiesEnum.USER, payload: new Uint8Array(userPayload) },
            ]);
            assert.ok(outgoing);
            bitgoMsg2 = outgoing.payload;
            const signed = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoFirst.payload), bitgoPrivateKey);
            return {
              sessionId,
              bitgoMsg1:
                fault === 'r1-signature' ? { ...signed, message: Buffer.from('tampered').toString('base64') } : signed,
            };
          }
          assert.strictEqual(rounds, 2);
          assert.strictEqual(body.round, MPCv2KeyGenStateEnum['MPCv2Derive-R2']);
          assert.strictEqual(body.safeId, 'safe-id');
          const request = decodeWithCodec(EddsaMPCv2DeriveRound2Request, body.payload, 'EdDSA derive round 2');
          assert.deepStrictEqual(Object.keys(request).sort(), ['sessionId', 'userMsg2']);
          assert.strictEqual(request.sessionId, sessionId);
          const userPayload = await MPSComms.verifyMpsMessage(
            request.userMsg2,
            await pgp.readKey({ armoredKey: userGpgPublicKey })
          );
          assert.deepStrictEqual(
            bitgoPeer.handleIncomingMessages([{ from: MPCv2PartiesEnum.USER, payload: new Uint8Array(userPayload) }]),
            []
          );
          assert.ok(bitgoMsg2);
          const signed = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2), bitgoPrivateKey);
          const commonPublicKeychain = bitgoPeer.getCommonKeychain();
          return {
            sessionId: fault === 'session' ? 'different-session' : sessionId,
            commonPublicKeychain:
              fault === 'commonKeychain'
                ? `${commonPublicKeychain.slice(0, -1)}${commonPublicKeychain.endsWith('0') ? '1' : '0'}`
                : commonPublicKeychain,
            bitgoMsg2:
              fault === 'r2-signature' ? { ...signed, message: Buffer.from('tampered').toString('base64') } : signed,
          };
        },
      }),
    }));

    try {
      const result = await utils.createSafeChildKeychains({
        passphrase: 'passphrase',
        enterprise: 'enterprise-id',
        safeId: 'safe-id',
        parentKeyId: 'bitgo-root-id',
        derivationIndex,
        userRootKeyId: 'user-root-id',
        backupRootKeyId: 'backup-root-id',
        userRootKeyShare: userSigningShare,
        userRootVrfKeyShare: userVrfShare,
      });
      return { result, encryptedInputs, addedKeychains, bitgoPeer, rounds };
    } finally {
      recordedKeychains?.push(...addedKeychains);
    }
  }

  afterEach(function () {
    sinon.restore();
  });

  it('registers the child signing share and two public-only placeholders after the signed ceremony', async function () {
    const { result, encryptedInputs, addedKeychains, bitgoPeer, rounds } = await deriveWithPeer();
    assert.strictEqual(rounds, 2);
    assert.deepStrictEqual(addedKeychains.map(({ source }) => source).sort(), ['backup', 'bitgo', 'user']);
    assert.deepStrictEqual(
      [result.userKeychain.id, result.backupKeychain.id, result.bitgoKeychain.id],
      ['user-child', 'backup-child', 'bitgo-child']
    );
    for (const keychain of addedKeychains) {
      assert.strictEqual(keychain.safeId, 'safe-id');
      assert.strictEqual(keychain.derivedFromParentWithPath, path);
      assert.strictEqual(keychain.commonKeychain, bitgoPeer.getCommonKeychain());
      assert.strictEqual(keychain.keyType, 'tss');
      assert.strictEqual(keychain.isMPCv2, true);
    }
    const userChild = addedKeychains.find(({ source }) => source === 'user');
    const backupChild = addedKeychains.find(({ source }) => source === 'backup');
    const bitgoChild = addedKeychains.find(({ source }) => source === 'bitgo');
    assert.ok(userChild);
    assert.ok(backupChild);
    assert.ok(bitgoChild);
    assert.strictEqual(userChild.parent, 'user-root-id');
    assert.strictEqual(backupChild.parent, 'backup-root-id');
    assert.strictEqual(bitgoChild.parent, 'bitgo-root-id');
    assert.strictEqual(encryptedInputs.length, 2);
    assert.strictEqual(userChild.encryptedPrv, `encrypted:${encryptedInputs[0]}`);
    const signingShare = Buffer.from(result.userKeychain.encryptedPrv?.slice('encrypted:'.length) ?? '', 'base64');
    assert.deepStrictEqual(signingShare, Buffer.from(encryptedInputs[0], 'base64'));
    assert.notDeepStrictEqual(signingShare, userSigningShare);
    assert.notDeepStrictEqual(signingShare, bitgoPeer.getKeyShare());
    assert.strictEqual(userChild.reducedEncryptedPrv, undefined);
    const reduced = result.userKeychain.reducedEncryptedPrv;
    assert.ok(reduced);
    const reducedShare = MPSTypes.getDecodedReducedKeyShare(Buffer.from(reduced.slice('encrypted:'.length), 'base64'));
    assert.deepStrictEqual(Buffer.from(reducedShare.keyShare), signingShare);
    assert.strictEqual(Buffer.from(reducedShare.pub).toString('hex'), bitgoPeer.getCommonKeychain().slice(0, 64));
    assert.throws(() => decodeVrfEnvelope(signingShare));
    assert.strictEqual(backupChild.encryptedPrv, undefined);
    assert.strictEqual(bitgoChild.encryptedPrv, undefined);
  });

  it('rejects indexes outside the hardened Safe range before contacting WP', async function () {
    const { bitgo, baseCoin, post, addedKeychains } = createKeychainFixture();
    const utils = new EddsaVrfMPCv2Utils(bitgo, baseCoin);

    await assert.rejects(
      utils.createSafeChildKeychains({
        passphrase: 'passphrase',
        enterprise: 'enterprise-id',
        safeId: 'safe-id',
        parentKeyId: 'bitgo-root-id',
        derivationIndex: 0x80000000,
        userRootKeyId: 'user-root-id',
        backupRootKeyId: 'backup-root-id',
        userRootKeyShare: userSigningShare,
        userRootVrfKeyShare: userVrfShare,
      }),
      /derivedFromParentWithPath/
    );
    assert.strictEqual(post.called, false);
    assert.deepStrictEqual(addedKeychains, []);
  });

  const faults: Array<'r1-signature' | 'r2-signature' | 'session' | 'commonKeychain'> = [
    'r1-signature',
    'r2-signature',
    'session',
    'commonKeychain',
  ];
  for (const fault of faults) {
    it(`rejects ${fault} before registering any child`, async function () {
      const recordedKeychains: AddedKeychainParams[] = [];
      await assert.rejects(
        () => deriveWithPeer(fault, recordedKeychains),
        fault === 'session'
          ? /session id/i
          : fault === 'commonKeychain'
          ? /common keychain/i
          : /signature|verification|signed/i
      );
      assert.deepStrictEqual(recordedKeychains, []);
    });
  }
});
