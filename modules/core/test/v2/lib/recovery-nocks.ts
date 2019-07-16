/**
 *
 * @prettier
 */
/* eslint-disable @typescript-eslint/camelcase */
import * as nock from 'nock';
import { Environment, Environments } from '../../../src/v2/environments';

export function nockBtcRecovery(bitgo, isKrsRecovery) {
  nock('https://bitcoinfees.earn.com')
    .get('/api/v1/fees/recommended')
    .reply(200, {
      fastestFee: 600,
      halfHourFee: 600,
      hourFee: 100,
    });

  const txHex = isKrsRecovery
    ? '010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000b500483045022100ca835086284cb84e9cbf96464057dcd58fa9b4b37cf4c51171c109dae13ec9ee02203ca1b77600820e670d7bd0c6bd8fbfc003c2a67ffedab7950a1c7f9d0fc17b4c014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff0230456c000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787301b0f000000000017a9141b60c33def13c3eda4cf4835e11a633e4b3302ec8700000000'
    : '010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fdfd00004730440220513ff3a0a4d72230a7ca9b1285d5fa19669d7cccef6a9c8408b06da666f4c51f022058e8cc58b9f9ca585c37a8353d87d0ab042ac081ebfcea86fda0da1b33bf474701483045022100e27c00394553513803e56e6623e06614cf053834a27ca925ed9727071d4411380220399ab1a0269e84beb4e8602fea3d617ffb0b649515892d470061a64217bad613014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff012c717b000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000';
  const decodedTx = isKrsRecovery
    ? {
        success: true,
        transaction: {
          Version: '1',
          LockTime: '0',
          Vin: [
            {
              TxId: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
              Vout: '0',
              ScriptSig: {
                Asm:
                  '0 3045022100ca835086284cb84e9cbf96464057dcd58fa9b4b37cf4c51171c109dae13ec9ee02203ca1b77600820e670d7bd0c6bd8fbfc003c2a67ffedab7950a1c7f9d0fc17b4c[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
                Hex:
                  '00483045022100ca835086284cb84e9cbf96464057dcd58fa9b4b37cf4c51171c109dae13ec9ee02203ca1b77600820e670d7bd0c6bd8fbfc003c2a67ffedab7950a1c7f9d0fc17b4c014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
              },
              CoinBase: null,
              TxInWitness: null,
              Sequence: '4294967295',
            },
          ],
          Vout: [
            {
              Value: 0.070956,
              N: 0,
              ScriptPubKey: {
                Asm: 'OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL',
                Hex: 'a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787',
                ReqSigs: 1,
                Type: 'scripthash',
                Addresses: ['2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw'],
              },
            },
            {
              Value: 0.0099,
              N: 1,
              ScriptPubKey: {
                Asm: 'OP_HASH160 1b60c33def13c3eda4cf4835e11a633e4b3302ec OP_EQUAL',
                Hex: 'a9141b60c33def13c3eda4cf4835e11a633e4b3302ec87',
                ReqSigs: 1,
                Type: 'scripthash',
                Addresses: ['2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN'],
              },
            },
          ],
          TxId: '946dbefaefa5452daba373c0e0e3ada7d74bc4cf2a27518c9fcc581f19b0cb2b',
        },
      }
    : {
        success: true,
        transaction: {
          Version: '1',
          LockTime: '0',
          Vin: [
            {
              TxId: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
              Vout: '0',
              ScriptSig: {
                Asm:
                  '0 30440220513ff3a0a4d72230a7ca9b1285d5fa19669d7cccef6a9c8408b06da666f4c51f022058e8cc58b9f9ca585c37a8353d87d0ab042ac081ebfcea86fda0da1b33bf4747[ALL] 3045022100e27c00394553513803e56e6623e06614cf053834a27ca925ed9727071d4411380220399ab1a0269e84beb4e8602fea3d617ffb0b649515892d470061a64217bad613[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
                Hex:
                  '004730440220513ff3a0a4d72230a7ca9b1285d5fa19669d7cccef6a9c8408b06da666f4c51f022058e8cc58b9f9ca585c37a8353d87d0ab042ac081ebfcea86fda0da1b33bf474701483045022100e27c00394553513803e56e6623e06614cf053834a27ca925ed9727071d4411380220399ab1a0269e84beb4e8602fea3d617ffb0b649515892d470061a64217bad613014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
              },
              CoinBase: null,
              TxInWitness: null,
              Sequence: '4294967295',
            },
          ],
          Vout: [
            {
              Value: 0.080899,
              N: 0,
              ScriptPubKey: {
                Asm: 'OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL',
                Hex: 'a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787',
                ReqSigs: 1,
                Type: 'scripthash',
                Addresses: ['2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw'],
              },
            },
          ],
          TxId: '7cf7dc9e9abcb0bc4303332b128af4200b6b3730461a3bb579143b002739f51f',
        },
      };

  const env = Environments[bitgo.getEnv()] as Environment;
  const smartbitBaseUrl = `${env.smartBitApiBaseUrl}/blockchain`;
  nock(smartbitBaseUrl)
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 1,
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
          transaction_count: 1,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0.00000000',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0.00000000',
            balance_int: 0,
          },
        },
        transaction_paging: {
          valid_sort: ['txindex'],
          limit: 10,
          sort: 'txindex',
          dir: 'desc',
          prev: null,
          next: null,
          prev_link: null,
          next_link: null,
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
                addresses: ['mwCwTceJvYV27KXBc3NJZys6CjsgsoeHmf'],
                value: '0.64999713',
                value_int: 64999713,
                txid: '43bf039b4d1c069974a3f5573931c41dca5615446e8646e3e0aa1a17e586d005',
                vout: 0,
                script_sig: {
                  asm:
                    '3045022100d7ee6bec2f134460ef70b21b6268dd2969b2e0166631cd222fd68aa48adc3798022026c832e2fdc9f9059d467d4b9d3a1516db88c8c688a1f187a147151873530ff001 02ee0cc469cd72f5462e1d407b5eb4ecfba503074b61246fe84f35161be51f8c68',
                  hex:
                    '483045022100d7ee6bec2f134460ef70b21b6268dd2969b2e0166631cd222fd68aa48adc3798022026c832e2fdc9f9059d467d4b9d3a1516db88c8c688a1f187a147151873530ff0012102ee0cc469cd72f5462e1d407b5eb4ecfba503074b61246fe84f35161be51f8c68',
                },
                type: 'pubkeyhash',
                witness: null,
                sequence: 4294967295,
              },
            ],
            output_count: 2,
            outputs: [
              {
                addresses: ['2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw'],
                value: '0.08125000',
                value_int: 8125000,
                n: 0,
                script_pub_key: {
                  asm: 'OP_HASH160 4db7dbb57102a2e13e4474dbe38058431012e745 OP_EQUAL',
                  hex: 'a9144db7dbb57102a2e13e4474dbe38058431012e74587',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: null,
              },
              {
                addresses: ['mzBnxFSRcZ9dsNU6UaM4Ng4mtu2btJjajc'],
                value: '0.56774713',
                value_int: 56774713,
                n: 1,
                script_pub_key: {
                  asm: 'OP_DUP OP_HASH160 cccab052f1611749f3025466415edea09a03bebe OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a914cccab052f1611749f3025466415edea09a03bebe88ac',
                },
                req_sigs: 1,
                type: 'pubkeyhash',
                spend_txid: 'ca157ac8b6572382c78d67f8fcd97b25798543ed683a36daaa65ce2413aa5e3d',
              },
            ],
            tx_index: 14334329,
            block_index: 5,
          },
        ],
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
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
          transaction_count: 0,
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
          transaction_count: 0,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: {
            balance: '0',
            balance_int: 0,
          },
          unconfirmed: {
            balance: '0',
            balance_int: 0,
          },
        },
      },
    })
    .get('/address/2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw/unspent')
    .reply(200, {
      success: true,
      paging: {
        valid_sort: ['id'],
        limit: 10,
        sort: 'id',
        dir: 'desc',
        prev: null,
        next: null,
        prev_link: null,
        next_link: null,
      },
      unspent: [
        {
          addresses: ['2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw'],
          value: '0.08125000',
          value_int: 8125000,
          txid: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
          n: 0,
          script_pub_key: {
            asm: 'OP_HASH160 4db7dbb57102a2e13e4474dbe38058431012e745 OP_EQUAL',
            hex: 'a9144db7dbb57102a2e13e4474dbe38058431012e74587',
          },
          req_sigs: 1,
          type: 'scripthash',
          confirmations: 160162,
          id: 57760457,
        },
      ],
    })
    .post('/decodetx', { hex: txHex })
    .reply(200, decodedTx);

  if (isKrsRecovery) {
    // unnecessary market data removed
    nock('https://apiv2.bitcoinaverage.com')
      .get('/indices/local/ticker/BTCUSD')
      .reply(200, {
        last: 10000,
      });
  }
}

module.exports.nockBchRecovery = function nockBchRecovery(bitgo, isKrsRecovery) {
  const env = Environments[bitgo.getEnv()] as Environment;
  nock(env.bchExplorerBaseUrl)
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
        '6b7e8df8e4d15fa210bb0551646f227888ad63e57e027c7ab360fc3413104cc0',
      ],
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
      txApperances: 0,
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
      txApperances: 0,
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
      txApperances: 0,
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
      txApperances: 0,
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
      txApperances: 0,
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
      txApperances: 0,
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
      transactions: ['dfa6e8fb31dcbcb4adb36ed247ceb37d32f44335f662b0bb41372a9e9419335a'],
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
        confirmations: 0,
      },
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
      txApperances: 0,
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
      txApperances: 0,
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
      txApperances: 0,
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
      txApperances: 0,
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
      txApperances: 0,
    });

  if (isKrsRecovery) {
    // unnecessary market data removed
    nock('https://apiv2.bitcoinaverage.com')
      .get('/indices/local/ticker/BCHUSD')
      .reply(200, {
        last: 1000,
      });
  }
};

