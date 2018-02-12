//
// Tests for Wallets
//

require('should');
const nock = require('nock');
nock.enableNetConnect();

const TestV2BitGo = require('../../lib/test_bitgo');

describe('Recovery:', function() {
  let bitgo;

  before(function() {
    // TODO: replace dev with test
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  after(function() {
    nock.cleanAll();
  });

  describe('Recover Bitcoin', function() {
    it('should generate BTC recovery tx', function() {

      nockBtcRecovery();

      const basecoin = bitgo.coin('tbtc');
      return basecoin.recover({
        userKey: '{"iv":"fTcRIg7nlCf9fPSR4ID8XQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pkIS5jVDi0Y=","ct":"SJQgP+ZzfOMf2fWxyQ2jpoWYioq6Tqfcw1xiKS1WpWAxLvXfH059sZvPrrYMdijJEbqA8EEaYXWmdgYSkMXdwckRMyvM3uWl9H8iKw1ZJmHyy2eDSy5r/pCtWICkcO3oi2I492I/3Op2YLfIX6XqKWs2mztu/OY="}',
        backupKey: '{"iv":"0WkLaOsnO3M7qnV2DbSvWw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"lGxBnvlGAoM=","ct":"cBalT6MGZ3TYIYHt4jys0WDTZEKK9qIubltKEqfW4zXtxYd1dYLz9qLve/yXPl7NF5Cb1lBNGBBGsfqzvpr0Q5824xiy5i9IKzRBI/69HIt3fC2RjJKDfB1EZUjoozi2O5FH4K7L6Ejq7qZhvi8iOd1ULVpBgnE="}',
        bitgoKey: 'xpub661MyMwAqRbcGsSbYgWmr9G1dFgPE8HEb1ASRShbw9S1Mmu1dTQ7QStNwpaYFESq3MeKivGidN8twMeJzqh1veuSP1t2XLENL3mwpatfTst',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw'
      })
      .then(function(recovery) {
        recovery.txHex.should.equal('010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fdfd0000483045022100e62e802500513f83e0db76d10be1eccfff97101c5e959ca8e060ec154652352a02204d1e9f7c116b82e0b2f5e3f5533a4209f0aab855e2365223bdc72cebbc838d6b01473044022036586777d10d8058f5bedbf9882ae21c8143f15ac16c64eccf8ac7872153dc68022011c12a6240797e83a4743a30cc88e2fdf7cfca7e2c840433ebed18192613429a014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff014a457a000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000');
        recovery.tx.hash.should.equal('126f596278008dc4b91a7eaa79d9625f9c55d30d07614dc86f3ee5704863c1ad');
        recovery.tx.size.should.equal(338);
        recovery.tx.vin.length.should.equal(1);
        recovery.tx.vout.length.should.equal(1);
        recovery.tx.vin[0].txid.should.equal('e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74');
        recovery.tx.vin[0].sequence.should.equal(4294967295);
        recovery.tx.vin[0].scriptSig.asm.should.equal('0 3045022100e62e802500513f83e0db76d10be1eccfff97101c5e959ca8e060ec154652352a02204d1e9f7c116b82e0b2f5e3f5533a4209f0aab855e2365223bdc72cebbc838d6b[ALL] 3044022036586777d10d8058f5bedbf9882ae21c8143f15ac16c64eccf8ac7872153dc68022011c12a6240797e83a4743a30cc88e2fdf7cfca7e2c840433ebed18192613429a[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
        recovery.tx.vin[0].scriptSig.hex.should.equal('00483045022100e62e802500513f83e0db76d10be1eccfff97101c5e959ca8e060ec154652352a02204d1e9f7c116b82e0b2f5e3f5533a4209f0aab855e2365223bdc72cebbc838d6b01473044022036586777d10d8058f5bedbf9882ae21c8143f15ac16c64eccf8ac7872153dc68022011c12a6240797e83a4743a30cc88e2fdf7cfca7e2c840433ebed18192613429a014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae');
        recovery.tx.vout[0].n.should.equal(0);
        recovery.tx.vout[0].value.should.equal(0.0801313);
        recovery.tx.vout[0].scriptPubKey.asm.should.equal('OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL');
        recovery.tx.vout[0].scriptPubKey.hex.should.equal('a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787');
        recovery.tx.vout[0].scriptPubKey.type.should.equal('scripthash');
        recovery.tx.vout[0].scriptPubKey.reqSigs.should.equal(1);
        recovery.tx.vout[0].scriptPubKey.addresses.length.should.equal(1);
        recovery.tx.vout[0].scriptPubKey.addresses[0].should.equal('2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw');
      });
    });

    function nockBtcRecovery() {
      nock('https://tbtc.blockr.io', { allowUnmocked: false })
      .get('/api/v1/address/info/2MztRFcJWkDTYsZmNjLu9pBWWviJmWjJ4hg')
      .reply(200, {
        status: 'success',
        data: {
          address: '2MztRFcJWkDTYsZmNjLu9pBWWviJmWjJ4hg',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2NFNu2LUvV98d5rkKobkt1JwtFe8eKpePxj')
      .reply(200, {
        status: 'success',
        data: {
          address: '2NFNu2LUvV98d5rkKobkt1JwtFe8eKpePxj',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw')
      .reply(200, {
        status: 'success',
        data: {
          address: '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw',
          is_unknown: false,
          balance: 0.08125,
          balance_multisig: 0,
          totalreceived: 0.08125,
          nb_txs: 1,
          first_tx: {
            time_utc: '2017-06-12T23:17:43Z',
            tx: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
            block_nb: '1128383',
            value: 0.08125,
            confirmations: 2
          },
          last_tx: {
            time_utc: '2017-06-12T23:17:43Z',
            tx: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
            block_nb: '1128383',
            value: 0.08125,
            confirmations: 2
          },
          is_valid: true
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2NAY4N8bBCthmYDHKBab6gMnS2LwpbxdF2z')
      .reply(200, {
        status: 'success',
        data: {
          address: '2NAY4N8bBCthmYDHKBab6gMnS2LwpbxdF2z',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2MsPSUv8yxy9SwFKWfaTSAGKwaGCBBbMuZA')
      .reply(200, {
        status: 'success',
        data: {
          address: '2MsPSUv8yxy9SwFKWfaTSAGKwaGCBBbMuZA',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2N5txkg9k3pHe6zyyKV2dwztKdDPGdJdPch')
      .reply(200, {
        status: 'success',
        data: {
          address: '2N5txkg9k3pHe6zyyKV2dwztKdDPGdJdPch',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2MzU1ze7cKUFPoQgNnsAmn4Vj7GGrN8HPCC')
      .reply(200, {
        status: 'success',
        data: {
          address: '2MzU1ze7cKUFPoQgNnsAmn4Vj7GGrN8HPCC',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2N3AYt6Bzqne1jagNi6Lnu42PVPshtgVQ9P')
      .reply(200, {
        status: 'success',
        data: {
          address: '2N3AYt6Bzqne1jagNi6Lnu42PVPshtgVQ9P',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2NB8Z1xr86m3sePYdFfJudNrrA8rKNkPEKr')
      .reply(200, {
        status: 'success',
        data: {
          address: '2NB8Z1xr86m3sePYdFfJudNrrA8rKNkPEKr',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2N8pyHtgmrGrvndjteyDDrjQ2ogvUb6bqDT')
      .reply(200, {
        status: 'success',
        data: {
          address: '2N8pyHtgmrGrvndjteyDDrjQ2ogvUb6bqDT',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2MtruqBf39BiueH1pN34rk7Ti7FGxnKmu7X')
      .reply(200, {
        status: 'success',
        data: {
          address: '2MtruqBf39BiueH1pN34rk7Ti7FGxnKmu7X',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2N4F1557TjZVN15AxPRb6CbaX7quyh5n1ym')
      .reply(200, {
        status: 'success',
        data: {
          address: '2N4F1557TjZVN15AxPRb6CbaX7quyh5n1ym',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/info/2NB54XtZQcVBhQSCgVV8AqjiobXGbNDLkba')
      .reply(200, {
        status: 'success',
        data: {
          address: '2NB54XtZQcVBhQSCgVV8AqjiobXGbNDLkba',
          is_unknown: true,
          balance: 0,
          balance_multisig: 0,
          totalreceived: 0,
          nb_txs: 0,
          first_tx: null,
          last_tx: null,
          is_valid: false
        },
        code: 200,
        message: ''
      })
      .get('/api/v1/address/unspent/2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw')
      .reply(200, {
        status: 'success',
        data: {
          address: '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw',
          unspent: [
            {
              tx: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
              amount: '0.08125000',
              n: 0,
              confirmations: 3,
              script: 'a9144db7dbb57102a2e13e4474dbe38058431012e74587'
            }
          ]
        },
        code: 200,
        message: ''
      })
      .post('/api/v1/tx/decode', {
        hex: '010000000174eda73749d65473a8197bac5c26660c66d60cc77a751298ef74931a478382e100000000fdfd0000483045022100e62e802500513f83e0db76d10be1eccfff97101c5e959ca8e060ec154652352a02204d1e9f7c116b82e0b2f5e3f5533a4209f0aab855e2365223bdc72cebbc838d6b01473044022036586777d10d8058f5bedbf9882ae21c8143f15ac16c64eccf8ac7872153dc68022011c12a6240797e83a4743a30cc88e2fdf7cfca7e2c840433ebed18192613429a014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53aeffffffff014a457a000000000017a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac78700000000'
      })
      .reply(200, {
        status: 'success',
        data: {
          tx: {
            txid: '126f596278008dc4b91a7eaa79d9625f9c55d30d07614dc86f3ee5704863c1ad',
            hash: '126f596278008dc4b91a7eaa79d9625f9c55d30d07614dc86f3ee5704863c1ad',
            size: 338,
            vsize: 338,
            version: 1,
            locktime: 0,
            vin: [
              {
                txid: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
                vout: 0,
                scriptSig: {
                  asm: '0 3045022100e62e802500513f83e0db76d10be1eccfff97101c5e959ca8e060ec154652352a02204d1e9f7c116b82e0b2f5e3f5533a4209f0aab855e2365223bdc72cebbc838d6b[ALL] 3044022036586777d10d8058f5bedbf9882ae21c8143f15ac16c64eccf8ac7872153dc68022011c12a6240797e83a4743a30cc88e2fdf7cfca7e2c840433ebed18192613429a[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
                  hex: '00483045022100e62e802500513f83e0db76d10be1eccfff97101c5e959ca8e060ec154652352a02204d1e9f7c116b82e0b2f5e3f5533a4209f0aab855e2365223bdc72cebbc838d6b01473044022036586777d10d8058f5bedbf9882ae21c8143f15ac16c64eccf8ac7872153dc68022011c12a6240797e83a4743a30cc88e2fdf7cfca7e2c840433ebed18192613429a014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae'
                },
                sequence: 4294967295
              }
            ],
            vout: [
              {
                value: 0.0801313,
                n: 0,
                scriptPubKey: {
                  asm: 'OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL',
                  hex: 'a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787',
                  reqSigs: 1,
                  type: 'scripthash',
                  addresses: [
                    '2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw'
                  ]
                }
              }
            ]
          },
          statistics: {
            vins_sum: '0.08125000',
            vouts_sum: '0.08013130',
            fee: '0.00111870'
          }
        },
        code: 200,
        message: ''
      });

      nock('https://bitcoinfees.21.co')
      .get('/api/v1/fees/recommended')
      .reply(200, {
        fastestFee: 420,
        halfHourFee: 360,
        hourFee: 330
      });
    }
  });

  describe('Recover Ripple', function() {
    it('should generate XRP recovery tx', function() {

      nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin.recover({
        userKey: '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
        backupKey: '{"iv":"uB/BTcn1rXmgYGfncXOowg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"I3WrumxkuMQ=","ct":"sgyDNAzNsBruTRm0d04oBTBf8lheHNKS+dRgl8FeMEhodKsiyjtRVHG0CHPf5rV3g5ixVnZ+iwsSCv3PKyyeoy7RGnT0AG9YYpi0me+OvP8331iO+n5quzstrGbV1j8uEh5IMW78S+YUZKSx6zbbdZ0xNu8D5WM="}',
        rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345'
      })
      .then(function(recovery) {
        recovery.txHex.should.equal('120000228000000024000000042E00003039201B00060FB561400000024E06C0C068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E0107321026C91974146427889C801BD26CE31CE0E10307A69DFE4139DE45E5E35933A6B03744630440220759D31959F364794A84F42E6E300D67C56A52EE253324020AC7ECD48E36BE1CA022001DC461FC0471BBF3E1D8F66679EAD173CDA74214D10462C0309D5E6A5C413E18114ABB5B7C843F3AA8D8EFACC3C5A7D9B0484C17442E1E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D2744730450221009E1FC6A174E68250A1104DEDA5D667BBFA431944FA67608FB11FD17CAE5AF09C0220453E6157411B70F01D799179B08EB7BD2135BCD8E6253F07CB681989547078778114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1');
        recovery.id.should.equal('02D3CEEFC34AF91072F12ABF3588D610299FE51A8F478424616E28DE0B8041D4');
        recovery.outputAmount.should.equal('9899000000');
        recovery.outputs.length.should.equal(1);
        recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
        recovery.outputs[0].amount.should.equal('9899000000');
        recovery.fee.fee.should.equal('30');
      });

    });

    function nockXrpRecovery() {
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
    }
  });
});
