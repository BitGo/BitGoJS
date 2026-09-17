/**
 * Phase 1 — EIP-7702 delegation (0x04 set-code tx).
 *
 * Signs the authorization digest with the EOA key, builds the 0x04
 * transaction (authorization -> IMPLEMENTATION), signs the envelope, and
 * broadcasts on Hoodi. Then verifies on-chain that the EOA's code is the
 * delegation indicator `0xef0100 || implementation`.
 *
 * Run:  node -r ts-node/register/transpile-only scripts/eip7702/delegate.ts
 */

import { ethers } from 'ethers';
import {
  computeSetCodeAuthorizationDigest,
  buildSetCodeTransaction,
  getSetCodeTransactionSigningHash,
} from '../../src/lib/eip7702';
import {
  CHAIN_ID,
  IMPLEMENTATION,
  provider,
  loadKey,
  getFeeData,
  getNonce,
  signDigest,
  waitAndAnalyze,
  verifyDelegation,
  printBalances,
} from './common';

async function main(): Promise<void> {
  const eoa = loadKey('EIP7702_EOA_PRIVATE_KEY', 'eip7702-eoa.env');

  console.log('=== EIP-7702 delegation (0x04 set-code) ===');
  console.log('EOA (delegating):', eoa.address);
  console.log('implementation:', IMPLEMENTATION);
  console.log('chainId:', CHAIN_ID);
  await printBalances({ EOA: eoa.address });

  const nonce = await getNonce(eoa.address);
  const { maxPriorityFeePerGas, maxFeePerGas } = await getFeeData();
  const gasLimit = ethers.BigNumber.from('100000');
  console.log(`\nnonce: ${nonce}`);
  console.log(`maxFeePerGas: ${ethers.utils.formatUnits(maxFeePerGas, 'gwei')} gwei`);
  console.log(`maxPriorityFeePerGas: ${ethers.utils.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`);
  console.log(`gasLimit: ${gasLimit.toString()}`);

  // 1) Authorization digest: keccak256(0x05 || rlp([chainId, address, nonce]))
  const digest = computeSetCodeAuthorizationDigest({ chainId: CHAIN_ID, address: eoa.address, nonce });
  console.log(`\nauthorization digest: 0x${digest.toString('hex')}`);
  const authSig = signDigest(eoa, digest);
  console.log(`authorization sig: r=${authSig.r}`);
  console.log(`                    s=${authSig.s}`);
  console.log(`                    yParity=${authSig.yParity}`);

  const auth = {
    chainId: CHAIN_ID,
    address: IMPLEMENTATION,
    nonce,
    yParity: authSig.yParity as 0 | 1,
    r: authSig.r,
    s: authSig.s,
  };

  // 2) Envelope hash: keccak256(0x04 || rlp(<fields without signature>))
  const envelopeHash = getSetCodeTransactionSigningHash({
    chainId: CHAIN_ID,
    nonce,
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    gasLimit: gasLimit.toString(),
    destination: eoa.address,
    value: '0',
    data: '0x',
    authorizationList: [auth],
  });
  console.log(`\nenvelope hash: 0x${envelopeHash.toString('hex')}`);
  const envSig = signDigest(eoa, envelopeHash);
  console.log(`envelope sig: r=${envSig.r}`);
  console.log(`              s=${envSig.s}`);
  console.log(`              yParity=${envSig.yParity}`);

  // 3) Build the serialized 0x04 tx and broadcast
  const serialized = buildSetCodeTransaction({
    chainId: CHAIN_ID,
    nonce,
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    gasLimit: gasLimit.toString(),
    destination: eoa.address,
    value: '0',
    data: '0x',
    authorizationList: [auth],
    yParity: envSig.yParity as 0 | 1,
    r: envSig.r,
    s: envSig.s,
  });
  const hex = '0x' + serialized.toString('hex');
  console.log(`\nserialized 0x04 tx (${serialized.length} bytes): ${hex.slice(0, 100)}...`);

  const tx = await provider.sendTransaction(hex);
  await waitAndAnalyze(tx.hash, 'delegation tx');

  await verifyDelegation(eoa.address);
  await printBalances({ EOA: eoa.address });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
