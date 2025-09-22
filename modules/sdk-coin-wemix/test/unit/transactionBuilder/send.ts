import { getBuilder } from '../getBuilder';
import should from 'should';
import { TransactionBuilder } from '../../../src';
import { TransactionType } from '@bitgo-beta/sdk-core';
import { decodeTransferData } from '@bitgo-beta/abstract-eth';
import * as testData from '../../resources';

describe('Wemix Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('twemix');
      const txHex =
        '0xf86e0285174876e801825208944943dd2a2494e3ea5937954cb836692a047695b5880de0b6b3a7640000808208d3a04fd04df347f4614bae15e905e7b0af63a25f7e5b7fef00bb08854dd52c785838a01736ac3e8c5a7bf58040869277fe1904568d96bba4fb29b6f9709d95d93f880b';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });

  describe('should sign and build', () => {
    let txBuilder;
    let key;
    let contractAddress;

    beforeEach(() => {
      contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      txBuilder = getBuilder('twemix') as TransactionBuilder;
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
      const expireTime = 1590066600;
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

      should.equal(tx.toJson().chainId, 0x458);
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
        .expirationTime(1590066600)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    });
  });
});
