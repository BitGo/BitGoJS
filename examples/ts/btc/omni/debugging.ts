import { Wallet } from '@bitgo/sdk-core';
import * as superagent from 'superagent';
import * as utxolib from '@bitgo/utxo-lib';
import { omniConfig } from './config';

export async function mintOmniAsset(wallet: Wallet, address: string, feeRate = 20_000): Promise<void> {
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

  const res = await superagent.get(`https://mempool.space/${omniConfig.MEMPOOL_PREFIX}api/address/${address}/utxo`);
  const unspent = res.body[0];
  const unspent_id = unspent.txid + ':' + unspent.vout;

  const omniScript = Buffer.concat([
    omniConfig.OMNI_PREFIX, // omni
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
