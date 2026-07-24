import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, ClaimRewardsTransaction } from '../../src/lib';
import should from 'should';
import { STARGATE_CONTRACT_ADDRESS_TESTNET } from '../../src/lib/constants';
import * as testData from '../resources/vet';
import { TransactionType } from '@bitgo/sdk-core';

describe('VET Claim Rewards Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const tokenId = '12345';
  const stakingContractAddress = STARGATE_CONTRACT_ADDRESS_TESTNET;

  // Helper function to create a basic transaction builder with common properties
  const createBasicTxBuilder = () => {
    const txBuilder = factory.getClaimRewardsBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.stakingContractAddress(stakingContractAddress);
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build a claim rewards transaction with both reward types', async function () {
    const txBuilder = factory.getClaimRewardsBuilder();
    txBuilder.stakingContractAddress(stakingContractAddress);
    txBuilder.tokenId(tokenId);
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
    claimTx.tokenId.should.equal(tokenId);
    claimTx.stakingContractAddress.should.equal(stakingContractAddress);

    // Verify clauses - should have ONLY 1 clause (delegation rewards)
    claimTx.clauses.length.should.equal(1);

    // staking rewards clause (claimRewards)
    const stakingRewardsClause = claimTx.clauses[0];
    should.exist(stakingRewardsClause);
    stakingRewardsClause?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    stakingRewardsClause?.value.should.equal('0x0');

    // Verify recipients should be empty for claim rewards
    claimTx.recipients.length.should.equal(0);
  });

  it('should build transaction with undefined sender but include it in inputs', async function () {
    const txBuilder = factory.getClaimRewardsBuilder();
    txBuilder.tokenId(tokenId);
    txBuilder.stakingContractAddress(stakingContractAddress);
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

  it('should serialize and explain transaction correctly', async function () {
    const txBuilder = createBasicTxBuilder();
    txBuilder.tokenId(tokenId);
    txBuilder.stakingContractAddress(stakingContractAddress);

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
    const txJson = claimTx.toJson();
    should.exist(txJson);
    txJson.tokenId?.should.equal(tokenId);
    txJson.stakingContractAddress?.should.equal(stakingContractAddress);
  });

  it('should use network default chainTag when not explicitly set', async function () {
    const txBuilder = factory.getClaimRewardsBuilder();
    txBuilder.tokenId(tokenId);
    txBuilder.stakingContractAddress(stakingContractAddress);
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

  it('should build a signed tx and validate its toJson', async function () {
    const tokenIdForClaimTxn = '15662';
    const txBuilder = factory.from(testData.CLAIM_REWARDS_TRANSACTION);
    const tx = txBuilder.transaction as ClaimRewardsTransaction;
    const toJson = tx.toJson();
    toJson.id.should.equal('0x841b388ee325838eb1e3efad661c2ae3266e950b8fc86b8bb484571bdfa27c6d');
    toJson.stakingContractAddress?.should.equal('0x1e02b2953adefec225cf0ec49805b1146a4429c1');
    toJson.nonce.should.equal('973150');
    toJson.gas.should.equal(150878);
    toJson.gasPriceCoef.should.equal(128);
    toJson.expiration.should.equal(64);
    toJson.chainTag.should.equal(39);
    toJson.tokenId?.should.equal(tokenIdForClaimTxn);
  });

  describe('Failure scenarios', function () {
    it('should throw error when token ID is missing', async function () {
      const txBuilder = createBasicTxBuilder();

      await txBuilder.build().should.be.rejectedWith('Token ID is required');
    });

    it('should throw error when staking contract address is missing', async function () {
      const txBuilder = factory.getClaimRewardsBuilder();
      txBuilder.tokenId(tokenId);
      txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
      txBuilder.chainTag(0x27);
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      // Intentionally not setting stakingContractAddress

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });
  });
});
