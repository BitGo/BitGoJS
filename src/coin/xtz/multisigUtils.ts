import { IndexedSignature, OriginationOp, RevealOp, TransactionOp, TransferData } from './iface';
import { DEFAULT_FEE, DEFAULT_GAS_LIMIT, DEFAULT_STORAGE_LIMIT, hashTypes, isValidKey } from './utils';

// Default n of m for multisig wallets
const DEFAULT_N = 2;
const DEFAULT_M = 3;

/**
 * Helper method to get the transfer details from a generic multisig transaction operation.
 *
 * @param {TransactionOp} operation A transaction operation JSON
 * @returns {TransferData} Information about the destination, token and transfer amount
 */
export function getMultisigTransferDataFromOperation(operation: TransactionOp): TransferData {
  const fee = {
    fee: operation.fee,
    gasLimit: operation.gas_limit,
    storageLimit: operation.storage_limit,
  };

  if (!operation.parameters) {
    // Singlesig transaction
    return {
      coin: 'mutez',
      from: operation.source,
      to: operation.destination,
      amount: operation.amount,
      fee,
    };
  }
  // These follow the structure from the response of genericMultisigTransferParams()
  const transferArgs = operation.parameters.value.args[0].args[1].args[0];
  const accountType = transferArgs[3].prim;
  const counter = operation.parameters.value.args[0].args[0].int;
  // In multisig transactions, the wallet contract is the destination
  const from = operation.destination;

  let accountTypeIndex;
  switch (accountType) {
    case 'IMPLICIT_ACCOUNT':
      accountTypeIndex = 4;
      break;
    case 'CONTRACT':
      accountTypeIndex = 5;
      break;
    default:
      throw new Error('Invalid contract parameters');
  }

  return {
    coin: transferArgs[accountTypeIndex].args[0].prim,
    from,
    to: transferArgs[2].args[1].string,
    amount: transferArgs[accountTypeIndex].args[1].int,
    fee,
    counter,
  };
}

/**
 * Helper method to build a singlesig transaction operation.
 *
 * @param {string} counter Source account next counter
 * @param {string} source The account that will pay for fees, and in singlesig transactions, where
 *        the funds are taken from
 * @param {string} amount The amount in mutez to be transferred
 * @param {string} destination The account address to send the funds to
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @returns {TransactionOp}A Tezos transaction operation
 */
export function singlesigTransactionOperation(
  counter: string,
  source: string,
  amount: string,
  destination: string,
  fee: string = DEFAULT_FEE.TRANSFER.toString(),
  gasLimit: string = DEFAULT_GAS_LIMIT.TRANSFER.toString(),
  storageLimit: string = DEFAULT_STORAGE_LIMIT.TRANSFER.toString(),
): TransactionOp {
  return {
    kind: 'transaction',
    source,
    fee,
    counter,
    gas_limit: gasLimit,
    storage_limit: storageLimit,
    amount,
    destination,
  };
}

/**
 * Create a multisig wallet transaction operation.
 *
 * @see {@link transactionOperation}
 * @param {string} counter Source account next counter
 * @param {string} source The account that will pay for fees, and in singlesig transactions, where
 *        the funds are taken from
 * @param {string} amount The amount in mutez to be transferred
 * @param {string} contractAddress If it is a multisig transfer, the smart contract address with the
 *        funds to be transferred from
 * @param {string} contractCounter If it is a multisig transfer, the smart contract counter to use
 *        in the next transaction
 * @param {string} destinationAddress An implicit or originated address to transfer fudns to
 * @param {string[]} signatures signatures List of signatures authorizing the funds transfer form
 *        the multisig wallet
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @param {number} m The number of signers (owners) for the multisig wallet being used. Default is 3
 * @returns {TransactionOp} A Tezos operation with a generic multisig transfer
 */
export function multisigTransactionOperation(
  counter: string,
  source: string,
  amount: string,
  contractAddress: string,
  contractCounter: string,
  destinationAddress: string,
  signatures: IndexedSignature[],
  fee: string = DEFAULT_FEE.TRANSFER.toString(),
  gasLimit: string = DEFAULT_GAS_LIMIT.TRANSFER.toString(),
  storageLimit: string = DEFAULT_STORAGE_LIMIT.TRANSFER.toString(),
  m: number = DEFAULT_M,
): TransactionOp {
  return {
    kind: 'transaction',
    source,
    fee,
    counter,
    gas_limit: gasLimit,
    storage_limit: storageLimit,
    amount: '0', // Don't transfer any funds from he source account to the contract in multisig txs
    destination: contractAddress,
    parameters: genericMultisigTransferParams(destinationAddress, amount, contractCounter, signatures, m),
  };
}

