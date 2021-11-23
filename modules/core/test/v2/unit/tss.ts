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

    const A_combine = MPC.keyCombine([A[1], B[1], C[1]]);
    const B_combine = MPC.keyCombine([A[2], B[2], C[2]]);
    // const C_combine = MPC.keyCombine([A[3], B[3], C[3]]);

    const message = 'MPC on a Friday night';
    const message_buffer = Buffer.from(message, 'utf-8');
    const A_sign_share = MPC.signShare(message_buffer, [A_combine[1], A_combine[2]], 2, 3);
    const B_sign_share = MPC.signShare(message_buffer, [B_combine[1], B_combine[2]], 2, 3);

    const A_sign = MPC.sign(message_buffer, [A_sign_share[1], B_sign_share[1]]);
    const B_sign = MPC.sign(message_buffer, [A_sign_share[2], B_sign_share[2]]);

    const signature = MPC.signCombine([A_sign, B_sign]);
    const result = MPC.verify(message_buffer, signature);
    console.log(Buffer.from(result).toString());
  });
});
