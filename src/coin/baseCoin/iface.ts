import BigNumber from "bignumber.js";

export interface BaseAddress {
  address: any;
}

export interface BaseKey {
  key: any;
}

/**
 * Key pair in the protocol default format.
 */
export type DefaultKeys = {
  prv?: string;
  pub: string;
}

/**
 * Key pair in extended format. Used for coins supporting secp256k1 elliptic curve.
 */
export type ExtendedKeys = {
  xprv?: string;
  xpub: string;
}

export interface Destination extends BaseAddress {
  value: BigNumber
}
