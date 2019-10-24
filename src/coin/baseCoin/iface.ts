import BigNumber from "bignumber.js";

export interface BaseAddress {
  address: any;
}

export interface BaseSignature {
  signature: any;
}

export interface BaseKey {
  key: any;
}

export interface Destination extends BaseAddress {
  value: BigNumber
}
