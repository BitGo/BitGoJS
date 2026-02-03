# ETH MPC & TSS: Terminology Guide (Beginner-Friendly)

This document explains the cryptography and product terms used in the [ETH MPC self-custody wallet guide](eth-mpc-self-custody-wallet-guide.md). Concepts are ordered **from foundation to advanced**—understand each level before moving to the next.

---

## Level 1: Basic Cryptography (Understand These First)

### 1.1 Private key

- **What it is:** A secret value (like a very long password) that only you should know.
- **Why it matters:** In crypto, the private key is what lets you prove “you” own an address and authorize actions (e.g. sending funds). Anyone with the private key has full control.
- **In our context:** For ETH, the “key” that controls your wallet is derived from a private key. In MPC we never build or store one single private key in one place; instead we split it into **shares**.

### 1.2 Public key

- **What it is:** A value mathematically derived from the private key that can be shared publicly.
- **Why it matters:** From a public key we can derive things like your **Ethereum address**. People can send you funds to that address without ever seeing your private key.
- **In our context:** The wallet’s public key (and thus address) is computed from the combined key; no one party holds the full private key, but together they can still produce a single public key and address.

### 1.3 Signing (digital signature)

- **What it is:** Using your private key to create a “signature” on a message (e.g. a transaction). The signature proves that someone who knows the private key approved that exact message.
- **Why it matters:** Sending funds on Ethereum requires signing the transaction. The network checks the signature against the public key/address to allow the transfer.
- **In our context:** In MPC/TSS, no single device has the full private key; instead, several parties each have a **share** and cooperate to produce a valid signature without any one of them ever seeing the full key.

---

## Level 2: Multi-Signature and Threshold (Build on Level 1)

### 2.1 Multi-signature (multisig)

- **What it is:** A setup where **more than one** key must approve an action (e.g. a transaction). For example “2 out of 3 keys must sign.”
- **Why it matters:** Reduces risk: one stolen key is not enough; you need several parties to agree. Common in companies or shared wallets.
- **In our context:** BitGo uses **2-of-3**: you (user), a backup, and BitGo each hold one key; any two of the three can sign.

### 2.2 Threshold (e.g. 2-of-3)

- **What it is:** The rule that defines how many parties must participate to do something. “2-of-3” means: 3 parties have a share, and **at least 2** must cooperate to sign.
- **Why it matters:** You get security (no single point of failure) and flexibility (one party can be offline and the other two can still sign).
- **In our context:** Our ETH MPC wallets are **2-of-3**: user + backup + BitGo; any two can sign (e.g. you + BitGo, or backup + BitGo).

### 2.3 Key / key pair

- **What it is:** In this doc, “key” usually means the **private key** (and sometimes the associated public key). A “key pair” is private key + public key together.
- **Why it matters:** When we say “you control your key” we mean you control your **private** key (or your share of it). The public key (and address) can be shared.

---

## Level 3: MPC and TSS (Core Ideas)

### 3.1 MPC (Multi-Party Computation)

- **What it is:** A branch of cryptography where **several parties** jointly compute a result (e.g. a signature) **without any one party ever seeing the full secret** (the full private key).
- **Why it matters:** In a normal wallet, one machine has the full private key—if that machine is compromised, everything is lost. In MPC, the key is split into **shares**; each party has only a share. Signing is done by combining **partial results** from each party, so the full key is never assembled in one place.
- **In our context:** User, backup, and BitGo each hold a **share** of one logical key. They run an MPC protocol to sign transactions; no server (including BitGo) ever has the full private key.

### 3.2 TSS (Threshold Signature Scheme)

- **What it is:** A **threshold** version of a **signature scheme**. It’s the specific MPC technique used so that:
  - The key is split into shares (e.g. 3 shares for 2-of-3).
  - Only **t** of **n** parties (e.g. 2 of 3) need to participate to produce a valid signature.
  - The signature looks like a normal single-key signature to the outside world (Ethereum doesn’t “see” that it was made by multiple parties).
- **Why it matters:** TSS gives you multisig-like security (threshold) without storing a full private key anywhere. “TSS wallet” = wallet whose key is split and whose signatures are produced via a threshold protocol.
- **In our context:** “ETH MPC self-custody” uses **ECDSA TSS**: the underlying signature algorithm is ECDSA (used by Ethereum), and the way the key is split and signatures are produced is a threshold (2-of-3) scheme.

### 3.3 ECDSA (Elliptic Curve Digital Signature Algorithm)

- **What it is:** The standard signature algorithm used by Ethereum (and Bitcoin). It uses elliptic-curve math: the private key is a number, the public key is a point on the curve, and signing uses the private key to produce a signature that others can verify with the public key.
- **Why it matters:** When we say “ECDSA TSS,” we mean: we’re doing TSS (splitting the key and signing with a threshold) **for** an ECDSA key, so the resulting signatures are valid Ethereum signatures.
- **In our context:** ETH uses ECDSA; the SDK uses ECDSA TSS so that the combined key is an ECDSA key and the wallet works with standard ETH addresses and transactions.

