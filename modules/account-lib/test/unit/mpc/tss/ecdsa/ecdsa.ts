import { Ecdsa } from '@bitgo/sdk-core';
/**
 * @prettier
 */

describe('TSS ECDSA key generation', function () {
  const MPC = new Ecdsa();
  it('should generate keys with correct threshold and share number', async function () {
    this.timeout(50000);
    const [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);

    const A_combine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const B_combine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const C_combine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);
    const keyShares = [A_combine, B_combine, C_combine];
    const commonPublicKey = A_combine.xShare.y;

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
});
