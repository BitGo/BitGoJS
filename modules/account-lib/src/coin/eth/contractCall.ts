import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix, toBuffer } from 'ethereumjs-util';

export class ContractCall {
  constructor(private _methodId: string, private _types: string[], private _params: string[]) {}

  serialize(): string {
    const args = EthereumAbi.rawEncode(this._types, this._params);
    return addHexPrefix(Buffer.concat([toBuffer(this._methodId), args]).toString('hex'));
  }
}
