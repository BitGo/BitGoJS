import assert from 'assert';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources/celo';

describe('Celo Transaction builder for wallet initialization', () => {
  let txBuilder: TransactionBuilder;
  const initTxBuilder = (): void => {
    txBuilder = getBuilder('tcelo') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.type(TransactionType.WalletInitialization);
    txBuilder.owner(testData.KEYPAIR_PRV.getAddress());
    txBuilder.owner('0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB');
    txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
  };

  describe('should build ', () => {
    it('an init transaction', async () => {
      initTxBuilder();
      txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
      const tx = await txBuilder.build(); // should build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('12100000');
      txJson.gasPrice.should.equal('1000000000');
      should.equal(txJson.nonce, 2);
      should.equal(txJson.chainId, 44787);
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
      should.equal(txJson.from, testData.KEYPAIR_PRV.getAddress());
    });

    it('an init transaction with nonce 0', async () => {
      initTxBuilder();
      txBuilder.counter(0);
      txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
      const tx = await txBuilder.build(); // should build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('12100000');
      txJson.gasPrice.should.equal('1000000000');
      should.equal(txJson.nonce, 0);
      should.equal(txJson.chainId, 44787);
      should.equal(txJson.from, testData.KEYPAIR_PRV.getAddress());
    });

    it('unsigned transaction without final v', async () => {
      initTxBuilder();
      txBuilder.counter(0);
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('12100000');
      txJson.gasPrice.should.equal('1000000000');
      should.equal(txJson.nonce, 0);
      should.equal(txJson.chainId, 44787);
      // Celo has disable final v and it has chain id as v value.
      should.equal(txJson.v, 44787);
    });

    it('an init transaction from an unsigned serialized one', async () => {
      initTxBuilder();
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder = getBuilder('tcelo') as TransactionBuilder;
      newTxBuilder.from(serialized);
      newTxBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
      const signedTx = await newTxBuilder.build();
      should.equal(signedTx.toJson().chainId, 44787);
      should.equal(signedTx.toBroadcastFormat(), testData.TX_BROADCAST);
    });

    it('a signed init transaction from serialized', async () => {
      const newTxBuilder = getBuilder('tcelo') as TransactionBuilder;
      newTxBuilder.from(testData.TX_BROADCAST);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), testData.TX_BROADCAST);
    });

    it('a signed init transaction from serialized with tough signature validation', async () => {
      const newTxBuilder = getBuilder('tcelo') as TransactionBuilder;
      newTxBuilder.from(testData.WALLET_CREATION_TX_CHECK_SIGNATURE_VALIDATION);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), testData.WALLET_CREATION_TX_CHECK_SIGNATURE_VALIDATION);
    });

    it('correct transaction id', async () => {
      const newTxBuilder = getBuilder('tcelo') as TransactionBuilder;
      newTxBuilder.from(testData.TEST_WALLET_CREATION);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toJson().id, '0xc35ef12951bad60c37453a8bbabd50765c5426f4568e4afa3cbcd00b1505a946');
    });
  });

  describe('Should validate ', () => {
    it('a raw transaction', async () => {
      const builder = getBuilder('tcelo') as TransactionBuilder;
      should.doesNotThrow(() => builder.from(testData.TX_BROADCAST));
      should.doesNotThrow(() => builder.from(testData.TX_JSON));
      assert.throws(() => builder.from('0x00001000'), /There was error in decoding the hex string/);
      assert.throws(() => builder.from(''), /Raw transaction is empty/);
      assert.throws(() => builder.from('pqrs'), /There was error in parsing the JSON string/);
      assert.throws(() => builder.from(1234), /Transaction is not a hex string or stringified json/);
    });
  });
});
