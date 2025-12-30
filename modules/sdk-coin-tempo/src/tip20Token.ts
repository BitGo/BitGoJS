/**
 * @prettier
 */
import { BitGoBase, CoinConstructor, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { GetSendMethodArgsOptions, SendMethodArgs } from '@bitgo/abstract-eth';
import { Tempo } from './tempo';

/**
 * TIP20 Token Configuration Interface
 */
export interface Tip20TokenConfig {
  type: string; // Token identifier (e.g., 'tempo:usdc')
  coin: string; // Base coin (e.g., 'tempo' or 'ttempo')
  network: 'Mainnet' | 'Testnet';
  name: string; // Token full name
  tokenContractAddress: string; // Smart contract address (0x...)
  decimalPlaces: number; // Token decimal places
}

/**
 * TIP20 Token Implementation (Skeleton)
 *
 * This is a minimal skeleton for TIP20 tokens on Tempo blockchain.
 *
 * TODO: All methods will be implemented progressively
 */
export class Tip20Token extends Tempo {
  public readonly tokenConfig: Tip20TokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: Tip20TokenConfig) {
    const coinName = tokenConfig.network === 'Mainnet' ? 'tempo' : 'ttempo';
    const staticsCoin = coins.get(coinName);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  /**
   * Create a coin constructor for a specific token
   */
  static createTokenConstructor(config: Tip20TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Tip20Token(bitgo, config);
  }

  /**
   * Create token constructors for all TIP20 tokens
   * @param tokenConfigs - Array of token configurations (optional)
   */
  static createTokenConstructors(tokenConfigs?: Tip20TokenConfig[]): NamedCoinConstructor[] {
    const configs = tokenConfigs || [];
    const tokensCtors: NamedCoinConstructor[] = [];

    for (const token of configs) {
      const tokenConstructor = Tip20Token.createTokenConstructor(token);
      // Register by token type
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      // Also register by contract address for lookups
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
    }

    return tokensCtors;
  }

  /** Get the token type */
  get type(): string {
    return this.tokenConfig.type;
  }

  /** Get the token name */
  get name(): string {
    return this.tokenConfig.name;
  }

  /** Get the base coin */
  get coin(): string {
    return this.tokenConfig.coin;
  }

  /** Get the network */
  get network(): 'Mainnet' | 'Testnet' {
    return this.tokenConfig.network;
  }

  /** Get the token contract address */
  get tokenContractAddress(): string {
    return this.tokenConfig.tokenContractAddress;
  }

  /** Get token decimal places */
  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  /** @inheritDoc */
  getChain(): string {
    return this.tokenConfig.type;
  }

  /** @inheritDoc */
  getFullName(): string {
    return 'TIP20 Token';
  }

  /** @inheritDoc */
  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /** @inheritDoc */
  valuelessTransferAllowed(): boolean {
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

  /**
   * Placeholder: Verify coin and token match
   * TODO: Implement when transaction logic is added
   */
  verifyCoin(txPrebuild: unknown): boolean {
    return true;
  }

  /**
   * Placeholder: Get send method arguments
   * TODO: Implement for token transfers
   */
  getSendMethodArgs(txInfo: GetSendMethodArgsOptions): SendMethodArgs[] {
    // TODO: Implement for token transfers
    // Return empty array to prevent downstream services from breaking
    return [];
  }

  /**
   * Placeholder: Get operation for token transfer
   * TODO: Implement for token transfers
   */
  getOperation(
    recipient: { address: string; amount: string },
    expireTime: number,
    contractSequenceId: number
  ): (string | Buffer)[][] {
    // TODO: Implement for token transfers
    // Return empty array to prevent downstream services from breaking
    return [];
  }

  /**
   * Placeholder: Query token balance
   * TODO: Implement using Tempo block explorer or RPC
   */
  async queryAddressTokenBalance(
    tokenContractAddress: string,
    walletAddress: string,
    apiKey?: string
  ): Promise<string> {
    // TODO: Implement using Tempo block explorer or RPC
    // Return 0 balance to prevent downstream services from breaking
    return '0';
  }
}
