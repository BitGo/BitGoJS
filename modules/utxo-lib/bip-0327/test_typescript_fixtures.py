#!/usr/bin/env python3
"""
Cross-validation tests for TypeScript MuSig2 implementation.

This test suite validates that the BIP-0327 reference implementation produces
identical results to the TypeScript implementation by comparing against
fixtures generated from TypeScript tests.

The tests use deterministic nonce generation with session IDs (Buffer.alloc(32, 1)
and Buffer.alloc(32, 2)) to ensure that both Python and TypeScript implementations
generate identical nonces and partial signatures, providing comprehensive
cross-language validation.
"""

import json
import os
from typing import Any, Dict

from reference import (
    key_agg,
    get_xonly_pk,
    apply_tweak,
    nonce_agg,
    nonce_gen_internal,
    SessionContext,
    get_session_values,
    sign,
    partial_sig_verify_internal,
    partial_sig_agg,
    schnorr_verify,
    tagged_hash,
    PlainPk,
    individual_pk,
)


def load_fixture(filename: str) -> Dict[str, Any]:
    """Load a JSON fixture file from the musig2 directory."""
    fixture_path = os.path.join(os.path.dirname(__file__), 'utxolibMusig2', filename)
    with open(fixture_path, 'r') as f:
        return json.load(f)


def hex_to_bytes(hex_str: str) -> bytes:
    """Convert a hex string to bytes."""
    return bytes.fromhex(hex_str)


def test_create_tap_internal_key() -> None:
    """Test that key aggregation matches TypeScript implementation."""
    print("Testing createTapInternalKey...")
    fixture = load_fixture('createTapInternalKey.json')
    
    # Get inputs from fixture
    pubkeys = [hex_to_bytes(pk) for pk in fixture['inputs']['pubKeys']]
    
    # Perform key aggregation
    keyagg_ctx = key_agg(pubkeys)
    tap_internal_key = get_xonly_pk(keyagg_ctx)
    
    # Verify against fixture
    expected = hex_to_bytes(fixture['output']['tapInternalKey'])
    assert tap_internal_key == expected, f"Expected {expected.hex()}, got {tap_internal_key.hex()}"
    print("  ✓ tapInternalKey matches")


def test_create_tap_output_key() -> None:
    """Test that tweaked key aggregation matches TypeScript implementation."""
    print("Testing createTapOutputKey...")
    fixture = load_fixture('createTapOutputKey.json')
    
    # Get inputs from fixture
    internal_pubkey = hex_to_bytes(fixture['inputs']['internalPubKey'])
    tap_tree_root = hex_to_bytes(fixture['inputs']['tapTreeRoot'])
    
    # Compute tap tweak as defined in BIP-0341 (Taproot)
    # BIP-0327 (MuSig2) provides apply_tweak(), but the tweak calculation itself
    # is specific to Taproot and defined in BIP-0341
    tweak = tagged_hash("TapTweak", internal_pubkey + tap_tree_root)
    
    # Apply tweak to get tap output key
    # First, create a keyagg context with the internal key
    # The internal key is already an x-only key, so we need to lift it
    from reference import lift_x, KeyAggContext
    P = lift_x(internal_pubkey)
    assert P is not None, "Failed to lift internal pubkey"
    keyagg_ctx = KeyAggContext(P, 1, 0)
    
    # Apply the tweak using BIP-0327's apply_tweak() function
    tweaked_ctx = apply_tweak(keyagg_ctx, tweak, is_xonly=True)
    tap_output_key = get_xonly_pk(tweaked_ctx)
    
    # Verify against fixture
    expected = hex_to_bytes(fixture['output']['tapOutputKey'])
    assert tap_output_key == expected, f"Expected {expected.hex()}, got {tap_output_key.hex()}"
    print("  ✓ tapOutputKey matches")


def test_create_tap_tweak() -> None:
    """Test that tap tweak computation matches TypeScript implementation."""
    print("Testing createTapTweak...")
    fixture = load_fixture('createTapTweak.json')
    
    # Get inputs from fixture
    tap_internal_key = hex_to_bytes(fixture['inputs']['tapInternalKey'])
    tap_merkle_root = hex_to_bytes(fixture['inputs']['tapMerkleRoot'])
    
    # Compute tap tweak as defined in BIP-0341 (Taproot)
    tap_tweak = tagged_hash("TapTweak", tap_internal_key + tap_merkle_root)
    
    # Verify against fixture
    expected = hex_to_bytes(fixture['output']['tapTweak'])
    assert tap_tweak == expected, f"Expected {expected.hex()}, got {tap_tweak.hex()}"
    print("  ✓ tapTweak matches")


