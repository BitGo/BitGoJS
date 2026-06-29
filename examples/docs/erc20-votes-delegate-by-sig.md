# Delegate Governance Voting Power From a BitGo Custodial Wallet

This guide explains how to delegate voting power for OpenZeppelin
`ERC20Votes`-style governance tokens (e.g. WLFI, UNI, COMP, ARB, ENS, OP)
from a BitGo custodial cold wallet.

It uses two scripts in `examples/ts/eth/`:

| Step | Script | What it produces |
| --- | --- | --- |
| 1 | `create-erc20-votes-delegation-txrequest.ts` | Creates a delegation message and prints a `txRequestId` |
| 2 | `get-erc20-votes-delegation-signature.ts` | Once BitGo has signed, prints `v, r, s` and ready-to-broadcast `delegateBySig` calldata |

Between the two steps, BitGo's custodial signing workflow approves and signs
the message with your cold wallet's MPC keys. You re-run step 2 when you
want to retrieve the signature.

## Prerequisites

- BitGo SDK installed
- BitGo account and API access token with permissions on the wallet
- A custodial ETH MPC wallet on BitGo
- `.env` file with the variables listed below
- A JSON-RPC URL for the chain that hosts the token (used to read
  `nonces(delegator)`), or the nonce fetched out-of-band

## .env file

Both scripts read the same environment variable names. Create
`<repo-root>/.env`:

```bash
# auth
BITGO_ACCESS_TOKEN=your_access_token_here  # or ACCESS_TOKEN
BITGO_ENV=test                             # or `prod`

# wallet
WALLET_ID=your_wallet_id
COIN=hteth                                 # eth | teth | hteth (must match the wallet)

# delegation message
DELEGATEE=0xYourHotWalletAddress           # address that will vote
EXPIRY=                                    # optional unix seconds; default: now + 1h

# nonce lookup (one of these is required)
ETH_RPC_URL=https://...                    # script will call nonces(delegator) on the token
NONCE=                                     # OR set this manually if you already have it

# domain (one of these is required)
EIP712_DOMAIN_JSON={"name":"...","version":"...","chainId":1,"verifyingContract":"0x..."}
# Omit EIP712_DOMAIN_JSON if you are running BITGO_ENV=prod COIN=eth and want
# the WLFI mainnet defaults baked into the script.

# step 2 only — set after step 1 prints it
TX_REQUEST_ID=
```

## Step 1 — create the delegation request

First, run `yarn install` from the root directory of the repository.

Then run the create script from the repo root:

```
$ npx tsx examples/ts/eth/create-erc20-votes-delegation-txrequest.ts
```

### Expected output

```
Tx request created.

  txRequestId : db1ccd60-58d4-418e-9d23-d42d67eebd5b
  state       : pendingDelivery
  delegator   : 0xabc...
  delegatee   : 0xdef...
  nonce       : 1
  expiry      : 1777882731

Next: add the txRequestId above to your .env as TX_REQUEST_ID,
then run get-erc20-votes-delegation-signature.ts to retrieve the
signature once BitGo has signed the message.
```

**Copy the `txRequestId`** from the output and add it to `.env` as
`TX_REQUEST_ID`. The unsigned message is now queued in BitGo for signing.

### Note

- `COIN` must match your wallet's chain in BitGo (e.g. `eth`, `teth`,
  `hteth`).
- `DELEGATEE` is the address that will vote on your behalf — usually your
  self-custody hot wallet.
- `EXPIRY` is the unix-seconds deadline for someone to submit the signature
  on-chain. The delegation itself does not expire; only the submission
  window does.

## Step 2 — get the signature

Once BitGo has signed the message, run:

```
$ npx tsx examples/ts/eth/get-erc20-votes-delegation-signature.ts
```

### Expected output (signed)

```
Signature retrieved.

  txRequestId : db1ccd60-58d4-418e-9d23-d42d67eebd5b
  v           : 28
  r           : 0xc7b471134954a6c6f4b0eb4422ce5c400d61c8aa793f6a527cede00fb225d8c3
  s           : 0x31181c2ad2ffd2562da10f000b6a7e2dafdb1ae6522b46bd3aa9bd1540392424

delegateBySig calldata (broadcast as `data` to the token contract):
  0x5c19a95c000000000000000000000000def...
```

### Expected output (still pending)

If BitGo has not signed yet:

```
Message not signed yet, try again later.
```

Re-run the script later to retrieve the signature once BitGo has signed.

## Step 3 — submit `delegateBySig` on-chain

Take `v, r, s` (or the printed calldata) and submit from any address. Your
cold wallet does not pay gas and does not move funds.

Using a contract instance (e.g. ethers):

```ts
await votesToken.delegateBySig(delegatee, nonce, expiry, v, r, s);
```

Or send a raw transaction from your hot wallet:

- `to` = the token contract address (`domain.verifyingContract`)
- `data` = the `delegateBySig calldata` printed by step 2

After confirmation, on-chain `delegates(coldWallet)` returns `delegatee` and
the cold wallet's voting power is delegated.

## Troubleshooting

### `Set BITGO_ACCESS_TOKEN ...` (or any other `Set X ...` error)

The variable is missing from your environment. Confirm `.env` exists at the
repo root, contains the variable, and that you are running the script from
the repo root so the `.env` file is picked up.

### `Coin unsupported` from step 1

`COIN` does not match a chain enabled for this wallet on this BitGo
environment. Try `hteth` for Holesky, `teth` for Sepolia, or `eth` for
mainnet — and make sure it matches the coin shown for your wallet in the
BitGo UI.

### `Wallet has no receiveAddress yet`

The wallet does not have any addresses yet. Create or fund an address
first, or set `DELEGATEE` and `NONCE` manually so the script does not need
to look them up from the wallet.

### `EIP712_DOMAIN_JSON must include "..."`

Your token's domain JSON is missing one of the required fields. Read the
token's `eip712Domain()` function on-chain and pass all four fields:

```bash
EIP712_DOMAIN_JSON='{"name":"...","version":"...","chainId":1,"verifyingContract":"0x..."}'
```

### Step 2 prints `Message not signed yet, try again later.`

BitGo has not finished signing the message. Wait and re-run the script. If
signing has been pending for an unusually long time, contact BitGo support
and reference the `txRequestId` printed in step 1.

## Additional Resources

- [BitGo Developer Documentation](https://developers.bitgo.com/)
- [EIP-712: Typed Structured Data Signing](https://eips.ethereum.org/EIPS/eip-712)
- [OpenZeppelin `ERC20VotesUpgradeable`](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/token/ERC20/extensions/ERC20VotesUpgradeable.sol)

## Support

For questions or issues:

1. Check the [BitGo Developer Documentation](https://developers.bitgo.com/)
2. Open an issue on [GitHub](https://github.com/BitGo/BitGoJS/issues)
3. Contact BitGo support
