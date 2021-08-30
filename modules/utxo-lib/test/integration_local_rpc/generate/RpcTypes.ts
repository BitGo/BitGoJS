export type RpcInput = {
  txid: string;
};

export type RpcOutput = {
  value: number;
};

export type RpcTransaction = {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  hex: string;
  vin: RpcInput[];
  vout: RpcOutput[];
};
