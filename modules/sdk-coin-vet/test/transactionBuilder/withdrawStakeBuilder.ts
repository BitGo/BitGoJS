import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, WithdrawStakeTransaction } from '../../src/lib';
import should from 'should';
import {
  WITHDRAW_STAKE_METHOD_ID,
  VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET,
} from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import utils from '../../src/lib/utils';

describe('VET Withdraw Stake Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const validatorAddress = '0x9a7aFCACc88c106f3bbD6B213CD0821D9224d945';

  const createBasicTxBuilder = () => {
    const txBuilder = factory.getWithdrawStakeBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27);
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build a withdraw stake transaction', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    txBuilder.validator(validatorAddress);

    const tx = await txBuilder.build();
    should.exist(tx);
    tx.should.be.instanceof(Transaction);
    tx.should.be.instanceof(WithdrawStakeTransaction);

    const withdrawStakeTx = tx as WithdrawStakeTransaction;
    withdrawStakeTx.stakingContractAddress.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    withdrawStakeTx.validator.should.equal(validatorAddress);

    withdrawStakeTx.clauses.length.should.equal(1);
    should.exist(withdrawStakeTx.clauses[0].to);
    withdrawStakeTx.clauses[0].to?.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    withdrawStakeTx.clauses[0].value?.should.equal('0');

    should.exist(withdrawStakeTx.clauses[0].data);
    const txData = withdrawStakeTx.clauses[0].data;
    txData.should.startWith(WITHDRAW_STAKE_METHOD_ID);

    const methodName = 'withdrawStake';
    const types = ['address'];
    const params = [validatorAddress];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);
    const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

    txData.should.equal(expectedData);

    withdrawStakeTx.recipients.length.should.equal(1);
    withdrawStakeTx.recipients[0].address.should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    withdrawStakeTx.recipients[0].amount.should.equal('0');
  });

  it('should produce the correct method ID 0xc23a5cea', function () {
    const methodName = 'withdrawStake';
    const types = ['address'];
    const method = EthereumAbi.methodID(methodName, types);
    const methodId = '0x' + method.toString('hex');
    methodId.should.equal('0xc23a5cea');
  });

  it('should serialize and deserialize round-trip', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);
    txBuilder.validator(validatorAddress);

    const tx = await txBuilder.build();
    const serialized = tx.toBroadcastFormat();

    const txBuilder2 = factory.from(serialized);
    const tx2 = txBuilder2.transaction as WithdrawStakeTransaction;
    tx2.should.be.instanceof(WithdrawStakeTransaction);
    tx2.stakingContractAddress
      .toLowerCase()
      .should.equal(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET.toLowerCase());
    tx2.validator.should.equal(validatorAddress.toLowerCase());
  });

  describe('Failure scenarios', function () {
    it('should throw error when stakingContractAddress is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.validator(validatorAddress);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when validator address is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(VALIDATOR_REGISTRATION_STAKER_CONTRACT_ADDRESS_TESTNET);

      await txBuilder.build().should.be.rejectedWith('Validator address is required');
    });

    it('should throw error when stakingContractAddress is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.stakingContractAddress('invalid-address');
      }).throw(/Invalid address/);
    });
  });

  describe('decodeWithdrawStakeData', function () {
    it('should correctly decode withdraw stake transaction data', function () {
      const methodName = 'withdrawStake';
      const types = ['address'];
      const params = [validatorAddress];
      const method = EthereumAbi.methodID(methodName, types);
      const args = EthereumAbi.rawEncode(types, params);
      const encodedData = '0x' + Buffer.concat([method, args]).toString('hex');

      const decodedData = utils.decodeWithdrawStakeData(encodedData);
      decodedData.validator.should.equal(validatorAddress.toLowerCase());
      decodedData.validator.should.startWith('0x');
    });
  });
});
