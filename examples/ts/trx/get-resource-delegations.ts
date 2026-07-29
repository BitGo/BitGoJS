/**
 * Get resource delegations for a TRX wallet at BitGo.
 *
 * This tool will help you see how to use the BitGo SDK to query
 * outgoing and incoming ENERGY/BANDWIDTH delegations for a wallet.
 *
 * Prerequisites:
 *   - Valid BitGo access token
 *   - TRX wallet ID
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Ttrx } from '@bitgo/sdk-coin-trx';
require('dotenv').config({ path: '../../../.env' });

// TODO: change to 'production' for mainnet
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

// TODO: change to 'trx' for mainnet
const coin = 'ttrx';
bitgo.register(coin, Ttrx.createInstance);

const walletId = '';

// TODO: (optional) filter by delegation type
const type: 'outgoing' | 'incoming' | undefined = undefined;

// TODO: (optional) filter by resource type (e.g. 'ENERGY', 'energy', 'BANDWIDTH', 'bandwidth')
const resource: string | undefined = undefined;

// TODO: (optional) maximum number of results to return
const limit: number | undefined = undefined;

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const result = await wallet.getResourceDelegations({ type, resource, limit });

  console.log('Wallet Address:', result.address);
  console.log('Coin:', result.coin);
  console.log('Outgoing Delegations:', result.delegations.outgoing.length);
  console.log('Incoming Delegations:', result.delegations.incoming.length);
  console.log('Resource Delegations:', JSON.stringify(result, null, 2));
}

main().catch((e) => console.error(e));
