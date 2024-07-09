/**
 * Send non-erc20 tokens for coins like Solana or Tron, using the wallet.sendMany() method
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tsol } from '@bitgo/sdk-coin-sol';

require('dotenv').config({ path: '../../../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tsol'; // Your coin here
bitgo.register(coin, Tsol.createInstance);

// TODO: set your walletId here
const walletId = 'your_wallet_id_here';

// TODO: set your wallet passphrase here
const walletPassphrase = 'your_wallet_passphrase_here';

async function main() {
  try {
    const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

    const newReceiveAddress1 = await walletInstance.createAddress();
    const newReceiveAddress2 = await walletInstance.createAddress();

    const transaction = await walletInstance.sendMany({
      //  TODO: Make sure to add the tokenName param in recipients in case of tokens and also the amount for each
      recipients: [
        {
          amount: 'amount_for_address1',
          address: newReceiveAddress1.address,
          tokenName: 'tsol:usdc',
        },
        {
          amount: 'amount_for_address2',
          address: newReceiveAddress2.address,
          tokenName: 'tsol:usdc',
        },
      ],
      walletPassphrase: walletPassphrase,
      type: 'transfer',
    });

    const explanation = await bitgo.coin(coin).explainTransaction({
      txBase64: transaction.tx,
      feeInfo: { fee: transaction.transfer.feeString },
    });

    console.log('Wallet ID:', walletInstance.id());
    console.log('Current Receive Address:', walletInstance.receiveAddress());
    console.log('New Transaction:', JSON.stringify(transaction, null, 4));
    console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
