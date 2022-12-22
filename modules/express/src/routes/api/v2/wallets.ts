import { Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';
import V2Wallet from '../../../services/v2/wallet';

const router = Router();
  
// generate wallet
router.post('/api/v2/:coin/wallet/generate', parseBody, promiseWrapper(V2Wallet.generate));

// create address
router.post('/api/v2/:coin/wallet/:id/address', parseBody, promiseWrapper(V2Wallet.createAddress));

// share wallet
router.post('/api/v2/:coin/wallet/:id/share', parseBody, promiseWrapper(V2Wallet.share));

router.post(
  '/api/v2/:coin/walletshare/:id/acceptshare',
  parseBody,
  promiseWrapper(V2Wallet.acceptShare)
);

// unspent changes
router.post(
  '/api/v2/:coin/wallet/:id/consolidateunspents',
  parseBody,
  promiseWrapper(V2Wallet.consolidateUnspents)
);

router.post(
  '/api/v2/:coin/wallet/:id/fanoutunspents',
  parseBody,
  promiseWrapper(V2Wallet.fanOutUnspents)
);
  
router.post('/api/v2/:coin/wallet/:id/sweep', parseBody, promiseWrapper(handleV2Sweep));

// account-based
router.post(
  '/api/v2/:coin/wallet/:id/consolidateAccount',
  parseBody,
  promiseWrapper(V2Wallet.consolidateAccount)
);

export default router as wallets;
