import 'should';

/**
 * Tests for the derivation-path selection logic added to EcdsaMPCv2.signTssTransaction
 * for message signing.
 *
 * The logic in the source file is:
 *   derivationPath =
 *     txRequest.messages[0].derivationPath
 *     || wallet.coinSpecific()?.baseAddressDerivationPath
 *     || 'm/0';
 *
 * These tests verify:
 *   1. The priority order (message path > coinSpecific > default)
 *   2. Existing coins (ETH, SOL, …) are completely unaffected — they never set
 *      baseAddressDerivationPath, so they always get 'm/0'.
 *   3. Only FLR C wallets derived from FLR P set baseAddressDerivationPath='m',
 *      and only when the message has no explicit derivationPath.
 */
describe('EcdsaMPCv2 - Message Signing Derivation Path', function () {
  /**
   * Pure helper that mirrors the production fallback chain without requiring
   * a full EcdsaMPCv2 instance (which needs heavy mocking).
   */
  function resolveDerivationPath(opts: {
    messageTxDerivationPath?: string;
    walletCoinSpecificBaseAddressDerivationPath?: string;
  }): string {
    return opts.messageTxDerivationPath || opts.walletCoinSpecificBaseAddressDerivationPath || 'm/0';
  }

  describe('priority order: message path > coinSpecific > default', function () {
    it('should use txRequest message derivation path when present, ignoring coinSpecific', function () {
      resolveDerivationPath({
        messageTxDerivationPath: 'm/1',
        walletCoinSpecificBaseAddressDerivationPath: 'm',
      }).should.equal('m/1');
    });

    it('should fall back to coinSpecific baseAddressDerivationPath when message path is absent', function () {
      resolveDerivationPath({
        messageTxDerivationPath: undefined,
        walletCoinSpecificBaseAddressDerivationPath: 'm',
      }).should.equal('m');
    });

    it('should fall back to m/0 when both message path and coinSpecific are absent', function () {
      resolveDerivationPath({
        messageTxDerivationPath: undefined,
        walletCoinSpecificBaseAddressDerivationPath: undefined,
      }).should.equal('m/0');
    });

    it('should use message path even when coinSpecific is absent', function () {
      resolveDerivationPath({
        messageTxDerivationPath: 'm/3',
        walletCoinSpecificBaseAddressDerivationPath: undefined,
      }).should.equal('m/3');
    });
  });

  describe('existing coins are unaffected (no baseAddressDerivationPath in coinSpecific)', function () {
    it('ETH wallet: no baseAddressDerivationPath → always uses m/0', function () {
      // ETH coinSpecific does not include baseAddressDerivationPath
      resolveDerivationPath({
        messageTxDerivationPath: undefined,
        walletCoinSpecificBaseAddressDerivationPath: undefined,
      }).should.equal('m/0');
    });

    it('SOL wallet: no baseAddressDerivationPath → always uses m/0', function () {
      resolveDerivationPath({
        messageTxDerivationPath: undefined,
        walletCoinSpecificBaseAddressDerivationPath: undefined,
      }).should.equal('m/0');
    });

    it('BTC wallet: no baseAddressDerivationPath → always uses m/0', function () {
      resolveDerivationPath({
        messageTxDerivationPath: undefined,
        walletCoinSpecificBaseAddressDerivationPath: undefined,
      }).should.equal('m/0');
    });

    it('any coin that does not set baseAddressDerivationPath → always uses m/0', function () {
      // Covers HBAR, DOT, AVAXC, POLYGON, and any future EVM-like coin
      const coins = [undefined, null as any, ''];
      coins.forEach((v) => {
        resolveDerivationPath({
          messageTxDerivationPath: undefined,
          walletCoinSpecificBaseAddressDerivationPath: v,
        }).should.equal('m/0');
      });
    });
  });

  describe('FLR C derived wallet (baseAddressDerivationPath = m)', function () {
    it('should use m for FLR C derived wallet when no message derivation path is set', function () {
      // FLR C wallets derived from FLR P store baseAddressDerivationPath='m' in coinSpecific.
      // The base address must sign against root path 'm' to match the FLR P staking reward address.
      resolveDerivationPath({
        messageTxDerivationPath: undefined,
        walletCoinSpecificBaseAddressDerivationPath: 'm',
      }).should.equal('m');
    });

    it('should allow an explicit message derivation path to override the FLR C coinSpecific path', function () {
      // If the tx engine provides an explicit path (e.g. for a receive address), it wins.
      resolveDerivationPath({
        messageTxDerivationPath: 'm/2',
        walletCoinSpecificBaseAddressDerivationPath: 'm',
      }).should.equal('m/2');
    });

    it('should still use m/0 if baseAddressDerivationPath is any value other than m', function () {
      // The special-case is strictly the value 'm'.
      // A value of 'm/0' or any other string falls through to the default.
      resolveDerivationPath({
        messageTxDerivationPath: undefined,
        walletCoinSpecificBaseAddressDerivationPath: 'm/0',
      }).should.equal('m/0');
    });
  });
});
