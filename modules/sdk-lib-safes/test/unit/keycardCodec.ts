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

    it('decodes a box carrying all four roots', function () {
      parseSafeKeycardBox(JSON.stringify(fullBox)).should.deepEqual(fullBox);
    });

    it('rejects a box that is not valid JSON', function () {
      (() => parseSafeKeycardBox('not json')).should.throw(/parseSafeKeycardBox/);
    });

    it('rejects JSON that is not an object', function () {
      (() => parseSafeKeycardBox('"a string"')).should.throw(/parseSafeKeycardBox/);
    });

    (Object.keys(fullBox) as Array<keyof SafeKeycardRoots>).forEach((slot) => {
      it(`rejects a box missing ${slot} and names it in the error`, function () {
        const withoutSlot = Object.fromEntries(Object.entries(fullBox).filter(([key]) => key !== slot));
        (() => parseSafeKeycardBox(JSON.stringify(withoutSlot))).should.throw(new RegExp(slot));
      });
    });

    it('rejects a root whose value is neither a string nor a derivable entry', function () {
      (() => parseSafeKeycardBox(JSON.stringify({ ...fullBox, ecdsaMpc: 12345 }))).should.throw(/ecdsaMpc/);
    });

    it('accepts a derivable entry object for the ed25519Multisig slot', function () {
      const entry = { prv: 'enc-seed', chainCode: 'A'.repeat(52) };
      const mixed = { ...fullBox, ed25519Multisig: entry };
      parseSafeKeycardBox(JSON.stringify(mixed)).ed25519Multisig.should.deepEqual(entry);
    });

    describe('external backup entry', function () {
      const external = { kind: 'external', pub: 'xpub-external-backup' };

      it('accepts an external entry for a multisig slot', function () {
        const box = { ...fullBox, secp256k1Multisig: external };
        parseSafeKeycardBox(JSON.stringify(box)).secp256k1Multisig.should.deepEqual(external);
      });

      it('keeps the provider when the entry carries one', function () {
        const withProvider = { ...external, provider: 'dai' };
        const box = { ...fullBox, ed25519Multisig: withProvider };
        parseSafeKeycardBox(JSON.stringify(box)).ed25519Multisig.should.deepEqual(withProvider);
      });

      it('still decodes a keycard generated before external entries existed', function () {
        parseSafeKeycardBox(JSON.stringify(fullBox)).should.deepEqual(fullBox);
      });

      it('rejects an external entry without a pub', function () {
        const box = { ...fullBox, secp256k1Multisig: { kind: 'external' } };
        (() => parseSafeKeycardBox(JSON.stringify(box))).should.throw(/secp256k1Multisig/);
      });

      it('rejects an entry with an unknown kind', function () {
        const box = { ...fullBox, secp256k1Multisig: { kind: 'other', pub: 'xpub' } };
        (() => parseSafeKeycardBox(JSON.stringify(box))).should.throw(/secp256k1Multisig/);
      });
    });
  });
});
