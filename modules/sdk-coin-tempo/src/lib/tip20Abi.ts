/**
 * TIP-20 Token Standard ABI
 *
 * TIP-20 is Tempo's token standard, similar to ERC-20 but with:
 * - 6 decimal places (instead of 18)
 * - transferWithMemo function for attaching metadata
 */

/**
 * TIP-20 transferWithMemo ABI
 * Standard function for TIP-20 token transfers with memo field
 */
export const TIP20_TRANSFER_WITH_MEMO_ABI = [
  {
    type: 'function',
    name: 'transferWithMemo',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'memo', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

/**
 * Standard TIP-20 token ABI (similar to ERC-20)
 */
export const TIP20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  ...TIP20_TRANSFER_WITH_MEMO_ABI,
] as const;
