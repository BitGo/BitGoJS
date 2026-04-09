/**
 * Fetch a list of webhooks for wallet's coin type
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

const BitGo = require('bitgo');

// change this to env: 'production' when you are ready for production
const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here
const accessToken = '';

// Set the coin type of an active wallet in your BitGo account
// e.g. tbtc
const network = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const coin = bitgo.coin(network);

  const webhooks = await coin.webhooks().list();

  console.log('List of webhooks returned successfully');
  console.log(webhooks);
}

main().catch((e) => console.error(e));
