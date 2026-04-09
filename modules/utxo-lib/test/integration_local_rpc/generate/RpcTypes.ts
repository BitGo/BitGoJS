export type RpcInput = {
  txid: string;
};

export type RpcOutput = {
  value: number;
  scriptPubKey: {
    hex: string;
  };
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
