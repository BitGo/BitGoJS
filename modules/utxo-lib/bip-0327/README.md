# BIP 0327 with BitGo legacy p2tr variant

This directory contains a modified version of the BIP-0327 MuSig2
reference implementation by @jonasnick.

The original code was taken from the following file:
https://github.com/bitcoin/bips/blob/ab9d5b8/bip-0327/reference.py

The modifications add support for an older aggregation method that is
used at BitGo in a deprecated address type (`p2tr`, chain 30 and 31).

The aggregation method is based on an older version of MuSig2 that predated this PR:
https://github.com/jonasnick/bips/pull/37

The recommended address type for taproot at BitGo is `p2trMusig2` (chains 40 and 41),
which uses the standard MuSig2 aggregation scheme.

## Implementation Differences

### 1. X-Only Pubkey Support

The `key_agg()` function has been enhanced to accept both 33-byte compressed pubkeys and 32-byte x-only pubkeys:

```python
def key_agg(pubkeys: List[bytes]) -> KeyAggContext:
    for pk in pubkeys:
        if len(pk) != len(pubkeys[0]):
            raise ValueError('all pubkeys must be the same length')

    # ...
    for i in range(u):
        # if the pubkey is 32 bytes, it is an xonly pubkey
        if len(pubkeys[i]) == 32:
            P_i = lift_x(pubkeys[i])
        else:
            P_i = cpoint(pubkeys[i])
```

This allows the implementation to work with both pubkey formats, checking the length to determine the appropriate parsing method.

### 2. Legacy p2tr Aggregation Function

A new function `key_agg_bitgo_p2tr_legacy()` implements the deprecated aggregation method:

```python
def key_agg_bitgo_p2tr_legacy(pubkeys: List[PlainPk]) -> KeyAggContext:
    # Convert compressed pubkeys to x-only format
    pubkeys = [pk[-32:] for pk in pubkeys]

    # Sort keys AFTER x-only conversion
    pubkeys = key_sort(pubkeys)

    # Aggregate using standard algorithm
    return key_agg(pubkeys)
```

**Key difference**: This method converts pubkeys to x-only format **before** sorting, whereas standard MuSig2 uses full 33-byte compressed keys throughout. This difference stems from the MuSig2 specification change documented in [jonasnick/bips#37](https://github.com/jonasnick/bips/pull/37).

### 3. Enhanced Signing and Verification Functions

Several functions were updated to handle x-only pubkeys properly:

**`get_session_key_agg_coeff()`**: Detects x-only pubkeys and uses appropriate format for coefficient calculation:

```python
# If pubkeys are x-only, use x-only for coefficient calculation
if len(pubkeys[0]) == 32:
    pk_for_coeff = pk[-32:]
else:
    pk_for_coeff = pk
return key_agg_coeff(pubkeys, pk_for_coeff)
```

**`sign()`**: Validates the secnonce against both compressed and x-only pubkey formats:

```python
if not pk == secnonce[64:97] and not pk[-32:] == secnonce[64:97]:
    raise ValueError('Public key does not match nonce_gen argument')
```

**`partial_sig_verify_internal()`**: Handles x-only pubkeys by prepending the appropriate prefix:

```python
# prepend a 0x02 if the pk is 32 bytes
P = cpoint(b'\x02' + pk) if len(pk) == 32 else cpoint(pk)
```

## Testing Differences

The testing code has been significantly restructured to validate BitGo-specific behavior.

### Refactored Test Helpers

The previous monolithic `test_sign_and_verify_random()` function has been broken down into reusable components:

**`sign_and_verify_with_aggpk()`**: Core signing workflow that:

- Generates nonces for two signers
- Supports both random nonce generation and deterministic signing
- Performs partial signature verification
- Tests nonce reuse protection
- Verifies the final aggregated signature

**`sign_and_verify_with_keys()`**: Simplified wrapper that generates random tweaks and calls the core signing function.

**`sign_and_verify_with_aggpk_bitgo()`**: BitGo-specific wrapper with no tweaks applied (BitGo doesn't use tweaks in production).

**`sign_and_verify_with_aggpk_bitgo_legacy()`**: Special handler for legacy p2tr that:

- Normalizes secret keys to produce even y-coordinate pubkeys
- Converts to x-only format
- Sorts by x-only pubkey order
- Validates the expected aggregate pubkey
- Performs full signing workflow

### BitGo-Specific Test Cases

Three new test functions validate BitGo's taproot implementations:

#### `test_agg_bitgo_derive()`

Sanity check that the test fixture private keys correctly derive to their expected public keys.

#### `test_agg_bitgo_p2tr_legacy()`

Tests the legacy p2tr aggregation (chains 30/31):

- Expected aggregate key: `cc899cac29f6243ef481be86f0d39e173c075cd57193d46332b1ec0b42c439aa`
- Verifies order-independence: aggregating `[user, bitgo]` and `[bitgo, user]` produce the same result (due to sorting after x-only conversion)
- Tests complete signing and verification workflow

#### `test_agg_bitgo_p2tr_musig2()`

Tests the standard MuSig2 aggregation (chains 40/41):

- Expected aggregate key `[user, bitgo]`: `c0e255b4510e041ab81151091d875687a618de314344dff4b73b1bcd366cdbd8`
- Expected aggregate key `[bitgo, user]`: `e48d309b535811eb0b148c4b0600a10e82e289899429e40aee05577504eca356`
- Verifies order-dependence: different key orders produce different aggregate keys (standard MuSig2 behavior)
- Tests both orderings with complete signing workflows

### Shared Test Fixtures

All BitGo tests use consistent keypairs:

```python
# Private keys from test fixtures
privkey_user = bytes.fromhex("a07e682489dad68834f7df8a5c8b34f3b9ff9fdd8809e2ba53ae29df65fc146b")
privkey_bitgo = bytes.fromhex("2d210ff6703d0fae0e9ca91e1d0bbab006b03e8e699f49becbaf554066fa79aa")

# Corresponding public keys
pubkey_user = PlainPk(bytes.fromhex("02d20a62701c54f6eb3abb9f964b0e29ff90ffa3b4e3fcb73e7c67d4950fa6e3c7"))
pubkey_bitgo = PlainPk(bytes.fromhex("03203ab799ce28e2cca044f594c69275050af4bb0854ad730a8f74622342300e64"))
```

**Important note**: These pubkeys have different sort orders depending on whether comparison is done on the full 33-byte compressed format or the 32-byte x-only format. This is precisely why the legacy and standard methods produce different aggregate keys.

## Running Tests

Execute all tests including BitGo-specific ones:

```bash
cd modules/utxo-lib/bip-0327
python3 reference.py
```

The test suite runs:

1. Standard BIP327 test vectors (key sorting, aggregation, nonces, signing, tweaks, deterministic signing, signature aggregation)
2. Random signing/verification tests (6 iterations)
3. BitGo derivation tests
4. BitGo legacy p2tr tests
5. BitGo standard p2trMusig2 tests

## References

- [BIP327 Specification](https://github.com/bitcoin/bips/blob/master/bip-0327.mediawiki)
- [BIP340 Schnorr Signatures](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- [MuSig2 32-byte to 33-byte key change](https://github.com/jonasnick/bips/pull/37)
- [Original BIP327 reference implementation](https://github.com/bitcoin/bips/blob/ab9d5b8/bip-0327/reference.py)
