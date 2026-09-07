import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { getKey, getKeyTriple } from '@bitgo/wasm-utxo/testutils';
import {
  TransactionSigner,
  createStacksPrivateKey,
  getPublicKey,
  publicKeyToString,
  type StacksTransaction,
} from '@stacks/transactions';

import type { Pox5LocalConfig } from './config';
import { BitcoinCoreAdapter } from './bitcoin';
import { createBitGoPox5Adapter, createDescriptorMap, createPox5Psbt } from './bitgo';
import { HiroRegtestFundingAdapter } from './funding';
import { JsonRpcClient, type RpcLogger, waitFor } from './rpc';
import { StacksNodeAdapter } from './stacks';
import { assertPinnedStacksJsCheckout, createStacksNetwork, loadStacksBitcoinStaking } from './stacks-js';

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

const OPCODES: Record<string, number> = {
  OP_0: 0x00,
  OP_IF: 0x63,
  OP_ELSE: 0x67,
  OP_ENDIF: 0x68,
  OP_VERIFY: 0x69,
  OP_SIZE: 0x82,
  OP_EQUAL: 0x87,
  OP_EQUALVERIFY: 0x88,
  OP_SHA256: 0xa8,
  OP_CHECKSIG: 0xac,
  OP_CHECKMULTISIG: 0xae,
  OP_CLTV: 0xb1,
};

function asmToScript(asm: string): Buffer {
  const tokens = asm.split(' ');
  const chunks: Buffer[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const push = token.match(/^OP_PUSHBYTES_(\d+)$/);
    if (push) {
      const bytes = Buffer.from(tokens[++index], 'hex');
      chunks.push(Buffer.of(bytes.length), bytes);
      continue;
    }
    const number = token.match(/^OP_PUSHNUM_(\d+)$/);
    if (number) {
      chunks.push(Buffer.of(0x50 + Number(number[1])));
      continue;
    }
    const opcode = OPCODES[token];
    if (opcode === undefined) throw new Error(`Unsupported descriptor ASM token: ${token}`);
    chunks.push(Buffer.of(opcode));
  }
  return Buffer.concat(chunks);
}

function encodeTwoOfThreeUnlock(keys: readonly Uint8Array[]): Buffer {
  if (keys.length !== 3) throw new Error('PoX-5 lockup requires exactly three staker keys');
  return Buffer.concat([
    Buffer.of(0x52),
    ...keys.flatMap((key) => [Buffer.of(33), Buffer.from(key)]),
    Buffer.of(0x53, 0xae),
  ]);
}

export function runOfflinePox5Scenario(): void {
  const bitgo = createBitGoPox5Adapter();
  const [user, backup, bitgoKey] = getKeyTriple('utxo-staking-pox5-local');
  const earlyExit = getKey('utxo-staking-pox5-local-early-exit');
  const principalPreimage = Buffer.alloc(32, 0x42);
  const descriptor = bitgo.createDescriptor({
    unlockHeight: 840_000,
    stakerCommitment: sha256(principalPreimage),
    earlyExitKey: Buffer.from(earlyExit.publicKey),
    stakerKeys: [Buffer.from(user.publicKey), Buffer.from(backup.publicKey), Buffer.from(bitgoKey.publicKey)],
  });
  const descriptorMap = createDescriptorMap(descriptor);

  const locktimePsbt = createPox5Psbt(descriptor, 840_000);
  const locktimeMatch = bitgo.matchInput(locktimePsbt, 0, descriptorMap);
  assert.ok(locktimeMatch);
  assert.equal(bitgo.classifySpend(locktimePsbt, locktimeMatch), 'locktime');

  const earlyExitPsbt = createPox5Psbt(descriptor, 0);
  const earlyExitMatch = bitgo.matchInput(earlyExitPsbt, 0, descriptorMap);
  assert.ok(earlyExitMatch);
  bitgo.prepareEarlyExit(earlyExitPsbt, 0, earlyExitMatch, principalPreimage);
  assert.equal(bitgo.classifySpend(earlyExitPsbt, earlyExitMatch), 'early-exit');
}

