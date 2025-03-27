/**
 * Sweep omni USDT to a single external address using express.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import * as superagent from 'superagent';
import * as fs from 'fs';
import { Buffer } from 'buffer';

const env = 'test' as 'test' | 'prod';

const accessToken = '';
const walletId = '';
const walletPassphrase = '';

const MEMPOOL_PREFIX = env === 'test' ? 'testnet4/' : '';
const OMNI_PREFIX = Buffer.from('6f6d6e69', 'hex');
// we can get away with 0x14 because the omni sends are always a fixed size
const OP_RETURN_PREFIX = Buffer.from('6a14', 'hex');
const BITGO_BASE_URL = 'http://localhost:3080';
const RECEIVE_ADDRESS = '';
const ASSET_ID = 31;
const FUNDING_AMOUNT = 5000;
const COIN_NAME = env === 'test' ? 'tbtc4' : 'btc';

/**
 * Fund addresses with a small amount of BTC if they have no UTXOs.
 * @param wallet - The wallet to send the BTC from.
 * @param addresses - The addresses to fund.
 * @param feeRateSatPerKB - The fee rate to use for the transaction, in satoshis per kilo vbytes.
 * @param fundAmount - The amount to send to each address in satoshis.
 */
async function fundAddressesIfEmpty(addresses: string[], feeRateSatPerKB: number, fundAmount = 2000) {
  const addressesToFund = addresses.filter(async (address) => {
    const res = await superagent.get(`https://mempool.space/${MEMPOOL_PREFIX}api/address/${address}/utxo`);
    if (res.statusCode !== 200) {
      throw new Error(`Failed to get utxos for ${address}`);
    }
    return res.body.length === 0;
  });
  const res = await superagent
    .post(`${BITGO_BASE_URL}/api/v2/${COIN_NAME}/wallet/${walletId}/sendmany`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      recipients: addressesToFund.map((address) => ({ address, amount: fundAmount })),
      feeRate: feeRateSatPerKB,
      walletPassphrase: walletPassphrase,
    });

  console.log('Funded addresses', addressesToFund, 'with response', res.body);
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

/**
 * Send an omni asset to a receiver. This function is used when you have sent an omni asset to a BitGo BTC wallet
 * and need to manually recover it
 * This function assumes that:
 *   - Your address has at least one unspent that is large enough to cover the transaction
 *   - The receiver address is a legacy or wrapped segwit ([reference](https://developers.bitgo.com/coins/address-types)) address, otherwise the transaction will not be recognized by the omni explorer.
 * @param receiver - The address to send the omni asset to (legacy address required).
 * @param sender - The address to send the omni asset from (legacy address required).
 * @param omniBaseAmount - The amount of the omni asset to send
 *   with respect to its smallest unit (e.g., microcents for USDT).
 *   Can be found at https://api.omniexplorer.info/v1/transaction/tx/{prev_txid}
 *   by multiplying `amount` by 10e8 if `divisible` is true.
 *   If `divisible` is false, `amount` is the amount of the omni asset to send
 * @param assetId - The id of the omni asset to send.
 *   Can be found at https://api.omniexplorer.info/v1/transaction/tx/{prev_txid}
 *   by looking at the `propertyid` field.
 *   This is 31 for USDT.
 * @param feeRateSatPerKB - The fee rate to use for the transaction, in satoshis per kilobyte.
 */
export async function sendOmniAsset(
  receiver: string,
  sender: string,
  omniBaseAmount: bigint,
  assetId = 31,
  feeRateSatPerKB = 20_000
): Promise<void> {
  if (!['1', '2', '3', 'n', 'm'].includes(receiver.slice(0, 1))) {
    throw new Error(
      'Omni has only been verified to work with legacy and wrapped segwit addresses - use other address formats at your own risk'
    );
  }

  const res = await superagent.get(`https://mempool.space/${MEMPOOL_PREFIX}api/address/${sender}/utxo`);
  const unspent = res.body[0];
  const unspent_id = unspent.txid + ':' + unspent.vout;

  // scriptPubkey: op_return omni simple_send tether amount
  const transactionType = Buffer.alloc(4);
  const assetHex = Buffer.alloc(4);
  assetHex.writeUInt32BE(assetId);
  const amountHex = Buffer.alloc(8);
  amountHex.writeBigUInt64BE(omniBaseAmount);
  const omniScript = Buffer.concat([OP_RETURN_PREFIX, OMNI_PREFIX, transactionType, assetHex, amountHex]).toString(
    'hex'
  );
  const bitgoRes = await superagent
    .post(`${BITGO_BASE_URL}/api/v2/${COIN_NAME}/wallet/${walletId}/sendmany`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
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
          address: `scriptPubkey:${omniScript}`,
        },
      ],
      isReplaceableByFee: true,
      feeRate: feeRateSatPerKB,
      walletPassphrase: walletPassphrase,
      // we must send change to our input address to ensure that omni won't
      // accidentally send our asset to the change address instead of the recipient
      changeAddress: sender,
      unspents: [unspent_id],
    });
  console.log('Omni asset sent: ', bitgoRes.body);
}

/*
 * Usage: npx ts-node btc/omni/sweepExpress.ts,
 * and have a senders.csv file in the same directory with the format:
 * address,amount without header, where amount is 1e-8 dollars
 * e.g., 2NCeUg5WCxn692CfoSJ86gh2pKdN3jdk9a3,100000000 for 1 USDT contained within 2NCeUg5WCxn692CfoSJ86gh2pKdN3jdk9a3
 * */
async function main() {
  console.log('Starting...');

  const feeRateRes = await superagent.get(`https://mempool.space/${MEMPOOL_PREFIX}api/v1/fees/recommended`);
  const feeRate = feeRateRes.body.fastestFee;

  const senders = readCsvForSenders('senders.csv');
  await fundAddressesIfEmpty(
    senders.map((sender) => sender.address),
    feeRate * 1000,
    FUNDING_AMOUNT
  );
  await new Promise((resolve) => setTimeout(resolve, 30000));
  for (const sender of senders) {
    await sendOmniAsset(RECEIVE_ADDRESS, sender.address, sender.baseAmount, ASSET_ID, feeRate * 1000);
    console.log(`Sent ${sender.baseAmount} from ${sender.address}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
