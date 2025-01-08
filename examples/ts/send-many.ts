import { BitGoAPI } from '@bitgo/sdk-api';
import { Tstx } from "@bitgo/sdk-coin-stx";
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tstx';
bitgo.register(coin, Tstx.createInstance);

const walletId = '65cda967d2373402ca493982195521ed';

async function main() {
  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  let params = {
    recipients: [
      {
        amount: 1e6,
        address: 'SN3DYJCNVJCHBP70231E9J7Y6WBW9N3YN02T36KCQ',
      },
      {
        amount: 2 * 1e6,
        address: 'SN646H61HSMPVPDSPSA3ZYVSGBG22JACKCPD9VX9',
      },
    ],
    walletPassphrase: '#Bondiola1234',
    type: 'transfer',
  };
  wallet.sendMany(params).then(function (transaction) {
    // print transaction details
    console.dir(transaction);
  });
}

main().catch((e) => console.error(e));
