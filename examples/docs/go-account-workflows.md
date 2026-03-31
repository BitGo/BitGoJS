# Go Account Workflows

This guide covers the full Go Account (trading wallet) lifecycle using the BitGo SDK directly, without requiring BitGo Express.

## Overview

**BitGo Express is optional middleware** - you can interact directly with the BitGo platform using the SDK. This approach gives you:
- Direct API communication with BitGo
- No need to run a separate Express server
- Full control over the wallet creation process
- Production-ready code with proper error handling

## Available Scripts

### 1. SDK Approach (Recommended)
**File:** `examples/ts/go-account/create-go-account.ts`

Uses the high-level `generateWallet()` method which handles keychain creation, encryption, and wallet setup automatically.

**Best for:**
- Most production use cases
- Quick integration
- Users who don't need manual key management

**Example:**
```typescript
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

const response = await bitgo.coin(coin).wallets().generateWallet({
  label: 'My Go Account',
  passphrase: 'wallet_passphrase',
  passcodeEncryptionCode: 'encryption_code',
  enterprise: 'your_enterprise_id',
  type: 'trading', // Required for Go Accounts
});

const { wallet, userKeychain, encryptedWalletPassphrase } = response;
```

### 2. Advanced SDK Approach
**File:** `examples/ts/go-account/create-go-account-advanced.ts`

Provides manual control over keychain creation and wallet setup using SDK methods.

**Best for:**
- Advanced users needing custom key management
- Integration with custom key storage systems
- Understanding the internals of Go Account creation
- Testing and debugging

### 3. Creating Addresses for Existing Wallets
**File:** `examples/ts/go-account/create-go-account-address.ts`

Demonstrates how to create additional addresses for an existing Go Account wallet.

**Best for:**
- Adding new addresses to existing wallets
- Creating addresses for different tokens
- Managing multiple receiving addresses

**Example:**
```typescript
const wallet = await bitgo.coin('ofc').wallets().get({ id: walletId });

const address = await wallet.createAddress({
  label: 'My New Address',
  onToken: 'ofctsol:usdc' // Required for OFC wallets
});
```

### 4. Go Account Withdrawal — complete flow
**File:** `examples/ts/go-account/go-account-withdrawal.ts`

Runs all three withdrawal steps in a single script: build → sign → submit.

**Best for:**
- End-to-end withdrawal from a Go Account (OFC) wallet in one command
- Quick integration and testing

**Flow:**
```
Step 1: wallet.prebuildTransaction({ recipients: [...] })                        → prebuild
Step 2: tradingAccount.signPayload({ payload: prebuild.payload, walletPassphrase }) → signature
Step 3: POST /tx/send { halfSigned: { payload, signature } }                     → txid/pendingApproval
```

> **Note:** If your enterprise has an approval policy configured, Step 3 returns a
> pending approval instead of a txid. Run `go-account-approve.ts` from a second
> admin account to approve it.

### 5. Go Account Approval — approve a pending withdrawal
**File:** `examples/ts/go-account/go-account-approve.ts`

Approves a pending withdrawal that was held for review by an approval policy.

**Best for:**
- Enterprises that require a second admin to approve withdrawals
- Auditing or reviewing pending transactions before they are broadcast

**Important:** You cannot approve your own transaction — a **different** admin must run this script.

**Flow:**
```
Step 1: coin.pendingApprovals().list({ walletId })     → find pending approval
Step 2: pendingApproval.approve({ walletPassphrase })  → PUT /pendingapprovals/{id}
```

**Example:**
```typescript
const { pendingApprovals } = await coin.pendingApprovals().list({ walletId });
const approval = pendingApprovals.find((pa) => pa.state() === 'pending');
await approval.approve({ walletPassphrase, otp });
```

### 6. Sign Transaction — sign only (Step 2 of 3)
**File:** `examples/ts/go-account/sign-transaction.ts`

Signs a pre-built payload and outputs the hex signature. Use this when the build
step (Step 1) happens in a separate process and you only need to sign offline.

**Best for:**
- Architectures where build and sign happen in different services/environments
- Auditing or debugging the signing step in isolation

