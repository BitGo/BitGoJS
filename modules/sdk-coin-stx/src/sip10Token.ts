import _ from 'lodash';
import BigNumber from 'bignumber.js';

import { BitGoBase, CoinConstructor, NamedCoinConstructor, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, NetworkType, Sip10TokenConfig, tokens } from '@bitgo/statics';

import { Stx } from './stx';
import { TransactionBuilderFactory } from './lib';
import { TransactionBuilder } from './lib/transactionBuilder';
import { getMemoIdAndBaseAddressFromAddress } from './lib/utils';

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
    const { memo } = txParams;
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
        const addressDetails = getMemoIdAndBaseAddressFromAddress(recipient.address);
        const recipientData = {
          address: addressDetails.address,
          amount: BigInt(recipient.amount),
        };
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
        if (output.tokenName) {
          recipientData['tokenName'] = output.tokenName;
        }
        return recipientData;
      });
      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      // compare memo
      let memoInput = '';
      let memoOutput = '';
      if (memo && memo.value) {
        memoInput = memo.value;
      } else if (txParams.recipients.length) {
        const addressDetails = getMemoIdAndBaseAddressFromAddress(txParams.recipients[0].address);
        memoInput = addressDetails.memoId ? addressDetails.memoId : '';
      }
      if (explainedTx.memo) {
        memoOutput = explainedTx.memo;
      }
      if (!_.isEqual(memoInput, memoOutput)) {
        throw new Error('Tx memo does not match with expected txParams recipient memo');
      }
      // compare send amount
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