def test_create_aggregate_nonce() -> None:
    """Test that nonce aggregation matches TypeScript implementation."""
    print("Testing createAggregateNonce...")
    fixture = load_fixture('createAggregateNonce.json')
    
    # Get inputs from fixture
    pub_nonces = [hex_to_bytes(nonce) for nonce in fixture['inputs']['pubNonces']]
    
    # Aggregate nonces
    agg_nonce = nonce_agg(pub_nonces)
    
    # Verify against fixture
    expected = hex_to_bytes(fixture['output']['aggregateNonce'])
    assert agg_nonce == expected, f"Expected {expected.hex()}, got {agg_nonce.hex()}"
    print("  ✓ aggregateNonce matches")


def test_create_musig2_signing_session() -> None:
    """Test that session creation matches TypeScript implementation."""
    print("Testing createMusig2SigningSession...")
    fixture = load_fixture('createMusig2SigningSession.json')
    
    # Get inputs from fixture
    pub_nonces = [hex_to_bytes(nonce) for nonce in fixture['inputs']['pubNonces']]
    tx_hash = hex_to_bytes(fixture['inputs']['txHash'])
    pubkeys = [PlainPk(hex_to_bytes(pk)) for pk in fixture['inputs']['pubKeys']]
    internal_pubkey = hex_to_bytes(fixture['inputs']['internalPubKey'])
    tap_tree_root = hex_to_bytes(fixture['inputs']['tapTreeRoot'])
    
    # Aggregate nonces
    agg_nonce = nonce_agg(pub_nonces)
    
    # Compute tap tweak as defined in BIP-0341 (Taproot)
    tweak = tagged_hash("TapTweak", internal_pubkey + tap_tree_root)
    
    # Create session context
    session_ctx = SessionContext(agg_nonce, pubkeys, [tweak], [True], tx_hash)
    
    # Get session values
    Q, gacc, tacc, b, R, e = get_session_values(session_ctx)
    
    # Verify against fixture
    expected_agg_nonce = hex_to_bytes(fixture['output']['sessionKey']['aggNonce'])
    assert agg_nonce == expected_agg_nonce, f"Expected aggNonce {expected_agg_nonce.hex()}, got {agg_nonce.hex()}"
    
    expected_msg = hex_to_bytes(fixture['output']['sessionKey']['msg'])
    assert tx_hash == expected_msg, f"Expected msg {expected_msg.hex()}, got {tx_hash.hex()}"
    
    expected_pubkey = hex_to_bytes(fixture['output']['sessionKey']['publicKey'])
    # The public key in the fixture is a full 65-byte uncompressed key (04 + x + y)
    # We need to compare with the tweaked aggregate key
    from reference import cbytes, has_even_y
    # Get the tweaked key from session context
    actual_pubkey_bytes = b'\x04' + Q[0].to_bytes(32, 'big') + Q[1].to_bytes(32, 'big')
    assert actual_pubkey_bytes == expected_pubkey, f"Expected publicKey {expected_pubkey.hex()}, got {actual_pubkey_bytes.hex()}"
    
    print("  ✓ sessionKey matches")


