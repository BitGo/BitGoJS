import { hexToBigInt } from '../../../../src';
import { deserializeNoSmallFactorsProof } from '../../../../src/tss/ecdsa/types';
import fixtures from '../../../fixtures/mockNoSmallFactorsProof.json';
import { prove, verify } from '../../../../src/tss/ecdsa/noSmallFactorsProof';

export const minModulusBitLength = 3072;

describe('EcdsaNoSmallFactorsProof', function () {
  // Enable the following when you need to generate new fixtures.
  xit('should generate fixtures', async function () {
    const { serializeNoSmallFactorsProof } = require('../../../../src/tss/ecdsa/types');
    const { bigIntToHex, generatePaillierKey } = require('../../../../src');
    const {
      EcdsaRangeProof: rangeProof,
      EcdsaPaillierBlumProof: paillierBlumProof,
    } = require('../../../../src/tss/ecdsa');
    const fs = require('fs');
    const values: any[] = [];
    // to generate more fixtures, increase the mocha timeout and then reset it after generating
    for (let i = 0; i < 5; i++) {
      const { n: n0, p, q } = await generatePaillierKey();
      const { ntilde: nHat, h1: s, h2: t } = await rangeProof.generateNtilde();
      const { w } = await paillierBlumProof.prove(p, q);
      const proof = prove(p, q, w, nHat, s, t);
      values.push({
        n0: bigIntToHex(n0),
        p: bigIntToHex(p),
        q: bigIntToHex(q),
        w: bigIntToHex(w),
        nHat: bigIntToHex(nHat),
        s: bigIntToHex(s),
        t: bigIntToHex(t),
        ...serializeNoSmallFactorsProof(proof),
      });
    }
    fs.writeFileSync('./test/fixtures/mockNoSmallFactorsProof.json', JSON.stringify(values, null, 2));
  });

  describe('prove', function () {
    fixtures.forEach((fixture, i) => {
      it(`creating no small factors proof should not throw an error, test case ${i}`, function () {
        prove(
          hexToBigInt(fixture.p),
          hexToBigInt(fixture.q),
          hexToBigInt(fixture.w),
          hexToBigInt(fixture.nHat),
          hexToBigInt(fixture.s),
          hexToBigInt(fixture.t)
        );
      });
    });
  });

  describe('verify', function () {
    fixtures.forEach((fixture, i) => {
      it(`verifying no small factors proof should return true, test case ${i}`, function () {
        verify(
          hexToBigInt(fixture.n0),
          hexToBigInt(fixture.w),
          hexToBigInt(fixture.nHat),
          hexToBigInt(fixture.s),
          hexToBigInt(fixture.t),
          deserializeNoSmallFactorsProof(fixture)
        ).should.equal(true);
      });
    });

    it('should throw for proof of small factors', function () {
      const mockFixture = fixtures[0];
      const p = BigInt(3);
      const q = hexToBigInt(mockFixture.q);
      const n0 = p * q;
      const w = hexToBigInt(mockFixture.w);
      const nHat = hexToBigInt(mockFixture.nHat);
      const s = hexToBigInt(mockFixture.s);
      const t = hexToBigInt(mockFixture.t);
      const proof = prove(p, q, w, nHat, s, t);
      (() => verify(n0, w, nHat, s, t, proof)).should.throw('Could not verify no small factors proof');
    });

    it('should throw for invalid proof', function () {
      const mockFixture = fixtures[0];
      const invalidProof = deserializeNoSmallFactorsProof(mockFixture);
      const { z1, z2 } = invalidProof;
      invalidProof.z1 = z2;
      invalidProof.z2 = z1;
      const n0 = hexToBigInt(mockFixture.n0);
      const w = hexToBigInt(mockFixture.w);
      const nHat = hexToBigInt(mockFixture.nHat);
      const s = hexToBigInt(mockFixture.s);
      const t = hexToBigInt(mockFixture.t);
      (() => verify(n0, w, nHat, s, t, invalidProof)).should.throw('Could not verify no small factors proof');
    });
  });
});
