/**
 * ADA Sponsorship Transaction Script
 *
 * Builds and broadcasts a sponsored ADA transaction where:
 * - Sender sends funds to recipient
 * - Sponsor pays the transaction fee
 * - Both sender and sponsor sign the transaction
 * Example sponsor transaction: https://preprod.cardanoscan.io/transaction/2197f936e53414a21e4967b9530f8d40b644ed31d07364cca8ce4f424a3fb061?tab=utxo
 */

import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction } from '@bitgo/sdk-coin-ada';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';

const DEFAULT_CONFIG = {
  senderPrivateKey: '',
  senderAddress: '',
  sponsorPrivateKey: '',
  sponsorAddress: '',
  recipientAddress: '',
  amountToSend: '1000000',
  fee: '200000',
  minUtxoValue: '1000000',
};

const KOIOS_API = 'https://preprod.koios.rest/api/v1';

// ============================================================================
// Main: Build Sponsorship Transaction
// ============================================================================

/**
 * Build and sign a sponsorship transaction
 *
 * Transaction structure:
 * - Inputs: [sender UTXOs] + [sponsor UTXOs]
 * - Outputs: [recipient] + [sponsor change] + [sender change]
 */
async function buildSponsorshipTransaction() {
  // Step 1: Select unspents
  const unspents = await selectUnspents();

  // Step 2: Generate transaction with outputs
  const unsignedTx = await generateTransaction(unspents);

  // Step 3: Sign transaction
  const signedTx = signTransaction(unsignedTx);

  const txData = signedTx.toJson();
  const signedTxHex = signedTx.toBroadcastFormat();

  console.log(`Transaction ID: ${txData.id}`);
  console.log(`Fee: ${signedTx.getFee} lovelace`);

  // Step 4: Submit transaction
  try {
    const submittedTxHash = await submitTransaction(signedTxHex);
    console.log(`Submitted: https://preprod.cardanoscan.io/transaction/${submittedTxHash}`);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: unknown }; message?: string };
    const errMsg = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : axiosError.message;
    console.error(`Submission failed: ${errMsg}`);
    console.log(`Signed tx hex: ${signedTxHex}`);
  }

  return { txId: txData.id, signedTxHex, fee: signedTx.getFee };
}

// ============================================================================
// Entry Point
// ============================================================================

buildSponsorshipTransaction()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });

// ============================================================================
// Step 1: Select Unspents
// ============================================================================

/**
 * Select UTXOs from sender and sponsor addresses
 * - Sender UTXOs cover the transfer amount
 * - Sponsor UTXOs cover the fee
 */
async function selectUnspents(): Promise<SelectedUnspents> {
  const [senderInfo, sponsorInfo] = await Promise.all([
    getAddressInfo(DEFAULT_CONFIG.senderAddress),
    getAddressInfo(DEFAULT_CONFIG.sponsorAddress),
  ]);

  if (senderInfo.utxo_set.length === 0) throw new Error('Sender has no UTXOs');
  if (sponsorInfo.utxo_set.length === 0) throw new Error('Sponsor has no UTXOs');

  const amountToSend = BigInt(DEFAULT_CONFIG.amountToSend);
  const fee = BigInt(DEFAULT_CONFIG.fee);
  const minUtxoValue = BigInt(DEFAULT_CONFIG.minUtxoValue);

  // Select sender UTXOs to cover amount + change
  let senderInputTotal = BigInt(0);
  const senderInputs: UTXO[] = [];
  for (const utxo of senderInfo.utxo_set) {
    senderInputs.push(utxo);
    senderInputTotal += BigInt(utxo.value);
    if (senderInputTotal >= amountToSend + minUtxoValue) break;
  }
  if (senderInputTotal < amountToSend) {
    throw new Error(`Insufficient sender funds. Have: ${senderInputTotal}, Need: ${amountToSend}`);
  }

  // Select sponsor UTXOs to cover fee + change
  let sponsorInputTotal = BigInt(0);
  const sponsorInputs: UTXO[] = [];
  for (const utxo of sponsorInfo.utxo_set) {
    sponsorInputs.push(utxo);
    sponsorInputTotal += BigInt(utxo.value);
    if (sponsorInputTotal >= fee + minUtxoValue) break;
  }
  if (sponsorInputTotal < fee) {
    throw new Error(`Insufficient sponsor funds. Have: ${sponsorInputTotal}, Need: ${fee}`);
  }

  return { senderInputs, senderInputTotal, sponsorInputs, sponsorInputTotal };
}

// ============================================================================
// Step 2: Generate and Set Outputs
// ============================================================================

/**
 * Build unsigned transaction with inputs and outputs
 * Outputs: [recipient] + [sponsor change] + [sender change]
 */
