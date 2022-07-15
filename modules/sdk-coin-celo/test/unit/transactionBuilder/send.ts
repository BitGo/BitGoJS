import assert from 'assert';
import should from 'should';
import * as ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import { BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';
import { KeyPair, TransactionBuilder } from '../../../src';
import * as testData from '../../resources/celo';
import { decodeTransferData } from '@bitgo/sdk-coin-eth';

describe('Send transaction', function () {
  let txBuilder: TransactionBuilder;
  const initTxBuilder = (): void => {
    txBuilder = getBuilder('tcelo') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.type(TransactionType.Send);
  };
  const key = testData.KEYPAIR_PRV.getKeys().prv as string;

  const getOperationHash = function (tx: BaseTransaction): string {
    const { data } = tx.toJson();
    const { tokenContractAddress, expireTime, sequenceId, amount, to } = decodeTransferData(data);
    const operationParams = [
      ['string', 'address', 'uint', 'address', 'uint', 'uint'],
      [
        'CELO-ERC20',
        new ethUtil.BN(ethUtil.stripHexPrefix(to), 16),
        amount,
        new ethUtil.BN(ethUtil.stripHexPrefix(tokenContractAddress || ''), 16),
        expireTime,
        sequenceId,
      ],
    ];
    return EthereumAbi.soliditySHA3(...operationParams).toString('hex');
  };

  describe('should sign and build', () => {
    it('a send celo transaction', async () => {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const amount = '1000000000';
      initTxBuilder();
      txBuilder.contract(contractAddress);
      txBuilder
        .transfer()
        .coin('tcelo')
        .amount(amount)
        .to(recipient)
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      should.equal(tx.signature.length, 2);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.inputs[0].address, contractAddress);
      should.equal(tx.inputs[0].value, amount);
      should.equal(tx.inputs[0].coin, 'tcelo');

      should.equal(tx.outputs.length, 1);
      should.equal(tx.outputs[0].address, recipient);
      should.equal(tx.outputs[0].value, amount);
      should.equal(tx.outputs[0].coin, 'tcelo');

      const { signature } = decodeTransferData(tx.toJson().data);
      const operationHash = getOperationHash(tx);

      const { v, r, s } = ethUtil.fromRpcSig(signature);
      const senderPubKey = ethUtil.ecrecover(Buffer.from(ethUtil.padToEven(operationHash || ''), 'hex'), v, r, s);
      const senderAddress = ethUtil.pubToAddress(senderPubKey);
      const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY });
      ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
    });

    it('a send token transaction', async () => {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const amount = '1000000000';
      initTxBuilder();
      txBuilder.contract(contractAddress);
      txBuilder
        .transfer()
        .coin('tcusd')
        .amount(amount)
        .to(recipient)
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.SEND_TOKEN_TX_BROADCAST);
      should.equal(tx.signature.length, 2);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.inputs[0].address, contractAddress);
      should.equal(tx.inputs[0].value, amount);
      should.equal(tx.inputs[0].coin, 'tcusd');

      should.equal(tx.outputs.length, 1);
      should.equal(tx.outputs[0].address, recipient);
      should.equal(tx.outputs[0].value, amount);
      should.equal(tx.outputs[0].coin, 'tcusd');

      const { signature } = decodeTransferData(tx.toJson().data);
      const operationHash = getOperationHash(tx);

      const { v, r, s } = ethUtil.fromRpcSig(signature);
      const senderPubKey = ethUtil.ecrecover(Buffer.from(ethUtil.padToEven(operationHash || ''), 'hex'), v, r, s);
      const senderAddress = ethUtil.pubToAddress(senderPubKey);
      const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY });
      ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
    });

    it('a send token transactions from serialized', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.from(testData.SEND_TOKEN_TX_BROADCAST);
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.SEND_TOKEN_TX_BROADCAST);

      const { signature } = decodeTransferData(tx.toJson().data);
      const operationHash = getOperationHash(tx);

      const { v, r, s } = ethUtil.fromRpcSig(signature);
      const senderPubKey = ethUtil.ecrecover(Buffer.from(ethUtil.padToEven(operationHash || ''), 'hex'), v, r, s);
      const senderAddress = ethUtil.pubToAddress(senderPubKey);
      const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY });
      ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
    });

    it('a half signed transaction', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.from(testData.HALF_SIGNED_TX_SEND);
      txBuilder.transfer().key(key);
      const tx = await txBuilder.build();

      const { signature } = decodeTransferData(tx.toJson().data);
      const operationHash = getOperationHash(tx);

      const { v, r, s } = ethUtil.fromRpcSig(signature);
      const senderPubKey = ethUtil.ecrecover(Buffer.from(ethUtil.padToEven(operationHash || ''), 'hex'), v, r, s);
      const senderAddress = ethUtil.pubToAddress(senderPubKey);
      const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY });
      ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
    });
  });

  describe('Should build without sign', () => {
    it('a send token transaction without from', async () => {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const amount = '1000000000';
      initTxBuilder();
      txBuilder.contract(contractAddress);
      txBuilder
        .transfer()
        .coin('tcusd')
        .amount(amount)
        .to(recipient)
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, undefined);
    });

    it('a send token transaction without final v', async () => {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const amount = '1000000000';
      initTxBuilder();
      txBuilder.contract(contractAddress);
      txBuilder
        .transfer()
        .coin('tcusd')
        .amount(amount)
        .to(recipient)
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.v, '0xaef3');
    });
  });

  describe('should fail to build', async () => {
    it('a send token transaction without fee', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.type(TransactionType.Send);
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a send token transaction without transfer information', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
      await txBuilder.build().should.be.rejectedWith('Missing transfer information');
    });

    it('a send token transaction without nonce', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.counter(1);
      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
    });

    it('a send token transaction with wrong transaction type', async () => {
      initTxBuilder();
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.contract('0x8f977e912ef500548a0c3be6ddde9899f1199b81');
      assert.throws(() => {
        txBuilder.transfer();
      }, 'Error: Token transfers can only be set for send token transactions');
    });

    it('a send token transaction without token information', async () => {
      const txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.counter(1);
      txBuilder.contract(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
      await txBuilder.build().should.be.rejectedWith('Missing transfer information');
    });
  });
});
