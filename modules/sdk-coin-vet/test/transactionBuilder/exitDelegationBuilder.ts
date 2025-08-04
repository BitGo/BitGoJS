import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src';
import { ExitDelegationTransaction } from '../../src/lib/transaction/exitDelegation';
import * as testData from '../resources/vet';
import { EXIT_DELEGATION_METHOD_ID, STARGATE_DELEGATION_ADDRESS } from '../../src/lib/constants';

describe('Vet Exit Delegation Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));

  describe('Build and Sign', () => {
    it('should build an exit delegation transaction', async function () {
      const tokenId = '123456';
      const txBuilder = factory.getExitDelegationBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.delegationContract(); // Use default address
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);

      const tx = (await txBuilder.build()) as ExitDelegationTransaction;

      should.equal(tx.sender, testData.addresses.validAddresses[0]);
      should.equal(tx.tokenId, tokenId);
      should.equal(tx.contract, STARGATE_DELEGATION_ADDRESS);
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
      tx.clauses[0]?.to?.should.equal(STARGATE_DELEGATION_ADDRESS);
      should.exist(tx.clauses[0].value);
      tx.clauses[0].value.should.equal('0x0');
    });

    it('should build an exit delegation transaction with custom contract address', async function () {
      const tokenId = '123456';
      const customContractAddress = '0x1234567890123456789012345678901234567890';
      const txBuilder = factory.getExitDelegationBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.delegationContract(customContractAddress);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);

      const tx = (await txBuilder.build()) as ExitDelegationTransaction;

      should.equal(tx.contract, customContractAddress);
      should.exist(tx.clauses[0]);
      should.exist(tx.clauses[0].to);
      tx.clauses[0]?.to?.should.equal(customContractAddress);
    });

    it('should deserialize and reserialize a signed exit delegation transaction', async function () {
      // Create a mock serialized transaction for exit delegation
      const tokenId = '123456';
      const txBuilder = factory.getExitDelegationBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.delegationContract();
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
      should.equal(deserializedTx.contract, STARGATE_DELEGATION_ADDRESS);
    });

    it('should validate the transaction data structure', async function () {
      const txBuilder = factory.getExitDelegationBuilder();

      // Should throw error when building without required fields
      await should(txBuilder.build()).be.rejectedWith('transaction not defined');

      txBuilder.sender(testData.addresses.validAddresses[0]);
      await should(txBuilder.build()).be.rejectedWith('Delegation contract address is required');

      txBuilder.delegationContract();
      await should(txBuilder.build()).be.rejectedWith('Token ID is required');

      // Now add the token ID and it should build successfully
      txBuilder.tokenId('123456');
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');

      const tx = await txBuilder.build();
      should.exist(tx);
    });
  });

  describe('Validation', () => {
    it('should fail with invalid contract address', function () {
      const txBuilder = factory.getExitDelegationBuilder();
      should(() => txBuilder.delegationContract('invalid-address')).throwError('Invalid address invalid-address');
    });

    it('should fail with invalid token ID', async function () {
      const txBuilder = factory.getExitDelegationBuilder();
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.delegationContract();
      txBuilder.tokenId('');

      await should(txBuilder.build()).be.rejectedWith('Token ID is required');
    });
  });
});
