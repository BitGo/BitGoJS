import { Ecdsa, ECDSA } from '@bitgo/sdk-core';
/**
 * @prettier
 */

describe('TSS ECDSA TESTS', function () {
  const MPC = new Ecdsa();
  const base = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000'); // 2^256
  let keyShares: ECDSA.KeyCombined[];
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
    this.timeout(50000);
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
    const mockPShare = {
      i: 1,
      l: '0xdb9befbfbb99c1166c558de80c2ea4b44a78ef7717caaf6a1b10f9b4d1b82cb7e4fb83d64effed3c1ad7b13dedc3560da7f3603498d363f512cd14f71ad94c09c858d8025c96a1470680a3070be195365dc74bfea1b15fef0ad545838cc10ca29c21c0412988a8cc76633dfb65d97603c32627f21bebb0bc32dbe8361591be06d55f9838b55ee989a660fec51ec26947005cb998278dfdc6b3d0c19ab4e3ee410c91e5d32cb2a4a2d8a5a3261505a87825da2561f411a4594b71178de93dce9aba2fa67b5caeb662e8137d1fa5b8eb475d7e020e6fa9544ab0ad0a06eaa8c8e2865e90a5f17f7c836220c5c093582c27d14510a22b3896cd593fcea11c37f5831a08b54eb159551fb4c04a73d67e4314e5b2296f8e168c1b05f84d9955cfea63f059c2643f45c5ff9397783ee9d509143b0975c89efa71e21177323483f177b94fa4eae320922234a1e66c254c58ecc5d49acabc725560f35c161348625f2457e0887edeb49b98c2bb5738add6bb30773465faebe3765bf429ae795d13a730d4',
      m: '0xd4f8390be4d0dc912e1714c71c70a315189e982ec6697ec112f91184f24de8d23e4118a3e945524a2b6be336c8b05918f3404b93bdfefd3574e8e043c641e30dc445d4c6d0a38ad3a45aa15bc8d37ce76b3a68e821f82d90f0f66416a2236334e3a0132f780005a4608de96e517041f59f25ac31816e860b00dc0a589f26d0c4dbfa5e07b847c5d4a5a405cb3e788810b226ea8befa8aa358211fd241a149f8434c96a082a9ef14adc96b521c05f54eac16afa4e5b329aa299b6fe5c3c73e7e9ac9fed0901f9a14d3cbe36513da375a1ee5654f21f8cf15dd199b468367383c36c9e350bd1082fbfce892eef0ba85163f276a34ba05fb601744b6aadfa24ee6f69ca6576c8510d27f6bd90926c884acb066727598440421c30b7147aad4b8f57f1176b66356393b03e7871ce2daf97f0b348187f38722985d2be4259212a6711f2e7c1a6af401eacf9727c3d8c592371293bbe9d1325c5e8ea9f317d0a182286cbbd60930ab40462bcc94a8e8a3a41a0a8a1c5c5639f653df5285d3eb9095e98',
      n: '0xdb9befbfbb99c1166c558de80c2ea4b44a78ef7717caaf6a1b10f9b4d1b82cb7e4fb83d64effed3c1ad7b13dedc3560da7f3603498d363f512cd14f71ad94c09c858d8025c96a1470680a3070be195365dc74bfea1b15fef0ad545838cc10ca29c21c0412988a8cc76633dfb65d97603c32627f21bebb0bc32dbe8361591be06d55f9838b55ee989a660fec51ec26947005cb998278dfdc6b3d0c19ab4e3ee410c91e5d32cb2a4a2d8a5a3261505a87825da2561f411a4594b71178de93dce9c962c7cc8e9e6bdc65d3934b93dee036b9849244ab4f248d4265c6c3b6b11415aae00dd6ce96133dfd18104f3825415ee282ae86c1a49701f9ab17a94eebef7f0a910529d274efa3548f630ce38f764770a47733727e73469c90a4052f092005421916adb8a910a3a06e23702e83b6bb5c18369304e8c176e7c2bbfdfe9b872467b337b4892252cf83222dbd192b3623a0757ca00d15961e9355fba850df4b038ce14838534740d3747ecd01f1f427924512cbdcdb61e751866c04737318ba9e9',
      y: '0x0341c1edd582ddaf0494133ebdbc254b73caa95d761cb8d80a195e5dc4c249cfb6',
      u: '0x0ed11c9c929bb7c66165b56bce60ad601bc0c5d297dd1a85f371c47517f72bb6',
      chaincode: '01',
    };
    const mockNShares = [
      {
        i: 1,
        j: 2,
        n: '0xf5c642248a4805af52ea32b088f19f4f400ab84dd07f713beeda34a1261364245e187b7ac276f9902a0124197cde1c45f2cf650da0572c0aba10a4d05729914b9b1d3134ca14b470b3c30df04f8eed9881732c679fd355a0e0bb260ce9801f70a988a67aed1cb8ba54ab58771f0a7f8b20112e76ceda8070905f73d0bece4454a95acbe918a9e32af89adafa1ccb3785a70d273bf7ebfb143749850094584130a9777dcc1b38f1b543371ad60e4d4eb8b2a203939044b16fdb5880986a97088ea08303c510f86d0894e3dd24b2896369ecfaefa332ecfc6cbbf119ba710154630f97787cd8e959d42be8ab46e43ddfa36e2ca55e53dfc4df87b2fda3d3f1d63bb9896a6fb52adecb3ea8c95b13ae9b7dd024fd91f078a7a20621a9c866c318bd5e1bcce9e9094d499d5ca30aa84e44836be4166be7aaf7b1bf81e51f1f475288749a4c893c811a6a13c4f4559d87d51148a97800179e4df7a38048f893a25a57493591f16d0dff4265b0119553da1e35909ced6895b270c051e3dc4b9deffdc9',
        y: '0x029c1e58454cc69fa919b1188a478caff6c60a312aa21a1f5333f8b43e18e8286e',
        u: '0x38d6daf4f01dd5f37f8b49941ad4f1fb3e14680f98084e8c524d82a2fa931d43',
        chaincode: '02',
      },
      {
        i: 1,
        j: 3,
        n: '0xc5e377387c12053698c188616198cbf42f9d26e70d9f255ae94e8fc1f1fdc0fda337ffbc558b948331d729734f36490dc07e8da7fdd0251353d48969132a4ebf5215712a0270c326c99630b8cae3a78c844764a685dac32df2385c17855080b9c16e1e5f353b55c445bbe2017070935e8bd601910b05dd4112a079866ad7a3f5b858e874367886d1be1366044cb8d57b6cea365dfb9286894f22128e2e11605cf3c596fa7997646e97132eaff3d3871a759c37e66e68a777b30493cd940d1b7f23b5bf1cbc8649cc8deba1651d00598050fa168a8de0b5c2afbc789343ee0347b2d3feaed6c06d1f509138eb8ff3b5a478fe7ef7fb656f279bb48db3a615f56e880db11f9658eb11713f60d029d01d431415b3cc34d2a47078ee57492f668a1978ad86958ee049c7f5fcd66753a81dacccd78b04d45a7ac1046e25c7d7f2696939fe5c02ae632890ec8414d893b345808ce89d989f5fe779e560fadd1a4b3da8dbe14652dcd044583c36e5543940c17aa06cbbfa6b56d6da7a86d414abf17d69',
        y: '0x032a1ea728a57aa614fc5ef67c0ddac713d698c1a5eefc470b09f150f13ff353a7',
        u: '0xa71c4dd70624b1d6e6471b9e62246b3e063c597599949692c00c8a8cb92bc6f5',
        chaincode: 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f', // curve order
      },
    ];
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
    this.timeout(50000);
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
