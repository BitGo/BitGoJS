import should from 'should';
import { TransactionType } from '../../../../../src/coin/baseCoin/';
import { getBuilder, Cgld } from '../../../../../src';
import * as testData from '../../../../resources/cgld/cgld';

describe('Celo Transaction builder for wallet initialization', () => {
  let txBuilder: Cgld.TransactionBuilder;
  const initTxBuilder = (): void => {
    txBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.chainId(44786);
    txBuilder.source(testData.KEYPAIR_PRV.getAddress());
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
      const tx = await txBuilder.build(); //should build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('12100000');
      txJson.gasPrice.should.equal('1000000000');
      should.equal(txJson.nonce, 2);
      should.equal(txJson.chainId, 44786);
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
      should.equal(txJson.chainId, 44786);
      should.equal(txJson.from, testData.KEYPAIR_PRV.getAddress());
    });

    it('an init transaction from an unsigned serialized one', async () => {
      initTxBuilder();
      txBuilder.source(testData.KEYPAIR_PRV.getAddress());
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
      newTxBuilder.from(serialized);
      newTxBuilder.source(testData.KEYPAIR_PRV.getAddress());
      newTxBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
      const signedTx = await newTxBuilder.build();
      should.equal(signedTx.toBroadcastFormat(), testData.TX_BROADCAST);
    });

    it('a signed init transaction from serialized', async () => {
      const newTxBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
      newTxBuilder.from(testData.TX_BROADCAST);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), testData.TX_BROADCAST);
    });

    it('correct transaction id', async () => {
      const newTxBuilder = getBuilder('cgld') as Cgld.TransactionBuilder;
      newTxBuilder.from(testData.TEST_WALLET_CREATION);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toJson().id, '0x9575af450d92763ea7c44e4a3930b2de4ec27bea3d81487dc6820ee4be042f58');
    });
  });

  describe('Should validate ', () => {
    it('a raw transaction', async () => {
      const builder = getBuilder('cgld') as Cgld.TransactionBuilder;
      should.doesNotThrow(() => builder.from(testData.TX_BROADCAST));
      should.doesNotThrow(() => builder.from(testData.TX_JSON));
      should.throws(() => builder.from('0x00001000'), 'There was error in decoding the hex string');
      should.throws(() => builder.from(''), 'There was error in decoding the hex string');
      should.throws(() => builder.from('pqrs'), 'There was error in parsing the JSON string');
      should.throws(() => builder.from(1234), 'Transaction is not a hex string or stringified json');
    });
  });
});
