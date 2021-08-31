import { coins } from '@bitgo/statics';
import should from 'should';
import { MultiSigBuilder } from '../../../../../src/coin/xrp';
import * as XrpResources from '../../../../resources/xrp/xrp';

describe('XRP Multi Sig Builder', () => {
  let builder: MultiSigBuilder;

  const sender = XrpResources.accounts.acc1;

  beforeEach(() => {
    const config = coins.get('xrp');
    builder = new MultiSigBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate a valid signerQuorum value', () => {
      should.throws(
        () => builder.signerQuorum(-1),
        (e: Error) => e.message === 'Signer Quorum must be greater than or equal to 0',
      );
      should.doesNotThrow(() => builder.signerQuorum(6));
    });
  });

  describe('build a multi sig setup transaction', () => {
    it('should build a multi sig setup transaction', async () => {
      builder
        .sender({ address: sender.address })
        .flags(2147483648)
        .lastLedgerSequence('19964671')
        .fee({ fee: '12' })
        .sequence('19964661')
        .signerQuorum(2)
        .signerEntries([
          {
            SignerEntry: {
              Account: sender.address,
              SignerWeight: 1,
            },
          },
          {
            SignerEntry: {
              Account: XrpResources.accounts.acc2.address,
              SignerWeight: 1,
            },
          },
        ])
        .sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'SignerListSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.signerQuorum, 2);
      should.deepEqual(txJson.signerEntries.length, 2);
    });

    it('should build an unsigned multi sig setup transaction', async () => {
      builder
        .sender({ address: sender.address })
        .flags(2147483648)
        .lastLedgerSequence('19964671')
        .fee({ fee: '12' })
        .sequence('19964661')
        .signerQuorum(2)
        .signerEntries([
          {
            SignerEntry: {
              Account: sender.address,
              SignerWeight: 1,
            },
          },
          {
            SignerEntry: {
              Account: XrpResources.accounts.acc2.address,
              SignerWeight: 1,
            },
          },
        ]);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'SignerListSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.signerQuorum, 2);
      should.deepEqual(txJson.signerEntries.length, 2);
    });

    it('should not build from different type of raw unsigned tx', async () => {
      should.throws(
        () => builder.from(XrpResources.transactions.transferTransaction.rawUnsigned),
        `Invalid Transaction Type: Payment. Expected SignerListSet`,
      );
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(XrpResources.transactions.multiSigTransaction.rawUnsigned);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.multiSigTransaction.rawUnsigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'SignerListSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.signerQuorum, 2);
      should.deepEqual(txJson.signerEntries.length, 2);
    });

    it('should build from raw signed tx', async () => {
      builder.from(XrpResources.transactions.multiSigTransaction.rawSigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.multiSigTransaction.rawSigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'SignerListSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.signerQuorum, 2);
      should.deepEqual(txJson.signerEntries.length, 2);
    });

    it('should sign from raw unsigned tx', async () => {
      builder.from(XrpResources.transactions.multiSigTransaction.rawUnsigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.multiSigTransaction.rawSigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'SignerListSet');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.signerQuorum, 2);
      should.deepEqual(txJson.signerEntries.length, 2);
    });
  });
});
