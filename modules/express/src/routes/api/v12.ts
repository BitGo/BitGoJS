import { Request, Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';

const router = Router();

router.get('/ping', promiseWrapper((req: Request) => {
  // #swagger.description = 'Checks the health of BitGo API servers. Rate limiting applies.'
  return req.bitgo.ping();
}));

router.get('/pingexpress', promiseWrapper((req: Request) => {
  // #swagger.description = 'Checks the health of the Express server without running into rate limiting with the BitGo server.'
  return {
    status: 'express server is ok!',
  };
}));

// auth
router.post('/user/login', parseBody, promiseWrapper((req: Request) => {
  const username = req.body.username || req.body.email;
  const body = req.body;
  body.username = username;
  return req.bitgo.authenticate(body);
}));

router.post('/decrypt', parseBody, promiseWrapper((req: Request) => {
  return {
    decrypted: req.bitgo.decrypt(req.body),
  };
}));

router.post('/encrypt', parseBody, promiseWrapper((req: Request) => {
  return {
    encrypted: req.bitgo.encrypt(req.body),
  };
}));

/**
 * @deprecated
 * @param req
 */
router.post(
  '/calculateminerfeeinfo',
  parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo.calculateMinerFeeInfo({
      bitgo: req.bitgo,
      feeRate: req.body.feeRate,
      nP2shInputs: req.body.nP2shInputs,
      nP2pkhInputs: req.body.nP2pkhInputs,
      nP2shP2wshInputs: req.body.nP2shP2wshInputs,
      nOutputs: req.body.nOutputs,
    });
  })
);

/**
 * @deprecated
 * @param req
 */
router.post('/verifyaddress', parseBody, promiseWrapper((req: Request) => {
  return {
    verified: req.bitgo.verifyAddress(req.body),
  };
}));

export default router as v12;
