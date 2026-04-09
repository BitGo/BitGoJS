/**
 * ADA UTXO Split Script
 * Splits UTXOs into 2 ADA outputs (last output may be 1-3 ADA)
 * Example split transaction: https://preprod.cardanoscan.io/transaction/f7094b57e3729c6fc2908f63be1d8e6ab91af587ae8e8112faea5c74f2e57155?tab=utxo
 */

import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction } from '@bitgo/sdk-coin-ada';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';

const CONFIG = {
  privateKey: '',
  address: '',
  denominationAda: 2,
};

const KOIOS_API = 'https://preprod.koios.rest/api/v1';
const ADA = 1_000_000;

async function splitUtxos() {
  // Step 1: Select unspents
  const { utxos, total } = await selectUnspents();
  if (!utxos.length) throw new Error('No UTXOs found');

  const numOutputs = Math.floor(Number(total) / ADA / CONFIG.denominationAda);
  if (numOutputs < 2) throw new Error('Insufficient funds for split');

  // Step 2: Generate transaction
  const unsignedTx = await generateTransaction(utxos, total);

  // Step 3: Sign transaction
  const signedTx = signTransaction(unsignedTx);

  // Step 4: Submit transaction
  await submitTransaction(signedTx);
}

splitUtxos()
  .then(() => process.exit(0))
  .catch((e: Error) => {
    console.error('Error:', e.message);
    process.exit(1);
  });

interface UTXO {
  tx_hash: string;
  tx_index: number;
  value: string;
}

/**
 * Step 1: Select unspents
 * Fetches all UTXOs for the address and calculates total balance
 */
async function selectUnspents(): Promise<{ utxos: UTXO[]; total: bigint }> {
  const response = await axios.post(
    `${KOIOS_API}/address_info`,
    { _addresses: [CONFIG.address] },
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );

  const utxos: UTXO[] = response.data?.[0]?.utxo_set || [];
  const total = utxos.reduce((sum, u) => sum + BigInt(u.value), BigInt(0));

  console.log(`Step 1: Found ${utxos.length} UTXOs, total ${Number(total) / ADA} ADA`);
  return { utxos, total };
}

/**
 * Step 2: Generate transaction with outputs
 * Creates (N-1) outputs of exact denomination, last output handled by changeAddress
 */
async function generateTransaction(utxos: UTXO[], total: bigint): Promise<Transaction> {
  const denom = BigInt(CONFIG.denominationAda * ADA);
  const numOutputs = Math.floor(Number(total) / ADA / CONFIG.denominationAda);

  const factory = new TransactionBuilderFactory(coins.get('tada'));
  const txBuilder = factory.getTransferBuilder();

  // Add inputs
  utxos.forEach((u) => txBuilder.input({ transaction_id: u.tx_hash, transaction_index: u.tx_index }));

  // Add (N-1) outputs of exact denomination
  for (let i = 0; i < numOutputs - 1; i++) {
    txBuilder.output({ address: CONFIG.address, amount: denom.toString() });
  } 

  // Last output handled by changeAddress (will be ~1-3 ADA)
  txBuilder.changeAddress(CONFIG.address, total.toString());

  const tip = await axios.get(`${KOIOS_API}/tip`, { timeout: 30000 });
  txBuilder.ttl(tip.data[0].abs_slot + 7200);

  const tx = (await txBuilder.build()) as Transaction;
  console.log(`Step 2: Built tx with ${numOutputs} outputs, fee ${Number(tx.getFee) / ADA} ADA`);
  return tx;
}

/**
 * Step 3: Sign transaction
 * Signs the transaction with the private key
 */
function signTransaction(tx: Transaction): Transaction {
  const priv = CardanoWasm.PrivateKey.from_bech32(CONFIG.privateKey);
  const hash = CardanoWasm.hash_transaction(tx.transaction.body());

  const witnessSet = CardanoWasm.TransactionWitnessSet.new();
  const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
  vkeyWitnesses.add(CardanoWasm.make_vkey_witness(hash, priv));
  witnessSet.set_vkeys(vkeyWitnesses);

  tx.transaction = CardanoWasm.Transaction.new(tx.transaction.body(), witnessSet, tx.transaction.auxiliary_data());

  console.log(`Step 3: Signed tx ${tx.toJson().id}`);
  return tx;
}

/**
 * Step 4: Submit transaction
 * Broadcasts the signed transaction to the network
 */
async function submitTransaction(tx: Transaction): Promise<void> {
  const signedTxHex = tx.toBroadcastFormat();
  const bytes = Uint8Array.from(Buffer.from(signedTxHex, 'hex'));

  await axios.post(`${KOIOS_API}/submittx`, bytes, {
    headers: { 'Content-Type': 'application/cbor' },
    timeout: 30000,
  });

  console.log(`Step 4: https://preprod.cardanoscan.io/transaction/${tx.toJson().id}`);
}
