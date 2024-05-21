/**
 * @prettier
 */
import {
  EddsaUtils,
  EcdsaUtils,
  CustomGShareGeneratingFunction,
  CustomRShareGeneratingFunction,
  UnsupportedCoinError,
  GShare,
  SignShare,
  CustomCommitmentGeneratingFunction,
  CommitmentShareRecord,
  EncryptedSignerShareRecord,
  CustomPaillierModulusGetterFunction,
  CustomKShareGeneratingFunction,
  CustomMuDeltaShareGeneratingFunction,
  CustomSShareGeneratingFunction,
  TssEcdsaStep1ReturnMessage,
  TssEcdsaStep2ReturnMessage,
  SShare,
  ShareType,
  MPCType,
  CreateNetworkConnectionParams,
  GetNetworkPartnersResponse,
  encryptRsaWithAesGcm,
} from '@bitgo/sdk-core';
import { BitGo, BitGoOptions, Coin, CustomSigningFunction, SignedTransaction, SignedTransactionRequest } from 'bitgo';
import * as bodyParser from 'body-parser';
import * as debugLib from 'debug';
import * as express from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import * as _ from 'lodash';
import * as url from 'url';
import * as superagent from 'superagent';

// RequestTracer should be extracted into a separate npm package (along with
// the rest of the BitGoJS HTTP request machinery)
import { RequestTracer } from 'bitgo/dist/src/v2/internal/util';

import { Config } from './config';
import { ApiResponseError } from './errors';
import { promises as fs } from 'fs';
import { retryPromise } from './retryPromise';

const { version } = require('bitgo/package.json');
const pjson = require('../package.json');
const debug = debugLib('bitgo:express');

const BITGOEXPRESS_USER_AGENT = `BitGoExpress/${pjson.version} BitGoJS/${version}`;

declare module 'express-serve-static-core' {
  export interface Request {
    bitgo: BitGo;
    config: Config;
  }
}

function handlePing(req: express.Request, res: express.Response, next: express.NextFunction) {
  return req.bitgo.ping();
}

function handlePingExpress(req: express.Request) {
  return {
    status: 'express server is ok!',
  };
}

function handleLogin(req: express.Request) {
  const username = req.body.username || req.body.email;
  const body = req.body;
  body.username = username;
  return req.bitgo.authenticate(body);
}

function handleDecrypt(req: express.Request) {
  return {
    decrypted: req.bitgo.decrypt(req.body),
  };
}

function handleEncrypt(req: express.Request) {
  return {
    encrypted: req.bitgo.encrypt(req.body),
  };
}

/**
 * @deprecated
 * @param req
 */
function handleVerifyAddress(req: express.Request) {
  return {
    verified: req.bitgo.verifyAddress(req.body),
  };
}

/**
 * @deprecated
 * @param req
 */
function handleCreateLocalKeyChain(req: express.Request) {
  return req.bitgo.keychains().create(req.body);
}

/**
 * @deprecated
 * @param req
 */
function handleDeriveLocalKeyChain(req: express.Request) {
  return req.bitgo.keychains().deriveLocal(req.body);
}

/**
 * @deprecated
 * @param req
 */
function handleCreateWalletWithKeychains(req: express.Request) {
  return req.bitgo.wallets().createWalletWithKeychains(req.body);
}

/**
 * @deprecated
 * @param req
 */
function handleSendCoins(req: express.Request) {
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
}

/**
 * @deprecated
 * @param req
 */
function handleSendMany(req: express.Request) {
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
}

/**
 * @deprecated
 * @param req
 */
function handleCreateTransaction(req: express.Request) {
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
}

/**
 * @deprecated
 * @param req
 */
