// create addresses
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tsol';
const basecoin = bitgo.coin(coin);

// TODO: set your access token here
const accessToken = 'v2xb04d1c16326815f94b0dbcf1c990d34fd669a082f8195813f13ed08338fd71dd';

// set your wallet from the YYYYY parameter here in the URL on app.bitgo-test.com
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = '65a8c77824fca87e73e5c615e2dc26ae';
const walletPassphrase = 'QczkC@AOmPC0vaR0p^8z';

async function sendWalletTx() {
    bitgo.authenticateWithAccessToken({ accessToken });
    // await bitgo.unlock({ otp: '000000', duration: 3600 });
    const wallet = await basecoin.wallets().get({ id: walletId });
    const transaction = await wallet.sendMany({
        recipients: [
          {
            amount: '100000000',
            address: 'JA9vxweVZMbdVJbHr5EpLgQ3U9aCSux77vbXLghynLE5',
          },
          {
            amount: '100000000',
            address: '4ox1eVAWPQoXKydiMEQKG43e6kvyvmmZim6oev7bcitn',
          },
        ],
        walletPassphrase: walletPassphrase,
      });

    const explanation = await bitgo.coin(coin).explainTransaction({ txHex: transaction.tx });
    console.log('New Transaction:', JSON.stringify(transaction, null, 4));
    console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
  }

sendWalletTx().catch((e) => console.error(e));
