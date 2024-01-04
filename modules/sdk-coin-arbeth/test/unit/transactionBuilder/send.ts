import { TransactionType, BaseTransaction } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import EthereumAbi from 'ethereumjs-abi';
import should from 'should';
import * as ethUtil from 'ethereumjs-util';

import { decodeTransferData, KeyPair } from '@bitgo/abstract-eth';
import * as testData from '../../resources';
import { getBuilder } from '../../getBuilder';
import { TransactionBuilder } from '../../../src';

describe('Arbeth transaction builder send', () => {
  describe('should sign and build', () => {
    let txBuilder;
    let key;
    let contractAddress;

    const getOperationHash = function (tx: BaseTransaction): string {
      const { data } = tx.toJson();
      const { tokenContractAddress, expireTime, sequenceId, amount, to } = decodeTransferData(data);
      const operationParams = [
        ['string', 'address', 'uint', 'address', 'uint', 'uint'],
        [
          '421614-ERC20',
          new ethUtil.BN(ethUtil.stripHexPrefix(to), 16),
          amount,
          new ethUtil.BN(ethUtil.stripHexPrefix(tokenContractAddress || ''), 16),
          expireTime,
          sequenceId,
        ],
      ];
      return EthereumAbi.soliditySHA3(...operationParams);
    };

    beforeEach(() => {
      contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      txBuilder = getBuilder('tarbeth') as TransactionBuilder;
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
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
      const tx = await txBuilder.build();

      should.equal(tx.toJson().chainId, 421614);
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
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    });

    it('a send token transaction', async () => {
      const recipient = '0x72c2c8e08bf91d755cd7d26b49a2ee3dc99de1b9';
      const contractAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const amount = '100';
      txBuilder.contract(contractAddress);
      txBuilder
        .transfer()
        .coin('tarbeth:link')
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
      should.equal(tx.inputs[0].coin, 'tarbeth:link');

      should.equal(tx.outputs.length, 1);
      should.equal(tx.outputs[0].address, recipient);
      should.equal(tx.outputs[0].value, amount);
      should.equal(tx.outputs[0].coin, 'tarbeth:link');

      const { signature } = decodeTransferData(tx.toJson().data);
      const operationHash = getOperationHash(tx);

      const { v, r, s } = ethUtil.fromRpcSig(signature);
      const senderPubKey = ethUtil.ecrecover(Buffer.from(operationHash, 'hex'), v, r, s);
      const senderAddress = ethUtil.pubToAddress(senderPubKey);
      const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY_1 });
      ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
    });

    it('a send token transactions from serialized', async () => {
      const txBuilder = new TransactionBuilder(coins.get('tarbeth'));
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
});
