import { describe, it } from 'node:test';
import assert from 'assert';
import BigNumber from 'bignumber.js';
import { WrappedBuilder } from '../../../src';
import { getBuilder } from '../../../src/lib/builder';
import { PARTICIPANTS } from '../../resources';

describe('Trx Contract call Builder', () => {
  const builder = getBuilder('ttrx') as WrappedBuilder;

  describe('Should validate ', () => {
    it('a valid address', () => {
      assert.doesNotThrow(() => builder.validateAddress({ address: PARTICIPANTS.custodian.address }));
    });

    it('an empty address', () => {
      assert.throws(
        () => {
          builder.validateAddress({ address: '' });
        },
        (e: any) => e.message === ' is not a valid base58 address.'
      );
    });

    // hex (0x-prefixed / 41-prefixed) and base58 are encodings of the same TRON address
    it('a hex address (0x-prefixed)', () => {
      assert.doesNotThrow(() => builder.validateAddress({ address: '0x73a5993cd182ae152adad8203163f780c65a8aa5' }));
    });

    it('a hex address (41-prefixed)', () => {
      assert.doesNotThrow(() => builder.validateAddress({ address: '4173a5993cd182ae152adad8203163f780c65a8aa5' }));
    });

    it('an address that is neither base58 nor hex', () => {
      assert.throws(
        () => {
          builder.validateAddress({ address: 'zz73a5993cd182ae152adad8203163f780c65a8aa5' });
        },
        (e: any) =>
          e.message ===
          'zz73a5993cd182ae152adad8203163f780c65a8aa5 is not a valid base58 address: contains invalid Base58 character(s): "0".'
      );
    });

    it('an address containing non-base58 characters (0, O, I, l)', () => {
      assert.throws(
        () => {
          builder.validateAddress({ address: 'TGai5uHgBcoLERrzDXMepqZB8Et7D8nV80' });
        },
        (e: any) =>
          e.message ===
          'TGai5uHgBcoLERrzDXMepqZB8Et7D8nV80 is not a valid base58 address: contains invalid Base58 character(s): "0".'
      );

      assert.throws(
        () => {
          builder.validateAddress({ address: 'TGai5uHgBcoLERrzDXMepqZB8Et7D8nV8l' });
        },
        (e: any) =>
          e.message ===
          'TGai5uHgBcoLERrzDXMepqZB8Et7D8nV8l is not a valid base58 address: contains invalid Base58 character(s): "l".'
      );
    });

    it('an address with valid base58 characters but invalid checksum', () => {
      assert.throws(
        () => {
          builder.validateAddress({ address: 'TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLLZ' });
        },
        (e: any) => e.message === 'TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLLZ is not a valid base58 address.'
      );
    });

    it('a valid value', () => {
      const value = new BigNumber('13456');
      assert.doesNotThrow(() => builder.validateValue(value));
    });

    it('a negative value', () => {
      const value = new BigNumber('-13456');
      assert.throws(
        () => {
          builder.validateValue(value);
        },
        (e: any) => e.message === 'Value cannot be below zero.'
      );
    });

    it('a value too big', () => {
      const value = new BigNumber('9223372036854775808');
      assert.throws(
        () => {
          builder.validateValue(value);
        },
        (e: any) => e.message === 'Value cannot be greater than handled by the javatron node.'
      );
    });
  });
});
