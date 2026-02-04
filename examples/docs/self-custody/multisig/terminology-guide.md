# On-Chain Multisig: Terminology Guide

This document explains the terms used in the [multisig self-custody wallet script](create-wallet-multisig-script.md). Concepts are ordered **from foundation to advanced**. This guide is for **on-chain multisig** (2-of-3 with full keypairs), not TSS/MPC. For TSS/MPC terms, see [MPC terminology](../mpc/terminology-guide.md).

---

## Level 1: Basic Cryptography

### 1.1 Private key

- **What it is:** A secret value that only you should know. It proves ownership and authorizes signing.
- **Why it matters:** In on-chain multisig, each of the three parties (user, backup, BitGo) holds one **full** private key. Whoever has a private key can sign for that key; there are no "shares" of one key.
- **In our context:** The user and backup private keys are generated on your offline machine and never leave it in raw form. They are encrypted with a passphrase before being sent to BitGo for storage.

### 1.2 Public key

- **What it is:** A value derived from the private key that can be shared publicly. Used to derive addresses and verify signatures.
- **Why it matters:** The wallet’s receive address is derived from the combined multisig script (e.g. 2-of-3); each participant has a public key that others need to verify signatures and build the multisig output.
- **In our context:** Each keychain has a `pub` (public key). For HD coins this is often an xpub; for some coins it may be an address. Format is determined by the coin.

### 1.3 Signing (digital signature)

- **What it is:** Using a private key to create a signature on a message. The signature proves that the holder of that private key approved that message.
- **Why it matters:** To spend from a 2-of-3 multisig wallet, two of the three key holders must sign the transaction. Each signer uses their **own** full private key.
- **In our context:** During wallet creation, the **user** signs the backup and BitGo **public keys** with the user private key to produce **key signatures**. This proves to BitGo that the user controls the user key when adding the wallet.

---

## Level 2: Multi-Signature and Key Pairs

### 2.1 Multi-signature (multisig)

- **What it is:** A setup where **more than one** key must approve an action (e.g. a transaction). For example "2 out of 3 keys must sign."
- **Why it matters:** Reduces single-point-of-failure risk; common for custody and shared wallets.
- **In our context:** BitGo on-chain multisig is **2-of-3**: user, backup, and BitGo each hold one key; any two can sign.

### 2.2 Threshold (e.g. 2-of-3)

- **What it is:** The rule "at least **m** of **n** parties must participate." Here, m=2, n=3.
- **Why it matters:** You get redundancy (one party can be offline) while still requiring two approvals.
- **In our context:** Wallet is created with `m: 2`, `n: 3`.

### 2.3 Key pair

- **What it is:** A private key and its corresponding public key together.
- **Why it matters:** In on-chain multisig, each of the three participants has one **independent** key pair. There is no single "shared" key split into shares.
- **In our context:** User key pair, backup key pair, and BitGo key pair are created separately. User and backup key pairs are created on your offline machine.

---

## Level 3: On-Chain Multisig vs TSS

### 3.1 On-chain multisig

- **What it is:** Multisig where each participant holds a **full** key pair (one private key, one public key per party). The blockchain’s native multisig (e.g. P2SH, P2WSH for Bitcoin; multisig contract for Ethereum) requires **m** signatures from **n** distinct public keys.
- **Why it matters:** Simple model: three keys, each fully controlled by one party. No MPC protocol; signing is "each party signs with their key."
- **In our context:** User and backup each have one private key (often called "p-share" in casual language here, meaning "the private key you hold locally"). BitGo holds the third key. Two of the three must sign to spend.

### 3.2 TSS (Threshold Signature Scheme)

- **What it is:** A scheme where one **logical** key is split into **shares**; no single party has the full private key. Signing is done by a multi-party protocol that never reconstructs the full key.
- **Why it matters:** Different from on-chain multisig: in TSS there is one key split across parties; in on-chain multisig there are three separate keys. Do not confuse terminology (e.g. "p-share" in TSS means a key share; in multisig we use "p-share" only informally for "your local private key").
- **In our context:** This guide and the multisig scripts are for **on-chain** multisig only. For TSS/MPC, see the [MPC docs](../mpc/) and [MPC terminology](../mpc/terminology-guide.md).

---

## Level 4: Keychains and Key Material

### 4.1 xpub / xprv (extended public / private key)

- **What it is:** For HD (hierarchical deterministic) coins, the extended public key (xpub) and extended private key (xprv) allow deriving many addresses from one seed. Not all coins use xpub/xprv; some use a single address as "pub."
- **Why it matters:** BitGo keychains store `pub` (and optionally `encryptedPrv`). The format of `pub` is coin-specific (xpub for UTXO, sometimes address for account-based).
- **In our context:** The offline script uses `baseCoin.keychains().create()`, which returns `pub` and `prv` in the format expected by that coin. We store only `pub` and passphrase-encrypted `prv` in keychain params.

### 4.2 Keychain (BitGo)

