/**
 * @prettier
 */
import 'should';

import Eddsa from '../../../src/mpc/tss';
import * as bs58 from 'bs58';

describe('TSS EDDSA key generation and signing', () => {
  it('test stuff out', async function () {
    const bitGoToUser = {
      from: 'bitgo',
      to: 'user',
      publicShare: 'EeL2tSJy7qrwXzb4y9KjzAZekXwZcHELiXpR11UtuEEE',
      privateShare:
        '-----BEGIN PGP MESSAGE-----\n\nwV4DxmrTKaR3YusSAQdAU4AjEMaWrNOE6uR6x3nzfwHsg1b+5okLZILXxYEn\naEYwI5UkZEnuO/nKehEqy3IbS0a5+kvRSvVvS7yw2OxTzUSY6zMboNJUB3tT\nVn7CRwtx0nEBpjzLiWH+XONIjejMz5uKzPC+DYdvOa/IIDHJYZn/SjmQegOH\nBbn4fbsHrkVFdykfsuel/4XSoFKzfczdj0gEjefQbhBnCs4DEsWAOevS+LJ5\nqn8i35dfgCwc+CgtbyUlUUaaAsPR41igOkebMaXSLA==\n=C6i9\n-----END PGP MESSAGE-----\n',
    };

    console.log(bs58.decode(bitGoToUser.publicShare).toString('hex'));
  });
  it('should generate keys and sign message', async () => {
    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    console.log('A', A.yShares);
    console.log('B', B.yShares);
    console.log('C', C.yShares);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
    const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

    console.log(A_combine.pShare.y);
    console.log(B_combine.pShare.y);
    console.log(C_combine.pShare.y);

    const message = 'MPC on a Friday night';
    const message_buffer = Buffer.from(message, 'utf-8');

    // signing with 3-3 signatures
    let A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2], A_combine.jShares[3]]);
    let B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1], B_combine.jShares[3]]);
    let C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1], C_combine.jShares[2]]);
    let A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1], C_sign_share.rShares[1]]);
    let B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2], C_sign_share.rShares[2]]);
    let C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3], B_sign_share.rShares[3]]);
    let signature = MPC.signCombine([A_sign, B_sign, C_sign]);
    let result = MPC.verify(message_buffer, signature).toString();
    result.should.equal(message);

    // signing with A and B
    A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);
    A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]]);
    signature = MPC.signCombine([A_sign, B_sign]);
    result = MPC.verify(message_buffer, signature).toString();
    result.should.equal(message);

    // signing with A and C
    A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[3]]);
    C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1]]);
    A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [C_sign_share.rShares[1]]);
    C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3]]);
    signature = MPC.signCombine([A_sign, C_sign]);
    result = MPC.verify(message_buffer, signature).toString();
    result.should.equal(message);

    // signing with B and C
    B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[3]]);
    C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[2]]);
    B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [C_sign_share.rShares[2]]);
    C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [B_sign_share.rShares[3]]);
    signature = MPC.signCombine([B_sign, C_sign]);
    result = MPC.verify(message_buffer, signature).toString();
    result.should.equal(message);
  });
  it('should fail signing without meeting threshold', async () => {
    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);

    const message = 'MPC on a Friday night';
    const message_buffer = Buffer.from(message, 'utf-8');
    const A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    const B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);

    const A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    const signature = MPC.signCombine([A_sign]);
    const result = () => {
      MPC.verify(message_buffer, signature).toString();
    };
    result.should.throw();
  });
});