def test_partial_sign_and_verify() -> None:
    """Test that partial signing and verification matches TypeScript implementation."""
    print("Testing musig2PartialSignAndVerify...")
    fixture = load_fixture('musig2PartialSignAndVerify.json')
    
    # Get inputs from fixture
    private_keys = [hex_to_bytes(sk) for sk in fixture['inputs']['privateKeys']]
    pubkeys = [PlainPk(hex_to_bytes(pk)) for pk in fixture['inputs']['pubKeys']]
    tx_hash = hex_to_bytes(fixture['inputs']['txHash'])
    internal_pubkey = hex_to_bytes(fixture['inputs']['internalPubKey'])
    tap_tree_root = hex_to_bytes(fixture['inputs']['tapTreeRoot'])
    
    # Compute tap output key (needed for nonce generation)
    from reference import lift_x, KeyAggContext
    P = lift_x(internal_pubkey)
    assert P is not None
    keyagg_ctx = KeyAggContext(P, 1, 0)
    # Compute tap tweak as defined in BIP-0341 (Taproot)
    tweak = tagged_hash("TapTweak", internal_pubkey + tap_tree_root)
    tweaked_ctx = apply_tweak(keyagg_ctx, tweak, is_xonly=True)
    tap_output_key = get_xonly_pk(tweaked_ctx)
    
    # Generate deterministic nonces using the same session IDs as TypeScript
    # TypeScript uses Buffer.alloc(32, 1) and Buffer.alloc(32, 2)
    session_id_1 = bytes([1] * 32)
    session_id_2 = bytes([2] * 32)
    
    secnonce_1, pubnonce_1 = nonce_gen_internal(session_id_1, private_keys[0], pubkeys[0], tap_output_key, tx_hash, None)
    secnonce_2, pubnonce_2 = nonce_gen_internal(session_id_2, private_keys[1], pubkeys[1], tap_output_key, tx_hash, None)
    
    # Verify generated nonces match fixture
    expected_pubnonce_1 = hex_to_bytes(fixture['inputs']['pubNonces'][0])
    expected_pubnonce_2 = hex_to_bytes(fixture['inputs']['pubNonces'][1])
    assert pubnonce_1 == expected_pubnonce_1, f"Generated nonce 1 doesn't match: {pubnonce_1.hex()} vs {expected_pubnonce_1.hex()}"
    assert pubnonce_2 == expected_pubnonce_2, f"Generated nonce 2 doesn't match: {pubnonce_2.hex()} vs {expected_pubnonce_2.hex()}"
    
    # Aggregate nonces
    agg_nonce = nonce_agg([pubnonce_1, pubnonce_2])
    
    # Create session context
    session_ctx = SessionContext(agg_nonce, pubkeys, [tweak], [True], tx_hash)
    
    # Generate partial signatures
    partial_sig_1 = sign(secnonce_1, private_keys[0], session_ctx)
    partial_sig_2 = sign(secnonce_2, private_keys[1], session_ctx)
    
    # Verify generated partial signatures match fixture
    expected_partial_sig_1 = hex_to_bytes(fixture['output']['partialSigs'][0])
    expected_partial_sig_2 = hex_to_bytes(fixture['output']['partialSigs'][1])
    assert partial_sig_1 == expected_partial_sig_1, f"Generated partial sig 1 doesn't match: {partial_sig_1.hex()} vs {expected_partial_sig_1.hex()}"
    assert partial_sig_2 == expected_partial_sig_2, f"Generated partial sig 2 doesn't match: {partial_sig_2.hex()} vs {expected_partial_sig_2.hex()}"
    
    # Verify partial signatures
    is_valid_1 = partial_sig_verify_internal(partial_sig_1, pubnonce_1, pubkeys[0], session_ctx)
    is_valid_2 = partial_sig_verify_internal(partial_sig_2, pubnonce_2, pubkeys[1], session_ctx)
    
    verification_results = [is_valid_1, is_valid_2]
    expected_results = fixture['output']['verificationResults']
    assert verification_results == expected_results, f"Expected {expected_results}, got {verification_results}"
    print("  ✓ nonces match")
    print("  ✓ partial signatures match")
    print("  ✓ partial signature verification matches")


