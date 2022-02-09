/* eslint-disable */
/*

----------- README -----------

PRE-REQUIREMENTS.

1. Do you need an enterprise in your account : How?
  - Go to TAT (https://testnet-XX-admin.bitgo-dev.com/), login with Bitgo Test account. Use testnet as you need.
  - Create an enterprise with the following data:
        - Bitgo contract Entity: Bitgo Trust.
        - Organization ID: NOTHING. ITS IMPORTANT BE EMPTY.
        - Salesforce Opportunity ID: 123456
        - Pricing Plan: 1
        - Licenses: First three.
        - KYC Information: Waived.
        - Primary Contact email: MAIL YOU WANT TO USE in testnet.
        - Rest of data the one of you want.

2. Login in testnet using same mail to primary contact.
3. Enable an Access Token : How? User Settings > Developer Options > Add Access Token
4. Copy the access token and set this in env.js file.
5. In the ENV file, set the URI where you work like a 'https://testnet-XX-app.bitgo-dev.com'

Optional, set walletId and Address.

For test, uncomment lines below the file.

 */

const environment = 'test';
const { envs } = require('./env');
const BitGoJS = require('../modules/core/dist/src/index');
const bitgo = new BitGoJS.BitGo({ env: environment });
const fs = require('fs');

const accessToken = envs[environment].accessToken;
const coin = 'tavaxc';
const walletLabel = 'Test TAVAXC V2 Wallet - ' + (new Date()).getTime();
// const walletPassphrase = 'walletPassphrase';
const walletPassphrase = 'xlWD4G$3Fa20';
const tokenName = 'tavaxc:LINK'; //Example: 'tavax:QI'
const tokenBadName = 'tavaxc:ETHEREUM'; // Example: 'tavaxc:BENQUI'
const enterprise = '61f17299e575ec00070b2e96f442962a';
const coinWalletId = envs[environment].walletId;
const address = envs[environment].address;

