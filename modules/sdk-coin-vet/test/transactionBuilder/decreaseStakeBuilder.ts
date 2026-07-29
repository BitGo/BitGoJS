import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, DecreaseStakeTransaction } from '../../src/lib';
import should from 'should';
import {
  DECREASE_STAKE_METHOD_ID,
  VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET,
} from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import { BN } from 'ethereumjs-util';
import utils from '../../src/lib/utils';

describe('VET Decrease Stake Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const validatorAddress = '0x9a7aFCACc88c106f3bbD6B213CD0821D9224d945';
  const decreaseAmount = '1000000000000000000000000'; // 1000000 VET

  const createBasicTxBuilder = () => {
    const txBuilder = factory.getDecreaseStakeBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27);
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build a decrease stake transaction', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    txBuilder.amount(decreaseAmount);
    txBuilder.validator(validatorAddress);

    const tx = await txBuilder.build();
    should.exist(tx);
    tx.should.be.instanceof(Transaction);
    tx.should.be.instanceof(DecreaseStakeTransaction);

    const decreaseStakeTx = tx as DecreaseStakeTransaction;
    decreaseStakeTx.stakingContractAddress.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    decreaseStakeTx.validator.should.equal(validatorAddress);
    decreaseStakeTx.amount.should.equal(decreaseAmount);

    decreaseStakeTx.clauses.length.should.equal(1);
    should.exist(decreaseStakeTx.clauses[0].to);
    decreaseStakeTx.clauses[0].to?.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    decreaseStakeTx.clauses[0].value?.should.equal('0');

    should.exist(decreaseStakeTx.clauses[0].data);
    const txData = decreaseStakeTx.clauses[0].data;
    txData.should.startWith(DECREASE_STAKE_METHOD_ID);

    const methodName = 'decreaseStake';
    const types = ['address', 'uint256'];
    const params = [validatorAddress, new BN(decreaseAmount)];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);
    const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

    txData.should.equal(expectedData);

    decreaseStakeTx.recipients.length.should.equal(1);
    decreaseStakeTx.recipients[0].address.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    decreaseStakeTx.recipients[0].amount.should.equal('0');
  });

  it('should produce the correct method ID 0x1a73ba01', function () {
    const methodName = 'decreaseStake';
    const types = ['address', 'uint256'];
    const method = EthereumAbi.methodID(methodName, types);
    const methodId = '0x' + method.toString('hex');
    methodId.should.equal('0x1a73ba01');
  });

  it('should serialize and deserialize round-trip', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    txBuilder.amount(decreaseAmount);
    txBuilder.validator(validatorAddress);

    const tx = await txBuilder.build();
    const serialized = tx.toBroadcastFormat();

    const txBuilder2 = factory.from(serialized);
    const tx2 = txBuilder2.transaction as DecreaseStakeTransaction;
    tx2.should.be.instanceof(DecreaseStakeTransaction);
    tx2.stakingContractAddress
      .toLowerCase()
      .should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET.toLowerCase());
    tx2.validator.should.equal(validatorAddress.toLowerCase());
    tx2.amount.should.equal(decreaseAmount);
  });

  describe('Failure scenarios', function () {
    it('should throw error when stakingContractAddress is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.validator(validatorAddress);
      txBuilder.amount(decreaseAmount);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when validator address is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.amount(decreaseAmount);

      await txBuilder.build().should.be.rejectedWith('Validator address is required');
    });

    it('should throw error when amount is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
      txBuilder.validator(validatorAddress);

      await txBuilder.build().should.be.rejectedWith('Amount is required');
    });

    it('should throw error when stakingContractAddress is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.stakingContractAddress('invalid-address');
      }).throw(/Invalid address/);
    });
  });

  describe('decodeDecreaseStakeData', function () {
    it('should correctly decode decrease stake transaction data', function () {
      const methodName = 'decreaseStake';
      const types = ['address', 'uint256'];
      const params = [validatorAddress, new BN(decreaseAmount)];
      const method = EthereumAbi.methodID(methodName, types);
      const args = EthereumAbi.rawEncode(types, params);
      const encodedData = '0x' + Buffer.concat([method, args]).toString('hex');

      const decodedData = utils.decodeDecreaseStakeData(encodedData);
      decodedData.validator.should.equal(validatorAddress.toLowerCase());
      decodedData.validator.should.startWith('0x');
      decodedData.amount.should.equal(decreaseAmount);
    });
  });
});
