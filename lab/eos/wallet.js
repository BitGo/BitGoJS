/* eslint-disable */
const environment = 'test';
const BitGoJS = require('../../modules/core/dist/src/index');
const bitgo = new BitGoJS.BitGo({ env: environment });
const { envs } = require('./env');

const accessToken = envs[environment].accessToken;
const coin = 'teos';
const walletLabel = 'Test ' + coin + ' V2 Wallet - ' + (new Date()).getTime();
const walletPassphrase = 'test';
// const walletPassphrase = 'secretpassphrase8u7y6t5r';
const walletId = envs[environment].walletId;
const address = envs[environment].address;
const enterprise = envs[environment].enterprise;

// Create the wallet
async function createWallet() {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const walletOptions = {
    label: walletLabel,
    passphrase: walletPassphrase,
    walletLabel,
    walletPassphrase,
  };

  const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);
  const walletInstance = wallet.wallet;
  console.log(JSON.stringify(wallet));
  console.log('-----------------------------------------');
  console.log(JSON.stringify(walletInstance));

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`${coin} Address: ${walletInstance.coinSpecific().rootAddress}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
}

async function getBalances(coinName, walletId) {
  console.log('WALLET ID ' + walletId);
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = await bitgo.coin(coinName).wallets().get({ id: walletId, allTokens: true });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Address:', walletInstance.coinSpecific().rootAddress);
  console.log('WALLET INSTANCE ' + JSON.stringify(walletInstance, null, 2))
  console.log('Balance:', walletInstance.balanceString());
  // console.log('Balance:', walletInstance.balanceString());
  // console.log('Confirmed Balance:', walletInstance.confirmedBalanceString());
  // console.log('Spendable Balance:', walletInstance.spendableBalanceString());
}

async function listWallet(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  // const response = walletInstance.createAddress();

  const walletInstance = await bitgo.coin(coin).wallets().get({id: walletId});
  const encKC = await walletInstance.getEncryptedUserKeychain();
  console.log(JSON.stringify(encKC, null, 2));
  console.log(JSON.stringify(walletInstance, null, 2));
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
    recipients: [{
      amount: baseUnitQuantity,
      address: '0x7ef926756fc32639fc82c8d1d09bf7ed3ed26063',
    }],
    walletPassphrase: walletPassphrase,
  });
  console.dir(JSON.stringify(res, null, 2));
}

async function buildTxn(walletId, baseUnitQuantity) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  const res = await walletInstance.prebuildAndSignTransaction({
    recipients: [
      {
        amount: baseUnitQuantity,
        address: '5H56KVtb3sSMxuhFsH51iFi1gei7tnBQjpVmj6hu9tK7CBDR',
      },
    ],
    sequenceId: '26',
    type: 'transfer',
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
// listWallet(walletId);
getBalances(coin, walletId);
// sendFunds(walletId, '100000000000000006')
// buildTxn(walletId, '215100000');
