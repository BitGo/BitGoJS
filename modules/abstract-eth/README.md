# BitGo abstract-eth

Abstract base implementation for EVM-compatible coins (ETH, ETC, Polygon, OP-ETH, Arb-ETH, etc.).

## EVM Cross-Chain Recovery

EVM cross-chain recovery allows funds accidentally sent to a wrong EVM chain to be
recovered. The recovery flow produces an unsigned (cold/custody wallet) or half-signed
(hot wallet) transaction JSON that must be signed by the appropriate trust team before
it can be broadcast.

### Trust Team Signing Responsibility

For backing wallets under EVM cross-chain recovery:

| Step | Responsible party | Action |
|------|-------------------|--------|
| 1 | Support engineer | Generate unsigned recovery JSON via `recoverEthLikeforEvmBasedRecovery` and provide it to SD Trust |
| 2 | **SD (South Dakota) Trust** | Sign the unsigned JSON using the **Singapore key shards** and return the half-signed JSON |
| 3 | Support engineer | Broadcast the half-signed transaction |

**Key points to avoid ambiguity:**

- **SD Trust** (South Dakota) is the team that receives the unsigned JSON and performs
  the signing operation.
- **SG Custody** (Singapore) does **not** sign directly and will not see a signing
  request appear in their reports. SG Custody's role is to hold the key shards that
  SD Trust must select when signing.
- SD Trust must explicitly select the **Singapore key shards** when performing the
  signing step. Using other shards will produce an invalid signature for wallets
  custodied under Singapore.

### Required Fields in the Unsigned JSON

The unsigned transaction JSON must include the following fields before it is sent to
SD Trust for signing:

```json
{
  "nextContractSequenceId": <number>,
  "expireTime": <unix-timestamp>
}
```

If these fields are missing, SD Trust's signing tool will return an error. The
`expireTime` should be set to a future Unix timestamp (typically one week out).

### Half-Signed JSON Validation

After SD Trust returns the half-signed JSON, verify that `halfSigned.txHex` is
present. If it is missing the broadcast step will fail with:

```
Error: Invalid half signed recovery file, missing halfSigned.txHex
```

In that case, request a new signing from SD Trust using the updated unsigned JSON.
