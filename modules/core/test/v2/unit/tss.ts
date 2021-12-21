/**
 * @prettier
 */
import 'should';

import Eddsa from '../../../src/mpc/tss';

describe('TSS EDDSA key generation and signing', () => {
  it('should generate keys and sign message', async () => {
    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
    // const C_combine = MPC.keyCombine([A[3], B[3], C[3]]);

    const message = 'MPC on a Friday night';
    const message_buffer = Buffer.from(message, 'utf-8');
    const A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    const B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);

    const A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    const B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]]);

    const signature = MPC.signCombine([A_sign, B_sign]);
    const result = MPC.verify(message_buffer, signature).toString();
    result.should.equal(message);
  });
});
