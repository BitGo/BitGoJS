import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Xtz, Txtz, XtzLib } from '../../src';
import {
  dataToSign,
  fullySignedHex,
  fullySignedTransactionWithTwoTransfersHex,
  oneSignatureHex,
  twoSignatureHex,
  unsignedHex,
  unsignedTransactionWithTwoTransfersHex,
} from '../fixtures';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('xtz', Xtz.createInstance);
bitgo.safeRegister('txtz', Txtz.createInstance);

describe('Tezos:', function () {
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txtz');
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('xtz');
    basecoin.should.be.an.instanceof(Xtz);
  });

  it('explain an unsigned transfer transaction', async function () {
    const explainParams = {
      halfSigned: {
        txHex: unsignedTransactionWithTwoTransfersHex,
      },
      feeInfo: { fee: 1 },
    };
    const explanation = await basecoin.explainTransaction(explainParams);
    explanation.id.should.equal('');
    explanation.outputs.length.should.equal(2);
    explanation.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
    explanation.outputs[0].value.should.equal('100');
    explanation.outputs[1].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
    explanation.outputs[1].value.should.equal('100');
    explanation.outputAmount.should.equal('200');
    explanation.changeAmount.should.equal('0');
    explanation.changeOutputs.length.should.equal(0);
    explanation.fee.fee.should.equal(1);
  });

  it('explain a signed transfer transaction', async function () {
    const explainParams = {
      txHex: fullySignedTransactionWithTwoTransfersHex,
      feeInfo: { fee: 1 },
    };
    const explanation = await basecoin.explainTransaction(explainParams);
    explanation.id.should.equal('onyGaWs6z4bVVcfn3h9KbBrktEhuDyJLYEVB4aJRM6YNngjDxE4');
    explanation.outputs.length.should.equal(2);
    explanation.outputs[0].address.should.equal('KT1HUrt6kfvYyDEYCJ2GSjvTPZ6KmRfxLBU8');
    explanation.outputs[0].value.should.equal('100');
    explanation.outputs[1].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
    explanation.outputs[1].value.should.equal('100');
    explanation.outputAmount.should.equal('200');
    explanation.changeAmount.should.equal('0');
    explanation.changeOutputs.length.should.equal(0);
    explanation.fee.fee.should.equal(1);
  });

  it('should sign an unsigned transaction with a Tezos private key', async function () {
    const signTxOptions = {
      prv: 'xprv9s21ZrQH143K2vpv9Z5GppJtVsT6nBFWDRnA2PKTHaJobNGbhC9MR7shQCQ79jJNZvcxw6YzFTEiwxg3E6Tjo5RR7nKb2dp8r1zdKDG3w1o',
      txPrebuild: {
        txHex: unsignedHex,
        source: 'tz2HGMx8YxPSLguVP6usgf1D8UALPLchLoSX',
        dataToSign: dataToSign,
        addressInfo: {
          address: 'tz2HGMx8YxPSLguVP6usgf1D8UALPLchLoSX',
          chain: 0,
          index: 0,
        },
      },
    };
    const tx = await basecoin.signTransaction(signTxOptions);
    tx.halfSigned.txHex.should.equal(oneSignatureHex);
  });

  it('should sign with a half signed transaction with a Tezos private key', async function () {
    const signTxOptions = {
      prv: 'xprv9s21ZrQH143K2EHDvGaG86MLjU9bW52eEoqMKakkEYc7rM8KDC28FPMcbiwDYX3jjh2mDjFE4Bm37QqMvm4icdW7CAH7LH8jKDF3LXNbRbz',
      txPrebuild: {
        txHex: oneSignatureHex,
        source: 'tz28XZQ1dRm17RLKM9ayhhp2dVvCGvpPhVyB',
        dataToSign: dataToSign,
        addressInfo: {
          address: 'tz28XZQ1dRm17RLKM9ayhhp2dVvCGvpPhVyB',
          chain: 0,
          index: 0,
        },
      },
    };
    const tx = await basecoin.signTransaction(signTxOptions);
    tx.halfSigned.txHex.should.equal(twoSignatureHex);
  });

  it('should sign with a fee account a fully signed transaction', async function () {
    const signTxOptions = {
      prv: 'xprv9s21ZrQH143K2dseae8JccdEANb1jSfx7Pr8zpKq9uW1Nyh8LD8Uizn6CttWNwJ9S9xJtP3nWda2RoQjTp75HdSyTPnUgdANo2sgpPrcMwm',
      txPrebuild: {
        txHex: twoSignatureHex,
        source: 'tz2SsfYjnEmm6E6eb6BxHNqsbGk4i9EsKSTE',
        addressInfo: {
          address: 'tz2SsfYjnEmm6E6eb6BxHNqsbGk4i9EsKSTE',
          chain: 0,
          index: 0,
        },
      },
    };
    const tx = await basecoin.signTransaction(signTxOptions);
    tx.halfSigned.txHex.should.equal(fullySignedHex);
  });

  it('should check valid addresses', function () {
    const badAddresses = [
      '',
      null,
      'xxxx',
      'YZ09fd-',
      '412C2BA4A9FF6C53207DC5B686BFECF75EA7B805772',
      '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80',
      'TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLLZ',
    ];
    const goodAddresses = [
      'tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A',
      'tz29yN7c5zrmK9ZhA1VjYwVokN9ZBn8YbCuE',
      'KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL',
    ];

    badAddresses.map((addr) => {
      basecoin.isValidAddress(addr).should.equal(false);
    });
    goodAddresses.map((addr) => {
      basecoin.isValidAddress(addr).should.equal(true);
    });
  });

  it('should throw if the params object is missing parameters', async function () {
    const explainParams = {
      feeInfo: { fee: 1 },
      txHex: null,
    };
    await basecoin.explainTransaction(explainParams).should.be.rejectedWith('missing explain tx parameters');
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should generate a keypair from a seed', function () {
      const seedText =
        '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f24bab7dd0c2af7f107416ef858ff79b0670c72406dad064e72bb17fc0a9038bb';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.pub.should.equal(
        'xpub661MyMwAqRbcFAwqvSGbk35kJf7CQqdN1w4CMUBBTqH5e3ivjU6D8ugv9hRSgRbRenC4w3ahXdLVahwjgjXhSuQKMdNdn55Y9TNSagBktws'
      );
      keyPair.prv.should.equal(
        'xprv9s21ZrQH143K2gsNpQjbNu91kdGi1NuWei8bZ5mZuVk6mFPnBvmxb7NSJQdbZW3FGpK3Ycn7jorAXcEzMvviGtbyBz5tBrjfnWyQp3g75FK'
      );
    });
  });

  describe('Sign message:', () => {
    it('should sign and validate a string message', async function () {
      const keyPair = basecoin.generateKeyPair();
      const message = 'hello world';
      const signature = await basecoin.signMessage(keyPair, message);

      const messageHex = Buffer.from(message).toString('hex');
      const sig = Buffer.from(signature, 'hex').toString();
      const publicKey = new XtzLib.KeyPair({ pub: keyPair.pub });
      const isValid = await XtzLib.Utils.verifySignature(messageHex, publicKey.getKeys().pub, sig);
      isValid.should.equal(true);
    });

    it('should fail to validate a string message with wrong public key', async function () {
      const keyPair = basecoin.generateKeyPair();
      const message = 'hello world';
      const signature = await basecoin.signMessage(keyPair, message);

      const messageHex = Buffer.from(message).toString('hex');

      const sig = Buffer.from(signature, 'hex').toString();
      const publicKey = new XtzLib.KeyPair();
      const isValid = await XtzLib.Utils.verifySignature(messageHex, publicKey.getKeys().pub, sig);
      isValid.should.equal(false);
    });
  });
});
