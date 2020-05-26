import ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
import { BuildTransactionError } from '../baseCoin/errors';
import { sendMultiSigData } from './utils';
import { sendMultisigMethodId } from './walletUtil';
import { TransferBuilder } from './transferBuilder';

/** ETH transfer builder */
export class TransferFundsBuilder extends TransferBuilder {
  private _data: string;

  //initialize with default values for non mandatory fields
  constructor(serializedData?: string) {
    if (serializedData) {
      super(serializedData);
    } else {
      super();
    }
    this._data = '0x';
  }

  data(additionalData: string): TransferFundsBuilder {
    this._signature = undefined;
    this._data = additionalData;
    return this;
  }

  signAndBuild(): string {
    if (this.hasMandatoryFields()) {
      return sendMultiSigData(
        this._toAddress,
        new BigNumber(this._amount).toNumber(),
        this._data,
        this._expirationTime,
        this._sequenceId,
        this.getSignature(),
      );
    }
    throw new BuildTransactionError(
      'Missing transfer mandatory fields. Amount, destination (to) address, signing key and sequenceID are mandatory',
    );
  }

  protected hasMandatoryFields(): boolean {
    return (
      this._amount !== undefined &&
      this._toAddress !== undefined &&
      this._sequenceId !== undefined &&
      (this._signKey !== undefined || this._signature !== undefined)
    );
  }

  protected getOperationHash(): (string | Buffer)[][] {
    const operationData = [
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        'ETHER',
        new ethUtil.BN(ethUtil.stripHexPrefix(this._toAddress), 16),
        this._amount,
        new Buffer(ethUtil.stripHexPrefix(this._data) || '', 'hex'),
        this._expirationTime,
        this._sequenceId,
      ],
    ];
    return ethUtil.bufferToHex(EthereumAbi.soliditySHA3(...operationData));
  }

  protected decodeTransferData(data: string): void {
    if (!data.startsWith(sendMultisigMethodId)) {
      throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
    }
    const splitBytecode = data.split(sendMultisigMethodId);
    if (splitBytecode.length !== 2) {
      throw new BuildTransactionError(`Invalid send bytecode: ${data}`);
    }
    const serializedArgs = Buffer.from(splitBytecode[1], 'hex');
    const decoded = EthereumAbi.rawDecode(['address', 'uint', 'bytes', 'uint', 'uint', 'bytes'], serializedArgs);
    this._toAddress = ethUtil.bufferToHex(decoded[0]);
    this._amount = ethUtil.bufferToInt(decoded[1]).toString();
    this._data = ethUtil.bufferToHex(decoded[2]);
    this._expirationTime = ethUtil.bufferToInt(decoded[3]);
    this._sequenceId = ethUtil.bufferToInt(decoded[4]);
    this._signature = ethUtil.bufferToHex(decoded[5]);
  }
}
