import { buildMulticallDelegationCalldata, wrapInCallFromParent } from './zamaUtils';

/**
 * Parameters for building a Zama ERC-7984 decryption delegation transaction.
 */
export interface DecryptionDelegationBuilderParams {
  /** Address of the Zama ACL contract on the target network. */
  aclContractAddress: string;

  /**
   * BitGo enterprise viewing key address that receives decryption rights.
   */
  delegateAddress: string;

  /**
   * ERC-7984 token contract addresses to delegate for.
   * One or more addresses — always encoded as ACL.multicall([delegateForUserDecryption x N]).
   * Pass a single address for single-token delegation; the multicall wrapper is always used
   * for a consistent transaction structure regardless of token count.
   */
  tokenContractAddresses: string[];

  /**
   * Delegation expiry as a Unix timestamp (seconds).
   * Recommended: Math.floor(Date.now() / 1000) + 365 * 86400 (1 year)
   */
  expiryTimestamp: number;

  /**
   * Optional forwarder contract address.
   *
   * When set, the delegation calldata is wrapped in a
   * ForwarderV4.callFromParent(aclContractAddress, 0, delegationCalldata) call,
   * so that the forwarder itself becomes msg.sender (and therefore the delegator)
   * in the ACL call.
   *
   * Only the parentAddress (root wallet) may call callFromParent —
   * this is enforced by the forwarder's onlyParent modifier.
   *
   * Leave undefined when the root wallet is delegating directly.
   */
  forwarderAddress?: string;
}

/**
 * The wallet-type-agnostic output of DecryptionDelegationBuilder.build().
 *
 * WP is responsible for routing this to the correct signing path:
 * - MPC (TSS): submit as a raw transaction {to, data, value=0}
 * - Multisig root: sendMultiSig(walletContract, to, 0, data, expiry, seqId, sig)
 * - Multisig forwarder: sendMultiSig(walletContract, forwarder, 0, callFromParentData, expiry, seqId, sig)
 */
export interface DecryptionDelegationTxRequest {
  /**
   * Transaction recipient:
   * - ACL contract address when delegating from root wallet directly
   * - Forwarder address when wrapping in callFromParent
   */
  to: string;

  /** ABI-encoded calldata for the decryption delegation operation. */
  data: string;

  /** Always '0' — decryption delegation transactions carry no ETH value. */
  value: string;
}

/**
 * Builder for Zama ERC-7984 ACL decryption delegation transactions.
 *
 * Grants BitGo's enterprise viewing key the right to decrypt ERC-7984 token
 * balances on behalf of the wallet owner via ACL.delegateForUserDecryption().
 *
 * Produces a DecryptionDelegationTxRequest that works for both MPC and multisig
 * wallets. Always uses ACL.multicall() regardless of token count, giving WP a
 * consistent transaction structure to handle.
 *
 * Two scenarios:
 * 1. Root wallet  → ACL.multicall([delegateForUserDecryption x N]) sent directly to ACL
 * 2. Forwarder    → callFromParent(ACL, 0, multicall([...])) sent to forwarder contract
 *
 * Usage:
 *   const req = new DecryptionDelegationBuilder().build({
 *     aclContractAddress: '0xf0Ff...',
 *     delegateAddress:    enterpriseViewingKey,
 *     tokenContractAddresses: [tokenAddress],          // one or more tokens
 *     expiryTimestamp:    Math.floor(Date.now() / 1000) + 365 * 86400,
 *   });
 */
export class DecryptionDelegationBuilder {
  /**
   * Build the decryption delegation transaction request.
   *
   * @param params  Decryption delegation parameters
   * @returns DecryptionDelegationTxRequest containing {to, data, value} ready for WP signing
   * @throws Error if tokenContractAddresses is empty
   */
  build(params: DecryptionDelegationBuilderParams): DecryptionDelegationTxRequest {
    const { aclContractAddress, delegateAddress, tokenContractAddresses, expiryTimestamp, forwarderAddress } = params;

    if (tokenContractAddresses.length === 0) {
      throw new Error('DecryptionDelegationBuilder: tokenContractAddresses must not be empty');
    }

    // Always encode as ACL.multicall([delegateForUserDecryption x N]) for a consistent
    // transaction structure regardless of whether one or many tokens are delegated.
    const innerCalldata = buildMulticallDelegationCalldata(delegateAddress, tokenContractAddresses, expiryTimestamp);

    // Optionally wrap in callFromParent for forwarder delegation
    if (forwarderAddress !== undefined) {
      return {
        to: forwarderAddress,
        data: wrapInCallFromParent(aclContractAddress, innerCalldata),
        value: '0',
      };
    }

    return {
      to: aclContractAddress,
      data: innerCalldata,
      value: '0',
    };
  }
}
