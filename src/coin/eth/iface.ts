import { TxData as ETHTxData, BufferLike } from 'ethereumjs-tx';
import { BaseFee } from '../baseCoin/iface';

export interface Fee extends BaseFee {
  gasLimit: string;
}

/**
 * A transaction's data.
 */
export interface TxData extends ETHTxData {
  /**
   * The chainId's nonce.
   */
  chainId?: BufferLike;
}

export interface FieldStruct {
  components?: any;
  name: string;
  inputs?: any;
  type: string;
}

export interface Decoded {
  data: Buffer | Buffer[];
  remainder: Buffer;
}

export interface FieldData {
  allowZero: boolean;
  allowLess: boolean;
  length: number;
  name: string;
}
