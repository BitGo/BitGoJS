import 'should';

import * as Promise from 'bluebird';
const co = Promise.coroutine;

import { TestBitGo } from '../../../lib/test_bitgo';

const ripple = require('../../../../src/ripple');
const rippleBinaryCodec = require('ripple-binary-codec');

import * as nock from 'nock';
nock.disableNetConnect();

describe('XRP:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txrp');
  });

  after(function() {
    nock.pendingMocks().should.be.empty();
  });

  it('isValidAddress should be correct', function() {
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?r=a').should.be.False();
    basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b').should.be.False();
    basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295').should.be.False();
    basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295').should.be.False();
    basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295').should.be.False();
  });

  it('verifyAddress should work', function() {
    const makeArgs = (address, rootAddress) => ({ address, rootAddress });

    const nonThrowingArgs = [
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8')
    ];

    const throwingArgs = [
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8r=a', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'rDgocL7QpZh8ZhrPsax4zVqbGGxeAsiBoh')
    ];

    for (const nonThrowingArg of nonThrowingArgs) {
      basecoin.verifyAddress(nonThrowingArg);
    }

    for (const throwingArg of throwingArgs) {
      (() => basecoin.verifyAddress(throwingArg)).should.throw();
    }
  });

  it('Should be able to explain an XRP transaction', co(function *() {
    const signedExplanation = yield basecoin.explainTransaction({ txHex: '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1' });
    const unsignedExplanation = yield basecoin.explainTransaction({ txHex: '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}' });
    unsignedExplanation.id.should.equal('CB36F366F1AC25FCDB38A19F17384ED3509D9B7F063520034597852FB10A1B45');
    signedExplanation.id.should.equal('D52681436CC5B94E9D00BC8172047B1A6F3C028D2D0A5CDFB81680039C48ADFD');
    unsignedExplanation.outputAmount.should.equal('253481');
    signedExplanation.outputAmount.should.equal('253481');
  }));

  it('should be able to cosign XRP transaction in any form', function() {
    const unsignedTxHex = '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D8114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9';
    const unsignedTxJson = '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}';

    const signer = {
      prv: 'xprv9s21ZrQH143K36cPP1rLoWsp9JQp9JEJGo2LFdfaufqcYSp5qJk5S5zN94SnXLiBEnU4dH8RDWfsSSLzdKwdEdqBZrRvZ3LqX1VXYWXFcpD',
      pub: 'xpub661MyMwAqRbcFagrV3PMAepYhLFJYkx9e1ww425CU1NbRF9ENr4KytJqzLWZwWQ7b1CWLDhV3kthPRAyT33CApQ9QWZDvSq4bFHp2yL8Eob',
      rawPub: '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490',
      rawPrv: '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7',
      xrpAddress: 'rJBWFy35Ya3qDZD89DuWBwm8oBbYmqb3H9'
    };

    const rippleLib = ripple();
    const coSignedHexTransaction = rippleLib.signWithPrivateKey(unsignedTxHex, signer.rawPrv, { signAs: signer.xrpAddress });
    const coSignedJsonTransaction = rippleLib.signWithPrivateKey(unsignedTxJson, signer.rawPrv, { signAs: signer.xrpAddress });
    coSignedHexTransaction.signedTransaction.should.equal(coSignedJsonTransaction.signedTransaction);
    coSignedHexTransaction.id.should.equal(coSignedJsonTransaction.id);
  });

  it('Should be unable to explain bogus XRP transaction', co(function *() {
    try {
      yield basecoin.explainTransaction({ txHex: 'abcdefgH' });
      throw new Error('this is the wrong error!');
    } catch (e) {
      e.message.should.equal('txHex needs to be either hex or JSON string for XRP');
    }
  }));


  describe('Fee Management', () => {
    const nockBitGo = new TestBitGo({ env: 'test' });
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

    it('Should supplement wallet generation', co(function *() {
      const details = yield nockBasecoin.supplementGenerateWallet({});
      details.should.have.property('rootPrivateKey');
    }));

    it('should validate pub key', () => {
      const { pub } = basecoin.keychains().create();
      basecoin.isValidPub(pub).should.equal(true);
    });
  });
});
