import { Stx, Tstx } from '../../../../src/v2/coins/';
import * as accountLib from '@bitgo/account-lib';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as testData from '../../fixtures/coins/stx';

describe('STX:', function() {
  let bitgo;
  let basecoin;

  const badValidAddresses = [
    '',
    null,
    'abc',
    'SP244HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
    'ST1T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
  ];
  const badVerifyAddresses = [
    ...badValidAddresses,
    'SB1DP9Q0QPPKB07FK79MQE0CDJAYEFSGFVXE1KZ8X',
    'SYB44HYPYAT2BB2QE513NSP81HTMYWBJP2Q9N4TN',
    'S32T758K6T2YRKG9Q0TJ16B6FP5QQREWZSE461MK8'
  ];

  const goodAddresses = [
    'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
    'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y',
    'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
    'SM3W5QFWGPG1JC8R25EVZDEP3BESJZ831JPNNQFTZ',
  ];

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tstx');
  });

  /**
   * Build an unsigned account-lib signle-signature send transaction
   * @param destination The destination address of the transaction
   * @param amount The amount to send to the recipient
   */
  const buildUnsignedTransaction = async function({
    destination,
    amount = '100000',
    publicKey,
    memo = '',
  }) {
    const factory = accountLib.register('stx', accountLib.Stx.TransactionBuilderFactory);
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({
      fee: '180',
    });
    txBuilder.to(destination);
    txBuilder.amount(amount);
    txBuilder.nonce(1);
    txBuilder.fromPubKey(publicKey);
    txBuilder.memo(memo);
    return await txBuilder.build();
  };

  /**
   * Build an unsigned account-lib multi-signature send transaction
   * @param destination The destination address of the transaction
   * @param amount The amount to send to the recipient
   */
  const buildmultiSigUnsignedTransaction = async function({
    destination,
    amount = '100000',
    publicKeys,
    memo = '',
  }) {
    const factory = accountLib.register('stx', accountLib.Stx.TransactionBuilderFactory);
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({
      fee: '180',
    });
    txBuilder.to(destination);
    txBuilder.amount(amount);
    txBuilder.nonce(1);
    txBuilder.fromPubKey(publicKeys);
    txBuilder.numberSignatures(2);
    txBuilder.memo(memo);
    return await txBuilder.build();
  };

  it('should instantiate the coin', function() {
    let localBasecoin = bitgo.coin('tstx');
    localBasecoin.should.be.an.instanceof(Tstx);

    localBasecoin = bitgo.coin('stx');
    localBasecoin.should.be.an.instanceof(Stx);
  });


  it('should check valid addresses', (function() {
    badValidAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); });
    goodAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(true); });
  }));

  it('should verify addresses', (function() {
    goodAddresses.map(address => { basecoin.verifyAddress({ address }).should.equal(true); });
    badVerifyAddresses.map(address => (() => basecoin.verifyAddress({ address })).should.throw());
  }));

  it('should explain a transfer transaction', async function() {
    const explain = await basecoin.explainTransaction({
      txHex: testData.txForExplainTransfer,
      feeInfo: { fee: '' },
    });
    explain.id.should.equal(testData.txExplainedTransfer.id);
    explain.outputAmount.should.equal(testData.txExplainedTransfer.outputAmount);
    explain.outputs[0].amount.should.equal(testData.txExplainedTransfer.outputAmount);
    explain.outputs[0].address.should.equal(testData.txExplainedTransfer.recipient);
    explain.outputs[0].memo.should.equal(testData.txExplainedTransfer.memo);
    explain.fee.should.equal(testData.txExplainedTransfer.fee);
    explain.changeAmount.should.equal('0');
  });

  it('should explain an unsigned transaction', async function() {
    const key = new accountLib.Stx.KeyPair();
    const destination = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const amount = '100000';
    const memo = 'i cannot be broadcast';

    const unsignedTransaction = await buildUnsignedTransaction({
      destination,
      amount,
      publicKey: key.getKeys().pub,
      memo: memo,
    });
    const unsignedHex = unsignedTransaction.toBroadcastFormat();

    const explain = await basecoin.explainTransaction({
      txHex: unsignedHex,
      publicKeys: [key.getKeys().pub],
      feeInfo: { fee: '' },
    });

    explain.memo.should.equal(accountLib.Stx.Utils.padMemo(memo));
    explain.outputs[0].amount.should.equal(amount);
    explain.outputs[0].address.should.equal(destination);
  });

  it('should explain unsigned transfer transaction hex', async function() {
    const explain = await basecoin.explainTransaction({
      txHex: testData.unsignedTxForExplainTransfer,
      publicKeys: ['03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795f3e833da41'],
      feeInfo: { fee: '' },
    });
    explain.outputAmount.should.equal(testData.unsignedTxExplainedTransfer.outputAmount);
    explain.outputs[0].amount.should.equal(testData.unsignedTxExplainedTransfer.outputAmount);
    explain.outputs[0].address.should.equal(testData.unsignedTxExplainedTransfer.recipient);
    explain.outputs[0].memo.should.equal(testData.unsignedTxExplainedTransfer.memo);
    explain.fee.should.equal(testData.unsignedTxExplainedTransfer.fee);
    explain.changeAmount.should.equal('0');
  });


  it('should explain a contract call transaction', async function() {
    const explain = await basecoin.explainTransaction({
      txHex: testData.txForExplainContract,
      feeInfo: { fee: '' },
    });
    explain.id.should.equal(testData.txExplainedContract.id);
    explain.fee.should.equal(testData.txExplainedContract.fee);
    explain.contractAddress.should.equal(testData.txExplainedContract.contractAddress);
    explain.contractName.should.equal(testData.txExplainedContract.contractName);
    explain.contractFunction.should.equal(testData.txExplainedContract.functionName);
    explain.contractFunctionArgs[0].type.should.equal(testData.txExplainedContract.functionArgs[0].type);
    explain.contractFunctionArgs[0].value.should.equal(testData.txExplainedContract.functionArgs[0].value);
  });


  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function() {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f24bab7dd0c2af7f107416ef858ff79b0670c72406dad064e72bb17fc0a9038bb';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.pub.should.equal('xpub661MyMwAqRbcFAwqvSGbk35kJf7CQqdN1w4CMUBBTqH5e3ivjU6D8ugv9hRSgRbRenC4w3ahXdLVahwjgjXhSuQKMdNdn55Y9TNSagBktws');
      keyPair.prv.should.equal('xprv9s21ZrQH143K2gsNpQjbNu91kdGi1NuWei8bZ5mZuVk6mFPnBvmxb7NSJQdbZW3FGpK3Ycn7jorAXcEzMvviGtbyBz5tBrjfnWyQp3g75FK');
    });
  });

  describe('Sign transaction:', () => {
    it('should sign transaction', async function() {
      const key = new accountLib.Stx.KeyPair({ prv: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
      const destination = 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0';
      const amount = '100000';

      const unsignedTransaction = await buildUnsignedTransaction({
        destination,
        amount,
        publicKey: key.getKeys().pub,
      });
      const tx = await basecoin.signTransaction({
        prv: key.getKeys().prv!.toString(),
        pubKeys: [key.getKeys().pub],
        txPrebuild: {
          txHex: unsignedTransaction.toBroadcastFormat(),
        },
      });
      const factory = accountLib.register('stx', accountLib.Stx.TransactionBuilderFactory);
      const txBuilder = factory.from(tx.txHex);
      const signedTx = await txBuilder.build();
      const txJson = signedTx.toJson();
      txJson.payload.to.should.equal(destination);
      txJson.payload.amount.should.equal(amount);
      signedTx.signature.length.should.equal(1);
    });

    it('should sign multisig transaction', async function() {
      const key1 = new accountLib.Stx.KeyPair({ prv: '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601' });
      const key2 = new accountLib.Stx.KeyPair({ prv: 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01' });
      const key3 = new accountLib.Stx.KeyPair({ prv: 'e75dcb66f84287eaf347955e94fa04337298dbd95aa0dbb985771104ef1913db01' });
      const destination = 'STDE7Y8HV3RX8VBM2TZVWJTS7ZA1XB0SSC3NEVH0';
      const amount = '100000';
      const publicKeys = [key1.getKeys(true).pub, key2.getKeys(true).pub, key3.getKeys(true).pub];
      const unsignedTransaction = await buildmultiSigUnsignedTransaction({
        destination,
        amount,
        publicKeys,
      });
      const tx = await basecoin.signTransaction({
        prv: ['21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601', 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01'],
        pubKeys: [key1.getKeys().pub, key2.getKeys().pub, key3.getKeys().pub],
        numberSignature: 2,
        txPrebuild: {
          txHex: unsignedTransaction.toBroadcastFormat(),
        },
      });
      const factory = accountLib.register('stx', accountLib.Stx.TransactionBuilderFactory);
      const txBuilder = factory.from(tx.txHex);
      const signedTx = await txBuilder.build();
      const txJson = signedTx.toJson();
      txJson.payload.to.should.equal(destination);
      txJson.payload.amount.should.equal(amount);
    });
  });
});
