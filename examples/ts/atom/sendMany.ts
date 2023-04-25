const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-16-app.bitgo-dev.com',
});

const accessToken = 'v2x04674c296b63dd92e7508f47f098692da3f6d84ac08f1bfac449a76728ed9f4d';

const WALLET_ID = '643f8362242e9e00070172edc8ef57c1';

const COIN = 'tatom';

const receiveAddress = 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32';

const PASS_PHRASE = '6PZKSm$oIFa%s1fy';

async function sendWallet() {

  await bitgo.authenticateWithAccessToken({ accessToken });

  await bitgo.unlock({ otp: '000000', duration: 3600 });

  const walletInstance = await bitgo.coin(COIN).wallets().get({ id: WALLET_ID });
  try {

    const transaction = await walletInstance.sendMany({
      recipients: [{
        amount: '1',
        address: receiveAddress,
        //  data: "0x095ea7b30000000000000000000000000e71a7bbd318f2b72b2c296e8983f4569a775c0d00000000000000000000000000000000000000000000000000000000000186a0"
      }],

      walletPassphrase: PASS_PHRASE,
      type: 'transfer',
      // gasPrice: 21000000000,
      // gasLimit: 31000

    });
    const { feeInfo, serializedTxHex } = transaction.transactions[0].unsignedTx;
    const explanation = await bitgo.coin(COIN).explainTransaction({ txHex: serializedTxHex, feeInfo });

    console.log('Wallet ID:', walletInstance.id());
    console.log('New Transaction:', JSON.stringify(transaction, null, 4));
    console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
  } catch (e) {
    console.error(e);
  }
}

sendWallet();
