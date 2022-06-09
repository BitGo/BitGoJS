/**
 * @prettier
 */
import nock from 'nock';
import { Environments } from '@bitgo/sdk-core';

export const nockXrpRecovery = function nockXrpRecovery() {
  nock('https://s.altnet.rippletest.net:51234', { allowUnmocked: false })
    .post('/', {
      method: 'account_info',
      params: [
        {
          account: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
          strict: true,
          ledger_index: 'current',
          queue: true,
          signer_lists: true,
        },
      ],
    })
    .reply(200, {
      result: {
        account_data: {
          Account: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
          Balance: '9944000000',
          Flags: 1179648,
          LedgerEntryType: 'AccountRoot',
          OwnerCount: 5,
          PreviousTxnID: '82460E9FAF24F53388DC9CBA91934B3F82107148CD20BD26E80DF774323545C3',
          PreviousTxnLgrSeq: 396996,
          Sequence: 4,
          index: 'C676D324BA53FEDF601F7EAFBC88DAC5E7440FF491EBC54066ECDB61A2B2D1EC',
          signer_lists: [
            {
              Flags: 0,
              LedgerEntryType: 'SignerList',
              OwnerNode: '0000000000000000',
              PreviousTxnID: '0E9BF2DBAA36539FA4CDB3FF8ABF5DC9A43859C33953385C9486AD63E451B2FC',
              PreviousTxnLgrSeq: 396943,
              SignerEntries: [
                {
                  SignerEntry: {
                    Account: 'raSYaBTfbeARRdacGBbs5tjA7XkyB1RC8x',
                    SignerWeight: 1,
                  },
                },
                {
                  SignerEntry: {
                    Account: 'rGevN87RpWBbdLxKCF4FAqWgRoSyMJA81f',
                    SignerWeight: 1,
                  },
                },
                {
                  SignerEntry: {
                    Account: 'rGmQHwvb5SZRbyhp4JBHdpRzSmgqADxPbE',
                    SignerWeight: 1,
                  },
                },
              ],
              SignerListID: 0,
              SignerQuorum: 2,
              index: 'A36A7ED6108FF7F871C0EC3CF573FE23CC9780436D64A2EE069A8F27E8D40471',
            },
          ],
        },
        ledger_current_index: 397138,
        queue_data: {
          txn_count: 0,
        },
        status: 'success',
        validated: false,
      },
    })
    .post('/', { method: 'fee' })
    .reply(200, {
      result: {
        current_ledger_size: '0',
        current_queue_size: '0',
        drops: {
          base_fee: '10',
          median_fee: '5000',
          minimum_fee: '10',
          open_ledger_fee: '10',
        },
        expected_ledger_size: '51',
        ledger_current_index: 397138,
        levels: {
          median_level: '128000',
          minimum_level: '256',
          open_ledger_level: '256',
          reference_level: '256',
        },
        max_queue_size: '1020',
        status: 'success',
      },
    })
    .post('/', { method: 'server_info' })
    .reply(200, {
      result: {
        info: {
          build_version: '0.70.1',
          complete_ledgers: '386967-397137',
          hostid: 'HI',
          io_latency_ms: 1,
          last_close: {
            converge_time_s: 1.999,
            proposers: 4,
          },
          load_factor: 1,
          peers: 4,
          pubkey_node: 'n9KMmZw85d5erkaTv62Vz6SbDJSyeihAEB3jwnb3Bqnr2AydRVep',
          server_state: 'proposing',
          state_accounting: {
            connected: {
              duration_us: '4999941',
              transitions: 1,
            },
            disconnected: {
              duration_us: '1202712',
              transitions: 1,
            },
            full: {
              duration_us: '94064175867',
              transitions: 1,
            },
            syncing: {
              duration_us: '6116096',
              transitions: 1,
            },
            tracking: {
              duration_us: '3',
              transitions: 1,
            },
          },
          uptime: 94077,
          validated_ledger: {
            age: 3,
            base_fee_xrp: 0.00001,
            hash: '918D326D224F8F49B07B02CD0A2207B7239BBFA824CF512F8D1D9DBCADC115E5',
            reserve_base_xrp: 20,
            reserve_inc_xrp: 5,
            seq: 397137,
          },
          validation_quorum: 4,
        },
        status: 'success',
      },
    });
};

