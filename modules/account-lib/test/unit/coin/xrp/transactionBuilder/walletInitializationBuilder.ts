import { coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { WalletInitializationBuilder } from '../../../../../src/coin/xrp';
import * as XrpResources from '../../../../resources/xrp/xrp';

describe('XRP Wallet Initialization Builder', () => {
  let builder: WalletInitializationBuilder;

  const sender = XrpResources.accounts.acc1;

  beforeEach(() => {
    const config = coins.get('xrp');
    builder = new WalletInitializationBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate a valid flag value', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.setFlag(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.setFlag(1000));
      assert.calledTwice(spy);
    });
  });

  describe('build a wallet initialization transaction', () => {
    it('should build a wallet init transaction', async () => {
      builder
        .sender({ address: sender.address })
        .flags(2147483648)
        .lastLedgerSequence(19964671)
        .fee({ fee: '12' })
        .sequence(19964661)
        .domain('6578616D706C652E636F6D')
        .setFlag(5)
        .messageKey('03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB')
        .sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'AccountSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.domain, '6578616D706C652E636F6D');
      should.deepEqual(txJson.setFlag, 5);
      should.deepEqual(txJson.messageKey, '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
    });

    it('should build an unsigned wallet init transaction', async () => {
      builder
        .sender({ address: sender.address })
        .flags(2147483648)
        .lastLedgerSequence(19964671)
        .fee({ fee: '12' })
        .sequence(19964661)
        .domain('6578616D706C652E636F6D')
        .setFlag(5)
        .messageKey('03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'AccountSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.domain, '6578616D706C652E636F6D');
      should.deepEqual(txJson.setFlag, 5);
      should.deepEqual(txJson.messageKey, '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
    });

    it('should not build from different type of raw unsigned tx', async () => {
      should.throws(
        () => builder.from(XrpResources.transactions.transferTransaction.rawUnsigned),
        `Invalid Transaction Type: Payment. Expected AccountSet`,
      );
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(XrpResources.transactions.walletInitTransaction.rawUnsigned);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.walletInitTransaction.rawUnsigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'AccountSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.domain, '6578616D706C652E636F6D');
      should.deepEqual(txJson.setFlag, 5);
      should.deepEqual(txJson.messageKey, '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
    });

    it('should build from raw signed tx', async () => {
      builder.from(XrpResources.transactions.walletInitTransaction.rawSigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.walletInitTransaction.rawSigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'AccountSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.domain, '6578616D706C652E636F6D');
      should.deepEqual(txJson.setFlag, 5);
      should.deepEqual(txJson.messageKey, '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
    });

    it('should sign from raw unsigned tx', async () => {
      builder.from(XrpResources.transactions.walletInitTransaction.rawUnsigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.walletInitTransaction.rawSigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'AccountSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.domain, '6578616D706C652E636F6D');
      should.deepEqual(txJson.setFlag, 5);
      should.deepEqual(txJson.messageKey, '03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
    });
  });
});
