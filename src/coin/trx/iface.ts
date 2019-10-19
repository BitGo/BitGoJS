export interface AccountPermissionUpdateContract {
  // TODO: tbd
}

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

export interface DecodedTransaction {
  expiration: number;
  timestamp: number;
  contractType: ContractType;
  contract: TransferContract | AccountPermissionUpdateContract;
}

export enum ContractType {
  Transfer,
  AccountPermissionUpdate,
}

export interface TransferContract {
  amount: number;
  // base58 encoded addresses
  toAddress: string; 
  ownerAddress: string;
}
