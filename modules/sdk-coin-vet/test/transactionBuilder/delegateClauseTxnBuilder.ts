import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, DelegateClauseTransaction } from '../../src/lib';
import should from 'should';
import { DELEGATE_CLAUSE_METHOD_ID, STARGATE_CONTRACT_ADDRESS_TESTNET } from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import * as testData from '../resources/vet';
import { BN } from 'ethereumjs-util';
import utils from '../../src/lib/utils';

describe('VET Delegation Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const tokenId = '100201'; // Test token ID
  const validatorAddress = '0x9a7aFCACc88c106f3bbD6B213CD0821D9224d945';

  // Helper function to create a basic transaction builder with common properties
  const createBasicTxBuilder = () => {
    const txBuilder = factory.getStakingDelegateBuilder();
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    return txBuilder;
  };

  it('should build a delegate transaction', async function () {
    const txBuilder = factory.getStakingDelegateBuilder();
    txBuilder.stakingContractAddress(STARGATE_CONTRACT_ADDRESS_TESTNET);
    txBuilder.tokenId(tokenId);
    txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
    txBuilder.chainTag(0x27); // Testnet chain tag
    txBuilder.blockRef('0x0000000000000000');
    txBuilder.expiration(64);
    txBuilder.gas(100000);
    txBuilder.gasPriceCoef(0);
    txBuilder.nonce('12345');
    txBuilder.validator(validatorAddress);

    const tx = await txBuilder.build();
    should.exist(tx);
    tx.should.be.instanceof(Transaction);
    tx.should.be.instanceof(DelegateClauseTransaction);

    const delegationTx = tx as DelegateClauseTransaction;
    delegationTx.stakingContractAddress.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    delegationTx.tokenId.should.equal(tokenId);
    delegationTx.validator.should.equal(validatorAddress);

    // Verify clauses
    delegationTx.clauses.length.should.equal(1);
    should.exist(delegationTx.clauses[0].to);
    delegationTx.clauses[0].to?.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);

    // Verify transaction data is correctly encoded using ethereumABI
    should.exist(delegationTx.clauses[0].data);
    const txData = delegationTx.clauses[0].data;
    txData.should.startWith(DELEGATE_CLAUSE_METHOD_ID);

    // Verify the encoded data matches what we expect from ethereumABI
    const methodName = 'delegate';
    const types = ['uint256', 'address'];
    const params = [new BN(tokenId), validatorAddress];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);
    const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

    txData.should.equal(expectedData);

    // Verify recipients
    delegationTx.recipients.length.should.equal(1);
    delegationTx.recipients[0].address.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
  });

  describe('Failure scenarios', function () {
    it('should throw error when stakingContractAddress is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.tokenId(tokenId);
      txBuilder.validator(validatorAddress);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when tokenId is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(STARGATE_CONTRACT_ADDRESS_TESTNET);

      await txBuilder.build().should.be.rejectedWith('Token ID is required');
    });

    it('should throw error when validator address is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(STARGATE_CONTRACT_ADDRESS_TESTNET);
      txBuilder.tokenId(tokenId);

      await txBuilder.build().should.be.rejectedWith('Validator address is required');
    });

    it('should throw error when stakingContractAddress is invalid', async function () {
      const txBuilder = createBasicTxBuilder();

      // Invalid address (wrong format)
      should(() => {
        txBuilder.stakingContractAddress('invalid-address');
      }).throw(/Invalid address/);
    });

    it('should build transaction with undefined sender but include it in inputs', async function () {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder.stakingContractAddress(STARGATE_CONTRACT_ADDRESS_TESTNET);
      txBuilder.tokenId(tokenId);
      txBuilder.chainTag(0x27);
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      txBuilder.validator(validatorAddress);
      // Not setting sender

      const tx = await txBuilder.build();
      tx.should.be.instanceof(DelegateClauseTransaction);

      const delegationTx = tx as DelegateClauseTransaction;
      // Verify the transaction has inputs but with undefined address
      delegationTx.inputs.length.should.equal(1);
      should.not.exist(delegationTx.inputs[0].address);

      // Verify the transaction has the correct output
      delegationTx.outputs.length.should.equal(1);
      delegationTx.outputs[0].address.should.equal(STARGATE_CONTRACT_ADDRESS_TESTNET);
    });

    it('should use network default chainTag when not explicitly set', async function () {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder.stakingContractAddress(STARGATE_CONTRACT_ADDRESS_TESTNET);
      txBuilder.tokenId(tokenId);
      // Not setting chainTag
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');
      txBuilder.validator(validatorAddress);

      const tx = await txBuilder.build();
      tx.should.be.instanceof(DelegateClauseTransaction);

      const delegationTx = tx as DelegateClauseTransaction;
      // Verify the chainTag is set to the testnet default (39)
      delegationTx.chainTag.should.equal(39);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const tokenIdForDelegateTxn = '15685';
      const txBuilder = factory.from(testData.DELEGATION_TRANSACTION);
      const tx = txBuilder.transaction as DelegateClauseTransaction;
      const toJson = tx.toJson();
      toJson.id.should.equal('0x841fd66a1d7feff7ab3d432720a659697197e6c67da1aeb9ce9d93b131e46ab7');
      toJson.stakingContractAddress?.should.equal('0x1e02b2953adefec225cf0ec49805b1146a4429c1');
      toJson.nonce.should.equal('0xf341b4c6b5ff5294');
      toJson.gas.should.equal(242796);
      toJson.gasPriceCoef.should.equal(128);
      toJson.expiration.should.equal(400);
      toJson.chainTag.should.equal(39);
      toJson.tokenId?.should.equal(tokenIdForDelegateTxn);
      toJson.validatorAddress?.should.equal('0x00000021cbe0de65ea10f7658effeea70727154a');
    });
  });

  describe('decodeDelegateClauseData', function () {
    it('should correctly decode delegate transaction data with proper address formatting', function () {
      const decodedData = utils.decodeDelegateClauseData(testData.DELEGATE_CLAUSE_DATA);

      decodedData.tokenId.should.equal(testData.DELEGATE_TOKEN_ID);
      decodedData.validator.should.equal(testData.DELEGATE_VALIDATOR);
      decodedData.validator.should.startWith('0x');
      decodedData.validator.should.equal(decodedData.validator.toLowerCase());
    });

    it('should correctly deserialize real signed delegate transaction from raw hex', async function () {
      const txBuilder = factory.from(testData.SIGNED_DELEGATE_RAW_HEX);
      const tx = txBuilder.transaction as DelegateClauseTransaction;
      tx.should.be.instanceof(DelegateClauseTransaction);
      tx.stakingContractAddress.should.equal(testData.SIGNED_DELEGATE_RAW_EXPECTED_STAKING_CONTRACT);
      tx.tokenId.should.equal(testData.SIGNED_DELEGATE_RAW_EXPECTED_TOKEN_ID);
      tx.validator.should.equal(testData.SIGNED_DELEGATE_RAW_EXPECTED_VALIDATOR);
      tx.validator.should.startWith('0x');
      tx.validator.should.equal(tx.validator.toLowerCase());
      should.exist(tx.inputs);
      tx.inputs.length.should.equal(1);

      const decodedData = utils.decodeDelegateClauseData(tx.clauses[0].data);
      decodedData.tokenId.should.equal(testData.SIGNED_DELEGATE_RAW_EXPECTED_TOKEN_ID);
      decodedData.validator.should.equal(testData.SIGNED_DELEGATE_RAW_EXPECTED_VALIDATOR);
    });
  });
});
