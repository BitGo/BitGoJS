import { BitGo, Wallet } from 'bitgo';

// change this to env: 'production' when you are ready for production
const bitgo = new BitGo({ env: 'test' });

// this can be retrieved by logging into app.bitgo-test.com (app.bitgo.com for production)
// and going to: User > User Settings > Access Tokens > (+ icon)
// the token will need Spender permission
const accessToken = '';

// change this to 'apt' when you are ready for production
const coin = 'tapt';
const walletId = '';
const walletPassphrase = '';

// this will need to be a real OTP code on production
const otp = '000000';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet: Wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  if (!wallet) {
    throw new Error('Failed to retrieve wallet');
  }

  // we have to unlock this session since we're sending funds
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('Unlock failed');
  }

  const sendConsolidations = await wallet.sendAccountConsolidations({
    walletPassphrase,
    consolidateAddresses: [''],
    nftCollectionId: '',
    nftId: '',
  });
  console.dir(sendConsolidations, { depth: 6 });
}

main().catch((e) => console.error(e));