export async function runLocalRpcSmoke(config: Pox5LocalConfig): Promise<void> {
  await assertPinnedStacksJsCheckout(config);
  const staking = loadStacksBitcoinStaking(config);
  const bitcoinRpc = new JsonRpcClient(
    config.bitcoin.rpcUrl,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs
  );
  const bitcoinWalletRpc = new JsonRpcClient(
    `${config.bitcoin.rpcUrl}/wallet/main`,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs
  );
  const bitcoin = new BitcoinCoreAdapter(bitcoinRpc, bitcoinWalletRpc);
  const stacks = new StacksNodeAdapter(config.stacks.nodeUrl, config.stacks.apiUrl, config.stacks.timeoutMs);

  const bitcoinInfo = await bitcoin.getBlockchainInfo();
  assert.equal(bitcoinInfo.chain, config.bitcoin.network);
  const bitcoinAddress = await bitcoin.getNewAddress('pox5-local-smoke');
  const initialBitcoinHeight = await bitcoin.getBlockCount();
  await bitcoin.waitForBlockProgress(initialBitcoinHeight, config.bitcoin.startupTimeoutMs);
  assert.match(bitcoinAddress, /^(bcrt1|2|m|n)/);

  await stacks.waitForReady(config.bitcoin.startupTimeoutMs);
  await stacks.waitForPox5Configured(
    config.stacks.pox5ContractId,
    config.stacks.pox5ActivationHeight,
    config.bitcoin.startupTimeoutMs
  );
  const stacksInfo = await stacks.getNodeInfo();
  assert.equal(stacksInfo.networkId, config.stacks.chainId);
  assert.ok(stacksInfo.burnBlockHeight >= 0);
  const pox5Interface = await stacks.getContractInterface('ST000000000000000000002AMW42H', 'pox-5');
  assert.ok(Object.keys(pox5Interface).length > 0);
  assert.ok(Object.keys(await stacks.getApiStatus()).length > 0);

  const bitgo = createBitGoPox5Adapter();
  const [user, backup, bitgoKey] = getKeyTriple('utxo-staking-pox5-local');
  const earlyExit = getKey('utxo-staking-pox5-local-early-exit');
  const stxAddress = config.accounts.stakerAddress;
  if (stxAddress === undefined) throw new Error('POX5_STACKS_STAKER_ADDRESS is required for live scenarios');
  const principalPreimage = staking.computeRegisterPreimage(stxAddress);
  const unlockBytes = encodeTwoOfThreeUnlock([user.publicKey, backup.publicKey, bitgoKey.publicKey]);
  const earlyUnlockBytes = staking.buildUnlockScript(earlyExit.publicKey);
  const descriptor = bitgo.createDescriptor({
    unlockHeight: config.stacks.unlockHeight,
    stakerCommitment: sha256(principalPreimage),
    earlyExitKey: Buffer.from(earlyExit.publicKey),
    stakerKeys: [Buffer.from(user.publicKey), Buffer.from(backup.publicKey), Buffer.from(bitgoKey.publicKey)],
  });
  assert.deepStrictEqual(
    asmToScript(descriptor.toAsmString()),
    Buffer.from(
      staking.buildLockScript({
        stxAddress,
        unlockHeight: config.stacks.unlockHeight,
        unlockBytes,
        earlyUnlockBytes,
        validateEarlyUnlockBytes: false,
      })
    )
  );
  assert.deepStrictEqual(
    Buffer.from(descriptor.scriptPubkey()),
    Buffer.from(
      staking.buildLockOutputScript({
        stxAddress,
        unlockHeight: config.stacks.unlockHeight,
        unlockBytes,
        earlyUnlockBytes,
      })
    )
  );
  assert.ok(
    staking.buildLockAddress({
      stxAddress,
      unlockHeight: config.stacks.unlockHeight,
      unlockBytes,
      earlyUnlockBytes,
      network: config.stacks.addressNetwork,
    })
  );
}

