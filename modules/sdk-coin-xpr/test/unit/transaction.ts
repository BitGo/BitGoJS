import should from 'should';
import { Transaction, TransferBuilder, KeyPair } from '../../src/lib';
import { coins } from '@bitgo/statics';

describe('Proton (XPR Network) Transaction', function () {
  const coinConfig = coins.get('txpr');
  const testPrivateKey = 'PVT_K1_2bfGi9rYsXQSXXTvJbDAPhHLQUojjaNLomdm3cEJ1XTzMqUt3V';
  const testSender = 'testaccount1';
  const testRecipient = 'testaccount2';
  const testAmount = '10000'; // 1.0000 XPR in base units

  // Mock block reference data
  const refBlockNum = 1000;
  const refBlockPrefix = 2000000000;
  const expiration = new Date(Date.now() + 120 * 1000).toISOString().split('.')[0];

  describe('TransferBuilder', function () {
    it('should build a transfer transaction', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .memo('test transfer')
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      const tx = await builder.build();

      should.exist(tx);
      should.exist(tx.id);
      tx.type.should.be.a.Number();
    });

    it('should build and sign a transfer transaction', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .memo('test transfer')
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix)
        .sign({ key: testPrivateKey });

      const tx = await builder.build();

      should.exist(tx);
      tx.signature.length.should.be.greaterThan(0);
      tx.signature[0].should.startWith('SIG_K1_');
    });

    it('should throw when sender is missing', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .to(testRecipient)
        .amount(testAmount)
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      await builder.build().should.be.rejectedWith(/Sender is required/);
    });

    it('should throw when recipient is missing', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .amount(testAmount)
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      await builder.build().should.be.rejectedWith(/Recipient is required/);
    });

    it('should throw when amount is missing', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      await builder.build().should.be.rejectedWith(/Amount is required/);
    });

    it('should throw when amount is negative', function () {
      const builder = new TransferBuilder(coinConfig);

      should.throws(() => {
        builder.amount('-100');
      }, /Amount must be positive/);
    });

    it('should throw when amount is not an integer', function () {
      const builder = new TransferBuilder(coinConfig);

      should.throws(() => {
        builder.amount('100.5');
      }, /Amount must be an integer/);
    });

    it('should throw when memo is too long', function () {
      const builder = new TransferBuilder(coinConfig);
      const longMemo = 'a'.repeat(300);

      should.throws(() => {
        builder.memo(longMemo);
      }, /Memo must be 256 characters or less/);
    });

    it('should throw with invalid sender address', function () {
      const builder = new TransferBuilder(coinConfig);

      should.throws(() => {
        builder.sender('INVALID_ADDRESS!');
      }, /Invalid sender address/);
    });

    it('should throw with invalid recipient address', function () {
      const builder = new TransferBuilder(coinConfig);

      should.throws(() => {
        builder.to('INVALID_ADDRESS!');
      }, /Invalid recipient address/);
    });
  });

  describe('Transaction serialization', function () {
    it('should serialize and deserialize a transaction (round-trip)', async function () {
      // Build a transaction
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .memo('round trip test')
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix)
        .sign({ key: testPrivateKey });

      const originalTx = await builder.build();
      const originalJson = originalTx.toJson();

      // Get broadcast format
      const broadcastFormat = originalTx.toBroadcastFormat();
      should.exist(broadcastFormat);

      // Parse broadcast format
      const parsed = JSON.parse(broadcastFormat);
      should.exist(parsed.packed_trx);
      should.exist(parsed.signatures);

      // Deserialize from raw hex
      const deserializedTx = new Transaction(coinConfig);
      deserializedTx.fromRawTransaction(parsed.packed_trx);

      const deserializedJson = deserializedTx.toJson();

      // Verify round-trip
      deserializedJson.sender.should.equal(originalJson.sender);
      deserializedJson.expiration.should.equal(originalJson.expiration);
      deserializedJson.refBlockNum.should.equal(originalJson.refBlockNum);
      deserializedJson.refBlockPrefix.should.equal(originalJson.refBlockPrefix);
      deserializedJson.actions.length.should.equal(originalJson.actions.length);
    });

    it('should get signable payload', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      const tx = await builder.build();

      const signablePayload = tx.signablePayload;
      signablePayload.should.be.instanceOf(Buffer);
      signablePayload.length.should.equal(32); // SHA256 hash = 32 bytes
    });

    it('should sign transaction with KeyPair', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      const tx = (await builder.build()) as Transaction;
      const keyPair = new KeyPair({ prv: testPrivateKey });

      await tx.sign(keyPair);

      tx.signature.length.should.be.greaterThan(0);
      tx.signature[0].should.startWith('SIG_K1_');
    });
  });

  describe('Transaction explanation', function () {
    it('should explain a transfer transaction', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .memo('explanation test')
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      const tx = await builder.build();
      const explanation = tx.explainTransaction();

      should.exist(explanation);
      should.exist(explanation.outputAmount);
      should.exist(explanation.outputs);
      explanation.outputs.length.should.be.greaterThan(0);
      explanation.outputs[0].address.should.equal(testRecipient);
      explanation.outputs[0].amount.should.equal(testAmount);
    });

    it('should include memo in explanation', async function () {
      const builder = new TransferBuilder(coinConfig);
      const testMemo = 'test memo for explanation';

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .memo(testMemo)
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      const tx = await builder.build();
      const explanation = tx.explainTransaction();

      explanation.memo.should.equal(testMemo);
    });
  });

  describe('Transaction inputs and outputs', function () {
    it('should load inputs and outputs correctly', async function () {
      const builder = new TransferBuilder(coinConfig);

      builder
        .sender(testSender)
        .to(testRecipient)
        .amount(testAmount)
        .expiration(expiration)
        .refBlockNum(refBlockNum)
        .refBlockPrefix(refBlockPrefix);

      const tx = await builder.build();

      tx.inputs.length.should.equal(1);
      tx.outputs.length.should.equal(1);

      tx.inputs[0].address.should.equal(testSender);
      tx.inputs[0].value.should.equal(testAmount);

      tx.outputs[0].address.should.equal(testRecipient);
      tx.outputs[0].value.should.equal(testAmount);
    });
  });
});