**Example:**
```typescript
const tradingAccount = wallet.toTradingAccount();
const signature = await tradingAccount.signPayload({
  payload: prebuildPayload, // stringified JSON from Step 1
  walletPassphrase: 'your_wallet_passphrase',
});
// → pass signature + payload to Step 3 (submitTransaction)
```

---

## Detailed Examples

### SDK Approach Example
```typescript
// Step 1: Create keychain locally
const keychain = bitgo.coin('ofc').keychains().create();

// Step 2: Encrypt private key
const encryptedPrv = bitgo.encrypt({
  password: passphrase,
  input: keychain.prv
});

// Step 3: Add keychain to BitGo
const addedKeychain = await bitgo.coin('ofc').keychains().add({
  pub: keychain.pub,
  encryptedPrv: encryptedPrv,
  originalPasscodeEncryptionCode: passcodeEncryptionCode,
  keyType: 'independent',
  source: 'user',
  enterprise: enterpriseId,
});

// Step 4: Create wallet
const walletResponse = await bitgo.coin('ofc').wallets().add({
  label: 'My Go Account',
  m: 1,
  n: 1,
  keys: [addedKeychain.id],
  type: 'trading',
  enterprise: enterpriseId,
});
```

## Complete Workflow

Both examples demonstrate the complete Go Account creation flow:

### 1. Create Wallet
```typescript
// SDK generates keychain and wallet in one call
const response = await bitgo.coin('ofc').wallets().generateWallet({...});
```

### 2. Wait for Initialization
Go Accounts require system initialization, which may take a few seconds:

```typescript
async function waitForWalletInitialization(wallet, maxRetries = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const walletData = await bitgo.coin('ofc').wallets().get({ id: wallet.id() });
    const coinSpecific = walletData._wallet.coinSpecific;

    if (!coinSpecific.pendingSystemInitialization) {
      return; // Wallet ready
    }

    await sleep(delayMs);
  }
}
```

### 3. Create Addresses
**IMPORTANT:** For Go Account (OFC) wallets, the `onToken` parameter is **always required** when creating addresses. There is no "default" address - every address must be associated with a specific token.

```typescript
// Create a token-specific address (onToken is mandatory)
const tokenAddress = await wallet.createAddress({
  label: 'USDC Address',
  onToken: 'ofctsol:usdc'  // Required for OFC wallets
});

// Create addresses for different tokens
const usdtAddress = await wallet.createAddress({
  label: 'USDT Address',
  onToken: 'ofcttrx:usdt'
});
```

## Key Differences from Express Approach

| Aspect | Express | Direct SDK |
|--------|---------|------------|
| **Server Required** | Yes (Express server) | No |
| **API Calls** | HTTP to Express → Express to BitGo | Direct SDK → BitGo |
| **Setup** | More complex (server + SDK) | Simple (SDK only) |
| **Security** | Keys never leave Express server | Keys managed in your application |
| **Performance** | Extra network hop | Direct communication |
| **Use Case** | Shared signing server | Embedded integration |

## Security Best Practices

1. **Backup Critical Information:**
   - Encrypted private key (`userKeychain.encryptedPrv`)
   - Keychain ID (`userKeychain.id`)
   - Encrypted wallet passphrase (`encryptedWalletPassphrase`)
   - Passphrase encryption code (stored separately)

2. **Secure Storage:**
   - Store encrypted keys in secure database
   - Never log unencrypted private keys
   - Use environment variables for sensitive config

3. **Access Control:**
   - Limit access token permissions
   - Use enterprise-scoped tokens
   - Implement proper authentication

## Running the Examples

1. Install dependencies:
   ```bash
   cd /path/to/BitGoJS
   yarn install
   ```

2. Set up environment:
   ```bash
   cp examples/.env.example examples/.env
   # Edit .env with your access token and enterprise ID
   ```

3. Update script configuration:
   - Set your `enterprise` ID
   - Choose wallet `label` and `passphrase`
   - Optional: Set `token` for specific crypto assets

