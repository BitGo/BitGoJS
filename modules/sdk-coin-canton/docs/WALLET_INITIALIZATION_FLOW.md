# Canton Wallet Initialization Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Canton Wallet Initialization Process                      │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Build Request
┌──────────────────┐
│  WalletInitBuilder│
│                  │  .publicKey("base64-ed25519-key")
│  - publicKey     │  .partyHint("alice")
│  - partyHint     │  .confirmationThreshold(1)
│  - threshold     │  .otherConfirmingParticipantUid("participant-1")
│  - participants  │
└────────┬─────────┘
         │ toRequestObject()
         ▼
┌────────────────────────────────────────────┐
│      WalletInitRequest (JSON)              │
├────────────────────────────────────────────┤
│ {                                          │
│   partyHint: "alice",                      │
│   publicKey: {                             │
│     format: "CRYPTO_KEY_FORMAT_RAW",       │
│     keyData: "base64-key",                 │
│     keySpec: "SIGNING_KEY_SPEC_EC_CURVE25519"│
│   },                                       │
│   confirmationThreshold: 1,                │
│   otherConfirmingParticipantUids: [...],   │
│   observingParticipantUids: [...],         │
│   localParticipantObservationOnly: false   │
│ }                                          │
└────────────────┬───────────────────────────┘
                 │
                 │ HTTP POST to Canton Network API
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Canton Network Processing                       │
├─────────────────────────────────────────────────────────────────────┤
│  1. Validate public key and party hint                              │
│  2. Compute fingerprint from public key                             │
│     - fingerprint = sha256Canton(12, signingPublicKey)              │
│  3. Create partyId = "alice::1220..." (partyHint::fingerprint)      │
│  4. Generate topology transactions:                                 │
│     - Party addition                                                │
│     - Namespace delegation                                          │
│     - Owner to key mapping                                          │
│     - Participant state updates                                     │
│  5. Compute multiHash from topology transactions                    │
│     - Hash each txn with purpose 11                                 │
│     - Sort and combine with length prefixes                         │
│     - Hash combined buffer with purpose 55                          │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 │ Returns PreparedParty
                 ▼

Step 2: Receive PreparedParty
┌────────────────────────────────────────────┐
│         PreparedParty (JSON)               │
├────────────────────────────────────────────┤
│ {                                          │
│   partyId: "alice::1220389e648074c7...",   │
│   publicKeyFingerprint: "1220389e...",     │
│   topologyTransactions: [                  │
│     "base64-encoded-tx-1",                 │
│     "base64-encoded-tx-2",                 │
│     "base64-encoded-tx-3"                  │
│   ],                                       │
│   multiHash: "base64-multihash"            │
│ }                                          │
└────────────────┬───────────────────────────┘
                 │
                 │ builder.transaction = preparedParty
                 ▼

Step 3: Validate and Sign
┌────────────────────────────────────────────┐
│       Validation Process                   │
├────────────────────────────────────────────┤
│  1. Decode topology transactions           │
│  2. Compute local multiHash:               │
│     ┌─────────────────────────────────┐   │
│     │ For each topology transaction:  │   │
│     │   hash = sha256Canton(11, tx)   │   │
│     │   → "1220" + 64-char-hex        │   │
│     └─────────────────────────────────┘   │
│     ┌─────────────────────────────────┐   │
│     │ Sort hashes lexicographically   │   │
│     └─────────────────────────────────┘   │
│     ┌─────────────────────────────────┐   │
│     │ Combine with length prefixes:   │   │
│     │   count(4B) + [len(4B)+hash]... │   │
│     └─────────────────────────────────┘   │
│     ┌─────────────────────────────────┐   │
│     │ Hash combined buffer:           │   │
│     │   sha256Canton(55, combined)    │   │
│     │   → Convert hex to base64       │   │
│     └─────────────────────────────────┘   │
│  3. Compare: localHash === multiHash ✓     │
└────────────────┬───────────────────────────┘
                 │
                 │ Validation passed
                 ▼
┌────────────────────────────────────────────┐
│         Signing Process                    │
├────────────────────────────────────────────┤
│  signablePayload = multiHash (base64)      │
│           │                                │
│           ▼                                │
│  signature = eddsaSign(                    │
│    Buffer.from(multiHash, 'base64'),       │
│    privateKey                              │
│  )                                         │
│           │                                │
│           ▼                                │
│  builder.addSignature(publicKey, signature)│
└────────────────┬───────────────────────────┘
                 │
                 ▼

