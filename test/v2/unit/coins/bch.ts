import 'should';

const TestV2BitGo = require('../../../lib/test_bitgo');

describe('BCH:', function() {
  let bitgo;
  let tbch;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    tbch = bitgo.coin('tbch');
  });

  describe('canonical addresses', function() {
    let bch;
    before(function() {
      bch = bitgo.coin('bch');
    });

    // we use mainnet bch so we can reuse the mainnet address examples
    it('should correctly convert addresses', function() {
      // P2PKH cashaddr -> cashaddr
      bch.canonicalAddress('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'cashaddr').should.equal('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');
      // TODO(BG-11325): remove bech32 in future major version release
      bch.canonicalAddress('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'bech32').should.equal('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');

      // P2PKH base58 -> cashaddr
      bch.canonicalAddress('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu', 'cashaddr').should.equal('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');
      // TODO(BG-11325): remove bech32 in future major version release
      bch.canonicalAddress('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu', 'bech32').should.equal('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');

      // P2SH cashaddr -> cashaddr
      bch.canonicalAddress('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq', 'cashaddr').should.equal('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq');
      // TODO(BG-11325): remove bech32 in future major version release
      bch.canonicalAddress('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq', 'bech32').should.equal('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq');

      // P2SH base58 -> cashaddr
      bch.canonicalAddress('3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC', 'cashaddr').should.equal('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq');
      // TODO(BG-11325): remove bech32 in future major version release
      bch.canonicalAddress('3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC', 'bech32').should.equal('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq');

      // no 'bitcoincash:' prefix
      bch.canonicalAddress('ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq', 'cashaddr').should.equal('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq');
      // TODO(BG-11325): remove bech32 in future major version release
      bch.canonicalAddress('ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq', 'bech32').should.equal('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq');

      // P2PKH cashaddr -> base58
      bch.canonicalAddress('bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r', 'base58').should.equal('16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb');

      // P2PKH base58 -> base58
      bch.canonicalAddress('16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb', 'base58').should.equal('16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb');

      // P2SH cashaddr -> base58
      bch.canonicalAddress('bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58').should.equal('3LDsS579y7sruadqu11beEJoTjdFiFCdX4');

      // P2SH base58 -> base58
      bch.canonicalAddress('3LDsS579y7sruadqu11beEJoTjdFiFCdX4', 'base58').should.equal('3LDsS579y7sruadqu11beEJoTjdFiFCdX4');

      // undefined version defaults to base58
      bch.canonicalAddress('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq').should.equal('3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC');

      // all capitalized
      bch.canonicalAddress('bitcoincash:QQQ3728YW0Y47SQN6L2NA30MCW6ZM78DZQRE909M2R', 'base58').should.equal('16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb');

      // testnet addresses
      tbch.canonicalAddress('2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X', 'cashaddr').should.equal('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f');
      // TODO(BG-11325): remove bech32 in future major version release
      tbch.canonicalAddress('2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X', 'bech32').should.equal('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f');
      tbch.canonicalAddress('n3jYBjCzgGNydQwf83Hz6GBzGBhMkKfgL1', 'cashaddr').should.equal('bchtest:qremgr9dr9x5swv82k69qdjzrvdxgkaaesftdp5xla');
      // TODO(BG-11325): remove bech32 in future major version release
      tbch.canonicalAddress('n3jYBjCzgGNydQwf83Hz6GBzGBhMkKfgL1', 'bech32').should.equal('bchtest:qremgr9dr9x5swv82k69qdjzrvdxgkaaesftdp5xla');
      tbch.canonicalAddress('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'cashaddr').should.equal('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f');
      // TODO(BG-11325): remove bech32 in future major version release
      tbch.canonicalAddress('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'bech32').should.equal('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f');
      tbch.canonicalAddress('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'base58').should.equal('2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X');
      tbch.canonicalAddress('prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'base58').should.equal('2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X');
      tbch.canonicalAddress('prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'cashaddr').should.equal('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f');
      // TODO(BG-11325): remove bech32 in future major version release
      tbch.canonicalAddress('prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'bech32').should.equal('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f');
    });

    it('should reject invalid addresses', function() {
      // improperly short data segment
      (() => {
        bch.canonicalAddress('bitcoincash:sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58');
      }).should.throw();

      // mismatched data segment (cashaddr)
      (() => {
        bch.canonicalAddress('bitcoincash:yr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58');
      }).should.throw();

      // double prefix
      (() => {
        bch.canonicalAddress('bitcoincash:bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58');
      }).should.throw();

      // mismatched data segment (base58)
      (() => {
        bch.canonicalAddress('3DDsS579y7sruadqu11beEJoTjdFiFCdX4', 'base58');
      }).should.throw();

      // improper prefix
      (() => {
        bch.canonicalAddress(':qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'base58');
      }).should.throw();

      (() => {
        bch.canonicalAddress('bitcoin:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'base58');
      }).should.throw();

      // mismatched capitalization
      (() => {
        bch.canonicalAddress('bitcoincash:QPM2Qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'cashaddr');
      }).should.throw();

      // TODO(BG-11325): remove bech32 in future major version release
      (() => {
        bch.canonicalAddress('bitcoincash:QPM2Qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'bech32');
      }).should.throw();

      // improper version
      (() => {
        bch.canonicalAddress('bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r', 'blah');
      }).should.throw();

      // undefined address
      (() => {
        bch.canonicalAddress(undefined, 'blah');
      }).should.throw();
    });
  });

  describe('Should sign transaction', function() {
    it('should successfully sign a prebuilt transaction', function() {
      const signedTransaction = tbch.signTransaction({
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
        prv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k'
      });
      signedTransaction.txHex.should.equal('020000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b7004830450221009e63ff1c8b0860073bc06bbce84f20568251a31f7a12c0ce300dc024e416f28202200b0dcb4a3b6b2cda1886ea6c020884907efd517d23d97e84fbf411aa65d280dd4100004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
    });

    it('should fail to sign a prebuilt transaction with out a txPrebuild', function() {
      const tbch = bitgo.coin('tbch');
      try {
        tbch.signTransaction({
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
      const tbch = bitgo.coin('tbch');
      try {
        tbch.signTransaction({
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
      const tbch = bitgo.coin('tbch');
      try {
        tbch.signTransaction({
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
      const tbch = bitgo.coin('tbch');
      try {
        tbch.signTransaction({
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
      const tbch = bitgo.coin('tbch');
      try {
        tbch.signTransaction({
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

    it('should validate pub key', () => {
      const { pub } = tbch.keychains().create();
      tbch.isValidPub(pub).should.equal(true);
    });
  });
});
