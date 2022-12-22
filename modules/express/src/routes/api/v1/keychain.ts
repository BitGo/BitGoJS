import { Request, Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';

const router = Router();

/**
 * @deprecated
 */
router.post('/local', parseBody, promiseWrapper((req: Request) => {
  return req.bitgo.keychains().create(req.body);
}));

/**
 * @deprecated
 */
router.post('/derive', parseBody, promiseWrapper((req: Request) => {
  return req.bitgo.keychains().deriveLocal(req.body);
}));

export default router as keychain;
