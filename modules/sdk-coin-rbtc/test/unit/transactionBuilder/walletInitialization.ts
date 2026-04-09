import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';

describe('Rbtc wallet initialization', function () {
  let txBuilder: TransactionBuilder;
  const initTxBuilder = (): void => {
    txBuilder = new TransactionBuilder(coins.get('trbtc'));
    txBuilder.fee({
      fee: '100000000',
      gasLimit: '6800000',
    });
    txBuilder.counter(1);
    txBuilder.type(TransactionType.WalletInitialization);
  };

  describe('should build', () => {
    it('an init transaction', async () => {
      initTxBuilder();
      txBuilder.owner('0xa43f0BDd451E39C7AF20426f43589DEFAd4335E6');
      txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
      txBuilder.owner('0xc37825D368eC3F50a1505542d8fFB25f7b6288f2');
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
      const tx = await txBuilder.build();

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('6800000');
      txJson.gasPrice.should.equal('100000000');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 31);
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
    });

    it('a signed init transaction from serialized', async () => {
      const newTxBuilder = new TransactionBuilder(coins.get('trbtc'));
      newTxBuilder.from(testData.TX_BROADCAST);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), testData.TX_BROADCAST);
      should.equal(newTx.id, '0x5f6e46eff8e9d61a0b2fc6e798a7ed6c6ceb08b60af2b6b06df461d6cb4aa927');
      const txJson = newTx.toJson();
      should.exist(txJson.v);
      should.exist(txJson.r);
      should.exist(txJson.s);
      should.exist(txJson.from);
    });

    it('a wallet initialization transaction with nonce 0', async () => {
      initTxBuilder();
      txBuilder.counter(0);
      txBuilder.owner('0xa43f0BDd451E39C7AF20426f43589DEFAd4335E6');
      txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
      txBuilder.owner('0xc37825D368eC3F50a1505542d8fFB25f7b6288f2');
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
      const tx = await txBuilder.build();

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('6800000');
      txJson.gasPrice.should.equal('100000000');
      should.equal(txJson.nonce, 0);
      should.equal(txJson.chainId, 31);
    });

    it('an unsigned init transaction from serialized with 0-prefixed address', async () => {
      initTxBuilder();
      txBuilder.owner('0x6461EC4E9dB87CFE2aeEc7d9b02Aa264edFbf41f');
      txBuilder.owner('0xf10C8f42BD63D0AeD3338A6B2b661BC6D9fa7C44');
      txBuilder.owner('0x07ee8b845b8bf0e807e096d6b1599b121b82cbe1');
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      const newTxBuilder = new TransactionBuilder(coins.get('trbtc'));
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
    });

    it('an unsigned init transaction from serialized', async () => {
      initTxBuilder();
      txBuilder.owner('0x6461EC4E9dB87CFE2aeEc7d9b02Aa264edFbf41f');
      txBuilder.owner('0xf10C8f42BD63D0AeD3338A6B2b661BC6D9fa7C44');
      txBuilder.owner('0xa4b5666FB4fFEA84Dd848845E1114b84146de4b3');
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      const newTxBuilder = new TransactionBuilder(coins.get('trbtc'));
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
      should.equal(newTx.toJson().v, '0x61');
    });

    it('unsigned transaction with final v check', async function () {
      initTxBuilder();
      txBuilder.owner('0x6461EC4E9dB87CFE2aeEc7d9b02Aa264edFbf41f');
      txBuilder.owner('0xf10C8f42BD63D0AeD3338A6B2b661BC6D9fa7C44');
      txBuilder.owner('0xa4b5666FB4fFEA84Dd848845E1114b84146de4b3');
      const tx = await txBuilder.build();
      should.deepEqual(tx.toJson().v, '0x61');
    });
  });
});
