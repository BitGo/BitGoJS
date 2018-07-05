const nock = require('nock');
nock.enableNetConnect();

module.exports.nockBtcRecovery = function nockBtcRecovery() {
  nock('https://bitcoinfees.21.co')
  .get('/api/v1/fees/recommended')
  .reply(200, {
    fastestFee: 600,
    halfHourFee: 600,
    hourFee: 100
  });

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
  .post('/decodetx', { hex: '010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fb0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff0178757b000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000' })
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
            Asm: '0 304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9[ALL] 30440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
            Hex: '0046304302202f51d7ad8d2feea3194ab0238297fae860e87fe02b789858ce92fb374629faf0021f48011d587171984e95524c3ecdfe9bae8ebe4c8a282881b416da8f713751e9014730440220673b1a059e2d851059dd7f1b0501af4bf6d205c81249f49828e7ae987f4a90c5022047f73ff3d4e17ce6ebfe9565351796851d2a4472223acecd7ee00e2729824f38014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae'
          },
          CoinBase: null,
          TxInWitness: null,
          Sequence: '4294967295'
        }
      ],
      Vout: [
        {
          Value: 0.08091,
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
      TxId: 'a37acbc58d367b717909e69b25a95e06a4daf4e164825e555dd29797a92d7495'
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

module.exports.nockWrongChainRecoveries = function() {
  // Nock wallets
  nock('https://test.bitgo.com/api/v2')
  .get('/tltc/wallet/5abacebe28d72fbd07e0b8cbba0ff39e')
  .times(2)
  .reply(200, {
    id: '5abacebe28d72fbd07e0b8cbba0ff39e',
    users: [
      {
        user: '543c11ed356d00cb7600000b98794503',
        permissions: [
          'admin',
          'view',
          'spend'
        ]
      }
    ],
    coin: 'tltc',
    label: 'Test Wrong Chain Wallet',
    m: 2,
    n: 3,
    keys: [
      '5abaceb63cddfbb607d8306521ddf445',
      '5abaceb73cddfbb607d8306c50ee44c4',
      '5abaceb728d72fbd07e0b84f7b3e6f12'
    ],
    keySignatures: {},
    enterprise: '5578ebc76eb47487743b903166e6543a',
    tags: [
      '5abacebe28d72fbd07e0b8cbba0ff39e',
      '5578ebc76eb47487743b903166e6543a'
    ],
    disableTransactionNotifications: false,
    freeze: {},
    deleted: false,
    approvalsRequired: 1,
    isCold: false,
    coinSpecific: {},
    admin: {
      policy: {
        id: '5abacebe28d72fbd07e0b8cc4940ef7b',
        label: 'default',
        version: 0,
        date: '2018-03-27T23:07:42.077Z',
        rules: []
      }
    },
    clientFlags: [],
    allowBackupKeySigning: false,
    balance: 19955120,
    confirmedBalance: 19955120,
    spendableBalance: 19955120,
    balanceString: '19955120',
    confirmedBalanceString: '19955120',
    spendableBalanceString: '19955120',
    receiveAddress: {
      id: '5abacebe28d72fbd07e0b8cf3d571ba8',
      address: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
      chain: 0,
      index: 0,
      coin: 'tltc',
      wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
      coinSpecific: {
        redeemScript: '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae'
      }
    },
    pendingApprovals: []
  })
  .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf')
  .times(2)
  .reply(200, {
    id: '5abace103cddfbb607d8239d806671bf',
    users: [
      {
        user: '543c11ed356d00cb7600000b98794503',
        permissions: [
          'admin',
          'view',
          'spend'
        ]
      }
    ],
    coin: 'tbtc',
    label: 'Test Wrong Chain Wallet',
    m: 2,
    n: 3,
    keys: [
      '5abacdffae0ec7c107c7d9cf6d60a886',
      '5abacdffae0ec7c107c7d9d74f1d5bd2',
      '5abace00d73fd4bb076782d16681fe7e'
    ],
    keySignatures: {},
    enterprise: '5578ebc76eb47487743b903166e6543a',
    tags: [
      '5abace103cddfbb607d8239d806671bf',
      '5578ebc76eb47487743b903166e6543a'
    ],
    disableTransactionNotifications: false,
    freeze: {},
    deleted: false,
    approvalsRequired: 1,
    isCold: false,
    coinSpecific: {},
    admin: {
      policy: {
        id: '5abace103cddfbb607d8239e5c91e605',
        label: 'default',
        version: 0,
        date: '2018-03-27T23:04:48.905Z',
        rules: []
      }
    },
    clientFlags: [],
    allowBackupKeySigning: false,
    balance: 43998878,
    confirmedBalance: 43998878,
    spendableBalance: 43998878,
    balanceString: '43998878',
    confirmedBalanceString: '43998878',
    spendableBalanceString: '43998878',
    receiveAddress: {
      id: '5abace3c79f343cc0741e5b856b92a72',
      address: '2N31dEkgPtfcgf9A1q7GZhaY5dHdeLSdkNq',
      chain: 0,
      index: 1,
      coin: 'tbtc',
      wallet: '5abace103cddfbb607d8239d806671bf',
      coinSpecific: {
        redeemScript: '5221030c7fdefebab31e66961651a6b5391528b3bbaeb4252bc4a9bae788594c5c20b62103bc6ae4c5b81c5acdb40254725195ab52c3a1432896d10c35a277c10b737fe93321031483169ceebf3d10b1c707684b5a53308e3cfc1930cc6144d910f3aba8e769a153ae'
      }
    },
    pendingApprovals: []
  })
  .get('/tltc/wallet/5abacebe28d72fbd07e0b8cbba0ff39e/address/Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V')
  .times(2)
  .reply(200, {
    id: '5abacebe28d72fbd07e0b8cf3d571ba8',
    address: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
    chain: 0,
    index: 0,
    coin: 'tltc',
    wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
    coinSpecific: {
      redeemScript: '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae'
    },
    balance: {
      updated: '2018-03-27T23:33:10.713Z',
      numTx: 2,
      numUnspents: 0,
      totalReceived: 60000000,
      totalSent: 60000000
    }
  })
  .get('/tltc/wallet/5abacebe28d72fbd07e0b8cbba0ff39e/address/QjpwWvj3Y82e3WChS3pcGkRYEBbniifdpn')
  .times(2)
  .reply(404)
  .get('/tltc/wallet/5abacebe28d72fbd07e0b8cbba0ff39e/address/Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V')
  .times(2)
  .reply(200, {
    id: '5abacebe28d72fbd07e0b8cf3d571ba8',
    address: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
    chain: 0,
    index: 0,
    coin: 'tltc',
    wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
    coinSpecific: {
      redeemScript: '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae'
    },
    balance: {
      updated: '2018-03-27T23:33:10.713Z',
      numTx: 2,
      numUnspents: 0,
      totalReceived: 60000000,
      totalSent: 60000000
    }
  })
  .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2N9jq7k8cvFhuucVhhbb8BdWTeEjYxKmSfy')
  .reply(404)
  .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
  .reply(200, {
    id: '5abace113cddfbb607d823a192372c88',
    address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
    chain: 0,
    index: 0,
    coin: 'tbtc',
    wallet: '5abace103cddfbb607d8239d806671bf',
    coinSpecific: {
      redeemScript: '5221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153ae'
    },
    balance: {
      updated: '2018-03-27T23:29:42.799Z',
      numTx: 2,
      numUnspents: 0,
      totalReceived: 65000000,
      totalSent: 65000000
    }
  })
  .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
  .reply(200, {
    id: '5abace113cddfbb607d823a192372c88',
    address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
    chain: 0,
    index: 0,
    coin: 'tbtc',
    wallet: '5abace103cddfbb607d8239d806671bf',
    coinSpecific: {
      redeemScript: '5221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153ae'
    },
    balance: {
      updated: '2018-03-27T23:29:42.799Z',
      numTx: 2,
      numUnspents: 0,
      totalReceived: 65000000,
      totalSent: 65000000
    }
  })
  .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
  .reply(200, {
    id: '5abace113cddfbb607d823a192372c88',
    address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
    chain: 0,
    index: 0,
    coin: 'tbtc',
    wallet: '5abace103cddfbb607d8239d806671bf',
    coinSpecific: {
      redeemScript: '5221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153ae'
    },
    balance: {
      updated: '2018-03-27T23:29:42.799Z',
      numTx: 2,
      numUnspents: 0,
      totalReceived: 65000000,
      totalSent: 65000000
    }
  })
  .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2Mzoz5myftFMQLRGpTdfVv7LXuMpehEXXhF')
  .reply(404)
  .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
  .reply(200, {
    id: '5abace113cddfbb607d823a192372c88',
    address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
    chain: 0,
    index: 0,
    coin: 'tbtc',
    wallet: '5abace103cddfbb607d8239d806671bf',
    coinSpecific: {
      redeemScript: '5221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153ae'
    },
    balance: {
      updated: '2018-03-27T23:29:42.799Z',
      numTx: 2,
      numUnspents: 0,
      totalReceived: 65000000,
      totalSent: 65000000
    }
  })
  .get('/tltc/key/5abaceb63cddfbb607d8306521ddf445')
  .reply(200, {
    id: '5abaceb63cddfbb607d8306521ddf445',
    users: [
      '543c11ed356d00cb7600000b98794503'
    ],
    pub: 'xpub661MyMwAqRbcFkYsn3d9wuVNqYzC2zE45hHZUd2iZM3F5dygCMzxKGhCVB4pjmJ1sWynj1RHQi3iiVoUcrQu2bhzu6GWw9A8ZetxYMTPNdZ',
    ethAddress: '0x04d893e078feecbe10945c9e1b965132e48b2915',
    encryptedPrv: '{"iv":"JmWw8SBtiQ80KNGvjHvknA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"+V24Zb2ZpiE=","ct":"JUDBx3xDRuWnlV7LH7Wbt+eUixifofSYjA3kVNUZwRXh+7JIrBfQeCWCvvWopTJi7YgWaM+aLjbXB8mZrrE+14xmFw4evg34De4Omd7vnnbbk2uxe/r+bL7hL3tCz+b6uv9wd/tMQmLyu5PJuIrj5n8gv8SmNn4="}'
  })
  .get('/tbtc/key/5abacdffae0ec7c107c7d9cf6d60a886')
  .times(2)
  .reply(200, {
    id: '5abacdffae0ec7c107c7d9cf6d60a886',
    users: [
      '543c11ed356d00cb7600000b98794503'
    ],
    pub: 'xpub661MyMwAqRbcFSici6moqY283j2hzysM3gSUhBLgAk9r3jM21jw6Lwr3eyxmH6wTbd12KCjBQxmWT5AmVdW3aUvb5zrhYpgdCN7UDC7wYE6',
    ethAddress: '0xfa5f451f8fc1d7084ed40fcfdd414c092e3fbc31',
    encryptedPrv: '{"iv":"SqVdgeFwTzb10li5btyiPA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"yp6P1IYNtAs=","ct":"SHoCHIGD0WyYlieDkgyKTuoaV1VdXIu2rF+XhLAS8fPGWEpj2Lf6Jvjfv+KbUn5CK3OHmWxRB3yjJz8lP1sHgJz68xDh6KnNqEwx5cG8c32+oxN4eEoZZPRrDOq00AHRI6+AtWJgjxGofGfKHE3JEWCZY3C0sBQ="}'
  });

  // Nock explorer info
  nock('https://test.bitgo.com/api/v2')
  .get('/tbtc/public/tx/41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6')
  .times(2)
  .reply(200, {
    id: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6',
    normalizedTxHash: '41bc39a36242c76ec13593ec7641196fd9542a9047a8c1964da34f20c6c7ed3f',
    date: '2018-03-27T23:29:42.799Z',
    blockHash: '00000000f94f5c33275ce13a73624c2c0ad19291525154f9560e56e24570f2dc',
    blockHeight: 1289343,
    blockPosition: 45,
    confirmations: 16,
    fee: 1122,
    feeString: '1122',
    size: 370,
    inputIds: [
      'f6956b431c81108cb3050632540501de8a03501f65bf3b5414235c131005d7f6:0'
    ],
    inputs: [
      {
        id: 'f6956b431c81108cb3050632540501de8a03501f65bf3b5414235c131005d7f6:0',
        address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        value: 65000000,
        valueString: '65000000',
        redeemScript: '5221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153ae',
        isSegwit: false
      }
    ],
    outputs: [
      {
        id: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6:0',
        address: '2N7h1DEEkwvcm1yYiZWsUhwrrLVL4pKgjJx',
        value: 21000000,
        valueString: '21000000'
      },
      {
        id: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6:1',
        address: '2NGUBPuroX1yYuKSeownbC3z75o9xttcG1U',
        value: 43998878,
        valueString: '43998878'
      }
    ],
    entries: [
      {
        address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        inputs: 1,
        outputs: 0,
        value: -65000000,
        valueString: '-65000000'
      },
      {
        address: '2N7h1DEEkwvcm1yYiZWsUhwrrLVL4pKgjJx',
        inputs: 0,
        outputs: 1,
        value: 21000000,
        valueString: '21000000'
      },
      {
        address: '2NGUBPuroX1yYuKSeownbC3z75o9xttcG1U',
        inputs: 0,
        outputs: 1,
        value: 43998878,
        valueString: '43998878'
      }
    ]
  })
  .get('/tbtc/public/addressUnspents/2N7h1DEEkwvcm1yYiZWsUhwrrLVL4pKgjJx')
  .times(2)
  .reply(200, [
    {
      id: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6:0',
      address: '2N7h1DEEkwvcm1yYiZWsUhwrrLVL4pKgjJx',
      value: 21000000,
      valueString: '21000000',
      blockHeight: 1289343,
      date: '2018-03-27T23:29:42.799Z'
    }
  ])
  .get('/tltc/public/tx/fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39')
  .reply(200, {
    id: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39',
    normalizedTxHash: '1e3a0abd9bae70e9ca9021311076e6bbf7244dc0bc5ac8ac5ab6437cafa6a93a',
    date: '2018-03-27T23:33:10.713Z',
    blockHash: '2e809dc5157b4c1ab6a9ab2d2a291683209013097a31a31262d61b2d7140b9c3',
    blockHeight: 476097,
    blockPosition: 10,
    confirmations: 153,
    fee: 44880,
    feeString: '44880',
    size: 370,
    inputIds: [
      '78cd1b82384e106aaa8f4c10253211252d3db4807470e83c049db12a2637a967:1'
    ],
    inputs: [
      {
        id: '78cd1b82384e106aaa8f4c10253211252d3db4807470e83c049db12a2637a967:1',
        address: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
        value: 60000000,
        valueString: '60000000',
        redeemScript: '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae',
        isSegwit: false
      }
    ],
    outputs: [
      {
        id: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39:0',
        address: 'Qd6bEkzrwMm13oFkKhd9GKwtndBNvv958v',
        value: 19955120,
        valueString: '19955120'
      },
      {
        id: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39:1',
        address: 'QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP',
        value: 40000000,
        valueString: '40000000'
      }
    ],
    entries: [
      {
        address: 'Qd6bEkzrwMm13oFkKhd9GKwtndBNvv958v',
        inputs: 0,
        outputs: 1,
        value: 19955120,
        valueString: '19955120'
      },
      {
        address: 'QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP',
        inputs: 0,
        outputs: 1,
        value: 40000000,
        valueString: '40000000'
      },
      {
        address: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
        inputs: 1,
        outputs: 0,
        value: -60000000,
        valueString: '-60000000'
      }
    ]
  })
  .get('/tltc/public/addressUnspents/QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP')
  .reply(200, [
    {
      id: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39:1',
      address: 'QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP',
      value: 40000000,
      valueString: '40000000',
      blockHeight: 476097,
      date: '2018-03-27T23:33:10.713Z'
    }
  ])
  .get('/tbch/public/tx/94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26')
  .reply(200, {
    id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26',
    normalizedTxHash: '6346359162b9c42018b8e852e9e5a52ced224bf0c1d55393554472645e2c2dbe',
    date: '2018-03-27T23:34:33.819Z',
    blockHash: '0000000012798d16cefaa7f19b105afe2ea1d4007dd28ca233d65d913a15751c',
    blockHeight: 1222314,
    blockPosition: 4,
    confirmations: 15,
    fee: 5610,
    feeString: '5610',
    size: 370,
    inputIds: [
      '8f6ab338178e97d3e9a65cd12f4919e8354086cee3d0305ca97d9c96f60043de:0'
    ],
    inputs: [
      {
        id: '8f6ab338178e97d3e9a65cd12f4919e8354086cee3d0305ca97d9c96f60043de:0',
        address: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
        value: 1300000000,
        valueString: '1300000000',
        redeemScript: '52210388d574f35d3454b9ed0af9862bc83f9abb2c2c5bec298248f8da9b50fb0fe1d72103fbe5cf926752281de99adc5a42257ad9081178ab46b42a85b7ae76f15f75cf17210346f91ff493951e85008ae28665a1c272ef9e84bfeddca2014bc1cc821c39a87e53ae',
        isSegwit: false
      }
    ],
    outputs: [
      {
        id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:0',
        address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        value: 60000000,
        valueString: '60000000'
      },
      {
        id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:1',
        address: '2Mzoz5myftFMQLRGpTdfVv7LXuMpehEXXhF',
        value: 1239994390,
        valueString: '1239994390'
      }
    ],
    entries: [
      {
        address: '2Mzoz5myftFMQLRGpTdfVv7LXuMpehEXXhF',
        inputs: 0,
        outputs: 1,
        value: 1239994390,
        valueString: '1239994390'
      },
      {
        address: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
        inputs: 1,
        outputs: 0,
        value: -1300000000,
        valueString: '-1300000000'
      },
      {
        address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        inputs: 0,
        outputs: 1,
        value: 60000000,
        valueString: '60000000'
      }
    ]
  })
  .get('/tbch/public/addressUnspents/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
  .reply(200, [
    {
      id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:0',
      address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
      value: 60000000,
      valueString: '60000000',
      blockHeight: 1222314,
      date: '2018-03-27T23:34:33.819Z'
    }
  ]);
};

module.exports.nockEthRecovery = function() {
  nock('https://kovan.etherscan.io')
  .get('/api')
  .query({
    module: 'account',
    action: 'txlist',
    address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924'
  })
  .reply(200, {
    status: '0',
    message: 'No transactions found',
    result: []
  })
  .get('/api')
  .query({
    module: 'account',
    action: 'balance',
    address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924'
  })
  .reply(200, {
    status: '1',
    message: 'OK',
    result: '100000000000000000'
  })
  .get('/api')
  .query({
    module: 'account',
    action: 'balance',
    address: '0x5df5a96b478bb1808140d87072143e60262e8670'
  })
  .reply(200, {
    status: '1',
    message: 'OK',
    result: '2200000000000000000'
  })
  .get('/api')
  .query({
    module: 'account',
    action: 'txlist',
    address: '0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6'
  })
  .reply(200, {
    status: '0',
    message: 'No transactions found',
    result: []
  })
  .get('/api')
  .query({
    module: 'account',
    action: 'balance',
    address: '0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6'
  })
  .reply(200, {
    status: '1',
    message: 'OK',
    result: '0'
  })
  .get('/api')
  .query({
    module: 'account',
    action: 'txlist',
    address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924'
  })
  .reply(200, {
    status: '0',
    message: 'No transactions found',
    result: []
  })
  .get('/api')
  .query({
    module: 'account',
    action: 'balance',
    address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924'
  })
  .reply(200, {
    status: '1',
    message: 'OK',
    result: '100000000000000000'
  })
  .get('/api')
  .query({
    module: 'account',
    action: 'balance',
    address: '0x5df5a96b478bb1808140d87072143e60262e8670'
  })
  .reply(200, {
    status: '1',
    message: 'OK',
    result: '2200000000000000000'
  })
  .get('/api')
  .query({
    module: 'proxy',
    action: 'eth_call',
    to: '0x5df5a96b478bb1808140d87072143e60262e8670',
    data: 'a0b7967b',
    tag: 'latest'
  })
  .reply(200, {
    jsonrpc: '2.0',
    result: '0x0000000000000000000000000000000000000000000000000000000000000001',
    id: 1
  });
};

module.exports.nockLtcRecovery = function() {
  nock('http://explorer.litecointools.com/api')
  .get('/addr/QPuiounBxPyL6hsMAjtNtCtjF99uN1Nh6d')
  .reply(200, {
    addrStr: 'QPuiounBxPyL6hsMAjtNtCtjF99uN1Nh6d',
    balance: 0.3,
    balanceSat: 30000000,
    totalReceived: 0.3,
    totalReceivedSat: 30000000,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 1,
    transactions: [
      'bccfae3c1bdf23cfe0d1b8b195d5c53ac9d939c022a126459dbe7fd96dace4ff'
    ]
  })
  .get('/addr/QPuiounBxPyL6hsMAjtNtCtjF99uN1Nh6d/utxo')
  .reply(200, [
    {
      address: 'QPuiounBxPyL6hsMAjtNtCtjF99uN1Nh6d',
      txid: 'bccfae3c1bdf23cfe0d1b8b195d5c53ac9d939c022a126459dbe7fd96dace4ff',
      vout: 0,
      scriptPubKey: 'a914244317d159e267430432b351b6884f93b11e618a87',
      amount: 0.3,
      satoshis: 30000000,
      height: 481308,
      confirmations: 10
    }
  ])
  .get('/addr/QditoGqT6fJQfnYTrqeeHyxC7ECJsmmu9p')
  .reply(200, {
    addrStr: 'QditoGqT6fJQfnYTrqeeHyxC7ECJsmmu9p',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/Qhc4ZSNeFZS5XGSUKsG3RXkbMJmEQjuCKr')
  .reply(200, {
    addrStr: 'Qhc4ZSNeFZS5XGSUKsG3RXkbMJmEQjuCKr',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/QS8WRomtKcPvVqYcqjWCZsgqrtGmuCk4Jo')
  .reply(200, {
    addrStr: 'QS8WRomtKcPvVqYcqjWCZsgqrtGmuCk4Jo',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/QX7xxCB4tJGimxcoXpjCjfL2wMwK2qktmu')
  .reply(200, {
    addrStr: 'QX7xxCB4tJGimxcoXpjCjfL2wMwK2qktmu',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/QMvx45J6TizqRvPVZS3Er8LEUS61ZewtfU')
  .reply(200, {
    addrStr: 'QMvx45J6TizqRvPVZS3Er8LEUS61ZewtfU',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/QaoQyigiGoieEfzjDLUmSNAimfvB3BKcRG')
  .reply(200, {
    addrStr: 'QaoQyigiGoieEfzjDLUmSNAimfvB3BKcRG',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/QMqVDa2JyjT4homMjyPjKT93PZQ3ab2nDq')
  .reply(200, {
    addrStr: 'QMqVDa2JyjT4homMjyPjKT93PZQ3ab2nDq',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/QTGrp5u5YzPjvcHLj3K6pmwFA7fuGJ67oL')
  .reply(200, {
    addrStr: 'QTGrp5u5YzPjvcHLj3K6pmwFA7fuGJ67oL',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/Qd7dXKNeDS6T9jMEVnj9CvawqFk6af4con')
  .reply(200, {
    addrStr: 'Qd7dXKNeDS6T9jMEVnj9CvawqFk6af4con',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/QRgh4mCr3JXwc1N6xyAx6aguytWz4KjDTW')
  .reply(200, {
    addrStr: 'QRgh4mCr3JXwc1N6xyAx6aguytWz4KjDTW',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  });
};

module.exports.nockZecRecovery = function() {
  nock('https://explorer.testnet.z.cash/api')
  .get('/addr/t2PDm4QH9x8gxGvfKHnHCksZMs5ee94M3BS')
  .reply(200, {
    addrStr: 't2PDm4QH9x8gxGvfKHnHCksZMs5ee94M3BS',
    balance: 0.3,
    balanceSat: 30000000,
    totalReceived: 0.3,
    totalReceivedSat: 30000000,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 1,
    transactions: [
      '754975f7a113e8fa5ae395a350b93514c2096cae4c16be2dd827d8a451e6890f'
    ]
  })
  .get('/addr/t2PDm4QH9x8gxGvfKHnHCksZMs5ee94M3BS/utxo')
  .reply(200, [
    {
      address: 't2PDm4QH9x8gxGvfKHnHCksZMs5ee94M3BS',
      txid: '754975f7a113e8fa5ae395a350b93514c2096cae4c16be2dd827d8a451e6890f',
      vout: 0,
      scriptPubKey: 'a914b6dfccf23872e01a01d746dbf063730887d4457f87',
      amount: 0.3,
      satoshis: 30000000,
      height: 260745,
      confirmations: 3
    }
  ])
  .get('/addr/t2HKLixbkdGCJBKvfknMF9Bz4k4nTkUXwNJ')
  .reply(200, {
    addrStr: 't2HKLixbkdGCJBKvfknMF9Bz4k4nTkUXwNJ',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t2UQsXsYj1ViDGLKbyHAFNpSzEJmfggq9n1')
  .reply(200, {
    addrStr: 't2UQsXsYj1ViDGLKbyHAFNpSzEJmfggq9n1',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t2KmVCRvzBcmDaNLgUnSx4BUJTzLWT7EGTG')
  .reply(200, {
    addrStr: 't2KmVCRvzBcmDaNLgUnSx4BUJTzLWT7EGTG',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t2UkU8n1FhZKs5dP8cSogKJtSb9AuVZhRh4')
  .reply(200, {
    addrStr: 't2UkU8n1FhZKs5dP8cSogKJtSb9AuVZhRh4',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t2KNfjD9RLrnyadU83zJvgLaRowGEojstbJ')
  .reply(200, {
    addrStr: 't2KNfjD9RLrnyadU83zJvgLaRowGEojstbJ',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t27tCPuhsuS2fB89TAxVuLTfYcL6Gbqk9zD')
  .reply(200, {
    addrStr: 't27tCPuhsuS2fB89TAxVuLTfYcL6Gbqk9zD',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t2P2TaEYseCb6FYz8mgzAuSpy89txz4cEGh')
  .reply(200, {
    addrStr: 't2P2TaEYseCb6FYz8mgzAuSpy89txz4cEGh',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t2Br6W3MSa32Esd3xr5whZoK5McattTTqMB')
  .reply(200, {
    addrStr: 't2Br6W3MSa32Esd3xr5whZoK5McattTTqMB',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t28kz5GJ5GkjK3iWPNkHgssFGeJ58MngaJK')
  .reply(200, {
    addrStr: 't28kz5GJ5GkjK3iWPNkHgssFGeJ58MngaJK',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  })
  .get('/addr/t2MxFfe497FetSzqLomcQ6JLxWPsgkdnLWe')
  .reply(200, {
    addrStr: 't2MxFfe497FetSzqLomcQ6JLxWPsgkdnLWe',
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: []
  });
};
