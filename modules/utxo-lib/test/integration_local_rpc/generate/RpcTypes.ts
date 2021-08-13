export type RpcInput = {
  txid: string;
};

export type RpcOutput = {
  value: number;
};

export type RpcTransaction = {
  txid: string;
  hex: string;
  vin: RpcInput[];
  vout: RpcOutput[];
};
