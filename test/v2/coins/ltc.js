require('should');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('LTC:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should canonicalize address', function() {
    it('for prod address', function() {
      const prodLtc = bitgo.coin('ltc');
      const oldAddress = '3GBygsGPvTdfKMbq4AKZZRu1sPMWPEsBfd';
      const newAddress = prodLtc.canonicalAddress(oldAddress, 2);
      newAddress.should.equal('MNQ7zkgMsaV67rsjA3JuP59RC5wxRXpwgE');
      const sameAddress = prodLtc.canonicalAddress(oldAddress, 1);
      oldAddress.should.equal(sameAddress);
      const newOldAddress = prodLtc.canonicalAddress(newAddress, 1);
      oldAddress.should.equal(newOldAddress);
    });
    it('for test address', function() {
      const testLtc = bitgo.coin('tltc');
      const newAddress = 'QLc2RwpX2rFtZzoZrexLibcAgV6Nsg74Jn';
      const oldAddress = testLtc.canonicalAddress(newAddress, 1);
      oldAddress.should.equal('2MsFGJvxH1kCoRp3XEYvKduAjY6eYz9PJHz');
      const sameAddress = testLtc.canonicalAddress(newAddress, 2);
      newAddress.should.equal(sameAddress);
      const newNewAddress = testLtc.canonicalAddress(oldAddress, 2);
      newAddress.should.equal(newNewAddress);
    });
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
    let testCoin;
    before(() => {
      coin = bitgo.coin('ltc');
      testCoin = bitgo.coin('tltc');
    });

    it('should generate standard non-segwit address', () => {
      const generatedAddress = coin.generateAddress({ keychains });
      const generatedTestAddress = testCoin.generateAddress({ keychains });

      [generatedAddress, generatedTestAddress].map((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a9141e57a925dd863a86af341037e700862bf66bf7b687');
        currentAddress.coinSpecific.redeemScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      });

      generatedAddress.address.should.equal('MAfbWxccd7BxKFBcYGD5kTYhkGEVTkPv3o');
      generatedTestAddress.address.should.equal('QPNRPpzvJYtxriJJjcsddTiznJJ35u6Chk');
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

      generatedAddress.address.should.equal('ME2rjC91XunT3h3WGKyyWTrLWyBsieoQuD');
      generatedTestAddress.address.should.equal('QSjgc4XKDMVTbAACTgeXPU2dZ1FRUzCVKn');
    });

    it('should generate standard segwit address', () => {
      const generatedAddress = coin.generateAddress({ keychains, segwit: true });
      const generatedTestAddress = testCoin.generateAddress({ keychains, segwit: true });

      [generatedAddress, generatedTestAddress].map((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a91426e34781478f08fff903cb70ae67311c3f9bc6a987');
        currentAddress.coinSpecific.redeemScript.should.equal('00209a10eb58331e95333f4a6eafd5f03e442e17e0986c824e392642e872f431b7ef');
        currentAddress.coinSpecific.witnessScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      });

      generatedAddress.address.should.equal('MBSnBN33bYj2QnFM1YqrDmdwGxRY5Q5acM');
      generatedTestAddress.address.should.equal('QQ9c4ERMGzS2xFN3CuWQ6mpEJzV5iE7iao');
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

      generatedAddress.address.should.equal('MJjebqE2dg3nQq43vY7shQEA8FU79jWWUS');
      generatedTestAddress.address.should.equal('QXSUUhcLK7knxJAk7tnRaQQTAHXerpdjV3');
    });

    it('should generate 3/3 custom chain segwit address', () => {
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3, segwit: true, chain: 20, index: 756 });
      const generatedTestAddress = testCoin.generateAddress({ keychains, threshold: 3, segwit: true, chain: 20, index: 756 });

      [generatedAddress, generatedTestAddress].map((currentAddress) => {
        currentAddress.chain.should.equal(20);
        currentAddress.index.should.equal(756);
        currentAddress.coinSpecific.outputScript.should.equal('a91424ba55e2753970236fae8593ca2b49654bf9f4c487');
        currentAddress.coinSpecific.redeemScript.should.equal('0020c8fc4f071770e15f21a13ba48c6f32421daed431a74e00e13d0187990964bbce');
        currentAddress.coinSpecific.witnessScript.should.equal('532103db7ec7ef3c549705582d6bb5ee258b3bc14d147ec3b069dfd4fd80adb4e9373e210387b1f7cacb6e0c78b79062e94ed0aee691bdfa34a0d1b522103c434205587ad52102044a9f965fd9b54d82e5afe9d4338d0f59027a4e11cff3a39b90fbf5978ae7e753ae');
      });

      generatedAddress.address.should.equal('MBFMn9or7M89saHPkveDLzsyuEjZ22ftmo');
      generatedTestAddress.address.should.equal('QPxBf2C9nnqAR3Q5xHJmE14GwGo6fwNtii');
    });
  });

});
