# EdDSA TSS Self-Custody: Create Wallet — Two-Script Flow (Offline / Online)

> **Overview:** See [examples/js/self-custody-eddsa/README.md](../../../js/self-custody-eddsa/README.md) for the full script inventory, env vars, and file-transfer guide.

Create an **EdDSA TSS self-custody hot wallet** (e.g. `tsol`, `tapt`, `tsui`) with user and backup key material generated offline. Aligns with [BitGo: Create MPC Keys (EdDSA)](https://developers.bitgo.com/docs/wallets-create-mpc-keys).

**Note:** EdDSA uses **MPCv1 TSS** (not ECDSA MPCv2/DKLS). For ECDSA MPCv2 wallet creation, see `examples/docs/self-custody/mpc/create-wallet-mpcv2-script.md`.

## Overview

| Party | Role |
|-------|------|
| **Offline** | `MPC.keyShare` for user (1) and backup (2); GPG keys; encrypt offline state |
| **Online** | Create BitGo keychain; register user/backup keychains; create wallet |

Unlike `create-tss-wallet.js` (single host), raw key shares never touch the online machine.

## Steps

| # | Machine | Script | Output |
|---|---------|--------|--------|
| 0 | Online | `eddsa-self-custody-online.js --step 0` | `bitgo-gpg-public-key.json` |
| 1 | Offline | `eddsa-self-custody-offline.js --step 1` | `bitgo-keychain-payload.json`, `eddsa-offline-state.json` |
| 2 | Online | `eddsa-self-custody-online.js --step 1` | `bitgo-keychain-response.json` |
| 3 | Offline | `eddsa-self-custody-offline.js --step 2` | `user-keychain-params.json`, `backup-keychain-params.json`, `user-signing-material.json` |
| 4 | Online | `eddsa-self-custody-online.js --step 2` | `wallet-result.json` |

## Environment

**Online:** `BITGO_ACCESS_TOKEN`, `COIN`, optional `ENTERPRISE`, `WALLET_LABEL`, `BITGO_ENV`, `BITGO_CUSTOM_ROOT_URI`

**Offline:** `WALLET_PASSPHRASE`, `COIN`, optional `ORIGINAL_PASSCODE_ENCRYPTION_CODE`

**Workspace:** `examples/js/self-custody-eddsa/eddsa-keygen-workspace/` or `EDDSA_KEYGEN_WORKSPACE_DIR`

## Commands (from repo root)

```bash
# ONLINE step 0
export BITGO_ACCESS_TOKEN=your_token
export COIN=tsol
export ENTERPRISE=your_enterprise_id   # if required
export BITGO_ENV=test

node ./examples/js/self-custody-eddsa/eddsa-self-custody-online.js --step 0
```

Copy `bitgo-gpg-public-key.json` to offline machine.

```bash
# OFFLINE step 1
export WALLET_PASSPHRASE=your_passphrase
export COIN=tsol

node ./examples/js/self-custody-eddsa/eddsa-self-custody-offline.js --step 1
```

Copy `bitgo-keychain-payload.json` to online. **Keep `eddsa-offline-state.json` on offline only.**

```bash
# ONLINE step 1
node ./examples/js/self-custody-eddsa/eddsa-self-custody-online.js --step 1
```

Copy `bitgo-keychain-response.json` to offline.

```bash
# OFFLINE step 2
node ./examples/js/self-custody-eddsa/eddsa-self-custody-offline.js --step 2
```

Copy `user-keychain-params.json` and `backup-keychain-params.json` to online. Keep `user-signing-material.json` for [signing](sign-transaction-eddsa-script.md).

```bash
# ONLINE step 2
export WALLET_LABEL="My EdDSA Wallet"

node ./examples/js/self-custody-eddsa/eddsa-self-custody-online.js --step 2
```

## After wallet creation

- Use `wallet-result.json` for `WALLET_ID` and receive address.
- **Create another receive address** (online only):

```bash
export BITGO_ACCESS_TOKEN=your_token
export COIN=tsol
# WALLET_ID optional if wallet-result.json is in eddsa-keygen-workspace/

node ./examples/js/self-custody-eddsa/eddsa-create-wallet-address.js
```

- For withdrawals, use `eddsa-self-custody-sign-online.js` / `eddsa-self-custody-sign-offline.js` with the same `user-signing-material.json` (or copy `encryptedPrv` into `eddsa-sign-workspace/user-signing-material.json`).

## Security

- `eddsa-offline-state.json` and `user-signing-material.json` are passphrase-encrypted; do not copy to online if you require strict air-gap policy for signing material.
- `bitgo-keychain-payload.json` only contains encrypted private shares to BitGo (GPG), safe to transfer.

## Related

- [Sign transaction (EdDSA)](sign-transaction-eddsa-script.md)
- [Create MPC Keys (BitGo)](https://developers.bitgo.com/docs/wallets-create-mpc-keys)
- Simple single-host: `examples/js/create-tss-wallet.js`
