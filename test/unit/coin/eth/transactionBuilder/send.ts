import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { getBuilder, Eth } from '../../../../../src';
import * as testData from '../../../../resources/eth/eth';

describe('Eth transaction builder send', () => {
  it('should validate a send type transaction', () => {
    const txBuilder = getBuilder('eth') as Eth.TransactionBuilder;
    const tx = new Eth.Transaction(coins.get('eth'));
    txBuilder.counter(1);
    txBuilder.type(TransactionType.Send);
    should.throws(() => txBuilder.validateTransaction(tx), 'Invalid transaction: missing fee');
    txBuilder.fee({
      fee: '10',
      gasLimit: '1000',
    });
    should.throws(() => txBuilder.validateTransaction(tx), 'Invalid transaction: missing chain id');
    txBuilder.chainId(31);
    should.throws(() => txBuilder.validateTransaction(tx), 'Invalid transaction: missing source');
    txBuilder.source(testData.KEYPAIR_PRV.getAddress());
    should.throws(() => txBuilder.validateTransaction(tx), 'Invalid transaction: missing contract address');
  });

  describe('should sign and build', () => {
    let txBuilder;
    let key;
    beforeEach(() => {
      txBuilder = getBuilder('cgld') as Eth.TransactionBuilder;
      key = testData.KEYPAIR_PRV.getKeys().prv as string;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.chainId(42);
      txBuilder.source(testData.KEYPAIR_PRV.getAddress());
      txBuilder.counter(2);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract('0x8f977e912ef500548a0c3be6ddde9899f1199b81');
    });

    it('a send funds transaction', async () => {
      txBuilder
        .transfer()
        .amount('1000000000')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
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
  });

  describe('should sign and build from serialized', () => {
    it('a send funds transaction from serialized', async () => {
      const txBuilder = getBuilder('cgld') as Eth.TransactionBuilder;
      txBuilder.from(testData.SEND_TX_BROADCAST);
      const signedTx = await txBuilder.build();
      should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
    });

    it('a send funds transaction with amount 0 from serialized', async () => {
      const txBuilder = getBuilder('cgld') as Eth.TransactionBuilder;
      txBuilder.from(testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
      const signedTx = await txBuilder.build();
      should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    });
  });
});