---

## Level 4: Shares and Key Material (TSS Details)

### 4.1 Share (or key share)

- **What it is:** One **piece** of the full key. By itself, a share is not the full private key and cannot sign alone. When the right number of shares (e.g. 2 out of 3) are used together in the protocol, they can produce a signature without ever reconstructing the full key.
- **Why it matters:** “You have full control of your private share” means: **your** part of the key (user share, and optionally backup share) is generated and stored only by you. BitGo has a different share; no one has the whole key.
- **In our context:** There are 3 shares—index 1 (user), index 2 (backup), index 3 (BitGo). You generate and hold 1 and 2 locally; BitGo holds 3.

### 4.2 p-share (private share)

- **What it is:** In ECDSA TSS, the **private** part of a participant’s key share—the piece that must stay secret and is used in the signing protocol. Each participant has one p-share (their own).
- **Why it matters:** This is the “private share” you must protect. In the guide, “your private share” refers to your p-share (and your backup’s p-share if you hold it). **Never** send your p-share to anyone.
- **In our context:** User has p-share for index 1, backup for index 2. They are created locally (e.g. `MPC.keyShare(1, ...)` and `MPC.keyShare(2, ...)`) and never leave your control.

### 4.3 n-share (public / network share)

- **What it is:** In ECDSA TSS, an **n-share** is the information that one participant sends to **another** participant so that the receiver can form their view of the joint key. Each participant has n-shares “to” the other participants (e.g. user has n-shares to backup and to BitGo).
- **Why it matters:** To set up the 2-of-3 key, participants must exchange some information; that exchange is done via n-shares (often encrypted). You do **not** send your p-share; you send encrypted n-shares so BitGo can build its keychain without ever seeing your secret.
- **In our context:** You encrypt “user→BitGo” and “backup→BitGo” n-shares with BitGo’s public key and send them; BitGo then has what it needs to be the third party without seeing your p-shares.

### 4.4 Key combine (combining shares)

- **What it is:** The step where each participant takes their **p-share** plus the **n-shares** they received from others and runs a mathematical “combine” procedure. The result is not the full private key, but a **signing material** (e.g. x-share + y-shares) that this participant will use later to produce their part of a signature.
- **Why it matters:** After key generation, each party has combined once to get their signing material. When signing, they use that material to create **signature shares**, which are then combined into the final signature—still without ever reconstructing the full private key.
- **In our context:** “Create user keychain” and “create backup keychain” include combining: you combine your p-share with n-shares from the others to get the encrypted signing material you store as your keychain.

### 4.5 Common keychain (common key)

- **What it is:** A **public** value that all parties can compute from the TSS key generation. It uniquely identifies the joint key (e.g. the public key + chaincode in a certain encoding). Everyone agrees on the same common keychain; it’s not secret.
- **Why it matters:** It ties the three keychains (user, backup, BitGo) to the same logical key. When you combine, you check that your result matches this common keychain to ensure everyone is talking about the same key.
- **In our context:** BitGo returns the common keychain when its keychain is created. You use it when creating and verifying user and backup keychains.

---

## Level 5: Keychain and Product Terms (BitGo / SDK)

### 5.1 Keychain (BitGo keychain)

- **What it is:** In BitGo’s product and SDK, a **keychain** is the **record** that represents one of the three keys in the 2-of-3 wallet. It holds things like: key id, public key or common keychain, and optionally **encrypted** private material (encrypted signing material for TSS).
- **Why it matters:** “Create user keychain” means: create the **user’s** key record (with combined TSS material, encrypted), and register it with BitGo. Same for “backup keychain” and “BitGo keychain.” The word “keychain” here is **not** the same as “key share”—it’s the container/record for one of the three parties.
- **In our context:** You create three keychains: user, backup, BitGo. User and backup keychains are built from your local shares and then registered; BitGo keychain is created when you send encrypted n-shares to BitGo.

### 5.2 User keychain / backup keychain / BitGo keychain

- **What they are:** The three keychains in a 2-of-3 wallet: one for the user (you), one for the backup (you or another device), one for BitGo (the co-signing service).
- **Why it matters:** Each keychain corresponds to one “share holder.” When we say “you have full control of your private share,” we mean the **user** (and optionally **backup**) keychain material is generated and stored only by you; the **BitGo** keychain is created and held by BitGo from the encrypted n-shares you send.

### 5.3 Encrypted signing material / encrypted prv

