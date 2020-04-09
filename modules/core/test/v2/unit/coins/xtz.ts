import * as Promise from 'bluebird';
import { Xtz } from '../../../../src/v2/coins/';
import * as bitgoAccountLib from '@bitgo/account-lib';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';
import {
  dataToSign,
  fullySignedHex, fullySignedTransactionWithTwoTransfersHex,
  oneSignatureHex, twoSignatureHex, unsignedHex,
  unsignedTransactionWithTwoTransfersHex
} from "../../fixtures/coins/xtz";

describe('Tezos:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txtz');
  });

  it('should instantiate the coin', function() {
    const basecoin = bitgo.coin('xtz');
    basecoin.should.be.an.instanceof(Xtz);
  });

  it('explain an unsigned transfer transaction', co(function *() {
    const explainParams = {
      halfSigned: {
        txHex: unsignedTransactionWithTwoTransfersHex
      },
      feeInfo: { fee: 1 },
    };
    const explanation = yield basecoin.explainTransaction(explainParams);
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
  }));

  it('explain a signed transfer transaction', co(function *() {
    const explainParams = {
      txHex: fullySignedTransactionWithTwoTransfersHex,
      feeInfo: { fee: 1 },
    };
    const explanation = yield basecoin.explainTransaction(explainParams);
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
  }));

  it('should sign an unsigned transaction with a Tezos private key', co(function *() {
    const signTxOptions = {
      prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL',
      txPrebuild: {
        txHex: unsignedHex,
        source: 'tz2F2pwk4AKjVGf8aNsWmj5e3LZ8Wokf1gEs',
        dataToSign: dataToSign,
      },
    };
    const tx = yield basecoin.signTransaction(signTxOptions);
    tx.halfSigned.txHex.should.equal(oneSignatureHex);
  }));

  it('should sign with a half signed transaction with a Tezos private key', co(function *() {
    const signTxOptions = {
      prv: 'spsk2VW5XpNuELWK1E6rQCCiuwCGyN2zKoNqw4TW8bMkCjPBshMPxb',
      txPrebuild: {
        txHex: oneSignatureHex,
        source: 'tz2F2pwk4AKjVGf8aNsWmj5e3LZ8Wokf1gEs',
        dataToSign: dataToSign,
      },
    };
    const tx = yield basecoin.signTransaction(signTxOptions);
    tx.halfSigned.txHex.should.equal(twoSignatureHex);
  }));

  it('should sign with a fee account a fully signed transaction', co(function *() {
    const signTxOptions = {
      prv: 'spsk2CMCo1Xk35Dt1Qu4fKtzUREyMbwtT3U1rVgrjiB1JbrQBs5juy',
      txPrebuild: {
        txHex: twoSignatureHex,
        source: 'tz2F2pwk4AKjVGf8aNsWmj5e3LZ8Wokf1gEs',
      },
    };
    const tx = yield basecoin.signTransaction(signTxOptions);
    tx.halfSigned.txHex.should.equal(fullySignedHex);
  }));

  it('should check valid addresses', co(function *() {
    const badAddresses = [ '', null, 'xxxx', 'YZ09fd-', '412C2BA4A9FF6C53207DC5B686BFECF75EA7B805772', '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80', 'TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLLZ' ];
    const goodAddresses = [ 'tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A', 'tz29yN7c5zrmK9ZhA1VjYwVokN9ZBn8YbCuE', 'KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL'];

    badAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); });
    goodAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(true); });
  }));

  it('should throw if the params object is missing parameters', co(function *() {
    const explainParams = {
      feeInfo: { fee: 1 },
      txHex: null,
    };
    yield basecoin.explainTransaction(explainParams).should.be.rejectedWith('missing explain tx parameters');
  }));

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should generate a keypair from a seed', function() {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f24bab7dd0c2af7f107416ef858ff79b0670c72406dad064e72bb17fc0a9038bb';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.pub.should.equal('sppk7bJUTTikwyNHT5n8ehzgSjgCou53Wmm1z81p6JvNTQ5oUuWEW8o');
      keyPair.prv.should.equal('spsk1fKc5fEaM7ns4JkmozPU9QCkXUHHLj48Wyiap2PvewMo595e9X');
    });
  });

  describe('Sign message:', () => {
    it('should sign and validate a string message', co(function *() {
      const keyPair = basecoin.generateKeyPair();
      const message = 'hello world';
      const signature = yield basecoin.signMessage(keyPair, message);

      const messageHex = new Buffer(message).toString('hex');
      const sig = Buffer.from(signature, 'hex').toString();
      const publicKey = new bitgoAccountLib.Xtz.KeyPair({ pub: keyPair.pub });
      const isValid = yield bitgoAccountLib.Xtz.Utils.verifySignature(messageHex, publicKey.getKeys().pub, sig);
      isValid.should.equal(true);
    }));

    it('should fail to validate a string message with wrong public key', co(function *() {
      const keyPair = basecoin.generateKeyPair();
      const message = 'hello world';
      const signature = yield basecoin.signMessage(keyPair, message);

      const messageHex = new Buffer(message).toString('hex');

      const sig = Buffer.from(signature, 'hex').toString();
      const publicKey = new bitgoAccountLib.Xtz.KeyPair();
      const isValid = yield bitgoAccountLib.Xtz.Utils.verifySignature(messageHex, publicKey.getKeys().pub, sig);
      isValid.should.equal(false);
    }));
  });
});
