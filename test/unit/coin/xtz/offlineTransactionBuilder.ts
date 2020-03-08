import should from 'should';

import { TransactionType } from '../../../../src/coin/baseCoin/';
import { getBuilder, Xtz } from '../../../../src';
import { KeyPair } from '../../../../src/coin/xtz';

describe('Offline Tezos Transaction builder', function() {
  const defaultKeyPair = new Xtz.KeyPair({
    prv:
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
  });

  describe('should build and sign', () => {
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
      txBuilder.counter('0');
      txBuilder.owner('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
      txBuilder.owner('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
      txBuilder.owner('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      const tx = await txBuilder.build();

      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.WalletInitialization);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs[0].address.should.equal('');
      tx.outputs[0].value.should.equal('1000000');
      tx.signature.length.should.equal(0);

      const offlineTxBuilder: any = getBuilder('xtz');
      offlineTxBuilder.from(tx.toBroadcastFormat());
      offlineTxBuilder.source(defaultKeyPair.getAddress());
      offlineTxBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const signedTx = await offlineTxBuilder.build();

      signedTx.id.should.equal('opNfjjEfWk7HsnY8fQrUoPFuXZfABweubA6D4bVScmqoVzcZVFA');
      signedTx.type.should.equal(TransactionType.WalletInitialization);
      should.equal(signedTx.inputs.length, 1);
      should.equal(signedTx.outputs.length, 1);
      signedTx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      signedTx.inputs[0].value.should.equal('1004764');
      signedTx.outputs[0].address.should.equal('KT1J9LfhDV6FQxR7aMaK7R6Rw8mBpfhP5MA3');
      signedTx.outputs[0].value.should.equal('1000000');
      signedTx.signature.length.should.equal(1);
      signedTx.signature[0].should.equal(
        'sigVD57haAMCobHrCwH9ABfbFvdmyR9ZspZC3Zihb9tEPfhtzCKS1F8fLoVpodvor3PUoo7ry4j46xYETEzELmtnrNTaTPX4',
      );
    });

    it('a send transaction to multiple destinations', async () => {
      const testDataToSign =
        '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b';
      const txBuilder: any = getBuilder('xtz');
      txBuilder.type(TransactionType.Send);
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.counter('0');
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8')
        .fee('4764')
        .counter('1');
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .counter('2');
      const tx = await txBuilder.build();

      // Offline signing
      const offlineTxBuilder: any = getBuilder('xtz');
      offlineTxBuilder.from(tx.toBroadcastFormat());
      offlineTxBuilder.source(defaultKeyPair.getAddress());
      // Since dataToSign cannot me calculated, it has to be passed to the new builder so we can
      // generate the signatures
      offlineTxBuilder.overrideDataToSign({ dataToSign: testDataToSign, index: 0 });
      offlineTxBuilder.overrideDataToSign({ dataToSign: testDataToSign, index: 1 });
      offlineTxBuilder.source(defaultKeyPair.getAddress());
      offlineTxBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      offlineTxBuilder.sign({
        key: new KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      offlineTxBuilder.sign({ key: new KeyPair({ seed: Buffer.alloc(32) }).getKeys().prv });
      const signedTx = await offlineTxBuilder.build();

      signedTx.id.should.equal('ooT43qkUXB5VHz83hYaTiUNd1LBqkbULqxoZaPmKhj8BkeHdQVD');
      signedTx.type.should.equal(TransactionType.Send);
      should.equal(signedTx.inputs.length, 4);
      should.equal(signedTx.outputs.length, 2);
      signedTx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      signedTx.inputs[0].value.should.equal('4764');
      signedTx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      signedTx.inputs[1].value.should.equal('100');
      signedTx.inputs[2].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      signedTx.inputs[2].value.should.equal('4764');
      signedTx.inputs[3].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      signedTx.inputs[3].value.should.equal('100');
      signedTx.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
      signedTx.outputs[0].value.should.equal('100');
      signedTx.outputs[1].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      signedTx.outputs[1].value.should.equal('100');
      signedTx.signature.length.should.equal(1);
      signedTx.signature[0].should.equal(
        'sigXmArEwQWVeKMPLSs6eqiCyFD4xtnMPxGZaxW9NwYa5j2iNpjxBLYfga2HFcptTFbbiDwYt5KtKMnAwvR7bGUMALZmdzkE',
      );
      signedTx
        .toBroadcastFormat()
        .should.equal(
          'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000000db0707070700010505020000005e0320053d036d0743036e01000000244b543148557274366b66765979444559434a3247536a7654505a364b6d5266784c4255380555036c0200000015072f02000000090200000004034f032702000000000743036a00a401034f034d031b020000006b050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b6652367972707059030603066c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2501e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000000bf070707070002050502000000420320053d036d0743035d0100000024747a3156526a5270564b6e76313641567072464831746b446e3454446656714138393341031e0743036a00a401034f034d031b020000006b050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b6652367972707059030603064ab4d457fdd8a3077c66c02b05b166c541ce4e69aac3489a37d5f27cd1cb7ae50e529c16fff7041140a9809ad9e9884d5f740c14e7f9f28fe9e3f04a6a5a8c7c',
        );
    });
  });
});
