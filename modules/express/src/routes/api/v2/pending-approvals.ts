import { Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';

const router = Router();

/**
 * Approve transaction
 */
router.put(
  '/:coin/pendingapprovals/:id',
  parseBody,
  promiseWrapper((req: Request) => {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    const params = req.body || {};
    const pendingApproval = await coin.pendingApprovals().get({ id: req.params.id });
    if (params.state === 'approved') {
      return pendingApproval.approve(params);
    }
    return pendingApproval.reject(params);
  })
);

export default router as pendingApprovals;
