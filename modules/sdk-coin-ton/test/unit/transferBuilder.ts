import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { coins } from '@bitgo/statics';
import * as testData from '../resources/ton';
import { KeyPair } from '../../src/lib/keyPair';
import * as utils from '../../src/lib/utils';
import TonWeb from 'tonweb';

describe('Ton Transfer Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tton'));
  it('should build a unsigned transfer tx', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.sender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.sender.publicKey);
    txBuilder.expireTime(1234567890);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setMessage('test');
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.sender.address,
      value: testData.recipients[0].amount,
      coin: 'tton',
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: testData.recipients[0].address,
      value: testData.recipients[0].amount,
      coin: 'tton',
    });
    tx.id.should.equal('xycq7JHcsItiQQPXf++KIUk1SvSGw5Jb7WEqfwbTE5c=');
    const rawTx = tx.toBroadcastFormat();
    rawTx.should.equal(
      'te6cckECGAEAA7cAAuGIAXbCuDA8EAGHOtnmGNeTyXkBrrlhldH123Fgne3eUxOSGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmpoxf/////AAAAAAADgEXAgE0AhYBFP8A9KQT9LzyyAsDAgEgBBECAUgFCALm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQYHAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAkQAgEgCg8CAVgLDAA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA0OABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xITFBUAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjF8DDudwJkyEh7jUbJEjFCjriVxsSlRJFyF872V1eegb4QAB4YgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr6A613oAAAAAAAAAAAAAAAAAAAAAAAB0ZXN0Qwrxqw=='
    );
  });

  it('should build a send from rawTx', async function () {
    const txBuilder = factory.from(testData.signedTransaction.tx);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.signablePayload.toString('base64'), testData.signedTransaction.signable);
    //    should.equal(builtTx.id, testData.signedTransaction.txId);
    const builder2 = factory.from(builtTx.toBroadcastFormat());
    const builtTx2 = await builder2.build();
    should.equal(builtTx2.type, TransactionType.Send);
    should.equal(builtTx.toBroadcastFormat(), testData.signedTransaction.tx);
    builtTx.inputs.length.should.equal(1);
    builtTx.outputs.length.should.equal(1);
    const jsonTx = builtTx.toJson();
    jsonTx.sender.should.equal('EQCSBjR3fUOL98WTw2F_IT4BrcqjZJWVLWUSz5WQDpaL9Jpl');
    jsonTx.destination.should.equal('EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG');
    jsonTx.amount.should.equal('10000000');
    jsonTx.seqno.should.equal(6);
    jsonTx.expirationTime.should.equal(1695997582);
  });

  xit('should build a signed transfer tx and submit onchain', async function () {
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));
    const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey1 });
    const publicKey = keyPair.getKeys().pub;
    const address = await utils.default.getAddressFromPublicKey(publicKey);
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(address);

    const WalletClass = tonweb.wallet.all['v4R2'];
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: tonweb.utils.hexToBytes(publicKey),
      wc: 0,
    });
    const seqno = await wallet.methods.seqno().call();
    txBuilder.sequenceNumber(seqno as number);
    txBuilder.publicKey(publicKey);
    const expireAt = Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7; // 7 days
    txBuilder.expireTime(expireAt);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setMessage('test');
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    const signable = tx.signablePayload;
    const signature = keyPair.signMessageinUint8Array(signable);
    txBuilder.addSignature(keyPair.getKeys(), Buffer.from(signature));
    const signedTx = await txBuilder.build();
    const builder2 = factory.from(signedTx.toBroadcastFormat());
    const tx2 = await builder2.build();
    const signature2 = keyPair.signMessageinUint8Array(tx2.signablePayload);
    should.equal(Buffer.from(signature).toString('hex'), Buffer.from(signature2).toString('hex'));
    should.equal(tx.toBroadcastFormat(), tx2.toBroadcastFormat());

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result = await tonweb.provider.sendBoc(signedTx.toBroadcastFormat());
    console.log(JSON.stringify(result));
  });

  it('should build a signed transfer tx using add signature', async function () {
    const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey1 });
    const publicKey = keyPair.getKeys().pub;
    const address = await utils.default.getAddressFromPublicKey(publicKey);
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(publicKey);
    const expireAt = new Date().getTime() + 1000 * 60 * 60 * 24 * 7;
    txBuilder.expireTime(expireAt);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setMessage('test');
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    const signable = tx.signablePayload;
    const signature = keyPair.signMessageinUint8Array(signable);
    txBuilder.addSignature(keyPair.getKeys(), Buffer.from(signature));
    const signedTx = await txBuilder.build();
    const builder2 = factory.from(signedTx.toBroadcastFormat());
    const tx2 = await builder2.build();
    const signature2 = keyPair.signMessageinUint8Array(tx2.signablePayload);
    should.equal(Buffer.from(signature).toString('hex'), Buffer.from(signature2).toString('hex'));
    should.equal(tx.toBroadcastFormat(), tx2.toBroadcastFormat());
  });
});
