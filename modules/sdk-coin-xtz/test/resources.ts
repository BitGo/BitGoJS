import { XtzLib } from '../src';

export const defaultKeyPairFromPrv = new XtzLib.KeyPair({
  prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
});

export const defaultKeyPairFromPub = new XtzLib.KeyPair({
  pub: 'xpub661MyMwAqRbcFhCvdhTAfpEEDV58oqDvv65YNHC686NNs4KbH8YZQJWVmrfbve7aAVHzxw8bKFxA7MLeDK6BbLfkE3bqkvHLPgaGHHtYGeY',
});
export const defaultDataToSign =
  '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b';

export const emptyUnsignedSerializedOriginationTransaction =
  'ad0cce1d666f0fb7861d89d53faf0de01039c5f24170937d773ae9cd42c68f63';

export const unsignedSerializedOriginationTransaction =
  'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86d006b5ddaef3fb5d7c151cfb36fbe43a7a0667773949c25f48f07b389028c0ac0843d0000000381020000037c05000764046c000000082564656661756c740865086504620000000825636f756e7465720864085e036c055f036d0000000a256f7065726174696f6e086504620000000a257468726573686f6c64065f035c00000005256b6579730000000c256368616e67655f6b657973000000073a616374696f6e000000083a7061796c6f6164065f0563036700000005257369677300000005256d61696e0501076504620000000f2573746f7265645f636f756e746572076504620000000a257468726573686f6c64065f035c00000005256b657973050202000002a30200000012020000000d03210316051f02000000020317072e02000000080320053d036d034202000002780743036a00000313020000001e020000000403190325072c020000000002000000090200000004034f0327034c0321051f0200000002034c051f02000000560200000012020000000d03210316051f020000000203170321034903540342030c051f020000002c020000001e0200000019032104160000000840636f756e746572051f02000000020317051f0200000002034c034c02000000250200000020032104160000000f4073746f7265645f636f756e746572051f02000000020317051f0200000002034c020000001e020000000403190325072c020000000002000000090200000004034f0327051f0200000002034c02000000290200000024032104160000000a407468726573686f6c64051f020000000b041700000005406b657973051f02000000ba084303620000000000064076616c6964034c055202000000a1051f0200000002034c034c072d020000007f020000007a072f0200000004034c0320020000006a034c051f0200000061034c071f00020200000010020000000b051f02000000020321034c020000002f020000000f071f00020200000002032105700003051f02000000020318034c072c02000000020320020000000203270743036200010412000000064076616c696402000000090200000004034f0327034c020000001e020000000403190332072c020000000002000000090200000004034f0327072d02000000090200000004034f032702000000000320051f02000000310200000012020000000d03210316051f0200000002031707430362000104120000000c406e65775f636f756e7465720342072e0200000004034f03260200000011051f02000000020316034c0342053d036d0342000000c1070700000707000202000000b401000000377370706b375a574238646955325457656878646b57435632445446766e3168507a34714c6a6944336e4a516f7a4b6e6f53456e5343386201000000377370706b375a71394b5074776b7a6b6741736861346a5532394334334d63675032736b4b3536746a64374b4a6a68636d4836415a43314601000000377370706b3764327a747a62724c644261544237797a6157526b506663574773724e514e4a646b42453962435453537a656b4c4e7a707666';

export const signedSerializedOriginationTransaction =
  'ba7a04fab1a3f77eda96b551947dd343e165d1b91b6f9f806648b63e57c88cc86d006b5ddaef3fb5d7c151cfb36fbe43a7a0667773949c25f48f07b389028c0ac0843d0000000381020000037c05000764046c000000082564656661756c740865086504620000000825636f756e7465720864085e036c055f036d0000000a256f7065726174696f6e086504620000000a257468726573686f6c64065f035c00000005256b6579730000000c256368616e67655f6b657973000000073a616374696f6e000000083a7061796c6f6164065f0563036700000005257369677300000005256d61696e0501076504620000000f2573746f7265645f636f756e746572076504620000000a257468726573686f6c64065f035c00000005256b657973050202000002a30200000012020000000d03210316051f02000000020317072e02000000080320053d036d034202000002780743036a00000313020000001e020000000403190325072c020000000002000000090200000004034f0327034c0321051f0200000002034c051f02000000560200000012020000000d03210316051f020000000203170321034903540342030c051f020000002c020000001e0200000019032104160000000840636f756e746572051f02000000020317051f0200000002034c034c02000000250200000020032104160000000f4073746f7265645f636f756e746572051f02000000020317051f0200000002034c020000001e020000000403190325072c020000000002000000090200000004034f0327051f0200000002034c02000000290200000024032104160000000a407468726573686f6c64051f020000000b041700000005406b657973051f02000000ba084303620000000000064076616c6964034c055202000000a1051f0200000002034c034c072d020000007f020000007a072f0200000004034c0320020000006a034c051f0200000061034c071f00020200000010020000000b051f02000000020321034c020000002f020000000f071f00020200000002032105700003051f02000000020318034c072c02000000020320020000000203270743036200010412000000064076616c696402000000090200000004034f0327034c020000001e020000000403190332072c020000000002000000090200000004034f0327072d02000000090200000004034f032702000000000320051f02000000310200000012020000000d03210316051f0200000002031707430362000104120000000c406e65775f636f756e7465720342072e0200000004034f03260200000011051f02000000020316034c0342053d036d0342000000c1070700000707000202000000b401000000377370706b375a574238646955325457656878646b57435632445446766e3168507a34714c6a6944336e4a516f7a4b6e6f53456e5343386201000000377370706b375a71394b5074776b7a6b6741736861346a5532394334334d63675032736b4b3536746a64374b4a6a68636d4836415a43314601000000377370706b3764327a747a62724c644261544237797a6157526b506663574773724e514e4a646b42453962435453537a656b4c4e7a707666a319a0ac5c5c949dcf4a49452e0bd13cf3e05903379784317a821d2f323f677c84acef4a3c1d68e2b216df9ca225d426cf23c3c2f57c19e95063fbd4b30b620b';

