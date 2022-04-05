/* eslint-disable */
const environment = 'test';
const BitGoJS = require('../../modules/core/dist/src/index');
const bitgo = new BitGoJS.BitGo({ env: environment });
const { envs } = require('./env');

const accessToken = envs[environment].accessToken;
const coin = 'talgo';
const walletLabel = 'Test ' + coin + ' V2 Wallet - ' + (new Date()).getTime();
const walletPassphrase = 'test';
const walletId = envs[environment].walletId;
const address = envs[environment].address;

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

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`${coin} Address: ${walletInstance.coinSpecific().rootAddress}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
}

async function getBalances(coinName, walletId) {
  console.log('WALLET ID ' + walletId);
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = await bitgo.coin(coinName).wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Address:', walletInstance.coinSpecific().rootAddress);
  console.log('Balance:', walletInstance.balanceString());
  console.log('Confirmed Balance:', walletInstance.confirmedBalanceString());
  console.log('Spendable Balance:', walletInstance.spendableBalanceString());
}

async function listWallet(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  // const response = walletInstance.createAddress();

  const walletInstance = await bitgo.coin(coin).wallets().get({id: walletId});
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

async function createAddress(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });
  const res = await walletInstance.createAddress();

  console.dir(JSON.stringify(res, null, 2));
}

async function consolidate(walletId) {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp: '000000', duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });
  // const res = await walletInstance.createAddress();
  const consolidationTxes = await walletInstance.buildAccountConsolidations();
  try {
    for (const unsignedConsolidation of consolidationTxes) {
      const res = await walletInstance.sendAccountConsolidation({ walletPassphrase, prebuildTx: unsignedConsolidation });
    }
  } catch (e) {
    console.error(e);
  }


  // console.dir(JSON.stringify(res, null, 2));
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
      address: address,
      amount: '0',
    }],
    keyregTxBase64: "gaN0eG6Mo2ZlZc0D6KJmdgGiZ2jEIEhjtRiks8hOyBDyLU8QgcsPcfBZp6wg3sYvf3DlCToiomx2zQPppnNlbGtlecQgYCkoWb2DseV6DM4eljFexpb2xJtCs7FBWfCZ1On4yoCjc25kxCBgKShZvYOx5XoMzh6WMV7GlvbEm0KzsUFZ8JnU6fjKgKdzcHJma2V5xECZhHQZUQ5sxNI12wozpHBjLAdg+pUOqDcTgkXPFk6t4f01TwH60rNRqfJjwBDXjiEROBIxft9dbCMF0fPoBaT3pHR5cGWma2V5cmVnp3ZvdGVmc3TOATkAXaZ2b3Rla2TNJxCndm90ZWtlecQgYCkoWb2DseV6DM4eljFexpb2xJtCs7FBWfCZ1On4yoCndm90ZWxzdM4BOQJR",
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
        address: 'E3WKHRXEMEQRA66V6KKX57YS56PPSKZD5SV4EMRLGY4MSOWMGFOMPS3OYU',
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
// createAddress(walletId);
// consolidate(walletId);
// listWallet(walletId);
// getBalances(coin, walletId);
sendFunds(walletId, '200')
// buildTxn(walletId, '2000');
