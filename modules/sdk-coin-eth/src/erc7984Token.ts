/**
 * @prettier
 */
import { BitGoBase, CoinConstructor, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';

import { coins, Erc7984TokenConfig, tokens } from '@bitgo/statics';
import { CoinNames, DecryptionDelegationBuilder } from '@bitgo/abstract-eth';

import { Eth } from './eth';
import { TransactionBuilder } from './lib';

export { Erc7984TokenConfig };

export class Erc7984Token extends Eth {
  public readonly tokenConfig: Erc7984TokenConfig;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';
  static coinNames: CoinNames = {
    Mainnet: 'eth',
    Testnet: 'hteth',
  };

  constructor(bitgo: BitGoBase, tokenConfig: Erc7984TokenConfig) {
    const staticsCoin = coins.get(Erc7984Token.coinNames[tokenConfig.network]);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    this.sendMethodName = 'sendMultiSigToken';
  }

  static createTokenConstructor(config: Erc7984TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Erc7984Token(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: Erc7984TokenConfig[] = [
      ...tokens.bitcoin.eth.confidentialTokens,
      ...tokens.testnet.eth.confidentialTokens,
    ]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = Erc7984Token.createTokenConstructor(token);
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

  getFullName(): string {
    return 'ERC7984 Confidential Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0.
   * ERC-7984 confidential transfers always carry an encrypted amount; zero-value sends are not meaningful.
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions via the standard token-send API.
   * Returns false because ERC-7984 sends use confidentialTransfer() calldata built
   * by WP, not an arbitrary data field on the send params.
   * Note: this does not prevent calldata-based flows like getDelegationBuilder(),
   * which bypass the token-send path entirely.
   */
  transactionDataAllowed(): boolean {
    return false;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Returns a DecryptionDelegationBuilder for constructing Zama ACL decryption
   * delegation transactions.
   *
   * The builder produces a DecryptionDelegationTxRequest {to, data, value} that is
   * wallet-type-agnostic — WP routes it to the correct signing path:
   * - MPC: submit as a raw TSS transaction
   * - Multisig: wrap in sendMultiSig(walletContract, to, 0, data, ...)
   *
   * Example:
   *   const req = coin.getDecryptionDelegationBuilder().build({
   *     aclContractAddress: '0xf0Ff...',
   *     delegateAddress:    enterpriseViewingKey,
   *     tokenContractAddresses: [tokenAddress],
   *     expiryTimestamp:    Math.floor(Date.now() / 1000) + 365 * 86400,
   *   });
   */
  getDecryptionDelegationBuilder(): DecryptionDelegationBuilder {
    return new DecryptionDelegationBuilder();
  }
}
