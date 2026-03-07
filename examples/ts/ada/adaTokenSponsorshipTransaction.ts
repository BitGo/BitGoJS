/**
 * ADA Token Sponsorship Transaction Script (using BitGo SDK)
 *
 * Builds and broadcasts a sponsored token transfer where:
 * - Sender sends a specific amount of a token to recipient
 * - Remaining tokens and ADA go back to sender as change
 * - Fee is paid by a separate sponsor address
 * - Fee change goes back to sponsor address
 * - Both sender and sponsor sign the transaction
 *
 * Uses BitGo SDK's new sponsorAddress() method for fee sponsorship support.
 */

import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory, Transaction } from '@bitgo/sdk-coin-ada';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  // Sender (address with tokens)
  senderPrivateKey:
    '',
  senderAddress:
    '',
  // Sponsor (pays transaction fee)
  sponsorPrivateKey:
    '',
  sponsorAddress:
    '',
  // Recipient (receives token)
  recipientAddress:
    '',
  // Token to transfer
  tokenToSend: {
    policyId: '', // Will be auto-detected from sender's UTXOs
    assetName: '5741544552', // "WATER" in hex (uppercase)
    quantity: '4', // Send all remaining WATER tokens
    fingerprint: '', // Will be auto-detected
  },
  // Transaction parameters
  minUtxoValue: '1000000', // Min ADA for change output
  minUtxoForToken: '1500000', // Min ADA per token output (MIN_ADA_FOR_ONE_ASSET)
};

const KOIOS_API = 'https://preprod.koios.rest/api/v1';

// ============================================================================
// Main: Build Token Sponsorship Transaction
// ============================================================================

/**
 * Build and sign a sponsored token transaction using BitGo SDK
 *
 * Transaction structure:
 * - Inputs: [sender UTXOs with token] + [sponsor UTXOs]
 * - Outputs: [token to recipient] + [token change to sender] + [ADA change to sender] + [sponsor fee change]
 */
async function buildTokenSponsorshipTransaction() {
  // Initialize BitGo SDK factory
  const factory = new TransactionBuilderFactory(coins.get('tada'));

  // Step 1: Select unspents (sender tokens + sponsor UTXOs)
  const unspents = await selectUnspents();

  // Step 2: Build transaction using SDK with sponsorAddress
  const unsignedTx = await buildTransaction(factory, unspents);

  // Step 3: Sign transaction with both sender and sponsor
  const signedTx = signTransaction(unsignedTx);

  const txData = signedTx.toJson();
  // eslint-disable-next-line no-console
  console.log(`Transaction ID: ${txData.id}`);
  // eslint-disable-next-line no-console
  console.log(`Fee: ${signedTx.getFee} lovelace`);

  // Step 4: Submit transaction
  try {
    const submittedTxHash = await submitTransaction(signedTx.toBroadcastFormat());
    // eslint-disable-next-line no-console
    console.log(`Submitted: https://preprod.cardanoscan.io/transaction/${submittedTxHash}`);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: unknown }; message?: string };
    const errMsg = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : axiosError.message;
    // eslint-disable-next-line no-console
    console.error(`Submission failed: ${errMsg}`);
    // eslint-disable-next-line no-console
    console.log(`Signed tx hex: ${signedTx.toBroadcastFormat()}`);
  }

  return { txId: txData.id, signedTxHex: signedTx.toBroadcastFormat() };
}

// ============================================================================
// Entry Point
// ============================================================================

buildTokenSponsorshipTransaction()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    // eslint-disable-next-line no-console
    console.error('Error:', error.message);
    process.exit(1);
  });

// ============================================================================
// Step 1: Select Unspents
// ============================================================================

/**
 * Select UTXOs from sender and sponsor addresses
 * - Sender UTXOs include the token to transfer
 * - Sponsor UTXOs cover the fee + change
 */
