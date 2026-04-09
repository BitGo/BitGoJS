# BitGo Stablecoin API Documentation

This documentation provides comprehensive API-only workflows for creating stablecoin mint and burn orders using curl commands. These examples are based on the TypeScript implementations but provide pure HTTP API interactions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup BitGo Express](#setup-bitgo-express)
3. [Environment Variables](#environment-variables)
4. [Mint Order Process](#mint-order-process)
5. [Burn Order Process](#burn-order-process)
6. [GoAccount Transfers via BitGo Express](#goaccount-transfers-via-bitgo-express)

## Prerequisites

- BitGo API access token
- Enterprise ID
- Wallet ID (GoAccount)
- Wallet passphrase
- BitGo Express server running locally

## Setup BitGo Express

[BitGo Express](https://developers.bitgo.com/guides/get-started/express/install) is required for GoAccount transfers. You can install it via npm or Docker (recommended).

### Option 1: Install via Docker (Recommended)

Docker is the recommended way to run BitGo Express as it ensures continuous feature parity and security updates.

**Prerequisites:**

- Docker installed on your system

**Pull and run BitGo Express:**

```bash
# Pull the latest Docker container
docker pull bitgo/express:latest

# Run for testnet (default)
docker run -it -p 3080:3080 bitgo/express:latest

# Run for production
docker run -it -p 3080:3080 bitgo/express:latest --env prod

# Run on custom port
docker run -it -p 4000:4000 bitgo/express:latest --port 4000
```

### Option 2: Install via NPM

```bash
npm install -g @bitgo/express
```

**Start BitGo Express:**

```bash
# For testnet
bitgo-express --port 3080 --env test --bind localhost

# For production
bitgo-express --port 3080 --env prod --bind localhost
```

### Verify BitGo Express is Running

```bash
curl -X GET http://localhost:3080/api/v2/ping
```

**Expected Response:**

```json
{
  "status": "service is ok!",
  "environment": "BitGo Testnet",
  "configEnv": "testnet"
}
```

## Environment Variables

Set up your environment variables:

```bash
# API Configuration
export BITGO_ENV="test"  # or "prod" for production
export ACCESS_TOKEN="your_access_token_here"
export ENTERPRISE_ID="your_enterprise_id_here"
export WALLET_ID="your_goaccount_wallet_id_here"
export WALLET_PASSPHRASE="your_wallet_passphrase_here"

# BitGo Express
export BITGO_EXPRESS_HOST="localhost:3080"

# Asset Configuration
export USD_ASSET="tfiatusd"           # USD asset token (testnet)
export STABLECOIN_ASSET="tbsc:usd1"   # Stablecoin to mint/burn (testnet)
export OFC_USD_COIN="ofctusd"         # OFC USD for transfers
export OFC_STABLECOIN="ofctbsc:usd1"  # OFC stablecoin for transfers

# Amount Configuration (in full units)
export AMOUNT_IN_FULL_UNITS="100"    # Amount to mint/burn
```

## Mint Order Process

The mint order process converts USD to stablecoin through the following steps:

### Mint Step 1: Get Available Assets

```bash
curl -X GET \
  "https://app.bitgo-${BITGO_ENV}.com/api/stablecoin/v1/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Optional Query Parameters:**
- `ids`: Filter by specific asset IDs (comma-separated UUIDs)
- `token`: Filter by token symbol (e.g., `eth:usd1`)
- `chain`: Filter by blockchain network (e.g., `eth`, `bsc`)

**Example with filters:**
```bash
# Get assets for specific chain
curl -X GET \
  "https://app.bitgo-${BITGO_ENV}.com/api/stablecoin/v1/assets?chain=tbsc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

Expected Response:

```json
[
  {
    "id": "08c1271e-b15d-4af8-8929-f75383903da4",
    "token": "tfiatusd",
    "name": "Testnet US Dollar",
    "decimals": 2,
  },
  {
    "id": "bfd0daec-f849-4b96-bdb6-6373bffeb9b6",
    "token": "tbsc:usd1",
    "name": "Testnet BSC USD1",
    "decimals": 18,
    "chain": "tbsc",
    "backingAsset": "tfiatusd",
    "treasuryAccountWalletId": "67c1a025f9999f485f7a71aa26a1da4c"
  },
  {
    "id": "49ff49ea-3355-4717-bbb0-5e8f5cae2202",
    "token": "hteth:gousd",
    "name": "Testnet goUSD",
    "decimals": 6,
    "chain": "hteth",
    "backingAsset": "tfiatusd",
    "treasuryAccountWalletId": "6698e670115059e2efe672436a3aea3b"
  }
]
```

### Mint Step 2: Calculate Amount in Base Units

For USD with 2 decimals and amount of 100:

- Base units = 100 × 10² = 10000

```bash
# Calculate programmatically
DECIMALS=2  # From assets API response
AMOUNT_BASE_UNITS=$((${AMOUNT_IN_FULL_UNITS} * 10**${DECIMALS}))
echo "Amount in base units: ${AMOUNT_BASE_UNITS}"
```

### Mint Step 3: Create Mint Order

```bash
curl -X POST \
  "https://app.bitgo-${BITGO_ENV}.com/api/stablecoin/v1/enterprise/${ENTERPRISE_ID}/order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "sourceWalletId": "'${WALLET_ID}'",
    "destinationWalletId": "'${WALLET_ID}'",
    "destinationType": "go_account",
    "fromAssetId": "usd_asset_id_from_step1",
    "toAssetId": "stablecoin_asset_id_from_step1", 
    "fromAmount": "'${AMOUNT_BASE_UNITS}'",
    "type": "mint"
  }'
```

Expected Response:

```json
{
  "id": "order_id_12345",
  "type": "mint",
  "status": "pending_funding",
  "fromAssetId": "usd_asset_id",
  "toAssetId": "stablecoin_asset_id",
  "fromAmount": "10000",
  "sourceWalletId": "wallet_id",
  "destinationWalletId": "wallet_id",
  "createdAt": "2025-08-19T10:00:00.000Z"
}
```

### Mint Step 4: Transfer USD to Treasury (via BitGo Express)

```bash
curl -X POST \
  "http://${BITGO_EXPRESS_HOST}/api/v2/${OFC_USD_COIN}/wallet/${WALLET_ID}/sendcoins" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "address": "'${TREASURY_WALLET_ID}'",
    "amount": "'${AMOUNT_BASE_UNITS}'",
    "walletPassphrase": "'${WALLET_PASSPHRASE}'",
    "sequenceId": "'${ORDER_ID}'"
  }'
```

Expected Response:

```json
{
  "coin": "ofctusd",
  "transfers": [
    {
      "id": "transfer_id_12345",
      "coin": "ofctusd", 
      "wallet": "source_wallet_id",
      "value": -10000,
      "baseValue": -10000,
      "state": "unconfirmed",
      "type": "send"
    }
  ]
}
```

### Mint Step 5: Check Order Status

```bash
curl -X GET \
  "https://app.bitgo-${BITGO_ENV}.com/api/stablecoin/v1/enterprise/${ENTERPRISE_ID}/orders/${ORDER_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

Expected Response:

```json
{
  "id": "order_id_12345",
  "type": "mint",
  "status": "fulfilled",
  "fromAssetId": "usd_asset_id",
  "toAssetId": "stablecoin_asset_id",
  "fromAmount": "10000",
  "toAmount": "100000000"
}
```

## Burn Order Process

The burn order process converts stablecoin back to USD:

### Burn Step 1: Get Available Assets

Same as mint process step 1.

### Burn Step 2: Get Treasury Wallet ID  

The treasury wallet ID is included in the assets API response from step 1, in the `treasuryAccountWalletId` field of the stablecoin asset.

### Burn Step 3: Calculate Amount in Base Units

For stablecoin with 6 decimals and amount of 100:

- Base units = 100 × 10⁶ = 100000000

```bash
# Calculate programmatically  
DECIMALS=6  # From assets API response for stablecoin
AMOUNT_BASE_UNITS=$((${AMOUNT_IN_FULL_UNITS} * 10**${DECIMALS}))
echo "Amount in base units: ${AMOUNT_BASE_UNITS}"
```

### Burn Step 4: Create Burn Order

```bash
curl -X POST \
  "https://app.bitgo-${BITGO_ENV}.com/api/stablecoin/v1/enterprise/${ENTERPRISE_ID}/order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "sourceWalletId": "'${WALLET_ID}'",
    "destinationWalletId": "'${WALLET_ID}'", 
    "destinationType": "go_account",
    "fromAssetId": "stablecoin_asset_id_from_step1",
    "toAssetId": "usd_asset_id_from_step1",
    "fromAmount": "'${AMOUNT_BASE_UNITS}'",
    "type": "burn"
  }'
```

### Burn Step 5: Transfer Stablecoin to Treasury (via BitGo Express)

```bash
curl -X POST \
  "http://${BITGO_EXPRESS_HOST}/api/v2/${OFC_STABLECOIN}/wallet/${WALLET_ID}/sendcoins" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "address": "'${TREASURY_WALLET_ID}'",
    "amount": "'${AMOUNT_BASE_UNITS}'", 
    "walletPassphrase": "'${WALLET_PASSPHRASE}'",
    "sequenceId": "'${ORDER_ID}'"
  }'
```

### Burn Step 6: Check Order Status

Same as mint process step 5.

## GoAccount Transfers via BitGo Express

### Prerequisites for GoAccount Transfers

1. **BitGo Express Setup**: BitGo Express must be running locally
2. **OFC Asset**: Use the "ofc" prefixed version of your asset (e.g., `ofctusd` for USD transfers)
3. **Address Parameter**: For treasury transfers and most GoAccount operations, use `address` parameter with the destination wallet ID

### Transfer Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `address` | Destination wallet ID or external address | Yes |
| `walletId` | Alternative to address for GoAccount transfers (context-dependent) | No |
| `amount` | Amount in base units | Yes |
| `walletPassphrase` | Source wallet passphrase | Yes |
| `sequenceId` | Unique identifier (use order ID) | Yes |


## API Endpoints Reference

### Stablecoin API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stablecoin/v1/assets` | List available assets (includes treasury wallet IDs) |
| POST | `/api/stablecoin/v1/enterprise/{enterpriseId}/order` | Create order |
| GET | `/api/stablecoin/v1/enterprise/{enterpriseId}/orders/{orderId}` | Get order details |

### BitGo Express Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/ping` | Health check |
| POST | `/api/v2/{coin}/wallet/{walletId}/sendmany` | Send to multiple recipients |

### Base URLs

- **Testnet**: `https://app.bitgo-test.com`
- **Production**: `https://app.bitgo.com`
- **BitGo Express**: `http://localhost:3080` (default)

## Security Considerations

1. **API Keys**: Store access tokens securely, never commit to version control
2. **Wallet Passphrases**: Use environment variables, avoid hardcoding
3. **Network Security**: Use HTTPS for all API calls

## Troubleshooting

### Common Issues

1. **BitGo Express Not Running**: Ensure Express server is started and accessible
2. **Invalid Asset IDs**: Verify asset IDs from the assets API response
3. **Insufficient Balance**: Check wallet balance before initiating transfers
4. **Wrong Environment**: Ensure consistent use of test/prod environments
5. **Sequence ID Conflicts**: Use unique sequence IDs for each transaction

### Debug Commands

```bash
# Check BitGo Express status
curl -X GET http://localhost:3080/api/v2/ping
```

---

This documentation provides a complete API-only workflow for BitGo stablecoin operations. For additional support, refer to the [BitGo API Documentation](https://developers.bitgo.com/) or contact BitGo support.
