/**
 * Account consolidations are run for Algorand currently, where you need to sweep money
 * off receive addresses into the main wallet. This is the only way to get money off
 * receive addresses.
 *
 * USAGE: This is used for where some intermediate verification/validation of the
 * consolidation tx needs to occur.
 */
import { BitGo, Wallet } from 'bitgo';

// change this to env: 'production' when you are ready for production
const bitgo = new BitGo({ env: 'test' });

// this can be retrieved by logging into app.bitgo-test.com (app.bitgo.com for production)
// and going to: User > User Settings > Access Tokens > (+ icon)
// the token will need Spender permission for SOL
const accessToken = ''; // TODO: you'll have to set this here

// change this to 'sol' when you are ready for production
const coin = 'tsol';

// this can be found on test.bitgo.com in the URL after clicking on a wallet
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = '';

// this is your wallet passphrase, which could be different than your login credentials
const walletPassphrase = '';

// this will need to be a real OTP code on production
const otp = '000000';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet: Wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log('Wallet ID:', wallet.id());

  if (!wallet || !wallet.coinSpecific()) {
    throw new Error('Failed to retrieve wallet');
  }

  const coinSpecific = wallet.coinSpecific();
  if (!coinSpecific) {
    throw new Error('Coin specific area not found - aborting.');
  }

  // this is your wallet's root address - this is where spendable funds come from
  const rootAddress = coinSpecific.rootAddress;
  console.log('Root Address:', rootAddress);

  // your balance or confirmed balance will be sum of the amounts
  // across all addresses and your wallet's root address
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());

  // your spendable balance will be the balance on the wallet root address
  // and should differ from your confirmed balance
  console.log('Spendable Balance:', wallet.spendableBalanceString());

  // limit of addresses per building consolidation
  const limit = 200;
  // set a prevId to start from specific page. Useful if the limit is reached
  let prevId = undefined;
  // expected fee for a native transfer
  const fee = 5000;

  const selectedAddresses: string[] = [];

  process.stdout.write('Searching addresses');
  do {
    process.stdout.write('.');
    const addresses = await wallet.addresses({ includeBalances: true, prevId });
    prevId = addresses.nextBatchPrevId;
    addresses.addresses
      .filter((address) => Number(address.balance.spendableBalanceString) > fee)
      .filter((address) => address.coinSpecific.rootAddress === rootAddress)
      .map((address) => address.address)
      .filter((address) => address !== rootAddress)
      .forEach((address) => selectedAddresses.push(address));
  } while (prevId !== undefined && selectedAddresses.length < limit);
  process.stdout.write('\n');
  console.log(selectedAddresses.length + ' addresses selected for build consolidation tx');


  // example of passing specific addresses
  const buildParams = { consolidateAddresses: selectedAddresses };

  // these are the transactions that will get built and signed locally
  // - there is an optional consolidateAddresses parameter here - if you want to pass specific
  // addresses, pass buildParams above instead of ()
  const consolidationTxes = await wallet.buildAccountConsolidations(buildParams);

  // this step might be used for some intermediate verification of the consolidation tx
  console.dir(consolidationTxes, { depth: 6 });


  // we have to unlock this session since we're sending funds
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('We did not unlock.');
  }

  console.log('Send consolidation tx');
  const sendConsolidations = await wallet.sendAccountConsolidations({ ...buildParams, walletPassphrase });
  console.dir(sendConsolidations, { depth: 6 });

  // if prevId is undefined, the end of addresses pages is reached
  if (prevId !== undefined) {
    console.log(
      'Some addresses remain for consolidate, to run this script with following addresses set prevId=',
      prevId
    );
  }
}

main().catch((e) => console.error(e));
