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

    it('a send transaction to an implicit account', async () => {
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

      tx.id.should.equal('ooSnNjN7bnCixMc7dwbQ4nR3B9neFoigDUqnwU14ajHNuAKUx1C');
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
        'sigt2zwt3wCs4NW5396ZoQUJaPWGixYTefMRd6GmtBRFNB5zxegAMyzo9mzEy31KzWjpkpe9KarTGxmgrK3BcHbnoQKpqvNt',
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

      tx.id.should.equal('ooSnNjN7bnCixMc7dwbQ4nR3B9neFoigDUqnwU14ajHNuAKUx1C');
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
        'sigt2zwt3wCs4NW5396ZoQUJaPWGixYTefMRd6GmtBRFNB5zxegAMyzo9mzEy31KzWjpkpe9KarTGxmgrK3BcHbnoQKpqvNt',
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
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new KeyPair({ seed: Buffer.alloc(32) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('ooSnNjN7bnCixMc7dwbQ4nR3B9neFoigDUqnwU14ajHNuAKUx1C');
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
        'sigt2zwt3wCs4NW5396ZoQUJaPWGixYTefMRd6GmtBRFNB5zxegAMyzo9mzEy31KzWjpkpe9KarTGxmgrK3BcHbnoQKpqvNt',
      );
    });

    it('a send transaction to multiple destinations', async () => {
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({ fee: '4764' });
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.counter(0);
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .dataToSign(
          '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b',
        );
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      txBuilder.sign({
        key: new KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      txBuilder.sign({ key: new KeyPair({ seed: Buffer.alloc(32) }).getKeys().prv });
      const tx = await txBuilder.build();

      tx.id.should.equal('ooSnNjN7bnCixMc7dwbQ4nR3B9neFoigDUqnwU14ajHNuAKUx1C');
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
        'sigt2zwt3wCs4NW5396ZoQUJaPWGixYTefMRd6GmtBRFNB5zxegAMyzo9mzEy31KzWjpkpe9KarTGxmgrK3BcHbnoQKpqvNt',
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
  });
});
