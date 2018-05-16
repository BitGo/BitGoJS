require('should');
const assert = require('assert');
const errors = require('../../../../src/v2/errors');

const TestV2BitGo = require('../../../lib/test_bitgo');

describe('BTC:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should test address generation', function() {

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
    before(function() {
      coin = bitgo.coin('btc');
      testCoin = bitgo.coin('tbtc');
    });

    it('should generate p2sh address', function() {
      const generatedAddress = coin.generateAddress({ keychains });
      const generatedTestAddress = testCoin.generateAddress({ keychains });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a9141e57a925dd863a86af341037e700862bf66bf7b687');
        currentAddress.coinSpecific.redeemScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
        currentAddress.coinSpecific.should.not.have.property('witnessScript');
      });

      generatedAddress.address.should.equal('34TTD5CefzLXWjuiSPDjvpJJRZe3Tqu2Mj');
      generatedTestAddress.address.should.equal('2Mv1fGp8gHSqsiXYG7WqcYmHZdurDGVtUbn');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate custom chain p2sh address', function() {
      const generatedAddress = coin.generateAddress({ keychains, chain: 1, index: 113 });
      const generatedTestAddress = testCoin.generateAddress({ keychains, chain: 1, index: 113 });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(1);
        currentAddress.index.should.equal(113);
        currentAddress.coinSpecific.outputScript.should.equal('a91443457880e5e29555d6ad16bc82ef53891d6512b087');
        currentAddress.coinSpecific.redeemScript.should.equal('522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753ae');
        currentAddress.coinSpecific.should.not.have.property('witnessScript');
      });

      generatedAddress.address.should.equal('37piRJj3anw2FBmcASzdgpbwCGbRjot78A');
      generatedTestAddress.address.should.equal('2MyNvV3f5CFSNSyQ9qacWJmbCQcobaCtqRk');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should fail to generate custom chain p2sh address when attempting bech32', function() {
      assert.throws(() => {
        coin.generateAddress({ keychains, chain: 1, index: 113, bech32: true });
      }, errors.SegwitRequiredError);
    });

    it('should generate p2sh-wrapped segwit address', function() {
      const generatedAddress = coin.generateAddress({ keychains, segwit: true });
      const generatedTestAddress = testCoin.generateAddress({ keychains, segwit: true });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a91426e34781478f08fff903cb70ae67311c3f9bc6a987');
        currentAddress.coinSpecific.redeemScript.should.equal('00209a10eb58331e95333f4a6eafd5f03e442e17e0986c824e392642e872f431b7ef');
        currentAddress.coinSpecific.witnessScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      });

      generatedAddress.address.should.equal('35EdsUd5eRsbcGySufrWQ8PXxFq668U5vA');
      generatedTestAddress.address.should.equal('2MvnqwDZ7FtNwp4bzaoUP25NoAc3FmvGE1H');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate native bech32 address', function() {
      const generatedAddress = coin.generateAddress({ keychains, segwit: true, bech32: true });
      const generatedTestAddress = testCoin.generateAddress({ keychains, segwit: true, bech32: true });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('00209a10eb58331e95333f4a6eafd5f03e442e17e0986c824e392642e872f431b7ef');
        currentAddress.coinSpecific.should.not.have.property('redeemScript');
        currentAddress.coinSpecific.witnessScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      });

      generatedAddress.address.should.equal('bc1qnggwkkpnr62nx062d6hatup7gshp0cycdjpyuwfxgt589ap3klhslqfmuc');
      generatedTestAddress.address.should.equal('tb1qnggwkkpnr62nx062d6hatup7gshp0cycdjpyuwfxgt589ap3klhsggl5xh');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate 3/3 p2sh address', function() {
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3 });
      const generatedTestAddress = testCoin.generateAddress({ keychains, threshold: 3 });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a91476dce7beb23d0e0d53edf5895716d4c80dce609387');
        currentAddress.coinSpecific.redeemScript.should.equal('5321037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
        currentAddress.coinSpecific.should.not.have.property('witnessScript');
      });

      generatedAddress.address.should.equal('3CXWHwp4gZCMcKn9pf8XskykoYsfB3agwu');
      generatedTestAddress.address.should.equal('2N45iMgk6J1hhp7QhVnkQVhy21u5pvqfkpd');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate 3/3 custom chain p2sh-wrapped segwit address', function() {
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3, segwit: true, chain: 20, index: 756 });
      const generatedTestAddress = testCoin.generateAddress({
        keychains,
        threshold: 3,
        segwit: true,
        chain: 20,
        index: 756
      });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(20);
        currentAddress.index.should.equal(756);
        currentAddress.coinSpecific.outputScript.should.equal('a91424ba55e2753970236fae8593ca2b49654bf9f4c487');
        currentAddress.coinSpecific.redeemScript.should.equal('0020c8fc4f071770e15f21a13ba48c6f32421daed431a74e00e13d0187990964bbce');
        currentAddress.coinSpecific.witnessScript.should.equal('532103db7ec7ef3c549705582d6bb5ee258b3bc14d147ec3b069dfd4fd80adb4e9373e210387b1f7cacb6e0c78b79062e94ed0aee691bdfa34a0d1b522103c434205587ad52102044a9f965fd9b54d82e5afe9d4338d0f59027a4e11cff3a39b90fbf5978ae7e753ae');
      });

      generatedAddress.address.should.equal('353DUGPtAEGj551Vf3esXMdaaY96ytsub2');
      generatedTestAddress.address.should.equal('2MvbRY1Kumgn5Gre3LBGk9JcqntMGk22Y72');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate 3/3 custom chain native bech32 address', function() {
      const generatedAddress = coin.generateAddress({
        keychains,
        threshold: 3,
        segwit: true,
        bech32: true,
        chain: 20,
        index: 756
      });
      const generatedTestAddress = testCoin.generateAddress({
        keychains,
        threshold: 3,
        segwit: true,
        bech32: true,
        chain: 20,
        index: 756
      });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(20);
        currentAddress.index.should.equal(756);
        currentAddress.coinSpecific.outputScript.should.equal('0020c8fc4f071770e15f21a13ba48c6f32421daed431a74e00e13d0187990964bbce');
        currentAddress.coinSpecific.should.not.have.property('redeemScript');
        currentAddress.coinSpecific.witnessScript.should.equal('532103db7ec7ef3c549705582d6bb5ee258b3bc14d147ec3b069dfd4fd80adb4e9373e210387b1f7cacb6e0c78b79062e94ed0aee691bdfa34a0d1b522103c434205587ad52102044a9f965fd9b54d82e5afe9d4338d0f59027a4e11cff3a39b90fbf5978ae7e753ae');
      });

      generatedAddress.address.should.equal('bc1qer7y7pchwrs47gdp8wjgcmejggw6a4p35a8qpcfaqxrejztyh08q3ezxp6');
      generatedTestAddress.address.should.equal('tb1qer7y7pchwrs47gdp8wjgcmejggw6a4p35a8qpcfaqxrejztyh08qx35fm4');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });
  });

});
