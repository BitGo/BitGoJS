import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { isAbsolute, relative } from 'node:path';
import { promisify } from 'node:util';

import type { Pox5LocalConfig } from './config';

const execFileAsync = promisify(execFile);
const loadModule = createRequire(__filename);

export type LockScriptOptions = {
  stxAddress: string;
  unlockHeight: number;
  unlockBytes: Uint8Array;
  earlyUnlockBytes: Uint8Array;
  validateEarlyUnlockBytes?: boolean;
};

export type StacksBitcoinStakingAdapter = {
  buildLockScript(options: LockScriptOptions): Uint8Array;
  buildLockOutputScript(options: LockScriptOptions): Uint8Array;
  buildLockAddress(options: LockScriptOptions & { network: 'devnet' | 'testnet' }): string;
  buildUnlockScript(publicKey: Uint8Array): Uint8Array;
  computeRegisterPreimage(stxAddress: string): Uint8Array;
  computeMerkleBranch(txids: readonly string[], position: number): string[];
  buildLockProof(args: unknown): unknown;
  buildRegisterForBond(args: unknown): Promise<unknown>;
  buildAnnounceL1EarlyExit(args: unknown): Promise<unknown>;
  fetchBond(args: unknown): Promise<unknown>;
  fetchBondAllowance(args: unknown): Promise<bigint | undefined>;
  fetchBondStatus(args: unknown): Promise<string>;
  fetchPoxInfo(args: unknown): Promise<unknown>;
  firstPox5RewardCycle(args: unknown): number | undefined;
  bondGapCycles: number;
  fetchBondL1UnlockHeight(args: unknown): Promise<bigint>;
  fetchBondMembership(args: unknown): Promise<unknown>;
  minUstxForSatsAmount(args: unknown): bigint;
};

export type StacksApiClient = {
  baseUrl: string;
  fetch: typeof fetch;
};

export type StacksNetworkClient = {
  chainId: number;
  transactionVersion: number;
  peerNetworkId: number;
  magicBytes: string;
  bootAddress: string;
  addressVersion: { singleSig: number; multiSig: number };
  client: StacksApiClient;
};

type UnknownFunction = (...args: readonly unknown[]) => unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFunction(value: unknown): value is UnknownFunction {
  return typeof value === 'function';
}

function unwrapModule(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Stacks bitcoin-staking module did not export an object');
  if (isRecord(value.default)) return value.default;
  return value;
}

function readFunction(module: Record<string, unknown>, name: string): UnknownFunction {
  const value = module[name];
  if (!isFunction(value)) throw new Error(`Stacks bitcoin-staking module is missing ${name}()`);
  return value;
}

function readBytes(value: unknown, name: string): Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error(`${name}() did not return bytes`);
  return new Uint8Array(value);
}

function readString(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new Error(`${name}() did not return a string`);
  return value;
}

export async function assertPinnedStacksJsCheckout(config: Pox5LocalConfig): Promise<void> {
  if (config.stacksJs.root === undefined) return;
  const result = await execFileAsync('git', ['-C', config.stacksJs.root, 'rev-parse', 'HEAD']);
  const actual = result.stdout.trim();
  if (actual !== config.stacksJs.commit) {
    throw new Error(`STACKS_JS_ROOT is at ${actual}; expected ${config.stacksJs.commit}`);
  }
}

export function createStacksApiClient(config: Pox5LocalConfig): StacksApiClient {
  return { baseUrl: config.stacks.nodeUrl, fetch: globalThis.fetch };
}

export function createStacksNetwork(config: Pox5LocalConfig): StacksNetworkClient {
  return {
    chainId: config.stacks.chainId,
    transactionVersion: 128,
    peerNetworkId: 4_278_190_080,
    magicBytes: 'T2',
    bootAddress: 'ST000000000000000000002AMW42H',
    addressVersion: { singleSig: 26, multiSig: 21 },
    client: createStacksApiClient(config),
  };
}

