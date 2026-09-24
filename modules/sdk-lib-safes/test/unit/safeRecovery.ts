import 'should';
import { SafeRecoveryUnsupportedError, assertSafeRecoverySupported } from '../../src';

describe('safeRecovery', function () {
  describe('assertSafeRecoverySupported', function () {
    it('does not throw for the supported pair', function () {
      (() => assertSafeRecoverySupported('secp256k1Multisig', 'utxo')).should.not.throw();
    });

    it('throws SafeRecoveryUnsupportedError for unsupported families on slot 1', function () {
      (() => assertSafeRecoverySupported('secp256k1Multisig', 'xrp')).should.throw(SafeRecoveryUnsupportedError);
      (() => assertSafeRecoverySupported('secp256k1Multisig', 'evm')).should.throw(SafeRecoveryUnsupportedError);
      (() => assertSafeRecoverySupported('secp256k1Multisig', 'trx')).should.throw(SafeRecoveryUnsupportedError);
      (() => assertSafeRecoverySupported('secp256k1Multisig', 'sol')).should.throw(SafeRecoveryUnsupportedError);
    });

    it('throws SafeRecoveryUnsupportedError for unsupported slots', function () {
      (() => assertSafeRecoverySupported('ecdsaMpc', 'utxo')).should.throw(SafeRecoveryUnsupportedError);
      (() => assertSafeRecoverySupported('eddsaMpc', 'utxo')).should.throw(SafeRecoveryUnsupportedError);
      (() => assertSafeRecoverySupported('ed25519Multisig', 'utxo')).should.throw(SafeRecoveryUnsupportedError);
    });

    it('throws SafeRecoveryUnsupportedError for an unknown family on an unknown slot', function () {
      (() => assertSafeRecoverySupported('ecdsaMpc', 'definitely-not-a-family')).should.throw(
        SafeRecoveryUnsupportedError
      );
    });
  });

  describe('SafeRecoveryUnsupportedError', function () {
    it('exposes a typed error naming the pair and coin', function () {
      (() => assertSafeRecoverySupported('ecdsaMpc', 'definitely-not-a-family', 'btc')).should.throw(
        SafeRecoveryUnsupportedError,
        {
          code: 'SAFE_RECOVERY_UNSUPPORTED',
          slot: 'ecdsaMpc',
          family: 'definitely-not-a-family',
          coin: 'btc',
        }
      );
    });
  });
});
