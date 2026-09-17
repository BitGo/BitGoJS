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
  sendRawTransaction,
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
  // Self-delegation: the spec increments the SENDER's nonce before processing
  // the authorization list, so the authorization nonce must be tx nonce + 1
  // (verified on-chain on Hoodi).
  const authNonce = nonce + 1;
  const { maxPriorityFeePerGas, maxFeePerGas } = await getFeeData();
  const gasLimit = ethers.BigNumber.from('100000');
  console.log(`\nnonce: ${nonce} (authorization nonce: ${authNonce})`);
  console.log(`maxFeePerGas: ${ethers.utils.formatUnits(maxFeePerGas, 'gwei')} gwei`);
  console.log(`maxPriorityFeePerGas: ${ethers.utils.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`);
  console.log(`gasLimit: ${gasLimit.toString()}`);

  // 1) Authorization digest: keccak256(0x05 || rlp([chainId, address, nonce]))
  //    The `address` is the TUPLE's address field = the implementation address
  //    (the node recomputes the digest from the tuple, so signing over the EOA
  //    would recover a different authority and the tuple would be skipped).
  const digest = computeSetCodeAuthorizationDigest({ chainId: CHAIN_ID, address: IMPLEMENTATION, nonce: authNonce });
  console.log(`\nauthorization digest: 0x${digest.toString('hex')}`);
  const authSig = signDigest(eoa, digest);
  console.log(`authorization sig: r=${authSig.r}`);
  console.log(`                    s=${authSig.s}`);
  console.log(`                    yParity=${authSig.yParity}`);

  const auth = {
    chainId: CHAIN_ID,
    address: IMPLEMENTATION,
    nonce: authNonce,
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

  // Broadcast via raw eth_sendRawTransaction (ethers v5 cannot parse type 4).
  const txHash = await sendRawTransaction(hex);
  await waitAndAnalyze(txHash, 'delegation tx');

  await verifyDelegation(eoa.address);
  await printBalances({ EOA: eoa.address });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
