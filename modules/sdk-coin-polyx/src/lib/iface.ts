import { Args } from '@substrate/txwrapper-core';

export type AnyJson = string | number | boolean | null | { [key: string]: AnyJson } | Array<AnyJson>;

export interface RegisterDidWithCDDArgs extends Args {
  targetAccount: string;
  secondaryKeys: [];
  expiry: null;
}

export interface BondArgs extends Args {
  value: string;
  controller: string;
  payee: string | { Account: string };
}

export interface BondExtraArgs extends Args {
  maxAdditional: string;
}

export interface NominateArgs extends Args {
  targets: string[];
}

export interface BatchCallObject {
  method: string;
  args: Record<string, unknown>;
}

export type BatchCallArray = Array<BatchCallObject>;

export type ExtendedJson = AnyJson | BatchCallObject | BatchCallArray;

export interface BatchArgs extends Omit<Args, keyof Args> {
  [key: string]: ExtendedJson;
  calls: BatchCallObject[];
}

export interface BatchParams {
  [key: string]: ExtendedJson;
  calls: BatchCallObject[];
}
