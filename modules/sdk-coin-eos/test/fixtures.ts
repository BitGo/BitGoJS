const getAccountResponseSuccess1 = {
  status: 200,
  body: {
    head_block_num: 191839470,
    head_block_time: '2021-06-30T18:52:59.500',
    privileged: false,
    last_code_update: '1970-01-01T00:00:00.000',
    created: '2021-06-25T17:46:56.500',
    core_liquid_balance: '5.0000 EOS',
    ram_quota: 5492,
    net_weight: 0,
    cpu_weight: 0,
    net_limit: { used: 0, available: 0, max: 0 },
    cpu_limit: { used: 0, available: 0, max: 0 },
    ram_usage: 3196,
    permissions: [
      {
        perm_name: 'active',
        parent: 'owner',
        required_auth: {
          threshold: 2,
          keys: [
            {
              key: 'EOS8Xqmp2BKoP8TJTShY8nPacoAen4ALyEZDskQaFJwjDqmyJhscg',
              weight: 1,
            },
            {
              key: 'EOS53ij86ztRu6Zd8dtkdVM3RZG17XkjYsnnWqcfqVJbnCFi8o6SG',
              weight: 1,
            },
            {
              key: 'EOS4vBMqAupVEL7RG34X17XHeKN4wf7C9vT494NeF42EWhbRXhSwu',
              weight: 1,
            },
          ],
          accounts: [],
          waits: [],
        },
      },
      {
        perm_name: 'owner',
        parent: '',
        required_auth: {
          threshold: 2,
          keys: [
            {
              key: 'EOS8Xqmp2BKoP8TJTShY8nPacoAen4ALyEZDskQaFJwjDqmyJhscg',
              weight: 1,
            },
            {
              key: 'EOS53ij86ztRu6Zd8dtkdVM3RZG17XkjYsnnWqcfqVJbnCFi8o6SG',
              weight: 1,
            },
            {
              key: 'EOS4vBMqAupVEL7RG34X17XHeKN4wf7C9vT494NeF42EWhbRXhSwu',
              weight: 1,
            },
          ],
          accounts: [],
          waits: [],
        },
      },
    ],
    total_resources: {
      owner: 'i1skda3kso43',
      net_weight: '0.0000 EOS',
      cpu_weight: '0.0000 EOS',
      ram_bytes: 4092,
    },
    self_delegated_bandwidth: null,
    refund_request: null,
    voter_info: null,
    rex_info: null,
    subjective_cpu_bill_limit: {
      used: 0,
      available: 0,
      max: 0,
    },
  },
};

const getAccountResponseSuccess2 = {
  status: 200,
  body: {
    account_name: 'ks13kdh245ls',
    head_block_num: 191839470,
    head_block_time: '2021-06-30T18:52:59.500',
    privileged: false,
    last_code_update: '1970-01-01T00:00:00.000',
    created: '2021-06-25T17:48:14.500',
    ram_quota: 5492,
    net_weight: 0,
    cpu_weight: 0,
    net_limit: { used: 0, available: 0, max: 0 },
    cpu_limit: { used: 0, available: 0, max: 0 },
    ram_usage: 3196,
    permissions: [
      {
        perm_name: 'active',
        parent: 'owner',
        required_auth: {
          threshold: 2,
          keys: [
            {
              key: 'EOS6moH6pgBJ8XL8tMA9yxnqjDGTo6P7stHienSy1ndNQgd8fNyN6',
              weight: 1,
            },
            {
              key: 'EOS5xda4tkjCjqeDYW9LkEPqRcxxpGNC9fidUjPxTJLDWzv4Y8yXy',
              weight: 1,
            },
            {
              key: 'EOS5ErXUQCKeApSFVJ89FtzFChDUrokNM18F8WJAcVqMTg9mup75k',
              weight: 1,
            },
          ],
          accounts: [],
          waits: [],
        },
      },
      {
        perm_name: 'owner',
        parent: '',
        required_auth: {
          threshold: 2,
          keys: [
            {
              key: 'EOS6moH6pgBJ8XL8tMA9yxnqjDGTo6P7stHienSy1ndNQgd8fNyN6',
              weight: 1,
            },
            {
              key: 'EOS5xda4tkjCjqeDYW9LkEPqRcxxpGNC9fidUjPxTJLDWzv4Y8yXy',
              weight: 1,
            },
            {
              key: 'EOS5ErXUQCKeApSFVJ89FtzFChDUrokNM18F8WJAcVqMTg9mup75k',
              weight: 1,
            },
          ],
          accounts: [],
          waits: [],
        },
      },
    ],
    total_resources: {
      owner: 'ks13kdh245ls',
      net_weight: '0.0000 EOS',
      cpu_weight: '0.0000 EOS',
      ram_bytes: 4092,
    },
    self_delegated_bandwidth: null,
    refund_request: null,
    voter_info: null,
    rex_info: null,
    subjective_cpu_bill_limit: {
      used: 0,
      available: 0,
      max: 0,
    },
  },
};

