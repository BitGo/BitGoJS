# MPCv2 Self-Custody Wallet: Two-Script Flow (Offline / Online)

This guide describes creating an **MPCv2 TSS self-custody hot wallet** using **two separate scripts**: an **offline script** (no network) that generates private material and encrypted payloads, and an **online script** that sends encrypted data to BitGo and creates the wallet. Raw private keys never leave the offline environment.

## Overview

- **MPCv2** uses the DKLS protocol (4-round DKG). User, Backup, and BitGo participate; User and Backup key shares are generated on the offline machine.
- **Offline script** (`mpc-self-custody-offline.js`): Runs on an air-gapped or offline machine. Generates and manages your **p-shares** (private key shares) - they **never leave** this machine.
- **Online script** (`mpc-self-custody-online.js`): Runs on a network-connected machine. Communicates with BitGo APIs, sending only **encrypted n-shares** and **passphrase-encrypted signing material**.
- **Workspace files**: JSON files transferred between offline and online machines containing only encrypted data.

Communication between the two scripts is **file-based** in a shared workspace directory (e.g. `mpc-keygen-workspace/`). The offline machine and online machine can be the same (for testing) or different; in production, run the offline script on an air-gapped machine and copy only the payload/response files.

## Workspace Files

| File | Written by | Read by | Description |
|------|------------|---------|-------------|
| `bitgo-gpg-public-key.json` | Online (step 0) | Offline | BitGo public GPG key (armored). |
| `round1-payload.json` | Offline (step 1) | Online (step 1) | Payload for POST /mpc/generatekey R1. |
| `round1-response.json` | Online (step 1) | Offline (step 2) | BitGo R1 response (sessionId, bitgoMsg1, bitgoToUserMsg2, bitgoToBackupMsg2). |
| `round1-state.json` | Offline (step 1) | Offline (step 2) | **Sensitive.** DKG session state and GPG keys; keep on offline machine only. |
| `round2-payload.json` | Offline (step 2) | Online (step 2) | Payload for POST /mpc/generatekey R2. |
| `round2-response.json` | Online (step 2) | Offline (step 3) | BitGo R2 response. |
| `round2-state.json` | Offline (step 2) | Offline (step 3) | **Sensitive.** Session state; offline only. |
| `round3-payload.json` | Offline (step 3) | Online (step 3) | Payload for POST /mpc/generatekey R3. |
| `round3-response.json` | Online (step 3) | Offline (step 4) | BitGo R3 response (bitgoMsg4, commonKeychain). |
| `round3-state.json` | Offline (step 3) | Offline (step 4) | **Sensitive.** Session state; offline only. |
| `keychain-payloads.json` | Offline (step 4) | Online (step 4) | User/backup/bitgo keychain params (encryptedPrv only; no raw private). |
| `wallet-result.json` | Online (step 4) | User | Wallet ID, receive address, keychain IDs. |

Set `MPC_WORKSPACE_DIR` to use a custom workspace path; default is `examples/js/mpc-keygen-workspace` when run from that directory.

## Steps (Order of Execution)

1. **Online step 0** (machine with network): Fetch BitGo public GPG key and write `bitgo-gpg-public-key.json`. Copy the workspace (or at least this file) to the offline machine.
2. **Offline step 1**: Read BitGo public key and passphrase; run DKG round 1; write `round1-payload.json` and `round1-state.json`. Copy `round1-payload.json` to the online machine.
3. **Online step 1**: Read `round1-payload.json`; POST to BitGo; write `round1-response.json`. Copy `round1-response.json` to the offline machine.
4. **Offline step 2**: Read round1 response and state; run DKG round 2; write `round2-payload.json` and `round2-state.json`. Copy `round2-payload.json` to the online machine.
5. **Online step 2**: Read `round2-payload.json`; POST; write `round2-response.json`. Copy `round2-response.json` to the offline machine.
6. **Offline step 3**: Read round2 response and state; run DKG round 3; write `round3-payload.json` and `round3-state.json`. Copy `round3-payload.json` to the online machine.
7. **Online step 3**: Read `round3-payload.json`; POST; write `round3-response.json`. Copy `round3-response.json` to the offline machine.
8. **Offline step 4**: Read round3 response and state; complete DKG round 4; get key shares; encrypt with passphrase; write `keychain-payloads.json`. Copy `keychain-payloads.json` to the online machine.
9. **Online step 4**: Read `keychain-payloads.json`; register user, backup, and BitGo keychains; create wallet; write `wallet-result.json`.

