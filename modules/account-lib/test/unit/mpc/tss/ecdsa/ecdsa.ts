import { Ecdsa, ECDSA } from '@bitgo/sdk-core';
import * as sinon from 'sinon';
import * as paillierBigint from 'paillier-bigint';
import { paillerKeys, mockNShares, mockPShare } from '../fixtures/ecdsa';
/**
 * @prettier
 */

describe('TSS ECDSA TESTS', function () {
  const MPC = new Ecdsa();
  const base = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000'); // 2^256
  let keyShares: ECDSA.KeyCombined[];
  let commonPublicKey: string;
  before(async () => {
    const pallierMock = sinon
      .stub(paillierBigint, 'generateRandomKeys')
      .onCall(0)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(1)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(2)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair);
    const [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);

    const A_combine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const B_combine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const C_combine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);
    keyShares = [A_combine, B_combine, C_combine];
    commonPublicKey = A_combine.xShare.y;
    pallierMock.reset();
  });

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
    }
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

  it('should properly sign the message', async function () {
    const [A, B, C] = keyShares;

    const config = [
      { signerOne: A, signerTwo: B },
      { signerOne: B, signerTwo: C },
      { signerOne: C, signerTwo: A },
    ];

    for (let index = 0; index < config.length; index++) {
      // Step One
      // signerOne, signerTwo have decided to sign the message
      const signerOne = config[index].signerOne;
      const signerOneIndex = config[index].signerOne.xShare.i;
      const signerTwo = config[index].signerTwo;
      const signerTwoIndex = config[index].signerTwo.xShare.i;

      // Step Two
      // Sign Shares are created by one of the participants (signerOne)
      // with its private XShare and YShare corresponding to the other participant (signerTwo)
      // This step produces a private WShare which signerOne saves and KShare which signerOne sends to signerTwo
      const signShares: ECDSA.SignShareRT = MPC.signShare(signerOne.xShare, signerOne.yShares[signerTwoIndex]);

      // Step Three
      // signerTwo receives the KShare from signerOne and uses it produce private
      // BShare (Beta Share) which signerTwo saves and AShare (Alpha Share)
      // which is sent to signerOne
      let signConvertS21: ECDSA.SignConvertRT = MPC.signConvert({
        xShare: signerTwo.xShare,
        yShare: signerTwo.yShares[signerOneIndex], // YShare corresponding to the other participant signerOne
        kShare: signShares.kShare,
      });

      // Step Four
      // signerOne receives the AShare from signerTwo and signerOne using the private WShare from step two
      // uses it produce private GShare (Gamma Share) and MUShare (Mu Share) which
      // is sent to signerTwo to produce its Gamma Share
      const signConvertS12: ECDSA.SignConvertRT = MPC.signConvert({
        aShare: signConvertS21.aShare,
        wShare: signShares.wShare,
      });

      // Step Five
      // signerTwo receives the MUShare from signerOne and signerOne using the private BShare from step three
      // uses it produce private GShare (Gamma Share)

      signConvertS21 = MPC.signConvert({
        muShare: signConvertS12.muShare,
        bShare: signConvertS21.bShare,
      });

      // Step Six
      // signerOne and signerTwo both have successfully generated GShares and they use
      // the sign combine function to generate their private omicron shares and
      // delta shares which they share to each other

      const [signCombineOne, signCombineTwo] = [
        MPC.signCombine({
          gShares: signConvertS12.gShare as ECDSA.GShare,
          signIndex: {
            i: (signConvertS12.muShare as ECDSA.MUShare).i,
            j: (signConvertS12.muShare as ECDSA.MUShare).j,
          },
        }),
        MPC.signCombine({
          gShares: signConvertS21.gShare as ECDSA.GShare,
          signIndex: {
            i: (signConvertS21.muShare as ECDSA.MUShare).i,
            j: (signConvertS21.muShare as ECDSA.MUShare).j,
          },
        }),
      ];

      const MESSAGE = Buffer.from('TOO MANY SECRETS');

      // Step Seven
      // signerOne and signerTwo shares the delta share from each other
      // and finally signs the message using their private OShare
      // and delta share received from the other signer

      const [signA, signB] = [
        MPC.sign(MESSAGE, signCombineOne.oShare, signCombineTwo.dShare),
        MPC.sign(MESSAGE, signCombineTwo.oShare, signCombineOne.dShare),
      ];

      // Step Eight
      // Construct the final signature

      const signature = MPC.constructSignature([signA, signB]);

      // Step Nine
      // Verify signature

      const isValid = MPC.verify(MESSAGE, signature);
      isValid.should.equal(true);
    }
  });
});
