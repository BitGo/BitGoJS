/**
 * @prettier
 */
import 'should';

import Eddsa from '../../../src/mpc/tss';

describe('TSS EDDSA key generation and signing', () => {
  it('should generate keys and sign message', async () => {
    const A = await Eddsa.keyShare(1, 2, 3);
    const B = await Eddsa.keyShare(2, 2, 3);
    const C = await Eddsa.keyShare(3, 2, 3);

    const A_combine = await Eddsa.keyCombine([A[1], B[1], C[1]]);
    const B_combine = await Eddsa.keyCombine([A[2], B[2], C[2]]);
    // const C_combine = Eddsa.keyCombine([A[3], B[3], C[3]]);

    const message = 'MPC testing for rollout.';
    const message_buffer = Buffer.from(message, 'utf-8');
    const A_sign_share = await Eddsa.signShare(message_buffer, [A_combine[1], A_combine[2]], 2, 3);
    const B_sign_share = await Eddsa.signShare(message_buffer, [B_combine[1], B_combine[2]], 2, 3);

    const A_sign = await Eddsa.sign(message_buffer, [A_sign_share[1], B_sign_share[1]]);
    const B_sign = await Eddsa.sign(message_buffer, [A_sign_share[2], B_sign_share[2]]);

    const signature = await Eddsa.signCombine([A_sign, B_sign]);
    // const result = await Eddsa.verify(message_buffer, signature);
    // result.should.equal(true);
  });
});
