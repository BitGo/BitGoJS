import 'should';

import { TestBitGo } from '../../../lib/test_bitgo';

describe('OFC:', function () {
  let bitgo;
  let otestusdCoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    otestusdCoin = bitgo.coin('ofctusd');
  });

  it('functions that return constants', function () {
    otestusdCoin.getChain().should.equal('ofctusd');
    otestusdCoin.getFullName().should.equal('Test USD');
    otestusdCoin.getBaseFactor().should.equal('100');
  });

  it('test crypto coins for ofctbtc', function () {
    const tbtc = bitgo.coin('ofctbtc');
    tbtc.getChain().should.equal('ofctbtc');
    tbtc.getFullName().should.equal('Test Bitcoin');
    tbtc.getBaseFactor().should.equal('100000000');
    tbtc.isValidAddress('2NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.true;
    tbtc.isValidAddress('3NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    tbtc.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64').should.be.true;
    tbtc.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64nnn').should.be.false;
  });

  it('test crypto coins for ofcteth', function () {
    const teth = bitgo.coin('ofcteth');
    teth.getChain().should.equal('ofcteth');
    teth.getFullName().should.equal('Test Ether');
    teth.getBaseFactor().should.equal('1000000000000000000');
    teth.isValidAddress('0x801b2954117cf3439479df391bed2f472e4bd4b8').should.be.true;
    teth.isValidAddress('2NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    teth.isValidAddress('3NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    teth.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64').should.be.true;
    teth.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64nnn').should.be.false;
  });

  it('test crypto coins for ofcgteth', function () {
    const gteth = bitgo.coin('ofcgteth');
    gteth.getChain().should.equal('ofcgteth');
    gteth.getFullName().should.equal('Test Goerli Ether');
    gteth.getBaseFactor().should.equal('1000000000000000000');
    gteth.isValidAddress('0x801b2954117cf3439479df391bed2f472e4bd4b8').should.be.true;
    gteth.isValidAddress('2NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    gteth.isValidAddress('3NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X').should.be.false;
    gteth.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64').should.be.true;
    gteth.isValidAddress('bg-5b2b80eafbdf94d5030bb23f9b56ad64nnn').should.be.false;
  });

  it('test crypto coins for ofcavaxc', function () {
    const validAddress = '0x1374a2046661f914d1687d85dbbceb9ac7910a29';
    const notValidAddress01 = 'x1374a2046661f914d1687d85dbbceb9ac7910a29';
    const notValidAddress02 = '0x1374a2046661f914d1687d85dbbceb9ac7910a291234';
    const ofcavaxc = bitgo.coin('ofcavaxc');
    ofcavaxc.getChain().should.equal('ofcavaxc');
    ofcavaxc.getFullName().should.equal('Avalanche C-Chain');
    ofcavaxc.getBaseFactor().should.equal('1000000000000000000');
    ofcavaxc.isValidAddress(validAddress).should.be.true;
    ofcavaxc.isValidAddress(notValidAddress01).should.be.false;
    ofcavaxc.isValidAddress(notValidAddress02).should.be.false;
  });

  it('test crypto coins for ofctavaxc', function () {
    const validAddress = '0x1374a2046661f914d1687d85dbbceb9ac7910a29';
    const notValidAddress01 = 'x1374a2046661f914d1687d85dbbceb9ac7910a29';
    const notValidAddress02 = '0x1374a2046661f914d1687d85dbbceb9ac7910a291234';
    const ofctavaxc = bitgo.coin('ofctavaxc');
    ofctavaxc.getChain().should.equal('ofctavaxc');
    ofctavaxc.getFullName().should.equal('Test Avalanche C-Chain');
    ofctavaxc.getBaseFactor().should.equal('1000000000000000000');
    ofctavaxc.isValidAddress(validAddress).should.be.true;
    ofctavaxc.isValidAddress(notValidAddress01).should.be.false;
    ofctavaxc.isValidAddress(notValidAddress02).should.be.false;
  });

  it('can sign payloads', async function () {
    const inputParams = {
      txPrebuild: {
        payload: '{"token":"otestusd"}',
      },
      prv: 'xprv9s21ZrQH143K3WG4of3nSYUC55XNFCgZTyghae9cMSFDkcKU7YJgTahJMpdTY9CjCcjgSo2TJ635uUVx176BufUMBFpieKYVJD9J3VvrGRm',
    };
    const expectedResult = {
      halfSigned: {
        payload: '{\"token\":\"otestusd\"}',
        signature: '2049b94a22c69650ad9529767da993a23c078347fdf7d887409793dce8d07190e108a846869edf387d294cd75c6c770a12847615b2553b22a61de29be5d91770dd',
      },
    };

    const signedResult = await otestusdCoin.signTransaction(inputParams);
    signedResult.should.deepEqual(expectedResult);
  });
});