module.exports.nockXrpRecovery = function nockXrpRecovery() {
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

module.exports.nockWrongChainRecoveries = function(bitgo) {
  const env = Environments[bitgo.getEnv()] as Environment;
  nock(`${env.uri}/api/v2`)
    .get('/tltc/wallet/5abacebe28d72fbd07e0b8cbba0ff39e')
    .times(2)
    .reply(200, {
      id: '5abacebe28d72fbd07e0b8cbba0ff39e',
      users: [
        {
          user: '543c11ed356d00cb7600000b98794503',
          permissions: ['admin', 'view', 'spend'],
        },
      ],
      coin: 'tltc',
      label: 'Test Wrong Chain Wallet',
      m: 2,
      n: 3,
      keys: [
        '5abaceb63cddfbb607d8306521ddf445',
        '5abaceb73cddfbb607d8306c50ee44c4',
        '5abaceb728d72fbd07e0b84f7b3e6f12',
      ],
      keySignatures: {},
      enterprise: '5578ebc76eb47487743b903166e6543a',
      tags: ['5abacebe28d72fbd07e0b8cbba0ff39e', '5578ebc76eb47487743b903166e6543a'],
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
          rules: [],
        },
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
          redeemScript:
            '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae',
        },
      },
      pendingApprovals: [],
    })
    .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf')
    .times(3)
    .reply(200, {
      id: '5abace103cddfbb607d8239d806671bf',
      users: [
        {
          user: '543c11ed356d00cb7600000b98794503',
          permissions: ['admin', 'view', 'spend'],
        },
      ],
      coin: 'tbtc',
      label: 'Test Wrong Chain Wallet',
      m: 2,
      n: 3,
      keys: [
        '5abacdffae0ec7c107c7d9cf6d60a886',
        '5abacdffae0ec7c107c7d9d74f1d5bd2',
        '5abace00d73fd4bb076782d16681fe7e',
      ],
      keySignatures: {},
      enterprise: '5578ebc76eb47487743b903166e6543a',
      tags: ['5abace103cddfbb607d8239d806671bf', '5578ebc76eb47487743b903166e6543a'],
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
          rules: [],
        },
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
          redeemScript:
            '5221030c7fdefebab31e66961651a6b5391528b3bbaeb4252bc4a9bae788594c5c20b62103bc6ae4c5b81c5acdb40254725195ab52c3a1432896d10c35a277c10b737fe93321031483169ceebf3d10b1c707684b5a53308e3cfc1930cc6144d910f3aba8e769a153ae',
        },
      },
      pendingApprovals: [],
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
        redeemScript:
          '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae',
      },
      balance: {
        updated: '2018-03-27T23:33:10.713Z',
        numTx: 2,
        numUnspents: 0,
        totalReceived: 60000000,
        totalSent: 60000000,
      },
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
        redeemScript:
          '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae',
      },
      balance: {
        updated: '2018-03-27T23:33:10.713Z',
        numTx: 2,
        numUnspents: 0,
        totalReceived: 60000000,
        totalSent: 60000000,
      },
    })
    .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2N9jq7k8cvFhuucVhhbb8BdWTeEjYxKmSfy')
    .times(7)
    .reply(404)
    .get('/tbtc/wallet/5abace103cddfbb607d8239d806671bf/address/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
    .times(7)
    .reply(200, {
      id: '5abace113cddfbb607d823a192372c88',
      address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
      chain: 0,
      index: 0,
      coin: 'tbtc',
      wallet: '5abace103cddfbb607d8239d806671bf',
      coinSpecific: {
        redeemScript:
          '5221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153ae',
      },
      balance: {
        updated: '2018-03-27T23:29:42.799Z',
        numTx: 2,
        numUnspents: 0,
        totalReceived: 65000000,
        totalSent: 65000000,
      },
    })
    .get('/tltc/key/5abaceb63cddfbb607d8306521ddf445')
    .reply(200, {
      id: '5abaceb63cddfbb607d8306521ddf445',
      users: ['543c11ed356d00cb7600000b98794503'],
      pub:
        'xpub661MyMwAqRbcFkYsn3d9wuVNqYzC2zE45hHZUd2iZM3F5dygCMzxKGhCVB4pjmJ1sWynj1RHQi3iiVoUcrQu2bhzu6GWw9A8ZetxYMTPNdZ',
      ethAddress: '0x04d893e078feecbe10945c9e1b965132e48b2915',
      encryptedPrv:
        '{"iv":"JmWw8SBtiQ80KNGvjHvknA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"+V24Zb2ZpiE=","ct":"JUDBx3xDRuWnlV7LH7Wbt+eUixifofSYjA3kVNUZwRXh+7JIrBfQeCWCvvWopTJi7YgWaM+aLjbXB8mZrrE+14xmFw4evg34De4Omd7vnnbbk2uxe/r+bL7hL3tCz+b6uv9wd/tMQmLyu5PJuIrj5n8gv8SmNn4="}',
    })
    .get('/tbtc/key/5abacdffae0ec7c107c7d9cf6d60a886')
    .times(4)
    .reply(200, {
      id: '5abacdffae0ec7c107c7d9cf6d60a886',
      users: ['543c11ed356d00cb7600000b98794503'],
      pub:
        'xpub661MyMwAqRbcFSici6moqY283j2hzysM3gSUhBLgAk9r3jM21jw6Lwr3eyxmH6wTbd12KCjBQxmWT5AmVdW3aUvb5zrhYpgdCN7UDC7wYE6',
      ethAddress: '0xfa5f451f8fc1d7084ed40fcfdd414c092e3fbc31',
      encryptedPrv:
        '{"iv":"SqVdgeFwTzb10li5btyiPA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"yp6P1IYNtAs=","ct":"SHoCHIGD0WyYlieDkgyKTuoaV1VdXIu2rF+XhLAS8fPGWEpj2Lf6Jvjfv+KbUn5CK3OHmWxRB3yjJz8lP1sHgJz68xDh6KnNqEwx5cG8c32+oxN4eEoZZPRrDOq00AHRI6+AtWJgjxGofGfKHE3JEWCZY3C0sBQ="}',
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
      inputIds: ['f6956b431c81108cb3050632540501de8a03501f65bf3b5414235c131005d7f6:0'],
      inputs: [
        {
          id: 'f6956b431c81108cb3050632540501de8a03501f65bf3b5414235c131005d7f6:0',
          address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
          value: 65000000,
          valueString: '65000000',
          redeemScript:
            '5221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153ae',
          isSegwit: false,
        },
      ],
      outputs: [
        {
          id: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6:0',
          address: '2N7h1DEEkwvcm1yYiZWsUhwrrLVL4pKgjJx',
          value: 21000000,
          valueString: '21000000',
        },
        {
          id: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6:1',
          address: '2NGUBPuroX1yYuKSeownbC3z75o9xttcG1U',
          value: 43998878,
          valueString: '43998878',
        },
      ],
      entries: [
        {
          address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
          inputs: 1,
          outputs: 0,
          value: -65000000,
          valueString: '-65000000',
        },
        {
          address: '2N7h1DEEkwvcm1yYiZWsUhwrrLVL4pKgjJx',
          inputs: 0,
          outputs: 1,
          value: 21000000,
          valueString: '21000000',
        },
        {
          address: '2NGUBPuroX1yYuKSeownbC3z75o9xttcG1U',
          inputs: 0,
          outputs: 1,
          value: 43998878,
          valueString: '43998878',
        },
      ],
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
        date: '2018-03-27T23:29:42.799Z',
      },
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
      inputIds: ['78cd1b82384e106aaa8f4c10253211252d3db4807470e83c049db12a2637a967:1'],
      inputs: [
        {
          id: '78cd1b82384e106aaa8f4c10253211252d3db4807470e83c049db12a2637a967:1',
          address: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
          value: 60000000,
          valueString: '60000000',
          redeemScript:
            '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953ae',
          isSegwit: false,
        },
      ],
      outputs: [
        {
          id: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39:0',
          address: 'Qd6bEkzrwMm13oFkKhd9GKwtndBNvv958v',
          value: 19955120,
          valueString: '19955120',
        },
        {
          id: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39:1',
          address: 'QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP',
          value: 40000000,
          valueString: '40000000',
        },
      ],
      entries: [
        {
          address: 'Qd6bEkzrwMm13oFkKhd9GKwtndBNvv958v',
          inputs: 0,
          outputs: 1,
          value: 19955120,
          valueString: '19955120',
        },
        {
          address: 'QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP',
          inputs: 0,
          outputs: 1,
          value: 40000000,
          valueString: '40000000',
        },
        {
          address: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
          inputs: 1,
          outputs: 0,
          value: -60000000,
          valueString: '-60000000',
        },
      ],
    })
    .get('/tltc/public/addressUnspents/QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP')
    .reply(200, [
      {
        id: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39:1',
        address: 'QiSTRzBCS5UxVvdMiYVGfNn1wYkC9JrpmP',
        value: 40000000,
        valueString: '40000000',
        blockHeight: 476097,
        date: '2018-03-27T23:33:10.713Z',
      },
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
      inputIds: ['8f6ab338178e97d3e9a65cd12f4919e8354086cee3d0305ca97d9c96f60043de:0'],
      inputs: [
        {
          id: '8f6ab338178e97d3e9a65cd12f4919e8354086cee3d0305ca97d9c96f60043de:0',
          address: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
          value: 1300000000,
          valueString: '1300000000',
          redeemScript:
            '52210388d574f35d3454b9ed0af9862bc83f9abb2c2c5bec298248f8da9b50fb0fe1d72103fbe5cf926752281de99adc5a42257ad9081178ab46b42a85b7ae76f15f75cf17210346f91ff493951e85008ae28665a1c272ef9e84bfeddca2014bc1cc821c39a87e53ae',
          isSegwit: false,
        },
      ],
      outputs: [
        {
          id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:0',
          address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
          value: 60000000,
          valueString: '60000000',
        },
        {
          id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:1',
          address: '2Mzoz5myftFMQLRGpTdfVv7LXuMpehEXXhF',
          value: 1239994390,
          valueString: '1239994390',
        },
      ],
      entries: [
        {
          address: '2Mzoz5myftFMQLRGpTdfVv7LXuMpehEXXhF',
          inputs: 0,
          outputs: 1,
          value: 1239994390,
          valueString: '1239994390',
        },
        {
          address: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
          inputs: 1,
          outputs: 0,
          value: -1300000000,
          valueString: '-1300000000',
        },
        {
          address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
          inputs: 0,
          outputs: 1,
          value: 60000000,
          valueString: '60000000',
        },
      ],
    })
    .get('/tbsv/public/tx/94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26')
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
      inputIds: ['8f6ab338178e97d3e9a65cd12f4919e8354086cee3d0305ca97d9c96f60043de:0'],
      inputs: [
        {
          id: '8f6ab338178e97d3e9a65cd12f4919e8354086cee3d0305ca97d9c96f60043de:0',
          address: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
          value: 1300000000,
          valueString: '1300000000',
          redeemScript:
            '52210388d574f35d3454b9ed0af9862bc83f9abb2c2c5bec298248f8da9b50fb0fe1d72103fbe5cf926752281de99adc5a42257ad9081178ab46b42a85b7ae76f15f75cf17210346f91ff493951e85008ae28665a1c272ef9e84bfeddca2014bc1cc821c39a87e53ae',
          isSegwit: false,
        },
      ],
      outputs: [
        {
          id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:0',
          address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
          value: 60000000,
          valueString: '60000000',
        },
        {
          id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:1',
          address: '2Mzoz5myftFMQLRGpTdfVv7LXuMpehEXXhF',
          value: 1239994390,
          valueString: '1239994390',
        },
      ],
      entries: [
        {
          address: '2Mzoz5myftFMQLRGpTdfVv7LXuMpehEXXhF',
          inputs: 0,
          outputs: 1,
          value: 1239994390,
          valueString: '1239994390',
        },
        {
          address: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
          inputs: 1,
          outputs: 0,
          value: -1300000000,
          valueString: '-1300000000',
        },
        {
          address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
          inputs: 0,
          outputs: 1,
          value: 60000000,
          valueString: '60000000',
        },
      ],
    })
    .get('/tbch/public/addressUnspents/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
    .reply(200, [
      {
        id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:0',
        address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        value: 60000000,
        valueString: '60000000',
        blockHeight: 1222314,
        date: '2018-03-27T23:34:33.819Z',
      },
    ])
    .get('/tbsv/public/addressUnspents/2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm')
    .reply(200, [
      {
        id: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26:0',
        address: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        value: 60000000,
        valueString: '60000000',
        blockHeight: 1222314,
        date: '2018-03-27T23:34:33.819Z',
      },
    ]);
};

