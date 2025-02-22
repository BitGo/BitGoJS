import { BitGoAPI } from '@bitgo/sdk-api';
import {Apt} from "@bitgo/sdk-coin-apt";
require('dotenv').config({ path: '../../.env' });

const ACCESS_TOKEN = 'v2x14105d160d00c498c44d7f9de6a85ae6c2737784431c9889afbc51b0e277c212';

const bitgo = new BitGoAPI({
  accessToken: ACCESS_TOKEN,
  env: 'prod',
});

const coin = 'apt';
bitgo.register(coin, Apt.createInstance);

async function main() {
  const keys = [
    "67a534f4031246be079182fd6b29f539",
    "67a534f4031246be079183023d29a5ab",
    "67a534f4031246be079182f7613b9a93"
  ]
  for (const id of keys) {
    const key = await bitgo.coin(coin).keychains().get({ id });
    console.log(key);
  }
}

main().catch((e) => console.error(e));