/**
 * Helper function to build the parameters to call the generic multisig smart contract with.
 *
 * @param {string} destinationAddress An implicit or originated address
 * @param {number} amount Number of Mutez to be transferred
 * @param {string} contractCounter Multisig contract counter number
 * @param {IndexedSignature[]} signatures List of transactions and their order
 * @param {number} m The multisig wallet total number of signers (owners)
 * @returns The parameters object
 */
function genericMultisigTransferParams(
  destinationAddress: string,
  amount: string,
  contractCounter: string,
  signatures: IndexedSignature[],
  m: number,
) {
  const transactionSignatures: any[] = buildSignatures(signatures);
  return {
    entrypoint: 'main',
    value: {
      prim: 'Pair',
      args: [
        {
          prim: 'Pair',
          args: [{ int: contractCounter }, { prim: 'Left', args: [transferToAccount(destinationAddress, amount)] }],
        },
        transactionSignatures,
      ],
    },
  };
}

/**
 * Replace the signatures in a multisig transaction operation with new ones.
 *
 * @param {TransactionOp} transaction Transaction to mutate
 * @param {IndexedSignature[]} signatures List of transactions and their order
 */
export function updateMultisigTransferSignatures(transaction: TransactionOp, signatures: IndexedSignature[]) {
  transaction.parameters.value.args[1] = buildSignatures(signatures, transaction.parameters.value.args[1]);
}

/**
 * Build a list of ordered signatures, putting a None primitive for the missing indexes.
 *
 * @param {IndexedSignature[]} signatures List of transactions and their order
 * @param {number} m Size of the signature list
 * @param {any[]} existingSignatures List of existing signatures to merge with the generated ones
 * @returns {any[]} List of signatures in the right order
 */
function buildSignatures(signatures: IndexedSignature[], existingSignatures = [], m: number = DEFAULT_M) {
  // Initialize the array with the existing signatures and/or empty objects
  const transactionSignatures: any[] = existingSignatures;
  const size = existingSignatures.length;
  if (size > m) {
    throw new Error('Too many signatures. Expected less than ' + m + ' got ' + size);
  }
  for (let i = size; i < m; i++) {
    transactionSignatures.push({ prim: 'None' });
  }
  // Replace the empty signatures for the real ones based on the right index
  signatures.forEach(s => {
    if (s.index) {
      transactionSignatures[s.index] = { prim: 'Some', args: [{ string: s.signature }] };
    } else {
      for (let i = 0; i < transactionSignatures.length; i++) {
        // Search for the first "null" signature
        if (transactionSignatures[i].prim === 'None') {
          transactionSignatures[i] = { prim: 'Some', args: [{ string: s.signature }] };
          break;
        }
      }
    }
  });
  return transactionSignatures;
}

/**
 * Helper function to build the Michelson script to be signed to transfer funds from a multisig
 * wallet.
 *
 * @param contractAddress The multisig smart contract address
 * @param {string} destinationAddress The destination account address (implicit or originated)
 * @param {number} amount Number of mutez to transfer
 * @param {string} contractCounter Wallet counter to use in the transaction
 * @returns A JSON representation of the Michelson script to sign and approve a transfer
 */
export function genericMultisigDataToSign(
  contractAddress: string,
  destinationAddress: string,
  amount: string,
  contractCounter: string,
) {
  const data = {
    prim: 'Pair',
    args: [
      { int: contractCounter },
      {
        prim: 'Left',
        args: [transferToAccount(destinationAddress, amount)],
      },
    ],
  };
  const type = {
    prim: 'pair',
    args: [
      {
        prim: 'nat',
        annots: ['%counter'],
      },
      {
        prim: 'or',
        args: [
          {
            prim: 'lambda',
            args: [
              { prim: 'unit' },
              {
                prim: 'list',
                args: [{ prim: 'operation' }],
              },
            ],
            annots: ['%operation'],
          },
          {
            prim: 'pair',
            args: [
              {
                prim: 'nat',
                annots: ['%threshold'],
              },
              {
                prim: 'list',
                args: [{ prim: 'key' }],
                annots: ['%keys'],
              },
            ],
            annots: ['%change_keys'],
          },
        ],
        annots: [':action'],
      },
    ],
    annots: [':payload'],
  };
  return buildPair(data, type, contractAddress);
}

/**
 * Util function to build a Michelson Pair object.
 *
 * @param data
 * @param type
 * @param contractAddress
 */
