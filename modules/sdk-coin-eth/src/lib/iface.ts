import { BaseFee } from '@bitgo/sdk-core';
import { KeyPair } from './keyPair';

export interface EthFee extends BaseFee {
  gasLimit: string;
}

export interface LegacyFee extends EthFee {
  gasPrice?: string;
  eip1559?: never;
}

export interface EIP1559Fee extends EthFee {
  gasPrice?: never;
  eip1559: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
}

export type Fee = LegacyFee | EIP1559Fee;

/**
 * A transaction's data.
 */
export interface BaseTxData {
  to?: string;
  gasLimit: string;
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

export const ETHTransactionType = {
  LEGACY: 'Legacy',
  EIP1559: 'EIP1559',
} as const;

// eslint-disable-next-line no-redeclare
export type ETHTransactionType = (typeof ETHTransactionType)[keyof typeof ETHTransactionType];

export interface LegacyTxData extends BaseTxData {
  _type: typeof ETHTransactionType.LEGACY;
  gasPrice: string;
  maxFeePerGas?: never;
  maxPriorityFeePerGas?: never;
}

export interface EIP1559TxData extends BaseTxData {
  _type: typeof ETHTransactionType.EIP1559;
  gasPrice?: never;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export type TxData = EIP1559TxData | LegacyTxData;

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
  amount: string;
}

export interface ERC721TransferData extends TokenTransferData {
  from: string;
  tokenId: string;
  userData: string;
}

export interface ERC1155TransferData extends TokenTransferData {
  from: string;
  tokenIds: string[];
  values: string[];
  userData: string;
}

export interface FlushTokensData {
  forwarderAddress: string;
  tokenAddress: string;
}

export interface NativeTransferData extends TransferData {
  data: string;
}

export interface WalletInitializationData {
  salt?: string;
  owners: string[];
}

export interface ForwarderInitializationData {
  baseAddress?: string;
  addressCreationSalt?: string;
}
