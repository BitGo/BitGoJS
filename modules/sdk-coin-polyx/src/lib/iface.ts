import { Args } from '@substrate/txwrapper-core';
import { Interface } from '@bitgo/abstract-substrate';
import { DecodedUnsignedTx } from '@substrate/txwrapper-core/lib/types';

export interface RegisterDidWithCDDArgs extends Args {
  targetAccount: string;
  secondaryKeys: [];
  expiry: null;
}

export interface TxMethod extends Omit<Interface.TxMethod, 'args'> {
  args:
    | Interface.TransferArgs
    | Interface.TransferAllArgs
    | Interface.AddStakeArgs
    | Interface.RemoveStakeArgs
    | RegisterDidWithCDDArgs;
}

export interface DecodedTx extends Omit<DecodedUnsignedTx, 'method'> {
  method: TxMethod;
}

export interface WithdrawUnbondedArgs extends Args {
  numSlashingSpans: number;
}

export interface BatchArgs {
  calls: {
    method: string;
    args: Record<string, unknown>;
  }[];
}
