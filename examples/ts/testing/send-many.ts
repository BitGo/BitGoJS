import { BitGoAPI } from '@bitgo/sdk-api';
import { Talgo } from '@bitgo/sdk-coin-algo';
// import { TNear } from '@bitgo-beta/sdk-coin-near';

//import dotenv from 'dotenv';

//dotenv.config({ path: './.env' });

const bitgo = new BitGoAPI({
  accessToken: 'v2x056d3200dd4e7bfc6bb83f5bb1a8282083dc0467c5357ae0f64ae4617df21322',
  env: 'staging',
});

const coin = 'talgo';
bitgo.register(coin, Talgo.createInstance);

async function auth() {
  await bitgo.authenticate({
    username: '',
    password: '',
    otp: process.env.OTP,
  });
  await bitgo.lock();
  await bitgo.unlock({ otp: '000000', duration: 3600 });
}

// Set the wallet with this id
// const id = '668ba4a73042174b65afeed0b82637ae'; // QA APAC Manual test Ent
const walletId = '66cc5a7419224a78486211d7851452e7';
const walletPassphrase = '#Bondiola1234';

// const dotP01Eth = 0.001 * 1e18; // Send amount
const amount1 = '10000000000000000'; // 0.01 1000000000
const amount2 = '20000000000000000'; // 0.01
const address1 = '0x549f618509afa74ec645a7e031e29241bfcba7de';
const address2 = '0xb1b7e7cc1ecafbfd0771a5eb5454ab5b0356980d';

async function sendBatchTransfers() {
  await auth();
  const basecoin = await bitgo.coin(coin);
  const walletInstance = await basecoin.wallets().get({ id: walletId });

  const result = await walletInstance.sendMany({
    recipients: [
      {
        amount: amount1,
        address: address1,
      },
      {
        amount: amount2,
        address: address2,
      },
    ],
    walletPassphrase,
    type: 'transfer', //comment line for XRP
    isTss: true,
  });
  console.log(`Batch Transfer for coin: ${coin} completed. TxId: ${result.txid}`);
  console.log('Batch transfers completed.');
  console.timeEnd('Batch sign time');
}

sendBatchTransfers();
