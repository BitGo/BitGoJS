/**
 * Hand-rolled proto encoders for Msg types missing from cosmjs-types 0.6.1
 * (the version installed in this repo).
 *
 * Missing:
 *   - /cosmos.staking.v1beta1.MsgCancelUnbondingDelegation (added in cosmos-sdk v0.46)
 *   - /cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount (added in cosmos-sdk v0.46)
 *   - /cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount (added in cosmos-sdk v0.46)
 *   - /cosmos.gov.v1.MsgSubmitProposal (added in cosmos-sdk v0.46)
 *   - /cosmwasm.wasm.v1.MsgInstantiateContract2 (added in wasmd v0.30)
 *
 * Same wire-format machinery as sei-tokenfactory-proto.ts. Coin reuses the
 * cosmjs Coin proto. Each msg is encoded by hand against the canonical proto
 * source.
 */

import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

export const TYPE_URLS = {
  MsgCancelUnbondingDelegation: '/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation',
  MsgCreatePermanentLockedAccount: '/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount',
  MsgCreatePeriodicVestingAccount: '/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount',
  MsgSubmitProposalGovV1: '/cosmos.gov.v1.MsgSubmitProposal',
  MsgInstantiateContract2: '/cosmwasm.wasm.v1.MsgInstantiateContract2',
};

function encodeVarint(value: bigint | number): number[] {
  let v = typeof value === 'bigint' ? value : BigInt(value);
  const out: number[] = [];
  while (v >= 0x80n) {
    out.push(Number(v & 0x7fn) | 0x80);
    v >>= 7n;
  }
  out.push(Number(v & 0x7fn));
  return out;
}

function tag(field: number, wire: number): number[] {
  return encodeVarint((field << 3) | wire);
}
function writeString(field: number, value: string): number[] {
  if (!value) return [];
  const b = Buffer.from(value, 'utf-8');
  return [...tag(field, 2), ...encodeVarint(b.length), ...b];
}
function writeBytes(field: number, value: Uint8Array): number[] {
  if (!value || value.length === 0) return [];
  return [...tag(field, 2), ...encodeVarint(value.length), ...Array.from(value)];
}
function writeVarint(field: number, value: bigint | number): number[] {
  return [...tag(field, 0), ...encodeVarint(value)];
}
function writeBool(field: number, value: boolean): number[] {
  if (!value) return [];
  return [...tag(field, 0), 1];
}
function writeCoin(field: number, coin: { denom: string; amount: string }): number[] {
  const inner = Coin.encode(Coin.fromPartial(coin)).finish();
  return writeBytes(field, inner);
}
function writeCoinArray(field: number, coins: { denom: string; amount: string }[]): number[] {
  const out: number[] = [];
  for (const c of coins ?? []) out.push(...writeCoin(field, c));
  return out;
}

// ───── MsgCancelUnbondingDelegation ────────────────────────────────────────
export interface MsgCancelUnbondingDelegationValue {
  delegatorAddress: string;
  validatorAddress: string;
  amount: { denom: string; amount: string };
  creationHeight: string | bigint | number;
}
function encodeMsgCancelUnbonding(m: MsgCancelUnbondingDelegationValue): Uint8Array {
  const out = [
    ...writeString(1, m.delegatorAddress),
    ...writeString(2, m.validatorAddress),
    ...writeCoin(3, m.amount),
    ...writeVarint(4, typeof m.creationHeight === 'string' ? BigInt(m.creationHeight) : m.creationHeight),
  ];
  return Uint8Array.from(out);
}

// ───── MsgCreatePermanentLockedAccount ─────────────────────────────────────
export interface MsgCreatePermanentLockedAccountValue {
  fromAddress: string;
  toAddress: string;
  amount: { denom: string; amount: string }[];
}
function encodeMsgCreatePermanentLocked(m: MsgCreatePermanentLockedAccountValue): Uint8Array {
  const out = [
    ...writeString(1, m.fromAddress),
    ...writeString(2, m.toAddress),
    ...writeCoinArray(3, m.amount),
  ];
  return Uint8Array.from(out);
}

// ───── MsgCreatePeriodicVestingAccount ─────────────────────────────────────
export interface VestingPeriod {
  length: string | bigint | number; // seconds
  amount: { denom: string; amount: string }[];
}
export interface MsgCreatePeriodicVestingAccountValue {
  fromAddress: string;
  toAddress: string;
  startTime: string | bigint | number;
  vestingPeriods: VestingPeriod[];
}
function encodeVestingPeriod(p: VestingPeriod): Uint8Array {
  const len = typeof p.length === 'string' ? BigInt(p.length) : p.length;
  const out = [...writeVarint(1, len), ...writeCoinArray(2, p.amount)];
  return Uint8Array.from(out);
}
function encodeMsgCreatePeriodic(m: MsgCreatePeriodicVestingAccountValue): Uint8Array {
  const start = typeof m.startTime === 'string' ? BigInt(m.startTime) : m.startTime;
  const out: number[] = [
    ...writeString(1, m.fromAddress),
    ...writeString(2, m.toAddress),
    ...writeVarint(3, start),
  ];
  for (const p of m.vestingPeriods ?? []) {
    const pBytes = encodeVestingPeriod(p);
    out.push(...writeBytes(4, pBytes));
  }
  return Uint8Array.from(out);
}

