import { Router } from 'express';
import keychain from './keychain';
import pendingApprovals from './pending-approvals';
import wallets from './wallets';
const router = Router();

router.use('/keychain', keychain);
router.use('/pendingapprovals', pendingApprovals);
router.use('/wallets', wallets);

export default router as v1;
