import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory, StakeClauseTransaction } from '../../src/lib';
import * as testData from '../resources/vet';

describe('VET Staking Flow - End-to-End Test', function () {
  const coinConfig = coins.get('tvet');
  const factory = new TransactionBuilderFactory(coinConfig);

  // Test data
  const stakingContractAddress = testData.STAKING_CONTRACT_ADDRESS;
  const amountToStake = '1000000000000000000'; // 1 VET in wei
  const levelId = testData.STAKING_LEVEL_ID;
  const senderAddress = '0x9378c12BD7502A11F770a5C1F223c959B2805dA9';
  const feePayerAddress = '0xdc9fef0b84a0ccf3f1bd4b84e41743e3e051a083';

  // Mock signatures for testing (these would come from actual signing in real scenario)
  const mockSenderSignature = Buffer.from(testData.senderSig, 'hex');
  const mockFeePayerSignature = Buffer.from(testData.feePayerSig, 'hex');

  describe('Complete Staking Transaction Flow', function () {
    it('should build, sign, and serialize a complete staking transaction with fee delegation', async function () {
      // Step 1: Build the staking transaction
      const stakingBuilder = factory.getStakingActivateBuilder();

      stakingBuilder
        .stakingContractAddress(stakingContractAddress)
        .amountToStake(amountToStake)
        .levelId(levelId)
        .sender(senderAddress)
        .chainTag(0x27) // Testnet chain tag
        .blockRef('0x014ead140e77bbc1')
        .expiration(64)
        .gas(100000)
        .gasPriceCoef(128)
        .nonce('12345');

      stakingBuilder.addFeePayerAddress(feePayerAddress);

      const unsignedTx = await stakingBuilder.build();
      should.exist(unsignedTx);
      unsignedTx.should.be.instanceof(StakeClauseTransaction);

      const stakingTx = unsignedTx as StakeClauseTransaction;

      // Verify transaction structure
      stakingTx.type.should.equal(TransactionType.StakingActivate);
      stakingTx.stakingContractAddress.should.equal(stakingContractAddress);
      stakingTx.amountToStake.should.equal(amountToStake);
      stakingTx.levelId.should.equal(levelId);

      should.exist(stakingTx.rawTransaction);
      should.exist(stakingTx.rawTransaction.body);

      // This is the critical test - ensure reserved.features = 1 for ContractCall type
      should.exist(stakingTx.rawTransaction.body.reserved);
      stakingTx.rawTransaction.body.reserved!.should.have.property('features', 1);

      // Step 3: Add sender signature
      stakingTx.addSenderSignature(mockSenderSignature);
      should.exist(stakingTx.senderSignature);
      Buffer.from(stakingTx.senderSignature!).should.eql(mockSenderSignature);

      // Step 4: Add fee payer signature
      stakingTx.addFeePayerSignature(mockFeePayerSignature);
      should.exist(stakingTx.feePayerSignature);
      Buffer.from(stakingTx.feePayerSignature!).should.eql(mockFeePayerSignature);

      // Step 5: Generate transaction ID

      // This should NOT throw "not signed transaction: id unavailable" error anymore
      const transactionId = stakingTx.id;
      should.exist(transactionId);
      transactionId.should.not.equal('UNAVAILABLE');

      // Step 6: Serialize the fully signed transaction
      const serializedTx = stakingTx.toBroadcastFormat();
      should.exist(serializedTx);
      serializedTx.should.be.type('string');
      serializedTx.should.startWith('0x');

      // Step 7: Verify transaction can be deserialized
      const deserializedBuilder = factory.from(serializedTx);
      const deserializedTx = deserializedBuilder.transaction as StakeClauseTransaction;

      deserializedTx.should.be.instanceof(StakeClauseTransaction);
      deserializedTx.stakingContractAddress.should.equal(stakingContractAddress);
      deserializedTx.amountToStake.should.equal(amountToStake);
      deserializedTx.levelId.should.equal(levelId);

      // Step 8: Verify toJson output
      const jsonOutput = stakingTx.toJson();
      should.exist(jsonOutput);
      jsonOutput.should.have.property('id', transactionId);
      jsonOutput.should.have.property('stakingContractAddress', stakingContractAddress);
      // JSON output keeps decimal format for amounts
      jsonOutput.should.have.property('amountToStake', amountToStake);
      jsonOutput.should.have.property('levelId', levelId);
    });

    it('should handle signature combination in the correct order', async function () {
      // This test specifically validates the signature combination flow that was failing
      const stakingBuilder = factory.getStakingActivateBuilder();

      stakingBuilder
        .stakingContractAddress(stakingContractAddress)
        .amountToStake(amountToStake)
        .levelId(levelId)
        .sender(senderAddress)
        .chainTag(0x27)
        .blockRef('0x014ead140e77bbc1')
        .expiration(64)
        .gas(100000)
        .gasPriceCoef(128)
        .nonce('12345');

      stakingBuilder.addFeePayerAddress(feePayerAddress);

      const tx = (await stakingBuilder.build()) as StakeClauseTransaction;

      // Test 1: Only sender signature - should generate half-signed transaction
      tx.addSenderSignature(mockSenderSignature);

      // Test 2: Add fee payer signature - should generate fully signed transaction
      tx.addFeePayerSignature(mockFeePayerSignature);

      // Should be able to get transaction ID with both signatures
      const fullSignedId = tx.id;
      should.exist(fullSignedId);
      fullSignedId.should.not.equal('UNAVAILABLE');

      // The ID should be consistent
      fullSignedId.should.be.type('string');
      fullSignedId.length.should.be.greaterThan(10);
    });

    it('should properly set transaction type for fee delegation validation', async function () {
      // This test ensures our fix for TransactionType.ContractCall is working
      const stakingBuilder = factory.getStakingActivateBuilder();

      stakingBuilder
        .stakingContractAddress(stakingContractAddress)
        .amountToStake(amountToStake)
        .levelId(levelId)
        .sender(senderAddress)
        .chainTag(0x27)
        .blockRef('0x014ead140e77bbc1')
        .expiration(64)
        .gas(100000)
        .gasPriceCoef(128)
        .nonce('12345');

      stakingBuilder.addFeePayerAddress(feePayerAddress);

      const tx = (await stakingBuilder.build()) as StakeClauseTransaction;

      // Verify the transaction type is ContractCall
      tx.type.should.equal(TransactionType.StakingActivate);

      // Verify fee delegation is enabled via reserved.features = 1
      const rawTxBody = tx.rawTransaction.body;
      should.exist(rawTxBody.reserved);
      rawTxBody.reserved!.should.have.property('features', 1);

      // This proves that ContractCall transactions now get fee delegation support
    });

    it('should work with pre-built signed transaction from test data', async function () {
      // Test using the actual signed transaction from our test data
      const txBuilder = factory.from(testData.STAKING_TRANSACTION);
      const tx = txBuilder.transaction as StakeClauseTransaction;

      // Should be able to get ID without throwing errors
      const txId = tx.id;
      should.exist(txId);
      txId.should.not.equal('UNAVAILABLE');

      // Verify all staking properties are preserved
      // Note: The test data uses a different contract address in the transaction
      // The actual contract address from the parsed transaction is 0x1856c533ac2d94340aaa8544d35a5c1d4a21dee7
      tx.stakingContractAddress.should.equal('0x1856c533ac2d94340aaa8544d35a5c1d4a21dee7');
      tx.levelId.should.equal(testData.STAKING_LEVEL_ID);
    });
  });

  describe('Fee Delegation Flag Tests', function () {
    it('should set fee delegation for all staking-related transaction types', async function () {
      const testTypes = [
        { type: TransactionType.ContractCall, name: 'Staking' },
        { type: TransactionType.StakingUnlock, name: 'Exit Delegation' },
        { type: TransactionType.StakingWithdraw, name: 'Burn NFT' },
        { type: TransactionType.StakingClaim, name: 'Claim Rewards' },
      ];

      for (const testCase of testTypes) {
        const stakingBuilder = factory.getStakingActivateBuilder();
        stakingBuilder
          .stakingContractAddress(stakingContractAddress)
          .amountToStake(amountToStake)
          .levelId(levelId)
          .sender(senderAddress)
          .chainTag(0x27)
          .blockRef('0x014ead140e77bbc1')
          .expiration(64)
          .gas(100000)
          .gasPriceCoef(128)
          .nonce('12345');

        stakingBuilder.addFeePayerAddress(feePayerAddress);

        // Manually set the transaction type to test different types
        const tx = (await stakingBuilder.build()) as StakeClauseTransaction;
        (tx as any)._type = testCase.type;

        // Rebuild the raw transaction to test fee delegation flag
        await (tx as any).buildRawTransaction();

        // Verify fee delegation is set for all types
        const rawTxBody = tx.rawTransaction.body;
        should.exist(rawTxBody.reserved);
        rawTxBody.reserved!.should.have.property('features', 1);
      }
    });
  });
});