const nockEthData: any[] = [
  {
    params: {
      module: 'account',
      action: 'txlist',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    },
    response: {
      status: '0',
      message: 'No transactions found',
      result: [],
    },
  },
  {
    params: {
      module: 'account',
      action: 'balance',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '100000000000000000',
    },
  },
  {
    params: {
      module: 'account',
      action: 'balance',
      address: '0x5df5a96b478bb1808140d87072143e60262e8670',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '2200000000000000000',
    },
  },
  {
    params: {
      module: 'account',
      action: 'txlist',
      address: '0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6',
    },
    response: {
      status: '0',
      message: 'No transactions found',
      result: [],
    },
  },
  {
    params: {
      module: 'account',
      action: 'balance',
      address: '0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '0',
    },
  },
  {
    params: {
      module: 'account',
      action: 'txlist',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    },
    response: {
      status: '0',
      message: 'No transactions found',
      result: [],
    },
  },
  {
    params: {
      module: 'account',
      action: 'balance',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '100000000000000000',
    },
  },
  {
    params: {
      module: 'account',
      action: 'balance',
      address: '0x5df5a96b478bb1808140d87072143e60262e8670',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '2200000000000000000',
    },
  },
  {
    params: {
      module: 'proxy',
      action: 'eth_call',
      to: '0x5df5a96b478bb1808140d87072143e60262e8670',
      data: 'a0b7967b',
      tag: 'latest',
    },
    response: {
      jsonrpc: '2.0',
      result: '0x0000000000000000000000000000000000000000000000000000000000000001',
      id: 1,
    },
  },
  {
    params: {
      module: 'account',
      action: 'balance',
      address: '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '20000000000000000',
    },
  },
  {
    params: {
      module: 'account',
      action: 'txlist',
      address: '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91',
    },
    response: {
      status: '1',
      message: 'OK',
      result: [
        {
          blockNumber: '26745364',
          timeStamp: '1628778676',
          hash: '0x41d589b7b12abfad4975f42e62d3b96de1eb9ca477f62b4d5a49b140c3fb6a21',
          nonce: '4',
          blockHash: '0x908c07cc1425e90a0d58e5cc1b109510e14097e04aae741f8de874bfd0f7d87b',
          transactionIndex: '2',
          from: '0x1ce43f2185de5734d3004dd0283f58eaec787e4a',
          to: '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91',
          value: '20000000000000000',
          gas: '21000',
          gasPrice: '1000000000',
          isError: '0',
          txreceipt_status: '1',
          input: '0x',
          contractAddress: '',
          cumulativeGasUsed: '357536',
          gasUsed: '21000',
          confirmations: '959',
        },
      ],
    },
  },
  {
    params: {
      module: 'account',
      action: 'txlist',
      address: '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91',
    },
    response: {
      status: '1',
      message: 'OK',
      result: [
        {
          blockNumber: '26745364',
          timeStamp: '1628778676',
          hash: '0x41d589b7b12abfad4975f42e62d3b96de1eb9ca477f62b4d5a49b140c3fb6a21',
          nonce: '4',
          blockHash: '0x908c07cc1425e90a0d58e5cc1b109510e14097e04aae741f8de874bfd0f7d87b',
          transactionIndex: '2',
          from: '0x1ce43f2185de5734d3004dd0283f58eaec787e4a',
          to: '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91',
          value: '20000000000000000',
          gas: '21000',
          gasPrice: '1000000000',
          isError: '0',
          txreceipt_status: '1',
          input: '0x',
          contractAddress: '',
          cumulativeGasUsed: '357536',
          gasUsed: '21000',
          confirmations: '959',
        },
      ],
    },
  },
  {
    params: {
      module: 'account',
      action: 'tokenbalance',
      contractaddress: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
      address: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
      tag: 'latest',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '1000000000000000000',
    },
  },
  {
    params: {
      module: 'proxy',
      action: 'eth_call',
      to: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
      data: 'a0b7967b',
      tag: 'latest',
    },
    response: {
      jsonrpc: '2.0',
      result: '0x0000000000000000000000000000000000000000000000000000000000002a7f',
      id: 1,
    },
  },
  {
    params: {
      module: 'account',
      action: 'balance',
      address: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
    },
    response: {
      status: '1',
      message: 'OK',
      result: '9999999999999999928',
    },
  },
];