export function loadStacksBitcoinStaking(config: Pox5LocalConfig): StacksBitcoinStakingAdapter {
  if (config.stacksJs.root !== undefined && isAbsolute(config.stacksJs.module)) {
    const modulePath = relative(config.stacksJs.root, config.stacksJs.module);
    if (modulePath.startsWith('..') || isAbsolute(modulePath)) {
      throw new Error(`Stacks bitcoin-staking module is outside STACKS_JS_ROOT: ${config.stacksJs.module}`);
    }
  }
  let loaded: unknown;
  try {
    loaded = loadModule(config.stacksJs.module);
  } catch (error) {
    throw new Error(
      `Unable to load ${config.stacksJs.module}. Build the pinned stacks.js checkout or set ` +
        `POX5_STACKS_BITCOIN_STAKING_MODULE to its package path: ${String(error)}`
    );
  }
  const module = unwrapModule(loaded);
  const buildLockScript = readFunction(module, 'buildLockScript');
  const buildLockOutputScript = readFunction(module, 'buildLockOutputScript');
  const buildLockAddress = readFunction(module, 'buildLockAddress');
  const buildUnlockScript = readFunction(module, 'buildUnlockScript');
  const computeRegisterPreimage = readFunction(module, 'computeRegisterPreimage');
  const computeMerkleBranch = readFunction(module, 'computeMerkleBranch');
  const buildLockProof = readFunction(module, 'buildLockProof');
  const buildRegisterForBond = readFunction(module, 'buildRegisterForBond');
  const buildAnnounceL1EarlyExit = readFunction(module, 'buildAnnounceL1EarlyExit');
  const fetchBond = readFunction(module, 'fetchBond');
  const fetchBondAllowance = readFunction(module, 'fetchBondAllowance');
  const fetchBondStatus = readFunction(module, 'fetchBondStatus');
  const fetchPoxInfo = readFunction(module, 'fetchPoxInfo');
  const firstPox5RewardCycle = readFunction(module, 'firstPox5RewardCycle');
  const bondGapCycles = module.BOND_GAP_CYCLES;
  if (typeof bondGapCycles !== 'number' || !Number.isSafeInteger(bondGapCycles) || bondGapCycles <= 0) {
    throw new Error('Stacks bitcoin-staking module exported an invalid BOND_GAP_CYCLES');
  }
  const fetchBondL1UnlockHeight = readFunction(module, 'fetchBondL1UnlockHeight');
  const fetchBondMembership = readFunction(module, 'fetchBondMembership');
  const minUstxForSatsAmount = readFunction(module, 'minUstxForSatsAmount');

  return {
    buildLockScript(options) {
      return readBytes(buildLockScript(options), 'buildLockScript');
    },
    buildLockOutputScript(options) {
      return readBytes(buildLockOutputScript(options), 'buildLockOutputScript');
    },
    buildLockAddress(options) {
      return readString(buildLockAddress(options), 'buildLockAddress');
    },
    buildUnlockScript(publicKey) {
      return readBytes(buildUnlockScript(publicKey), 'buildUnlockScript');
    },
    computeRegisterPreimage(stxAddress) {
      return readBytes(computeRegisterPreimage(stxAddress), 'computeRegisterPreimage');
    },
    computeMerkleBranch(txids, position) {
      const value = computeMerkleBranch(txids, position);
      if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
        throw new Error('computeMerkleBranch() did not return hex hashes');
      }
      return value;
    },
    buildLockProof(args) {
      return buildLockProof(args);
    },
    async buildRegisterForBond(args) {
      return await buildRegisterForBond(args);
    },
    async buildAnnounceL1EarlyExit(args) {
      return await buildAnnounceL1EarlyExit(args);
    },
    async fetchBond(args) {
      return await fetchBond(args);
    },
    async fetchBondAllowance(args) {
      const value = await fetchBondAllowance(args);
      return value === undefined ? undefined : BigInt(String(value));
    },
    async fetchBondStatus(args) {
      return readString(await fetchBondStatus(args), 'fetchBondStatus');
    },
    async fetchPoxInfo(args) {
      return await fetchPoxInfo(args);
    },
    firstPox5RewardCycle(args) {
      const value = firstPox5RewardCycle(args);
      return value === undefined ? undefined : Number(value);
    },
    bondGapCycles,
    async fetchBondL1UnlockHeight(args) {
      const value = await fetchBondL1UnlockHeight(args);
      return typeof value === 'bigint' ? value : BigInt(String(value));
    },
    async fetchBondMembership(args) {
      return await fetchBondMembership(args);
    },
    minUstxForSatsAmount(args) {
      const value = minUstxForSatsAmount(args);
      return typeof value === 'bigint' ? value : BigInt(String(value));
    },
  };
}
