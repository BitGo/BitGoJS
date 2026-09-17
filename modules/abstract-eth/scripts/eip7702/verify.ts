/**
 * On-chain verification — read-only analysis of the EIP-7702 state.
 *
 * Checks: EOA delegation indicator, implementation code, balances, and the
 * last delegation/batch tx receipts if TX_HASH is provided.
 *
 * Run:  node -r ts-node/register/transpile-only scripts/eip7702/verify.ts
 *       TX_HASH=0x... node -r ts-node/register/transpile-only scripts/eip7702/verify.ts
 */

import { ethers } from 'ethers';
import {
  IMPLEMENTATION,
  EXPLORER,
  provider,
  loadKey,
  verifyDelegation,
  printBalances,
  waitAndAnalyze,
} from './common';

async function main(): Promise<void> {
  const eoa = loadKey('EIP7702_EOA_PRIVATE_KEY', 'eip7702-eoa.env');

  console.log('=== EIP-7702 on-chain verification ===');
  console.log('EOA:', eoa.address);
  console.log('implementation:', IMPLEMENTATION);
  console.log('chainId:', 560048);

  await verifyDelegation(eoa.address);

  const implCode = await provider.getCode(IMPLEMENTATION);
  console.log(`\nimplementation code length: ${(implCode.length - 2) / 2} bytes (deployed: ${implCode !== '0x'})`);

  await printBalances({ EOA: eoa.address });

  const txHash = process.env.TX_HASH;
  if (txHash) {
    const receipt = await waitAndAnalyze(txHash, 'requested tx');
    console.log(`\nfull receipt: ${JSON.stringify(receipt, null, 2)}`);
  } else {
    console.log(`\n(optional) pass TX_HASH=0x... to analyze a specific tx: ${EXPLORER}/tx/...`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