export const nockEthRecovery = function (bitgo, nockData = nockEthData) {
  let apiKey;
  if (Environments[bitgo.getEnv()].etherscanApiToken) {
    apiKey = Environments[bitgo.getEnv()].etherscanApiToken;
  }

  nockData.forEach((data) => {
    if (apiKey) {
      data.params.apiKey = apiKey;
    }
    nock('https://api-goerli.etherscan.io').get('/api').query(data.params).reply(200, data.response);
  });
};

export const nockEtherscanRateLimitError = function () {
  const response = {
    status: '0',
    message: 'NOTOK',
    result: 'Max rate limit reached, rate limit of 3/1sec applied"',
  };

  const params = {
    module: 'account',
    action: 'txlist',
    address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
  };

  nock('https://api-goerli.etherscan.io').get('/api').query(params).reply(200, response);
};

export const nockXlmRecovery = function () {
  nock('https://horizon-testnet.stellar.org')
    .get('/accounts/GAGCQLUGMX76XC24JRCRJWOHXK23ONURH4433JOEPU6CH7Z44CCYUCEL')
    .reply(404, {
      status: 404,
    })
    .get('/accounts/GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ')
    .reply(200, {
      balance: '10',
    })
    .get('/accounts/GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB')
    .reply(200, {
      id: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
      paging_token: '',
      account_id: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
      sequence: '47339455954026497',
      subentry_count: 3,
      thresholds: {
        low_threshold: 1,
        med_threshold: 2,
        high_threshold: 3,
      },
      flags: {
        auth_required: false,
        auth_revocable: false,
      },
      balances: [
        {
          balance: '9.9999600',
          buying_liabilities: '0.0000000',
          selling_liabilities: '0.0000000',
          asset_type: 'native',
        },
      ],
      signers: [
        {
          public_key: 'GBNK4FJO6FDQNBVLUP7MICEJUVINPNJZCDDTTYS3LVFC6J7LKEXLOBKM',
          weight: 1,
          key: 'GBNK4FJO6FDQNBVLUP7MICEJUVINPNJZCDDTTYS3LVFC6J7LKEXLOBKM',
          type: 'ed25519_public_key',
        },
        {
          public_key: 'GCBABJPE3UTZ3JPUEIZEXAQQ5CMNX5UPYKOB7HHXSHBCIGD7VV64H6KU',
          weight: 1,
          key: 'GCBABJPE3UTZ3JPUEIZEXAQQ5CMNX5UPYKOB7HHXSHBCIGD7VV64H6KU',
          type: 'ed25519_public_key',
        },
        {
          public_key: 'GBSKZM7HG4S2W4N4H65XHTGS724HQA7EFMSSCVLPWW53ZFL6SNVFJKJO',
          weight: 1,
          key: 'GBSKZM7HG4S2W4N4H65XHTGS724HQA7EFMSSCVLPWW53ZFL6SNVFJKJO',
          type: 'ed25519_public_key',
        },
        {
          public_key: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
          weight: 0,
          key: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
          type: 'ed25519_public_key',
        },
      ],
      data: {},
    })
    .get('/ledgers')
    .query(true)
    .times(2)
    .reply(200, {
      _links: {
        self: {
          href: 'https://horizon-testnet.stellar.org/ledgers?c=0.37643100613718006&cursor=&limit=1&order=desc',
        },
        next: {
          href: 'https://horizon-testnet.stellar.org/ledgers?c=0.37643100613718006&cursor=48419653113872384&limit=1&order=desc',
        },
        prev: {
          href: 'https://horizon-testnet.stellar.org/ledgers?c=0.37643100613718006&cursor=48419653113872384&limit=1&order=asc',
        },
      },
      _embedded: {
        records: [
          {
            _links: {
              self: {
                href: 'https://horizon-testnet.stellar.org/ledgers/11273579',
              },
              transactions: {
                href: 'https://horizon-testnet.stellar.org/ledgers/11273579/transactions{?cursor,limit,order}',
                templated: true,
              },
              operations: {
                href: 'https://horizon-testnet.stellar.org/ledgers/11273579/operations{?cursor,limit,order}',
                templated: true,
              },
              payments: {
                href: 'https://horizon-testnet.stellar.org/ledgers/11273579/payments{?cursor,limit,order}',
                templated: true,
              },
              effects: {
                href: 'https://horizon-testnet.stellar.org/ledgers/11273579/effects{?cursor,limit,order}',
                templated: true,
              },
            },
            id: '5fab170a47afa15cc130790f8c3bcb846fa295b1fa51139437c4d120878e850f',
            paging_token: '48419653113872384',
            hash: '5fab170a47afa15cc130790f8c3bcb846fa295b1fa51139437c4d120878e850f',
            prev_hash: '5efe6f32662af8ab2d8a5f8984c027ad330f181bf5b9e3812d5a08f62e2cb978',
            sequence: 11273579,
            transaction_count: 0,
            operation_count: 0,
            closed_at: '2018-09-27T22:13:35Z',
            total_coins: '104284715255.7420028',
            fee_pool: '1708880873.6769687',
            base_fee_in_stroops: 100,
            base_reserve_in_stroops: 5000000,
            max_tx_set_size: 50,
            protocol_version: 10,
            header_xdr:
              'AAAACl7+bzJmKvirLYpfiYTAJ60zDxgb9bnjgS1aCPYuLLl4NB4MFpS0jQk8X3Ut93c2Q7cYEEWnhZ3tteMhZnztSM8AAAAAW61WDwAAAAAAAAAALzWviJxVDV+wrzVnS4YoI8xI050aKnAfney+tZxfcY2aFysDFVMF16cqgZjw8yiyzyfc1u0eqpLtLrZyYEam/ACsBWsOeO/1wzZt/AA8ti5WY8aXAAAA3QAAAAAAC4SRAAAAZABMS0AAAAAyuglBsLFyGmBOqJ250fDa76bY5/c1v9TBQl0ALhzx2G6vXcdZSm8aoCBPWHZBrK7GfpHa4DbiDqIav4yzjanIUSJ9CWKlXQXHWff9yKUlpaVJJy4TcELJV3w0nlwaNbRzLf+JwGVYb6BnB2GiZESvf1yEibvlU21ZVeEBsccbkg4AAAAA',
          },
        ],
      },
    });
};