function buildPair(data: any, type: any, contractAddress: any) {
  return {
    data: {
      prim: 'Pair',
      args: [{ string: contractAddress }, data],
    },
    type: {
      prim: 'pair',
      args: [{ prim: 'address' }, type],
    },
  };
}

/**
 * Build the lambda for the multisig transaction transfer to an implicit or originated account.
 *
 * @param {string} address Account address to send the funds to
 * @param {string} amount The amount in mutez to transfer
 * @see {@link https://tezostaquito.io/docs/making_transfers#transfer-000005-50-mutez-tokens-from-a-kt1-address-to-a-tz1-address}
 */
function transferToAccount(address: string, amount: string) {
  if (isValidKey(address, hashTypes.KT)) {
    return transferToOriginatedAccount(address, amount);
  }
  // Lambda to transfer to an implicit account
  return [
    { prim: 'DROP' },
    { prim: 'NIL', args: [{ prim: 'operation' }] },
    {
      prim: 'PUSH',
      args: [{ prim: 'key_hash' }, { string: address }],
    },
    { prim: 'IMPLICIT_ACCOUNT' },
    {
      prim: 'PUSH',
      args: [{ prim: 'mutez' }, { int: amount }],
    },
    { prim: 'UNIT' },
    { prim: 'TRANSFER_TOKENS' },
    { prim: 'CONS' },
  ];
}

/**
 * Build the lambda for the multisig transaction transfer to an originated account.
 *
 * @param {string} address Originated account address to send the funds to
 * @param {string} amount The amount in mutez to transfer
 * @see {@link https://tezostaquito.io/docs/making_transfers#transfer-0000001-1-mutez-tokens-from-a-kt1-address-to-a-kt1-address}
 */
function transferToOriginatedAccount(address: string, amount: string) {
  return [
    { prim: 'DROP' },
    { prim: 'NIL', args: [{ prim: 'operation' }] },
    {
      prim: 'PUSH',
      args: [{ prim: 'address' }, { string: address }],
    },
    { prim: 'CONTRACT', args: [{ prim: 'unit' }] },
    [
      {
        prim: 'IF_NONE',
        args: [[[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]], []],
      },
    ],
    {
      prim: 'PUSH',
      args: [{ prim: 'mutez' }, { int: amount }],
    },
    { prim: 'UNIT' },
    { prim: 'TRANSFER_TOKENS' },
    { prim: 'CONS' },
  ];
}

/**
 * Create a reveal operation for a public key.
 *
 * @param {string} counter Source account next counter
 * @param {string} source Source account address
 * @param {string} pubKey The public key to reveal
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @returns An origination operation
 */
export function revealOperation(
  counter: string,
  source: string,
  pubKey: string,
  fee: string = DEFAULT_FEE.REVEAL.toString(),
  gasLimit: string = DEFAULT_GAS_LIMIT.REVEAL.toString(),
  storageLimit: string = DEFAULT_STORAGE_LIMIT.REVEAL.toString(),
): RevealOp {
  return {
    kind: 'reveal',
    counter,
    source,
    fee,
    gas_limit: gasLimit,
    storage_limit: storageLimit,
    public_key: pubKey,
  };
}

/**
 * Create an origination operation for the generic multisg contract. It does not create a reveal
 * operation for the source account.
 *
 * @param {string} counter Valid source account counter to use
 * @param {string} source Source account address
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @param {string} balance New multisig account initial balance taken from the source account
 * @param {string[]} pubKeys List of public keys of the multisig owner
 * @param {number} threshold Minimum number of signatures required to authorize a multisig operation
 * @returns An origination operation
 */
export function genericMultisigOriginationOperation(
  counter: string,
  source: string,
  fee: string,
  gasLimit: string,
  storageLimit: string,
  balance: string,
  pubKeys: string[],
  threshold: number = DEFAULT_N,
): OriginationOp {
  const walletPublicKeys: any[] = [];
  pubKeys.forEach(pk => walletPublicKeys.push({ string: pk }));
  return {
    kind: 'origination',
    counter,
    source,
    fee,
    gas_limit: gasLimit,
    storage_limit: storageLimit,
    balance,
    script: {
      code: genericMultisig,
      storage: {
        prim: 'Pair',
        args: [
          {
            int: '0',
          },
          {
            prim: 'Pair',
            args: [
              {
                int: threshold.toString(),
              },
              walletPublicKeys,
            ],
          },
        ],
      },
    },
  };
}

/**
 * Generic Multisig contract from https://github.com/murbard/smart-contracts/blob/master/multisig/michelson/generic.tz
 */
