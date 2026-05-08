/**
 * Verify a BIP322 proof of address ownership from a BitGo multi-sig wallet.
 *
 * This example demonstrates how to:
 * 1. Get a wallet by ID
 * 2. Read address/message pairs from messages.json
 * 3. Get address information to obtain chain and index for pubkey derivation
 * 4. Create a BIP322 proof using sendMany with type 'bip322'
 * 5. Verify the proof using bip322.assertBip322TxProof
 *
 * IMPORTANT: This example does NOT work with descriptor wallets.
 * Only use this with traditional BitGo multi-sig wallets.
 * 
 * This works for Hot wallets only.
 * 
 * Supports all address types except for Taproot Musig2.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BitGo } from 'bitgo';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import * as utxolib from '@bitgo/utxo-lib';
import { bip322 } from '@bitgo/utxo-core';
import { BIP32Factory, ecc } from '@bitgo/secp256k1';

// ============================================================================
// CONFIGURATION - Set these values before running
// ============================================================================

// Set your environment: 'prod' for mainnet, 'test' for testnet
const environment: 'prod' | 'test' = 'test';

// Set the coin: 'btc' for mainnet, 'tbtc4' for testnet
const coin = 'tbtc4';

// Set your BitGo access token
const accessToken = '';

// Set your wallet ID
const walletId = '';

// Set your wallet passphrase for signing
const walletPassphrase = '';

// Set the OTP code. If you dont need one, set it to undefined.
const otp: string | undefined = undefined;

// ============================================================================
// TYPES
// ============================================================================

interface MessageEntry {
  address: string;
  message: string;
}

async function main(): Promise<void> {
  // Validate configuration
  if (!accessToken) {
    throw new Error('Please set your accessToken in the configuration section');
  }
  if (!walletId) {
    throw new Error('Please set your walletId in the configuration section');
  }
  if (!walletPassphrase) {
    throw new Error('Please set your walletPassphrase in the configuration section');
  }

  // Initialize BitGo SDK
  const bitgo = new BitGo({ env: environment });
  bitgo.authenticateWithAccessToken({ accessToken });
  if (otp) {
    const unlock = await bitgo.unlock({ otp, duration: 3600 });
    if (!unlock) {
      console.log('We did not unlock.');
      throw new Error();
    }
  }

  const baseCoin = bitgo.coin(coin);

  console.log(`Environment: ${environment}`);
  console.log(`Coin: ${coin}`);
  console.log(`Wallet ID: ${walletId}`);

  // Read messages from JSON file
  const messagesPath = path.join(__dirname, 'messages.json');
  const messagesContent = fs.readFileSync(messagesPath, 'utf-8');
  const messages: MessageEntry[] = JSON.parse(messagesContent);

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages.json must contain an array of {address, message} objects');
  }

  console.log(`\nLoaded ${messages.length} message(s) to prove:`);
  messages.forEach((m, i) => {
    console.log(`  ${i + 1}. Address: ${m.address}`);
    console.log(`     Message: ${m.message}`);
  });

  // Get the wallet
  console.log('\nFetching wallet...');
  const wallet = await baseCoin.wallets().get({ id: walletId });
  console.log(`Wallet label: ${wallet.label()}`);

  // Get keychains for the wallet (needed for deriving pubkeys)
  console.log('\nFetching keychains...');
  const keychains = await baseCoin.keychains().getKeysForSigning({ wallet });
  const xpubs = keychains.map((k) => {
    if (!k.pub) {
      throw new Error('Keychain missing public key');
    }
    return k.pub;
  });
  console.log('Retrieved wallet public keys');

  // Create RootWalletKeys from xpubs for derivation
  const bip32 = BIP32Factory(ecc);
  const rootWalletKeys = new utxolib.bitgo.RootWalletKeys(
    xpubs.map((xpub) => bip32.fromBase58(xpub)) as utxolib.bitgo.Triple<utxolib.BIP32Interface>
  );

  // Build messageInfo array by getting address details for each message
  console.log('\nBuilding message info from address data...');
  const messageInfo: bip322.MessageInfo[] = [];

  for (const entry of messages) {
    // Get address information from wallet to obtain chain and index
    console.log(`  Getting address info for: ${entry.address}`);
    const addressInfo = await wallet.getAddress({ address: entry.address });

    if (addressInfo.chain === undefined || addressInfo.index === undefined) {
      throw new Error(`Address ${entry.address} is missing chain or index information`);
    }

    const chain = addressInfo.chain as utxolib.bitgo.ChainCode;
    const index = addressInfo.index;

    // Derive scriptType from chain
    const scriptType = utxolib.bitgo.scriptTypeForChain(chain);

    // Derive pubkeys for this address using chain and index
    const derivedKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
    const pubkeys = derivedKeys.publicKeys.map((pk) => pk.toString('hex'));

    console.log(`    Chain: ${chain}, Index: ${index}, ScriptType: ${scriptType}`);

    messageInfo.push({
      address: entry.address,
      message: entry.message,
      pubkeys,
      scriptType,
    });
  }

  console.log('\nCreating BIP322 proof via sendMany...');
  const sendManyResult = await wallet.sendMany({
    recipients: [],
    messages: messages,
    walletPassphrase,
  });

  console.log('BIP322 proof created successfully');

  // Extract the signed transaction from the result
  // The result should contain the fully signed PSBT or transaction hex
  const txHex = sendManyResult.txHex || sendManyResult.tx;
  if (!txHex) {
    throw new Error('No transaction hex found in sendMany result');
  }

  console.log('\nVerifying BIP322 proof...');

  // Parse the transaction and verify
  const network = (baseCoin as AbstractUtxoCoin).network;

  // Check if it's a PSBT or raw transaction
  if (utxolib.bitgo.isPsbt(txHex)) {
    // Parse as PSBT
    const psbt = utxolib.bitgo.createPsbtFromHex(txHex, network);
    bip322.assertBip322PsbtProof(psbt, messageInfo);
    console.log('PSBT proof verified successfully!');
  } else {
    // Parse as raw transaction
    const tx = utxolib.bitgo.createTransactionFromHex<bigint>(txHex, network, { amountType: 'bigint' });
    bip322.assertBip322TxProof(tx, messageInfo);
    console.log('Transaction proof verified successfully!');
  }

  // Display summary
  console.log('\n============================================');
  console.log('BIP322 PROOF VERIFICATION COMPLETE');
  console.log('============================================');
  console.log(`Verified ${messageInfo.length} address/message pair(s):`);
  messageInfo.forEach((info, i) => {
    console.log(`\n${i + 1}. Address: ${info.address}`);
    console.log(`   Message: "${info.message}"`);
    console.log(`   Script Type: ${info.scriptType}`);
  });
  console.log('\nAll proofs are valid. The wallet controls the specified addresses.');
}

// Run the example
main()
  .then(() => {
    console.log('\nExample completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\nExample failed with error:', e.message);
    if (e.result) {
      console.error('API Error details:', JSON.stringify(e.result, null, 2));
    }
    process.exit(1);
  });
