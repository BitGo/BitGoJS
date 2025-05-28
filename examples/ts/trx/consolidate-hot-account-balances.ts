/**
 * Tron wallets can't send funds from their receive addresses.
 * Account balance consolidation is used to sweep funds from the
 * receive addresses into the wallet's base address for sending.
 * @see {@link https://app.bitgo.com/docs/#operation/v2.wallet.consolidateaccount.build}
 */
import { BitGo, WalletCoinSpecific } from 'bitgo';

// TODO: change to 'production' for mainnet
const env = 'staging';
const bitgo = new BitGo({ env });

// TODO: change to 'trx' for mainnet
const coin = 'ttrx';

// TODO: set your wallet id
const walletId = '68355ecd7effc38ded68e8e7b4647c23';

// TODO: set your wallet passphrase
const walletPassphrase = 'RF!K1suz6h45Rkia(cp0';

// TODO: set OTP code
const otp = '000000';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = 'v2x0d947c90444c311cf81c7692b88ac6767c349e44f47b6e854f7a8d9594487b43';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  const coinSpecific = wallet.coinSpecific() as WalletCoinSpecific;

  // Wallet's root address - only address in the wallet that can send funds to other accounts
  console.log('Root Address:', coinSpecific.rootAddress);
  // Confirmed balance - sum of the balance of all the wallet's addresses
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());
  // Spendable balance - balance of the base address
  console.log('Spendable Balance:', wallet.spendableBalanceString());

  const [consolidationTxes, consolidationTxes2] = await Promise.all([
    wallet.buildAccountConsolidations(),
    wallet.buildAccountConsolidations()
  ]);
  console.dir(consolidationTxes, { depth: 6 });
  console.dir(consolidationTxes2, { depth: 6 });

  // const unlock = await bitgo.unlock({ otp, duration: 3600 });
  // if (!unlock) {
  //   throw new Error('error unlocking session');
  // }
  try {
    for (const unsignedConsolidation of consolidationTxes) {
      const res =  await wallet.sendAccountConsolidation({ walletPassphrase, prebuildTx: unsignedConsolidation });
      // const res1 =  wallet.sendAccountConsolidation({ walletPassphrase, prebuildTx: unsignedConsolidation });
      console.dir(res, { depth: 6 });
    }
  } catch (e) {
    console.error(e);
  }
}

main().catch((e) => console.error(e));
