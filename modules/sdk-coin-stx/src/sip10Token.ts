import _ from 'lodash';
import BigNumber from 'bignumber.js';

import { BitGoBase, CoinConstructor, NamedCoinConstructor, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, NetworkType, Sip10TokenConfig, tokens } from '@bitgo/statics';

import { Stx } from './stx';
import { TransactionBuilderFactory } from './lib';
import { TransactionBuilder } from './lib/transactionBuilder';

export class Sip10Token extends Stx {
  public readonly tokenConfig: Sip10TokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: Sip10TokenConfig) {
    const staticsCoin = tokenConfig.network === NetworkType.MAINNET ? coins.get('stx') : coins.get('tstx');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: Sip10TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Sip10Token(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: Sip10TokenConfig[] = [...tokens.bitcoin.stx.tokens, ...tokens.testnet.stx.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = Sip10Token.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get name(): string {
    return this.tokenConfig.name;
  }

  get coin(): string {
    return this.tokenConfig.coin;
  }

  get network(): string {
    return this.tokenConfig.network;
  }

  get assetId(): string {
    return this.tokenConfig.assetId;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Sip10 Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  getTransaction(coinConfig: Readonly<StaticsBaseCoin>): TransactionBuilder {
    return new TransactionBuilderFactory(coinConfig).getFungibleTokenTransferBuilder();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    if (Array.isArray(txParams.recipients) && txParams.recipients.length > 1) {
      throw new Error(
        `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
      );
    }
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const coinConfig = coins.get(this.getChain());
    const transaction = this.getTransaction(coinConfig);
    transaction.from(rawTx);
    const explainedTx = await this.explainTransaction({ txHex: rawTx, feeInfo: { fee: '' } });
    if (txParams.recipients !== undefined && explainedTx) {
      const filteredRecipients = txParams.recipients?.map((recipient) => {
        const recipientData = {
          address: recipient.address,
          amount: BigInt(recipient.amount),
        };
        if (recipient.memo) {
          recipientData['memo'] = recipient.memo;
        }
        if (recipient.tokenName) {
          recipientData['tokenName'] = recipient.tokenName;
        }
        return recipientData;
      });
      const filteredOutputs = explainedTx.outputs.map((output) => {
        const recipientData = {
          address: output.address,
          amount: BigInt(output.amount),
        };
        if (output.memo) {
          recipientData['memo'] = output.memo;
        }
        if (output.tokenName) {
          recipientData['tokenName'] = output.tokenName;
        }
        return recipientData;
      });
      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      let totalAmount = new BigNumber(0);
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }
}
