/**
 * Recover coins sent to a wallet for a different blockchain.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');
// set this to 'test' environment for testing, or 'prod' for production.
const bitgo = new BitGoJS.BitGo({ env: 'test' });

// TODO: set your access token here
const accessToken = null;

// TODO: set this to the coin type the faulty transaction
const sourceCoin = bitgo.coin('tltc');

// TODO: set this to the coin type of the wallet that received the funds
const recoveryCoin = bitgo.coin('tbtc');

// TODO: set this to the wallet that received the funds
const wallet = null;

// TODO: set this to the faulty transaction
const txid = null;

// TODO: set this to the address to send recovered funds to
const recoveryAddress = null;

// to sign the transaction (optional), set 'signed' to true and set either the walletPassphrase or the unencrypted xprv
const signed = false;
const walletPassphrase = null;
const xprv = null;

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const recoveryTx = await sourceCoin.recoverFromWrongChain({
    txid,
    recoveryAddress,
    wallet,
    recoveryCoin,
    signed,
    walletPassphrase,
    xprv,
  });

  console.log(`RecoveryTx: ${JSON.stringify(recoveryTx, null, 4)}`);
}

main().catch((e) => console.error(e));