module.exports.nockEthRecovery = function() {
  nock('https://kovan.etherscan.io')
    .get('/api')
    .query({
      module: 'account',
      action: 'txlist',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    })
    .reply(200, {
      status: '0',
      message: 'No transactions found',
      result: [],
    })
    .get('/api')
    .query({
      module: 'account',
      action: 'balance',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    })
    .reply(200, {
      status: '1',
      message: 'OK',
      result: '100000000000000000',
    })
    .get('/api')
    .query({
      module: 'account',
      action: 'balance',
      address: '0x5df5a96b478bb1808140d87072143e60262e8670',
    })
    .reply(200, {
      status: '1',
      message: 'OK',
      result: '2200000000000000000',
    })
    .get('/api')
    .query({
      module: 'account',
      action: 'txlist',
      address: '0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6',
    })
    .reply(200, {
      status: '0',
      message: 'No transactions found',
      result: [],
    })
    .get('/api')
    .query({
      module: 'account',
      action: 'balance',
      address: '0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6',
    })
    .reply(200, {
      status: '1',
      message: 'OK',
      result: '0',
    })
    .get('/api')
    .query({
      module: 'account',
      action: 'txlist',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    })
    .reply(200, {
      status: '0',
      message: 'No transactions found',
      result: [],
    })
    .get('/api')
    .query({
      module: 'account',
      action: 'balance',
      address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
    })
    .reply(200, {
      status: '1',
      message: 'OK',
      result: '100000000000000000',
    })
    .get('/api')
    .query({
      module: 'account',
      action: 'balance',
      address: '0x5df5a96b478bb1808140d87072143e60262e8670',
    })
    .reply(200, {
      status: '1',
      message: 'OK',
      result: '2200000000000000000',
    })
    .get('/api')
    .query({
      module: 'proxy',
      action: 'eth_call',
      to: '0x5df5a96b478bb1808140d87072143e60262e8670',
      data: 'a0b7967b',
      tag: 'latest',
    })
    .reply(200, {
      jsonrpc: '2.0',
      result: '0x0000000000000000000000000000000000000000000000000000000000000001',
      id: 1,
    });
};

module.exports.nockLtcRecovery = function(isKrsRecovery) {
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
      transactions: ['bccfae3c1bdf23cfe0d1b8b195d5c53ac9d939c022a126459dbe7fd96dace4ff'],
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
        confirmations: 10,
      },
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
    });

  if (isKrsRecovery) {
    // unnecessary market data removed
    nock('https://apiv2.bitcoinaverage.com')
      .get('/indices/local/ticker/LTCUSD')
      .reply(200, {
        last: 1000,
      });
  }
};

module.exports.nockZecRecovery = function(bitgo, isKrsRecovery) {
  const env = Environments[bitgo.getEnv()] as Environment;
  nock(env.zecExplorerBaseUrl)
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
      transactions: ['754975f7a113e8fa5ae395a350b93514c2096cae4c16be2dd827d8a451e6890f'],
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
        confirmations: 3,
      },
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
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
      transactions: [],
    });

  if (isKrsRecovery) {
    // unnecessary market data removed
    nock('https://apiv2.bitcoinaverage.com')
      .get('/indices/local/ticker/ZECUSD')
      .reply(200, {
        last: 1000,
      });
  }
};

module.exports.nockDashRecovery = function(bitgo, isKrsRecovery) {
  const env = Environments[bitgo.getEnv()] as Environment;
  nock(env.dashExplorerBaseUrl)
    .get('/addr/8sAnaiWbJnznfRwrtJt2UqwShN6WtCc4wW')
    .reply(200, {
      addrStr: '8sAnaiWbJnznfRwrtJt2UqwShN6WtCc4wW',
      balance: 0.1,
      balanceSat: 10000000,
      totalReceived: 0.1,
      totalReceivedSat: 10000000,
      totalSent: 0,
      totalSentSat: 0,
      unconfirmedBalance: 0,
      unconfirmedBalanceSat: 0,
      unconfirmedTxApperances: 0,
      txApperances: 1,
      transactions: ['53fdc68a122288214c1ccedbf49bdb1a39220eacc1ac1cf0407103927a67daed'],
    })
    .get('/addr/8sAnaiWbJnznfRwrtJt2UqwShN6WtCc4wW/utxo')
    .reply(200, [
      {
        address: '8sAnaiWbJnznfRwrtJt2UqwShN6WtCc4wW',
        txid: '53fdc68a122288214c1ccedbf49bdb1a39220eacc1ac1cf0407103927a67daed',
        vout: 1,
        scriptPubKey: 'a9148bd32681a9c8a6ed07fccf499e22267db8ce0c6987',
        amount: 0.1,
        satoshis: 10000000,
        height: 224276,
        confirmations: 1,
      },
    ])
    .get('/addr/8fKrinrA9f6ipbJZZZ5dcBzbP5GDtwfeAw')
    .reply(200, {
      addrStr: '8fKrinrA9f6ipbJZZZ5dcBzbP5GDtwfeAw',
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
      transactions: [],
    })
    .get('/addr/8ktwroXmaNqbvTnrmiQrPCCBrFcVBUn5DL')
    .reply(200, {
      addrStr: '8ktwroXmaNqbvTnrmiQrPCCBrFcVBUn5DL',
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
      transactions: [],
    })
    .get('/addr/8sVHyDTpJ6iYtUBpdjv5Xx7wMvaUxDtFbZ')
    .reply(200, {
      addrStr: '8sVHyDTpJ6iYtUBpdjv5Xx7wMvaUxDtFbZ',
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
      transactions: [],
    })
    .get('/addr/8vwsgS5ykkd257WAk8Xk9jfyTfCaPukh1k')
    .reply(200, {
      addrStr: '8vwsgS5ykkd257WAk8Xk9jfyTfCaPukh1k',
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
      transactions: [],
    })
    .get('/addr/8wwFXCuu6URcYXxvtYxmMBUqUuSGcGw6bn')
    .reply(200, {
      addrStr: '8wwFXCuu6URcYXxvtYxmMBUqUuSGcGw6bn',
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
      transactions: [],
    })
    .get('/addr/8n9g7B3daAPaBGohTziTAfsqNxoM2jqao3')
    .reply(200, {
      addrStr: '8n9g7B3daAPaBGohTziTAfsqNxoM2jqao3',
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
      transactions: [],
    });

  if (isKrsRecovery) {
    // unnecessary market data removed
    nock('https://apiv2.bitcoinaverage.com')
      .get('/indices/local/ticker/DASHUSD')
      .reply(200, {
        last: 1000,
      });
  }
};