export async function runL1FundingScenario(config: Pox5LocalConfig): Promise<void> {
  if (config.profile === 'local') throw new Error('Use the local miner for local-profile funding');
  const staking = loadStacksBitcoinStaking(config);
  const bitcoinRpc = new JsonRpcClient(
    config.bitcoin.rpcUrl,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs
  );
  const bitcoinWalletRpc = new JsonRpcClient(
    `${config.bitcoin.rpcUrl}/wallet/main`,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs
  );
  const bitcoin = new BitcoinCoreAdapter(bitcoinRpc, bitcoinWalletRpc);
  const stakerAddress = config.accounts.stakerAddress;
  if (stakerAddress === undefined) throw new Error('POX5_STACKS_STAKER_ADDRESS is required for L1 funding');

  const [user, backup, bitgoKey] = getKeyTriple('utxo-staking-pox5-local');
  const earlyExit = getKey('utxo-staking-pox5-local-early-exit');
  const unlockBytes = encodeTwoOfThreeUnlock([user.publicKey, backup.publicKey, bitgoKey.publicKey]);
  const earlyUnlockBytes = staking.buildUnlockScript(earlyExit.publicKey);
  const lockAddress = staking.buildLockAddress({
    stxAddress: stakerAddress,
    unlockHeight: config.stacks.unlockHeight,
    unlockBytes,
    earlyUnlockBytes,
    network: config.stacks.addressNetwork,
  });

  const amountSats = BigInt(process.env.POX5_AMOUNT_SATS ?? '30000');
  const funding = new HiroRegtestFundingAdapter(config);
  const txid = await funding.fundLock(bitcoin, lockAddress, amountSats);
  const confirmation = await funding.waitForConfirmed(txid);
  const rawTransaction = await bitcoin.getRawTransaction(txid);
  assert.ok(rawTransaction.length > 0);
  console.log(
    JSON.stringify(
      {
        profile: config.profile,
        stakerAddress,
        lockAddress,
        txid,
        blockHash: confirmation.blockHash,
        blockHeight: confirmation.blockHeight,
        amountSats: amountSats.toString(),
      },
      null,
      2
    )
  );
}

