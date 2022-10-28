/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'custom', customRootURI: 'https://testnet-03-app.bitgo-dev.com' });
// TODO: set your access token here
const accessToken = 'v2xf9915ca345261d4ecbbe4bda4409df578126e59e8805be2342f072d85d4fa227';
// TODO: set your passphrase for your new wallet here
const passphrase = 'Ghghjkg!455544llll';
// TODO: set a label for your new wallet here
const label = 'Example Test Wallet 10-26';
const coinP = 'tavaxp';
const coinC = 'tavaxc';

const baseCoinP = bitgo.coin(coinP);
const baseCoinC = bitgo.coin(coinC);

const isCreatePWallet = false;
const isCreateCWallet = false;
const isP2CExportImport = true;
const isC2PExportImpot = false;
let wallet, walletOptions;
const enterprise = '6359c8df9ddb680007ab887180fa7d89';

const pMultisigReceiveAddresses = [
  'P-fuji1sdamfpdmd0cgp6tprq7a4hyrcumeyzkl4k9h22',
  'P-fuji1t5w7qkdtcfq32c6mt6us0txr3uv92ghtfw3q77',
  'P-fuji1z7dy2ytwx00hv9ujh5htu3lp6wm4cmcxx9c3pu',
];
const pMultiSig = pMultisigReceiveAddresses.join('~');

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  if (isCreatePWallet) {
    walletOptions = {
      label,
      passphrase,
      enterprise,
    };

    wallet = await bitgo.coin(coinP).wallets().generateWallet(walletOptions);
  }
  const PwalletId = isCreatePWallet ? wallet.wallet.id() : '6359c9daf7e8350007e0ce938636d779';


  if (isCreateCWallet) {
    walletOptions = {
      label,
      passphrase,
      enterprise,
    };
    wallet = await bitgo.coin(coinC).wallets().generateWallet(walletOptions);
  }
  const CWalletId = isCreateCWallet ? wallet.wallet.id() : '6359cd6df7e8350007e0d3aeb6490f3f';

  const PWallet = await baseCoinP.wallets().get({ id: PwalletId });
  const CWallet = await baseCoinC.wallets().get({ id: CWalletId });

  await bitgo.unlock({ otp: '000000', duration: 3600 });
  console.log('P Wallet ID:', PWallet.id());
  console.log('C Wallet ID:', CWallet.id());

  console.log('Current Receive Address:', PWallet.receiveAddress());

  if (isP2CExportImport) {
    const p2cExport = await PWallet.sendMany({
      recipients: [
        {
          amount: '100000000',
          address: '0x154fd6efcfdcbc37168dd68fe1ab400efb74a5e4',
        },
      ],
      type: 'Export',
      walletPassphrase: passphrase,
    });

    console.log('New Transaction:', JSON.stringify(p2cExport, null, 4));
    console.log('New Transaction txid:', p2cExport.txid);

    await new Promise(resolve => setTimeout(resolve, 5000));


    const p2cImport = await PWallet.sendMany({
      recipients: [
        {
          amount: '100000000',
          address: '0x154fd6efcfdcbc37168dd68fe1ab400efb74a5e4',
        },
      ],
      type: 'ImportToC',
      walletPassphrase: passphrase,
    });

    console.log('New Transaction:', JSON.stringify(p2cImport, null, 4));
    console.log('New Transaction txid:', p2cImport.txid);

  }

  if (isC2PExportImpot) {
    const c2pExportHop = await CWallet.sendMany({
      recipients: [
        {
          amount: '900000000000000000',
          address: pMultiSig,
        },
      ],
      type: 'Export',
      hop: true,
      walletPassphrase: passphrase,
    });
    console.log('New Transaction:', JSON.stringify(c2pExportHop, null, 4));

    await new Promise(resolve => setTimeout(resolve, 5000));

    const c2pImport = await PWallet.sendMany({
      walletPassphrase: passphrase,
      recipients: [
        {
          amount: '1',
          address: pMultiSig,
        },
      ],
      sourceChain: 'C',
      type: 'Import',
    });
    console.log('New Transaction:', JSON.stringify(c2pImport, null, 4));
  }


  // const explanation = await baseCoinP.explainTransaction({ txHex: transaction.tx });


  // console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
}

main().catch((e) => console.error(e));
