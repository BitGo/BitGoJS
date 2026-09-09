import assert from 'assert';
import { decode } from 'cbor-x';
import * as t from 'io-ts';

import { EddsaMPCv2Utils, BitGoBase, IBaseCoin, Keychain } from '../../../../../../src';
import { decodeWithCodec } from '../../../../../../src/bitgo/utils/codecs';
import {
  buildVrfKeyEnvelopes,
  deserializeVrfMessages,
  serializeVrfMessages,
} from '../../../../../../src/bitgo/utils/tss/eddsa/eddsaVrfMPCv2';
import { MPCv2PartiesEnum } from '../../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';

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
  safeId?: string;
};

function decodeVrfEnvelope(encoded: Buffer): t.TypeOf<typeof VrfEnvelope> {
  return decodeWithCodec(VrfEnvelope, decode(encoded), 'VRF key envelope');
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