- **What it is:** The result of **key combine** (your view of the joint key for signing), encrypted with a **passphrase** so it can be stored or sent to BitGo’s API without exposing the raw secret.
- **Why it matters:** You store your keychain’s secret part as “encrypted signing material” (or “encrypted prv” in the code). To sign, you decrypt it locally with the passphrase; the server never sees the decrypted value.
- **In our context:** User and backup keychains store encrypted signing material; you decrypt it only on your machine when generating signature shares.

### 5.4 Signature share (vs key share)

- **What it is:** During **signing**, each participant uses their (combined) signing material to compute a **signature share**—a partial contribution to the final signature. These shares are then combined (e.g. by BitGo) into one standard ECDSA signature. A **key share** is used in **key generation**; a **signature share** is used only in **signing**.
- **Why it matters:** You never send your key share (p-share) to BitGo. You only send **signature shares** for each transaction. From signature shares, the full signature can be computed without anyone ever having the full private key.
- **In our context:** The local signer (e.g. Express) loads your key, produces signature shares (e.g. K, MuDelta, S or MPCv2 rounds), and sends those to BitGo; BitGo combines with its share to broadcast the signed transaction.

### 5.5 Wallet (in this context)

- **What it is:** The BitGo object that represents one 2-of-3 TSS wallet: it links the three keychains (user, backup, BitGo) and holds metadata (label, wallet id, etc.). The “wallet” is the container; the keys live in the keychains.
- **Why it matters:** “Create the wallet” means create this container on BitGo’s side so you can later create addresses, build transactions, and sign (using your keychains).

---

## Level 6: Supporting Terms (Encryption and Keys)

### 6.1 GPG (GNU Privacy Guard)

- **What it is:** A standard for **encrypting** and **signing** data using public-key cryptography. In our flow, we use GPG keys to **encrypt** n-shares so that only the intended recipient (e.g. BitGo) can decrypt them.
- **Why it matters:** When you send “user→BitGo” and “backup→BitGo” n-shares, you encrypt them with **BitGo’s public GPG key**. Only BitGo (with its private GPG key) can decrypt. So the network only ever sees encrypted blobs, not raw key material.
- **In our context:** You fetch BitGo’s public GPG key (e.g. from constants), generate your own GPG key pairs for user and backup, and use them to encrypt n-shares and to decrypt the n-shares you receive when combining.

### 6.2 Passphrase (wallet passphrase)

- **What it is:** A password you choose to **encrypt** your local key material (e.g. the combined signing material for the user or backup keychain). The same passphrase is used to decrypt when signing.
- **Why it matters:** It adds a second layer: even if someone gets the encrypted blob, they need the passphrase to use it. You must never send the passphrase to BitGo; it’s only used locally.
- **In our context:** You pass a passphrase when creating keychains; it encrypts the signing material. The local signer needs this passphrase (e.g. from env) to decrypt and produce signature shares.

---

## Quick Reference: Dependency Order

Read in this order if you want a clear build-up:

1. **Level 1:** Private key → Public key → Signing
2. **Level 2:** Multi-signature → Threshold → Key / key pair
3. **Level 3:** MPC → TSS → ECDSA
4. **Level 4:** Share → p-share → n-share → Key combine → Common keychain
5. **Level 5:** Keychain (BitGo) → User/backup/BitGo keychain → Encrypted signing material → Signature share → Wallet
6. **Level 6:** GPG → Passphrase

---

## One-Sentence Glossary

| Term | One sentence |
|------|----------------|
| **Private key** | The secret that proves ownership and authorizes signing; must never be shared. |
| **Public key** | The public value derived from the private key; used to derive addresses and verify signatures. |
| **Signing** | Creating a cryptographic signature on a message (e.g. a transaction) using the private key. |
| **Multisig** | Requiring more than one key to approve an action (e.g. 2 of 3). |
| **Threshold** | The rule “at least t of n parties must participate” (e.g. 2-of-3). |
| **MPC** | Multiple parties compute a result (e.g. a signature) without any one seeing the full secret. |
| **TSS** | A threshold signature scheme: key is split into shares; t-of-n parties produce a normal-looking signature. |
| **ECDSA** | The signature algorithm used by Ethereum (and Bitcoin). |
| **Share / key share** | One piece of the full key; no one has the whole key. |
| **p-share** | The private part of a participant’s key share; must stay secret. |
| **n-share** | The information one participant sends to another so they can form the joint key; often encrypted. |
| **Key combine** | Combining one’s p-share with received n-shares to get signing material (not the full key). |
| **Common keychain** | The public value that identifies the joint key; same for all three parties. |
| **Keychain (BitGo)** | The record for one of the three keys (user, backup, BitGo) in the wallet. |
| **Encrypted signing material** | Your combined signing material encrypted with a passphrase for storage. |
| **Signature share** | A partial signature produced during signing; combined to form the final signature. |
| **GPG** | Standard used here to encrypt n-shares so only the recipient can read them. |
| **Passphrase** | Password used to encrypt/decrypt your key material locally. |
