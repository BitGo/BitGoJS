import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, StakingTransaction } from '../../src/lib';
import should from 'should';
import { STAKING_METHOD_ID } from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import { BN } from 'ethereumjs-util';

describe('VET Staking Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const stakingContractAddress = '0x1EC1D168574603ec35b9d229843B7C2b44bCB770';
  const amountToStake = '1000000000000000000'; // 1 VET in wei
  const stakingContractABI = [
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'stake',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
  ];

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
    txBuilder.stakingContractABI(stakingContractABI);
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
    stakingTx.stakingContractABI.should.deepEqual(stakingContractABI);

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
      txBuilder.stakingContractABI(stakingContractABI);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when amountToStake is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.stakingContractABI(stakingContractABI);

      await txBuilder.build().should.be.rejectedWith('Amount to stake is required');
    });

    it('should throw error when stakingContractAddress is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      // Invalid address (wrong format)
      should(() => {
        txBuilder.stakingContractAddress('invalid-address');
      }).throw(/Invalid address/);
    });

    it('should allow zero amountToStake but encode it properly', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.stakingContractABI(stakingContractABI);
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

    it('should generate correct transaction data even without explicitly setting stakingContractABI', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);
      // Not setting stakingContractABI

      const tx = await txBuilder.build();
      tx.should.be.instanceof(StakingTransaction);

      const stakingTx = tx as StakingTransaction;
      // Verify the transaction data is correctly generated using the default staking method ID
      stakingTx.clauses[0].data.should.startWith(STAKING_METHOD_ID);
      // Verify the encoded amount matches what we expect
      const expectedData = '0xa694fc3a0000000000000000000000000000000000000000000000000de0b6b3a7640000';
      stakingTx.clauses[0].data.should.equal(expectedData);
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.amountToStake(amountToStake);
      txBuilder.stakingContractABI(stakingContractABI);
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
      txBuilder.stakingContractABI(stakingContractABI);
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
  });
});
