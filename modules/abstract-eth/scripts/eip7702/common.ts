/**
 * Shared config + helpers for the standalone EIP-7702 on-chain harness.
 *
 * Target: Hoodi (Pectra testnet, chain 560048). The delegate implementation
 * was deployed at IMPLEMENTATION (see DEPLOYMENT.md in the BGMS repo).
 *
 * Keys are loaded from env vars or files in the home dir:
 *   EIP7702_EOA_PRIVATE_KEY        -> ~/eip7702-eoa.env
 *   EIP7702_GAS_TANK_PRIVATE_KEY   -> ~/eip7702-gastank.env
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const HOODI_RPC = process.env.HOODI_RPC_URL || 'https://rpc.hoodi.ethpandaops.io';
export const CHAIN_ID = 560048;
/** Deployed EIP7702Delegate on Hoodi (see BGMS DEPLOYMENT.md). */
export const IMPLEMENTATION = '0xd9b435f8aaa0d2c6d789eceeba8a1c3a5cf8089a';
export const EXPLORER = 'https://hoodi.beaconcha.in';

export const provider = new ethers.providers.JsonRpcProvider(HOODI_RPC);

/** Load a wallet from env var or a `KEY=0x...` file in the home dir. */
export function loadKey(envName: string, fileName: string): ethers.Wallet {
  const fromEnv = process.env[envName];
  if (fromEnv) {
    return new ethers.Wallet(fromEnv, provider);
  }
  const p = path.join(os.homedir(), fileName);
  if (fs.existsSync(p)) {
    const line = fs.readFileSync(p, 'utf8').trim();
    const key = line.split('=')[1];
    if (key) {
      return new ethers.Wallet(key, provider);
    }
  }
  throw new Error(`No private key: set env ${envName} or create ~/${fileName} with KEY=0x...`);
}

/** Current EIP-1559 fee data from the RPC (with sane fallbacks). */
export async function getFeeData(): Promise<{ maxPriorityFeePerGas: ethers.BigNumber; maxFeePerGas: ethers.BigNumber }> {
  const feeData = await provider.getFeeData();
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? ethers.utils.parseUnits('1', 'gwei');
  const maxFeePerGas = feeData.maxFeePerGas ?? ethers.utils.parseUnits('30', 'gwei');
  return { maxPriorityFeePerGas, maxFeePerGas };
}

export async function getNonce(address: string): Promise<number> {
  return provider.getTransactionCount(address, 'pending');
}

/** Sign a 32-byte digest with a wallet key; returns {r, s, yParity}. */
export function signDigest(
  wallet: ethers.Wallet,
  digest: Buffer
): { r: string; s: string; yParity: number } {
  const sig = new ethers.utils.SigningKey(wallet.privateKey).signDigest('0x' + digest.toString('hex'));
  return { r: sig.r, s: sig.s, yParity: sig.recoveryParam };
}

/** Wait for a tx, print exhaustive receipt analysis, return the receipt. */
export async function waitAndAnalyze(txHash: string, label: string): Promise<ethers.providers.TransactionReceipt> {
  console.log(`\n=== ${label} ===`);
  console.log(`tx hash: ${txHash}`);
  console.log(`explorer: ${EXPLORER}/tx/${txHash}`);
  const receipt = await provider.waitForTransaction(txHash, 1, 180000);
  console.log(`status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
  console.log(`block: ${receipt.blockNumber}`);
  console.log(`gas used: ${receipt.gasUsed.toString()}`);
  console.log(`effective gas price: ${ethers.utils.formatUnits(receipt.effectiveGasPrice, 'gwei')} gwei`);
  console.log(`total gas cost: ${ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))} ETH`);
  return receipt;
}

/**
 * Verify an EOA is delegated: its code must be exactly the EIP-7702
 * delegation indicator `0xef0100 || implementation_address`.
 */
export async function verifyDelegation(eoa: string): Promise<boolean> {
  const code = await provider.getCode(eoa);
  const expected = '0xef0100' + IMPLEMENTATION.slice(2).toLowerCase();
  const delegated = code.toLowerCase() === expected;
  console.log(`\n=== delegation check: ${eoa} ===`);
  console.log(`code: ${code}`);
  console.log(`expected indicator: ${expected}`);
  console.log(`delegated: ${delegated}`);
  return delegated;
}

export async function printBalances(labels: Record<string, string>): Promise<void> {
  console.log('\n=== balances ===');
  for (const [label, addr] of Object.entries(labels)) {
    const bal = await provider.getBalance(addr);
    console.log(`${label}: ${ethers.utils.formatEther(bal)} ETH (${bal.toString()} wei)`);
  }
}

/** ABI-encode `addSponsor(address)` for the delegate contract. */
export function encodeAddSponsor(sponsor: string): string {
  return new ethers.utils.Interface(['function addSponsor(address)']).encodeFunctionData('addSponsor', [sponsor]);
}

/**
 * Broadcast a raw signed transaction via eth_sendRawTransaction and return the
 * tx hash. Used for the 0x04 set-code tx because ethers v5 cannot parse
 * transaction type 4 (it would fail when building the sendTransaction result).
 */
export async function sendRawTransaction(rawHex: string): Promise<string> {
  const res = await fetch(HOODI_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [rawHex] }),
  });
  const json = (await res.json()) as { result?: string; error?: { message?: string } };
  if (json.error) {
    throw new Error(`eth_sendRawTransaction failed: ${json.error.message ?? JSON.stringify(json.error)}`);
  }
  if (!json.result) {
    throw new Error('eth_sendRawTransaction returned no result');
  }
  return json.result;
}
