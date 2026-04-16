/**
 * Kaspa End-to-End Transaction Flow Test
 *
 * Tests the complete flow: build → sign → serialize → deserialize → verify
 */

import * as should from 'should';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import { Transaction } from '../../src/lib/transaction';
import { KeyPair } from '../../src/lib/keyPair';
import { TEST_UTXO } from '../fixtures/kas.fixtures';

const mockCoin = {
  getChain: () => 'kaspa',
  getFamily: () => 'kaspa',
  getFullName: () => 'Kaspa',
  getBaseFactor: () => 100000000,
} as any;

describe('Kaspa Transaction E2E Flow', () => {
  const senderPrivKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const recipientPrivKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

  let senderKp: KeyPair;
  let recipientKp: KeyPair;
  let senderAddress: string;
  let recipientAddress: string;

  before(() => {
    senderKp = new KeyPair({ prv: senderPrivKey });
    recipientKp = new KeyPair({ prv: recipientPrivKey });
    senderAddress = senderKp.getAddress('mainnet');
    recipientAddress = recipientKp.getAddress('mainnet');
  });

  it('should complete the full transaction lifecycle', async () => {
    // 1. BUILD: Create an unsigned transaction
    const builder = new TransactionBuilder(mockCoin);
    builder.sender(senderAddress).addUtxo(TEST_UTXO).to(recipientAddress, BigInt('50000000')).fee(BigInt('10000'));

    const unsignedTx = await builder.build();
    should.exist(unsignedTx);
    unsignedTx.txData.inputs.length.should.equal(1);
    unsignedTx.txData.outputs.length.should.equal(2); // recipient + change

    // Verify inputs are unsigned
    unsignedTx.txData.inputs[0].signatureScript.should.equal('');

    // 2. SIGN: Sign the transaction
    builder.sign({ key: senderPrivKey });
    const signedTx = await builder.build();

    // Verify inputs are signed
    signedTx.txData.inputs[0].signatureScript.should.not.equal('');
    // Schnorr signature + sighash_type = 64 + 1 = 65 bytes
    // Script: 0x41 (OP_DATA_65) + 65 bytes = 66 bytes = 132 hex chars
    signedTx.txData.inputs[0].signatureScript.length.should.equal(132);

    // 3. SERIALIZE: Convert to broadcast format
    const txHex = signedTx.toBroadcastFormat();
    should.exist(txHex);
    txHex.length.should.be.greaterThan(0);
    /^[0-9a-fA-F]+$/.test(txHex).should.be.true();

    // 4. DESERIALIZE: Reconstruct from hex
    const deserializedTx = Transaction.fromHex(txHex);
    deserializedTx.txData.inputs.length.should.equal(signedTx.txData.inputs.length);
    deserializedTx.txData.outputs.length.should.equal(signedTx.txData.outputs.length);
    deserializedTx.txData.inputs[0].signatureScript.should.equal(signedTx.txData.inputs[0].signatureScript);
    deserializedTx.txData.outputs[0].value.should.equal(signedTx.txData.outputs[0].value);

    // 5. TRANSACTION ID: Verify deterministic ID
    const txId = signedTx.transactionId();
    txId.length.should.equal(64);
    // Transaction ID should be the same regardless of signatures
    const unsignedId = unsignedTx.transactionId();
    // Note: in Kaspa, TxID is computed on the tx WITHOUT signature scripts
    // so signed and unsigned tx should have the same ID
    txId.should.equal(unsignedId);
  });

  it('should build transactions with multiple inputs', async () => {
    const utxo2 = {
      ...TEST_UTXO,
      transactionId: 'bbccddee00112233445566778899aabbccddee00112233445566778899aabbcc',
      index: 0,
      amount: BigInt('50000000'),
    };

    const builder = new TransactionBuilder(mockCoin);
    builder
      .sender(senderAddress)
      .addUtxos([TEST_UTXO, utxo2])
      .to(recipientAddress, BigInt('100000000'))
      .fee(BigInt('10000'));

    const tx = await builder.build();
    tx.txData.inputs.length.should.equal(2);
    // Total: 100000000 + 50000000 = 150000000
    // Output to recipient: 100000000
    // Fee: 10000
    // Change: 150000000 - 100000000 - 10000 = 49990000
    tx.txData.outputs.length.should.equal(2);
    tx.txData.outputs[0].value.should.equal(BigInt('100000000'));
    tx.txData.outputs[1].value.should.equal(BigInt('49990000'));
  });

  it('should produce consistent sighash for the same input', async () => {
    const builder = new TransactionBuilder(mockCoin);
    builder.sender(senderAddress).addUtxo(TEST_UTXO).to(recipientAddress, BigInt('50000000')).fee(BigInt('10000'));

    const tx = await builder.build();
    const sighash1 = tx.computeSighash(0);
    const sighash2 = tx.computeSighash(0);
    sighash1.toString('hex').should.equal(sighash2.toString('hex'));
  });
});
