/**
 * Create a manual connection to a listing entry
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/sdk-core';
import { CreateAddressBookConnectionParams } from 'modules/sdk-core/src/bitgo/address-book';
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
  const listingEntry = listing.listingEntries?.[0];

  const body: CreateAddressBookConnectionParams = {
    listingEntryId: listingEntry?.id as string, // my listing entry id for the wallet
    walletId: '', // ofc wallet with whom I was to add to the address book.
    localListingName: 'Manual Wallet Name',
    localListingEntryDescription: 'My description of the connection',
  };

  const connection = await addressBook.createConnection(body);

  console.log('Address Book Connection:', connection);
}

main().catch((e) => console.error(e));
