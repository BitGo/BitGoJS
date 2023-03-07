import { EVMRPCRequest, EVMRPCResult } from './types';
import { Wallet, WalletSignMessageOptions, WalletSignTypedDataOptions, SignTypedDataVersion } from '@bitgo/sdk-core';

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
   * @param param
   * @param walletPassphrase
   */
  async handleRPCCall(param: EVMRPCRequest, walletPassphrase: string): Promise<EVMRPCResult> {
    const { method, id, jsonrpc, params } = param;
    let result;

    switch (method) {
      case 'personal_sign':
        const walletSignMessageOptions: WalletSignMessageOptions = {
          message: {
            messageRaw: params[0],
          },
          walletPassphrase,
        };
        result = await this.wallet.signMessage(walletSignMessageOptions);
        break;
      case 'eth_signTypedData':
        const walletSignTypedDataOptions: WalletSignTypedDataOptions = {
          walletPassphrase,
          typedData: {
            typedDataRaw: params[0],
            version: SignTypedDataVersion.V4,
          },
        };
        result = await this.wallet.signTypedData(walletSignTypedDataOptions);
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
}
