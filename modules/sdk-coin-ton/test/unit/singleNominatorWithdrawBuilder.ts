import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { coins } from '@bitgo/statics';
import * as testData from '../resources/ton';
import { KeyPair } from '../../src/lib/keyPair';
import * as utils from '../../src/lib/utils';
import TonWeb from 'tonweb';

describe('Ton Single Nominator Withdraw Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tton'));
  it('should build a unsigned withdraw tx', async function () {
    const txId = 'wxaFRG6b7Fhw91Al3JY-zbvl9Mjr-P0NuLvoGYyS5FI='.replace(/\//g, '_').replace(/\+/g, '-');
    const txBuilder = factory.getSingleNominatorWithdrawBuilder();
    txBuilder.sender(testData.sender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.sender.publicKey);
    txBuilder.expireTime(1234567890);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setWithdrawAmount('1');
    txBuilder.setWithdrawMessage();
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SingleNominatorWithdraw);
    should.equal(tx.toJson().bounceable, false);
    should.equal(tx.toJson().withdrawAmount, '1');
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
    tx.id.should.equal(txId);
    const rawTx = tx.toBroadcastFormat();
    console.log(rawTx);
    rawTx.should.equal(
      'te6cckECGAEAA8AAAuGIADZN0H0n1tz6xkYgWqJSRmkURKYajjEgXeawBo9cifPIGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmpoxdJlgLSAAAAAAADgEXAgE0AhYBFP8A9KQT9LzyyAsDAgEgBBECAUgFCALm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQYHAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAkQAgEgCg8CAVgLDAA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA0OABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xITFBUAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjF8DDudwJkyEh7jUbJEjFCjriVxsSlRJFyF872V1eegb4QACJQgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr6A613oAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAEO5rKAIFYXIKQ=='
    );
  });

  it('should build a unsigned withdraw tx with bounceable flag', async function () {
    const txId = '2RHws_jhf1eEKQnl1VjepktDI_Y40to2GqFwEwsdneU='.replace(/\//g, '_').replace(/\+/g, '-');
    const txBuilder = factory.getSingleNominatorWithdrawBuilder();
    txBuilder.sender(testData.sender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.sender.publicKey);
    txBuilder.expireTime(1234567890);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setWithdrawAmount('1');
    txBuilder.setWithdrawMessage();
    txBuilder.bounceable(true);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SingleNominatorWithdraw);
    should.equal(tx.toJson().bounceable, true);
    should.equal(tx.toJson().withdrawAmount, '1');
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
    tx.id.should.equal(txId);
    const rawTx = tx.toBroadcastFormat();
    console.log(rawTx);
    rawTx.should.equal(
      'te6cckECGAEAA8AAAuGIADZN0H0n1tz6xkYgWqJSRmkURKYajjEgXeawBo9cifPIGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmpoxdJlgLSAAAAAAADgEXAgE0AhYBFP8A9KQT9LzyyAsDAgEgBBECAUgFCALm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQYHAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAkQAgEgCg8CAVgLDAA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA0OABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xITFBUAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjF8DDudwJkyEh7jUbJEjFCjriVxsSlRJFyF872V1eegb4QACJYgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr6A613oAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAEO5rKAI8DKNSw=='
    );
  });

  it('should build a withdraw from rawTx', async function () {
    const txBuilder = factory.from(testData.signedTransferTransaction.tx);
    const builtTx = await txBuilder.build();
    const jsonTx = builtTx.toJson();
    should.equal(builtTx.type, TransactionType.SingleNominatorWithdraw);
    should.equal(builtTx.signablePayload.toString('base64'), testData.signedTransferTransaction.signable);
    should.equal(builtTx.id, testData.signedTransferTransaction.txId);
    const builder2 = factory.from(builtTx.toBroadcastFormat());
    const builtTx2 = await builder2.build();
    should.equal(builtTx2.type, TransactionType.SingleNominatorWithdraw);
    should.equal(builtTx.toBroadcastFormat(), testData.signedTransferTransaction.tx);
    builtTx.inputs.length.should.equal(1);
    builtTx.outputs.length.should.equal(1);
    jsonTx.sender.should.equal('EQAbJug-k-tufWMjEC1RKSM0iiJTDUcYkC7zWANHrkT55Fol');
    jsonTx.destination.should.equal('EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG');
    jsonTx.amount.should.equal('10000000');
    jsonTx.seqno.should.equal(6);
    jsonTx.expirationTime.should.equal(1695997582);
    jsonTx.withdrawAmount.should.equal('1');

    const builtTx3 = await txBuilder.bounceable(false).fromAddressBounceable(false).toAddressBounceable(false).build();
    txBuilder.from(testData.signedTransferTransaction.tx);
    const jsonTx3 = builtTx3.toJson();
    should.equal(jsonTx3.bounceable, false);
    should.equal(builtTx3.signablePayload.toString('base64'), testData.signedTransferTransaction.bounceableSignable);
    should.equal(builtTx3.id, testData.signedTransferTransaction.txIdBounceable);
    should.equal(builtTx3.toBroadcastFormat(), testData.signedTransferTransaction.tx);
    jsonTx3.sender.should.equal('UQAbJug-k-tufWMjEC1RKSM0iiJTDUcYkC7zWANHrkT55Afg');
    jsonTx3.destination.should.equal('UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD');
    jsonTx3.amount.should.equal('10000000');
    jsonTx3.seqno.should.equal(6);
    jsonTx3.expirationTime.should.equal(1695997582);
    jsonTx.withdrawAmount.should.equal('1');
  });

  it('should parse a raw transaction and set flags', async function () {
    const factory = new TransactionBuilderFactory(coins.get('tton'));
    const txBuilder = factory.from(testData.signedTransferTransaction.tx);
    const txBuilderBounceable = factory.from(testData.signedTransferTransaction.txBounceable);

    const tx = await txBuilder.build();
    const txBounceable = await txBuilderBounceable.build();
    tx.toJson().bounceable.should.equal(false);
    should.equal(tx.toJson().withdrawAmount, '1');
    txBounceable.toJson().bounceable.should.equal(true);
    should.equal(txBounceable.toJson().withdrawAmount, '1');
  });

  xit('should build a signed withdraw tx and submit onchain', async function () {
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));
    const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey1 });
    const publicKey = keyPair.getKeys().pub;
    const address = await utils.default.getAddressFromPublicKey(publicKey);
    const txBuilder = factory.getSingleNominatorWithdrawBuilder();
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
    txBuilder.send({
      address: 'kf9vYg5iDMPiOpv9ypv9_B7pwYee4wjcQ0SHLpN9V65YF_Ig',
      amount: '100000000',
    });
    txBuilder.setWithdrawAmount('1');
    txBuilder.setWithdrawMessage();
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SingleNominatorWithdraw);
    const signable = tx.signablePayload;
    const signature = keyPair.signMessageinUint8Array(signable);
    const signedTx = await txBuilder.build();
    const builder2 = factory.from(signedTx.toBroadcastFormat());
    builder2.addSignature(keyPair.getKeys(), Buffer.from(signature));
    const tx2 = await builder2.build();
    const signature2 = keyPair.signMessageinUint8Array(tx2.signablePayload);
    should.equal(Buffer.from(signature).toString('hex'), Buffer.from(signature2).toString('hex'));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result = await tonweb.provider.sendBoc(tx2.toBroadcastFormat());
    console.log(JSON.stringify(result));
  });

  it('should build a signed withdraw tx using add signature', async function () {
    const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey1 });
    const publicKey = keyPair.getKeys().pub;
    const address = await utils.default.getAddressFromPublicKey(publicKey);
    const txBuilder = factory.getSingleNominatorWithdrawBuilder();
    txBuilder.sender(address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(publicKey);
    const expireAt = Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7;
    txBuilder.expireTime(expireAt);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setWithdrawAmount('1');
    txBuilder.setWithdrawMessage();
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SingleNominatorWithdraw);
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

  it('should build withdraw tx for non-bounceable address', async function () {
    const txBuilder = factory.getSingleNominatorWithdrawBuilder();
    txBuilder.sender(testData.sender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.sender.publicKey);
    txBuilder.expireTime(1234567890);
    const address = 'EQAWzEKcdnykvXfUNouqdS62tvrp32bCxuKS6eQrS6ISgcLo';
    const otherFormat = 'UQAWzEKcdnykvXfUNouqdS62tvrp32bCxuKS6eQrS6ISgZ8t';
    const amount = '100000000';
    txBuilder.send({ address, amount });
    txBuilder.setWithdrawAmount('1');
    txBuilder.setWithdrawMessage();
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SingleNominatorWithdraw);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.sender.address,
      value: amount,
      coin: 'tton',
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address,
      value: amount,
      coin: 'tton',
    });
    const txJson = tx.toJson();
    txJson.destination.should.equal(address);
    should.equal(tx.toJson().withdrawAmount, '1');
    const builder2 = factory.from(tx.toBroadcastFormat());
    const tx2 = await builder2.build();
    const txJson2 = tx2.toJson();
    txJson2.destinationAlias.should.equal(otherFormat);
    should.equal(tx.toJson().withdrawAmount, '1');
  });
});
