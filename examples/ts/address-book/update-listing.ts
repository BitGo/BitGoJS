/**
 * Remove a connection
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/sdk-core';
import { UpdateAddressBookListingParams } from 'modules/sdk-core/dist/src/bitgo/address-book';
require('dotenv').config({ path: '../../../.env' });

const OFC_WALLET_ID = process.env.OFC_WALLET_ID;

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

async function main() {
  const wallet = await bitgo.coin('ofc').wallets().get({ id: OFC_WALLET_ID });
  const addressBook = wallet.toAddressBook();

  const listing = await addressBook.getListing();

  const body: UpdateAddressBookListingParams = {
    listingId: listing.id,
    description: 'Updated description',
  };

  const response = await addressBook.updateListing(body);

  console.log('Updated Address Book Listing:', response);
}

main().catch((e) => console.error(e));
