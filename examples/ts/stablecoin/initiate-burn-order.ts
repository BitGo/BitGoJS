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
 * Step 2. GET /constants API
 * Step 3. POST /order API
 * Step 4. sendMany
 */

// Add the parameters here
const environment = 'test';
const accessToken = '';
const enterpriseId = '';
const walletId = ''; // GoAccount Wallet ID
const walletPassphrase = ''; // Wallet passphrase
const usdcoin = 'tfiatusd';
const stablecoin = 'tbsc:usd1';
const ofcStablecoin = 'ofctbsc:usd1';
const fromAmount = '3000000000000000000'; // in base units, e.g., 3000000000000000000 for 3 TBSC:USD1

const bitgo = new BitGoJS.BitGo({ env: environment });
bitgo.authenticateWithAccessToken({ accessToken: accessToken });

const basecoin = bitgo.coin(ofcStablecoin);

async function main() {
  try {
    // Custom API path helper function
    const stablecoinUrl = (path: string) => {
      return common.Environments[bitgo.getEnv()].uri + '/api/stablecoin/v1' + path;
    };

    // STEP - 1: Gets the list of assets
    const assets = await bitgo.get(stablecoinUrl('/assets'));
    console.log('assets:', assets.body);
    
    // Finds the USD and Stablecoin assets from above response to use in initiating the burn order
    const usdAsset = assets.body.find((asset: any) => asset.token === usdcoin);
    const stablecoinAsset = assets.body.find((asset: any) => asset.token === stablecoin);
    if (!usdAsset || !stablecoinAsset) {
      throw new Error(`Asset ${usdcoin}/${stablecoin} not found`);
    }

    // STEP - 2: Gets the constants for the stablecoin
    const constants = await bitgo.get(stablecoinUrl(`/${stablecoin}/constants`)).send();
    console.log('constants:', constants.body);
    // Extract the treasury account wallet ID from the constants response
    const trustAccountWalletId = constants.body.trustAccountWalletId;
    if (!trustAccountWalletId) {
      throw new Error(`Trust account wallet ID not found for ${stablecoin}`);
    }

    // STEP - 3: Initiates the burn order
    const orderRequestBody = {
      sourceWalletId: walletId,
      destinationWalletId: walletId,
      destinationType: "go_account",
      fromAssetId: stablecoinAsset.id,
      toAssetId: usdAsset.id,
      fromAmount,
      type: "burn",
    };
    const postOrderResponse = await bitgo.post(stablecoinUrl(`/enterprise/${enterpriseId}/order`)).send(orderRequestBody);
    const newOrder = postOrderResponse.body;
    console.log('Order created:', newOrder);

    // STEP - 4: Sends the transaction to the Treasury Account using sendMany
    const walletInstance = await basecoin.wallets().get({ id: walletId });
    const transaction = await walletInstance.sendMany({
      recipients: [
          {
              address: trustAccountWalletId,
              amount: fromAmount,
          }
      ],
      sequenceId: newOrder.id, // IMPORTANT: Use the order ID as the sequence ID
      walletPassphrase,
    });
    console.log('Burn order process completed successfully!');
    console.log('New Transaction:', JSON.stringify(transaction, null, 4));

    const order = await bitgo.get(stablecoinUrl(`/enterprise/${enterpriseId}/orders?ids=${newOrder.id}`)).send();
    console.log('Order details:', JSON.stringify(order.body, null, 4));

  } catch (error) {
    console.error('Error in burn order process:', error);
    throw error;
  }
}

main().catch((e) => console.error(e));