export async function runL1RegisterScenario(config: Pox5LocalConfig, logger?: RpcLogger): Promise<void> {
  logger?.('stake: validating staker and signer configuration');
  if (config.profile === 'local') throw new Error('Use the local profile bootstrap for registration development');
  const stakerAddress = config.accounts.stakerAddress;
  const stakerPrivateKey = config.accounts.stakerPrivateKey;
  const configuredBondIndex = config.stacks.bondIndex;
  const signerManager = config.stacks.signerManager;
  if (stakerAddress === undefined || stakerPrivateKey === undefined)
    throw new Error(
      'A staker address and private key are required; enter a seed phrase or set POX5_STACKS_STAKER_ADDRESS and POX5_STACKS_PRIVATE_KEY'
    );
  if (signerManager === undefined) throw new Error('Set POX5_SIGNER_MANAGER for this network deployment');

  const staking = loadStacksBitcoinStaking(config);
  const network = createStacksNetwork(config);
  const client = network.client;
  const bondIndex =
    configuredBondIndex ??
    (await findAllowlistedBondIndex({
      staking,
      network,
      client,
      stakerAddress,
      amountSats: BigInt(process.env.POX5_AMOUNT_SATS ?? '30000'),
    }));
  logger?.(`stake: selected bond ${bondIndex}`);
  const bond = (await staking.fetchBond({ bondIndex, network, client })) as
    | { earlyUnlockBytes: string; stxValueRatio: bigint; minUstxRatioBps: bigint }
    | undefined;
  if (bond === undefined) throw new Error(`PoX-5 bond ${bondIndex} was not found`);
  const unlockHeight = Number(await staking.fetchBondL1UnlockHeight({ bondIndex, network, client }));

  const bitcoinRpc = new JsonRpcClient(
    config.bitcoin.rpcUrl,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs,
    logger
  );
  const bitcoinWalletRpc = new JsonRpcClient(
    `${config.bitcoin.rpcUrl}/wallet/main`,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs,
    logger
  );
  const bitcoin = new BitcoinCoreAdapter(bitcoinRpc, bitcoinWalletRpc);
  const stacks = new StacksNodeAdapter(config.stacks.nodeUrl, config.stacks.apiUrl, config.stacks.timeoutMs, logger);
  const [user, backup, bitgoKey] = getKeyTriple('utxo-staking-pox5-local');
  const earlyExit = getKey('utxo-staking-pox5-local-early-exit');
  const unlockBytes = encodeTwoOfThreeUnlock([user.publicKey, backup.publicKey, bitgoKey.publicKey]);
  const earlyUnlockBytes = staking.buildUnlockScript(earlyExit.publicKey);
  const principalPreimage = staking.computeRegisterPreimage(stakerAddress);
  const bitgo = createBitGoPox5Adapter();
  const descriptor = bitgo.createDescriptor({
    unlockHeight,
    stakerCommitment: sha256(principalPreimage),
    earlyExitKey: Buffer.from(earlyExit.publicKey),
    stakerKeys: [Buffer.from(user.publicKey), Buffer.from(backup.publicKey), Buffer.from(bitgoKey.publicKey)],
  });
  const outputScript = staking.buildLockOutputScript({
    stxAddress: stakerAddress,
    unlockHeight,
    unlockBytes,
    earlyUnlockBytes,
  });
  assert.deepStrictEqual(Buffer.from(descriptor.scriptPubkey()), Buffer.from(outputScript));
  const lockAddress = staking.buildLockAddress({
    stxAddress: stakerAddress,
    unlockHeight,
    unlockBytes,
    earlyUnlockBytes,
    network: config.stacks.addressNetwork,
  });

  const amountSats = BigInt(process.env.POX5_AMOUNT_SATS ?? '30000');
  const funding = new HiroRegtestFundingAdapter(config);
  const fundingTxid = await funding.fundLock(bitcoin, lockAddress, amountSats);
  const confirmation = await funding.waitForConfirmed(fundingTxid);
  const proofData = await funding.getLockProofData(fundingTxid, confirmation);
  const lockupOutput = staking.buildLockProof({
    txHex: proofData.legacyTxHex,
    header: proofData.headerHex,
    merkleProof: {
      block_height: confirmation.blockHeight,
      merkle: staking.computeMerkleBranch(proofData.txids, proofData.txIndex),
      pos: proofData.txIndex,
    },
    txCount: proofData.txCount,
    unlockHeight,
    outputScript,
  });
  const minimumUstx = staking.minUstxForSatsAmount({
    sats: amountSats,
    stxValueRatio: bond.stxValueRatio,
    minUstxRatioBps: bond.minUstxRatioBps,
  });
  const account = await stacks.getAccount(stakerAddress);
  const nonce = Number(account.nonce);
  const publicKey = publicKeyToString(getPublicKey(createStacksPrivateKey(stakerPrivateKey)));
  const unsigned = await staking.buildRegisterForBond({
    bondIndex,
    signerManager,
    amountUstx: minimumUstx + 1_000_000n,
    lockup: { kind: 'btc', outputs: [lockupOutput], unlockBytes },
    publicKey,
    fee: BigInt(process.env.POX5_STX_FEE_USTX ?? '10000'),
    nonce,
    network,
  });
  const signer = new TransactionSigner(unsigned as StacksTransaction);
  signer.signOrigin(createStacksPrivateKey(stakerPrivateKey));
  const registerTxid = await stacks.broadcastTransaction(Buffer.from(signer.transaction.serialize()));
  logger?.(`stake: broadcast register-for-bond ${registerTxid}`);
  await waitFor(
    `register-for-bond ${registerTxid}`,
    async () => {
      const transaction = await stacks.getTransaction(registerTxid);
      const status = transaction.tx_status;
      if (typeof status !== 'string') return false;
      if (status.startsWith('abort')) throw new Error(`register-for-bond aborted: ${status}`);
      return status === 'success';
    },
    config.stacks.timeoutMs * 20
  );
  await waitFor(
    `PoX-5 membership for ${stakerAddress}`,
    async () => (await staking.fetchBondMembership({ address: stakerAddress, network, client })) != null,
    config.stacks.timeoutMs * 20
  );
  console.log(JSON.stringify({ profile: config.profile, bondIndex, fundingTxid, registerTxid, lockAddress }, null, 2));
}

