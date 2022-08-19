import request from 'superagent';
import BigNumber from 'bignumber.js';

import {
  BaseCoin,
  BitGoBase,
  common,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Eth, SignedTransaction, SignTransactionOptions, TransactionBuilder } from '@bitgo/sdk-coin-eth';
import { ExplainTransactionOptions } from '@bitgo/abstract-eth';

export class Ethw extends Eth {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Ethw(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'ethw';
  }
  getFamily(): string {
    return 'eth';
  }
  getFullName(): string {
    return 'Ethereum PoW';
  }
  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new Error('Method not implemented.');
  }
  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }
  generateKeyPair(seed?: Buffer | undefined): KeyPair {
    throw new Error('Method not implemented.');
  }
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Make a query to Etherscan for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Etherscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<any> {
    const token = common.Environments[this.bitgo.getEnv()].etherscanApiToken;
    if (token) {
      query.apikey = token;
    }
    const response = await request
      .get(common.Environments[this.bitgo.getEnv()].ethwExplorerBaseUrl + '/api')
      .query(query);

    if (!response.ok) {
      throw new Error('could not reach ETHW Explorer');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('ETHW Explorer rate limit reached');
    }
    return response.body;
  }

  /**
   * Explain a transaction from txHex
   * @param params The options with which to explain the transaction
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = await txBuilder.build();
    const outputs = tx.outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
      };
    });

    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];

    return {
      displayOrder,
      id: tx.id,
      outputs: outputs,
      outputAmount: outputs
        .reduce((accumulator, output) => accumulator.plus(output.amount), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
    };
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getChain()));
  }
}
