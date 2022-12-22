import { Router } from 'express';
import addresses from './addresses';
import keychain from './keychain';
import pendingApprovals from './pendingApprovals';
import tokens from './tokens';
import transactions from './transactions';

const router = Router();

router.use('/', addresses);
router.use('/', keychain);
router.use('/', pendingApprovals);
router.use('/', tokens);
router.use('/', transactions);

export default router as v2;
