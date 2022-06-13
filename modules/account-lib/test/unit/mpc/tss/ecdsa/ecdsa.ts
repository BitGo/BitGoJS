import { Ecdsa, EDDSA } from '@bitgo/sdk-core';
/**
 * @prettier
 */

describe('TSS ECDSA key generation', function () {
  const MPC = new Ecdsa();
  let keyShares: EDDSA.KeyCombined[];
  let commonPublicKey: string;

  before(async () => {
    this.timeout(50000);
    const [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);

    const A_combine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const B_combine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const C_combine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);
    keyShares = [A_combine, B_combine, C_combine];
    commonPublicKey = A_combine.xShare.y;
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
      keyShares[index].xShare.chaincode.should.not.be.Null;

      keyShares[index].yShares[participantTwo].i.should.equal(participantOne);
      keyShares[index].yShares[participantThree].i.should.equal(participantOne);
      keyShares[index].yShares[participantTwo].j.should.equal(participantTwo);
      keyShares[index].yShares[participantThree].j.should.equal(participantThree);
      keyShares[index].yShares[participantTwo].n.should.not.be.Null;
      keyShares[index].yShares[participantThree].n.should.not.be.Null;
    }
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
    // Step One
    // A, B have decided to sign the message
    const [A, B] = keyShares;

    // Step Two
    // Sign Shares are created by one of the participants (A)
    // with its private XShare and YShare corresponding to the other participant (B)
    // This step produces a private WShare which A saves and KShare which A sends to B
    const signSharesAB: EDDSA.SignShareRT = MPC.signShare(A.xShare, A.yShares['2']);

    // Step Three
    // B receives the KShare from A and uses it produce private
    // BShare (Beta Share) which B saves and AShare (Alpha Share)
    // which is sent to A
    let signConvertBA: EDDSA.SignConvertRT = MPC.signConvert({
      xShare: B.xShare,
      yShare: B.yShares['1'], // YShare corresponding to the other participant A
      kShare: signSharesAB.kShare,
    });

    // Step Four
    // A receives the AShare from B and A using the private WShare from step two
    // uses it produce private GShare (Gamma Share) and MUShare (Mu Share) which
    // is sent to B to produce its Gamma Share
    const signConvertAB: EDDSA.SignConvertRT = MPC.signConvert({
      aShare: signConvertBA.aShare,
      wShare: signSharesAB.wShare,
    });

    // Step Five
    // B receives the MUShare from A and A using the private BShare from step three
    // uses it produce private GShare (Gamma Share)

    signConvertBA = MPC.signConvert({
      muShare: signConvertAB.muShare,
      bShare: signConvertBA.bShare,
    });

    // Step Six
    // A and B both have successfully generated GShares and they use
    // the sign combine function to generate their private omicron shares and
    // delta shares which they share to each other

    const [signCombineA, signCombineB] = [
      MPC.signCombine({
        gShares: signConvertAB.gShare,
        giveMeANameShare: {
          i: signConvertAB.muShare.i,
          j: signConvertAB.muShare.j,
        },
      }),
      MPC.signCombine({
        gShares: signConvertBA.gShare,
        giveMeANameShare: {
          i: signConvertBA.muShare.i,
          j: signConvertBA.muShare.j,
        },
      }),
    ];

    const MESSAGE = Buffer.from('I AM SATOSHI NAKAMOTO');

    // Step Seven
    // A and B shares the delta share from each other
    // and finally signs the message using their private OShare
    // and delta share received from the other participant

    const [signA, signB] = [
      MPC.sign(MESSAGE, signCombineA.oShare, signCombineB.dShare),
      MPC.sign(MESSAGE, signCombineB.oShare, signCombineA.dShare),
    ];

    // Step Eight
    // Construct the final signature

    const signature = MPC.constructSignature([signA, signB]);

    // Step Nine
    // Verify signature

    const isValid = MPC.verify(MESSAGE, signature);
    isValid.should.equal(false); // @todo Need to recheck
  });
});