def test_aggregate_sigs() -> None:
    """Test that signature aggregation matches TypeScript implementation."""
    print("Testing musig2AggregateSigs...")
    fixture = load_fixture('musig2AggregateSigs.json')
    
    # Get inputs from fixture
    partial_sigs = [hex_to_bytes(sig) for sig in fixture['inputs']['partialSigs']]
    pubkeys = [PlainPk(hex_to_bytes(pk)) for pk in fixture['inputs']['pubKeys']]
    tx_hash = hex_to_bytes(fixture['inputs']['txHash'])
    internal_pubkey = hex_to_bytes(fixture['inputs']['internalPubKey'])
    tap_tree_root = hex_to_bytes(fixture['inputs']['tapTreeRoot'])
    
    # We need to recreate the session context to aggregate signatures
    # First, we need the aggregate nonce, which we don't have directly
    # But we can infer it from the partial signatures verification in the previous test
    # For now, let's load it from the other fixture
    partial_sign_fixture = load_fixture('musig2PartialSignAndVerify.json')
    pub_nonces = [hex_to_bytes(nonce) for nonce in partial_sign_fixture['inputs']['pubNonces']]
    agg_nonce = nonce_agg(pub_nonces)
    
    # Compute tap tweak as defined in BIP-0341 (Taproot)
    tweak = tagged_hash("TapTweak", internal_pubkey + tap_tree_root)
    
    # Create session context
    session_ctx = SessionContext(agg_nonce, pubkeys, [tweak], [True], tx_hash)
    
    # Aggregate partial signatures
    aggregated_sig = partial_sig_agg(partial_sigs, session_ctx)
    
    # Verify against fixture
    expected = hex_to_bytes(fixture['output']['aggregatedSig'])
    assert aggregated_sig == expected, f"Expected {expected.hex()}, got {aggregated_sig.hex()}"
    
    # Verify the aggregated signature
    tap_output_key = hex_to_bytes(fixture['output']['tapOutputKey'])
    is_valid = schnorr_verify(tx_hash, tap_output_key, aggregated_sig)
    
    expected_valid = fixture['output']['isValidAggregated']
    assert is_valid == expected_valid, f"Expected signature validity {expected_valid}, got {is_valid}"
    print("  ✓ aggregated signature matches and is valid")


