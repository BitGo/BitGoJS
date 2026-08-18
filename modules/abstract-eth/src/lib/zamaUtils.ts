import { addHexPrefix, bufferToHex, toBuffer } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import { ethers } from 'ethers';
import { confidentialTransferNoProofMethodId, confidentialTransferNoProofTypes } from './walletUtil';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ABI parameter type arrays
export const delegateForUserDecryptionTypes = ['address', 'address', 'uint64'] as const;
export const callFromParentTypes = ['address', 'uint256', 'bytes'] as const;
export const aclMulticallTypes = ['bytes[]'] as const;
export const approveTypes = ['address', 'uint256'] as const;
export const wrapTypes = ['address', 'uint256'] as const;
export const unwrapTypes = ['address', 'address', 'bytes32', 'bytes'] as const;
export const finalizeUnwrapTypes = ['bytes32', 'uint64', 'bytes'] as const;

/** Max value for Solidity `uint64` / ERC-7984 confidential amount domain (`euint64`). */
export const UINT64_MAX = 18446744073709551615n;
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

/**
 * Function selector for ERC-20 approve(address,uint256)
 * = keccak256('approve(address,uint256)')[0:4]
 * Used for exact-amount (and approve(0) reset) approvals of the ERC-7984 wrapper as spender.
 */
export const approveMethodId = addHexPrefix(EthereumAbi.methodID('approve', [...approveTypes]).toString('hex'));

/**
 * Function selector for ERC-7984 wrap(address,uint256)
 * = keccak256('wrap(address,uint256)')[0:4]
 * Locks underlying ERC-20 in the wrapper and mints an encrypted balance to `to`.
 */
export const wrapMethodId = addHexPrefix(EthereumAbi.methodID('wrap', [...wrapTypes]).toString('hex'));

/**
 * Function selector for ERC-7984 unwrap(address,address,bytes32,bytes)
 * = keccak256('unwrap(address,address,bytes32,bytes)')[0:4]
 * Burns confidential balance and requests release of underlying ERC-20 escrow.
 */
export const unwrapMethodId = addHexPrefix(EthereumAbi.methodID('unwrap', [...unwrapTypes]).toString('hex'));

/**
 * Function selector for ERC-7984 finalizeUnwrap(bytes32,uint64,bytes)
 * = keccak256('finalizeUnwrap(bytes32,uint64,bytes)')[0:4]
 * Completes unshield after oracle decryption of the phase-1 unwrap request.
 */
export const finalizeUnwrapMethodId = addHexPrefix(
  EthereumAbi.methodID('finalizeUnwrap', [...finalizeUnwrapTypes]).toString('hex')
);

// ---------------------------------------------------------------------------
// Encoding functions
// ---------------------------------------------------------------------------

/**
 * Asserts that `amount * rate` fits in uint64 (ERC-7984 confidential mint domain).
 *
 * @throws {Error} if amount or rate is invalid, or the product exceeds uint64
 */
export function assertAmountTimesRateFitsUint64(
  amount: string | number | bigint,
  rate: string | number | bigint
): void {
  let amountBn: bigint;
  let rateBn: bigint;
  try {
    amountBn = typeof amount === 'bigint' ? amount : BigInt(amount);
  } catch {
    throw new Error(`assertAmountTimesRateFitsUint64: invalid amount '${amount}'`);
  }
  try {
    rateBn = typeof rate === 'bigint' ? rate : BigInt(rate);
  } catch {
    throw new Error(`assertAmountTimesRateFitsUint64: invalid rate '${rate}'`);
  }
  if (amountBn <= 0n) {
    throw new Error('assertAmountTimesRateFitsUint64: amount must be > 0');
  }
  if (rateBn <= 0n) {
    throw new Error('assertAmountTimesRateFitsUint64: rate must be > 0');
  }
  if (amountBn * rateBn > UINT64_MAX) {
    throw new Error('assertAmountTimesRateFitsUint64: amount × rate exceeds uint64');
  }
}

