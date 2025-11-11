import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, ClaimRewardsTransaction } from '../../src/lib';
import { ClaimRewardsData } from '../../src/lib/types';
import should from 'should';
import {
  CLAIM_BASE_REWARDS_METHOD_ID,
  CLAIM_STAKING_REWARDS_METHOD_ID,
  STARGATE_CONTRACT_ADDRESS_TESTNET,
} from '../../src/lib/constants';
import { TransactionType } from '@bitgo/sdk-core';

describe('VET Claim Rewards Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const tokenId = '12345';

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
      tokenId,
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
    claimTx.claimRewardsData.tokenId.should.equal(tokenId);
    claimTx.claimRewardsData.claimBaseRewards?.should.be.true();
    claimTx.claimRewardsData.claimStakingRewards?.should.be.true();

    // Verify clauses - should have 2 clauses for both reward types
    claimTx.clauses.length.should.equal(2);

    // Find base rewards clause (claimVetGeneratedVtho)
    const baseRewardsClause = claimTx.clauses.find((clause) => clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID));
    should.exist(baseRewardsClause);
    baseRewardsClause?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    baseRewardsClause?.value.should.equal('0x0');

    // Find staking rewards clause (claimRewards)
    const stakingRewardsClause = claimTx.clauses.find((clause) =>
      clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)
    );
    should.exist(stakingRewardsClause);
    stakingRewardsClause?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    stakingRewardsClause?.value.should.equal('0x0');

    // Verify recipients should be empty for claim rewards
    claimTx.recipients.length.should.equal(0);
  });

  it('should build a claim rewards transaction with only base rewards', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.claimRewardsData({
      tokenId,
      claimBaseRewards: true,
      claimStakingRewards: false,
    });

    const tx = await txBuilder.build();
    const claimTx = tx as ClaimRewardsTransaction;

    // Should have only 1 clause for base rewards
    claimTx.clauses.length.should.equal(1);
    claimTx.clauses[0].data.should.startWith(CLAIM_BASE_REWARDS_METHOD_ID);
    claimTx.clauses[0].to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    claimTx.clauses[0].value.should.equal('0x0');

    claimTx.claimRewardsData.claimBaseRewards?.should.be.true();
    claimTx.claimRewardsData.claimStakingRewards?.should.be.false();
  });

  it('should build a claim rewards transaction with only staking rewards', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.claimRewardsData({
      tokenId,
      claimBaseRewards: false,
      claimStakingRewards: true,
    });

    const tx = await txBuilder.build();
    const claimTx = tx as ClaimRewardsTransaction;

    // Should have only 1 clause for staking rewards
    claimTx.clauses.length.should.equal(1);
    claimTx.clauses[0].data.should.startWith(CLAIM_STAKING_REWARDS_METHOD_ID);
    claimTx.clauses[0].to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
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

    it('should throw error when token ID is missing', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({} as ClaimRewardsData);
      }).throw('Token ID is required');
    });

    it('should throw error when token ID is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          tokenId: 'invalid-tokenid',
        });
      }).throw('Token ID must be a valid number string');
    });

    it('should throw error when both reward flags are false', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          tokenId,
          claimBaseRewards: false,
          claimStakingRewards: false,
        });
      }).throw('At least one type of rewards (base or staking) must be claimed');
    });

    it('should throw error when claimBaseRewards is not boolean', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          tokenId,
          claimBaseRewards: 'true' as unknown as boolean,
        });
      }).throw('claimBaseRewards must be a boolean');
    });

    it('should throw error when claimStakingRewards is not boolean', async function () {
      const txBuilder = createBasicTxBuilder();

      should(() => {
        txBuilder.claimRewardsData({
          tokenId,
          claimStakingRewards: 1 as unknown as boolean,
        });
      }).throw('claimStakingRewards must be a boolean');
    });

    it('should default to claiming both rewards when flags are undefined', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.claimRewardsData({
        tokenId,
      });

      const tx = await txBuilder.build();
      const claimTx = tx as ClaimRewardsTransaction;

      // Should have 2 clauses by default
      claimTx.clauses.length.should.equal(2);

      const baseRewardsClause = claimTx.clauses.find((clause) => clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID));
      const stakingRewardsClause = claimTx.clauses.find((clause) =>
        clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)
      );

      should.exist(baseRewardsClause);
      should.exist(stakingRewardsClause);
      baseRewardsClause?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
      stakingRewardsClause?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getClaimRewardsBuilder();
      txBuilder.claimRewardsData({
        tokenId,
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
        tokenId,
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
        tokenId,
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
      json.claimRewardsData?.tokenId.should.equal(tokenId);
    });

    it('should correctly handle custom contract addresses when building transactions', async function () {
      const customNftAddress = '0x1234567890123456789012345678901234567890';
      const customDelegationAddress = '0x0987654321098765432109876543210987654321';

      const txBuilder = createBasicTxBuilder();
      txBuilder.claimRewardsData({
        tokenId,
        delegationContractAddress: customDelegationAddress,
        stargateNftAddress: customNftAddress,
      });

      const tx = await txBuilder.build();
      const claimTx = tx as ClaimRewardsTransaction;

      // Verify that custom addresses are stored in claimRewardsData when they differ from defaults
      should.exist(claimTx.claimRewardsData.delegationContractAddress);
      claimTx.claimRewardsData.delegationContractAddress?.should.equal(customDelegationAddress);

      should.exist(claimTx.claimRewardsData.stargateNftAddress);
      claimTx.claimRewardsData.stargateNftAddress?.should.equal(customNftAddress);

      // Verify clauses still use the default addresses (as builders use defaults)
      const baseRewardsClause = claimTx.clauses.find((clause) => clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID));
      const stakingRewardsClause = claimTx.clauses.find((clause) =>
        clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)
      );

      baseRewardsClause?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
      stakingRewardsClause?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    });
  });
});
