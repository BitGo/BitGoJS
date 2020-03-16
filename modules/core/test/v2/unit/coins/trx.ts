import * as Promise from 'bluebird';
import { Trx } from '../../../../src/v2/coins/';
import * as bitgoAccountLib from '@bitgo/account-lib';
import { signTxOptions, mockTx } from '../../fixtures/coins/trx';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';

describe('TRON:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ttrx');
  });

  it('should instantiate the coin', function() {
    const basecoin = bitgo.coin('trx');
    basecoin.should.be.an.instanceof(Trx);
  });

  it('explain a txHex', co(function *() {
    const txHex = JSON.stringify(mockTx);
    const explainParams = {
      txHex,
      feeInfo: { fee: 1 },
      txID: mockTx.txID,
    };
    const explanation = yield basecoin.explainTransaction(explainParams);
    const toAddress = bitgoAccountLib.Trx.Utils.getBase58AddressFromHex(mockTx.raw_data.contract[0].parameter.value.to_address);
    explanation.id.should.equal(mockTx.txID);
    explanation.outputs.length.should.equal(1);
    explanation.outputs[0].amount.should.equal('10');
    explanation.outputs[0].address.should.equal(toAddress);
    explanation.outputAmount.should.equal('10');
    explanation.changeAmount.should.equal('0');
    explanation.changeOutputs.length.should.equal(0);
    explanation.fee.fee.should.equal(1);
    explanation.expiration.should.equal(mockTx.raw_data.expiration);
    explanation.timestamp.should.equal((mockTx.raw_data.timestamp));
  }));

  it('should check valid addresses', co(function *() {
    const badAddresses = [ '', null, 'xxxx', 'YZ09fd-', '412C2BA4A9FF6C53207DC5B686BFECF75EA7B805772', '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80', 'TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLLZ' ];
    const goodAddresses = [ 'TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLp', 'TPcf5jtYUhCN1X14tN577zF4NepbDZbxT7', '41E0C0F581D7D02D40826C1C6CBEE71F625D6344D0', '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80577' ];

    badAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); })
    goodAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(true); })
  }));

  it('should throw if the params object is missing parameters', co(function *() {
    const explainParams = {
      feeInfo: { fee: 1 },
      txID: mockTx.txID,
      txHex: null,
    };
    yield basecoin.explainTransaction(explainParams).should.be.rejectedWith('missing explain tx parameters');
  }));

  it('explain an half-signed/fully signed transaction', co(function *() {
    const txHex = JSON.stringify(mockTx);
    const explainParams = {
      halfSigned: { txHex },
      feeInfo: { fee: 1 },
      txID: mockTx.txID,
    };
    const explanation = yield basecoin.explainTransaction(explainParams);
    const toAddress = bitgoAccountLib.Trx.Utils.getBase58AddressFromHex(mockTx.raw_data.contract[0].parameter.value.to_address);
    explanation.id.should.equal(mockTx.txID);
    explanation.outputs.length.should.equal(1);
    explanation.outputs[0].amount.should.equal('10');
    explanation.outputs[0].address.should.equal(toAddress);
    explanation.outputAmount.should.equal('10');
    explanation.changeAmount.should.equal('0');
    explanation.changeOutputs.length.should.equal(0);
    explanation.fee.fee.should.equal(1);
    explanation.expiration.should.equal(mockTx.raw_data.expiration);
    explanation.timestamp.should.equal((mockTx.raw_data.timestamp));
  }));

  it('should sign a half signed tx', co(function *() {
    const tx = yield basecoin.signTransaction(signTxOptions);
    const unsignedTxJson = JSON.parse(signTxOptions.txPrebuild.txHex);
    const signedTxJson = JSON.parse(tx.halfSigned.txHex);

    signedTxJson.txID.should.equal(unsignedTxJson.txID);
    signedTxJson.raw_data_hex.should.equal(unsignedTxJson.raw_data_hex);
    JSON.stringify(signedTxJson.raw_data).should.eql(JSON.stringify(unsignedTxJson.raw_data));
    signedTxJson.signature.length.should.equal(1);
    signedTxJson.signature[0].should.equal('0a9944316924ec7fba4895f1ea1e7cc95f9e2b828ae268a48a8dbeddef40c6f5e127170a95aed9f3f5425b13058d0cb6ef1f5c2213190e482e87043691f22e6800');
  }));

  it('should sign with an Xprv a half signed tx', co(function *() {
    const p = {
      prv: 'xprv9s21ZrQH143K2sg2Cukk5XqLQdrYnMCDah3y1FFVy6Hz9bQfqMSfmUiHPVHKhcUyft3N1emE5FudJVxgFm5N12MAg5o7DTPsDATTkwNgr73',
      txPrebuild: {
        txHex: signTxOptions.txPrebuild.txHex,
      },
    };
    const tx = yield basecoin.signTransaction(p);
    const unsignedTxJson = JSON.parse(signTxOptions.txPrebuild.txHex);
    const signedTxJson = JSON.parse(tx.halfSigned.txHex);

    signedTxJson.txID.should.equal(unsignedTxJson.txID);
    signedTxJson.raw_data_hex.should.equal(unsignedTxJson.raw_data_hex);
    JSON.stringify(signedTxJson.raw_data).should.eql(JSON.stringify(unsignedTxJson.raw_data));
    signedTxJson.signature.length.should.equal(1);
    signedTxJson.signature[0].should.equal('65e56f53a458c6f82d1ef39b2cf5be685a906ad22bb02699f907fcb72ef26f1e91cfc2b6a43bf5432faa0b63bdc5aebf1dc2f49a675d28d23fd7e038b3358b0600');
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
      keyPair.pub.should.equal('xpub661MyMwAqRbcFAwqvSGbk35kJf7CQqdN1w4CMUBBTqH5e3ivjU6D8ugv9hRSgRbRenC4w3ahXdLVahwjgjXhSuQKMdNdn55Y9TNSagBktws');
      keyPair.prv.should.equal('xprv9s21ZrQH143K2gsNpQjbNu91kdGi1NuWei8bZ5mZuVk6mFPnBvmxb7NSJQdbZW3FGpK3Ycn7jorAXcEzMvviGtbyBz5tBrjfnWyQp3g75FK');
    });
  });
});