module.exports.nockXlmRecovery = function() {
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
          href:
            'https://horizon-testnet.stellar.org/ledgers?c=0.37643100613718006&cursor=48419653113872384&limit=1&order=desc',
        },
        prev: {
          href:
            'https://horizon-testnet.stellar.org/ledgers?c=0.37643100613718006&cursor=48419653113872384&limit=1&order=asc',
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

module.exports.nockBtcSegwitRecovery = function(bitgo) {
  const env = Environments[bitgo.getEnv()] as Environment;
  // Nock all the external api calls that gather info about the wallet
  // We have lots of empty addresses, because the code queries for possible addresses in the wallet one by one
  const emptyAddrs = [
    '2N42muVaEhvcyMRr7pmFPnrmprdmWCUvhy7',
    '2N2b2yNryWVbMjvXFq7RbaQ2xbGhmAuBQM7',
    '2NBs5i2APw3XSvfch7rHirYC6AxehYizCU9',
    '2NEFHeSYnHVt4t2KqwKz1AZqhpcx2yGoe38',
    '2N4iR1AweHV8wmc7VPBb3tRnweQs1fSW3dB',
    '2N1ir7htudeFEWGhyfXGL7LNKzoFrDS62bQ',
    '2NBpZak1Tz1cpLhg6ZapeTSHkhq91GwMYFo',
    '2N93AW6R6eLan8rfB715oCse9P6pexfK3Tn',
    '2NEZiLrBnTSrwNuVuKCXcAi9AL6YSr1FYqY',
  ];
  emptyAddrs.forEach(function(addr) {
    nock(env.smartBitApiBaseUrl)
      .get('/blockchain/address/' + addr)
      .reply(
        200,
        JSON.parse(
          '{"success":true, "address":{"address":"' +
            addr +
            '", "total":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "confirmed":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "unconfirmed":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "multisig":{"confirmed":{"balance":"0", "balance_int":0},"unconfirmed":{"balance":"0","balance_int":0}}}}'
        )
      );
  });
  nock(env.smartBitApiBaseUrl)
    .get('/blockchain/address/2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws')
    .reply(
      200,
      JSON.parse(
        '{"success":true,"address":{"address":"2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws","total":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"confirmed":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"unconfirmed":{"received":"0.00000000","received_int":0,"spent":"0.00000000","spent_int":0,"balance":"0.00000000","balance_int":0,"input_count":0,"output_count":0,"transaction_count":0},"multisig":{"confirmed":{"balance":"0.00000000","balance_int":0},"unconfirmed":{"balance":"0.00000000","balance_int":0}},"transaction_paging":{"valid_sort":["txindex"],"limit":10,"sort":"txindex","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"transactions":[{"txid":"9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0","hash":"4458cd6cf3a0f48ced99eee4cd6130090380b12747a5196c12355c289d2e00da","block":1452730,"confirmations":7,"version":"1","locktime":1452730,"time":1547682765,"first_seen":1547682684,"propagation":null,"double_spend":false,"size":406,"vsize":214,"input_amount":"0.00099455","input_amount_int":99455,"output_amount":"0.00098910","output_amount_int":98910,"fee":"0.00000545","fee_int":545,"fee_size":"2.54672897","coinbase":false,"input_count":1,"inputs":[{"addresses":["2NCWbbQ5tpKQR2PBVHFst66JcuyWGMPjUKR"],"value":"0.00099455","value_int":99455,"txid":"0b45811cc201ddadee6e5c25a7e25776685b08d9252876c36f2148fc3b997b64","vout":1,"script_sig":{"asm":"00203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e","hex":"2200203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e"},"type":"scripthash","witness":["","304502210095abe38994c3fa7639fba8a3e780b8ca8ed17ac105cd4cd2af7e53b1783a03fa0220708288caad950e2da3b3f00d3f4dbc91433a8a79e6c4539ffd7e7fb5dad75b2b01","3045022100ebf6aa59e21b5707da9e8432dfc0ba53e4bc4130cb974ee6e64e43faf939002802200273e05dcad74caf0ae565be49bb2bc92056782f6031f160c8a58de2e943133e01","52210237ecd62674a320eceee0b8e0497d89c079291ec1622ba1af20b3f93e66a912b421037850684fef0ecc45be7f5113252638c08a5f3d82041e91c40ea3aa6fdd6a0a682103897f5410bf67c77cb5cb89249c5a7393086e98bb09ffd9477bfaea09750c14bd53ae"],"sequence":4294967295}],"output_count":2,"outputs":[{"addresses":["2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws"],"value":"0.00020000","value_int":20000,"n":0,"script_pub_key":{"asm":"OP_HASH160 9f13f940a9461ac6e5393859faca8c513f93cd6e OP_EQUAL","hex":"a9149f13f940a9461ac6e5393859faca8c513f93cd6e87"},"req_sigs":1,"type":"scripthash","spend_txid":null},{"addresses":["2MskQ8f8D4fD6Ujg14iKnzHx5yBwe2V7PrU"],"value":"0.00078910","value_int":78910,"n":1,"script_pub_key":{"asm":"OP_HASH160 058487ef5864d069fc62502c1c4417bed48a8aa7 OP_EQUAL","hex":"a914058487ef5864d069fc62502c1c4417bed48a8aa787"},"req_sigs":1,"type":"scripthash","spend_txid":"8040382653ee766f6c82361c8a19b333702fbb3faabc87e7b5fa0d6c9b8aa387"}],"tx_index":48676632,"block_index":30}]}}'
      )
    )
    .get('/blockchain/address/2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp')
    .reply(
      200,
      JSON.parse(
        '{"success":true,"address":{"address":"2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp","total":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"confirmed":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"unconfirmed":{"received":"0.00000000","received_int":0,"spent":"0.00000000","spent_int":0,"balance":"0.00000000","balance_int":0,"input_count":0,"output_count":0,"transaction_count":0},"multisig":{"confirmed":{"balance":"0.00000000","balance_int":0},"unconfirmed":{"balance":"0.00000000","balance_int":0}},"transaction_paging":{"valid_sort":["txindex"],"limit":10,"sort":"txindex","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"transactions":[{"txid":"9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0","hash":"4458cd6cf3a0f48ced99eee4cd6130090380b12747a5196c12355c289d2e00da","block":1452730,"confirmations":7,"version":"1","locktime":1452730,"time":1547682765,"first_seen":1547682684,"propagation":null,"double_spend":false,"size":406,"vsize":214,"input_amount":"0.00099455","input_amount_int":99455,"output_amount":"0.00098910","output_amount_int":98910,"fee":"0.00000545","fee_int":545,"fee_size":"2.54672897","coinbase":false,"input_count":1,"inputs":[{"addresses":["2NCWbbQ5tpKQR2PBVHFst66JcuyWGMPjUKR"],"value":"0.00099455","value_int":99455,"txid":"0b45811cc201ddadee6e5c25a7e25776685b08d9252876c36f2148fc3b997b64","vout":1,"script_sig":{"asm":"00203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e","hex":"2200203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e"},"type":"scripthash","witness":["","304502210095abe38994c3fa7639fba8a3e780b8ca8ed17ac105cd4cd2af7e53b1783a03fa0220708288caad950e2da3b3f00d3f4dbc91433a8a79e6c4539ffd7e7fb5dad75b2b01","3045022100ebf6aa59e21b5707da9e8432dfc0ba53e4bc4130cb974ee6e64e43faf939002802200273e05dcad74caf0ae565be49bb2bc92056782f6031f160c8a58de2e943133e01","52210237ecd62674a320eceee0b8e0497d89c079291ec1622ba1af20b3f93e66a912b421037850684fef0ecc45be7f5113252638c08a5f3d82041e91c40ea3aa6fdd6a0a682103897f5410bf67c77cb5cb89249c5a7393086e98bb09ffd9477bfaea09750c14bd53ae"],"sequence":4294967295}],"output_count":2,"outputs":[{"addresses":["2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws"],"value":"0.00020000","value_int":20000,"n":0,"script_pub_key":{"asm":"OP_HASH160 9f13f940a9461ac6e5393859faca8c513f93cd6e OP_EQUAL","hex":"a9149f13f940a9461ac6e5393859faca8c513f93cd6e87"},"req_sigs":1,"type":"scripthash","spend_txid":null},{"addresses":["2MskQ8f8D4fD6Ujg14iKnzHx5yBwe2V7PrU"],"value":"0.00078910","value_int":78910,"n":1,"script_pub_key":{"asm":"OP_HASH160 058487ef5864d069fc62502c1c4417bed48a8aa7 OP_EQUAL","hex":"a914058487ef5864d069fc62502c1c4417bed48a8aa787"},"req_sigs":1,"type":"scripthash","spend_txid":"8040382653ee766f6c82361c8a19b333702fbb3faabc87e7b5fa0d6c9b8aa387"}],"tx_index":48676632,"block_index":30}]}}'
      )
    )
    .get('/blockchain/address/2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws/unspent')
    .reply(
      200,
      JSON.parse(
        '{"success":true,"paging":{"valid_sort":["id"],"limit":10,"sort":"id","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"unspent":[{"addresses":["2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws"],"value":"0.00020000","value_int":20000,"txid":"9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0","n":0,"script_pub_key":{"asm":"OP_HASH160 9f13f940a9461ac6e5393859faca8c513f93cd6e OP_EQUAL","hex":"a9149f13f940a9461ac6e5393859faca8c513f93cd6e87"},"req_sigs":1,"type":"scripthash","confirmations":10,"id":129988439}]}'
      )
    )
    .get('/blockchain/address/2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp/unspent')
    .reply(
      200,
      JSON.parse(
        '{"success":true,"paging":{"valid_sort":["id"],"limit":10,"sort":"id","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"unspent":[{"addresses":["2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp"],"value":"0.00041000","value_int":41000,"txid":"8040382653ee766f6c82361c8a19b333702fbb3faabc87e7b5fa0d6c9b8aa387","n":1,"script_pub_key":{"asm":"OP_HASH160 334ea8adc3423478229444603ab27f02de2550ef OP_EQUAL","hex":"a914334ea8adc3423478229444603ab27f02de2550ef87"},"req_sigs":1,"type":"scripthash","confirmations":10,"id":129988450}]}'
      )
    );
  nock('https://bitcoinfees.earn.com')
    .get('/api/v1/fees/recommended')
    .reply(200, { fastestFee: 20, halfHourFee: 20, hourFee: 6 });
};

module.exports.nockBtcUnsignedRecovery = function(bitgo) {
  const env = Environments[bitgo.getEnv()] as Environment;
  // Nock all the external api calls that gather info about the wallet
  // We have lots of empty addresses, because the code queries for possible addresses in the wallet one by one
  const emptyAddrs = [
    '2NAmqGejm1YYiE8rUVanU8SsUkUxqJmKhT3',
    '2MyVwQPE9sM16SCCRa2crUfC1t1bmk92aub',
    '2N6iwcgjTmBZF9MXv32Fw2pkASmBxxPr4qB',
    '2N2h5xreaUWTwqTZeeQ5wbWNhKTopRqKkSe',
    '2NBRHTmnc1RCCnYeo6iS4SnBTVKnnf86vAV',
    '2N6xcb27jLdCZSNegtZzUVKHHJynKiEfhQo',
    '2N1jYERmv9Bpx9z123n3YF8Darepv8PU9tY',
    '2N29zwEk5AbcCW2wUWZoxsqh8Tb39ymHGvu',
    '2N2PppF9zw1jxM26VG89NjUA8bFWUPr8vjF',
  ];
  emptyAddrs.forEach(function(addr) {
    nock(env.smartBitApiBaseUrl)
      .get('/blockchain/address/' + addr)
      .reply(
        200,
        JSON.parse(
          '{"success":true, "address":{"address":"' +
            addr +
            '", "total":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "confirmed":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "unconfirmed":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "multisig":{"confirmed":{"balance":"0", "balance_int":0},"unconfirmed":{"balance":"0","balance_int":0}}}}'
        )
      );
  });
  nock(env.smartBitApiBaseUrl)
    .get('/blockchain/address/2N8cRxMypLRN3HV1ub3b9mu1bbBRYA4JTNx')
    .reply(200, {
      success: true,
      address: {
        address: '2N8cRxMypLRN3HV1ub3b9mu1bbBRYA4JTNx',
        total: {
          received: '0.00100000',
          received_int: 100000,
          spent: '0.00100000',
          spent_int: 100000,
          balance: '0.00000000',
          balance_int: 0,
          input_count: 1,
          output_count: 1,
          transaction_count: 2,
        },
        confirmed: {
          received: '0.00100000',
          received_int: 100000,
          spent: '0.00100000',
          spent_int: 100000,
          balance: '0.00000000',
          balance_int: 0,
          input_count: 1,
          output_count: 1,
          transaction_count: 2,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: { balance: '0.00000000', balance_int: 0 },
          unconfirmed: { balance: '0.00000000', balance_int: 0 },
        },
        transaction_paging: {
          valid_sort: ['txindex'],
          limit: 10,
          sort: 'txindex',
          dir: 'desc',
          prev: null,
          next: null,
          prev_link: null,
          next_link: null,
        },
        transactions: [
          {
            txid: 'c4b15cf8d09a37d2361184cfa10678ea79a83f5455c78d69267238c8b351959e',
            hash: '2f39de081c4c42e65b7596a10fb30e5490a7b7bfa9fefe3c82bcd4731d923b6b',
            block: 1453860,
            confirmations: 1,
            version: '1',
            locktime: 0,
            time: 1548370745,
            first_seen: 1548369606,
            propagation: null,
            double_spend: false,
            size: 666,
            vsize: 475,
            input_amount: '0.00300000',
            input_amount_int: 300000,
            output_amount: '0.00297456',
            output_amount_int: 297456,
            fee: '0.00002544',
            fee_int: 2544,
            fee_size: '5.35578947',
            coinbase: false,
            input_count: 2,
            inputs: [
              {
                addresses: ['2N8cRxMypLRN3HV1ub3b9mu1bbBRYA4JTNx'],
                value: '0.00100000',
                value_int: 100000,
                txid: 'a51944691864fdebd0af5fe0927cf15faeec4f99167dc4ed667939f39b182dfc',
                vout: 0,
                script_sig: {
                  asm:
                    '0 304402203fbd77db1cadb56e4a25b511dd21436111343db4e9b1ea6467e4b5f828cfe38d022039d2bbc525ff1b3d0538ff81b8eb11030856bfbe82b4e5b3b2d76b71f56ccd7b01 3044022025a3fc5f93f9f626b308cda14043714814c5fcb3bce826a78b236df2ba03d4120220235dc83c99f6358c77aa4fd797d3f87af6202d4818800d100a519fd97a8ace2301 522103f983fa66388201efed0c5e569529aa97528c38c9a3d0fa52e4d93495e10086b32103391bcdd0dc42f9aaee3b0643dfff02f5eb58c7a1edfcad89bbcdd444d5eaa0cc2102ca82b357f4db8f035036e9e4e65b871c9f642827570e36291d362791391271bc53ae',
                  hex:
                    '0047304402203fbd77db1cadb56e4a25b511dd21436111343db4e9b1ea6467e4b5f828cfe38d022039d2bbc525ff1b3d0538ff81b8eb11030856bfbe82b4e5b3b2d76b71f56ccd7b01473044022025a3fc5f93f9f626b308cda14043714814c5fcb3bce826a78b236df2ba03d4120220235dc83c99f6358c77aa4fd797d3f87af6202d4818800d100a519fd97a8ace23014c69522103f983fa66388201efed0c5e569529aa97528c38c9a3d0fa52e4d93495e10086b32103391bcdd0dc42f9aaee3b0643dfff02f5eb58c7a1edfcad89bbcdd444d5eaa0cc2102ca82b357f4db8f035036e9e4e65b871c9f642827570e36291d362791391271bc53ae',
                },
                type: 'scripthash',
                witness: ['NULL'],
                sequence: 4294967295,
              },
              {
                addresses: ['2MtHCVNaDed65jnq6YUN7qiHoef6xGDH4PR'],
                value: '0.00200000',
                value_int: 200000,
                txid: 'ec4d4ea133a5c741fadc229a9df3734a2026ca40760e3d0af686ffdc647487e5',
                vout: 1,
                script_sig: {
                  asm: '002075e65da8e389980f3d561921c5e4dea9d3b9acf9ffe57d425a97f8c6fed18cba',
                  hex: '22002075e65da8e389980f3d561921c5e4dea9d3b9acf9ffe57d425a97f8c6fed18cba',
                },
                type: 'scripthash',
                witness: [
                  '',
                  '304402207f71e3570e35a4da43c8ea556d6c24d71910467f707f2bc9e6a9e1f63d081d490220122676470579f953a4ef361e63aacfcfc8fa0b1218f280a7a92f66698a4908b901',
                  '3044022043496a172a6ee7fa7799a33aca09cb9214ba85a98264974d22aef0b9090b6e7b02206da3fb041283e74f827adbe06113ef902820e8a4fb3e14f40a34f95e03a479f301',
                  '52210280595b3dcedac4dd74f2270e9a8683689d6e73af18c4c81b40d882c40e7f0b9c2102b2859475aa70f8f929aee328286e2c8d174c04e30e5c66e0170c65bcfcf2428e2103d0cfb0bb7419a14ad18adc72818024e9d8fcffd7dfa106cc652f4b0f9842217f53ae',
                ],
                sequence: 4294967295,
              },
            ],
            output_count: 1,
            outputs: [
              {
                addresses: ['2N1KrBvGLcz8DjivbUjqq7N9eH7km6a8FtT'],
                value: '0.00297456',
                value_int: 297456,
                n: 0,
                script_pub_key: {
                  asm: 'OP_HASH160 58a0e38c7d65307abe4fe74bf1e0127c6d5804c5 OP_EQUAL',
                  hex: 'a91458a0e38c7d65307abe4fe74bf1e0127c6d5804c587',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: null,
              },
            ],
            tx_index: 48742455,
            block_index: 23,
          },
          {
            txid: 'a51944691864fdebd0af5fe0927cf15faeec4f99167dc4ed667939f39b182dfc',
            hash: 'e14ce308dd7cff05a385fc2ada812730544f7968638a5ccf2ba2246fae2dec9b',
            block: 1453854,
            confirmations: 7,
            version: '1',
            locktime: 1453854,
            time: 1548365521,
            first_seen: 1548364958,
            propagation: null,
            double_spend: false,
            size: 703,
            vsize: 511,
            input_amount: '0.00147585',
            input_amount_int: 147585,
            output_amount: '0.00146300',
            output_amount_int: 146300,
            fee: '0.00001285',
            fee_int: 1285,
            fee_size: '2.51467710',
            coinbase: false,
            input_count: 2,
            inputs: [
              {
                addresses: ['2NAGFrpCHdh8HRgeJGvkEEiB8byjBuVH5ri'],
                value: '0.00047585',
                value_int: 47585,
                txid: '0c7d42dc70500b05bc04a6678b7301261caf2eb9778446da8050cd74a23e5ee4',
                vout: 1,
                script_sig: {
                  asm: '002079d04a47f46684e77269ea0b1f169f3c9ac14f035e1150c93fa7d010f52139de',
                  hex: '22002079d04a47f46684e77269ea0b1f169f3c9ac14f035e1150c93fa7d010f52139de',
                },
                type: 'scripthash',
                witness: [
                  '',
                  '304402202789d93c32162c769b1141252354a7d446b3253d45d85829a07319fae5f089e402200b37466d8c965e97896d157bf7a60aca627603af0a639dbfac2f0d13bc9614e201',
                  '3045022100aeef69a30751ae68b44c784a08cb95ea957e6e089d58b13fce91a3707fbf816e022015e8e038a8097e983b34513eee727dc03ae8ec90272e8c1d12ede3494367b3b601',
                  '5221029b2eaebcce5dc85fc97b4d6cc08add14d31fe15e76eae79bbc2d546d9eceaeba21031beee8e7666037f4d69a1cd70720cd5f7e4b4778d0736023390ed9c5dbdb896d210235714fae5ec7b23eb9d2e2b3d5c7707f510d54f34e6f3e7196ebc8538441531d53ae',
                ],
                sequence: 4294967295,
              },
              {
                addresses: ['2N4FqSzpxctrYRhpqPw4dTR49FxvzWZG6hg'],
                value: '0.00100000',
                value_int: 100000,
                txid: '5c335a038e34d6e241492ba2ef3c87c347a73bb6c2881a9bf51f40f0dadc279f',
                vout: 1,
                script_sig: {
                  asm:
                    '0 3045022100ed2dd9dabfd0bc250b0d08a6286b007edf04c7add8d2cd38e1d94a12d958d324022014a8d756f268a3e89dcb0bc5ac3828b9be0938ffadb5557453afd812556fcb5f01 30450221009c61daf674f679bd0db628295312110840bfc13ce551fd7c0c8cf3d68dfd037002206730d24ccd41cd96826c0fb0a51e47b18e37d71352815bb50bbf58cc2de1320001 52210281696424e9bed900a9a518a2ded26c58ccef0ed32312edebe63fe4e3b311816821031d088f4e0f0d3586dcb6f1d21bc430e7b345a9046b451a05c9556e25a9e5a9a721028323a2306df19415073ade9b1f219ba33f0d16e1388681f76e7a03aaf3f685f853ae',
                  hex:
                    '00483045022100ed2dd9dabfd0bc250b0d08a6286b007edf04c7add8d2cd38e1d94a12d958d324022014a8d756f268a3e89dcb0bc5ac3828b9be0938ffadb5557453afd812556fcb5f014830450221009c61daf674f679bd0db628295312110840bfc13ce551fd7c0c8cf3d68dfd037002206730d24ccd41cd96826c0fb0a51e47b18e37d71352815bb50bbf58cc2de13200014c6952210281696424e9bed900a9a518a2ded26c58ccef0ed32312edebe63fe4e3b311816821031d088f4e0f0d3586dcb6f1d21bc430e7b345a9046b451a05c9556e25a9e5a9a721028323a2306df19415073ade9b1f219ba33f0d16e1388681f76e7a03aaf3f685f853ae',
                },
                type: 'scripthash',
                witness: ['NULL'],
                sequence: 4294967295,
              },
            ],
            output_count: 2,
            outputs: [
              {
                addresses: ['2N8cRxMypLRN3HV1ub3b9mu1bbBRYA4JTNx'],
                value: '0.00100000',
                value_int: 100000,
                n: 0,
                script_pub_key: {
                  asm: 'OP_HASH160 a88c9c8472b5facb5142062ec6b4d6a9fd5d2c7b OP_EQUAL',
                  hex: 'a914a88c9c8472b5facb5142062ec6b4d6a9fd5d2c7b87',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: 'c4b15cf8d09a37d2361184cfa10678ea79a83f5455c78d69267238c8b351959e',
              },
              {
                addresses: ['2N8gtvxWu6fcuMarUjr5WnbVwrAvE8DvHSB'],
                value: '0.00046300',
                value_int: 46300,
                n: 1,
                script_pub_key: {
                  asm: 'OP_HASH160 a964cb225fd13a7563ca013ee04a746b8412af32 OP_EQUAL',
                  hex: 'a914a964cb225fd13a7563ca013ee04a746b8412af3287',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: 'ec4d4ea133a5c741fadc229a9df3734a2026ca40760e3d0af686ffdc647487e5',
              },
            ],
            tx_index: 48742070,
            block_index: 29,
          },
        ],
      },
    })
    .get('/blockchain/address/2MxZA7JFtNiQrET7JvywDisrZnKPEDAHf49')
    .reply(200, {
      success: true,
      address: {
        address: '2MxZA7JFtNiQrET7JvywDisrZnKPEDAHf49',
        total: {
          received: '0.00100000',
          received_int: 100000,
          spent: '0.00000000',
          spent_int: 0,
          balance: '0.00100000',
          balance_int: 100000,
          input_count: 1,
          output_count: 0,
          transaction_count: 1,
        },
        confirmed: {
          received: '0.00100000',
          received_int: 100000,
          spent: '0.00000000',
          spent_int: 0,
          balance: '0.00100000',
          balance_int: 100000,
          input_count: 1,
          output_count: 0,
          transaction_count: 1,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: { balance: '0.00000000', balance_int: 0 },
          unconfirmed: { balance: '0.00000000', balance_int: 0 },
        },
        transaction_paging: {
          valid_sort: ['txindex'],
          limit: 10,
          sort: 'txindex',
          dir: 'desc',
          prev: null,
          next: null,
          prev_link: null,
          next_link: null,
        },
        transactions: [
          {
            txid: '4bf4a792816cb4e25f0a4faea6ecb42ffd360bde293bfd8a4b6d2c255aa379f9',
            hash: '97993225e06c1a4a6814ecf9453b5115633b2fae81d946e4b9efd879f825aefc',
            block: 1453860,
            confirmations: 2,
            version: '1',
            locktime: 1453859,
            time: 1548370745,
            first_seen: 1548370440,
            propagation: null,
            double_spend: false,
            size: 404,
            vsize: 214,
            input_amount: '0.00244275',
            input_amount_int: 244275,
            output_amount: '0.00243730',
            output_amount_int: 243730,
            fee: '0.00000545',
            fee_int: 545,
            fee_size: '2.54672897',
            coinbase: false,
            input_count: 1,
            inputs: [
              {
                addresses: ['2NGB9UfYcMoiTMekihViBZTGjznPKgviLUr'],
                value: '0.00244275',
                value_int: 244275,
                txid: 'ec4d4ea133a5c741fadc229a9df3734a2026ca40760e3d0af686ffdc647487e5',
                vout: 0,
                script_sig: {
                  asm: '00203c8010727ce77b052c9e9c33ea14cacad45e83d4cdca8385aed30995769d40cd',
                  hex: '2200203c8010727ce77b052c9e9c33ea14cacad45e83d4cdca8385aed30995769d40cd',
                },
                type: 'scripthash',
                witness: [
                  '',
                  '3044022029ae3746895936754551fca5e4cb693f86a49d926054a18adb215b6bd4d188d502202227246a8b981d27a10d87f121327c2785ec2e9c8a101ae1307a73eda486b54301',
                  '304402204f6badf11b75fd3ed5ca569b86bcb24f6c4cf8a644012fe92e369bffce1f5ee40220402e05fd17a1d9a10195763096e08441d685ccede861221727abb62ffbc4b6ec01',
                  '522103eccd3afd78d4722f00983625b1462f4af30c78d5aaf1a115209b829d21c104ed210332e8e21bb972be856c3c61f7b6a165b1d9b130ac605eabb636825e495c28d58421020db4413c6ca683130a5e13c9d026231184b5e74a3c568b1369c9eae45cde589a53ae',
                ],
                sequence: 4294967295,
              },
            ],
            output_count: 2,
            outputs: [
              {
                addresses: ['2MxZA7JFtNiQrET7JvywDisrZnKPEDAHf49'],
                value: '0.00100000',
                value_int: 100000,
                n: 0,
                script_pub_key: {
                  asm: 'OP_HASH160 3a3ce0cea3510e6435823a7d3c5a7c3c27166f2d OP_EQUAL',
                  hex: 'a9143a3ce0cea3510e6435823a7d3c5a7c3c27166f2d87',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: null,
              },
              {
                addresses: ['2N3TEakvvhcHHPUDZ577Hq2zwY1rTfjhSgW'],
                value: '0.00143730',
                value_int: 143730,
                n: 1,
                script_pub_key: {
                  asm: 'OP_HASH160 6ff6bedc1b2688ece0b630519624c3875f7356f2 OP_EQUAL',
                  hex: 'a9146ff6bedc1b2688ece0b630519624c3875f7356f287',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: 'a9192dea1de9c79f4b6d4a4eeaf70542bd4eaec37206aab799b893d61c76552e',
              },
            ],
            tx_index: 48742482,
            block_index: 27,
          },
        ],
      },
    })

    .get('/blockchain/address/2MtHCVNaDed65jnq6YUN7qiHoef6xGDH4PR')
    .reply(200, {
      success: true,
      address: {
        address: '2MtHCVNaDed65jnq6YUN7qiHoef6xGDH4PR',
        total: {
          received: '0.00200000',
          received_int: 200000,
          spent: '0.00200000',
          spent_int: 200000,
          balance: '0.00000000',
          balance_int: 0,
          input_count: 1,
          output_count: 1,
          transaction_count: 2,
        },
        confirmed: {
          received: '0.00200000',
          received_int: 200000,
          spent: '0.00200000',
          spent_int: 200000,
          balance: '0.00000000',
          balance_int: 0,
          input_count: 1,
          output_count: 1,
          transaction_count: 2,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: { balance: '0.00000000', balance_int: 0 },
          unconfirmed: { balance: '0.00000000', balance_int: 0 },
        },
        transaction_paging: {
          valid_sort: ['txindex'],
          limit: 10,
          sort: 'txindex',
          dir: 'desc',
          prev: null,
          next: null,
          prev_link: null,
          next_link: null,
        },
        transactions: [
          {
            txid: 'c4b15cf8d09a37d2361184cfa10678ea79a83f5455c78d69267238c8b351959e',
            hash: '2f39de081c4c42e65b7596a10fb30e5490a7b7bfa9fefe3c82bcd4731d923b6b',
            block: 1453860,
            confirmations: 2,
            version: '1',
            locktime: 0,
            time: 1548370745,
            first_seen: 1548369606,
            propagation: null,
            double_spend: false,
            size: 666,
            vsize: 475,
            input_amount: '0.00300000',
            input_amount_int: 300000,
            output_amount: '0.00297456',
            output_amount_int: 297456,
            fee: '0.00002544',
            fee_int: 2544,
            fee_size: '5.35578947',
            coinbase: false,
            input_count: 2,
            inputs: [
              {
                addresses: ['2N8cRxMypLRN3HV1ub3b9mu1bbBRYA4JTNx'],
                value: '0.00100000',
                value_int: 100000,
                txid: 'a51944691864fdebd0af5fe0927cf15faeec4f99167dc4ed667939f39b182dfc',
                vout: 0,
                script_sig: {
                  asm:
                    '0 304402203fbd77db1cadb56e4a25b511dd21436111343db4e9b1ea6467e4b5f828cfe38d022039d2bbc525ff1b3d0538ff81b8eb11030856bfbe82b4e5b3b2d76b71f56ccd7b01 3044022025a3fc5f93f9f626b308cda14043714814c5fcb3bce826a78b236df2ba03d4120220235dc83c99f6358c77aa4fd797d3f87af6202d4818800d100a519fd97a8ace2301 522103f983fa66388201efed0c5e569529aa97528c38c9a3d0fa52e4d93495e10086b32103391bcdd0dc42f9aaee3b0643dfff02f5eb58c7a1edfcad89bbcdd444d5eaa0cc2102ca82b357f4db8f035036e9e4e65b871c9f642827570e36291d362791391271bc53ae',
                  hex:
                    '0047304402203fbd77db1cadb56e4a25b511dd21436111343db4e9b1ea6467e4b5f828cfe38d022039d2bbc525ff1b3d0538ff81b8eb11030856bfbe82b4e5b3b2d76b71f56ccd7b01473044022025a3fc5f93f9f626b308cda14043714814c5fcb3bce826a78b236df2ba03d4120220235dc83c99f6358c77aa4fd797d3f87af6202d4818800d100a519fd97a8ace23014c69522103f983fa66388201efed0c5e569529aa97528c38c9a3d0fa52e4d93495e10086b32103391bcdd0dc42f9aaee3b0643dfff02f5eb58c7a1edfcad89bbcdd444d5eaa0cc2102ca82b357f4db8f035036e9e4e65b871c9f642827570e36291d362791391271bc53ae',
                },
                type: 'scripthash',
                witness: ['NULL'],
                sequence: 4294967295,
              },
              {
                addresses: ['2MtHCVNaDed65jnq6YUN7qiHoef6xGDH4PR'],
                value: '0.00200000',
                value_int: 200000,
                txid: 'ec4d4ea133a5c741fadc229a9df3734a2026ca40760e3d0af686ffdc647487e5',
                vout: 1,
                script_sig: {
                  asm: '002075e65da8e389980f3d561921c5e4dea9d3b9acf9ffe57d425a97f8c6fed18cba',
                  hex: '22002075e65da8e389980f3d561921c5e4dea9d3b9acf9ffe57d425a97f8c6fed18cba',
                },
                type: 'scripthash',
                witness: [
                  '',
                  '304402207f71e3570e35a4da43c8ea556d6c24d71910467f707f2bc9e6a9e1f63d081d490220122676470579f953a4ef361e63aacfcfc8fa0b1218f280a7a92f66698a4908b901',
                  '3044022043496a172a6ee7fa7799a33aca09cb9214ba85a98264974d22aef0b9090b6e7b02206da3fb041283e74f827adbe06113ef902820e8a4fb3e14f40a34f95e03a479f301',
                  '52210280595b3dcedac4dd74f2270e9a8683689d6e73af18c4c81b40d882c40e7f0b9c2102b2859475aa70f8f929aee328286e2c8d174c04e30e5c66e0170c65bcfcf2428e2103d0cfb0bb7419a14ad18adc72818024e9d8fcffd7dfa106cc652f4b0f9842217f53ae',
                ],
                sequence: 4294967295,
              },
            ],
            output_count: 1,
            outputs: [
              {
                addresses: ['2N1KrBvGLcz8DjivbUjqq7N9eH7km6a8FtT'],
                value: '0.00297456',
                value_int: 297456,
                n: 0,
                script_pub_key: {
                  asm: 'OP_HASH160 58a0e38c7d65307abe4fe74bf1e0127c6d5804c5 OP_EQUAL',
                  hex: 'a91458a0e38c7d65307abe4fe74bf1e0127c6d5804c587',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: null,
              },
            ],
            tx_index: 48742455,
            block_index: 23,
          },
          {
            txid: 'ec4d4ea133a5c741fadc229a9df3734a2026ca40760e3d0af686ffdc647487e5',
            hash: '84ad2f2050e416556669794fd68b3ca2c2c0206af5d5c1dd08c1400cffefa414',
            block: 1453854,
            confirmations: 8,
            version: '1',
            locktime: 1453854,
            time: 1548365521,
            first_seen: 1548365027,
            propagation: null,
            double_spend: false,
            size: 1000,
            vsize: 808,
            input_amount: '0.00446300',
            input_amount_int: 446300,
            output_amount: '0.00444275',
            output_amount_int: 444275,
            fee: '0.00002025',
            fee_int: 2025,
            fee_size: '2.50618812',
            coinbase: false,
            input_count: 3,
            inputs: [
              {
                addresses: ['2N8gtvxWu6fcuMarUjr5WnbVwrAvE8DvHSB'],
                value: '0.00046300',
                value_int: 46300,
                txid: 'a51944691864fdebd0af5fe0927cf15faeec4f99167dc4ed667939f39b182dfc',
                vout: 1,
                script_sig: {
                  asm: '0020729d7a222096e471fc0bb2373affa09d0addc0e51e338bfe172dc2e9703be519',
                  hex: '220020729d7a222096e471fc0bb2373affa09d0addc0e51e338bfe172dc2e9703be519',
                },
                type: 'scripthash',
                witness: [
                  '',
                  '3045022100d5ee74e0f8ae3e86f83d8fb272565c9ff410ff9cfafaa3431d43887ae913d0df02201e92b899569d4baca379740115230ba58d50e7c7cf187431fa353d06c311f83e01',
                  '304402202a0d1b59365da12e4776a705e7cfe09bb25675449d5cf1f6dc9e1711ea3781f5022027eac058a1739486d4a3c18571cc50d49ce40a272b744a460dfac7662a40b81601',
                  '522103c0df4271226ba77227365960cbdaed40283307b2b84339fba9087d2e90e4769f2103012a5c9839dad099596828e62b38dc342df523f1bb31e21c2171572b8114e0832103fb93092ad62c30d560905099b59925fab2ea773f513e2f9d36781e97b775f90853ae',
                ],
                sequence: 4294967295,
              },
              {
                addresses: ['2N4FqSzpxctrYRhpqPw4dTR49FxvzWZG6hg'],
                value: '0.00100000',
                value_int: 100000,
                txid: 'a9535d21e6c8d287a017bf214a3b21beaa9a0e854c23f29695ec4bcd9697dd76',
                vout: 1,
                script_sig: {
                  asm:
                    '0 3045022100e60cd332500dc90d79994ca46e333eea9806352502b55c62de45b6226d27b47e02207fe99f0a58e81f689c85cab7980d64e08c5247c37c5cf38195003c679b5a4bc001 30440220112fa01503080c8fc4a8e680a8606e533ec2b7a7bbc866356bdaec8da7dd459a022017d577057f63773290d279e592dffef23687b81ad4dd812959bce1175015393801 52210281696424e9bed900a9a518a2ded26c58ccef0ed32312edebe63fe4e3b311816821031d088f4e0f0d3586dcb6f1d21bc430e7b345a9046b451a05c9556e25a9e5a9a721028323a2306df19415073ade9b1f219ba33f0d16e1388681f76e7a03aaf3f685f853ae',
                  hex:
                    '00483045022100e60cd332500dc90d79994ca46e333eea9806352502b55c62de45b6226d27b47e02207fe99f0a58e81f689c85cab7980d64e08c5247c37c5cf38195003c679b5a4bc0014730440220112fa01503080c8fc4a8e680a8606e533ec2b7a7bbc866356bdaec8da7dd459a022017d577057f63773290d279e592dffef23687b81ad4dd812959bce11750153938014c6952210281696424e9bed900a9a518a2ded26c58ccef0ed32312edebe63fe4e3b311816821031d088f4e0f0d3586dcb6f1d21bc430e7b345a9046b451a05c9556e25a9e5a9a721028323a2306df19415073ade9b1f219ba33f0d16e1388681f76e7a03aaf3f685f853ae',
                },
                type: 'scripthash',
                witness: ['NULL'],
                sequence: 4294967295,
              },
              {
                addresses: ['2MzgcV6o8Zsbi73PqtmvMPy76YPtZo1Ym5i'],
                value: '0.00300000',
                value_int: 300000,
                txid: '0eb9ffd355bb3dac749ae6bb0011e8ea2eea012bac13d89223f23b43a00fb8b2',
                vout: 0,
                script_sig: {
                  asm:
                    '0 30450221009761dedbc1f16c4c98fa26dd0ccc50ef1e0510f621078ccb224e72571e794a8e022031b8f53b7683b5db6a233da9ca6de490a83ae96d83961b18fe701db6be9c78ef01 3045022100a5bdc1c01aecbaeb82e12821e5183790cd389c3b2ace1b8bbec1fbf8aedcbad80220105a9f753205e5df2e75bb13b59d5c8b4de869042bf7f0c705fc00499ab95e4001 52210333fecfcb93d560b2f32ffc53b8a2dadae1e3efa7be47fc9c76dc2eeaa22729c821021f0e7be51cb22833cb1d09e269cc226024d195851b2a458082ad6445c28a883a2103296f90057d0ee10d2a64dbe4c8c29b9363fdde460a1c3a7970a4197b32e94e9753ae',
                  hex:
                    '004830450221009761dedbc1f16c4c98fa26dd0ccc50ef1e0510f621078ccb224e72571e794a8e022031b8f53b7683b5db6a233da9ca6de490a83ae96d83961b18fe701db6be9c78ef01483045022100a5bdc1c01aecbaeb82e12821e5183790cd389c3b2ace1b8bbec1fbf8aedcbad80220105a9f753205e5df2e75bb13b59d5c8b4de869042bf7f0c705fc00499ab95e40014c6952210333fecfcb93d560b2f32ffc53b8a2dadae1e3efa7be47fc9c76dc2eeaa22729c821021f0e7be51cb22833cb1d09e269cc226024d195851b2a458082ad6445c28a883a2103296f90057d0ee10d2a64dbe4c8c29b9363fdde460a1c3a7970a4197b32e94e9753ae',
                },
                type: 'scripthash',
                witness: ['NULL'],
                sequence: 4294967295,
              },
            ],
            output_count: 2,
            outputs: [
              {
                addresses: ['2NGB9UfYcMoiTMekihViBZTGjznPKgviLUr'],
                value: '0.00244275',
                value_int: 244275,
                n: 0,
                script_pub_key: {
                  asm: 'OP_HASH160 fb8576bff04f44a9846cfb053ea85487d0784caa OP_EQUAL',
                  hex: 'a914fb8576bff04f44a9846cfb053ea85487d0784caa87',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: '4bf4a792816cb4e25f0a4faea6ecb42ffd360bde293bfd8a4b6d2c255aa379f9',
              },
              {
                addresses: ['2MtHCVNaDed65jnq6YUN7qiHoef6xGDH4PR'],
                value: '0.00200000',
                value_int: 200000,
                n: 1,
                script_pub_key: {
                  asm: 'OP_HASH160 0b57b4f407249256f7b3fdf9450a945376649106 OP_EQUAL',
                  hex: 'a9140b57b4f407249256f7b3fdf9450a94537664910687',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: 'c4b15cf8d09a37d2361184cfa10678ea79a83f5455c78d69267238c8b351959e',
              },
            ],
            tx_index: 48742072,
            block_index: 30,
          },
        ],
      },
    })
    .get('/blockchain/address/2MxZA7JFtNiQrET7JvywDisrZnKPEDAHf49/unspent')
    .reply(200, {
      success: true,
      paging: {
        valid_sort: ['id'],
        limit: 10,
        sort: 'id',
        dir: 'desc',
        prev: null,
        next: null,
        prev_link: null,
        next_link: null,
      },
      unspent: [
        {
          addresses: ['2MxZA7JFtNiQrET7JvywDisrZnKPEDAHf49'],
          value: '0.00100000',
          value_int: 100000,
          txid: '4bf4a792816cb4e25f0a4faea6ecb42ffd360bde293bfd8a4b6d2c255aa379f9',
          n: 0,
          script_pub_key: {
            asm: 'OP_HASH160 3a3ce0cea3510e6435823a7d3c5a7c3c27166f2d OP_EQUAL',
            hex: 'a9143a3ce0cea3510e6435823a7d3c5a7c3c27166f2d87',
          },
          req_sigs: 1,
          type: 'scripthash',
          confirmations: 2,
          id: 130154859,
        },
      ],
    })
    .get('/blockchain/address/2N6swovegiiYQZpDHR7yYxvoNj8WUBmau3z')
    .reply(200, {
      success: true,
      address: {
        address: '2N6swovegiiYQZpDHR7yYxvoNj8WUBmau3z',
        total: {
          received: '0.00120000',
          received_int: 120000,
          spent: '0.00000000',
          spent_int: 0,
          balance: '0.00120000',
          balance_int: 120000,
          input_count: 1,
          output_count: 0,
          transaction_count: 1,
        },
        confirmed: {
          received: '0.00120000',
          received_int: 120000,
          spent: '0.00000000',
          spent_int: 0,
          balance: '0.00120000',
          balance_int: 120000,
          input_count: 1,
          output_count: 0,
          transaction_count: 1,
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
          transaction_count: 0,
        },
        multisig: {
          confirmed: { balance: '0.00000000', balance_int: 0 },
          unconfirmed: { balance: '0.00000000', balance_int: 0 },
        },
        transaction_paging: {
          valid_sort: ['txindex'],
          limit: 10,
          sort: 'txindex',
          dir: 'desc',
          prev: null,
          next: null,
          prev_link: null,
          next_link: null,
        },
        transactions: [
          {
            txid: 'a9192dea1de9c79f4b6d4a4eeaf70542bd4eaec37206aab799b893d61c76552e',
            hash: '1cad2560e0e3573516900b42cb8c58aa1743f96290106b80868588a3771b0d3b',
            block: 1453860,
            confirmations: 2,
            version: '1',
            locktime: 1453859,
            time: 1548370745,
            first_seen: 1548370479,
            propagation: null,
            double_spend: false,
            size: 406,
            vsize: 214,
            input_amount: '0.00143730',
            input_amount_int: 143730,
            output_amount: '0.00143185',
            output_amount_int: 143185,
            fee: '0.00000545',
            fee_int: 545,
            fee_size: '2.54672897',
            coinbase: false,
            input_count: 1,
            inputs: [
              {
                addresses: ['2N3TEakvvhcHHPUDZ577Hq2zwY1rTfjhSgW'],
                value: '0.00143730',
                value_int: 143730,
                txid: '4bf4a792816cb4e25f0a4faea6ecb42ffd360bde293bfd8a4b6d2c255aa379f9',
                vout: 1,
                script_sig: {
                  asm: '0020ddaa1c6500ba55319f9fd57a018d7c40578cfbf62b7b22edf56875250365789d',
                  hex: '220020ddaa1c6500ba55319f9fd57a018d7c40578cfbf62b7b22edf56875250365789d',
                },
                type: 'scripthash',
                witness: [
                  '',
                  '304502210099ad548dd0925e8b82cfb626200b815be199d873e306b32c3b338c7921b9286d022048fbb23272915adbc50551914a431fc8f08c097219769d20d7d9e75a88a15b4b01',
                  '3045022100b0368a1cbace3ac8b608d3a7e82aed3f8bc6ca08abd30f75456c39ab1274b3f602201ea8bd273cc424fea4cf13c772ceece2ed634d0be677fb8dcdf7386c6da2c35601',
                  '52210243c1e58b6b9a208ec20288bda29e92822ab81b41adc90f330b40e3ffd91b619e210276ab71cb26e245db7b3b273d55727ecc649dafbb9c65d11b2e31b290f4b2d4562103b730a9fd21eadc00ef164aeb1530af91e968967e7b4211393826972a25a8f09553ae',
                ],
                sequence: 4294967295,
              },
            ],
            output_count: 2,
            outputs: [
              {
                addresses: ['2N3yNzbL4CMU4jzpYAk83fLNVohTGpduQjG'],
                value: '0.00023185',
                value_int: 23185,
                n: 0,
                script_pub_key: {
                  asm: 'OP_HASH160 75aa3ed8f55ca523f0b7e02399e21740bffade14 OP_EQUAL',
                  hex: 'a91475aa3ed8f55ca523f0b7e02399e21740bffade1487',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: null,
              },
              {
                addresses: ['2N6swovegiiYQZpDHR7yYxvoNj8WUBmau3z'],
                value: '0.00120000',
                value_int: 120000,
                n: 1,
                script_pub_key: {
                  asm: 'OP_HASH160 958b85440d676edba2e3262da080ad61252d1a0a OP_EQUAL',
                  hex: 'a914958b85440d676edba2e3262da080ad61252d1a0a87',
                },
                req_sigs: 1,
                type: 'scripthash',
                spend_txid: null,
              },
            ],
            tx_index: 48742484,
            block_index: 28,
          },
        ],
      },
    })
    .get('/blockchain/address/2N6swovegiiYQZpDHR7yYxvoNj8WUBmau3z/unspent')
    .reply(200, {
      success: true,
      paging: {
        valid_sort: ['id'],
        limit: 10,
        sort: 'id',
        dir: 'desc',
        prev: null,
        next: null,
        prev_link: null,
        next_link: null,
      },
      unspent: [
        {
          addresses: ['2N6swovegiiYQZpDHR7yYxvoNj8WUBmau3z'],
          value: '0.00120000',
          value_int: 120000,
          txid: 'a9192dea1de9c79f4b6d4a4eeaf70542bd4eaec37206aab799b893d61c76552e',
          n: 1,
          script_pub_key: {
            asm: 'OP_HASH160 958b85440d676edba2e3262da080ad61252d1a0a OP_EQUAL',
            hex: 'a914958b85440d676edba2e3262da080ad61252d1a0a87',
          },
          req_sigs: 1,
          type: 'scripthash',
          confirmations: 2,
          id: 130154864,
        },
      ],
    });

  nock('https://bitcoinfees.earn.com')
    .get('/api/v1/fees/recommended')
    .reply(200, { fastestFee: 20, halfHourFee: 20, hourFee: 6 });
};
