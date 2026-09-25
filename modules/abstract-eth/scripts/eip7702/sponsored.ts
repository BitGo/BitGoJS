/**
 * Phase 3 — gas-tank sponsored batch send.
 *
 * 1. The EOA authorizes the gas tank as a sponsor on the delegated contract
 *    (owner-only `addSponsor`, called on the EOA itself).
 * 2. The gas tank sends ONE EIP-1559 transaction to the EOA whose calldata
 *    calls `sponsoredExecuteBatch` — the GAS TANK pays the gas, while the
 *    values are funded from the EOA's balance.
 *
 * Gas tank key: EIP7702_GAS_TANK_PRIVATE_KEY or ~/eip7702-gastank.env.
 *
 * Run:  node -r ts-node/register/transpile-only scripts/eip7702/sponsored.ts
 */

import { ethers } from 'ethers';
import { encodeSetCodeSponsoredExecuteBatch } from '../../src/lib/eip7702';
import {
  CHAIN_ID,
  loadKey,
  getFeeData,
  getNonce,
  waitAndAnalyze,
  verifyDelegation,
  printBalances,
  encodeAddSponsor,
} from './common';

async function main(): Promise<void> {
  const eoa = loadKey('EIP7702_EOA_PRIVATE_KEY', 'eip7702-eoa.env');
  const gasTank = loadKey('EIP7702_GAS_TANK_PRIVATE_KEY', 'eip7702-gastank.env');
  const recipientA = process.env.RECIPIENT_A || ethers.Wallet.createRandom().address;
  const recipientB = process.env.RECIPIENT_B || ethers.Wallet.createRandom().address;

  console.log('=== gas-tank sponsored batch (sponsoredExecuteBatch) ===');
  console.log('EOA:', eoa.address);
  console.log('gas tank:', gasTank.address);
  console.log('recipientA:', recipientA);
  console.log('recipientB:', recipientB);

  const delegated = await verifyDelegation(eoa.address);
  if (!delegated) {
    throw new Error('EOA is not delegated — run delegate.ts first');
  }

  // 1) EOA authorizes the gas tank as a sponsor (owner-only addSponsor).
  const addSponsorData = encodeAddSponsor(gasTank.address);
  const nonce1 = await getNonce(eoa.address);
  const { maxPriorityFeePerGas, maxFeePerGas } = await getFeeData();
  const tx1 = await eoa.sendTransaction({
    to: eoa.address,
    data: addSponsorData,
    value: 0,
    nonce: nonce1,
    gasLimit: ethers.BigNumber.from('100000'),
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: CHAIN_ID,
    type: 2,
  });
  await waitAndAnalyze(tx1.hash, 'addSponsor(gasTank)');

  // 2) Gas tank sends the sponsored batch — gas tank pays gas.
  const amountA = ethers.utils.parseEther(process.env.AMOUNT_A || '0.001');
  const amountB = ethers.utils.parseEther(process.env.AMOUNT_B || '0.002');
  const calls = [
    { to: recipientA, value: amountA.toString(), data: '0x' },
    { to: recipientB, value: amountB.toString(), data: '0x' },
  ];
  const sponsoredData = encodeSetCodeSponsoredExecuteBatch(calls);
  console.log(`\nsponsored calldata (${sponsoredData.length / 2 - 1} bytes): ${sponsoredData.slice(0, 100)}...`);
  console.log(`amountA: ${ethers.utils.formatEther(amountA)} ETH`);
  console.log(`amountB: ${ethers.utils.formatEther(amountB)} ETH`);

  const gasTankNonce = await getNonce(gasTank.address);
  const tx2 = await gasTank.sendTransaction({
    to: eoa.address, // destination = the delegated EOA -> runs delegate code
    data: sponsoredData,
    value: 0,
    nonce: gasTankNonce,
    gasLimit: ethers.BigNumber.from('200000'),
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: CHAIN_ID,
    type: 2,
  });
  await waitAndAnalyze(tx2.hash, 'sponsored batch tx (gas tank pays gas)');

  await printBalances({ EOA: eoa.address, gasTank: gasTank.address, recipientA, recipientB });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
