//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const Wallet = require('../../src/wallet');
const TestBitGo = require('../lib/test_bitgo');
const _ = require('lodash');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../src/common');
const bitcoin = require('../../src/bitcoin');
const should = require('should');
const nock = require('nock');

describe('Wallet Prototype Methods', function() {

  const bitgo = new TestBitGo();
  bitgo.initializeTestVars();

  const userKeypair = {
    xprv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    xpub: 'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp',
    rawPub: '02c103ac74481874b5ef0f385d12725e4f14aedc9e00bc814ce96f47f62ce7adf2',
    rawPrv: '936c5af3f8af81f75cdad1b08f29e7d9c01e598e2db2d7be18b9e5a8646e87c6',
    path: 'm',
    walletSubPath: '/0/0'
  };
  const backupKeypair = {
    xprv: 'xprv9s21ZrQH143K47sEkLkykgYmq1xF5ZWrPYhUZcmBpPFMQojvGUmEcr5jFXYGfr8CpFdpTvhQ7L9NN2rLtsBFjSix3BAjwJcBj6U3D5hxTPc',
    xpub: 'xpub661MyMwAqRbcGbwhrNHz7pVWP3njV2Ehkmd5N1AoNinLHc54p25VAeQD6q2oTS3uuDMDnfnXnthbS9ufC8JVYpNnWU5Rn3pYaNuLCNywkw1',
    rawPub: '03bbcb73997977068d9e36666bbd5cd37579acae8e2bd5ce9d0a6e5c150a423bc3',
    rawPrv: '77a15f14796f4001d1092ae84f766bd869e9bee6bffae6547def5045b96fa943',
    path: 'm',
    walletSubPath: '/0/0'
  };
  const bitgoKey = {
    xpub: 'xpub661MyMwAqRbcGQcVFiwcrtc7c3vopsX96jsJUYPcFMREcRTqAqsqbv2ZRyCJAPLm5NMHCy85E3ZwpT4EAUw9WGU7vMhG6z83hDeKXBWn6Lf',
    path: 'm',
    walletSubPath: '/0/0'
  };

  const extraKeypair1 = {
    xprv: 'xprv9s21ZrQH143K4QBfbn1EUu6C3T2sWxuLcmJq7aEVWPK76VXA5xVZKhp42UPwEgNiW76i3Pr3XmUyipj1WQnmqVZ2eLovfPXJCJHKyGBqepP',
    xpub: 'xpub661MyMwAqRbcGtG8hoYEr32vbUsMvRdByzERuxe74ir5yHrJdVoosW8XskKeKKp2HZGtc28sPtp3CZUdYb59yq9SjhQ1FSMqWfQLQU5cA3o',
    rawPub: '03174291b93b7e95ff070949272136e706be24d4885c47d6cf2203b7f792e26b0d',
    rawPrv: 'a151bd090c47ab339acfdeea680795d0a32408ad73f339412795b45e50ba8e3d',
    path: 'm',
    walletSubPath: '/0/0'
  };

  const extraKeypair2 = {
    xprv: 'xprv9s21ZrQH143K3B1ZejZg5dJdfbAjrdZNCqofurao3msbSckfk2vho7tHmsvPgxKFJB3Q34UCL39HyJjqW7GiNT3ecM7ryYCQ7Mp4uhicB5f',
    xpub: 'xpub661MyMwAqRbcFf62km6gSmFNDd1EG6HDa4jGiEzQc7QaKR5pHaExLvCmdARERzquG8hfEJq6wwWTrCr2KWYQzCY1rfnhpnGm2R2A3Tyv8Wm',
    rawPub: '02d2e2b63f348772aa7fccd2c21234441c352900eeda6da6d60baeb0d9fe3ce293',
    rawPrv: '11b6dfcea36c06afa337236a016192dc783f1b3c5a946b9a37e070c4a8cab5f3',
    path: 'm',
    walletSubPath: '/0/0'
  };

  const keychains = [userKeypair, backupKeypair, bitgoKey, extraKeypair1, extraKeypair2];
  const fakeWallet = new Wallet(bitgo, { id: '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4', private: { keychains: [userKeypair, backupKeypair, bitgoKey] } });

  describe('Generate Address', function() {

    it('generate first address', function() {
      const idAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false });
      idAddress.address.should.equal(fakeWallet.id());
      idAddress.chain.should.equal(0);
      idAddress.index.should.equal(0);
      idAddress.chainPath.should.equal('/0/0');
      idAddress.path.should.equal('/0/0');
      idAddress.outputScript.should.equal('a914d682476e9bd54454a885f9dff1e604e99cef43dc87');
      idAddress.redeemScript.should.equal('522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae');
      idAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate second address', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/1', segwit: false });
      p2shAddress.address.should.equal('2N5y5RLVqdZi7qp5PmzMdPR6YvQzUqBQFWK');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(1);
      p2shAddress.chainPath.should.equal('/0/1');
      p2shAddress.path.should.equal('/0/1');
      p2shAddress.outputScript.should.equal('a9148b8bd3da68ef0f2465523146bd2de33c86b9c87187');
      p2shAddress.redeemScript.should.equal('522102709edb6a2198d364c485a76b981d12065eabde8aa2d85bd7e7a035f7ecb3579b2102a724efed499c05fdb4da1e139700951fae00c006b3283888bdfd1b46979292242102b32abe44d61986ff57b835e3bd16293d93f303d0d8fb0454e2c9cceda5c4929853ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate change address', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/1/0', segwit: false });
      p2shAddress.address.should.equal('2NFj9JrpZc5MyYnCouyREtzNY4eoyKWDfgP');
      p2shAddress.chain.should.equal(1);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/1/0');
      p2shAddress.path.should.equal('/1/0');
      p2shAddress.outputScript.should.equal('a914f69a81fad75ea65ad166da76515291679a4f1ad887');
      p2shAddress.redeemScript.should.equal('5221020b4c4f891a5520f5a0b6818d8d53919552a0d4d806b5fa05c97708079d83737e2102c5cc49bf0331eb0b0890a7e7d87f7e9e0dea515438280dc76834c21d198efe08210370e52cf741ebf4513749d028839d696891eb789ba7a58592cfbc857cdc0a9de753ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true });
      segwitAddress.address.should.equal('2N5EVegRPWnmed2PpqDggZPw7DcNDguRYv8');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a914837e2adcb6f6386fea3c5d40316b282ccf39121d87');
      segwitAddress.redeemScript.should.equal('0020a62afee1d211c5adb9739f81ed4e36330e6cda651c7bdd314e32ccc465ec2203');
      segwitAddress.witnessScript.should.equal('5221027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe53ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address with custom threshold', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true, threshold: 3 });
      segwitAddress.address.should.equal('2NCa6VuAUNenQeZRnQj8PHQwVDgVc97DDcc');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a914d3fc0a95eb85047626d1b64dde10252b945138b187');
      segwitAddress.redeemScript.should.equal('00209ee0c2623c8c050afce517c9ce7cba38c64625e1e97cd402e928d789553c3538');
      segwitAddress.witnessScript.should.equal('5321027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe53ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address with custom keyset', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true, keychains: keychains });
      segwitAddress.address.should.equal('2N9p18EKz583H7unBiT19Jt1bfyBHGsyEZX');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a914b5b50075c69779f3daffdccd2dfa0f0fc11213ac87');
      segwitAddress.redeemScript.should.equal('0020448e0457c42eca18e19dfb00a6a73ecb44b5b2a0dcb48baef32b64d8eccaffff');
      segwitAddress.witnessScript.should.equal('5221027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe2102e6ee6da95e1e96f41285cba9c0b05a03518995da5f35909b219fcfed734b75a2210272b67ddf56f8b7447e5b0bb6b5bc04edbe20a75652595986131de24ea63d473355ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address with custom keyset and threshold', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true, keychains: keychains, threshold: 4 });
      segwitAddress.address.should.equal('2MvQXRwq3AXNMXSKQkJuP81Ye5cah4hytxU');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a91422aaae654226e45a5d526e5100cd837c1ea62ad487');
      segwitAddress.redeemScript.should.equal('002064b7e9639cd8f454012132644c7a445db88c783ad751a9b9bd40ee8e271464a1');
      segwitAddress.witnessScript.should.equal('5421027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe2102e6ee6da95e1e96f41285cba9c0b05a03518995da5f35909b219fcfed734b75a2210272b67ddf56f8b7447e5b0bb6b5bc04edbe20a75652595986131de24ea63d473355ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate p2sh address with custom threshold', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false, threshold: 3 });
      p2shAddress.address.should.equal('2NFnEZjzUhrFAutNCM9fwvQy53SY4wftoJ1');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/0/0');
      p2shAddress.path.should.equal('/0/0');
      p2shAddress.outputScript.should.equal('a914f73024c2f917b82ae5cd4233069fe71b2103d0d987');
      p2shAddress.redeemScript.should.equal('532102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate p2sh address with custom keyset', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false, keychains: keychains });
      p2shAddress.address.should.equal('2MvPfwPEgg2oMRbrBCBqsA34XkpCFARqhbM');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/0/0');
      p2shAddress.path.should.equal('/0/0');
      p2shAddress.outputScript.should.equal('a91422815df4e86b71600c5cc3f37bcc8b026c97801f87');
      p2shAddress.redeemScript.should.equal('522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc21038c80e64d61f7e9a6d36a9dbb86e40288e9aac60f1a33bb47bff9c3a1336a510121032c64677912d511571907444c82fd1abd4807ebef327e2f7bfe41f1951ca8190d55ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate p2sh address with custom keyset and threshold', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false, keychains: keychains, threshold: 4 });
      p2shAddress.address.should.equal('2MsfbMMnNS198FdzDU9rZiTvHSKcw3PizXq');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/0/0');
      p2shAddress.path.should.equal('/0/0');
      p2shAddress.outputScript.should.equal('a914049bd0fa7c1a009070989af606084b720d519b2e87');
      p2shAddress.redeemScript.should.equal('542102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc21038c80e64d61f7e9a6d36a9dbb86e40288e9aac60f1a33bb47bff9c3a1336a510121032c64677912d511571907444c82fd1abd4807ebef327e2f7bfe41f1951ca8190d55ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

  });

  describe('Create Transaction', function() {

    before(co(function *() {
      yield bitgo.authenticateTestUser(bitgo.testUserOTP());
      bitgo._token.should.not.be.empty;
    }));

    it('default p2sh', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/13', segwit: false });
      const unspent = {
        addresses: [
          '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'
        ],
        value: '0.00504422',
        value_int: 504422,
        txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 d039cb3344294a5a384a5508a006444c420cbc11 OP_EQUAL',
          hex: 'a914d039cb3344294a5a384a5508a006444c420cbc1187'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 9,
        id: 61330229
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo p2sh test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737436a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b500483045022100a4a9d2a2d558fd27ec2fb0f9801ae3d08a2e19bc6a0fb9a0d2ea9e4b627979f1022019743101f7102f06e4734e317b261d942aa5b392dcd324c1e360b6a299bc3e41014c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737436a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      signature2.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000fdfe0000483045022100a4a9d2a2d558fd27ec2fb0f9801ae3d08a2e19bc6a0fb9a0d2ea9e4b627979f1022019743101f7102f06e4734e317b261d942aa5b392dcd324c1e360b6a299bc3e4101483045022100b5b6d3e7a0f49ac1effd0f3a39cd5e2db29dd91f537d39086111f4a5a0e42127022023328b7314e312e4e58e70873f631a5bc4c82989041f2060c5d4377f3e6a05ba014c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737436a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
    }));

    it('BCH p2sh', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/13', segwit: false });
      const unspent = {
        addresses: [
          '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'
        ],
        value: '0.00504422',
        value_int: 504422,
        txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 d039cb3344294a5a384a5508a006444c420cbc11 OP_EQUAL',
          hex: 'a914d039cb3344294a5a384a5508a006444c420cbc1187'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 9,
        id: 61330229
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo p2sh test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737436a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add first signature
      transaction.keychain = userKeypair;
      transaction.forceBCH = true;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b500483045022100ecfdf6ac4a98fe18f83537b369c93e8f56bd49b642803449e8c56b8e689653850220554fb1a4320e7eaffdec77273f2349695974c01e8688f34c4042871f5a15eda0414c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737436a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      signature2.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000fdfe0000483045022100ecfdf6ac4a98fe18f83537b369c93e8f56bd49b642803449e8c56b8e689653850220554fb1a4320e7eaffdec77273f2349695974c01e8688f34c4042871f5a15eda04148304502210097976f048bb81e97114db57b1829f09b3e4b8f568db95b7f5d7d0381ce317496022065a26f3829b7a4dfad3dcfa92a41012f8d967f910f7d9215892c05f155c0a35e414c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737436a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
    }));

    it('default segwit', co(function *() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/13', segwit: true });
      const unspent = {
        addresses: [
          '2MxKkH8yB3S9YWmTQRbvmborYQyQnH5petP'
        ],
        value: '0.18750000',
        value_int: 18750000,
        txid: '7d282878a85daee5d46e043827daed57596d75d1aa6e04fd0c09a36f9130881f',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 37b393fce627a0ec634eb543dda1e608e2d1c78a OP_EQUAL',
          hex: 'a91437b393fce627a0ec634eb543dda1e608e2d1c78a87'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331617
      };
      _.extend(unspent, segwitAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: segwitAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo segwit test': 1000 }
      });
      transaction.transactionHex.should.equal('01000000011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000000ffffffff02e803000000000000136a11426974476f207365677769742074657374180f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a8700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f207365677769742074657374180f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870300483045022100c0755d4b42ba0b21396e356b7548cfd3dda6c8c8f69e8f3adc96dc1550ed2a8502207232c77f9b4826012cc7398828f7f7725a95f0def294f684280173893fcc616201695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/d67266f1de905baaee750011fa4b3d88a8e3a1758d5173a659c67709488dde07
      signature2.tx.should.equal('010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f207365677769742074657374180f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870400483045022100c0755d4b42ba0b21396e356b7548cfd3dda6c8c8f69e8f3adc96dc1550ed2a8502207232c77f9b4826012cc7398828f7f7725a95f0def294f684280173893fcc6162014730440220067b11c6b55693620c233d9f9462f30df60c800d1f59e68aa8ecbdafbfe0f2b502202bbda09dd09d3bc427f0e2c6729f033ec34db4ba94761a50bb658a68edfb8d7501695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000');
    }));

    it('BCH segwit should fail', co(function *() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/13', segwit: true });
      const unspent = {
        addresses: [
          '2MxKkH8yB3S9YWmTQRbvmborYQyQnH5petP'
        ],
        value: '0.18750000',
        value_int: 18750000,
        txid: '7d282878a85daee5d46e043827daed57596d75d1aa6e04fd0c09a36f9130881f',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 37b393fce627a0ec634eb543dda1e608e2d1c78a OP_EQUAL',
          hex: 'a91437b393fce627a0ec634eb543dda1e608e2d1c78a87'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331617
      };
      _.extend(unspent, segwitAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: segwitAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo segwit test': 1000 }
      });
      transaction.transactionHex.should.equal('01000000011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000000ffffffff02e803000000000000136a11426974476f207365677769742074657374180f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a8700000000');

      // add first signature
      transaction.keychain = userKeypair;
      transaction.forceBCH = true;
      try {
        yield fakeWallet.signTransaction(transaction);
        throw new Error();
      } catch (e) {
        e.message.should.containEql('BCH does not support segwit inputs');
      }
    }));

    it('3/5 p2sh', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/1/13', segwit: false, keychains: keychains, threshold: 3 });
      const unspent = {
        addresses: [
          '2NBK1thw7RpffyyCGa2aePqueJSUA7pENwf'
        ],
        value: '0.09375000',
        value_int: 9375000,
        txid: '11226fdef22b4d87241dc2e01b1ef39bcbfdfbe8352bfc0c8295a6e7fc5d1545',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 c629d4a1640a55e0703726aeb2aabbcfc5b29de4 OP_EQUAL',
          hex: 'a914c629d4a1640a55e0703726aeb2aabbcfc5b29de487'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331633
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo 3/5 p2sh test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f22110000000000ffffffff02e803000000000000156a13426974476f20332f3520703273682074657374e8fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000f900483045022100902e3d83bd970b70f807fe47ad618f0cc20c17e389865a63662a0cc005e9ea3102204dd28a7a78c35ccaeb5661c92cb45c105b4c313f3f79312e2c30fd381b7790c1014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374e8fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      signature2.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000fd410100483045022100902e3d83bd970b70f807fe47ad618f0cc20c17e389865a63662a0cc005e9ea3102204dd28a7a78c35ccaeb5661c92cb45c105b4c313f3f79312e2c30fd381b7790c101473044022034ad1c81392e12cce379885bac06552fc5c3f94ae77590b750e2a11184584fcc0220448d6b0170c9edb7bc19da2efb6d78739e57b8b68055a5a1ccf77223b295df7d014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374e8fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add third signature
      transaction.transactionHex = signature2.tx;
      transaction.keychain = extraKeypair1;
      const signature3 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/aefe61fdf292e52ff94235e64d08d617a6670bc4ab17b18f499a62194a52c180
      signature3.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000fd8a0100483045022100902e3d83bd970b70f807fe47ad618f0cc20c17e389865a63662a0cc005e9ea3102204dd28a7a78c35ccaeb5661c92cb45c105b4c313f3f79312e2c30fd381b7790c101473044022034ad1c81392e12cce379885bac06552fc5c3f94ae77590b750e2a11184584fcc0220448d6b0170c9edb7bc19da2efb6d78739e57b8b68055a5a1ccf77223b295df7d01483045022100a464797ff020aee8375e9b3dc1a7697209f2a36ba47ad9dde34e8067beeabb18022004589c0b5cfa176085224e527b5e270118495627bef579d65c56c0862fe06744014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374e8fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');
    }));

    it('3/5 segwit', co(function *() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/11/13', segwit: true, keychains: keychains, threshold: 3 });
      const unspent = {
        addresses: [
          '2N2zJWhXvUnRy5KDZKpqkQLGgK8sT6hhyGz'
        ],
        value: '0.04687500',
        value_int: 4687500,
        txid: '5278d64090a8dc62f88e09c88845bd8b1b523b85dd6bd236bcea1cc99a3ac342',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 6adecb920b918a98854914e41f5f1b1628ca166f OP_EQUAL',
          hex: 'a9146adecb920b918a98854914e41f5f1b1628ca166f87'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331653
      };
      _.extend(unspent, segwitAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: segwitAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo 3/5 segwit test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d678520000000000ffffffff02e803000000000000176a15426974476f20332f35207365677769742074657374747b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f8700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f35207365677769742074657374747b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f8703004730440220311ff82eeee3ee62e2691ced56ace632b8c909176958051ca9850d443ce2daa502204c04fef329e9821ef0facfeca963f5e4cd9a7423695e5eaf5b7506015c3beac601ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      signature2.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f35207365677769742074657374747b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f8704004730440220311ff82eeee3ee62e2691ced56ace632b8c909176958051ca9850d443ce2daa502204c04fef329e9821ef0facfeca963f5e4cd9a7423695e5eaf5b7506015c3beac601483045022100d9c17fd7bb34f6560631af7699d1e742e3a29d765c205918031f0e7113d3fb8f02201277cfd094a865f66145efe1723448241627fb04e1e80512777f3d569643f9fd01ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');

      // add third signature
      transaction.transactionHex = signature2.tx;
      transaction.keychain = extraKeypair2;
      const signature3 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/d0afa363519c5fad3db24a59293bf39a50d00c60753ddbade79e92f64c46d2f8
      signature3.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f35207365677769742074657374747b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f8705004730440220311ff82eeee3ee62e2691ced56ace632b8c909176958051ca9850d443ce2daa502204c04fef329e9821ef0facfeca963f5e4cd9a7423695e5eaf5b7506015c3beac601483045022100d9c17fd7bb34f6560631af7699d1e742e3a29d765c205918031f0e7113d3fb8f02201277cfd094a865f66145efe1723448241627fb04e1e80512777f3d569643f9fd01473044022062f7c41c7ce7c82cc57c0dcfeb8ba6f5c4d42e3567a7f4ee2bf33676b6b71615022013b1447044c7dc8ec6d61f2791ab829cd088b264567d88a5fa006f47be0fb4c401ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');
    }));

    it('mixed p2sh & segwit', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/14', segwit: false });
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/14', segwit: true });
      const p2shUnspent = {
        addresses: [
          '2N533fqgyPYKVD892nBRaYmFHbbTykhYSEw'
        ],
        value: '2.99996610',
        value_int: 299996610,
        txid: 'f654ce0a5be3f12df7fecf4ee777b6d86b5aa8c710ef6946ec121206b4f8757c',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 8153e7a35508088b6cf599226792c7de2dbff252 OP_EQUAL',
          hex: 'a9148153e7a35508088b6cf599226792c7de2dbff25287'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331263
      };
      const segwitUnspent = {
        addresses: [
          '2NBtpXcDruf3zRutmF4AbCMFNQHXsGNP6kT'
        ],
        value: '1.50000000',
        value_int: 150000000,
        txid: 'a4409c3f042fae67b890ac3df40ef0db03539c67331fd7e9260511893b4f9f24',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 cc8e7cbf481389d3183a590acfa6aa66eb97c8e1 OP_EQUAL',
          hex: 'a914cc8e7cbf481389d3183a590acfa6aa66eb97c8e187'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61330882
      };
      const addresses = [p2shAddress, segwitAddress];
      const unspents = [p2shUnspent, segwitUnspent].map((unspent, index) => {
        const address = addresses[index];
        _.extend(unspent, address);
        unspent.value = unspent.value_int;
        unspent.tx_hash = unspent.txid;
        unspent.tx_output_n = unspent.n;
        unspent.script = unspent.outputScript;
        return unspent;
      });


      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: unspents,
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        opReturns: { 'BitGo mixed p2sh & segwit test': 400000000 },
        bitgoFee: {
          amount: 81760,
          address: '2ND7jQR5itjGTbh3DKgbpZWSY9ungDrwcwb'
        }
      });
      transaction.transactionHex.should.equal('01000000027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f60100000000ffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a40000000000ffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374ce8ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000b40047304402207409d6f53b65b591a7eb5ed36506f0de571cb1ddad15dd2cf5ad5d2ab62333e90220638e1ea598d4026bf2376143ea2ad9be38b64b0168e39f74a4bd5deb220437e6014c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374ce8ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700030047304402207cee272483185b8d50cba16d7571ba432045e73edddcef4c9f9003075300e2550220379ede34ec8cb0d9348afbc60a5e07b164fcd3b0202d34a5c6e05bd42eac4f9301695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/e2f696bcba91a376c36bb525df8c367938f6e2fd6344c90587bf12802091124c
      signature2.tx.should.equal('010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000fdfd000047304402207409d6f53b65b591a7eb5ed36506f0de571cb1ddad15dd2cf5ad5d2ab62333e90220638e1ea598d4026bf2376143ea2ad9be38b64b0168e39f74a4bd5deb220437e6014830450221009d3a2ac7d3cd6052c176d637327d89f1a0dd739916a09402ed0cc9a2a82ca33c022016c1691d540b279d3e92b3baa8e87008960464d5c6fb4087909c7e1fa1e12365014c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374ce8ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700040047304402207cee272483185b8d50cba16d7571ba432045e73edddcef4c9f9003075300e2550220379ede34ec8cb0d9348afbc60a5e07b164fcd3b0202d34a5c6e05bd42eac4f93014730440220491dfd21fb8373317a575a87bb73bab996a79b28542bdb8bf5276145df339c1f0220101126941550b3e6cecb8a2399d15a9cd52e70b2b45e93cf9a396b781c49535c01695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000');
    }));

  });


  describe('Accelerate Transaction (server mocked)', function accelerateTxMockedDescribe() {

    let bitgo;
    let wallet;
    let bgUrl;
    let smartBitUrl;
    let minChangeSize;

    let parentTxId = '6a74b74df4991d93c32d751336c85b5f2d1ee544a2dfbae2e5f4beb4f914e5e0';
    const outputIdx = 0;
    const outputAddress = '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4';
    const parentTxHex = '01000000000102e1c30f2a424bd339eada830a78286a5606c99d7f8e2e8be1955858d84d375f75000000002322002046d27566b5fa5bc2375cb43c86bfb46c9856c0a0b1bf99f8ec8f89fa6b13ca89ffffffff7c2d3cc1c05db074350595d47f719b5cef0a0fb549ba95b9b9f9cb1056d01cbf0000000023220020a05257bbe2d6db470ea8c367d7b948dff19e99d8d775ab09ee4973db478c8fddffffffff01404397000000000017a91488990f2994b2f11965e9542e0d01da61d9c019cf870400473044022046b0244399c0a56c8a0fdff3f150c520d24961a3de040e61f5b1ba90885710060220557e02802fac7086366cc4a477909372d4057188aaae8496f58d71e66d56869e014730440220161a729f4f9c59aa5ec86007701c8f0ea0c679da46c971c46739abd6ec0c20ef02205b849490fe98811617eeb06d99c7f9ad8b6c69b0c325f2f1e7a43212ab38b63601695221025b864106f997d8a6b2cb38ae96f8e16c64bc62ad2cc1b168fd34f3ba194538ee2102670baf6f5297999203c08c0e0ec24d7367f6b3d4cf7d593dda4a767d1e2c9ddd210371d5623a5e5ee232842631889adf2b7a6cf9a04ea8ad2488726b3f056ddd202053ae0400483045022100838fb910810bccaca63901b4ebec208442553b51df9a87ba0ffde2323730c09502201e567a3741ef3ed8eb4f3f69ef675f5623b631e464e0af9ca3eaf395eb7c52bf01483045022100bcb17e5cda35b70015184c2e795a05ff37b40bf573a1fb855b25117e32a85b1502204296cfbea889847f9fbfd062397a2c6b04f6aa1874326539905ae5c6d49080600169522102befcec96c8f9c785886b90d0b32d1f0b3f400c984221e575a24b69500ee77a5921037b35acc45dffa07bf2b39028797da52c69aefb56f92d2b2fcaaf9ba51c84bae921023fdfd3e337cf97fbe7872a9c6f9d992ca25369c4b0a978dd266d4727e0a2196c53ae00000000';
    const unrelatedTxHex = '01000000000101d1c40822841db824893f4038660019ca443e00b83ed1f016b673d33e043a628801000000232200201b646106e3bd0e7541a2135376a6ee9362715c2f4ea74e2ea28d1de990021834ffffffff028eeb25020000000017a914b634d2464a22e99daa3822432d4903e55ae6482b87102700000000000017a914d682476e9bd54454a885f9dff1e604e99cef43dc870400483045022100c8c3ec442bfcddbc58da45c61252bfa2a50e0b2c91124fa3c5b0667eb8b785c002205e370a583d10a2d19785ae6b256638cb267b18478b5fc3de3d928f1c50e50bd401483045022100d7bd1ec22e2e5d0aa4e31f24d73d1fdefcc1c6caa85af17252a48021ca20b81002201ffa870ffa9d16ce9cd8c72e17bfb7f6698cef293afcc5b45b039114e9b64b200169522103bf0667e3b22adabdba9b05dc48cc5a5fc5c44b7dcbe7855284dee82333eea8b2210399c2e5dcadad8e980c58ea6099ea7a39b4b710576a3a03e65efaa71ff42de6bd21033b883beaa9c7eb0f69a6b3e53b0b267707b256e8764cd33bed87d181a43a272d53ae00000000';
    const walletId = '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4';

    /**
     * Helper function to get the parent transaction ID from a transaction input
     *
     * This function converts `hash` (which is a Buffer object) to a usable txid string.
     * The issue is that the bytes are stored in reverse order in the buffer, so
     * the simple approach of just comparing the hex strings doesn't work.
     * Instead, the Buffer is copied to a new Buffer object, the new Buffer
     * object is reversed in-place, and then the new Buffer is converted to a
     * hex string. After this, the result is a hex string which is the parent txid
     *
     * @param hash a bitcoinjs-lib transaction object's input hash
     */
    function inputParentTxId({ hash }) {
      return Buffer.from(hash).reverse().toString('hex');
    }

    before(function accelerateTxMockedBefore() {
      // no net connects allowed for these tests
      nock.disableNetConnect();

      nock('https://bitgo.fakeurl')
      .get('/api/v1/client/constants')
      .twice()
      .reply(200, { ttl: 3600, constants: {} });

      TestBitGo.prototype._constants = undefined;

      bitgo = new TestBitGo({ env: 'mock' });
      bitgo.initializeTestVars();
      bitgo.setValidate(false);
      wallet = new Wallet(bitgo, { id: walletId, private: { keychains: [userKeypair, backupKeypair, bitgoKey] } });
      wallet.bitgo = bitgo;
      bgUrl = common.Environments[bitgo.getEnv()].uri;
      smartBitUrl = common.Environments[bitgo.getEnv()].smartBitApiBaseUrl;

      // try to get the min change size from the server, otherwise default to 0.1 BTC
      // TODO: minChangeSize is not currently a constant defined on the client and should be added
      minChangeSize = bitgo.getConstants().minChangeSize || 1e7;
    });

    afterEach(function accelerateTxMockedAfterEach() {
      // make sure all nocks are cleared or consumed after each test is run
      nock.activeMocks().length.should.equal(0);
    });

    after(function accelerateTxMockedAfter() {
      // reset nock net connect state to default
      nock.enableNetConnect();
    });

    it('arguments', co(function *coArgumentsIt() {
      try {
        yield wallet.accelerateTransaction({ feeRate: 123 });
        throw new Error();
      } catch (e) {
        e.message.should.match(/^Missing parameter: transactionID$/);
      }

      try {
        yield wallet.accelerateTransaction({ transactionID: 123, feeRate: 123 });
        throw new Error();
      } catch (e) {
        e.message.should.match(/^Expecting parameter string: transactionID but found number$/);
      }

      try {
        yield wallet.accelerateTransaction({ transactionID: '123' });
        throw new Error();
      } catch (e) {
        e.message.should.match(/^Missing parameter: feeRate$/);
      }

      const feeRatesParams = ['123', 0, -10, -Infinity, Infinity, NaN];

      for (const feeRate of feeRatesParams) {
        try {
          yield wallet.accelerateTransaction({ transactionID: '123', feeRate });
          throw new Error(`feeRate value ${feeRate} should have thrown but did not!`);
        } catch (e) {
          e.message.should.match(/^Expecting positive finite number for parameter: feeRate$/);
        }
      }
    }));

    describe('bad input', function badInputDescribe() {

      it('non existant transaction ID', co(function *coNonExistantIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(404, 'transaction not found on this wallet');

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 123 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^404\ntransaction not found on this wallet$/);
        }
      }));

      it('confirmed transaction', co(function *coConfirmedTransactionIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          confirmations: 6
        });

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^Transaction [0-9a-f]+ is already confirmed and cannot be accelerated$/);
        }
      }));

      it('no outputs to wallet', co(function *coNoOutputsToWalletIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          outputs: [
            {
              account: outputAddress,
              value: 1890000,
              vout: 0,
              chain: 0
            }
          ],
          confirmations: 0
        });

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^Transaction [0-9a-f]+ contains no outputs to this wallet, and thus cannot be accelerated$/);
        }
      }));

      /*
       * This test covers the case where a failure occurs during the process of
       * converting an output from the parent transaction into an unspent which
       * can be used to chain the child tx to the parent.
       *
       * This should never happen, but it is possible (for example, in the case
       * of an attempted double spend of the output from the parent, or a race
       * between finding the parent output, and retrieving the corresponding unspent).
       */
      it('cannot find correct unspent to use', co(function *coCannotFindCorrectUnspentIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          outputs: [
            {
              account: outputAddress,
              value: 50 * 1e4,
              vout: outputIdx,
              isMine: true,
              chain: 0
            }
          ],
          confirmations: 0,
          hex: parentTxId,
          fee: 10
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          count: 0,
          unspents: []
        });

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^Could not find unspent output from parent tx to use as child input$/);
        }
      }));

      it('Detects when an incorrect tx hex is returned by the external service', co(function *coIncorrectHexIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          outputs: [
            {
              account: outputAddress,
              value: 10,
              vout: outputIdx,
              isMine: true,
              chain: 0
            }
          ],
          confirmations: 0,
          hex: parentTxHex,
          fee: 10
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          count: 1,
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: outputIdx
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: unrelatedTxHex
            }
          ]
        });

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^Decoded transaction id is [0-9a-f]+, which does not match given txid [0-9a-f]+$/);
        }
      }));

      it('cannot cover child fee with one parent output and one wallet unspent', co(function *coCannotCoverChildFeeIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          outputs: [
            {
              account: outputAddress,
              value: 10,
              vout: outputIdx,
              isMine: true,
              chain: 0
            }
          ],
          confirmations: 0,
          hex: parentTxHex,
          fee: 10
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          count: 1,
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: outputIdx
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: parentTxHex
            }
          ]
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          count: 0,
          unspents: []
        });

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^Insufficient confirmed unspents available to cover the child fee$/);
        }
      }));

      it('cannot lower fee rate', co(function *coCannotLowerFeeRateIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          outputs: [
            {
              account: outputAddress,
              value: 10,
              vout: outputIdx,
              isMine: true,
              chain: 11
            }
          ],
          confirmations: 0,
          hex: parentTxHex,
          fee: 10000 // large fee, and thus fee rate, for parent
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          count: 1,
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: outputIdx
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: parentTxHex
            }
          ]
        });

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^Cannot lower fee rate! \(Parent tx fee rate is \d+\.?\d* sat\/kB, and requested fee rate was \d+\.?\d* sat\/kB\)$/);
        }
      }));

      it('cannot break maximum fee limit for combined transaction', co(function *coCannotBreakMaxFeeLimitIt() {
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          outputs: [
            {
              account: outputAddress,
              value: 3e7,
              vout: outputIdx,
              isMine: true,
              chain: 11
            }
          ],
          confirmations: 0,
          hex: parentTxHex,
          fee: 1000
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          count: 1,
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: outputIdx
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: parentTxHex
            }
          ]
        });

        try {
          yield wallet.accelerateTransaction({ transactionID: parentTxId, feeRate: 2e6 });
          throw new Error();
        } catch (e) {
          e.message.should.match(/^Transaction cannot be accelerated\. Combined fee rate of \d+\.?\d* sat\/kB exceeds maximum fee rate of \d+\.?\d* sat\/kB$/);
        }
      }));
    });

    describe('successful tx acceleration', function successfulTxDescribe() {
      const feeRate = 20000;

      beforeEach(function successfulTxBeforeEach() {
        nock(bgUrl)
        .post(`/api/v1/wallet/${wallet.id()}/address/1`)
        .reply(200, {
          address: '2NCYjG8Q56yr8tx9jazNoYnGKxjgB2MQSfY'
        });

        nock(bgUrl)
        .post('/api/v1/billing/address')
        .reply(200, {
          address: '2NFbvo2HK4eXZm1aqDcSDGGqD64FPt7T6d8'
        });

        nock(bgUrl)
        .get('/api/v1/tx/fee')
        .query(true)
        .reply(200, {
          feePerKb: 0
        });

        nock(bgUrl)
        .post(`/api/v1/keychain/${userKeypair.xpub}`, {})
        .reply(200, {
          encryptedXprv: bitgo.encrypt({ input: userKeypair.xprv, password: TestBitGo.TEST_WALLET1_PASSCODE }),
          path: userKeypair.path + userKeypair.walletSubPath
        });
      });

      it('accelerates a stuck tx without additional unspents', co(function *coAcceleratesWithoutAdditionalIt() {
        parentTxId = '75cfc5a7b214c4b73c92c7b02608cde70b226767a9576f84c04407e43fd385bd';
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          fee: 434,
          outputs: [
            {
              vout: 0,
              value: 10348500,
              isMine: true,
              chain: 1
            },
            {
              vout: 1,
              value: 10000,
              isMine: true,
              chain: 11
            }
          ]
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: 0,
              value: 10348500,
              redeemScript: '0020f7b58d455351b7b8ddd7c8986d98244f6a95f0746720091537323b967800f744',
              chainPath: '/11/160',
              witnessScript: '5221027f0b45bb4155ea532e3b4312fe0be80166f297d1e0753d2d4a9118c073ad6514210310aa9d68c98831625f329b7826b6c3e3b53e16736b1994b8902442bdcd6653d121026e0ca414f2488b0ab572b99e0ae5442911ab4e0821b2709d885175a527fd552b53ae'
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: '010000000001019cc0e63e8e037873d309f0f75b374202cd3bb228354f443f2751589016f9551f00000000232200209e70056b49ced4964c2abd091907a21bb2a6dd75f372460b009ec3b5e96f2730ffffffff02d4e79d000000000017a914f9a7950e9666348ae37826d83bfe96cd2e15312f87102700000000000017a914d682476e9bd54454a885f9dff1e604e99cef43dc8704004730440220647338bf8501a92f3b70e766806a29c0320afbd679bf1a72167908e45f592a80022079726e7e6c6a54e74c788025065a97cfc5d03cf780f082f5db4894928cc3567f0147304402200eef494043c0fced8370f7aaaa9d7328d439f9bda694ba6205f7b1e24c0de17002205b9078530524f27eb0c59fd4aafb8efa73646c90f8c9021e7a056531477624d00169522103abfd364d46f23e5ad8a166d2e42dda06014c86661a11e00947d1ed3f29277a2d2103cb22468f629363aba24e080a79828a660970c307977a51be1146ba2abe611fe921030cbcfec6a39f063a38332b60f0a29da571e02aa6624752f7dd031699d8f44fc653ae00000000'
            }
          ]
        });

        nock(bgUrl)
        .post('/api/v1/tx/send', (body) => {
          return !body.ignoreMaxFeeRate;
        })
        .reply(200, function(_, body) {
          return {
            transaction: JSON.parse(body).tx
          };
        });

        const childTx = yield wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE
        });

        should.exist(childTx);
        childTx.should.have.property('status', 'accepted');
        childTx.should.have.property('tx');

        // assert the following:
        // 0) The child tx has exactly one input
        // 1) The parent tx output is an input
        // 2) The child tx has exactly one output
        // 3) The child tx output meets the minimum change threshold
        const decodedChild = bitcoin.Transaction.fromHex(childTx.tx);
        decodedChild.ins.length.should.equal(1);
        decodedChild.outs.length.should.equal(1);

        const childInput = decodedChild.ins[0];
        childInput.should.have.property('index', 0);
        childInput.should.have.property('hash');

        const inputTxId = inputParentTxId(childInput);
        inputTxId.should.equal(parentTxId);

        const childOutput = decodedChild.outs[0];
        childOutput.should.have.property('value');
        childOutput.value.should.be.above(minChangeSize);
      }));

      it('accelerates a stuck tx with one additional segwit unspent', co(function *coAcceleratesWithAdditionalSegwitIt() {
        parentTxId = '8815f202c8654b6c8b295749545c711878cd845a14cb1ea982394d0c14945c33';
        const additionalUnspentTxId = '07d6ee57b024ce2b6108f67847454a0a79a4fcfb98ab255553a2993a1a170b87';
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          fee: 1336,
          outputs: [
            {
              vout: 0,
              value: 10000,
              isMine: true,
              chain: 11
            },
            {
              vout: 1,
              value: 8664,
              isMine: true,
              chain: 1
            }
          ],
          confirmations: 0
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: 0,
              value: 10000,
              redeemScript: '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
              chainPath: '/0/0'
            }
          ]
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: additionalUnspentTxId,
              tx_output_n: 0,
              value: 19935526,
              redeemScript: '0020d34ef6dd34ef2a4fbea67c541c1c796749a60afe4a97fee8ec7ded188bd749da',
              chainPath: '/11/155',
              witnessScript: '522102219d2aa8417633f0bce3911374a1604c1b64161f83a3c2ee409c27c42355f08e2102c9734920dc4da06c289fe69171dfcd75e3b9b4f190d0cbc3d5d0ff3f5fdeeaae2103ccd68d7fa8dc0d02dd45dad165557a48582eda4435fae7377b3c31e08ad065c953ae'
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: '01000000025f4acdcb5efe0b5800b8dda3ee8c37c322a9e4e2a92943bcd60f677cfb57fa2700000000fdfe0000483045022100fd5dcf7df6207a33e74c4846e2ba32b0759e7aaeac1cb7ce19d3ce01e209682302203340830e46b6f005f138b359118afa8f1ac5272860480c1e21d7b986011f151201483045022100ba9edc93c3aedeb2c82f1698f14d28cce4f61e193a9b9085739c78edc6b53b95022015e39c5b0453873fdc2cbd15f360da9d6be61fcd7e66be6e691d23f5c8e20ecc014c69522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53aeffffffffb8d7c3fe34a2a53033ec84e31880b9e47e4b70ff25c75ac42438d3a9b39da19201000000fc004730440220418e7695f5fb6b8b29e8bdd174e8a0379a6dc2af64554055eae751904fed78eb0220430bf2a2593b8b4c4442a9c4a949ce746ed4999dbbd272a3dc4d7572e1e27154014730440220227079fc5811fd6501046c255766afd3448676e98ec72fcc559dbf9986081ac302200a844b3187f0ff2a2a0fae3b258421eb057aeb8152702f6d6136dcb4818203c1014c69522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53aeffffffff02102700000000000017a914d682476e9bd54454a885f9dff1e604e99cef43dc87d82100000000000017a914afa36ee1e58397ab03059e53346b64c920ac0f0e8700000000'
            }
          ]
        });

        nock(bgUrl)
        .post('/api/v1/tx/send', (body) => {
          return !body.ignoreMaxFeeRate;
        })
        .reply(200, function(_, body) {
          return {
            transaction: JSON.parse(body).tx
          };
        });

        const childTx = yield wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE
        });

        should.exist(childTx);
        childTx.should.have.property('status', 'accepted');
        childTx.should.have.property('tx');

        // assert the following:
        // 0) The child tx has exactly two inputs
        // 1) The parent tx output is an input
        // 2) The additional unspent output is an input
        // 3) The child tx has exactly one output
        // 4) The child tx output meets the minimum change threshold
        const decodedChild = bitcoin.Transaction.fromHex(childTx.tx);
        decodedChild.ins.length.should.equal(2);
        decodedChild.outs.length.should.equal(1);

        let inputFromParent = undefined;
        let additionalInput = undefined;

        _.forEach(decodedChild.ins, (input) => {
          input.should.have.property('hash');
          input.should.have.property('index');

          const inputTxId = inputParentTxId(input);

          if (inputTxId === parentTxId) {
            inputFromParent = input;
          } else {
            additionalInput = input;
          }
        });

        should.exist(inputFromParent);
        const inputFromParentHash = inputParentTxId(inputFromParent);
        inputFromParentHash.should.equal(parentTxId);
        inputFromParent.index.should.equal(0);

        should.exist(additionalInput);
        const additionalInputHash = inputParentTxId(additionalInput);
        additionalInputHash.should.equal(additionalUnspentTxId);
        additionalInput.index.should.equal(0);

        const childOutput = decodedChild.outs[0];
        childOutput.should.have.property('value');
        childOutput.value.should.be.above(minChangeSize);
      }));

      it('accelerates a stuck tx with one additional P2SH unspent', co(function *coAcceleratesWithAdditionalP2SHIt() {
        parentTxId = '8815f202c8654b6c8b295749545c711878cd845a14cb1ea982394d0c14945c33';
        const additionalUnspentTxId = 'e190310f2f3f71aa8846f1161cbce1533c24a857dd24e4501b131feb400aad58';
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          fee: 1336,
          outputs: [
            {
              vout: 0,
              value: 10000,
              isMine: true,
              chain: 11
            },
            {
              vout: 1,
              value: 8664,
              isMine: true,
              chain: 1
            }
          ],
          confirmations: 0
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: 0,
              value: 10000,
              redeemScript: '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
              chainPath: '/0/0'
            }
          ]
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: additionalUnspentTxId,
              tx_output_n: 1,
              value: 20000000,
              redeemScript: '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
              chainPath: '/0/0'
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: '01000000025f4acdcb5efe0b5800b8dda3ee8c37c322a9e4e2a92943bcd60f677cfb57fa2700000000fdfe0000483045022100fd5dcf7df6207a33e74c4846e2ba32b0759e7aaeac1cb7ce19d3ce01e209682302203340830e46b6f005f138b359118afa8f1ac5272860480c1e21d7b986011f151201483045022100ba9edc93c3aedeb2c82f1698f14d28cce4f61e193a9b9085739c78edc6b53b95022015e39c5b0453873fdc2cbd15f360da9d6be61fcd7e66be6e691d23f5c8e20ecc014c69522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53aeffffffffb8d7c3fe34a2a53033ec84e31880b9e47e4b70ff25c75ac42438d3a9b39da19201000000fc004730440220418e7695f5fb6b8b29e8bdd174e8a0379a6dc2af64554055eae751904fed78eb0220430bf2a2593b8b4c4442a9c4a949ce746ed4999dbbd272a3dc4d7572e1e27154014730440220227079fc5811fd6501046c255766afd3448676e98ec72fcc559dbf9986081ac302200a844b3187f0ff2a2a0fae3b258421eb057aeb8152702f6d6136dcb4818203c1014c69522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53aeffffffff02102700000000000017a914d682476e9bd54454a885f9dff1e604e99cef43dc87d82100000000000017a914afa36ee1e58397ab03059e53346b64c920ac0f0e8700000000'
            }
          ]
        });

        nock(bgUrl)
        .post('/api/v1/tx/send', (body) => {
          return !body.ignoreMaxFeeRate;
        })
        .reply(200, function(_, body) {
          return {
            transaction: JSON.parse(body).tx
          };
        });

        const childTx = yield wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE
        });

        should.exist(childTx);
        childTx.should.have.property('status', 'accepted');
        childTx.should.have.property('tx');

        // assert the following:
        // 0) The child tx has exactly two inputs
        // 1) The parent tx output is an input
        // 2) The additional unspent output is an input
        // 3) The child tx has exactly one output
        // 4) The child tx output meets the minimum change threshold
        const decodedChild = bitcoin.Transaction.fromHex(childTx.tx);
        decodedChild.ins.length.should.equal(2);
        decodedChild.outs.length.should.equal(1);

        let inputFromParent = undefined;
        let additionalInput = undefined;

        _.forEach(decodedChild.ins, (input) => {
          input.should.have.property('hash');
          input.should.have.property('index');

          const inputHash = inputParentTxId(input);

          if (inputHash === parentTxId) {
            inputFromParent = input;
          } else {
            additionalInput = input;
          }
        });

        should.exist(inputFromParent);
        const inputFromParentHash = inputParentTxId(inputFromParent);
        inputFromParentHash.should.equal(parentTxId);
        inputFromParent.index.should.equal(0);

        should.exist(additionalInput);
        const additionalInputHash = inputParentTxId(additionalInput);
        additionalInputHash.should.equal(additionalUnspentTxId);
        additionalInput.index.should.equal(1);

        const childOutput = decodedChild.outs[0];
        childOutput.should.have.property('value');
        childOutput.value.should.be.above(minChangeSize);
      }));

      it('accelerates a stuck tx with two additional unspents (segwit and P2SH)', co(function *coAcceleratesWithAdditionalP2SHIt() {
        parentTxId = '8815f202c8654b6c8b295749545c711878cd845a14cb1ea982394d0c14945c33';
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          fee: 1336,
          outputs: [
            {
              vout: 0,
              value: 10000,
              isMine: true,
              chain: 11
            },
            {
              vout: 1,
              value: 8664,
              isMine: true,
              chain: 1
            }
          ],
          confirmations: 0
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: 0,
              value: 10000,
              redeemScript: '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
              chainPath: '/0/0'
            }
          ]
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: 'e190310f2f3f71aa8846f1161cbce1533c24a857dd24e4501b131feb400aad58',
              tx_output_n: 1,
              value: 800000,
              redeemScript: '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
              chainPath: '/0/0'
            },
            {
              tx_hash: '07d6ee57b024ce2b6108f67847454a0a79a4fcfb98ab255553a2993a1a170b87',
              tx_output_n: 0,
              value: 20006284,
              redeemScript: '0020d34ef6dd34ef2a4fbea67c541c1c796749a60afe4a97fee8ec7ded188bd749da',
              chainPath: '/11/155',
              witnessScript: '522102219d2aa8417633f0bce3911374a1604c1b64161f83a3c2ee409c27c42355f08e2102c9734920dc4da06c289fe69171dfcd75e3b9b4f190d0cbc3d5d0ff3f5fdeeaae2103ccd68d7fa8dc0d02dd45dad165557a48582eda4435fae7377b3c31e08ad065c953ae'
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: '01000000025f4acdcb5efe0b5800b8dda3ee8c37c322a9e4e2a92943bcd60f677cfb57fa2700000000fdfe0000483045022100fd5dcf7df6207a33e74c4846e2ba32b0759e7aaeac1cb7ce19d3ce01e209682302203340830e46b6f005f138b359118afa8f1ac5272860480c1e21d7b986011f151201483045022100ba9edc93c3aedeb2c82f1698f14d28cce4f61e193a9b9085739c78edc6b53b95022015e39c5b0453873fdc2cbd15f360da9d6be61fcd7e66be6e691d23f5c8e20ecc014c69522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53aeffffffffb8d7c3fe34a2a53033ec84e31880b9e47e4b70ff25c75ac42438d3a9b39da19201000000fc004730440220418e7695f5fb6b8b29e8bdd174e8a0379a6dc2af64554055eae751904fed78eb0220430bf2a2593b8b4c4442a9c4a949ce746ed4999dbbd272a3dc4d7572e1e27154014730440220227079fc5811fd6501046c255766afd3448676e98ec72fcc559dbf9986081ac302200a844b3187f0ff2a2a0fae3b258421eb057aeb8152702f6d6136dcb4818203c1014c69522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53aeffffffff02102700000000000017a914d682476e9bd54454a885f9dff1e604e99cef43dc87d82100000000000017a914afa36ee1e58397ab03059e53346b64c920ac0f0e8700000000'
            }
          ]
        });

        nock(bgUrl)
        .post('/api/v1/tx/send', (body) => {
          return !body.ignoreMaxFeeRate;
        })
        .reply(200, function(_, body) {
          return {
            transaction: JSON.parse(body).tx
          };
        });

        const childTx = yield wallet.accelerateTransaction({
          transactionID: parentTxId,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          feeRate
        });

        should.exist(childTx);
        childTx.should.have.property('status', 'accepted');
        childTx.should.have.property('tx');

        // assert the following:
        // 0) The child tx has exactly three inputs
        // 1) The parent tx output is an input
        // 2) The child tx has exactly one output
        // 3) The child tx output meets the minimum change threshold
        const decodedChild = bitcoin.Transaction.fromHex(childTx.tx);
        decodedChild.ins.length.should.equal(3);
        decodedChild.outs.length.should.equal(1);

        let inputFromParent = undefined;
        const additionalInputs = [];

        _.forEach(decodedChild.ins, (input) => {
          input.should.have.property('hash');
          input.should.have.property('index');

          const inputHash = inputParentTxId(input);

          if (inputHash === parentTxId) {
            inputFromParent = input;
          } else {
            additionalInputs.push(input);
          }
        });

        should.exist(inputFromParent);
        const inputFromParentHash = inputParentTxId(inputFromParent);
        inputFromParentHash.should.equal(parentTxId);
        inputFromParent.index.should.equal(0);

        additionalInputs.length.should.equal(2);

        const childOutput = decodedChild.outs[0];
        childOutput.should.have.property('value');
        childOutput.value.should.be.above(minChangeSize);
      }));

      it('correctly uses the ignoreMaxFeeRate parameter only when necessary', co(function *coUsesIgnoreMaxFeeRateIt() {
        parentTxId = '75cfc5a7b214c4b73c92c7b02608cde70b226767a9576f84c04407e43fd385bd';
        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
        .reply(200, {
          fee: 434,
          outputs: [
            {
              vout: 0,
              value: 10348500,
              isMine: true,
              chain: 0
            },
            {
              vout: 1,
              value: 10000,
              isMine: true,
              chain: 11
            }
          ]
        });

        nock(bgUrl)
        .get(`/api/v1/wallet/${wallet.id()}/unspents`)
        .query(true)
        .reply(200, {
          unspents: [
            {
              tx_hash: parentTxId,
              tx_output_n: 0,
              value: 10348500,
              redeemScript: '0020f7b58d455351b7b8ddd7c8986d98244f6a95f0746720091537323b967800f744',
              chainPath: '/11/160',
              witnessScript: '5221027f0b45bb4155ea532e3b4312fe0be80166f297d1e0753d2d4a9118c073ad6514210310aa9d68c98831625f329b7826b6c3e3b53e16736b1994b8902442bdcd6653d121026e0ca414f2488b0ab572b99e0ae5442911ab4e0821b2709d885175a527fd552b53ae'
            }
          ]
        });

        nock(smartBitUrl)
        .get(`/blockchain/tx/${parentTxId}/hex`)
        .reply(200, {
          success: true,
          hex: [
            {
              hex: '010000000001019cc0e63e8e037873d309f0f75b374202cd3bb228354f443f2751589016f9551f00000000232200209e70056b49ced4964c2abd091907a21bb2a6dd75f372460b009ec3b5e96f2730ffffffff02d4e79d000000000017a914f9a7950e9666348ae37826d83bfe96cd2e15312f87102700000000000017a914d682476e9bd54454a885f9dff1e604e99cef43dc8704004730440220647338bf8501a92f3b70e766806a29c0320afbd679bf1a72167908e45f592a80022079726e7e6c6a54e74c788025065a97cfc5d03cf780f082f5db4894928cc3567f0147304402200eef494043c0fced8370f7aaaa9d7328d439f9bda694ba6205f7b1e24c0de17002205b9078530524f27eb0c59fd4aafb8efa73646c90f8c9021e7a056531477624d00169522103abfd364d46f23e5ad8a166d2e42dda06014c86661a11e00947d1ed3f29277a2d2103cb22468f629363aba24e080a79828a660970c307977a51be1146ba2abe611fe921030cbcfec6a39f063a38332b60f0a29da571e02aa6624752f7dd031699d8f44fc653ae00000000'
            }
          ]
        });

        nock(bgUrl)
        .post('/api/v1/tx/send', (body) => {
          // ignore max fee rate must be set for this test
          return body.ignoreMaxFeeRate;
        })
        .reply(200);

        // monkey patch the bitgo getConstants() function
        const oldGetConstants = bitgo.__proto__.getConstants;
        bitgo.__proto__.getConstants = () => ({
          // child fee rate in this test is 31378 sat/kb
          // so set the max fee rate just below that limit,
          // but above the combined fee rate of 20000
          maxFeeRate: 30000
        });

        yield wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE
        });

        bitgo.__proto__.getConstants = oldGetConstants;
      }));
    });
  });

});
