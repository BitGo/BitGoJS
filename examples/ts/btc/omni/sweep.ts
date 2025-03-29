/**
 * Sweep omni USDT to a single external address.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { Wallet } from 'modules/bitgo/src';
import { omniConfig } from './config';
import * as superagent from 'superagent';
import { getWallet, sendOmniAsset } from './index';
import * as fs from 'fs';

/**
 * Fund addresses with a small amount of BTC if they have no UTXOs.
 * @param wallet - The wallet to send the BTC from.
 * @param addresses - The addresses to fund.
 * @param feeRateSatPerKB - The fee rate to use for the transaction, in satoshis per kilo vbytes.
 * @param fundAmount - The amount to send to each address in satoshis.
 */
async function fundAddressesIfEmpty(wallet: Wallet, addresses: string[], feeRateSatPerKB: number, fundAmount = 2000) {
  const addressesToFund = addresses.filter(async (address) => {
    const res = await superagent.get(`https://mempool.space/${omniConfig.MEMPOOL_PREFIX}api/address/${address}/utxo`);
    if (res.statusCode !== 200) {
      throw new Error(`Failed to get utxos for ${address}`);
    }
    return res.body.length === 0;
  });
  const { txid } = await wallet.sendMany({
    recipients: addressesToFund.map((address) => ({ address, amount: fundAmount })),
    feeRate: feeRateSatPerKB,
    walletPassphrase: omniConfig.walletPassphrase,
  });
  console.log('Funded addresses', addressesToFund, 'with txid', txid);
}

/**
 * Reads a header-less CSV file with the format:
 * address,amount
 * e.g., 2NCeUg5WCxn692CfoSJ86gh2pKdN3jdk9a3,100000000
 * @param file - The path to the CSV file
 */
function readCsvForSenders(file: string): { address: string; baseAmount: bigint }[] {
  const data = fs.readFileSync(file, 'utf8').trim();
  const lines = data.split('\n');
  const senders: { address: string; baseAmount: bigint }[] = [];
  for (const line of lines) {
    const [address, amount] = line.split(',');
    senders.push({ address, baseAmount: BigInt(amount) });
  }
  return senders;
}

/*
 * Usage: npx ts-node btc/omni/sweep.ts,
 * and have a senders.csv file in the same directory with the format:
 * address,amount without header, where amount is 1e-8 dollars
 * e.g., 2NCeUg5WCxn692CfoSJ86gh2pKdN3jdk9a3,100000000 for 1 USDT contained within 2NCeUg5WCxn692CfoSJ86gh2pKdN3jdk9a3
 * */
async function main() {
  console.log('Starting...');
  const RECEIVE_ADDRESS = '';
  const ASSET_ID = 31;
  const FUNDING_AMOUNT = 5000;

  const feeRateRes = await superagent.get(`https://mempool.space/${omniConfig.MEMPOOL_PREFIX}api/v1/fees/recommended`);
  const feeRate = feeRateRes.body.fastestFee;

  const wallet = await getWallet();
  const senders = readCsvForSenders('senders.csv');
  await fundAddressesIfEmpty(
    wallet,
    senders.map((sender) => sender.address),
    feeRate * 1000,
    FUNDING_AMOUNT
  );
  await new Promise((resolve) => setTimeout(resolve, 30000));
  for (const sender of senders) {
    await sendOmniAsset(wallet, RECEIVE_ADDRESS, sender.address, sender.baseAmount, ASSET_ID, feeRate * 1000);
    console.log(`Sent ${sender.baseAmount} to ${sender.address}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
