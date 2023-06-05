import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  Environments,
  ExplanationResult,
  SignedTransaction,
  SigningError,
  SignTransactionOptions,
  TransactionType,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import utils from './lib/utils';
import { TransactionBuilderFactory } from './lib';
import * as request from 'superagent';

import { CosmosCoin } from '@bitgo/abstract-cosmos';

export class Osmo extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Osmo(bitgo, staticsCoin);
  }

  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild, txParams } = params;
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const transaction = await new TransactionBuilderFactory(coinConfig).from(rawTx).build();
    const explainedTx = transaction.explainTransaction();

    if (txParams.recipients && txParams.recipients.length > 0) {
      const filteredRecipients = txParams.recipients?.map((recipient) => _.pick(recipient, ['address', 'amount']));
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      // WithdrawDelegatorRewards transaction doesn't have amount
      if (transaction.type !== TransactionType.StakingWithdraw) {
        for (const recipients of txParams.recipients) {
          totalAmount = totalAmount.plus(recipients.amount);
        }
        if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
          throw new Error('Tx total amount does not match with expected total amount field');
        }
      }
    }
    return true;
  }

  /** @inheritDoc **/
  async explainTransaction(options: { txHex: string }): Promise<ExplanationResult> {
    if (!options.txHex) {
      throw new Error('missing required txHex parameter');
    }
    try {
      const transactionBuilder = new TransactionBuilderFactory(coins.get(this.getChain())).from(options.txHex);
      const transaction = await transactionBuilder.build();
      return transaction.explainTransaction();
    } catch (e) {
      throw new Error('Invalid transaction: ' + e.message);
    }
  }

  /**
   * Sign a transaction with a single private key
   * @param params parameters in the form of { txPrebuild: {txHex}, prv }
   * @returns signed transaction in the form of { txHex }
   */
  async signTransaction(
    params: SignTransactionOptions & { txPrebuild: { txHex: string }; prv: string }
  ): Promise<SignedTransaction> {
    const txHex = params?.txPrebuild?.txHex;
    const privateKey = params?.prv;
    if (!txHex) {
      throw new SigningError('missing required txPrebuild parameter: params.txPrebuild.txHex');
    }
    if (!privateKey) {
      throw new SigningError('missing required prv parameter: params.prv');
    }
    const txBuilder = new TransactionBuilderFactory(coins.get(this.getChain())).from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();
    if (!transaction) {
      throw new SigningError('Failed to build signed transaction');
    }
    const serializedTx = transaction.toBroadcastFormat();
    return {
      txHex: serializedTx,
    };
  }

  /**
   * Get the public node url from the Environments constant we have defined
   */
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].osmoNodeUrl;
  }

  /**
   * Get balance from public node
   */
  protected async getBalanceFromNode(senderAddress: string): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl();
    const getBalancePath = 'cosmos/bank/v1beta1/balances/';
    const fullEndpoint = nodeUrl + getBalancePath + senderAddress;
    try {
      return await request.get(fullEndpoint).send();
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${getBalancePath + senderAddress} from node: ${nodeUrl}`);
  }

  /**
   * Get chain id from public node
   */
  protected async getChainIdFromNode(): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl();
    const getLatestBlockPath = 'cosmos/base/tendermint/v1beta1/blocks/latest';
    const fullEndpoint = nodeUrl + getLatestBlockPath;
    try {
      return await request.get(fullEndpoint).send();
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${getLatestBlockPath} from node: ${nodeUrl}`);
  }

  /**
   * Get account number from public node
   */
  protected async getAccountFromNode(senderAddress: string): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl();
    const getAccountPath = 'cosmos/auth/v1beta1/accounts/';
    const fullEndpoint = nodeUrl + getAccountPath + senderAddress;
    try {
      return await request.get(fullEndpoint).send();
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${getAccountPath + senderAddress} from node: ${nodeUrl}`);
  }

  /**
   * Helper to fetch account balance
   */
  protected async getAccountBalance(senderAddress: string): Promise<string> {
    const response = await this.getBalanceFromNode(senderAddress);
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body.balances[0].amount;
  }

  /**
   * Helper to fetch chainId
   */
  protected async getChainId(): Promise<string> {
    const response = await this.getChainIdFromNode();
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body.block.header.chain_id;
  }

  /**
   * Helper to fetch account number
   */
  protected async getAccountDetails(senderAddress: string): Promise<string[]> {
    const response = await this.getAccountFromNode(senderAddress);
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return [response.body.account.account_number, response.body.account.sequence];
  }
}
