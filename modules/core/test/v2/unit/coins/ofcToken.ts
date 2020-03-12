import 'should';
import * as Promise from 'bluebird';
const co = Promise.coroutine;

import { TestBitGo } from '../../../lib/test_bitgo';

describe('OFC:', function() {
  let bitgo;
  let otestusdCoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    otestusdCoin = bitgo.coin('ofctusd');
  });

  it('functions that return constants', function() {
    otestusdCoin.getChain().should.equal('ofctusd');
    otestusdCoin.getFullName().should.equal('Test USD');
    otestusdCoin.getBaseFactor().should.equal('100');
  });

  it('test crypto coins', function() {
    const tbtc = bitgo.coin('ofctbtc');
    tbtc.getChain().should.equal('ofctbtc');
    tbtc.getFullName().should.equal('Test Bitcoin');
    tbtc.getBaseFactor().should.equal('100000000');
    tbtc.isValidAddress('2NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.true;
    tbtc.isValidAddress('3NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    tbtc.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64').should.be.true;
    tbtc.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64nnn').should.be.false;

    const teth = bitgo.coin('ofcteth');
    teth.getChain().should.equal('ofcteth');
    teth.getFullName().should.equal('Test Ether');
    teth.getBaseFactor().should.equal('1000000000000000000');
    teth.isValidAddress('0x801b2954117cf3439479df391bed2f472e4bd4b8').should.be.true;
    teth.isValidAddress('2NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    teth.isValidAddress('3NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    teth.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64').should.be.true;
    teth.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64nnn').should.be.false;
  })

  it('can sign payloads', co(function *() {
    const inputParams = {
      txPrebuild: {
        payload: '{"token":"otestusd"}'
      },
      prv: 'xprv9s21ZrQH143K3WG4of3nSYUC55XNFCgZTyghae9cMSFDkcKU7YJgTahJMpdTY9CjCcjgSo2TJ635uUVx176BufUMBFpieKYVJD9J3VvrGRm'
    };
    const expectedResult = {
      halfSigned: {
        payload: '{\"token\":\"otestusd\"}',
        signature: '2049b94a22c69650ad9529767da993a23c078347fdf7d887409793dce8d07190e108a846869edf387d294cd75c6c770a12847615b2553b22a61de29be5d91770dd',
      }
    };

    const signedResult = yield otestusdCoin.signTransaction(inputParams);
    signedResult.should.deepEqual(expectedResult);
  }));
});
