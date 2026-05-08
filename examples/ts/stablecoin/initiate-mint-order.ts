/**
 * Initiate a Mint Order for a Stablecoin
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import * as BitGoJS from 'bitgo';
import { common } from '@bitgo/sdk-core';
require('dotenv').config({ path: '../../../.env' });

/**
 * Step 1. GET /assets API
 *      Retrieves:
 *        - The list of assets supported for minting
 *        - Treasury Account Wallet ID for the specified stablecoin, to which the funds need to be sent
 *
 * Step 2. POST /order API
 *      Creates a Mint Order with the specified parameters
 *
 * Step 3. Transfer the USD to the treasury account
 *      Initiates the send transaction to the Treasury Account using sendMany
 */

// IMPORTANT - Update the parameters here
const environment = 'test';
const accessToken = '';
const enterpriseId = '';
const walletId = ''; // GoAccount Wallet ID
const walletPassphrase = ''; // GoAccount Wallet passphrase

const usdcoin = 'tfiatusd'; // USD asset token
const ofcUsdCoin = 'ofctusd'; // ofc usd (for initiating the send from the specified GoAccount wallet to the Treasury Go Account)
const stablecoin = 'tbsc:usd1'; // Stablecoin to mint
const fromAmountInFullUnits = '100'; // Amount in full units of USD (100 USD) - Must be an integer
// Note: fromAmount will be calculated dynamically using asset decimals

// Initialize BitGo SDK
const bitgo = new BitGoJS.BitGo({ env: environment });
bitgo.authenticateWithAccessToken({ accessToken: accessToken });
const basecoin = bitgo.coin(ofcUsdCoin);

function createStablecoinUrl(path: string): string {
  return common.Environments[bitgo.getEnv()].uri + '/api/stablecoin/v1' + path;
}

/**
 * Main function to execute the stablecoin mint order process
 */
async function main() {
  try {
    console.log('🚀 Starting Stablecoin Mint Order Process...');
    console.log('='.repeat(50));
    console.log(`Environment: ${environment}`);
    console.log(`Stablecoin: ${stablecoin}`);
    console.log(`Amount to mint: ${fromAmountInFullUnits} full units`);
    console.log('='.repeat(50));

    // Execute the mint order process step by step
    const { usdAsset, stablecoinAsset, treasuryAccountWalletId, fromAmount } = await fetchAndValidateAssets();
    const newOrder = await createMintOrder(stablecoinAsset, usdAsset, fromAmount);
    await sendUsdToTreasury(treasuryAccountWalletId, newOrder.id, fromAmount);
    const order = await fetchOrderDetails(newOrder.id);

    displayOrderSummary(order.id, order.status, order.fromAmount);
  } catch (error) {
    console.log('\n❌ ERROR: Mint order process failed!');
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
 * Fetch and validate supported assets for the mint operation
 * @returns Object containing USD and stablecoin asset information with calculated amount
 */
async function fetchAndValidateAssets() {
  console.log('\n🔍 STEP 1: Fetching available assets...');

  const assets = await bitgo.get(createStablecoinUrl('/assets'));
  console.log(`✅ Found ${assets.body.length} assets`);

  // Find the required assets
  const usdAsset = assets.body.find((asset: any) => asset.token === usdcoin);
  const stablecoinAsset = assets.body.find((asset: any) => asset.token === stablecoin);

  // Validate that both assets exist
  if (!usdAsset || !stablecoinAsset) {
    throw new Error(`Required assets not found: ${usdcoin}/${stablecoin}`);
  }

  console.log(`📋 USD Asset: ${usdAsset.token} (ID: ${usdAsset.id})`);
  console.log(`🪙 Stablecoin Asset: ${stablecoinAsset.token} (ID: ${stablecoinAsset.id})`);

  const treasuryAccountWalletId = stablecoinAsset.treasuryAccountWalletId;
  const decimals = usdAsset.decimals;

  if (!treasuryAccountWalletId) {
    throw new Error(`Treasury account wallet ID not found for ${stablecoin}`);
  }

  if (decimals === undefined) {
    throw new Error(`Decimals not found for ${usdcoin}`);
  }

  // Calculate fromAmount using USD asset decimals
  const fromAmount = (parseInt(fromAmountInFullUnits, 10) * Math.pow(10, decimals)).toString();

  console.log(`💰 Amount Calculation:`);
  console.log(`   • Full Units: ${fromAmountInFullUnits} ${usdAsset.token}`);
  console.log(`   • Decimals: ${decimals}`);
  console.log(`   • Base Units: ${fromAmount}`);
  console.log(`🏦 Treasury Account Wallet ID: ${treasuryAccountWalletId}`);

  return { usdAsset, stablecoinAsset, treasuryAccountWalletId, fromAmount };
}

/**
 * Create a mint order with the specified parameters
 * @param stablecoinAsset - The stablecoin asset to mint
 * @param usdAsset - The USD asset to convert from
 * @param fromAmount - The amount in base units to convert
 * @returns The created order object
 */
async function createMintOrder(stablecoinAsset: any, usdAsset: any, fromAmount: string) {
  console.log('\n🪙 STEP 2: Creating mint order...');

  const orderRequestBody = {
    sourceWalletId: walletId,
    destinationWalletId: walletId,
    destinationType: 'go_account',
    fromAssetId: usdAsset.id,
    toAssetId: stablecoinAsset.id,
    fromAmount,
    type: 'mint',
  };

  // Display order details for transparency
  console.log('📝 Order Request Details:');
  console.log(`   • Type: ${orderRequestBody.type}`);
  console.log(`   • From Asset: ${usdcoin} → ${stablecoin}`);
  console.log(`   • Amount: ${fromAmount} (base units)`);

  const postOrderResponse = await bitgo
    .post(createStablecoinUrl(`/enterprise/${enterpriseId}/order`))
    .send(orderRequestBody);
  const order = postOrderResponse.body;

  console.log(`✅ Mint order created successfully!`);
  console.log(`   • Order ID: ${order.id}`);

  return order;
}

/**
 * Send USD to the treasury account for minting
 * @param treasuryAccountWalletId - The treasury wallet ID to send tokens to
 * @param orderId - The order ID to use as sequence ID
 * @param fromAmount - The amount in base units to send
 * @returns The transaction object
 */
async function sendUsdToTreasury(treasuryAccountWalletId: string, orderId: string, fromAmount: string) {
  console.log('\n💸 STEP 3: Sending USD to treasury account...');

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
  console.log('\n🔍 STEP 4: Fetching final order details...');
  const orderResponse = await bitgo.get(createStablecoinUrl(`/enterprise/${enterpriseId}/orders/${orderId}`)).send();
  return orderResponse.body;
}

function displayOrderSummary(orderId: string, status: string, fromAmount: string) {
  console.log('\n🎉 MINT ORDER INITIATION COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log('📊 SUMMARY:');
  console.log(`   • Order ID: ${orderId}`);
  console.log(`   • Type: Mint Order`);
  console.log(`   • Status: ${status}`);
  console.log(`   • Asset: ${usdcoin} → ${stablecoin}`);
  console.log(`   • Amount: ${fromAmount} base units`);
  console.log('='.repeat(50));
}

main().catch((e) => console.error(e));
