# JavaScript numeric precision audit

Ticket: CSHLD-1018

## Method

Audited TypeScript under `modules/sdk-coin-*`, `modules/abstract-*`, and
shared transaction code for `Number`, `parseInt`, `parseFloat`, and big-number
`toNumber()` conversions. Values were classified as metadata (indexes,
versions, timestamps, opcodes) or blockchain quantities (amounts, balances,
fees, and serialized integer fields).

## Findings and disposition

| Area | Risk | Disposition |
| --- | --- | --- |
| Sui custom transaction recipient aggregation | Recipient amounts are external decimal strings and can be u64 values. Converting each amount with `Number()` rounded values above `Number.MAX_SAFE_INTEGER` before summing and explaining a transaction. | Fixed in `sdk-coin-sui/src/lib/customTransaction.ts` by aggregating with `BigNumber` and returning a fixed-point decimal string. |
| Sui transfer, token-transfer, staking, and Walrus paths | Existing code uses `BigNumber` for amount aggregation and `BigInt`/string-preserving paths for serialized u64 values. A few `Number()` conversions are limited to protocol metadata or SDK APIs that require JavaScript numbers; these require separate API-compatible changes before replacement. | Confirmed safe for blockchain quantities in the audited paths, except the custom transaction path fixed above. |
| Solana SPL token transfer and mint/burn paths | Amounts are passed to SPL APIs as `BigInt` and existing large-amount tests cover values beyond the safe integer range. | Confirmed safe. Native System/Stake APIs still expose number-only parameters and need a dedicated compatibility change rather than an unsafe cast. |
| EVM nonce/sequence, Cosmos/Substrate metadata, UTXO indexes, and timestamps | Conversions are bounded protocol metadata or array/index values rather than coin amounts. | Confirmed safe for this audit scope. |
| Coin fee/balance explanation fields | Several coins intentionally expose legacy number fields while retaining string fields. These are compatibility surfaces and need coin-specific follow-up tickets where the underlying chain permits u64/u128 values. | Triaged for follow-up; no broad type change made in this ticket. |

## Follow-up triage

The remaining number-returning compatibility surfaces should be addressed per
coin, with API changes that preserve existing string fields and add boundary
tests before changing public types. In particular, review Solana native
System/Stake instruction APIs and fee/balance explanation interfaces for coins
that serialize u64/u128 quantities.