/**
 * Encodes ERC-20 `approve(spender, amount)` calldata for ERC-7984 shield.
 *
 * The spender is the confidential wrapper contract; the resulting calldata is
 * sent to the underlying ERC-20. Exact-amount approve is used for the shield
 * path; `amount = 0` is the USDT-style allowance reset used when
 * `requiresApprovalReset` is set on the wrapper pair.
 *
 * Does not set gasLimit — WP owns gas.
 *
 * @param wrapperAddress  ERC-7984 wrapper contract (spender)
 * @param amount          Exact allowance to set (base units); `0` for reset
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 * @throws {Error} if the wrapper address is invalid or amount is negative
 */
export function buildApproveCalldata(wrapperAddress: string, amount: string | number | bigint): string {
  let checksummedWrapper: string;
  try {
    checksummedWrapper = ethers.utils.getAddress(wrapperAddress);
  } catch {
    throw new Error(`buildApproveCalldata: invalid wrapper address '${wrapperAddress}'`);
  }

  let amountBn: bigint;
  try {
    amountBn = typeof amount === 'bigint' ? amount : BigInt(amount);
  } catch {
    throw new Error(`buildApproveCalldata: invalid amount '${amount}'`);
  }
  if (amountBn < 0n) {
    throw new Error('buildApproveCalldata: amount must be >= 0');
  }

  const method = EthereumAbi.methodID('approve', [...approveTypes]);
  const args = EthereumAbi.rawEncode([...approveTypes], [checksummedWrapper, amountBn.toString()]);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Encodes ERC-7984 `wrap(to, amount)` calldata for the shield path.
 *
 * Calldata is sent to the confidential wrapper contract. `to` is the recipient of
 * the minted encrypted balance (self-directed shields use the wallet base address).
 * When `rate` is provided, validates that `amount × rate` fits uint64 (`euint64`).
 * `rate` is not encoded in calldata (deserialize round-trips omit it).
 *
 * Does not set gasLimit — WP owns gas.
 *
 * @param to      Recipient of confidential tokens (checksummed / lowercased accepted)
 * @param amount  Underlying ERC-20 amount to wrap (base units); must be > 0
 * @param rate    Optional on-chain wrapper `rate()` for uint64 validation
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 * @throws {Error} if address/amount/rate is invalid or amount × rate exceeds uint64
 */
export function buildWrapCalldata(
  to: string,
  amount: string | number | bigint,
  rate?: string | number | bigint
): string {
  let checksummedTo: string;
  try {
    checksummedTo = ethers.utils.getAddress(to);
  } catch {
    throw new Error(`buildWrapCalldata: invalid to address '${to}'`);
  }

  let amountBn: bigint;
  try {
    amountBn = typeof amount === 'bigint' ? amount : BigInt(amount);
  } catch {
    throw new Error(`buildWrapCalldata: invalid amount '${amount}'`);
  }
  if (amountBn <= 0n) {
    throw new Error('buildWrapCalldata: amount must be > 0');
  }

  if (rate !== undefined) {
    assertAmountTimesRateFitsUint64(amountBn, rate);
  }

  const method = EthereumAbi.methodID('wrap', [...wrapTypes]);
  const args = EthereumAbi.rawEncode([...wrapTypes], [checksummedTo, amountBn.toString()]);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Decodes ERC-7984 `wrap(to, amount)` calldata.
 *
 * @param data ABI-encoded wrap calldata (0x-prefixed)
 * @returns `{ to, amount }` with checksummed `to` and decimal-string `amount`
 */
export function decodeWrapCalldata(data: string): { to: string; amount: string } {
  if (!data.toLowerCase().startsWith(wrapMethodId.toLowerCase())) {
    throw new Error(`decodeWrapCalldata: expected wrap selector ${wrapMethodId}, got ${data.slice(0, 10)}`);
  }
  const abiCoder = new ethers.utils.AbiCoder();
  const decoded = abiCoder.decode([...wrapTypes], '0x' + data.slice(10));
  return {
    to: ethers.utils.getAddress(decoded[0]),
    amount: decoded[1].toString(),
  };
}

/**
 * Encodes ERC-7984 `unwrap(from, to, encryptedAmount, inputProof)` calldata for unshield.
 *
 * Calldata is sent to the confidential wrapper. Phase-1 unshield is self-directed:
 * `from` and `to` are both the wallet base address. `encryptedAmount` is the
 * FHE-encrypted burn amount (bytes32 handle) and `inputProof` is the Zama
 * encryption proof — both produced by WP `ZamaRelayerService.encryptAmount`.
 *
 * Does not set gasLimit — WP owns gas.
 *
 * @param from             Source of confidential balance (base address)
 * @param to               Recipient of released ERC-20 (base address in v1)
 * @param encryptedAmount  bytes32 encrypted amount handle (0x-prefixed)
 * @param inputProof       Encryption input proof bytes (0x-prefixed)
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 * @throws {Error} if addresses or ciphertext fields are invalid
 */
export function buildUnwrapCalldata(from: string, to: string, encryptedAmount: string, inputProof: string): string {
  let checksummedFrom: string;
  let checksummedTo: string;
  try {
    checksummedFrom = ethers.utils.getAddress(from);
  } catch {
    throw new Error(`buildUnwrapCalldata: invalid from address '${from}'`);
  }
  try {
    checksummedTo = ethers.utils.getAddress(to);
  } catch {
    throw new Error(`buildUnwrapCalldata: invalid to address '${to}'`);
  }

  if (!ethers.utils.isHexString(encryptedAmount) || ethers.utils.hexDataLength(encryptedAmount) !== 32) {
    throw new Error(`buildUnwrapCalldata: encryptedAmount must be a 32-byte hex string, got '${encryptedAmount}'`);
  }
  if (!ethers.utils.isHexString(inputProof) || ethers.utils.hexDataLength(inputProof) === 0) {
    throw new Error(`buildUnwrapCalldata: inputProof must be a non-empty hex string, got '${inputProof}'`);
  }

  const method = EthereumAbi.methodID('unwrap', [...unwrapTypes]);
  const args = EthereumAbi.rawEncode(
    [...unwrapTypes],
    [checksummedFrom, checksummedTo, toBuffer(encryptedAmount), toBuffer(inputProof)]
  );
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Decodes ERC-7984 `unwrap(from, to, encryptedAmount, inputProof)` calldata.
 *
 * @param data ABI-encoded unwrap calldata (0x-prefixed)
 */
export function decodeUnwrapCalldata(data: string): {
  from: string;
  to: string;
  encryptedAmount: string;
  inputProof: string;
} {
  if (!data.toLowerCase().startsWith(unwrapMethodId.toLowerCase())) {
    throw new Error(`decodeUnwrapCalldata: expected unwrap selector ${unwrapMethodId}, got ${data.slice(0, 10)}`);
  }
  const abiCoder = new ethers.utils.AbiCoder();
  const decoded = abiCoder.decode([...unwrapTypes], '0x' + data.slice(10));
  return {
    from: ethers.utils.getAddress(decoded[0]),
    to: ethers.utils.getAddress(decoded[1]),
    encryptedAmount: ethers.utils.hexlify(decoded[2]),
    inputProof: ethers.utils.hexlify(decoded[3]),
  };
}

/**
 * Encodes ERC-7984 `finalizeUnwrap(requestId, cleartextAmount, decryptionProof)` calldata.
 *
 * Calldata is sent to the confidential wrapper to complete unshield phase-2 after
 * the Zama oracle returns a cleartext amount and decryption proof for the unwrap
 * request created in phase-1.
 *
 * Does not set gasLimit — WP owns gas.
 *
 * @param requestId         bytes32 unwrap request id (0x-prefixed)
 * @param cleartextAmount   Decrypted confidential amount (uint64 domain); must be > 0
 * @param decryptionProof   Oracle decryption proof bytes (0x-prefixed)
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 * @throws {Error} if requestId, amount, or proof is invalid
 */
export function buildFinalizeUnwrapCalldata(
  requestId: string,
  cleartextAmount: string | number | bigint,
  decryptionProof: string
): string {
  if (!ethers.utils.isHexString(requestId) || ethers.utils.hexDataLength(requestId) !== 32) {
    throw new Error(`buildFinalizeUnwrapCalldata: requestId must be a 32-byte hex string, got '${requestId}'`);
  }

  let amountBn: bigint;
  try {
    amountBn = typeof cleartextAmount === 'bigint' ? cleartextAmount : BigInt(cleartextAmount);
  } catch {
    throw new Error(`buildFinalizeUnwrapCalldata: invalid cleartextAmount '${cleartextAmount}'`);
  }
  if (amountBn <= 0n) {
    throw new Error('buildFinalizeUnwrapCalldata: cleartextAmount must be > 0');
  }
  if (amountBn > UINT64_MAX) {
    throw new Error('buildFinalizeUnwrapCalldata: cleartextAmount exceeds uint64');
  }

  if (!ethers.utils.isHexString(decryptionProof) || ethers.utils.hexDataLength(decryptionProof) === 0) {
    throw new Error(
      `buildFinalizeUnwrapCalldata: decryptionProof must be a non-empty hex string, got '${decryptionProof}'`
    );
  }

  const method = EthereumAbi.methodID('finalizeUnwrap', [...finalizeUnwrapTypes]);
  const args = EthereumAbi.rawEncode(
    [...finalizeUnwrapTypes],
    [toBuffer(requestId), amountBn.toString(), toBuffer(decryptionProof)]
  );
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Decodes ERC-7984 `finalizeUnwrap(requestId, cleartextAmount, decryptionProof)` calldata.
 *
 * @param data ABI-encoded finalizeUnwrap calldata (0x-prefixed)
 */
export function decodeFinalizeUnwrapCalldata(data: string): {
  requestId: string;
  cleartextAmount: string;
  decryptionProof: string;
} {
  if (!data.toLowerCase().startsWith(finalizeUnwrapMethodId.toLowerCase())) {
    throw new Error(
      `decodeFinalizeUnwrapCalldata: expected finalizeUnwrap selector ${finalizeUnwrapMethodId}, got ${data.slice(
        0,
        10
      )}`
    );
  }
  const abiCoder = new ethers.utils.AbiCoder();
  const decoded = abiCoder.decode([...finalizeUnwrapTypes], '0x' + data.slice(10));
  return {
    requestId: ethers.utils.hexlify(decoded[0]),
    cleartextAmount: decoded[1].toString(),
    decryptionProof: ethers.utils.hexlify(decoded[2]),
  };
}

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
  // ethereumjs-abi v0.6.x has a bug where it omits the per-element offset table
  // for bytes[], producing malformed calldata that on-chain ABI decoders reject.
  // Use ethers AbiCoder which correctly emits the head offset words.
  const outerMethod = EthereumAbi.methodID('multicall', [...aclMulticallTypes]);
  const outerArgs = Buffer.from(
    new ethers.utils.AbiCoder().encode([...aclMulticallTypes], [innerCalls]).slice(2),
    'hex'
  );
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

/**
 * Decodes token contract addresses from delegation calldata.
 *
 * Handles two shapes of calldata:
 *   - Direct ACL.multicall(bytes[]) (root wallet path)
 *   - ForwarderV4.callFromParent(address, uint256, bytes) wrapping a multicall (forwarder path)
 *
 * @param calldata  ABI-encoded delegation calldata (0x-prefixed or raw hex)
 * @returns Array of token contract addresses (lowercase) found in the delegation calls
 * @throws {Error} if the calldata does not start with a recognised method selector
 */
export function decodeTokenAddressesFromDelegationCalldata(calldata: string): string[] {
  const data = calldata.startsWith('0x') ? calldata : '0x' + calldata;
  const methodId = data.slice(0, 10);
  const abiCoder = new ethers.utils.AbiCoder();

  let multicallHex: string;

  if (methodId === callFromParentMethodId) {
    // Decode callFromParent(address, uint256, bytes) — inner bytes is the full multicall calldata.
    // ethers v5 returns `bytes` as a hex string; use hexlify to normalise to a 0x-prefixed hex string
    // regardless of whether the runtime returns a string or a Uint8Array.
    const decoded = abiCoder.decode([...callFromParentTypes], '0x' + data.slice(10));
    multicallHex = ethers.utils.hexlify(decoded[2]);
  } else if (methodId === aclMulticallMethodId) {
    multicallHex = data;
  } else {
    throw new Error('Not a valid delegation calldata');
  }

  if (multicallHex.slice(0, 10) !== aclMulticallMethodId) {
    throw new Error('Not a valid delegation calldata');
  }

  // Decode multicall(bytes[]) — each element is an inner delegateForUserDecryption call.
  // ethers v5 returns bytes[] elements as hex strings; use hexlify to normalise each element.
  const decoded = abiCoder.decode(['bytes[]'], '0x' + multicallHex.slice(10));
  const innerCalls: unknown[] = decoded[0];

  const tokenAddresses: string[] = [];
  for (const innerCall of innerCalls) {
    const innerHex = ethers.utils.hexlify(innerCall as ethers.utils.BytesLike).slice(2); // strip 0x
    const innerMethodId = '0x' + innerHex.slice(0, 8);
    if (innerMethodId !== delegateForUserDecryptionMethodId) {
      continue;
    }
    // Decode delegateForUserDecryption(address delegate, address tokenAddress, uint64 expiry)
    const innerDecoded = abiCoder.decode([...delegateForUserDecryptionTypes], '0x' + innerHex.slice(8));
    tokenAddresses.push((innerDecoded[1] as string).toLowerCase());
  }

  return tokenAddresses;
}

/**
 * Encodes confidentialTransfer(address to, bytes32 encryptedHandle) calldata.
 * Uses the no-proof variant (selector 0x5bebed7e) — valid when the caller (forwarder)
 * is already ACL-allowed on the handle from when it received the tokens.
 *
 * @param toAddress       Address that will receive the tokens
 * @param encryptedHandle bytes32 encrypted balance handle from confidentialBalanceOf
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 */
export function buildConfidentialTransferByHandleCalldata(toAddress: string, encryptedHandle: string): string {
  const method = Buffer.from(confidentialTransferNoProofMethodId.slice(2), 'hex');
  const handleBuffer = toBuffer(encryptedHandle);
  const args = EthereumAbi.rawEncode([...confidentialTransferNoProofTypes], [toAddress, handleBuffer]);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Encodes the full flush calldata for ERC-7984 forwarder consolidation:
 *   callFromParent(tokenContractAddress, 0, confidentialTransfer(parentAddress, encryptedHandle))
 * The forwarder executes the inner confidentialTransfer with msg.sender = forwarder.
 *
 * @param tokenContractAddress  ERC-7984 token contract address
 * @param parentAddress         Root wallet address (destination of flushed tokens)
 * @param encryptedHandle       bytes32 encrypted balance handle from confidentialBalanceOf
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 */
export function buildFlushERC7984ForwarderTokenCalldata(
  tokenContractAddress: string,
  parentAddress: string,
  encryptedHandle: string
): string {
  const innerCalldata = buildConfidentialTransferByHandleCalldata(parentAddress, encryptedHandle);
  return wrapInCallFromParent(tokenContractAddress, innerCalldata);
}

/**
 * Decodes a FlushERC7984ForwarderToken calldata.
 * Strips the outer callFromParent wrapper and the inner confidentialTransfer.
 * Returns { tokenContractAddress, parentAddress, encryptedHandle }.
 *
 * @param data  ABI-encoded flush calldata (0x-prefixed)
 * @returns Decoded fields
 */
export function decodeFlushERC7984ForwarderTokenCalldata(data: string): {
  tokenContractAddress: string;
  parentAddress: string;
  encryptedHandle: string;
} {
  if (!data.startsWith(callFromParentMethodId)) {
    throw new Error(
      `Invalid FlushERC7984ForwarderToken calldata: expected callFromParent selector, got ${data.slice(0, 10)}`
    );
  }

  const abiCoder = new ethers.utils.AbiCoder();
  const outerDecoded = abiCoder.decode([...callFromParentTypes], '0x' + data.slice(10));
  const tokenContractAddress: string = outerDecoded[0];
  const innerCalldata: string = ethers.utils.hexlify(outerDecoded[2]);

  if (!innerCalldata.startsWith(confidentialTransferNoProofMethodId)) {
    throw new Error(
      `Invalid FlushERC7984ForwarderToken inner calldata: expected confidentialTransfer selector, got ${innerCalldata.slice(
        0,
        10
      )}`
    );
  }

  const innerDecoded = abiCoder.decode([...confidentialTransferNoProofTypes], '0x' + innerCalldata.slice(10));
  const parentAddress: string = innerDecoded[0];
  const encryptedHandle: string = bufferToHex(toBuffer(innerDecoded[1]));

  return {
    tokenContractAddress,
    parentAddress,
    encryptedHandle,
  };
}
