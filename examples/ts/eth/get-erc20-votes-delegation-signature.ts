/* eslint-disable no-console */
/**
 * Get the ECDSA signature for a delegation request once BitGo has signed it.
 * Prints `v`, `r`, `s` and the ABI-encoded `delegateBySig` calldata that you
 * can broadcast on-chain from any address.
 *
 * Step 2 of the flow described in
 * `examples/docs/erc20-votes-delegate-by-sig.md`. Step 1 is
 * `examples/ts/eth/create-erc20-votes-delegation-txrequest.ts`, which
 * creates the request and prints its `txRequestId`.
 *
 * Run from the repo root:
 *
 *   npx tsx examples/ts/eth/get-erc20-votes-delegation-signature.ts
 *
 * Required env (same names as step 1):
 *   BITGO_ACCESS_TOKEN (or ACCESS_TOKEN)
 *   WALLET_ID
 *   COIN          — must match the wallet's chain (e.g. eth, teth, hteth)
 *   TX_REQUEST_ID — id printed by step 1
 *
 * Optional:
 *   BITGO_ENV — `test` (default) or `prod`
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { BitGoAPI } from '@bitgo/sdk-api';
import { EnvironmentName } from '@bitgo/sdk-core';
import { Eth, Hteth, Teth } from '@bitgo/sdk-coin-eth';
import { ethers } from 'ethers';

async function loadEnv(): Promise<void> {
  const candidates = [path.join(process.cwd(), '.env'), path.join(__dirname, '../../../.env')];
  for (const envPath of candidates) {
    try {
      await fs.promises.access(envPath, fs.constants.F_OK);
      dotenv.config({ path: envPath });
      return;
    } catch {
      // try next candidate
    }
  }
  dotenv.config();
}

type TxRequestMessage = {
  state?: string;
  messageRaw?: string;
  txHash?: string;
};

type TxRequestBody = {
  txRequestId?: string;
  state?: string;
  version?: number;
  messages?: TxRequestMessage[];
};

function isCompleteSignatureHex(txHash: string | undefined): boolean {
  if (!txHash?.trim()) {
    return false;
  }
  const hex = txHash.trim().startsWith('0x') ? txHash.trim().slice(2) : txHash.trim();
  return /^[0-9a-fA-F]+$/i.test(hex) && hex.length === 130;
}

function pickSignedSnapshot(txRequests: TxRequestBody[]): TxRequestBody | undefined {
  const signed = txRequests.filter(
    (t) => t.messages?.[0]?.state === 'signed' && isCompleteSignatureHex(t.messages?.[0]?.txHash)
  );
  if (signed.length === 0) {
    return undefined;
  }
  return signed.reduce((best, cur) => ((cur.version ?? -1) >= (best.version ?? -1) ? cur : best));
}

function encodeDelegateBySigCalldata(params: {
  delegatee: string;
  nonce: string;
  expiry: string;
  v: number;
  r: string;
  s: string;
}): string {
  const iface = new ethers.utils.Interface([
    'function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)',
  ]);
  return iface.encodeFunctionData('delegateBySig', [
    ethers.utils.getAddress(params.delegatee),
    ethers.BigNumber.from(params.nonce),
    ethers.BigNumber.from(params.expiry),
    params.v,
    params.r,
    params.s,
  ]);
}

function tryParseDelegationFields(messageRaw: string):
  | {
      delegatee: string;
      nonce: string;
      expiry: string;
    }
  | undefined {
  try {
    const parsed = JSON.parse(messageRaw) as { message?: Record<string, unknown> };
    const msg = parsed.message;
    if (!msg || typeof msg !== 'object') {
      return undefined;
    }
    const { delegatee, nonce, expiry } = msg;
    if (typeof delegatee !== 'string' || typeof nonce === 'undefined' || typeof expiry === 'undefined') {
      return undefined;
    }
    return { delegatee, nonce: String(nonce), expiry: String(expiry) };
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  await loadEnv();

  const accessToken = process.env.BITGO_ACCESS_TOKEN ?? process.env.ACCESS_TOKEN;
  const walletId = process.env.WALLET_ID;
  const txRequestId = process.env.TX_REQUEST_ID;
  const coin = process.env.COIN;
  const env: EnvironmentName = process.env.BITGO_ENV === 'prod' ? 'prod' : 'test';

  if (!accessToken) {
    throw new Error('Set BITGO_ACCESS_TOKEN (or ACCESS_TOKEN) in .env');
  }
  if (!walletId) {
    throw new Error('Set WALLET_ID in .env');
  }
  if (!coin) {
    throw new Error('Set COIN in .env (e.g. eth, teth, hteth)');
  }
  if (!txRequestId) {
    throw new Error('Set TX_REQUEST_ID in .env (the id printed by step 1)');
  }

  const bitgo = new BitGoAPI({ accessToken, env });
  bitgo.register('eth', Eth.createInstance);
  bitgo.register('teth', Teth.createInstance);
  bitgo.register('hteth', Hteth.createInstance);
  bitgo.coin(coin);

  const res = (await bitgo
    .get(bitgo.url(`/wallet/${walletId}/txrequests`, 2))
    .query({ txRequestIds: txRequestId, latest: 'true' })
    .result()) as { txRequests: TxRequestBody[] };

  if (!res.txRequests?.length) {
    throw new Error(`No tx request found for id ${txRequestId}`);
  }

  const signed = pickSignedSnapshot(res.txRequests);
  const msg0 = signed?.messages?.[0];
  const txHash = msg0?.txHash;

  if (!signed || !msg0 || !txHash) {
    console.log('Message not signed yet, try again later.');
    return;
  }

  const sigHex = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  const { v, r, s } = ethers.utils.splitSignature(sigHex);

  console.log('');
  console.log('Signature retrieved.');
  console.log('');
  console.log(`  txRequestId : ${signed.txRequestId ?? txRequestId}`);
  console.log(`  v           : ${v}`);
  console.log(`  r           : ${r}`);
  console.log(`  s           : ${s}`);

  if (msg0.messageRaw) {
    const fields = tryParseDelegationFields(msg0.messageRaw);
    if (fields) {
      const calldata = encodeDelegateBySigCalldata({ ...fields, v, r, s });
      console.log('');
      console.log('delegateBySig calldata (broadcast as `data` to the token contract):');
      console.log(`  ${calldata}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
