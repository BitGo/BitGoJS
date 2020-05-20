import ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
import { BuildTransactionError } from '../baseCoin/errors';
import { sendMultiSigTokenData } from './utils';
import { TransferBuilder } from './';

/** ETH transfer token builder */
export class TransferTokenBuilder extends TransferBuilder {
  private _tokenContractAddress: string;

  tokenContractAddress(tokenContractAddress: string): TransferTokenBuilder {
    this._tokenContractAddress = tokenContractAddress;
    return this;
  }

  signAndBuild(): string {
    if (this.hasMandatoryFields()) {
      this.ethSignMsgHash();
      return sendMultiSigTokenData(
        this._toAddress,
        new BigNumber(this._amount).toNumber(),
        this._tokenContractAddress,
        this._expirationTime,
        this._sequenceId,
        this._signature,
      );
    }
    throw new BuildTransactionError(
      'Missing transfer mandatory fields. Amount, destination (to) address, token contract address, signing key and sequenceID are mandatory',
    );
  }

  protected hasMandatoryFields(): boolean {
    return (
      this._amount !== undefined &&
      this._toAddress !== undefined &&
      this._tokenContractAddress !== undefined &&
      this._sequenceId !== undefined &&
      this._signKey !== undefined
    );
  }

  protected getOperationHash(): (string | Buffer)[][] {
    const operationData = [
      ['string', 'address', 'uint', 'address', 'uint', 'uint'],
      [
        'ERC20',
        new ethUtil.BN(ethUtil.stripHexPrefix(this._toAddress), 16),
        this._amount,
        new ethUtil.BN(ethUtil.stripHexPrefix(this._tokenContractAddress), 16),
        this._expirationTime,
        this._sequenceId,
      ],
    ];
    return ethUtil.bufferToHex(EthereumAbi.soliditySHA3(...operationData));
  }
}