async function generateTransaction(unspents: SelectedUnspents): Promise<Transaction> {
  const factory = new TransactionBuilderFactory(coins.get('tada'));
  const txBuilder = factory.getTransferBuilder();

  const currentSlot = await getTip();
  const ttl = currentSlot + 7200;

  const amountToSend = BigInt(DEFAULT_CONFIG.amountToSend);
  const fee = BigInt(DEFAULT_CONFIG.fee);
  const minUtxoValue = BigInt(DEFAULT_CONFIG.minUtxoValue);

  // Add sender inputs
  for (const utxo of unspents.senderInputs) {
    txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  }

  // Add sponsor inputs
  for (const utxo of unspents.sponsorInputs) {
    txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  }

  // Output 1: Recipient receives the transfer amount
  txBuilder.output({ address: DEFAULT_CONFIG.recipientAddress, amount: amountToSend.toString() });

  // Output 2: Sponsor change (sponsor input - fee)
  const sponsorChange = unspents.sponsorInputTotal - fee;
  if (sponsorChange >= minUtxoValue) {
    txBuilder.output({ address: DEFAULT_CONFIG.sponsorAddress, amount: sponsorChange.toString() });
  }

  // Output 3: Sender change (handled by changeAddress)
  const totalInputBalance = unspents.senderInputTotal + unspents.sponsorInputTotal;
  txBuilder.changeAddress(DEFAULT_CONFIG.senderAddress, totalInputBalance.toString());

  // Set TTL and fee
  txBuilder.ttl(ttl);
  txBuilder.fee(fee.toString());

  return (await txBuilder.build()) as Transaction;
}

// ============================================================================
// Step 3: Sign Transaction
// ============================================================================

/**
 * Sign transaction with both sender and sponsor keys
 */
function signTransaction(unsignedTx: Transaction): Transaction {
  const senderPrivKey = CardanoWasm.PrivateKey.from_bech32(DEFAULT_CONFIG.senderPrivateKey);
  const sponsorPrivKey = CardanoWasm.PrivateKey.from_bech32(DEFAULT_CONFIG.sponsorPrivateKey);

  const txHash = CardanoWasm.hash_transaction(unsignedTx.transaction.body());

  // Create witnesses for both parties
  const senderWitness = CardanoWasm.make_vkey_witness(txHash, senderPrivKey);
  const sponsorWitness = CardanoWasm.make_vkey_witness(txHash, sponsorPrivKey);

  // Build witness set
  const witnessSet = CardanoWasm.TransactionWitnessSet.new();
  const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
  vkeyWitnesses.add(senderWitness);
  vkeyWitnesses.add(sponsorWitness);
  witnessSet.set_vkeys(vkeyWitnesses);

  // Create signed transaction
  const signedCardanoTx = CardanoWasm.Transaction.new(
    unsignedTx.transaction.body(),
    witnessSet,
    unsignedTx.transaction.auxiliary_data()
  );

  unsignedTx.transaction = signedCardanoTx;
  return unsignedTx;
}

// ============================================================================
// Step 4: Submit Transaction
// ============================================================================

/**
 * Submit signed transaction to the blockchain
 */
async function submitTransaction(signedTxHex: string): Promise<string> {
  const bytes = Uint8Array.from(Buffer.from(signedTxHex, 'hex'));
  const response = await axios.post(`${KOIOS_API}/submittx`, bytes, {
    headers: { 'Content-Type': 'application/cbor' },
    timeout: 30000,
  });
  return response.data;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch UTXOs for an address from Koios API
 */
async function getAddressInfo(address: string): Promise<AddressInfo> {
  try {
    const response = await axios.post(
      `${KOIOS_API}/address_info`,
      { _addresses: [address] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    if (!response.data || response.data.length === 0) {
      return { balance: '0', utxo_set: [] };
    }

    const data = response.data[0];
    return {
      balance: data.balance || '0',
      utxo_set: (data.utxo_set || []).map((utxo: { tx_hash: string; tx_index: number; value: string }) => ({
        tx_hash: utxo.tx_hash,
        tx_index: utxo.tx_index,
        value: utxo.value,
      })),
    };
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    if (axiosError.response?.status === 400) {
      return { balance: '0', utxo_set: [] };
    }
    throw new Error(`Failed to fetch address info: ${axiosError.message}`);
  }
}

/**
 * Get current blockchain tip for TTL calculation
 */
async function getTip(): Promise<number> {
  const response = await axios.get(`${KOIOS_API}/tip`, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  if (!response.data || response.data.length === 0) {
    throw new Error('Failed to get blockchain tip');
  }
  return response.data[0].abs_slot;
}

// ============================================================================
// Types
// ============================================================================

interface UTXO {
  tx_hash: string;
  tx_index: number;
  value: string;
}

interface AddressInfo {
  balance: string;
  utxo_set: UTXO[];
}

interface SelectedUnspents {
  senderInputs: UTXO[];
  senderInputTotal: bigint;
  sponsorInputs: UTXO[];
  sponsorInputTotal: bigint;
}
