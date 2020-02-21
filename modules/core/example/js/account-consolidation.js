/**
 * Account consolidations are run for Algorand currently, where you need to sweep money
 * off receive addresses into the main wallet. This is the only way to get money off
 * receive addresses.
 */
const BitGoJS = require('bitgo');
const Promise = require('bluebird');
const bitgo = new BitGoJS.BitGo({ env: 'test' });

const coin = 'talgo';
// this can be found on test.bitgo.com in the URL after clicking on a wallet
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
// YYYYY would be your wallet id in this case minus the last 8 characters
const walletId = 'your wallet id';

// this is your wallet passphrase, which could be different than your login credentials
const walletPassphrase = 'set your wallet passphrase here';
const otp = '000000';

const accessToken = null; // TODO: you'll have to set this here

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id: walletId });

  console.log('Wallet ID:', wallet.id());

  // this is your wallet's address
  console.log('Root Address:', wallet.coinSpecific().rootAddress);

  // your balance or confirmed balance will be the amount across all addresses and your wallet
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());

  // your spendable balance will be the balance on the wallet address and should differ from your confirmed balance
  console.log('Spendable Balance:', wallet.spendableBalanceString());

  // we have to unlock this session since we're sending funds
  const unlock = yield bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }

  // this will take all money off receive addresses in the wallet
  // you can also specify which receive address by passing fromAddresses here:
  // e.g. { walletPassphrase, fromAddresses: ['onchainReceiveAddress'] }
  try {
    const sendConsolidations = yield wallet.sendAccountConsolidations({ walletPassphrase });
    console.log(sendConsolidations);
  } catch (e) {
    console.error(e);
  }
});
