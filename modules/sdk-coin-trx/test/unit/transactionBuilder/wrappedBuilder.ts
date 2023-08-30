import assert from 'assert';
import BigNumber from 'bignumber.js';
import should from 'should';
import { WrappedBuilder } from '../../../src';
import { getBuilder } from '../../../src/lib/builder';
import { PARTICIPANTS } from '../../resources';

describe('Trx Contract call Builder', () => {
  const builder = getBuilder('ttrx') as WrappedBuilder;

  describe('Should validate ', () => {
    it('a valid address', () => {
      should.doesNotThrow(() => builder.validateAddress({ address: PARTICIPANTS.custodian.address }));
    });

    it('an empty address', () => {
      assert.throws(
        () => {
          builder.validateAddress({ address: '' });
        },
        (e: any) => e.message === ' is not a valid base58 address.'
      );
    });

    it('a hex address', () => {
      assert.throws(
        () => {
          builder.validateAddress({ address: '4173a5993cd182ae152adad8203163f780c65a8aa5' });
        },
        (e: any) => e.message === '4173a5993cd182ae152adad8203163f780c65a8aa5 is not a valid base58 address.'
      );
    });

    it('a hex address', () => {
      assert.throws(
        () => {
          builder.validateAddress({ address: '4173a5993cd182ae152adad8203163f780c65a8aa5' });
        },
        (e: any) => e.message === '4173a5993cd182ae152adad8203163f780c65a8aa5 is not a valid base58 address.'
      );
    });

    it('a valid value', () => {
      const value = new BigNumber('13456');
      should.doesNotThrow(() => builder.validateValue(value));
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
