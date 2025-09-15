import { BitGoBase, CoinConstructor, NamedCoinConstructor, VerifyTransactionOptions } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { coins, TonTokenConfig, NetworkType, tokens } from '@bitgo/statics';

import { Transaction } from './lib';
import { Ton } from './ton';

export class TonToken extends Ton {
  public readonly tokenConfig: TonTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: TonTokenConfig) {
    const staticsCoin = tokenConfig.network === NetworkType.MAINNET ? coins.get('ton') : coins.get('tton');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: TonTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new TonToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfig: TonTokenConfig[] = [...tokens.bitcoin.ton.tokens, ...tokens.testnet.ton.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfig) {
      const tokenConstructor = TonToken.createTokenConstructor(token);
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

  get jettonMaster(): string {
    return this.tokenConfig.jettonMaster;
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
    return 'TON Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const rawTx = txPrebuild.txHex;
    let totalAmount = new BigNumber(0);
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const coinConfig = coins.get(this.getChain());
    const transaction = new Transaction(coinConfig);
    transaction.fromRawTransaction(Buffer.from(rawTx, 'hex').toString('base64'));
    const explainedTx = transaction.explainTransaction();
    if (txParams.recipients !== undefined) {
      txParams.recipients.forEach((recipient) => {
        if (recipient.tokenName && recipient.tokenName !== coinConfig.name) {
          throw new Error('incorrect token name specified in recipients');
        }
        recipient.tokenName = coinConfig.name;
      });
      const filteredRecipients = txParams.recipients?.map((recipient) => ({
        address: recipient.address,
        amount: recipient.amount,
        tokenName: recipient.tokenName,
      }));
      const filteredOutputs = explainedTx.outputs.map((output) => ({
        address: output.address,
        amount: output.amount,
        tokenName: output.tokenName,
      }));
      const outputsMatch = JSON.stringify(filteredRecipients) === JSON.stringify(filteredOutputs);
      if (!outputsMatch) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      for (const recipient of txParams.recipients) {
        totalAmount = totalAmount.plus(recipient.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }
}
