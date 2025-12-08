import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransferTransaction } from '../../src';
import {
  createBasicTransferBuilder,
  createTransferBuilderWithGas,
  createTransferBuilderWithSponsor,
  testData,
} from './helpers/testHelpers';

describe('Iota Transfer Transaction', () => {
  describe('Transaction Properties', () => {
    it('should have correct basic properties', async function () {
      const tx = (await createBasicTransferBuilder().build()) as TransferTransaction;

      should.equal(tx.type, TransactionType.Send);
      should.equal(tx.sender, testData.sender.address);
      should.deepEqual(tx.recipients, testData.recipients);
      should.deepEqual(tx.paymentObjects, testData.paymentObjects);
      should.equal(tx.isSimulateTx, true);
    });

    it('should switch to real transaction mode when gas data is provided', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;

      should.equal(tx.isSimulateTx, false);
      should.equal(tx.gasBudget, testData.GAS_BUDGET);
      should.equal(tx.gasPrice, testData.GAS_PRICE);
      should.deepEqual(tx.gasPaymentObjects, testData.gasPaymentObjects);
      should.equal(tx.getFee(), testData.GAS_BUDGET.toString());
    });

    it('should correctly set gas sponsor', async function () {
      const tx = (await createTransferBuilderWithSponsor().build()) as TransferTransaction;

      should.equal(tx.gasSponsor, testData.gasSponsor.address);
      should.equal(tx.sender, testData.sender.address);
      should.notEqual(tx.sender, tx.gasSponsor);
    });
  });

  describe('Inputs and Outputs', () => {
    it('should correctly calculate inputs and outputs', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const totalAmount = testData.recipients.reduce((sum, r) => sum + Number(r.amount), 0);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: totalAmount.toString(),
        coin: 'tiota',
      });

      tx.outputs.length.should.equal(testData.recipients.length);
      testData.recipients.forEach((recipient, index) => {
        tx.outputs[index].should.deepEqual({
          address: recipient.address,
          value: recipient.amount,
          coin: 'tiota',
        });
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize to and deserialize from JSON', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const json = tx.toJson();

      // Verify JSON structure
      should.equal(json.sender, testData.sender.address);
      should.deepEqual(json.recipients, testData.recipients);
      should.deepEqual(json.paymentObjects, testData.paymentObjects);
      should.equal(json.gasBudget, testData.GAS_BUDGET);
      should.equal(json.gasPrice, testData.GAS_PRICE);
      should.deepEqual(json.gasPaymentObjects, testData.gasPaymentObjects);
      should.equal(json.type, TransactionType.Send);

      // Deserialize and verify
      const newTx = new TransferTransaction(coins.get('tiota'));
      newTx.parseFromJSON(json);

      should.equal(newTx.sender, tx.sender);
      should.deepEqual(newTx.recipients, tx.recipients);
      should.deepEqual(newTx.paymentObjects, tx.paymentObjects);
      should.equal(newTx.gasBudget, tx.gasBudget);
      should.equal(newTx.gasPrice, tx.gasPrice);
    });

    it('should serialize to broadcast format', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const broadcastFormat = await tx.toBroadcastFormat();

      should.exist(broadcastFormat);
      should.equal(typeof broadcastFormat, 'string');
      should.equal(broadcastFormat.length > 0, true);
    });
  });

  describe('Transaction ID and Signing', () => {
    it('should generate transaction ID for built transaction', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const txId = tx.id;

      should.exist(txId);
      should.equal(typeof txId, 'string');
      should.equal(txId.length > 0, true);
    });

    it('should throw error when getting ID before build', function () {
      const tx = new TransferTransaction(coins.get('tiota'));
      tx.sender = testData.sender.address;

      should(() => tx.id).throwError('Tx not built or a rebuild is required');
    });

    it('should provide signable payload for non-simulate transactions', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const payload = tx.signablePayload;

      should.exist(payload);
      should.equal(Buffer.isBuffer(payload), true);
      should.equal(payload.length, 32); // Blake2b produces 32-byte hash
    });

    it('should throw error when getting signable payload for simulate transaction', async function () {
      const tx = (await createBasicTransferBuilder().build()) as TransferTransaction;

      should.equal(tx.isSimulateTx, true);
      should(() => tx.signablePayload).throwError('Cannot sign a simulate tx');
    });

    it('should correctly report canSign based on transaction mode', async function () {
      const simulateTx = (await createBasicTransferBuilder().build()) as TransferTransaction;
      const realTx = (await createTransferBuilderWithGas().build()) as TransferTransaction;

      should.equal(simulateTx.canSign({} as any), false);
      should.equal(realTx.canSign({} as any), true);
    });
  });

  describe('Transaction Explanation', () => {
    it('should provide detailed transaction explanation', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      const explanation = tx.explainTransaction();

      should.exist(explanation);
      should.equal(explanation.type, TransactionType.Send);
      should.exist(explanation.id);
      should.exist(explanation.outputs);
      should.equal(explanation.outputs.length, testData.recipients.length);
      should.equal(explanation.fee.fee, testData.GAS_BUDGET.toString());
    });
  });

  describe('Rebuild Requirements', () => {
    const rebuildTriggers = [
      {
        name: 'sender changes',
        modifier: (tx: TransferTransaction) => (tx.sender = testData.gasSponsor.address),
      },
      {
        name: 'gas budget changes',
        modifier: (tx: TransferTransaction) => (tx.gasBudget = 10000000),
      },
      {
        name: 'recipients change',
        modifier: (tx: TransferTransaction) =>
          (tx.recipients = [{ address: testData.addresses.validAddresses[0], amount: '5000' }]),
      },
    ];

    rebuildTriggers.forEach(({ name, modifier }) => {
      it(`should require rebuild when ${name}`, async function () {
        const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
        modifier(tx);
        should(() => tx.id).throwError('Tx not built or a rebuild is required');
      });
    });
  });

  describe('Signature Serialization', () => {
    it('should have undefined serialized signatures before signing', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;

      should.equal(tx.serializedSignature, undefined);
      should.equal(tx.serializedGasSponsorSignature, undefined);
    });

    it('should serialize sender signature after adding and rebuilding', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);

      await tx.build();

      should.exist(tx.serializedSignature);
      should.equal(typeof tx.serializedSignature, 'string');
      should.equal(/^[A-Za-z0-9+/]*={0,2}$/.test(tx.serializedSignature!), true);
    });

    it('should serialize gas sponsor signature correctly', async function () {
      const tx = (await createTransferBuilderWithSponsor().build()) as TransferTransaction;
      tx.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, testData.testGasSponsorSignature.signature);

      await tx.build();

      should.exist(tx.serializedGasSponsorSignature);
      should.equal(typeof tx.serializedGasSponsorSignature, 'string');
      should.equal(/^[A-Za-z0-9+/]*={0,2}$/.test(tx.serializedGasSponsorSignature!), true);
    });

    it('should serialize both sender and gas sponsor signatures', async function () {
      const tx = (await createTransferBuilderWithSponsor().build()) as TransferTransaction;

      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);
      tx.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, testData.testGasSponsorSignature.signature);

      await tx.build();

      should.exist(tx.serializedSignature);
      should.exist(tx.serializedGasSponsorSignature);
      should.notEqual(tx.serializedSignature, tx.serializedGasSponsorSignature);
    });

    it('should include serialized signatures in signatures array', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);

      await tx.build();

      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(tx.serializedSignature);
    });

    it('should include both signatures in correct order when gas sponsor is present', async function () {
      const tx = (await createTransferBuilderWithSponsor().build()) as TransferTransaction;

      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);
      tx.addGasSponsorSignature(testData.testGasSponsorSignature.publicKey, testData.testGasSponsorSignature.signature);

      await tx.build();

      tx.signature.length.should.equal(2);
      tx.signature[0].should.equal(tx.serializedSignature);
      tx.signature[1].should.equal(tx.serializedGasSponsorSignature);
    });

    it('should verify signature serialization format (EDDSA scheme)', async function () {
      const tx = (await createTransferBuilderWithGas().build()) as TransferTransaction;
      tx.addSignature(testData.testSignature.publicKey, testData.testSignature.signature);

      await tx.build();

      // Decode and verify format: 0x00 + signature (64 bytes) + pubkey (32 bytes) = 97 bytes
      const decoded = Buffer.from(tx.serializedSignature!, 'base64');

      // Should be 97 bytes total (1 prefix + 64 signature + 32 pubkey)
      decoded.length.should.equal(97);

      // First byte should be 0x00 (EDDSA scheme)
      decoded[0].should.equal(0x00);

      // Next 64 bytes should be the signature
      const signatureBytes = decoded.slice(1, 65);
      signatureBytes.toString('hex').should.equal(testData.testSignature.signature.toString('hex'));

      // Last 32 bytes should be the public key
      const pubKeyBytes = decoded.slice(65);
      pubKeyBytes.toString('hex').should.equal(testData.testSignature.publicKey.pub);
    });
  });
});
