# Key Management for Starknet & Aztec Shielded Asset Transactions at BitGo

## Deep Research Report -- March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Core Problem](#2-the-core-problem)
3. [BitGo's Current Key Management Architecture](#3-bitgos-current-key-management-architecture)
4. [Starknet Key Management & Integration Design](#4-starknet-key-management--integration-design)
5. [Aztec Key Management & Integration Design](#5-aztec-key-management--integration-design)
6. [The ZK Circuit + MPC Problem (Midnight Reference)](#6-the-zk-circuit--mpc-problem-midnight-reference)
7. [Feasibility Matrix: All Alternatives](#7-feasibility-matrix-all-alternatives)
8. [Recommended Architecture](#8-recommended-architecture)
9. [Sources](#9-sources)

---

## 1. Executive Summary

This document analyzes how BitGo would manage keys if onboarding **Starknet** and **Aztec shielded asset transactions**, with the constraint that spending authorization must be 2-of-3 multisig while viewing/fee keys can be single-sig.

**Key findings:**

| Chain | Spend Key Multisig Approach | Viewing Key | Fee Key | Complexity |
|-------|---------------------------|-------------|---------|------------|
| **Starknet** | On-chain contract multisig (native AA) | N/A (transparent) | Separate (SNIP-9 sponsorship) | **Low** -- straightforward |
| **Aztec (shielded)** | Account contract multisig (signing keys outside ZK circuit) | Single-sig (protocol key, must be in PXE) | Separate (FPC sponsorship) | **Medium** -- signing keys externalized, protocol keys local |
| **Midnight (reference)** | TEE + threshold decryption OR collaborative SNARKs | Single-sig (`mn_shield-esk`) | Separate (DUST key) | **High** -- spend key must be in ZK circuit |

**The critical insight:** Starknet and Aztec both have native account abstraction where the spending authorization key is **decoupled** from ZK proof generation. This makes them fundamentally different from Midnight, where the spend key must be a private witness inside the ZK circuit. For Starknet and Aztec, BitGo's existing 2-of-3 model maps cleanly to contract-level multisig.

---

## 2. The Core Problem

### 2.1 BitGo's Trust Model

BitGo uses three independent keys where any two can authorize a transaction:

- **User Key** (index 0): Generated client-side, encrypted with user passphrase
- **Backup Key** (index 1): Generated offline, stored in cold storage
- **BitGo Key** (index 2): Generated and held within BitGo's HSM infrastructure

### 2.2 The ZK Privacy Challenge

Privacy chains introduce a new challenge: **zero-knowledge proofs**. In many ZK-based protocols, the spending key must be a private input (witness) to the ZK circuit to prove:
- The prover owns the UTXO/note being spent
- The nullifier is correctly derived (preventing double-spending)
- The transaction balances

This creates a fundamental tension: **BitGo needs the key in an HSM, but the ZK circuit needs the key in the prover**. MPC-based threshold ZK proving (splitting the key across parties who jointly compute the proof) has no production-ready off-the-shelf solution for arbitrary circuits.

### 2.3 The Good News

Both Starknet and Aztec have architectures that **separate** the ZK proof from the spending authorization. The ZK proof proves transaction validity, while the spending authorization (signature) is verified by a smart contract. This means BitGo can hold signing keys in HSMs and provide signatures externally, while the ZK proof is generated locally with only protocol-level keys.

---

## 3. BitGo's Current Key Management Architecture

### 3.1 SDK Structure (BitGoJS)

The BitGoJS monorepo (`modules/sdk-core`) defines the keychain structure:

```typescript
// Key indices (canonical triplet)
enum KeyIndices { USER = 0, BACKUP = 1, BITGO = 2 }

// Keychain types
type: 'tss' | 'independent' | 'blsdkg'
source: 'bitgo' | 'backup' | 'user' | 'cold'
```

### 3.2 Supported Signature Schemes

| Chain Type | Scheme | Curves in sdk-lib-mpc |
|------------|--------|----------------------|
| UTXO (BTC, LTC, ZEC) | On-chain P2SH 2-of-3 multisig | secp256k1 |
| ETH/EVM (contract) | Smart contract multisig (`WalletSimple`) | secp256k1 |
| ETH/EVM (TSS) | Off-chain MPC (DKLS protocol) | secp256k1 |
| EdDSA chains (SOL, ADA) | Off-chain MPC (EdDSA) | Ed25519 |

**Not currently supported:** Stark curve, BN254, Grumpkin, BLS12-381.

### 3.3 HSM Capabilities

BitGo's custom HSMs (in partnership with Thales Luna):
- ECDSA signing on secp256k1
- EdDSA signing on Ed25519
- BIP32 HD key derivation
- Policy enforcement before signing
- GPG-encrypted communication for TSS share exchange

### 3.4 How BitGo Handles Non-Native-Multisig Chains

For Ethereum (no native multisig), BitGo deploys a `WalletSimple` smart contract:
- 3 signer addresses set at initialization (immutable)
- Requires 2-of-3 signatures: one off-chain + `msg.sender`
- Uses `ecrecover()` for signature validation
- Forwarder contracts with CREATE2 for deposit addresses

This same pattern -- **contract-level multisig** -- is the foundation for Starknet and Aztec integration.

### 3.5 Privacy Coin Precedent

BitGo supports Zcash but **only transparent addresses**. No shielded transaction support, no viewing keys, no spending keys for shielded addresses. This research addresses what it would take to go beyond transparent-only support.

---

## 4. Starknet Key Management & Integration Design

### 4.1 Starknet Cryptographic Primitives

| Parameter | Value |
|-----------|-------|
| **Curve** | STARK curve: `y^2 = x^3 + x + beta` (Weierstrass) |
| **Field prime** | `P = 2^251 + 17 * 2^192 + 1` (~251 bits) |
| **Signing** | ECDSA with RFC 6979 deterministic nonce |
| **Hash** | Pedersen (legacy/addresses) + Poseidon (newer/class hashes) |
| **Native type** | `felt252` (field elements) |

The STARK curve is **not** secp256k1, secp256r1, or any standard curve. It is purpose-built for STARK-friendly arithmetic.

### 4.2 Account Abstraction: Every Account Is a Contract

Starknet has **native account abstraction** -- there are no EOAs. Every account is a smart contract implementing:

```cairo
trait ISRC6 {
    fn __validate__(calls: Array<Call>) -> felt252;      // Custom auth logic
    fn __execute__(calls: Array<Call>) -> Array<Span<felt252>>;  // Execute txns
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;
}
```

The `__validate__` function is **fully programmable** -- it can implement any authentication scheme: single-key ECDSA, N-of-M multisig, Webauthn/passkeys, session keys, or custom policies.

### 4.3 Starknet Multisig Solutions (Production-Ready)

#### Argent Multisig (Recommended)

**Repository:** [argentlabs/argent-contracts-starknet](https://github.com/argentlabs/argent-contracts-starknet)
**Audited by:** Consensys Diligence + ChainSecurity

Key properties:
- Native N-of-M multisig account contract (the multisig IS the account)
- Threshold-based: stores `threshold` and set of `signers`
- **Multiple signer types supported**:

```cairo
enum SignerSignature {
    Starknet: (StarknetSigner, StarknetSignature),    // Stark curve ECDSA
    Secp256k1: (Secp256k1Signer, Secp256k1Signature), // ETH-compatible
    Secp256r1: (Secp256r1Signer, Secp256r1Signature), // WebAuthn
    Eip191: (Eip191Signer, Secp256r1Signature),
    Webauthn: (WebauthnSigner, WebauthnSignature),
}
```

- Max 32 signers, signatures must be ordered by signer GUID
- Supports `execute_from_outside` (SNIP-9) for fee sponsorship
- Signer/threshold changes require threshold approvals

**Critical for BitGo:** Argent supports **secp256k1 signers**, meaning BitGo could reuse existing HSM infrastructure (secp256k1 ECDSA) without implementing the STARK curve in the HSM.

#### OpenZeppelin Multisig Component

**Repository:** [OpenZeppelin/cairo-contracts](https://github.com/OpenZeppelin/cairo-contracts)

Governance-style submit/confirm/execute flow. More suited for treasury/DAO operations than wallet operations.

### 4.4 Proposed BitGo Architecture for Starknet

```
+-------------------+     +-------------------+     +-------------------+
|   BitGo HSM       |     |   User Key        |     |   Backup Key      |
| (secp256k1 key)   |     | (Stark/secp256k1) |     | (secp256k1 key)   |
+--------+----------+     +--------+----------+     +--------+----------+
         |                          |                          |
         |    Signature (r1, s1)    |    Signature (r2, s2)    |
         +-----------+--------------+-----------+--------------+
                     |                          |
                     v                          v
         +--------------------------------------------------+
         |  Starknet Multisig Account Contract (Argent)     |
         |                                                  |
         |  threshold = 2                                   |
         |  signers = [HSM_pubkey, User_pubkey, Backup]     |
         |                                                  |
         |  __validate__():                                 |
         |    - Extract tx_hash from get_tx_info()          |
         |    - Verify >= 2 valid signatures                |
         |    - Each from distinct registered signer        |
         |    - Return 'VALID'                              |
         +--------------------------------------------------+
```

### 4.5 Transaction Signing Flow

```
1. User initiates transaction (e.g., "Send 100 STRK to 0xRecipient")

2. BitGo constructs the Call array and computes the transaction hash:
   tx_hash = pedersen("invoke", version, account_address, 0,
                       pedersen(calldata), max_fee, chain_id, nonce)

3. Collect 2-of-3 signatures:
   a) User signs tx_hash with their key -> (r_user, s_user)
   b) BitGo HSM signs tx_hash -> (r_hsm, s_hsm)
   (Backup key not needed for normal operations)

4. Construct signature array (ordered by signer GUID):
   signature = [signer1_type, signer1_pubkey, r1, s1,
                signer2_type, signer2_pubkey, r2, s2]

5. Submit INVOKE transaction to Starknet sequencer

6. Sequencer: __validate__ -> verify 2 signatures -> 'VALID'
7. Sequencer: charge fee from account
8. Sequencer: __execute__ -> dispatch the transfer call
```

### 4.6 SDK Integration

All three Starknet SDKs support custom signers:

**starknet.js** -- `SignerInterface` with `signRaw(messageHash)`:
```typescript
class BitGoHSMSigner extends RawSigner {
    async signRaw(messageHash: string): Promise<Signature> {
        const { r, s } = await bitgoHSM.ecdsaSign('secp256k1', this.keyId, messageHash);
        return [r, s];
    }
}
```

**starknet-rs** -- `Signer` trait with `sign_hash(&Felt)` (async, perfect for HSM calls)

**starknet.py** -- `BaseSigner` with `sign_transaction()`

### 4.7 Key Derivation

Starknet uses EIP-2645 for HD derivation: `m/2645'/layer'/application'/eth_addr_1'/eth_addr_2'/index`. A grinding algorithm maps BIP-32 keys to the STARK curve field.

If BitGo uses **secp256k1 signers** (via Argent's multi-signer support), standard BIP-32 derivation applies and no new key derivation scheme is needed.

### 4.8 Fee Sponsorship

Via `execute_from_outside` (SNIP-9):
- An external relayer submits the transaction on behalf of the account
- The relayer pays gas from a separate account
- The multisig signatures are still required
- This enables a **separate fee payer key** (single-sig) that BitGo controls

### 4.9 Account Deployment

Starknet supports counterfactual deployment:
1. Compute address deterministically from `(multisig_class_hash, [3_pubkeys, threshold=2], salt)`
2. Fund the address with ETH/STRK for gas
3. Submit DEPLOY_ACCOUNT transaction (1 signature sufficient for Argent deployment)
4. All subsequent transactions require 2-of-3

### 4.10 Starknet Assessment

| Aspect | Assessment |
|--------|-----------|
| **Multisig approach** | On-chain contract multisig via Argent (audited, production-grade) |
| **HSM compatibility** | HIGH -- can use existing secp256k1 HSM keys |
| **New curve needed in HSM** | No (if using secp256k1 signer type); Yes (if using native Stark curve) |
| **Complexity** | LOW -- maps directly to BitGo's ETH smart contract multisig pattern |
| **Key rotation** | Supported without address change |
| **Privacy concerns** | None -- Starknet is transparent (like Ethereum) |
| **Fee sponsorship** | Native via SNIP-9 execute_from_outside |

---

## 5. Aztec Key Management & Integration Design

### 5.1 Aztec Key Hierarchy (Two Classes of Keys)

Aztec maintains a strict separation between **protocol keys** (embedded in the address, non-rotatable) and **signing keys** (fully abstracted, rotatable):

#### Protocol Keys (derived from a single master seed, non-rotatable)

| Key | Notation | Purpose | In ZK Circuit? |
|-----|----------|---------|---------------|
| Nullifier Key | `nsk_m` / `Npk_m` | Derive nullifiers to prevent double-spending | YES (app-siloed `nsk_app`) |
| Incoming Viewing Key | `ivsk_m` / `Ivpk_m` | Decrypt notes sent TO the account | YES |
| Outgoing Viewing Key | `ovsk_m` / `Ovpk_m` | Decrypt notes sent BY the account | YES |
| Tagging Key | `tsk_m` / `Tpk_m` | Note discovery tagging scheme | YES |

All derived from a single master seed using domain-separated Poseidon2 hashing:
```
ivsk_m = poseidon2("az_ivsk_m", seed)
nsk_m  = poseidon2("az_nsk_m", seed)
ovsk_m = poseidon2("az_ovsk_m", seed)
tsk_m  = poseidon2("az_tvsk_m", seed)
```

Public keys are derived on the **Grumpkin curve**: `Ivpk_m = ivsk_m * G`

#### Signing Keys (defined by account contract, rotatable)

| Key | Purpose | In ZK Circuit? |
|-----|---------|---------------|
| Signing Private Key | Transaction authorization | **NO** -- only signature enters circuit via oracle |
| Signing Public Key | Stored as encrypted note in contract | Loaded from storage inside circuit |

### 5.2 THE CRITICAL INSIGHT: Signing Keys Are NOT In the ZK Circuit

This is the most important finding for BitGo integration:

**The signing private key never enters the ZK circuit.** The flow is:

```
1. PXE constructs transaction
2. Account contract's entrypoint calls is_valid_impl()
3. is_valid_impl() loads signing PUBLIC key from encrypted storage (a private note)
4. is_valid_impl() loads auth witness (SIGNATURE) via oracle: unsafe { get_auth_witness(hash) }
5. is_valid_impl() verifies signature against public key INSIDE the circuit
6. ZK proof of entire execution is generated
```

The **signing** happens **outside** the circuit. The wallet/PXE calls an `AuthWitnessProvider` to create the signature, and this interface can be externalized to an HSM.

### 5.3 AuthWitnessProvider: The BitGo Integration Point

```typescript
// TypeScript interface for external signing
interface AuthWitnessProvider {
    createAuthWit(messageHash: Fr): Promise<AuthWitness>;
}

// BitGo HSM implementation
class BitGoAuthWitnessProvider implements AuthWitnessProvider {
    constructor(private bitgoClient: BitGoClient, private keyId: string) {}

    async createAuthWit(messageHash: Fr): Promise<AuthWitness> {
        // Send hash to BitGo HSM for 2-of-3 threshold signing
        const signature = await this.bitgoClient.thresholdSign(
            this.keyId,
            messageHash.toBuffer()
        );
        return new AuthWitness(messageHash, [...signature]);
    }
}
```

### 5.4 Available Account Contract Signature Schemes

| Contract | Curve | HSM Compatible? |
|----------|-------|----------------|
| `schnorr_account_contract` | Grumpkin/Schnorr | Needs Grumpkin support |
| `ecdsa_k_account_contract` | **secp256k1/ECDSA** | **YES -- existing BitGo HSM** |
| `ecdsa_r_account_contract` | secp256r1/ECDSA | Yes (WebAuthn HSMs) |

**The `ecdsa_k_account_contract` uses secp256k1**, which is directly compatible with BitGo's existing HSM infrastructure.

### 5.5 Building a Multisig Account Contract for Aztec

Aztec does **not** ship a built-in multisig. A custom 2-of-3 multisig account contract would:

```noir
// Conceptual Noir pseudocode for 2-of-3 multisig
#[contract_library_method]
fn is_valid_impl(context: &mut PrivateContext, outer_hash: Field) -> bool {
    let storage = Storage::init(context);
    let keys = storage.signing_keys.get_notes();  // 3 public keys

    // Load auth witnesses (signatures) from each participating signer
    let witness_1: [Field; 64] = unsafe { get_auth_witness(compute_slot(outer_hash, 0)) };
    let witness_2: [Field; 64] = unsafe { get_auth_witness(compute_slot(outer_hash, 1)) };

    let mut valid_count: u32 = 0;

    // Verify each signature against registered public keys
    for key in keys {
        if ecdsa_verify(key, witness_1, outer_hash) { valid_count += 1; }
        if ecdsa_verify(key, witness_2, outer_hash) { valid_count += 1; }
    }

    valid_count >= 2  // 2-of-3 threshold
}
```

**Cost of multisig verification is ZERO on-chain** -- all verification happens client-side in ZK. The sequencer only verifies the constant-size proof.

### 5.6 Proposed BitGo Architecture for Aztec

```
[User Device / BitGo PXE Node]          [BitGo HSM Infrastructure]
  |                                           |
  PXE (protocol keys: ivsk, nsk,              HSM/MPC (signing keys: 2-of-3)
       ovsk, tsk - single sig)                secp256k1 ECDSA
  |                                           |
  |-- Construct tx, compute msg hash -------> |
  |                                           |-- Collect 2-of-3 signatures
  |<-- Return AuthWitness (2 signatures) ---- |
  |                                           |
  |-- Generate ZK proof locally (includes     |
  |   signature verification in circuit)      |
  |-- Submit proof to sequencer               |
  |                                           |
  [Separate: Fee Payer Contract (FPC)]        [Fee sponsorship key (single-sig)]
```

### 5.7 Key Separation: What Goes Where

| Key Type | Who Holds It | Single or Multi-Sig | Notes |
|----------|-------------|---------------------|-------|
| **Signing keys** (secp256k1) | BitGo HSM (2-of-3) | **2-of-3 multisig** | Same as ETH model |
| **Incoming viewing key** (`ivsk_m`) | PXE (BitGo-operated) | **Single-sig** | Required for note decryption |
| **Nullifier key** (`nsk_m`) | PXE (BitGo-operated) | **Single-sig** | Required for nullifier derivation |
| **Outgoing viewing key** (`ovsk_m`) | PXE (BitGo-operated) | **Single-sig** | Required for outgoing note encryption |
| **Tagging key** (`tsk_m`) | PXE (BitGo-operated) | **Single-sig** | Required for note discovery |
| **Fee payer key** | BitGo FPC contract | **Single-sig** | Separate fee sponsorship |

### 5.8 Fee Sponsorship in Aztec

Aztec implements **fee abstraction** via Fee Paying Contracts (FPCs):

- **Fee Juice**: Native non-transferable fee token
- **Sponsored FPC**: A third-party contract pays fees unconditionally
- **Token-based FPC**: Pay in any token; FPC converts to fee juice
- **Private FPC**: User pays FPC privately, FPC pays sequencer publicly (preserving privacy)

BitGo can operate an FPC with a **single-sig fee key** that sponsors transactions for its users. This key is completely separate from the spending keys.

### 5.9 Protocol Key Management Challenges

| Challenge | Impact | Mitigation |
|-----------|--------|------------|
| **Protocol keys non-rotatable** | If compromised, account must be abandoned | Protect master seed extremely well; store in HSM |
| **PXE needs protocol keys** | BitGo must run PXE infrastructure | Run PXE nodes in BitGo's secure environment |
| **Notes encrypted to single `Ivpk_m`** | All parties need viewing key access | BitGo runs PXE; shares viewing data via API |
| **No built-in multisig** | Custom contract needed | Write and audit a 2-of-3 multisig account contract |

### 5.10 Aztec Assessment

| Aspect | Assessment |
|--------|-----------|
| **Multisig approach** | Custom account contract with 2-of-3 signing key verification |
| **HSM compatibility** | HIGH -- `ecdsa_k_account_contract` uses secp256k1 |
| **Signing key in ZK circuit?** | **NO** -- only signature enters via oracle |
| **Protocol keys in ZK circuit?** | YES -- viewing/nullifier keys must be in PXE |
| **Complexity** | MEDIUM -- need custom multisig contract + PXE infrastructure |
| **Privacy** | FULL -- shielded notes, private execution |
| **Fee sponsorship** | Native via FPC (single-sig, separate from spending) |
| **Viewing key sharing** | Single-sig, can be in BitGo PXE across wallets |

---

## 6. The ZK Circuit + MPC Problem (Midnight Reference)

### 6.1 How Midnight Differs

Unlike Starknet and Aztec, Midnight (based on the Zswap/Zerocash protocol) requires the **spend key as a private witness inside the ZK circuit**:

```
Midnight ZK Circuit:
  Private Inputs (Witnesses):
    - spending_key (sk)          <-- THE PROBLEM
    - note_value, note_type
    - merkle_path
  Public Inputs:
    - nullifier (derived from sk)
    - commitment
    - merkle_root
  Proof: "I know sk such that nullifier = H(sk, note) AND commitment is in merkle_tree"
```

The spend key **must** be present for:
1. Nullifier derivation: `nullifier = H(spending_key, note_data)`
2. Ownership proof: Proving the note belongs to the spender
3. Balance verification: Ensuring inputs = outputs via homomorphic commitments

### 6.2 Why MPC + ZK Is Hard

In a standard ZK circuit, the spending key enters as a single field element. Non-linear operations (hash functions for nullifiers) cannot be computed over secret shares without interaction between share-holders. The circuit is a fixed computation graph expecting concrete field elements.

**Options:**

| Approach | Status | Overhead | Production Ready? |
|----------|--------|----------|------------------|
| **Reconstruct key, then prove** | Simple | None | Yes (but single point of exposure) |
| **Collaborative ZK (MPC-in-the-prover)** | Emerging | ~2x for honest majority | Partially (TACEO) |
| **HSM-based proving** | Infeasible | N/A | No (HSMs lack compute/memory) |
| **TEE-based proving** | Production | <5% | Yes (Phala + Succinct SP1) |

### 6.3 Collaborative ZK-SNARKs (TACEO)

**TACEO:Proof** is the first production-grade collaborative SNARK system:
- Live since mid-2025, **1M+ proofs generated**
- 3-node committee model (maps to BitGo's 2-of-3)
- Supports Circom (feature complete) and Noir (in development)
- Ozdemir-Boneh protocol: honest majority (2-of-3) achieves **essentially zero overhead**
- Largest deployment: World (Worldcoin) biometric verification for 14M+ users

**Limitation:** Currently supports Circom and Noir circuits only. Would need adaptation for Midnight's Halo2/Pluto-Eris circuits.

### 6.4 TEE-Based Approach

The most production-ready approach for protocols like Midnight:

```
[BitGo HSMs] -- 2-of-3 threshold decrypt spending key
       |
       v
[TEE (Intel TDX / Confidential VM)] -- reconstruct key, run proof server
       |
       v
[ZK Proof] --> [Midnight Network]

[Separate node with mn_shield-esk] --> [Indexer API for balance monitoring]
```

- Phala Network + Succinct Labs: SP1 zkVM inside TEE, <5% overhead, 30K+ TEE devices
- Key never exists outside HSM + TEE boundary
- Remote attestation proves computation integrity

### 6.5 Midnight Key Separation (Reference)

| Key | Purpose | Can Be Shared? |
|-----|---------|---------------|
| Spending Key (`sk`) | Authorize spends in ZK circuit | NO -- must be in prover |
| Encryption Secret Key (`mn_shield-esk`) | Decrypt shielded transactions | YES -- for monitoring |
| DUST Secret Key | DUST UTXO ownership | Separate from NIGHT keys |

BitGo's current Midnight partnership covers only unshielded NIGHT token custody. Shielded operations remain an open problem.

### 6.6 Why Starknet and Aztec Don't Have This Problem

| Protocol | Spend Authorization | ZK Proof Witness |
|----------|-------------------|-----------------|
| **Starknet** | Contract `__validate__` (signature check) | N/A (no privacy ZK) |
| **Aztec** | Account contract `is_valid_impl` (signature via oracle) | Protocol keys only (viewing, nullifier) |
| **Midnight** | Part of ZK circuit witness | **Spending key** |

Starknet has no privacy layer -- all transactions are transparent. The ZK proofs are for computational integrity (STARK validity proofs), not transaction privacy.

Aztec **decouples** authorization from proof generation. The signing key signs a message externally, and only the signature enters the circuit. The ZK circuit proves the private function execution is valid, including that a valid signature was provided.

---

## 7. Feasibility Matrix: All Alternatives

### 7.1 For Starknet

| Approach | Feasibility | Recommendation |
|----------|------------|----------------|
| **Argent contract multisig (secp256k1)** | Production-ready, audited | **RECOMMENDED** |
| Argent contract multisig (Stark curve) | Requires HSM firmware update | Good long-term option |
| OpenZeppelin governance multisig | Production-ready but governance-oriented | For treasury use |
| Custom BitGo account contract | High dev cost, needs audit | Only if specific policies needed |
| MPC/TSS on Stark curve | Not supported in sdk-lib-mpc | Not recommended |

### 7.2 For Aztec

| Approach | Feasibility | Recommendation |
|----------|------------|----------------|
| **Custom multisig account contract (secp256k1)** | Need to write + audit Noir contract | **RECOMMENDED** |
| Schnorr multisig account contract | Requires Grumpkin curve in HSM | Alternative |
| TACEO collaborative SNARKs for protocol keys | CoNoir in development | Future enhancement |
| Single signing key in HSM + policy engine | Simpler but less secure | Interim option |

### 7.3 For Shielded Transactions (Midnight-like, if Aztec goes deeper)

| Approach | Maturity | When |
|----------|---------|------|
| **TEE + threshold decryption** | Production (Phala/SP1) | Now |
| **TACEO collaborative SNARKs** | Production (Circom), developing (Noir) | 6-12 months |
| **Contract-level multisig** | Depends on chain's AA | Now (Aztec) |
| HSM-based ZK proving | Infeasible | Not viable |
| Pure MPC ZK (no TEE) | Research only | 2+ years |

---

## 8. Recommended Architecture

### 8.1 Starknet Integration (Phase 1 -- Straightforward)

**Approach: On-chain contract multisig using Argent with secp256k1 signers**

```
Key Setup:
  - BitGo HSM: secp256k1 key (existing infrastructure)
  - User: secp256k1 key (or Stark curve via wallet)
  - Backup: secp256k1 key (cold storage)

Account: Argent multisig contract (threshold=2, signers=3)

Signing Flow:
  1. Compute tx_hash (Pedersen hash of calldata)
  2. User signs with their key
  3. BitGo HSM co-signs after policy checks
  4. Submit with combined signature array
  5. Contract validates 2-of-3 on-chain

Fee Sponsorship:
  - Separate BitGo relayer account (single-sig)
  - Uses execute_from_outside (SNIP-9)
  - Pays gas in ETH or STRK
```

**Implementation effort:** LOW. Same pattern as ETH smart contract multisig.

### 8.2 Aztec Shielded Integration (Phase 2 -- Medium Complexity)

**Approach: Custom multisig account contract + externalized signing + BitGo PXE**

```
Key Setup:
  Signing Keys (2-of-3 multisig, in HSMs):
    - BitGo HSM: secp256k1 ECDSA key
    - User: secp256k1 ECDSA key
    - Backup: secp256k1 ECDSA key

  Protocol Keys (single-sig, in BitGo PXE):
    - ivsk_m (incoming viewing) -- for note decryption
    - nsk_m (nullifier) -- for nullifier derivation
    - ovsk_m (outgoing viewing) -- for sender-side decryption
    - tsk_m (tagging) -- for note discovery

  Fee Key (single-sig, separate):
    - Fee Payer Contract (FPC) operated by BitGo

Account: Custom 2-of-3 ecdsa_k multisig account contract (Noir)

Signing Flow:
  1. BitGo PXE constructs transaction
  2. PXE computes message hash
  3. Hash sent to BitGo HSM for 2-of-3 signing
  4. User + BitGo HSM provide signatures (AuthWitnesses)
  5. PXE generates ZK proof (with signatures as oracle inputs)
  6. Proof submitted to sequencer

Privacy Model:
  - All private execution happens in BitGo's PXE
  - Notes encrypted to account's Ivpk_m
  - Nullifiers derived using nsk_m in the PXE
  - Only ZK proof and encrypted logs go on-chain
```

**Implementation effort:** MEDIUM. Requires:
1. Custom multisig account contract in Noir (write + audit)
2. Custom `AuthWitnessProvider` for BitGo HSM
3. PXE infrastructure operated by BitGo
4. Fee Payer Contract deployment

### 8.3 Cross-Wallet Viewing Key Setup

For the preferred setup where viewing keys work across wallets:

**Starknet:** Not applicable -- Starknet is transparent. All balances visible on-chain.

**Aztec:** The incoming viewing key (`ivsk_m`) is derived from the master seed and tied to the account address. Options:
- **Option A (Recommended):** BitGo operates the PXE node. Clients query BitGo's API for balance/transaction data. The viewing key stays in BitGo's secure PXE.
- **Option B:** Share the `ivsk_m` with authorized parties. They can run their own PXE to independently verify balances. This is analogous to Zcash's viewing key sharing for auditors.
- **Option C (Future):** TACEO's collaborative SNARKs for threshold viewing -- multiple parties jointly decrypt notes without any party having the full viewing key.

### 8.4 HSM Firmware Considerations

| Requirement | Starknet (Phase 1) | Aztec (Phase 2) |
|-------------|--------------------|--------------------|
| secp256k1 ECDSA | Already supported | Already supported |
| Stark curve ECDSA | Optional (nice-to-have) | Not needed |
| Grumpkin/Schnorr | Not needed | Optional (for Schnorr accounts) |
| Pedersen hash | Not needed (computed off-HSM) | Not needed |
| Poseidon hash | Not needed | Not needed |

**No HSM firmware changes are required for either integration** when using secp256k1 signer types.

### 8.5 Comparison with Midnight (Why This Is Easier)

| Dimension | Midnight | Starknet | Aztec |
|-----------|---------|----------|-------|
| Spend key in ZK circuit | YES | NO | NO (signing key outside circuit) |
| MPC+ZK needed | YES | NO | NO |
| TEE needed for custody | YES (for shielded) | NO | NO |
| Contract multisig viable | Partially (Kachina) | YES (native AA) | YES (native AA) |
| HSM-only solution | NO | YES | YES |
| Existing BitGo pattern | None | ETH WalletSimple | ETH WalletSimple + viewing keys |

---

## 9. Sources

### Starknet
- [Starknet Cryptography Docs](https://docs.starknet.io/architecture/cryptography/)
- [Starknet Accounts Documentation](https://docs.starknet.io/learn/protocol/accounts)
- [Argent Contracts Starknet](https://github.com/argentlabs/argent-contracts-starknet)
- [Argent Multisig Docs](https://github.com/argentlabs/argent-contracts-starknet/blob/main/docs/multisig.md)
- [Argent Signers and Signatures](https://github.com/argentlabs/argent-contracts-starknet/blob/main/docs/signers_and_signatures.md)
- [Consensys Audit - Argent Multisig](https://consensys.io/diligence/audits/2023/06/argent-account-multisig-for-starknet/)
- [OpenZeppelin Cairo Contracts](https://github.com/OpenZeppelin/cairo-contracts)
- [OpenZeppelin Multisig Docs](https://docs.openzeppelin.com/contracts-cairo/2.x/governance/multisig)
- [eqlabs/starknet-multisig](https://github.com/eqlabs/starknet-multisig)
- [starknet.js SDK](https://github.com/starknet-io/starknet.js)
- [starknet-rs SDK](https://github.com/xJonathanLEI/starknet-rs)
- [starknet.py SDK](https://github.com/software-mansion/starknet.py)
- [@scure/starknet (audited crypto)](https://github.com/paulmillr/scure-starknet)
- [EIP-2645 HD Path Specification](https://eips.ethereum.org/EIPS/eip-2645)

### Aztec
- [Aztec Keys Documentation](https://docs.aztec.network/developers/docs/foundational-topics/accounts/keys)
- [Aztec Default Keys Specification](https://docs.aztec.network/protocol-specs/addresses-and-keys/keys)
- [Aztec Accounts Documentation](https://docs.aztec.network/developers/docs/foundational-topics/accounts)
- [Authentication Witness Guide](https://docs.aztec.network/guides/developer_guides/smart_contracts/writing_contracts/authwit)
- [PXE Documentation](https://docs.aztec.network/developers/docs/foundational-topics/pxe)
- [Aztec Fee Payment Tutorial](https://docs.aztec.network/developers/tutorials/codealong/first_fees)
- [AztecProtocol/aztec-packages](https://github.com/AztecProtocol/aztec-packages)
- [Account contracts source](https://github.com/AztecProtocol/aztec-packages/tree/master/noir-projects/noir-contracts/contracts/account)
- [TACEO co-SNARKs for Aztec](https://hackmd.io/@aztec-network/ByZ6tymhyl)
- [Defi Wonderland Aztec Standards](https://github.com/defi-wonderland/aztec-standards)
- [Aztec Key Rotation Notes](https://hackmd.io/@aztec-network/rJas3Hmdxx)

### BitGo
- [BitGo/BitGoJS](https://github.com/BitGo/BitGoJS)
- [BitGo/eth-multisig-v4](https://github.com/BitGo/eth-multisig-v4)
- [BitGo Multisig vs MPC](https://developers.bitgo.com/concepts/multisig-vs-mpc)
- [BitGo Wallet Types](https://developers.bitgo.com/concepts/wallet-types)
- [BitGo Account Abstraction Blog](https://www.bitgo.com/resources/blog/ethereum-account-abstraction-with-bitgo/)
- [Thales/BitGo HSM Solution Brief](https://cpl.thalesgroup.com/resources/encryption/bitgo-hsm-solution-brief)

### ZK + MPC / Collaborative ZK
- [Ozdemir & Boneh - Collaborative zk-SNARKs (USENIX 2022)](https://eprint.iacr.org/2021/1530)
- [Scalable Collaborative zk-SNARK (USENIX 2025)](https://eprint.iacr.org/2024/143)
- [TACEO Documentation](https://docs.taceo.io/docs/resources/collsnarks/)
- [TACEO:Proof Production Launch](https://core.taceo.io/articles/taceo-proof-prod/)
- [zkShield - Private Multisig](https://github.com/bankisan/zkShield)
- [Railgun Private Multisig](https://www.dlnews.com/articles/defi/railgun-cracks-zk-multisig-wallet-requested-by-ethereum-co-founder-vitalik-buterin/)

### Midnight (Reference)
- [Midnight Documentation](https://docs.midnight.network/)
- [Zswap Academic Paper](https://eprint.iacr.org/2022/1002.pdf)
- [BitGo-Midnight Partnership](https://www.bitgo.com/resources/blog/bitgo-to-power-institutional-access-to-midnights-night-token-distribution/)
- [Zengo - Zcash Threshold Shielded Transactions PoC](https://zengo.com/zcash-threshold-shielded-transactions-a-proof-of-concept/)
- [FROST for Zcash (ZIP 312)](https://zips.z.cash/zip-0312)
- [Zcash Orchard Key Design](https://zcash.github.io/orchard/design/keys.html)

### TEE + ZK
- [Phala Private Proving with TEE](https://docs.phala.com/phala-cloud/cases/tee_with_zk_and_zkrollup)
- [Succinct SP1 on Phala Cloud](https://phala.com/posts/private-proving-succinct-sets-new-standard-for-zk-privacy-with-phala-cloud)
- [Paradigm ZK Hardware](https://www.paradigm.xyz/2022/04/zk-hardware)
