import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { EvmCoin } from '../../src/evmCoin';
import { coins } from '@bitgo/statics';

describe('EvmCoin', function () {
  let bitgo: TestBitGoAPI;
  let evmCoin: EvmCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  });

  describe('isValidAddress', function () {
    beforeEach(function () {
      // Create EvmCoin instance for testing
      const staticsCoin = coins.get('hbarevm');
      evmCoin = new (EvmCoin as any)(bitgo, staticsCoin);
    });

    it('should validate standard Ethereum addresses (backward compatible)', function () {
      const validAddresses = [
        '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      ];

      validAddresses.forEach((address) => {
        evmCoin.isValidAddress(address).should.be.true(`${address} should be valid`);
      });
    });

    it('should validate addresses without 0x prefix (backward compatible)', function () {
      const validAddresses = ['5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed', 'fB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'];

      validAddresses.forEach((address) => {
        evmCoin.isValidAddress(address).should.be.true(`${address} should be valid`);
      });
    });

    it('should reject invalid Ethereum addresses (backward compatible)', function () {
      const invalidAddresses = [
        '0xInvalidAddress',
        '0x123',
        'not-an-address',
        '',
        '0x',
        '0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      ];

      invalidAddresses.forEach((address) => {
        evmCoin.isValidAddress(address).should.be.false(`${address} should be invalid`);
      });
    });

    it('should work with first parameter only (backward compatible)', function () {
      const address = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
      evmCoin.isValidAddress(address).should.be.true();
    });

    describe('with optional isAlternateAddress parameter for HBAREVM', function () {
      it('should validate Hedera account IDs when isAlternateAddress is true', function () {
        const validHederaAccountIds = ['0.0.123456', '0.0.1234567890', '0.0.1'];

        validHederaAccountIds.forEach((accountId) => {
          evmCoin.isValidAddress(accountId, true).should.be.true(`${accountId} should be valid`);
        });
      });

      it('should reject invalid Hedera account IDs when isAlternateAddress is true', function () {
        const invalidHederaAccountIds = ['0.0', '0.0.abc', '0.0.-123', 'not-an-account-id'];

        invalidHederaAccountIds.forEach((accountId) => {
          evmCoin.isValidAddress(accountId, true).should.be.false(`${accountId} should be invalid`);
        });
      });

      it('should still validate Ethereum addresses when isAlternateAddress is false', function () {
        const ethAddress = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
        evmCoin.isValidAddress(ethAddress, false).should.be.true();
      });

      it('should validate Ethereum addresses when isAlternateAddress is undefined (default)', function () {
        const ethAddress = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
        evmCoin.isValidAddress(ethAddress, undefined).should.be.true();
      });
    });

    describe('for non-HBAREVM coins', function () {
      beforeEach(function () {
        // Create a non-HBAREVM coin instance
        const staticsCoin = coins.get('polygon');
        evmCoin = new (EvmCoin as any)(bitgo, staticsCoin);
      });

      it('should validate standard Ethereum addresses regardless of isAlternateAddress flag', function () {
        const ethAddress = '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed';
        evmCoin.isValidAddress(ethAddress).should.be.true();
        evmCoin.isValidAddress(ethAddress, false).should.be.true();
        evmCoin.isValidAddress(ethAddress, true).should.be.true();
      });

      it('should not validate Hedera account IDs even with isAlternateAddress=true', function () {
        const hederaAccountId = '0.0.123456';
        evmCoin.isValidAddress(hederaAccountId, true).should.be.false();
      });
    });
  });
});
