import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { KeyPair } from '../../../src/lib/keyPair';
import { SuiTransactionType } from '../../../src/lib/iface';

describe('Sui Fee Payer (Gas Tank) Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a transfer tx with fee payer', async function () {
      // Create a separate key pair for the fee payer
      const feePayerPrv = testData.privateKeys.prvKey3;
      const feePayerKeyPair = new KeyPair({ prv: feePayerPrv });
      const feePayerAddress = feePayerKeyPair.getAddress();

      // Set up the transaction builder
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);

      // Set gasData with default owner
      const gasDataWithSponsor = {
        ...testData.gasData,
        sponsor: feePayerAddress, // Add sponsor field
      };

      txBuilder.gasData(gasDataWithSponsor);

      // Sign with sender key
      const senderKey = testData.privateKeys.prvKey1;
      txBuilder.sign({ key: senderKey });

      // Sign with fee payer key
      txBuilder.signFeePayer({ key: feePayerPrv });

      // Build the transaction
      const tx = await txBuilder.build();

      // Verify the transaction was built correctly
      should.equal(tx.type, TransactionType.Send);

      // Check gas data contains sponsor
      (tx as any).suiTransaction.gasData.sponsor.should.equal(feePayerAddress);

      // Verify sender signature exists
      should.exist(tx.signature);

      // Verify fee payer signature exists
      should.exist((tx as any).feePayerSignature);

      // Get broadcast format and verify it's valid base64
      const rawTx = tx.toBroadcastFormat();
      should.ok(rawTx);
      should.doesNotThrow(() => Buffer.from(rawTx, 'base64'));
    });

    it('should be able to add sponsor after setting gasData', async function () {
      const feePayerPrv = testData.privateKeys.prvKey3;
      const feePayerKeyPair = new KeyPair({ prv: feePayerPrv });
      const feePayerAddress = feePayerKeyPair.getAddress();

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(testData.gasData);

      // Add sponsor after setting gasData
      txBuilder.sponsor(feePayerAddress);

      txBuilder.sign({ key: testData.privateKeys.prvKey1 });
      txBuilder.signFeePayer({ key: feePayerPrv });

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      // Verify sponsor was added correctly
      (tx as any).suiTransaction.gasData.sponsor.should.equal(feePayerAddress);

      // Verify signatures exist
      should.exist(tx.signature);
      should.exist((tx as any).feePayerSignature);
    });

    it('should build a custom tx with fee payer', async function () {
      const feePayerPrv = testData.privateKeys.prvKey3;
      const feePayerKeyPair = new KeyPair({ prv: feePayerPrv });
      const feePayerAddress = feePayerKeyPair.getAddress();

      // Create a custom transaction
      const builder = factory.from(testData.TRANSFER);

      // Set the sponsor
      const gasDataWithSponsor = {
        ...testData.gasData,
        sponsor: feePayerAddress,
      };

      // Update gas data to include sponsor
      builder.gasData(gasDataWithSponsor);

      // Sign with both keys
      builder.sign({ key: testData.privateKeys.prvKey1 });
      builder.signFeePayer({ key: feePayerPrv });

      const tx = await builder.build();

      // Verify gas data contains sponsor
      (tx as any).suiTransaction.gasData.sponsor.should.equal(feePayerAddress);

      // Verify both signatures exist
      should.exist(tx.signature);
      should.exist((tx as any).feePayerSignature);

      // Get broadcast format and verify it's valid base64
      const rawTx = tx.toBroadcastFormat();
      should.ok(rawTx);
      should.doesNotThrow(() => Buffer.from(rawTx, 'base64'));
    });

    it('should build a token transfer tx with fee payer', async function () {
      const feePayerPrv = testData.privateKeys.prvKey3;
      const feePayerKeyPair = new KeyPair({ prv: feePayerPrv });
      const feePayerAddress = feePayerKeyPair.getAddress();

      // Set up token transfer builder
      const builder = factory.getTokenTransferBuilder();
      builder.type(SuiTransactionType.TokenTransfer);
      builder.sender(testData.sender.address);
      builder.send(testData.recipients);
      builder.inputObjects([testData.coinsWithoutGasPayment[0]]);

      // Set gas data with sponsor
      const gasDataWithSponsor = {
        ...testData.gasData,
        sponsor: feePayerAddress,
      };
      builder.gasData(gasDataWithSponsor);

      // Sign with both keys
      builder.sign({ key: testData.privateKeys.prvKey1 });
      builder.signFeePayer({ key: feePayerPrv });

      const tx = await builder.build();

      // Verify gas data contains sponsor
      (tx as any).suiTransaction.gasData.sponsor.should.equal(feePayerAddress);

      // Verify both signatures exist
      should.exist(tx.signature);
      should.exist((tx as any).feePayerSignature);

      // Get broadcast format and verify it's valid base64
      const rawTx = tx.toBroadcastFormat();
      should.ok(rawTx);
      should.doesNotThrow(() => Buffer.from(rawTx, 'base64'));
    });
  });

  describe('Fail', () => {
    it('should fail when trying to sign as fee payer without setting sponsor', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(testData.gasData); // No sponsor set

      // Sign with sender key
      txBuilder.sign({ key: testData.privateKeys.prvKey1 });

      // Try to sign as fee payer should fail
      should(() => txBuilder.signFeePayer({ key: testData.privateKeys.prvKey3 })).throwError(
        'Transaction must have a fee payer (sponsor) to sign as fee payer'
      );
    });

    it('should fail with invalid sponsor address', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(testData.gasData);

      // Try to set invalid sponsor address
      should(() => txBuilder.sponsor('invalidSponsorAddress')).throwError(
        'Invalid or missing sponsor, got: invalidSponsorAddress'
      );
    });

    it('should fail when trying to set sponsor before gasData', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);

      // Try to set sponsor before gasData
      should(() => txBuilder.sponsor(testData.addresses.validAddresses[0])).throwError(
        'gasData must be set before setting sponsor'
      );
    });
  });
});
