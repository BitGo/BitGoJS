/**
 * Build and sign a TRX UndelegateResource transaction via the BitGo platform.
 *
 * DelegateResource allows a TRX holder who has frozen TRX (via FreezeBalanceV2)
 * to reclaim the BANDWIDTH or ENERGY resource from another address.
 *
 * Prerequisites:
 *   - Valid BitGo access token
 *   - TRX wallet with frozen balance (via FreezeBalanceV2)
 *   - Wallet passphrase for signing
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { WalletCoinSpecific } from 'bitgo';
import {BitGoAPI} from "@bitgo/sdk-api";
import {Ttrx} from "@bitgo/sdk-coin-trx";
require('dotenv').config({ path: '../../../.env' });

// TODO: change to 'production' for mainnet
const bitgo = new BitGoAPI({
    accessToken: process.env.TESTNET_ACCESS_TOKEN,
    env: 'test',
});

const coin = 'ttrx';
bitgo.register(coin, Ttrx.createInstance);

const walletId = '';
const walletPassphrase = '';
const otp = '000000';

// TODO: set the receiver address (the address from which resource will be reclaimed)
const receiverAddress = '';

// TODO: set the amount of frozen TRX to undelegate, in SUN (1 TRX = 1,000,000 SUN)
const amountSun = '1000000';

// TODO: set the resource type to undelegate: 'energy' or 'bandwidth'
const resource = 'bandwidth';

async function main() {

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  console.log('Wallet ID:', wallet.id());

  // Unlock the session for signing
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('error unlocking session');
  }

  // Build, sign, and send the transaction in one step
  // The SDK handles prebuild, user half-sign, platform co-signing, and broadcasting
  const result = await wallet.sendMany({
    type: 'undelegateResource',
    stakingParams: {
      receiver_address: receiverAddress,
      amount: amountSun,
      resource,
    },
    recipients: [
      {
        address: receiverAddress,
        amount: '0',
      },
    ],
    walletPassphrase,
  });

  console.log('Transaction sent successfully!');
  console.log('TX ID:', result.txid);
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch((e) => console.error(e));
