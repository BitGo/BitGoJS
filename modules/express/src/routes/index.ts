import { Router } from 'express';
import apiRoutes from './api';
const router = Router();

export function setupAPIRoutes(app: express.Application, config: Config): void {

}

router.use('/api', apiRoutes);
2

export default router;
