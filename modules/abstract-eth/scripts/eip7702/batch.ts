/**
 * Phase 2 — self-paid batch send through the delegated EOA.
 *
 * After delegation (run delegate.ts first), the EOA sends ONE EIP-1559
 * transaction to itself whose calldata calls `executeBatch` on the delegated
 * implementation. Multiple recipients are paid in a single tx; the EOA pays
 * the gas.
 *
 * Recipients: RECIPIENT_A / RECIPIENT_B env vars (defaults to two fresh
 * random addresses, printed for on-chain lookup).
 *
 * Run:  node -r ts-node/register/transpile-only scripts/eip7702/batch.ts
 */

import { ethers } from 'ethers';
import { encodeSetCodeExecuteBatch } from '../../src/lib/eip7702';
import {
  CHAIN_ID,
  loadKey,
  getFeeData,
  getNonce,
  waitAndAnalyze,
  verifyDelegation,
  printBalances,
} from './common';

async function main(): Promise<void> {
  const eoa = loadKey('EIP7702_EOA_PRIVATE_KEY', 'eip7702-eoa.env');
  const recipientA = process.env.RECIPIENT_A || ethers.Wallet.createRandom().address;
  const recipientB = process.env.RECIPIENT_B || ethers.Wallet.createRandom().address;

  console.log('=== self-paid batch send (executeBatch) ===');
  console.log('EOA:', eoa.address);
  console.log('recipientA:', recipientA);
  console.log('recipientB:', recipientB);

  const delegated = await verifyDelegation(eoa.address);
  if (!delegated) {
    throw new Error('EOA is not delegated — run delegate.ts first');
  }

  const amountA = ethers.utils.parseEther(process.env.AMOUNT_A || '0.001');
  const amountB = ethers.utils.parseEther(process.env.AMOUNT_B || '0.002');
  const calls = [
    { to: recipientA, value: amountA.toString(), data: '0x' },
    { to: recipientB, value: amountB.toString(), data: '0x' },
  ];
  const data = encodeSetCodeExecuteBatch(calls);
  console.log(`\nbatch calldata (${data.length / 2 - 1} bytes): ${data.slice(0, 100)}...`);
  console.log(`amountA: ${ethers.utils.formatEther(amountA)} ETH`);
  console.log(`amountB: ${ethers.utils.formatEther(amountB)} ETH`);

  const nonce = await getNonce(eoa.address);
  const { maxPriorityFeePerGas, maxFeePerGas } = await getFeeData();
  const gasLimit = ethers.BigNumber.from('200000');
  console.log(`\nnonce: ${nonce}`);
  console.log(`gasLimit: ${gasLimit.toString()}`);

  const tx = await eoa.sendTransaction({
    to: eoa.address, // destination = the delegated EOA -> runs delegate code
    data,
    value: 0,
    nonce,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: CHAIN_ID,
    type: 2,
  });
  await waitAndAnalyze(tx.hash, 'self-paid batch tx');

  await printBalances({ EOA: eoa.address, recipientA, recipientB });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
