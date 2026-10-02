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

    it('rejects a root whose value is not a string', function () {
      (() => parseSafeKeycardBox(JSON.stringify({ ...fullBox, ecdsaMpc: 12345 }))).should.throw(/ecdsaMpc/);
    });
  });
});
