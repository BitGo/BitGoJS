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


const environment = 'custom';
const { envs } = require('./env');
const BitGoJS = require('../modules/core/dist/src/index');
const bitgo = new BitGoJS.BitGo({ env: environment });


const accessToken = envs[environment].accessToken;
const coin = 'tavaxc';

const walletLabel = 'Test TAVAXC V2 Wallet - ' + (new Date()).getTime();
const walletPassphrase = 'walletPassphrase';

const tokenName = 'tavaxc:LINK'; //Example: 'tavax:LINK'
const tokenBadName = 'tavaxc:ETHEREUM'; // Example: 'tavaxc:BENQUI'

const enterprise = ''; //Example: 61e16f796ff9920007109d896307a8xx

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
  const response = walletInstance.createAddress();
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
async function submitTxn(walletId) {
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
      txHex: '0xf9016f81918506b1a22f80830f424094a5f6b2727e7ea29cb0029fc80b35c19ccacd44a680b901440dcd7a6c00000000000000000000000038d905bd70f77de8ca487a97fd9f9e9e804ed71b00000000000000000000000000000000000000000000000029a2241af62bffff0000000000000000000000000b9d5d9136855f6fec3c0993fee6e9ce8a2978460000000000000000000000000000000000000000000000000000000061fa8aa4000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000041e97831fdf9b4a249cff11e3869d0caf338e61145047938cb7905cda0524a04b8769983e0385de35c8cf31c331ddd578e14e91128149d45460774e7cb3ed42fdb1b00000000000000000000000000000000000000000000000000000000000000830150f58080',
      recipients,
    },
  });
  console.dir(res, { depth: 6 });
}

//
async function sendFunds(walletId, baseUnitQuantity) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  const res = await walletInstance.sendMany({
    recipients: [
      {
        amount: baseUnitQuantity,
        address: '0x924280d32827066eb2531d2644378d9da5b6b521',
      },
    ],
    sequenceId: '8',
    walletPassphrase: walletPassphrase,
  });
  console.dir(JSON.stringify(res, null, 2));
}

// Build transaction
async function buildTxn(walletId, tokenName, baseUnitQuantity) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const walletInstance = await bitgo.coin(tokenName).wallets().get({ id: walletId, allTokens: true });
  const res = await walletInstance.prebuildAndSignTransaction({
    recipients: [
      {
        amount: baseUnitQuantity,
        address: '0x38d905bd70f77de8ca487a97fd9f9e9e804ed71b',
      },
    ],
    sequenceId: '1',
    walletPassphrase: walletPassphrase,
  });
  console.log(res);
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




// ✔️ AVAXC Hot wallet - Create wallet with create and store my own key.
// createWallet(enterprise);
// ✔️ AVAXC Hot Wallet - Get all token balance for a wallet.
//getBalances(coin, coinWalletId);
//listDataWallet(coinWalletId);
//getTokenBalance(coinWalletId);
// ✔️ AVAXC Hot Wallet - Send unsupported token -> Return error.
// buildTxn(coinWalletId, tokenBadName,'1');
// x️ AVAXC Hot Wallet - Send supported token withouot balance -> Return error.
// buildTxn(coinWalletId, tokenName,'10');
// buildTxn(coinWalletId, tokenName,'1');
// ✔️ AVAXC Hot Wallet - Send AVAXC to non BitGo Wallet and get updated balance in both wallets (Works depend balance)
//sendFunds(coinWalletId,'1000000000000000000');

// AVAXC Hot wallet - Send supported token with enough balance.
//buildTxn(coinWalletId, tokenName,'2999999999999999999');
//submitTxn(coinWalletId);



//getTokenBalances(coinWalletId);