export const nockTronRecovery = function () {
  // full node - sendTrx from tronweb, build transaction call
  nock('http://47.252.81.135:8090')
    .post('/wallet/createtransaction')
    .reply(200, {
      visible: false,
      txID: '55d76a068b97933a98e5d02e6fecd4c2971f1d37f0bb850a919b17def906a239',
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                amount: 899000000,
                owner_address: '414d0941161d0f7e1da0c8989b1566c9d9b43e1226',
                to_address: '41f3a3d6d514e7d43fbbf632a687acd65aafb8a50c',
              },
              type_url: 'type.googleapis.com/protocol.TransferContract',
            },
            type: 'TransferContract',
          },
        ],
        ref_block_bytes: '3ffb',
        ref_block_hash: 'c1647593403d263b',
        expiration: 1574098803000,
        timestamp: 1574098744605,
      },
      raw_data_hex:
        '0a023ffb2208c1647593403d263b40b8b2e6fce72d5a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a15414d0941161d0f7e1da0c8989b1566c9d9b43e1226121541f3a3d6d514e7d43fbbf632a687acd65aafb8a50c18c0cdd6ac03709deae2fce72d',
    });

  // solidity node - retrieve account information call
  nock('http://47.252.81.135:8091')
    // this address is equal to TGzY7ps8orxQ24yY2YyoJertyrjdWUEU4E
    .post(`/walletsolidity/getaccount`)
    .reply(200, {
      address: '414d0941161d0f7e1da0c8989b1566c9d9b43e1226',
      balance: 900000000,
      create_time: 1573831677000,
      latest_opration_time: 1573831692000,
      free_net_usage: 431,
      latest_consume_free_time: 1573831692000,
      account_resource: {},
      owner_permission: {
        permission_name: 'owner',
        threshold: 2,
        keys: [
          { address: '414d0941161d0f7e1da0c8989b1566c9d9b43e1226', weight: 1 },
          { address: '41ea340b1c5806fa6fa45d7d4ec84ff84b6a5478bc', weight: 1 },
          { address: '41b93c8db3137395f68243611e79aceb158f4a51df', weight: 1 },
        ],
      },
      active_permission: [
        {
          type: 'Active',
          id: 2,
          permission_name: 'active0',
          threshold: 2,
          operations: '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
          keys: [
            { address: '414d0941161d0f7e1da0c8989b1566c9d9b43e1226', weight: 1 },
            { address: '41ea340b1c5806fa6fa45d7d4ec84ff84b6a5478bc', weight: 1 },
            { address: '41b93c8db3137395f68243611e79aceb158f4a51df', weight: 1 },
          ],
        },
      ],
    });
};

