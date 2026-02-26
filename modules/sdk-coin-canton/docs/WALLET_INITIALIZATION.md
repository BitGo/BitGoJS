# Canton Wallet Initialization Transaction

## Overview

Canton is a privacy-enabled blockchain that requires a special **wallet initialization transaction** before a wallet can send or receive assets. This document explains the Canton wallet initialization process in the BitGoJS SDK.

## Why Is Wallet Initialization Required?

Unlike traditional blockchains where addresses are derived directly from public keys, Canton uses a **party-based model** where:

1. **Party Registration**: Each wallet must be registered as a "party" on the Canton network's topology
2. **Multi-signature Setup**: The wallet is configured with threshold signatures using EdDSA (Edwards-curve Digital Signature Algorithm)
3. **Participant Configuration**: The wallet defines confirming and observing participants with specific roles

The `requiresWalletInitializationTransaction()` method in `canton.ts` returns `true`, indicating this special transaction is mandatory before any transfers can occur.

## Transaction Components

### 1. WalletInitRequest

The request object contains the following fields:

```typescript
interface WalletInitRequest {
  partyHint: string;                          // 5-character max identifier for the party
  publicKey: IPublicKey;                      // EdDSA public key in specific format
  localParticipantObservationOnly: boolean;   // Whether local participant only observes
  otherConfirmingParticipantUids: string[];   // UIDs of other confirming participants
  confirmationThreshold: number;              // Number of confirmations required (min: 1)
  observingParticipantUids: string[];         // UIDs of observing participants
}
```

**Key Fields Explained:**

- **partyHint**: A short, human-readable identifier (max 5 characters) that becomes part of the party's address
- **publicKey**: Contains:
  - `format`: "CRYPTO_KEY_FORMAT_RAW" 
  - `keyData`: Base64-encoded EdDSA public key
  - `keySpec`: "SIGNING_KEY_SPEC_EC_CURVE25519"
- **confirmationThreshold**: Minimum number of participants required to confirm transactions (for multi-sig)
- **otherConfirmingParticipantUids**: List of participant unique identifiers that can confirm transactions
- **observingParticipantUids**: List of participants that can only observe, not confirm

### 2. PreparedParty

After the request is sent to Canton, the network returns a `PreparedParty` object:

```typescript
interface PreparedParty {
  partyId: string;                    // Full party identifier: "partyHint::fingerprint"
  publicKeyFingerprint: string;       // SHA-256 hash of the public key
  topologyTransactions: string[];     // Base64-encoded topology transactions
  multiHash: string;                  // Combined hash of all topology transactions
  shouldIncludeTxnType?: boolean;     // Optional flag for transaction type inclusion
}
```

**Key Fields Explained:**

- **partyId**: The complete party identifier in format `partyHint::fingerprint`, where fingerprint is derived from the public key
- **publicKeyFingerprint**: SHA-256 hash computed using Canton's specific hashing scheme (purpose 12)
- **topologyTransactions**: Array of Canton topology transactions that register the party on the network
- **multiHash**: A composite hash computed from all topology transactions, used for signing and validation

### 3. WalletInitTransaction

The transaction object encapsulates the wallet initialization:

```typescript
class WalletInitTransaction extends BaseTransaction {
  private _preparedParty: PreparedParty;
  
  // Returns the data to be signed (the multiHash)
  get signablePayload(): Buffer {
    return Buffer.from(this._preparedParty.multiHash, 'base64');
  }
  
  // Converts to broadcast-ready format
  toBroadcastFormat(): string {
    // Returns base64-encoded JSON with:
    // - preparedParty
    // - onboardingTransactions (topology transactions)
    // - multiHashSignatures (signatures from all signers)
  }
}
```

## Wallet Initialization Flow

### Step 1: Build the Wallet Init Request

```typescript
import { WalletInitBuilder } from '@bitgo/sdk-coin-canton';
import { coins } from '@bitgo/statics';

const builder = new WalletInitBuilder(coins.get('canton'));

builder
  .publicKey('zs4J2IrVpfYNHN0bR7EHS0Fb3rETUyyu2L2QwxucPjg=')  // Base64 EdDSA public key
  .partyHint('alice')                                          // 5-char max identifier
  .confirmationThreshold(2)                                    // Require 2 confirmations
  .otherConfirmingParticipantUid('participant-uid-1')         // Add confirming participant
  .otherConfirmingParticipantUid('participant-uid-2')         // Add another confirming participant
  .observingParticipantUid('observer-uid-1');                 // Add observer

const walletInitRequest = builder.toRequestObject();
```

