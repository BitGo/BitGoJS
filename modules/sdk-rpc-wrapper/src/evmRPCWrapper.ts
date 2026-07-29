import { EVMRPCRequest, EVMRPCResult, EVMRPCTransactionOptions } from './types';
import {
  Wallet,
  WalletSignMessageOptions,
  WalletSignTypedDataOptions,
  SignTypedDataVersion,
  SendManyOptions,
} from '@bitgo/sdk-core';
import { hexStringToNumber } from '@bitgo/sdk-coin-eth';
import { personal_sign, eth_signTypedData, eth_sendTransaction } from './constants';

export class EvmRPCWrapper {
  private wallet: Wallet;

  constructor(wallet: Wallet) {
    if (!wallet.baseCoin.isEVM()) {
      throw new Error(`${wallet.coin()} is not an EVM coin.`);
    }
    this.wallet = wallet;
  }

  /**
   * Handles RPC call from an EVM provider and invokes the appropriate BitGo SDK wallet method.
   *
   * @evmrpcRequest request
   * @evmrpcRequest walletPassphrase
   */
  async handleRPCCall(request: EVMRPCRequest, walletPassphrase: string): Promise<EVMRPCResult> {
    const { method, id, jsonrpc, params } = request;
    let result;

    switch (method) {
      case personal_sign:
        const walletSignMessageOptions: WalletSignMessageOptions = {
          message: {
            messageRaw: params[0],
          },
          walletPassphrase,
        };
        result = await this.wallet.signMessage(walletSignMessageOptions);
        break;
      case eth_signTypedData:
        const walletSignTypedDataOptions: WalletSignTypedDataOptions = {
          walletPassphrase,
          typedData: {
            typedDataRaw: params[0],
            version: SignTypedDataVersion.V4,
          },
        };
        result = await this.wallet.signTypedData(walletSignTypedDataOptions);
        break;

      case eth_sendTransaction:
        let option = params[0];
        if (this.isString(params[0])) {
          option = JSON.parse(params[0]);
        }
        result = await this.sendTransaction(option as unknown as EVMRPCTransactionOptions);
        break;
      default:
        throw new Error(`method '${method}' not yet implemented`);
    }

    return {
      id,
      jsonrpc,
      result,
    };
  }

  private async sendTransaction(options: EVMRPCTransactionOptions): Promise<any> {
    const { to, data, gasPrice, gasLimit, value } = options;

    const sendManyOptions: SendManyOptions = {
      recipients: [
        {
          address: to,
          amount: value,
          data,
        },
      ],
      gasPrice: hexStringToNumber(gasPrice),
      gasLimit: hexStringToNumber(gasLimit),
    };
    return await this.wallet.sendMany(sendManyOptions);
  }

  private isString(str: string): boolean {
    if (str != null && typeof str.valueOf() === 'string') {
      return true;
    }
    return false;
  }
}
