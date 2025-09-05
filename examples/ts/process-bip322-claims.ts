/**
 * Process BIP322 broadcastable messages from JSON claims data
 *
 * This script reads a JSON file containing an array of claims, each with a
 * broadcastableMessage string. It extracts and deserializes the messages,
 * then verifies them using BitGo's BIP322 utilities.
 *
 * Usage:
 *   npx tsx process-bip322-claims.ts [path-to-json-file] [coin-name]
 *
 * Example:
 *   npx tsx process-bip322-claims.ts sample-claims.json btc
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  BIP322MessageBroadcastable,
  deserializeBIP322BroadcastableMessage,
  generateBIP322MessageListAndVerifyFromMessageBroadcastable
} from "@bitgo/abstract-utxo/dist/src/transaction/bip322";

interface ClaimData {
  id: string;
  broadcastableMessage: string;
  [key: string]: any;
}

interface ClaimsResponse {
  status: string;
  claims: ClaimData[];
  count: number;
  pagination?: {
    limit: number;
    hasNext: boolean;
  };
}

/**
 * Process BIP322 broadcastable messages from a JSON file
 * @param filePath - Path to the JSON file containing claims data
 * @param coinName - The coin name (e.g., 'btc', 'tbtc4')
 */
async function processBIP322Claims(filePath: string, coinName: string): Promise<void> {
  try {
    console.log(`Processing BIP322 claims from: ${filePath}`);
    console.log(`Coin: ${coinName}`);
    console.log('');

    // Read and parse the JSON file
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const claimsData: ClaimsResponse = JSON.parse(jsonData);

    console.log(`Status: ${claimsData.status}`);
    console.log(`Total claims: ${claimsData.count}`);
    console.log('');

    if (!claimsData.claims || claimsData.claims.length === 0) {
      console.log('No claims found in the data.');
      return;
    }

    // Extract broadcastable messages from claims
    const broadcastableMessages: string[] = [];

    console.log('Extracting broadcastable messages...');
    claimsData.claims.forEach((claim, index) => {
      if (claim.broadcastableMessage) {
        broadcastableMessages.push(claim.broadcastableMessage);
        console.log(`  Claim ${index + 1} (ID: ${claim.id}): Found broadcastable message`);
      } else {
        console.log(`  Claim ${index + 1} (ID: ${claim.id}): No broadcastable message found`);
      }
    });

    if (broadcastableMessages.length === 0) {
      console.log('No broadcastable messages found in any claims.');
      return;
    }

    console.log(`\nFound ${broadcastableMessages.length} broadcastable message(s)`);
    console.log('');

    // Deserialize each broadcastable message
    console.log('Deserializing BIP322 broadcastable messages...');
    const deserializedMessages: BIP322MessageBroadcastable[] = [];

    for (let i = 0; i < broadcastableMessages.length; i++) {
      try {
        const message = broadcastableMessages[i];
        console.log(`  Deserializing message ${i + 1}...`);

        const deserializedMessage = deserializeBIP322BroadcastableMessage(message);
        deserializedMessages.push(deserializedMessage);

        console.log(`    ✓ Successfully deserialized message ${i + 1}`);
        console.log(`    Transaction hex length: ${deserializedMessage.txHex.length}`);
        console.log(`    Message info count: ${deserializedMessage.messageInfo.length}`);

        // Log details of each message info
        deserializedMessage.messageInfo.forEach((info, infoIndex) => {
          console.log(`      Message ${infoIndex + 1}: Address: ${info.address}, Script type: ${info.scriptType}`);
        });
      } catch (error) {
        console.error(`    ✗ Failed to deserialize message ${i + 1}:`, error.message);
      }
    }

    if (deserializedMessages.length === 0) {
      console.log('No messages were successfully deserialized.');
      return;
    }

    console.log(`\nSuccessfully deserialized ${deserializedMessages.length} message(s)`);
    console.log('');

    // Process deserialized messages with BIP322 verification
    console.log('Verifying and generating message list...');
    console.log('Note: Verification may fail with test data if transaction hex is not valid Bitcoin data');
    console.log('');

    try {
      const verifiedResults = generateBIP322MessageListAndVerifyFromMessageBroadcastable(
        deserializedMessages,
        coinName
      );

      console.log(`✓ Successfully verified and processed all messages`);
      console.log(`\nResults (${verifiedResults.length} verified message(s)):`);
      console.log('');

      verifiedResults.forEach((result, index) => {
        console.log(`${index + 1}. Address: ${result.address}`);
        console.log(`   Message: ${result.message}`);
        console.log('');
      });

      // Summary
      console.log('=== SUMMARY ===');
      console.log(`Total claims processed: ${claimsData.claims.length}`);
      console.log(`Broadcastable messages found: ${broadcastableMessages.length}`);
      console.log(`Successfully deserialized: ${deserializedMessages.length}`);
      console.log(`Successfully verified: ${verifiedResults.length}`);
    } catch (error) {
      console.error('✗ Failed to verify messages:', error.message);
      console.log('');
      console.log('This is expected when using test data with invalid transaction hex.');
      console.log('In production, you would use actual BIP322 transaction data.');
      console.log('');

      // Show what would have been extracted from the messages
      console.log('However, we can still show the extracted message information:');
      console.log('');

      interface ExtractedInfo {
        address: string;
        message: string;
        scriptType: string;
        pubkeys: string[];
        source: string;
      }

      const extractedInfo: ExtractedInfo[] = [];
      deserializedMessages.forEach((message, msgIndex) => {
        message.messageInfo.forEach((info, infoIndex) => {
          extractedInfo.push({
            address: info.address,
            message: info.message,
            scriptType: info.scriptType,
            pubkeys: info.pubkeys,
            source: `Message ${msgIndex + 1}, Info ${infoIndex + 1}`,
          });
        });
      });

      extractedInfo.forEach((info, index) => {
        console.log(`${index + 1}. Address: ${info.address}`);
        console.log(`   Message: ${info.message}`);
        console.log(`   Script Type: ${info.scriptType}`);
        console.log(`   Public Keys: ${info.pubkeys.join(', ')}`);
        console.log(`   Source: ${info.source}`);
        console.log('');
      });

      // Summary
      console.log('=== SUMMARY ===');
      console.log(`Total claims processed: ${claimsData.claims.length}`);
      console.log(`Broadcastable messages found: ${broadcastableMessages.length}`);
      console.log(`Successfully deserialized: ${deserializedMessages.length}`);
      console.log(`Verification failed (expected with test data): ${deserializedMessages.length}`);
      console.log(`Message info extracted: ${extractedInfo.length}`);
    }
  } catch (error) {
    console.error('Error processing BIP322 claims:', error.message);

    if (error.code === 'ENOENT') {
      console.error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      console.error('Invalid JSON format in file');
    }

    process.exit(1);
  }
}

/**
 * Main function to handle command line arguments and run the processor
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log('Usage: npx tsx process-bip322-claims.ts <json-file> <coin-name>');
    console.log('');
    console.log('Arguments:');
    console.log('  json-file  Path to JSON file containing claims data');
    console.log('  coin-name  Coin name (e.g., "btc", "tbtc4")');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx process-bip322-claims.ts sample-claims.json btc');
    process.exit(1);
  }

  const [filePath, coinName] = args;

  // Resolve file path relative to current working directory
  const resolvedPath = path.resolve(filePath);

  await processBIP322Claims(resolvedPath, coinName);
}

// Run the main function
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
