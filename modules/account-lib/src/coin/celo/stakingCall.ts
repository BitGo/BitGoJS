import { ContractCall } from '@bitgo/sdk-coin-eth';

export class StakingCall extends ContractCall {
  public amount: string;
  public address: string;
  constructor(amount: string, address: string, _methodId: string, _types: string[], _params: string[]) {
    super(_methodId, _types, _params);
    this.amount = amount;
    this.address = address;
  }
}
