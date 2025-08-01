import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, StakingTransaction } from '../../src/lib';
import should from 'should';

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

    // Verify recipients
    stakingTx.recipients.length.should.equal(1);
    stakingTx.recipients[0].address.should.equal(stakingContractAddress);
    stakingTx.recipients[0].amount.should.equal(amountToStake);
  });
});
