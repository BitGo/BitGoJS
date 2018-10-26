require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;

const TestV2BitGo = require('../../../lib/test_bitgo');
const Wallet = require('../../../../src/v2/wallet');
const AbstractUtxoCoin = require('../../../../src/v2/coins/abstractUtxoCoin');

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

    it('should generate p2sh-wrapped segwit address', function() {
      const generatedAddress = coin.generateAddress({ keychains, addressType: AbstractUtxoCoin.AddressTypes.P2SH_P2WSH });
      const generatedTestAddress = testCoin.generateAddress({ keychains, addressType: AbstractUtxoCoin.AddressTypes.P2SH_P2WSH });

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
      const generatedAddress = coin.generateAddress({ keychains, addressType: AbstractUtxoCoin.AddressTypes.P2WSH });
      const generatedTestAddress = testCoin.generateAddress({ keychains, addressType: AbstractUtxoCoin.AddressTypes.P2WSH });

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
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3, addressType: AbstractUtxoCoin.AddressTypes.P2SH_P2WSH, chain: 20, index: 756 });
      const generatedTestAddress = testCoin.generateAddress({
        keychains,
        threshold: 3,
        addressType: AbstractUtxoCoin.AddressTypes.P2SH_P2WSH,
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
        addressType: AbstractUtxoCoin.AddressTypes.P2WSH,
        chain: 20,
        index: 756
      });
      const generatedTestAddress = testCoin.generateAddress({
        keychains,
        threshold: 3,
        addressType: AbstractUtxoCoin.AddressTypes.P2WSH,
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

  describe('Should test bech32 transaction signing', function() {

    let basecoin;
    let wallet;

    const userKeychain = {
      prv: 'xprv9s21ZrQH143K3xQwj4yx3fHjDieEdqFDweBvFxn28qGvfQGvweUWuUuDRpepDu6opq3jiWHU9h3yYTKk5vvu4ykRuGA4i4Kz1vmFMPLTsoC',
      pub: 'xpub661MyMwAqRbcGSVQq6WxQoETmkUj3Hy5Js7X4MBdhAouYCc5VBnmTHDhH7p9RpeGWjkcwbTVuqib1EdusAntf4VEgQJcVMatBU5thweF2Jz',
      rawPub: '03f10de9f369f304f5af215812471804b418d2227f44b0a93660b1d27299e2479f',
      rawPrv: 'd87c332ea93243f46f9ad5e9f6c5d51ae67508a7e46b8dd836b5e21668986e34'
    };
    const backupKeychain = {
      prv: 'xprv9s21ZrQH143K3ZijERhwuqfED1hLNWMN6A1ByMs6LtcFw6mexXLcPkRPXGPdMT658HJkaSCktjPNA6iujYdFgUwAVqwhtptvsQfHD2WEizC',
      pub: 'xpub661MyMwAqRbcG3oCLTExGybxm3Xpmy5DTNvnmkGhuE9Eou6oW4erwYjsNYmWrc5YBCZPgpR6hJGpgdFpNwta9zBnta8jL2vAjRF42KB1Xmv',
      rawPub: '0320e7370ace2e0dd974b8bdafa3a672e108ad12ab9c5ffd3786c303b2198e3f23',
      rawPrv: '6f84aa9081fef0b95955ed399fd17bb72c94cec87f3fed92d2e7e9e074f0f00e'
    };

    const signedTxHex = '01000000000101d58f82d996dd872012675adadf4606734906b25a413f6e2ee535c0c10aef96020000000000ffffffff028de888000000000017a914c91aa24f65827eecec775037d886f2952b73cbe48740420f000000000017a9149304d18497b9bfe9532778a0f06d9fff3b3befaf870400473044022023d7210ba6d8bbd7a28b8af226f40f7235caab79156f93f9c9969fc459ea7f73022050fbdca788fba3de686b66b3501853695ff9d6f375867470207d233b099576e001483045022100a4d9f100e4054e56a93b8abb99bb67f399090f1918a30722bd01bfc9e38437eb022035e3bf7446380000a514fe0791fc579b553542dc6204c40418ae24f05f3f03b80169522103d4788cda52f91c1f6c82eb91491ca76108c9c5f0839bc4f02eccc55fedb3311c210391bcef9dcc89570a79ba3c7514e65cd48e766a8868eca2769fa9242fdcc796662102ef3c5ebac4b54df70dea1bb2655126368be10ca0462382fcb730e55cddd2dd6a53aec8b11400';

    before(co(function *() {
      basecoin = bitgo.coin('tbtc');
      const walletData = {
        id: '5a78dd561c6258a907f1eeaee132f796',
        users: [
          {
            user: '543c11ed356d00cb7600000b98794503',
            permissions: [
              'admin',
              'view',
              'spend'
            ]
          }
        ],
        coin: 'tbch',
        label: 'Signature Verification Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a78dd56bfe424aa07aa068651b194fd',
          '5a78dd5674a70eb4079f58797dfe2f5e',
          '5a78dd561c6258a907f1eea9f1d079e2'
        ],
        tags: [
          '5a78dd561c6258a907f1eeaee132f796'
        ],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        admin: {
          policy: {
            id: '5a78dd561c6258a907f1eeaf50991950',
            version: 0,
            date: '2018-02-05T22:40:22.761Z',
            mutableUpToDate: '2018-02-07T22:40:22.761Z',
            rules: []
          }
        },
        clientFlags: [],
        balance: 650000000,
        confirmedBalance: 650000000,
        spendableBalance: 650000000,
        balanceString: '650000000',
        confirmedBalanceString: '650000000',
        spendableBalanceString: '650000000',
        receiveAddress: {
          id: '5b5f83121d13489f7ff32f9d5729c6de',
          address: 'tb1qtxxqmkkdx4n4lcp0nt2cct89uh3h3dlcu940kw9fcqyyq36peh0st94hfp',
          chain: 20,
          index: 2,
          coin: 'tbtc',
          wallet: '5b5f81a78d2152514ab99a15ee9e0781',
          coinSpecific: {
            witnessScript: '522103d4788cda52f91c1f6c82eb91491ca76108c9c5f0839bc4f02eccc55fedb3311c210391bcef9dcc89570a79ba3c7514e65cd48e766a8868eca2769fa9242fdcc796662102ef3c5ebac4b54df70dea1bb2655126368be10ca0462382fcb730e55cddd2dd6a53ae'
          },
          addressType: AbstractUtxoCoin.AddressTypes.P2WSH
        },
        pendingApprovals: []
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    }));

    it('should half-sign and fully signed transaction prebuild', co(function *() {

      const prebuild = {
        txHex: '0100000001d58f82d996dd872012675adadf4606734906b25a413f6e2ee535c0c10aef96020000000000ffffffff028de888000000000017a914c91aa24f65827eecec775037d886f2952b73cbe48740420f000000000017a9149304d18497b9bfe9532778a0f06d9fff3b3befaf87c8b11400',
        txInfo: {
          nP2SHInputs: 0,
          nSegwitInputs: 1,
          nOutputs: 2,
          unspents: [
            {
              chain: 20,
              index: 2,
              witnessScript: '522103d4788cda52f91c1f6c82eb91491ca76108c9c5f0839bc4f02eccc55fedb3311c210391bcef9dcc89570a79ba3c7514e65cd48e766a8868eca2769fa9242fdcc796662102ef3c5ebac4b54df70dea1bb2655126368be10ca0462382fcb730e55cddd2dd6a53ae',
              id: '0296ef0ac1c035e52e6e3f415ab20649730646dfda5a67122087dd96d9828fd5:0',
              address: 'tb1qtxxqmkkdx4n4lcp0nt2cct89uh3h3dlcu940kw9fcqyyq36peh0st94hfp',
              addressType: AbstractUtxoCoin.AddressTypes.P2WSH,
              value: 10000000
            }
          ],
          changeAddresses: [
            '2NBaZiQX2xdj2VrJwpAPo4swbzvDyozvbBR'
          ],
          walletAddressDetails: {
            '2NBaZiQX2xdj2VrJwpAPo4swbzvDyozvbBR': {
              chain: 11,
              index: 2,
              coinSpecific: {
                redeemScript: '0020d743abf2484b6e4b76522b13e1860f08ded95a6355f0418557117314ae418926',
                witnessScript: '5221029052d1c6ca8adabe4559d9ccebce46629b17d7a26abd4cda3f837d4c14a83fae2102a6660deeb18ef3c9ec965c8600b942669652d83959c384409f4320a87e40ed7a2102abbd970ecde03a424663cb7d5171282673c30f865275b718bf56860dd37958b253ae'
              }
            }
          }
        },
        feeInfo: {
          size: 218,
          feeRate: 126468,
          fee: 27571,
          payGoFee: 0,
          payGoFeeString: '0'
        },
        walletId: '5b5f81a78d2152514ab99a15ee9e0781'
      };

      // half-sign with the user key
      const halfSignedTransaction = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: userKeychain.prv
      });

      // fully sign transaction
      prebuild.txHex = halfSignedTransaction.txHex;
      const signedTransaction = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv,
        isLastSignature: true
      });
      // broadcast here: https://testnet.smartbit.com.au/tx/5fb17d5ac94f180ba58be7f5a814a6e92a3c31bc00e39604c59c936dcef958bc
      signedTransaction.txHex.should.equal(signedTxHex);

    }));

  });

});
