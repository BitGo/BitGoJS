import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'custom', customRootURI: 'https://testnet-03-app.bitgo-dev.com' });
// TODO: set your access token here
const accessToken = 'v2x767398174e675ed05a243696942e467b5b3385ecbf0d2324fc23eef61fdc5958';
// TODO: set your passphrase for your new wallet here
const walletPassphrase = 'Ghghjkg!455544llll';
const coin = 'tavaxc';
const walletId = '634d7226d62c5300077f5e6ff3c018d4';

async function sendTxWithHop() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  await bitgo.unlock({ otp: '000000', duration: 3600 });
  
  const res = await wallet.sendMany({
    recipients: [{
      amount: '1000000000',
      address: 'P-fuji1g5hunevtxw4l53qe2lp74xsqmeztjlqak2mzwk~P-fuji1m09fz28vc3jmnggllxfmd2te2t86annng744k0~P-fuji1nacu3atspp537k3tge80eax59kmztyga97uvux',
    }],
    walletPassphrase: walletPassphrase,
    hop: true,
    type: 'Export',
  });

  console.log(res);
}

sendTxWithHop().catch((e) => console.error(e));
