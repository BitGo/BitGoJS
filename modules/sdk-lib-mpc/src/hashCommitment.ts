import { createHash, randomBytes } from 'crypto';
import { HashCommitDecommit, HashDecommitment } from './types';
import { bigIntToBufferBE } from './util';

const minRandomnessLength = 32;

/**
 * Create hash commitment and decommietment of a secret value.
 * @param secret The secret value/message.
 * @param r The randomness/nonce to be added to the commmitment.
 * @returns The created commitment and decommitment.
 */
export function createCommitment(secret: Buffer, r: Buffer = randomBytes(minRandomnessLength)): HashCommitDecommit {
  if (r.length < minRandomnessLength) {
    throw new Error(`randomness must be at least ${minRandomnessLength} bytes long`);
  }
  return {
    commitment: hash(secret, r),
    decommitment: {
      blindingFactor: r,
      secret: secret,
    },
  };
}

const bytesPerUint32 = 4;

function hash(secret: Buffer, r: Buffer): Buffer {
  return createHash('sha256')
    .update(bigIntToBufferBE(BigInt(secret.length), bytesPerUint32))
    .update(secret)
    .update(bigIntToBufferBE(BigInt(r.length), bytesPerUint32))
    .update(r)
    .digest();
}

/**
 * Verify hash commitment and decommietment of a secret value.
 * @param commitment The commitment.
 * @param decommietment The decommitment.
 * @returns True if verification succeeds.
 */
export function verifyCommitment(commitment: Buffer, decommietment: HashDecommitment): boolean {
  return hash(decommietment.secret, decommietment.blindingFactor).compare(commitment) === 0;
}