4. Run the script:
   ```bash
   cd examples/ts/go-account

   # Create a new Go Account wallet (recommended)
   npx tsx create-go-account.ts

   # Create a new Go Account wallet (advanced approach)
   npx tsx create-go-account-advanced.ts

   # Create an address for an existing wallet
   npx tsx create-go-account-address.ts

   # Full withdrawal: build + sign + submit in one command
   OFC_WALLET_ID=your_wallet_id OFC_WALLET_PASSPHRASE=your_passphrase npx tsx go-account-withdrawal.ts

   # Approve a pending withdrawal (run as a DIFFERENT admin)
   TESTNET_ACCESS_TOKEN=approver_token OFC_WALLET_ID=your_wallet_id OFC_WALLET_PASSPHRASE=approver_passphrase npx tsx go-account-approve.ts

   # Approve a specific pending approval by ID
   TESTNET_ACCESS_TOKEN=approver_token PENDING_APPROVAL_ID=your_approval_id OFC_WALLET_PASSPHRASE=approver_passphrase npx tsx go-account-approve.ts

   # Sign only: sign a pre-built payload (Step 2 of 3)
   OFC_WALLET_ID=your_wallet_id OFC_WALLET_PASSPHRASE=your_passphrase OFC_PREBUILD_PAYLOAD='{"..."}' npx tsx sign-transaction.ts
   ```

## Supported Tokens

Common tokens for Go Accounts (use with `onToken` parameter):

### Testnet Tokens
Stablecoins:
- `ofctsol:usdc` - USD Coin on Solana testnet
- `ofctsol:usdt` - USD Tether on Solana testnet
- `ofcttrx:usdt` - USDT on Tron testnet

Native/Wrapped Tokens:
- `ofcbtc` - Bitcoin
- `ofceth` - Ethereum
- `ofctsol:wsol` - Wrapped SOL on Solana testnet
- `ofctsol:ray` - Raydium on Solana testnet
- `ofctsol:srm` - Serum on Solana testnet

### Mainnet Tokens (use when `env: 'production'`)
Stablecoins:
- `ofcsol:usdc` - USD Coin on Solana
- `ofcsol:usdt` - USD Tether on Solana
- `ofcpolygon:usdc` - USD Coin on Polygon
- `ofcarbeth:usdc` - USD Coin on Arbitrum
- `ofcbsc:usdc` - USD Coin on BSC

Native/Wrapped Tokens:
- `ofcbtc` - Bitcoin
- `ofceth` - Ethereum
- `ofcsol:wsol` - Wrapped SOL on Solana
- `ofcpolygon:matic` - MATIC on Polygon

**Note:** Token names use the format `ofc[network]:[token]` (e.g., `ofcsol:usdc`) for chain-specific tokens, or just `ofc[coin]` (e.g., `ofcbtc`) for native coins.

## Troubleshooting

### Wallet initialization timeout
**Issue:** Wallet stuck in `pendingSystemInitialization`

**Solution:** Increase the retry count and delay in `waitForWalletInitialization()`.

### Token address creation fails
**Issue:** Error "onToken is a mandatory parameter for OFC wallets"

**Solution:** Always include the `onToken` parameter when creating addresses for Go Account wallets. There is no default address - every address must specify a token.

**Issue:** Error "Coin unsupported: [token]"

**Solution:**
- Verify the token name format is correct (e.g., `ofctsol:usdc` for testnet, `ofcsol:usdc` for mainnet)
- Check that the token is enabled for your enterprise
- Ensure you're using testnet tokens (`ofct...`) with `env: 'test'` and mainnet tokens (`ofc...`) with `env: 'production'`

## Additional Resources

- [BitGo API Documentation](https://developers.bitgo.com/)
- [Go Accounts Overview](https://developers.bitgo.com/docs/crypto-as-a-service-go-accounts)
- [SDK Reference](https://github.com/BitGo/BitGoJS)

## Support

For questions or issues:
1. Check the [BitGo Developer Documentation](https://developers.bitgo.com/)
2. Open an issue on [GitHub](https://github.com/BitGo/BitGoJS/issues)
3. Contact BitGo support
