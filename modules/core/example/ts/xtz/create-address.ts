import { BitGo } from 'bitgo';

// TODO: change to 'production' for mainnet
const env = 'test';
const bitgo = new BitGo({ env });

// TODO: change to 'xtz' for mainnet
const coin = 'txtz';

// TODO: set your wallet id
const walletId = '';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  const address = await wallet.createAddress({ label: 'My address' });
  console.log(address);
}

main().catch((e) => console.error(e));
