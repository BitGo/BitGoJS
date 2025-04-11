/**
 * Approve an ERC20 token for use with a batcher contract at BitGo.
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Topeth } from '@bitgo/sdk-coin-opeth';
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'topeth';
bitgo.register(coin, Topeth.createInstance);

const walletId = process.env.TESTNET_ETH_WALLET_ID;
const walletPassphrase = process.env.TESTNET_ETH_WALLET_PASSPHRASE;
const tokenName = 'topeth:terc18dp'; // Replace with the token you want to approve

async function main() {
  if (!walletId) {
    throw new Error('Please set TESTNET_ETH_WALLET_ID environment variable');
  }
  if (!walletPassphrase) {
    throw new Error('Please set TESTNET_ETH_WALLET_PASSPHRASE environment variable');
  }

  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());

  console.log(`Approving token ${tokenName} for use with batcher contract...`);

  try {
    const approvalTransaction = await walletInstance.approveErc20Token(walletPassphrase, tokenName);

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
