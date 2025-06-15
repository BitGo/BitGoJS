import BigNumber from 'bignumber.js';
import { BitGoBase, CoinConstructor, NamedCoinConstructor, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { coins, Nep141TokenConfig, NetworkType, tokens } from '@bitgo/statics';

import { Transaction } from './lib';
import { Near } from './near';

export class Nep141Token extends Near {
  public readonly tokenConfig: Nep141TokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: Nep141TokenConfig) {
    const staticsCoin = tokenConfig.network === NetworkType.MAINNET ? coins.get('near') : coins.get('tnear');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: Nep141TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Nep141Token(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfig: Nep141TokenConfig[] = [...tokens.bitcoin.near.tokens, ...tokens.testnet.near.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfig) {
      const tokenConstructor = Nep141Token.createTokenConstructor(token);
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

  get contractAddress(): string {
    return this.tokenConfig.contractAddress;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  get storageDepositAmount(): string {
    return this.tokenConfig.storageDepositAmount;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Nep141 Token';
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
    transaction.fromRawTransaction(rawTx);
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
