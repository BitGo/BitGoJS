/**
 * Create a multi-sig wallet at BitGo.
 * This makes use of the convenience function generateWallet
 *
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 * In this form, it creates 2 keys on the host which runs this example.
 * It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES for real money wallets!
 *
 * To perform more advanced features, such as encrypting keys yourself, please look at createWalletAdvanced.js
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

const bitgo = require('bitgo')
require('dotenv').config();
const apiKey = "v2x540d8fa16a0c53a9f3945c9b72f44cb519acb4bfa70776bf3ac6f33bd7c6d6df"
const bg = new bitgo.BitGo({
  env: 'test',
});
const accessToken = apiKey;
const coin = 'tton';
bg.register(coin, bg.createInstance);
const walletId = '66b5e37c76bd2739d01359476773abcf';
//start token access
async function main() {
  bg.authenticateWithAccessToken({ accessToken: accessToken });
  const wallet = await bg.coin(coin).wallets().get({ id: walletId });
  const body = {
    "address": "67401ec3eb518d75b596c25df3a0282c",
    "walletPassphrase": "#Bondiola1234"
  }
  const response = await fetch(`http://localhost:3080/api/v2/${coin}/wallet/${walletId}/transfer`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  console.log(data)
}

main().catch(console.error);
