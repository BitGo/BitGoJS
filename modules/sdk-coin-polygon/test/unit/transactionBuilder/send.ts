import { TransactionType, BaseTransaction } from '@bitgo/sdk-core';
import * as ethUtil from 'ethereumjs-util';
import should from 'should';
import { decodeTransferData } from '@bitgo/abstract-eth';
import { getBuilder } from '../../getBuilder';
import { TransactionBuilder, KeyPair } from '../../../src';
import * as testData from '../../resources';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';

describe('Polygon transaction builder send', () => {
  describe('should sign and build', () => {
    let txBuilder;
    let key;
    let contractAddress;

    const getOperationHash = function (tx: BaseTransaction): string {
      const { data } = tx.toJson();
      const { expireTime, sequenceId, amount, to, data: internalData } = decodeTransferData(data);
      const txData = internalData ? ethUtil.padToEven(ethUtil.stripHexPrefix(internalData)) : '';
      const operationParams = [
        ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
        ['POLYGON', to, amount, Buffer.from(txData, 'hex'), expireTime, sequenceId],
      ];
      const types: string[] = operationParams[0] as string[];
      const values: (string | number)[] = operationParams[1].map((item) =>
        item instanceof Buffer ? '0x' + item.toString('hex') : item
      );
      return keccak256(defaultAbiCoder.encode(types, values));
    };

    beforeEach(() => {
      contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      txBuilder = getBuilder('tpolygon') as TransactionBuilder;
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
      should.equal(tx.toJson().chainId, 80002);
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
        signature,
      } = decodeTransferData(data);

      should.equal(to, recipient);
      should.equal(parsedAmount, amount);
      should.equal(parsedExpireTime, expireTime);
      should.equal(parsedSequenceId, sequenceId);
      const operationHash = getOperationHash(tx);
      const { v, r, s } = ethUtil.fromRpcSig(signature);
      const senderPubKey = ethUtil.ecrecover(Buffer.from(ethUtil.stripHexPrefix(operationHash), 'hex'), v, r, s);
      const senderAddress = ethUtil.pubToAddress(senderPubKey);
      const senderKey = new KeyPair({ prv: testData.PRIVATE_KEY_1 });
      ethUtil.bufferToHex(senderAddress).should.equal(senderKey.getAddress());
    });
  });
});
