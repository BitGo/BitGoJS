# Canton Wallet Initialization - Quick Reference

## TL;DR

Canton wallets **must** complete a wallet initialization transaction before they can send or receive assets. This one-time transaction registers the wallet as a "party" on the Canton network.

## Quick Start

```typescript
import { WalletInitBuilder } from '@bitgo/sdk-coin-canton';
import { coins } from '@bitgo/statics';

// 1. Create the builder
const builder = new WalletInitBuilder(coins.get('canton'));

// 2. Configure the wallet
builder
  .publicKey('your-base64-eddsa-public-key')
  .partyHint('alice');  // 5 chars max

// 3. Build the request
const request = builder.toRequestObject();

// 4. Send request to Canton network (returns PreparedParty)
// 5. Set the prepared party on transaction
builder.transaction = preparedParty;

// 6. Sign the transaction
builder.addSignature(publicKey, signature);

// 7. Broadcast
const broadcastData = builder.transaction.toBroadcastFormat();
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **partyHint** | Short identifier (max 5 chars) for the wallet, e.g., "alice" |
| **partyId** | Full identifier: `partyHint::fingerprint`, e.g., "alice::1220389e..." |
| **fingerprint** | 68-char hex derived from public key using SHA-256 |
| **topologyTransactions** | Array of transactions that register the party on Canton |
| **multiHash** | Combined hash of all topology transactions (what you sign) |
| **EdDSA** | Signature algorithm (Ed25519 curve) |

## Request Fields

```typescript
{
  partyHint: string,                        // Required: max 5 chars
  publicKey: {
    format: "CRYPTO_KEY_FORMAT_RAW",        // Fixed value
    keyData: string,                        // Base64 Ed25519 public key
    keySpec: "SIGNING_KEY_SPEC_ED25519"     // Fixed value
  },
  confirmationThreshold: number,            // Default: 1 (for multisig)
  otherConfirmingParticipantUids: string[], // Co-signers for multisig
  observingParticipantUids: string[],       // Read-only participants
  localParticipantObservationOnly: boolean  // Default: false
}
```

## Response (PreparedParty)

```typescript
{
  partyId: string,                  // "partyHint::fingerprint"
  publicKeyFingerprint: string,     // Derived from public key
  topologyTransactions: string[],   // Base64-encoded transactions
  multiHash: string                 // Hash of all topology txns
}
```

## Signing

```typescript
// The signablePayload is the multiHash
const payload = builder.transaction.signablePayload;

// Sign with EdDSA (Ed25519)
const signature = eddsaSign(payload, privateKey);

// Add to transaction
builder.addSignature(publicKey, signature);
```

## Validation

```typescript
// Validates topology transactions match multiHash
builder.validateRawTransaction(preparedParty.topologyTransactions);

// Validates complete transaction
builder.validateTransaction(walletInitTxn);
```

## Broadcast Format

```typescript
{
  preparedParty: PreparedParty,
  onboardingTransactions: [
    { transaction: "base64-topology-tx-1" },
    { transaction: "base64-topology-tx-2" }
  ],
  multiHashSignatures: [
    {
      format: "SIGNATURE_FORMAT_RAW",
      signature: "base64-signature",
      signedBy: "fingerprint",
      signingAlgorithmSpec: "SIGNING_ALGORITHM_SPEC_ED25519"
    }
  ]
}
```

## Multi-Signature Setup

```typescript
builder
  .publicKey(publicKey)
  .partyHint('vault')
  .confirmationThreshold(2)                   // 2-of-3 multisig
  .otherConfirmingParticipantUid('signer-1')
  .otherConfirmingParticipantUid('signer-2')
  .otherConfirmingParticipantUid('signer-3');
```

## Common Validations

| Check | Rule |
|-------|------|
| partyHint | Non-empty, max 5 characters |
| publicKey | Valid base64 Ed25519 key (32 bytes) |
| confirmationThreshold | Positive integer ≥ 1 |
| multiHash | Must match computed hash of topology transactions |

## Hash Computation

```typescript
// Purpose 11: Hash each topology transaction
individualHashes = topologyTxns.map(tx => sha256(11, tx))

// Purpose 55: Hash the combined hashes
multiHash = sha256(55, concat(individualHashes))
```

## Canton Address Format

After initialization, addresses follow this format:

```
partyHint::fingerprint?memoId=index
```

Example:
```
alice::1220389e648074c708ead527fd8c7b5e92e29c27ad70a9f08931f3f8e3a4c23cb841?memoId=0
```

## Transaction Properties

- **Type**: `TransactionType.WalletInitialization`
- **Value**: 0 (no monetary transfer)
- **Fee**: 0 (registration is free)
- **One-time**: Only needed once per wallet

## Common Errors

| Error | Fix |
|-------|-----|
| "partyHint cannot be empty" | Provide non-empty string: `.partyHint('alice')` |
| "partyHint must be less than 6 characters long" | Use ≤5 characters |
| "Invalid publicKey" | Use valid base64 Ed25519 key |
| "invalid raw transaction, hash not matching" | Re-request PreparedParty from network |
| "confirmationThreshold must be a positive integer" | Use integer ≥ 1 |

## Builder Methods

```typescript
builder.publicKey(key: string)                          // Set public key
builder.partyHint(hint: string)                         // Set party hint
builder.confirmationThreshold(n: number)                // Set multisig threshold
builder.otherConfirmingParticipantUid(uid: string)      // Add confirming participant
builder.observingParticipantUid(uid: string)            // Add observer
builder.localParticipantObservationOnly(flag: boolean)  // Set local as observer
builder.toRequestObject()                               // Build request
builder.validateRawTransaction(txns: string[])          // Validate topology txns
builder.validateTransaction(txn: WalletInitTransaction) // Validate complete txn
builder.addSignature(pubKey, signature)                 // Add signature
```

## Testing Example

```typescript
import { WalletInitBuilder } from '@bitgo/sdk-coin-canton';
import { coins } from '@bitgo/statics';

const builder = new WalletInitBuilder(coins.get('tcanton'));
builder
  .publicKey('zs4J2IrVpfYNHN0bR7EHS0Fb3rETUyyu2L2QwxucPjg=')
  .partyHint('alice');

const request = builder.toRequestObject();
// request.partyHint === 'alice'
// request.confirmationThreshold === 1
// request.localParticipantObservationOnly === false
```

## See Also

- [Full Documentation](./WALLET_INITIALIZATION.md) - Complete guide with examples
- [Canton Transfer Transactions](./TRANSFERS.md) - Sending assets after initialization
- Source: `modules/sdk-coin-canton/src/lib/walletInitBuilder.ts`
