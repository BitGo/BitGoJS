/* eslint-disable no-console */
/**
 * Create a delegation request for an OpenZeppelin ERC20Votes-style
 * `delegateBySig` from a BitGo custodial wallet.
 *
 * Step 1 of the flow described in
 * `examples/docs/erc20-votes-delegate-by-sig.md`. Prints a `txRequestId`
 * that you copy into `.env` as `TX_REQUEST_ID` for step 2
 * (`examples/ts/eth/get-erc20-votes-delegation-signature.ts`).
 *
 * Run from the repo root:
 *
 *   npx tsx examples/ts/eth/create-erc20-votes-delegation-txrequest.ts
 *
 * Required env:
 *   BITGO_ACCESS_TOKEN (or ACCESS_TOKEN)
 *   WALLET_ID
 *   COIN              — must match the wallet's chain (e.g. eth, teth, hteth)
 *   DELEGATEE         — address that will vote (defaults to the wallet's
 *                       receive address for self-delegation)
 *
 * Nonce — set one of:
 *   ETH_RPC_URL — JSON-RPC URL for the token chain; the script calls
 *                 `nonces(delegator)` on the token contract.
 *   NONCE       — manual override (wins over ETH_RPC_URL).
 *
 * Domain — set one of:
 *   EIP712_DOMAIN_JSON — { name, version, chainId, verifyingContract } from
 *                        the token's on-chain `eip712Domain()`.
 *   Or run with `BITGO_ENV=prod COIN=eth` to use the WLFI mainnet defaults.
 *
 * Optional:
 *   BITGO_ENV — `test` (default) or `prod`
 *   EXPIRY    — unix seconds; default: now + 1h
 *
 * Copyright 2026, BitGo, Inc. All Rights Reserved.
 */

import path from 'path';

import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import {
  Erc20VotesDelegationMessageBuilder,
  wlfiEthereumMainnetDelegationDomain,
  type Erc20VotesDelegationDomain,
} from '../../../modules/abstract-eth/src/index';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Eth, Hteth, Teth } from '@bitgo/sdk-coin-eth';
import { MessageStandardType, type EnvironmentName } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { ethers } from 'ethers';

const NONCES_ABI = ['function nonces(address owner) view returns (uint256)'];

async function fetchTokenNonce(rpcUrl: string, tokenAddress: string, delegator: string): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const token = new ethers.Contract(tokenAddress, NONCES_ABI, provider);
  const nonce = (await token.nonces(delegator)) as ethers.BigNumber;
  return nonce.toString();
}

async function resolveNonce(domainContract: string, delegator: string): Promise<string> {
  const manual = process.env.NONCE?.trim();
  if (manual) {
    return manual;
  }
  const rpcUrl = process.env.ETH_RPC_URL?.trim();
  if (!rpcUrl) {
    throw new Error('Set ETH_RPC_URL (to fetch nonces(delegator)) or NONCE in .env');
  }
  return fetchTokenNonce(rpcUrl, domainContract, delegator);
}

function parseDelegationDomainFromEnv(coin: string, bitgoEnv: EnvironmentName): Erc20VotesDelegationDomain {
  const raw = process.env.EIP712_DOMAIN_JSON?.trim();
  if (raw) {
    const d = JSON.parse(raw) as Record<string, unknown>;
    for (const k of ['name', 'version', 'chainId', 'verifyingContract']) {
      if (d[k] === undefined) {
        throw new Error(`EIP712_DOMAIN_JSON must include "${k}" (from the token's eip712Domain())`);
      }
    }
    return {
      name: String(d.name),
      version: String(d.version),
      chainId: Number(d.chainId),
      verifyingContract: ethers.utils.getAddress(String(d.verifyingContract)),
    };
  }
  if (coin === 'eth' && bitgoEnv === 'prod') {
    return wlfiEthereumMainnetDelegationDomain();
  }
  throw new Error('Set EIP712_DOMAIN_JSON in .env (or use BITGO_ENV=prod COIN=eth for WLFI mainnet defaults)');
}

async function main(): Promise<void> {
  const accessToken = process.env.BITGO_ACCESS_TOKEN ?? process.env.ACCESS_TOKEN;
  const walletId = process.env.WALLET_ID;
  const coin = process.env.COIN;
  const env: EnvironmentName = process.env.BITGO_ENV === 'prod' ? 'prod' : 'test';
  const expiry = process.env.EXPIRY ?? String(Math.floor(Date.now() / 1000) + 3600);

  if (!accessToken) {
    throw new Error('Set BITGO_ACCESS_TOKEN (or ACCESS_TOKEN) in .env');
  }
  if (!walletId) {
    throw new Error('Set WALLET_ID in .env');
  }
  if (!coin) {
    throw new Error('Set COIN in .env (e.g. eth, teth, hteth)');
  }

  const domain = parseDelegationDomainFromEnv(coin, env);

  const bitgo = new BitGoAPI({ env });
  bitgo.register('eth', Eth.createInstance);
  bitgo.register('teth', Teth.createInstance);
  bitgo.register('hteth', Hteth.createInstance);
  await bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const delegator = wallet.receiveAddress();
  if (!delegator) {
    throw new Error('Wallet has no receiveAddress yet. Create or fund an address first.');
  }
  const delegatee = process.env.DELEGATEE?.trim() || delegator;

  const nonce = await resolveNonce(domain.verifyingContract, delegator);

  const builder = new Erc20VotesDelegationMessageBuilder(coins.get(coin));
  const message = await builder.buildFromDelegation({
    domain,
    message: { delegatee, nonce, expiry },
  });
  const messageEncoded = (await message.getSignablePayload()).toString('hex');

  const body = {
    intent: {
      intentType: 'signTypedStructuredData',
      isTss: true,
      messageRaw: message.getPayload(),
      messageEncoded,
      messageStandardType: MessageStandardType.EIP712,
    },
    apiVersion: 'full',
  };

  const txRequest = (await bitgo
    .post(bitgo.url(`/wallet/${walletId}/txrequests`, 2))
    .send(body)
    .result()) as { txRequestId?: string; state?: string };

  console.log('');
  console.log('Tx request created.');
  console.log('');
  console.log(`  txRequestId : ${txRequest.txRequestId ?? '<not returned>'}`);
  console.log(`  state       : ${txRequest.state ?? 'n/a'}`);
  console.log(`  delegator   : ${delegator}`);
  console.log(`  delegatee   : ${delegatee}`);
  console.log(`  nonce       : ${nonce}`);
  console.log(`  expiry      : ${expiry}`);
  console.log('');
  console.log('Next: add the txRequestId above to your .env as TX_REQUEST_ID,');
  console.log('then run get-erc20-votes-delegation-signature.ts to retrieve the');
  console.log('signature once BitGo has signed the message.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
