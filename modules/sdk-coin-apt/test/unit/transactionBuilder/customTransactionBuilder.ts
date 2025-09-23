import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, CustomTransaction } from '../../../src';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { TypeTagAddress, TypeTagU64, TypeTagU128, TypeTagVector, TypeTagU8, TypeTagBool } from '@aptos-labs/ts-sdk';

describe('Apt Custom Transaction Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tapt'));

  // Common ABI patterns for tests
  const transferCoinsAbi = {
    typeParameters: [{ constraints: [] }],
    parameters: [new TypeTagAddress(), new TypeTagU64()],
  };

  const mintAbi = {
    typeParameters: [{ constraints: [] }], // Expects 1 type parameter for Coin<T>
    parameters: [new TypeTagAddress(), new TypeTagU64()],
  };

  const burnAbi = {
    typeParameters: [{ constraints: [] }], // Expects 1 type parameter for Coin<T>
    parameters: [new TypeTagU64()],
  };

  const basicAbi = {
    typeParameters: [],
    parameters: [],
  };

  // ABI for custom token functions that don't use type parameters
  const customTokenMintAbi = {
    typeParameters: [], // No type parameters for custom token
    parameters: [new TypeTagAddress(), new TypeTagU64()],
  };

  const customTokenBurnAbi = {
    typeParameters: [], // No type parameters for custom token
    parameters: [new TypeTagU64()],
  };

  // Wrong ABI for testing - has wrong parameter count but correct type parameter count
  const wrongAbi = {
    typeParameters: [{ constraints: [] }],
    parameters: [new TypeTagAddress(), new TypeTagU64(), new TypeTagAddress()], // Wrong - 3 params instead of 2
  };

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
          abi: transferCoinsAbi,
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
          abi: transferCoinsAbi,
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
          abi: transferCoinsAbi,
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
          abi: mintAbi,
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
          abi: burnAbi,
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
            abi: basicAbi,
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
            abi: basicAbi,
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
            abi: basicAbi,
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
            abi: basicAbi,
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
            abi: basicAbi,
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
            abi: basicAbi,
          })
        ).not.throw();
      });

      it('should reject named addresses', async function () {
        const builder = factory.getCustomTransactionBuilder();
        should(() =>
          builder.customTransaction({
            moduleName: 'aptos_framework::aptos_account',
            functionName: 'transfer_coins',
            typeArguments: [],
            functionArguments: [],
            abi: basicAbi,
          })
        ).throwError(/Invalid module name format.*hex addresses only/);
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
          abi: mintAbi,
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
          abi: transferCoinsAbi, // ABI is now required
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.type, TransactionType.CustomTx);

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });

      it('should fail with invalid ABI string', async function () {
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
          abi: transferCoinsAbi,
        });

        // Pass invalid ABI by bypassing TypeScript (cast as any)
        txBuilder.entryFunctionAbi('random_invalid_abi' as any);
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        // Should fail due to invalid ABI during build
        await should(txBuilder.build()).be.rejected();
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
          abi: transferCoinsAbi,
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

      it('should build transaction with custom token mint at deployed address', async function () {
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
          moduleName: '0xa85107ee0e345969d2b76e57f6f67c551ba1b066fc14d213328dded62618bf2e::sample_token',
          functionName: 'mint',
          typeArguments: [],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount],
          abi: customTokenMintAbi,
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.type, TransactionType.CustomTx);
        should.equal(
          tx.fullFunctionName,
          '0xa85107ee0e345969d2b76e57f6f67c551ba1b066fc14d213328dded62618bf2e::sample_token::mint'
        );

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });

      it('should build transaction with custom token burn at deployed address', async function () {
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
          moduleName: '0xa85107ee0e345969d2b76e57f6f67c551ba1b066fc14d213328dded62618bf2e::sample_token',
          functionName: 'burn',
          typeArguments: [],
          functionArguments: [testData.recipients[0].amount],
          abi: customTokenBurnAbi,
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.type, TransactionType.CustomTx);
        should.equal(
          tx.fullFunctionName,
          '0xa85107ee0e345969d2b76e57f6f67c551ba1b066fc14d213328dded62618bf2e::sample_token::burn'
        );

        const rawTx = tx.toBroadcastFormat();
        should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      });

      it('should fail with wrong ABI parameter count', async function () {
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
          abi: transferCoinsAbi,
        });

        // Provide ABI with wrong parameter count (3 instead of 2)
        const wrongAbi = {
          typeParameters: [{ constraints: [] }],
          parameters: [new TypeTagAddress(), new TypeTagU64(), new TypeTagU128()],
        };
        txBuilder.entryFunctionAbi(wrongAbi);
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        // Should fail due to parameter count mismatch
        await should(txBuilder.build()).be.rejectedWith(/Too few arguments/);
      });

      it('should test wrong ABI behavior', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(16);
        txBuilder.expirationTime(1736246155);

        // Provide function that expects 2 args but wrong ABI expects 3
        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount], // 2 args
          abi: wrongAbi, // ABI expects 3 parameters but we provide 2
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        // Should fail due to argument count mismatch
        await should(txBuilder.build()).be.rejectedWith(/Too few arguments/);
      });

      it('should test wrong ABI with matching parameter count but wrong types', async function () {
        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(17);
        txBuilder.expirationTime(1736246155);

        // Wrong ABI with correct parameter count but wrong types
        const wrongTypesAbi = {
          typeParameters: [{ constraints: [] }],
          parameters: [new TypeTagU64(), new TypeTagU64()], // Both u64 instead of Address + u64
        };

        txBuilder.customTransaction({
          moduleName: '0x1::aptos_account',
          functionName: 'transfer_coins',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [testData.recipients[0].address, testData.recipients[0].amount], // Address + u64
          abi: wrongTypesAbi,
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        // Should fail due to type mismatch between ABI and actual arguments
        await should(txBuilder.build()).be.rejected();
      });

      it('should build regulated token initialize with correct ABI', async function () {
        const regulatedTokenInitializeAbi = {
          typeParameters: [],
          parameters: [
            new TypeTagVector(new TypeTagU8()),
            new TypeTagVector(new TypeTagU8()),
            new TypeTagU8(),
            new TypeTagVector(new TypeTagU8()),
            new TypeTagVector(new TypeTagU8()),
          ],
        };

        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(18);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x4a280942fd4aa7218aaf9beed6756dbc7f4d05b7f13b8a4c5564dd4a34b92192::regulated_token',
          functionName: 'initialize',
          typeArguments: [],
          functionArguments: ['Regulated Token', 'RT', 6, 'https://example.com/icon.png', 'Regulated Token Project'],
          abi: regulatedTokenInitializeAbi,
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.type, TransactionType.CustomTx);
        should.equal(
          tx.fullFunctionName,
          '0x4a280942fd4aa7218aaf9beed6756dbc7f4d05b7f13b8a4c5564dd4a34b92192::regulated_token::initialize'
        );
      });

      it('should fail regulated token initialize with wrong ABI', async function () {
        const wrongRegulatedTokenAbi = {
          typeParameters: [],
          parameters: [
            new TypeTagU64(),
            new TypeTagU64(),
            new TypeTagU128(),
            new TypeTagVector(new TypeTagU8()),
            new TypeTagVector(new TypeTagU8()),
          ],
        };

        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(19);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x4a280942fd4aa7218aaf9beed6756dbc7f4d05b7f13b8a4c5564dd4a34b92192::regulated_token',
          functionName: 'initialize',
          typeArguments: [],
          functionArguments: ['Regulated Token', 'RT', 6, 'https://example.com/icon.png', 'Regulated Token Project'],
          abi: wrongRegulatedTokenAbi,
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        // Should fail due to type mismatch during serialization
        await should(txBuilder.build()).be.rejected();
      });

      it('should build managed trading place_order_v3 with correct ABI', async function () {
        const placeOrderV3Abi = {
          typeParameters: [{ constraints: [] }, { constraints: [] }],
          parameters: [
            new TypeTagAddress(),
            new TypeTagU64(),
            new TypeTagU64(),
            new TypeTagU64(),
            new TypeTagBool(),
            new TypeTagBool(),
            new TypeTagBool(),
            new TypeTagU64(),
            new TypeTagU64(),
            new TypeTagBool(),
            new TypeTagAddress(),
          ],
        };

        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(20);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x33a8693758d1d28a9305946c7758b7548a04736c35929eac22eb0de2a865275d::managed_trading',
          functionName: 'place_order_v3',
          typeArguments: [
            '0x33a8693758d1d28a9305946c7758b7548a04736c35929eac22eb0de2a865275d::pair_types::TRUMP_USD',
            '0x33a8693758d1d28a9305946c7758b7548a04736c35929eac22eb0de2a865275d::fa_box::W_USDC',
          ],
          functionArguments: [
            '0x6a8d106dcc0f63cb8b35d0e7d33c9ff38f392d963595368cd230c46f6b7397a5',
            '800000000',
            '0',
            '18446744073709551615',
            true,
            false,
            true,
            '1',
            '18446744073709551615',
            false,
            '0x0',
          ],
          abi: placeOrderV3Abi,
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        const tx = (await txBuilder.build()) as CustomTransaction;
        should.equal(tx.type, TransactionType.CustomTx);
        should.equal(
          tx.fullFunctionName,
          '0x33a8693758d1d28a9305946c7758b7548a04736c35929eac22eb0de2a865275d::managed_trading::place_order_v3'
        );
      });

      it('should fail managed trading place_order_v3 with wrong ABI parameter count', async function () {
        const wrongPlaceOrderAbi = {
          typeParameters: [{ constraints: [] }, { constraints: [] }],
          parameters: [
            new TypeTagAddress(), // target_config
            new TypeTagU64(), // max_base
            new TypeTagU64(), // max_quote
            // Missing 8 more parameters - only 3 instead of 11
          ],
        };

        const transaction = new CustomTransaction(coins.get('tapt'));
        const txBuilder = factory.getCustomTransactionBuilder(transaction);
        txBuilder.sender(testData.sender2.address);
        txBuilder.gasData({
          maxGasAmount: 200000,
          gasUnitPrice: 100,
        });
        txBuilder.sequenceNumber(21);
        txBuilder.expirationTime(1736246155);
        txBuilder.customTransaction({
          moduleName: '0x33a8693758d1d28a9305946c7758b7548a04736c35929eac22eb0de2a865275d::managed_trading',
          functionName: 'place_order_v3',
          typeArguments: [
            '0x33a8693758d1d28a9305946c7758b7548a04736c35929eac22eb0de2a865275d::pair_types::TRUMP_USD',
            '0x33a8693758d1d28a9305946c7758b7548a04736c35929eac22eb0de2a865275d::fa_box::W_USDC',
          ],
          functionArguments: [
            '0x6a8d106dcc0f63cb8b35d0e7d33c9ff38f392d963595368cd230c46f6b7397a5',
            '800000000',
            '0',
            '18446744073709551615',
            true,
            false,
            true,
            '1',
            '18446744073709551615',
            false,
            '0x0',
          ],
          abi: wrongPlaceOrderAbi,
        });
        txBuilder.addFeePayerAddress(testData.feePayer.address);
        txBuilder.setIsSimulateTxn(true);

        // Should fail due to parameter count mismatch (expects 3, got 11)
        await should(txBuilder.build()).be.rejectedWith(/Too many arguments.*expected 3/);
      });
    });
  });
});
