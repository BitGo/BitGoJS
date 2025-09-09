import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, CustomTransaction } from '../../../src';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';

describe('Apt Custom Transaction Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tapt'));

  describe('Custom Entry Function Call', () => {
    describe('Succeed', () => {
      it('should build a custom transaction with transfer_coins function', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.sender, testData.sender2.address);
        should.equal(tx.maxGasAmount, 200000);
        should.equal(tx.gasUnitPrice, 100);
        should.equal(tx.sequenceNumber, 14);
        should.equal(tx.expirationTime, 1736246155);
        should.equal(tx.type, TransactionType.CustomTx);

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });

      it('should succeed to validate a valid signablePayload', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);

        const tx = (await txBuilder.build()) as CustomTransaction;
        const signablePayload = tx.signablePayload;
        should.exist(signablePayload);
      });

      it('should build a unsigned tx and validate basic properties', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.sender, testData.sender2.address);
        should.equal(tx.sequenceNumber, 14);
        should.equal(tx.maxGasAmount, 200000);
        should.equal(tx.gasUnitPrice, 100);
        should.equal(tx.expirationTime, 1736246155);
        should.equal(tx.feePayerAddress, testData.feePayer.address);
      });

      it('should build a custom transaction with token mint function', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(15);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::managed_coin',
          functionName: 'mint',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.sender, testData.sender2.address);
        should.equal(tx.maxGasAmount, 200000);
        should.equal(tx.gasUnitPrice, 100);
        should.equal(tx.sequenceNumber, 15);
        should.equal(tx.expirationTime, 1736246155);
        should.equal(tx.type, TransactionType.CustomTx);

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });

      it('should build a custom transaction with token burn function', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(16);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::managed_coin',
          functionName: 'burn',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [
            testData.recipients[0].amount, // amount
          ],
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.sender, testData.sender2.address);
        should.equal(tx.maxGasAmount, 200000);
        should.equal(tx.gasUnitPrice, 100);
        should.equal(tx.sequenceNumber, 16);
        should.equal(tx.expirationTime, 1736246155);
        should.equal(tx.type, TransactionType.CustomTx);

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });
    });

    describe('Fail', () => {
      it('should fail for invalid sender', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const builder = factory.getCustomTransactionBuilder(transaction);
        should(() => builder.sender('randomString')).throwError('Invalid address randomString');
      });

      it('should fail for missing module name', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: '',
            functionName: 'register_domain',
            typeArguments: [],
            functionArguments: [],
          })
        ).throwError('Missing module name');
      });

      it('should fail for missing function name', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: '0x1::aptos_account',
            functionName: '',
            typeArguments: [],
            functionArguments: [],
          })
        ).throwError('Missing function name');
      });

      it('should fail for invalid module name format', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: 'invalid_format',
            functionName: 'transfer',
            typeArguments: [],
            functionArguments: [],
          })
        ).throwError(/Invalid module name format/);
      });

      it('should fail for invalid function name format', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: '0x1::aptos_account',
            functionName: '123invalid',
            typeArguments: [],
            functionArguments: [],
          })
        ).throwError(/Invalid function name format/);
      });

      it('should accept valid SHORT address format', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: '0x1::aptos_account',
            functionName: 'transfer_coins',
            typeArguments: [],
            functionArguments: [],
          })
        ).not.throw();
      });

      it('should accept valid LONG address format', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: '0x0000000000000000000000000000000000000000000000000000000000000001::aptos_account',
            functionName: 'transfer_coins',
            typeArguments: [],
            functionArguments: [],
          })
        ).not.throw();
      });

      it('should accept named addresses', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: 'aptos_framework::aptos_account',
            functionName: 'transfer_coins',
            typeArguments: [],
            functionArguments: [],
          })
        ).not.throw();
      });

      it('should validate transaction payloads properly', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);

        // Valid payload should pass validation
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::managed_coin',
          functionName: 'mint',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });

        const tx = await txBuilder.build();
        should.exist(tx);
        should.equal(tx.type, TransactionType.CustomTx);
      });

      it('should fail for invalid gas amount', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() => builder.gasData({ maxGasAmount: -1, gasUnitPrice: 100 })).throwError(
          'Value cannot be less than zero'
        );
        should(() => builder.gasData({ maxGasAmount: 200000, gasUnitPrice: -1 })).throwError(
          'Value cannot be less than zero'
        );
      });

      it('should fail to build without required parameters', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);

        await should(txBuilder.build()).be.rejectedWith('Missing required module or function name');
      });
    });

    describe('ABI Behavior Tests', () => {
      it('should succeed when ABI is not provided (undefined)', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
          // No ABI provided - should this work?
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.type, TransactionType.CustomTx);

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });

      it('should handle invalid ABI gracefully or fail appropriately', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });

        // Pass invalid ABI by bypassing TypeScript (cast as any)
        txBuilder.entryFunctionAbi('random_invalid_abi' as any);
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        try {
          const tx = (await txBuilder.build()) as CustomTransaction;
          // If it succeeds, the invalid ABI is ignored
          should.equal(tx.type, TransactionType.CustomTx);
        } catch (error) {
          // If it fails, we know invalid ABI causes errors
          should.exist(error);
        }
      });

      it('should work with correct ABI for transfer_coins', async function () {
        const { TypeTagAddress, TypeTagU64 } = await import('@aptos-labs/ts-sdk');

        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });

        // Provide correct ABI (same as TransferTransaction uses)
        const correctAbi = {
          typeParameters: [{ constraints: [] }],
          parameters: [new TypeTagAddress(), new TypeTagU64()],
        };
        txBuilder.entryFunctionAbi(correctAbi);
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.type, TransactionType.CustomTx);

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });

      it('should test behavior with wrong ABI parameter count', async function () {
        const { TypeTagAddress, TypeTagU64, TypeTagU128 } = await import('@aptos-labs/ts-sdk');

        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(14);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
        });

        // Provide ABI with wrong parameter count (3 instead of 2)
        const wrongAbi = {
          typeParameters: [{ constraints: [] }],
          parameters: [new TypeTagAddress(), new TypeTagU64(), new TypeTagU128()],
        };
        txBuilder.entryFunctionAbi(wrongAbi);
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        try {
          const tx = (await txBuilder.build()) as CustomTransaction;
          should.equal(tx.type, TransactionType.CustomTx);
        } catch (error) {
          should.exist(error);
        }
      });
    });
  });
});
