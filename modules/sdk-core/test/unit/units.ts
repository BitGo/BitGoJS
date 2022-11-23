import BigNumber from 'bignumber.js';
import 'should';
import { toFullUnits, toFullUnitsFixed, toBaseUnits, toMarketValueBaseUnits } from '../../src';

describe('units', () => {
  describe('toFullUnits', () => {
    it('should convert numbers into full units', () => {
      toFullUnits(0, 'susd').should.equal('0');
      toFullUnits(75, 'susd').should.equal('0.75');
      toFullUnits(-100, 'susd').should.equal('-1');
      toFullUnits(0, 'btc').should.equal('0');
      toFullUnits(75, 'btc').should.equal('7.5e-7');
      toFullUnits(750000, 'btc').should.equal('0.0075');
      toFullUnits(-7500000, 'btc').should.equal('-0.075');
    });

    it('should convert big numbers into full units', () => {
      toFullUnits(BigNumber(0), 'susd').should.equal('0');
      toFullUnits(BigNumber(75), 'susd').should.equal('0.75');
      toFullUnits(BigNumber('7500000000000'), 'susd').should.equal('75000000000');
      toFullUnits(BigNumber('750000000000000000000000000'), 'susd').should.equal('7.5e+24');
      toFullUnits(BigNumber(-100), 'susd').should.equal('-1');
      toFullUnits(BigNumber(0), 'btc').should.equal('0');
      toFullUnits(BigNumber(75), 'btc').should.equal('7.5e-7');
      toFullUnits(BigNumber(750000), 'btc').should.equal('0.0075');
      toFullUnits(BigNumber(-7500000), 'btc').should.equal('-0.075');
      toFullUnits(BigNumber('75000000000000000000000000'), 'btc').should.equal('750000000000000000');
    });
  });

  describe('toFullUnitsFixed', () => {
    it('should convert numbers into full fixed units', () => {
      toFullUnitsFixed(0, 'susd').should.equal('0.00');
      toFullUnitsFixed(75, 'susd').should.equal('0.75');
      toFullUnitsFixed(-100, 'susd').should.equal('-1.00');
      toFullUnitsFixed(0, 'btc').should.equal('0.00000000');
      toFullUnitsFixed(75, 'btc').should.equal('0.00000075');
      toFullUnitsFixed(750000, 'btc').should.equal('0.00750000');
      toFullUnitsFixed(-7500000, 'btc').should.equal('-0.07500000');
    });

    it('should convert big numbers into full fixed units', () => {
      toFullUnitsFixed(BigNumber(0), 'susd').should.equal('0.00');
      toFullUnitsFixed(BigNumber(75), 'susd').should.equal('0.75');
      toFullUnitsFixed(BigNumber('7500000000000'), 'susd').should.equal('75000000000.00');
      toFullUnitsFixed(BigNumber('750000000000000000000000000'), 'susd').should.equal('7500000000000000000000000.00');
      toFullUnitsFixed(BigNumber(-100), 'susd').should.equal('-1.00');
      toFullUnitsFixed(BigNumber(0), 'btc').should.equal('0.00000000');
      toFullUnitsFixed(BigNumber(75), 'btc').should.equal('0.00000075');
      toFullUnitsFixed(BigNumber(750000), 'btc').should.equal('0.00750000');
      toFullUnitsFixed(BigNumber(-7500000), 'btc').should.equal('-0.07500000');
      toFullUnitsFixed(BigNumber('75000000000000000000000000'), 'btc').should.equal('750000000000000000.00000000');
    });
  });

  describe('toBaseUnits', () => {
    it('should convert into base units', () => {
      toBaseUnits(0, 'susd').should.equal('0');
      toBaseUnits('0.75', 'susd').should.equal('75');
      toBaseUnits('-1.00', 'susd').should.equal('-100');
      toBaseUnits('0', 'btc').should.equal('0');
      toBaseUnits('0.000000000', 'btc').should.equal('0');
      toBaseUnits('0.00000075', 'btc').should.equal('75');
      toBaseUnits('0.00750000', 'btc').should.equal('750000');
      toBaseUnits('-0.07500000', 'btc').should.equal('-7500000');
    });

    it('should convert big numbers into base units', () => {
      toBaseUnits(BigNumber(0), 'susd').should.equal('0');
      toBaseUnits(BigNumber(75), 'susd').should.equal('7500');
      toBaseUnits(BigNumber('7500000000000'), 'susd').should.equal('750000000000000');
      toBaseUnits(BigNumber('750000000000000000000000000'), 'susd').should.equal('7.5e+28');
      toBaseUnits(BigNumber(-100), 'susd').should.equal('-10000');
      toBaseUnits(BigNumber(0), 'btc').should.equal('0');
      toBaseUnits(BigNumber(75), 'btc').should.equal('7500000000');
      toBaseUnits(BigNumber(750000), 'btc').should.equal('75000000000000');
      toBaseUnits(BigNumber(-7500000), 'btc').should.equal('-750000000000000');
      toBaseUnits(BigNumber('75000000000000000000000000'), 'btc').should.equal('7.5e+33');
    });
  });

  describe('toMarketValueBaseUnits', () => {
    it('should convert into market value base units', () => {
      toMarketValueBaseUnits('susd', 1, 0).should.equal(BigInt(0));
      toMarketValueBaseUnits('susd', 1, 10).should.equal(BigInt(10));
      toMarketValueBaseUnits('susd', 70000000, 0).should.equal(BigInt(0));
      toMarketValueBaseUnits('susd', 70000000, 10).should.equal(BigInt(700000000));
      toMarketValueBaseUnits('btc', 1, 0).should.equal(BigInt(0));
      toMarketValueBaseUnits('btc', 1, 10).should.equal(BigInt(0));
      toMarketValueBaseUnits('btc', 70000000, 0).should.equal(BigInt(0));
      toMarketValueBaseUnits('btc', 70000000, 10).should.equal(BigInt(700));
      toMarketValueBaseUnits('btc', BigNumber('7000000000000000000000000'), 10).should.equal(
        BigInt('69999999999999999280')
      );
    });

    it('should allow changing the numerator of the trading pair', () => {
      // $3.38 market value for 1 eth at 338.2582 cents market price
      toMarketValueBaseUnits('teth', 338.2582, BigInt(10000000000000000).toString(), 'tsusd').should.equal(BigInt(338));
    });
  });
});
