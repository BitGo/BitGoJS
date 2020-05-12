import { BaseFee } from '../baseCoin/iface';

export interface Fee extends BaseFee {
  gasLimit: string;
}

export interface FieldStruct {
  components?: any;
  name: string;
  inputs?: any;
  type: string;
}

export interface TxJson {
  nonce: number;
  gasPrice: string;
  gasLimit: string;
  to?: string;
  value: string;
  data: string;
  from?: string;
  chainId?: number;
}
