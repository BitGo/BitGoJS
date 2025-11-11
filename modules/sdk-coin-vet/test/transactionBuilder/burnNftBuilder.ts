import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src';
import { BurnNftTransaction } from '../../src/lib/transaction/burnNftTransaction';
import * as testData from '../resources/vet';
import { BURN_NFT_METHOD_ID, STARGATE_CONTRACT_ADDRESS_TESTNET } from '../../src/lib/constants';

describe('Vet Burn NFT Transaction', () => {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));

  describe('Build and Sign', () => {
    it('should build a burn NFT transaction', async function () {
      const tokenId = '123456';
      const txBuilder = factory.getBurnNftBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.nftContract(STARGATE_CONTRACT_ADDRESS_TESTNET);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);

      const tx = (await txBuilder.build()) as BurnNftTransaction;

      should.equal(tx.sender, testData.addresses.validAddresses[0]);
      should.equal(tx.tokenId, tokenId);
      should.equal(tx.contract, STARGATE_CONTRACT_ADDRESS_TESTNET);
      should.equal(tx.gas, 21000);
      should.equal(tx.nonce, '64248');
      should.equal(tx.expiration, 64);
      should.equal(tx.type, TransactionType.StakingWithdraw);

      // Verify the transaction data contains the correct method ID and tokenId
      tx.clauses[0].data.should.startWith(BURN_NFT_METHOD_ID);

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

    it('should build a burn NFT transaction with custom contract address', async function () {
      const tokenId = '123456';
      const customContractAddress = STARGATE_CONTRACT_ADDRESS_TESTNET; // Use the valid testnet NFT address
      const txBuilder = factory.getBurnNftBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.nftContract(customContractAddress);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);

      const tx = (await txBuilder.build()) as BurnNftTransaction;

      should.equal(tx.contract, customContractAddress);
      should.exist(tx.clauses[0]);
      should.exist(tx.clauses[0].to);
      tx.clauses[0]?.to?.should.equal(customContractAddress);
    });

    it('should deserialize and reserialize a signed burn NFT transaction', async function () {
      // Create a mock serialized transaction for burn NFT
      const tokenId = '123456';
      const txBuilder = factory.getBurnNftBuilder();

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.tokenId(tokenId);
      txBuilder.nftContract(STARGATE_CONTRACT_ADDRESS_TESTNET);
      txBuilder.gas(21000);
      txBuilder.nonce('64248');
      txBuilder.blockRef('0x014ead140e77bbc1');
      txBuilder.expiration(64);
      txBuilder.gasPriceCoef(128);

      const tx = (await txBuilder.build()) as BurnNftTransaction;
      const serializedTx = tx.toBroadcastFormat();

      // Now deserialize and check
      const deserializedBuilder = factory.from(serializedTx);
      const deserializedTx = (await deserializedBuilder.build()) as BurnNftTransaction;

      should.equal(deserializedTx.type, TransactionType.StakingWithdraw);
      should.equal(deserializedTx.tokenId, tokenId);
      should.equal(deserializedTx.contract, STARGATE_CONTRACT_ADDRESS_TESTNET);
    });

    it('should validate the transaction data structure', async function () {
      const txBuilder = factory.getBurnNftBuilder();

      // Should throw error when building without required fields
      await should(txBuilder.build()).be.rejectedWith('NFT contract address is required');

      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.nftContract(STARGATE_CONTRACT_ADDRESS_TESTNET);
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
      const txBuilder = factory.getBurnNftBuilder();
      should(() => txBuilder.nftContract('invalid-address')).throwError('Invalid address invalid-address');
    });

    it('should fail with invalid token ID', async function () {
      const txBuilder = factory.getBurnNftBuilder();
      txBuilder.sender(testData.addresses.validAddresses[0]);
      txBuilder.nftContract(STARGATE_CONTRACT_ADDRESS_TESTNET);
      txBuilder.tokenId('');

      await should(txBuilder.build()).be.rejectedWith('Token ID is required');
    });
  });
});
