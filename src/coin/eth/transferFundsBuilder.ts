import ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
import { BuildTransactionError } from '../baseCoin/errors';
import { sendMultiSigData } from './utils';
import { TransferBuilder } from './';

/** ETH transfer builder */
export class TransferFundsBuilder extends TransferBuilder {
  private _data: string;

  //initialize with default values for non mandatory fields
  constructor() {
    super();
    this._data = '0x';
  }

  data(additionalData: string): TransferFundsBuilder {
    this._data = additionalData;
    return this;
  }

  signAndBuild(): string {
    if (this.hasMandatoryFields()) {
      this.ethSignMsgHash();
      return sendMultiSigData(
        this._toAddress,
        new BigNumber(this._amount).toNumber(),
        this._data,
        this._expirationTime,
        this._sequenceId,
        this._signature,
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
      this._signKey !== undefined
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
}
