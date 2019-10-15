import * as Promise from 'bluebird';
import * as should from 'should';
import { Trx } from '../../../../src/v2/coins/trx';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';

describe('TRON:', function() {
  let bitgo;
  let basecoin;
  const mockTx = {
    txID:
        'fef1cbe213b7d7742db0703f729801ca3959d28c87dbf758fe7f56d4657a5aef',
    raw_data:
      { contract:
          [{ parameter:
              { value:
                  { amount: 10,
                    owner_address: '41df179112f4063aa77c27859d7587aa3243039718',
                    to_address: '41c4530f6bfa902b7398ac773da56106a15af15f92' },
              type_url: 'type.googleapis.com/protocol.TransferContract' },
          type: 'TransferContract' }],
      ref_block_bytes: 'a70e',
      ref_block_hash: '7a9ae42b4548b423',
      expiration: 1568152683000,
      timestamp: 1568152624931 },
      raw_data_hex:
        '0a02a70e22087a9ae42b4548b42340f883bce9d12d5a65080112610a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412300a1541df179112f4063aa77c27859d7587aa3243039718121541c4530f6bfa902b7398ac773da56106a15af15f92180a70a3beb8e9d12d',
    };

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ttrx');
  });

  it('should instantiate the coin', function() {
    const basecoin = bitgo.coin('trx');
    basecoin.should.be.an.instanceof(Trx);
  });

  it('should explain an half-signed transaction', co(function *() {
    const explainParams = {
      halfSigned: { txHex: mockTx.raw_data_hex },
      fee: 1,
      txID: mockTx.txID,
    };
    const explanation = yield basecoin.explainTransaction(explainParams);
    explanation.id.should.equal(mockTx.txID);
    explanation.outputs[0].amount.should.equal(10);
    explanation.outputs[0].address.should.equal('41c4530f6bfa902b7398ac773da56106a15af15f92');
    explanation.fee.should.equal(1)
    explanation.expiration.should.equal(mockTx.raw_data.expiration)
    explanation.timestamp.should.equal((mockTx.raw_data.timestamp))
  }));

  it('should explain an fully signed transaction', co(function *() {
    // const explainParams = { txHex: fixtures.fullySignBase64 };

    // const explanation = yield basecoin.explainTransaction(explainParams);

    // explanation.outputs[0].amount.should.equal(1000);
    // explanation.outputs[0].address.should.equal(fixtures.txData.to);
    // explanation.id.should.equal(fixtures.signedTxId);
  }));

  it('should explain an unsigned transaction', co(function *() {
    // const explainParams = { txHex: fixtures.fullySignBase64 };

    // const explanation = yield basecoin.explainTransaction(explainParams);

    // explanation.outputs[0].amount.should.equal(1000);
    // explanation.outputs[0].address.should.equal(fixtures.txData.to);
    // explanation.id.should.equal(fixtures.signedTxId);
  }));

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });
  });
});
