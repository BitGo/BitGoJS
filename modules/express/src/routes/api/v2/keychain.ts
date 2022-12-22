import { Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';

const router = Router();

/** 
 * Create a keychain
 */
router.post(
  '/:coin/keychain/local',
  parseBody,
  promiseWrapper((req: Request) => {
    const bitgo = req.bitgo;
    const coin = bitgo.coin(req.params.coin);
    return coin.keychains().create(req.body);
  })
);

export default router as keychain;
