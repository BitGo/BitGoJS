import { Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';
import V2Token from '../../../services/v2/tokens';

const router = Router();
  
// token enablement
router.post(
  '/:coin/wallet/:id/enableTokens',
  parseBody,
  promiseWrapper(V2Token.enable)
);

export default router as tokens;

