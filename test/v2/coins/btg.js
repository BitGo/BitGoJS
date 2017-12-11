require('should');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('BTG:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should sign transaction', function() {
    it('should successfully sign a prebuilt transaction', function() {
      // TODO: BG-2714 (add nonsegwit and segwit input signing regression test

      // const btg = bitgo.coin('tbtg');
      // const signedTransaction = btg.signTransaction({
      //   txPrebuild: {
      //     txHex: '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000',
      //     txInfo: {
      //       unspents: [{
      //         address: '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
      //         chain: 0,
      //         index: 13,
      //         value: 504422,
      //         txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
      //         redeemScript: '5221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253ae'
      //       }]
      //     }
      //   },
      //   prv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k'
      // });
      // signedTransaction.txHex.should.equal('020000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b700483045022100f8f241c66964b0e0bb543acc43cbe7a3760047a6554721a4ced6f13a485f539402206ad0436b9870779ee43a95b6a66329c9bce318e247efcec875fe3f4f80a8ba0c4100004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
    });

    it('should fail to sign a prebuilt transaction with out a txPrebuild', function() {
      const btg = bitgo.coin('tbtg');
      try {
        btg.signTransaction({
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
    });

    it('should fail to sign a prebuilt transaction with if the length of unspents does not match the number of inputs in the transaction', function() {
      const btg = bitgo.coin('tbtg');
      try {
        btg.signTransaction({
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
    });

    it('should fail to sign a prebuilt transaction with out passing in the prv', function() {
      const btg = bitgo.coin('tbtg');
      try {
        btg.signTransaction({
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
    });

    it('should fail to sign if txPrebuild is not an object', function() {
      const btg = bitgo.coin('tbtg');
      try {
        btg.signTransaction({
          txPrebuild: '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000',
          prv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k'
        });

        // it shouldn't be able to reach here, if it does cause the test to fail
        'word1'.should.equal('word2');
      } catch (e) {
        e.message.should.equal('txPrebuild must be an object, got type string');
      }
    });

    it('should fail to sign if prv is not a string', function() {
      const btg = bitgo.coin('tbtg');
      try {
        btg.signTransaction({
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
    });

  });
});
