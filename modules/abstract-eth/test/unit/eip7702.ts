import should from 'should';
import { bufferToHex } from 'ethereumjs-util';
import {
  computeSetCodeAuthorizationDigest,
  buildSetCodeTransaction,
  parseSetCodeTransaction,
  getSetCodeTransactionSigningHash,
  SET_CODE_TX_TYPE,
  DELEGATION_PREFIX,
} from '../../src/lib/eip7702';

/**
 * Reference vector generated with the official @ethereumjs/tx v5
 * `EOACodeEIP7702Transaction` (hardfork prague, eips [7702]) for:
 *   chainId=1, nonce=0, maxPriorityFeePerGas=1, maxFeePerGas=30, gasLimit=21000,
 *   destination=address, value=0, data=0x, single authorization
 *   (chainId=1, address=address, nonce=0) signed by the same key.
 * Serialized bytes are expressed as decimal arrays to keep them legible in
 * source; each value is one byte.
 */
const ADDRESS = '0xbe78addef3bf432e660f0944e372954d1d287fe2';

// keccak256(0x05 || rlp([1, address, 0]))
const EXPECTED_AUTH_DIGEST_BYTES = [
  136, 136, 244, 229, 102, 255, 237, 181, 15, 157, 139, 231, 95, 203, 240, 217, 175, 144, 224, 213, 242, 214, 151, 202,
  217, 167, 243, 97, 139, 161, 83, 234,
];

// Authorization signature (r, s) from the same key over EXPECTED_AUTH_DIGEST.
const AUTH_R_BYTES = [
  25, 229, 118, 20, 137, 169, 86, 96, 43, 249, 69, 39, 108, 155, 222, 155, 34, 67, 100, 144, 182, 168, 92, 18, 23,
  212, 148, 74, 48, 85, 15, 18,
];
const AUTH_S_BYTES = [
  113, 131, 176, 111, 21, 92, 14, 192, 100, 196, 201, 90, 152, 101, 90, 103, 97, 132, 66, 18, 156, 199, 146, 43, 229,
  16, 60, 235, 190, 188, 221, 235,
];

// Transaction envelope signature (yParity, r, s).
const ENVELOPE_R_BYTES = [
  47, 223, 167, 78, 21, 168, 232, 3, 184, 81, 179, 23, 135, 208, 15, 246, 230, 97, 31, 50, 233, 68, 50, 252, 85, 107,
  206, 81, 237, 215, 86, 247,
];
const ENVELOPE_S_BYTES = [
  122, 136, 155, 55, 93, 184, 202, 64, 135, 102, 78, 167, 138, 136, 145, 21, 253, 192, 94, 138, 158, 241, 135, 149,
  161, 49, 99, 16, 51, 244, 161, 252,
];

// Fully signed set code transaction serialized by @ethereumjs/tx v5.
const EXPECTED_SERIALIZED_BYTES = [
  4, 248, 193, 1, 128, 1, 30, 130, 82, 8, 148, 190, 120, 173, 222, 243, 191, 67, 46, 102, 15, 9, 68, 227, 114, 149,
  77, 29, 40, 127, 226, 128, 128, 192, 248, 93, 248, 91, 1, 148, 190, 120, 173, 222, 243, 191, 67, 46, 102, 15, 9, 68,
  227, 114, 149, 77, 29, 40, 127, 226, 193, 128, 128, 160, 25, 229, 118, 20, 137, 169, 86, 96, 43, 249, 69, 39, 108,
  155, 222, 155, 34, 67, 100, 144, 182, 168, 92, 18, 23, 212, 148, 74, 48, 85, 15, 18, 160, 113, 131, 176, 111, 21,
  92, 14, 192, 100, 196, 201, 90, 152, 101, 90, 103, 97, 132, 66, 18, 156, 199, 146, 43, 229, 16, 60, 235, 190, 188,
  221, 235, 1, 160, 47, 223, 167, 78, 21, 168, 232, 3, 184, 81, 179, 23, 135, 208, 15, 246, 230, 97, 31, 50, 233, 68,
  50, 252, 85, 107, 206, 81, 237, 215, 86, 247, 160, 122, 136, 155, 55, 93, 184, 202, 64, 135, 102, 78, 167, 138, 136,
  145, 21, 253, 192, 94, 138, 158, 241, 135, 149, 161, 49, 99, 16, 51, 244, 161, 252,
];

