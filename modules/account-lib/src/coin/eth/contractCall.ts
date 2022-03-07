import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix, toBuffer } from 'ethereumjs-util';

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
    const args = EthereumAbi.rawEncode(this._types, this._params);
    return addHexPrefix(Buffer.concat([toBuffer(this._methodId), args]).toString('hex'));
  }
}

export function serializeAnyTypeContractCalls(methodId: string, types: string[], params: any) {
  const args = EthereumAbi.rawEncode(this._types, this._params);
  return addHexPrefix(Buffer.concat([toBuffer(this._methodId), args]).toString('hex'));
}
