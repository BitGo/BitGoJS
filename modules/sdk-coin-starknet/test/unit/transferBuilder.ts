import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { Transaction } from '../../src/lib/transaction';
import { Accounts, SandboxTransferData } from '../resources/starknet';

describe('Starknet TransferBuilder', () => {
  const coinConfig = coins.get('starknet');

  describe('Build transfer transaction', () => {
    it('should build a transfer and produce a transactionHash', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();

      builder
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');

      const tx = (await builder.build()) as Transaction;
      const data = tx.starknetTransactionData;

      should.exist(data.transactionHash);
      (data.transactionHash as string).should.startWith('0x');
      (data.transactionHash as string).length.should.be.greaterThan(2);
    });

    it('should set signableHex from the Poseidon hash', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();

      builder
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');

      const tx = (await builder.build()) as Transaction;
      tx.signableHex.should.equal(tx.starknetTransactionData.transactionHash);
      tx.id.should.equal(tx.starknetTransactionData.transactionHash);
    });

    it('should produce different hashes for different recipients', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);

      const builder1 = factory.getTransferBuilder();
      builder1
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');
      const tx1 = (await builder1.build()) as Transaction;

      const builder2 = factory.getTransferBuilder();
      builder2
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account3.address)
        .amount('1000000000000000000');
      const tx2 = (await builder2.build()) as Transaction;

      tx1.signableHex.should.not.equal(tx2.signableHex);
    });

    it('should produce different hashes for different amounts', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);

      const builder1 = factory.getTransferBuilder();
      builder1
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');
      const tx1 = (await builder1.build()) as Transaction;

      const builder2 = factory.getTransferBuilder();
      builder2
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('2000000000000000000');
      const tx2 = (await builder2.build()) as Transaction;

      tx1.signableHex.should.not.equal(tx2.signableHex);
    });

    it('should include compiledCalldata in transaction data', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();

      builder
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');

      const tx = (await builder.build()) as Transaction;
      const data = tx.starknetTransactionData;

      should.exist(data.compiledCalldata);
      (data.compiledCalldata as string[]).length.should.be.greaterThan(0);
      (data.compiledCalldata as string[])[0].should.equal('0x1'); // 1 call
    });

    it('should include resourceBounds in transaction data', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();

      builder
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000')
        .resourceBounds(SandboxTransferData.resourceBounds);

      const tx = (await builder.build()) as Transaction;
      const data = tx.starknetTransactionData;

      should.exist(data.resourceBounds);
      (data.resourceBounds as { l2_gas: { max_amount: string } }).l2_gas.max_amount.should.equal(
        SandboxTransferData.resourceBounds.l2_gas.max_amount
      );
    });

    it('should accept custom resource bounds and produce different hash', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);

      const builder1 = factory.getTransferBuilder();
      builder1
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');
      const tx1 = (await builder1.build()) as Transaction as Transaction;

      const customBounds = {
        l2_gas: { max_amount: '0x3938700', max_price_per_unit: '0x174876e800' },
        l1_gas: { max_amount: '0x0', max_price_per_unit: '0x5af3107a4000' },
        l1_data_gas: { max_amount: '0x7d0', max_price_per_unit: '0x2540be400' },
      };
      const builder2 = factory.getTransferBuilder();
      builder2
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000')
        .resourceBounds(customBounds);
      const tx2 = (await builder2.build()) as Transaction as Transaction;

      tx1.signableHex.should.not.equal(tx2.signableHex);
    });

    it('should round-trip through toBroadcastFormat and fromRawTransaction', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();

      builder
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');

      const tx = (await builder.build()) as Transaction;
      const broadcastHex = tx.toBroadcastFormat();

      const factory2 = new TransactionBuilderFactory(coinConfig);
      const builder2 = await factory2.from(broadcastHex);
      const tx2 = (await builder2.build()) as Transaction as Transaction;

      tx2.signableHex.should.equal(tx.signableHex);
      tx2.id.should.equal(tx.id);
    });
  });

  describe('Validation', () => {
    it('should reject build without sender', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();
      builder
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');

      await builder.build().should.be.rejectedWith(/[Ss]ender/);
    });

    it('should reject build without nonce', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();
      builder
        .sender(Accounts.account1.address)
        .chainId(SandboxTransferData.chainId)
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');

      await builder.build().should.be.rejectedWith(/[Nn]once/);
    });

    it('should reject build without chainId', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();
      builder
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .receiverId(Accounts.account2.address)
        .amount('1000000000000000000');

      await builder.build().should.be.rejectedWith(/[Cc]hain/);
    });

    it('should reject build without receiver', async () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();
      builder
        .sender(Accounts.account1.address)
        .nonce('0x0')
        .chainId(SandboxTransferData.chainId)
        .amount('1000000000000000000');

      await builder.build().should.be.rejectedWith(/[Rr]eceiver/);
    });

    it('should reject invalid sender address', () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();
      (() => builder.sender('invalid')).should.throw(/[Ii]nvalid/);
    });

    it('should reject invalid receiver address', () => {
      const factory = new TransactionBuilderFactory(coinConfig);
      const builder = factory.getTransferBuilder();
      (() => builder.receiverId('invalid')).should.throw(/[Ii]nvalid/);
    });
  });
});
