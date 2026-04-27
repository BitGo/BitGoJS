import 'should';
import { DelegateVotesBuilder } from '../../src';

describe('DelegateVotesBuilder', () => {
  const delegatee = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  const nonce = 0;
  // expiry: year 2030 unix timestamp
  const expiry = 1893456000;
  const v = 27;
  const r = '0x' + 'ab'.repeat(32);
  const s = '0x' + 'cd'.repeat(32);

  describe('build', () => {
    it('should build valid calldata for delegateBySig', () => {
      const calldata = new DelegateVotesBuilder()
        .delegatee(delegatee)
        .nonce(nonce)
        .expiry(expiry)
        .signature({ v, r, s })
        .build();

      // Must start with delegateBySig selector 0x5c19a95c
      calldata.should.startWith('0x5c19a95c');
      // Calldata: 4 bytes selector + 6 * 32 bytes params = 196 bytes = 392 hex chars + '0x' prefix
      calldata.length.should.equal(2 + 8 + 6 * 64);
    });

    it('should accept string nonce and expiry', () => {
      const calldata = new DelegateVotesBuilder()
        .delegatee(delegatee)
        .nonce('42')
        .expiry('1893456000')
        .signature({ v, r, s })
        .build();

      calldata.should.startWith('0x5c19a95c');
    });

    it('should accept v=28', () => {
      const calldata = new DelegateVotesBuilder()
        .delegatee(delegatee)
        .nonce(nonce)
        .expiry(expiry)
        .signature({ v: 28, r, s })
        .build();

      calldata.should.startWith('0x5c19a95c');
    });
  });

  describe('validation', () => {
    it('should throw for invalid delegatee address', () => {
      (() => new DelegateVotesBuilder().delegatee('notanaddress')).should.throw('Invalid delegatee address');
    });

    it('should throw for negative nonce', () => {
      (() => new DelegateVotesBuilder().nonce(-1)).should.throw('Nonce must be non-negative');
    });

    it('should throw for zero or negative expiry', () => {
      (() => new DelegateVotesBuilder().expiry(0)).should.throw('Expiry must be a positive unix timestamp');
    });

    it('should throw for invalid v value', () => {
      (() =>
        new DelegateVotesBuilder()
          .delegatee(delegatee)
          .nonce(nonce)
          .expiry(expiry)
          .signature({ v: 26, r, s })).should.throw('v must be 27 or 28');
    });

    it('should throw for invalid r (wrong length)', () => {
      (() =>
        new DelegateVotesBuilder()
          .delegatee(delegatee)
          .nonce(nonce)
          .expiry(expiry)
          .signature({ v, r: '0xabcd', s })).should.throw('r must be a 32-byte hex string');
    });

    it('should throw for invalid s (wrong length)', () => {
      (() =>
        new DelegateVotesBuilder()
          .delegatee(delegatee)
          .nonce(nonce)
          .expiry(expiry)
          .signature({ v, r, s: '0xabcd' })).should.throw('s must be a 32-byte hex string');
    });

    it('should throw when building with missing fields', () => {
      (() => new DelegateVotesBuilder().build()).should.throw(
        'Missing required fields: delegatee, nonce, expiry, and signature (v, r, s) are all required'
      );
    });

    it('should throw when signature is missing', () => {
      (() => new DelegateVotesBuilder().delegatee(delegatee).nonce(nonce).expiry(expiry).build()).should.throw(
        'Missing required fields: delegatee, nonce, expiry, and signature (v, r, s) are all required'
      );
    });
  });
});
