/* eslint-disable */
/*
----------- INSTRUCTIONS -----------
PRE-REQUIREMENTS.
1. You need to have an enterprise linked to your account : How?
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
Optional, set walletId and Address.
For test, uncomment lines at the end of the file.
 */
const environment = 'custom';
const BitGoJS = require('../modules/core/dist/src/index');
const { envs } = require('./env');
const bitgo = new BitGoJS.BitGo({ env: environment });
const accessToken = envs[environment].accessToken;
const coin = 'tdot';
const walletLabel = 'Test TDOT V2 Wallet - ' + (new Date()).getTime();
const walletPassphrase = 'passphrase123';
const coinWalletId = envs[environment].walletId;
const address = envs[environment].address;

// Create the wallet
async function createWallet() {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const walletOptions = {
    label: walletLabel,
    passphrase: walletPassphrase,
    walletLabel,
    walletPassphrase,
    m: 1,
    n: 1,
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

async function getBalances(coinName, walletId) {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = await bitgo.coin(coinName).wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Balance:', walletInstance.balanceString());
  console.log('Confirmed Balance:', walletInstance.confirmedBalanceString());
  console.log('Spendable Balance:', walletInstance.spendableBalanceString());
}

async function listWallet(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  const response = walletInstance.createAddress();

  console.log(walletInstance.toJson());
}

async function submitTxn(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    throw new Error('We did not unlock.');
  }
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });

  //eos specific
  const transaction = {
    compression: 'none',
    packed_trx: '4a0b77610100640000000000000100408c7a02ea3055000000000085269d00020130010000000000ea3055c08fca86a9a8d2d401000000a06117a33e00000000a8ed323230000000a06117a33e000000a06117a33e1bd911841700000004454f530000000046d911841700000004454f530000000000',
    signatures: [],
  };

  const recipients = [
    {
      address: 'lointeste212',
      amount: '0',
    },
  ];
  const res = await walletInstance.submitTransaction({
    halfSigned: {
      txHex: '6dfd76610100640000000000000100408c7a02ea3055000000000085269d00020130010000000000ea3055c08fca86a9a8d2d40120825019ab3ca98b00000000a8ed32323020825019ab3ca98b20825019ab3ca98b1bd911841700000004454f530000000046d911841700000004454f530000000000',
      packed_trx: '6dfd76610100640000000000000100408c7a02ea3055000000000085269d00020130010000000000ea3055c08fca86a9a8d2d40120825019ab3ca98b00000000a8ed32323020825019ab3ca98b20825019ab3ca98b1bd911841700000004454f530000000046d911841700000004454f530000000000',
      recipients,
      transaction,
    },
  });
  console.dir(res, { depth: 6 });
}

async function getTokenBalances(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  walletInstance.submitTransaction();
  const walletData = walletInstance.toJSON();
  // console.log(walletData.tokens);
  return walletData.tokens;
}

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
          address: '5CqUpSRAKiSHXeVeJgRV6dPNrSpwNf3SVbbtok8558zt3Dxj',
        },
      ],
      sequenceId: '5',
      walletPassphrase: walletPassphrase,
      type: 'transfer',
    });
    console.dir(JSON.stringify(res, null, 2));
}

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
        address: '5FhbxjiWNdzxFKgT6aGuLdjq64UNa62F6jqw4r4w3iGGHpJH',
      },
    ],
    sequenceId: '3',
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

// createWallet();
// getBalances('tdot', '61f2c050845d4e000738bef58cb1b98d');
// sendFunds('61f2c050845d4e000738bef58cb1b98d', '30000000000')

