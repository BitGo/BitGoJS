const nock = require('nock');
nock.enableNetConnect();

module.exports.nockBtcRecovery = function nockBtcRecovery() {
  nock('https://testnet-api.smartbit.com.au/v1/blockchain')
  .get('/address/2MztRFcJWkDTYsZmNjLu9pBWWviJmWjJ4hg')
  .reply(200, {
    success: true,
    address: {
      address: '2MztRFcJWkDTYsZmNjLu9pBWWviJmWjJ4hg',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2NFNu2LUvV98d5rkKobkt1JwtFe8eKpePxj')
  .reply(200, {
    success: true,
    address: {
      address: '2NFNu2LUvV98d5rkKobkt1JwtFe8eKpePxj',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw')
  .reply(200, {
    success: true,
    address: {
      address: '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw',
      total: {
        received: '0.08125000',
        received_int: 8125000,
        spent: '0.00000000',
        spent_int: 0,
        balance: '0.08125000',
        balance_int: 8125000,
        input_count: 1,
        output_count: 0,
        transaction_count: 1
      },
      confirmed: {
        received: '0.08125000',
        received_int: 8125000,
        spent: '0.00000000',
        spent_int: 0,
        balance: '0.08125000',
        balance_int: 8125000,
        input_count: 1,
        output_count: 0,
        transaction_count: 1
      },
      unconfirmed: {
        received: '0.00000000',
        received_int: 0,
        spent: '0.00000000',
        spent_int: 0,
        balance: '0.00000000',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0.00000000',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0.00000000',
          balance_int: 0
        }
      },
      transaction_paging: {
        valid_sort: [
          'txindex'
        ],
        limit: 10,
        sort: 'txindex',
        dir: 'desc',
        prev: null,
        next: null,
        prev_link: null,
        next_link: null
      },
      transactions: [
        {
          txid: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
          hash: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
          block: 1128383,
          confirmations: 160161,
          version: '1',
          locktime: 0,
          time: 1497309463,
          first_seen: 1497308500,
          propagation: null,
          double_spend: false,
          size: 224,
          vsize: 224,
          input_amount: '0.64999713',
          input_amount_int: 64999713,
          output_amount: '0.64899713',
          output_amount_int: 64899713,
          fee: '0.00100000',
          fee_int: 100000,
          fee_size: '446.42857143',
          coinbase: false,
          input_count: 1,
          inputs: [
            {
              addresses: [
                'mwCwTceJvYV27KXBc3NJZys6CjsgsoeHmf'
              ],
              value: '0.64999713',
              value_int: 64999713,
              txid: '43bf039b4d1c069974a3f5573931c41dca5615446e8646e3e0aa1a17e586d005',
              vout: 0,
              script_sig: {
                asm: '3045022100d7ee6bec2f134460ef70b21b6268dd2969b2e0166631cd222fd68aa48adc3798022026c832e2fdc9f9059d467d4b9d3a1516db88c8c688a1f187a147151873530ff001 02ee0cc469cd72f5462e1d407b5eb4ecfba503074b61246fe84f35161be51f8c68',
                hex: '483045022100d7ee6bec2f134460ef70b21b6268dd2969b2e0166631cd222fd68aa48adc3798022026c832e2fdc9f9059d467d4b9d3a1516db88c8c688a1f187a147151873530ff0012102ee0cc469cd72f5462e1d407b5eb4ecfba503074b61246fe84f35161be51f8c68'
              },
              type: 'pubkeyhash',
              witness: null,
              sequence: 4294967295
            }
          ],
          output_count: 2,
          outputs: [
            {
              addresses: [
                '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw'
              ],
              value: '0.08125000',
              value_int: 8125000,
              n: 0,
              script_pub_key: {
                asm: 'OP_HASH160 4db7dbb57102a2e13e4474dbe38058431012e745 OP_EQUAL',
                hex: 'a9144db7dbb57102a2e13e4474dbe38058431012e74587'
              },
              req_sigs: 1,
              type: 'scripthash',
              spend_txid: null
            },
            {
              addresses: [
                'mzBnxFSRcZ9dsNU6UaM4Ng4mtu2btJjajc'
              ],
              value: '0.56774713',
              value_int: 56774713,
              n: 1,
              script_pub_key: {
                asm: 'OP_DUP OP_HASH160 cccab052f1611749f3025466415edea09a03bebe OP_EQUALVERIFY OP_CHECKSIG',
                hex: '76a914cccab052f1611749f3025466415edea09a03bebe88ac'
              },
              req_sigs: 1,
              type: 'pubkeyhash',
              spend_txid: 'ca157ac8b6572382c78d67f8fcd97b25798543ed683a36daaa65ce2413aa5e3d'
            }
          ],
          tx_index: 14334329,
          block_index: 5
        }
      ]
    }
  })
  .get('/address/2NAY4N8bBCthmYDHKBab6gMnS2LwpbxdF2z')
  .reply(200, {
    success: true,
    address: {
      address: '2NAY4N8bBCthmYDHKBab6gMnS2LwpbxdF2z',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2MsPSUv8yxy9SwFKWfaTSAGKwaGCBBbMuZA')
  .reply(200, {
    success: true,
    address: {
      address: '2MsPSUv8yxy9SwFKWfaTSAGKwaGCBBbMuZA',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2N5txkg9k3pHe6zyyKV2dwztKdDPGdJdPch')
  .reply(200, {
    success: true,
    address: {
      address: '2N5txkg9k3pHe6zyyKV2dwztKdDPGdJdPch',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2MzU1ze7cKUFPoQgNnsAmn4Vj7GGrN8HPCC')
  .reply(200, {
    success: true,
    address: {
      address: '2MzU1ze7cKUFPoQgNnsAmn4Vj7GGrN8HPCC',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2N3AYt6Bzqne1jagNi6Lnu42PVPshtgVQ9P')
  .reply(200, {
    success: true,
    address: {
      address: '2N3AYt6Bzqne1jagNi6Lnu42PVPshtgVQ9P',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2NB8Z1xr86m3sePYdFfJudNrrA8rKNkPEKr')
  .reply(200, {
    success: true,
    address: {
      address: '2NB8Z1xr86m3sePYdFfJudNrrA8rKNkPEKr',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2N8pyHtgmrGrvndjteyDDrjQ2ogvUb6bqDT')
  .reply(200, {
    success: true,
    address: {
      address: '2N8pyHtgmrGrvndjteyDDrjQ2ogvUb6bqDT',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2MtruqBf39BiueH1pN34rk7Ti7FGxnKmu7X')
  .reply(200, {
    success: true,
    address: {
      address: '2MtruqBf39BiueH1pN34rk7Ti7FGxnKmu7X',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2N4F1557TjZVN15AxPRb6CbaX7quyh5n1ym')
  .reply(200, {
    success: true,
    address: {
      address: '2N4F1557TjZVN15AxPRb6CbaX7quyh5n1ym',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2NB54XtZQcVBhQSCgVV8AqjiobXGbNDLkba')
  .reply(200, {
    success: true,
    address: {
      address: '2NB54XtZQcVBhQSCgVV8AqjiobXGbNDLkba',
      total: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      confirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      unconfirmed: {
        received: '0',
        received_int: 0,
        spent: '0',
        spent_int: 0,
        balance: '0',
        balance_int: 0,
        input_count: 0,
        output_count: 0,
        transaction_count: 0
      },
      multisig: {
        confirmed: {
          balance: '0',
          balance_int: 0
        },
        unconfirmed: {
          balance: '0',
          balance_int: 0
        }
      }
    }
  })
  .get('/address/2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw/unspent')
  .reply(200, {
    success: true,
    paging: {
      valid_sort: [
        'id'
      ],
      limit: 10,
      sort: 'id',
      dir: 'desc',
      prev: null,
      next: null,
      prev_link: null,
      next_link: null
    },
    unspent: [
      {
        addresses: [
          '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw'
        ],
        value: '0.08125000',
        value_int: 8125000,
        txid: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 4db7dbb57102a2e13e4474dbe38058431012e745 OP_EQUAL',
          hex: 'a9144db7dbb57102a2e13e4474dbe38058431012e74587'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 160162,
        id: 57760457
      }
    ]
  })
  .post('/decodetx', { hex: '010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fdfd000048304502210091687819c7543a17d84768bca0019278c64ccc67e1c2a665422c091eb70bade902206be55b4ec25f80d433ea26ef7caa35b7b77791954f26b35e48f3535b0c4189a901473044022070328e7c3541f3acd83a0600834fcb0e0e566c93826434bd378c5913f09cb11c02201f33817cf92354dc5bc40a55a5070688949cfca93cd77860a7549a36acace2d3014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff0100ed7b000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000' })
  .reply(200, {
    success: true,
    transaction: {
      Version: '1',
      LockTime: '0',
      Vin: [
        {
          TxId: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
          Vout: '0',
          ScriptSig: {
            Asm: '0 304502210091687819c7543a17d84768bca0019278c64ccc67e1c2a665422c091eb70bade902206be55b4ec25f80d433ea26ef7caa35b7b77791954f26b35e48f3535b0c4189a9[ALL] 3044022070328e7c3541f3acd83a0600834fcb0e0e566c93826434bd378c5913f09cb11c02201f33817cf92354dc5bc40a55a5070688949cfca93cd77860a7549a36acace2d3[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
            Hex: '0048304502210091687819c7543a17d84768bca0019278c64ccc67e1c2a665422c091eb70bade902206be55b4ec25f80d433ea26ef7caa35b7b77791954f26b35e48f3535b0c4189a901473044022070328e7c3541f3acd83a0600834fcb0e0e566c93826434bd378c5913f09cb11c02201f33817cf92354dc5bc40a55a5070688949cfca93cd77860a7549a36acace2d3014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae'
          },
          CoinBase: null,
          TxInWitness: null,
          Sequence: '4294967295'
        }
      ],
      Vout: [
        {
          Value: 0.081216,
          N: 0,
          ScriptPubKey: {
            Asm: 'OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL',
            Hex: 'a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787',
            ReqSigs: 1,
            Type: 'scripthash',
            Addresses: [
              '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw'
            ]
          }
        }
      ],
      TxId: '6a441c7263a1596b68434f4cd7c0dd209308391b23f7f21f37d7e154bb2239d1'
    }
  });
};

module.exports.nockBchRecovery = function nockBchRecovery() {
  nock('https://test-bch-insight.bitpay.com/api')
  .get('/addr/2NEXK4AjYnUCkdUDJQgbbEGGks5pjkfhcRN')
  .reply(200, {
    addrStr: 'pr5ktpkt6verkhadrkw2sddk9lkqmcj4eyqp4uacsj',
    balance: 0,
    balanceSat: 0,
    totalReceived: 13,
    totalReceivedSat: 1300000000,
    totalSent: 13,
    totalSentSat: 1300000000,
    unconfirmedBalance: -13,
    unconfirmedBalanceSat: -1300000000,
    unconfirmedTxApperances: 0,
    txApperances: 1,
    transactions: [
      'dfa6e8fb31dcbcb4adb36ed247ceb37d32f44335f662b0bb41372a9e9419335a',
      '6b7e8df8e4d15fa210bb0551646f227888ad63e57e027c7ab360fc3413104cc0'
    ]
  })
  .get('/addr/2NBPjxjd2N7kjRNjfBfh7w1s7w5ZymVhkcr')
  .reply(200, {
    addrStr: 'prrsa89uaggdltcmkkemtqykjdsrjz385ggj894ynj',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2NFnu7v18D7wyJXUmtYMpFSmHFDkSLAZ1F3')
  .reply(200, {
    addrStr: 'prm4q57nfn9ne0n6xkefmcrg09yn3zgy4vuhfurlhx',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2MtWF8gbfSayRXd6MWuT56uyaFf6r4hdfQd')
  .reply(200, {
    addrStr: 'pqxu753reys4w2f7qu8h7h8egf02z4xpuuyu0d8pzk',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2MxVL1RiqsG53LgAdgGQHmCmhj38ENbJyPz')
  .reply(200, {
    addrStr: 'pqucx734eass2lx3pvnkal78565nkngvggwzj03lvf',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2NDDCZJvJY3F9d7S2xLknj3TeNihVDmACnA')
  .reply(200, {
    addrStr: 'prdsql2n3ws7ltmf7nwefw6d9x8kx4r38ca76cgrzr',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2NFwCuA4X6EGsRteak4smhVxDjT4eAszy3x')
  .reply(200, {
    addrStr: 'pruwyl6xd873mn8ke204zy5dzsx3w2dlsgrwxhtpvk',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT')
  .reply(200, {
    addrStr: 'ppcv48up7qv7r6epdmy5nn3x3hyf9cjec5aglzm6x4',
    balance: 11.9999439,
    balanceSat: 1199994390,
    totalReceived: 11.9999439,
    totalReceivedSat: 1199994390,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 11.9999439,
    unconfirmedBalanceSat: 1199994390,
    unconfirmedTxApperances: 1,
    txApperances: 1,
    transactions: [
      'dfa6e8fb31dcbcb4adb36ed247ceb37d32f44335f662b0bb41372a9e9419335a'
    ]
  })
  .get('/addr/2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT/utxo')
  .reply(200, [
    {
      address: 'ppcv48up7qv7r6epdmy5nn3x3hyf9cjec5aglzm6x4',
      txid: 'dfa6e8fb31dcbcb4adb36ed247ceb37d32f44335f662b0bb41372a9e9419335a',
      vout: 0,
      scriptPubKey: 'a91470ca9f81f019e1eb216ec949ce268dc892e259c587',
      amount: 11.9999439,
      satoshis: 1199994390,
      confirmations: 0
    }
  ])
  .get('/addr/2N2pAxcYMVDkx2Di3wUWjY38TH6YcpR25Wq')
  .reply(200, {
    addrStr: 'pp50g4y68mjs6s2w6ymjgujlkz88dcq0mcepzluwts',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2NCdDSWZvRRVQApYAf1FeyopozfWtLmdBTr')
  .reply(200, {
    addrStr: 'pr2fx9t3rfvse6sw9lrsvmmrsurz08wms50h204xtg',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2MuZJzi3CCnKhks9gFaBozD314y7mdBWhtN')
  .reply(200, {
    addrStr: 'pqv4h6e4qmaap8whgczs4gc98ky6evcwhudmxm0gec',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2NArEkKFAZYvGQYhDmSaEaqQLiSQkkisG9h')
  .reply(200, {
    addrStr: 'prq3j49gl7dwy90fgx9pt29ffea3nye7aufa7vved9',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  })
  .get('/addr/2N9grcQXvkZuUcH26RKRsuGewRkvXuKZeMz')
  .reply(200, {
    addrStr: 'pz6947ukfw0d5ufptll25h805334zfkhdc4agafj2y',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0
  });
};

module.exports.nockXrpRecovery = function nockXrpRecovery() {
  nock('https://s.altnet.rippletest.net:51234', { allowUnmocked: false })
  .post('/', {
    method: 'account_info',
    params: [{
      account: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
      strict: true,
      ledger_index: 'current',
      queue: true,
      signer_lists: true
    }]
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
                  SignerWeight: 1
                }
              },
              {
                SignerEntry: {
                  Account: 'rGevN87RpWBbdLxKCF4FAqWgRoSyMJA81f',
                  SignerWeight: 1
                }
              },
              {
                SignerEntry: {
                  Account: 'rGmQHwvb5SZRbyhp4JBHdpRzSmgqADxPbE',
                  SignerWeight: 1
                }
              }
            ],
            SignerListID: 0,
            SignerQuorum: 2,
            index: 'A36A7ED6108FF7F871C0EC3CF573FE23CC9780436D64A2EE069A8F27E8D40471'
          }
        ]
      },
      ledger_current_index: 397138,
      queue_data: {
        txn_count: 0
      },
      status: 'success',
      validated: false
    }
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
        open_ledger_fee: '10'
      },
      expected_ledger_size: '51',
      ledger_current_index: 397138,
      levels: {
        median_level: '128000',
        minimum_level: '256',
        open_ledger_level: '256',
        reference_level: '256'
      },
      max_queue_size: '1020',
      status: 'success'
    }
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
          proposers: 4
        },
        load_factor: 1,
        peers: 4,
        pubkey_node: 'n9KMmZw85d5erkaTv62Vz6SbDJSyeihAEB3jwnb3Bqnr2AydRVep',
        server_state: 'proposing',
        state_accounting: {
          connected: {
            duration_us: '4999941',
            transitions: 1
          },
          disconnected: {
            duration_us: '1202712',
            transitions: 1
          },
          full: {
            duration_us: '94064175867',
            transitions: 1
          },
          syncing: {
            duration_us: '6116096',
            transitions: 1
          },
          tracking: {
            duration_us: '3',
            transitions: 1
          }
        },
        uptime: 94077,
        validated_ledger: {
          age: 3,
          base_fee_xrp: 0.00001,
          hash: '918D326D224F8F49B07B02CD0A2207B7239BBFA824CF512F8D1D9DBCADC115E5',
          reserve_base_xrp: 20,
          reserve_inc_xrp: 5,
          seq: 397137
        },
        validation_quorum: 4
      },
      status: 'success'
    }
  });
};
