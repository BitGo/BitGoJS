import should from 'should';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory, TransferBuilder, WalletInitializationBuilder } from '../../../../../src/coin/xrp';
import * as XrpResources from '../../../../resources/xrp/xrp';

describe('Xrp Transaction Builder Factory', () => {
  const factory = register('xrp', TransactionBuilderFactory);
  const rawTx = XrpResources.transactions;
  const sender = XrpResources.accounts.acc1;
  const receiver = XrpResources.accounts.acc2;

  it('should parse a wallet initialization txn and return a wallet initialization builder', () => {
    should(factory.from(rawTx.walletInitTransaction.rawUnsigned)).instanceOf(WalletInitializationBuilder);
    should(factory.from(rawTx.walletInitTransaction.rawSigned)).instanceOf(WalletInitializationBuilder);
  });

  it('should parse a transfer txn and return a transfer builder', () => {
    should(factory.from(rawTx.transferTransaction.rawUnsigned)).instanceOf(TransferBuilder);
    should(factory.from(rawTx.transferTransaction.rawSigned)).instanceOf(TransferBuilder);
  });

  describe('serialized transactions', () => {
    it('a non signed transfer transaction from serialized', async () => {
      const builder = factory.from(rawTx.transferTransaction.rawUnsigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), rawTx.transferTransaction.rawSigned);
      should.deepEqual(txJson.account, sender.address);
      should.deepEqual(txJson.type, 'Payment');
      should.deepEqual(txJson.flags, 2147483648);
      should.deepEqual(txJson.lastLedgerSequence, 19964671);
      should.deepEqual(txJson.fee, '12');
      should.deepEqual(txJson.sequence, 19964661);
      should.deepEqual(txJson.destination, receiver.address);
      should.deepEqual(txJson.amount, '22000000');
    });
    it('a signed transfer transaction from serialized', async () => {
      const builder = factory.from(rawTx.transferTransaction.rawSigned);
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

  describe('serialized transactions', () => {
    it('a non signed wallet initialization transaction from serialized', async () => {
      const builder = factory.from(rawTx.walletInitTransaction.rawUnsigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.walletInitTransaction.rawSigned);
      should.equal(tx.type, TransactionType.WalletInitialization);
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
    it('a signed wallet initialization transaction from serialized', async () => {
      const builder = factory.from(rawTx.walletInitTransaction.rawSigned);
      builder.sign({ key: sender.prv });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(tx.toBroadcastFormat(), XrpResources.transactions.walletInitTransaction.rawSigned);
      should.equal(tx.type, TransactionType.WalletInitialization);
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
