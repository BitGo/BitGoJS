import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction, DelegateClauseTransaction } from '../../src/lib';
import should from 'should';
import { DELEGATE_CLAUSE_METHOD_ID, STARGATE_DELEGATION_ADDRESS_TESTNET } from '../../src/lib/constants';
import EthereumAbi from 'ethereumjs-abi';
import * as testData from '../resources/vet';

describe('VET Delegation Transaction', function () {
  const factory = new TransactionBuilderFactory(coins.get('tvet'));
  const tokenId = 100201; // Test level ID
  const delegateForever = true; // Test delegateForever flag

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
    txBuilder.stakingContractAddress(STARGATE_DELEGATION_ADDRESS_TESTNET);
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
    tx.should.be.instanceof(DelegateClauseTransaction);

    const delegationTx = tx as DelegateClauseTransaction;
    delegationTx.stakingContractAddress.should.equal(STARGATE_DELEGATION_ADDRESS_TESTNET);
    delegationTx.tokenId.should.equal(tokenId);
    delegationTx.delegateForever.should.equal(delegateForever);

    // Verify clauses
    delegationTx.clauses.length.should.equal(1);
    should.exist(delegationTx.clauses[0].to);
    delegationTx.clauses[0].to?.should.equal(STARGATE_DELEGATION_ADDRESS_TESTNET);

    // Verify transaction data is correctly encoded using ethereumABI
    should.exist(delegationTx.clauses[0].data);
    const txData = delegationTx.clauses[0].data;
    txData.should.startWith(DELEGATE_CLAUSE_METHOD_ID);

    // Verify the encoded data matches what we expect from ethereumABI
    const methodName = 'delegate';
    const types = ['uint256', 'bool'];
    const params = [tokenId, delegateForever];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);
    const expectedData = '0x' + Buffer.concat([method, args]).toString('hex');

    txData.should.equal(expectedData);

    // Verify recipients
    delegationTx.recipients.length.should.equal(1);
    delegationTx.recipients[0].address.should.equal(STARGATE_DELEGATION_ADDRESS_TESTNET);
  });

  describe('Failure scenarios', function () {
    it('should throw error when stakingContractAddress is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.tokenId(tokenId);

      await txBuilder.build().should.be.rejectedWith('Staking contract address is required');
    });

    it('should throw error when tokenId is missing', async function () {
      const txBuilder = createBasicTxBuilder();
      txBuilder.stakingContractAddress(STARGATE_DELEGATION_ADDRESS_TESTNET);

      await txBuilder.build().should.be.rejectedWith('Token ID is required');
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
      txBuilder.stakingContractAddress(STARGATE_DELEGATION_ADDRESS_TESTNET);
      txBuilder.tokenId(tokenId);
      txBuilder.chainTag(0x27);
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      // Not setting sender

      const tx = await txBuilder.build();
      tx.should.be.instanceof(DelegateClauseTransaction);

      const delegationTx = tx as DelegateClauseTransaction;
      // Verify the transaction has inputs but with undefined address
      delegationTx.inputs.length.should.equal(1);
      should.not.exist(delegationTx.inputs[0].address);

      // Verify the transaction has the correct output
      delegationTx.outputs.length.should.equal(1);
      delegationTx.outputs[0].address.should.equal(STARGATE_DELEGATION_ADDRESS_TESTNET);
    });

    it('should use network default chainTag when not explicitly set', async function () {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder.stakingContractAddress(STARGATE_DELEGATION_ADDRESS_TESTNET);
      txBuilder.tokenId(tokenId);
      // Not setting chainTag
      txBuilder.blockRef('0x0000000000000000');
      txBuilder.expiration(64);
      txBuilder.gas(100000);
      txBuilder.gasPriceCoef(0);
      txBuilder.nonce('12345');
      txBuilder.sender('0x9378c12BD7502A11F770a5C1F223c959B2805dA9');

      const tx = await txBuilder.build();
      tx.should.be.instanceof(DelegateClauseTransaction);

      const delegationTx = tx as DelegateClauseTransaction;
      // Verify the chainTag is set to the testnet default (39)
      delegationTx.chainTag.should.equal(39);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.DELEGATION_TRANSACTION);
      const tx = txBuilder.transaction as DelegateClauseTransaction;
      const toJson = tx.toJson();
      toJson.id.should.equal('0x4d41f712736a528e85cf8cefaee61f7842a6ddd5f20977b8d97182391dee6f42');
      toJson.stakingContractAddress?.should.equal('0x7240e3bc0d26431512d5b67dbd26d199205bffe8');
      toJson.nonce.should.equal('438023');
      toJson.gas.should.equal(58426);
      toJson.gasPriceCoef.should.equal(128);
      toJson.expiration.should.equal(64);
      toJson.chainTag.should.equal(39);
      // in delegate txn, nftTokenId indicates the tokenId
      toJson.nftTokenId?.should.equal(tokenId);
      toJson.autorenew?.should.equal(true);
    });
  });
});
