import 'should';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
const { Codes } = require('@bitgo/unspents');

import { TestBitGo } from '../../../lib/test_bitgo';

describe('BTG:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should sign transaction', function() {
    it('should successfully sign a prebuilt transaction', co(function *() {
      const btg = bitgo.coin('tbtg');
      const signedTransaction = yield btg.signTransaction({
        txPrebuild: {
          txHex: '0100000003045a288365350088034b1d894fc1e800e52fb665d21fbf169fbf16475726ee030000000000ffffffffca9fd5670ba2aeed34a0e4c28751b18d1cbdc3bd5a79d3b9bb00a3f67b557c420100000000ffffffffca9fd5670ba2aeed34a0e4c28751b18d1cbdc3bd5a79d3b9bb00a3f67b557c420000000000ffffffff023cbc16000000000017a914ad8a56d62362745789ba6f3c2864a02749e07dac87808d5b000000000017a914976a23395c9f172ab626b8e8278d37436e25472b8700000000',
          txInfo: {
            nP2SHInputs: 1,
            nSegwitInputs: 2,
            nOutputs: 2,
            unspents: [
              {
                chain: 0,
                index: 2,
                redeemScript: '522103d6cc9fc9fa71c191f176c97022a696732eb22da71b42702666b773457e868d152103b2bd4e85c2548abf82a4c2d199c9922a53effb54096d0cc2a8251630c0a6057421021c9d4c7eabc4c7da5169869fc68135f4606b2eafb9e89241ceb98e676cb8bf7153ae',
                id: '03ee26574716bf9f16bf1fd265b62fe500e8c14f891d4b038800356583285a04:0',
                address: 'AXAjRzrDzRxqnMx1tT4JAZcEzKQzb3veZV',
                value: 2000000
              },
              {
                chain: 10,
                index: 1,
                redeemScript: '002003433067d8eae35e8801a1aac1780dcf94af49318c378eaf1fd98da9bf900afe',
                witnessScript: '52210367ddf9289336b6e452c14fb4a65b42968575a6e2dc86cfc808946eb59b534f772102b5a8d73b2c03d58dc730cba6808bf894327cfa0d4528cae4454fdfba246b046b2103ec85f23614e7b4e946a8c23f722569cf68f7dde686c16c505f5297d4e850b3f053ae',
                id: '427c557bf6a300bbb9d3795abdc3bd1c8db15187c2e4a034edaea20b67d59fca:1',
                address: 'AYzkiWNzbeRx8f6aHTBaSp7swRuWVwnKms',
                value: 3000000
              },
              {
                chain: 11,
                index: 4,
                redeemScript: '00207f3e88dbd60606c770620ac059f9fd7452de21136be18d6287ca6a9e8b9c5bd3',
                witnessScript: '522102b25626e4b98d3617e1108559735f796a06eaedc1bf3d418eedbea6a83be6dca721031a472d90be54b32b858f8d5f675120f3b1d95b8f828d38becb0325b34cb368692103d982c2fd1aa7779ff436620d45f610237e04f487b025d0e27d03499995733d0253ae',
                id: '427c557bf6a300bbb9d3795abdc3bd1c8db15187c2e4a034edaea20b67d59fca:0',
                address: 'AQrcPkTRbQqCKBYiHnPyDaF23KDL3oS6ij',
                value: 2494795
              }
            ],
            changeAddresses: [
              'AXbUGfKQqoiK8PYLPaatZszgf1kdC2FSyo'
            ]
          }
        },
        prv: 'xprv9s21ZrQH143K2FeFRHw2schwv3ia7MfXqMsVH9soVEoYFwCssMMuHfABq8o7cV25FSbo34iDbY3efYovh3D95B5fWb82nSQJi8DdrPqg3Wx'
      });
      signedTransaction.txHex.should.equal('02000000000103045a288365350088034b1d894fc1e800e52fb665d21fbf169fbf16475726ee0300000000b60047304402205c65ec7cafac171b2412430aa1e8178ace9d480d8322855783266c7892d09fdc022046ee553825f95723d3c9cddd32de1ae01fe6df9766517bddf72c1b9e147f469d4100004c69522103d6cc9fc9fa71c191f176c97022a696732eb22da71b42702666b773457e868d152103b2bd4e85c2548abf82a4c2d199c9922a53effb54096d0cc2a8251630c0a6057421021c9d4c7eabc4c7da5169869fc68135f4606b2eafb9e89241ceb98e676cb8bf7153aeffffffffca9fd5670ba2aeed34a0e4c28751b18d1cbdc3bd5a79d3b9bb00a3f67b557c42010000002322002003433067d8eae35e8801a1aac1780dcf94af49318c378eaf1fd98da9bf900afeffffffffca9fd5670ba2aeed34a0e4c28751b18d1cbdc3bd5a79d3b9bb00a3f67b557c4200000000232200207f3e88dbd60606c770620ac059f9fd7452de21136be18d6287ca6a9e8b9c5bd3ffffffff023cbc16000000000017a914ad8a56d62362745789ba6f3c2864a02749e07dac87808d5b000000000017a914976a23395c9f172ab626b8e8278d37436e25472b870005004830450221008f46173ba312632c0482386a69d07d549ff4e4ed2fbb327f17576d2387a449f602202bd3dba99b3c3527da0bc58a40931ca5eb33ef47208daebf2d6e4704bc8bcc0b4100006952210367ddf9289336b6e452c14fb4a65b42968575a6e2dc86cfc808946eb59b534f772102b5a8d73b2c03d58dc730cba6808bf894327cfa0d4528cae4454fdfba246b046b2103ec85f23614e7b4e946a8c23f722569cf68f7dde686c16c505f5297d4e850b3f053ae050047304402205cd9cd94f651cc60d12284d9346bea938f34940f3d329f4e2738a8f46ab2b011022044dcd6eeb2bc232a49bf86cbe9124c11c27d15dbccfb50534c2258639ca7b28241000069522102b25626e4b98d3617e1108559735f796a06eaedc1bf3d418eedbea6a83be6dca721031a472d90be54b32b858f8d5f675120f3b1d95b8f828d38becb0325b34cb368692103d982c2fd1aa7779ff436620d45f610237e04f487b025d0e27d03499995733d0253ae00000000');
      // TODO: see why signature length increased by one byte
      // signedTransaction.txHex.should.equal('02000000000103045a288365350088034b1d894fc1e800e52fb665d21fbf169fbf16475726ee0300000000b7004830450221009c58b216b8ed6c097b01fdef26d44cfe01ab09e829f1696138b3990facf7d320022055f19347a1d562f6d09fd9a51655fc36ea3eb2b393dcfc36a2f876124c1dac864100004c69522103d6cc9fc9fa71c191f176c97022a696732eb22da71b42702666b773457e868d152103b2bd4e85c2548abf82a4c2d199c9922a53effb54096d0cc2a8251630c0a6057421021c9d4c7eabc4c7da5169869fc68135f4606b2eafb9e89241ceb98e676cb8bf7153aeffffffffca9fd5670ba2aeed34a0e4c28751b18d1cbdc3bd5a79d3b9bb00a3f67b557c42010000002322002003433067d8eae35e8801a1aac1780dcf94af49318c378eaf1fd98da9bf900afeffffffffca9fd5670ba2aeed34a0e4c28751b18d1cbdc3bd5a79d3b9bb00a3f67b557c4200000000232200207f3e88dbd60606c770620ac059f9fd7452de21136be18d6287ca6a9e8b9c5bd3ffffffff023cbc16000000000017a914ad8a56d62362745789ba6f3c2864a02749e07dac87808d5b000000000017a914976a23395c9f172ab626b8e8278d37436e25472b87000500483045022100edadfad376a80d8b51be146e28ee9045f58c551045786b9dfd7f0ddf115c00d502202e6b25683640e5e9b1bfaab7d33d13c868a890fbf17b2122828e4d0ed4d2f5e54100006952210367ddf9289336b6e452c14fb4a65b42968575a6e2dc86cfc808946eb59b534f772102b5a8d73b2c03d58dc730cba6808bf894327cfa0d4528cae4454fdfba246b046b2103ec85f23614e7b4e946a8c23f722569cf68f7dde686c16c505f5297d4e850b3f053ae050047304402205e1d405c49b83e9f7dd355c2ae9249f0304323cbe3c22de84aeed009ab0f4bd20220754a715e46458d152cce66d38ca88ccf953661d228bd72efe6a914873d020b6541000069522102b25626e4b98d3617e1108559735f796a06eaedc1bf3d418eedbea6a83be6dca721031a472d90be54b32b858f8d5f675120f3b1d95b8f828d38becb0325b34cb368692103d982c2fd1aa7779ff436620d45f610237e04f487b025d0e27d03499995733d0253ae00000000');
    }));

    it('should fail to sign a prebuilt transaction with out a txPrebuild', co(function *() {
      const btg = bitgo.coin('tbtg');
      try {
        yield btg.signTransaction({
          txAfterbuild: {
            txHex: '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000',
            txInfo: {
              unspents: [{
                address: '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
                chain: 0,
                index: 13,
                value: 504422,
                txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
                redeemScript: '5221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253ae'
              }]
            }
          },
          walletPassphrase: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k'
        });

        // it shouldn't be able to reach here, if it does cause the test to fail
        'word1'.should.equal('word2');
      } catch (e) {
        e.message.should.equal('missing txPrebuild parameter');
      }
    }));

    it('should fail to sign a prebuilt transaction with if the length of unspents does not match the number of inputs in the transaction', co(function *() {
      const btg = bitgo.coin('tbtg');
      try {
        yield btg.signTransaction({
          txPrebuild: {
            txHex: '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000',
            txInfo: {
              unspents: [
                {
                  address: '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
                  chain: 0,
                  index: 13,
                  value: 504422,
                  txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
                  redeemScript: '5221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253ae'
                },
                {
                  address: '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
                  chain: 0,
                  index: 13,
                  value: 504422,
                  txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
                  redeemScript: '5221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253ae'
                }
              ]
            }
          },
          walletPassphrase: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k'
        });

        // it shouldn't be able to reach here, if it does cause the test to fail
        'word1'.should.equal('word2');
      } catch (e) {
        e.message.should.equal('length of unspents array should equal to the number of transaction inputs');
      }
    }));

    it('should fail to sign a prebuilt transaction with out passing in the prv', co(function *() {
      const btg = bitgo.coin('tbtg');
      try {
        yield btg.signTransaction({
          txPrebuild: {
            txHex: '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000',
            txInfo: {
              unspents: [{
                address: '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
                chain: 0,
                index: 13,
                value: 504422,
                txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
                redeemScript: '5221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253ae'
              }]
            }
          },
          walletPassphrase: 'not my private key'
        });

        // it shouldn't be able to reach here, if it does cause the test to fail
        'word1'.should.equal('word2');
      } catch (e) {
        e.message.should.equal('missing prv parameter to sign transaction');
      }
    }));

    it('should fail to sign if txPrebuild is not an object', co(function *() {
      const btg = bitgo.coin('tbtg');
      try {
        yield btg.signTransaction({
          txPrebuild: '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000',
          prv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k'
        });

        // it shouldn't be able to reach here, if it does cause the test to fail
        'word1'.should.equal('word2');
      } catch (e) {
        e.message.should.equal('txPrebuild must be an object, got type string');
      }
    }));

    it('should fail to sign if prv is not a string', co(function *() {
      const btg = bitgo.coin('tbtg');
      try {
        yield btg.signTransaction({
          txPrebuild: {
            txHex: '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000',
            txInfo: {
              unspents: [{
                address: '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
                chain: 0,
                index: 13,
                value: 504422,
                txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
                redeemScript: '5221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253ae'
              }]
            }
          },
          prv: ['xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k']
        });

        // it shouldn't be able to reach here, if it does cause the test to fail
        'word1'.should.equal('word2');
      } catch (e) {
        e.message.should.equal('prv must be a string, got type object');
      }
    }));

  });

  describe('Should test address generation', () => {

    const keychains = [
      {
        pub: 'xpub661MyMwAqRbcGiQhVk1J7cD1YodF9tc5Y1B8vpTjjB1pcB1J1m1QX8fMtYP2sYqFmW6J2ra69tNoARKjvTGo9cGUrbPbJdjwrSzGGzPzWWS',
        prv: 'xprv9s21ZrQH143K4ELEPiUHkUGGzmnkkRtEAnFY8S48AqUqjNg9UDh9yLLt3FcfATyCjbsMB9JCGHAD8MeBTAK1P7trFppkoswu5ZAsHYASfbk'
      },
      {
        pub: 'xpub661MyMwAqRbcFzLXuganogQvd7MrefQQqCcJP2ZDumnCdQecf5cw1P1nD5qBz8SNS1yCLSC9VqpNUWnQU3V6qmnPt2r21oXhicQFzPA6Lby',
        prv: 'xprv9s21ZrQH143K3WG4of3nSYUC55XNFCgZTyghae9cMSFDkcKU7YJgTahJMpdTY9CjCcjgSo2TJ635uUVx176BufUMBFpieKYVJD9J3VvrGRm'
      },
      {
        pub: 'xpub661MyMwAqRbcFHpwWrzPB61U2CgBmdD21WNVM1JKUn9rEExkoGE4yafUVFbPSd78vdX8tWcEUQWaALFkU9fUbUM4Cc49DKEJSCYGRnbzCym',
        prv: 'xprv9s21ZrQH143K2okUQqTNox4jUAqhNAVAeHStYcthvScsMSdcFiupRnLzdxzfJithak5Zs92FQJeeJ9Jiya63KfUNxawuMZDCp2cGT9cdMKs'
      }
    ];

    let coin;
    before(() => {
      coin = bitgo.coin('btg');
    });

    it('should generate standard non-segwit address', () => {
      const generatedAddress = coin.generateAddress({ keychains });
      generatedAddress.chain.should.equal(0);
      generatedAddress.index.should.equal(0);
      generatedAddress.coinSpecific.outputScript.should.equal('a9141e57a925dd863a86af341037e700862bf66bf7b687');
      generatedAddress.coinSpecific.redeemScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      generatedAddress.address.should.equal('AJYJw2ZqTEgJEYRGswDUf5CTkeH2D2zFPC');
    });

    it('should generate custom chain non-segwit address', () => {
      const generatedAddress = coin.generateAddress({ keychains, chain: 1, index: 113 });
      generatedAddress.chain.should.equal(1);
      generatedAddress.index.should.equal(113);
      generatedAddress.coinSpecific.outputScript.should.equal('a91443457880e5e29555d6ad16bc82ef53891d6512b087');
      generatedAddress.coinSpecific.redeemScript.should.equal('522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753ae');
      generatedAddress.address.should.equal('AMua9G6EN3GnxzHAbzzNR5W6XMEQayvF77');
    });

    it('should generate standard segwit address', () => {
      const addressType = Codes.UnspentTypeTcomb('p2shP2wsh');
      const chain = Codes.forType(addressType)[Codes.PurposeTcomb('external')];
      const generatedAddress = coin.generateAddress({ keychains, addressType, chain });
      generatedAddress.chain.should.equal(chain);
      generatedAddress.index.should.equal(0);
      generatedAddress.coinSpecific.outputScript.should.equal('a9147ff13f3faeba4d439ef40604f7c127951e77eb6a87');
      generatedAddress.coinSpecific.redeemScript.should.equal('00207aad7d57b238a09b5daa10ff47c54483b7f2ad47f3f0c0aa230958b9df334260');
      generatedAddress.coinSpecific.witnessScript.should.equal('52210304fcea3fb05f6e8a8fe91db2087bdd13b18102a0b10a77c1fdbb326b0ce7cec421028242a3ea9e20d4e6b78e3f0dde21aff86a623d48322681b203b6827e22d04a9d2102ceec88b222a55ec67d1414b523bcfc0f53eb6ac012ba91744a4ed8eb448d55f753ae');
      generatedAddress.address.should.equal('ATSNTzzorpeYexY2wWj4MA3Uxko6YqsQmh');
    });

    it('should generate 3/3 non-segwit address', () => {
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3 });
      generatedAddress.chain.should.equal(0);
      generatedAddress.index.should.equal(0);
      generatedAddress.coinSpecific.outputScript.should.equal('a91476dce7beb23d0e0d53edf5895716d4c80dce609387');
      generatedAddress.coinSpecific.redeemScript.should.equal('5321037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      generatedAddress.address.should.equal('AScN1uBFToY8L8HiGD8Gc1sv8dWdw4NYN1');
    });

    it('should generate 3/3 custom chain segwit address', () => {
      const addressType = Codes.UnspentTypeTcomb('p2shP2wsh');
      const chain = Codes.forType(addressType)[Codes.PurposeTcomb('external')];
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3, addressType, chain, index: 756 });
      generatedAddress.chain.should.equal(chain);
      generatedAddress.index.should.equal(756);
      generatedAddress.coinSpecific.outputScript.should.equal('a914ad395d176042ce737e4f5b65c0eb5de703a4e80087');
      generatedAddress.coinSpecific.redeemScript.should.equal('0020d15d8d124adb4c213905ebb2cec8517faf38ae0ec4f7b4f1cfa358e6cc06a93d');
      generatedAddress.coinSpecific.witnessScript.should.equal('532102bb8096d5c12e8b0ee50dd2b14f63dd09c8494b5a0a730794a0e392a6f2a3b2a8210366dbf2135105dc65eed5173c1acf1a902fc2e9dd366b9a6fa0e682c0fb4c21a32102bf998121d4d09d4305b025b5d2de8a7e954fe96179a1dfc076ad11ad4751c99e53ae');
      generatedAddress.address.should.equal('AXZoGP21jtz45T9CuhtCUcKQNZGgvwqfdS');
    });

    it('should validate pub key', () => {
      const { pub } = coin.keychains().create();
      coin.isValidPub(pub).should.equal(true);
    });
  });

});