const toHex = (bytes: number[]): string => bufferToHex(Buffer.from(bytes));

const TX_PARAMS = {
  chainId: 1,
  nonce: 0,
  maxPriorityFeePerGas: 1,
  maxFeePerGas: 30,
  gasLimit: 21000,
  destination: ADDRESS,
  value: 0,
  data: '0x',
  authorizationList: [
    {
      chainId: 1,
      address: ADDRESS,
      nonce: 0,
      yParity: 0 as const,
      r: toHex(AUTH_R_BYTES),
      s: toHex(AUTH_S_BYTES),
    },
  ],
};

describe('EIP-7702', () => {
  describe('computeSetCodeAuthorizationDigest', () => {
    it('matches the @ethereumjs reference digest byte-for-byte', () => {
      const digest = computeSetCodeAuthorizationDigest({ chainId: 1, address: ADDRESS, nonce: 0 });
      digest.should.deepEqual(Buffer.from(EXPECTED_AUTH_DIGEST_BYTES));
    });

    it('returns a 32-byte digest', () => {
      const digest = computeSetCodeAuthorizationDigest({ chainId: 1, address: ADDRESS, nonce: 0 });
      digest.length.should.equal(32);
    });
  });

  describe('buildSetCodeTransaction', () => {
    it('produces byte-for-byte identical output to @ethereumjs/tx v5', () => {
      const signed = buildSetCodeTransaction({
        ...TX_PARAMS,
        yParity: 1,
        r: toHex(ENVELOPE_R_BYTES),
        s: toHex(ENVELOPE_S_BYTES),
      });
      Buffer.from(signed).should.deepEqual(Buffer.from(EXPECTED_SERIALIZED_BYTES));
      signed[0].should.equal(SET_CODE_TX_TYPE);
    });

    it('uses the delegation indicator prefix constant', () => {
      DELEGATION_PREFIX.toString('hex').should.equal('ef0100');
    });
  });

  describe('parseSetCodeTransaction', () => {
    it('round-trips a serialized set code transaction', () => {
      const signed = buildSetCodeTransaction({
        ...TX_PARAMS,
        yParity: 1,
        r: toHex(ENVELOPE_R_BYTES),
        s: toHex(ENVELOPE_S_BYTES),
      });
      const parsed = parseSetCodeTransaction(signed.toString('hex'));
      parsed.chainId.should.equal('0x01');
      parsed.nonce.should.equal('0x');
      parsed.maxPriorityFeePerGas.should.equal('0x01');
      parsed.maxFeePerGas.should.equal('0x1e');
      parsed.gasLimit.should.equal('0x5208');
      parsed.destination.toLowerCase().should.equal(ADDRESS.toLowerCase());
      parsed.value.should.equal('0x');
      parsed.data.should.equal('0x');
      parsed.yParity.should.equal(1);
      parsed.authorizationList.should.have.length(1);
      parsed.authorizationList[0].address.toLowerCase().should.equal(ADDRESS.toLowerCase());
      parsed.authorizationList[0].yParity.should.equal(0);
    });

    it('rejects a non-set-code transaction type', () => {
      should.throws(() => parseSetCodeTransaction('0x02'), /Expected set code tx type 0x04/);
    });
  });

  describe('getSetCodeTransactionSigningHash', () => {
    it('returns a 32-byte keccak hash', () => {
      const hash = getSetCodeTransactionSigningHash(TX_PARAMS as never);
      hash.length.should.equal(32);
    });
  });
});
