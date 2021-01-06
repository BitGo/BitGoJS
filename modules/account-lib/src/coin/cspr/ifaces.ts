import { CLValue } from 'casper-client-sdk';

export interface Owner {
  address: string;
  weight: number;
}

export interface RunTimeArg {
  action: CLValue;
  weight: CLValue;
  account?: CLValue;
}