/**
 * Send or create an omni asset from a multi-sig wallet at BitGo.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { Wallet } from 'modules/bitgo/src';
import { omniConfig } from './config';
import * as superagent from 'superagent';
import * as utxolib from '@bitgo/utxo-lib';

const RECEIVE_ADDRESS = '';
const SEND_ADDRESS = '';
const AMOUNT = 729100000n;
const ASSET_ID = 31;

async function getWallet() {
  return await omniConfig.sdk.coin(omniConfig.coin).wallets().get({ id: omniConfig.walletId });
}

async function sendOmniAsset(
  wallet: Wallet,
  receiver: string,
  sender: string,
  amountMicroCents: bigint,
  assetId = 31,
  feeRate = 20_000
) {
  if (!['1', 'n', 'm'].includes(receiver.slice(0, 1))) {
    throw new Error(
      'Omni has only been verified to work with legacy addresses - use other address formats at your own risk'
    );
  }

  const res = await superagent.get(`https://mempool.space/${omniConfig.MEMPOOL_PREFIX}api/address/${sender}/utxo`);
  const unspent = res.body[0];
  const unspent_id = unspent.txid + ':' + unspent.vout;

  // scriptPubkey: op_return omni simple_send tether amount
  const transactionType = Buffer.alloc(4);
  const assetHex = Buffer.alloc(4);
  assetHex.writeUInt32BE(assetId);
  const amountHex = Buffer.alloc(8);
  amountHex.writeBigUInt64BE(amountMicroCents);
  const omniScript = Buffer.concat([omniConfig.OMNI_PREFIX, transactionType, assetHex, amountHex]);
  const output = utxolib.payments.embed({ data: [omniScript], network: omniConfig.network }).output;
  if (!output) {
    throw new Error('Invalid output');
  }
  const script = output.toString('hex');
  const tx = await wallet.sendMany({
    recipients: [
      // this signals the receiver of the omni asset
      // we are not actually trying to send BTC to the receiver
      // so we send the minimum amount above the dust limit
      {
        amount: '546',
        address: receiver,
      },
      // this is the actual script that the omni layer reads for the send
      {
        amount: '0',
        address: `scriptPubkey:${script}`,
      },
    ],
    isReplaceableByFee: true,
    feeRate,
    walletPassphrase: omniConfig.walletPassphrase,
    // we must send change to our input address to ensure that omni won't
    // accidentally send our asset to the change address instead of the recipient
    changeAddress: sender,
    unspents: [unspent_id],
  });
  console.log('Omni asset sent: ', tx);
}

/*
 * Usage: npx ts-node btc/omni/index.ts
 * */
async function main() {
  console.log('Starting...');

  const feeRateRes = await superagent.get(`https://mempool.space/${omniConfig.MEMPOOL_PREFIX}api/v1/fees/recommended`);
  const feeRate = feeRateRes.body.fastestFee;

  const wallet = await getWallet();
  // we multiply feeRate by 1000 because mempool returns sat/vB and BitGo uses sat/kvB
  await sendOmniAsset(wallet, RECEIVE_ADDRESS, SEND_ADDRESS, AMOUNT, ASSET_ID, feeRate * 1000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
