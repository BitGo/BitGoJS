import { BitGo } from 'bitgo';

// authentication
const env = 'test'; // test or prod
const accessToken = ''; // your API access token
const walletPassphrase = ''; // wallet passphrase
const otp = ''; // create an OTP, 000000 for test environment

// transaction
const walletId = ''; // sender wallet ID
const baseUnitAmount = ''; // base unit amount, for example 1000000000000000000 if sending 1 WETH
const recipientAddress = ''; // recipient address

// Types
type eip1559Type = {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

// Params
const hop = false; // Boolean, true or false, transform normal tx to hoptx.

// Fees: You can use eip1559. If you dont send any, use default type.
const eip1559 = {
  maxPriorityFeePerGas: '', // string.
  maxFeePerGas: '', // string.
};

async function sendFunds(walletId: string, baseUnitQuantity: string, eip1559?: eip1559Type, hop: boolean) {
  try {
    const bitgo = new BitGo({
      env,
    });
    await bitgo.authenticateWithAccessToken({ accessToken });
    const unlock = await bitgo.unlock({ otp, duration: 3600 });
    if (!unlock) {
      console.log('We did not unlock.');
      throw new Error();
    }
    const walletInstance = await bitgo.coin('tavaxc').wallets().get({ id: walletId });

    const res = await walletInstance.sendMany({
      recipients: [
        {
          amount: baseUnitQuantity,
          address: recipientAddress,
        },
      ],
      hop,
      eip1559,
      walletPassphrase,
    });
    console.dir(JSON.stringify(res, null, 2));
  } catch (error) {
    console.log(error);
  }
}

sendFunds(walletId, baseUnitAmount, eip1559, hop).catch((e) => console.error(e));
