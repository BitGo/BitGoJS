/**
 * @prettier
 */
import { BitGoBase, CoinConstructor, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';
import { coins, Tip20TokenConfig } from '@bitgo/statics';
import { GetSendMethodArgsOptions, SendMethodArgs } from '@bitgo/abstract-eth';
import { Address } from './lib/types';
import { Tempo } from './tempo';
import { encodeTip20TransferWithMemo, amountToTip20Units, isValidAddress, isValidTip20Amount } from './lib/utils';

export { Tip20TokenConfig };

/**
 * TIP20 Token Implementation (Skeleton)
 *
 * This is a minimal skeleton for TIP20 tokens on Tempo blockchain.
 *
 * TODO: All methods will be implemented progressively
 */
export class Tip20Token extends Tempo {
  public readonly tokenConfig: Tip20TokenConfig;
  public readonly contractAddress: string;

  constructor(bitgo: BitGoBase, tokenConfig: Tip20TokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('tempo') : coins.get('ttempo');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    this.contractAddress = tokenConfig.tokenContractAddress;
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
  get network(): string {
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
  getBaseChain(): string {
    return this.coin;
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
   * Verify that the transaction coin/token matches this token
   * @param txPrebuild - Transaction prebuild object
   * @returns true if valid, false otherwise
   */
  verifyCoin(txPrebuild: { coin?: string; token?: string }): boolean {
    if (!txPrebuild) {
      return false;
    }

    // Check if the coin or token matches this token's configuration
    const coinMatch = txPrebuild.coin === this.tokenConfig.coin || txPrebuild.coin === this.tokenConfig.type;
    const tokenMatch =
      !txPrebuild.token ||
      txPrebuild.token === this.tokenConfig.tokenContractAddress ||
      txPrebuild.token === this.tokenConfig.type;

    return coinMatch && tokenMatch;
  }

  /**
   * Get send method arguments for TIP-20 token transfer with memo
   * @param txInfo - Transaction information including recipient and amount
   * @returns Array of send method arguments for ABI encoding
   */
  getSendMethodArgs(txInfo: GetSendMethodArgsOptions): SendMethodArgs[] {
    const { recipient } = txInfo;

    if (!recipient) {
      throw new Error('Recipient is required for token transfer');
    }

    if (!isValidAddress(recipient.address)) {
      throw new Error(`Invalid recipient address: ${recipient.address}`);
    }

    if (!isValidTip20Amount(recipient.amount)) {
      throw new Error(`Invalid amount: ${recipient.amount}`);
    }

    const memo = (recipient as { memo?: string }).memo;

    if (memo && Buffer.byteLength(memo, 'utf-8') > 32) {
      throw new Error('Memo too long: maximum 32 bytes');
    }

    const amountInUnits = amountToTip20Units(recipient.amount);
    const data = encodeTip20TransferWithMemo(recipient.address as Address, amountInUnits, memo);

    return [
      {
        name: 'toAddress',
        type: 'address',
        value: recipient.address,
      },
      {
        name: 'value',
        type: 'uint',
        value: recipient.amount,
      },
      {
        name: 'tokenContractAddress',
        type: 'address',
        value: this.tokenConfig.tokenContractAddress,
      },
      {
        name: 'data',
        type: 'bytes',
        value: Buffer.from(data.slice(2), 'hex'),
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
        value: Buffer.from(txInfo.signature.replace('0x', ''), 'hex'),
      },
    ];
  }

  /**
   * Get operation object for TIP-20 token transfer (for batch transactions)
   * @param recipient - Recipient information with address, amount, and optional memo
   * @param expireTime - Transaction expiration time
   * @param contractSequenceId - Contract sequence ID
   * @returns Operation array for ABI encoding
   */
  getOperation(
    recipient: { address: string; amount: string; memo?: string },
    expireTime: number,
    contractSequenceId: number
  ): (string | Buffer)[][] {
    if (!isValidAddress(recipient.address)) {
      throw new Error(`Invalid recipient address: ${recipient.address}`);
    }

    if (!isValidTip20Amount(recipient.amount)) {
      throw new Error(`Invalid amount: ${recipient.amount}`);
    }

    // Validate memo byte length (handles multi-byte UTF-8 characters)
    if (recipient.memo !== undefined && recipient.memo !== null && recipient.memo !== '') {
      const memoByteLength = new TextEncoder().encode(recipient.memo).length;
      if (memoByteLength > 32) {
        throw new Error(`Memo too long: ${memoByteLength} bytes. Maximum 32 bytes.`);
      }
    }

    const amountInUnits = amountToTip20Units(recipient.amount);
    const data = encodeTip20TransferWithMemo(recipient.address as Address, amountInUnits, recipient.memo);

    // Return format compatible with parent class for ABI encoding
    return [
      ['address', 'bytes'],
      [this.tokenConfig.tokenContractAddress, Buffer.from(data.slice(2), 'hex')],
    ];
  }
}
