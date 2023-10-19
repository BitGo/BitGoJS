import { TransactionType } from '@bitgo/sdk-core';
import { coins, EthereumNetwork } from '@bitgo/statics';
import assert from 'assert';
import should from 'should';
import { decodeTransferData, getCommon, Transaction, TransactionBuilder, TransferBuilder } from '../../../src';
import * as testData from '../../resources/eth';
import { getBuilder } from '../getBuilder';

describe('Eth transaction builder send', () => {
  it('should validate a send type transaction', () => {
    const txBuilder = getBuilder('teth') as TransactionBuilder;
    const coinConfig = coins.get('eth');
    const common = getCommon(coinConfig.network as EthereumNetwork);
    const tx = new Transaction(coinConfig, common);
    txBuilder.counter(1);
    txBuilder.type(TransactionType.Send);
    assert.throws(() => txBuilder.validateTransaction(tx), /Invalid transaction: missing fee/);
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    assert.throws(() => txBuilder.validateTransaction(tx), /Invalid transaction: missing contract address/);
    assert.throws(() => txBuilder.validateTransaction(tx), /Invalid transaction: missing contract address/);
  });

  describe('should sign and build', () => {
    let txBuilder;
    let key;
    let contractAddress;

    beforeEach(() => {
      contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      txBuilder = getBuilder('teth') as TransactionBuilder;
      key = testData.KEYPAIR_PRV.getKeys().prv as string;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract(contractAddress);
    });

    it('a send funds transaction', async () => {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';
      const expireTime = 1590066728;
      const sequenceId = 5;
      txBuilder
        .transfer()
        .amount(amount)
        .to(recipient)
        .expirationTime(expireTime)
        .contractSequenceId(sequenceId)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();

      should.equal(tx.toJson().chainId, 42);
      should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST_LEGACY);
      should.equal(tx.signature.length, 2);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.inputs[0].address, contractAddress);
      should.equal(tx.inputs[0].value, amount);

      should.equal(tx.outputs.length, 1);
      should.equal(tx.outputs[0].address, recipient);
      should.equal(tx.outputs[0].value, amount);

      const data = tx.toJson().data;
      const {
        to,
        amount: parsedAmount,
        expireTime: parsedExpireTime,
        sequenceId: parsedSequenceId,
      } = decodeTransferData(data);
      should.equal(to, recipient);
      should.equal(parsedAmount, amount);
      should.equal(parsedExpireTime, expireTime);
      should.equal(parsedSequenceId, sequenceId);
    });

    it('a send funds with amount 0 transaction', async () => {
      txBuilder
        .transfer()
        .amount('0')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    });

    it('Goerli chain id should be correct', async () => {
      const txBuilder = getBuilder('gteth') as TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract(contractAddress);
      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .amount('0')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      should.equal(tx.toJson().chainId, 5);
    });

    it('Holesky chain id should be correct', async () => {
      const txBuilder = getBuilder('hteth') as TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract(contractAddress);
      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .amount('0')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      should.equal(tx.toJson().chainId, 17000);
    });
  });

  describe('sign and build from serialized', () => {
    {
      const testParams = [
        ['Legacy', testData.SEND_TX_BROADCAST_LEGACY],
        ['EIP1559', testData.SEND_TX_BROADCAST_EIP1559],
      ];

      testParams.map(([txnType, txnHex]) => {
        it(`should be able to create a send transaction from serialized ${txnType} tx hex`, async () => {
          const txBuilder = getBuilder('teth') as TransactionBuilder;
          txBuilder.from(txnHex);
          const signedTx = await txBuilder.build();
          should.equal(signedTx.toBroadcastFormat(), txnHex);
        });
      });
    }

    it('a send funds transaction with amount 0 from serialized', async () => {
      const txBuilder = getBuilder('teth') as TransactionBuilder;
      txBuilder.from(testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
      const signedTx = await txBuilder.build();
      should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    });
  });
});
