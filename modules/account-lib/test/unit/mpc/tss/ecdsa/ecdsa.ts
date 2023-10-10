/**
 * @prettier
 */
import assert from 'assert';
import { Hash, randomBytes } from 'crypto';
import { Ecdsa, ECDSA, hexToBigInt } from '@bitgo/sdk-core';
import { EcdsaPaillierProof, EcdsaTypes, Schnorr, SchnorrProof } from '@bitgo/sdk-lib-mpc';
import * as sinon from 'sinon';
import createKeccakHash from 'keccak';
import * as paillierBigint from 'paillier-bigint';
import {
  schnorrProofs,
  ntildes,
  paillerKeys,
  mockNShares,
  mockPShare,
  mockDKeyShare,
  mockEKeyShare,
  mockFKeyShare,
} from '../fixtures/ecdsa';

describe('TSS ECDSA TESTS', function () {
  const MPC = new Ecdsa();
  const base = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000'); // 2^256
  let keyShares: ECDSA.KeyCombined[];
  let commonPublicKey: string;
  const seed = Buffer.from(
    'c4d1583a0b7b88626b56f0c83ee6df4d95d99cca73893ffb57c5e4411fa1b2b9c87456080e8d3f03462f065688abc28be2d4af3164d593c50b55269b435ea48d',
    'hex',
  );
  let A: ECDSA.KeyShare, B: ECDSA.KeyShare, C: ECDSA.KeyShare;
  before(async () => {
    const paillierMock = sinon
      .stub(paillierBigint, 'generateRandomKeys')
      .onCall(0)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(1)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(2)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair)
      .onCall(3)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(4)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(5)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair);

    const schnorrProofMock = sinon
      .stub(Schnorr, 'createSchnorrProof')
      .onCall(0)
      .returns(schnorrProofs[0] as unknown as SchnorrProof)
      .onCall(1)
      .returns(schnorrProofs[1] as unknown as SchnorrProof)
      .onCall(2)
      .returns(schnorrProofs[2] as unknown as SchnorrProof)
      .onCall(3)
      .returns(schnorrProofs[3] as unknown as SchnorrProof)
      .onCall(4)
      .returns(schnorrProofs[4] as unknown as SchnorrProof)
      .onCall(5)
      .returns(schnorrProofs[5] as unknown as SchnorrProof);

    [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);

    // Needs to run this serially for testing deterministic key generation
    // to get specific paillier keys to be assigned
    const D = await MPC.keyShare(1, 2, 3, seed);
    const E = await MPC.keyShare(2, 2, 3, seed);
    const F = await MPC.keyShare(3, 2, 3, seed);

    const aKeyCombine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const bKeyCombine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const cKeyCombine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);

    // Shares with specific seeds
    const dKeyCombine = MPC.keyCombine(D.pShare, [E.nShares[1], F.nShares[1]]);
    const eKeyCombine = MPC.keyCombine(E.pShare, [D.nShares[2], F.nShares[2]]);
    const fKeyCombine = MPC.keyCombine(F.pShare, [D.nShares[3], E.nShares[3]]);

    // Shares for derived keys.
    const path = 'm/0/1';
    const aKeyDerive = MPC.keyDerive(A.pShare, [B.nShares[1], C.nShares[1]], path);
    const gKeyCombine: ECDSA.KeyCombined = {
      xShare: aKeyDerive.xShare,
      yShares: aKeyCombine.yShares,
    };
    const hKeyCombine = MPC.keyCombine(B.pShare, [aKeyDerive.nShares[2], C.nShares[2]]);
    keyShares = [
      aKeyCombine,
      bKeyCombine,
      cKeyCombine,
      dKeyCombine,
      eKeyCombine,
      fKeyCombine,
      gKeyCombine,
      hKeyCombine,
    ];
    commonPublicKey = aKeyCombine.xShare.y;
    paillierMock.reset();
    paillierMock.restore();
    schnorrProofMock.reset();
    schnorrProofMock.restore();
  });

  describe('Ecdsa Key Generation Test', function () {
    it('should generate keys with correct threshold and share number', async function () {
      for (let index = 0; index < 3; index++) {
        const participantOne = (index % 3) + 1;
        const participantTwo = ((index + 1) % 3) + 1;
        const participantThree = ((index + 2) % 3) + 1;
        keyShares[index].xShare.i.should.equal(participantOne);
        keyShares[index].xShare.y.should.equal(commonPublicKey);
        keyShares[index].xShare.m.should.not.be.Null;
        keyShares[index].xShare.l.should.not.be.Null;
        keyShares[index].xShare.n.should.not.be.Null;

        const chaincode = BigInt('0x' + keyShares[index].xShare.chaincode);
        const isChainCodeValid = chaincode > BigInt(0) && chaincode <= base;
        isChainCodeValid.should.equal(true);

        keyShares[index].yShares[participantTwo].i.should.equal(participantOne);
        keyShares[index].yShares[participantThree].i.should.equal(participantOne);
        keyShares[index].yShares[participantTwo].j.should.equal(participantTwo);
        keyShares[index].yShares[participantThree].j.should.equal(participantThree);
        keyShares[index].yShares[participantTwo].n.should.not.be.Null;
        keyShares[index].yShares[participantThree].n.should.not.be.Null;

        const publicKeyPrefix = keyShares[index].xShare.y.slice(0, 2);
        const isRightPrefix = publicKeyPrefix === '03' || publicKeyPrefix === '02';
        isRightPrefix.should.equal(true);
      }
    });

    it('should generate keyshares with specific seed', async function () {
      // Keys should be deterministic when using seed
      const [, , , D, E, F] = keyShares;
      assert.deepEqual(D, mockDKeyShare);
      assert.deepEqual(E, mockEKeyShare);
      assert.deepEqual(F, mockFKeyShare);
    });

    it('should fail if seed is length less than 64 bytes', async function () {
      await MPC.keyShare(1, 2, 3, randomBytes(16)).should.be.rejectedWith(
        'Seed must have a length of at least 64 bytes',
      );
      await MPC.keyShare(1, 2, 3, randomBytes(32)).should.be.rejectedWith(
        'Seed must have a length of at least 64 bytes',
      );
    });

    it('should pass if seed length is greater than 64', async function () {
      const paillierMock = sinon
        .stub(paillierBigint, 'generateRandomKeys')
        .onCall(0)
        .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair);
      const seed72Bytes = Buffer.from(
        '4f7e914dc9ec696398675d1544aab61cb7a67662ffcbdb4079ec5d682be565d87c1b2de75c943dec14c96586984860268779498e6732473aed9ed9c2538f50bea0af926bdccc0134',
        'hex',
      );
      (await MPC.keyShare(1, 2, 3, seed72Bytes)).pShare.u.length.should.equal(64);
      paillierMock.restore();
    });

    it('should calculate correct chaincode while combining', async function () {
      const keyCombine = MPC.keyCombine(mockPShare, mockNShares);
      keyCombine.xShare.chaincode.should.equal('fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc32');
    });

    it('should fail to generate keys with invalid threshold and share number', async function () {
      const invalidConfigs = [
        { index: 1, threshold: 5, numShares: 3 },
        { index: -1, threshold: 2, numShares: 3 },
        { index: 1, threshold: 2, numShares: 1 },
      ];
      for (let index = 0; index < invalidConfigs.length; index++) {
        try {
          await MPC.keyShare(
            invalidConfigs[index].index,
            invalidConfigs[index].threshold,
            invalidConfigs[index].numShares,
          );
        } catch (e) {
          e.should.equal('Invalid KeyShare Config');
        }
      }
    });

    it('should derive unhardened child keys', async function () {
      // parent key
      const aKeyCombine = keyShares[0];
      const commonKeychain = aKeyCombine.xShare.y + aKeyCombine.xShare.chaincode;

      for (let index = 0; index < 10; index++) {
        const path = `m/0/0/${index}`;

        const subkey = MPC.keyDerive(A.pShare, [B.nShares[1], C.nShares[1]], path);

        const derive1: string = MPC.deriveUnhardened(commonKeychain, path);
        const derive2: string = MPC.deriveUnhardened(commonKeychain, path);

        derive1.should.equal(derive2, 'derivation should be deterministic');

        (subkey.xShare.y + subkey.xShare.chaincode).should.equal(
          derive1,
          'subkey common keychain should match derived keychain',
        );
      }
    });
  });

  describe('ECDSA Signing', async function () {
    let config: { signerOne: ECDSA.KeyCombined; signerTwo: ECDSA.KeyCombined; hash?: string; shouldHash?: boolean }[];

    before(() => {
      const [A, B, C, D, E, F, G, H] = keyShares;

      config = [
        { signerOne: A, signerTwo: B },
        { signerOne: A, signerTwo: C },
        { signerOne: B, signerTwo: A },
        { signerOne: B, signerTwo: C },
        { signerOne: C, signerTwo: A },
        { signerOne: C, signerTwo: B },

        // Checks signing with specific seed
        { signerOne: D, signerTwo: E },
        { signerOne: E, signerTwo: F },
        { signerOne: F, signerTwo: D },

        // Checks with specific hashing algorithm
        { signerOne: A, signerTwo: B, hash: 'keccak256' },

        // checks with no hashing
        { signerOne: A, signerTwo: B, shouldHash: false },

        // Checks with derived subkey
        { signerOne: G, signerTwo: H },
      ];
    });

    for (let index = 0; index < 9; index++) {
      it(`should properly sign the message case ${index}`, async function () {
        // Step One
        // signerOne, signerTwo have decided to sign the message
        const signerOne = config[index].signerOne;
        const signerOneIndex = signerOne.xShare.i;
        const signerTwo = config[index].signerTwo;
        const signerTwoIndex = signerTwo.xShare.i;

        const [signerOneToTwoPaillierChallenge, signerTwoToOnePaillierChallenge] = await Promise.all([
          EcdsaPaillierProof.generateP(hexToBigInt(signerOne.yShares[signerTwoIndex].n)),
          EcdsaPaillierProof.generateP(hexToBigInt(signerTwo.yShares[signerOneIndex].n)),
        ]);
        // Step Two
        // First signer generates their range proof challenge.
        const signerOneXShare: ECDSA.XShareWithChallenges = MPC.appendChallenge(
          signerOne.xShare,
          EcdsaTypes.serializeNtilde(ntildes[index]),
          EcdsaTypes.serializePaillierChallenge({ p: signerOneToTwoPaillierChallenge }),
        );

        // Step Three
        //  Second signer generates their range proof challenge.
        const signerTwoXShare: ECDSA.XShareWithChallenges = MPC.appendChallenge(
          signerTwo.xShare,
          EcdsaTypes.serializeNtilde(ntildes[index + 1]),
          EcdsaTypes.serializePaillierChallenge({ p: signerTwoToOnePaillierChallenge }),
        );
        const signerTwoChallenge = { ntilde: signerTwoXShare.ntilde, h1: signerTwoXShare.h1, h2: signerTwoXShare.h2 };

        // Step Four
        // First signer receives the challenge from the second signer and appends it to their YShare
        const signerTwoYShare: ECDSA.YShareWithChallenges = MPC.appendChallenge(
          signerOne.yShares[signerTwoIndex],
          signerTwoChallenge,
          EcdsaTypes.serializePaillierChallenge({ p: signerTwoToOnePaillierChallenge }),
        );

        // Step Five
        // Sign Shares are created by one of the participants (signerOne)
        // with its private XShare and YShare corresponding to the other participant (signerTwo)
        // This step produces a private WShare which signerOne saves and KShare which signerOne sends to signerTwo
        const signShares = await MPC.signShare(signerOneXShare, signerTwoYShare);

        // Step Six
        // signerTwo receives the KShare from signerOne and uses it produce private
        // BShare (Beta Share) which signerTwo saves and AShare (Alpha Share)
        // which is sent to signerOne

        const signConvertS21 = await MPC.signConvertStep1({
          xShare: signerTwoXShare,
          yShare: signerTwo.yShares[signerOneIndex], // YShare corresponding to the other participant signerOne
          kShare: signShares.kShare,
        });

        // Step Seven
        // signerOne receives the AShare from signerTwo and signerOne using the private WShare from step two
        // uses it produce private GShare (Gamma Share) and MUShare (Mu Share) which
        // is sent to signerTwo to produce its Gamma Share
        const signConvertS12 = await MPC.signConvertStep2({
          aShare: signConvertS21.aShare,
          wShare: signShares.wShare,
        });

        // Step Eight
        // signerTwo receives the MUShare from signerOne and signerOne using the private BShare from step three
        // uses it produce private GShare (Gamma Share)
        const signConvertS21_2 = await MPC.signConvertStep3({
          muShare: signConvertS12.muShare,
          bShare: signConvertS21.bShare,
        });

        // Step Nine
        // signerOne and signerTwo both have successfully generated GShares and they use
        // the sign combine function to generate their private omicron shares and
        // delta shares which they share to each other

        const [signCombineOne, signCombineTwo] = [
          MPC.signCombine({
            gShare: signConvertS12.gShare,
            signIndex: {
              i: signConvertS12.muShare.i,
              j: signConvertS12.muShare.j,
            },
          }),
          MPC.signCombine({
            gShare: signConvertS21_2.gShare,
            signIndex: {
              i: signConvertS21_2.signIndex.i,
              j: signConvertS21_2.signIndex.j,
            },
          }),
        ];

        const MESSAGE = Buffer.from('TOO MANY SECRETS');

        // Step Ten
        // signerOne and signerTwo shares the delta share from each other
        // and finally signs the message using their private OShare
        // and delta share received from the other signer

        const hashGenerator = (hashType?: string): Hash | undefined => {
          return hashType === 'keccak256' ? createKeccakHash('keccak256') : undefined;
        };
        const [signA, signB] = [
          MPC.sign(
            MESSAGE,
            signCombineOne.oShare,
            signCombineTwo.dShare,
            hashGenerator(config[index].hash),
            config[index].shouldHash,
          ),
          MPC.sign(
            MESSAGE,
            signCombineTwo.oShare,
            signCombineOne.dShare,
            hashGenerator(config[index].hash),
            config[index].shouldHash,
          ),
        ];

        // Step Eleven
        // Construct the final signature

        const signature = MPC.constructSignature([signA, signB]);

        // Step Twelve
        // Verify signature

        const isValid = MPC.verify(MESSAGE, signature, hashGenerator(config[index].hash), config[index].shouldHash);
        isValid.should.equal(true);
      });
    }
  });
});
