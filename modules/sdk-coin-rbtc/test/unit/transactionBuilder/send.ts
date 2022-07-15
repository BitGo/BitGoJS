import should from 'should';
import * as ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import { BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { KeyPair, TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { decodeTransferData } from '@bitgo/sdk-coin-eth';
import { coins } from '@bitgo/statics';

describe('Rbtc send transaction', function () {
  let txBuilder: TransactionBuilder;
  const contractAddress = '0xab52bc0aff1b4851a60c1e5e628b1da995445651';
  const initTxBuilder = (): void => {
    txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.type(TransactionType.Send);
    txBuilder.contract(contractAddress);
  };

  const getOperationHash = function (tx: BaseTransaction): string {
    const { data } = tx.toJson();
    const { tokenContractAddress, expireTime, sequenceId, amount, to } = decodeTransferData(data);
    const operationParams = [
      ['string', 'address', 'uint', 'address', 'uint', 'uint'],
      [
        'RSK-ERC20',
        new ethUtil.BN(ethUtil.stripHexPrefix(to), 16),
        amount,
        new ethUtil.BN(ethUtil.stripHexPrefix(tokenContractAddress || ''), 16),
        expireTime,
        sequenceId,
      ],
    ];
    return EthereumAbi.soliditySHA3(...operationParams);
  };

  const key = testData.KEYPAIR_PRV.getKeys().prv as string;

  it('a send funds transaction', async () => {
    initTxBuilder();
    const recipient = testData.ACCOUNT_2;
    const amount = '1000000000';
    txBuilder.transfer().amount(amount).to(recipient).expirationTime(1590066728).contractSequenceId(5).key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toJson().chainId, 31);

    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
    should.equal(tx.signature.length, 2);
    should.equal(tx.inputs.length, 1);
    should.equal(tx.inputs[0].address, contractAddress);
    should.equal(tx.inputs[0].value, amount);
    should.equal(tx.outputs.length, 1);
    should.equal(tx.outputs[0].address, recipient);
    should.equal(tx.outputs[0].value, amount);
  });

  it('a send funds unsigned transaction with final v', async () => {
    initTxBuilder();
    const recipient = testData.ACCOUNT_2;
    const amount = '1000000000';
    txBuilder.transfer().amount(amount).to(recipient).expirationTime(1590066728).contractSequenceId(5).key(key);
    const tx = await txBuilder.build();
    should.equal(tx.toJson().v, '0x61');
  });

  it('a send funds with amount 0 transaction', async () => {
    initTxBuilder();
    txBuilder.transfer().amount('0').to(testData.ACCOUNT_2).expirationTime(1590066728).contractSequenceId(5).key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });

  it('a send token transaction', async () => {
    const recipient = '0x72c2c8e08bf91d755cd7d26b49a2ee3dc99de1b9';
    const contractAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
    const amount = '100';
    initTxBuilder();
    txBuilder.contract(contractAddress);
    txBuilder
      .transfer()
      .coin('trif')
      .amount(amount)
      .to(recipient)
      .expirationTime(1590066728)
      .contractSequenceId(5)
      .key(key);
    txBuilder.sign({
      key: testData.PRIVATE_KEY_1,
    });
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), testData.SEND_TOKEN_TX_BROADCAST);
    should.equal(tx.signature.length, 2);
    should.equal(tx.inputs.length, 1);
    should.equal(tx.inputs[0].address, contractAddress);
    should.equal(tx.inputs[0].value, amount);
    should.equal(tx.inputs[0].coin, 'trif');

    should.equal(tx.outputs.length, 1);
    should.equal(tx.outputs[0].address, recipient);
    should.equal(tx.outputs[0].value, amount);
    should.equal(tx.outputs[0].coin, 'trif');

    const { signature } = decodeTransferData(tx.toJson().data);
    const operationHash = getOperationHash(tx);

    const { v, r, s } = ethUtil.fromRpcSig(signature);
    const senderPubKey = ethUtil.ecrecover(Buffer.from(operationHash, 'hex'), v, r, s);
    const senderAddress = ethUtil.pubToAddress(senderPubKey);
    const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY_1 });
    ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
  });

  it('a send token transactions from serialized', async () => {
    const txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.from(testData.SEND_TOKEN_TX_BROADCAST);
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), testData.SEND_TOKEN_TX_BROADCAST);

    const { signature } = decodeTransferData(tx.toJson().data);
    const operationHash = getOperationHash(tx);

    const { v, r, s } = ethUtil.fromRpcSig(signature);
    const senderPubKey = ethUtil.ecrecover(Buffer.from(operationHash || ''), v, r, s);
    const senderAddress = ethUtil.pubToAddress(senderPubKey);
    const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY_1 });
    ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
  });
});

describe('should sign and build from serialized', () => {
  it('a send funds transaction from serialized', async () => {
    const txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.from(testData.SEND_TX_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
  });

  it('a send funds transaction with amount 0 from serialized', async () => {
    const txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.from(testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });
});
