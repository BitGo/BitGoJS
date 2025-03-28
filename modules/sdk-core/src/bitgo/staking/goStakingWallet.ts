/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { IWallet, PrebuildTransactionResult } from '../wallet';
import {
  BaseGoStakeOptions,
  FrontTransferSendRequest,
  GoStakeFinalizeOptions,
  GoStakeOptions,
  GoStakingRequest,
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

  async stake(options: GoStakeOptions): Promise<GoStakingRequest> {
    // call preview
    const preview = await this.previewStake({
      amount: options.amount,
      clientId: options.clientId,
    } as BaseGoStakeOptions);

    // sign the transaction
    const halfSignedTransaction = (await this.wallet.prebuildAndSignTransaction({
      walletPassphrase: options.walletPassphrase,
      prebuildTx: {
        payload: preview.payload,
      } as PrebuildTransactionResult,
    })) as FrontTransferSendRequest;

    // call finalize to submit the go staking request to go staking service
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
    return (await this.finalizeStake(finalOptions)) as GoStakingRequest;
  }

  /**
   * Unstake request
   * @param options
   */
  async unstake(options: BaseGoStakeOptions): Promise<GoStakingRequest> {
    return (await this.createGoStakingRequest(options, 'finalize', 'UNSTAKE')) as GoStakingRequest;
  }

  /**
   * Preview staking request
   * @param options
   */
  private async previewStake(options: BaseGoStakeOptions): Promise<UnsignedGoStakingRequest> {
    return (await this.createGoStakingRequest(options, 'preview', 'STAKE')) as UnsignedGoStakingRequest;
  }

  /**
   * Finalize staking request
   * will prepare the payload and sign the transaction
   * and submit it to the go-staking-service
   * @param options
   */
  private async finalizeStake(options: GoStakeFinalizeOptions): Promise<GoStakingRequest> {
    return (await this.createGoStakingRequest(options, 'finalize', 'STAKE')) as GoStakingRequest;
  }

  /**
   * Get go staking request
   * @param goStakingRequestId
   */
  async getGoStakingRequest(goStakingRequestId: string): Promise<GoStakingRequest> {
    return await this.bitgo.get(this.bitgo.microservicesUrl(this.getGoStakingRequestURL(goStakingRequestId))).result();
  }

  private async createGoStakingRequest(
    options: BaseGoStakeOptions | GoStakeFinalizeOptions,
    path: 'preview' | 'finalize',
    type: string
  ): Promise<GoStakingRequest | UnsignedGoStakingRequest> {
    return await this.bitgo
      .post(this.bitgo.microservicesUrl(`${this.goStakingRequestBaseURL()}/${path}`))
      .send({
        ...options,
        type: type,
      })
      .result();
  }

  private goStakingBaseURL() {
    return `/api/go-staking/v1`;
  }

  private goStakingRequestBaseURL() {
    return `${this.goStakingBaseURL()}/${this.wallet.baseCoin.getChain()}/accounts/${this.accountId}/requests`;
  }

  private getGoStakingRequestURL(stakingRequestId: string): string {
    return `${this.goStakingRequestBaseURL()}/${stakingRequestId}`;
  }
}
