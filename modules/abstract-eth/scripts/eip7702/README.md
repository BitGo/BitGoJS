# EIP-7702 On-Chain Harness (Hoodi)

Standalone scripts to sign and broadcast EIP-7702 transactions on Hoodi and
verify them on-chain. Uses the SDK's `lib/eip7702.ts` encoding core.

## Target
- **Network:** Hoodi (Pectra testnet), chain **560048**
- **Delegate implementation (deployed):** `0xd9b435f8aaa0d2c6d789eceeba8a1c3a5cf8089a`
- **Public RPC:** `https://rpc.hoodi.ethpandaops.io` (override with `HOODI_RPC_URL`)

## Prereqs — funded accounts
The harness needs Hoodi ETH on two accounts (testnet faucets: https://hoodi-faucet.pk910.de):
- **EOA** (delegating wallet): pays gas for delegation, `addSponsor`, and self-paid batch. Key in `EIP7702_EOA_PRIVATE_KEY` or `~/eip7702-eoa.env`.
- **Gas tank** (enterprise fee-address stand-in): pays gas for the sponsored batch. Key in `EIP7702_GAS_TANK_PRIVATE_KEY` or `~/eip7702-gastank.env`.

## Run (from `modules/abstract-eth`)
```bash
# 0) optional: analyze an existing tx
node -r ts-node/register/transpile-only scripts/eip7702/verify.ts
TX_HASH=0x... node -r ts-node/register/transpile-only scripts/eip7702/verify.ts

# 1) delegation: 0x04 set-code tx (EOA delegates to the implementation)
node -r ts-node/register/transpile-only scripts/eip7702/delegate.ts

# 2) self-paid batch: EOA sends to N recipients in one tx (EOA pays gas)
node -r ts-node/register/transpile-only scripts/eip7702/batch.ts

# 3) gas-tank sponsored batch: gas tank pays gas, values from EOA balance
node -r ts-node/register/transpile-only scripts/eip7702/sponsored.ts
```

Optional env: `RECIPIENT_A`, `RECIPIENT_B`, `AMOUNT_A`, `AMOUNT_B`.

## What each script does + analysis output
- **delegate.ts** — computes the authorization digest
  `keccak256(0x05 ‖ rlp([chainId, address, nonce]))`, signs it with the EOA key,
  computes the envelope hash `keccak256(0x04 ‖ rlp(fields))`, signs it, builds the
  serialized 0x04 tx, broadcasts, prints the receipt (gas, cost, block), then
  verifies on-chain that the EOA code == `0xef0100 ‖ implementation`.
- **batch.ts** — encodes `executeBatch((address,uint256,bytes)[])` for N recipients,
  sends a type-2 tx from the EOA to itself (destination = EOA ⇒ runs delegate
  code), prints receipt + balance deltas.
- **sponsored.ts** — EOA calls `addSponsor(gasTank)` on itself, then the **gas
  tank** sends `sponsoredExecuteBatch(...)` (gas tank pays gas; values from EOA
  balance). Prints receipts + balances.
- **verify.ts** — read-only: delegation indicator, implementation code length,
  balances, and optional per-tx analysis via `TX_HASH`.

## Explorer
All tx hashes link to https://hoodi.beaconcha.in/tx/<hash>.

## Verified on-chain findings (Hoodi, 2026-09-17)
Three critical wire-format facts were confirmed by broadcasting real txs:
1. **Authorization nonce is a SCALAR** in the tuple RLP (geth rejects a nested
   list: `expected input string or byte for uint64 ... AuthList[0].Nonce`).
   `@ethereumjs/tx` v5's JSON path encodes it as a nested list — do NOT copy that.
2. **The authorization digest is over the IMPLEMENTATION address** (the
   tuple's `address` field), not the delegating EOA. The node recomputes
   `keccak256(0x05 || rlp([chainId, address, nonce]))` from the tuple, so
   signing over the EOA recovers a different authority and the tuple is skipped.
3. **Self-delegation auth nonce = tx nonce + 1**: the spec increments the
   SENDER's nonce before processing the authorization list, so the authority's
   nonce at check time is tx nonce + 1.

Live on-chain proof (Hoodi):
- EOA `0xDad010e3A43A850B86bDaA61FA2cD580b600b3A0` delegated to
  `0xd9b435f8aaa0d2c6d789eceeba8a1c3a5cf8089a` (code = `0xef0100...`).
- Self-paid batch: 2 recipients in 1 tx, EOA paid gas.
- Gas-tank sponsored batch: gas tank paid gas, values from EOA balance.
