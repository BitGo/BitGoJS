import { BitGoAPI } from '@bitgo/sdk-api';
import {Btc} from "@bitgo/sdk-coin-btc";
require('dotenv').config({ path: '../../.env' });

const ACCESS_TOKEN = '<YOUR_ACCESS_TOKEN>';

const bitgo = new BitGoAPI({
  accessToken: ACCESS_TOKEN,
  env: 'prod',
});

const coin = 'btc';
bitgo.register(coin, Btc.createInstance);

async function main() {
  const keys= [
    "65f09e34244e2f7ac804251494e530e1",
    "65f09e3572c880cb959b423f1d987cbf",
    "65f09e37e19cf9bba3339920aa83273f"
  ]
  for (const id of keys) {
    const key = await bitgo.coin(coin).keychains().get({ id });
    console.log(key);
  }
}

main().catch((e) => console.error(e));
