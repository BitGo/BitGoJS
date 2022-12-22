import { Request, Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';

const router = Router();

/**
 * @deprecated
 */
router.put(
  '/:id/express',
  parseBody,

  promiseWrapper((req: Request) => {
    const params = req.body || {};
    return req.bitgo
      .pendingApprovals()
      .get({ id: req.params.id })
      .then(function (pendingApproval) {
        if (params.state === 'approved') {
          return pendingApproval.approve(params);
        }
        return pendingApproval.reject(params);
      });
  })
);

/**
 * @deprecated
 */
router.put(
  '/:id/constructTx',
  parseBody,
  promiseWrapper((req: Request) => {
    const params = req.body || {};
    return req.bitgo
      .pendingApprovals()
      .get({ id: req.params.id })
      .then(function (pendingApproval) {
        return pendingApproval.constructApprovalTx(params);
      });
  })
);

export default router as pendingApprovals;
