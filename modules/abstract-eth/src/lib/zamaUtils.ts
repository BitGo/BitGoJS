import { addHexPrefix, toBuffer } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ABI parameter type arrays
export const delegateForUserDecryptionTypes = ['address', 'address', 'uint64'] as const;
export const callFromParentTypes = ['address', 'uint256', 'bytes'] as const;
export const aclMulticallTypes = ['bytes[]'] as const;

/**
 * Function selector for ACL.delegateForUserDecryption(address,address,uint64)
 * = keccak256('delegateForUserDecryption(address,address,uint64)')[0:4]
 */
export const delegateForUserDecryptionMethodId = addHexPrefix(
  EthereumAbi.methodID('delegateForUserDecryption', [...delegateForUserDecryptionTypes]).toString('hex')
);

/**
 * Function selector for ACL.multicall(bytes[])
 * = keccak256('multicall(bytes[])')[0:4]
 * ACL inherits OpenZeppelin MulticallUpgradeable — preserves msg.sender via delegatecall.
 */
export const aclMulticallMethodId = addHexPrefix(
  EthereumAbi.methodID('multicall', [...aclMulticallTypes]).toString('hex')
);

/**
 * Function selector for ForwarderV4.callFromParent(address,uint256,bytes)
 * = keccak256('callFromParent(address,uint256,bytes)')[0:4]
 */
export const callFromParentMethodId = addHexPrefix(
  EthereumAbi.methodID('callFromParent', [...callFromParentTypes]).toString('hex')
);

// ---------------------------------------------------------------------------
// Encoding functions
// ---------------------------------------------------------------------------

/**
 * Encodes a single ACL.delegateForUserDecryption() call.
 *
 * Grants `delegateAddress` the right to decrypt ERC-7984 token balances on
 * behalf of the calling address (msg.sender) for the specified token contract.
 *
 * @param delegateAddress       BitGo enterprise viewing key address
 * @param tokenContractAddress  ERC-7984 token contract address
 * @param expiryTimestamp       Unix seconds; recommended: Math.floor(Date.now()/1000) + 365*86400
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 */
export function buildDelegationCalldata(
  delegateAddress: string,
  tokenContractAddress: string,
  expiryTimestamp: number
): string {
  const method = EthereumAbi.methodID('delegateForUserDecryption', [...delegateForUserDecryptionTypes]);
  const args = EthereumAbi.rawEncode(
    [...delegateForUserDecryptionTypes],
    [delegateAddress, tokenContractAddress, expiryTimestamp]
  );
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Encodes N delegateForUserDecryption calls batched inside ACL.multicall().
 *
 * Produces a single TX that grants delegation for all specified token contracts.
 * Requires tokenContractAddresses.length >= 1.
 * Note: DecryptionDelegationBuilder always uses this function (even for a single token)
 * to keep the transaction shape consistent regardless of token count.
 *
 * @param delegateAddress          BitGo enterprise viewing key address
 * @param tokenContractAddresses   Array of ERC-7984 token contract addresses
 * @param expiryTimestamp          Unix seconds
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 */
export function buildMulticallDelegationCalldata(
  delegateAddress: string,
  tokenContractAddresses: string[],
  expiryTimestamp: number
): string {
  if (tokenContractAddresses.length === 0) {
    throw new Error('buildMulticallDelegationCalldata: tokenContractAddresses must not be empty');
  }

  // Build each inner delegateForUserDecryption call as raw bytes
  const innerCalls: Buffer[] = tokenContractAddresses.map((tokenAddress) => {
    const innerMethod = EthereumAbi.methodID('delegateForUserDecryption', [...delegateForUserDecryptionTypes]);
    const innerArgs = EthereumAbi.rawEncode(
      [...delegateForUserDecryptionTypes],
      [delegateAddress, tokenAddress, expiryTimestamp]
    );
    return Buffer.concat([innerMethod, innerArgs]);
  });

  // Encode outer multicall(bytes[])
  const outerMethod = EthereumAbi.methodID('multicall', [...aclMulticallTypes]);
  const outerArgs = EthereumAbi.rawEncode([...aclMulticallTypes], [innerCalls]);
  return addHexPrefix(Buffer.concat([outerMethod, outerArgs]).toString('hex'));
}

/**
 * Wraps calldata in a ForwarderV4.callFromParent(target, 0, data) call.
 *
 * Used when a forwarder contract must be msg.sender for an external contract
 * call — for example, when the forwarder itself needs to call
 * ACL.delegateForUserDecryption() so that its own balance can be decrypted.
 *
 * Only the parentAddress (root wallet) is allowed to call callFromParent
 * (enforced by the forwarder's onlyParent modifier).
 *
 * @param targetAddress  Address of the contract the forwarder will call (e.g. ACL)
 * @param calldata       ABI-encoded inner calldata (e.g. from buildDelegationCalldata)
 * @returns ABI-encoded callFromParent calldata hex string (0x-prefixed)
 */
export function wrapInCallFromParent(targetAddress: string, calldata: string): string {
  const method = EthereumAbi.methodID('callFromParent', [...callFromParentTypes]);
  const args = EthereumAbi.rawEncode(
    [...callFromParentTypes],
    [
      targetAddress,
      0, // value: no ETH transfer
      toBuffer(calldata), // inner calldata as bytes
    ]
  );
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}
