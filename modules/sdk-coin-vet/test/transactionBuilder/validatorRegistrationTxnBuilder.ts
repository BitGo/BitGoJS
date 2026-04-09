import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, ValidatorRegistrationTransaction } from '../../src/lib';
import should from 'should';
import {
  ADD_VALIDATION_METHOD_ID,
  VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET,
} from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import * as testData from '../resources/vet';
import { BN } from 'ethereumjs-util';
import utils from '../../src/lib/utils';

describe('VET Validator Registration Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const stakingPeriod = 60480;
  const validatorAddress = '0x9a7aFCACc88c106f3bbD6B213CD0821D9224d945';
  const amountToStake = '25000000000000000000000000'; // 25000000 VET
  const amountLessThanMinStake = '24000000000000000000000000'; // 24000000 VET
  const amountGreaterThanMaxStake = '650000000000000000000000000'; // 650000000 VET

  // Helper function to create a basic transaction builder with common properties
  const createBasicTxBuilder = () => {
    const txBuilder = factory.getValidatorRegistrationBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build a validator registration transaction', async function () {
    const txBuilder = factory.getValidatorRegistrationBuilder();
    txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    txBuilder.stakingPeriod(stakingPeriod);
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
    tx.should.be.instanceof(ValidatorRegistrationTransaction);

    const validatorRegistrationTransaction = tx as ValidatorRegistrationTransaction;
    validatorRegistrationTransaction.stakingContractAddress.should.equal(
      VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET
    );
    validatorRegistrationTransaction.stakingPeriod.should.equal(stakingPeriod);
    validatorRegistrationTransaction.validator.should.equal(validatorAddress);
    validatorRegistrationTransaction.amountToStake.should.equal(amountToStake);

    // Verify clauses
    validatorRegistrationTransaction.clauses.length.should.equal(1);
    should.exist(validatorRegistrationTransaction.clauses[0].to);
    should.exist(validatorRegistrationTransaction.clauses[0].value);
    validatorRegistrationTransaction.clauses[0].to?.should.equal(
      VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET
    );
    validatorRegistrationTransaction.clauses[0].value?.should.equal(amountToStake);

    // Verify transaction data is correctly encoded using ethereumABI
    should.exist(validatorRegistrationTransaction.clauses[0].data);
    const txData = validatorRegistrationTransaction.clauses[0].data;
    txData.should.startWith(ADD_VALIDATION_METHOD_ID);

    // Verify the encoded data matches what we expect from ethereumABI
    const methodName = 'addValidation';
    const types = ['address', 'uint32'];
    const params = [validatorAddress, new BN(stakingPeriod)];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);
    const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

    txData.should.equal(expectedData);

    // Verify recipients
    validatorRegistrationTransaction.recipients.length.should.equal(1);
    validatorRegistrationTransaction.recipients[0].address.should.equal(
      VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET
    );
  });

  describe('Failure scenarios', function () {
    it('should throw error when stakingContractAddress is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingPeriod(stakingPeriod);
      txBuilder.validator(validatorAddress);
      txBuilder.amountToStake(amountToStake);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when stakingPeriod is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.validator(validatorAddress);
      txBuilder.amountToStake(amountToStake);

      await txBuilder.build().should.be.rejectedWith('Staking period is required');
    });

    it('should throw error when validator address is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.stakingPeriod(stakingPeriod);
      txBuilder.amountToStake(amountToStake);

      await txBuilder.build().should.be.rejectedWith('Validator address is required');
    });

    it('should throw error when amount is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.stakingPeriod(stakingPeriod);
      txBuilder.validator(validatorAddress);

      await txBuilder.build().should.be.rejectedWith('Staking amount is required');
    });

    it('should throw error when amount is less than minimum stake', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.stakingPeriod(stakingPeriod);
      txBuilder.validator(validatorAddress);
      txBuilder.amountToStake(amountLessThanMinStake);

      await txBuilder.build().should.be.rejectedWith('Staking amount must be between 25M and 600M VET');
    });

    it('should throw error when amount is greater than maximum stake', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.stakingPeriod(stakingPeriod);
      txBuilder.validator(validatorAddress);
      txBuilder.amountToStake(amountGreaterThanMaxStake);

      await txBuilder.build().should.be.rejectedWith('Staking amount must be between 25M and 600M VET');
    });

    it('should throw error when stakingContractAddress is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      // Invalid address (wrong format)
      should(() => {
        txBuilder.stakingContractAddress('invalid-address');
      }).throw(/Invalid address/);
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getValidatorRegistrationBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.stakingPeriod(stakingPeriod);
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
      tx.should.be.instanceof(ValidatorRegistrationTransaction);

      const validatorRegistrationTransaction = tx as ValidatorRegistrationTransaction;
      // Verify the transaction has inputs but with undefined address
      validatorRegistrationTransaction.inputs.length.should.equal(1);
      should.not.exist(validatorRegistrationTransaction.inputs[0].address);

      // Verify the transaction has the correct output
      validatorRegistrationTransaction.outputs.length.should.equal(1);
      validatorRegistrationTransaction.outputs[0].address.should.equal(
        VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET
      );
    });

    it('should use network default chainTag when not explicitly set', async function () {
      const txBuilder = factory.getValidatorRegistrationBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.stakingPeriod(stakingPeriod);
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
      tx.should.be.instanceof(ValidatorRegistrationTransaction);

      const validatorRegistrationTransaction = tx as ValidatorRegistrationTransaction;
      // Verify the chainTag is set to the testnet default (39)
      validatorRegistrationTransaction.chainTag.should.equal(39);
    });
  });

  describe('decodeAddValidationData', function () {
    it('should correctly decode validator registration transaction data with proper address formatting', function () {
      const decodedData = utils.decodeAddValidationData(testData.VALIDATOR_REGISTRATION_CLAUSE_DATA);

      decodedData.period.should.equal(testData.STAKING_PERIOD);
      decodedData.validator.should.equal(testData.VALIDATOR_REGISTRATION_VALIDATOR);
      decodedData.validator.should.startWith('0x');
      decodedData.validator.should.equal(decodedData.validator.toLowerCase());
    });

    it('should correctly deserialize real signed validator registration transaction from raw hex', async function () {
      const txBuilder = factory.from(testData.VALIDATOR_REGISTRATION_TRANSACTION);
      const tx = txBuilder.transaction as ValidatorRegistrationTransaction;
      tx.should.be.instanceof(ValidatorRegistrationTransaction);
      tx.stakingContractAddress.should.equal(testData.VALIDATOR_REGISTRATION_STAKER_CONTRACT);
      tx.stakingPeriod.should.equal(testData.VALIDATOR_REGISTRATION_STAKING_PERIOD);
      tx.validator.should.equal(testData.VALIDATOR_REGISTRATION_VALIDATOR);
      tx.amountToStake.should.equal(testData.VALIDATOR_REGISTRATION_AMOUNT);
      tx.validator.should.startWith('0x');
      tx.validator.should.equal(tx.validator.toLowerCase());
      should.exist(tx.inputs);
      tx.inputs.length.should.equal(1);

      const decodedData = utils.decodeAddValidationData(tx.clauses[0].data);
      decodedData.period.should.equal(testData.VALIDATOR_REGISTRATION_STAKING_PERIOD);
      decodedData.validator.should.equal(testData.VALIDATOR_REGISTRATION_VALIDATOR);
    });
  });
});
