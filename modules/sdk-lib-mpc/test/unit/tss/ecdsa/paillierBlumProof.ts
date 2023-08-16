import should from 'should';

import { generatePaillierKey, hexToBigInt } from '../../../../src';
import {
  DeserializedPaillierBlumProof,
  deserializePaillierBlumProof,
  RawPaillierKey,
} from '../../../../src/tss/ecdsa/types';
import fixtures from '../../../fixtures/mockPaillierBlumProof.json';
import { prove, verify } from '../../../../src/tss/ecdsa/paillierBlumProof';

describe('EcdsaPaillierBlumProof', function () {
  // Uncomment the following when you need to generate new fixtures
  // it('should generate fixtures', async function () {
  //   const { serializePaillierBlumProof } = require('../../../../src/tss/ecdsa/types');
  //   const { bigIntToHex, generatePaillierKeyWithProof } = require('../../../../src');
  //   const fs = require('fs');
  //
  //   const values: any[] = [];
  //
  //   // to generate more fixtures, increase the mocha timeout and then reset it after generating
  //   for (let i = 0; 5 < 1; i++) {
  //     const keypairWithProof = await generatePaillierKeyWithProof();
  //     values.push({
  //       n: bigIntToHex(keypairWithProof.n),
  //       p: bigIntToHex(keypairWithProof.p),
  //       q: bigIntToHex(keypairWithProof.q),
  //       ...serializePaillierBlumProof(keypairWithProof),
  //     });
  //   }
  //   fs.writeFileSync('./test/fixtures/mockPaillierBlumProof.json', JSON.stringify(values, null, 2));
  // });

  describe('prove', function () {
    fixtures.forEach((fixture, i) => {
      it(`creating paillier blum proof should not throw an error, test case ${i}`, async function () {
        await prove(hexToBigInt(fixture.p), hexToBigInt(fixture.q));
      });
    });
  });

  describe('verify', function () {
    const mockFixture = fixtures[0];
    fixtures.forEach((fixture, i) => {
      it(`verifying paillier blum proof should return true, test case ${i}`, async function () {
        await verify(hexToBigInt(fixture.n), deserializePaillierBlumProof(fixture)).should.be.resolvedWith(true);
      });
    });

    it('should throw for invalid N', async function () {
      await should(verify(BigInt(1), deserializePaillierBlumProof(mockFixture))).be.rejectedWith(
        'N must be greater than 1'
      );
      await should(verify(BigInt(2), deserializePaillierBlumProof(mockFixture))).be.rejectedWith(
        'N must be an odd number'
      );
      await should(verify(BigInt(7), deserializePaillierBlumProof(mockFixture))).be.rejectedWith(
        'N must be a composite number'
      );
      await should(verify(BigInt(9), deserializePaillierBlumProof(mockFixture))).be.rejectedWith(
        'Jacobi symbol of w must be -1 wrt to N'
      );
    });

    it('should throw for invalid proof', async function () {
      let invalidProof = deserializePaillierBlumProof(mockFixture);
      invalidProof.w = BigInt(1);
      await should(verify(hexToBigInt(mockFixture.n), invalidProof)).be.rejectedWith(
        'Jacobi symbol of w must be -1 wrt to N'
      );

      invalidProof = deserializePaillierBlumProof(mockFixture);
      invalidProof.z[1] = BigInt(1);
      await should(verify(hexToBigInt(mockFixture.n), invalidProof)).be.rejectedWith(
        'Paillier verification of z[1] failed'
      );

      invalidProof = deserializePaillierBlumProof(mockFixture);
      invalidProof.x[1] = BigInt(1);
      await should(verify(hexToBigInt(mockFixture.n), invalidProof)).be.rejectedWith(
        'Paillier verification of x[1] failed'
      );
    });
  });

  describe('prove and verify', function () {
    // This test takes quite some time ~ 18 seconds
    it('should generate a paillier key, create a paillier blum proof, and verify it', async function () {
      const paillierKey: RawPaillierKey = await generatePaillierKey();
      const proof: DeserializedPaillierBlumProof = await prove(paillierKey.p, paillierKey.q);
      const res = await verify(paillierKey.n, proof);
      should(res).be.true();
    });
  });
});
