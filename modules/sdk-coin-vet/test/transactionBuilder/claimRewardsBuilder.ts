import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, ClaimRewardsTransaction } from '../../src/lib';
import { ClaimRewardsData } from '../../src/lib/types';
import should from 'should';
import {
  CLAIM_BASE_REWARDS_METHOD_ID,
  CLAIM_STAKING_REWARDS_METHOD_ID,
  STARGATE_DELEGATION_ADDRESS,
} from '../../src/lib/constants';
import { TransactionType } from '@bitgo/sdk-core';

describe('VET Claim Rewards Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const validatorAddress = '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed';
  const delegatorAddress = '0x625476eab2e75c5b9c6f8a9d7f1b2c5e6f8e9a7b';

  // Helper function to create a basic transaction builder with common properties
  const createBasicTxBuilder = () => {
    const txBuilder = factory.getClaimRewardsBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build a claim rewards transaction with both reward types', async function () {
    const txBuilder = factory.getClaimRewardsBuilder();
    txBuilder.claimRewardsData({
      validatorAddress,
      delegatorAddress,
      claimBaseRewards: true,
      claimStakingRewards: true,
    });
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
    tx.should.be.instanceof(ClaimRewardsTransaction);

    const claimTx = tx as ClaimRewardsTransaction;
    claimTx.claimRewardsData.validatorAddress.should.equal(validatorAddress);
    claimTx.claimRewardsData.delegatorAddress.should.equal(delegatorAddress);
    claimTx.claimRewardsData.claimBaseRewards?.should.be.true();
    claimTx.claimRewardsData.claimStakingRewards?.should.be.true();

    // Verify clauses - should have 2 clauses for both reward types
    claimTx.clauses.length.should.equal(2);
    claimTx.clauses.forEach((clause) => {
      should.exist(clause.to);
      clause.to?.should.equal(STARGATE_DELEGATION_ADDRESS);
      clause.value.should.equal('0x0');
      should.exist(clause.data);
    });

    // Verify method IDs
    const hasBaseRewards = claimTx.clauses.some((clause) => clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID));
    const hasStakingRewards = claimTx.clauses.some((clause) => clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID));

    hasBaseRewards.should.be.true();
    hasStakingRewards.should.be.true();

    // Verify recipients should be empty for claim rewards
    claimTx.recipients.length.should.equal(0);
  });

  it('should build a claim rewards transaction with only base rewards', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.claimRewardsData({
      validatorAddress,
      delegatorAddress,
      claimBaseRewards: true,
      claimStakingRewards: false,
    });

    const tx = await txBuilder.build();
    const claimTx = tx as ClaimRewardsTransaction;

    // Should have only 1 clause for base rewards
    claimTx.clauses.length.should.equal(1);
    claimTx.clauses[0].data.should.startWith(CLAIM_BASE_REWARDS_METHOD_ID);
    claimTx.clauses[0].to?.should.equal(STARGATE_DELEGATION_ADDRESS);
    claimTx.clauses[0].value.should.equal('0x0');

    claimTx.claimRewardsData.claimBaseRewards?.should.be.true();
    claimTx.claimRewardsData.claimStakingRewards?.should.be.false();
  });

  it('should build a claim rewards transaction with only staking rewards', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.claimRewardsData({
      validatorAddress,
      delegatorAddress,
      claimBaseRewards: false,
      claimStakingRewards: true,
    });

    const tx = await txBuilder.build();
    const claimTx = tx as ClaimRewardsTransaction;

    // Should have only 1 clause for staking rewards
    claimTx.clauses.length.should.equal(1);
    claimTx.clauses[0].data.should.startWith(CLAIM_STAKING_REWARDS_METHOD_ID);
    claimTx.clauses[0].to?.should.equal(STARGATE_DELEGATION_ADDRESS);
    claimTx.clauses[0].value.should.equal('0x0');

    claimTx.claimRewardsData.claimBaseRewards?.should.be.false();
    claimTx.claimRewardsData.claimStakingRewards?.should.be.true();
  });

  describe('Failure scenarios', function () {
    it('should throw error when claim rewards data is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      // Not setting claimRewardsData

      await txBuilder.build().should.be.rejectedWith('Claim rewards data is required');
    });

    it('should throw error when validator address is missing', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          delegatorAddress,
        } as Partial<ClaimRewardsData> as ClaimRewardsData);
      }).throw('Validator address is required');
    });

    it('should throw error when delegator address is missing', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          validatorAddress,
        } as Partial<ClaimRewardsData> as ClaimRewardsData);
      }).throw('Delegator address is required');
    });

    it('should throw error when validator address is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          validatorAddress: 'invalid-address',
          delegatorAddress,
        });
      }).throw(/Invalid validator address format/);
    });

    it('should throw error when delegator address is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          validatorAddress,
          delegatorAddress: '0xinvalid',
        });
      }).throw(/Invalid delegator address format/);
    });

    it('should throw error when both reward flags are false', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          validatorAddress,
          delegatorAddress,
          claimBaseRewards: false,
          claimStakingRewards: false,
        });
      }).throw('At least one type of rewards (base or staking) must be claimed');
    });

    it('should throw error when claimBaseRewards is not boolean', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          validatorAddress,
          delegatorAddress,
          claimBaseRewards: 'true' as unknown as boolean,
        });
      }).throw('claimBaseRewards must be a boolean');
    });

    it('should throw error when claimStakingRewards is not boolean', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          validatorAddress,
          delegatorAddress,
          claimStakingRewards: 1 as unknown as boolean,
        });
      }).throw('claimStakingRewards must be a boolean');
    });

    it('should default to claiming both rewards when flags are undefined', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.claimRewardsData({
        validatorAddress,
        delegatorAddress,
      });

      const tx = await txBuilder.build();
      const claimTx = tx as ClaimRewardsTransaction;

      // Should have 2 clauses by default
      claimTx.clauses.length.should.equal(2);

      const hasBaseRewards = claimTx.clauses.some((clause) => clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID));
      const hasStakingRewards = claimTx.clauses.some((clause) =>
        clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)
      );

      hasBaseRewards.should.be.true();
      hasStakingRewards.should.be.true();
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getClaimRewardsBuilder();
      txBuilder.claimRewardsData({
        validatorAddress,
        delegatorAddress,
      });
      txBuilder.chainTag(0x27);
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      // Not setting sender

      const tx = await txBuilder.build();
      tx.should.be.instanceof(ClaimRewardsTransaction);

      const claimTx = tx as ClaimRewardsTransaction;
      // Verify the transaction has inputs but with undefined address
      claimTx.inputs.length.should.equal(1);
      should.not.exist(claimTx.inputs[0].address);

      // Verify the transaction has no outputs (claim rewards doesn't transfer value)
      claimTx.outputs.length.should.equal(0);
    });

    it('should use network default chainTag when not explicitly set', async function () {
      const txBuilder = factory.getClaimRewardsBuilder();
      txBuilder.claimRewardsData({
        validatorAddress,
        delegatorAddress,
      });
      // Not setting chainTag
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');

      const tx = await txBuilder.build();
      tx.should.be.instanceof(ClaimRewardsTransaction);

      const claimTx = tx as ClaimRewardsTransaction;
      // Verify the chainTag is set to the testnet default (39)
      claimTx.chainTag.should.equal(39);
    });

    it('should serialize and explain transaction correctly', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.claimRewardsData({
        validatorAddress,
        delegatorAddress,
      });

      const tx = await txBuilder.build();
      const claimTx = tx as ClaimRewardsTransaction;

      // Test serialization
      const serialized = claimTx.toBroadcastFormat();
      serialized.should.be.String();
      serialized.should.startWith('0x');

      // Test explanation
      const explanation = claimTx.explainTransaction();
      explanation.type?.should.equal(TransactionType.StakingClaim);
      should.exist(explanation.fee);
      explanation.outputAmount.should.equal('0');
      explanation.changeAmount.should.equal('0');

      // Test toJson
      const json = claimTx.toJson();
      should.exist(json.claimRewardsData);
      json.claimRewardsData?.validatorAddress.should.equal(validatorAddress);
      json.claimRewardsData?.delegatorAddress.should.equal(delegatorAddress);
    });
  });
});
