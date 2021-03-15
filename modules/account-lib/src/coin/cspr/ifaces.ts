import { CLValue, PublicKey, RuntimeArgs } from 'casper-client-sdk';
import { BigNumberish } from '@ethersproject/bignumber';
import { KeyPair } from '.';

export interface CasperTransaction {
  // mandatory fields
  hash: string;
  from: string;
  fee: Fee;
  deployType: string;
  // optional fields
  startTime?: string;
  expiration?: number;
  // transfer fields
  to?: string;
  amount?: string; // also used for delegate/undelegate
  transferId?: number;
  // wallet init fields
  owner1?: string;
  owner2?: string;
  owner3?: string;
  // delegate / undelegate fields
  fromDelegate?: string;
  validator?: string;
}

export interface CasperNode {
  nodeUrl: string;
}

export interface SignatureData {
  signature: string;
  keyPair: KeyPair;
}

export interface Fee {
  gasLimit: string;
  gasPrice?: string;
}

export interface CasperTransferTransaction {
  amount: BigNumberish;
  target: PublicKey;
  id?: number;
  extraArguments: Map<string, CLValue>;
}

/**
 * Delegate Session Required Data
 */
export interface CasperDelegateTransaction {
  action: string;
  delegator: PublicKey;
  validator: PublicKey;
  amount: BigNumberish;
  extraArguments: Map<string, CLValue>;
}

export interface CasperModuleBytesTransaction {
  moduleBytes: Uint8Array;
  args: RuntimeArgs;
  extraArguments: Map<string, CLValue>;
}

export interface Owner {
  address: PublicKey;
  weight: number;
}

export type WalletInitContractArgs = Record<
  // This typo is on purpose since the contract we use for multisig wallet initialization expect this argument to be written like this.
  'action' | 'deployment_thereshold' | 'key_management_threshold' | 'accounts' | 'weights',
  CLValue
>;

export type DelegateUndelegateContractArgs = Record<'action' | 'delegator' | 'validator' | 'amount', CLValue>;

/**
 * Secp256k1 return type for sign operations
 */
export interface SignResponse {
  signature: Uint8Array;
  recid: number;
}
