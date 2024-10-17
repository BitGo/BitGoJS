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
  const singleNominatorWithdrawAmount = '932178112330000';
  it('should build a unsigned withdraw tx', async function () {
    const txId = 'n1rr-QL61WZ7UJN7ESH2iPQO7toTy9WLqXoSIG1JtXg='.replace(/\//g, '_').replace(/\+/g, '-');
    const txBuilder = factory.getSingleNominatorWithdrawBuilder();
    txBuilder.sender(testData.sender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.sender.publicKey);
    txBuilder.expireTime(1234567890);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setWithdrawAmount(singleNominatorWithdrawAmount);
    txBuilder.setWithdrawMessage();
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SingleNominatorWithdraw);
    should.equal(tx.toJson().bounceable, false);
    should.equal(tx.toJson().withdrawAmount, singleNominatorWithdrawAmount);
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
    factory.from(rawTx);
    rawTx.should.equal(
      'te6cckECGAEAA8MAAuGIADZN0H0n1tz6xkYgWqJSRmkURKYajjEgXeawBo9cifPIGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmpoxdJlgLSAAAAAAADgEXAgE0AhYBFP8A9KQT9LzyyAsDAgEgBBECAUgFCALm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQYHAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAkQAgEgCg8CAVgLDAA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA0OABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xITFBUAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjF8DDudwJkyEh7jUbJEjFCjriVxsSlRJFyF872V1eegb4QACPQgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr6A613oAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAHA0/PoUC5EIEyWuPg=='
    );
  });

  it('should build a unsigned withdraw tx with bounceable flag', async function () {
    const txId = 'YS3RFHZx_SKyanFNjGlvtDmx6I02deAQUJUSyVP9rag='.replace(/\//g, '_').replace(/\+/g, '-');
    const txBuilder = factory.getSingleNominatorWithdrawBuilder();
    txBuilder.sender(testData.sender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.sender.publicKey);
    txBuilder.expireTime(1234567890);
    txBuilder.send(testData.recipients[0]);
    txBuilder.setWithdrawAmount(singleNominatorWithdrawAmount);
    txBuilder.setWithdrawMessage();
    txBuilder.bounceable(true);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SingleNominatorWithdraw);
    should.equal(tx.toJson().bounceable, true);
    should.equal(tx.toJson().withdrawAmount, singleNominatorWithdrawAmount);
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
    rawTx.should.equal(
      'te6cckECGAEAA8MAAuGIADZN0H0n1tz6xkYgWqJSRmkURKYajjEgXeawBo9cifPIGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmpoxdJlgLSAAAAAAADgEXAgE0AhYBFP8A9KQT9LzyyAsDAgEgBBECAUgFCALm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQYHAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAkQAgEgCg8CAVgLDAA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA0OABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xITFBUAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjF8DDudwJkyEh7jUbJEjFCjriVxsSlRJFyF872V1eegb4QACPYgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr6A613oAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAHA0/PoUC5EIBDddHQ=='
    );
  });

  it('should build a withdraw from rawTx', async function () {
    const txBuilder = factory.from(testData.signedSingleNominatorWithdrawTransaction.tx);
    const builtTx = await txBuilder.build();
    const jsonTx = builtTx.toJson();
    should.equal(builtTx.type, TransactionType.SingleNominatorWithdraw);
    should.equal(
      builtTx.signablePayload.toString('base64'),
      testData.signedSingleNominatorWithdrawTransaction.signable
    );
    should.equal(builtTx.id, testData.signedSingleNominatorWithdrawTransaction.txId);
    const builder2 = factory.from(builtTx.toBroadcastFormat());
    const builtTx2 = await builder2.build();
    should.equal(builtTx2.type, TransactionType.SingleNominatorWithdraw);
    should.equal(builtTx.toBroadcastFormat(), testData.signedSingleNominatorWithdrawTransaction.tx);
    builtTx.inputs.length.should.equal(1);
    builtTx.outputs.length.should.equal(1);
    jsonTx.sender.should.equal('EQAbJug-k-tufWMjEC1RKSM0iiJTDUcYkC7zWANHrkT55Fol');
    jsonTx.destination.should.equal('EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG');
    jsonTx.amount.should.equal('123400000');
    jsonTx.seqno.should.equal(0);
    jsonTx.expirationTime.should.equal(1234567890);
    jsonTx.withdrawAmount.should.equal(singleNominatorWithdrawAmount);

    const builtTx3 = await txBuilder.bounceable(false).fromAddressBounceable(false).toAddressBounceable(false).build();
    txBuilder.from(testData.signedSingleNominatorWithdrawTransaction.tx);
    const jsonTx3 = builtTx3.toJson();
    should.equal(jsonTx3.bounceable, false);
    should.equal(
      builtTx3.signablePayload.toString('base64'),
      testData.signedSingleNominatorWithdrawTransaction.bounceableSignable
    );
    should.equal(builtTx3.id, testData.signedSingleNominatorWithdrawTransaction.txIdBounceable);
    should.equal(builtTx3.toBroadcastFormat(), testData.signedSingleNominatorWithdrawTransaction.tx);
    jsonTx3.sender.should.equal('UQAbJug-k-tufWMjEC1RKSM0iiJTDUcYkC7zWANHrkT55Afg');
    jsonTx3.destination.should.equal('UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD');
    jsonTx3.amount.should.equal('123400000');
    jsonTx3.seqno.should.equal(0);
    jsonTx3.expirationTime.should.equal(1234567890);
    jsonTx.withdrawAmount.should.equal(singleNominatorWithdrawAmount);
  });

  it('should parse a raw transaction and set flags', async function () {
    const factory = new TransactionBuilderFactory(coins.get('tton'));
    const txBuilder = factory.from(testData.signedSingleNominatorWithdrawTransaction.tx);
    const txBuilderBounceable = factory.from(testData.signedSingleNominatorWithdrawTransaction.txBounceable);

    const tx = await txBuilder.build();
    const txBounceable = await txBuilderBounceable.build();
    tx.toJson().bounceable.should.equal(false);
    should.equal(tx.toJson().withdrawAmount, singleNominatorWithdrawAmount);
    txBounceable.toJson().bounceable.should.equal(true);
    should.equal(txBounceable.toJson().withdrawAmount, singleNominatorWithdrawAmount);
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
    console.log(result);
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
    txBuilder.setWithdrawAmount(singleNominatorWithdrawAmount);
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
    should.equal(tx.toJson().withdrawAmount, singleNominatorWithdrawAmount);
    const builder2 = factory.from(tx.toBroadcastFormat());
    const tx2 = await builder2.build();
    const txJson2 = tx2.toJson();
    txJson2.destinationAlias.should.equal(otherFormat);
    should.equal(tx.toJson().withdrawAmount, singleNominatorWithdrawAmount);
  });
});
