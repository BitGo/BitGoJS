import assert from 'assert';
import * as pgp from 'openpgp';
import * as sinon from 'sinon';
import { MPSComms, MPSUtil, MPSTypes, MpsDerive, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import {
  EddsaMPCv2DeriveRound1Request,
  EddsaMPCv2DeriveRound2Request,
  KeyCurveEnum,
  KeyGenTypeEnum,
  MPCv2KeyGenStateEnum,
} from '@bitgo/public-types';
import { decode } from 'cbor-x';
import * as t from 'io-ts';

import { EddsaMPCv2Utils, BitGoBase, IBaseCoin, Keychain } from '../../../../../../src';
import { decodeWithCodec } from '../../../../../../src/bitgo/utils/codecs';
import {
  EddsaVrfMPCv2Utils,
  buildVrfKeyEnvelopes,
  deserializeVrfMessages,
  serializeVrfMessages,
} from '../../../../../../src/bitgo/utils/tss/eddsa/eddsaVrfMPCv2';
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

    const { envelope, reducedEnvelope } = buildVrfKeyEnvelopes(privateMaterial, reducedPrivateMaterial, vrfKeyShare);
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
    const { envelope, reducedEnvelope } = buildVrfKeyEnvelopes(
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

  it('round-trips opaque VRF blobs and keeps only the recipient p2p messages', function () {
    const blob = serializeVrfMessages({
      broadcastMessages: [{ from: MPCv2PartiesEnum.BITGO, payload: new Uint8Array([1, 2, 3]) }],
      p2pMessages: [
        { from: MPCv2PartiesEnum.BITGO, to: MPCv2PartiesEnum.USER, payload: new Uint8Array([4]) },
        { from: MPCv2PartiesEnum.BITGO, to: MPCv2PartiesEnum.BACKUP, payload: new Uint8Array([5]) },
      ],
    });

    const forUser = deserializeVrfMessages(blob, MPCv2PartiesEnum.USER);
    assert.deepStrictEqual(Buffer.from(forUser.broadcastMessages[0].payload), Buffer.from([1, 2, 3]));
    assert.strictEqual(forUser.p2pMessages.length, 1);
    assert.strictEqual(forUser.p2pMessages[0].to, MPCv2PartiesEnum.USER);
    assert.deepStrictEqual(Buffer.from(forUser.p2pMessages[0].payload), Buffer.from([4]));

    const forBackup = deserializeVrfMessages(blob, MPCv2PartiesEnum.BACKUP);
    assert.strictEqual(forBackup.p2pMessages.length, 1);
    assert.strictEqual(forBackup.p2pMessages[0].to, MPCv2PartiesEnum.BACKUP);
  });

  it('rejects malformed VRF DKG message blobs', function () {
    assert.throws(() => deserializeVrfMessages('%%%', MPCv2PartiesEnum.USER), /Invalid VRF DKG message blob/);
    const notAnArray = Buffer.from(JSON.stringify({ from: 0 })).toString('base64');
    assert.throws(() => deserializeVrfMessages(notAnArray, MPCv2PartiesEnum.USER), /VRF DKG message blob/);
    const badParty = Buffer.from(JSON.stringify([{ from: 9, payload: Buffer.from([1]).toString('base64') }])).toString(
      'base64'
    );
    assert.throws(() => deserializeVrfMessages(badParty, MPCv2PartiesEnum.USER), /VRF DKG message blob/);
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