// Create the wallet
async function createWallet(enterprise) {
  console.log(accessToken);
  await bitgo.authenticateWithAccessToken({ accessToken });
  const walletOptions = {
    label: walletLabel,
    passphrase: walletPassphrase,
    walletLabel,
    walletPassphrase,
    enterprise,
  };

  const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);
  const walletInstance = wallet.wallet;
  console.log(JSON.stringify(wallet));
  console.log('-----------------------------------------');
  console.log(JSON.stringify(walletInstance));

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`TDOT Address: ${walletInstance.coinSpecific().rootAddress}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
}

// Get general balances
async function getBalances(coinName, walletId) {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = await bitgo.coin(coinName).wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Balance:', walletInstance.balanceString());
  console.log('Confirmed Balance:', walletInstance.confirmedBalanceString());
  console.log('Spendable Balance:', walletInstance.spendableBalanceString());
}

// List Data Wallets
async function listDataWallet(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken: accessToken });
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  // const response = walletInstance.createAddress();
  console.log(walletInstance.toJSON());
}

// Get only token balances (ALL OF TOKENS)
async function getTokenBalances(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  //walletInstance.submitTransaction();
  const walletData = walletInstance.toJSON();
  console.log(walletData.tokens);
  return walletData.tokens;
}

//
async function submitTxn(walletId, txHex) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    throw new Error('We did not unlock.');
  }
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });

  const recipients = [
    {
      address: 'idk test',
      amount: '0',
    },
  ];
  const res = await walletInstance.submitTransaction({
    halfSigned: {
      txHex: txHex,
      recipients,
    },
  });
  console.dir(res, { depth: 6 });
}

//
async function sendFunds(walletId, baseUnitQuantity, rcv) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const walletInstance = await bitgo.coin(tokenName).wallets().get({ id: walletId });

  const res = await walletInstance.sendMany({
    recipients: [
      {
        amount: baseUnitQuantity,
        address: rcv,
      },
    ],
    sequenceId: '6',
    walletPassphrase: walletPassphrase,
  });
  console.dir(JSON.stringify(res, null, 2));
}

// Build transaction
async function buildTxn(walletId, tokenName, baseUnitQuantity, rcv) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const walletInstance = await bitgo.coin(tokenName).wallets().get({ id: walletId, allTokens: true });
  const res = await walletInstance.prebuildTransaction({
    recipients: [
      {
        amount: baseUnitQuantity,
        address: rcv,
      },
    ],
    sequenceId: '1',
    walletPassphrase: walletPassphrase,
  });
  // const res = await walletInstance.prebuildTransaction();

  console.log(JSON.stringify(res));
  fs.writeFile('test_avaxtx.json', JSON.stringify(res), (err) => {
    if (err) {
      throw err;
    }
    console.log('JSON data is saved.');
  });
  console.dir('Built Transaction ' + JSON.stringify(res, null, 2));
}


async function getWalletTransfers(walletId) {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  const transfers = await walletInstance.transfers();

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Wallet Transactions:', JSON.stringify(transfers, null, 4));
}

//GET WALLET TOKENS
async function tokenBalance(walletId, token) {
  await bitgo.authenticateWithAccessToken({ accessToken: accessToken });
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  const response = walletInstance.createAddress();
  console.log(walletInstance.toJSON().tokens);
}

async function createReceiveAddress(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken: accessToken });
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  const response = walletInstance.createAddress();
  console.log(JSON.stringify(response));
  console.log(walletInstance.toJSON());
}


// ✔️ AVAXC Hot wallet - Create wallet with create and store my own key.
// createWallet(enterprise);

// ✔️ AVAXC Hot Wallet - Get all token balance for a wallet.
const wallet1 = '61f173153ed1da000779bc79b5a2bb07'
const wallet2 = '61f174373ed1da000779bd733048c38c'
// getBalances(coin, wallet1);
// getBalances(coin, wallet2);
// listDataWallet(wallet1);

// ✔️ AVAXC Hot Wallet - Send AVAXC to non BitGo Wallet and get updated balance in both wallets (Works depend balance)
// sendFunds(wallet1,'500000000000000000', '0x0b0cdeabca083e5b4eed9e923ca7ee9693ed1034');
// getBalances(coin, wallet1);
// getBalances(coin, wallet2);

// ✔️ AVAXC Hot Wallet - Send unsupported token -> Return error.
// buildTxn(coinWalletId, tokenBadName,'1');

// x️ AVAXC Hot Wallet - Send supported token without balance -> Return error.
buildTxn('6202b05e4e3f6d00074a0f259ac86898', 'tavaxc:LINK','300000000000000000', '0x7f2d1c9a8473b28eef16d9eeb9fed37bf4fed5ed');
// submitTxn('61eed24669ddd20008f2256d2922246f', '0xf9016e028506b1a22f80830f424094e961734260c8959ae97be5f20964b01c9af194b080b901440dcd7a6c0000000000000000000000007f2d1c9a8473b28eef16d9eeb9fed37bf4fed5ed00000000000000000000000000000000000000000000000022b1c8c1227a00000000000000000000000000000b9d5d9136855f6fec3c0993fee6e9ce8a2978460000000000000000000000000000000000000000000000000000000061fd9b3c000000000000000000000000000000000000000000000000000000000000000b00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000041272e9a0e69f4a0bc86a72e6f15ce1615e1f558413f53b322008a46efc52216931aa812b367668ac84cf0054b8219ae364a7809567b59ef0b2730b5aff06ffde91c00000000000000000000000000000000000000000000000000000000000000830150f58080');
// listDataWallet(wallet1);
// listDataWallet(wallet2);


// AVAXC Hot wallet - Send supported token with enough balance.
// buildTxn(coinWalletId, tokenName,'1000000000000000000', '0x7f2d1C9A8473b28eEF16d9EeB9Fed37bF4fED5ED');
getTokenBalances(coinWalletId);
// getTokenBalances(coinWalletId);

// create receive address
// createReceiveAddress(wallet1);






















