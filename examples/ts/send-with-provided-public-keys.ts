/**
 * For users who would like to trustlessly verify transaction prebuilds created by BitGo,
 * the BitGo SDK has the ability to perform verification of unsigned transactions for Bitcoin and other UTXO
 * transactions.
 *
 * The only information needed is the extended public keys for the wallet. All addresses which are being spent
 * to must be derivable using these keys, otherwise they will be considered external outputs.
 *
 * External outputs should exactly match the amount being sent to each recipient in the send request,
 * with the possible exception of a pay-as-you-go (PayGo) output, which cannot exceed 150 basis points of the total output
 * amount. For users who are on a post-paid plan and don't use the pay-as-you-go billing model, PayGo outputs can be
 * disabled. If this is the case, then the input amount minus the fee amount must exactly equal the total amount
 * being sent to requested recipients, plus the change amount.
 *
 * Copyright 2021, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });
const debug = require('debug')('send-with-pubkeys*');

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

const walletId = '';
const walletPassphrase = '';

const recipients = [
  {
    amount: '123412',
    address: 'recipient_address_here',
  },
];

// TODO: these are example public keys, please substitute them with the correct keys for your wallet
const keychains = {
  user: {
    pub: 'xpub661MyMwAqRbcG9jW7yGH5q3gniFXRiVm6eNodEXmGrUnE5k1gnFCfivEzL8PEkiYyMLiHx3mGdJk8ABZ4Aw1pthkEQbfnJjehxdZpaHb4AE',
  },
  backup: {
    pub: 'xpub661MyMwAqRbcF47eVHSVcpnPwjvf4xnfH2PpnS9sPsjUwMBxYxqDbyJEYZ2Xpi5cyEirTpYc32GBXG8DRkU8DkAYUi6vCYTy5krvve5ZwVY',
  },
  bitgo: {
    pub: 'xpub661MyMwAqRbcGt7gRtUMbV3K5f9wJjputbhCY4BM4BDEPpRyixAtiWCqNFsLeBdbStcKTGMgeX3pjvazz58r4WVFH1dXrUq7DfVmQSijgGL',
  },
};

async function main() {
  const basecoin = bitgo.coin(coin);
  const walletInstance = await basecoin.wallets().get({ id: walletId });

  const transaction = await walletInstance.sendMany({
    recipients,
    walletPassphrase,
    verification: {
      keychains,
    },
  });

  debug('%O', transaction);
}

main().catch((e) => console.error(e));