### Step 2: Submit Request to Canton Network

The `walletInitRequest` is sent to the Canton network API, which:
1. Validates the public key and party hint
2. Generates topology transactions for party registration
3. Computes the fingerprint from the public key
4. Creates the full partyId: `partyHint::fingerprint`
5. Computes a multiHash of all topology transactions
6. Returns a `PreparedParty` object

### Step 3: Sign the Transaction

```typescript
// The PreparedParty is received from Canton network
const preparedParty = {
  partyId: 'alice::1220389e648074c708ead527fd...',
  publicKeyFingerprint: '1220389e648074c708ead527fd...',
  topologyTransactions: ['base64-tx-1', 'base64-tx-2', ...],
  multiHash: 'base64-multihash'
};

// Set the prepared party on the builder's transaction
builder.transaction = preparedParty;

// The signablePayload is the multiHash
const payload = builder.transaction.signablePayload;

// Sign with EdDSA private key
const signature = eddsaSign(payload, privateKey);

// Add signature to transaction
builder.addSignature(publicKey, signature);
```

### Step 4: Validate the Transaction

```typescript
// Validate that topology transactions match the multiHash
builder.validateRawTransaction(preparedParty.topologyTransactions);

// Validate the complete transaction
const walletInitTxn = builder.transaction;
builder.validateTransaction(walletInitTxn);
```

The validation computes a local hash from the topology transactions and compares it to the `multiHash`:

```typescript
// Hash computation algorithm
function computeHashFromCreatePartyResponse(topologyTransactions: string[]): string {
  // 1. Convert each transaction from base64 to buffer
  const txBuffers = topologyTransactions.map(tx => Buffer.from(tx, 'base64'));
  
  // 2. Hash each transaction with purpose 11 (returns hex strings with '1220' prefix)
  const rawHashes = txBuffers.map(tx => computeSha256CantonHash(11, tx));
  // Each hash is a 68-char hex string: '1220' + SHA-256 hash (64 chars)
  
  // 3. Combine hashes with length prefixes
  const combinedHashes = computeMultiHashForTopology(rawHashes);
  // This sorts hashes, prefixes each with its length, and adds a count prefix
  
  // 4. Hash the combined buffer with purpose 55
  const computedHash = computeSha256CantonHash(55, combinedHashes);
  
  // 5. Convert final hex hash to base64
  return Buffer.from(computedHash, 'hex').toString('base64');
}

// Canton hash function: prefixes data with purpose, hashes with SHA-256, adds multihash prefix
function computeSha256CantonHash(purpose: number, bytes: Buffer): string {
  const hashInput = prefixedInt(purpose, bytes);  // 4-byte big-endian purpose + data
  const hash = crypto.createHash('sha256').update(hashInput).digest();
  const multiprefix = Buffer.from([0x12, 0x20]);  // SHA-256 multihash indicator
  return Buffer.concat([multiprefix, hash]).toString('hex');
}

// Combines multiple hashes with sorting and length prefixing
function computeMultiHashForTopology(hashes: string[]): Buffer {
  // 1. Convert hex strings to buffers and sort lexicographically
  const sortedHashes = hashes
    .map(hex => Buffer.from(hex, 'hex'))
    .sort((a, b) => a.toString('hex').localeCompare(b.toString('hex')));
  
  // 2. Build combined buffer: count + (length + hash) for each hash
  const numHashesBytes = encodeInt32(sortedHashes.length);
  const parts: Buffer[] = [numHashesBytes];
  
  for (const h of sortedHashes) {
    const lengthBytes = encodeInt32(h.length);
    parts.push(lengthBytes, h);
  }
  
  return Buffer.concat(parts);
}
```

### Step 5: Broadcast the Transaction

```typescript
// Convert to broadcast format
const broadcastData = walletInitTxn.toBroadcastFormat();

// This creates a base64-encoded JSON structure:
{
  preparedParty: { ... },
  onboardingTransactions: [
    { transaction: 'base64-tx-1' },
    { transaction: 'base64-tx-2' },
    ...
  ],
  multiHashSignatures: [
    {
      format: 'SIGNATURE_FORMAT_RAW',
      signature: 'base64-signature',
      signedBy: 'publicKeyFingerprint',
      signingAlgorithmSpec: 'SIGNING_ALGORITHM_SPEC_ED25519'
    }
  ]
}

// Submit to Canton network for processing
```

## Address Format

After successful wallet initialization, the Canton address format is:

```
partyHint::fingerprint?memoId=index
```

