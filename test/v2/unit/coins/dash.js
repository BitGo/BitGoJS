require('should');

const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');
const TestV2BitGo = require('../../../lib/test_bitgo');
const Wallet = require('../../../../src/v2/wallet');

describe('DASH:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should test derivation-related functions', () => {

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
    let testCoin;
    before(() => {
      coin = bitgo.coin('dash');
      testCoin = bitgo.coin('tdash');
    });

    describe('Should test address generation', () => {

      it('should generate standard non-segwit address', () => {
        const generatedAddress = coin.generateAddress({ keychains });
        const generatedTestAddress = testCoin.generateAddress({ keychains });

        [generatedAddress, generatedTestAddress].map((currentAddress) => {
          currentAddress.chain.should.equal(0);
          currentAddress.index.should.equal(0);
          currentAddress.coinSpecific.outputScript.should.equal('a9141e57a925dd863a86af341037e700862bf66bf7b687');
          currentAddress.coinSpecific.redeemScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
        });

        generatedAddress.address.should.equal('7VB63GUpUySAWWSfhztFGCHxM7URDayyVi');
        generatedTestAddress.address.should.equal('8hBtzbNgcWpnxorvnFtCia7KEdFFLmoiFj');
      });

      it('should generate custom chain non-segwit address', () => {
        const generatedAddress = coin.generateAddress({ keychains, chain: 1, index: 113 });
        const generatedTestAddress = testCoin.generateAddress({ keychains, chain: 1, index: 113 });

        [generatedAddress, generatedTestAddress].map((currentAddress) => {
          currentAddress.chain.should.equal(1);
          currentAddress.index.should.equal(113);
          currentAddress.coinSpecific.outputScript.should.equal('a91443457880e5e29555d6ad16bc82ef53891d6512b087');
          currentAddress.coinSpecific.redeemScript.should.equal('522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753ae');
        });

        generatedAddress.address.should.equal('7YYMFW1DPn2fExJZS4f92Cbb7pRocBiduW');
        generatedTestAddress.address.should.equal('8kZACpu5XKRHhFipWKf6UaQx1LCdh4iRMu');
      });

      it('should generate 3/3 non-segwit address', () => {
        const generatedAddress = coin.generateAddress({ keychains, threshold: 3 });
        const generatedTestAddress = testCoin.generateAddress({ keychains, threshold: 3 });

        [generatedAddress, generatedTestAddress].map((currentAddress) => {
          currentAddress.chain.should.equal(0);
          currentAddress.index.should.equal(0);
          currentAddress.coinSpecific.outputScript.should.equal('a91476dce7beb23d0e0d53edf5895716d4c80dce609387');
          currentAddress.coinSpecific.redeemScript.should.equal('5321037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
        });

        generatedAddress.address.should.equal('7dF9896EVYHzc6K76Go3D8yQj6i2yy4SvW');
        generatedTestAddress.address.should.equal('8qFx5Tz6d5gd4PjNAXnzfWnmccUs9YmxqR');
      });
    });

    describe('Should test transaction signing', () => {

      it('should sign transaction', co(function *() {
        const wallet = new Wallet(bitgo, testCoin, {});
        const prebuild = {
          txHex: '0100000001b382e9c5349f84400afb0417bdaa36ea32331d5b76a0ee9d250ce3691e40bb610000000000ffffffff01005cf7f10000000017a91443457880e5e29555d6ad16bc82ef53891d6512b08700000000',
          txInfo: {
            unspents: [
              {
                chain: 0,
                index: 0,
                redeemScript: '5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae'
              }
            ]
          }
        };

        const halfSigned = yield wallet.signTransaction({
          txPrebuild: prebuild,
          prv: keychains[0].prv
        });
        halfSigned.txHex.should.equal('0100000001b382e9c5349f84400afb0417bdaa36ea32331d5b76a0ee9d250ce3691e40bb6100000000b6004730440220467c83751870257a8f152988e8363b05fdcc42addabc6c1bc763d22bd2410309022057cc7a541a408880430c8cfe9abe23bcf27964e027cdd0a63f19eda4777423190100004c695221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853aeffffffff01005cf7f10000000017a91443457880e5e29555d6ad16bc82ef53891d6512b08700000000');

        const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
        const fullySigned = yield wallet.signTransaction({
          txPrebuild: halfSignedPrebuild,
          prv: keychains[2].prv,
          isLastSignature: true
        });

        // http://test.insight.masternode.io:3001/tx/8a69678157b312d59b19673ddbf53185c9bffdff816ab894dd81413a3c81ffbd
        fullySigned.txHex.should.equal('0100000001b382e9c5349f84400afb0417bdaa36ea32331d5b76a0ee9d250ce3691e40bb6100000000fdfd00004730440220467c83751870257a8f152988e8363b05fdcc42addabc6c1bc763d22bd2410309022057cc7a541a408880430c8cfe9abe23bcf27964e027cdd0a63f19eda47774231901483045022100d61f490433b43a4c2264aef93ce9dff6a7ef05fd114a3685d882511d8a9a381802204abf5c9cd6e1ce20a4b2658310cc1740c80a1ec1ceabce48d6e45c464d1ee85a014c695221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853aeffffffff01005cf7f10000000017a91443457880e5e29555d6ad16bc82ef53891d6512b08700000000');
      }));
    });

  });

});
