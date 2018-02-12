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

require('should');

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
      transaction.transactionHex.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b500483045022100e760bffb404c523ef7d60a63a9b3b8612750022572a4fe61a2186777e3ae698e02204df3c75afa3300d0ede0bcdd634b1fdbe0377be2df00002f5552f350172d3f4f014c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      signature2.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000fdfe0000483045022100e760bffb404c523ef7d60a63a9b3b8612750022572a4fe61a2186777e3ae698e02204df3c75afa3300d0ede0bcdd634b1fdbe0377be2df00002f5552f350172d3f4f01483045022100a3e49dd7d5a3e01d0b74208e3b2ef99e6ab847e05125aaacce9227ae426dbfcf0220121fa5e0f1752d40c3dd01f9a2ec9012712105502736a21289c6f3cd5af7abd9014c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
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
      transaction.transactionHex.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add first signature
      transaction.keychain = userKeypair;
      transaction.forceBCH = true;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('020000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b5004830450221009e63ff1c8b0860073bc06bbce84f20568251a31f7a12c0ce300dc024e416f28202200b0dcb4a3b6b2cda1886ea6c020884907efd517d23d97e84fbf411aa65d280dd414c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      signature2.tx.should.equal('020000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b400473044022037ec6e87075b9bcf958c8cc98502d745e24e3236d806a6443892ba04f1e022a10220622760c7eb6ad3138560bfdde82e30b3346bd416311d02664ae4fd9e88c08288414c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
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
      transaction.transactionHex.should.equal('01000000011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000000ffffffff02e803000000000000136a11426974476f207365677769742074657374220f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a8700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f207365677769742074657374220f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870300483045022100b69bcf45425eff113f3cfbb67f3669f4d2c96dcd97498a518ddcb7efd014bc1a022071135f2ac79374e8a0af36a758beea9bcadab6e27983c79ab510a6d6004a8a7101695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/d67266f1de905baaee750011fa4b3d88a8e3a1758d5173a659c67709488dde07
      signature2.tx.should.equal('010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f207365677769742074657374220f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870400483045022100b69bcf45425eff113f3cfbb67f3669f4d2c96dcd97498a518ddcb7efd014bc1a022071135f2ac79374e8a0af36a758beea9bcadab6e27983c79ab510a6d6004a8a710147304402201ab788fc78a50d0b851a8b81021f97b36505895cb1d4283403a65d17c1e4caa202201e3dd1101b5a483eef131b2413923323fd0eef1262219fc565960c6c815afcd201695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000');
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
      transaction.transactionHex.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f22110000000000ffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000f900483045022100e44398b712a8e4c194276cdacb15ef42dbc8cf78d118d18aee6423168b0694a20220520661c9d4c74bb4ec420179acdcc44aa65f35bf88c4024e3312018929226ea5014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      signature2.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000fd420100483045022100e44398b712a8e4c194276cdacb15ef42dbc8cf78d118d18aee6423168b0694a20220520661c9d4c74bb4ec420179acdcc44aa65f35bf88c4024e3312018929226ea501483045022100907cacba94cf0b152249a073454fe6638fd1ad2b24ad90537ff6808a3f3728c2022004352d5285938b21bf9e3a78d5350a8e92b72215aa9287aac4f58c3a9af40f9e014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add third signature
      transaction.transactionHex = signature2.tx;
      transaction.keychain = extraKeypair1;
      const signature3 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/aefe61fdf292e52ff94235e64d08d617a6670bc4ab17b18f499a62194a52c180
      signature3.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000fd8a0100483045022100e44398b712a8e4c194276cdacb15ef42dbc8cf78d118d18aee6423168b0694a20220520661c9d4c74bb4ec420179acdcc44aa65f35bf88c4024e3312018929226ea501483045022100907cacba94cf0b152249a073454fe6638fd1ad2b24ad90537ff6808a3f3728c2022004352d5285938b21bf9e3a78d5350a8e92b72215aa9287aac4f58c3a9af40f9e01473044022044bb8eafa2e6d3c9d0ab9bbe851271343718c24dde98cf03431e39c985b052ae022069a300aa694f347283acbe7f2ec3c9d9e6ac16851dd03f5e63dc49eb94bf2883014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');
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
      transaction.transactionHex.should.equal('010000000142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d678520000000000ffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f8700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f87030047304402207d6e26a688a7739289f016577b0bdbf9f6b5428152264b0741c30caf0cdb9f760220036b2e136e9d60c6c3511665495ad60340e556d44aaf722c48ab2f7fa3bf433b01ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      signature2.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f87040047304402207d6e26a688a7739289f016577b0bdbf9f6b5428152264b0741c30caf0cdb9f760220036b2e136e9d60c6c3511665495ad60340e556d44aaf722c48ab2f7fa3bf433b0147304402204ba908bdfb1d6fbdedbcd7b809095da113ade62056953c5d37bf49ef975917e502206ff0f1612cde1cb7c27b9cb8498d340997ac20beff6ec4dd7ab41272e0a8e4db01ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');

      // add third signature
      transaction.transactionHex = signature2.tx;
      transaction.keychain = extraKeypair2;
      const signature3 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/d0afa363519c5fad3db24a59293bf39a50d00c60753ddbade79e92f64c46d2f8
      signature3.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f87050047304402207d6e26a688a7739289f016577b0bdbf9f6b5428152264b0741c30caf0cdb9f760220036b2e136e9d60c6c3511665495ad60340e556d44aaf722c48ab2f7fa3bf433b0147304402204ba908bdfb1d6fbdedbcd7b809095da113ade62056953c5d37bf49ef975917e502206ff0f1612cde1cb7c27b9cb8498d340997ac20beff6ec4dd7ab41272e0a8e4db014830450221009454f0be335392888b74bd8048b78eb64150faed6eeb89e547c670fd30301974022002127e309f1642072f438f310cbe9f62043b52b21f8909437e73e752805d31dc01ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');
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
      transaction.transactionHex.should.equal('01000000027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f60100000000ffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a40000000000ffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374e28ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000b40047304402206b92ff7c1b4381fd7279cd263f1e8f41dee8c892b9405633f3274e0e795a4add02205ad4eab4a1f716fa4e5d8681bb38525b0c1d140a2f155c2031f0636518128407014c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374e28ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba987000300473044022022780c8721d54c6b128e96f43fd2a48c96956efd1b659cdf1ad2ebfe0974cc4b022016f2e9b3f017aef95dba9bccca02d4c8484342169613c1fd189e5b109f56a15401695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/e2f696bcba91a376c36bb525df8c367938f6e2fd6344c90587bf12802091124c
      signature2.tx.should.equal('010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000fdfd000047304402206b92ff7c1b4381fd7279cd263f1e8f41dee8c892b9405633f3274e0e795a4add02205ad4eab4a1f716fa4e5d8681bb38525b0c1d140a2f155c2031f063651812840701483045022100c21634dc6b9915d42a97f7dee53902a9dc40cdc9f29a1a9eeb726328187bcc2202205e2b3782f11a5246d2773581c926bae1aaebdfab1d9a33d176e4e50d531a652d014c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374e28ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba987000400473044022022780c8721d54c6b128e96f43fd2a48c96956efd1b659cdf1ad2ebfe0974cc4b022016f2e9b3f017aef95dba9bccca02d4c8484342169613c1fd189e5b109f56a15401483045022100f4da608dfd1428ddd20c6df951bc7da04067f933c648c4eb3e4ce0966f35f433022055ce495629d7db5312b381756057cdea5933396cdca4be4b658d1a22ba87c69f01695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000');
    }));

  });

});
