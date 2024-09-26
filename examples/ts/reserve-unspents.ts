/**
 * Manage unspent reservations on your wallet
 *
 * Copyright 2024 BitGo, Inc. All Rights Reserved.
 */

const BitGoJS = require('modules/bitgo');

// change this to env: 'prod' when you are ready for production
const env = 'test';
// change coin to 'btc' when working with production
const coin = env === 'test' ? 'tbtc' : 'btc';

const bitgo = new BitGoJS.BitGo({ env });

// set your access token here
const accessToken = '';

// set the unspent IDs to manage the reservations of
const unspentIds = ['', ''];

// set the expire time for the reservation (use 'never' to freeze)
const expireTime = '';

async function createUnspentReservation() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const reserveResult = await wallet.manageUnspentReservations({
    create: { unspentIds, expireTime: 'never' },
  });
  console.log('reserved ' + JSON.stringify(reserveResult, null, 2));
}

async function modifyUnspentReservation() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const reserveResult = await wallet.manageUnspentReservations({
    modify: { unspentIds, changes: { expireTime } },
  });
  console.log('modified ' + JSON.stringify(reserveResult, null, 2));
}

async function releaseUnspentReservation() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const reserveResult = await wallet.manageUnspentReservations({
    delete: { id: unspentIds[0] },
  });
  console.log('released ' + JSON.stringify(reserveResult, null, 2));
}

// createUnspentReservation().catch(console.error);
// modifyUnspentReservation().catch(console.error);
// releaseUnspentReservation().catch(console.error);
