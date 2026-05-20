import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, StakingTransaction } from '../../src/lib';
import should from 'should';
import { STAKING_METHOD_ID, STARGATE_CONTRACT_ADDRESS_TESTNET } from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import * as testData from '../resources/vet';

describe('VET Staking Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const stakingContractAddress = STARGATE_CONTRACT_ADDRESS_TESTNET;
  const amountToStake = '1000000000000000000'; // 1 VET in wei
  const levelId = 8; // Test level ID
  const autorenew = true; // Test autorenew flag

  // Helper function to create a basic transaction builder with common properties
  const createBasicTxBuilder = () => {
    const txBuilder = factory.getStakingBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build a staking transaction', async function () {
    const txBuilder = factory.getStakingBuilder();
    txBuilder.stakingContractAddress(stakingContractAddress);
    txBuilder.amountToStake(amountToStake);
    txBuilder.levelId(levelId);
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');

    const tx = await txBuilder.build();
    should.exist(tx);
    tx.should.be.instanceof(Transaction);
    tx.should.be.instanceof(StakingTransaction);

    const stakingTx = tx as StakingTransaction;
    stakingTx.stakingContractAddress.should.equal(stakingContractAddress);
    stakingTx.amountToStake.should.equal(amountToStake);
    stakingTx.levelId.should.equal(levelId);
    stakingTx.autorenew.should.equal(autorenew);

    // Verify clauses
    stakingTx.clauses.length.should.equal(1);
    should.exist(stakingTx.clauses[0].to);
    stakingTx.clauses[0].to?.should.equal(stakingContractAddress);
    stakingTx.clauses[0].value.should.equal(amountToStake);

    // Verify transaction data is correctly encoded using ethereumABI
    should.exist(stakingTx.clauses[0].data);
    const txData = stakingTx.clauses[0].data;
    txData.should.startWith(STAKING_METHOD_ID);

    // Verify the encoded data matches what we expect from ethereumABI
    const methodName = 'stakeAndDelegate';
    const types = ['uint8', 'bool'];
    const params = [levelId, autorenew];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);
    const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

    txData.should.equal(expectedData);

    // Verify recipients
    stakingTx.recipients.length.should.equal(1);
    stakingTx.recipients[0].address.should.equal(stakingContractAddress);
    stakingTx.recipients[0].amount.should.equal(amountToStake);
  });

  describe('Failure scenarios', function () {
    it('should throw error when stakingContractAddress is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.amountToStake(amountToStake);
      txBuilder.levelId(levelId);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when levelId is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);

      await txBuilder.build().should.be.rejectedWith('Level ID is required');
    });

    it('should throw error when amountToStake is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.levelId(levelId);

      await txBuilder.build().should.be.rejectedWith('Amount to stake is required');
    });

    it('should throw error when stakingContractAddress is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      // Invalid address (wrong format)
      should(() => {
        txBuilder.stakingContractAddress('invalid-address');
      }).throw(/Invalid address/);
    });

    it('should throw error when amountToStake is not a valid number string', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.levelId(levelId);

      // Invalid amount (not a number)
      txBuilder.amountToStake('not-a-number');

      // Should fail when building the transaction due to invalid amount
      await txBuilder.build().should.be.rejected();
    });

    it('should allow zero amountToStake but encode it properly', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.levelId(levelId);
      txBuilder.amountToStake('0');

      const tx = await txBuilder.build();
      tx.should.be.instanceof(StakingTransaction);

      const stakingTx = tx as StakingTransaction;
      // Verify the amount is correctly set to zero
      stakingTx.amountToStake.should.equal('0');

      // Verify the transaction data is correctly encoded with levelId and autorenew for stakeAndDelegate
      // Expected data for stakeAndDelegate(8, true) where 8 is levelId and true is autorenew
      const expectedData =
        '0xd8da3bbf00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000001';
      stakingTx.clauses[0].data.should.equal(expectedData);
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);
      txBuilder.levelId(levelId);
      txBuilder.chainTag(0x27);
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      // Not setting sender

      const tx = await txBuilder.build();
      tx.should.be.instanceof(StakingTransaction);

      const stakingTx = tx as StakingTransaction;
      // Verify the transaction has inputs but with undefined address
      stakingTx.inputs.length.should.equal(1);
      should.not.exist(stakingTx.inputs[0].address);

      // Verify the transaction has the correct output
      stakingTx.outputs.length.should.equal(1);
      stakingTx.outputs[0].address.should.equal(stakingContractAddress);
      stakingTx.outputs[0].value.should.equal(amountToStake);
    });

    it('should use network default chainTag when not explicitly set', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);
      txBuilder.levelId(levelId);
      // Not setting chainTag
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');

      const tx = await txBuilder.build();
      tx.should.be.instanceof(StakingTransaction);

      const stakingTx = tx as StakingTransaction;
      // Verify the chainTag is set to the testnet default (39)
      stakingTx.chainTag.should.equal(39);
    });

    it('should verify ABI encoding matches expected output for different amounts', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.levelId(levelId);

      // Test with a different amount
      const differentAmount = '500000000000000000'; // 0.5 VET
      txBuilder.amountToStake(differentAmount);

      const tx = await txBuilder.build();
      const stakingTx = tx as StakingTransaction;

      // Manually encode the expected data for stakeAndDelegate method
      const methodName = 'stakeAndDelegate';
      const types = ['uint8', 'bool'];
      const params = [levelId, autorenew];

      const method = EthereumAbi.methodID(methodName, types);
      const args = EthereumAbi.rawEncode(types, params);
      const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

      // Verify the transaction data matches our manual encoding
      stakingTx.clauses[0].data.should.equal(expectedData);
      stakingTx.clauses[0].data.should.startWith(STAKING_METHOD_ID);
    });

    it('should handle extremely large stake amounts correctly', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.levelId(levelId);

      // Test with a very large amount (near uint256 max)
      const largeAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // 2^256 - 1
      txBuilder.amountToStake(largeAmount);

      const tx = await txBuilder.build();
      const stakingTx = tx as StakingTransaction;

      // Verify the amount is stored correctly
      stakingTx.amountToStake.should.equal(largeAmount);

      // The data should still be properly encoded
      stakingTx.clauses[0].data.should.startWith(STAKING_METHOD_ID);

      // Verify recipients
      stakingTx.recipients[0].amount.should.equal(largeAmount);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.STAKING_TRANSACTION);
      const tx = txBuilder.transaction as StakingTransaction;
      const toJson = tx.toJson();
      toJson.id.should.equal('0x99325b39cd04bd1821f6f6af7b679c247e6425a4eb95eb429fa8dff477298d0e');
      toJson.stakingContractAddress?.should.equal('0x1856c533ac2d94340aaa8544d35a5c1d4a21dee7');
      toJson.amountToStake?.should.equal('0xde0b6b3a7640000');
      toJson.nonce.should.equal('609363');
      toJson.gas.should.equal(25988);
      toJson.gasPriceCoef.should.equal(128);
      toJson.expiration.should.equal(64);
      toJson.chainTag.should.equal(39);
      toJson.nftTokenId?.should.equal(8);
      toJson.autorenew?.should.equal(true);
    });
  });
});
