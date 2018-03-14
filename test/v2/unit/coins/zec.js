require('should');

const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');
const TestV2BitGo = require('../../../lib/test_bitgo');
const Wallet = require('../../../../src/v2/wallet');

describe('ZEC:', function() {
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
      coin = bitgo.coin('zec');
      testCoin = bitgo.coin('tzec');
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

        generatedAddress.address.should.equal('t3ML4DQcneK887NxcNp2s4dQDgDq8G5XTpD');
        generatedTestAddress.address.should.equal('t29KFG5ivWmjVf5YMJZ2ucFarni4J3NXbWB');
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

        generatedAddress.address.should.equal('t3QhKRe9BZ7icqppW6sokpdhrSvnWV67N1D');
        generatedTestAddress.address.should.equal('t2CgWUKFKRaKzPXQF2cooNFtVZR1gTM8xxM');
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

        generatedAddress.address.should.equal('t3VQ7JHECesyxCxq3m5wf1a5g4D4jweEYrd');
        generatedTestAddress.address.should.equal('t2HPJLxLLXLbKkfQngpwhZCGKAhHuqyqPk4');
      });
    });

    describe('Should test transaction signing', () => {

      it('should sign transaction', co(function *() {

        const wallet = new Wallet(bitgo, testCoin, {});
        const prebuild = {
          txHex: '01000000013f5cdd55fac42f620796ac33f3acbce8417e75fde7457662fdc612c8759d400a0100000000ffffffff01601ce0110000000017a914040c4ab99a665c767adaa50fb28dce2ae514363b8700000000',
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
        halfSigned.txHex.should.equal('01000000013f5cdd55fac42f620796ac33f3acbce8417e75fde7457662fdc612c8759d400a01000000b6004730440220785552c1ce40d5eba426b9a3b0e4e58cb243334f35290902d58746755c13531a02200801731fbda2a334f76b21732a5213b344edc2b966e149301ea688fc0df0abf90100004c695221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853aeffffffff01601ce0110000000017a914040c4ab99a665c767adaa50fb28dce2ae514363b8700000000');

        const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
        const fullySigned = yield wallet.signTransaction({
          txPrebuild: halfSignedPrebuild,
          prv: keychains[2].prv,
          isLastSignature: true
        });

        // https://explorer.testnet.z.cash/tx/372602847af17b4b2df37a9d2d3f6e9fc2d602ccb6240ac4cd8c8d2f89145c9f
        fullySigned.txHex.should.equal('01000000013f5cdd55fac42f620796ac33f3acbce8417e75fde7457662fdc612c8759d400a01000000fdfd00004730440220785552c1ce40d5eba426b9a3b0e4e58cb243334f35290902d58746755c13531a02200801731fbda2a334f76b21732a5213b344edc2b966e149301ea688fc0df0abf901483045022100fa5027215031352af57ad343b6680aa47bbae174abec3450aaaf1811c9942a6d02202ce3d68ecc468381e0c4610493ff043ba61c8875e74d7d65b46f6e17f0583752014c695221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853aeffffffff01601ce0110000000017a914040c4ab99a665c767adaa50fb28dce2ae514363b8700000000');

      }));
    });

  });

});
