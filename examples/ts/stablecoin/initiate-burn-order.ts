/**
 * Initiate a Burn Order for a Stablecoin
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import * as BitGoJS from 'bitgo';
import { common } from '@bitgo/sdk-core';
require('dotenv').config({ path: '../../../.env' });

/**
 * Step 1. GET /assets API
 *      Retrieves:
 *        - The list of assets supported for burning
 *
 * Step 2. GET /{token}/constants API
 *      Retrieves:
 *        - Treasury Account Wallet ID for the specified stablecoin
 *
 * Step 3. POST /order API
 *      Creates a Burn Order with the specified parameters
 *
 * Step 4. Transfer the assets to be burnt, to the treasury account
 *      Initiates the send transaction to the Treasury Account using sendMany
 */

// IMPORTANT - Update the parameters here
const environment = 'test';
const accessToken = '';
const enterpriseId = '';
const walletId = ''; // GoAccount Wallet ID
const walletPassphrase = ''; // Wallet passphrase

const usdcoin = 'tfiatusd'; // USD asset token
const stablecoin = 'tbsc:usd1'; // Stablecoin to burn
const ofcStablecoin = `ofc${stablecoin}`; // ofc stablecoin (for initiating the send from the specified GoAccount wallet to the Treasury Go Account)
const fromAmountInFullUnits = '100'; // Amount in full units of the stablecoin (3 tbsc:usd1) - Must be an integer
// Note: fromAmount will be calculated dynamically using asset decimals

// Initialize BitGo SDK
const bitgo = new BitGoJS.BitGo({ env: environment });
bitgo.authenticateWithAccessToken({ accessToken: accessToken });
const basecoin = bitgo.coin(ofcStablecoin);

function createStablecoinUrl(path: string): string {
  return common.Environments[bitgo.getEnv()].uri + '/api/stablecoin/v1' + path;
}

/**
 * Fetch treasury wallet ID from the constants API
 * @param token - The stablecoin token to get constants for
 * @returns The treasury account wallet ID
 */
async function fetchTreasuryWalletId(token: string): Promise<string> {
  console.log(`\n🔍 STEP 2: Fetching treasury wallet ID from constants API for ${token}...`);
  const constants = await bitgo.get(createStablecoinUrl(`/${token}/constants`));
  const treasuryAccountWalletId = constants.body.trustAccountWalletId;

  if (!treasuryAccountWalletId) {
    throw new Error(`Treasury account wallet ID not found in constants for ${token}`);
  }

  console.log(`🏦 Treasury Account Wallet ID (from constants): ${treasuryAccountWalletId}`);
  return treasuryAccountWalletId;
}

/**
 * Main function to execute the stablecoin burn order process
 */
