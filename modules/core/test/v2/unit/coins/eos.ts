import * as should from 'should';
import * as Promise from 'bluebird';
const co = Promise.coroutine;
import * as ecc from 'eosjs-ecc';
import * as bitcoin from 'bitgo-utxo-lib';

const TestV2BitGo = require('../../../lib/test_bitgo');

describe('EOS:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teos');
  });

  it('should get address details', function() {
    let addressDetails = basecoin.getAddressDetails('i1skda3kso43');
    addressDetails.address.should.equal('i1skda3kso43');
    should.not.exist(addressDetails.memoId);

    addressDetails = basecoin.getAddressDetails('ks13k3hdui24?memoId=1');
    addressDetails.address.should.equal('ks13k3hdui24');
    addressDetails.memoId.should.equal('1');

    (() => { basecoin.getAddressDetails('ks13k3hdui24?memoId=x'); }).should.throw();
    (() => { basecoin.getAddressDetails('ks13k3hdui24?memoId=1&memoId=2'); }).should.throw();
  });

  it('should validate address', function() {
    basecoin.isValidAddress('i1skda3kso43').should.equal(true);
    basecoin.isValidAddress('ks13kdh245ls').should.equal(true);
    basecoin.isValidAddress('ks13k3hdui24?memoId=1').should.equal(true);
    basecoin.isValidAddress('ks13k3hdui24?memoId=x').should.equal(false);
  });

  it('verifyAddress should work', function() {
    basecoin.verifyAddress({
      address: 'i1skda3kso43',
      rootAddress: 'i1skda3kso43',
    });
    basecoin.verifyAddress({
      address: 'ks13kdh245ls?memoId=1',
      rootAddress: 'ks13kdh245ls',
    });

    (() => {
      basecoin.verifyAddress({
        address: 'i1skda3kso43?memoId=243432',
        rootAddress: 'ks13kdh245ls',
      });
    }).should.throw();

    (() => {
      basecoin.verifyAddress({
        address: 'i1skda3kso43=x',
        rootAddress: 'i1skda3kso43',
      });
    }).should.throw();

    (() => {
      basecoin.verifyAddress({
        address: 'i1skda3kso43',
      });
    }).should.throw();
  });

  it('isValidMemoId should work', function() {
    basecoin.isValidMemo({ value: '1' }).should.equal(true);
    basecoin.isValidMemo({ value: 'uno' }).should.equal(true);
    const string257CharsLong = '4WMNlu0fFU8N94AwukfpfPPQn2Myo80JdmLNF5rgeKAab9XLD93KUQipcT6US0LRwWWIGbUt89fjmdwpg3CBklNi8QIeBI2i8UDJCEuQKYobR5m4ismm1RooTXUnw5OPjmfLuuajYV4e5cS1jpC6hez5X43PZ5SsGaHNYX2YYXY03ir54cWWx5QW5VCPKPKUzfq2UYK5fjAG2Fe3xCUOzqgoR6KaAiuOOnDSyhZygLJyaoJpOXZM9olblNtAW75Ed';
    basecoin.isValidMemo({ value: string257CharsLong }).should.equal(false);
  });

  it('should validate pub key', () => {
    const { pub } = basecoin.keychains().create();
    basecoin.isValidPub(pub).should.equal(true);
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });

    it('should generate a keypair from seed', function() {
      const seed = Buffer.from('c3b09c24731be2851b641d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.pub.should.equal('xpub661MyMwAqRbcF2SUqUMiqxWGwaVX6sH4okTtX8jxJ1A14wfL8W7jZEoNE537JqSESXFpTcXCZahPz7RKQLpAEGsVp233dc5CffLSecpU13X');
      keyPair.prv.should.equal('xprv9s21ZrQH143K2YN1jSpiUpZYPYf2hQZDSXYHikLLjfd2C9LBaxoV1SUtNnZGnXeyJ6uFWMbQTfjXqVfgNqRBw5yyaCtBK1AM8PF3XZtKjQp');
    });
  });

  describe('Transactions:', co(function *() {
    let eosWallet;

    before(function() {
      eosWallet = basecoin.newWalletObject(bitgo, basecoin, {});
    });

    it('should generate a valid transaction signature', function() {
      const signatureData = 'abcd';
      const tx = {
        rawTx: signatureData,
        headers: {
          ref_block_num: 1,
          ref_block_prefix: 'asd',
        },
        tx: {
          signatures: [],
          packed_trx: signatureData,
          compression: 'none',
        },
      };

      const seed = Buffer.from('c3b09c24731be2851b624d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      const { halfSigned } = basecoin.signTransaction({ txPrebuild: tx, prv: keyPair.prv });
      const signature = halfSigned.transaction.signatures[0];
      const hdNode = bitcoin.HDNode.fromBase58(keyPair.pub);
      const eosPubkey = ecc.PublicKey.fromBuffer(hdNode.getPublicKeyBuffer()).toString();
      ecc.verify(signature, Buffer.from(signatureData, 'hex'), eosPubkey).should.eql(true);
    });

    it('should be explain an EOS transaction', co(function *() {
      const explainTransactionParams = {
        headers: {
          ref_block_prefix: 147898787,
          ref_block_num: 41763,
          expiration: '2019-07-10T00:34:48.500Z',
        },
        tx: {
          packed_trx: 'a832255d23a3a3c1d008000000000100a6823403ea3055000000572d3ccdcd01607bc2e8f219c9a500000000a8ed323221607bc2e8f219c9a56032c1a4af42d2f6102700000000000004454f53000000000000',
        },
      };

      const signedExplanation = yield basecoin.explainTransaction(explainTransactionParams);
      signedExplanation.outputAmount.should.equal('10000');
      signedExplanation.outputs.length.should.equal(1);
      signedExplanation.outputs[0].amount.should.equal('10000');
      signedExplanation.outputs[0].address.should.equal('yvd45fx4s4ta');
      signedExplanation.id.should.equal('c00826caa09f7b340af773e7b9f68f5d7b16518658289461e9ddd35c9f04a99e');
    }));
  }));
});
