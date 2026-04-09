import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src';
import { ExitDelegationTransaction } from '../../src/lib/transaction/exitDelegation';
import * as testData from '../resources/vet';
import { EXIT_DELEGATION_METHOD_ID, STARGATE_CONTRACT_ADDRESS_TESTNET } from '../../src/lib/constants';

describe('Vet Exit Delegation Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const stakingContractAddress = STARGATE_CONTRACT_ADDRESS_TESTNET;

  describe('Build and Sign', () => {
    it('should build an exit delegation transaction', async function () {
      const tokenId = '123456';
      const txBuilder = factory.getExitDelegationBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);

      const tx = (await txBuilder.build()) as ExitDelegationTransaction;

      should.equal(tx.sender, testData.addresses.validAddresses[0]);
      should.equal(tx.tokenId, tokenId);
      should.equal(tx.stakingContractAddress, STARGATE_CONTRACT_ADDRESS_TESTNET);
      should.equal(tx.gas, 21000);
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.StakingUnlock);

      // Verify the transaction data contains the correct method ID and tokenId
      tx.clauses[0].data.should.startWith(EXIT_DELEGATION_METHOD_ID);

      // Verify the transaction has the correct structure
      tx.clauses.length.should.equal(1);
      should.exist(tx.clauses[0]);
      should.exist(tx.clauses[0].to);
      tx.clauses[0]?.to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
      should.exist(tx.clauses[0].value);
      tx.clauses[0].value.should.equal('0x0');

      tx.inputs.length.should.equal(1);
      tx.outputs.length.should.equal(1);

      should.equal(tx.inputs[0].address, testData.addresses.validAddresses[0]);
      should.equal(tx.inputs[0].value, '0');
      should.equal(tx.inputs[0].coin, 'tvet');

      should.equal(tx.outputs[0].address, STARGATE_CONTRACT_ADDRESS_TESTNET);
      should.equal(tx.outputs[0].value, '0');
      should.equal(tx.outputs[0].coin, 'tvet');
    });

    it('should deserialize and reserialize a signed exit delegation transaction', async function () {
      // Create a mock serialized transaction for exit delegation
      const tokenId = '123456';
      const txBuilder = factory.getExitDelegationBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);

      const tx = (await txBuilder.build()) as ExitDelegationTransaction;
      const serializedTx = tx.toBroadcastFormat();

      // Now deserialize and check
      const deserializedBuilder = factory.from(serializedTx);
      const deserializedTx = (await deserializedBuilder.build()) as ExitDelegationTransaction;

      should.equal(deserializedTx.type, TransactionType.StakingUnlock);
      should.equal(deserializedTx.tokenId, tokenId);
      should.equal(deserializedTx.stakingContractAddress, STARGATE_CONTRACT_ADDRESS_TESTNET);
    });

    it('should validate the transaction data structure', async function () {
      const txBuilder = factory.getExitDelegationBuilder();

      // Should throw error when building without required fields
      await should(txBuilder.build()).be.rejectedWith('Staking contract address is required');

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.stakingContractAddress(stakingContractAddress);
      await should(txBuilder.build()).be.rejectedWith('Token ID is required');

      // Now add the token ID and it should build successfully
      txBuilder.tokenId('123456');
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');

      const tx = await txBuilder.build();
      should.exist(tx);
    });

    it('should build from raw signed tx', async function () {
      const txBuilder = factory.from(testData.EXIT_DELEGATION_TRANSACTION);
      const tx = txBuilder.transaction as ExitDelegationTransaction;
      const toJson = tx.toJson();
      toJson.id.should.equal('0xeca0ba2c8fa91332a1fe037232aa0af9fe6e939313458a6838c6d4060ede0278');
      toJson.stakingContractAddress?.should.equal('0x1e02b2953adefec225cf0ec49805b1146a4429c1');
      toJson.nonce.should.equal('390746');
      toJson.gas.should.equal(217695);
      toJson.gasPriceCoef.should.equal(128);
      toJson.expiration.should.equal(64);
      toJson.chainTag.should.equal(39);
      toJson.tokenId?.should.equal('15661');
    });
  });

  describe('Validation', () => {
    it('should fail with invalid contract address', function () {
      const txBuilder = factory.getExitDelegationBuilder();
      should(() => txBuilder.stakingContractAddress('invalid-address')).throwError('Invalid address invalid-address');
    });

    it('should fail with invalid token ID', async function () {
      const txBuilder = factory.getExitDelegationBuilder();
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.stakingContractAddress(stakingContractAddress);
      txBuilder.tokenId('');

      await should(txBuilder.build()).be.rejectedWith('Token ID is required');
    });
  });
});
