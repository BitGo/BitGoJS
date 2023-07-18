//
// Tests for Wallets
//

import 'should';
import * as nock from 'nock';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';
import { Erc20Token } from '@bitgo/sdk-coin-eth';
import { StellarToken } from '@bitgo/sdk-coin-xlm';

nock.disableNetConnect();

describe('V2 Base Coin:', function () {
  let bitgo;
  let basecoinEth;
  let basecoinBtc;
  let basecoinXlm;
  let basecoinNear;
  let basecoinEos;
  let basecoinEosChex;
  let basecoinErc20TokenWithName;
  let basecoinErc20TokenWithContractHash;
  let baseCoinStellarToken;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
    basecoinEth = bitgo.coin('teth');
    basecoinBtc = bitgo.coin('tbtc');
    basecoinXlm = bitgo.coin('txlm');
    basecoinNear = bitgo.coin('tnear');
    basecoinEos = bitgo.coin('teos');
    basecoinEosChex = bitgo.coin('teos:CHEX');
    basecoinEth.keychains();
    basecoinErc20TokenWithName = bitgo.coin('terc');
    basecoinErc20TokenWithContractHash = bitgo.coin('0x945ac907cf021a6bcd07852bb3b8c087051706a9');
    baseCoinStellarToken = bitgo.coin('txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L');
  });

  describe('Currency conversion', function () {
    it('should convert wei amounts to ETH', function () {
      // 1 wei
      basecoinEth.baseUnitsToBigUnits(1).should.equal('0.000000000000000001');
      // 100 wei
      basecoinEth.baseUnitsToBigUnits(100).should.equal('0.0000000000000001');
      // 1 ETH
      basecoinEth.baseUnitsToBigUnits('1000000000000000000').should.equal('1');
      // others
      basecoinEth.baseUnitsToBigUnits('1000000010000000000').should.equal('1.00000001');
    });

    it('should convert satoshi amounts to BTC', function () {
      // 1 satoshi
      basecoinBtc.baseUnitsToBigUnits(1).should.equal('0.00000001');
      // 100 satoshi
      basecoinBtc.baseUnitsToBigUnits(100).should.equal('0.000001');
      // 1 BTC
      basecoinBtc.baseUnitsToBigUnits(100000000).should.equal('1');
      // 2000 BTC
      basecoinBtc.baseUnitsToBigUnits(200000000000).should.equal('2000');
      // others
      basecoinBtc.baseUnitsToBigUnits(200000397901).should.equal('2000.00397901');
    });

    it('should convert stroop amounts to XLM', function () {
      // 1 stroop
      basecoinXlm.baseUnitsToBigUnits('1').should.equal('0.0000001');
      // 100 stroops
      basecoinXlm.baseUnitsToBigUnits('100').should.equal('0.00001');
      // 1 XLM
      basecoinXlm.baseUnitsToBigUnits('10000000').should.equal('1');
      // others
      basecoinXlm.baseUnitsToBigUnits('10000001').should.equal('1.0000001');
    });

    it('should convert amounts to NEAR', function () {
      basecoinNear.baseUnitsToBigUnits('5348162392287187499999010').should.equal('5.34816239228718749999901');

      basecoinNear.baseUnitsToBigUnits('5555555555555555555555550').should.equal('5.55555555555555555555555');

      basecoinNear.baseUnitsToBigUnits('197895229538867437499999802').should.equal('197.895229538867437499999802');
    });

    it('should convert amounts to EOS', function () {
      basecoinEos.baseUnitsToBigUnits('1').should.equal('0.0001');

      basecoinEos.baseUnitsToBigUnits('1234').should.equal('0.1234');

      basecoinEos.baseUnitsToBigUnits('123456788').should.equal('12345.6788');

      // for chex token, we need to round to 8 decimal places
      basecoinEosChex.baseUnitsToBigUnits('1').should.equal('0.00000001');

      basecoinEosChex.baseUnitsToBigUnits('1234').should.equal('0.00001234');

      basecoinEosChex.baseUnitsToBigUnits('123456788').should.equal('1.23456788');
    });
  });

  describe('supportsBlockTarget', function () {
    it('should return false', function () {
      basecoinEth.supportsBlockTarget().should.equal(false);
    });
  });

  describe('Token initialization', function () {
    it('ERC20 Tokens initialized with name and contract should be instances of Erc20Token', function () {
      basecoinErc20TokenWithName.should.be.instanceof(Erc20Token);
      basecoinErc20TokenWithContractHash.should.be.instanceof(Erc20Token);
    });

    it('ERC20 Tokens initialized with name and contract should be instances of each others constructor', function () {
      basecoinErc20TokenWithName.should.be.instanceof(basecoinErc20TokenWithContractHash.constructor);
      basecoinErc20TokenWithContractHash.should.be.instanceof(basecoinErc20TokenWithContractHash.constructor);
    });

    it('ERC20 Token comparison', function () {
      basecoinErc20TokenWithName.getBaseFactor().should.equal(basecoinErc20TokenWithContractHash.getBaseFactor());
      basecoinErc20TokenWithName.getChain().should.equal(basecoinErc20TokenWithContractHash.getChain());
      basecoinErc20TokenWithName.getFamily().should.equal(basecoinErc20TokenWithContractHash.getFamily());
      basecoinErc20TokenWithName.getFullName().should.equal(basecoinErc20TokenWithContractHash.getFullName());
    });

    it('Stellar Tokens should be instances of StellarToken', function () {
      (baseCoinStellarToken instanceof StellarToken).should.equal(true);
      (baseCoinStellarToken instanceof StellarToken).should.equal(true);
    });

    it('Goerli ERC20 Tokens set to gteth and Kovan ERC20 Tokens set to teth', function () {
      // goerli token
      const goerliToken = bitgo.coin('gusdt');
      goerliToken.coin.should.equal('gteth');
      goerliToken.network.should.equal('Testnet');
      goerliToken.getFamily().should.equal('eth');
      // kovan token
      const kovanToken = bitgo.coin('terc');
      kovanToken.coin.should.equal('teth');
      kovanToken.network.should.equal('Testnet');
      kovanToken.getFamily().should.equal('eth');
    });
  });

  describe('Missing output detection', function () {
    it('should recognize count mismatch dupes', function () {
      const expectedOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: '300000',
        },
        {
          amount: '300000',
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        },
      ];

      const actualOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: 300000,
        },
        {
          address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
          amount: 15349374,
        },
      ];
      // missing should be one entry of the two

      const utxoBasecoin = bitgo.coin('tltc');
      const missingOutputs = utxoBasecoin.constructor.findMissingOutputs(expectedOutputs, actualOutputs);

      missingOutputs.length.should.equal(1);
      missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
      missingOutputs[0].amount.should.equal('300000');
    });

    it('should be order-agnostic', function () {
      const expectedOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: '300000',
        },
        {
          amount: '300000',
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        },
      ];

      const actualOutputs = [
        {
          address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
          amount: 15349374,
        },
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: 300000,
        },
      ];
      // missing should be one entry of the two

      const utxoBasecoin = bitgo.coin('tltc');
      const missingOutputs = utxoBasecoin.constructor.findMissingOutputs(expectedOutputs, actualOutputs);

      missingOutputs.length.should.equal(1);
      missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
      missingOutputs[0].amount.should.equal('300000');
    });

    it('should preserve all dupes', function () {
      const expectedOutputs = [
        {
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
          amount: '300000',
        },
        {
          amount: '300000',
          address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        },
      ];

      const actualOutputs = [
        {
          address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
          amount: 15349374,
        },
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
