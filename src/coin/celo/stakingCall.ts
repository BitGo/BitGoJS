import { ContractCall } from '../eth/contractCall';

export class StakingCall extends ContractCall {
  constructor(public amount: string, public address: string, _methodId: string, _types: string[], _params: string[]) {
    super(_methodId, _types, _params);
  }
}
