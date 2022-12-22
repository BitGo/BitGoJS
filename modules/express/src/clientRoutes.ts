/**
 * @prettier
 */
import {
  EddsaUtils,
  CustomGShareGeneratingFunction,
  CustomRShareGeneratingFunction,
  UnsupportedCoinError,
  GShare,
  SignShare,
  YShare,
} from '@bitgo/sdk-core';
import { BitGo, Coin, CustomSigningFunction, SignedTransaction, SignedTransactionRequest } from 'bitgo';
import * as debugLib from 'debug';
import * as express from 'express';

import * as _ from 'lodash';
import * as url from 'url';
import * as superagent from 'superagent'


import { ApiResponseError } from './errors';
import { promises as fs } from 'fs';
import { retryPromise } from './retryPromise';

import { prepareBitGo, parseBody } from './utils';

const debug = debugLib('bitgo:express');












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
  const walletId = req.body.txRequest.walletId;
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
  const eddUtils = new EddsaUtils(bitgo, coin);
  req.body.prv = privKey;
  try {
    if (req.params.sharetype == 'R') {
      return await eddUtils.createRShareFromTxRequest(req.body);
    } else if (req.params.sharetype == 'G') {
      return await eddUtils.createGShareFromTxRequest(req.body);
    } else {
      throw new Error('Share type not supported, only G and R share generation is supported.');
    }
  } catch (error) {
    console.error('error while signing wallet transaction ', error);
    throw error;
  }
}


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
  const privKey = decryptPrivKey(bitgo, encryptedPrivKey, walletPw);
  const coin = bitgo.coin(req.params.coin);
  try {
    return await coin.signTransaction({ ...req.body, prv: privKey });
  } catch (error) {
    console.log('error while signing wallet transaction ', error);
    throw error;
  }
}

