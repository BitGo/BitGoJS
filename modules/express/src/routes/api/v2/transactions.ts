import { Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';
import V2Transaction from '../../../services/v2/transaction';

const router = Router();

// sign transaction
router.post('/:coin/signtx', parseBody, promiseWrapper(V2Transaction.sign));

router.post('/:coin/wallet/:id/signtx', parseBody, promiseWrapper(signWalletTx));

router.post(
  '/:coin/wallet/:id/signtxtss',
  parseBody,
  promiseWrapper(V2Transaction.signTSSWalletTx)
);

router.post(
  '/:coin/wallet/:id/recovertoken',
  parseBody,
  promiseWrapper(V2Transaction.recoverToken)
);

// send transaction
router.post('/:coin/wallet/:id/sendcoins', parseBody, promiseWrapper(V2Transaction.sendOne));

router.post('/:coin/wallet/:id/sendmany', parseBody, promiseWrapper(V2Transaction.sendMany));

router.post(
  '/:coin/wallet/:id/prebuildAndSignTransaction',
  parseBody,
  promiseWrapper(V2Transaction.prebuildAndSign)
);

// CPFP
router.post(
  '/:coin/wallet/:id/acceleratetx',
  parseBody,
  promiseWrapper(V2Transaction.accelerate)
);

export default router as transactions;
