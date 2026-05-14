import { addHexPrefix } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ABI parameter type arrays
export const approveTypes = ['address', 'uint256'] as const;
export const depositTypes = ['uint256', 'address'] as const;

/**
 * Function selector for ERC20.approve(address,uint256)
 * = keccak256('approve(address,uint256)')[0:4] = 0x095ea7b3
 */
export const approveMethodId = addHexPrefix(EthereumAbi.methodID('approve', [...approveTypes]).toString('hex'));

/**
 * Function selector for ERC4626.deposit(uint256,address)
 * = keccak256('deposit(uint256,address)')[0:4] = 0x6e553f65
 */
export const depositMethodId = addHexPrefix(EthereumAbi.methodID('deposit', [...depositTypes]).toString('hex'));

// ---------------------------------------------------------------------------
// Encoding functions
// ---------------------------------------------------------------------------

/**
 * Encodes an ERC20 approve(address,uint256) call.
 *
 * Grants `spenderAddress` permission to transfer up to `amount` ZAMA tokens
 * on behalf of the caller (msg.sender). Used as TX1 of the delegate flow
 * to authorize the OperatorStaking contract before depositing.
 *
 * @param spenderAddress  OperatorStaking contract address (the approved spender)
 * @param amount          Amount of ZAMA tokens to approve (18 decimals, as a decimal string)
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 */
export function buildApproveCalldata(spenderAddress: string, amount: string): string {
  const method = EthereumAbi.methodID('approve', [...approveTypes]);
  const args = EthereumAbi.rawEncode([...approveTypes], [spenderAddress, amount]);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Encodes an ERC4626 deposit(uint256,address) call.
 *
 * Deposits `amount` ZAMA tokens (18 decimals) into the OperatorStaking vault
 * and mints stZAMA shares (20 decimals) to `receiverAddress`.
 *
 * Requires a prior ERC20 approve() call granting the OperatorStaking contract
 * at least `amount` allowance.
 *
 * @param amount           Amount of ZAMA tokens to deposit (18 decimals, as a decimal string)
 * @param receiverAddress  Address that will receive the minted stZAMA shares
 * @returns ABI-encoded calldata hex string (0x-prefixed)
 */
export function buildDepositCalldata(amount: string, receiverAddress: string): string {
  const method = EthereumAbi.methodID('deposit', [...depositTypes]);
  const args = EthereumAbi.rawEncode([...depositTypes], [amount, receiverAddress]);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}
