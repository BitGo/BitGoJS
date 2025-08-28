/**
 * Approve an ERC20 token for use with a batcher contract at BitGo.
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbsc } from '@bitgo/sdk-coin-bsc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'staging',
});

const coin = 'tbsc';
bitgo.register(coin, Tbsc.createInstance);

const walletId = process.env.TESTNET_BSC_WALLET_ID;
const walletPassphrase = process.env.TESTNET_BSC_WALLET_PASSPHRASE;
const tokenName = 'tbsc:busd'; // Replace with the token you want to approve

async function main() {
  if (!walletId) {
    throw new Error('Please set TESTNET_BSC_WALLET_ID environment variable');
  }
  if (!walletPassphrase) {
    throw new Error('Please set TESTNET_BSC_WALLET_PASSPHRASE environment variable');
  }

  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());

  console.log(`Approving token ${tokenName} for use with batcher contract...`);

  try {
    const approvalTransaction = await walletInstance.sendMany({ type: 'tokenApproval', walletPassphrase, tokenName });

    console.log('Token Approval Transaction:', JSON.stringify(approvalTransaction, null, 4));
    console.log('Transaction ID:', approvalTransaction.txid);
    console.log('Status:', approvalTransaction.status);
  } catch (e) {
    console.error('Error approving token:', e.message);
    if (e.stack) {
      console.error(e.stack);
    }
  }
}

main().catch((e) => console.error(e));
