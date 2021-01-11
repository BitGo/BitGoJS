import { BaseFee } from '../baseCoin/iface';
import { KeyPair } from './keyPair';

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
  deployedAddress?: string;
  from?: string;
  id?: string;
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

/**
 * An Ethereum transaction with helpers for serialization and deserialization.
 */
export interface EthLikeTransactionData {
  /**
   * Sign this transaction with the given key
   *
   * @param keyPair The key to sign the transaction with
   */
  sign(keyPair: KeyPair);

  /**
   * Return the JSON representation of this transaction
   */
  toJson(): TxData;

  /**
   * Return the hex string serialization of this transaction
   */
  toSerialized(): string;
}

export interface FieldStruct {
  components?: any;
  name: string;
  inputs?: any;
  type: string;
}

export interface SignatureParts {
  v: string;
  r: string;
  s: string;
}

export interface ContractMethodConfig {
  contractAddress: string;
  methodId: string;
  types: string[];
}

export interface TransferData {
  to: string;
  amount: string;
  expireTime: number;
  sequenceId: number;
  signature: string;
  tokenContractAddress?: string;
  data?: string;
}

export interface TokenTransferData extends TransferData {
  tokenContractAddress: string;
}

export interface FlushTokensData {
  forwarderAddress: string;
  tokenAddress: string;
}

export interface NativeTransferData extends TransferData {
  data: string;
}
