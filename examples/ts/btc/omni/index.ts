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
const MEMPOOL_PREFIX = omniConfig.coin === 'tbtc4' ? 'testnet4/' : '';
const AMOUNT = 729100000n;
const ASSET_ID = 31;
const OMNI_PREFIX = Buffer.from('6f6d6e69', 'hex');

async function getWallet() {
  return await omniConfig.sdk.coin(omniConfig.coin).wallets().get({ id: omniConfig.walletId });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mintOmniAsset(wallet: Wallet, address: string, feeRate = 20_000) {
  const transactionVersion = Buffer.alloc(2);
  const transactionType = Buffer.alloc(2);
  transactionType.writeUint16BE(50);
  const ecoSystem = Buffer.alloc(1);
  ecoSystem.writeInt8(2);
  const propertyType = Buffer.alloc(2);
  propertyType.writeUint16BE(2);
  const previousPropertyID = Buffer.alloc(4);

  const category = Buffer.from('Other\0');
  const subCategory = Buffer.from('Other\0');
  const propertyTitle = Buffer.from('Testcoin\0');
  const propertyURL = Buffer.from('https://example.com\0');
  const propertyData = Buffer.from('\0');

  const amount = Buffer.alloc(8);
  amount.writeBigUint64BE(BigInt(100000 * 10 ** 8));

  const res = await superagent.get(`https://mempool.space/${MEMPOOL_PREFIX}api/address/${address}/utxo`);
  const unspent = res.body[0];
  const unspent_id = unspent.txid + ':' + unspent.vout;

  const omniScript = Buffer.concat([
    OMNI_PREFIX, // omni
    transactionVersion,
    transactionType,
    ecoSystem,
    propertyType,
    previousPropertyID,
    category,
    subCategory,
    propertyTitle,
    propertyURL,
    propertyData,
    amount,
  ]);

  const output = utxolib.payments.embed({ data: [omniScript], network: utxolib.networks.bitcoin }).output;
  if (!output) {
    throw new Error('Invalid output');
  }
  const script = output.toString('hex');
  const tx = await wallet.sendMany({
    recipients: [
      {
        amount: '0',
        address: `scriptPubkey:${script}`,
      },
    ],
    isReplaceableByFee: true,
    feeRate,
    walletPassphrase: omniConfig.walletPassphrase,
    changeAddress: address,
    unspents: [unspent_id],
  });
  console.log('Omni asset created: ', tx);
}

async function sendOmniAsset(
  wallet: Wallet,
  receiver: string,
  sender: string,
  amountMicroCents: bigint,
  assetId = 31,
  feeRate = 20_000
) {
  const res = await superagent.get(`https://mempool.space/${MEMPOOL_PREFIX}/api/address/${sender}/utxo`);
  const unspent = res.body[0];
  const unspent_id = unspent.txid + ':' + unspent.vout;

  // scriptPubkey: op_return omni simple_send tether amount
  const transactionType = Buffer.alloc(4);
  const assetHex = Buffer.alloc(4);
  assetHex.writeUInt32BE(assetId);
  const amountHex = Buffer.alloc(8);
  amountHex.writeBigUInt64BE(amountMicroCents);
  const omniScript = Buffer.concat([OMNI_PREFIX, transactionType, assetHex, amountHex]);
  const output = utxolib.payments.embed({ data: [omniScript], network: omniConfig.network }).output;
  if (!output) {
    throw new Error('Invalid output');
  }
  const script = output.toString('hex');
  const tx = await wallet.sendMany({
    recipients: [
      {
        amount: '546',
        address: receiver,
      },
      {
        amount: '0',
        address: `scriptPubkey:${script}`,
      },
    ],
    isReplaceableByFee: true,
    feeRate,
    walletPassphrase: omniConfig.walletPassphrase,
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

  const feeRateRes = await superagent.get(`https://mempool.space/${MEMPOOL_PREFIX}api/v1/fees/recommended`);
  const feeRate = feeRateRes.body.fastestFee;

  const wallet = await getWallet();
  // we multiply feeRate by 1000 because mempool returns sat/vB and BitGo uses sat/kvB
  await sendOmniAsset(wallet, RECEIVE_ADDRESS, SEND_ADDRESS, AMOUNT, ASSET_ID, feeRate * 1000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
