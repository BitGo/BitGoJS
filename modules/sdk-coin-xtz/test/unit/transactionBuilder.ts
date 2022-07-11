import assert from 'assert';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import * as testData from '../resources';
import { XtzLib } from '../../src';

describe('Tezos Transaction builder', function () {
  const defaultKeyPair = new XtzLib.KeyPair({
    prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
  });

  describe('should parse', () => {
    it('an unsigned init transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.from(testData.unsignedSerializedOriginationTransaction);
      const tx = await txBuilder.build();
      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.WalletInitialization);
      tx.source.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs[0].address.should.equal('');
      tx.outputs[0].value.should.equal('1000000');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(0);
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
      tx.owners.length.should.equal(3);
      tx.owners[0].should.equal('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      tx.owners[1].should.equal('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      tx.owners[2].should.equal('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
    });
  });

  describe('should build', () => {
    it('an init transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({ fee: '10' });
      const source = {
        pub: 'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
      };
      const sourceKeyPair = new XtzLib.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.initialBalance('1000000');
      txBuilder.counter('0');
      txBuilder.owner(
        new XtzLib.KeyPair({ pub: 'sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b' }).getKeys().pub
      );
      txBuilder.owner(
        new XtzLib.KeyPair({ pub: 'sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F' }).getKeys().pub
      );
      txBuilder.owner(
        new XtzLib.KeyPair({ pub: 'sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf' }).getKeys().pub
      );
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      const tx = await txBuilder.build();

      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.WalletInitialization);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1000010');
      tx.outputs[0].address.should.equal('');
      tx.outputs[0].value.should.equal('1000000');
      tx.signature.length.should.equal(0);
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
      tx.owners.length.should.equal(3);
      tx.owners[0].should.equal('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      tx.owners[1].should.equal('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      tx.owners[2].should.equal('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
    });

    it('an account reveal transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AccountUpdate);
      txBuilder.fee({ fee: '10' });
      const source = {
        pub: 'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
      };
      const keyPair = new XtzLib.KeyPair(source);
      txBuilder.source(keyPair.getAddress());
      txBuilder.publicKeyToReveal(keyPair.getExtendedKeys().xpub);
      txBuilder.counter('0');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      const tx = await txBuilder.build();

      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.AccountUpdate);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 0);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1420');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(0);
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
      tx.owners.length.should.equal(0);
    });

    it('a forwarder contract init transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AddressInitialization);
      const forwarderDestination = 'KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8';
      txBuilder.forwarderDestination(forwarderDestination);
      txBuilder.fee({ fee: '10' });
      const source = {
        pub: 'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
      };
      const keyPair = new XtzLib.KeyPair(source);
      txBuilder.source(keyPair.getAddress());
      txBuilder.publicKeyToReveal(keyPair.getExtendedKeys().xpub);
      txBuilder.counter('0');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.AddressInitialization);
      tx.source.should.equal(keyPair.getAddress());
      tx.publicKeyToReveal.should.equal(keyPair.getKeys().pub);
      tx.forwarderDestination.should.equal(forwarderDestination);
      tx.owners.length.should.equal(0);
    });
  });

  describe('should sign', () => {
    it('an init transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '4764',
        gasLimit: '33971',
        storageLimit: '1292',
      });
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.initialBalance('1000000');
      txBuilder.counter('0');
      txBuilder.owner('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      txBuilder.owner('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('opNfjjEfWk7HsnY8fQrUoPFuXZfABweubA6D4bVScmqoVzcZVFA');
      tx.type.should.equal(TransactionType.WalletInitialization);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs[0].address.should.equal('KT1J9LfhDV6FQxR7aMaK7R6Rw8mBpfhP5MA3');
      tx.outputs[0].value.should.equal('1000000');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigVD57haAMCobHrCwH9ABfbFvdmyR9ZspZC3Zihb9tEPfhtzCKS1F8fLoVpodvor3PUoo7ry4j46xYETEzELmtnrNTaTPX4'
      );
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
      tx.owners.length.should.equal(3);
      tx.owners[0].should.equal('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      tx.owners[1].should.equal('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      tx.owners[2].should.equal('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
    });

    it('a wallet init transaction with delegation and reveal the source', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '4764',
        gasLimit: '33971',
        storageLimit: '1292',
      });
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.publicKeyToReveal(defaultKeyPair.getKeys().pub);
      txBuilder.initialBalance('1000000');
      txBuilder.counter('0');
      txBuilder.owner('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      txBuilder.owner('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
      txBuilder.initialDelegate('tz1KpbK5v1NB2vg3JHBxXJZhyQ7ur83Xp7iC');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oo9rzcHZcGBBKtUfe3aL82isMf8SscBsLE7PBmBQXA2EKGT9yz7');
      tx.type.should.equal(TransactionType.WalletInitialization);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 2);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1420');
      tx.inputs[1].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[1].value.should.equal('1004764');
      tx.outputs[0].address.should.equal('KT1JQQUXLfoxL6ifTz2SyQK7ZEAvF1m7KXgC');
      tx.outputs[0].value.should.equal('1000000');
      tx.delegate.should.equal('tz1KpbK5v1NB2vg3JHBxXJZhyQ7ur83Xp7iC');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigUyznaJo4JdLuyS7wpP5fDe12cUutDiABEYHHMEpaNYY6TQstAfvLJPQTcFWJJ2QRMZxC46nUvKEdaBJfPN5dzCGMQDtXn'
      );
      const indexesByTransactionType = tx.getIndexesByTransactionType();
      Object.keys(indexesByTransactionType).length.should.equal(2);
      indexesByTransactionType.reveal.length.should.equal(1);
      indexesByTransactionType.reveal[0].should.equal(0);
      indexesByTransactionType.origination.length.should.equal(1);
      indexesByTransactionType.origination[0].should.equal(1);
      tx.owners.length.should.equal(3);
      tx.owners[0].should.equal('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      tx.owners[1].should.equal('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      tx.owners[2].should.equal('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
    });

    it('a reveal transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AccountUpdate);
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.publicKeyToReveal(defaultKeyPair.getKeys().pub);
      txBuilder.counter('0');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oomXs6PuWtmGwMKoXTNsu9XJHnGXtuRujcHMeYS9y37Xj6sXPHb');
      tx.type.should.equal(TransactionType.AccountUpdate);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 0);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1420');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigQyYsfhtrJBKZuJSEizDdxoejNVvJWRZPDMWdpXVvdTVix37HzURwXfXsi9METnRzskvjgsBSgiF4pr7RVxzWLuixxJL8U'
      );
      const indexesByTransactionType = tx.getIndexesByTransactionType();
      indexesByTransactionType.reveal.length.should.equal(1);
      indexesByTransactionType.reveal[0].should.equal(0);
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
      tx.owners.length.should.equal(0);
    });

    it('a multisig send transaction to an implicit account', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter('0');
      txBuilder
        .transfer('1000000')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .gasLimit('33971')
        .storageLimit('1292')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b'
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(16) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oo8haKjuiZfjLJmpWgKDVF1kKbb2uEtygFyrSVzgoZNkc3nUMDd');
      tx.type.should.equal(TransactionType.Send);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 2);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('4764');
      tx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[1].value.should.equal('1000000');
      tx.outputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.outputs[0].value.should.equal('1000000');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigQLHLzWLNBWYDGfRcA36ZaMkapKJRKSjDB2WrDsou9FZLoz4Kp1ucW9AG7mey9wjAiNfRfCFrBV9yKsU8UZ4sEL21V7vWY'
      );
      tx.toBroadcastFormat().should.equal(
        'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500b389028c0a000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e00000125070707070000050502000000430320053d036d0743035d0100000024747a3156526a5270564b6e76313641567072464831746b446e3454446656714138393341031e0743036a0080897a034f034d031b02000000d0050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b665236797270705905090100000060736967596656594a5561694b4b5a58347a737a575a3752463239326e56325036584d346e4b656b325967575138424c533172323275346139534376474d63623839426a546674546e327667557a435451475332634a4e766259747547516a4750030611ebda30dd150324737391705886840bfb99f8f51d6586b27408e84df93ce0f45dc6e8e6df000e602da19c3509190b37e7df7b11d552ccbc46e3dd34c05f3bf8'
      );
      const indexesByTransactionType = tx.getIndexesByTransactionType();
      Object.keys(indexesByTransactionType).length.should.equal(1);
      indexesByTransactionType.transaction.length.should.equal(1);
      indexesByTransactionType.transaction[0].should.equal(0);
      tx.owners.length.should.equal(0);
    });

    it('a send transaction to an originated account (other contract)', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter('0');
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .gasLimit('33971')
        .storageLimit('1292')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b'
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(16) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oobTNo72du9BFYfyZTo64kTXVhBfHNuJaJQXuNGVr6gYCDpYjDQ');
      tx.type.should.equal(TransactionType.Send);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 2);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('4764');
      tx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[1].value.should.equal('100');
      tx.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
      tx.outputs[0].value.should.equal('100');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigcM3xiQ9GN9tPXsVkckPHk66kAHDRMag6XCbHLWvMLPqH9KHgzAFepci2x53kcJGqVhFXaUSE3DhRCGdgj8ahkkWgiYZur'
      );
      tx.toBroadcastFormat().should.equal(
        'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500b389028c0a000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000001400707070700000505020000005e0320053d036d0743036e01000000244b543148557274366b66765979444559434a3247536a7654505a364b6d5266784c4255380555036c0200000015072f02000000090200000004034f032702000000000743036a00a401034f034d031b02000000d0050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b665236797270705905090100000060736967596656594a5561694b4b5a58347a737a575a3752463239326e56325036584d346e4b656b325967575138424c533172323275346139534376474d63623839426a546674546e327667557a435451475332634a4e766259747547516a475003066dbeee80de45847aeeb04f17dbb2e0774ae6942817d31e744c7e7772925c5f510b18523dafe54603c8753141f3e0989678f2252deb3bdaef93d6befa94399240'
      );
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
      tx.owners.length.should.equal(0);
    });

    it('a send transaction to multiple destinations', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.counter('0');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .counter('1')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b'
        );
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .counter('2')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b'
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(16) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('onyGaWs6z4bVVcfn3h9KbBrktEhuDyJLYEVB4aJRM6YNngjDxE4');
      tx.type.should.equal(TransactionType.Send);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 4);
      should.equal(tx.outputs.length, 2);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('4764');
      tx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[1].value.should.equal('100');
      tx.inputs[2].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[2].value.should.equal('4764');
      tx.inputs[3].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[3].value.should.equal('100');
      tx.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
      tx.outputs[0].value.should.equal('100');
      tx.outputs[1].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.outputs[1].value.should.equal('100');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigdUpzCxmi9NWhdbFGfvqVyH8Xfr2UiPc2fkqNrQ4CHvrk19ZDksDksEc4DJsTbphenV8jCNZFqzL4sCVRzM93HnSSqgJz7'
      );
      tx.toBroadcastFormat().should.equal(
        'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000001400707070700010505020000005e0320053d036d0743036e01000000244b543148557274366b66765979444559434a3247536a7654505a364b6d5266784c4255380555036c0200000015072f02000000090200000004034f032702000000000743036a00a401034f034d031b02000000d0050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b665236797270705905090100000060736967596656594a5561694b4b5a58347a737a575a3752463239326e56325036584d346e4b656b325967575138424c533172323275346139534376474d63623839426a546674546e327667557a435451475332634a4e766259747547516a475003066c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2501e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e00000124070707070002050502000000420320053d036d0743035d0100000024747a3156526a5270564b6e76313641567072464831746b446e3454446656714138393341031e0743036a00a401034f034d031b02000000d0050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b665236797270705905090100000060736967596656594a5561694b4b5a58347a737a575a3752463239326e56325036584d346e4b656b325967575138424c533172323275346139534376474d63623839426a546674546e327667557a435451475332634a4e766259747547516a47500306766a0b1f6cb035bf537887ba9004c489bb458d8c8e72b5033b6cee8ad52f84ec27b719f5d0b98cdf2d0744b255301263688692645eafc9cdf1b48b5053c51dca'
      );
      tx.owners.length.should.equal(0);
      const indexesByTransactionType = tx.getIndexesByTransactionType();
      Object.keys(indexesByTransactionType).length.should.equal(1);
      indexesByTransactionType.transaction.length.should.equal(2);
      indexesByTransactionType.transaction[0].should.equal(0);
      indexesByTransactionType.transaction[1].should.equal(1);

      const firstTransferSignatures = tx.getTransferSignatures(indexesByTransactionType.transaction[0]);
      firstTransferSignatures[0].signature.should.equal(
        'sigNjD64NuVnUK7oVB2c2SP32VYj7dTykbnRxyDoS9BGvgagvnMcT4hYccabbFGo9tdVQT4M46ezYJdL2pzYDSwkfR6yrppY'
      );
      firstTransferSignatures[0].index.should.equal(0);
      firstTransferSignatures[1].signature.should.equal(
        'sigYfVYJUaiKKZX4zszWZ7RF292nV2P6XM4nKek2YgWQ8BLS1r22u4a9SCvGMcb89BjTftTn2vgUzCTQGS2cJNvbYtuGQjGP'
      );
      firstTransferSignatures[1].index.should.equal(1);

      const secondTransferSignatures = tx.getTransferSignatures(indexesByTransactionType.transaction[1]);
      secondTransferSignatures[0].signature.should.equal(
        'sigNjD64NuVnUK7oVB2c2SP32VYj7dTykbnRxyDoS9BGvgagvnMcT4hYccabbFGo9tdVQT4M46ezYJdL2pzYDSwkfR6yrppY'
      );
      secondTransferSignatures[0].index.should.equal(0);
      secondTransferSignatures[1].signature.should.equal(
        'sigYfVYJUaiKKZX4zszWZ7RF292nV2P6XM4nKek2YgWQ8BLS1r22u4a9SCvGMcb89BjTftTn2vgUzCTQGS2cJNvbYtuGQjGP'
      );
      secondTransferSignatures[1].index.should.equal(1);
    });

    it('a send transaction to multiple destinations from implicit account', async () => {
      const sourceAccount = new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' });

      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({ fee: '4764' });
      txBuilder.branch('BKnfiSVFTjixbhzsTbR1eDmit6yK7UBcgRJPhmgeWcZqiMHRZ6E');
      txBuilder.counter('377751');
      txBuilder.source(sourceAccount.getAddress());
      txBuilder.transfer('111').to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      txBuilder.transfer('111').to('tz2XCDa2tcnS26PoBgiUb8h1xYhtJaebC2bT');
      txBuilder.sign({ key: sourceAccount.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oo7mpTB22Qu1d7EVc5b4eAdMgEzvdKRsHGjZWoEjQwYk6BJ1NTq');
      tx.type.should.equal(TransactionType.SingleSigSend);
      tx.source.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      should.equal(tx.inputs.length, 4);
      should.equal(tx.outputs.length, 2);
      tx.inputs[0].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[0].value.should.equal('4764');
      tx.inputs[1].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[1].value.should.equal('111');
      tx.inputs[2].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[2].value.should.equal('4764');
      tx.inputs[3].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[3].value.should.equal('111');
      tx.outputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.outputs[0].value.should.equal('111');
      tx.outputs[1].address.should.equal('tz2XCDa2tcnS26PoBgiUb8h1xYhtJaebC2bT');
      tx.outputs[1].value.should.equal('111');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigw5eG2rCkAqJcR2SuZ23TDQEtfU8oFw9rGpTAtpvnC69EbQazMZL6eUnYzxzvWFbLEtp7HbN4joWi1C9GQ348NXrw6X3Zd'
      );
      tx.toBroadcastFormat().should.equal(
        '09f5686021aadcfc00063b0873055c2e7c841398fece3d7865a8ed2756708d4a6c01a1525e289aed93119c44fd3aa8e9df8522e0d80d9c25978717e85281026f00006b5ddaef3fb5d7c151cfb36fbe43a7a066777394006c01a1525e289aed93119c44fd3aa8e9df8522e0d80d9c25988717e85281026f0001faf711f98d3a978656651c30875138c086fa871100fcf189b364c021e4be1a032f3867445e0c62ca01047fb853fe02d038e62fcad02ffca1d05e4b5a4e4fdc3ce6fc11607c9ca8ceca6fd7335d3dab6439ce2dee11'
      );
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
      tx.owners.length.should.equal(0);
    });

    it('a multisig send transaction with the signatures in custom order', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter('0');
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .gasLimit('33971')
        .storageLimit('1292')
        .dataToSign('00');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      // Multisig keys
      txBuilder.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(18) }).getKeys().prv, index: 2 });
      txBuilder.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(16) }).getKeys().prv, index: 1 });
      const tx = await txBuilder.build();
      const signatures = tx.toJson().contents[0].parameters.value.args[1];
      signatures[0].prim.should.equal('None');
      signatures[1].prim.should.equal('Some');
      signatures[1].args[0].string.should.equal(
        'sigUxvCQSEWQvZrf3yS2VjSTBWycMPe3zBBo6EWva2d3tHV1DKZNUs8b5fmqQeXWvdSSXztx48UsPY5FmJiDofmPSZ6SUjZt'
      );
      signatures[2].prim.should.equal('Some');
      signatures[2].args[0].string.should.equal(
        'sigiC286gLc1SSWHwKydczwwdwTUPv7e9mkPeHzfE9wEG9PKZ6fUcmrMeYwcH7t9fWsnozB7Fay2uxkmi1u1X1bw3MgJUNpu'
      );
      tx.owners.length.should.equal(0);
    });

    it('a multisig send transaction with the signatures in default order', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter('0');
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .gasLimit('33971')
        .storageLimit('1292')
        .dataToSign('00');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      // Multisig keys
      txBuilder.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(18) }).getKeys().prv });
      txBuilder.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(16) }).getKeys().prv });
      const tx = await txBuilder.build();
      const signatures = tx.toJson().contents[0].parameters.value.args[1];
      signatures[0].prim.should.equal('Some');
      signatures[0].args[0].string.should.equal(
        'sigiC286gLc1SSWHwKydczwwdwTUPv7e9mkPeHzfE9wEG9PKZ6fUcmrMeYwcH7t9fWsnozB7Fay2uxkmi1u1X1bw3MgJUNpu'
      );
      signatures[1].prim.should.equal('Some');
      signatures[1].args[0].string.should.equal(
        'sigUxvCQSEWQvZrf3yS2VjSTBWycMPe3zBBo6EWva2d3tHV1DKZNUs8b5fmqQeXWvdSSXztx48UsPY5FmJiDofmPSZ6SUjZt'
      );
      signatures[2].prim.should.equal('None');
      Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
    });

    it('a singleSig transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.SingleSigSend);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter('0');
      txBuilder
        .transfer(new BigNumber(10).toFixed(0))
        .from(defaultKeyPair.getAddress())
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .gasLimit('100971')
        .storageLimit('1292');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.SingleSigSend);
      const txJson = tx.toJson();
      txJson.contents[0].gas_limit.should.equal('100971');
      txJson.contents[0].storage_limit.should.equal('1292');
      txJson.contents[0].amount.should.equal('10');
      txJson.contents[0].counter.should.equal('0');
    });
  });

  describe('should fail to sign', () => {
    let genericTxBuilder: any;

    beforeEach(() => {
      genericTxBuilder = new XtzLib.TransactionBuilder(coins.get('txtz'));
      genericTxBuilder.type(TransactionType.Send);
      genericTxBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      genericTxBuilder.source(defaultKeyPair.getAddress());
      genericTxBuilder.counter('0');
      genericTxBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .gasLimit('33971')
        .storageLimit('1292')
        .dataToSign('00');
    });

    it('a transaction with no source account', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      assert.throws(() => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }));
    });

    it('a transaction with a different private key than the source account', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.from(testData.emptyUnsignedSerializedOriginationTransaction);
      txBuilder.type(TransactionType.WalletInitialization);
      assert.throws(() => txBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv }));
    });

    it('a transaction with some keys with custom index', async () => {
      genericTxBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      // Multisig keys
      genericTxBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv });
      genericTxBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv });
      assert.throws(
        () => genericTxBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv, index: 2 }),
        new RegExp('Custom index has to be set for all multisig contract signing keys or none')
      );
    });

    it('a transaction with some keys without custom index', async () => {
      genericTxBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      // Multisig keys
      genericTxBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv, index: 0 });
      genericTxBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv, index: 1 });
      assert.throws(
        () => genericTxBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv }),
        new RegExp('Custom index has to be set for all multisig contract signing keys or none')
      );
    });

    it('a transaction with a key with invalid custom index', async () => {
      genericTxBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      assert.throws(
        () => genericTxBuilder.sign({ key: new XtzLib.KeyPair().getKeys().prv, index: 3 }),
        new RegExp('Custom index cannot be greater')
      );
    });

    it('a Send transaction with no transfers', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({ fee: '4764' });
      txBuilder.branch('BKnfiSVFTjixbhzsTbR1eDmit6yK7UBcgRJPhmgeWcZqiMHRZ6E');
      txBuilder.counter('1');
      txBuilder.source(defaultKeyPair.getAddress());
      assert.throws(() => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }));
    });

    it('an address initialization transaction without public key', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AccountUpdate);
      assert.throws(
        () => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }),
        new RegExp('Cannot sign a public key revelation transaction without public key')
      );
    });
  });

  describe('should fail to', () => {
    it('change the type to Send when owners have already been set', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner(defaultKeyPair.getKeys().pub);
      assert.throws(() => txBuilder.type(TransactionType.Send));
    });

    it('build a send transaction with owners', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      assert.throws(() => txBuilder.owner(defaultKeyPair.getKeys().pub));
    });

    it('build a transaction with an invalid branch id', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      assert.throws(() => txBuilder.branch(''));
    });

    it('build a transaction with an invalid value', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      assert.throws(() => txBuilder.initialBalance('-1'));
    });

    it('build a non wallet initialization transaction with initial balance', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.Send);
      assert.throws(() => txBuilder.initialBalance('100'));
    });

    it('build transfer for non send-type transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      assert.throws(() => txBuilder.transfer('100'), new RegExp('Transfers can only be set for send transactions'));
    });

    it('add more owners than the multisig maximum', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      txBuilder.owner('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
      assert.throws(
        () => txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf'),
        new RegExp('A maximum of 3 owners')
      );
    });

    it('add the same owner twice', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
      assert.throws(
        () => txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf'),
        new RegExp('Repeated owner public key')
      );
    });

    it('add an invalid owner public key', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.WalletInitialization);
      assert.throws(() => txBuilder.owner('sppk'), new RegExp('Invalid public key'));
    });

    it('add an invalid public key to reveal', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AccountUpdate);
      assert.throws(() => txBuilder.publicKeyToReveal('sppk'), new RegExp('Unsupported public key'));
    });

    it('add the same public key to reveal twice', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AccountUpdate);
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.publicKeyToReveal(defaultKeyPair.getKeys().pub);
      assert.throws(
        () => txBuilder.publicKeyToReveal(defaultKeyPair.getKeys().pub),
        new RegExp('Public key to reveal already set')
      );
    });

    it('add the public key to reveal that does not belong to the source', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AccountUpdate);
      txBuilder.source(defaultKeyPair.getAddress());
      assert.throws(
        () => txBuilder.publicKeyToReveal('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf'),
        new RegExp('Public key does not match the source address')
      );
    });

    it('change the transaction type from Send if it has transfers', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter('0');
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      assert.throws(
        () => txBuilder.type(TransactionType.WalletInitialization),
        new RegExp('Transaction contains transfers and can only be labeled as Send')
      );
    });
  });
});
