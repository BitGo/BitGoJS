import 'should';

const TestV2BitGo = require('../../../lib/test_bitgo');

describe('OFC:', function() {
  let bitgo;
  let otestusdCoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    otestusdCoin = bitgo.coin('ofctusd');
  });

  it('functions that return constants', function() {
    otestusdCoin.getChain().should.equal('ofctusd');
    otestusdCoin.getFullName().should.equal('Offchain Test USD');
    otestusdCoin.getBaseFactor().should.equal('100');
  });

  it('test crypto coins', function() {
    const tbtc = bitgo.coin('ofctbtc');
    tbtc.getChain().should.equal('ofctbtc');
    tbtc.getFullName().should.equal('Offchain Bitcoin Test');
    tbtc.getBaseFactor().should.equal('100000000');

    const teth = bitgo.coin('ofcteth');
    teth.getChain().should.equal('ofcteth');
    teth.getFullName().should.equal('Offchain Ether Testnet');
    teth.getBaseFactor().should.equal('1000000000000000000');
  })

  it('can sign payloads', function() {
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

    const signedResult = otestusdCoin.signTransaction(inputParams);
    signedResult.should.deepEqual(expectedResult);
  });
});