const getBlockResponseSuccess1 = {
  status: 200,
  body: {
    timestamp: '2021-06-30T18:53:00.500',
    producer: 'eoseouldotio',
    confirmed: 0,
    previous: '0b6f3cef4dcbf7edae252b17adc373de1d56e5e5bc9c16fd5a36e7aa76da384d',
    transaction_mroot: 'c946c861ac592028d20e20f7ec552d6a65ce0778350100bda71bfc8b892ecc85',
    action_mroot: '46310c396f263e67ac15cd4fbd2bf12ee91d0d62d3e6e929795f2a508ec2e0a8',
    schedule_version: 1973,
    new_producers: null,
    producer_signature:
      'SIG_K1_K7TDhxaNuwxo7Ao96x2AJDmLKQodD5g5KLRiTz2uh7LSBDXr5JLLebXurw61pcH6PjpDZjH3DC7iASuA4qVvoMJQZn6DQc',
    transactions: [],
    id: '0b6f3cf0baa1983af4a9e53c4864d0d7d83aa1f53c2f772228c51dfd9cd3450d',
    block_num: 191839472,
    ref_block_prefix: 1021684212,
  },
};

const getInfoResponseSuccess1 = {
  status: 200,
  body: {
    server_version: '32a47e39',
    chain_id: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    head_block_num: 191839472,
    last_irreversible_block_num: 191839146,
    last_irreversible_block_id: '0b6f3baa99cce33f4f8a9fe4d613e903eb7d77d58ca639201d71d7a006eb3f9f',
    head_block_id: '0b6f3cf0baa1983af4a9e53c4864d0d7d83aa1f53c2f772228c51dfd9cd3450d',
    head_block_time: '2021-06-29T18:53:00.500',
    head_block_producer: 'eoseouldotio',
    virtual_block_cpu_limit: 200000,
    virtual_block_net_limit: 1048576000,
    block_cpu_limit: 200000,
    block_net_limit: 1048576,
    server_version_string: 'v2.0.12',
    fork_db_head_block_num: 191839472,
    fork_db_head_block_id: '0b6f3cf0baa1983af4a9e53c4864d0d7d83aa1f53c2f772228c51dfd9cd3450d',
    server_full_version_string: 'v2.0.12-32a47e396a13b948263b1dc9762a6e2292a2c2ef',
  },
};

const explainTransactionInputNative = {
  headers: {
    ref_block_prefix: 686520069,
    ref_block_num: 3530,
    expiration: '2021-10-04T16:41:53',
  },
  transaction: {
    packed_trx:
      'd12e5b61ca0d0577eb28000000000100a6823403ea3055000000572d3ccdcd01105cc353653a5dc30000000080ab26a7b501105cc353653a5dc380ef765363e5b246080700000000000004454f5300000000930152554e2038203535313538373234203020313830302031363634393031363832205349475f4b315f48314e717664617379576a4e74666e774265634543705148646374466943504b4e656359626b507974764d634e7943644e754434446f6e4c66546a347969683841753568727a3934334442363752727073397665336e69587734657a536d2073636f756e6472656c31323300',
  },
};

