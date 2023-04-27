import { Trx } from './trx';
import { BitGoBase, CoinConstructor, NamedCoinConstructor, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { TrxTokenConfig, tokens } from '@bitgo/statics';
import { getBuilder } from './lib/builder';
import { Recipient } from '../../sdk-core/src/bitgo/baseCoin/iBaseCoin';
import assert from 'assert';

export { TrxTokenConfig };

export type TronTxInfo = {
  recipients?: Recipient[];
  from?: string;
  txid?: string;
};

export class TrxToken extends Trx {
  public readonly tokenConfig: TrxTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: TrxTokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: TrxTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new TrxToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.trx.tokens, ...tokens.testnet.trx.tokens]) {
      const tokenConstructor = TrxToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get type(): string {
    return this.tokenConfig.type;
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

  get tokenContractAddress(): string {
    return this.tokenConfig.tokenContractAddress;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getId(): string {
    return this.tokenConfig.id;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Tron Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed(): boolean {
    return false;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    assert(txPrebuild.txHex, new Error('missing required tx prebuild property txHex'));
    const rawTx = txPrebuild.txHex;

    const txBuilder = getBuilder(this.getChain()).from(rawTx);
    const tx = await txBuilder.build();

    const recipients = txParams.recipients || (txPrebuild.txInfo as TronTxInfo).recipients;
    if (!recipients) {
      throw new Error('missing required property recipients');
    }

    if (recipients[0].address === tx.outputs[0].address && recipients[0].amount === tx.outputs[0].value) {
      return true;
    } else {
      throw new Error('Tx outputs does not match with expected txParams recipients');
    }
  }
}
