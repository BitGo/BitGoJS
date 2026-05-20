/**
 * Bulk sign account-based midnight claim messages for a wallet
 *
 * This example demonstrates how to use the BitGo API to sign multiple account-based midnight claim messages
 * in bulk for a given wallet. It shows how to initialize the BitGo SDK, retrieve a wallet, and use the
 * bulkSignAccountBasedMidnightClaimMessages utility to sign messages for a specified destination address.
 *
 * Usage:
 *   - Configure your .env file with the appropriate TESTNET_ACCESS_TOKEN.
 *   - Set the coin and wallet ID as needed.
 *   - Optionally set the wallet passphrase if required for signing.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import {BitGoAPI} from '@bitgo/sdk-api';
import {MessageStandardType, walletUtil} from "@bitgo/sdk-core";
import {Tsol} from "@bitgo/sdk-coin-sol";
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Set the coin name to match the blockchain and network
// doge = dogecoin, tdoge = testnet dogecoin
const coin = 'tsol';
bitgo.register(coin, Tsol.createInstance);

const id = '';
const walletPassphrase = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id });
  console.log(`Wallet label: ${wallet.label()}`);

  const adaTestnetDestinationAddress = '';

  const response = await walletUtil.bulkSignAccountBasedMidnightClaimMessages(wallet, MessageStandardType.SIMPLE, adaTestnetDestinationAddress, walletPassphrase);
  console.dir(response);
}

main().catch((e) => console.log(e));
