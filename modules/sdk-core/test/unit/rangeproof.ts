import * as sinon from 'sinon';
import * as paillierBigint from 'paillier-bigint';
import Ecdsa from '../../src/account-lib/mpc/tss/ecdsa/ecdsa';
import * as rangeProof from '../../src/account-lib/mpc/tss/ecdsa/rangeproof';
import { Ntilde } from '../../src/account-lib/mpc/tss/ecdsa/types';
import { OpenSSL } from '../../src/openssl';

describe('MtA range proof', function () {
  let switchPrime = false;
  let safePrimeMock: sinon.SinonStub;

  let paillierKeyPair: paillierBigint.KeyPair;
  let ntilde: Ntilde;

  before('set up paillier and ntile', async function () {
    safePrimeMock = sinon.stub(OpenSSL.prototype, 'generateSafePrime').callsFake(async (bitlength: number) => {
      // Both primes below were generated using 'openssl prime -bits 256 -generate -safe'.
      if (switchPrime) {
        switchPrime = false;
        return BigInt('105026459418240911050597781175405200114409463599422710187772697695413160518507');
      } else {
        switchPrime = true;
        return BigInt('97740038048923029272833872518628089389073263932043585221445032564807403246907');
      }
    });

    paillierKeyPair = await paillierBigint.generateRandomKeys(2048, true);
    ntilde = await rangeProof.generateNtilde(512);
  });

  after(function () {
    safePrimeMock.reset();
    safePrimeMock.restore();
  });

  it('valid range proof', async function () {
    const k = Ecdsa.curve.scalarRandom();
    const rk = await rangeProof.randomCoPrimeTo(paillierKeyPair.publicKey.n);
    const ck = paillierKeyPair.publicKey.encrypt(k, rk);

    const proof = await rangeProof.prove(
      Ecdsa.curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      ck,
      k,
      rk
    );

    rangeProof
      .verify(
        Ecdsa.curve,
        2048,
        paillierKeyPair.publicKey,
        {
          ntilde: ntilde.ntilde,
          h1: ntilde.h1,
          h2: ntilde.h2,
        },
        proof,
        ck
      )
      .should.be.true();
  });

  it('encrypted value too big', async function () {
    // Pick k based on attack described in https://eprint.iacr.org/2021/1621.pdf, where M = 2^29 is chosen.
    const k = (BigInt(2) * (BigInt(2) ^ BigInt(29)) * paillierKeyPair.publicKey.n) / Ecdsa.curve.order();
    const rk = await rangeProof.randomCoPrimeTo(paillierKeyPair.publicKey.n);
    const ck = paillierKeyPair.publicKey.encrypt(k, rk);

    const proof = await rangeProof.prove(
      Ecdsa.curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      ck,
      k,
      rk
    );

    rangeProof
      .verify(
        Ecdsa.curve,
        2048,
        paillierKeyPair.publicKey,
        {
          ntilde: ntilde.ntilde,
          h1: ntilde.h1,
          h2: ntilde.h2,
        },
        proof,
        ck
      )
      .should.be.false();
  });
});
