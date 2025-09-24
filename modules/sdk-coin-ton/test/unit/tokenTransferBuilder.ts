import should from 'should';
import TonWeb from 'tonweb';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, KeyPair } from '../../src';
import * as testData from '../resources/ton';
import * as utils from '../../src/lib/utils';

describe('Ton Token Transfer Builder', () => {
  const tokenName = 'tton:ukwny-us';
  const factory = new TransactionBuilderFactory(coins.get(tokenName));
  it('should build a unsigned transfer tx', async function () {
    const txId = testData.signedTokenSendTransaction.txId.replace(/\//g, '_').replace(/\+/g, '-');
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.sender(testData.tokenSender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.tokenSender.publicKey);
    txBuilder.expireTime(testData.tokenSender.expireTime);
    txBuilder.send(testData.tokenRecipients[0]);
    txBuilder.setSenderJettonWalletAddress(testData.tokenSender.jettonAddress);
    txBuilder.setTonAmount(testData.tokenSender.tonAmount); // amount of TON to send to the sender's jetton wallet
    txBuilder.setForwardTonAmount(testData.tokenSender.forwardTonAmount); // amount of TON to cover forward fees in case of notify transfer
    txBuilder.setMessage(testData.tokenSender.message);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SendToken);
    should.equal(tx.toJson().bounceable, false);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.tokenSender.address,
      value: testData.tokenRecipients[0].amount,
      coin: tokenName,
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: testData.tokenRecipients[0].address,
      value: testData.tokenRecipients[0].amount,
      coin: tokenName,
    });
    tx.id.should.equal(txId);
    const rawTx = tx.toBroadcastFormat();
    rawTx.should.equal(testData.signedTokenSendTransaction.tx);
  });

  it('should build a unsigned transfer tx with bounceable flag', async function () {
    const txId = testData.signedTokenSendTransaction.txIdBounceable.replace(/\//g, '_').replace(/\+/g, '-');
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.sender(testData.tokenSender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.tokenSender.publicKey);
    txBuilder.expireTime(testData.tokenSender.expireTime);
    txBuilder.send(testData.tokenRecipients[0]);
    txBuilder.setSenderJettonWalletAddress(testData.tokenSender.jettonAddress);
    txBuilder.setTonAmount(testData.tokenSender.tonAmount); // amount of TON to send to the sender's jetton wallet
    txBuilder.setForwardTonAmount(testData.tokenSender.forwardTonAmount); // amount of TON to cover forward fees in case of notify transfer
    txBuilder.setMessage(testData.tokenSender.message);
    txBuilder.bounceable(true);

    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SendToken);
    should.equal(tx.toJson().bounceable, true);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.tokenSender.address,
      value: testData.tokenRecipients[0].amount,
      coin: tokenName,
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: testData.tokenRecipients[0].address,
      value: testData.tokenRecipients[0].amount,
      coin: tokenName,
    });
    tx.id.should.equal(txId);
    const rawTx = tx.toBroadcastFormat();
    rawTx.should.equal(testData.signedTokenSendTransaction.txBounceable);
  });

  it('should build a send from rawTx', async function () {
    const txBuilder = factory.from(testData.signedTokenSendTransaction.tx);
    const builtTx = await txBuilder.build();
    const jsonTx = builtTx.toJson();
    should.equal(builtTx.type, TransactionType.SendToken);

    should.equal(builtTx.signablePayload.toString('base64'), testData.signedTokenSendTransaction.signable);
    should.equal(builtTx.id, testData.signedTokenSendTransaction.txId);
    const builder2 = factory.from(builtTx.toBroadcastFormat());
    const builtTx2 = await builder2.build();
    should.equal(builtTx2.type, TransactionType.SendToken);
    should.equal(builtTx.toBroadcastFormat(), testData.signedTokenSendTransaction.tx);
    builtTx.inputs.length.should.equal(1);
    builtTx.outputs.length.should.equal(1);
    jsonTx.sender.should.equal('EQCqQzfyg0cZ-8t9v2YoHmFFxG5jgjvQRTZ2yeDjO5z5ZRy9');
    jsonTx.destination.should.equal('EQB-CM6DF-jpq9XVdiSdefAMU5KC1gpZuYBFp-Q65aUhnx5K');
    jsonTx.amount.should.equal(testData.tokenRecipients[0].amount);
    jsonTx.seqno.should.equal(0);
    jsonTx.expirationTime.should.equal(testData.tokenSender.expireTime);

    const builtTx3 = await txBuilder.bounceable(true).fromAddressBounceable(false).toAddressBounceable(false).build();
    txBuilder.from(testData.signedTokenSendTransaction.txBounceable);
    const jsonTx3 = builtTx3.toJson();
    should.equal(jsonTx3.bounceable, true);
    should.equal(builtTx3.signablePayload.toString('base64'), testData.signedTokenSendTransaction.bounceableSignable);
    should.equal(builtTx3.id, testData.signedTokenSendTransaction.txIdBounceable);
    should.equal(builtTx3.toBroadcastFormat(), testData.signedTokenSendTransaction.txBounceable);
    jsonTx3.sender.should.equal(testData.tokenSender.address);
    jsonTx3.destination.should.equal(testData.tokenRecipients[0].address);
    jsonTx3.amount.should.equal(testData.tokenRecipients[0].amount);
    jsonTx3.seqno.should.equal(0);
    jsonTx3.expirationTime.should.equal(testData.tokenSender.expireTime);
  });

  it('should parse a raw transaction and set flags', async function () {
    const factory = new TransactionBuilderFactory(coins.get(tokenName));
    const txBuilder = factory.from(testData.signedTokenSendTransaction.tx);
    const txBuilderBounceable = factory.from(testData.signedTokenSendTransaction.txBounceable);

    const tx = await txBuilder.build();
    const txBounceable = await txBuilderBounceable.build();
    tx.toJson().bounceable.should.equal(false);
    should.equal(tx.type, TransactionType.SendToken);
    txBounceable.toJson().bounceable.should.equal(true);
    should.equal(txBounceable.type, TransactionType.SendToken);
  });

  xit('should build a signed transfer tx and submit onchain', async function () {
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));
    const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey6 });
    const publicKey = keyPair.getKeys().pub;
    const address = await utils.default.getAddressFromPublicKey(publicKey);
    const txBuilder = factory.getTokenTransferBuilder();
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
      address: testData.tokenRecipients[0].address,
      amount: '1000000000',
    });
    txBuilder.setSenderJettonWalletAddress(testData.tokenSender.jettonAddress);
    txBuilder.setTonAmount('500000000'); // amount of TON to send to the sender's jetton wallet
    txBuilder.setForwardTonAmount('100000000'); // amount of TON to cover forward fees in case of notify transfer
    txBuilder.setMessage('test');

    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SendToken);
    const signable = tx.signablePayload;
    const signature = keyPair.signMessageinUint8Array(signable);
    const signedTx = await txBuilder.build();

    const builder2 = factory.from(signedTx.toBroadcastFormat());
    builder2.addSignature(keyPair.getKeys(), Buffer.from(signature));
    const tx2 = await builder2.build();
    const signature2 = keyPair.signMessageinUint8Array(tx2.signablePayload);
    should.equal(Buffer.from(signature).toString('hex'), Buffer.from(signature2).toString('hex'));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const result = await tonweb.provider.sendBoc(tx2.toBroadcastFormat());
      console.log('Network Response:', result);
    } catch (error) {
      console.error('Error Response:', error);
    }
  });

  it('should build a signed transfer tx using add signature', async function () {
    const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey6 });
    const publicKey = keyPair.getKeys().pub;
    const address = await utils.default.getAddressFromPublicKey(publicKey);
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.sender(address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(publicKey);
    const expireAt = Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7;
    txBuilder.expireTime(expireAt);
    txBuilder.send(testData.tokenRecipients[0]);
    txBuilder.setSenderJettonWalletAddress(testData.tokenSender.jettonAddress);
    txBuilder.setTonAmount(testData.tokenSender.tonAmount); // amount of TON to send to the sender's jetton wallet
    txBuilder.setForwardTonAmount(testData.tokenSender.forwardTonAmount); // amount of TON to cover forward fees in case of notify transfer
    txBuilder.setMessage(testData.tokenSender.message);

    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SendToken);
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

  it('should build transfer tx for non-bounceable address', async function () {
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.sender(testData.tokenSender.address);
    txBuilder.sequenceNumber(0);
    txBuilder.publicKey(testData.tokenSender.publicKey);
    txBuilder.expireTime(testData.tokenSender.expireTime);
    const address = 'EQAWzEKcdnykvXfUNouqdS62tvrp32bCxuKS6eQrS6ISgcLo';
    const otherFormat = 'UQAWzEKcdnykvXfUNouqdS62tvrp32bCxuKS6eQrS6ISgZ8t';
    const amount = testData.tokenRecipients[0].amount;
    txBuilder.send({ address, amount });

    txBuilder.setSenderJettonWalletAddress(testData.tokenSender.jettonAddress);
    txBuilder.setTonAmount(testData.tokenSender.tonAmount); // amount of TON to send to the sender's jetton wallet
    txBuilder.setForwardTonAmount(testData.tokenSender.forwardTonAmount); // amount of TON to cover forward fees in case of notify transfer
    txBuilder.setMessage(testData.tokenSender.message);

    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.SendToken);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: testData.tokenSender.address,
      value: amount,
      coin: tokenName,
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address,
      value: amount,
      coin: tokenName,
    });
    const txJson = tx.toJson();
    txJson.destination.should.equal(address);
    txJson.destinationAlias.should.equal(otherFormat);

    const builder2 = factory.from(tx.toBroadcastFormat());
    const tx2 = await builder2.build();
    const txJson2 = tx2.toJson();
    txJson2.destinationAlias.should.equal(otherFormat);
  });
});
