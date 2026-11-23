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

  describe('assertSignableConsistency for legacy type-0 envelopes (CECHO-2681)', function () {
    const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
    const wrongAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
    const empty = Buffer.alloc(0);

    // Minimal RLP encoder (short form only) so the legacy fixtures do not depend on
    // @ethereumjs/* packages, which are not declared dependencies of this module.
    function rlpEncode(item: Buffer | Buffer[]): Buffer {
      if (!Array.isArray(item)) {
        if (item.length === 1 && item[0] < 0x80) {
          return item;
        }
        return Buffer.concat([Buffer.from([0x80 + item.length]), item]);
      }
      const body = Buffer.concat(item.map((entry) => rlpEncode(entry)));
      return Buffer.concat([Buffer.from([0xc0 + body.length]), body]);
    }

    function toMinimalBytes(value: number): Buffer {
      if (value === 0) {
        return empty;
      }
      const hex = value.toString(16);
      return Buffer.from(hex.length % 2 === 0 ? hex : `0${hex}`, 'hex');
    }

    // EIP-155 legacy fields: [nonce, gasPrice, gasLimit, to, value, data]. An unsigned
    // serialized legacy tx carries empty v/r/s, while the signing preimage carries the
    // chain id in the v slot and empty r/s.
    function buildLegacyEnvelope(chainId: number, to: string) {
      const fields = [
        toMinimalBytes(7),
        toMinimalBytes(10),
        toMinimalBytes(21000),
        Buffer.from(to.slice(2), 'hex'),
        toMinimalBytes(1000),
        empty,
      ];
      return {
        serializedTxHex: rlpEncode([...fields, empty, empty, empty]).toString('hex'),
        signableHex: rlpEncode([...fields, toMinimalBytes(chainId), empty, empty]).toString('hex'),
      };
    }

    const chainIds: Record<'kavaevm' | 'tkavaevm', number> = { kavaevm: 2222, tkavaevm: 2221 };

    for (const coinName of ['kavaevm', 'tkavaevm'] as const) {
      it(`should accept a consistent legacy envelope on ${coinName}`, function () {
        // createInstance is the registered factory; narrow to EvmCoin for the verifier methods.
        const coin = EvmCoin.createInstance(bitgo, coins.get(coinName)) as EvmCoin;
        const { serializedTxHex, signableHex } = buildLegacyEnvelope(chainIds[coinName], recipientAddress);

        // The TSS flow routes legacy type-0 preimages to serializedTxHex, which requires
        // coins.coinNameFromChainId(chainId) to resolve to a registered coin name.
        coin.shouldVerifyWithSerializedTxHex({ serializedTxHex, signableHex }).should.be.true();
        coin.assertSignableConsistency(serializedTxHex, signableHex);
      });

      it(`should reject a tampered signableHex on ${coinName}`, function () {
        const coin = EvmCoin.createInstance(bitgo, coins.get(coinName)) as EvmCoin;
        const { serializedTxHex } = buildLegacyEnvelope(chainIds[coinName], recipientAddress);
        const tamperedSignableHex = buildLegacyEnvelope(chainIds[coinName], wrongAddress).signableHex;

        (() => coin.assertSignableConsistency(serializedTxHex, tamperedSignableHex)).should.throw(
          'signableHex is inconsistent with serializedTxHex: possible server tampering'
        );
      });
    }
  });
});
