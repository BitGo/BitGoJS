/**
 * Validator picker for the atlantic-2 testnet. Returns one or two bonded
 * validator operator addresses (seivaloper1...) for use in MsgDelegate /
 * MsgUndelegate / MsgBeginRedelegate / MsgCancelUnbondingDelegation /
 * MsgWithdrawDelegatorReward.
 *
 * Cached briefly in-process; the testnet validator set is stable enough that
 * we don't need real freshness.
 */

import { lcdGet, DEFAULTS } from './sei-client';

interface Validator {
  operator_address: string;
  status: string;
  tokens: string;
  jailed: boolean;
}

let cached: Validator[] | null = null;

export async function listBondedValidators(): Promise<Validator[]> {
  if (cached) return cached;
  const body = await lcdGet(
    DEFAULTS.restEndpoint,
    '/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200'
  );
  const vs = (body?.validators ?? []) as Validator[];
  // Sort by tokens desc for stability across runs.
  cached = vs
    .filter((v) => !v.jailed && v.status === 'BOND_STATUS_BONDED')
    .sort((a, b) => (BigInt(b.tokens) > BigInt(a.tokens) ? 1 : -1));
  if (cached.length < 2) {
    throw new Error(
      `Only ${cached.length} bonded validators on atlantic-2; redelegate scenarios need >= 2.`
    );
  }
  return cached;
}

export async function pickValidator(index = 0): Promise<string> {
  const vs = await listBondedValidators();
  return vs[index % vs.length].operator_address;
}

export async function pickValidatorPair(): Promise<{ src: string; dst: string }> {
  const vs = await listBondedValidators();
  return { src: vs[0].operator_address, dst: vs[1].operator_address };
}
