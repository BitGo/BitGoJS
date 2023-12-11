import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tsol';
const basecoin = bitgo.coin(coin);

// TODO: set your access token here
const accessToken = 'v2xd36e80ecc86da913e354bcf773742fec2c7c7e74249ad4c06ca1b6e011f4c5f9';

// set your wallet from the YYYYY parameter here in the URL on app.bitgo-test.com
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = '6503351d378e020008b07446c6635dad';

async function getWallet() {
  bitgo.authenticateWithAccessToken({ accessToken });

  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const wallet = await basecoin.wallets().get({ id: walletId });
  const addresses: Promise<any>[] = [];
  for (let i = 0; i < 100; i++) {
    addresses.push(
      wallet
        .createAddress()
        .then()
        .catch((e) => console.error(e))

      // wallet.createAddress()
    );

    console.log('Created ', +i + ' addresses');
  }
}

getWallet().catch((e) => console.error(e));
