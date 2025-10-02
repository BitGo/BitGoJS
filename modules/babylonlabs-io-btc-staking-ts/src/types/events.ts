export type RegistrationStep =
  | "staking-slashing"
  | "unbonding-slashing"
  | "proof-of-possession"
  | "create-btc-delegation-msg";

export type WithdrawalType = "staking-expired" | "early-unbonded" | "slashing";

type EventData = Record<string, string | number | string[] | number[]>;

// Events are emitted by manager and used for the staking dashboard UI only.
export interface ManagerEvents {
  "delegation:create": (data?: EventData) => void;
  "delegation:register": (data?: EventData) => void;
  "delegation:stake": (data?: EventData) => void;
  "delegation:unbond": (data?: EventData) => void;
  "delegation:withdraw": (data?: EventData) => void;
  "delegation:expand": (data?: EventData) => void;
}

export type DelegationEvent = keyof ManagerEvents;
