/**
 * Send or create an omni asset from a multi-sig wallet at BitGo.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { Wallet } from 'modules/bitgo/src';
import { omniConfig } from './config';
import * as superagent from 'superagent';

const RECEIVE_ADDRESS = '';
const SEND_ADDRESS = '';
const NETWORK = omniConfig.coin === 'tbtc4/' ? 'testnet4' : '';
const AMOUNT = 1234;
const ASSET_ID = 31;

async function getWallet() {
  return await omniConfig.sdk.coin(omniConfig.coin).wallets().get({ id: omniConfig.walletId });
}

function strToHex(s: string) {
  return (
    s
      .split('')
      .map((c) => c.charCodeAt(0).toString(16))
      .join('') + '0'
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mintOmniAsset(wallet: Wallet, address: string, feeRate = 20_000) {
  const transactionVersion = '0000';
  const trnasactionType = (50).toString(16).padStart(4, '0');
  const ecoSystem = '02';
  const propertyType = (2).toString(16).padStart(4, '0');
  const previousPropertyID = '00000000';
  const category = strToHex('Other\0');
  const subCategory = strToHex('Other\0');
  const propertyTitle = strToHex('Testcoin\0');
  const propertyURL = strToHex('https://example.com\0');
  const propertyData = strToHex('\0');
  const amount = (100000 * 10**8).toString(16).padStart(16, '0');

  const res = await superagent.get(`https://mempool.space/${NETWORK}api/address/${address}/utxo`);
  const unspent = res.body[0];
  const unspent_id = unspent.txid + ':' + unspent.vout;

  const omniScript = [
    '6f6d6e69', // omni
    transactionVersion,
    trnasactionType,
    ecoSystem,
    propertyType,
    previousPropertyID,
    category,
    subCategory,
    propertyTitle,
    propertyURL,
    propertyData,
    amount,
  ].join('');

  // scriptPubkey: op_return omni simple_send tether amount
  const script =
    'scriptPubkey:' +
    [
      '6a', // op_return
      (omniScript.length / 2).toString(16).padStart(2, '0'),
      omniScript,
    ].join('');
  const tx = await wallet.sendMany({
    recipients: [
      {
        amount: '0',
        address: script,
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
  amountMicroCents: number,
  assetId = 31,
  feeRate = 20_000
) {
  // convert amountMicroCents to hex string of length 16
  const amountHex = amountMicroCents.toString(16).padStart(16, '0');

  const assetHex = assetId.toString(16).padStart(8, '0');

  const res = await superagent.get(`https://mempool.space/${NETWORK}/api/address/${sender}/utxo`);
  const unspent = res.body[0];
  const unspent_id = unspent.txid + ':' + unspent.vout;

  // scriptPubkey: op_return omni simple_send tether amount
  const script = ('scriptPubkey: 6a14 6f6d6e69 00000000' + assetHex + amountHex).split(' ').join('');
  const tx = await wallet.sendMany({
    recipients: [
      {
        amount: '546',
        address: receiver,
      },
      {
        amount: '0',
        address: script,
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

  const feeRateRes = await superagent.get(`https://mempool.space/${NETWORK}api/v1/fees/recommended`);
  const feeRate = feeRateRes.body.fastestFee;

  const wallet = await getWallet();
  // we multiply feeRate by 1000 because mempool returns sat/vB and BitGo uses sat/kvB
  await sendOmniAsset(wallet, RECEIVE_ADDRESS, SEND_ADDRESS, AMOUNT, ASSET_ID, feeRate * 1000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
