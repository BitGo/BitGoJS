import { coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { AddressValidationError, TransferBuilder } from '../../../../../src/coin/algo';

import * as AlgoResources from '../../../../resources/algo';

describe('Algo Transfer Builder', () => {
  let builder: TransferBuilder;

  const sender = AlgoResources.accounts.account1;
  const receiver = AlgoResources.accounts.account2;

  beforeEach(() => {
    const config = coins.get('algo');
    builder = new TransferBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate receiver address is a valid algo address', () => {
      const spy = sinon.spy(builder, 'to');
      should.throws(
        () => builder.to({ address: 'wrong-addr' }),
        (e: Error) => e.name === AddressValidationError.name,
      );
      should.doesNotThrow(() => builder.to({ address: sender.address }));
      assert.calledTwice(spy);
    });

    it('should validate transfer amount', () => {
      const spy = sinon.spy(builder, 'amount');
      should.throws(
        () => builder.amount(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.amount(1000));
      assert.calledTwice(spy);
    });
  });

  describe('build transfer transaction', () => {
    it('should build a transfer transaction', async () => {
      builder.sender({ address: sender.address });
      builder.to({ address: receiver.address });
      builder.amount(10000);
      builder.fee({ fee: '1000' });
      builder.firstRound(1);
      builder.lastRound(100);
      builder.testnet();
      builder.numberOfSigners(1);
      builder.sign({ key: sender.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });
  });
});
