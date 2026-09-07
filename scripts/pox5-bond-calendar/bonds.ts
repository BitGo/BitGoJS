import { getNetwork } from './networks';
import { BondInput } from './calendar';

const MAX_UNLOCK_HEIGHT = 500_000_000;

function requirePositiveInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  throw new Error(`${field} must be a positive integer, got ${JSON.stringify(value)}`);
}

function requireNonNegativeInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw new Error(`${field} must be a non-negative integer, got ${JSON.stringify(value)}`);
}

function parseAmount(value: unknown, field: string): bigint | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'bigint') {
    if (value <= 0n) {
      throw new Error(`${field} must be a positive amount`);
    }
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} must be a positive integer amount`);
    }
    return BigInt(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new Error(`${field} must be a decimal string or positive integer, got ${String(value)}`);
}

function validateBond(raw: unknown, origin: string): BondInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`${origin}: bond must be an object`);
  }
  const bond = raw as Record<string, unknown>;
  const network = bond.network;
  if (typeof network !== 'string') {
    throw new Error(`${origin}: "network" is required (one of the PoX-5 networks)`);
  }
  const net = getNetwork(network);

  const label = bond.label === undefined ? undefined : String(bond.label);
  const amount = parseAmount(bond.amount, `${origin}: amount`);
  const unlockBurnHeight = requirePositiveInt(bond.unlockBurnHeight, `${origin}: unlockBurnHeight`);
  if (unlockBurnHeight !== undefined && unlockBurnHeight >= MAX_UNLOCK_HEIGHT) {
    throw new Error(`${origin}: unlockBurnHeight must be below ${MAX_UNLOCK_HEIGHT}`);
  }
  const lockHeight = requireNonNegativeInt(bond.lockHeight, `${origin}: lockHeight`);
  const startBurnHt = requireNonNegativeInt(bond.startBurnHt, `${origin}: startBurnHt`);
  const numCycles = requirePositiveInt(bond.numCycles, `${origin}: numCycles`);

  const parsed: BondInput = { network, label, amount, unlockBurnHeight, lockHeight, startBurnHt, numCycles };
  if (!net.stacksOnly && parsed.unlockBurnHeight === undefined) {
    throw new Error(`${origin}: unlockBurnHeight is required for a BTC-backed bond on ${network}`);
  }
  if (net.stacksOnly && parsed.unlockBurnHeight !== undefined) {
    throw new Error(`${origin}: network ${network} is STX-only and does not take unlockBurnHeight`);
  }
  return parsed;
}

export function parseBondsJson(text: string): BondInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`bond file is not valid JSON: ${(error as Error).message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('bond file must be a JSON array of bond objects');
  }
  return parsed.map((entry, index) => validateBond(entry, `bond file entry ${index}`));
}

export function validateSingleBond(network: string, fields: Omit<BondInput, 'network'>): BondInput {
  return validateBond({ ...fields, network }, 'CLI bond');
}
