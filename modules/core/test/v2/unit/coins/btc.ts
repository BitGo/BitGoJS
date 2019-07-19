import * as should from 'should';
import * as Promise from 'bluebird';
const co = Promise.coroutine;
const { Codes } = require('@bitgo/unspents');

const TestV2BitGo = require('../../../lib/test_bitgo');
import { Wallet } from '../../../../src/v2/wallet';

describe('BTC:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Address generation:', function() {

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
        should.not.exist(currentAddress.coinSpecific.witnessScript);
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
        should.not.exist(currentAddress.coinSpecific.witnessScript);
      });

      generatedAddress.address.should.equal('37piRJj3anw2FBmcASzdgpbwCGbRjot78A');
      generatedTestAddress.address.should.equal('2MyNvV3f5CFSNSyQ9qacWJmbCQcobaCtqRk');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate p2sh-wrapped segwit address', function() {
      const addressType = Codes.UnspentTypeTcomb('p2shP2wsh');
      const chain = Codes.forType(addressType)[Codes.PurposeTcomb('external')];
      const generatedAddress = coin.generateAddress({ keychains, addressType, chain });
      const generatedTestAddress = testCoin.generateAddress({ keychains, addressType, chain });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(chain);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a9147ff13f3faeba4d439ef40604f7c127951e77eb6a87');
        currentAddress.coinSpecific.redeemScript.should.equal('00207aad7d57b238a09b5daa10ff47c54483b7f2ad47f3f0c0aa230958b9df334260');
        currentAddress.coinSpecific.witnessScript.should.equal('52210304fcea3fb05f6e8a8fe91db2087bdd13b18102a0b10a77c1fdbb326b0ce7cec421028242a3ea9e20d4e6b78e3f0dde21aff86a623d48322681b203b6827e22d04a9d2102ceec88b222a55ec67d1414b523bcfc0f53eb6ac012ba91744a4ed8eb448d55f753ae');
      });

      generatedAddress.address.should.equal('3DMWk3dd5aJmwA2UVxjKcu9KdgA7k8Homg');
      generatedTestAddress.address.should.equal('2N4uionZeh2p88wf2B6MCEr8ar2NHWEnQeQ');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate p2wsh bech32 address', function() {
      const addressType = Codes.UnspentTypeTcomb('p2wsh');
      const chain = Codes.forType(addressType)[Codes.PurposeTcomb('external')];
      const generatedAddress = coin.generateAddress({ keychains, addressType, chain });
      const generatedTestAddress = testCoin.generateAddress({ keychains, addressType, chain });
      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(chain);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('002090448b5ba5fde14fc4b0bfc756c4b55fe4e3854c8d21f39ee75364c0063bc73e');
        should.not.exist(currentAddress.coinSpecific.redeemScript);
        currentAddress.coinSpecific.witnessScript.should.equal('522103cf858f42c759d590d80f3715ce59be999089e6b1f381d0f4338276546fd3a04e2102dca1ab8670d45f5213c7c9d66b2f89b50a4cbd33fd72db89ba18d3e82d3dd5ee210294b6dab0dc112831a0dc1e219769bd81d13eb38a8bdb938103f919d8dd7e004353ae');
      });

      generatedAddress.address.should.equal('bc1qjpzgkka9lhs5l39shlr4d394tljw8p2v35sl88h82djvqp3mculqa08n0a');
      generatedTestAddress.address.should.equal('tb1qjpzgkka9lhs5l39shlr4d394tljw8p2v35sl88h82djvqp3mculq283u4j');

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
        should.not.exist(currentAddress.coinSpecific.witnessScript);
      });

      generatedAddress.address.should.equal('3CXWHwp4gZCMcKn9pf8XskykoYsfB3agwu');
      generatedTestAddress.address.should.equal('2N45iMgk6J1hhp7QhVnkQVhy21u5pvqfkpd');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate 3/3 custom chain p2shP2wsh address', function() {
      const addressType = Codes.UnspentTypeTcomb('p2shP2wsh');
      const chain = Codes.forType(addressType)[Codes.PurposeTcomb('external')];
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3, addressType, chain, index: 756 });
      const generatedTestAddress = testCoin.generateAddress({
        keychains,
        threshold: 3,
        addressType: Codes.UnspentTypeTcomb('p2shP2wsh'),
        chain,
        index: 756
      });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(chain);
        currentAddress.index.should.equal(756);
        currentAddress.coinSpecific.outputScript.should.equal('a914ad395d176042ce737e4f5b65c0eb5de703a4e80087');
        currentAddress.coinSpecific.redeemScript.should.equal('0020d15d8d124adb4c213905ebb2cec8517faf38ae0ec4f7b4f1cfa358e6cc06a93d');
        currentAddress.coinSpecific.witnessScript.should.equal('532102bb8096d5c12e8b0ee50dd2b14f63dd09c8494b5a0a730794a0e392a6f2a3b2a8210366dbf2135105dc65eed5173c1acf1a902fc2e9dd366b9a6fa0e682c0fb4c21a32102bf998121d4d09d4305b025b5d2de8a7e954fe96179a1dfc076ad11ad4751c99e53ae');
      });

      generatedAddress.address.should.equal('3HUwYRepxeeHMedeU9tTkMRF3Udi6ZibEj');
      generatedTestAddress.address.should.equal('2N939cAara79dZSGC9HWLNJQWFpqsutd5dW');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should generate 3/3 custom chain p2wsh bech32 address', function() {
      const generatedAddress = coin.generateAddress({
        keychains,
        threshold: 3,
        addressType: Codes.UnspentTypeTcomb('p2wsh'),
        chain: 20,
        index: 756
      });
      const generatedTestAddress = testCoin.generateAddress({
        keychains,
        threshold: 3,
        addressType: Codes.UnspentTypeTcomb('p2wsh'),
        chain: 20,
        index: 756
      });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(20);
        currentAddress.index.should.equal(756);
        currentAddress.coinSpecific.outputScript.should.equal('0020c8fc4f071770e15f21a13ba48c6f32421daed431a74e00e13d0187990964bbce');
        should.not.exist(currentAddress.coinSpecific.redeemScript);
        currentAddress.coinSpecific.witnessScript.should.equal('532103db7ec7ef3c549705582d6bb5ee258b3bc14d147ec3b069dfd4fd80adb4e9373e210387b1f7cacb6e0c78b79062e94ed0aee691bdfa34a0d1b522103c434205587ad52102044a9f965fd9b54d82e5afe9d4338d0f59027a4e11cff3a39b90fbf5978ae7e753ae');
      });

      generatedAddress.address.should.equal('bc1qer7y7pchwrs47gdp8wjgcmejggw6a4p35a8qpcfaqxrejztyh08q3ezxp6');
      generatedTestAddress.address.should.equal('tb1qer7y7pchwrs47gdp8wjgcmejggw6a4p35a8qpcfaqxrejztyh08qx35fm4');

      coin.isValidAddress(generatedAddress.address).should.equal(true);
      testCoin.isValidAddress(generatedTestAddress.address).should.equal(true);
      coin.isValidAddress(generatedTestAddress.address).should.equal(false);
      testCoin.isValidAddress(generatedAddress.address).should.equal(false);
    });

    it('should validate pub key', () => {
      const { pub } = testCoin.keychains().create();
      testCoin.isValidPub(pub).should.equal(true);
    });
  });

  describe('p2wsh transaction signing:', function() {

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
          addressType: Codes.UnspentTypeTcomb('p2wsh')
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
              addressType: Codes.UnspentTypeTcomb('p2wsh'),
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

  describe('Explain transaction:', () => {

    describe('Signature count:', () => {
      // p2sh, p2wsh, p2shP2wsh does not matter for unsigned inputs, so we will only test one
      const unsignedTx = '0100000002ece0eb669e085aeb13527e3f20873caa2845a9196c5dc23bd3d366da46996c9e0100000000ffffffff471f27cdf9f75a0e610281cb8d7b5caa44cd3a5d7048fabf9acbededdb709a590100000000ffffffff0240420f000000000017a914a364c319fddbc93dafdaa9d006d728961958a03f87eee80a000000000017a914e006ca6b2a68ce7ee9d9e3cbf62af153b8ae3420876e011600';

      const p2shP2wshUnspents = [
        {
          id: 'c1675aebce249a45631e9c9c5093aedfe803099fddde81dec08d7b9ef93cc983:1',
          value: 998214
        },
        {
          id: '1cd6b605b1ac6e39eb26cdd7ef85699ea1669970a8f3c7be023ab7986a8a22d7:0',
          value: 1000000
        }
      ];

      const p2wshUnspents = [
        {
          id: '52fcd5cceef2350b7f380a232a41dafc496afd7f186b203c04ad1201549c98b6:0',
          value: 10000000
        },
      ];

      const txs = {
        p2sh: {
          halfSigned: '0100000001accf0cd2599ea4d6d8b032405f9396fe218c247b661e58cf3e9e4bb3c095426828000000b700483045022100cd5a6a660f56da89f7b27e566406e90282f4120bffef1918518f744a6bb3209f022055774755ee323dae0b555a2f5b8f548c20b905b6a7fe954d1d93e415c71e77060100004c6952210272ed48816a9600b7262388e3ae9d9faf1a14ff773350835c784dde916ce7bfff2103c388215ac5a6400db9ec2a3d69e965f3c30ad6935d729c9cef083124646ae5482102bc24b831b847b501dbcbb383fbc64138043573ad766968e0ee66744e00bf08a353aeffffffff01ce15fa020000000017a9147676db43fea61814cf0e2317b5e9b336054f8a2e87ad600800',
          fullySigned: '0100000001accf0cd2599ea4d6d8b032405f9396fe218c247b661e58cf3e9e4bb3c095426828000000fdfd0000483045022100cd5a6a660f56da89f7b27e566406e90282f4120bffef1918518f744a6bb3209f022055774755ee323dae0b555a2f5b8f548c20b905b6a7fe954d1d93e415c71e77060147304402200476814f5ec0b4ded9b57414395ac7deda570339fb5d71377b9fc896c1d6e78b0220249237943e11062592c32f4f68d8ef03372bf16a83e8846d6effdba0a6ada020014c6952210272ed48816a9600b7262388e3ae9d9faf1a14ff773350835c784dde916ce7bfff2103c388215ac5a6400db9ec2a3d69e965f3c30ad6935d729c9cef083124646ae5482102bc24b831b847b501dbcbb383fbc64138043573ad766968e0ee66744e00bf08a353aeffffffff01ce15fa020000000017a9147676db43fea61814cf0e2317b5e9b336054f8a2e87ad600800'
        },
        p2shP2wsh: {
          halfSigned: '0100000000010283c93cf99e7b8dc0de81dedd9f0903e8dfae93509c9c1e63459a24ceeb5a67c10100000023220020dced90433eee50a13a9a5e3a01d4f011eda3832cfe7078202f435125908a8023ffffffffd7228a6a98b73a02bec7f3a8709966a19e6985efd7cd26eb396eacb105b6d61c0000000023220020d3943e78dc44bbaddb8c5ff3f24956efb3175a019d01b5690841910c219b5f01ffffffff02c9370f000000000017a9142f2ddab3f793ceab164ed186afa4dfec9eb9c9e58740420f000000000017a9145bac3641fa38b9dad47a2a027d3a39e38b476124870500483045022100ec86cfba7d76fa7b9fb39ff56a3b708eee06d1cfefe9266455f16db5b37654c80220219158789c81dac85d04bbb584255c4cd0fdc2dbc3690cc18b29f04a2ffa193201000069522102d31024f6184956b730294a1275383c6d57c8fcfdfebb4870fd91882b1c08a8a821028f4b8d4508169c746a2381155bf7cbfa56eeff237937040597e7be632ff74719210315f8700de6902daa99e4c511b008e5018d8f3b586143183f80ab97db8fde770a53ae0500483045022100e37c1cf55b9f23b4ef0bfb018fb54eaae8a5541635269f06176b4f715151a9d102202b057455a3353ba1e2e32526d55e267e957ba00fe416ac59458bf9c1b5044e690100006952210311322726192eb6cbbec6445514d148722a936d5805360be2faf2f8adc8b5aec42102d2e6cf4c6dcdc8e3e1633e7e64b2e41f5be4a583934adbf1f2372240f41b59ae21023799f2560c321587ae734da2d1faafa7c4931145b4b785a3263fa5aa193a208753ae7f011600',
          fullySigned: '0100000000010283c93cf99e7b8dc0de81dedd9f0903e8dfae93509c9c1e63459a24ceeb5a67c10100000023220020dced90433eee50a13a9a5e3a01d4f011eda3832cfe7078202f435125908a8023ffffffffd7228a6a98b73a02bec7f3a8709966a19e6985efd7cd26eb396eacb105b6d61c0000000023220020d3943e78dc44bbaddb8c5ff3f24956efb3175a019d01b5690841910c219b5f01ffffffff02c9370f000000000017a9142f2ddab3f793ceab164ed186afa4dfec9eb9c9e58740420f000000000017a9145bac3641fa38b9dad47a2a027d3a39e38b476124870400483045022100ec86cfba7d76fa7b9fb39ff56a3b708eee06d1cfefe9266455f16db5b37654c80220219158789c81dac85d04bbb584255c4cd0fdc2dbc3690cc18b29f04a2ffa19320147304402206c6c7760d7acbd595e8649e80e64a67aee8a7b1d16ca9e6b090d31235252fb2902200e2655df8a4f3c230df6e4a1ca881a7b4781963b786479f4ebc02aaa9b6031e90169522102d31024f6184956b730294a1275383c6d57c8fcfdfebb4870fd91882b1c08a8a821028f4b8d4508169c746a2381155bf7cbfa56eeff237937040597e7be632ff74719210315f8700de6902daa99e4c511b008e5018d8f3b586143183f80ab97db8fde770a53ae0400483045022100e37c1cf55b9f23b4ef0bfb018fb54eaae8a5541635269f06176b4f715151a9d102202b057455a3353ba1e2e32526d55e267e957ba00fe416ac59458bf9c1b5044e690148304502210097cab2c37d2335328f169fb0c8420e9abd4dd81dff988ea657707a43512b5df1022075aeeb099e75565e205743419b3b756e34a6f0d68a4e7d0e6f2a482ab70e276e016952210311322726192eb6cbbec6445514d148722a936d5805360be2faf2f8adc8b5aec42102d2e6cf4c6dcdc8e3e1633e7e64b2e41f5be4a583934adbf1f2372240f41b59ae21023799f2560c321587ae734da2d1faafa7c4931145b4b785a3263fa5aa193a208753ae7f011600',
          txInfo: {
            unspents: p2shP2wshUnspents
          }
        },
        p2wsh: {
          halfSigned: '01000000000101b6989c540112ad043c206b187ffd6a49fcda412a230a387f0b35f2eeccd5fc520000000000ffffffff0222073d000000000017a914d795501e88704dd652de6b9a5cf30ca980ed07d687808d5b0000000000220020a5400adb4650be7a0f333dfd030496bb01ba44754e475532f5596a275dc973b6050047304402201715b6e3acb548ed90bd72b670e311434292666e01c5aa74a9a1b341dc6015780220376fa2d22465d7d2919d0ce2e96065559e4fadd90edea79543ee5f03d0c4828801000069522103f539e7cd897e676f07c55e5d672ae9686db91e626827f083139ca855e80e11832102ef4cbc39ee4abe37198ae095f3d4fef2716af7951f9bb9265aa9b9181e408342210345fb5ab601bad203c6ca6eb5ac5a5b4bf46986834419e6e87684e1e63c6a799e53ae99ac1600',
          fullySigned: '01000000000101b6989c540112ad043c206b187ffd6a49fcda412a230a387f0b35f2eeccd5fc520000000000ffffffff0222073d000000000017a914d795501e88704dd652de6b9a5cf30ca980ed07d687808d5b0000000000220020a5400adb4650be7a0f333dfd030496bb01ba44754e475532f5596a275dc973b6040047304402201715b6e3acb548ed90bd72b670e311434292666e01c5aa74a9a1b341dc6015780220376fa2d22465d7d2919d0ce2e96065559e4fadd90edea79543ee5f03d0c4828801483045022100bee8fa7548d99245b83599b657c310b4f4cc9c463002d4f843d8f8ed663f4df602204955fcd17ef02228e8e49c0d122fd0a77da76700376735625c90385d5ff43c3e0169522103f539e7cd897e676f07c55e5d672ae9686db91e626827f083139ca855e80e11832102ef4cbc39ee4abe37198ae095f3d4fef2716af7951f9bb9265aa9b9181e408342210345fb5ab601bad203c6ca6eb5ac5a5b4bf46986834419e6e87684e1e63c6a799e53ae99ac1600',
          txInfo: {
            unspents: p2wshUnspents
          }
        }
      };

      let coin;
      before(() => {
        coin = bitgo.coin('btc');
      });

      describe('failure', () => {
        it('should fail for invalid transaction hexes', co(function *() {
          yield coin.explainTransaction().should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          yield coin.explainTransaction({ txHex: '' }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          yield coin.explainTransaction({ txHex: 'nonsense' }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          yield coin.explainTransaction({ txHex: 1234 }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          yield coin.explainTransaction({ txHex: '1234a' }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          yield coin.explainTransaction({ txHex: '1234ab' }).should.be.rejectedWith('failed to parse transaction hex');
        }));
      });

      describe('success', () => {
        it('should handle undefined tx info for segwit transactions', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: txs.p2shP2wsh.halfSigned
          });

          should.exist(signatures);
          signatures.should.equal(0);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([0, 0]);
        }));

        it('should count zero signatures on an unsigned transaction', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: unsignedTx
          });

          should.exist(signatures);
          signatures.should.equal(0);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([0, 0]);
        }));

        it('should count one signature on a half-signed p2sh transaction', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: txs.p2sh.halfSigned
          });

          should.exist(signatures);
          signatures.should.equal(1);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(1);
          inputSignatures.should.deepEqual([1]);
        }));

        it('should count two signatures on a fully-signed p2sh transaction', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: txs.p2sh.fullySigned
          });

          should.exist(signatures);
          signatures.should.equal(2);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(1);
          inputSignatures.should.deepEqual([2]);
        }));

        it('should count one signature on a half-signed p2shP2wsh transaction', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: txs.p2shP2wsh.halfSigned,
            txInfo: txs.p2shP2wsh.txInfo
          });

          should.exist(signatures);
          signatures.should.equal(1);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([1, 1]);
        }));

        it('should count two signatures on a fully-signed p2shP2wsh transaction', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: txs.p2shP2wsh.fullySigned,
            txInfo: txs.p2shP2wsh.txInfo
          });

          should.exist(signatures);
          signatures.should.equal(2);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([2, 2]);
        }));

        it('should count one signature on a half-signed p2wsh transaction', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: txs.p2wsh.halfSigned,
            txInfo: txs.p2wsh.txInfo
          });

          should.exist(signatures);
          signatures.should.equal(1);

          should.exist(inputSignatures);
        }));

        it('should count two signatures on a fully-signed p2wsh transaction', co(function *() {
          const { signatures, inputSignatures } = yield coin.explainTransaction({
            txHex: txs.p2wsh.fullySigned,
            txInfo: txs.p2wsh.txInfo
          });

          should.exist(signatures);
          signatures.should.equal(2);

          should.exist(inputSignatures);
        }));
      });
    });
  });
});
