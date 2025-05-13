import * as express from 'express';

/**
 * This route is used to sign while external express signer is enabled
 */
export async function handleV2Sign(req: express.Request) {
  const walletId = req.body.txPrebuild?.walletId;

  if (!walletId) {
    throw new Error('Missing required field: walletId');
  }

  const privKey = 'TODO'; // Get from KMS
  const coin = req.bitgo.coin(req.params.coin);
  try {
    return await coin.signTransaction({ ...req.body, prv: privKey });
  } catch (error) {
    console.log('error while signing wallet transaction ', error);
    throw error;
  }
}
