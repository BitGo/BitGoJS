const should = require('should');
const co = require('bluebird').coroutine;
const sinon = require('sinon');
const nock = require('nock');

const TestBitGo = require('../../../lib/test_bitgo');

const errors = require('../../../../src/v2/errors');

describe('Abstract UTXO Coin:', () => {

  describe('Parse Transaction:', () => {

    let coin;
    let bitgo;

    /*
     * mock objects which get passed into parse transaction.
     * These objects are structured to force parse transaction into a
     * particular execution path for these tests.
     */
    const wallet = {
      _wallet: {
        migratedFrom: 'v1_wallet_base_address'
      }
    };
    const verification = {
      disableNetworking: true,
      keychains: {}
    };

    const outputAmount = 0.01 * 1e8;

    before(() => {
      bitgo = new TestBitGo({ env: 'mock' });
      coin = bitgo.coin('btc');
    });

    it('should classify outputs which spend change back to a v1 wallet base address as internal', co(function *() {
      sinon.stub(coin, 'explainTransaction')
      .returns({
        outputs: [],
        changeOutputs: [{
          address: wallet._wallet.migratedFrom,
          amount: outputAmount
        }]
      });

      sinon.stub(coin, 'verifyAddress')
      .throws(new errors.UnexpectedAddressError('test error'));


      const parsedTransaction = yield coin.parseTransaction({ txParams: {}, txPrebuild: {}, wallet, verification });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: wallet._wallet.migratedFrom,
        amount: outputAmount,
        external: false
      });

      coin.explainTransaction.restore();
      coin.verifyAddress.restore();
    }));

    it('should classify outputs which spend to addresses not on the wallet as external', co(function *() {
      const externalAddress = 'external_address';
      sinon.stub(coin, 'explainTransaction')
      .returns({
        outputs: [{
          address: externalAddress,
          amount: outputAmount
        }],
        changeOutputs: []
      });

      sinon.stub(coin, 'verifyAddress')
      .throws(new errors.UnexpectedAddressError('test error'));

      const parsedTransaction = yield coin.parseTransaction({ txParams: {}, txPrebuild: {}, wallet, verification });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: externalAddress,
        amount: outputAmount,
        external: true
      });

      coin.explainTransaction.restore();
      coin.verifyAddress.restore();
    }));

    it('should accept a custom change address', co(function *() {

      const changeAddress = '33a9a4TTT47i2VSpNZA3YT7v3sKYaZFAYz';
      const outputAmount = 10000;
      const recipients = [];

      sinon.stub(coin, 'explainTransaction')
        .returns({
          outputs: [],
          changeOutputs: [{
            address: changeAddress,
            amount: outputAmount
          }]
        });

      const parsedTransaction = yield coin.parseTransaction({ txParams: { changeAddress, recipients }, txPrebuild: {}, wallet, verification });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: changeAddress,
        amount: outputAmount,
        external: false
      });

      coin.explainTransaction.restore();
    }));


  });

  describe('Recover Wallet:', () => {

    let coin, bitgo;

    before(() => {
      bitgo = new TestBitGo({ env: 'mock' });
      coin = bitgo.coin('tbtc');
    });


    it('should construct a recovery transaction', co(function *() {

      // Initialize constants from a real testnet bitgo wallet that once contained real tbtc unspents
      const userKey = '{"iv":"OVZx6VlJtv74kyE9gi5c0A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"gY6e6MieSZ4=","ct":"O64y1HhJWxbST1 /KfiRXpSDBl3/d+Grphpq9IhWrXKI2m/V0H1fxRQPj4KCoCV0veEUAvvgSfi49vksEZ0PdXI66umlqWnTahqyQgddBiT05E8yB3HWzVBvwIoMfkL9acQhnL7phjwupZRy73EzeGEX9burWx3w="}';
      const backupKey = '{"iv":"sFkDFraiYrF6L+FNkN7gAQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"SIQYthT9wnw=","ct":"szZdOYRaeaDmHir1f21lC37z2taPNFCNYTUVURBOj19j3KGgMZY8VhWt+StS9U9qZN+kl4LshuQ1IP9oIbL0zyVC/mgfEcgOemgeC/PBACzTtcUy/qyDvv1TXGeqJWXVIuPlpLugTUAYm8B3C2lKloOawfhbWd4="}';
      const walletPassphrase = 'bitconnectisthefutureofmonee';
      const bitgoKey = 'xpub661MyMwAqRbcFQg4uLavkkbf4nAPU9xvyHtFC4FgRgTrcGi3HSVWKqpnW8nujw7sAyqy3gUXNXLWunR82P6JjoC7NoZ3ustoXJTvT7rxbmy';
      const recoveryDestination = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
      const scan = 2;

      // Nock all the external api calls that gather info about the wallet
      // We have lots of empty addresses, because the code queries for possible addresses in the wallet one by one
      const emptyAddrs = ['2N42muVaEhvcyMRr7pmFPnrmprdmWCUvhy7', '2N2b2yNryWVbMjvXFq7RbaQ2xbGhmAuBQM7', '2NBs5i2APw3XSvfch7rHirYC6AxehYizCU9', '2NEFHeSYnHVt4t2KqwKz1AZqhpcx2yGoe38', '2N4iR1AweHV8wmc7VPBb3tRnweQs1fSW3dB', '2N1ir7htudeFEWGhyfXGL7LNKzoFrDS62bQ', '2NBpZak1Tz1cpLhg6ZapeTSHkhq91GwMYFo', '2N93AW6R6eLan8rfB715oCse9P6pexfK3Tn', '2NEZiLrBnTSrwNuVuKCXcAi9AL6YSr1FYqY'];
      emptyAddrs.forEach(function(addr) {
        nock('https://testnet-api.smartbit.fakeurl/v1')
        .get('/blockchain/address/' + addr)
        .reply(200, JSON.parse('{"success":true, "address":{"address":"' + addr + '", "total":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "confirmed":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "unconfirmed":{"received":"0", "received_int":0, "spent":"0", "spent_int":0, "balance":"0", "balance_int":0, "input_count":0, "output_count":0, "transaction_count":0}, "multisig":{"confirmed":{"balance":"0", "balance_int":0},"unconfirmed":{"balance":"0","balance_int":0}}}}'));
      });
      nock('https://testnet-api.smartbit.fakeurl/v1')
      .get('/blockchain/address/2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws')
      .reply(200, JSON.parse('{"success":true,"address":{"address":"2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws","total":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"confirmed":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"unconfirmed":{"received":"0.00000000","received_int":0,"spent":"0.00000000","spent_int":0,"balance":"0.00000000","balance_int":0,"input_count":0,"output_count":0,"transaction_count":0},"multisig":{"confirmed":{"balance":"0.00000000","balance_int":0},"unconfirmed":{"balance":"0.00000000","balance_int":0}},"transaction_paging":{"valid_sort":["txindex"],"limit":10,"sort":"txindex","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"transactions":[{"txid":"9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0","hash":"4458cd6cf3a0f48ced99eee4cd6130090380b12747a5196c12355c289d2e00da","block":1452730,"confirmations":7,"version":"1","locktime":1452730,"time":1547682765,"first_seen":1547682684,"propagation":null,"double_spend":false,"size":406,"vsize":214,"input_amount":"0.00099455","input_amount_int":99455,"output_amount":"0.00098910","output_amount_int":98910,"fee":"0.00000545","fee_int":545,"fee_size":"2.54672897","coinbase":false,"input_count":1,"inputs":[{"addresses":["2NCWbbQ5tpKQR2PBVHFst66JcuyWGMPjUKR"],"value":"0.00099455","value_int":99455,"txid":"0b45811cc201ddadee6e5c25a7e25776685b08d9252876c36f2148fc3b997b64","vout":1,"script_sig":{"asm":"00203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e","hex":"2200203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e"},"type":"scripthash","witness":["","304502210095abe38994c3fa7639fba8a3e780b8ca8ed17ac105cd4cd2af7e53b1783a03fa0220708288caad950e2da3b3f00d3f4dbc91433a8a79e6c4539ffd7e7fb5dad75b2b01","3045022100ebf6aa59e21b5707da9e8432dfc0ba53e4bc4130cb974ee6e64e43faf939002802200273e05dcad74caf0ae565be49bb2bc92056782f6031f160c8a58de2e943133e01","52210237ecd62674a320eceee0b8e0497d89c079291ec1622ba1af20b3f93e66a912b421037850684fef0ecc45be7f5113252638c08a5f3d82041e91c40ea3aa6fdd6a0a682103897f5410bf67c77cb5cb89249c5a7393086e98bb09ffd9477bfaea09750c14bd53ae"],"sequence":4294967295}],"output_count":2,"outputs":[{"addresses":["2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws"],"value":"0.00020000","value_int":20000,"n":0,"script_pub_key":{"asm":"OP_HASH160 9f13f940a9461ac6e5393859faca8c513f93cd6e OP_EQUAL","hex":"a9149f13f940a9461ac6e5393859faca8c513f93cd6e87"},"req_sigs":1,"type":"scripthash","spend_txid":null},{"addresses":["2MskQ8f8D4fD6Ujg14iKnzHx5yBwe2V7PrU"],"value":"0.00078910","value_int":78910,"n":1,"script_pub_key":{"asm":"OP_HASH160 058487ef5864d069fc62502c1c4417bed48a8aa7 OP_EQUAL","hex":"a914058487ef5864d069fc62502c1c4417bed48a8aa787"},"req_sigs":1,"type":"scripthash","spend_txid":"8040382653ee766f6c82361c8a19b333702fbb3faabc87e7b5fa0d6c9b8aa387"}],"tx_index":48676632,"block_index":30}]}}'))
      nock('https://testnet-api.smartbit.fakeurl/v1')
      .get('/blockchain/address/2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp')
      .reply(200, JSON.parse('{"success":true,"address":{"address":"2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp","total":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"confirmed":{"received":"0.00020000","received_int":20000,"spent":"0.00000000","spent_int":0,"balance":"0.00020000","balance_int":20000,"input_count":1,"output_count":0,"transaction_count":1},"unconfirmed":{"received":"0.00000000","received_int":0,"spent":"0.00000000","spent_int":0,"balance":"0.00000000","balance_int":0,"input_count":0,"output_count":0,"transaction_count":0},"multisig":{"confirmed":{"balance":"0.00000000","balance_int":0},"unconfirmed":{"balance":"0.00000000","balance_int":0}},"transaction_paging":{"valid_sort":["txindex"],"limit":10,"sort":"txindex","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"transactions":[{"txid":"9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0","hash":"4458cd6cf3a0f48ced99eee4cd6130090380b12747a5196c12355c289d2e00da","block":1452730,"confirmations":7,"version":"1","locktime":1452730,"time":1547682765,"first_seen":1547682684,"propagation":null,"double_spend":false,"size":406,"vsize":214,"input_amount":"0.00099455","input_amount_int":99455,"output_amount":"0.00098910","output_amount_int":98910,"fee":"0.00000545","fee_int":545,"fee_size":"2.54672897","coinbase":false,"input_count":1,"inputs":[{"addresses":["2NCWbbQ5tpKQR2PBVHFst66JcuyWGMPjUKR"],"value":"0.00099455","value_int":99455,"txid":"0b45811cc201ddadee6e5c25a7e25776685b08d9252876c36f2148fc3b997b64","vout":1,"script_sig":{"asm":"00203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e","hex":"2200203b311a23f682e93b3a93bba8155aa9d15876cfec1aa9056400307799bad3c11e"},"type":"scripthash","witness":["","304502210095abe38994c3fa7639fba8a3e780b8ca8ed17ac105cd4cd2af7e53b1783a03fa0220708288caad950e2da3b3f00d3f4dbc91433a8a79e6c4539ffd7e7fb5dad75b2b01","3045022100ebf6aa59e21b5707da9e8432dfc0ba53e4bc4130cb974ee6e64e43faf939002802200273e05dcad74caf0ae565be49bb2bc92056782f6031f160c8a58de2e943133e01","52210237ecd62674a320eceee0b8e0497d89c079291ec1622ba1af20b3f93e66a912b421037850684fef0ecc45be7f5113252638c08a5f3d82041e91c40ea3aa6fdd6a0a682103897f5410bf67c77cb5cb89249c5a7393086e98bb09ffd9477bfaea09750c14bd53ae"],"sequence":4294967295}],"output_count":2,"outputs":[{"addresses":["2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws"],"value":"0.00020000","value_int":20000,"n":0,"script_pub_key":{"asm":"OP_HASH160 9f13f940a9461ac6e5393859faca8c513f93cd6e OP_EQUAL","hex":"a9149f13f940a9461ac6e5393859faca8c513f93cd6e87"},"req_sigs":1,"type":"scripthash","spend_txid":null},{"addresses":["2MskQ8f8D4fD6Ujg14iKnzHx5yBwe2V7PrU"],"value":"0.00078910","value_int":78910,"n":1,"script_pub_key":{"asm":"OP_HASH160 058487ef5864d069fc62502c1c4417bed48a8aa7 OP_EQUAL","hex":"a914058487ef5864d069fc62502c1c4417bed48a8aa787"},"req_sigs":1,"type":"scripthash","spend_txid":"8040382653ee766f6c82361c8a19b333702fbb3faabc87e7b5fa0d6c9b8aa387"}],"tx_index":48676632,"block_index":30}]}}'))
      nock('https://testnet-api.smartbit.fakeurl')
      .get('/v1/blockchain/address/2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws/unspent')
      .reply(200, JSON.parse('{"success":true,"paging":{"valid_sort":["id"],"limit":10,"sort":"id","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"unspent":[{"addresses":["2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws"],"value":"0.00020000","value_int":20000,"txid":"9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0","n":0,"script_pub_key":{"asm":"OP_HASH160 9f13f940a9461ac6e5393859faca8c513f93cd6e OP_EQUAL","hex":"a9149f13f940a9461ac6e5393859faca8c513f93cd6e87"},"req_sigs":1,"type":"scripthash","confirmations":10,"id":129988439}]}'))
      nock('https://testnet-api.smartbit.fakeurl')
      .get('/v1/blockchain/address/2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp/unspent')
      .reply(200, JSON.parse('{"success":true,"paging":{"valid_sort":["id"],"limit":10,"sort":"id","dir":"desc","prev":null,"next":null,"prev_link":null,"next_link":null},"unspent":[{"addresses":["2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp"],"value":"0.00041000","value_int":41000,"txid":"8040382653ee766f6c82361c8a19b333702fbb3faabc87e7b5fa0d6c9b8aa387","n":1,"script_pub_key":{"asm":"OP_HASH160 334ea8adc3423478229444603ab27f02de2550ef OP_EQUAL","hex":"a914334ea8adc3423478229444603ab27f02de2550ef87"},"req_sigs":1,"type":"scripthash","confirmations":10,"id":129988450}]}'))
      nock('https://bitcoinfees.21.co')
      .get('/api/v1/fees/recommended')
      .reply(200, { fastestFee: 20, halfHourFee: 20, hourFee: 6 })

      // Note: when running this test we expect to see a message in the console: "Could not verify recovery transaction Nock..... "url": ... /decodetx ... etc"
      // This is expected. We are deliberately *not* nocking this decodeTx api call because it would be overwriting the transaction we just made
      // and we want to make sure the code is constructing the transaction properly

      // The transaction we create in this test was originally in a BitGo testnet wallet, and contains two unspents: one is segwit, one is non-segwit
      // On the first time running the test, we did not nock any external api calls
      // After building this test, the testnet transaction was broadcast successfully
      // The external api calls have now been replaced with nocks based on what they used to return, and the constructed transaction has been saved as "expectedTxHex"

      const params = { userKey, backupKey, walletPassphrase, bitgoKey, recoveryDestination, scan };
      const tx = yield coin.recover(params);
      const expectedTxHex = '01000000000102e0f7fb528646bf0dc3a717a1680fd2b8ca8dfd39f690adcdc194cea8f7cd579a00000000fc004730440220608bd5a8533244185a6b53fc4d466a82bc604980e3a5acad5dfda285651753cc02207ae73febb467eec90968e41d2c158181648bda7bab42ff376cdf890d39a07b5d0147304402200974952d2742a338e2bea84425ada7680939d4d5dec1136dbfdff3dd008e0581022079c8c74c4c18c1b816c01468d112a6cbf3d66186f3a8bf0abbe30d22d6905ecb014c695221038c3ed7682e0999fbbb9f2a06348c9406f20a4c6acfa6015aa0049dae8d846dfc2102bdb5d7ac2a8775dcd8eb31bdea85ec82f6019f9580084dc62e905e741a34e5af2103fb333c62e4a349acecb98d63c307bb3a4cf439c71b3a6dce29ab9cfa65ee2ce153aeffffffff87a38a9b6c0dfab5e787bcaa3fbb2f7033b3198a1c36826c6f76ee53263840800100000023220020d397ea8831c203b211445a981bcbb643f464b826cf3a1226842ce956baf9bcd2ffffffff0160df00000000000017a914c1cf4712d6435cb99851d1e47c3fcef34c8681ed87000400483045022100b3dd92fe9d078a98cdb2b2b59c5d8c78a3fa44e48c54659e5e578215fdffeefb022073b5be09e7b1cab7ad63b6490121d7b6d495a02471a10d71dd4807fde9216ed801483045022100a9f204b05acd968a0054ebfc68a5387b0bb54d47c60eaeb9a650f855f08d2cd502206333ff64198a29bce8cd97a62a5c56fc014b4e60d3ecfdd26f9c2e6f91c2a7bf01695221025e8f5d3dc7e2247a05b7434cd57f985a782d858762ab73bb31f27b4e9cb006cb21036cca9315316b6a54c3b5de33d30d374575c5a30f9b0629e95a37abacf2d878fd2103b7a4d470b12a223518c49d26e2b587c03382ab9c6f7c00e428f8985b57abc2be53ae00000000';
      tx.transactionHex.should.equal(expectedTxHex);

    }));


  });
});
