import { Request, Router } from 'express';
import { parseBody, promiseWrapper } from '../../../utils';

const router = Router();

/**
 * @deprecated
 */
router.post(
  '/simplecreate',
  parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo.wallets().createWalletWithKeychains(req.body);
  })
);

/**
 * @deprecated
 */
router.post('/:id/sendcoins', parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo
      .wallets()
      .get({ id: req.params.id })
      .then(function (wallet) {
        return wallet.sendCoins(req.body);
      })
      .catch(function (err) {
        err.status = 400;
        throw err;
      })
      .then(function (result) {
        if (result.status === 'pendingApproval') {
          throw apiResponse(202, result);
        }
        return result;
      });
  })
);

/**
 * @deprecated
 */
router.post('/:id/sendmany', parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo
      .wallets()
      .get({ id: req.params.id })
      .then(function (wallet) {
        return wallet.sendMany(req.body);
      })
      .catch(function (err) {
        err.status = 400;
        throw err;
      })
      .then(function (result) {
        if (result.status === 'pendingApproval') {
          throw apiResponse(202, result);
        }
        return result;
      });
  })
);

/**
 * @deprecated
 */
router.post(
  '/:id/createtransaction',
  parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo
      .wallets()
      .get({ id: req.params.id })
      .then(function (wallet) {
        return wallet.createTransaction(req.body);
      })
      .catch(function (err) {
        err.status = 400;
        throw err;
      });
  })
);

/**
 * @deprecated
 */
router.post(
  '/:id/signtransaction',
  parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo
      .wallets()
      .get({ id: req.params.id })
      .then(function (wallet) {
        return wallet.signTransaction(req.body);
      });
  })
);

/**
 * @deprecated
 */
router.post('/:id/simpleshare', parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo
      .wallets()
      .get({ id: req.params.id })
      .then(function (wallet) {
        return wallet.shareWallet(req.body);
      });
  })
);

/**
 * @deprecated
 */
router.post(
  '/:shareId/acceptShare',
  parseBody,
  promiseWrapper((req: Request) => {
    const params = req.body || {};
    params.walletShareId = req.params.shareId;
    return req.bitgo.wallets().acceptShare(params);
  })
);


/**
 * @deprecated
 */
router.put(
  '/:id/consolidateunspents',
  parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo
      .wallets()
      .get({ id: req.params.id })
      .then(function (wallet) {
        return wallet.consolidateUnspents(req.body);
      });
  })
);

/**
 * @deprecated
 */
router.put('/:id/fanoutunspents', parseBody,
  promiseWrapper((req: Request) => {
    return req.bitgo
      .wallets()
      .get({ id: req.params.id })
      .then(function (wallet) {
        return wallet.fanOutUnspents(req.body);
      });
  })
);

export default router as wallets;
