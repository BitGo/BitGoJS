import should from 'should';
import { FungibleConditionCode } from '@stacks/transactions';

import { StxLib } from '../../src';

const { makeStakingPostCondition } = StxLib;

describe('Stx post-condition helpers', function () {
  const address = 'STC6GQPVW3GMP5AY5QHKDR9R9S82DDWRFAZA6SWA';

  const expected = (condition: string, amount: string) => ({
    type: 'staking-postcondition',
    address,
    condition,
    amount,
  });

  describe('makeStakingPostCondition', function () {
    it('builds a SIP-044 staking post-condition (PostConditionType.Staking)', function () {
      should.deepEqual(makeStakingPostCondition(address, 'eq', '100000000'), expected('eq', '100000000'));
    });

    const stringComparators: [Parameters<typeof makeStakingPostCondition>[1], string][] = [
      ['eq', 'eq'],
      ['gt', 'gt'],
      ['gte', 'gte'],
      ['lt', 'lt'],
      ['lte', 'lte'],
    ];

    for (const [code, condition] of stringComparators) {
      it(`accepts the string comparator '${code}'`, function () {
        should.deepEqual(makeStakingPostCondition(address, code, '100000000'), expected(condition, '100000000'));
      });
    }

    const enumComparators: [FungibleConditionCode, string][] = [
      [FungibleConditionCode.Equal, 'eq'],
      [FungibleConditionCode.Greater, 'gt'],
      [FungibleConditionCode.GreaterEqual, 'gte'],
      [FungibleConditionCode.Less, 'lt'],
      [FungibleConditionCode.LessEqual, 'lte'],
    ];

    for (const [code, condition] of enumComparators) {
      it(`maps FungibleConditionCode(${code}) to the '${condition}' comparator`, function () {
        should.deepEqual(makeStakingPostCondition(address, code, 100), expected(condition, '100'));
      });
    }

    it('accepts a string, number and bigint amount', function () {
      should.equal(makeStakingPostCondition(address, 'eq', '100').amount, '100');
      should.equal(makeStakingPostCondition(address, 'eq', 100).amount, '100');
      should.equal(makeStakingPostCondition(address, 'eq', 100n).amount, '100');
    });

    it('rejects an unsupported condition code', function () {
      should.throws(
        () => makeStakingPostCondition(address, 99 as unknown as FungibleConditionCode, 100),
        /Unsupported fungible condition code: 99/
      );
    });
  });
});
