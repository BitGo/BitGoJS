import { legacySafeConfig } from './config';
import { decrypt } from '@bitgo/sdk-api';
import { getV1SafeWallet } from './create-wallet';

// Tx confirmed in testnet: https://mempool.space/testnet/tx/8477562fb353165c45213670cdcae1bc040cf081d60fd14896f345f3184dca9b
const buildSignSendTransaction = async () => {
  const v1SafeWallet = await getV1SafeWallet();
  const userKeyWif = decrypt(legacySafeConfig.userPassword, v1SafeWallet.wallet.private.userPrivKey);

  const createTxResult = await v1SafeWallet.createTransaction({
    recipients: {
      '2MyGxrhLC4kRfuVjLqCVYFtC7DchhgMCiNz': 110000,
    },
    feeRate: 10000, // 10 sat/byte
    bitgoFee: {
      amount: 0,
      address: '',
    },
  });
  const halfSignedTx = await v1SafeWallet.signTransaction({
    transactionHex: createTxResult.transactionHex,
    unspents: createTxResult.unspents,
    signingKey: userKeyWif,
  });

  const sendTxResult = await v1SafeWallet.sendTransaction(halfSignedTx);
  console.log('Transaction successfully sent for broadcast! ', sendTxResult);
};

buildSignSendTransaction()
  .then(() => console.log('v1 safe wallet tx build sign send example complete!'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
