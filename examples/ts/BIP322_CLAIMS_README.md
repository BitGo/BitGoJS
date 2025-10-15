# BIP322 Broadcastable Message Processor

This TypeScript script processes JSON files containing claims with BIP322 broadcastable messages. It demonstrates how to:

1. Parse JSON structure containing claims data
2. Extract `broadcastableMessage` fields from claims
3. Use `deserializeBIP322BroadcastableMessage()` to deserialize each message
4. Use `generateBIP322MessageListAndVerifyFromMessageBroadcastable()` to verify and process messages

## Usage

```bash
npx tsx process-bip322-claims.ts <json-file> <coin-name>
```

### Arguments

- `json-file`: Path to JSON file containing claims data
- `coin-name`: Coin name (supported: "btc", "tbtc4")

### Example

```bash
npx tsx process-bip322-claims.ts sample-claims.json btc
```

## Input JSON Format

The script expects JSON files with the following structure:

```json
{
  "status": "success",
  "claims": [
    {
      "id": "claim-001",
      "broadcastableMessage": "7b227478486578223a22303130323033222c226d657373616765496e666f223a5b7b2261646472657373223a22736f6d6541646472657373222c226d657373616765223a22736f6d654d657373616765222c227075626b657973223a5b227075626b657931222c227075626b657932225d2c2273637269707454797065223a2270327368227d5d7d",
      ...
    }
  ],
  "count": 1,
  "pagination": {
    "limit": 100,
    "hasNext": false
  }
}
```

### Required Fields

- `claims`: Array of claim objects
- `claims[].id`: Unique identifier for the claim
- `claims[].broadcastableMessage`: Hex-encoded BIP322 broadcastable message (optional)

## Sample Data

The repository includes `sample-claims.json` with test data that demonstrates the script functionality. Note that the test data contains mock transaction hex values that will fail verification, but this is expected and demonstrates how the script handles both success and failure cases.

## Functions Used

### `deserializeBIP322BroadcastableMessage(hex: string)`

- **Purpose**: Deserializes a hex-encoded BIP322 broadcastable message
- **Input**: Hex string containing serialized BIP322 message
- **Output**: `BIP322MessageBroadcastable` object containing transaction hex and message info

### `generateBIP322MessageListAndVerifyFromMessageBroadcastable(messages: BIP322MessageBroadcastable[], coinName: string)`

- **Purpose**: Verifies BIP322 messages and extracts address/message pairs
- **Input**: Array of deserialized BIP322 messages and coin name
- **Output**: Array of `{address: string, message: string}` objects
- **Supported Coins**: "btc", "tbtc4"

## Output

The script provides detailed output showing:

1. JSON file parsing results
2. Claims processing summary
3. Message extraction details
4. Deserialization results for each message
5. Verification results or detailed error information
6. Final summary with counts and extracted message information

## Error Handling

The script handles various error conditions:

- **File not found**: Clear error message with file path
- **Invalid JSON**: Parse error indication
- **Deserialization failures**: Per-message error reporting
- **Verification failures**: Detailed error messages with fallback to show extracted data
- **Unsupported coin names**: Clear error about supported values

## Development Notes

This script is designed as a usage example for BitGo's BIP322 utilities. In production environments:

1. Use actual BIP322 transaction data with valid Bitcoin transaction hex
2. Ensure broadcastable messages are properly formatted
3. Handle network-specific addresses and script types appropriately
4. Implement proper error recovery and logging

## Example Output

```
Processing BIP322 claims from: sample-claims.json
Coin: btc

Status: success
Total claims: 3

Extracting broadcastable messages...
  Claim 1 (ID: claim-001): Found broadcastable message
  Claim 2 (ID: claim-002): Found broadcastable message
  Claim 3 (ID: claim-003): No broadcastable message found

Found 2 broadcastable message(s)

Deserializing BIP322 broadcastable messages...
  Deserializing message 1...
    ✓ Successfully deserialized message 1
    Transaction hex length: 6
    Message info count: 1
      Message 1: Address: someAddress, Script type: p2sh

=== SUMMARY ===
Total claims processed: 3
Broadcastable messages found: 2
Successfully deserialized: 2
Message info extracted: 2
```