const genericMultisig = [
  {
    prim: 'parameter',
    args: [
      {
        prim: 'or',
        args: [
          { prim: 'unit', annots: ['%default'] },
          {
            prim: 'pair',
            args: [
              {
                prim: 'pair',
                args: [
                  {
                    prim: 'nat',
                    annots: ['%counter'],
                  },
                  {
                    prim: 'or',
                    args: [
                      {
                        prim: 'lambda',
                        args: [
                          { prim: 'unit' },
                          {
                            prim: 'list',
                            args: [
                              {
                                prim: 'operation',
                              },
                            ],
                          },
                        ],
                        annots: ['%operation'],
                      },
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'nat',
                            annots: ['%threshold'],
                          },
                          {
                            prim: 'list',
                            args: [{ prim: 'key' }],
                            annots: ['%keys'],
                          },
                        ],
                        annots: ['%change_keys'],
                      },
                    ],
                    annots: [':action'],
                  },
                ],
                annots: [':payload'],
              },
              {
                prim: 'list',
                args: [
                  {
                    prim: 'option',
                    args: [{ prim: 'signature' }],
                  },
                ],
                annots: ['%sigs'],
              },
            ],
            annots: ['%main'],
          },
        ],
      },
    ],
  },
  {
    prim: 'storage',
    args: [
      {
        prim: 'pair',
        args: [
          {
            prim: 'nat',
            annots: ['%stored_counter'],
          },
          {
            prim: 'pair',
            args: [
              {
                prim: 'nat',
                annots: ['%threshold'],
              },
              {
                prim: 'list',
                args: [{ prim: 'key' }],
                annots: ['%keys'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    prim: 'code',
    args: [
      [
        [
          [
            { prim: 'DUP' },
            { prim: 'CAR' },
            {
              prim: 'DIP',
              args: [[{ prim: 'CDR' }]],
            },
          ],
        ],
        {
          prim: 'IF_LEFT',
          args: [
            [
              { prim: 'DROP' },
              {
                prim: 'NIL',
                args: [{ prim: 'operation' }],
              },
              { prim: 'PAIR' },
            ],
            [
              {
                prim: 'PUSH',
                args: [{ prim: 'mutez' }, { int: '0' }],
              },
              { prim: 'AMOUNT' },
              [
                [{ prim: 'COMPARE' }, { prim: 'EQ' }],
                {
                  prim: 'IF',
                  args: [[], [[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]]],
                },
              ],
              { prim: 'SWAP' },
              { prim: 'DUP' },
              {
                prim: 'DIP',
                args: [[{ prim: 'SWAP' }]],
              },
              {
                prim: 'DIP',
                args: [
                  [
                    [
                      [
                        { prim: 'DUP' },
                        { prim: 'CAR' },
                        {
                          prim: 'DIP',
                          args: [[{ prim: 'CDR' }]],
                        },
                      ],
                    ],
                    { prim: 'DUP' },
                    { prim: 'SELF' },
                    { prim: 'ADDRESS' },
                    { prim: 'PAIR' },
                    { prim: 'PACK' },
                    {
                      prim: 'DIP',
                      args: [
                        [
                          [
                            [
                              { prim: 'DUP' },
                              {
                                prim: 'CAR',
                                annots: ['@counter'],
                              },
                              {
                                prim: 'DIP',
                                args: [
                                  [
                                    {
                                      prim: 'CDR',
                                    },
                                  ],
                                ],
                              },
                            ],
                          ],
                          {
                            prim: 'DIP',
                            args: [[{ prim: 'SWAP' }]],
                          },
                        ],
                      ],
                    },
                    { prim: 'SWAP' },
                  ],
                ],
              },
              [
                [
                  { prim: 'DUP' },
                  {
                    prim: 'CAR',
                    annots: ['@stored_counter'],
                  },
                  {
                    prim: 'DIP',
                    args: [[{ prim: 'CDR' }]],
                  },
                ],
              ],
              {
                prim: 'DIP',
                args: [[{ prim: 'SWAP' }]],
              },
              [
                [{ prim: 'COMPARE' }, { prim: 'EQ' }],
                {
                  prim: 'IF',
                  args: [[], [[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]]],
                },
              ],
              {
                prim: 'DIP',
                args: [[{ prim: 'SWAP' }]],
              },
              [
                [
                  { prim: 'DUP' },
                  {
                    prim: 'CAR',
                    annots: ['@threshold'],
                  },
                  {
                    prim: 'DIP',
                    args: [
                      [
                        {
                          prim: 'CDR',
                          annots: ['@keys'],
                        },
                      ],
                    ],
                  },
                ],
              ],
              {
                prim: 'DIP',
                args: [
                  [
                    {
                      prim: 'PUSH',
                      args: [{ prim: 'nat' }, { int: '0' }],
                      annots: ['@valid'],
                    },
                    { prim: 'SWAP' },
                    {
                      prim: 'ITER',
                      args: [
                        [
                          {
                            prim: 'DIP',
                            args: [[{ prim: 'SWAP' }]],
                          },
                          { prim: 'SWAP' },
                          {
                            prim: 'IF_CONS',
                            args: [
                              [
                                [
                                  {
                                    prim: 'IF_NONE',
                                    args: [
                                      [
                                        {
                                          prim: 'SWAP',
                                        },
                                        {
                                          prim: 'DROP',
                                        },
                                      ],
                                      [
                                        {
                                          prim: 'SWAP',
                                        },
                                        {
                                          prim: 'DIP',
                                          args: [
                                            [
                                              {
                                                prim: 'SWAP',
                                              },
                                              {
                                                prim: 'DIP',
                                                args: [
                                                  {
                                                    int: '2',
                                                  },
                                                  [
                                                    [
                                                      {
                                                        prim: 'DIP',
                                                        args: [
                                                          [
                                                            {
                                                              prim: 'DUP',
                                                            },
                                                          ],
                                                        ],
                                                      },
                                                      {
                                                        prim: 'SWAP',
                                                      },
                                                    ],
                                                  ],
                                                ],
                                              },
                                              [
                                                [
                                                  {
                                                    prim: 'DIP',
                                                    args: [
                                                      {
                                                        int: '2',
                                                      },
                                                      [
                                                        {
                                                          prim: 'DUP',
                                                        },
                                                      ],
                                                    ],
                                                  },
                                                  {
                                                    prim: 'DIG',
                                                    args: [
                                                      {
                                                        int: '3',
                                                      },
                                                    ],
                                                  },
                                                ],
                                                {
                                                  prim: 'DIP',
                                                  args: [
                                                    [
                                                      {
                                                        prim: 'CHECK_SIGNATURE',
                                                      },
                                                    ],
                                                  ],
                                                },
                                                {
                                                  prim: 'SWAP',
                                                },
                                                {
                                                  prim: 'IF',
                                                  args: [
                                                    [
                                                      {
                                                        prim: 'DROP',
                                                      },
                                                    ],
                                                    [
                                                      {
                                                        prim: 'FAILWITH',
                                                      },
                                                    ],
                                                  ],
                                                },
                                              ],
                                              {
                                                prim: 'PUSH',
                                                args: [
                                                  {
                                                    prim: 'nat',
                                                  },
                                                  {
                                                    int: '1',
                                                  },
                                                ],
                                              },
                                              {
                                                prim: 'ADD',
                                                annots: ['@valid'],
                                              },
                                            ],
                                          ],
                                        },
                                      ],
                                    ],
                                  },
                                ],
                              ],
                              [
                                [
                                  {
                                    prim: 'UNIT',
                                  },
                                  {
                                    prim: 'FAILWITH',
                                  },
                                ],
                              ],
                            ],
                          },
                          { prim: 'SWAP' },
                        ],
                      ],
                    },
                  ],
                ],
              },
              [
                [{ prim: 'COMPARE' }, { prim: 'LE' }],
                {
                  prim: 'IF',
                  args: [[], [[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]]],
                },
              ],
              {
                prim: 'IF_CONS',
                args: [[[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]], []],
              },
              { prim: 'DROP' },
              {
                prim: 'DIP',
                args: [
                  [
                    [
                      [
                        { prim: 'DUP' },
                        { prim: 'CAR' },
                        {
                          prim: 'DIP',
                          args: [[{ prim: 'CDR' }]],
                        },
                      ],
                    ],
                    {
                      prim: 'PUSH',
                      args: [{ prim: 'nat' }, { int: '1' }],
                    },
                    {
                      prim: 'ADD',
                      annots: ['@new_counter'],
                    },
                    { prim: 'PAIR' },
                  ],
                ],
              },
              {
                prim: 'IF_LEFT',
                args: [
                  [{ prim: 'UNIT' }, { prim: 'EXEC' }],
                  [
                    {
                      prim: 'DIP',
                      args: [[{ prim: 'CAR' }]],
                    },
                    { prim: 'SWAP' },
                    { prim: 'PAIR' },
                    {
                      prim: 'NIL',
                      args: [{ prim: 'operation' }],
                    },
                  ],
                ],
              },
              { prim: 'PAIR' },
            ],
          ],
        },
      ],
    ],
  },
];
