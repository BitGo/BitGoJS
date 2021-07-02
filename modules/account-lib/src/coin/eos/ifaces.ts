import ser from 'eosjs/dist/eosjs-serialize';

export interface RawAbi {
  accountName: string;
  abi?: Uint8Array;
}
interface AuthKey {
  key: string;
  weight: number;
}

interface Permission {
  actor: string;
  permission: string;
}

interface AuthAccount {
  permission: ser.Authorization;
  weight: number;
}

interface Auth {
  threshold: number;
  accounts: AuthAccount[];
  keys: AuthKey[];
}

export interface ActionData {
  from?: string; // transfer, delegatebw, undelegatebw
  to?: string; // transfer
  quantity?: string; // transfer
  memo?: string; // transfer
  bytes?: number; // buyrambytes
  transfer?: boolean; // delegatebw, undelegatebw
  stake_net_quantity?: string; // delegatebw, undelegatebw
  stake_cpu_quantity?: string; // delegatebw, undelegatebw
  creator?: string; // newaccount
  name?: string; // newaccount
  owner?: {
    // newaccount
    threshold: number;
    keys: AuthKey[];
    accounts: string[];
    waits: string[];
  };
  active?: {
    // newaccount
    threshold: number;
    keys: AuthKey[];
    accounts: string[];
    waits: string[];
  };
  payer?: string; // buyrambytes
  receiver?: string; // delegatebw, undelegatebw, buyrambytes
  code?: string; // setcode, linkauth, unlinkauth
  account?: string; // setcode, setabi, updateauth, deleteauth, linkauth, unlinkauth
  abi?: string; // setabi
  permission?: string; // updateauth, deleteauth
  parent?: string; // updateauth
  auth?: Auth; // updateauth
  type?: string; // linkauth, unlinkauth
  requirement?: string; // linkauth
  proposer?: string; // approve, unapprove, propose, cancel, exec
  proposal_name?: string; // approve, unapprove, propose, cancel, exec
  level?: Permission; // approve, unapprove
  canceler?: string; // cancel
  executer?: string; // exec
  voter?: string; // voteproducer
  proxy?: string; // voteproducer
  producers?: string[]; // voteproducer
  // propose
  requested?: Permission[];
  trx?: {
    expiration: string;
    ref_block_num: number;
    ref_block_prefix: number;
    max_net_usage_words: number;
    max_cpu_usage_ms: number;
    delay_sec: number;
    context_free_actions: [];
    actions: ser.SerializedAction[];
    transaction_extensions: [];
  };
}

export interface Action {
  account: string;
  name: string;
  authorization: Authorization[];
  data: ActionData | string;
  hex_data?: string;
}

interface jsonAction {
  data: ActionData;
}

export interface TxJson {
  actions: jsonAction[];
}

export interface TxData {
  actions: Action[];
  expiration?: string;
  ref_block_num?: number;
  ref_block_prefix?: number;
  max_net_usage_words?: number;
  max_cpu_usage_ms?: number;
  delay_sec?: number;
  context_free_actions?: Action[];
  context_free_data?: Uint8Array[];
  transaction_extensions?: [number, string][];
}
export interface Authorization {
  actor: string;
  permission: string;
}
