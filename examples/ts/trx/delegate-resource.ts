/**
 * Build and sign a TRX DelegateResource transaction via the BitGo platform.
 *
 * DelegateResource allows a TRX holder who has frozen TRX (via FreezeBalanceV2)
 * to delegate the resulting BANDWIDTH or ENERGY resources to another address,
 * without transferring TRX itself.
 *
 * Prerequisites:
 *   - Valid BitGo access token
 *   - TRX wallet with frozen balance (via FreezeBalanceV2)
 *   - Wallet passphrase for signing
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, WalletCoinSpecific } from 'bitgo';

// TODO: change to 'production' for mainnet
const env = 'test';
const bitgo = new BitGo({ env });

// TODO: change to 'trx' for mainnet
const coin = 'ttrx';

// TODO: set your wallet id
const walletId = '';

// TODO: set your wallet passphrase
const walletPassphrase = '';

// TODO: set OTP code
const otp = '000000';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

// TODO: set the receiver address (the address that will use the delegated resources)
const receiverAddress = '';

// TODO: set the amount of frozen TRX to delegate, in SUN (1 TRX = 1,000,000 SUN)
const trxAmountSun = '1000000';

// TODO: set the resource type to delegate: 'ENERGY' or 'BANDWIDTH'
const resource = 'ENERGY';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  const coinSpecific = wallet.coinSpecific() as WalletCoinSpecific;
  const ownerAddress = coinSpecific.rootAddress;

  console.log('Wallet ID:', wallet.id());
  console.log('Owner Address:', ownerAddress);

  // Build the unsigned DelegateResource transaction
  // The platform automatically fetches current block info and creates the transaction
  const prebuild = await wallet.prebuildTransaction({
    type: 'delegateResource',
    stakingParams: {
      owner_address: ownerAddress,
      receiver_address: receiverAddress,
      trx_amount: trxAmountSun,
      resource,
    },
    recipients: [
      {
        address: ownerAddress,
        amount: trxAmountSun,
      },
    ],
  });

  console.log('Prebuild TX:', JSON.stringify(prebuild, null, 2));

  // Unlock the session for signing
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('error unlocking session');
  }

  // Sign and send the transaction
  // The SDK handles user half-sign, platform co-signing, and broadcasting
  const result = await wallet.sendTransaction({
    prebuildTx: prebuild,
    walletPassphrase,
  });

  console.log('Transaction sent successfully!');
  console.log('TX ID:', result.txid);
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch((e) => console.error(e));