**Example:**
```
alice::1220389e648074c708ead527fd8c7b5e92e29c27ad70a9f08931f3f8e3a4c23cb841?memoId=0
```

Where:
- `alice` = partyHint (user-friendly identifier)
- `1220389e648074c708ead527fd8c7b5e92e29c27ad70a9f08931f3f8e3a4c23cb841` = fingerprint (68-char hex derived from public key)
- `?memoId=0` = optional memo identifier for sub-accounts

## Multi-Signature Configuration

Canton supports threshold signatures where multiple participants must confirm transactions:

```typescript
// Example: 2-of-3 multisig wallet
builder
  .publicKey(derivedPublicKey)
  .partyHint('vault')
  .confirmationThreshold(2)                    // Require 2 signatures
  .otherConfirmingParticipantUid('signer-1')   // First co-signer
  .otherConfirmingParticipantUid('signer-2')   // Second co-signer
  .otherConfirmingParticipantUid('signer-3');  // Third co-signer
```

**Participant Types:**

1. **Confirming Participants**: Can sign and approve transactions
   - Must reach the `confirmationThreshold` to execute transactions
   - Configured via `otherConfirmingParticipantUids`

2. **Observing Participants**: Can only view transactions
   - Cannot sign or approve
   - Useful for auditing and compliance
   - Configured via `observingParticipantUids`

3. **Local Participant**: The wallet owner
   - Can be set to observation-only mode via `localParticipantObservationOnly(true)`

## Security Considerations

### 1. Hash Validation

Always validate that the `multiHash` matches the `topologyTransactions`:

```typescript
const localHash = utils.computeHashFromCreatePartyResponse(
  preparedParty.topologyTransactions
);

if (localHash !== preparedParty.multiHash) {
  throw new Error('Invalid transaction: hash mismatch');
}
```

This prevents man-in-the-middle attacks where topology transactions could be altered.

### 2. Public Key Format

The public key must be:
- EdDSA (Ed25519 curve)
- Base64-encoded
- 32 bytes in length

Validation:

```typescript
// Validates using isValidEd25519PublicKey from @bitgo/sdk-core
utils.isValidPublicKey(publicKeyBase64);
```

### 3. Signature Algorithm

Canton uses EdDSA with the following specifications:
- **Algorithm**: EdDSA (Edwards-curve Digital Signature Algorithm)
- **Curve**: Ed25519
- **Hash Function**: SHA-512 (internally by EdDSA)
- **Format**: Raw signature bytes, base64-encoded

## Transaction Explanation

When explaining a wallet initialization transaction:

```typescript
const explanation = walletInitTxn.explainTransaction();

// Returns:
{
  id: 'multiHashValue',           // Transaction ID (the multiHash)
  type: 'WalletInitialization',   // Transaction type
  outputs: [],                    // No outputs for init
  outputAmount: '0',              // No value transfer
  changeOutputs: [],              // No change
  changeAmount: '0',              // No change amount
  fee: { fee: '0' }              // No fee for initialization
}
```

Wallet initialization transactions:
- Have no monetary value transfer
- Have no fees (network registration is typically free or handled separately)
- Are one-time operations per wallet

## Common Errors and Solutions

### Error: "partyHint cannot be empty"

**Cause**: The party hint was not provided or is an empty string.

**Solution**:
```typescript
builder.partyHint('alice');  // Provide a non-empty string (max 5 chars)
```

### Error: "partyHint must be less than 6 characters long"

**Cause**: The party hint exceeds 5 characters.

**Solution**:
```typescript
builder.partyHint('alice');  // Use 5 or fewer characters
```

### Error: "Invalid publicKey"

**Cause**: Public key is missing required fields or is invalid.

**Solution**:
```typescript
// Ensure public key is base64-encoded Ed25519 key
const validPublicKey = 'zs4J2IrVpfYNHN0bR7EHS0Fb3rETUyyu2L2QwxucPjg=';
builder.publicKey(validPublicKey);
```

### Error: "invalid raw transaction, hash not matching"

**Cause**: The topology transactions don't match the provided multiHash.

**Solution**: This indicates the prepared party data was corrupted or tampered with. Re-request the prepared party from the Canton network.

### Error: "confirmationThreshold must be a positive integer"

**Cause**: Threshold is 0, negative, or not an integer.

**Solution**:
```typescript
builder.confirmationThreshold(1);  // Use a positive integer
```

## Testing

### Unit Test Example

