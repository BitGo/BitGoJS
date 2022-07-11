import should from 'should';

import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { XtzLib } from '../../src';

describe('Offline Tezos Transaction builder', function () {
  const defaultKeyPair = new XtzLib.KeyPair({
    prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
  });

  describe('should build and sign', () => {
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
      const tx = await txBuilder.build();

      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.WalletInitialization);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs[0].address.should.equal('');
      tx.outputs[0].value.should.equal('1000000');
      tx.signature.length.should.equal(0);

      const offlineTxBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
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
        'sigVD57haAMCobHrCwH9ABfbFvdmyR9ZspZC3Zihb9tEPfhtzCKS1F8fLoVpodvor3PUoo7ry4j46xYETEzELmtnrNTaTPX4'
      );
    });

    it('a reveal transaction', async () => {
      const txBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      txBuilder.type(TransactionType.AccountUpdate);
      txBuilder.source(defaultKeyPair.getAddress());
      txBuilder.counter('0');
      txBuilder.branch('BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS');
      txBuilder.publicKeyToReveal(defaultKeyPair.getKeys().pub);
      const tx = await txBuilder.build();

      tx.id.should.equal('');
      tx.type.should.equal(TransactionType.AccountUpdate);
      tx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 0);
      tx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      tx.inputs[0].value.should.equal('1420');

      const offlineTxBuilder: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      offlineTxBuilder.from(tx.toBroadcastFormat());
      offlineTxBuilder.source(defaultKeyPair.getAddress());
      offlineTxBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const signedTx = await offlineTxBuilder.build();

      signedTx.id.should.equal('oomXs6PuWtmGwMKoXTNsu9XJHnGXtuRujcHMeYS9y37Xj6sXPHb');
      signedTx.type.should.equal(TransactionType.AccountUpdate);
      signedTx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      should.equal(signedTx.inputs.length, 1);
      should.equal(signedTx.outputs.length, 0);
      signedTx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      signedTx.inputs[0].value.should.equal('1420');
      signedTx.signature.length.should.equal(1);
      signedTx.signature[0].should.equal(
        'sigQyYsfhtrJBKZuJSEizDdxoejNVvJWRZPDMWdpXVvdTVix37HzURwXfXsi9METnRzskvjgsBSgiF4pr7RVxzWLuixxJL8U'
      );
    });

    it('a send transaction to single destinations', async () => {
      const testDataToSign =
        '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b';
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
        .counter('1');
      const tx = await txBuilder.build();
      tx.toBroadcastFormat().should.equal(
        'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000000760707070700010505020000005e0320053d036d0743036e01000000244b543148557274366b66765979444559434a3247536a7654505a364b6d5266784c4255380555036c0200000015072f02000000090200000004034f032702000000000743036a00a401034f034d031b0200000006030603060306'
      );

      // Offline signing from location 1 with a transfer key
      const offlineTxBuilder1: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      offlineTxBuilder1.from(tx.toBroadcastFormat());
      offlineTxBuilder1.source(defaultKeyPair.getAddress());
      // Since dataToSign cannot me calculated, it has to be passed to the new builder so we can
      // generate the signatures
      offlineTxBuilder1.overrideDataToSign({ dataToSign: testDataToSign });
      offlineTxBuilder1.sign({
        key: new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      const signedTx1 = await offlineTxBuilder1.build();

      // Offline signing from location 2 with another transfer key
      const offlineTxBuilder2: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      offlineTxBuilder2.from(signedTx1.toBroadcastFormat());
      offlineTxBuilder2.source(defaultKeyPair.getAddress());
      offlineTxBuilder2.overrideDataToSign({ dataToSign: testDataToSign });
      offlineTxBuilder2.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(16) }).getKeys().prv });
      const signedTx2 = await offlineTxBuilder2.build();

      // Offline signing from location 3 with the fee key
      const offlineTxBuilder3: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      offlineTxBuilder3.from(signedTx2.toBroadcastFormat());
      offlineTxBuilder3.source(defaultKeyPair.getAddress());
      offlineTxBuilder3.sign({ key: defaultKeyPair.getKeys().prv });
      const signedTx = await offlineTxBuilder3.build();

      signedTx.id.should.equal('onkHwfuYJMrtxNdyL6eHeNEHuE1n5HPH75CXUNh91agjbQAxwzT');
      signedTx.type.should.equal(TransactionType.Send);
      should.equal(signedTx.inputs.length, 2);
      should.equal(signedTx.outputs.length, 1);
      signedTx.inputs[0].address.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
      signedTx.inputs[0].value.should.equal('4764');
      signedTx.inputs[1].address.should.equal('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL');
      signedTx.inputs[1].value.should.equal('100');
      signedTx.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
      signedTx.outputs[0].value.should.equal('100');
      signedTx.signature.length.should.equal(1);
      signedTx.signature[0].should.equal(
        'sigd8B36JUVyDqpCvV1GtbLpP398gpmwfxvGQM6eQ45JG5z4LgDRX55YPAPTMW2pAciwaA3jv8wgyxR9cnEjsCFs1QRPfQ9G'
      );
      signedTx
        .toBroadcastFormat()
        .should.equal(
          'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000001400707070700010505020000005e0320053d036d0743036e01000000244b543148557274366b66765979444559434a3247536a7654505a364b6d5266784c4255380555036c0200000015072f02000000090200000004034f032702000000000743036a00a401034f034d031b02000000d0050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b665236797270705905090100000060736967596656594a5561694b4b5a58347a737a575a3752463239326e56325036584d346e4b656b325967575138424c533172323275346139534376474d63623839426a546674546e327667557a435451475332634a4e766259747547516a4750030673b1393fbda4f24e07958136dc7951e0d020748e54bd29b847323ef2bc85c399657f4359fc10a13e5afe7b7068b584ea2e578736250881481e212e9793bfbf88'
        );
    });

    it('a send transaction to multiple destinations', async () => {
      const testDataToSign =
        '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b';
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
        .counter('1');
      txBuilder
        .transfer('100')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('4764')
        .counter('2');
      const tx = await txBuilder.build();
      tx.toBroadcastFormat().should.equal(
        'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000000760707070700010505020000005e0320053d036d0743036e01000000244b543148557274366b66765979444559434a3247536a7654505a364b6d5266784c4255380555036c0200000015072f02000000090200000004034f032702000000000743036a00a401034f034d031b02000000060306030603066c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2501e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e0000005a070707070002050502000000420320053d036d0743035d0100000024747a3156526a5270564b6e76313641567072464831746b446e3454446656714138393341031e0743036a00a401034f034d031b0200000006030603060306'
      );

      // Offline signing from location 1 with a transfer key
      const offlineTxBuilder1: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      offlineTxBuilder1.from(tx.toBroadcastFormat());
      offlineTxBuilder1.source(defaultKeyPair.getAddress());
      // Since dataToSign cannot me calculated, it has to be passed to the new builder so we can
      // generate the signatures
      offlineTxBuilder1.overrideDataToSign({ dataToSign: testDataToSign, index: 0 });
      offlineTxBuilder1.overrideDataToSign({ dataToSign: testDataToSign, index: 1 });
      offlineTxBuilder1.sign({
        key: new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' }).getKeys().prv,
      });
      const signedTx1 = await offlineTxBuilder1.build();

      // Offline signing from location 2 with another transfer key
      const offlineTxBuilder2: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      offlineTxBuilder2.from(signedTx1.toBroadcastFormat());
      offlineTxBuilder2.source(defaultKeyPair.getAddress());
      offlineTxBuilder2.overrideDataToSign({ dataToSign: testDataToSign, index: 0 });
      offlineTxBuilder2.overrideDataToSign({ dataToSign: testDataToSign, index: 1 });
      offlineTxBuilder2.sign({ key: new XtzLib.KeyPair({ seed: Buffer.alloc(16) }).getKeys().prv, index: 1 });
      const signedTx2 = await offlineTxBuilder2.build();

      // Offline signing from location 3 with the fee key
      const offlineTxBuilder3: any = new XtzLib.TransactionBuilder(coins.get('xtz'));
      offlineTxBuilder3.from(signedTx2.toBroadcastFormat());
      offlineTxBuilder3.source(defaultKeyPair.getAddress());
      offlineTxBuilder3.sign({ key: defaultKeyPair.getKeys().prv });
      const signedTx = await offlineTxBuilder3.build();

      signedTx.id.should.equal('onyGaWs6z4bVVcfn3h9KbBrktEhuDyJLYEVB4aJRM6YNngjDxE4');
      signedTx.type.should.equal(TransactionType.Send);
      signedTx.source.should.equal('tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS');
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
        'sigdUpzCxmi9NWhdbFGfvqVyH8Xfr2UiPc2fkqNrQ4CHvrk19ZDksDksEc4DJsTbphenV8jCNZFqzL4sCVRzM93HnSSqgJz7'
      );
      const firstTransferSignatures = signedTx.getTransferSignatures();
      firstTransferSignatures.length.should.equal(2);
      firstTransferSignatures[0].signature.should.equal(
        'sigNjD64NuVnUK7oVB2c2SP32VYj7dTykbnRxyDoS9BGvgagvnMcT4hYccabbFGo9tdVQT4M46ezYJdL2pzYDSwkfR6yrppY'
      );
      firstTransferSignatures[0].index.should.equal(0);
      firstTransferSignatures[1].signature.should.equal(
        'sigYfVYJUaiKKZX4zszWZ7RF292nV2P6XM4nKek2YgWQ8BLS1r22u4a9SCvGMcb89BjTftTn2vgUzCTQGS2cJNvbYtuGQjGP'
      );
      firstTransferSignatures[1].index.should.equal(1);
      // Note: Signatures are the same here because the data to sign used in the test is the same
      const secondTransferSignatures = signedTx.getTransferSignatures(1);
      secondTransferSignatures.length.should.equal(2);
      secondTransferSignatures[0].signature.should.equal(
        'sigNjD64NuVnUK7oVB2c2SP32VYj7dTykbnRxyDoS9BGvgagvnMcT4hYccabbFGo9tdVQT4M46ezYJdL2pzYDSwkfR6yrppY'
      );
      secondTransferSignatures[0].index.should.equal(0);
      secondTransferSignatures[1].signature.should.equal(
        'sigYfVYJUaiKKZX4zszWZ7RF292nV2P6XM4nKek2YgWQ8BLS1r22u4a9SCvGMcb89BjTftTn2vgUzCTQGS2cJNvbYtuGQjGP'
      );
      secondTransferSignatures[1].index.should.equal(1);
      signedTx
        .toBroadcastFormat()
        .should.equal(
          'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2500e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e000001400707070700010505020000005e0320053d036d0743036e01000000244b543148557274366b66765979444559434a3247536a7654505a364b6d5266784c4255380555036c0200000015072f02000000090200000004034f032702000000000743036a00a401034f034d031b02000000d0050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b665236797270705905090100000060736967596656594a5561694b4b5a58347a737a575a3752463239326e56325036584d346e4b656b325967575138424c533172323275346139534376474d63623839426a546674546e327667557a435451475332634a4e766259747547516a475003066c01aaca87bdbcdc4e6117b667e29f9b504362c831bb9c2501e8528102000196369c90625575ba44594b23794832a9337f7a2d00ffff046d61696e00000124070707070002050502000000420320053d036d0743035d0100000024747a3156526a5270564b6e76313641567072464831746b446e3454446656714138393341031e0743036a00a401034f034d031b02000000d0050901000000607369674e6a4436344e75566e554b376f56423263325350333256596a376454796b626e527879446f5339424776676167766e4d6354346859636361626246476f397464565154344d3436657a594a644c32707a594453776b665236797270705905090100000060736967596656594a5561694b4b5a58347a737a575a3752463239326e56325036584d346e4b656b325967575138424c533172323275346139534376474d63623839426a546674546e327667557a435451475332634a4e766259747547516a47500306766a0b1f6cb035bf537887ba9004c489bb458d8c8e72b5033b6cee8ad52f84ec27b719f5d0b98cdf2d0744b255301263688692645eafc9cdf1b48b5053c51dca'
        );
    });
  });
});