function handleSignTransaction(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function (wallet) {
      return wallet.signTransaction(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleShareWallet(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function (wallet) {
      return wallet.shareWallet(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleAcceptShare(req: express.Request) {
  const params = req.body || {};
  params.walletShareId = req.params.shareId;
  return req.bitgo.wallets().acceptShare(params);
}

/**
 * @deprecated
 * @param req
 */
function handleApproveTransaction(req: express.Request) {
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
}

/**
 * @deprecated
 * @param req
 */
function handleConstructApprovalTx(req: express.Request) {
  const params = req.body || {};
  return req.bitgo
    .pendingApprovals()
    .get({ id: req.params.id })
    .then(function (pendingApproval) {
      return pendingApproval.constructApprovalTx(params);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleConsolidateUnspents(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function (wallet) {
      return wallet.consolidateUnspents(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleFanOutUnspents(req: express.Request) {
  return req.bitgo
    .wallets()
    .get({ id: req.params.id })
    .then(function (wallet) {
      return wallet.fanOutUnspents(req.body);
    });
}

/**
 * @deprecated
 * @param req
 */
function handleCalculateMinerFeeInfo(req: express.Request) {
  return req.bitgo.calculateMinerFeeInfo({
    bitgo: req.bitgo,
    feeRate: req.body.feeRate,
    nP2shInputs: req.body.nP2shInputs,
    nP2pkhInputs: req.body.nP2pkhInputs,
    nP2shP2wshInputs: req.body.nP2shP2wshInputs,
    nOutputs: req.body.nOutputs,
  });
}

/**
 * Builds the API's URL string, optionally building the querystring if parameters exist
 * @param req
 * @return {string}
 */
function createAPIPath(req: express.Request) {
  let apiPath = '/' + req.params[0];
  if (!_.isEmpty(req.query)) {
    // req.params does not contain the querystring, so we manually add them here
    const urlDetails = url.parse(req.url);
    if (urlDetails.search) {
      // "search" is the properly URL encoded query params, prefixed with "?"
      apiPath += urlDetails.search;
    }
  }
  return apiPath;
}

/**
 * handle any other V1 API call
 * @deprecated
 * @param req
 * @param res
 * @param next
 */
function handleREST(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url(createAPIPath(req));
  return redirectRequest(bitgo, method, bitgoURL, req, next);
}

/**
 * handle any other V2 API call
 * @param req
 * @param res
 * @param next
 */
function handleV2UserREST(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url('/user' + createAPIPath(req), 2);
  return redirectRequest(bitgo, method, bitgoURL, req, next);
}

/**
 * handle v2 address validation
 * @param req
 */
function handleV2VerifyAddress(req: express.Request): { isValid: boolean } {
  if (!_.isString(req.body.address)) {
    throw new Error('Expected address to be a string');
  }

  if (req.body.supportOldScriptHashVersion !== undefined && !_.isBoolean(req.body.supportOldScriptHashVersion)) {
    throw new Error('Expected supportOldScriptHashVersion to be a boolean.');
  }

  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  if (coin instanceof Coin.AbstractUtxoCoin) {
    return {
      isValid: coin.isValidAddress(req.body.address, !!req.body.supportOldScriptHashVersion),
    };
  }

  return {
    isValid: coin.isValidAddress(req.body.address),
  };
}

/**
 * handle address canonicalization
 * @param req
 */
function handleCanonicalAddress(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  if (!['ltc', 'bch', 'bsv'].includes(coin.getFamily())) {
    throw new Error('only Litecoin/Bitcoin Cash/Bitcoin SV address canonicalization is supported');
  }

  const address = req.body.address;
  const fallbackVersion = req.body.scriptHashVersion; // deprecate
  const version = req.body.version;
  return (coin as Coin.Bch | Coin.Bsv | Coin.Ltc).canonicalAddress(address, version || fallbackVersion);
}

function getWalletPwFromEnv(walletId: string): string {
  const name = `WALLET_${walletId}_PASSPHRASE`;
  const walletPw = process.env[name];
  if (walletPw === undefined) {
    throw new Error(`Could not find wallet passphrase ${name} in environment`);
  }
  return walletPw;
}

async function getEncryptedPrivKey(path: string, walletId: string): Promise<string> {
  const privKeyFile = await fs.readFile(path, { encoding: 'utf8' });
  const encryptedPrivKey = JSON.parse(privKeyFile);
  if (encryptedPrivKey[walletId] === undefined) {
    throw new Error(`Could not find a field for walletId: ${walletId} in ${path}`);
  }
  return encryptedPrivKey[walletId];
}

function decryptPrivKey(bg: BitGo, encryptedPrivKey: string, walletPw: string): string {
  try {
    return bg.decrypt({ password: walletPw, input: encryptedPrivKey });
  } catch (e) {
    throw new Error(`Error when trying to decrypt private key: ${e}`);
  }
}

export async function handleV2GenerateShareTSS(req: express.Request): Promise<any> {
  const walletId = req.body.txRequest ? req.body.txRequest.walletId : req.body.tssParams.txRequest.walletId;
  if (!walletId) {
    throw new Error('Missing required field: walletId');
  }

  const walletPw = getWalletPwFromEnv(walletId);
  const { signerFileSystemPath } = req.config;

  if (!signerFileSystemPath) {
    throw new Error('Missing required configuration: signerFileSystemPath');
  }

  const encryptedPrivKey = await getEncryptedPrivKey(signerFileSystemPath, walletId);
  const bitgo = req.bitgo;
  const privKey = decryptPrivKey(bitgo, encryptedPrivKey, walletPw);
  const coin = bitgo.coin(req.params.coin);
  req.body.prv = privKey;
  req.body.walletPassphrase = walletPw;
  try {
    if (coin.getMPCAlgorithm() === MPCType.EDDSA) {
      const eddsaUtils = new EddsaUtils(bitgo, coin);
      switch (req.params.sharetype) {
        case ShareType.Commitment:
          return await eddsaUtils.createCommitmentShareFromTxRequest(req.body);
        case ShareType.R:
          return await eddsaUtils.createRShareFromTxRequest(req.body);
        case ShareType.G:
          return await eddsaUtils.createGShareFromTxRequest(req.body);
        default:
          throw new Error(
            `Share type ${req.params.sharetype} not supported, only commitment, G and R share generation is supported.`
          );
      }
    } else if (coin.getMPCAlgorithm() === MPCType.ECDSA) {
      const ecdsaUtils = new EcdsaUtils(bitgo, coin);
      switch (req.params.sharetype) {
        case ShareType.PaillierModulus:
          return ecdsaUtils.getOfflineSignerPaillierModulus(req.body);
        case ShareType.K:
          return await ecdsaUtils.createOfflineKShare(req.body);
        case ShareType.MuDelta:
          return await ecdsaUtils.createOfflineMuDeltaShare(req.body);
        case ShareType.S:
          return await ecdsaUtils.createOfflineSShare(req.body);
        default:
          throw new Error(
            `Share type ${req.params.sharetype} not supported, only PaillierModulus, K, MUDelta, and S share generation is supported.`
          );
      }
    } else {
      throw new Error(`MPC Algorithm ${coin.getMPCAlgorithm()} is not supported.`);
    }
  } catch (error) {
    console.error('error while signing wallet transaction ', error);
    throw error;
  }
}

export async function handleV2SignTSSWalletTx(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  try {
    return await wallet.signTransaction(createTSSSendParams(req));
  } catch (error) {
    console.error('error while signing wallet transaction ', error);
    throw error;
  }
}

/**
 * This route is used to sign while external express signer is enabled
 */
export async function handleV2Sign(req: express.Request) {
  const walletId = req.body.txPrebuild?.walletId;

  if (!walletId) {
    throw new Error('Missing required field: walletId');
  }

  const walletPw = getWalletPwFromEnv(walletId);
  const { signerFileSystemPath } = req.config;

  if (!signerFileSystemPath) {
    throw new Error('Missing required configuration: signerFileSystemPath');
  }

  const encryptedPrivKey = await getEncryptedPrivKey(signerFileSystemPath, walletId);
  const bitgo = req.bitgo;
  let privKey = decryptPrivKey(bitgo, encryptedPrivKey, walletPw);
  const coin = bitgo.coin(req.params.coin);
  if (req.body.derivationSeed) {
    privKey = coin.deriveKeyWithSeed({ key: privKey, seed: req.body.derivationSeed }).key;
  }
  try {
    return await coin.signTransaction({ ...req.body, prv: privKey });
  } catch (error) {
    console.log('error while signing wallet transaction ', error);
    throw error;
  }
}

export async function handleV2OFCSignPayloadInExtSigningMode(
  req: express.Request
): Promise<{ payload: string; signature: string }> {
  const walletId = req.body.walletId;
  const payload = req.body.payload;
  const ofcCoinName = 'ofc';

  if (!payload) {
    throw new ApiResponseError('Missing required field: payload', 400);
  }

  if (!walletId) {
    throw new ApiResponseError('Missing required field: walletId', 400);
  }

  // fetch the password for the given walletId from the env. This is required for decrypting the private key that belongs to that wallet.
  const walletPw = getWalletPwFromEnv(walletId);

  const { signerFileSystemPath } = req.config;
  if (!signerFileSystemPath) {
    throw new ApiResponseError('Missing required configuration: signerFileSystemPath', 500);
  }
  // get the encrypted private key from the local JSON file (encryptedPrivKeys.json) (populated using fetchEncryptedPrivateKeys.ts)
  const encryptedPrivKey = await getEncryptedPrivKey(signerFileSystemPath, walletId);

  const bitgo = req.bitgo;

  // decrypt the encrypted private key using the wallet pwd
  const privKey = decryptPrivKey(bitgo, encryptedPrivKey, walletPw);

  // create a BaseCoin instance for 'ofc'
  const coin = bitgo.coin(ofcCoinName);

  // stringify the payload if not already a string
  const stringifiedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

  try {
    // sign the message using the decrypted private key
    const signature = (await coin.signMessage({ prv: privKey }, stringifiedPayload)).toString('hex');
    return {
      payload: stringifiedPayload,
      signature,
    };
  } catch (error) {
    console.log('Error while signing message.', error);
    throw error;
  }
}

export async function handleV2OFCSignPayload(req: express.Request): Promise<{ payload: string; signature: string }> {
  const walletId = req.body.walletId;
  const payload = req.body.payload;
  const ofcCoinName = 'ofc';

  // If the externalSignerUrl is set, forward the request to the express server hosted on the externalSignerUrl
  const externalSignerUrl = req.config?.externalSignerUrl;
  if (externalSignerUrl) {
    const { body: payloadWithSignature } = await retryPromise(
      () =>
        superagent
          .post(`${externalSignerUrl}/api/v2/ofc/signPayload`)
          .type('json')
          .send({ walletId: walletId, payload: payload }),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return payloadWithSignature;
  }

  if (!payload) {
    throw new ApiResponseError('Missing required field: payload', 400);
  }

  if (!walletId) {
    throw new ApiResponseError('Missing required field: walletId', 400);
  }

  const bitgo = req.bitgo;

  // This is to set us up for multiple trading accounts per enterprise
  const wallet = await bitgo.coin(ofcCoinName).wallets().get({ id: walletId });

  if (wallet === undefined) {
    throw new ApiResponseError(`Could not find OFC wallet ${walletId}`, 404);
  }

  const walletPassphrase = getWalletPwFromEnv(wallet.id());
  const tradingAccount = wallet.toTradingAccount();
  const stringifiedPayload = JSON.stringify(req.body.payload);
  const signature = await tradingAccount.signPayload({
    payload: stringifiedPayload,
    walletPassphrase,
  });
  return {
    payload: stringifiedPayload,
    signature,
  };
}

/**
 * handle new wallet creation
 * @param req
 */
export async function handleV2GenerateWallet(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const result = await coin.wallets().generateWallet(req.body);
  if (req.query.includeKeychains === 'false') {
    return result.wallet.toJSON();
  }
  return { ...result, wallet: result.wallet.toJSON() };
}

/**
 * handle new address creation
 * @param req
 */
export async function handleV2CreateAddress(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.createAddress(req.body);
}

/**
 * handle v2 approve transaction
 * @param req
 */
async function handleV2PendingApproval(req: express.Request): Promise<any> {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const params = req.body || {};
  const pendingApproval = await coin.pendingApprovals().get({ id: req.params.id });
  if (params.state === 'approved') {
    return pendingApproval.approve(params);
  }
  return pendingApproval.reject(params);
}

/**
 * create a keychain
 * @param req
 */
function handleV2CreateLocalKeyChain(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  return coin.keychains().create(req.body);
}

/**
 * handle wallet share
 * @param req
 */
async function handleV2ShareWallet(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.shareWallet(req.body);
}

/**
 * handle accept wallet share
 * @param req
 */
async function handleV2AcceptWalletShare(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const params = _.extend({}, req.body, { walletShareId: req.params.id });
  return coin.wallets().acceptShare(params);
}

/**
 * handle wallet sign transaction
 */
async function handleV2SignTxWallet(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  try {
    return await wallet.signTransaction(createSendParams(req));
  } catch (error) {
    console.log('error while signing wallet transaction ', error);
    throw error;
  }
}

/**
 * handle sign transaction
 * @param req
 */
async function handleV2SignTx(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  try {
    return await coin.signTransaction(req.body);
  } catch (error) {
    console.log('error while signing the transaction ', error);
    throw error;
  }
}

/**
 * handle wallet recover token
 * @param req
 */
async function handleV2RecoverToken(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.recoverToken(req.body);
}

/**
 * handle wallet fanout unspents
 * @param req
 */
async function handleV2ConsolidateUnspents(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.consolidateUnspents(createSendParams(req));
}

/**
 * Handle Wallet Account Consolidation.
 *
 * @param req
 */
export async function handleV2ConsolidateAccount(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);

  if (req.body.consolidateAddresses && !_.isArray(req.body.consolidateAddresses)) {
    throw new Error('consolidate address must be an array of addresses');
  }

  if (!coin.allowsAccountConsolidations()) {
    throw new Error('invalid coin selected');
  }

  const wallet = await coin.wallets().get({ id: req.params.id });

  let result: any;
  try {
    if (coin.supportsTss()) {
      result = await wallet.sendAccountConsolidations(createTSSSendParams(req));
    } else {
      result = await wallet.sendAccountConsolidations(createSendParams(req));
    }
  } catch (err) {
    err.status = 400;
    throw err;
  }

  // we had failures to handle
  if (result.failure.length && result.failure.length > 0) {
    let msg = '';
    let status = 202;

    if (result.success.length && result.success.length > 0) {
      // but we also had successes
      msg = `Transactions failed: ${result.failure.length} and succeeded: ${result.success.length}`;
    } else {
      // or in this case only failures
      status = 400;
      msg = `All transactions failed`;
    }

    throw apiResponse(status, result, msg);
  }

  return result;
}

/**
 * handle wallet fanout unspents
 * @param req
 */
async function handleV2FanOutUnspents(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.fanoutUnspents(createSendParams(req));
}

/**
 * handle wallet sweep
 * @param req
 */
async function handleV2Sweep(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.sweep(createSendParams(req));
}

/**
 * handle CPFP accelerate transaction creation
 * @param req
 */
async function handleV2AccelerateTransaction(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  return wallet.accelerateTransaction(createSendParams(req));
}

function createSendParams(req: express.Request) {
  if (req.config?.externalSignerUrl !== undefined) {
    return {
      ...req.body,
      customSigningFunction: createCustomSigningFunction(req.config.externalSignerUrl),
    };
  } else {
    return req.body;
  }
}

function createTSSSendParams(req: express.Request) {
  if (req.config?.externalSignerUrl !== undefined) {
    const coin = req.bitgo.coin(req.params.coin);
    if (coin.getMPCAlgorithm() === MPCType.EDDSA) {
      return {
        ...req.body,
        customCommitmentGeneratingFunction: createCustomCommitmentGenerator(
          req.config.externalSignerUrl,
          req.params.coin
        ),
        customRShareGeneratingFunction: createCustomRShareGenerator(req.config.externalSignerUrl, req.params.coin),
        customGShareGeneratingFunction: createCustomGShareGenerator(req.config.externalSignerUrl, req.params.coin),
      };
    } else if (coin.getMPCAlgorithm() === MPCType.ECDSA) {
      return {
        ...req.body,
        customPaillierModulusGeneratingFunction: createCustomPaillierModulusGetter(
          req.config.externalSignerUrl,
          req.params.coin
        ),
        customKShareGeneratingFunction: createCustomKShareGenerator(req.config.externalSignerUrl, req.params.coin),
        customMuDeltaShareGeneratingFunction: createCustomMuDeltaShareGenerator(
          req.config.externalSignerUrl,
          req.params.coin
        ),
        customSShareGeneratingFunction: createCustomSShareGenerator(req.config.externalSignerUrl, req.params.coin),
      };
    } else {
      throw new Error(`MPC Algorithm ${coin.getMPCAlgorithm()} is not supported.`);
    }
  } else {
    return req.body;
  }
}

/**
 * handle send one
 * @param req
 */
async function handleV2SendOne(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = new RequestTracer();
  const wallet = await coin.wallets().get({ id: req.params.id, reqId });
  req.body.reqId = reqId;

  let result;
  try {
    result = await wallet.send(createSendParams(req));
  } catch (err) {
    err.status = 400;
    throw err;
  }
  if (result.status === 'pendingApproval') {
    throw apiResponse(202, result);
  }
  return result;
}

/**
 * handle send many
 * @param req
 */
async function handleV2SendMany(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = new RequestTracer();
  const wallet = await coin.wallets().get({ id: req.params.id, reqId });
  req.body.reqId = reqId;
  let result;
  try {
    if (wallet._wallet.multisigType === 'tss') {
      result = await wallet.sendMany(createTSSSendParams(req));
    } else {
      result = await wallet.sendMany(createSendParams(req));
    }
  } catch (err) {
    err.status = 400;
    throw err;
  }
  if (result.status === 'pendingApproval') {
    throw apiResponse(202, result);
  }
  return result;
}

/**
 * Routes payload meant for prebuildAndSignTransaction() in sdk-core which
 * validates the payload and makes the appropriate request to WP to
 * build, sign, and send a tx.
 * - sends request to Platform to build the transaction
 * - signs with user key
 * - request signature from the second key (BitGo HSM)
 * - send/broadcast transaction
 * @param req where req.body is {@link PrebuildAndSignTransactionOptions}
 */
export async function handleV2PrebuildAndSignTransaction(req: express.Request): Promise<SignedTransactionRequest> {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = new RequestTracer();
  const wallet = await coin.wallets().get({ id: req.params.id, reqId });
  req.body.reqId = reqId;
  let result;
  try {
    result = await wallet.prebuildAndSignTransaction(createSendParams(req));
  } catch (err) {
    err.status = 400;
    throw err;
  }
  return result;
}

/**
 * Enables tokens on a wallet
 * @param req
 */
export async function handleV2EnableTokens(req: express.Request) {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const reqId = new RequestTracer();
  const wallet = await coin.wallets().get({ id: req.params.id, reqId });
  req.body.reqId = reqId;
  try {
    return wallet.sendTokenEnablements(createSendParams(req));
  } catch (err) {
    err.status = 400;
    throw err;
  }
}

/**
 * handle any other API call
 * @param req
 * @param res
 * @param next
 */
function handleV2CoinSpecificREST(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method;
  const bitgo = req.bitgo;

  debug('handling v2 coin specific rest req');

  try {
    const coin = bitgo.coin(req.params.coin);
    const coinURL = coin.url(createAPIPath(req));
    return redirectRequest(bitgo, method, coinURL, req, next);
  } catch (e) {
    if (e instanceof UnsupportedCoinError) {
      const queryParams = _.transform(
        req.query,
        (acc: string[], value, key) => {
          for (const val of _.castArray(value)) {
            acc.push(`${key}=${val}`);
          }
        },
        []
      );
      const baseUrl = bitgo.url(req.baseUrl.replace(/^\/api\/v2/, ''), 2);
      const url = _.isEmpty(queryParams) ? baseUrl : `${baseUrl}?${queryParams.join('&')}`;

      debug(`coin ${req.params.coin} not supported, attempting to handle as a coinless route with url ${url}`);
      return redirectRequest(bitgo, method, url, req, next);
    }

    throw e;
  }
}

/**
 * Handle additional option to encrypt on the express route for partners requiring value encryption
 * @param req.body.encrypt - boolean to determine if the request should handle encryption on behalf of the submission.
 */
async function handleNetworkV1EnterpriseClientConnections(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  debug('handling network v1 partner connection creation');

  const bitgo = req.bitgo;
  const params = req.params;
  const body = req.body as CreateNetworkConnectionParams & {
    encrypt?: boolean;
  };

  if (body.encrypt === true) {
    if (!body.partnerId) {
      throw new ApiResponseError('Missing required field: partnerId', 400);
    }

    const partnersUrl = bitgo.microservicesUrl(`/api/network/v1/enterprises/${params.enterpriseId}/partners`);

    const response: GetNetworkPartnersResponse = await bitgo
      .get(partnersUrl)
      .set('enterprise-id', params.enterpriseId)
      .send({ ids: [params.partnerId] })
      .result();

    const partners = response.partners;
    const partner = partners.find((p) => p.id === body.partnerId);

    if (!partner) {
      throw new ApiResponseError(`Partner not found for partnerId: ${body.partnerId}`, 400);
    }

    if (!partner.publicKey) {
      throw new ApiResponseError('Partner does not require encryption', 400);
    }

    switch (body.connectionKey.schema) {
      case 'token':
        req.body.connectionKey.connectionToken = await encryptRsaWithAesGcm(
          partner.publicKey,
          body.connectionKey.connectionToken
        );
        break;
      case 'tokenAndSignature':
        req.body.connectionKey.connectionToken = await encryptRsaWithAesGcm(
          partner.publicKey,
          body.connectionKey.connectionToken
        );
        req.body.connectionKey.signature = await encryptRsaWithAesGcm(partner.publicKey, body.connectionKey.signature);
        break;
      case 'apiKeyAndSecret':
      case 'clearloop':
        req.body.connectionKey.apiKey = await encryptRsaWithAesGcm(partner.publicKey, body.connectionKey.apiKey);
        req.body.connectionKey.apiSecret = await encryptRsaWithAesGcm(partner.publicKey, body.connectionKey.apiSecret);
        break;
    }
  }

  return handleProxyReq(req, res, next);
}

/**
 * Redirect a request using the bitgo request functions.
 * @param bitgo
 * @param method
 * @param url
 * @param req
 * @param next
 */
function redirectRequest(bitgo: BitGo, method: string, url: string, req: express.Request, next: express.NextFunction) {
  let request;

  switch (method) {
    case 'GET':
      request = bitgo.get(url);
      break;
    case 'POST':
      request = bitgo.post(url).send(req.body);
      break;
    case 'PUT':
      request = bitgo.put(url).send(req.body);
      break;
    case 'PATCH':
      request = bitgo.patch(url).send(req.body);
      break;
    case 'OPTIONS':
      request = bitgo.options(url).send(req.body);
      break;
    case 'DELETE':
      request = bitgo.del(url).send(req.body);
      break;
  }

  if (request) {
    if (req.params.enterpriseId) {
      request.set('enterprise-id', req.params.enterpriseId);
    }
    return request.result();
  }

  // something has presumably gone wrong
  next();
}

async function handleProxyReq(req: express.Request, res: express.Response, next: express.NextFunction) {
  const fullUrl = req.bitgo.microservicesUrl(req.originalUrl);
  if (req.url && (/^\/api.*$/.test(req.originalUrl) || /^\/oauth\/token.*$/.test(req.url))) {
    req.isProxy = true;
    debug('proxying %s request to %s', req.method, fullUrl);
    return await redirectRequest(req.bitgo, req.method, fullUrl, req, next);
  }
  // user tried to access a url which is not an api route, do not proxy
  debug('unable to proxy %s request to %s', req.method, fullUrl);
  throw new ApiResponseError('bitgo-express can only proxy BitGo API requests', 404);
}

/**
 *
 * @param status
 * @param result
 * @param message
 */
function apiResponse(status: number, result: any, message?: string): ApiResponseError {
  return new ApiResponseError(message, status, result);
}

const expressJSONParser = bodyParser.json({ limit: '20mb' });

/**
 * Perform body parsing here only on routes we want
 */
function parseBody(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Set the default Content-Type, in case the client doesn't set it.  If
  // Content-Type isn't specified, Express silently refuses to parse the
  // request body.
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  return expressJSONParser(req, res, next);
}

/**
 * Create the bitgo object in the request
 * @param config
 */
function prepareBitGo(config: Config) {
  const { env, customRootUri, customBitcoinNetwork } = config;

  return function prepBitGo(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Get access token
    let accessToken;
    if (req.headers.authorization) {
      const authSplit = req.headers.authorization.split(' ');
      if (authSplit.length === 2 && authSplit[0].toLowerCase() === 'bearer') {
        accessToken = authSplit[1];
      }
    }
    const userAgent = req.headers['user-agent']
      ? BITGOEXPRESS_USER_AGENT + ' ' + req.headers['user-agent']
      : BITGOEXPRESS_USER_AGENT;
    const bitgoConstructorParams: BitGoOptions = {
      env,
      customRootURI: customRootUri,
      customBitcoinNetwork,
      accessToken,
      userAgent,
    };

    req.bitgo = new BitGo(bitgoConstructorParams);
    req.config = config;

    next();
  };
}

type RequestHandlerResponse = string | unknown | undefined;
interface RequestHandler extends express.RequestHandler<ParamsDictionary, any, RequestHandlerResponse> {
  (req: express.Request, res: express.Response, next: express.NextFunction):
    | RequestHandlerResponse
    | Promise<RequestHandlerResponse>;
}

function handleRequestHandlerError(res: express.Response, error: unknown) {
  let err;
  if (error instanceof Error) {
    err = error;
  } else if (typeof error === 'string') {
    err = new Error('(string_error) ' + error);
  } else {
    err = new Error('(object_error) ' + JSON.stringify(error));
  }

  const message = err.message || 'local error';
  // use attached result, or make one
  let result = err.result || { error: message };
  result = _.extend({}, result, {
    message: err.message,
    bitgoJsVersion: version,
    bitgoExpressVersion: pjson.version,
  });
  const status = err.status || 500;
  if (!(status >= 200 && status < 300)) {
    console.log('error %s: %s', status, err.message);
  }
  if (status >= 500 && status <= 599) {
    if (err.response && err.response.request) {
      console.log(`failed to make ${err.response.request.method} request to ${err.response.request.url}`);
    }
    console.log(err.stack);
  }
  res.status(status).send(result);
}

/**
 * Promise handler wrapper to handle sending responses and error cases
 * @param promiseRequestHandler
 */
function promiseWrapper(promiseRequestHandler: RequestHandler) {
  return async function promWrapper(req: express.Request, res: express.Response, next: express.NextFunction) {
    debug(`handle: ${req.method} ${req.originalUrl}`);
    try {
      const result = await promiseRequestHandler(req, res, next);
      res.status(200).send(result);
    } catch (e) {
      handleRequestHandlerError(res, e);
    }
  };
}

export function createCustomSigningFunction(externalSignerUrl: string): CustomSigningFunction {
  return async function (params): Promise<SignedTransaction> {
    const { body: signedTx } = await retryPromise(
      () =>
        superagent
          .post(`${externalSignerUrl}/api/v2/${params.coin.getChain()}/sign`)
          .type('json')
          .send({ txPrebuild: params.txPrebuild, pubs: params.pubs, derivationSeed: params.derivationSeed }),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return signedTx;
  };
}
export function createCustomPaillierModulusGetter(
  externalSignerUrl: string,
  coin: string
): CustomPaillierModulusGetterFunction {
  return async function (params): Promise<{
    userPaillierModulus: string;
  }> {
    const { body: result } = await retryPromise(
      () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/PaillierModulus`).type('json').send(params),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return result;
  };
}

export function createCustomKShareGenerator(externalSignerUrl: string, coin: string): CustomKShareGeneratingFunction {
  return async function (params): Promise<TssEcdsaStep1ReturnMessage> {
    const { body: result } = await retryPromise(
      () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/K`).type('json').send(params),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return result;
  };
}

export function createCustomMuDeltaShareGenerator(
  externalSignerUrl: string,
  coin: string
): CustomMuDeltaShareGeneratingFunction {
  return async function (params): Promise<TssEcdsaStep2ReturnMessage> {
    const { body: result } = await retryPromise(
      () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/MuDelta`).type('json').send(params),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return result;
  };
}

export function createCustomSShareGenerator(externalSignerUrl: string, coin: string): CustomSShareGeneratingFunction {
  return async function (params): Promise<SShare> {
    const { body: result } = await retryPromise(
      () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/S`).type('json').send(params),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return result;
  };
}

export function createCustomCommitmentGenerator(
  externalSignerUrl: string,
  coin: string
): CustomCommitmentGeneratingFunction {
  return async function (params): Promise<{
    userToBitgoCommitment: CommitmentShareRecord;
    encryptedSignerShare: EncryptedSignerShareRecord;
    encryptedUserToBitgoRShare: EncryptedSignerShareRecord;
  }> {
    const { body: result } = await retryPromise(
      () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/commitment`).type('json').send(params),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return result;
  };
}

export function createCustomRShareGenerator(externalSignerUrl: string, coin: string): CustomRShareGeneratingFunction {
  return async function (params): Promise<{ rShare: SignShare }> {
    const { body: rShare } = await retryPromise(
      () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/R`).type('json').send(params),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return rShare;
  };
}

export function createCustomGShareGenerator(externalSignerUrl: string, coin: string): CustomGShareGeneratingFunction {
  return async function (params): Promise<GShare> {
    const { body: signedTx } = await retryPromise(
      () => superagent.post(`${externalSignerUrl}/api/v2/${coin}/tssshare/G`).type('json').send(params),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return signedTx;
  };
}

export function setupAPIRoutes(app: express.Application, config: Config): void {
  // When adding new routes to BitGo Express make sure that you also add the exact same routes to the server. Since
  // some customers were confused when calling a BitGo Express route on the BitGo server, we now handle all BitGo
  // Express routes on the BitGo server and return an error message that says that one should call BitGo Express
  // instead.
  // V1 routes should be added to www/config/routes.js
  // V2 routes should be added to www/config/routesV2.js

  // ping
  // /api/v[12]/pingexpress is the only exception to the rule above, as it explicitly checks the health of the
  // express server without running into rate limiting with the BitGo server.
  app.get('/api/v[12]/ping', prepareBitGo(config), promiseWrapper(handlePing));
  app.get('/api/v[12]/pingexpress', promiseWrapper(handlePingExpress));

  // auth
  app.post('/api/v[12]/user/login', parseBody, prepareBitGo(config), promiseWrapper(handleLogin));

  app.post('/api/v[12]/decrypt', parseBody, prepareBitGo(config), promiseWrapper(handleDecrypt));
  app.post('/api/v[12]/encrypt', parseBody, prepareBitGo(config), promiseWrapper(handleEncrypt));
  app.post('/api/v[12]/verifyaddress', parseBody, prepareBitGo(config), promiseWrapper(handleVerifyAddress));
  app.post(
    '/api/v[12]/calculateminerfeeinfo',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleCalculateMinerFeeInfo)
  );

  app.post('/api/v1/keychain/local', parseBody, prepareBitGo(config), promiseWrapper(handleCreateLocalKeyChain));
  app.post('/api/v1/keychain/derive', parseBody, prepareBitGo(config), promiseWrapper(handleDeriveLocalKeyChain));
  app.post(
    '/api/v1/wallets/simplecreate',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleCreateWalletWithKeychains)
  );

  app.post('/api/v1/wallet/:id/sendcoins', parseBody, prepareBitGo(config), promiseWrapper(handleSendCoins));
  app.post('/api/v1/wallet/:id/sendmany', parseBody, prepareBitGo(config), promiseWrapper(handleSendMany));
  app.post(
    '/api/v1/wallet/:id/createtransaction',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleCreateTransaction)
  );
  app.post(
    '/api/v1/wallet/:id/signtransaction',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleSignTransaction)
  );

  app.post('/api/v1/wallet/:id/simpleshare', parseBody, prepareBitGo(config), promiseWrapper(handleShareWallet));
  app.post(
    '/api/v1/walletshare/:shareId/acceptShare',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleAcceptShare)
  );

  app.put(
    '/api/v1/pendingapprovals/:id/express',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleApproveTransaction)
  );
  app.put(
    '/api/v1/pendingapprovals/:id/constructTx',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleConstructApprovalTx)
  );

  app.put(
    '/api/v1/wallet/:id/consolidateunspents',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleConsolidateUnspents)
  );
  app.put('/api/v1/wallet/:id/fanoutunspents', parseBody, prepareBitGo(config), promiseWrapper(handleFanOutUnspents));

  // any other API call
  app.use('/api/v[1]/*', parseBody, prepareBitGo(config), promiseWrapper(handleREST));

  // API v2

  // create keychain
  app.post(
    '/api/v2/:coin/keychain/local',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2CreateLocalKeyChain)
  );

  // generate wallet
  app.post('/api/v2/:coin/wallet/generate', parseBody, prepareBitGo(config), promiseWrapper(handleV2GenerateWallet));

  // create address
  app.post('/api/v2/:coin/wallet/:id/address', parseBody, prepareBitGo(config), promiseWrapper(handleV2CreateAddress));

  // share wallet
  app.post('/api/v2/:coin/wallet/:id/share', parseBody, prepareBitGo(config), promiseWrapper(handleV2ShareWallet));
  app.post(
    '/api/v2/:coin/walletshare/:id/acceptshare',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2AcceptWalletShare)
  );

  // sign arbitrary payloads w/ trading account key
  app.post(`/api/v2/ofc/signPayload`, parseBody, prepareBitGo(config), promiseWrapper(handleV2OFCSignPayload));

  // sign transaction
  app.post('/api/v2/:coin/signtx', parseBody, prepareBitGo(config), promiseWrapper(handleV2SignTx));
  app.post('/api/v2/:coin/wallet/:id/signtx', parseBody, prepareBitGo(config), promiseWrapper(handleV2SignTxWallet));
  app.post(
    '/api/v2/:coin/wallet/:id/signtxtss',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2SignTSSWalletTx)
  );
  app.post(
    '/api/v2/:coin/wallet/:id/recovertoken',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2RecoverToken)
  );

  // send transaction
  app.post('/api/v2/:coin/wallet/:id/sendcoins', parseBody, prepareBitGo(config), promiseWrapper(handleV2SendOne));
  app.post('/api/v2/:coin/wallet/:id/sendmany', parseBody, prepareBitGo(config), promiseWrapper(handleV2SendMany));
  app.post(
    '/api/v2/:coin/wallet/:id/prebuildAndSignTransaction',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2PrebuildAndSignTransaction)
  );

  // token enablement
  app.post(
    '/api/v2/:coin/wallet/:id/enableTokens',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2EnableTokens)
  );

  // unspent changes
  app.post(
    '/api/v2/:coin/wallet/:id/consolidateunspents',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2ConsolidateUnspents)
  );
  app.post(
    '/api/v2/:coin/wallet/:id/fanoutunspents',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2FanOutUnspents)
  );

  app.post('/api/v2/:coin/wallet/:id/sweep', parseBody, prepareBitGo(config), promiseWrapper(handleV2Sweep));

  // CPFP
  app.post(
    '/api/v2/:coin/wallet/:id/acceleratetx',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2AccelerateTransaction)
  );

  // account-based
  app.post(
    '/api/v2/:coin/wallet/:id/consolidateAccount',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2ConsolidateAccount)
  );

  // Miscellaneous
  app.post('/api/v2/:coin/canonicaladdress', parseBody, prepareBitGo(config), promiseWrapper(handleCanonicalAddress));
  app.post('/api/v2/:coin/verifyaddress', parseBody, prepareBitGo(config), promiseWrapper(handleV2VerifyAddress));
  app.put(
    '/api/v2/:coin/pendingapprovals/:id',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2PendingApproval)
  );

  // any other API v2 call
  app.use('/api/v2/user/*', parseBody, prepareBitGo(config), promiseWrapper(handleV2UserREST));
  app.use('/api/v2/:coin/*', parseBody, prepareBitGo(config), promiseWrapper(handleV2CoinSpecificREST));

  app.post(
    '/api/network/v1/enterprises/:enterpriseId/clients/connections',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleNetworkV1EnterpriseClientConnections)
  );

  // everything else should use the proxy handler
  if (config.disableProxy !== true) {
    app.use(
      '/api/:namespace/v[12]/enterprises/:enterpriseId/*',
      parseBody,
      prepareBitGo(config),
      promiseWrapper(handleProxyReq)
    );

    app.use(parseBody, prepareBitGo(config), promiseWrapper(handleProxyReq));
  }
}

export function setupSigningRoutes(app: express.Application, config: Config): void {
  app.post('/api/v2/:coin/sign', parseBody, prepareBitGo(config), promiseWrapper(handleV2Sign));
  app.post(
    '/api/v2/:coin/tssshare/:sharetype',
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2GenerateShareTSS)
  );
  app.post(
    `/api/v2/ofc/signPayload`,
    parseBody,
    prepareBitGo(config),
    promiseWrapper(handleV2OFCSignPayloadInExtSigningMode)
  );
}
