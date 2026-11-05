import * as assert from 'assert';
import { CoinFeature } from '@bitgo/statics';
import { IBaseCoin } from '../../../../../src';
import {
  isLegacyEvmSignableHex,
  shouldVerifyWithSerializedTxHex,
} from '../../../../../src/bitgo/utils/tss/serializedTxHexVerify';

describe('serializedTxHexVerify', function () {
  // 9-field legacy envelope: RLP([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]).
  // This is the EIP-155 signing preimage the platform sends as signableHex for a type-0 send,
  // even on chains that also support EIP-1559.
  // 0xe4 = short RLP list of 0x24 = 36 payload bytes: 1 + 1 + 3 + 21 + 3 + 1 + 4 + 1 + 1.
  const legacyPreimageHex =
    'e4' + '01' + '1e' + '825208' + '94' + '11'.repeat(20) + '8203e8' + '80' + '83088bb0' + '8080';

  const makeCoin = (opts: {
    features?: CoinFeature[];
    signablePreHashed?: boolean;
    withConsistency?: boolean;
  }): IBaseCoin => {
    return {
      getConfig: () => ({ features: opts.features ?? [] }),
      ...(opts.signablePreHashed !== undefined && {
        isSignablePreHashed: () => opts.signablePreHashed,
      }),
      ...(opts.withConsistency !== false && { assertSignableConsistency: () => undefined }),
    } as unknown as IBaseCoin;
  };

  describe('isLegacyEvmSignableHex', function () {
    it('detects a 9-field legacy envelope, with or without 0x', function () {
      assert.strictEqual(isLegacyEvmSignableHex(legacyPreimageHex), true);
      assert.strictEqual(isLegacyEvmSignableHex('0x' + legacyPreimageHex), true);
    });

    it('does not treat a typed (EIP-1559) envelope as legacy', function () {
      // 0x02 || RLP([...]) — the unsigned type-2 envelope the platform sends as signableHex.
      assert.strictEqual(isLegacyEvmSignableHex('02' + legacyPreimageHex), false);
    });

    it('does not treat hashes or non-RLP signables as legacy', function () {
      assert.strictEqual(isLegacyEvmSignableHex('11'.repeat(32)), false, '32-byte digest');
      assert.strictEqual(isLegacyEvmSignableHex('0000' + '11'.repeat(30)), false, 'Avalanche codec payload');
      assert.strictEqual(isLegacyEvmSignableHex('not-hex'), false);
    });

    it('does not treat an RLP list with the wrong field count as legacy', function () {
      // RLP list of two fields: 0xc2, 0x01, 0x02.
      assert.strictEqual(isLegacyEvmSignableHex('c20102'), false);
    });
  });

  describe('shouldVerifyWithSerializedTxHex', function () {
    it('routes a type-0 envelope on an EIP-1559-capable coin through serializedTxHex', function () {
      const coin = makeCoin({ features: [CoinFeature.EIP1559] });
      assert.strictEqual(
        shouldVerifyWithSerializedTxHex(coin, { signableHex: legacyPreimageHex, serializedTxHex: legacyPreimageHex }),
        true
      );
    });

    it('verifies a type-2 signableHex directly, without decoding serializedTxHex', function () {
      const coin = makeCoin({ features: [CoinFeature.EIP1559] });
      assert.strictEqual(
        shouldVerifyWithSerializedTxHex(coin, {
          signableHex: '02' + legacyPreimageHex,
          serializedTxHex: '02' + legacyPreimageHex + 'c08080',
        }),
        false
      );
    });

    it('honours CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX regardless of envelope', function () {
      const coin = makeCoin({ features: [CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] });
      assert.strictEqual(
        shouldVerifyWithSerializedTxHex(coin, { signableHex: '11'.repeat(32), serializedTxHex: '22'.repeat(32) }),
        true
      );
    });

    it('keeps the pre-hashed route for Avalanche atomic signables', function () {
      // A legacy-shaped signable would otherwise route to serializedTxHex, which for atomic
      // exports is an Avalanche codec payload that must not be parsed as an EVM transaction.
      const coin = makeCoin({ signablePreHashed: true });
      assert.strictEqual(
        shouldVerifyWithSerializedTxHex(coin, {
          signableHex: legacyPreimageHex,
          serializedTxHex: '0000' + '11'.repeat(30),
        }),
        false
      );
    });

    it('does not route coins that cannot bind the two hexes', function () {
      const coin = makeCoin({ withConsistency: false });
      assert.strictEqual(
        shouldVerifyWithSerializedTxHex(coin, { signableHex: legacyPreimageHex, serializedTxHex: legacyPreimageHex }),
        false
      );
    });

    it('detects a legacy envelope from signableHex alone, even without serializedTxHex', function () {
      // The route must not silently fall back to an unparseable preimage just because the
      // serialized bytes are missing: the signing paths reject that case explicitly.
      const coin = makeCoin({ features: [CoinFeature.EIP1559] });
      assert.strictEqual(shouldVerifyWithSerializedTxHex(coin, { signableHex: legacyPreimageHex }), true);
    });

    it('does not route without a signableHex or with an empty one', function () {
      const coin = makeCoin({ features: [CoinFeature.EIP1559] });
      assert.strictEqual(shouldVerifyWithSerializedTxHex(coin, { serializedTxHex: 'ab' }), false);
      assert.strictEqual(shouldVerifyWithSerializedTxHex(coin, { signableHex: '', serializedTxHex: 'ab' }), false);
      assert.strictEqual(shouldVerifyWithSerializedTxHex(coin), false);
    });
  });
});
