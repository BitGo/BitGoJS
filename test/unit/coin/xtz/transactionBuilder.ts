import * as should from 'should';

import { TransactionType } from '../../../../src/coin/baseCoin/';
import * as testData from '../../../resources/xtz/xtz';
import { getBuilder, Xtz } from '../../../../src';
import { KeyPair } from '../../../../src/coin/xtz';

describe('Tezos Transaction builder', function() {
  const defaultKeyPair = new Xtz.KeyPair({
    prv:
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
  });

  describe('should parse', () => {
    it('an unsigned init transaction', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.from(testData.unsignedSerializedOriginationTransaction);
      const tx = await txBuilder.build();
      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.WalletInitialization);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.inputs[0].amount.should.equal('1004764');
      tx.outputs[0].address.should.equal('');
      tx.outputs[0].amount.should.equal('1000000');
      tx.signature.length.should.equal(0);
    });
  });

  describe('should build', () => {
    it('an init transaction', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({ fee: '10' });
      const source = {
        pub:
          'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
      };
      const sourceKeyPair = new Xtz.KeyPair(source);
      txBuilder.source(sourceKeyPair);
      txBuilder.initialBalance('1000000');
      txBuilder.counter(0);
      txBuilder.owner(
        new Xtz.KeyPair({ pub: 'sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b' }).getKeys().pub,
      );
      txBuilder.owner(
        new Xtz.KeyPair({ pub: 'sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F' }).getKeys().pub,
      );
      txBuilder.owner(
        new Xtz.KeyPair({ pub: 'sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf' }).getKeys().pub,
      );
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      const tx = await txBuilder.build();

      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.WalletInitialization);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('1000010');
      tx.outputs[0].address.should.equal('');
      tx.outputs[0].amount.should.equal('1000000');
      tx.signature.length.should.equal(0);
    });

    it('an account reveal transaction', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.fee({ fee: '10' });
      const source = {
        pub:
          'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
      };
      const keyPair = new Xtz.KeyPair(source);
      txBuilder.source(keyPair);
      txBuilder.counter(0);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      const tx = await txBuilder.build();

      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.AddressInitialization);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 0);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('1420');
      tx.signature.length.should.equal(0);
    });
  });

  describe('should sign', () => {
    it('an init transaction', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '4764',
        gasLimit: '33971',
        storageLimit: '1292',
      });
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.initialBalance('1000000');
      txBuilder.counter(0);
      txBuilder.owner('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      txBuilder.owner('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('opNfjjEfWk7HsnY8fQrUoPFuXZfABweubA6D4bVScmqoVzcZVFA');
      tx.type.should.equal(TransactionType.WalletInitialization);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('1004764');
      tx.outputs[0].address.should.equal('KT1J9LfhDV6FQxR7aMaK7R6Rw8mBpfhP5MA3');
      tx.outputs[0].amount.should.equal('1000000');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigVD57haAMCobHrCwH9ABfbFvdmyR9ZspZC3Zihb9tEPfhtzCKS1F8fLoVpodvor3PUoo7ry4j46xYETEzELmtnrNTaTPX4',
      );
    });

    it('an init transaction and reveal the source', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '4764',
        gasLimit: '33971',
        storageLimit: '1292',
      });
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.reveal();
      txBuilder.initialBalance('1000000');
      txBuilder.counter(0);
      txBuilder.owner('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      txBuilder.owner('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('opL3HkqFB7Rs1FjfGZAwKJza5nXWxR7c21SptULChLGVtswgSH8');
      tx.type.should.equal(TransactionType.WalletInitialization);
      should.equal(tx.inputs.length, 2);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('1420');
      tx.inputs[1].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[1].amount.should.equal('1004764');
      tx.outputs[0].address.should.equal('KT1NG74AvJPXf7dK5MEwEpzx6MDe2M2Uqet2');
      tx.outputs[0].amount.should.equal('1000000');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigo9DZMEsEDb6JDF4nU4GcJhbSxyAvejJhVzBYNtgdykMzqxLoJYgWtchgwaqa5j8WSZDWgBXFTKdtWeV4U51iMHeQHJzPX',
      );
    });

    it('a reveal transaction', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.AddressInitialization);
      txBuilder.source(defaultKeyPair);
      txBuilder.counter(0);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oomXs6PuWtmGwMKoXTNsu9XJHnGXtuRujcHMeYS9y37Xj6sXPHb');
      tx.type.should.equal(TransactionType.AddressInitialization);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 0);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('1420');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigQyYsfhtrJBKZuJSEizDdxoejNVvJWRZPDMWdpXVvdTVix37HzURwXfXsi9METnRzskvjgsBSgiF4pr7RVxzWLuixxJL8U',
      );
    });

    it('a multisig send transaction to an implicit account', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter(0);
      txBuilder
        .transfer('1000000')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .gasLimit('33971')
        .storageLimit('1292')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new KeyPair({ seed: Buffer.alloc(32) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oo5hLZZDW3Fakjcv9prqxibLqDP4G67yH96ZfSgHdVuvGktrQYh');
      tx.type.should.equal(TransactionType.Send);
      should.equal(tx.inputs.length, 2);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('4764');
      tx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[1].amount.should.equal('1000000');
      tx.outputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.outputs[0].amount.should.equal('1000000');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigtcWyCrWg2qHbKhReCee3Q63WxJqC2GqMzUAprtLi1BXyGjyyBeHa5mr56jPd9tZsy5Wm67hFouSwwyiSj8WYyF1ghcqEw',
      );
      tx.toBroadcastFormat().should.equal(
        'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500b389028c0a000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000000bc070707070000050502000000430320053d036d0743035d0100000024747a3156526a5270564b6e76313641567072464831746b446e3454446656714138393341031e0743036a0080897a034f034d031b0200000067050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b6652367972707059ea14ded0e7ad674c2ca146543ba9cfc15b3c9e17482f85617470e18089faccd369782e33c96ddd5fa4cd45b866fa6990a71dd3a7002faaa2c8c4550d29957130',
      );
    });

    it('a send transaction to an originated account (other contract)', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter(0);
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .gasLimit('33971')
        .storageLimit('1292')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new KeyPair({ seed: Buffer.alloc(32) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('onyfdBSVYPsVBdzxSAU9BSSxnTD2UMN4THdoxtcdryN7YKDcn15');
      tx.type.should.equal(TransactionType.Send);
      should.equal(tx.inputs.length, 2);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('4764');
      tx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[1].amount.should.equal('100');
      tx.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
      tx.outputs[0].amount.should.equal('100');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigsGZAkXDAV65hwgFkCdmFKMVW2tSBmKzbkGQLMFEuH6g1NbzR5iTTqe8Fe8mhR1RVAXHFCW3JTG3vc5ky8LBpSo7rgX8wq',
      );
    });

    it('a send transaction to multiple destinations', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.counter(0);
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .counter('1')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .counter('2')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new KeyPair({ seed: Buffer.alloc(32) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oo1nynTzCSRhhJvxXznnGthaLwBhwngnBTh3yE4aaLFa4pZ8ueF');
      tx.type.should.equal(TransactionType.Send);
      should.equal(tx.inputs.length, 4);
      should.equal(tx.outputs.length, 2);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].amount.should.equal('4764');
      tx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[1].amount.should.equal('100');
      tx.inputs[2].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[2].amount.should.equal('4764');
      tx.inputs[3].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      tx.inputs[3].amount.should.equal('100');
      tx.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
      tx.outputs[0].amount.should.equal('100');
      tx.outputs[1].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.outputs[1].amount.should.equal('100');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigNgKdACAYYzXAmkZMe1qmprdq1YdmifgXzH4ru84BpB3xN7PeYExkh1y4wYfK1UdCKDH6D5RNfvMBChgZ664SvJj8B2chz',
      );
    });

    it('a send transaction to multiple destinations from implicit account', async () => {
      const sourceAccount = new Xtz.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' });

      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({ fee: '4764' });
      txBuilder.branch('BKnfiSVFTjixbhzsTbR1eDmit6yK7UBcgRJPhmgeWcZqiMHRZ6E');
      txBuilder.counter(377751);
      txBuilder.source(sourceAccount.getAddress());
      txBuilder.transfer('111').to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      txBuilder.transfer('111').to('tz2XCDa2tcnS26PoBgiUb8h1xYhtJaebC2bT');
      txBuilder.sign({ key: sourceAccount.getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('oo7mpTB22Qu1d7EVc5b4eAdMgEzvdKRsHGjZWoEjQwYk6BJ1NTq');
      tx.type.should.equal(TransactionType.Send);
      should.equal(tx.inputs.length, 4);
      should.equal(tx.outputs.length, 2);
      tx.inputs[0].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[0].amount.should.equal('4764');
      tx.inputs[1].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[1].amount.should.equal('111');
      tx.inputs[2].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[2].amount.should.equal('4764');
      tx.inputs[3].address.should.equal('tz2P2E8EgHaLA6A17rH3pE9T2tx6DA7D4siW');
      tx.inputs[3].amount.should.equal('111');
      tx.outputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.outputs[0].amount.should.equal('111');
      tx.outputs[1].address.should.equal('tz2XCDa2tcnS26PoBgiUb8h1xYhtJaebC2bT');
      tx.outputs[1].amount.should.equal('111');
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigw5eG2rCkAqJcR2SuZ23TDQEtfU8oFw9rGpTAtpvnC69EbQazMZL6eUnYzxzvWFbLEtp7HbN4joWi1C9GQ348NXrw6X3Zd',
      );
      tx.toBroadcastFormat().should.equal(
        '09f5686021aadcfc00063b0873055c2e7c841398fece3d7865a8ed2756708d4a6c01a1525e289aed93119c44fd3aa8e9df8522e0d80d9c25978717e85281026f00006b5ddaef3fb5d7c151cfb36fbe43a7a066777394006c01a1525e289aed93119c44fd3aa8e9df8522e0d80d9c25988717e85281026f0001faf711f98d3a978656651c30875138c086fa871100fcf189b364c021e4be1a032f3867445e0c62ca01047fb853fe02d038e62fcad02ffca1d05e4b5a4e4fdc3ce6fc11607c9ca8ceca6fd7335d3dab6439ce2dee11',
      );
    });
  });

  describe('should fail to sign', () => {
    it('a transaction with no source account', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.WalletInitialization);
      should.throws(() => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }));
    });

    it('a transaction with a different private key than the source account', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.from(testData.emptyUnsignedSerializedOriginationTransaction);
      txBuilder.type(TransactionType.WalletInitialization);
      should.throws(() => txBuilder.sign({ key: new KeyPair().getKeys().prv }));
    });
  });

  describe('should fail to', () => {
    it('change the type to Send when owners have already been set', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner(defaultKeyPair.getKeys().pub);
      should.throws(() => txBuilder.type(TransactionType.Send));
    });

    it('build a send transaction with owners', async () => {
      const txBuilder: any = getBuilder('xtz');
      should.throws(() => txBuilder.owner(defaultKeyPair.getKeys().pub));
    });

    it('build a transaction with an invalid branch id', async () => {
      const txBuilder: any = getBuilder('xtz');
      should.throws(() => txBuilder.branch(''));
    });

    it('build a transaction with an invalid amount', async () => {
      const txBuilder: any = getBuilder('xtz');
      should.throws(() => txBuilder.initialBalance('-1'));
    });

    it('build a non wallet initialization transaction with initial balance', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      should.throws(() => txBuilder.initialBalance('100'));
    });

    it('sign a transaction with no transfers', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({ fee: '4764' });
      txBuilder.branch('BKnfiSVFTjixbhzsTbR1eDmit6yK7UBcgRJPhmgeWcZqiMHRZ6E');
      txBuilder.counter(1);
      txBuilder.source(defaultKeyPair.getAddress());
      should.throws(() => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }));
    });
  });
});