// ───── gov v1 MsgSubmitProposal ────────────────────────────────────────────
export interface AnyValue {
  typeUrl: string;
  value: Uint8Array;
}
export interface MsgSubmitProposalGovV1Value {
  messages: AnyValue[];
  initialDeposit: { denom: string; amount: string }[];
  proposer: string;
  metadata?: string;
  title?: string;
  summary?: string;
  expedited?: boolean;
}
function encodeAny(a: AnyValue): Uint8Array {
  const out = [...writeString(1, a.typeUrl), ...writeBytes(2, a.value)];
  return Uint8Array.from(out);
}
function encodeGovV1Submit(m: MsgSubmitProposalGovV1Value): Uint8Array {
  const out: number[] = [];
  for (const msg of m.messages ?? []) out.push(...writeBytes(1, encodeAny(msg)));
  out.push(...writeCoinArray(2, m.initialDeposit ?? []));
  out.push(...writeString(3, m.proposer));
  if (m.metadata) out.push(...writeString(4, m.metadata));
  if (m.title) out.push(...writeString(5, m.title));
  if (m.summary) out.push(...writeString(6, m.summary));
  if (m.expedited) out.push(...writeBool(7, m.expedited));
  return Uint8Array.from(out);
}

// ───── wasm MsgInstantiateContract2 ────────────────────────────────────────
export interface MsgInstantiateContract2Value {
  sender: string;
  admin: string;
  codeId: string | bigint | number;
  label: string;
  msg: Uint8Array;
  funds: { denom: string; amount: string }[];
  salt: Uint8Array;
  fixMsg: boolean;
}
function encodeMsgInst2(m: MsgInstantiateContract2Value): Uint8Array {
  const codeId = typeof m.codeId === 'string' ? BigInt(m.codeId) : m.codeId;
  const out = [
    ...writeString(1, m.sender),
    ...writeString(2, m.admin),
    ...writeVarint(3, codeId),
    ...writeString(4, m.label),
    ...writeBytes(5, m.msg),
    ...writeCoinArray(6, m.funds),
    ...writeBytes(7, m.salt),
    ...writeBool(8, m.fixMsg),
  ];
  return Uint8Array.from(out);
}

export function missingProtosRegistryTypes(): [string, any][] {
  return [
    [
      TYPE_URLS.MsgCancelUnbondingDelegation,
      {
        encode: (m: MsgCancelUnbondingDelegationValue) => ({
          finish: () => encodeMsgCancelUnbonding(m),
        }),
        decode: () => {
          throw new Error('not implemented');
        },
        create: (m: any) => m,
        fromPartial: (m: any) => m,
      },
    ],
    [
      TYPE_URLS.MsgCreatePermanentLockedAccount,
      {
        encode: (m: MsgCreatePermanentLockedAccountValue) => ({
          finish: () => encodeMsgCreatePermanentLocked(m),
        }),
        decode: () => {
          throw new Error('not implemented');
        },
        create: (m: any) => m,
        fromPartial: (m: any) => m,
      },
    ],
    [
      TYPE_URLS.MsgCreatePeriodicVestingAccount,
      {
        encode: (m: MsgCreatePeriodicVestingAccountValue) => ({
          finish: () => encodeMsgCreatePeriodic(m),
        }),
        decode: () => {
          throw new Error('not implemented');
        },
        create: (m: any) => m,
        fromPartial: (m: any) => m,
      },
    ],
    [
      TYPE_URLS.MsgSubmitProposalGovV1,
      {
        encode: (m: MsgSubmitProposalGovV1Value) => ({
          finish: () => encodeGovV1Submit(m),
        }),
        decode: () => {
          throw new Error('not implemented');
        },
        create: (m: any) => m,
        fromPartial: (m: any) => m,
      },
    ],
    [
      TYPE_URLS.MsgInstantiateContract2,
      {
        encode: (m: MsgInstantiateContract2Value) => ({
          finish: () => encodeMsgInst2(m),
        }),
        decode: () => {
          throw new Error('not implemented');
        },
        create: (m: any) => m,
        fromPartial: (m: any) => m,
      },
    ],
  ];
}
