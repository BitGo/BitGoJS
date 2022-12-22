import { Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';
import V2Address from '../../../services/v2/address';

const router = Router();

router.post('/:coin/canonicaladdress', parseBody, promiseWrapper(V2Address.canonicalize));
router.post('/:coin/verifyaddress', parseBody, promiseWrapper(V2Address.verify));

export default router as addresses;
