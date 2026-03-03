import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, IncreaseStakeTransaction } from '../../src/lib';
import should from 'should';
import {
  INCREASE_STAKE_METHOD_ID,
  VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET,
} from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import utils from '../../src/lib/utils';

describe('VET Increase Stake Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const validatorAddress = '0x9a7aFCACc88c106f3bbD6B213CD0821D9224d945';
  const amountToStake = '1000000000000000000000000'; // 1000000 VET

  // Helper function to create a basic transaction builder with common properties
  const createBasicTxBuilder = () => {
    const txBuilder = factory.getIncreaseStakeBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build an increase stake transaction', async function () {
    const txBuilder = factory.getIncreaseStakeBuilder();
    txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    txBuilder.amountToStake(amountToStake);
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    txBuilder.validator(validatorAddress);

    const tx = await txBuilder.build();
    should.exist(tx);
    tx.should.be.instanceof(Transaction);
    tx.should.be.instanceof(IncreaseStakeTransaction);

    const increaseStakeTransaction = tx as IncreaseStakeTransaction;
    increaseStakeTransaction.stakingContractAddress.should.equal(
      VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET
    );
    increaseStakeTransaction.validator.should.equal(validatorAddress);
    increaseStakeTransaction.amountToStake.should.equal(amountToStake);

    // Verify clauses
    increaseStakeTransaction.clauses.length.should.equal(1);
    should.exist(increaseStakeTransaction.clauses[0].to);
    should.exist(increaseStakeTransaction.clauses[0].value);
    increaseStakeTransaction.clauses[0].to?.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    increaseStakeTransaction.clauses[0].value?.should.equal(amountToStake);

    // Verify transaction data is correctly encoded using ethereumABI
    should.exist(increaseStakeTransaction.clauses[0].data);
    const txData = increaseStakeTransaction.clauses[0].data;
    txData.should.startWith(INCREASE_STAKE_METHOD_ID);

    // Verify the encoded data matches what we expect from ethereumABI
    const methodName = 'increaseStake';
    const types = ['address'];
    const params = [validatorAddress];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);
    const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

    txData.should.equal(expectedData);

    // Verify recipients
    increaseStakeTransaction.recipients.length.should.equal(1);
    increaseStakeTransaction.recipients[0].address.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
  });

  it('should produce the correct method ID 0x43b0de9a', function () {
    const methodName = 'increaseStake';
    const types = ['address'];
    const method = EthereumAbi.methodID(methodName, types);
    const methodId = '0x' + method.toString('hex');
    methodId.should.equal('0x43b0de9a');
  });

  it('should serialize and deserialize round-trip', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    txBuilder.amountToStake(amountToStake);
    txBuilder.validator(validatorAddress);

    const tx = await txBuilder.build();
    const serialized = tx.toBroadcastFormat();

    // Deserialize using factory.from()
    const txBuilder2 = factory.from(serialized);
    const tx2 = txBuilder2.transaction as IncreaseStakeTransaction;
    tx2.should.be.instanceof(IncreaseStakeTransaction);
    tx2.stakingContractAddress.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    tx2.validator.should.equal(validatorAddress.toLowerCase());
    tx2.amountToStake.should.equal(amountToStake);
  });

  describe('Failure scenarios', function () {
    it('should throw error when stakingContractAddress is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.validator(validatorAddress);
      txBuilder.amountToStake(amountToStake);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when validator address is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.amountToStake(amountToStake);

      await txBuilder.build().should.be.rejectedWith('Validator address is required');
    });

    it('should throw error when amount is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.validator(validatorAddress);

      await txBuilder.build().should.be.rejectedWith('Staking amount is required');
    });

    it('should throw error when stakingContractAddress is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      // Invalid address (wrong format)
      should(() => {
        txBuilder.stakingContractAddress('invalid-address');
      }).throw(/Invalid address/);
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getIncreaseStakeBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.amountToStake(amountToStake);
      txBuilder.chainTag(0x27);
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      txBuilder.validator(validatorAddress);
      // Not setting sender

      const tx = await txBuilder.build();
      tx.should.be.instanceof(IncreaseStakeTransaction);

      const increaseStakeTransaction = tx as IncreaseStakeTransaction;
      // Verify the transaction has inputs but with undefined address
      increaseStakeTransaction.inputs.length.should.equal(1);
      should.not.exist(increaseStakeTransaction.inputs[0].address);

      // Verify the transaction has the correct output
      increaseStakeTransaction.outputs.length.should.equal(1);
      increaseStakeTransaction.outputs[0].address.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    });

    it('should use network default chainTag when not explicitly set', async function () {
      const txBuilder = factory.getIncreaseStakeBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      // Not setting chainTag
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.amountToStake(amountToStake);
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
      txBuilder.validator(validatorAddress);

      const tx = await txBuilder.build();
      tx.should.be.instanceof(IncreaseStakeTransaction);

      const increaseStakeTransaction = tx as IncreaseStakeTransaction;
      // Verify the chainTag is set to the testnet default (39)
      increaseStakeTransaction.chainTag.should.equal(39);
    });
  });

  describe('decodeIncreaseStakeData', function () {
    it('should correctly decode increase stake transaction data with proper address formatting', function () {
      // Encode a known value first
      const methodName = 'increaseStake';
      const types = ['address'];
      const params = [validatorAddress];
      const method = EthereumAbi.methodID(methodName, types);
      const args = EthereumAbi.rawEncode(types, params);
      const encodedData = '0x' + Buffer.concat([method, args]).toString('hex');

      const decodedData = utils.decodeIncreaseStakeData(encodedData);
      decodedData.validator.should.equal(validatorAddress.toLowerCase());
      decodedData.validator.should.startWith('0x');
      decodedData.validator.should.equal(decodedData.validator.toLowerCase());
    });
  });
});
