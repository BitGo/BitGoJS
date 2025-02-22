/**
 * Get Access Token of a BitGo account
 */

import { BitGoAPI } from '@bitgo/sdk-api';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  env: 'prod', // Change this to env: 'production' when you are ready for production
});

async function main() {
  const auth_res = await bitgo.authenticate({
    username: process.env.PROD_EMAIL!,
    password: process.env.PROD_PASS!,
    otp: '942384',
  });

  console.log(auth_res);
}

main().catch((e) => console.log(e));
