import 'should';

import Eddsa from '../../../src/mpc/tss';
import { KeyPair } from '../../../src/coin/sol';
import * as web3 from '@solana/web3.js';

describe('Solana TSS', function () {
  it('should produce valid signature', async function () {
    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
    const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

    // MARK: Solana specific
    const solKeyPair = new KeyPair({ pub: A_combine.pShare.y });
    const solPubKey = new web3.PublicKey(solKeyPair.getAddress());
    const transaction = new web3.Transaction({
      recentBlockhash: '8d5pPZW8p9BuJVBgw2PSUVrtpkfMvJfnCUvfeSz22gaT',
      feePayer: solPubKey,
    }).add(
      web3.SystemProgram.transfer({
        fromPubkey: solPubKey,
        toPubkey: new web3.PublicKey('9Kpy3a3Fpm3kKkgptDZqxPvA3MVzrYr2TYwMNAmwjKT1'),
        lamports: 1000,
      }),
    );
    const message_buffer = transaction.serializeMessage();
    // END: Solana specific

    // signing with 3-3 signatures
    let A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2], A_combine.jShares[3]]);
    let B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1], B_combine.jShares[3]]);
    let C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1], C_combine.jShares[2]]);
    let A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1], C_sign_share.rShares[1]]);
    let B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2], C_sign_share.rShares[2]]);
    let C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3], B_sign_share.rShares[3]]);
    let signature = MPC.signCombine([A_sign, B_sign, C_sign]);
    let rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

    transaction.signatures = [];
    transaction.addSignature(solPubKey, rawSignature);
    transaction.verifySignatures().should.be.true();

    // signing with A and B
    A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);
    A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]]);
    signature = MPC.signCombine([A_sign, B_sign]);
    rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

    transaction.signatures = [];
    transaction.addSignature(solPubKey, rawSignature);
    transaction.verifySignatures().should.be.true();

    // signing with A and C
    A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[3]]);
    C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1]]);
    A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [C_sign_share.rShares[1]]);
    C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3]]);
    signature = MPC.signCombine([A_sign, C_sign]);
    rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

    transaction.signatures = [];
    transaction.addSignature(solPubKey, rawSignature);
    transaction.verifySignatures().should.be.true();

    // signing with B and C
    B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[3]]);
    C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[2]]);
    B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [C_sign_share.rShares[2]]);
    C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [B_sign_share.rShares[3]]);
    signature = MPC.signCombine([B_sign, C_sign]);
    rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

    transaction.signatures = [];
    transaction.addSignature(solPubKey, rawSignature);
    transaction.verifySignatures().should.be.true();
  });

  it('should not produce valid signature without meeting threshold', async function () {
    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);

    const solKeyPair = new KeyPair({ pub: A_combine.pShare.y });
    const solPubKey = new web3.PublicKey(solKeyPair.getAddress());
    const transaction = new web3.Transaction({
      recentBlockhash: '8d5pPZW8p9BuJVBgw2PSUVrtpkfMvJfnCUvfeSz22gaT',
      feePayer: solPubKey,
    }).add(
      web3.SystemProgram.transfer({
        fromPubkey: solPubKey,
        toPubkey: new web3.PublicKey('9Kpy3a3Fpm3kKkgptDZqxPvA3MVzrYr2TYwMNAmwjKT1'),
        lamports: 1000,
      }),
    );
    const message_buffer = transaction.serializeMessage();

    const A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    const B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);

    const A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    const signature = MPC.signCombine([A_sign]);

    const rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
    transaction.addSignature(solPubKey, rawSignature);
    transaction.verifySignatures().should.be.false();
  });
});
