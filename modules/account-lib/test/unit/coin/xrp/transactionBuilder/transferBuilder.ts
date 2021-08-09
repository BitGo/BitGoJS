// import crypto from 'crypto';
// import algosdk from 'algosdk';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { TransferBuilder, AddressValidationError } from '../../../../../src/coin/xrp';
import * as XrpResources from '../../../../resources/xrp/xrp';

describe('XRP Transfer Builder', () => {
  let builder: TransferBuilder;

  const sender = XrpResources.accounts.acc1;
  const receiver = XrpResources.accounts.acc2;

  beforeEach(() => {
    const config = coins.get('xrp');
    builder = new TransferBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate receiver address is a valid xrp address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.destination({ address: 'wrong-addr' }),
        (e: Error) => e.name === AddressValidationError.name,
      );
      should.doesNotThrow(() => builder.destination({ address: receiver.address }));
      assert.calledTwice(spy);
    });
    it('should validate a valid flag value', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.amount(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.amount(1000));
      assert.calledTwice(spy);
    });
  });

  describe('build a transfer transaction', () => {
    it('should build a transfer transaction', async () => {
      builder
        .sender({ address: sender.address })
        .flags(2147483648)
        .lastLedgerSequence(19964671)
        .fee({ fee: '12' })
        .sequence(19964661)
        .destination(receiver)
        .amount(22000000)
        .sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'Payment');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.destination, receiver.address);
      should.deepEqual(txJson.amount, '22000000');
    });

    it('should build an unsigned transfer transaction', async () => {
      builder
        .sender({ address: sender.address })
        .flags(2147483648)
        .lastLedgerSequence(19964671)
        .fee({ fee: '12' })
        .sequence(19964661)
        .destination(receiver)
        .amount('22000000');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'Payment');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.destination, receiver.address);
      should.deepEqual(txJson.amount, '22000000');
    });

    it('should not build from different type of raw unsigned tx', async () => {
      should.throws(
        () => builder.from(XrpResources.transactions.walletInitTransaction.rawUnsigned),
        `Invalid Transaction Type: AccountSet. Expected Payment`,
      );
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(XrpResources.transactions.transferTransaction.rawUnsigned);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.transferTransaction.rawUnsigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'Payment');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.destination, receiver.address);
      should.deepEqual(txJson.amount, '22000000');
    });

    it('should build from raw signed tx', async () => {
      builder.from(XrpResources.transactions.transferTransaction.rawSigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.transferTransaction.rawSigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'Payment');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.destination, receiver.address);
      should.deepEqual(txJson.amount, '22000000');
    });

    it('should sign from raw unsigned tx', async () => {
      builder.from(XrpResources.transactions.transferTransaction.rawUnsigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.transferTransaction.rawSigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'Payment');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.destination, receiver.address);
      should.deepEqual(txJson.amount, '22000000');
    });
  });
});
