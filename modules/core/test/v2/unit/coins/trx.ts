import * as Promise from 'bluebird';
import * as should from 'should';
import { Trx } from '../../../../src/v2/coins/trx';
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
    explanation.outputs.amount.should.equal('10');
    explanation.outputAmount.should.equal('10');
    explanation.changeAmount.should.equal(0);
    explanation.changeOutputs.length.should.equal(0);
    explanation.fee.should.equal(1);
    explanation.expiration.should.equal(mockTx.raw_data.expiration);
    explanation.timestamp.should.equal((mockTx.raw_data.timestamp));
    explanation.outputs.address.should.equal(toAddress);
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
    explanation.outputs.amount.should.equal('10');
    explanation.outputAmount.should.equal('10');
    explanation.changeAmount.should.equal(0);
    explanation.changeOutputs.length.should.equal(0);
    explanation.fee.should.equal(1);
    explanation.expiration.should.equal(mockTx.raw_data.expiration);
    explanation.timestamp.should.equal((mockTx.raw_data.timestamp));
    explanation.outputs.address.should.equal(toAddress);
  }));

  it('should sign a half signed tx', () => {
    let tx = basecoin.signTransaction(signTxOptions, { address: signTxOptions.address });
    let txHex = tx.halfSigned.txHex;
    txHex = JSON.parse(txHex)
    txHex.txID.should.equal(signTxOptions.txPrebuild.txInfo.txid);
    txHex.raw_data.contractType.should.equal(0);
    const contract = txHex.raw_data.contract;
    contract.ownerAddress.should.equal(bitgoAccountLib.Trx.Utils.getBase58AddressFromHex(signTxOptions.txPrebuild.txInfo.from))
    contract.toAddress.should.equal(bitgoAccountLib.Trx.Utils.getBase58AddressFromHex(signTxOptions.txPrebuild.txInfo.recipients[0].address));
    contract.amount.should.equal(parseInt(signTxOptions.txPrebuild.txInfo.recipients[0].amount,10));
    txHex.should.have.property('signature');
    txHex.should.have.property('raw_data_hex');
    txHex.signature.length.should.equal(1);
    txHex.raw_data.timestamp.should.equal(mockTx.raw_data.timestamp);
    txHex.raw_data.expiration.should.equal(mockTx.raw_data.expiration);
    });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });
  });
});
