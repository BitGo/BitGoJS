/**
 * @prettier
 */
import Eddsa from '../../../src/mpc/tss';
import { KeyPair, TransferBuilder } from '../../../src/coin/dot';
import utils from '../../../src/coin/dot/utils';
import { coins } from '@bitgo/statics';
import { rawTx } from '../../resources/dot';

describe('Polkadot TSS', function () {
  it('should produce valid signature', async function () {
    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
    const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

    // START: Polkadot specific
    const dotKeyPair = new KeyPair({ pub: A_combine.pShare.y });
    // const message_buffer = Buffer.from(rawTx.transfer.unsigned, 'hex');
    // const dotKeyPair = new KeyPair({ pub: '5DkddSfPsWojjfuH9iJEcUV7ZseQ9EJ6RjtNmCR1w3CEb8S9' });
    const config = coins.get('tdot');
    const builder = new TransferBuilder(config).material(utils.getMaterial(config));

    builder
      .amount('90034235235322')
      .to({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
      .sender({ address: dotKeyPair.getAddress() })
      .validity({ firstValid: 3933, maxDuration: 64 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
      .fee({ amount: 0, type: 'tip' });

    const tx = await builder.build();
    const message_buffer = Buffer.from(tx.toBroadcastFormat(), 'hex');
    // END: Polkadot specific

    // signing with 3-3 signatures
    let A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2], A_combine.jShares[3]]);
    let B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1], B_combine.jShares[3]]);
    let C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1], C_combine.jShares[2]]);
    let A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1], C_sign_share.rShares[1]]);
    let B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2], C_sign_share.rShares[2]]);
    let C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3], B_sign_share.rShares[3]]);
    let signature = MPC.signCombine([A_sign, B_sign, C_sign]);
    let rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
    dotKeyPair.verifySignature(message_buffer, rawSignature).should.be.true();

    // signing with A and B
    A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);
    A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]]);
    signature = MPC.signCombine([A_sign, B_sign]);
    rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
    dotKeyPair.verifySignature(message_buffer, rawSignature).should.be.true();

    // signing with A and C
    A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[3]]);
    C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1]]);
    A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [C_sign_share.rShares[1]]);
    C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3]]);
    signature = MPC.signCombine([A_sign, C_sign]);
    rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
    dotKeyPair.verifySignature(message_buffer, rawSignature).should.be.true();

    // signing with B and C
    B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[3]]);
    C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[2]]);
    B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [C_sign_share.rShares[2]]);
    C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [B_sign_share.rShares[3]]);
    signature = MPC.signCombine([B_sign, C_sign]);
    rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
    dotKeyPair.verifySignature(message_buffer, rawSignature).should.be.true();
  });

  it('should not produce valid signature without meeting threshold', async function () {
    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);

    // START: Polkadot specific
    const dotKeyPair = new KeyPair({ pub: A_combine.pShare.y });
    const message_buffer = Buffer.from(rawTx.transfer.unsigned, 'hex');
    // END: Polkadot specific

    const A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    const B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);

    const A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    const signature = MPC.signCombine([A_sign]);
    const rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

    dotKeyPair.verifySignature(message_buffer, rawSignature).should.be.false();
  });
});