async function selectUnspents(): Promise<SelectedUnspents> {
  const [senderInfo, sponsorInfo] = await Promise.all([
    getAddressInfo(DEFAULT_CONFIG.senderAddress),
    getAddressInfo(DEFAULT_CONFIG.sponsorAddress),
  ]);

  if (senderInfo.utxo_set.length === 0) throw new Error('Sender has no UTXOs');
  if (sponsorInfo.utxo_set.length === 0) throw new Error('Sponsor has no UTXOs');

  const minUtxoValue = BigInt(DEFAULT_CONFIG.minUtxoValue);
  const minUtxoForToken = BigInt(DEFAULT_CONFIG.minUtxoForToken);

  // Find UTXOs containing the target token
  let senderInputTotal = BigInt(0);
  const senderInputs: UTXOWithAssets[] = [];
  const senderAssetList: Record<string, TokenAssetWithFingerprint> = {};
  let targetTokenFound = false;
  let targetTokenTotal = BigInt(0);
  let detectedPolicyId = DEFAULT_CONFIG.tokenToSend.policyId;
  let detectedFingerprint = DEFAULT_CONFIG.tokenToSend.fingerprint;

  for (const utxo of senderInfo.utxo_set) {
    let hasTargetToken = false;

    // Check if UTXO contains the target token
    if (utxo.asset_list && utxo.asset_list.length > 0) {
      for (const asset of utxo.asset_list) {
        // Match by asset name (water token)
        if (asset.asset_name === DEFAULT_CONFIG.tokenToSend.assetName) {
          hasTargetToken = true;
          targetTokenFound = true;
          targetTokenTotal += BigInt(asset.quantity);
          if (!detectedPolicyId) {
            detectedPolicyId = asset.policy_id;
          }
          if (!detectedFingerprint && asset.fingerprint) {
            detectedFingerprint = asset.fingerprint;
          }
        }

        // Build sender asset list for SDK (using fingerprint as key)
        const fingerprint = asset.fingerprint || `${asset.policy_id}.${asset.asset_name}`;
        if (senderAssetList[fingerprint]) {
          senderAssetList[fingerprint].quantity = (
            BigInt(senderAssetList[fingerprint].quantity) + BigInt(asset.quantity)
          ).toString();
        } else {
          senderAssetList[fingerprint] = {
            policy_id: asset.policy_id,
            asset_name: asset.asset_name || '',
            quantity: asset.quantity,
            fingerprint,
          };
        }
      }
    }

    // Only include UTXOs that have the target token
    // Additional ADA UTXOs will be selected later only if needed for token change
    if (hasTargetToken) {
      senderInputs.push(utxo);
      senderInputTotal += BigInt(utxo.value);
    }
  }

  if (!targetTokenFound) {
    throw new Error(`Token with asset_name ${DEFAULT_CONFIG.tokenToSend.assetName} not found in sender's UTXOs`);
  }

  const amountToSend = BigInt(DEFAULT_CONFIG.tokenToSend.quantity);
  if (targetTokenTotal < amountToSend) {
    throw new Error(`Insufficient token balance. Have: ${targetTokenTotal}, Need: ${amountToSend}`);
  }

  // Check if we need token change output (not sending all tokens)
  const needsTokenChange = targetTokenTotal > amountToSend;

  // If we need token change, we need extra ADA for the change output
  // Select additional ADA UTXOs from sender if needed
  if (needsTokenChange) {
    const adaNeededForChange = minUtxoForToken + minUtxoValue; // Token change + ADA change outputs
    for (const utxo of senderInfo.utxo_set) {
      // Skip UTXOs already selected (those with target token)
      if (senderInputs.some((s) => s.tx_hash === utxo.tx_hash && s.tx_index === utxo.tx_index)) {
        continue;
      }
      // Only select pure ADA UTXOs (no assets)
      if (!utxo.asset_list || utxo.asset_list.length === 0) {
        senderInputs.push(utxo);
        senderInputTotal += BigInt(utxo.value);
        if (senderInputTotal >= adaNeededForChange) break;
      }
    }
  }

  // Update the detected policy ID and fingerprint
  DEFAULT_CONFIG.tokenToSend.policyId = detectedPolicyId;
  DEFAULT_CONFIG.tokenToSend.fingerprint = detectedFingerprint;

  // Select sponsor UTXOs to cover fee + change (estimate ~250000 lovelace fee)
  const estimatedFee = BigInt(250000);
  let sponsorInputTotal = BigInt(0);
  const sponsorInputs: UTXOWithAssets[] = [];
  for (const utxo of sponsorInfo.utxo_set) {
    sponsorInputs.push(utxo);
    sponsorInputTotal += BigInt(utxo.value);
    if (sponsorInputTotal >= estimatedFee + minUtxoValue) break;
  }

  if (sponsorInputTotal < estimatedFee) {
    throw new Error(`Insufficient sponsor funds. Have: ${sponsorInputTotal}, Need: ${estimatedFee}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Sender inputs: ${senderInputs.length} UTXOs, Total: ${senderInputTotal} lovelace`);
  // eslint-disable-next-line no-console
  console.log(
    `Target token (${DEFAULT_CONFIG.tokenToSend.assetName}): ${targetTokenTotal} available, sending ${amountToSend}`,
  );
  // eslint-disable-next-line no-console
  console.log(`Sponsor inputs: ${sponsorInputs.length} UTXOs, Total: ${sponsorInputTotal} lovelace`);

  return { senderInputs, senderInputTotal, sponsorInputs, sponsorInputTotal, senderAssetList };
}

// ============================================================================
// Step 2: Build Transaction using BitGo SDK
// ============================================================================

/**
 * Build transaction using BitGo SDK with sponsorAddress for fee sponsorship
 *
 * Uses the SDK's new sponsorAddress() method to handle:
 * - Sender's change (tokens + ADA) → sender address
 * - Sponsor's fee change → sponsor address
 */
async function buildTransaction(factory: TransactionBuilderFactory, unspents: SelectedUnspents): Promise<Transaction> {
  const currentSlot = await getTip();
  const ttl = currentSlot + 7200;

  // Get the transfer builder from SDK
  const txBuilder = factory.getTransferBuilder();

  // Add sender inputs
  for (const utxo of unspents.senderInputs) {
    txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  }

  // Add sponsor inputs
  for (const utxo of unspents.sponsorInputs) {
    txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  }

  // Add token output to recipient
  // SDK handles MIN_ADA_FOR_ONE_ASSET automatically
  txBuilder.output({
    address: DEFAULT_CONFIG.recipientAddress,
    amount: '0', // SDK will use MIN_ADA_FOR_ONE_ASSET
    multiAssets: {
      policy_id: DEFAULT_CONFIG.tokenToSend.policyId,
      asset_name: DEFAULT_CONFIG.tokenToSend.assetName,
      quantity: DEFAULT_CONFIG.tokenToSend.quantity,
      fingerprint: DEFAULT_CONFIG.tokenToSend.fingerprint,
    },
  });

  // Set sender's change address with their balance and asset list
  // SDK will calculate sender's change: senderBalance - outputs (not fee, since it's sponsored)
  txBuilder.changeAddress(DEFAULT_CONFIG.senderAddress, unspents.senderInputTotal.toString(), unspents.senderAssetList);

  // Set sponsor address for fee sponsorship
  // SDK will calculate sponsor's change: sponsorBalance - fee
  txBuilder.sponsorAddress(DEFAULT_CONFIG.sponsorAddress, unspents.sponsorInputTotal.toString());

  // Set TTL
  txBuilder.ttl(ttl);

  // Mark as token transaction
  txBuilder.isTokenTransaction();

  // Build the transaction - SDK handles all outputs automatically:
  // 1. Token output to recipient (with MIN_ADA_FOR_ONE_ASSET)
  // 2. Token change to sender (remaining tokens + MIN_ADA_FOR_ONE_ASSET)
  // 3. ADA change to sender (remaining ADA)
  // 4. Fee change to sponsor (sponsorBalance - fee)
  const tx = (await txBuilder.build()) as Transaction;

  // eslint-disable-next-line no-console
  console.log(`\nTransaction built using SDK:`);
  // eslint-disable-next-line no-console
  console.log(`  Inputs: ${tx.toJson().inputs.length}`);
  // eslint-disable-next-line no-console
  console.log(`  Outputs: ${tx.toJson().outputs.length}`);
  // eslint-disable-next-line no-console
  console.log(`  Fee: ${tx.getFee} lovelace`);
  // eslint-disable-next-line no-console
  console.log(`  TTL: ${ttl}`);

  return tx;
}

// ============================================================================
// Step 3: Sign Transaction
// ============================================================================

/**
 * Sign transaction with both sender and sponsor private keys
 * Uses CardanoWasm for signing to handle extended bech32 keys
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

  // Create signed transaction and update the SDK Transaction wrapper
  const signedCardanoTx = CardanoWasm.Transaction.new(
    unsignedTx.transaction.body(),
    witnessSet,
    unsignedTx.transaction.auxiliary_data(),
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
 * Fetch UTXOs for an address from Koios API (includes asset information)
 */
async function getAddressInfo(address: string): Promise<AddressInfoWithAssets> {
  try {
    const response = await axios.post(
      `${KOIOS_API}/address_info`,
      { _addresses: [address] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 },
    );

    if (!response.data || response.data.length === 0) {
      return { balance: '0', utxo_set: [] };
    }

    const data = response.data[0];
    return {
      balance: data.balance || '0',
      utxo_set: (data.utxo_set || []).map(
        (utxo: {
          tx_hash: string;
          tx_index: number;
          value: string;
          asset_list?: Array<{ policy_id: string; asset_name: string; quantity: string; fingerprint?: string }>;
        }) => ({
          tx_hash: utxo.tx_hash,
          tx_index: utxo.tx_index,
          value: utxo.value,
          asset_list: utxo.asset_list || [],
        }),
      ),
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

interface TokenAsset {
  policy_id: string;
  asset_name: string;
  quantity: string;
  fingerprint?: string;
}

interface TokenAssetWithFingerprint extends TokenAsset {
  fingerprint: string;
}

interface UTXOWithAssets {
  tx_hash: string;
  tx_index: number;
  value: string;
  asset_list?: TokenAsset[];
}

interface AddressInfoWithAssets {
  balance: string;
  utxo_set: UTXOWithAssets[];
}

interface SelectedUnspents {
  senderInputs: UTXOWithAssets[];
  senderInputTotal: bigint;
  sponsorInputs: UTXOWithAssets[];
  sponsorInputTotal: bigint;
  senderAssetList: Record<string, TokenAssetWithFingerprint>;
}