Step 4: Broadcast Transaction
┌────────────────────────────────────────────────────────────────┐
│              toBroadcastFormat()                               │
├────────────────────────────────────────────────────────────────┤
│  Creates WalletInitBroadcastData (JSON):                       │
│  {                                                             │
│    preparedParty: { ... },                                     │
│    onboardingTransactions: [                                   │
│      { transaction: "base64-topology-tx-1" },                  │
│      { transaction: "base64-topology-tx-2" },                  │
│      { transaction: "base64-topology-tx-3" }                   │
│    ],                                                          │
│    multiHashSignatures: [                                      │
│      {                                                         │
│        format: "SIGNATURE_FORMAT_RAW",                         │
│        signature: "base64-signature",                          │
│        signedBy: "publicKeyFingerprint",                       │
│        signingAlgorithmSpec: "SIGNING_ALGORITHM_SPEC_ED25519"  │
│      }                                                         │
│    ]                                                           │
│  }                                                             │
│                                                                │
│  → Encoded as base64 for transmission                          │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 │ HTTP POST to Canton Network
                 ▼
┌────────────────────────────────────────────┐
│    Canton Network - Process Onboarding     │
├────────────────────────────────────────────┤
│  1. Verify multiHash signatures            │
│  2. Apply topology transactions atomically │
│  3. Register party in network state        │
│  4. Party becomes active and addressable   │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│         ✓ Wallet Initialized!              │
├────────────────────────────────────────────┤
│  partyId: alice::1220389e648074c7...       │
│  Address: alice::1220...?memoId=0          │
│  Status: Ready for transfers               │
└────────────────────────────────────────────┘
```

## Key Takeaways

### Hash Computation Flow
```
Topology Txns (base64)
    │
    ├─► Decode to Buffer
    │
    ├─► Hash each with purpose 11 → Hex strings with '1220' prefix
    │                                (68 chars each)
    ├─► Sort lexicographically
    │
    ├─► Combine with length prefixes:
    │   [numHashes(4B)] + [length(4B) + hash(34B)] + ...
    │
    ├─► Hash combined with purpose 55 → Hex string with '1220' prefix
    │
    └─► Convert to base64 → multiHash
```

### Canton Hash Function
```
sha256Canton(purpose, data):
  1. Create prefix: 4-byte big-endian integer (purpose)
  2. Concatenate: prefix + data
  3. SHA-256 hash the result
  4. Prepend multihash prefix: 0x1220 (SHA-256 indicator)
  5. Return as hex string (68 characters)
```

### Multi-Signature Workflow
```
For 2-of-3 multisig:

Signer 1                 Signer 2                 Signer 3
   │                        │                        │
   ├─► Sign multiHash      │                        │
   │                        │                        │
   │   ◄──────────── Collect signature 1 ──────────►│
   │                        │                        │
   │                        ├─► Sign multiHash      │
   │                        │                        │
   │   ◄──────────── Collect signature 2 ──────────►│
   │                        │                        │
   └────────────────────────┴────────────────────────┘
                            │
                            ▼
                   Broadcast with both signatures
                   (Threshold = 2 met ✓)
```

## Address Components

```
┌──────────────────────────────────────────────────────────────────┐
│  Canton Address Format                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  alice::1220389e648074c708ead527fd8c7b5e92e29c27ad70a9...?memoId=0│
│  └───┘  └──────────────────────────────────────────────┘  └────┘│
│  partyHint        publicKeyFingerprint                   memoId  │
│  (max 5 chars)    (68-char hex: 1220 + SHA-256)        (optional)│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Transaction Types After Initialization

Once the wallet is initialized, it can perform:

1. **Transfer** - Send assets to another party
2. **TransferAccept** - Accept incoming transfers
3. **TransferReject** - Reject incoming transfers
4. **TransferAcknowledge** - Acknowledge completed transfers
5. **OneStepPreApproval** - Enable tokens for use
6. **TransferOfferWithdrawn** - Withdraw transfer offers

All of these require the wallet to be initialized first!
