/**
 * @prettier
 */
import {
  ILinkWallet,
  TransferRequest,
  LinkPrebuildTransactionResult,
  LinkSignOptions,
  LinkSignedTransaction,
  TransferOptions,
} from './iLinkWallet';
import { BitGoBase } from '../bitgoBase';
import { IWallet } from '../wallet';
import { ITssUtils, RequestTracer, TssUtils } from '../utils';

export class LinkWallet implements ILinkWallet {
  private readonly bitgo: BitGoBase;

  public wallet: IWallet;
  public tssUtil: ITssUtils;
  private readonly isEthTss: boolean;

  constructor(wallet: IWallet, isEthTss: boolean) {
    this.wallet = wallet;
    this.bitgo = wallet.bitgo;
    this.tssUtil = new TssUtils(this.bitgo, this.wallet.baseCoin, this.wallet);
    this.isEthTss = isEthTss;
  }

  get walletId(): string {
    return this.wallet.id();
  }

  get coin(): string {
    return this.wallet.baseCoin.tokenConfig ? this.wallet.baseCoin.tokenConfig.type : this.wallet.coin();
  }

  /**
   * Transfer from BitGo to an Exchange
   * @param options - transfer options
   * @return TransferRequest
   */
  async transfer(options: TransferOptions): Promise<TransferRequest> {
    return await this.createTransferRequest({
      amount: options.amount,
      connectionId: options.connectionId,
      enterpriseId: this.wallet.toJSON().enterprise,
      walletId: this.walletId,
      coin: this.coin,
    });
  }

  /**
   * Build the transfer transaction
   * @param transfer - transfer to build
   */
  async build(transfer: TransferRequest): Promise<LinkPrebuildTransactionResult> {
    if (transfer.status !== 'READY') {
      throw new Error(`Invalid transfer request status: ${transfer.status}`);
    } else if ((this.wallet.baseCoin.supportsTss() && this.wallet.baseCoin.getFamily() !== 'eth') || this.isEthTss) {
      if (!transfer.txRequestId) {
        throw new Error('txRequestId is required to sign and send');
      }
      // delete signature shares before signing for transaction request API
      await this.tssUtil.deleteSignatureShares(transfer.txRequestId);
      return {
        transfer,
        result: {
          walletId: this.walletId,
          txRequestId: transfer.txRequestId,
        },
      };
    } else {
      return {
        transfer,
        result: await this.wallet.prebuildTransaction({
          recipients: [
            {
              address: transfer.receiveAddress,
              amount: transfer.amount,
            },
          ],
        }),
      };
    }
  }

  /**
   * Sign the transfer transaction
   * @param signOptions
   * @param stakingPrebuildTransaction
   */
  async sign(
    signOptions: LinkSignOptions,
    stakingPrebuildTransaction: LinkPrebuildTransactionResult
  ): Promise<LinkSignedTransaction> {
    const reqId = new RequestTracer();
    const keychain = await this.wallet.baseCoin.keychains().getKeysForSigning({
      wallet: this.wallet,
      reqId: reqId,
    });
    return {
      transfer: stakingPrebuildTransaction.transfer,
      signed: await this.wallet.signTransaction({
        txPrebuild: stakingPrebuildTransaction.result,
        walletPassphrase: signOptions.walletPassphrase,
        keychain: keychain[0],
      }),
    };
  }

  /**
   * Send the signed staking transaction
   * @param signedTransaction
   */
  async send(signedTransaction: LinkSignedTransaction): Promise<TransferRequest> {
    const transferId = signedTransaction.transfer.id;
    const enterpriseId = this.wallet.toJSON().enterprise;
    const coin = this.wallet.coin();
    const walletId = this.wallet.id();
    return await this.bitgo
      .post(this.bitgo.microservicesUrl(this.sendTransferURL(enterpriseId, transferId, coin, walletId)))
      .send(signedTransaction.signed)
      .result();
  }

  /**
   * Build, sign and send the transfer transaction.
   * @param signOptions
   * @param transfer
   */
  async buildSignAndSend(signOptions: LinkSignOptions, transfer: TransferRequest): Promise<TransferRequest> {
    return await this.build(transfer)
      .then((result: LinkPrebuildTransactionResult) => this.sign(signOptions, result))
      .then((result: LinkSignedTransaction) => this.send(result));
  }

  private async createTransferRequest({
    enterpriseId,
    walletId,
    coin,
    amount,
    connectionId,
  }: {
    enterpriseId: string;
    walletId: string;
    coin: string;
    amount: string;
    connectionId: string;
  }): Promise<TransferRequest> {
    return await this.bitgo
      .post(this.bitgo.microservicesUrl(this.transfersURL(enterpriseId)))
      .send({
        walletId,
        amount,
        coin,
        connectionId,
      })
      .result();
  }

  private linkURL(enterpriseId: string) {
    return `/api/external-exchange/v1/enterprise/${enterpriseId}`;
  }

  private transfersURL(enterpriseId: string) {
    return `${this.linkURL(enterpriseId)}/transfers`;
  }

  private sendTransferURL(enterpriseId: string, transferId: string, coin: string, walletId: string) {
    return `${this.linkURL(enterpriseId)}/${coin}/wallets/${walletId}/transfers/${transferId}/send`;
  }
}