const explainTransactionOutputNative = {
  displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'proxy', 'producers'],
  id: '0a6477b113b05b256e7cf3e425b7c9002da36059083dfab6172a18a2abd44953',
  changeOutputs: [],
  outputAmount: '1800',
  changeAmount: 0,
  outputs: [{ address: 'cutiesunivrs', amount: '1800' }],
  fee: {},
  memo: 'RUN 8 55158724 0 1800 1664901682 SIG_K1_H1NqvdasyWjNtfnwBecECpQHdctFiCPKNecYbkPytvMcNyCdNuD4DonLfTj4yih8Au5hrz943DB67Rrps9ve3niXw4ezSm scoundrel123',
  proxy: undefined,
  producers: undefined,
};

const explainTransactionInputChex = {
  headers: {
    ref_block_prefix: 791036278,
    ref_block_num: 37429,
    expiration: '2021-10-04T12:22:25',
  },
  transaction: {
    packed_trx:
      '01f25a6135927641262f0000000001d055435d35d45543000000572d3ccdcd0190558c8663aa267d00000000a8ed32327a90558c8663aa267d00405789ab09183300c9f0252f0000000843484558000000597b2274797065223a2273656c6c2d6c696d6974222c2273796d626f6c223a226368657863686578636865782d636865782d656f73222c227072696365223a22302e303038303638222c226368616e6e656c223a22776562227d00',
  },
};

const explainTransactionOutputChex = {
  displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'proxy', 'producers'],
  id: '2cc715f0ec7660d2161239f3814d731650e1f90c6d8dce9b36f6b6300e371b02',
  changeOutputs: [],
  outputAmount: '20250000',
  changeAmount: 0,
  outputs: [{ address: 'agg.newdex', amount: '20250000' }],
  fee: {},
  memo: '{"type":"sell-limit","symbol":"chexchexchex-chex-eos","price":"0.008068","channel":"web"}',
  proxy: undefined,
  producers: undefined,
};

const explainUnstakeInput1 = {
  headers: {
    ref_block_prefix: 791036279,
    ref_block_num: 37429,
    expiration: '2021-10-25T12:22:25',
  },
  transaction: {
    packed_trx:
      '45d678610100640000000000000100408c7a02ea3055000000000085269d00020130010000000000ea3055c08fca86a9a8d2d4014002aeaf6471c67c00000000a8ed3232304002aeaf6471c67c4002aeaf6471c67ca08601000000000004454f5300000000a08601000000000004454f530000000000',
  },
};

const explainUnstakeOutput1 = {
  displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'proxy', 'producers'],
  id: '384a9c2bbdf16541113e2ea1ddbe6e4fffdbd787d0853cf5b742a56758743776',
  changeOutputs: [],
  outputAmount: '200000',
  changeAmount: 0,
  outputs: [{ address: 'jn3b2t5jps14', amount: '200000' }],
  fee: {},
  memo: undefined,
  proxy: undefined,
  producers: undefined,
};

const explainUnstakeInput2 = {
  headers: {
    ref_block_prefix: 791036280,
    ref_block_num: 37490,
    expiration: '2021-10-26T12:22:25',
  },
  transaction: {
    packed_trx:
      '56e978610100640000000000000100408c7a02ea3055000000000085269d00020130010000000000ea3055c08fca86a9a8d2d4014002aeaf6471c67c00000000a8ed3232304002aeaf6471c67c4002aeaf6471c67c1bd911841700000004454f530000000046d911841700000004454f530000000000',
  },
};

const explainUnstakeOutput2 = {
  displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'proxy', 'producers'],
  id: '2bdb06d0813ed09c25a22d94e8b6dd33f206e394d9e4093ee49577a76c7752cd',
  changeOutputs: [],
  outputAmount: '202000020065',
  changeAmount: 0,
  outputs: [{ address: 'jn3b2t5jps14', amount: '202000020065' }],
  fee: {},
  memo: undefined,
  proxy: undefined,
  producers: undefined,
};

