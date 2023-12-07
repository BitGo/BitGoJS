/**
 * Remove a connection
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/sdk-core';
import { AddressBookListingEntry, UpdateAddressBookListingEntryParams } from 'modules/sdk-core/src/bitgo/address-book';
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

  const listingEntry = listing.listingEntries?.[0] as AddressBookListingEntry;

  const body: UpdateAddressBookListingEntryParams = {
    listingEntryId: listingEntry.id,
    description: 'Public description',
    public: true,
  };

  const updatedListingEntry = await addressBook.updateListingEntry(body);

  console.log('Address Book Listing Entry:', updatedListingEntry);
}

main().catch((e) => console.error(e));
