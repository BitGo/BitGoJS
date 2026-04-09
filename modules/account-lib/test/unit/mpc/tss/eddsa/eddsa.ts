/**
 * @prettier
 */
import 'should';
import assert from 'assert';
import * as bs58 from 'bs58';
import { randomBytes } from 'crypto';
import * as sol from '@solana/web3.js';

import { Dot, Sol } from '../../../../../src';

import {
  bigIntFromBufferLE,
  bigIntToBufferLE,
  bigIntFromBufferBE,
  bigIntToBufferBE,
  Ed25519BIP32,
  Eddsa,
  HDTree,
} from '@bitgo/sdk-core';

describe('TSS EDDSA key generation and signing', function () {
  let MPC: Eddsa;
  let hdTree: HDTree;

  before('initialize modules', async function () {
    hdTree = await Ed25519BIP32.initialize();
    MPC = await Eddsa.initialize(hdTree);
  });

  it('should fail to generate keys with invalid config', function () {
    assert.throws(() => MPC.keyShare(0, 2, 3), /Invalid KeyShare config/);
    assert.throws(() => MPC.keyShare(5, 2, 3), /Invalid KeyShare config/);
  });

  it('should sign and verify signature for low number public key', function () {
    // We use little endian encoding. This means that the following value is a number that is shorter than 32 Bytes when
    // leading zeroes are cut off. This is exactly what happened when we passed it to the sodium library for verifying
    // the signature against the public key.
    const y = '991b12a1b41b966a3382db32fe9b7fa9f80433940d0b17a1759f1e45ada83f00';
    const R = 'b14386bb518b675357a4c79d2439166a5fc5a3a0e1c579c7b829eff1e7a7d967';
    const signableHex =
      '01000307991b12a1b41b966a3382db32fe9b7fa9f80433940d0b17a1759f1e45ada83f0041536a20902b6d253b111fe5abe87757c123c28cc5fe4eb0da11b5857f3f38e65290384154058de76870e94672fc02e5f96f23e99307f08c56073ebea94cbc57d4d6429b650666264cbcdfe6070749d586d32781608958931e9b8d01636c4f320000000000000000000000000000000000000000000000000000000000000000b43af3bab20c3f39ef3c148c85640614a41043eeb306de5996380f10ec105a8e06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a91073eab4660e8e3a957c7820d52df6338a8c7b60103bf903cb5f82118430922b02040200030c020000005819b217000000000604010502000a0cf40100000000000009';
    const userToBitgoGShare = {
      i: 1,
      y,
      R,
      gamma: 'fcfd96d4ee4f3399b728b3c820a8eed4a6fa496828e84af2756197993b5df30b',
    };
    const bitgoToUserGShare = {
      i: 3,
      y,
      R,
      gamma: '89d5e45641dc93539a32a6651eaae2448db4d44f6d3040a1390beb14d0225c00',
    };

    const signature = MPC.signCombine([userToBitgoGShare, bitgoToUserGShare]);
    const signablePayloadBuffer = Buffer.from(signableHex, 'hex');
    const verificationResult = MPC.verify(signablePayloadBuffer, signature);
    verificationResult.should.be.true();
  });

  it('should generate keys and sign message', function () {
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
    const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

    const message = 'MPC on a Friday night';
    const message_buffer = Buffer.from(message);

    const incorrect_message = 'MPC on a Monday night';
    const incorrect_message_buffer = Buffer.from(incorrect_message);

    // signing with A and B
    let A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    let B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);
    let A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
    let B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);
    let signature = MPC.signCombine([A_sign, B_sign]);
    let result = MPC.verify(message_buffer, signature);
    result.should.equal(true);
    let resultTwo = MPC.verify(incorrect_message_buffer, signature);
    resultTwo.should.equal(false);

    // signing with A and C
    A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[3]]);
    let C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1]]);
    A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [C_sign_share.rShares[1]], [B.yShares[1]]);
    let C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3]], [B.yShares[3]]);
    signature = MPC.signCombine([A_sign, C_sign]);
    result = MPC.verify(message_buffer, signature);
    result.should.equal(true);
    resultTwo = MPC.verify(incorrect_message_buffer, signature);
    resultTwo.should.equal(false);

    // signing with B and C
    B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[3]]);
    C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[2]]);
    B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [C_sign_share.rShares[2]], [A.yShares[2]]);
    C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [B_sign_share.rShares[3]], [A.yShares[3]]);
    signature = MPC.signCombine([B_sign, C_sign]);
    result = MPC.verify(message_buffer, signature);
    result.should.equal(true);
    resultTwo = MPC.verify(incorrect_message_buffer, signature);
    resultTwo.should.equal(false);
  });

  it('should verify BIP32 subkey signature', function () {
    const path = 'm/0/1/2';
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    // Combine shares to common base address.
    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);

    // Party A derives subkey P share and new Y shares.
    const A_subkey = MPC.keyDerive(A.uShare, [B.yShares[1], C.yShares[1]], path);

    // Party B calculates new P share using party A's subkey Y shares.
    const B_subkey = MPC.keyCombine(B.uShare, [A_subkey.yShares[2], C.yShares[2]]);

    // Derive the public subkeychain separately using the common keychain.
    const subkey = hdTree.publicDerive(
      {
        pk: bigIntFromBufferLE(Buffer.from(A_combine.pShare.y, 'hex')),
        chaincode: bigIntFromBufferBE(Buffer.from(A_combine.pShare.chaincode, 'hex')),
      },
      path,
    );
    const y = bigIntToBufferLE(subkey.pk, 32).toString('hex');
    const chaincode = bigIntToBufferBE(subkey.chaincode, 32).toString('hex');

    // Verify the keychain in the subkey P shares equals the separately derived public subkeychain.
    A_subkey.pShare.y.should.equal(y);
    A_subkey.pShare.chaincode.should.equal(chaincode);
    B_subkey.pShare.y.should.equal(y);
    B_subkey.pShare.chaincode.should.equal(chaincode);

    const message = 'MPC on a Friday night';
    const message_buffer = Buffer.from(message);

    // Signing with A and B using subkey P shares.
    const A_sign_share = MPC.signShare(message_buffer, A_subkey.pShare, [A_combine.jShares[2]]);
    const B_sign_share = MPC.signShare(message_buffer, B_subkey.pShare, [B_combine.jShares[1]]);
    const A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
    const B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);
    const signature = MPC.signCombine([A_sign, B_sign]);
    const result = MPC.verify(message_buffer, signature);
    result.should.equal(true);

    // Verify the public key in the signature equals the separately derived public subkey.
    signature.y.should.equal(y);
  });

  it('should derive unhardened child keys', function () {
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);

    const commonKeychain = A_combine.pShare.y + A_combine.pShare.chaincode;

    for (let index = 0; index < 10; index++) {
      const path = `m/0/0/${index}`;
      const derive1 = MPC.deriveUnhardened(commonKeychain, path);
      const subkey = MPC.keyDerive(A.uShare, [B.yShares[1], C.yShares[1]], path);
      const derive2 = MPC.deriveUnhardened(commonKeychain, path);
      const derivedPk = derive1.slice(0, 64);

      (subkey.pShare.y + subkey.pShare.chaincode).should.equal(derive1);
      derive1.should.equal(derive2, 'derivation should be deterministic');

      const solAddress = bs58.encode(Buffer.from(derivedPk, 'hex'));
      Sol.Utils.isValidPublicKey(solAddress).should.be.true();

      const solPk = new sol.PublicKey(solAddress);
      solPk.toBuffer().toString('hex').should.equal(derivedPk);
    }

    const rootPath = 'm/0';
    const rootKeychain = MPC.deriveUnhardened(commonKeychain, rootPath);
    const rootPublicKey = Buffer.from(rootKeychain, 'hex').slice(0, 32).toString('hex');
    const solPk = new sol.PublicKey(bs58.encode(Buffer.from(rootPublicKey, 'hex')));
    solPk.toBuffer().toString('hex').should.equal(rootPublicKey);
  });

  it('should derive unhardened valid dot child keys', function () {
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);

    const commonKeychain = A_combine.pShare.y + A_combine.pShare.chaincode;

    for (let index = 0; index < 10; index++) {
      const path = `m/0/0/${index}`;
      const derive1 = MPC.deriveUnhardened(commonKeychain, path);
      const derive2 = MPC.deriveUnhardened(commonKeychain, path);
      const derivedPk = Buffer.from(derive1, 'hex').slice(0, 32).toString('hex');

      derive1.should.equal(derive2, 'derivation should be deterministic');

      const pubKeyPair = new Dot.KeyPair({ pub: derivedPk });
      pubKeyPair.getKeys().pub.should.equal(derivedPk);
    }

    const rootPath = 'm/';
    const rootKeychain = MPC.deriveUnhardened(commonKeychain, rootPath);
    const rootPublicKey = Buffer.from(rootKeychain, 'hex').slice(0, 32).toString('hex');
    const pubKeyPair = new Dot.KeyPair({ pub: rootPublicKey });
    pubKeyPair.getKeys().pub.should.equal(rootPublicKey);
  });

  it('should fail signing without meeting threshold', function () {
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
    MPC.verify(message_buffer, signature).should.equal(false);
  });

  describe('with specific seed', function () {
    it('should generate keys and sign message', function () {
      const seed = randomBytes(64);

      const A = MPC.keyShare(1, 2, 3, seed);
      const B = MPC.keyShare(2, 2, 3, seed);
      const C = MPC.keyShare(3, 2, 3, seed);

      // Keys should be deterministic when using seed
      MPC.keyShare(1, 2, 3, seed).should.deepEqual(A);
      MPC.keyShare(2, 2, 3, seed).should.deepEqual(B);
      MPC.keyShare(3, 2, 3, seed).should.deepEqual(C);

      const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
      const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
      const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

      const message = 'MPC on a Friday night';
      const message_buffer = Buffer.from(message);

      // signing with A and B
      let A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]], seed);
      let B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]], seed);
      let A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
      let B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);
      let signature = MPC.signCombine([A_sign, B_sign]);
      let result = MPC.verify(message_buffer, signature);
      result.should.equal(true);

      // signing with A and C
      A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[3]], seed);
      let C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[1]], seed);
      A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [C_sign_share.rShares[1]], [B.yShares[1]]);
      let C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [A_sign_share.rShares[3]], [B.yShares[3]]);
      signature = MPC.signCombine([A_sign, C_sign]);
      result = MPC.verify(message_buffer, signature);
      result.should.equal(true);

      // signing with B and C
      B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[3]], seed);
      C_sign_share = MPC.signShare(message_buffer, C_combine.pShare, [C_combine.jShares[2]], seed);
      B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [C_sign_share.rShares[2]], [A.yShares[2]]);
      C_sign = MPC.sign(message_buffer, C_sign_share.xShare, [B_sign_share.rShares[3]], [A.yShares[3]]);
      signature = MPC.signCombine([B_sign, C_sign]);
      result = MPC.verify(message_buffer, signature);
      result.should.equal(true);
    });

    it('should verify BIP32 subkey signature', function () {
      const seed = randomBytes(64);
      const path = 'm/0/1/2';

      const A = MPC.keyShare(1, 2, 3, seed);
      const B = MPC.keyShare(2, 2, 3, seed);
      const C = MPC.keyShare(3, 2, 3, seed);

      // Keys should be deterministic when using seed
      MPC.keyShare(1, 2, 3, seed).should.deepEqual(A);
      MPC.keyShare(2, 2, 3, seed).should.deepEqual(B);
      MPC.keyShare(3, 2, 3, seed).should.deepEqual(C);

      // Combine shares to common base address.
      const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
      const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);

      // Party A derives subkey P share and new Y shares.
      const A_subkey = MPC.keyDerive(A.uShare, [B.yShares[1], C.yShares[1]], path);

      // Party B calculates new P share using party A's subkey Y shares.
      const B_subkey = MPC.keyCombine(B.uShare, [A_subkey.yShares[2], C.yShares[2]]);

      // Derive the public subkeychain separately using the common keychain.
      const subkey = hdTree.publicDerive(
        {
          pk: bigIntFromBufferLE(Buffer.from(A_combine.pShare.y, 'hex')),
          chaincode: bigIntFromBufferBE(Buffer.from(A_combine.pShare.chaincode, 'hex')),
        },
        path,
      );
      const y = bigIntToBufferLE(subkey.pk, 32).toString('hex');
      const chaincode = bigIntToBufferBE(subkey.chaincode, 32).toString('hex');

      // Verify the keychain in the subkey P shares equals the separately derived public subkeychain.
      A_subkey.pShare.y.should.equal(y);
      A_subkey.pShare.chaincode.should.equal(chaincode);
      B_subkey.pShare.y.should.equal(y);
      B_subkey.pShare.chaincode.should.equal(chaincode);

      const message = 'MPC on a Friday night';
      const message_buffer = Buffer.from(message);

      // Signing with A and B using subkey P shares.
      const A_sign_share = MPC.signShare(message_buffer, A_subkey.pShare, [A_combine.jShares[2]]);
      const B_sign_share = MPC.signShare(message_buffer, B_subkey.pShare, [B_combine.jShares[1]]);
      const A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
      const B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);
      const signature = MPC.signCombine([A_sign, B_sign]);
      const result = MPC.verify(message_buffer, signature);
      result.should.equal(true);

      // Verify the public key in the signature equals the separately derived public subkey.
      signature.y.should.equal(y);
    });

    it('should fail if seed is not length 64', function () {
      assert.throws(() => MPC.keyShare(1, 2, 3, randomBytes(33)), /Seed must have length 64/);
      assert.throws(() => MPC.keyShare(1, 2, 3, randomBytes(66)), /Seed must have length 64/);

      const fakePShare = {
        i: 1,
        t: 3,
        n: 2,
        y: 'yString',
        u: 'uString',
        prefix: 'prefix',
        chaincode: 'chaincode',
      };
      assert.throws(
        () => MPC.signShare(Buffer.from('abcd', 'hex'), fakePShare, [], randomBytes(33)),
        /Seed must have length 64/,
      );
      assert.throws(
        () => MPC.signShare(Buffer.from('abcd', 'hex'), fakePShare, [], randomBytes(66)),
        /Seed must have length 64/,
      );
    });
  });
});