const explainRefundInput = {
  headers: {
    ref_block_prefix: 791036850,
    ref_block_num: 37567,
    expiration: '2021-10-28T12:22:25',
  },
  transaction: {
    packed_trx:
      '193b7b610100640000000000000100408c7a02ea3055000000000085269d00020130010000000000ea305500000000a4a997ba0120825019ab3ca98b00000000a8ed32320820825019ab3ca98b00',
  },
};

const explainRefundOutput = {
  displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'proxy', 'producers'],
  id: '5d0ec161bfbe22fdc2d0b2285a6dac7ccd0bec331014a5c1d05af9cba4db2d28',
  changeOutputs: [],
  outputAmount: '0',
  changeAmount: 0,
  outputs: [{ address: 'lionteste212', amount: '0' }],
  fee: {},
  memo: undefined,
  proxy: undefined,
  producers: undefined,
};

const unsignedTransaction = {
  recipients: [
    {
      amount: '560000',
      address: 'jzjkpn1bjnti',
      recipientLabel: null,
      memo: {
        type: 'id',
        value: 'Testing EOS Memo',
      },
    },
  ],
  headers: {
    expiration: '2019-07-27T02:47:20.500Z',
    ref_block_num: 21495,
    ref_block_prefix: 3447713214,
  },
  txHex:
    'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c4147339bb3b5df753beed7fcd000000000100a6823403ea3055000000572d3ccdcd012012a6f68a5ed4bf00000000a8ed3232212012a6f68a5ed4bfe0f27c27cc0adf7f808b08000000000004454f530000000000000000000000000000000000000000000000000000000000000000000000000000',
  transaction: {
    compression: 'none',
    packed_trx:
      '39bb3b5df753beed7fcd000000000100a6823403ea3055000000572d3ccdcd012012a6f68a5ed4bf00000000a8ed3232212012a6f68a5ed4bfe0f27c27cc0adf7f808b08000000000004454f53000000000000',
    signatures: [],
  },
  txid: '8bb4dc888bad8108a6c2f1bb8a2b74fbd8f68fa7216f86545786850517754e25',
  walletId: '5d39c7da66ce12715470c9b2fd6a639d',
  amount: '560000',
  address: 'jzjkpn1bjnti',
  receivedCoin: {
    name: 'teos',
    svg: 'eos',
    modifier: 10000,
    modifierExp: 4,
    fullDisplay: 'EOS',
    shortDisplay: 'TEOS',
    hasMarketData: false,
    walletCreationPolling: true,
  },
  coin: 'teos',
  memo: {
    type: 'id',
    value: 'Testing EOS Memo',
  },
};

export const EosResponses = {
  getAccountResponseSuccess1,
  getAccountResponseSuccess2,
  getInfoResponseSuccess1,
  getBlockResponseSuccess1,
  explainTransactionOutputNative,
  explainTransactionOutputChex,
  explainUnstakeOutput1,
  explainUnstakeOutput2,
  explainRefundOutput,
} as const;

const string257CharsLong =
  '4WMNlu0fFU8N94AwukfpfPPQn2Myo80JdmLNF5rgeKAab9XLD93KUQipcT6US0LRwWWIGbUt89fjmdwpg3CBklNi8QIeBI2i8UDJCEuQKYobR5m4ismm1RooTXUnw5OPjmfLuuajYV4e5cS1jpC6hez5X43PZ5SsGaHNYX2YYXY03ir54cWWx5QW5VCPKPKUzfq2UYK5fjAG2Fe3xCUOzqgoR6KaAiuOOnDSyhZygLJyaoJpOXZM9olblNtAW75Ed';

export const EosInputs = {
  explainTransactionInputChex,
  explainTransactionInputNative,
  explainUnstakeInput1,
  explainUnstakeInput2,
  explainRefundInput,
  unsignedTransaction,
  string257CharsLong,
} as const;
