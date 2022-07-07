import { defaultAbiCoder, hexConcat } from 'ethers/lib/utils';

export class ContractCall {
  private _methodId: string;
  private _types: string[];
  private _params: any[];

  constructor(_methodId: string, _types: string[], _params: any[]) {
    this._methodId = _methodId;
    this._types = _types;
    this._params = _params;
  }

  serialize(): string {
    const args = defaultAbiCoder.encode(this._types, this._params);
    return hexConcat([this._methodId, args]);
  }
}