export const nockEosRecovery = function () {
  nock('https://jungle3.cryptolions.io:443').post('*').reply(502);
  nock('https://jungle3.eosdac.io:443')
    .post('/v1/chain/get_info')
    .reply(200, {
      server_version: '14185431',
      chain_id: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
      head_block_num: 39752030,
      last_irreversible_block_num: 39751705,
      last_irreversible_block_id: '025e90194fbe7ba5773af4b3ed099aaed0fb26b8f7750e414ea0ee975a04cdc1',
      head_block_id: '025e915eff653f4ad408e1b36e40f6b4d842afde81672446f91ca1e615ebf03c',
      head_block_time: '2019-07-18T17:52:49.000',
      head_block_producer: 'eosnationftw',
      virtual_block_cpu_limit: 200000000,
      virtual_block_net_limit: 524288000,
      block_cpu_limit: 199900,
      block_net_limit: 524288,
      server_version_string: 'v1.8.1',
      fork_db_head_block_num: 39752030,
      fork_db_head_block_id: '025e915eff653f4ad408e1b36e40f6b4d842afde81672446f91ca1e615ebf03c',
    })
    .post('/v1/chain/get_block', { block_num_or_id: 39752030 })
    .reply(200, {
      timestamp: '2019-07-18T17:52:49.000',
      producer: 'eosnationftw',
      confirmed: 0,
      previous: '025e915dcf7ce855a5818f17c78f3bedc16bfa505aa8d27b26860fe875112e5e',
      transaction_mroot: '0000000000000000000000000000000000000000000000000000000000000000',
      action_mroot: 'd71fc942fb9fcd337692f037d3fb967d76ddd2b30bae40450d1feef50f56ceec',
      schedule_version: 245,
      new_producers: null,
      header_extensions: [],
      producer_signature:
        'SIG_K1_JwDWGq1SxPHw5xTwUzZ1Hf4YCdvzsYvAoh9nNvGXjyXjk57pLb5fc8in3vop9h1mMdZtsRhEYa4bV9P4fMvHXcqiFjw83y',
      transactions: [],
      block_extensions: [],
      id: '025e915eff653f4ad408e1b36e40f6b4d842afde81672446f91ca1e615ebf03c',
      block_num: 39752030,
      ref_block_prefix: 3017869524,
    })
    .post('/v1/chain/get_account', { account_name: 'jzjkpn1bjnti' })
    .reply(200, {
      account_name: 'jzjkpn1bjnti',
      head_block_num: 39739576,
      head_block_time: '2019-07-18T16:08:34.500',
      privileged: false,
      last_code_update: '1970-01-01T00:00:00.000',
      created: '2019-07-18T12:52:10.000',
      core_liquid_balance: '99.0000 EOS',
      ram_quota: 9586,
      net_weight: 0,
      cpu_weight: 0,
      net_limit: {
        used: 161,
        available: 0,
        max: 0,
      },
      cpu_limit: {
        used: 419,
        available: 0,
        max: 0,
      },
      ram_usage: 3324,
      permissions: [
        {
          perm_name: 'active',
          parent: 'owner',
          required_auth: {
            threshold: 2,
            keys: [
              {
                key: 'EOS5ecwm5UH1b2ggGJTq5r1aqd1cgKsi3NUYPJbLakana57E1anP2',
                weight: 1,
              },
              {
                key: 'EOS5oyoziJUH2u3KJu9fUFmahrkMC1x86hdBs5768tA9N3R7zENHx',
                weight: 1,
              },
              {
                key: 'EOS6dZzCHfSVGGjJ9VegMpu9utsNERqrmnwoEntQcgfCUyyuciQm9',
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
                key: 'EOS5ecwm5UH1b2ggGJTq5r1aqd1cgKsi3NUYPJbLakana57E1anP2',
                weight: 1,
              },
              {
                key: 'EOS5oyoziJUH2u3KJu9fUFmahrkMC1x86hdBs5768tA9N3R7zENHx',
                weight: 1,
              },
              {
                key: 'EOS6dZzCHfSVGGjJ9VegMpu9utsNERqrmnwoEntQcgfCUyyuciQm9',
                weight: 1,
              },
            ],
            accounts: [],
            waits: [],
          },
        },
      ],
      total_resources: {
        owner: 'jzjkpn1bjnti',
        net_weight: '0.0000 EOS',
        cpu_weight: '0.0000 EOS',
        ram_bytes: 8186,
      },
      self_delegated_bandwidth: null,
      refund_request: null,
      voter_info: null,
    })
    .post('/v1/chain/get_account', { account_name: 'kiyjcn1ixftp' })
    .reply(200, {
      account_name: 'kiyjcn1ixftp',
      head_block_num: 39739505,
      head_block_time: '2019-07-18T16:07:59.000',
      privileged: false,
      last_code_update: '1970-01-01T00:00:00.000',
      created: '2019-07-18T15:57:05.500',
      core_liquid_balance: '100.0000 EOS',
      ram_quota: 9587,
      net_weight: 0,
      cpu_weight: 0,
      net_limit: {
        used: 0,
        available: 0,
        max: 0,
      },
      cpu_limit: {
        used: 0,
        available: 0,
        max: 0,
      },
      ram_usage: 3196,
      permissions: [
        {
          perm_name: 'active',
          parent: 'owner',
          required_auth: {
            threshold: 2,
            keys: [
              {
                key: 'EOS5sxRZCyaKAowNZBVrAvUHYQioMXf8Qru7XADoJwr53iFDJPsGC',
                weight: 1,
              },
              {
                key: 'EOS64hsH9DiP1eSQuYKEaFD5SQp4cLRPvTYaCUvV2AfcWBVy7CjjN',
                weight: 1,
              },
              {
                key: 'EOS741DEx6Gstbi2cdmQyjGrBi8rndGeSBw7hM5uYiKft2ptmKRgd',
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
                key: 'EOS5sxRZCyaKAowNZBVrAvUHYQioMXf8Qru7XADoJwr53iFDJPsGC',
                weight: 1,
              },
              {
                key: 'EOS64hsH9DiP1eSQuYKEaFD5SQp4cLRPvTYaCUvV2AfcWBVy7CjjN',
                weight: 1,
              },
              {
                key: 'EOS741DEx6Gstbi2cdmQyjGrBi8rndGeSBw7hM5uYiKft2ptmKRgd',
                weight: 1,
              },
            ],
            accounts: [],
            waits: [],
          },
        },
      ],
      total_resources: {
        owner: 'kiyjcn1ixftp',
        net_weight: '0.0000 EOS',
        cpu_weight: '0.0000 EOS',
        ram_bytes: 8187,
      },
      self_delegated_bandwidth: null,
      refund_request: null,
      voter_info: null,
    });
};
