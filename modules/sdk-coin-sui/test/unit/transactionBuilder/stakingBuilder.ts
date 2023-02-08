import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { MoveCallTx, RequestAddDelegation, SuiTransactionType } from '../../../src/lib/iface';
import { KeyPair } from '../../../src';

describe('Sui Staking Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a staking addDelegation tx with one coin', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.sender(testData.STAKING_SENDER_ADDRESS);
      txBuilder.requestAddDelegation(testData.requestAddDelegationTxOneCoin);

      txBuilder.gasBudget(testData.STAKING_GAS_BUDGET);
      txBuilder.gasPayment(testData.stakingGasPayment);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.AddDelegator);
      (tx as SuiTransaction<MoveCallTx>).suiTransaction.gasPayment.should.deepEqual(testData.stakingGasPayment);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.STAKING_SENDER_ADDRESS,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.VALIDATOR_ADDRESS,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.ADD_DELEGATION_TX_ONE_COIN);
    });

    it('should build a staking addDelegation tx with multiple coins', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.sender(testData.STAKING_SENDER_ADDRESS);
      txBuilder.requestAddDelegation(testData.requestAddDelegationTxMultipleCoins);
      txBuilder.gasBudget(testData.STAKING_GAS_BUDGET);
      txBuilder.gasPayment(testData.stakingGasPayment);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.AddDelegator);
      (tx as SuiTransaction<MoveCallTx>).suiTransaction.gasPayment.should.deepEqual(testData.stakingGasPayment);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.STAKING_SENDER_ADDRESS,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.VALIDATOR_ADDRESS,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.ADD_DELEGATION_TX_MUL_COIN);

      const fromRawTx = await factory.from(testData.ADD_DELEGATION_TX_MUL_COIN).build();
      fromRawTx.inputs.should.deepEqual([
        {
          address: testData.STAKING_SENDER_ADDRESS,
          value: testData.STAKING_AMOUNT.toString(),
          coin: 'tsui',
        },
      ]);
      fromRawTx.outputs.should.deepEqual([
        {
          address: testData.VALIDATOR_ADDRESS,
          value: testData.STAKING_AMOUNT.toString(),
          coin: 'tsui',
        },
      ]);
      fromRawTx.toBroadcastFormat().should.equal(testData.ADD_DELEGATION_TX_MUL_COIN);
    });

    it('should submit a AddDelegation transaction', async () => {
      const prvKey = 'ba4c313bcf830b825adaa3ae08cfde86e79e15a84e6fdc3b1fe35a6bb82d9f22';
      const keyPair = new KeyPair({ prv: prvKey });
      const senderAddress = keyPair.getAddress();
      const addDelegation: RequestAddDelegation = {
        coins: [testData.coinToStakeOne],
        amount: 20000000,
        validatorAddress: testData.VALIDATOR_ADDRESS,
      };
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.sender(senderAddress);
      txBuilder.requestAddDelegation(addDelegation);
      txBuilder.gasBudget(testData.STAKING_GAS_BUDGET);
      txBuilder.gasPayment(testData.stakingGasPayment);

      const unsignedTx = await txBuilder.build();
      const signableHex = unsignedTx.signablePayload.toString('hex');
      const serializedTx = unsignedTx.toBroadcastFormat();
      txBuilder.sign({ key: keyPair.getKeys().prv });
      const signedTransaction = await txBuilder.build();
      const serializedTransaction = signedTransaction.toBroadcastFormat();
      const finalSig = (signedTransaction as SuiTransaction<MoveCallTx>).serializedSig;
      const finalSigString = Buffer.from(finalSig).toString('base64');

      const txBuilder2 = factory.from(serializedTx);
      const tx = await txBuilder2.build();
      tx.type.should.equal(TransactionType.AddDelegator);
      const signableHex2 = tx.signablePayload.toString('hex');
      signableHex.should.equal(signableHex2);
      const signable = new Uint8Array(Buffer.from(signableHex2, 'hex'));
      const signaturePayment = keyPair.signMessageinUint8Array(signable);
      txBuilder2.addSignature({ pub: keyPair.getKeys().pub }, Buffer.from(signaturePayment));

      const signedTransaction2 = await txBuilder2.build();
      signedTransaction.id.should.equal(tx.id);
      const finalSig2 = (signedTransaction2 as SuiTransaction<MoveCallTx>).serializedSig;
      const finalSigString2 = Buffer.from(finalSig2).toString('base64');
      finalSigString.should.equal(finalSigString2);
      const serializedTransaction2 = signedTransaction2.toBroadcastFormat();
      serializedTransaction2.should.equal(serializedTransaction);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getStakingBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail on missing gasPayment', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.sender(testData.STAKING_SENDER_ADDRESS);
      txBuilder.requestAddDelegation(testData.requestAddDelegationTxOneCoin);
      txBuilder.gasBudget(testData.STAKING_GAS_BUDGET);
      await txBuilder
        .build()
        .should.rejectedWith('Stake Builder Transaction validation failed: "gasPayment" is required');
    });

    it('should fail on missing gasBudget', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.sender(testData.STAKING_SENDER_ADDRESS);
      txBuilder.requestAddDelegation(testData.requestAddDelegationTxOneCoin);
      txBuilder.gasPayment(testData.stakingGasPayment);
      await txBuilder
        .build()
        .should.rejectedWith('Stake Builder Transaction validation failed: "gasBudget" is required');
    });

    it('should fail on missing sender', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.requestAddDelegation(testData.requestAddDelegationTxOneCoin);
      txBuilder.gasBudget(testData.STAKING_GAS_BUDGET);
      txBuilder.gasPayment(testData.stakingGasPayment);
      await txBuilder.build().should.rejectedWith('Stake Builder Transaction validation failed: "sender" is required');
    });

    it('should fail on missing type', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.sender(testData.STAKING_SENDER_ADDRESS);
      txBuilder.requestAddDelegation(testData.requestAddDelegationTxOneCoin);
      txBuilder.gasBudget(testData.STAKING_GAS_BUDGET);
      txBuilder.gasPayment(testData.stakingGasPayment);
      await txBuilder.build().should.rejectedWith('Stake Builder Transaction validation failed: "type" is required');
    });

    it('should fail on missing tx', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.sender(testData.STAKING_SENDER_ADDRESS);
      txBuilder.gasBudget(testData.STAKING_GAS_BUDGET);
      txBuilder.gasPayment(testData.stakingGasPayment);
      await txBuilder.build().should.rejectedWith('Stake Builder Transaction validation failed: "tx" is required');
    });
  });
});
