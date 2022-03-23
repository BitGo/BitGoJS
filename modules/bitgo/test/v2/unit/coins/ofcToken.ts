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

  describe('check ofc tokens for Casper network', function () {
    describe('for main network', function () {
      const coin = 'ofccspr';
      it(`should have the correct values for ${coin}`, function () {
        const ofcCoin = bitgo.coin(coin);
        ofcCoin.getChain().should.equal(coin);
        ofcCoin.getFullName().should.equal('Casper');
        ofcCoin.getBaseFactor().should.equal('1000000000');
      });
    });
    describe('for test network', function () {
      const coin = 'ofctcspr';
      it(`should have the correct values for ${coin}`, function () {
        const ofcCoin = bitgo.coin(coin);
        ofcCoin.getChain().should.equal(coin);
        ofcCoin.getFullName().should.equal('Test Casper');
        ofcCoin.getBaseFactor().should.equal('1000000000');
      });
    });
    describe('- validate addresses - ', () => {
      const validAddressRootAccount = 'd632e4ed12fd838e361bcd1982da9a43b903631be38b3ed698559603c2e9faf6';
      const validAddressAccount1 = 'b256507dd71d76c69c0f889190dc4a4b7513c273eb80e4b8bf08ee79f8358149';
      const validAddressAccount2 = '5950aa8f6f73122be17770a1b7c6f10f047c892ab980ed55c9c7eda8d928633d';
      const validAddressAccount3 = '1dffe6461886c677428855b80e47ae8fa6c9efce8f6a74529eb3ded680cdd9ec';
      const validAddressAccount4 = '468f5e33c352efaaa0329a1972a632e1c3e430d4e4a8ab73c2d67c4bacb3fb65';
      const notValidAddress01 = 'b256507dd71d76c69c0f889190dc4a4b7513c273eb80e4b8bf08ee79f8358149111';
      for (const coin of ['ofccspr', 'ofctcspr']) {
        it(`should ${coin} be configured with right addresses`, function () {
          const ofcCoin = bitgo.coin(coin);
          ofcCoin.isValidAddress(validAddressRootAccount).should.be.true;
          ofcCoin.isValidAddress(validAddressAccount1).should.be.true;
          ofcCoin.isValidAddress(validAddressAccount2).should.be.true;
          ofcCoin.isValidAddress(validAddressAccount3).should.be.true;
          ofcCoin.isValidAddress(validAddressAccount4).should.be.true;
          ofcCoin.isValidAddress(notValidAddress01).should.be.false;
        });
      }
    });
  });

  describe('check ofc tokens for Stacks network', function () {
    const coinMain = 'ofcstx';
    const coinTest = 'ofctstx';
    describe('for main network', function () {
      it(`should have the correct values for ${coinMain}`, function () {
        const ofcCoin = bitgo.coin(coinMain);
        ofcCoin.getChain().should.equal(coinMain);
        ofcCoin.getFullName().should.equal('Stacks');
        ofcCoin.getBaseFactor().should.equal('1000000');
      });
    });
    describe('for test network', function () {
      it(`should have the correct values for ${coinTest}`, function () {
        const ofcCoin = bitgo.coin(coinTest);
        ofcCoin.getChain().should.equal(coinTest);
        ofcCoin.getFullName().should.equal('Test Stacks');
        ofcCoin.getBaseFactor().should.equal('1000000');
      });
    });
    describe('- validate addresses - ', () => {
      const validAddressAccount1 = 'SP10FDHQQ4F2F0KHMN6Z24RMAMGX5933SQJCWKAAR';
      const validAddressAccount2 = 'SPS4HSXAD1WSD3943WZ52MPSY9WPK56SDG54HTAR';
      const notValidAddress01 = 'SPS4HSXAD1WSD3943WZ52MPSY9WPK56SDG54HTARXXX';
      const notValidAddress02 = 'SPS4HSXAD1WSD3943WZ52MPSY9WPK56SDG54H';
      for (const coin of [coinMain, coinTest]) {
        it(`should ${coin} be configured with right addresses`, function () {
          const ofcCoin = bitgo.coin(coin);
          ofcCoin.isValidAddress(validAddressAccount1).should.be.true;
          ofcCoin.isValidAddress(validAddressAccount2).should.be.true;
          ofcCoin.isValidAddress(notValidAddress01).should.be.false;
          ofcCoin.isValidAddress(notValidAddress02).should.be.false;
        });
      }
    });
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