## Environment Variables

- **Offline**: `WALLET_PASSPHRASE` (required for step 4), `MPC_WORKSPACE_DIR` (optional).
- **Online**: `BITGO_ACCESS_TOKEN` (required), `COIN` (e.g. `teth`), `WALLET_LABEL`, `ENTERPRISE` (optional), `BITGO_ENV` (e.g. `test`), `MPC_WORKSPACE_DIR` (optional).

## Commands (from repo root)

```bash
# Online machine (with network)
# For bash/zsh
export BITGO_ACCESS_TOKEN=your_token
export COIN=teth
export WALLET_LABEL="My MPCv2 Wallet"
export ENTERPRISE=optional_enterprise_id
export BITGO_CUSTOM_ROOT_URI="bitgo-express-uri"
export WALLET_PASSPHRASE=your_passphrase
# OR use .env
# For fish
set -lx BITGO_ACCESS_TOKEN your_token
set -lx COIN teth
set -lx WALLET_LABEL "My MPCv2 Wallet"
set -lx WALLET_PASSPHRASE=your_passphrase
set -lx ENTERPRISE optional_enterprise_id
set -lx BITGO_CUSTOM_ROOT_URI "bitgo-express-uri"
# OR use .env

node ./examples/js/self-custody-mcp-v2/mpc-self-custody-online.js --step 0
# Copy workspace to offline machine, then:

# Offline machine (no network)
node ./examples/js/self-custody-mcp-v2/mpc-self-custody-offline.js --step 1
# Copy round1-payload.json to online machine, then:

node ./examples/js/self-custody-mcp-v2/mpc-self-custody-online.js --step 1
# Copy round1-response.json to offline machine, then:

node ./examples/js/self-custody-mcp-v2/mpc-self-custody-offline.js --step 2
# Copy round2-payload.json to online machine
node ./examples/js/self-custody-mcp-v2/mpc-self-custody-online.js --step 2
# Copy round2-response.json to offline machine

node ./examples/js/self-custody-mcp-v2/mpc-self-custody-offline.js --step 3
# Copy round3-payload.json to online machine
node ./examples/js/self-custody-mcp-v2/mpc-self-custody-online.js --step 3
# Copy round3-response.json to offline machine

node ./examples/js/self-custody-mcp-v2/mpc-self-custody-offline.js --step 4
# Copy keychain-payloads.json to online machine
node ./examples/js/self-custody-mcp-v2/mpc-self-custody-online.js --step 4
```

## Step-by-Step Flow

### Step 0: Fetch BitGo Configuration (Online)

**Script:** `mpc-self-custody-online.js --step 0`

**What it does:**
- Fetches TSS settings to verify MPCv2 support (maps to section 2.1)
- Fetches BitGo's GPG public key for encrypting n-shares (maps to section 2.2)

**API Endpoints:**
- `GET {microservicesUrl}/api/v2/tss/settings`
- `GET {baseApiUrl}/api/v1/client/constants`

**Output:** `bitgo-gpg-public-key.json`

**Next:** Transfer workspace to offline machine

---

### Step 1: Generate Key Shares (Offline)

**Script:** `mpc-self-custody-offline.js --step 1`

**What it does:**
- Generates user key share (index 1) - maps to section 2.3
- Generates backup key share (index 2) - maps to section 2.4
- Generates GPG key pairs for user and backup - maps to section 2.5
- Creates DKG sessions with n=3, m=2
- Generates round 1 broadcast messages (commitments)
- Encrypts messages with BitGo's GPG public key

**Operations:**
```javascript
const userSession = new DklsDkg.Dkg(n, m, MPCv2PartiesEnum.USER);
const backupSession = new DklsDkg.Dkg(n, m, MPCv2PartiesEnum.BACKUP);
const userGpgKey = await generateGPGKeyPair('secp256k1');
const backupGpgKey = await generateGPGKeyPair('secp256k1');
const userRound1BroadcastMsg = await userSession.initDkg();
const backupRound1BroadcastMsg = await backupSession.initDkg();
```

