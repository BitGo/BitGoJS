import 'should';
import { randomBytes } from 'crypto';
import { createCommitment, verifyCommitment } from '../../src/hashCommitment';

describe('hash commitment', function () {
  it('should create and verify hash commitment', function () {
    const buf1 = Buffer.alloc(16);
    buf1.fill(1);
    const buf2 = Buffer.alloc(16);
    buf2.fill(2);

    const comDecom = createCommitment(Buffer.concat([buf1, buf2]));

    verifyCommitment(comDecom.commitment, comDecom.decommitment).should.be.true();

    const comDecom2 = createCommitment(Buffer.concat([buf1, buf2]), Buffer.concat([randomBytes(32), randomBytes(32)]));

    verifyCommitment(comDecom2.commitment, comDecom2.decommitment).should.be.true();
  });

  it('should throw an error when r is less than 32 bytes', function () {
    const secret = randomBytes(16);
    const r = randomBytes(31);

    (() => createCommitment(secret, r)).should.throwError('randomness must be at least 32 bytes long');
  });

  it('should return false when verifying an incorrect decommitment', function () {
    const one = BigInt(1);
    const two = BigInt(2);
    const r0 = randomBytes(36);
    const secret = Buffer.from(one.toString(16) + two.toString(16), 'hex');

    const comDecom = createCommitment(secret, r0);

    const r1 = randomBytes(32);

    // decommit with a different nonce
    verifyCommitment(comDecom.commitment, {
      blindingFactor: r1,
      secret: secret,
    }).should.be.false();

    // decommit with the wrong secret value
    verifyCommitment(comDecom.commitment, {
      blindingFactor: comDecom.decommitment.blindingFactor,
      secret: Buffer.from('a-Z'),
    }).should.be.false();
  });
});
