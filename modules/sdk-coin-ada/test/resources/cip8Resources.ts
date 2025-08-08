import * as CardanoSL from '@emurgo/cardano-serialization-lib-nodejs';
import { Buffer } from 'buffer';

export const cip8TestResources = {
  // Test address and key pair
  address: {
    bech32:
      'addr_test1qpxecfjurjtcnalwy6gxcqzp09je55gvfv79hghqst8p7p6dnsn9c8yh38m7uf5sdsqyz7t9nfgscjeutw3wpqkwrursutfm7h',
    paymentKeyHash: '5a0bf45a9f8214d9d44e20f806116bda59e10e706574b877501391b14',
  },
  keyPair: {
    prv: '38e3bf2573ebbc35b65b5bc91275e0ef05cc3ebd5bb913ede29c19fe0edacc8a',
    pub: 'c082eb504ec79dbdaecbf9c69745f88bb7973b02db8c4c73e4faeef349e21447',
  },

  // Test messages
  messages: {
    simple: 'Hello, Cardano!',
    utf8: 'こんにちは, Cardano!', // Test UTF-8 characters
    longer:
      'This is a longer message for testing the CIP8 message implementation. It contains multiple sentences and is intended to test how the implementation handles messages of varying lengths.',
  },

  // Pre-computed signatures for tests
  signatures: {
    simpleMessageSignature:
      '8458208458208a582000000000000000000000000000000000000000000000000000000000000000001a40158205a0bf45a9f8214d9d44e20f806116bda59e10e706574b877501391b14a1686866616c7365584073884144eb54ddc9a92cc5a5fff4bb38536c0489e75e84244c454419ebc5e636528d6c68e939a9c15d7f6d57e4da5ba68bca9b94f17ac0652d25470fac1207',
  },

  // Helper function to create a test signature
  createTestSignature: function (payload: string): Uint8Array {
    // This is a dummy function that returns a fixed signature
    // In real tests, we'd use actual cryptographic libraries to sign
    const buffer = Buffer.alloc(64, 0);
    buffer.write(payload.slice(0, 64), 'utf8');
    return buffer;
  },

  // Helper function to create a CSL public key from the test key pair
  createTestPublicKey: function (): CardanoSL.PublicKey {
    return CardanoSL.PublicKey.from_bytes(Buffer.from(this.keyPair.pub, 'hex'));
  },

  // Pre-computed signable payloads for verification
  signablePayloads: {
    simple: 'a0', // Example CBOR hex for simple message (will be replaced with actual values)
  },

  // Midnight Glacier Drop claim message test data
  midnightGlacierDrop: {
    validMessages: {
      mainnet:
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
      testnet:
        'STAR 250 to addr_test1qpxecfjurjtcnalwy6gxcqzp09je55gvfv79hghqst8p7p6dnsn9c8yh38m7uf5sdsqyz7t9nfgscjeutw3wpqkwrursutfm7h 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
    },
    invalidMessages: {
      missingStarPrefix:
        '100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
      invalidNumber:
        'STAR abc to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
      invalidAddress: 'STAR 100 to invalid_address 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
      shortAddress: 'STAR 100 to addr1short 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
      wrongHash:
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an wronghashhere',
      missingHash:
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an',
      extraContent:
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b extra content',
      caseSensitive:
        'star 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
    },
    tnc: {
      hash: '31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b',
    },
  },
};
