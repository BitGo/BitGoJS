import * as should from 'should';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import { KeyPair } from '../../src/lib/keyPair';
import { TEST_UTXO } from '../fixtures/kas.fixtures';

// Mock coin object for TransactionBuilder
const mockCoin = {
  getChain: () => 'kaspa',
  getFamily: () => 'kaspa',
  getFullName: () => 'Kaspa',
  getBaseFactor: () => 100000000,
} as any;

describe('Kaspa TransactionBuilder', () => {
  const privKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  let kp: KeyPair;
  let senderAddress: string;
  let recipientAddress: string;

  before(() => {
    kp = new KeyPair({ prv: privKey });
    senderAddress = kp.getAddress('mainnet');
    const kp2 = new KeyPair({ prv: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210' });
    recipientAddress = kp2.getAddress('mainnet');
  });

  describe('sender', () => {
    it('should set a valid sender address', () => {
      const builder = new TransactionBuilder(mockCoin);
      builder.sender(senderAddress);
    });

    it('should throw on invalid sender address', () => {
      const builder = new TransactionBuilder(mockCoin);
      (() => builder.sender('invalid')).should.throw(/Invalid sender address/);
    });
  });

  describe('to', () => {
    it('should add a valid recipient output', () => {
      const builder = new TransactionBuilder(mockCoin);
      builder.to(recipientAddress, BigInt('50000000'));
    });

    it('should throw on invalid recipient address', () => {
      const builder = new TransactionBuilder(mockCoin);
      (() => builder.to('invalid', BigInt('50000000'))).should.throw(/Invalid recipient address/);
    });

    it('should throw on zero amount', () => {
      const builder = new TransactionBuilder(mockCoin);
      (() => builder.to(recipientAddress, BigInt(0))).should.throw(/Amount must be positive/);
    });
  });

  describe('addUtxo', () => {
    it('should add a UTXO as input', () => {
      const builder = new TransactionBuilder(mockCoin);
      builder.addUtxo(TEST_UTXO);
    });
  });

  describe('build', () => {
    it('should build a valid unsigned transaction', async () => {
      const builder = new TransactionBuilder(mockCoin);
      builder.sender(senderAddress).addUtxo(TEST_UTXO).to(recipientAddress, BigInt('50000000')).fee(BigInt('10000'));

      const tx = await builder.build();
      should.exist(tx);
      tx.txData.inputs.length.should.equal(1);
      // Output = recipient + change
      tx.txData.outputs.length.should.equal(2);
      tx.txData.outputs[0].value.should.equal(BigInt('50000000'));
      // Change = 100000000 - 50000000 - 10000 = 49990000
      tx.txData.outputs[1].value.should.equal(BigInt('49990000'));
    });

    it('should not add change output if exact amount', async () => {
      const builder = new TransactionBuilder(mockCoin);
      builder
        .sender(senderAddress)
        .addUtxo(TEST_UTXO)
        .to(recipientAddress, BigInt('99990000')) // 100000000 - 10000 fee = 99990000
        .fee(BigInt('10000'));

      const tx = await builder.build();
      tx.txData.outputs.length.should.equal(1);
      tx.txData.outputs[0].value.should.equal(BigInt('99990000'));
    });

    it('should throw when inputs are insufficient', async () => {
      const builder = new TransactionBuilder(mockCoin);
      builder
        .sender(senderAddress)
        .addUtxo(TEST_UTXO)
        .to(recipientAddress, BigInt('200000000')) // More than available
        .fee(BigInt('10000'));

      await builder.build().should.be.rejectedWith(/Insufficient funds/);
    });
  });

  describe('sign', () => {
    it('should sign a transaction and produce signature scripts', async () => {
      const builder = new TransactionBuilder(mockCoin);
      builder.sender(senderAddress).addUtxo(TEST_UTXO).to(recipientAddress, BigInt('50000000')).fee(BigInt('10000'));

      await builder.build();
      builder.sign({ key: privKey });

      const tx = await builder.build();
      // After signing, inputs should have signatureScript
      tx.txData.inputs[0].signatureScript.should.not.equal('');
      tx.txData.inputs[0].signatureScript.length.should.be.greaterThan(0);
    });
  });

  describe('from (deserialization)', () => {
    it('should reconstruct a builder from serialized hex', async () => {
      // Build a transaction first
      const builder1 = new TransactionBuilder(mockCoin);
      builder1.sender(senderAddress).addUtxo(TEST_UTXO).to(recipientAddress, BigInt('50000000')).fee(BigInt('10000'));
      const tx1 = await builder1.build();
      const hex = tx1.toBroadcastFormat();

      // Reconstruct from hex
      const builder2 = new TransactionBuilder(mockCoin);
      builder2.from(hex);
      const tx2 = await builder2.build();

      tx2.txData.inputs[0].previousOutpoint.transactionId.should.equal(
        tx1.txData.inputs[0].previousOutpoint.transactionId
      );
      tx2.txData.outputs.length.should.equal(tx1.txData.outputs.length);
    });
  });
});
