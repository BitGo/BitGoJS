import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { MessageOptions } from '@bitgo/sdk-core';
import { EIP712Message } from './eip712Message';
import {
  buildErc20VotesDelegationTypedData,
  Erc20VotesDelegationDomain,
  Erc20VotesDelegationMessageFields,
  Erc20VotesDelegationTypedData,
} from '../../eip712/erc20VotesDelegation';

/**
 * Inputs for building an OpenZeppelin ERC20Votes `delegateBySig` EIP-712 message.
 */
export interface Erc20VotesDelegationParams {
  domain: Erc20VotesDelegationDomain;
  message: Erc20VotesDelegationMessageFields;
}

/**
 * Thin wrapper over `EIP712Message` that constructs the OpenZeppelin
 * `Delegation(address delegatee,uint256 nonce,uint256 expiry)` typed-data payload
 * for ERC20Votes / WLFI-style governance tokens.
 *
 * The on-the-wire `MessageStandardType` is still `EIP712`, so the wallet platform
 * (`signTypedStructuredData` intent), TSS signing, OVC, Admin / BGMS approvals, and
 * `EIP712Message.getSignablePayload()` digest path all keep working unchanged — this
 * class only removes the need for callers to hand-build the typed-data JSON.
 */
export class Erc20VotesDelegationMessage extends EIP712Message {
  constructor(options: MessageOptions) {
    super(options);
  }

  /**
   * Build a delegation message from typed-data params (no JSON wrangling required).
   */
  static fromDelegation(
    coinConfig: Readonly<CoinConfig>,
    params: Erc20VotesDelegationParams,
    extra: Omit<MessageOptions, 'coinConfig' | 'payload' | 'type'> = {}
  ): Erc20VotesDelegationMessage {
    const typedData = buildErc20VotesDelegationTypedData(params);
    return new Erc20VotesDelegationMessage({
      ...extra,
      coinConfig,
      payload: JSON.stringify(typedData),
    });
  }

  /**
   * Returns the typed-data object parsed from the wrapped EIP-712 payload.
   * Useful when callers need the structured form (e.g. to display in approval UIs).
   */
  getTypedData(): Erc20VotesDelegationTypedData {
    return JSON.parse(this.payload) as Erc20VotesDelegationTypedData;
  }
}
