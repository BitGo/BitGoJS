/**
 * @prettier
 */
import {
  IStakingWallet,
  StakingRequest,
  TransactionsReadyToSign,
  StakingTransaction,
  StakingPrebuildTransactionResult,
  StakingSignedTransaction,
  StakingSignOptions,
  StakeOptions,
  UnstakeOptions,
  DelegationResults,
  DelegationOptions,
} from './iStakingWallet';
import { BitGoBase } from '../bitgoBase';
import { IWallet } from '../wallet';
import { ITssUtils, RequestTracer, TssUtils } from '../utils';

export class StakingWallet implements IStakingWallet {
  private readonly bitgo: BitGoBase;

  public wallet: IWallet;
  public tssUtil: ITssUtils;

  constructor(wallet: IWallet) {
    this.wallet = wallet;
    this.bitgo = wallet.bitgo;
    this.tssUtil = new TssUtils(this.bitgo, this.wallet.baseCoin, this.wallet);
  }

  get walletId(): string {
    return this.wallet.id();
  }

  get coin(): string {
    return this.wallet.baseCoin.tokenConfig ? this.wallet.baseCoin.tokenConfig.type : this.wallet.coin();
  }

  /**
   * Stake coins
   * @param options - stake options
   * @return StakingRequest
   */
  async stake(options: StakeOptions): Promise<StakingRequest> {
    return await this.createStakingRequest(options.amount, 'STAKE', options.clientId);
  }

  /**
   * Unstake coins
   * @param options - unstake options
   * @return StakingRequest
   */
  async unstake(options: UnstakeOptions): Promise<StakingRequest> {
    return await this.createStakingRequest(options.amount, 'UNSTAKE', options.clientId, options.delegationId);
  }

  /**
   * Fetch delegations for a specific wallet
   * @param options - unstake options
   * @return StakingRequest
   */
  async delegations(options: DelegationOptions): Promise<DelegationResults> {
    return await this.getDelegations(options);
  }

  /**
   * Get a staking request by ID
   * @param stakingRequestId - id of the staking request to retrieve
   * @return StakingRequest
   */
  async getStakingRequest(stakingRequestId: string): Promise<StakingRequest> {
    return await this.bitgo.get(this.bitgo.microservicesUrl(this.stakingRequestUrl(stakingRequestId))).result();
  }

  /**
   * Get transactions ready to sign
   * @param stakingRequestId
   * @return TransactionsReadyToSign
   */
  async getTransactionsReadyToSign(stakingRequestId: string): Promise<TransactionsReadyToSign> {
    const stakingRequest: StakingRequest = await this.getStakingRequest(stakingRequestId);
    const readyToSign: StakingTransaction[] = stakingRequest.transactions.filter(
      (transaction: StakingTransaction) => transaction.status === `READY`
    );
    const newTransactions: StakingTransaction[] = stakingRequest.transactions.filter(
      (transaction: StakingTransaction) => transaction.status === `NEW`
    );

    return Promise.resolve({
      allSigningComplete:
        stakingRequest.transactions.length > 0 && newTransactions.length === 0 && readyToSign.length === 0,
      transactions: readyToSign,
    });
  }

  /**
   * Build the staking transaction
   * If TSS delete signature shares, else expand build params and then build
   * @param transaction - staking transaction to build
   */
  async build(transaction: StakingTransaction): Promise<StakingPrebuildTransactionResult> {
    if (this.wallet.baseCoin.supportsTss() && this.wallet.baseCoin.getFamily() !== 'eth') {
      if (!transaction.txRequestId) {
        throw new Error('txRequestId is required to sign and send');
      }
      // delete signature shares before signing for transaction request API
      await this.tssUtil.deleteSignatureShares(transaction.txRequestId);
      return {
        transaction: transaction,
        result: {
          walletId: this.walletId,
          txRequestId: transaction.txRequestId,
        },
      };
    } else {
      transaction = await this.expandBuildParams(transaction);
      if (!transaction.buildParams) {
        throw Error(`Staking transaction ${transaction.id} build params not expanded`);
      }
      return {
        transaction: transaction,
        result: await this.wallet.prebuildTransaction(transaction.buildParams),
      };
    }
  }

  /**
   * Sign the staking transaction
   * @param signOptions
   * @param stakingPrebuildTransaction
   */
  async sign(
    signOptions: StakingSignOptions,
    stakingPrebuildTransaction: StakingPrebuildTransactionResult
  ): Promise<StakingSignedTransaction> {
    const reqId = new RequestTracer();
    const keychain = await this.wallet.baseCoin.keychains().getKeysForSigning({
      wallet: this.wallet,
      reqId: reqId,
    });
    return {
      transaction: stakingPrebuildTransaction.transaction,
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
  async send(signedTransaction: StakingSignedTransaction): Promise<StakingTransaction> {
    return await this.bitgo
      .post(this.bitgo.microservicesUrl(this.stakingTransactionURL(signedTransaction.transaction)))
      .send(signedTransaction.signed)
      .result();
  }

  /**
   * Build, sign and send the transaction.
   * @param signOptions
   * @param transaction
   */
  async buildSignAndSend(
    signOptions: StakingSignOptions,
    transaction: StakingTransaction
  ): Promise<StakingTransaction> {
    return await this.build(transaction)
      .then((result: StakingPrebuildTransactionResult) => this.sign(signOptions, result))
      .then((result: StakingSignedTransaction) => this.send(result));
  }

  private async expandBuildParams(stakingTransaction: StakingTransaction): Promise<StakingTransaction> {
    return await this.bitgo
      .get(this.bitgo.microservicesUrl(this.stakingTransactionURL(stakingTransaction)))
      .query({ expandBuildParams: true })
      .result();
  }

  private async createStakingRequest(
    amount: string,
    type: string,
    clientId?: string,
    delegationId?: string
  ): Promise<StakingRequest> {
    return await this.bitgo
      .post(this.bitgo.microservicesUrl(this.stakingRequestsURL()))
      .send({
        amount: amount,
        clientId: clientId,
        type: type,
        delegationId: delegationId,
      })
      .result();
  }

  private stakingRequestsURL() {
    return `/api/staking/v1/${this.coin}/wallets/${this.walletId}/requests`;
  }

  private async getDelegations(options: DelegationOptions): Promise<DelegationResults> {
    return await this.bitgo.get(this.bitgo.microservicesUrl(this.stakingDelegationsURL())).query(options).result();
  }

  private stakingDelegationsURL() {
    return `/api/staking/v1/${this.coin}/wallets/${this.walletId}/delegations`;
  }

  private stakingRequestUrl(stakingRequestId: string): string {
    return `${this.stakingRequestsURL()}/${stakingRequestId}`;
  }

  private stakingTransactionURL(stakingTransaction: StakingTransaction): string {
    return `${this.stakingRequestUrl(stakingTransaction.stakingRequestId)}/transactions/${stakingTransaction.id}`;
  }
}
