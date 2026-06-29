import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IMessage, MessageOptions } from '@bitgo/sdk-core';
import { Eip712MessageBuilder } from './eip712MessageBuilder';
import { Erc20VotesDelegationMessage, Erc20VotesDelegationParams } from './erc20VotesDelegationMessage';
import { buildErc20VotesDelegationTypedData } from '../../eip712/erc20VotesDelegation';

/**
 * Builder for OpenZeppelin ERC20Votes `delegateBySig` EIP-712 messages.
 *
 * Produces an `EIP712`-typed message (`MessageStandardType.EIP712`) so it flows through
 * the standard `signTypedStructuredData` intent on wallet-platform. Callers can either:
 *
 *  - call `setDelegation({ domain, message })` and then `build()`, or
 *  - call `setPayload(typedDataJson)` directly (same shape as `Eip712MessageBuilder`).
 */
export class Erc20VotesDelegationMessageBuilder extends Eip712MessageBuilder {
  protected delegation?: Erc20VotesDelegationParams;

  public constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Provide the OpenZeppelin Delegation typed-data inputs. Calling this overwrites
   * any payload previously set via `setPayload`.
   */
  public setDelegation(params: Erc20VotesDelegationParams): this {
    this.delegation = params;
    const typedData = buildErc20VotesDelegationTypedData(params);
    this.setPayload(JSON.stringify(typedData));
    return this;
  }

  public getDelegation(): Erc20VotesDelegationParams | undefined {
    return this.delegation;
  }

  /**
   * One-shot helper equivalent to `setDelegation(params).build()`.
   */
  public async buildFromDelegation(params: Erc20VotesDelegationParams): Promise<Erc20VotesDelegationMessage> {
    return this.setDelegation(params).build() as Promise<Erc20VotesDelegationMessage>;
  }

  async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new Erc20VotesDelegationMessage(options);
  }
}
