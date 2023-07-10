/**
 * @prettier
 */
import {
  DelegationOptions,
  DelegationResults,
  IStakingWallet,
  StakeOptions,
  StakingPrebuildTransactionResult,
  StakingRequest,
  StakingSignedTransaction,
  StakingSignOptions,
  StakingTransaction,
  SwitchValidatorOptions,
  TransactionsReadyToSign,
  UnstakeOptions,
  EthUnstakeOptions,
  ClaimRewardsOptions,
} from './iStakingWallet';
import { BitGoBase } from '../bitgoBase';
import { IWallet } from '../wallet';
import { ITssUtils, RequestTracer, TssUtils } from '../utils';

export class StakingWallet implements IStakingWallet {
  private readonly bitgo: BitGoBase;
  private tokenParentWallet?: IWallet;
  private readonly isEthTss: boolean;

  public wallet: IWallet;
  public tssUtil: ITssUtils;

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
   * Stake coins
   * @param options - stake options
   * @return StakingRequest
   */
  async stake(options: StakeOptions): Promise<StakingRequest> {
    return await this.createStakingRequest(options, 'STAKE');
  }

  /**
   * Unstake coins
   * @param options - unstake options
   * @return StakingRequest
   */
  async unstake(options: UnstakeOptions | EthUnstakeOptions): Promise<StakingRequest> {
    return await this.createStakingRequest(options, 'UNSTAKE');
  }

  /**
   * Submit a request to switch the validator used for a specific delegation
   * This will create a new delegation with the new validator address and mark the old delegation as inactive
   * @param options - switch validator options
   * @return StakingRequest
   */
  async switchValidator(options: SwitchValidatorOptions): Promise<StakingRequest> {
    return await this.createStakingRequest(options, 'SWITCH_VALIDATOR');
  }

  /**
   * Submit a request to claim rewards for a specific delegation
   * @param options - claim rewards options
   * @return StakingRequest
   */
  async claimRewards(options: ClaimRewardsOptions): Promise<StakingRequest> {
    return await this.createStakingRequest(options, 'CLAIM_REWARDS');
  }

  /**
   * Cancel staking request
   * @param stakingRequestId - id of the staking request to cancel
   * @return StakingRequest
   */
  async cancelStakingRequest(stakingRequestId: string): Promise<StakingRequest> {
    return await this.bitgo.del(this.bitgo.microservicesUrl(this.stakingRequestUrl(stakingRequestId))).result();
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
    if ((this.wallet.baseCoin.supportsTss() && this.wallet.baseCoin.getFamily() !== 'eth') || this.isEthTss) {
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
        result: await (await this.getWalletForBuildingAndSigning()).prebuildTransaction(transaction.buildParams),
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
      signed: await (
        await this.getWalletForBuildingAndSigning()
      ).signTransaction({
        txPrebuild: stakingPrebuildTransaction.result,
        walletPassphrase: signOptions.walletPassphrase,
        keychain: keychain[0],
      }),
    };
  }

  /**
   * Send the signed staking transaction if required. Send call is not required if api version is full
   * and this method will return the staking transaction from the incoming object.
   * @param signedTransaction
   */
  async send(signedTransaction: StakingSignedTransaction): Promise<StakingTransaction> {
    if (this.isSendCallRequired()) {
      return await this.bitgo
        .post(this.bitgo.microservicesUrl(this.stakingTransactionURL(signedTransaction.transaction)))
        .send(signedTransaction.signed)
        .result();
    }
    return signedTransaction.transaction;
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
    return await this.buildAndSign(signOptions, transaction).then((result: StakingSignedTransaction) => {
      return this.send(result);
    });
  }

  /**
   * Build and sign the transaction.
   * @param signOptions
   * @param transaction
   */
  private async buildAndSign(
    signOptions: StakingSignOptions,
    transaction: StakingTransaction
  ): Promise<StakingSignedTransaction> {
    const builtTx = await this.build(transaction);
    return await this.sign(signOptions, builtTx);
  }

  private async expandBuildParams(stakingTransaction: StakingTransaction): Promise<StakingTransaction> {
    return await this.bitgo
      .get(this.bitgo.microservicesUrl(this.stakingTransactionURL(stakingTransaction)))
      .query({ expandBuildParams: true })
      .result();
  }

  private async createStakingRequest(
    options: StakeOptions | UnstakeOptions | EthUnstakeOptions | SwitchValidatorOptions | ClaimRewardsOptions,
    type: string
  ): Promise<StakingRequest> {
    return await this.bitgo
      .post(this.bitgo.microservicesUrl(this.stakingRequestsURL()))
      .send({
        ...options,
        type: type,
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

  private async getWalletForBuildingAndSigning(): Promise<IWallet> {
    if (this.wallet.baseCoin.tokenConfig) {
      if (!this.tokenParentWallet) {
        this.tokenParentWallet = await this.bitgo
          .coin(this.wallet.baseCoin.tokenConfig.coin)
          .wallets()
          .get({ id: this.wallet.id() });
      }
      return this.tokenParentWallet;
    } else {
      return Promise.resolve(this.wallet);
    }
  }

  /**
   * Send API call is only required for TSS TxRequest api version lite or multi-sig transactions.
   * For Full api version, sign transaction moves the transaction to delivered state.
   * @returns true if send API call to staking service is required else false
   */
  private isSendCallRequired(): boolean {
    if (this.wallet.baseCoin.getFamily() === 'eth') {
      return !this.isEthTss;
    } else if (this.wallet.baseCoin.supportsTss()) {
      return this.wallet.baseCoin.getMPCAlgorithm() !== 'ecdsa';
    } else {
      return true;
    }
  }
}