- **What it is:** In BitGo’s API, a **keychain** is the **record** for one of the three keys in a 2-of-3 wallet. It contains: key id, `pub`, and optionally `encryptedPrv` (encrypted private key).
- **Why it matters:** "Create BitGo keychain" means create the BitGo-held key record. "Add user keychain" means register the user’s key (pub + encryptedPrv) with BitGo.
- **In our context:** We have three keychains: user, backup, BitGo. User and backup keychains are created offline (keypair + encrypt), then added via the online script. BitGo keychain is created by BitGo in online step 0.

### 4.3 User / backup / BitGo keychain

- **What they are:** The three keychains in the wallet: one for the user (you), one for the backup (you or another device), one for BitGo (co-signing service).
- **Why it matters:** User and backup private keys are under your control (generated and encrypted offline). BitGo’s key is created and held by BitGo.

### 4.4 Encrypted prv (encrypted private key)

- **What it is:** The private key encrypted with a **passphrase** (e.g. via BitGo’s encrypt API) so it can be stored or sent to BitGo without exposing the raw key.
- **Why it matters:** BitGo stores `encryptedPrv` for user and backup keychains. To sign later, you decrypt locally with the passphrase; BitGo never sees the decrypted key.
- **In our context:** The offline script encrypts user and backup private keys with `WALLET_PASSPHRASE` and writes only `encryptedPrv` in the keychain params files.

---

## Level 5: Key Signatures and Workspace

### 5.1 Key signatures

- **What it is:** When creating the wallet, the **user** signs the **backup** and **BitGo** public keys with the user’s private key. These signatures are sent as `keySignatures` (backup, bitgo) so BitGo can verify that the user key is in your possession.
- **Why it matters:** BitGo requires proof that the keychains being added are controlled by you. Key signatures provide that proof without sending the raw user private key.
- **In our context:** Offline step 1 computes `backup: signMessage(userPrv, backupPub).toString('hex')` and `bitgo: signMessage(userPrv, bitgoPub).toString('hex')`, written to `key-signatures.json`.

### 5.2 Wallet (in this context)

- **What it is:** The BitGo object that represents one 2-of-3 wallet: it links the three keychains and holds metadata (label, wallet id, receive address, etc.).
- **Why it matters:** "Create the wallet" means POST `/wallet/add` with keys (keychain IDs), keySignatures, label, m, n. The result is the wallet id and receive address.

### 5.3 Workspace (multisig)

- **What it is:** A **directory** used in the two-script (offline/online) flow. It holds the JSON files exchanged between offline and online machines: `bitgo-keychain.json`, `user-keychain-params.json`, `backup-keychain-params.json`, `key-signatures.json`, `wallet-result.json`.
- **Why it matters:** The offline machine never talks to the network; the online machine never sees raw private keys. They communicate by copying files in and out of this workspace (e.g. USB). Set `MULTISIG_WORKSPACE_DIR` to point to this directory.

---

## Quick Reference: Dependency Order

1. **Level 1:** Private key → Public key → Signing
2. **Level 2:** Multi-signature → Threshold → Key pair
3. **Level 3:** On-chain multisig vs TSS
4. **Level 4:** xpub/xprv → Keychain (BitGo) → User/backup/BitGo keychain → Encrypted prv
5. **Level 5:** Key signatures → Wallet → Workspace

---

## One-Sentence Glossary

| Term | One sentence |
|------|----------------|
| **Private key** | The secret that proves ownership and authorizes signing; must never be shared. |
| **Public key** | The public value derived from the private key; used to derive addresses and verify signatures. |
| **Signing** | Creating a cryptographic signature on a message using the private key. |
| **Multisig** | Requiring more than one key to approve an action (e.g. 2 of 3). |
| **Threshold** | The rule "at least m of n parties must participate" (e.g. 2-of-3). |
| **Key pair** | A private key and its corresponding public key. |
| **On-chain multisig** | Multisig where each party holds a full key pair; the chain requires m-of-n signatures. |
| **TSS** | Threshold Signature Scheme: one key split into shares; see [MPC terminology](../mpc/terminology-guide.md) if using TSS. |
| **xpub / xprv** | Extended public/private key (HD); format of keychain pub/prv depends on coin. |
| **Keychain (BitGo)** | The record for one of the three keys (user, backup, BitGo) in the wallet. |
| **Encrypted prv** | Private key encrypted with a passphrase for storage or transmission. |
| **Key signatures** | User signs backup.pub and bitgo.pub with user.prv to prove key ownership when creating the wallet. |
| **Wallet** | The BitGo object linking the three keychains (keys, keySignatures, label, m, n). |
| **Workspace (multisig)** | Directory of files (bitgo-keychain, user/backup params, key-signatures, wallet-result) exchanged between offline and online machines. |

---

For **TSS/MPC** concepts (shares, p-share, n-share, DKG, key combine, etc.), see [MPC terminology guide](../mpc/terminology-guide.md).