def test_full_signing_flow() -> None:
    """Test the complete signing flow matches TypeScript implementation."""
    print("Testing fullSigningFlow...")
    fixture = load_fixture('fullSigningFlow.json')
    
    # Step 1: Verify tap keys
    pubkeys = [PlainPk(hex_to_bytes(pk)) for pk in fixture['staticInputs']['pubKeys']]
    
    # Key aggregation
    keyagg_ctx = key_agg([bytes(pk) for pk in pubkeys])
    internal_pubkey = get_xonly_pk(keyagg_ctx)
    
    expected_internal = hex_to_bytes(fixture['step1_tapKeys']['internalPubKey'])
    assert internal_pubkey == expected_internal, f"Step 1: Expected internal key {expected_internal.hex()}, got {internal_pubkey.hex()}"
    
    # Compute tap tweak as defined in BIP-0341 (Taproot)
    tap_tree_root = hex_to_bytes(fixture['staticInputs']['tapTreeRoot'])
    tweak = tagged_hash("TapTweak", internal_pubkey + tap_tree_root)
    
    expected_tweak = hex_to_bytes(fixture['step1_tapKeys']['tapTweak'])
    assert tweak == expected_tweak, f"Step 1: Expected tweak {expected_tweak.hex()}, got {tweak.hex()}"
    
    # Apply tweak
    tweaked_ctx = apply_tweak(keyagg_ctx, tweak, is_xonly=True)
    tap_output_key = get_xonly_pk(tweaked_ctx)
    
    expected_output = hex_to_bytes(fixture['step1_tapKeys']['tapOutputKey'])
    assert tap_output_key == expected_output, f"Step 1: Expected output key {expected_output.hex()}, got {tap_output_key.hex()}"
    print("  ✓ Step 1: tap keys match")
    
    # Step 2: Generate deterministic nonces
    private_keys = [hex_to_bytes(sk) for sk in fixture['staticInputs']['privateKeys']]
    tx_hash = hex_to_bytes(fixture['staticInputs']['txHash'])
    session_id_1 = bytes([1] * 32)
    session_id_2 = bytes([2] * 32)
    
    secnonce_1, pub_nonce1 = nonce_gen_internal(session_id_1, private_keys[0], pubkeys[0], tap_output_key, tx_hash, None)
    secnonce_2, pub_nonce2 = nonce_gen_internal(session_id_2, private_keys[1], pubkeys[1], tap_output_key, tx_hash, None)
    
    expected_nonce1 = hex_to_bytes(fixture['step2_nonces']['pubNonce1'])
    expected_nonce2 = hex_to_bytes(fixture['step2_nonces']['pubNonce2'])
    assert pub_nonce1 == expected_nonce1, f"Step 2: Expected nonce 1 {expected_nonce1.hex()}, got {pub_nonce1.hex()}"
    assert pub_nonce2 == expected_nonce2, f"Step 2: Expected nonce 2 {expected_nonce2.hex()}, got {pub_nonce2.hex()}"
    print("  ✓ Step 2: nonces generated and match")
    
    pub_nonces = [pub_nonce1, pub_nonce2]
    
    # Step 3: Aggregate nonces
    agg_nonce = nonce_agg(pub_nonces)
    
    expected_agg_nonce = hex_to_bytes(fixture['step3_aggregateNonce']['aggregateNonce'])
    assert agg_nonce == expected_agg_nonce, f"Step 3: Expected {expected_agg_nonce.hex()}, got {agg_nonce.hex()}"
    print("  ✓ Step 3: aggregate nonce matches")
    
    # Step 4: Create session
    session_ctx = SessionContext(agg_nonce, pubkeys, [tweak], [True], tx_hash)
    
    # Verify session key values
    expected_session_agg_nonce = hex_to_bytes(fixture['step4_sessionKey']['aggNonce'])
    assert agg_nonce == expected_session_agg_nonce, f"Step 4: Session aggNonce mismatch"
    
    expected_session_msg = hex_to_bytes(fixture['step4_sessionKey']['msg'])
    assert tx_hash == expected_session_msg, f"Step 4: Session msg mismatch"
    print("  ✓ Step 4: session key matches")
    
    # Step 5: Generate partial signatures
    partial_sig1 = sign(secnonce_1, private_keys[0], session_ctx)
    partial_sig2 = sign(secnonce_2, private_keys[1], session_ctx)
    
    expected_partial_sig1 = hex_to_bytes(fixture['step5_partialSigs']['partialSig1'])
    expected_partial_sig2 = hex_to_bytes(fixture['step5_partialSigs']['partialSig2'])
    assert partial_sig1 == expected_partial_sig1, f"Step 5: Expected sig1 {expected_partial_sig1.hex()}, got {partial_sig1.hex()}"
    assert partial_sig2 == expected_partial_sig2, f"Step 5: Expected sig2 {expected_partial_sig2.hex()}, got {partial_sig2.hex()}"
    print("  ✓ Step 5: partial signatures generated and match")
    
    # Step 6: Verify partial signatures
    is_valid1 = partial_sig_verify_internal(partial_sig1, pub_nonce1, pubkeys[0], session_ctx)
    is_valid2 = partial_sig_verify_internal(partial_sig2, pub_nonce2, pubkeys[1], session_ctx)
    
    expected_valid1 = fixture['step6_verification']['isValid1']
    expected_valid2 = fixture['step6_verification']['isValid2']
    assert is_valid1 == expected_valid1, f"Step 6: Expected sig1 validity {expected_valid1}, got {is_valid1}"
    assert is_valid2 == expected_valid2, f"Step 6: Expected sig2 validity {expected_valid2}, got {is_valid2}"
    print("  ✓ Step 6: partial signatures verified")
    
    # Step 7: Aggregate signatures
    aggregated_sig = partial_sig_agg([partial_sig1, partial_sig2], session_ctx)
    
    expected_aggregated = hex_to_bytes(fixture['step7_aggregation']['aggregatedSig'])
    assert aggregated_sig == expected_aggregated, f"Step 7: Expected {expected_aggregated.hex()}, got {aggregated_sig.hex()}"
    print("  ✓ Step 7: aggregated signature matches")
    
    # Step 8: Final verification
    is_valid_final = schnorr_verify(tx_hash, tap_output_key, aggregated_sig)
    
    expected_valid_final = fixture['step8_finalVerification']['isValidFinal']
    assert is_valid_final == expected_valid_final, f"Step 8: Expected {expected_valid_final}, got {is_valid_final}"
    print("  ✓ Step 8: final verification matches")


def main() -> None:
    """Run all cross-validation tests."""
    print("\n" + "="*60)
    print("TypeScript MuSig2 Cross-Validation Tests")
    print("="*60 + "\n")
    
    try:
        test_create_tap_internal_key()
        test_create_tap_output_key()
        test_create_tap_tweak()
        test_create_aggregate_nonce()
        test_create_musig2_signing_session()
        test_partial_sign_and_verify()
        test_aggregate_sigs()
        test_full_signing_flow()
        
        print("\n" + "="*60)
        print("✓ All cross-validation tests passed!")
        print("="*60 + "\n")
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        raise
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        raise


if __name__ == "__main__":
    main()

