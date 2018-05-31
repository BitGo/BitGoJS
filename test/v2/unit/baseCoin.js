//
// Tests for Wallets
//

require('should');

const TestV2BitGo = require('../../lib/test_bitgo');
const Token = require('../../../src/v2/coins/token');

describe('V2 Base Coin:', function() {
  let bitgo;
  let basecoinEth;
  let basecoinTokenWithName;
  let basecoinTokenWithContractHash;

  before(function() {
    // TODO: replace dev with test
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoinEth = bitgo.coin('teth');
    basecoinEth.keychains();
    basecoinTokenWithName = bitgo.coin('terc');
    basecoinTokenWithContractHash = bitgo.coin('0x945ac907cf021a6bcd07852bb3b8c087051706a9');
  });

  describe('Currenncy conversion', function() {
    it('should convert wei amounts to ETH', function() {
      // 1 wei
      basecoinEth.baseUnitsToBigUnits(1).should.equal('0.000000000000000001');
      // 100 wei
      basecoinEth.baseUnitsToBigUnits(100).should.equal('0.0000000000000001');
      // 1 ETH
      basecoinEth.baseUnitsToBigUnits('1000000000000000000').should.equal('1');
      // others
      basecoinEth.baseUnitsToBigUnits('1000000010000000000').should.equal('1.00000001');
    });
  });

  describe('supportsBlockTarget', function() {
    it('should return false', function() {
      basecoinEth.supportsBlockTarget().should.equal(false);
    });
  });

  describe('Token initialization', function() {
    it('Tokens initialized with name and contract should be instances of Token', function() {
      (basecoinTokenWithName instanceof Token).should.equal(true);
      (basecoinTokenWithContractHash instanceof Token).should.equal(true);
    });

    it('Tokens initialized with name and contract should be instances of each others constructor', function() {
      (basecoinTokenWithName instanceof basecoinTokenWithContractHash.constructor).should.equal(true);
      (basecoinTokenWithContractHash instanceof basecoinTokenWithName.constructor).should.equal(true);
    });

    it('Token comparison', function() {
      basecoinTokenWithName.getBaseFactor().should.equal(basecoinTokenWithContractHash.getBaseFactor());
      basecoinTokenWithName.getChain().should.equal(basecoinTokenWithContractHash.getChain());
      basecoinTokenWithName.getFamily().should.equal(basecoinTokenWithContractHash.getFamily());
      basecoinTokenWithName.getFullName().should.equal(basecoinTokenWithContractHash.getFullName());
    });
  });

  describe('Missing output detection', function() {

    it('should recognize count mismatch dupes', function() {
      const expectedOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: '300000'
        },
        {
          amount: '300000',
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ'
        }
      ];

      const actualOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: 300000
        },
        {
          address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
          amount: 15349374
        }
      ];
      // missing should be one entry of the two

      const utxoBasecoin = bitgo.coin('tltc');
      const missingOutputs = utxoBasecoin.constructor.findMissingOutputs(expectedOutputs, actualOutputs);

      missingOutputs.length.should.equal(1);
      missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
      missingOutputs[0].amount.should.equal('300000');
    });

    it('should be order-agnostic', function() {
      const expectedOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: '300000'
        },
        {
          amount: '300000',
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ'
        }
      ];

      const actualOutputs = [
        {
          address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
          amount: 15349374
        },
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: 300000
        }
      ];
      // missing should be one entry of the two

      const utxoBasecoin = bitgo.coin('tltc');
      const missingOutputs = utxoBasecoin.constructor.findMissingOutputs(expectedOutputs, actualOutputs);

      missingOutputs.length.should.equal(1);
      missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
      missingOutputs[0].amount.should.equal('300000');
    });

    it('should preserve all dupes', function() {
      const expectedOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: '300000'
        },
        {
          amount: '300000',
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ'
        }
      ];

      const actualOutputs = [
        {
          address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
          amount: 15349374
        }
      ];
      // missing should be one entry of the two

      const utxoBasecoin = bitgo.coin('tltc');
      const missingOutputs = utxoBasecoin.constructor.findMissingOutputs(expectedOutputs, actualOutputs);

      missingOutputs.length.should.equal(2);
      missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
      missingOutputs[1].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
      missingOutputs[0].amount.should.equal('300000');
      missingOutputs[1].amount.should.equal('300000');
    });

  });

});
