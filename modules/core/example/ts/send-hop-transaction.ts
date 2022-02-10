import { BitGo } from 'bitgo';
const bitgo = new BitGo({
  env: 'test',
});
const coin = '';
const accessToken = '';
const walletId = '';
const walletPassphrase = '';

async function sendTxWithHop() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });

  const res = await wallet.sendMany({
    recipients: [{
      amount: '',
      address: '',
    }],
    walletPassphrase: walletPassphrase,
    hop: true,
  });

  console.log(res);
}

sendTxWithHop().catch((e) => console.error(e));
