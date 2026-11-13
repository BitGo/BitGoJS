import 'should';
import { parseSafeKeycardBox, SafeKeycardRoots } from '../../src';

describe('keycardCodec', function () {
  describe('parseSafeKeycardBox', function () {
    const fullBox: SafeKeycardRoots = {
      secp256k1Multisig: 'a',
      ecdsaMpc: 'b',
      eddsaMpc: 'c',
      ed25519Multisig: 'd',
    };

    // For byte-for-byte round trips the input must be keyed in canonical order (SafeKeycardRoots codec
    // order == key-card's SAFE_ROOT_ORDER), which is how generateSafeQrData always writes boxes.

    const SUBSETS: Array<[string, SafeKeycardRoots]> = [
      ['{"secp256k1Multisig":"a"}', { secp256k1Multisig: 'a' }],
      ['{"secp256k1Multisig":"a","ecdsaMpc":"b"}', { secp256k1Multisig: 'a', ecdsaMpc: 'b' }],
      [
        '{"secp256k1Multisig":"a","ecdsaMpc":"b","eddsaMpc":"c"}',
        { secp256k1Multisig: 'a', ecdsaMpc: 'b', eddsaMpc: 'c' },
      ],
    ];

    it('decodes a box carrying all four roots, byte-for-byte', function () {
      const box = JSON.stringify(fullBox);
      parseSafeKeycardBox(box).should.deepEqual(fullBox);
      JSON.stringify(parseSafeKeycardBox(box)).should.equal(box);
    });

    SUBSETS.forEach(([box, expected]) => {
      it(`decodes a partial box ${box}, byte-for-byte`, function () {
        parseSafeKeycardBox(box).should.deepEqual(expected);
        JSON.stringify(parseSafeKeycardBox(box)).should.equal(box);
      });
    });

    it('rejects a box that is not valid JSON', function () {
      (() => parseSafeKeycardBox('not json')).should.throw(/parseSafeKeycardBox/);
    });

    it('rejects JSON that is not an object', function () {
      (() => parseSafeKeycardBox('"a string"')).should.throw(/parseSafeKeycardBox/);
    });

    it('rejects an empty slot set', function () {
      (() => parseSafeKeycardBox('{}')).should.throw(/empty slot set/);
    });

    it('rejects an unknown field, naming it', function () {
      (() => parseSafeKeycardBox('{"secp256k1Multisig":"a","unknownRoot":"b"}')).should.throw(/unknownRoot/);
    });

    it('rejects a root whose value is neither a string nor a derivable entry', function () {
      (() => parseSafeKeycardBox(JSON.stringify({ ...fullBox, ecdsaMpc: 12345 }))).should.throw(/ecdsaMpc/);
    });

    it('accepts a derivable entry object for the ed25519Multisig slot', function () {
      const entry = { prv: 'enc-seed', chainCode: 'A'.repeat(52) };
      const mixed = { ...fullBox, ed25519Multisig: entry };
      parseSafeKeycardBox(JSON.stringify(mixed)).ed25519Multisig.should.deepEqual(entry);
    });

    it('accepts a derivable ed25519 entry inside a partial box', function () {
      const entry = { prv: 'enc-seed', chainCode: 'A'.repeat(52) };
      parseSafeKeycardBox(JSON.stringify({ ed25519Multisig: entry })).should.deepEqual({ ed25519Multisig: entry });
    });
  });
});