```typescript
import { WalletInitBuilder, WalletInitTransaction } from '@bitgo/sdk-coin-canton';
import { coins } from '@bitgo/statics';

describe('Wallet Initialization', () => {
  it('should create valid wallet init request', () => {
    const builder = new WalletInitBuilder(coins.get('canton'));
    
    builder
      .publicKey('zs4J2IrVpfYNHN0bR7EHS0Fb3rETUyyu2L2QwxucPjg=')
      .partyHint('alice');
    
    const request = builder.toRequestObject();
    
    expect(request.partyHint).toBe('alice');
    expect(request.publicKey.keyData).toBe('zs4J2IrVpfYNHN0bR7EHS0Fb3rETUyyu2L2QwxucPjg=');
    expect(request.confirmationThreshold).toBe(1);
    expect(request.localParticipantObservationOnly).toBe(false);
  });
  
  it('should validate topology transactions', () => {
    const builder = new WalletInitBuilder(coins.get('canton'));
    
    // Set prepared party from network response
    builder.transaction = preparedPartyFromNetwork;
    
    // Validate - should not throw
    builder.validateRawTransaction(preparedPartyFromNetwork.topologyTransactions);
  });
});
```

## Integration with BitGo Platform

When using the BitGo platform API:

1. **Create Wallet Request**: Include wallet initialization as part of wallet creation
2. **TSS Key Generation**: BitGo handles EdDSA key generation for TSS wallets
3. **Party Registration**: BitGo submits the wallet init transaction to Canton
4. **Address Generation**: After initialization, addresses are generated using the partyId

Example workflow with BitGo SDK:

```typescript
const bitgo = new BitGoAPI({ env: 'test' });
await bitgo.authenticate({ ... });

const canton = bitgo.coin('canton');

// Create wallet - includes automatic wallet initialization
const wallet = await canton.wallets().generateWallet({
  label: 'My Canton Wallet',
  passphrase: 'secure-passphrase',
  // BitGo handles the wallet initialization transaction internally
});

// Wallet is now ready to send and receive Canton assets
```

## Technical Deep Dive

### Canton Hashing Scheme

Canton uses a purpose-based hashing scheme where different hash purposes serve different roles:

- **Purpose 11**: Hash individual topology transactions
- **Purpose 12**: Hash public keys to create fingerprints
- **Purpose 55**: Hash combined topology transaction hashes

The hash format is:

```
hash = '1220' + SHA-256(purpose_as_4_bytes_big_endian || data)
```

Where:
- `purpose` is a 4-byte big-endian integer prefix indicating the hash purpose
- `data` is the content being hashed
- `||` denotes concatenation
- Result is prefixed with `1220` (multihash format indicating SHA-256)
- Final hash is a 68-character hex string: `1220` (4 chars) + SHA-256 (64 chars)

**Multihash Prefix `1220`:**
- `12` = SHA-256 hash function indicator
- `20` = 32 bytes (hex representation of length)

### Topology Transactions

Topology transactions are Canton's mechanism for updating network state:

1. **Party Addition**: Registers a new party with public key
2. **Namespace Delegation**: Grants permissions to the party
3. **Owner to Key Mapping**: Maps the party to its signing key
4. **Participant State**: Updates participant configuration

All these transactions are bundled together in the `topologyTransactions` array and must be submitted atomically.

## Summary

The Canton wallet initialization transaction is a critical first step that:

1. **Registers** the wallet as a party on the Canton network
2. **Establishes** the cryptographic identity (EdDSA public key)
3. **Configures** multi-signature and participant settings
4. **Creates** a unique partyId for addressing

Without this initialization, the wallet cannot participate in transfers or other Canton operations. The process involves careful validation of topology transactions through hash verification and proper signature handling using EdDSA.

## Related Documentation

- Canton Transfer Transactions - How to send and receive assets after initialization
- Canton Token Enablement - Enabling tokens for transfers
- Canton Address Format - Understanding Canton addresses
- [EdDSA Signatures](https://ed25519.cr.yp.to/) - EdDSA signature algorithm specification

## References

- **Source Files**:
  - `modules/sdk-coin-canton/src/lib/walletInitBuilder.ts` - Builder implementation
  - `modules/sdk-coin-canton/src/lib/walletInitialization/walletInitTransaction.ts` - Transaction class
  - `modules/sdk-coin-canton/src/canton.ts` - Main Canton coin class
  - `modules/sdk-coin-canton/src/lib/utils.ts` - Utility functions including hash computation

- **Test Files**:
  - `modules/sdk-coin-canton/test/unit/builder/walletInit/walletInitBuilder.ts` - Unit tests
  - `modules/sdk-coin-canton/test/integration/canton.integration.ts` - Integration tests
