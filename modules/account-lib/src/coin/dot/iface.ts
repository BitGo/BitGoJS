import { BaseTxInfo, TypeRegistry, DecodedUnsignedTx } from '@substrate/txwrapper-core/lib/types';

export interface Seed {
  seed: Uint8Array;
}
export type specNameType = 'kusama' | 'polkadot' | 'westend' | 'statemint' | 'statemine';

export interface TxData {
  sender: string;
  blockHash: string;
  blockNumber: number;
  genesisHash: string;
  metadataRpc: string;
  nonce: number;
  specVersion: number;
  transactionVersion: number;
  chainName: string;
  specName?: string;
  amount?: string;
  dest?: string;
  tip?: number;
  eraPeriod?: number;
  controller?: string;
  payee?: string;
}

export interface TransferArgs {
  dest: { id: string };
  value: string;
}

export type StakeArgsPayee =
  | 'Staked'
  | 'Stash'
  | 'Controller'
  | {
      Account: string;
    };

export type StakeArgsPayeeRaw = { controller?: null; stash?: null; staked?: null; account?: string };

export interface StakeArgs {
  value: string;
  controller: { id: string };
  payee: StakeArgsPayee;
}

export type proxyType =
  | 'any'
  | 'nontransfer'
  | 'governance'
  | 'staking'
  | 'unusedsudobalances'
  | 'identityjudgement'
  | 'cancelproxy';

export interface AddProxyArgs {
  delegate: string;
  delay: string | number;
  proxyType: proxyType;
}

export interface ProxyArgs {
  real: string;
  forceProxyType: proxyType;
  call:
    | string
    | {
        callIndex?: string;
        args?: string;
      };
}
export interface TxMethod {
  args: TransferArgs | StakeArgs | AddProxyArgs | ProxyArgs;
  name: 'transferKeepAlive' | 'bond' | 'addProxy' | 'proxy';
  pallet: string;
}

export interface DecodedTx extends Omit<DecodedUnsignedTx, 'method'> {
  method: TxMethod;
}

export interface SignedTxData {
  blockHash: string;
  blockNumber: string;
  genesisHash: string;
  specVersion: string;
  transactionVersion: string;
  chainName: string;
}

export interface CreateBaseTxInfo {
  baseTxInfo: BaseTxInfo;
  options: {
    metadataRpc: string;
    registry: TypeRegistry;
  };
}