export const validDataToSign = {
  data: {
    prim: 'Pair',
    args: [
      { string: 'KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL' },
      {
        prim: 'Pair',
        args: [
          { int: '0' },
          {
            prim: 'Left',
            args: [
              [
                { prim: 'DROP' },
                { prim: 'NIL', args: [{ prim: 'operation' }] },
                { prim: 'PUSH', args: [{ prim: 'key_hash' }, { string: 'tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS' }] },
                { prim: 'IMPLICIT_ACCOUNT' },
                { prim: 'PUSH', args: [{ prim: 'mutez' }, { int: '100' }] },
                { prim: 'UNIT' },
                { prim: 'TRANSFER_TOKENS' },
                { prim: 'CONS' },
              ],
            ],
          },
        ],
      },
    ],
  },
  type: {
    prim: 'pair',
    args: [
      { prim: 'address' },
      {
        prim: 'pair',
        args: [
          { prim: 'nat', annots: ['%counter'] },
          {
            prim: 'or',
            args: [
              {
                prim: 'lambda',
                args: [{ prim: 'unit' }, { prim: 'list', args: [{ prim: 'operation' }] }],
                annots: ['%operation'],
              },
              {
                prim: 'pair',
                args: [
                  { prim: 'nat', annots: ['%threshold'] },
                  { prim: 'list', args: [{ prim: 'key' }], annots: ['%keys'] },
                ],
                annots: ['%change_keys'],
              },
            ],
            annots: [':action'],
          },
        ],
        annots: [':payload'],
      },
    ],
  },
};

