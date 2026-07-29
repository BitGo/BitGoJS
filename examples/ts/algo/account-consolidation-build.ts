/**
 * Account consolidations are run for Algorand currently, where you need to sweep money
 * off receive addresses into the main wallet. This is the only way to get money off
 * receive addresses.
 *
 * USAGE: This is used for where some intermediate verification/validation of the
 * consolidation tx needs to occur.
 */
import { BitGo, Wallet } from 'bitgo';
import { WalletCoinSpecific } from '../../../src/v2/wallet';

// change this to env: 'production' when you are ready for production
const bitgo = new BitGo({ env: 'test' });

// this can be retrieved by logging into app.bitgo-test.com (app.bitgo.com for production)
// and going to: User > User Settings > Access Tokens > (+ icon)
// the token will need Spender permission for ALGO
const accessToken = ''; // TODO: you'll have to set this here

// change this to 'algo' when you are ready for production
const coin = 'talgo';

// this can be found on test.bitgo.com in the URL after clicking on a wallet
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = 'your wallet id';

// this is your wallet passphrase, which could be different than your login credentials
const walletPassphrase = 'set your wallet passphrase here';

// this will need to be a real OTP code on production
const otp = '000000';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet: Wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log('Wallet ID:', wallet.id());

  if (!wallet || !wallet.coinSpecific()) {
    throw new Error('Failed to retrieve wallet');
  }

  const coinSpecific = wallet.coinSpecific() as WalletCoinSpecific;
  if (!coinSpecific) {
    throw new Error('Coin specific area not found - aborting.');
  }

  // this is your wallet's root address - this is where spendable funds come from
  console.log('Root Address:', coinSpecific.rootAddress);

  // your balance or confirmed balance will be sum of the amounts
  // across all addresses and your wallet's root address
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());

  // your spendable balance will be the balance on the wallet root address
  // and should differ from your confirmed balance
  console.log('Spendable Balance:', wallet.spendableBalanceString());

  // we have to unlock this session since we're sending funds
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('We did not unlock.');
  }

  // example of passing specific addresses
  // const buildParams = { consolidateAddresses: ['X6VKIZG5RLZNCIMYXQAHM7G7DM5P65UQJRI7M74ZWYIPSY4CXFNTK3DCIE'] };

  // these are the transactions that will get built and signed locally
  // - there is an optional consolidateAddresses parameter here - if you want to pass specific
  // addresses, pass buildParams above instead of ()
  const consolidationTxes = await wallet.buildAccountConsolidations();

  // this step might be used for some intermediate verification of the consolidation tx
  console.dir(consolidationTxes, { depth: 6 });

  // this is one example of how you might send only the first consolidation from this group
  const unsignedConsolidation = consolidationTxes[0];
  const sendConsolidations = await wallet.sendAccountConsolidation({
    walletPassphrase,
    prebuildTx: unsignedConsolidation,
  });
  console.dir(sendConsolidations, { depth: 6 });
}

main().catch((e) => console.error(e));
