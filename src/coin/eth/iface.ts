import { BaseFee } from '../baseCoin/iface';

export interface Fee extends BaseFee {
  gasLimit: string;
}

/**
 * A transaction's data.
 */
export interface TxData {
  gasLimit: string;
  gasPrice: string;
  to?: string;
  nonce: number;
  data: string;
  value: string;
  chainId?: string;
  from?: string;
  /**
   * EC recovery ID.
   */
  v?: string;
  /**
   * EC signature parameter.
   */
  r?: string;
  /**
   * EC signature parameter.
   */
  s?: string;
}

export interface FieldStruct {
  components?: any;
  name: string;
  inputs?: any;
  type: string;
}
