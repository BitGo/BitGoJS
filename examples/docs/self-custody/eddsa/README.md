# EdDSA TSS Self-Custody — Documentation Index

Scripts live in [`examples/js/self-custody-eddsa/`](../../../js/self-custody-eddsa/).

**Start here:** [README in script folder](../../../js/self-custody-eddsa/README.md) — overview, file inventory, env vars, copy-between-machines guide, troubleshooting.

## Detailed guides

| Topic | Document |
|-------|----------|
| Create wallet (offline/online, 5 steps) | [create-wallet-eddsa-script.md](./create-wallet-eddsa-script.md) |
| Sign transaction (offline/online, 7 steps) | [sign-transaction-eddsa-script.md](./sign-transaction-eddsa-script.md) |

## Scripts quick reference

| Script | Purpose |
|--------|---------|
| `eddsa-self-custody-online.js` | Wallet creation — online steps 0, 1, 2 |
| `eddsa-self-custody-offline.js` | Wallet creation — offline steps 1, 2 |
| `eddsa-self-custody-sign-online.js` | Transaction signing — online steps 0–3 |
| `eddsa-self-custody-sign-offline.js` | Transaction signing — offline steps 1–3 |
| `eddsa-create-wallet-address.js` | Create receive address (online only) |

## External references

- [Create MPC Keys (EdDSA)](https://developers.bitgo.com/docs/wallets-create-mpc-keys)
- [Withdraw - Self-Custody MPC Hot (Manual)](https://developers.bitgo.com/docs/withdraw-wallet-type-self-custody-mpc-hot-manual)

## Related

- ECDSA MPCv2: [../mpc/create-wallet-mpcv2-script.md](../mpc/create-wallet-mpcv2-script.md)
- Single-host TSS: `examples/js/create-tss-wallet.js`
