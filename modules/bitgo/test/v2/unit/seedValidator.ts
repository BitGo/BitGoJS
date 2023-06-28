import 'should';

import * as nock from 'nock';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';

import { SeedValidator } from '../../../src/v2/internal/seedValidator';
import { CoinFamily } from '@bitgo/statics';

describe('SeedValidators:', function () {
  let bitgo;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
  });

  describe('Seed validator', function () {
    it('should validate a hedera seed', function () {
      SeedValidator.isValidHbarSeedFormat('fafsdasdf').should.equal(false);
      SeedValidator.isValidHbarSeedFormat(
        '82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA'
      ).should.equal(true);
    });

    it('should identify seed types', function () {
      // stellar
      SeedValidator.isValidEd25519SeedForCoin(
        'SB3SBQH4EEZYBLAPNHWF6OLPE4IOYNSQQTATOJQGFCG3HMQ4VKKR5PRL',
        CoinFamily.XLM
      ).should.equal(true);

      // algo
      SeedValidator.isValidEd25519SeedForCoin(
        '2R4MFSNIAR4PQQGGYA6LK374X6MJEATRVNLREZ3GLAP2VYWLXDN2R4JLI4',
        CoinFamily.ALGO
      ).should.equal(true);

      // hbar
      SeedValidator.isValidEd25519SeedForCoin(
        '62b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01',
        CoinFamily.HBAR
      ).should.equal(true);
    });

    it('should pass on basic seed formats', function () {
      // stellar
      SeedValidator.hasCompetingSeedFormats(
        '82A34E3867EA7EA4E67E27865D500AE84E98D07AB1BAB06526F0A5A5FDCC3EBA'
      ).should.equal(false);

      // algo
      SeedValidator.hasCompetingSeedFormats('2R4MFSNIAR4PQQGGYA6LK374X6MJEATRVNLREZ3GLAP2VYWLXDN2R4JLI4').should.equal(
        false
      );

      // hbar
      SeedValidator.hasCompetingSeedFormats(
        '62b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01'
      ).should.equal(false);
    });
  });

  after(function () {
    nock.cleanAll();
  });
});