**Output:** `round1-payload.json`, `round1-state.json`

**Next:** Transfer `round1-payload.json` to online machine

---

### Step 1: Send Round 1 Messages (Online)

**Script:** `mpc-self-custody-online.js --step 1`

**What it does:**
- Sends round 1 encrypted messages to BitGo (part of section 2.6)
- Receives BitGo's round 1 broadcast message
- Receives BitGo's round 2 P2P messages
- Receives `sessionId` for tracking this DKG session

**API Endpoint:**
- `POST {baseApiUrl}/api/v2/mpc/generatekey`
  - Payload: `{ enterprise, type: 'MPCv2', round: 'MPCv2-R1', payload: round1Payload }`

**Output:** `round1-response.json`

**Next:** Transfer `round1-response.json` to offline machine

---

### Step 2: Process Round 1 Response (Offline)

**Script:** `mpc-self-custody-offline.js --step 2`

**What it does:**
- Restores DKG sessions from `round1-state.json`
- Decrypts and verifies BitGo's round 1 broadcast message
- Processes round 1 messages to generate round 2 P2P messages
- Encrypts round 2 messages for BitGo

**Operations:**
```javascript
const userSession = await DklsDkg.Dkg.restoreSession(n, m, MPCv2PartiesEnum.USER, sessionData);
// Decrypt BitGo's message
const bitgoRound1BroadcastMsg = await DklsComms.decryptAndVerifyIncomingMessages(...);
// Generate round 2 P2P messages
const userRound2P2PMessages = userSession.handleIncomingMessages({
  p2pMessages: [],
  broadcastMessages: [bitgoRound1BroadcastMsg, backupRound1BroadcastMsg]
});
```

**Output:** `round2-payload.json`, `round2-state.json`

**Next:** Transfer `round2-payload.json` to online machine

---

### Step 2: Send Round 2 Messages (Online)

**Script:** `mpc-self-custody-online.js --step 2`

**What it does:**
- Sends round 2 encrypted P2P messages to BitGo (part of section 2.6)
- Receives BitGo's round 2 P2P messages
- Receives BitGo's round 3 P2P messages (BitGo is one step ahead)
- Receives BitGo's commitment for round 2

**API Endpoint:**
- `POST {baseApiUrl}/api/v2/mpc/generatekey`
  - Payload: `{ enterprise, type: 'MPCv2', round: 'MPCv2-R2', payload: round2Payload }`

**Output:** `round2-response.json`

**Next:** Transfer `round2-response.json` to offline machine

---

### Step 3: Process Round 2 & 3 Responses (Offline)

**Script:** `mpc-self-custody-offline.js --step 3`

**What it does:**
- Restores DKG sessions from `round2-state.json`
- Decrypts BitGo's round 2 P2P messages (bitgoToUser, bitgoToBackup)
- Processes round 2 messages to generate round 3 P2P messages
- Decrypts BitGo's round 3 P2P messages
- Processes round 3 messages to generate round 4 broadcast messages
- Encrypts all messages for BitGo

**Operations:**
```javascript
// Process round 2 P2P messages
const userRound3Messages = userSession.handleIncomingMessages({
  broadcastMessages: [],
  p2pMessages: [bitgoToUserRound2Msg, backupToUserMsg2]
});
// Process round 3 P2P messages to generate round 4 broadcasts
const userRound4Messages = userSession.handleIncomingMessages({
  broadcastMessages: [],
  p2pMessages: [bitgoToUserRound3Msg, backupToUserMsg3]
});
```

**Output:** `round3-payload.json`, `round3-state.json`

**Next:** Transfer `round3-payload.json` to online machine

---

### Step 3: Send Round 3 & 4 Messages (Online)

**Script:** `mpc-self-custody-online.js --step 3`

**What it does:**
- Sends round 3 & 4 encrypted messages to BitGo (part of section 2.6)
- Receives BitGo's round 4 broadcast message (final commitment)
- Receives `commonKeychain` (public keychain identifier)

**API Endpoint:**
- `POST {baseApiUrl}/api/v2/mpc/generatekey`
  - Payload: `{ enterprise, type: 'MPCv2', round: 'MPCv2-R3', payload: round3Payload }`

