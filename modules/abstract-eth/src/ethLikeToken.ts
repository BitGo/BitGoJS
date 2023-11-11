/**
 * @prettier
 */
import { coins, EthLikeTokenConfig, tokens, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';

import { BitGoBase, CoinConstructor, NamedCoinConstructor } from '@bitgo/sdk-core';
import { TransactionBuilder as EthLikeTransactionBuilder } from './lib';
import { AbstractEthLikeNewCoins, optionalDeps, TransactionPrebuild } from './abstractEthLikeNewCoins';

export type CoinNames = {
  [network: string]: string;
};

export class EthLikeToken extends AbstractEthLikeNewCoins {
  public readonly tokenConfig: EthLikeTokenConfig;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig, coinNames: CoinNames) {
    const staticsCoin = coins.get(coinNames[tokenConfig.network]);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    this.sendMethodName = 'sendMultiSigToken';
  }

  static createTokenConstructor(config: EthLikeTokenConfig, coinNames: CoinNames): CoinConstructor {
    return (bitgo: BitGoBase) => new this(bitgo, config, coinNames);
  }

  static createTokenConstructors(coinNames: CoinNames): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    const chain = coinNames.Mainnet;
    for (const token of [...tokens.bitcoin[chain].tokens, ...tokens.testnet[chain].tokens]) {
      const tokenConstructor = this.createTokenConstructor(token, coinNames);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
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

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Eth Like Token';
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

  isToken(): boolean {
    return true;
  }

  getOperation(recipient, expireTime, contractSequenceId) {
    const network = this.getNetwork() as EthLikeNetwork;
    return [
      ['string', 'address', 'uint', 'address', 'uint', 'uint'],
      [
        network.tokenOperationHashPrefix,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(this.tokenContractAddress), 16),
        expireTime,
        contractSequenceId,
      ],
    ];
  }

  getSendMethodArgs(txInfo) {
    // Method signature is
    // sendMultiSigToken(address toAddress, uint value, address tokenContractAddress, uint expireTime, uint sequenceId, bytes signature)
    return [
      {
        name: 'toAddress',
        type: 'address',
        value: txInfo.recipient.address,
      },
      {
        name: 'value',
        type: 'uint',
        value: txInfo.recipient.amount,
      },
      {
        name: 'tokenContractAddress',
        type: 'address',
        value: this.tokenContractAddress,
      },
      {
        name: 'expireTime',
        type: 'uint',
        value: txInfo.expireTime,
      },
      {
        name: 'sequenceId',
        type: 'uint',
        value: txInfo.contractSequenceId,
      },
      {
        name: 'signature',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.signature)),
      },
    ];
  }

  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.tokenConfig.coin && txPrebuild.token === this.tokenConfig.type;
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    throw new Error('Method not implemented');
  }
}
