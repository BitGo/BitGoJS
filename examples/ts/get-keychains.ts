import { BitGoAPI } from '@bitgo/sdk-api';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'prod',
});

async function main() {
  const keys = [
    '634ee23072f6f100078232c8ca3c248d',
    '634ee230aef5e00007843c2053f2ec3d',
    '634ee22fd8f2360007113883647a5f4e',
  ];
  for (const id of keys) {
    const key = await bitgo.coin(coin).keychains().get({ id });
    console.log(key);
  }
}

main().catch((e) => console.error(e));
