import * as paillierBigint from 'paillier-bigint';
import 'should';
import sinon from 'sinon';
import {
  EcdsaPaillierProof,
  EcdsaRangeProof,
  EcdsaTypes,
  EcdsaZkVProof,
  HashCommitment,
  hexToBigInt,
  bigIntToBufferBE,
} from '@bitgo/sdk-lib-mpc';
import { Ecdsa } from '../../../../../../src/account-lib/mpc/tss';
import {
  PublicUTShare,
  PublicVAShareWithProofs,
  SignCombineRT,
} from '../../../../../../src/account-lib/mpc/tss/ecdsa/types';
import { paillierKeyPairs } from './fixtures';

describe('ecdsa tss', function () {
  const ecdsa = new Ecdsa();

  let signCombine1: SignCombineRT, signCombine2: SignCombineRT;

  before('generate key and sign phase 1 to 4', async function () {
    const paillierKeyStub = sinon.stub(paillierBigint, 'generateRandomKeys');

    paillierKeyStub.onCall(0).returns(Promise.resolve(paillierKeyPairs[0]));
    paillierKeyStub.onCall(1).returns(Promise.resolve(paillierKeyPairs[1]));
    paillierKeyStub.onCall(2).returns(Promise.resolve(paillierKeyPairs[2]));

    const [keyShare1, keyShare2, keyShare3] = await Promise.all([
      ecdsa.keyShare(1, 2, 3),
      ecdsa.keyShare(2, 2, 3),
      ecdsa.keyShare(3, 2, 3),
    ]);

    const [keyCombined1, keyCombined2, keyCombined3] = [
      ecdsa.keyCombine(keyShare1.pShare, [keyShare2.nShares[1], keyShare3.nShares[1]]),
      ecdsa.keyCombine(keyShare2.pShare, [keyShare1.nShares[2], keyShare3.nShares[2]]),
      ecdsa.keyCombine(keyShare3.pShare, [keyShare1.nShares[3], keyShare2.nShares[3]]),
    ];

    keyCombined1.xShare.y.should.equal(keyCombined2.xShare.y);
    keyCombined1.xShare.y.should.equal(keyCombined3.xShare.y);

    // Collect all VSS from nShares and verify Schnorr proofs against X_i.
    // Note that this is something WP needs to do after keyCombine/keyDerive.
    const Y = hexToBigInt(keyCombined1.xShare.y);

    const VSSs = [
      [hexToBigInt(keyShare1.nShares[2].v!)],
      [hexToBigInt(keyShare2.nShares[3].v!)],
      [hexToBigInt(keyShare3.nShares[1].v!)],
    ];

    ecdsa.verifySchnorrProofX(Y, VSSs, 1, keyCombined1.xShare.schnorrProofX).should.be.true();
    ecdsa.verifySchnorrProofX(Y, VSSs, 2, keyCombined2.xShare.schnorrProofX).should.be.true();
    ecdsa.verifySchnorrProofX(Y, VSSs, 3, keyCombined3.xShare.schnorrProofX).should.be.true();

    // Verify Schnorr proofs against X_i for keyDerive and subsequent keyCombine.
    const path = 'm/0/1/2';
    const keyDerive1 = ecdsa.keyDerive(keyShare1.pShare, [keyShare2.nShares[1], keyShare3.nShares[1]], path);

    // Note the VSSs used here are different from the ones used above.
    const derivedY = hexToBigInt(keyDerive1.xShare.y);
    const derivedVSSs = [
      [hexToBigInt(keyDerive1.nShares[2].v!)],
      [hexToBigInt(keyShare2.nShares[3].v!)],
      [hexToBigInt(keyShare3.nShares[1].v!)],
    ];
    ecdsa.verifySchnorrProofX(derivedY, derivedVSSs, 1, keyDerive1.xShare.schnorrProofX).should.be.true();

    const keyCombined2FromKeyDerive1 = ecdsa.keyCombine(keyShare2.pShare, [
      keyDerive1.nShares[2],
      keyShare3.nShares[2],
    ]);
    ecdsa
      .verifySchnorrProofX(derivedY, derivedVSSs, 2, keyCombined2FromKeyDerive1.xShare.schnorrProofX)
      .should.be.true();

    const [ntilde1, ntilde2] = await Promise.all([
      EcdsaRangeProof.generateNtilde(512),
      EcdsaRangeProof.generateNtilde(512),
    ]);

    const [serializeNtilde1, serializeNtilde2] = [
      EcdsaTypes.serializeNtildeWithProofs(ntilde1),
      EcdsaTypes.serializeNtildeWithProofs(ntilde2),
    ];

    const [index1, index2] = [keyCombined1.xShare.i, keyCombined2.xShare.i];

    const [paillierN1to2, paillierN2to1] = [keyCombined1.yShares[index2].n, keyCombined2.yShares[index1].n];

    const [paillierChallenger1to2, paillierChallenger2to1] = await Promise.all([
      EcdsaPaillierProof.generateP(hexToBigInt(paillierN1to2)),
      EcdsaPaillierProof.generateP(hexToBigInt(paillierN2to1)),
    ]);

    const [xShare1, xShare2] = [
      ecdsa.appendChallenge(
        keyCombined1.xShare,
        serializeNtilde1,
        EcdsaTypes.serializePaillierChallenge({ p: paillierChallenger1to2 })
      ),
      ecdsa.appendChallenge(
        keyCombined2.xShare,
        serializeNtilde2,
        EcdsaTypes.serializePaillierChallenge({ p: paillierChallenger2to1 })
      ),
    ];

    const yShare2 = ecdsa.appendChallenge(
      keyCombined1.yShares[index2],
      serializeNtilde2,
      EcdsaTypes.serializePaillierChallenge({ p: paillierChallenger2to1 })
    );

    const signShares = await ecdsa.signShare(xShare1, yShare2);

    const signConvertS21 = await ecdsa.signConvertStep1({
      xShare: xShare2,
      yShare: keyCombined2.yShares[index1],
      kShare: signShares.kShare,
    });
    const signConvertS12 = await ecdsa.signConvertStep2({
      aShare: signConvertS21.aShare,
      wShare: signShares.wShare,
    });
    const signConvertS21_2 = await ecdsa.signConvertStep3({
      muShare: signConvertS12.muShare,
      bShare: signConvertS21.bShare,
    });

    [signCombine1, signCombine2] = [
      ecdsa.signCombine({
        gShare: signConvertS12.gShare,
        signIndex: {
          i: signConvertS12.muShare.i,
          j: signConvertS12.muShare.j,
        },
      }),
      ecdsa.signCombine({
        gShare: signConvertS21_2.gShare,
        signIndex: {
          i: signConvertS21_2.signIndex.i,
          j: signConvertS21_2.signIndex.j,
        },
      }),
    ];
  });

  it('sign phase 5 should succeed', async function () {
    // TODO(HSM-129): There is a bug signing unhashed message (although this deviates from DSA spec) if the message is a little long.
    //       Some discrepancy between Ecdsa.sign and secp256k1.recoverPublicKey on handling the message input.
    const message = Buffer.from('GG18 PHASE 5');

    // Starting phase 5
    // In addition to returning s_i, Ecdsa.sign() now also calculates data needed for steps 5A and 5B:
    //   - sample random l_i and rho_i (5A)
    //   - computes V_i and A_i (5B)]
    //   - computes commitment and decommitment of (V_i, A_i) (5A, 5B)
    //   - generates proofs of knowledge of s_i, l_i, rho_i w.r.t. V_i, A_i (5B)
    const [sign1, sign2] = [
      ecdsa.generateVAProofs(message, ecdsa.sign(message, signCombine1.oShare, signCombine2.dShare)),
      ecdsa.generateVAProofs(message, ecdsa.sign(message, signCombine2.oShare, signCombine1.dShare)),
    ];

    sign1.R.should.equal(sign2.R);
    sign1.y.should.equal(sign2.y);
    sign1.m.toString('hex').should.equal(sign2.m.toString('hex'));

    // Step 5A: Calculations done by Ecdsa.sign() above, and broadcast commitment of (V_i, A_i) to other parties.
    //          The following values will be sent via communication channel at the end of 5A.
    // const commitmentVA1 = sign1.comDecomVA.commitment;
    // const commitmentVA2 = sign2.comDecomVA.commitment;

    // Step 5B: After having received all commitments of (V_i, A_i) from other parties,
    //          each party will broadcast decommitment of (V_i, A_i) and ZK proofs returned by Ecdsa.sign() above
    //          to other parties.  Then Ecdsa.verifyVAShares() below will:
    //   - verify commitments of (V_i, A_i) received from other parties (5B)
    //   - verify ZK proofs of (V_i, A_i) received from other parties (5B)
    //   - calculate V out of G, y, r, m, and all V_i, calculate A as sum of all A_i (5B)
    //   - calculate U_i and T_i and commitment and decommitment of (U_i, T_i) (5C)
    const [publicVAShares_1, publicVAShares_2] = [sign1 as PublicVAShareWithProofs, sign2 as PublicVAShareWithProofs];
    const [UT1, UT2] = [
      ecdsa.verifyVAShares(sign1, [publicVAShares_2]),
      ecdsa.verifyVAShares(sign2, [publicVAShares_1]),
    ];

    // Step 5C: Calculations of U_i, T_i done by Ecdsa.verifyVAShares above,
    //          and broadcast commitment of (U_i, T_i) to other parties.
    //          The following values will be sent via communication channel at the end of 5C.
    // const commitmentUT1 = UT1.comDecomUT.commitment;
    // const commitmentUT2 = UT2.comDecomUT.commitment;

    // Step 5D: After having received all commitments of (U_i, T_i) from other parties,
    //          each party will broadcast decommitment of (U_i, T_i) returned by Ecdsa.verifyVAShares() above
    //          to other parties.  Then Ecdsa.verifyUTShares() below will:
    //  - verify commitments of (U_i, T_i) received from other parties (5D)
    //  - calculate U as sum of all U_i, calculate T as sum of all T_i (5D)
    //  - if U equals T, then return own SShare which is being returned by Ecdsa.sign() right now (5E)
    const [publicUTShares_1, publicUTShares_2] = [UT1 as PublicUTShare, UT2 as PublicUTShare];
    const [signature1, signature2] = [
      ecdsa.verifyUTShares(UT1, [publicUTShares_2]),
      ecdsa.verifyUTShares(UT2, [publicUTShares_1]),
    ];

    // Step 5E: Broadcast s_i returned by Ecdsa.verifyUTShares() above to other parties.
    //          Verify the sum of s_i should be a valid signature.
    const signature = ecdsa.constructSignature([signature1, signature2]);
    ecdsa.verify(message, signature).should.be.true();
  });

  it('sign phase 5 fail - malicious player cheats with bad s share', async function () {
    const message = Buffer.from('GG18 PHASE 5');

    const [sign1, sign2] = [
      ecdsa.generateVAProofs(message, ecdsa.sign(message, signCombine1.oShare, signCombine2.dShare)),
      ecdsa.generateVAProofs(message, ecdsa.sign(message, signCombine2.oShare, signCombine1.dShare)),
    ];

    sign1.R.should.equal(sign2.R);
    sign1.y.should.equal(sign2.y);
    sign1.m.toString('hex').should.equal(sign2.m.toString('hex'));

    // Change the s share of sign1, and recalcualte its V along with the commitment/proof by following protocol.
    const bad_s = hexToBigInt(sign1.s) + BigInt(1);

    const bad_V = Ecdsa.curve.pointAdd(
      Ecdsa.curve.pointMultiply(hexToBigInt(sign1.R), bad_s),
      Ecdsa.curve.basePointMult(sign1.l)
    );

    const comDecom_V_A = HashCommitment.createCommitment(
      Buffer.concat([
        bigIntToBufferBE(bad_V, Ecdsa.curve.pointBytes),
        bigIntToBufferBE(sign1.A, Ecdsa.curve.pointBytes),
      ])
    );
    const zkVProof = EcdsaZkVProof.createZkVProof(
      bad_V,
      bad_s,
      sign1.l,
      hexToBigInt(sign1.R),
      Ecdsa.curve,
      sign1.proofContext
    );

    sign1.s = bigIntToBufferBE(bad_s, 32).toString('hex');
    sign1.V = bad_V;
    sign1.comDecomVA = comDecom_V_A;
    sign1.zkVProofV = zkVProof;

    // 5B will pass.
    const [publicVAShares_1, publicVAShares_2] = [sign1 as PublicVAShareWithProofs, sign2 as PublicVAShareWithProofs];
    const [UT1, UT2] = [
      ecdsa.verifyVAShares(sign1, [publicVAShares_2]),
      ecdsa.verifyVAShares(sign2, [publicVAShares_1]),
    ];

    // But verification at beginning of 5E will fail.
    const [publicUTShares_1, publicUTShares_2] = [UT1 as PublicUTShare, UT2 as PublicUTShare];
    (() => ecdsa.verifyUTShares(UT1, [publicUTShares_2])).should.throw('Sum of all U_i does not match sum of all T_i');
    (() => ecdsa.verifyUTShares(UT2, [publicUTShares_1])).should.throw('Sum of all U_i does not match sum of all T_i');
  });
});
