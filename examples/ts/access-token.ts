/**
 * Get Access Token of a BitGo account
 */

import { BitGoAPI } from '@bitgo/sdk-api';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  env: 'test', // Change this to env: 'prod' when you are ready for production
});

async function main() {
  const auth_res = await bitgo.authenticate({
    username: process.env.TEST_EMAIL!,
    password: process.env.TEST_PASS!,
    otp: '000000',
  });

  console.log(auth_res);
}

main().catch((e) => console.log(e));