**Output:** `round3-response.json`

**Next:** Transfer `round3-response.json` to offline machine

**Note:** At this point, all three participants have completed DKG and possess their key shares

---

### Step 4: Finalize Key Shares (Offline)

**Script:** `WALLET_PASSPHRASE="your-passphrase" mpc-self-custody-offline.js --step 4`

**What it does:**
- Restores DKG sessions from `round3-state.json`
- Decrypts and verifies BitGo's round 4 broadcast message
- Processes round 4 broadcasts to finalize DKG
- Extracts key shares (p-share + received n-shares)
- Verifies `commonKeychain` matches across all participants
- Performs **key combine**: combines p-share with n-shares to produce signing material
- Encrypts signing material with `WALLET_PASSPHRASE`
- Prepares keychain params (maps to sections 2.7 & 2.8)

**Operations:**
```javascript
// Finalize DKG
userSession.handleIncomingMessages({
  p2pMessages: [],
  broadcastMessages: [bitgoRound4BroadcastMsg, backupRound4BroadcastMsg]
});
// Extract key shares
const userPrivateMaterial = userSession.getKeyShare();
const backupPrivateMaterial = backupSession.getKeyShare();
// Verify common keychain
const commonKeychain = DklsTypes.getCommonKeychain(userPrivateMaterial);
// Encrypt with passphrase
const encryptedPrvUser = bitgo.encrypt({
  input: userPrivateMaterial.toString('base64'),
  password: passphrase
});
```

**Output:** `keychain-payloads.json` (passphrase-encrypted signing material)

**Next:** Transfer `keychain-payloads.json` to online machine

---

### Step 4: Register Keychains and Create Wallet (Online)

**Script:** `mpc-self-custody-online.js --step 4`

**What it does:**
- Reads `keychain-payloads.json` from offline machine
- Registers user keychain with encrypted signing material (maps to section 2.7)
- Registers backup keychain with encrypted signing material (maps to section 2.8)
- Registers BitGo keychain (BitGo has its own p-share)
- Creates wallet linking all three keychains (maps to section 2.9)

**API Endpoints:**
- `POST {baseApiUrl}/api/v2/{coin}/key` (called 3 times for user, backup, BitGo)
- `POST {baseApiUrl}/api/v2/{coin}/wallet`

**Operations:**
```javascript
const userKeychain = await keychains.add({
  source: 'user',
  keyType: 'tss',
  commonKeychain,
  encryptedPrv: encryptedPrvUser,
  isMPCv2: true
});
const backupKeychain = await keychains.add({
  source: 'backup',
  keyType: 'tss',
  commonKeychain,
  encryptedPrv: encryptedPrvBackup,
  isMPCv2: true
});
const bitgoKeychain = await keychains.add({
  source: 'bitgo',
  keyType: 'tss',
  commonKeychain,
  isMPCv2: true
});
const newWallet = await bitgo.post(baseCoin.url('/wallet/add')).send({
  label,
  m: 2,
  n: 3,
  keys: [userKeychain.id, backupKeychain.id, bitgoKeychain.id],
  type: 'hot',
  multisigType: 'tss'
}).result();
```

**Output:** `wallet-result.json` (wallet ID, receive address, keychain IDs)

**Result:** Fully operational self-custody MPC wallet

## Security Notes

- **Offline script** must never call `bitgo.get()` or `bitgo.post()`; it only reads BitGo public key from a file and uses `bitgo.encrypt()` locally for passphrase-based encryption.
  - Your **p-shares** (private key shares) stay on the offline machine
- BitGo never receives your **p-shares** or full private keys
  - Only **encrypted n-shares** and **passphrase-encrypted signing material** are transmitted
- **State files** (`round1-state.json`, `round2-state.json`, `round3-state.json`) contain sensitive DKG state and GPG private keys; keep them only on the offline machine and do not copy them to the online machine.
  - Workspace files contain only encrypted data, safe to transfer via USB or other means
- **keychain-payloads.json** contains only passphrase-encrypted private material (`encryptedPrv`); the online script never sees raw private keys or p-shares.
- 2-of-3 threshold: transactions require 2 of 3 key shares to sign
  - Back up the offline state and keychain payloads securely; you need them (and the passphrase) to sign transactions later.