export const parsedTransaction = {
  branch: 'BM8QdZ92VyaH1s5nwAF9rUXjiPZ3g3Nsn6oYbdKqj2RgHxvWXVS',
  contents: [
    {
      kind: 'origination',
      source: 'tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A',
      fee: '4764',
      counter: '116724',
      gas_limit: '33971',
      storage_limit: '1292',
      balance: '1000000',
      script: {
        code: [
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
                          { prim: 'nat', annots: ['%counter'] },
                          {
                            prim: 'or',
                            args: [
                              {
                                prim: 'lambda',
                                args: [{ prim: 'unit' }, { prim: 'list', args: [{ prim: 'operation' }] }],
                                annots: ['%operation'],
                              },
                              {
                                prim: 'pair',
                                args: [
                                  { prim: 'nat', annots: ['%threshold'] },
                                  { prim: 'list', args: [{ prim: 'key' }], annots: ['%keys'] },
                                ],
                                annots: ['%change_keys'],
                              },
                            ],
                            annots: [':action'],
                          },
                        ],
                        annots: [':payload'],
                      },
                      { prim: 'list', args: [{ prim: 'option', args: [{ prim: 'signature' }] }], annots: ['%sigs'] },
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
                  { prim: 'nat', annots: ['%stored_counter'] },
                  {
                    prim: 'pair',
                    args: [
                      { prim: 'nat', annots: ['%threshold'] },
                      { prim: 'list', args: [{ prim: 'key' }], annots: ['%keys'] },
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
                [[{ prim: 'DUP' }, { prim: 'CAR' }, { prim: 'DIP', args: [[{ prim: 'CDR' }]] }]],
                {
                  prim: 'IF_LEFT',
                  args: [
                    [{ prim: 'DROP' }, { prim: 'NIL', args: [{ prim: 'operation' }] }, { prim: 'PAIR' }],
                    [
                      { prim: 'PUSH', args: [{ prim: 'mutez' }, { int: '0' }] },
                      { prim: 'AMOUNT' },
                      [
                        [{ prim: 'COMPARE' }, { prim: 'EQ' }],
                        { prim: 'IF', args: [[], [[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]]] },
                      ],
                      { prim: 'SWAP' },
                      { prim: 'DUP' },
                      { prim: 'DIP', args: [[{ prim: 'SWAP' }]] },
                      {
                        prim: 'DIP',
                        args: [
                          [
                            [[{ prim: 'DUP' }, { prim: 'CAR' }, { prim: 'DIP', args: [[{ prim: 'CDR' }]] }]],
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
                                      { prim: 'CAR', annots: ['@counter'] },
                                      { prim: 'DIP', args: [[{ prim: 'CDR' }]] },
                                    ],
                                  ],
                                  { prim: 'DIP', args: [[{ prim: 'SWAP' }]] },
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
                          { prim: 'CAR', annots: ['@stored_counter'] },
                          { prim: 'DIP', args: [[{ prim: 'CDR' }]] },
                        ],
                      ],
                      { prim: 'DIP', args: [[{ prim: 'SWAP' }]] },
                      [
                        [{ prim: 'COMPARE' }, { prim: 'EQ' }],
                        { prim: 'IF', args: [[], [[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]]] },
                      ],
                      { prim: 'DIP', args: [[{ prim: 'SWAP' }]] },
                      [
                        [
                          { prim: 'DUP' },
                          { prim: 'CAR', annots: ['@threshold'] },
                          { prim: 'DIP', args: [[{ prim: 'CDR', annots: ['@keys'] }]] },
                        ],
                      ],
                      {
                        prim: 'DIP',
                        args: [
                          [
                            { prim: 'PUSH', args: [{ prim: 'nat' }, { int: '0' }], annots: ['@valid'] },
                            { prim: 'SWAP' },
                            {
                              prim: 'ITER',
                              args: [
                                [
                                  { prim: 'DIP', args: [[{ prim: 'SWAP' }]] },
                                  { prim: 'SWAP' },
                                  {
                                    prim: 'IF_CONS',
                                    args: [
                                      [
                                        [
                                          {
                                            prim: 'IF_NONE',
                                            args: [
                                              [{ prim: 'SWAP' }, { prim: 'DROP' }],
                                              [
                                                { prim: 'SWAP' },
                                                {
                                                  prim: 'DIP',
                                                  args: [
                                                    [
                                                      { prim: 'SWAP' },
                                                      {
                                                        prim: 'DIP',
                                                        args: [
                                                          { int: '2' },
                                                          [
                                                            [
                                                              { prim: 'DIP', args: [[{ prim: 'DUP' }]] },
                                                              { prim: 'SWAP' },
                                                            ],
                                                          ],
                                                        ],
                                                      },
                                                      [
                                                        [
                                                          { prim: 'DIP', args: [{ int: '2' }, [{ prim: 'DUP' }]] },
                                                          { prim: 'DIG', args: [{ int: '3' }] },
                                                        ],
                                                        { prim: 'DIP', args: [[{ prim: 'CHECK_SIGNATURE' }]] },
                                                        { prim: 'SWAP' },
                                                        {
                                                          prim: 'IF',
                                                          args: [[{ prim: 'DROP' }], [{ prim: 'FAILWITH' }]],
                                                        },
                                                      ],
                                                      { prim: 'PUSH', args: [{ prim: 'nat' }, { int: '1' }] },
                                                      { prim: 'ADD', annots: ['@valid'] },
                                                    ],
                                                  ],
                                                },
                                              ],
                                            ],
                                          },
                                        ],
                                      ],
                                      [[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]],
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
                        { prim: 'IF', args: [[], [[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]]] },
                      ],
                      { prim: 'IF_CONS', args: [[[{ prim: 'UNIT' }, { prim: 'FAILWITH' }]], []] },
                      { prim: 'DROP' },
                      {
                        prim: 'DIP',
                        args: [
                          [
                            [[{ prim: 'DUP' }, { prim: 'CAR' }, { prim: 'DIP', args: [[{ prim: 'CDR' }]] }]],
                            { prim: 'PUSH', args: [{ prim: 'nat' }, { int: '1' }] },
                            { prim: 'ADD', annots: ['@new_counter'] },
                            { prim: 'PAIR' },
                          ],
                        ],
                      },
                      {
                        prim: 'IF_LEFT',
                        args: [
                          [{ prim: 'UNIT' }, { prim: 'EXEC' }],
                          [
                            { prim: 'DIP', args: [[{ prim: 'CAR' }]] },
                            { prim: 'SWAP' },
                            { prim: 'PAIR' },
                            { prim: 'NIL', args: [{ prim: 'operation' }] },
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
        ],
        storage: {
          prim: 'Pair',
          args: [
            { int: '0' },
            {
              prim: 'Pair',
              args: [
                { int: '2' },
                [
                  { string: 'sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b' },
                  { string: 'sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F' },
                  { string: 'sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf' },
                ],
              ],
            },
          ],
        },
      },
    },
  ],
};
