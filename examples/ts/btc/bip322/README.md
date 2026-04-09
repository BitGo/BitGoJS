# BIP322 Proof of Address Ownership

## What is BIP322?

[BIP322](https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki) (Bitcoin Improvement Proposal 322) is a standard for **generic message signing** in Bitcoin. It provides a way to cryptographically prove ownership of a Bitcoin address by signing an arbitrary message.

Unlike the legacy message signing approach (which only worked with P2PKH addresses), BIP322 supports all standard Bitcoin address types including:
- P2SH (Pay-to-Script-Hash)
- P2SH-P2WSH (Nested SegWit)
- P2WSH (Native SegWit)
- P2TR (Taproot)

## What is it used for?

BIP322 proofs are commonly used for:

1. **Proof of Reserves**: Exchanges and custodians can prove they control certain addresses without moving funds.

2. **Address Verification**: Verify that a counterparty owns an address before sending funds to them.

3. **Identity Verification**: Associate a Bitcoin address with an identity or account.

4. **Audit Compliance**: Provide cryptographic evidence of address ownership for regulatory or audit purposes.

5. **Dispute Resolution**: Prove ownership of funds in case of disputes.

## How to Use This Example

### Prerequisites

1. A BitGo account with API access
2. A **traditional multi-sig wallet** (NOT a descriptor wallet)
3. At least one address created on the wallet
4. Node.js and the BitGoJS SDK installed

### Important Limitation

> **WARNING**: This example does NOT work with descriptor wallets. Only use this with traditional BitGo multi-sig wallets that have keychains with standard derivation paths.

### Step-by-Step Instructions

1. **Configure the example** by editing `verifyProof.ts`:
   ```typescript
   // Set your environment: 'prod' for mainnet, 'test' for testnet
   const environment: 'prod' | 'test' = 'test';
   
   // Set the coin: 'btc' for mainnet, 'tbtc4' for testnet
   const coin = 'tbtc4';
   
   // Set your BitGo access token
   const accessToken = 'YOUR_ACCESS_TOKEN';
   
   // Set your wallet ID
   const walletId = 'YOUR_WALLET_ID';
   
   // Set your wallet passphrase
   const walletPassphrase = 'YOUR_WALLET_PASSPHRASE';
   ```

2. **Edit `messages.json`** with the addresses and messages you want to prove:
   ```json
   [
     {
       "address": "tb1q...",
       "message": "I own this address on 2025-02-02"
     },
     {
       "address": "2N...",
       "message": "Proof of ownership for audit"
     }
   ]
   ```

   Each entry must contain:
   - `address`: A valid address that belongs to your wallet
   - `message`: The arbitrary message to sign (can be any string)

3. **Run the example**:
   ```bash
   cd examples/ts/btc/bip322
   npx ts-node verifyProof.ts
   ```

### What the Example Does

1. **Loads** the address/message pairs from `messages.json`
2. **Fetches** the wallet and its keychains from BitGo
3. **Gets address info** for each address to obtain the chain and index (needed for pubkey derivation)
4. **Derives the script type** from the chain code (e.g., chain 10/11 = P2SH-P2WSH)
5. **Derives the public keys** for each address using the wallet's keychains
6. **Creates the BIP322 proof** by calling `wallet.sendMany()` with `type: 'bip322'`
7. **Verifies the proof** using `bip322.assertBip322TxProof()` to ensure:
   - The transaction structure follows BIP322 requirements
   - The signatures are valid for the derived public keys
   - The message is correctly encoded in the transaction

### Expected Output

```
Environment: test
Coin: tbtc4
Wallet ID: abc123...

Loaded 1 message(s) to prove:
  1. Address: tb1q...
     Message: I own this address

Fetching wallet...
Wallet label: My Test Wallet

Fetching keychains...
Retrieved wallet public keys

Building message info from address data...
  Getting address info for: tb1q...
    Chain: 20, Index: 0, ScriptType: p2wsh

Creating BIP322 proof via sendMany...
BIP322 proof created successfully

Verifying BIP322 proof...
Transaction proof verified successfully!

============================================
BIP322 PROOF VERIFICATION COMPLETE
============================================
Verified 1 address/message pair(s):

1. Address: tb1q...
   Message: "I own this address"
   Script Type: p2wsh

All proofs are valid. The wallet controls the specified addresses.
```

## Chain Codes and Script Types

BitGo uses chain codes to determine the address script type:

| Chain Code | Address Type | Description |
|------------|--------------|-------------|
| 0, 1       | P2SH         | Legacy wrapped multi-sig |
| 10, 11     | P2SH-P2WSH   | Nested SegWit (compatible) |
| 20, 21     | P2WSH        | Native SegWit |
| 30, 31     | P2TR         | Taproot script path |
| 40, 41     | P2TR-Musig2  | Taproot key path (MuSig2) |

Even chain codes (0, 10, 20, 30, 40) are for external/receive addresses.
Odd chain codes (1, 11, 21, 31, 41) are for internal/change addresses.

## Troubleshooting

### "Address is missing chain or index information"
The address may not belong to this wallet, or it may be from a descriptor wallet which is not supported.

### "Expected 3 keychains for multi-sig wallet"
Ensure you're using a traditional BitGo multi-sig wallet, not a TSS or descriptor wallet.

### "No transaction hex found in sendMany result"
The BIP322 proof request may have failed. Check the error details in the response.

## References

- [BIP322 Specification](https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki)
- [BitGo API Documentation](https://developers.bitgo.com/)
- [BitGoJS SDK](https://github.com/BitGo/BitGoJS)
