import { ContractType, PermissionType } from "./enum";

export interface Account {
  publicKey: string;
  privateKey: string;
}

export interface Parameter {
  value: string;
  typeUrl: string;
}

export interface Contract {
  parameter: Parameter;
  type: string;
}

/**
 * This interface represents a form of:
 * @external https://github.com/BitGo/bitgo-account-lib/blob/5f282588701778a4421c75fa61f42713f56e95b9/resources/trx/protobuf/tron.proto#L239
 */
export interface TransactionReceipt {
  raw_data: RawTransaction;
  signature: Array<string>;
  
  /**
   * This does not exist in protobuf because it's attached by the node rpc calls.
   */
  txID?: string;
}

export interface RawTransaction {
  expiration: number;
  timestamp: number;
  contractType: ContractType;
  contract: TransferContract | AccountPermissionUpdateContract;
}

export interface TransferContract {
  amount: number;
  // base58 encoded addresses
  toAddress: string; 
  ownerAddress: string;
}

export interface AccountPermissionUpdateContract {
  ownerAddress: string;
  owner: Permission;
  witness?: Permission;
  actives: Array<Permission>;
}

export interface Permission {
  type: PermissionType;
  threshold: number;

}

export interface PermissionKey {
  address: string;
  weight: number;
}
