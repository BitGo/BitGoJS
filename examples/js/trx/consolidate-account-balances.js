/**
 * Tron wallet can't send funds from their receive addresses.
 * Account balance consolidation is used to sweep funds from the
 * receive addresses into the wallet's base address for sending.
 * @see {@link https://app.bitgo.com/docs/#operation/v2.wallet.consolidateaccount.build}
 */
const BitGoJS = require('bitgo');

// TODO: change to 'production' for mainnet
const bitgo = new BitGoJS.BitGo({ env: 'test' });

// TODO: change to 'trx' for mainnet
const coin = 'ttrx';

// TODO: set your wallet id
const walletId = '';

// TODO: set your wallet passphrase
const walletPassphrase = '';

// TODO: set OTP code
const otp = '000000';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  // Wallet's base address - only address in the wallet that can send funds to other accounts
  console.log('Root Address:', wallet.coinSpecific().rootAddress);
  // Confirmed balance - sum of the balance of all the wallet's addresses
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());
  // Spendable balance - balance of the base address
  console.log('Spendable Balance:', wallet.spendableBalanceString());

  // unlock the session for sending funds
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('error unlocking session');
  }

  const consolidationTxes = await wallet.buildAccountConsolidations();

  try {
    for (const unsignedConsolidation of consolidationTxes) {
      const res = await wallet.sendAccountConsolidation({ walletPassphrase, prebuildTx: unsignedConsolidation });
      console.dir(res, { depth: 6 });
    }
  } catch (e) {
    console.error(e);
  }
}

main().catch((e) => console.error(e));
