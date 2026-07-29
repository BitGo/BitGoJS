import { ethers } from 'ethers';

export function decodeTransaction(abi: string, calldata: string): ethers.utils.TransactionDescription {
  const contractInterface = new ethers.utils.Interface(abi);
  return contractInterface.parseTransaction({ data: calldata });
}

export function parseTransaction(txHex: string): ethers.Transaction {
  return ethers.utils.parseTransaction(txHex);
}

export const walletSimpleABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'toAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'expireTime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'sequenceId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'sendMultiSig',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