async function findAllowlistedBondIndex(args: {
  staking: ReturnType<typeof loadStacksBitcoinStaking>;
  network: ReturnType<typeof createStacksNetwork>;
  client: ReturnType<typeof createStacksNetwork>['client'];
  stakerAddress: string;
  amountSats: bigint;
}): Promise<number> {
  const poxInfo = await args.staking.fetchPoxInfo({ network: args.network, client: args.client });
  const rewardCycleId = Number((poxInfo as { rewardCycleId: number }).rewardCycleId);
  const firstRewardCycle = args.staking.firstPox5RewardCycle(poxInfo) ?? 0;
  const currentBondIndex = Math.floor((rewardCycleId - firstRewardCycle) / args.staking.bondGapCycles);
  const scanRadius = Number(process.env.POX5_BOND_SCAN_RADIUS ?? '8');
  const firstBondIndex = Math.max(0, currentBondIndex - scanRadius);
  const lastBondIndex = currentBondIndex + scanRadius;
  const allowlistedBonds: string[] = [];
  for (let bondIndex = firstBondIndex; bondIndex <= lastBondIndex; bondIndex += 1) {
    const bond = await args.staking.fetchBond({ bondIndex, network: args.network, client: args.client });
    if (bond === undefined) continue;
    const allowance = await args.staking.fetchBondAllowance({
      bondIndex,
      address: args.stakerAddress,
      network: args.network,
      client: args.client,
    });
    if (allowance === undefined || allowance < args.amountSats) continue;
    const status = await args.staking.fetchBondStatus({ bondIndex, network: args.network, client: args.client });
    allowlistedBonds.push(`${bondIndex}:${status}`);
    if (status === 'open') return bondIndex;
  }
  if (allowlistedBonds.length > 0) {
    throw new Error(
      `Staker ${args.stakerAddress} is allowlisted for ${
        args.amountSats
      } sats, but no allowlisted bond is currently open (${allowlistedBonds
        .slice(-6)
        .join(', ')}). Wait for the next PoX-5 registration window; setting POX5_BOND_INDEX cannot bypass it.`
    );
  }
  throw new Error(
    `No existing PoX-5 bond allowlists ${args.stakerAddress} for ${args.amountSats} sats. Set POX5_BOND_INDEX only when this address is explicitly allowlisted, or use an operator-provided staker account.`
  );
}

/** Announce an L1 early exit on-chain; the later BTC reclaim still needs the bond cosigner. */
export async function runL1EarlyExitScenario(config: Pox5LocalConfig, logger?: RpcLogger): Promise<void> {
  logger?.('early-exit: validating staker and signer configuration');
  if (config.profile === 'local') throw new Error('Use a shared PoX-5 profile to announce an L1 early exit');
  const stakerAddress = config.accounts.stakerAddress;
  const stakerPrivateKey = config.accounts.stakerPrivateKey;
  const signerManager = config.stacks.signerManager;
  if (stakerAddress === undefined || stakerPrivateKey === undefined || signerManager === undefined) {
    throw new Error('POX5_STACKS_STAKER_ADDRESS, POX5_STACKS_PRIVATE_KEY, and POX5_SIGNER_MANAGER are required');
  }

  const staking = loadStacksBitcoinStaking(config);
  const network = createStacksNetwork(config);
  const stacks = new StacksNodeAdapter(config.stacks.nodeUrl, config.stacks.apiUrl, config.stacks.timeoutMs, logger);
  const account = await stacks.getAccount(stakerAddress);
  const nonce = Number(account.nonce);
  const publicKey = publicKeyToString(getPublicKey(createStacksPrivateKey(stakerPrivateKey)));
  const unsigned = await staking.buildAnnounceL1EarlyExit({
    staker: stakerAddress,
    oldSignerManager: signerManager,
    publicKey,
    fee: BigInt(process.env.POX5_STX_FEE_USTX ?? '10000'),
    nonce,
    network,
  });
  const signer = new TransactionSigner(unsigned as StacksTransaction);
  signer.signOrigin(createStacksPrivateKey(stakerPrivateKey));
  const txid = await stacks.broadcastTransaction(Buffer.from(signer.transaction.serialize()));
  await waitFor(
    `announce-l1-early-exit ${txid}`,
    async () => {
      const transaction = await stacks.getTransaction(txid);
      const status = transaction.tx_status;
      if (typeof status !== 'string') return false;
      if (status.startsWith('abort')) throw new Error(`announce-l1-early-exit aborted: ${status}`);
      return status === 'success';
    },
    config.stacks.timeoutMs * 20
  );
  console.log(JSON.stringify({ profile: config.profile, stakerAddress, txid }, null, 2));
}
