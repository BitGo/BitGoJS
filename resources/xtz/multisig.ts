import { OriginationOp, RevealOp, TransactionOp } from '../../src/coin/xtz/iface';
import { hashTypes, isValidKey } from '../../src/coin/xtz/utils';
import { Entry } from '../../src/coin/baseCoin/iface';

/**
 * The the entry values from a transaction operation on a generic multisig smart contract.
 *
 * @param {TransactionOp} operation A transaction operation JSON
 * @return {Entry} Information about the destination, token and transfer amount
 */
export function getTransferDataFromOperation(operation: TransactionOp): Entry {
  const transferArgs = operation.parameters.value.args[0].args[1].args[0];
  const accountType = transferArgs[3].prim;
  switch (accountType) {
    case 'IMPLICIT_ACCOUNT':
      return {
        coin: transferArgs[4].args[0].prim,
        address: transferArgs[2].args[1].string,
        amount: transferArgs[4].args[1].int,
      };
    case 'CONTRACT':
      return {
        coin: transferArgs[5].args[0].prim,
        address: transferArgs[2].args[1].string,
        amount: transferArgs[5].args[1].int,
      };
    default:
      throw new Error('Invalid contract parameters');
  }
}

/**
 * Create a singlesig or multisig transaction.
 *
 * @param {string} counter Source account next counter
 * @param {string} source The account that will pay for fees, and in singlesig transactions, where
 *        the funds are taken from
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @param {string} amount The amount in mutez to be transferred
 * @param {string} destination The account address to send the funds to
 * @param {string} contractAddress If it is a multisig transfer, the smart contract address with the
 *        funds to be transferred from
 * @param {string[]} signatures signatures List of signatures authorizing the funds transfer form
 *        the multisig wallet
 * @return {TransactionOp} A Tezos transaction operation
 */
export function transactionOperation(
  counter: string,
  source: string,
  fee: string,
  gasLimit: string,
  storageLimit: string,
  amount: string,
  destination: string,
  contractAddress?: string,
  signatures: string[] = [],
): TransactionOp {
  if (contractAddress) {
    return genericMultisigTransactionOperation(
      counter,
      source,
      fee,
      gasLimit,
      storageLimit,
      amount,
      contractAddress,
      destination,
      signatures,
    );
  }
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
 * @see {@link genericMultisigTransactionOperation}
 */
export function genericMultisigTransactionOperation(
  counter: string,
  source: string,
  fee: string,
  gasLimit: string,
  storageLimit: string,
  amount: string,
  contractAddress: string,
  destinationAddress: string,
  signatures: string[],
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
    parameters: genericMultisigTransferParams(destinationAddress, amount, signatures),
  };
}

/**
 * Build the parameters to call the generic multisig smart contract with.
 *
 * @param {string} destinationAddress An implicit or originated address
 * @param {number} amount Number of Mutez to be transferred
 * @param {string[]} signatures Multisig wallet signatures
 * @return The parameters object
 */
function genericMultisigTransferParams(destinationAddress: string, amount: string, signatures: string[]) {
  const transactionSignatures: any[] = [];
  signatures.forEach(s => transactionSignatures.push({ string: s }));
  return {
    entrypoint: 'main',
    value: {
      prim: 'Pair',
      args: [
        {
          prim: 'Pair',
          args: [{ int: '0' }, { prim: 'Left', args: [transferToImplicitAccount(destinationAddress, amount)] }],
        },
        [{ prim: 'Some', args: transactionSignatures }],
      ],
    },
  };
}

/**
 * Helper function to build the to be sign to transfer funds from a multisig wallet.
 *
 * @param contractAddress The multisig smart contract address
 * @param {string} destinationAddress The destination account address (implicit or originated)
 * @param {number} amount Number of mutez to transfer
 * @return A JSON representation of the Michelson script to sign and approve a transfer
 */
export function genericMultisigDataToSign(contractAddress: string, destinationAddress: string, amount: string) {
  const data = {
    prim: 'Pair',
    args: [
      { int: '0' },
      {
        prim: 'Left',
        args: [transferToImplicitAccount(destinationAddress, amount)],
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
 *
 * @param {string} address
 * @param {number} amount
 * @see {@link https://tezostaquito.io/docs/making_transfers#transfer-000005-50-mutez-tokens-from-a-kt1-address-to-a-tz1-address}
 */
function transferToImplicitAccount(address: string, amount: string) {
  if (isValidKey(address, hashTypes.KT)) {
    return transferToOriginatedAccount(address, amount);
  }
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
 *
 * @param {string} address
 * @param {number} amount
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
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @param {string} balance New multisig account initial balance taken from the source account
 * @param {string} pubKey The public key to reveal
 * @return An origination operation
 */
export function revealOperation(
  counter: string,
  source: string,
  fee: string,
  gasLimit: string,
  storageLimit: string,
  pubKey: string,
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
 * @param {string} counter Source account next counter
 * @param {string} source Source account address
 * @param {string} fee Fees in mutez to pay by the source account
 * @param {string} gasLimit Maximum amount in mutez to spend in gas fees
 * @param {string} storageLimit Maximum amount in mutez to spend in storage fees
 * @param {string} balance New multisig account initial balance taken from the source account
 * @param {string[]} pubKeys List of public keys of the multisig owner
 * @return An origination operation
 */
export function genericMultisigOriginationOperation(
  counter: string,
  source: string,
  fee: string,
  gasLimit: string,
  storageLimit: string,
  balance: string,
  pubKeys: string[],
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
                int: '2',
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
