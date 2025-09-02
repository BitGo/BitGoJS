import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, StakingTransaction } from '../../src/lib';
import should from 'should';
import { STAKING_METHOD_ID } from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import { BN } from 'ethereumjs-util';
import * as testData from '../resources/vet';

describe('VET Staking Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const stakingContractAddress = '0x1EC1D168574603ec35b9d229843B7C2b44bCB770';
  const amountToStake = '1000000000000000000'; // 1 VET in wei

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
    txBuilder.stakingContractABI(EthereumAbi);
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
    stakingTx.stakingContractABI.should.deepEqual(EthereumAbi);

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
    const methodName = 'stake';
    const types = ['uint256'];
    const params = [new BN(amountToStake)];

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
      txBuilder.stakingContractABI(EthereumAbi);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when amountToStake is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.stakingContractABI(EthereumAbi);

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
      txBuilder.stakingContractABI(EthereumAbi);

      // Invalid amount (not a number)
      should(() => {
        txBuilder.amountToStake('not-a-number');
      }).not.throw(); // The setter doesn't validate
      // But it should fail when building the transaction
      await txBuilder.build().should.be.rejectedWith(/Invalid character/);
    });

    it('should pass validation with any ABI object but may fail during build', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);

      // Set an invalid ABI object
      const invalidAbi = {};
      txBuilder.stakingContractABI(invalidAbi as EthereumAbi);

      // The validation will pass because it only checks if the ABI property exists
      // But the build might fail if the ABI is actually used in the build process
      // Since the actual encoding is done by utils.getStakingData() which doesn't use
      // the ABI set on the transaction, this might still succeed
      try {
        await txBuilder.build();
      } catch (e) {
        // If it fails, it should be because of an invalid ABI
        e.message.should.match(/methodID|rawEncode/);
      }
    });

    it('should allow zero amountToStake but encode it properly', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.stakingContractABI(EthereumAbi);
      txBuilder.amountToStake('0');

      const tx = await txBuilder.build();
      tx.should.be.instanceof(StakingTransaction);

      const stakingTx = tx as StakingTransaction;
      // Verify the amount is correctly set to zero
      stakingTx.amountToStake.should.equal('0');

      // Verify the transaction data is correctly encoded with zero amount
      const expectedData = '0xa694fc3a0000000000000000000000000000000000000000000000000000000000000000';
      stakingTx.clauses[0].data.should.equal(expectedData);
    });

    it('should throw error when stakingContractABI is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);
      // Not setting stakingContractABI

      // Should fail when trying to build without ABI
      await txBuilder.build().should.be.rejectedWith('Staking contract ABI is required');
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);
      txBuilder.stakingContractABI(EthereumAbi);
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
      txBuilder.stakingContractABI(EthereumAbi);
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
      txBuilder.stakingContractABI(EthereumAbi);

      // Test with a different amount
      const differentAmount = '500000000000000000'; // 0.5 VET
      txBuilder.amountToStake(differentAmount);

      const tx = await txBuilder.build();
      const stakingTx = tx as StakingTransaction;

      // Manually encode the expected data
      const methodName = 'stake';
      const types = ['uint256'];
      const params = [new BN(differentAmount)];

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
      txBuilder.stakingContractABI(EthereumAbi);

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
      toJson.id.should.equal('0x4fd543eb5ac4e4b1a3eeda7335cd8ba449e5aef6dff243a55d83daf480526e11');
      toJson.stakingContractAddress?.should.equal('0x1ec1d168574603ec35b9d229843b7c2b44bcb770');
      toJson.amountToStake?.should.equal('0xde0b6b3a7640000');
      toJson.nonce.should.equal('449037');
      toJson.gas.should.equal(47565);
      toJson.gasPriceCoef.should.equal(128);
      toJson.expiration.should.equal(64);
      toJson.chainTag.should.equal(39);
    });
  });
});
