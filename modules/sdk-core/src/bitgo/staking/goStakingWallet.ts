/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { IWallet, PrebuildTransactionResult } from '../wallet';
import {
  FrontTransferSendRequest,
  GoStakeFinalizeOptions,
  GoStakeOptions,
  GoStakingRequest,
  GoUnstakeOptions,
  IGoStakingWallet,
  UnsignedGoStakingRequest,
} from './iGoStakingWallet';
import assert from 'assert';

export class GoStakingWallet implements IGoStakingWallet {
  private readonly bitgo: BitGoBase;

  public wallet: IWallet;

  constructor(wallet: IWallet) {
    this.wallet = wallet;
    this.bitgo = wallet.bitgo;
  }

  get accountId(): string {
    return this.wallet.id();
  }

  async stake(coin: string, options: GoStakeOptions): Promise<GoStakingRequest> {
    // call preivew
    const preview = await this.previewStake(coin, options);

    // call sign
    const halfSignedTransaction = (await this.wallet.prebuildAndSignTransaction({
      prebuildTx: {
        payload: preview.payload,
      } as PrebuildTransactionResult,
    })) as FrontTransferSendRequest;

    // call finalize
    assert(halfSignedTransaction.halfSigned?.payload, 'missing payload in half signed transaction');
    const finalOptions: GoStakeFinalizeOptions = {
      amount: options.amount,
      clientId: options.clientId,
      frontTransferSendRequest: {
        halfSigned: {
          payload: halfSignedTransaction.halfSigned.payload,
        },
      },
    };
    return (await this.finalizeStake(coin, finalOptions)) as GoStakingRequest;
  }

  /**
   * Unstake request
   * @param coin
   * @param options
   */
  async unstake(coin: string, options: GoUnstakeOptions): Promise<GoStakingRequest> {
    return (await this.createGoStakingRequest(coin, options, 'finalize', 'UNSTAKE')) as GoStakingRequest;
  }

  /**
   * Preview staking request
   * @param coin
   * @param options
   */
  private async previewStake(coin: string, options: GoStakeOptions): Promise<UnsignedGoStakingRequest> {
    return (await this.createGoStakingRequest(coin, options, 'preview', 'STAKE')) as UnsignedGoStakingRequest;
  }

  /**
   * Finalize staking request
   * will prepare the payload and sign the transaction
   * and submit it to the go-staking-service
   * @param coin
   * @param options
   */
  private async finalizeStake(coin: string, options: GoStakeFinalizeOptions): Promise<GoStakingRequest> {
    return (await this.createGoStakingRequest(coin, options, 'finalize', 'STAKE')) as GoStakingRequest;
  }

  /**
   * Get go staking request
   * @param coin
   * @param goStakingRequestId
   */
  async getGoStakingRequest(coin: string, goStakingRequestId: string): Promise<GoStakingRequest> {
    return await this.bitgo
      .get(this.bitgo.microservicesUrl(this.getGoStakingRequestURL(coin, goStakingRequestId)))
      .result();
  }

  private async createGoStakingRequest(
    coin: string,
    options: GoStakeOptions | GoStakeFinalizeOptions | GoUnstakeOptions,
    path: 'preview' | 'finalize',
    type: string
  ): Promise<GoStakingRequest | UnsignedGoStakingRequest> {
    return await this.bitgo
      .post(this.bitgo.microservicesUrl(`${this.goStakingRequestBaseURL(coin)}/${path}`))
      .send({
        ...options,
        type: type,
      })
      .result();
  }

  private goStakingBaseURL() {
    return `/api/go-staking/v1`;
  }

  private goStakingRequestBaseURL(coin: string) {
    return `${this.goStakingBaseURL()}/${coin}/accounts/${this.accountId}/requests`;
  }

  private getGoStakingRequestURL(coin: string, stakingRequestId: string): string {
    return `${this.goStakingRequestBaseURL(coin)}/${stakingRequestId}`;
  }
}