async function main() {
  try {
    console.log('🚀 Starting Stablecoin Burn Order Process...');
    console.log('='.repeat(50));
    console.log(`Environment: ${environment}`);
    console.log(`Stablecoin: ${stablecoin}`);
    console.log(`Amount to burn: ${fromAmountInFullUnits} full units`);
    console.log('='.repeat(50));

    // Execute the burn order process step by step
    const { usdAsset, stablecoinAsset, fromAmount } = await fetchAndValidateAssets();
    const treasuryAccountWalletId = await fetchTreasuryWalletId(stablecoin);
    const newOrder = await createBurnOrder(stablecoinAsset, usdAsset, fromAmount);
    await sendTokensToTreasury(treasuryAccountWalletId, newOrder.id, fromAmount);
    const order = await fetchOrderDetails(newOrder.id);

    displayOrderSummary(order.id, order.status, order.fromAmount);
  } catch (error) {
    console.log('\n❌ ERROR: Burn order process failed!');
    console.log('='.repeat(50));
    console.error(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    if (error instanceof Error && error.stack) {
      console.log('\n🔍 Stack trace:');
      console.error(error.stack);
    }

    console.log('='.repeat(50));
    throw error;
  }
}

/**
 * Fetch and validate supported assets for the burn operation
 * @returns Object containing USD and stablecoin asset information with calculated amount
 */
async function fetchAndValidateAssets() {
  console.log('\n🔍 STEP 1: Fetching available assets...');

  const assets = await bitgo.get(createStablecoinUrl('/assets'));
  console.log(`✅ Found ${assets.body.length} assets`);

  const usdAsset = assets.body.find((asset: any) => asset.token === usdcoin);
  const stablecoinAsset = assets.body.find((asset: any) => asset.token === stablecoin);

  if (!usdAsset || !stablecoinAsset) {
    throw new Error(`Required assets not found: ${usdcoin}/${stablecoin}`);
  }

  console.log(`📋 USD Asset: ${usdAsset.token} (ID: ${usdAsset.id})`);
  console.log(`🪙 Stablecoin Asset: ${stablecoinAsset.token} (ID: ${stablecoinAsset.id})`);

  // Calculate fromAmount using stablecoin asset decimals
  const decimals = stablecoinAsset.decimals;

  if (decimals === undefined) {
    throw new Error(`Decimals not found for ${stablecoin}`);
  }

  // Calculate fromAmount using asset decimals
  const fromAmount = (parseInt(fromAmountInFullUnits, 10) * Math.pow(10, decimals)).toString();

  console.log(`💰 Amount Calculation:`);
  console.log(`   • Full Units: ${fromAmountInFullUnits} ${stablecoinAsset.token}`);
  console.log(`   • Decimals: ${decimals}`);
  console.log(`   • Base Units: ${fromAmount}`);

  return { usdAsset, stablecoinAsset, fromAmount };
}

/**
 * Create a burn order with the specified parameters
 * @param stablecoinAsset - The stablecoin asset to burn
 * @param usdAsset - The USD asset to receive
 * @param fromAmount - The amount in base units to burn
 * @returns The created order object
 */
async function createBurnOrder(stablecoinAsset: any, usdAsset: any, fromAmount: string) {
  console.log('\n🔥 STEP 3: Creating burn order...');

  const orderRequestBody = {
    sourceWalletId: walletId,
    destinationWalletId: walletId,
    destinationType: 'go_account',
    fromAssetId: stablecoinAsset.id,
    toAssetId: usdAsset.id,
    fromAmount,
    type: 'burn',
  };

  console.log('📝 Order Request Details:');
  console.log(`   • Type: ${orderRequestBody.type}`);
  console.log(`   • From Asset: ${stablecoin} → ${usdcoin}`);
  console.log(`   • Amount: ${fromAmount} (base units)`);

  const postOrderResponse = await bitgo
    .post(createStablecoinUrl(`/enterprise/${enterpriseId}/order`))
    .send(orderRequestBody);
  const order = postOrderResponse.body;

  console.log(`✅ Burn order created successfully!`);
  console.log(`   • Order ID: ${order.id}`);

  return order;
}

/**
 * Send stablecoin tokens to the treasury account for burning
 * @param treasuryAccountWalletId - The treasury wallet ID to send tokens to
 * @param orderId - The order ID to use as sequence ID
 * @param fromAmount - The amount in base units of stablecoin to send
 * @returns The transaction object
 */
async function sendTokensToTreasury(treasuryAccountWalletId: string, orderId: string, fromAmount: string) {
  console.log('\n💸 STEP 4: Sending stablecoin to treasury account...');

  const walletInstance = await basecoin.wallets().get({ id: walletId });

  console.log('🔄 Initiating transaction...');
  console.log(`   • From Wallet: ${walletId}`);
  console.log(`   • To Treasury: ${treasuryAccountWalletId}`);
  console.log(`   • Amount: ${fromAmount} (base units)`);
  console.log(`   • Sequence ID: ${orderId}`);

  const transaction = await walletInstance.sendMany({
    recipients: [
      {
        address: treasuryAccountWalletId,
        amount: fromAmount,
      },
    ],
    sequenceId: orderId, // IMPORTANT - Use order ID as sequence ID for tracking
    walletPassphrase,
  });

  console.log('✅ Transaction sent successfully!');

  return transaction;
}

async function fetchOrderDetails(orderId: string) {
  console.log('\n🔍 STEP 5: Fetching final order details...');
  const orderResponse = await bitgo.get(createStablecoinUrl(`/enterprise/${enterpriseId}/orders/${orderId}`)).send();
  return orderResponse.body;
}

function displayOrderSummary(orderId: string, status: string, fromAmount: string) {
  console.log('\n🎉 BURN ORDER INITIATION COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log('📊 SUMMARY:');
  console.log(`   • Order ID: ${orderId}`);
  console.log(`   • Type: Burn Order`);
  console.log(`   • Status: ${status}`);
  console.log(`   • Asset: ${stablecoin} → ${usdcoin}`);
  console.log(`   • Amount: ${fromAmount} base units`);
  console.log('='.repeat(50));
}

main().catch((e) => console.error(e));
