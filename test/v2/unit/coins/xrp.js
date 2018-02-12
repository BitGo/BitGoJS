const assert = require('assert');
require('should');

const Promise = require('bluebird');
const co = Promise.coroutine;

const TestV2BitGo = require('../../../lib/test_bitgo');
const { BitGo } = require('../../../../src/index');

const rippleBinaryCodec = require('ripple-binary-codec');

const nock = require('nock');
nock.enableNetConnect();

describe('XRP:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txrp');
  });

  after(function() {
    nock.cleanAll();
  });

  it('isValidAddress should be correct', function() {
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?r=a') === false);
    assert(basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b') === false);
    assert(basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === false);
    assert(basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === false);
    assert(basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295') === false);
  });

  it('verifyAddress should work', function() {
    basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' });
    basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8r=a', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295', rootAddress: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
    assert.throws(function() { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', rootAddress: 'rDgocL7QpZh8ZhrPsax4zVqbGGxeAsiBoh' }); });
  });

  it('Should be able to explain an XRP transaction', function() {
    const signedExplanation = basecoin.explainTransaction({ txHex: '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1' });
    const unsignedExplanation = basecoin.explainTransaction({ txHex: '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}' });
    unsignedExplanation.id.should.equal('CB36F366F1AC25FCDB38A19F17384ED3509D9B7F063520034597852FB10A1B45');
    signedExplanation.id.should.equal('D52681436CC5B94E9D00BC8172047B1A6F3C028D2D0A5CDFB81680039C48ADFD');
    unsignedExplanation.outputAmount.should.equal('253481');
    signedExplanation.outputAmount.should.equal('253481');
  });

  it('Should be unable to explain bogus XRP transaction', function() {
    try {
      basecoin.explainTransaction({ txHex: 'abcdefgH' });
      throw new Error('this is the wrong error!');
    } catch (e) {
      e.message.should.equal('txHex needs to be either hex or JSON string for XRP');
    }
  });


  describe('Fee Management', () => {
    const nockBitGo = new BitGo({ env: 'test' });
    const nockBasecoin = nockBitGo.coin('txrp');
    const keychains = {
      userKeychain: {
        pub: 'xpub661MyMwAqRbcH28Z4ssHaU5RBPshZPwqDMD5N2UgLCpRwjKCdmwU6Yv4fwKj3sbbpHNfvoDxTvBLxnrP4xmdd4GjC2sYchh4vPcZPmEwGC9',
        ethAddress: '0x6a8da5c34f3de5e9f5d9eefaf57d0f2d5a036dad',
        encryptedPrv: '{"iv":"a3RFke6i1P0HPNYm7wDrzA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"8iIApBSiaz4=","ct":"3AtrOygBC6WsKeoW60XfCPXpWtduG6TGZU2szpi+EhoGamnVlCp53wV30nqIi8ZsRuVcEtCE8Em+Ud6gilSNa01TdETDwuwzfqSDmelH4JKhRe87Qc7jB6O6G7iyRHaddvjgIBmyRv8nLEA4hZ6sdIlM5Sn2UOc="}',
        prv: 'xprv9s21ZrQH143K4Y45xrLHDL8gdN3D9wDyr8HUZe54msHT4vz46EdDYkbapg3fh1SAsbfhepPZJsNdifvHvzjuCRGmAo8iF24PiqPqHkqyJe8'
      },
      backupKeychain: {
        pub: 'xpub661MyMwAqRbcFsEYzcEnJLynVC2bGvo7As2GRAja1DWRYo7wesUKJNYx6S1vmrB779owGtprReF7AvqfNygT3t4uy3HNqgzw6ju8idgxV5J',
        ethAddress: '0x1317a1c8cdc5c002ddf8660d981e2ca032e51ac8'
      },
      bitgoKeychain: {
        pub: 'xpub661MyMwAqRbcGKfdv75qtk2ZCTaW52Y5zePWrj9MW6D5PYqQeXSG42Y2oZ495T5yzCd3cxyi37Z9UtKhDwie9JKvYdCf3BzeBvg9L1XsBwF',
        ethAddress: '0xdf91dfdf0d2fd00be19d890f5d87d4aa01dace68',
        isBitGo: true
      }
    };

    it('Should supplement wallet generation with fees', co(function *() {
      const fees = [{
        open: '10',
        median: '6000',
        expected: '9000'
      }, {
        open: '7000',
        median: '4000',
        expected: '10500'
      }];

      for (const currentFees of fees) {
        nock('https://test.bitgo.com/api/v2/txrp/public')
        .get('/feeinfo')
        .reply(200, {
          date: '2017-10-18T18:28:13.083Z',
          height: 3353255,
          xrpBaseReserve: '20000000',
          xrpIncReserve: '5000000',
          xrpOpenLedgerFee: currentFees.open,
          xrpMedianFee: currentFees.median
        });
        const details = yield nockBasecoin.supplementGenerateWallet({}, keychains);
        const disableMasterKey = rippleBinaryCodec.decode(details.initializationTxs.disableMasterKey);
        const forceDestinationTag = rippleBinaryCodec.decode(details.initializationTxs.forceDestinationTag);
        const setMultisig = rippleBinaryCodec.decode(details.initializationTxs.setMultisig);
        disableMasterKey.Fee.should.equal(currentFees.expected);
        forceDestinationTag.Fee.should.equal(currentFees.expected);
        setMultisig.Fee.should.equal(currentFees.expected);
      }
    }));
  });
});
