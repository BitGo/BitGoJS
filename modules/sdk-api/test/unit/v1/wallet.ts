//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

import { getFixture } from './fixtures';

const Wallet = require('../../../src/v1/wallet');
import { BitGoAPI } from '../../../src/bitgoAPI';
import * as _ from 'lodash';
import { common } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import * as should from 'should';
import * as nock from 'nock';
import * as sinon from 'sinon';

import { getFixtures } from './fixtures/accelerate-tx';

nock.disableNetConnect();

const TestBitGo = {
  TEST_WALLET1_PASSCODE: 'iVWeATjqLS1jJShrPpETti0b',
};
const originalFetchConstants = BitGoAPI.prototype.fetchConstants;
BitGoAPI.prototype.fetchConstants = function () {
  // @ts-expect-error - no implicit this
  nock(this._baseUrl).get('/api/v1/client/constants').reply(200, { ttl: 3600, constants: {} });

  // force client constants reload
  BitGoAPI['_constants'] = undefined;

  return originalFetchConstants.apply(this, arguments as any);
};
describe('Wallet Prototype Methods', function () {
  const fixtures = getFixtures();

  let bitgo = new BitGoAPI({ env: 'test' });
  // bitgo.initializeTestVars();

  const userKeypair = {
    xprv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    xpub: 'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp',
    rawPub: '02c103ac74481874b5ef0f385d12725e4f14aedc9e00bc814ce96f47f62ce7adf2',
    rawPrv: '936c5af3f8af81f75cdad1b08f29e7d9c01e598e2db2d7be18b9e5a8646e87c6',
    path: 'm',
    walletSubPath: '/0/0',
  };
  const backupKeypair = {
    xprv: 'xprv9s21ZrQH143K47sEkLkykgYmq1xF5ZWrPYhUZcmBpPFMQojvGUmEcr5jFXYGfr8CpFdpTvhQ7L9NN2rLtsBFjSix3BAjwJcBj6U3D5hxTPc',
    xpub: 'xpub661MyMwAqRbcGbwhrNHz7pVWP3njV2Ehkmd5N1AoNinLHc54p25VAeQD6q2oTS3uuDMDnfnXnthbS9ufC8JVYpNnWU5Rn3pYaNuLCNywkw1',
    rawPub: '03bbcb73997977068d9e36666bbd5cd37579acae8e2bd5ce9d0a6e5c150a423bc3',
    rawPrv: '77a15f14796f4001d1092ae84f766bd869e9bee6bffae6547def5045b96fa943',
    path: 'm',
    walletSubPath: '/0/0',
  };
  const bitgoKey = {
    xpub: 'xpub661MyMwAqRbcGQcVFiwcrtc7c3vopsX96jsJUYPcFMREcRTqAqsqbv2ZRyCJAPLm5NMHCy85E3ZwpT4EAUw9WGU7vMhG6z83hDeKXBWn6Lf',
    path: 'm',
    walletSubPath: '/0/0',
  };

  const fakeWallet = new Wallet(bitgo, {
    id: '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4',
    private: { keychains: [userKeypair, backupKeypair, bitgoKey] },
  });

  describe('Generate Address', function () {
    before(() => nock.pendingMocks().should.be.empty());

    it('generate first address', function () {
      const idAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false });
      idAddress.address.should.equal(fakeWallet.id());
      idAddress.chain.should.equal(0);
      idAddress.index.should.equal(0);
      idAddress.chainPath.should.equal('/0/0');
      idAddress.path.should.equal('/0/0');
      idAddress.outputScript.should.equal('a914d682476e9bd54454a885f9dff1e604e99cef43dc87');
      idAddress.redeemScript.should.equal(
        '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae'
      );
      idAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate second address', function () {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/1', segwit: false });
      p2shAddress.address.should.equal('2N5y5RLVqdZi7qp5PmzMdPR6YvQzUqBQFWK');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(1);
      p2shAddress.chainPath.should.equal('/0/1');
      p2shAddress.path.should.equal('/0/1');
      p2shAddress.outputScript.should.equal('a9148b8bd3da68ef0f2465523146bd2de33c86b9c87187');
      p2shAddress.redeemScript.should.equal(
        '522102709edb6a2198d364c485a76b981d12065eabde8aa2d85bd7e7a035f7ecb3579b2102a724efed499c05fdb4da1e139700951fae00c006b3283888bdfd1b46979292242102b32abe44d61986ff57b835e3bd16293d93f303d0d8fb0454e2c9cceda5c4929853ae'
      );
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate change address', function () {
      const p2shAddress = fakeWallet.generateAddress({ path: '/1/0', segwit: false });
      p2shAddress.address.should.equal('2NFj9JrpZc5MyYnCouyREtzNY4eoyKWDfgP');
      p2shAddress.chain.should.equal(1);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/1/0');
      p2shAddress.path.should.equal('/1/0');
      p2shAddress.outputScript.should.equal('a914f69a81fad75ea65ad166da76515291679a4f1ad887');
      p2shAddress.redeemScript.should.equal(
        '5221020b4c4f891a5520f5a0b6818d8d53919552a0d4d806b5fa05c97708079d83737e2102c5cc49bf0331eb0b0890a7e7d87f7e9e0dea515438280dc76834c21d198efe08210370e52cf741ebf4513749d028839d696891eb789ba7a58592cfbc857cdc0a9de753ae'
      );
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address', function () {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true });
      segwitAddress.address.should.equal('2N5EVegRPWnmed2PpqDggZPw7DcNDguRYv8');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a914837e2adcb6f6386fea3c5d40316b282ccf39121d87');
      segwitAddress.redeemScript.should.equal('0020a62afee1d211c5adb9739f81ed4e36330e6cda651c7bdd314e32ccc465ec2203');
      segwitAddress.witnessScript.should.equal(
        '5221027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe53ae'
      );
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });
  });

  describe('Create Transaction', function () {
    let bgUrl, bgUrlTest;
    let fakeProdWallet;

    before(function () {
      nock.pendingMocks().should.be.empty();
      const prodBitgo = new BitGoAPI({ env: 'prod' });
      // prodBitgo.initializeTestVars();
      bgUrl = common.Environments[prodBitgo.getEnv()].uri;
      fakeProdWallet = new Wallet(prodBitgo, {
        id: '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4',
        private: { keychains: [userKeypair, backupKeypair, bitgoKey] },
      });
      bgUrlTest = common.Environments[bitgo.getEnv()].uri;
    });

    it('extra unspent fetch params', async function () {
      const billingAddress = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
      const customUnspentsFetchParams = { test: 123 };
      const sendAmount = 1e5;

      nock(bgUrl).post('/api/v1/billing/address').reply(200, { address: billingAddress });

      const scope = nock(bgUrl)
        .get(`/api/v1/wallet/${fakeProdWallet.id()}/unspents`)
        .query(
          _.merge(customUnspentsFetchParams, {
            segwit: true,
            target: sendAmount,
            minSize: 0,
          })
        )
        .reply(200, { unspents: [] });

      await fakeProdWallet
        .createTransaction({
          unspentsFetchParams: customUnspentsFetchParams,
          recipients: { [billingAddress]: sendAmount },
          feeRate: 10000,
          bitgoFee: {
            amount: 0,
            address: '',
          },
        })
        .should.be.rejectedWith('0 unspents available for transaction creation');

      scope.isDone().should.be.true();
    });

    it('default p2sh', async function () {
      const p2shAddress = fakeProdWallet.generateAddress({ path: '/0/13', segwit: false });
      const unspent: any = {
        addresses: ['2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'],
        value: '0.00504422',
        value_int: 504422,
        txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 d039cb3344294a5a384a5508a006444c420cbc11 OP_EQUAL',
          hex: 'a914d039cb3344294a5a384a5508a006444c420cbc1187',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 9,
        id: 61330229,
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      nock(bgUrl).post('/api/v1/billing/address').reply(200, { address: '2MswQjkvN6oWYdE7L2brJ5cAAMjPmG59oco' });

      const transaction = (await fakeProdWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: '',
        },
        opReturns: { 'BitGo p2sh test': 1000 },
      })) as any;
      transaction.transactionHex.should.equal(
        '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000'
      );

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = (await fakeProdWallet.signTransaction(transaction)) as any;
      signature1.tx.should.equal(
        '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b600473044022021fa73d5fe61ac8942cd70ff4507c574677ce747de5bc46c3dd2e38ec2448fce022047906d2c0154337ab96041e8fb58c243b9bce5f8818fa991643c1260a1859ad80100004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000'
      );

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = (await fakeProdWallet.signTransaction(transaction)) as any;
      // This transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      // Note that the tx hex below no longer corresponds to the above transaction because our fee estimation has
      // changed, changing the output amounts and thus the tx hex.
      signature2.tx.should.equal(
        '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000fdfd0000473044022021fa73d5fe61ac8942cd70ff4507c574677ce747de5bc46c3dd2e38ec2448fce022047906d2c0154337ab96041e8fb58c243b9bce5f8818fa991643c1260a1859ad80147304402202ae01f01b5ae0c3fa7d67ac73db81932cb5aca10db16a99063fef45e3f1398cd022055001ba7e163cb350910fc7321ecd7eb6359b321d4c04887484d9c7284b78c4701004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000'
      );
    });

    it('BCH p2sh', async function () {
      const p2shAddress = fakeProdWallet.generateAddress({ path: '/0/13', segwit: false });
      const unspent: any = {
        addresses: ['2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'],
        value: '0.00504422',
        value_int: 504422,
        txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 d039cb3344294a5a384a5508a006444c420cbc11 OP_EQUAL',
          hex: 'a914d039cb3344294a5a384a5508a006444c420cbc1187',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 9,
        id: 61330229,
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      nock(bgUrl).post('/api/v1/billing/address').reply(200, { address: '2MswQjkvN6oWYdE7L2brJ5cAAMjPmG59oco' });

      const transaction = (await fakeProdWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: '',
        },
        opReturns: { 'BitGo p2sh test': 1000 },
      })) as any;
      transaction.transactionHex.should.equal(
        '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000'
      );

      // add first signature
      transaction.keychain = userKeypair;
      transaction.forceBCH = true;
      const signature1 = (await fakeProdWallet.signTransaction(transaction)) as any;
      signature1.tx.should.equal(
        '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b60047304402206221a97f081d87e02e3b14988a64861811a6a8de4f11f74f5aaea45981cf612e022077a08a5bd7d781e79838afbb126af2e48802fefad660afdbd8805f5e598ed5884100004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000'
      );
      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = (await fakeProdWallet.signTransaction(transaction)) as any;
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      // Note that the tx hex below no longer corresponds to the above transaction because our fee estimation has
      // changed, changing the output amounts and thus the tx hex.
      signature2.tx.should.equal(
        '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000fdfe000047304402206221a97f081d87e02e3b14988a64861811a6a8de4f11f74f5aaea45981cf612e022077a08a5bd7d781e79838afbb126af2e48802fefad660afdbd8805f5e598ed5884148304502210082bc546293858459f3895db24c85ccf37505c56f8faf4bb8f78cf40135bc2f2b02203dc1c78d7c7ceaf6b924eca3c39b95e8a227b069a07047581273136b47ca7ac441004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000'
      );
    });

    it('default segwit', async function () {
      const segwitAddress = fakeProdWallet.generateAddress({ path: '/10/13', segwit: true });
      const unspent: any = {
        addresses: ['2MxKkH8yB3S9YWmTQRbvmborYQyQnH5petP'],
        value: '0.18750000',
        value_int: 18750000,
        txid: '7d282878a85daee5d46e043827daed57596d75d1aa6e04fd0c09a36f9130881f',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 37b393fce627a0ec634eb543dda1e608e2d1c78a OP_EQUAL',
          hex: 'a91437b393fce627a0ec634eb543dda1e608e2d1c78a87',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331617,
      };
      _.extend(unspent, segwitAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      nock(bgUrl).post('/api/v1/billing/address').reply(200, { address: '2MswQjkvN6oWYdE7L2brJ5cAAMjPmG59oco' });

      const transaction = (await fakeProdWallet.createTransaction({
        changeAddress: segwitAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: '',
        },
        opReturns: { 'BitGo segwit test': 1000 },
      })) as any;
      transaction.transactionHex.should.equal(
        '01000000011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000000ffffffff02e803000000000000136a11426974476f2073656777697420746573740e0f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a8700000000'
      );

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = (await fakeProdWallet.signTransaction(transaction)) as any;
      signature1.tx.should.equal(
        '010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f2073656777697420746573740e0f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870500483045022100bf3a8914a1bfe92661f27ca37c0d6b5c0b3c7353614c955646929f2e7eb89ffe02202d556b0ffab37c104bae67406ca16f8859cfa37c6a40f2013d89afcecd5594f3010000695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000'
      );

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = (await fakeProdWallet.signTransaction(transaction)) as any;
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/d67266f1de905baaee750011fa4b3d88a8e3a1758d5173a659c67709488dde07
      // Note that the tx hex below no longer corresponds to the above transaction because our fee estimation has
      // changed, changing the output amounts and thus the tx hex.
      signature2.tx.should.equal(
        '010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f2073656777697420746573740e0f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870500483045022100bf3a8914a1bfe92661f27ca37c0d6b5c0b3c7353614c955646929f2e7eb89ffe02202d556b0ffab37c104bae67406ca16f8859cfa37c6a40f2013d89afcecd5594f30147304402205cf8d2f2be6ce083d35654bdc3fa85d7e71b227d457e9245bb603b21e7b5165102203ea686226db8320e08c26bfb304048b3a9473d0e05797d3658dacb2f09a2b51c0100695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000'
      );
    });

    it('creates an unsigned tx made of uncompressed public keys of v1 safe wallet', async function () {
      const { address, redeemScript, scriptPubKey } = await getFixture(`${__dirname}/fixtures/sign-transaction.json`);
      const testBitgo = new BitGoAPI({ env: 'test' });
      const fakeTestV1SafeWallet = new Wallet(testBitgo, {
        id: address,
        private: { safe: { redeemScript } },
      });
      const unspentsToSpend = [
        {
          value: 100000,
          redeemScript,
          script: scriptPubKey,
          tx_hash: 'a55d11dc8b701bd19601fbfe711a1e465fc8f128ec4474e78e1fd087e808e5fe',
          tx_output_n: 0,
          confirmations: 1,
        },
        {
          value: 100000,
          redeemScript,
          script: scriptPubKey,
          tx_hash: '48fb879cec879356045a331937023aed859f5dc5db955a1dc8a5ccf29f49d108',
          tx_output_n: 0,
          confirmations: 1,
        },
      ];
      const recipients = {
        '2MyGxrhLC4kRfuVjLqCVYFtC7DchhgMCiNz': 191340, // purposely set to simulate a sweep transaction
      };

      const scope = nock(bgUrlTest)
        .post('/api/v1/billing/address')
        .reply(200, { address: '2N3L9cu9WN2Df7Xvb1Y8owokuDVj5Hdyv4i' });

      const result = await fakeTestV1SafeWallet.createTransaction({
        recipients,
        unspents: unspentsToSpend,
        feeRate: 10000, // 10 sat/byte
        bitgoFee: {
          amount: 0,
          address: '',
        },
      });

      scope.isDone().should.be.true();

      result.estimatedSize.should.equal(866);
      result.fee.should.equal(8660);
      // This should equal to 1 because this is a sweep transaction but due to hardcoded addition of
      // 1 change output in transactionBuilder, it is 2.
      // Because of this the estimated size of the transactions is more than what it actually is in the hex.
      result.txInfo.nOutputs.should.equal(2);
    });

    it('signs an unsigned tx made of uncompressed public keys of v1 safe wallet & verifies signatures', async function () {
      const {
        address,
        redeemScript,
        scriptPubKey,
        userKeyWIF: userSigningKey,
        bitgoKeyWIF: bitgoSigningKey,
        unsignedTxHex,
        halfSignedTxHex,
        fullSignedTxHex,
      } = await getFixture(`${__dirname}/fixtures/sign-transaction.json`);
      const testBitgo = new BitGoAPI({ env: 'test' });
      const fakeTestV1SafeWallet = new Wallet(testBitgo, {
        id: address,
        private: { safe: { redeemScript } },
      });
      const unspentsToSpend = [
        { value: 100000, redeemScript, script: scriptPubKey },
        { value: 100000, redeemScript, script: scriptPubKey },
      ];
      const halfSignedTx = await fakeTestV1SafeWallet.signTransaction({
        transactionHex: unsignedTxHex,
        signingKey: userSigningKey,
        unspents: unspentsToSpend,
        validate: true,
      });
      halfSignedTx.tx.should.equal(halfSignedTxHex);

      const fullSignedTx = await fakeTestV1SafeWallet.signTransaction({
        transactionHex: halfSignedTxHex,
        signingKey: bitgoSigningKey,
        unspents: unspentsToSpend,
        validate: true,
        fullLocalSigning: true,
      });
      // Upon calling txb.build() instead after getting 2 valid signatures, we get a valid full signed tx that was broadcast
      // and confirmed on testnet here: https://mempool.space/testnet/tx/bde09f1bd5e6661c28d90e4c96291853e21ba15ab42f3e4a30719decb73e791b
      // It's present in the fullSignedTxHexBuildComplete property of the fixture.
      fullSignedTx.tx.should.equal(fullSignedTxHex);
    });

    it('BCH segwit should fail', async function () {
      const segwitAddress = fakeProdWallet.generateAddress({ path: '/10/13', segwit: true });
      const unspent: any = {
        addresses: ['2MxKkH8yB3S9YWmTQRbvmborYQyQnH5petP'],
        value: '0.18750000',
        value_int: 18750000,
        txid: '7d282878a85daee5d46e043827daed57596d75d1aa6e04fd0c09a36f9130881f',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 37b393fce627a0ec634eb543dda1e608e2d1c78a OP_EQUAL',
          hex: 'a91437b393fce627a0ec634eb543dda1e608e2d1c78a87',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331617,
      };
      _.extend(unspent, segwitAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      nock(bgUrl).post('/api/v1/billing/address').reply(200, { address: '2MswQjkvN6oWYdE7L2brJ5cAAMjPmG59oco' });

      const transaction = (await fakeProdWallet.createTransaction({
        changeAddress: segwitAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: '',
        },
        opReturns: { 'BitGo segwit test': 1000 },
      })) as any;
      transaction.transactionHex.should.equal(
        '01000000011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000000ffffffff02e803000000000000136a11426974476f2073656777697420746573740e0f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a8700000000'
      );

      // add first signature
      transaction.keychain = userKeypair;
      transaction.forceBCH = true;
      (() => fakeProdWallet.signTransaction(transaction)).should.throw('BCH does not support segwit inputs');
    });

    it('mixed p2sh & segwit', async function () {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/14', segwit: false });
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/14', segwit: true });
      const p2shUnspent = {
        addresses: ['2N533fqgyPYKVD892nBRaYmFHbbTykhYSEw'],
        value: '2.99996610',
        value_int: 299996610,
        txid: 'f654ce0a5be3f12df7fecf4ee777b6d86b5aa8c710ef6946ec121206b4f8757c',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 8153e7a35508088b6cf599226792c7de2dbff252 OP_EQUAL',
          hex: 'a9148153e7a35508088b6cf599226792c7de2dbff25287',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331263,
      };
      const segwitUnspent = {
        addresses: ['2NBtpXcDruf3zRutmF4AbCMFNQHXsGNP6kT'],
        value: '1.50000000',
        value_int: 150000000,
        txid: 'a4409c3f042fae67b890ac3df40ef0db03539c67331fd7e9260511893b4f9f24',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 cc8e7cbf481389d3183a590acfa6aa66eb97c8e1 OP_EQUAL',
          hex: 'a914cc8e7cbf481389d3183a590acfa6aa66eb97c8e187',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61330882,
      };
      const addresses = [p2shAddress, segwitAddress];
      const unspents = [p2shUnspent, segwitUnspent].map((unspent: any, index) => {
        const address = addresses[index];
        _.extend(unspent, address);
        unspent.value = unspent.value_int;
        unspent.tx_hash = unspent.txid;
        unspent.tx_output_n = unspent.n;
        unspent.script = unspent.outputScript;
        return unspent;
      });

      const transaction = (await fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: unspents,
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        opReturns: { 'BitGo mixed p2sh & segwit test': 400000000 },
        bitgoFee: {
          amount: 81760,
          address: '2ND7jQR5itjGTbh3DKgbpZWSY9ungDrwcwb',
        },
      })) as any;
      transaction.transactionHex.should.equal(
        '01000000027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f60100000000ffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a40000000000ffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374b08ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700000000'
      );

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = (await fakeProdWallet.signTransaction(transaction)) as any;
      signature1.tx.should.equal(
        '010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000b700483045022100ffc45d93cbaf4c1c850e21f277c5b311d3e3957f1338955cb165d72a768a054c022052020593b36781eea00a9f8dcbeb76608f920c7a933a9088318ab2f70c11e1d90100004c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374b08ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700050047304402205898bee711467c09a5e22e1dcb1a11fce1a0d6ea129d911f813f87c7d45e067b02202f69fb118bbf0b072ed26d72cf8073e7acd66c205419a4a00f86a7ba0f6e3dd6010000695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000'
      );

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = (await fakeProdWallet.signTransaction(transaction)) as any;
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/e2f696bcba91a376c36bb525df8c367938f6e2fd6344c90587bf12802091124c
      // Note that the tx hex below no longer corresponds to the above transaction because our fee estimation has
      // changed, changing the output amounts and thus the tx hex.
      signature2.tx.should.equal(
        '010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000fdff0000483045022100ffc45d93cbaf4c1c850e21f277c5b311d3e3957f1338955cb165d72a768a054c022052020593b36781eea00a9f8dcbeb76608f920c7a933a9088318ab2f70c11e1d9014830450221008254d100401a3a831ed019e1662dbd90b96c6c4072b81ce640d152bc29295c10022013f86c5af5716234999a7bd6e94fc8f428f7697cc3138b3649d0ec4dd8681bc701004c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374b08ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700050047304402205898bee711467c09a5e22e1dcb1a11fce1a0d6ea129d911f813f87c7d45e067b02202f69fb118bbf0b072ed26d72cf8073e7acd66c205419a4a00f86a7ba0f6e3dd60147304402207713d671b45989688e2665c2b11ab7e5ea8d57eb14f9da233c095dabe441308d022069521b5aeb071b07a70a7197a0c2bbc40a23ae63a04160cf3627250c4ba4c40f0100695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000'
      );
    });

    it('should send to bech32 recipient', async function () {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/14', segwit: false });
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/14', segwit: true });
      const p2shUnspent = {
        addresses: ['2N533fqgyPYKVD892nBRaYmFHbbTykhYSEw'],
        value: '2.99996610',
        value_int: 299996610,
        txid: 'f654ce0a5be3f12df7fecf4ee777b6d86b5aa8c710ef6946ec121206b4f8757c',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 8153e7a35508088b6cf599226792c7de2dbff252 OP_EQUAL',
          hex: 'a9148153e7a35508088b6cf599226792c7de2dbff25287',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331263,
      };
      const segwitUnspent = {
        addresses: ['2NBtpXcDruf3zRutmF4AbCMFNQHXsGNP6kT'],
        value: '1.50000000',
        value_int: 150000000,
        txid: 'a4409c3f042fae67b890ac3df40ef0db03539c67331fd7e9260511893b4f9f24',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 cc8e7cbf481389d3183a590acfa6aa66eb97c8e1 OP_EQUAL',
          hex: 'a914cc8e7cbf481389d3183a590acfa6aa66eb97c8e187',
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61330882,
      };
      const addresses = [p2shAddress, segwitAddress];
      const unspents = [p2shUnspent, segwitUnspent].map((unspent: any, index) => {
        const address = addresses[index];
        _.extend(unspent, address);
        unspent.value = unspent.value_int;
        unspent.tx_hash = unspent.txid;
        unspent.tx_output_n = unspent.n;
        unspent.script = unspent.outputScript;
        return unspent;
      });

      const transaction = (await fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: unspents,
        recipients: { tb1qguzyk4w6kaqtpsczs5aj0w8r7598jq36egm8e98wqph3rwmex68seslgsg: 300000 },
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        opReturns: { 'BitGo mixed p2sh & segwit test': 400000000 },
        bitgoFee: {
          amount: 81760,
          address: '2ND7jQR5itjGTbh3DKgbpZWSY9ungDrwcwb',
        },
      })) as any;
      transaction.transactionHex.should.equal(
        '01000000027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f60100000000ffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a40000000000ffffffff04e09304000000000022002047044b55dab740b0c302853b27b8e3f50a79023aca367c94ee006f11bb79368f0084d71700000000206a1e426974476f206d69786564207032736820262073656777697420746573747cfaf4020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700000000'
      );

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = (await fakeProdWallet.signTransaction(transaction)) as any;
      signature1.tx.should.equal(
        '010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000b7004830450221008809377634e667d6e19f38a138a55b2b6370312af76a5ca3b776df61fc719617022021d90347b9085ab71a76c8400f984e322c15451ecc673dd37de30887436d37b40100004c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff04e09304000000000022002047044b55dab740b0c302853b27b8e3f50a79023aca367c94ee006f11bb79368f0084d71700000000206a1e426974476f206d69786564207032736820262073656777697420746573747cfaf4020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba9870005004830450221008b95ac83e44c727b79ffbf4571171925d06f883a05c122b3b33c055f0bffa70102207b5ee3412ea8a5cec4a5c386f1b464ab68d531c6c697077bc462c05eb44a2832010000695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000'
      );

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = (await fakeProdWallet.signTransaction(transaction)) as any;
      console.log('signature1 ' + JSON.stringify(signature2));
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/e2f696bcba91a376c36bb525df8c367938f6e2fd6344c90587bf12802091124c
      // Note that the tx hex below no longer corresponds to the above transaction because our fee estimation has
      // changed, changing the output amounts and thus the tx hex.
      signature2.tx.should.equal(
        '010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000fdfe00004830450221008809377634e667d6e19f38a138a55b2b6370312af76a5ca3b776df61fc719617022021d90347b9085ab71a76c8400f984e322c15451ecc673dd37de30887436d37b40147304402205a58e602042b8e8a5da509d19ce31050147dd0ffcfbe2bb337c23d4c88f4cc41022075bfa455d1f74e30fbd9c786cd4811a1defe54310f235b4193ce4ffa0e8309a101004c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff04e09304000000000022002047044b55dab740b0c302853b27b8e3f50a79023aca367c94ee006f11bb79368f0084d71700000000206a1e426974476f206d69786564207032736820262073656777697420746573747cfaf4020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba9870005004830450221008b95ac83e44c727b79ffbf4571171925d06f883a05c122b3b33c055f0bffa70102207b5ee3412ea8a5cec4a5c386f1b464ab68d531c6c697077bc462c05eb44a283201473044022053690234582a6911a28cae9f534c980b7d7918749a7413c1c59327debf16ff0b022056175f5c27a363416b2ce4791aefc3d55545cacbd0527202e869e1127fc2f24d0100695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000'
      );
    });
  });

  describe('Send Many', function () {
    it('responds with proper fee and fee rate', async function () {
      const params = {
        recipients: [
          {
            address: '2MutpXVYs8Lyk74pVDn3eAG7xnK4Wc2kjTQ',
            amount: 300000,
          },
        ],
      };
      const unspents = [
        {
          value: 8170,
        },
        {
          value: 800000,
        },
      ];
      const createAndSignResponse = {
        bitgoFee: 0,
        travelInfos: [],
        unspents,
        tx: 'halfsignedhex',
      };
      sinon.stub(fakeWallet, 'createAndSignTransaction').returns(Promise.resolve(createAndSignResponse));
      const getSendTxResponse = () => ({
        status: 'accepted',
        tx: '0100000000010228b5c3e2789d4770fc397ec79fa7255f86235297c5a04def678b481b8b09e81b0100000023220020b3bbe067960be39501f365b8999d53f2a8285d8d9836f61fad020e6a4a9e26fdffffffff1510e90411a86c49f2a52546a32a03febde2bc604741f0e85dc47adec33f515900000000fdfd0000483045022100a44bbf97b155c57703862be69d2b20c4b2ab9e94f402595880bf74402ccc87e202200a4aaf98f939b65c98ca08eb96074c222ecb1fc37e359b1d67a05f1c56dedfc001473044022003f3989a14284f132bbb550118c20256d4ea737704123a29955acc1d03ea6eb7022017223da7edcf73076d89875aa33360aa6a12141807f683c6c1b9a5a0d3ff6019014c695221025789857cc8be110ff4cbf354b52dd0e7e9326c6bfe0aee6c30c1ee69660c3dc02102f58f1b1516d05814ae688ca701856695e27050e3e16d3a2351284d7af84498882102385c7bcec3f38c13e87b558aebf2f20a8928e7ecbe11e7c3a47792bc8e33fe8853aeffffffff02e09304000000000017a9141d0c791cec3af1f37808d42f04593095d6fdea268705bc07000000000017a914d8c720f646c7c56c5467248e47c72dc0b2d30bbc87040047304402201eaa1359fffd3bdec5b48268bd2f15193a299c22b1970356f390883473324651022074186232f02245af9c0977031448c2c99e7b7e2b05b2ba4b32c3227d8ca1494e01483045022100bd61b37051c28533ea0b00dda75b1c4f1dee1b683bb7351b2d8dd720f6dfbe1102203acc4cf9d2dd44b294aa25812e99e7d8eb3730e4ff6f889d3cdcd525195750b8016952210219d093c18c27cb547737b4a49dddac9c3412b10e9f880eb30053c3eba81928542103747118892cac1b4da11526fc4ebeebe168dae0907cefb1a1812541cd46b07602210339f73b6750f8f91efd484b5aa2974321a6cc2776d5bd78b9cfb5fe18e3b2d66253ae005a9e1600',
        hash: 'f8df43c2c650b3bb11277aee4531db99a715fa3b9dfd3d45a8d171342c1bf780',
        instant: false,
      });
      const expectedResult = Object.assign(
        {
          fee: 1285,
          feeRate: 2519.607843137255,
        },
        getSendTxResponse()
      );
      sinon.stub(fakeWallet, 'sendTransaction').resolves(getSendTxResponse());
      const result = (await fakeWallet.sendMany(params)) as any;
      result.tx.should.equal(expectedResult.tx);
      result.fee.should.equal(expectedResult.fee);
      result.feeRate.should.equal(expectedResult.feeRate);
    });
  });

  describe('Accelerate Transaction (server mocked)', function accelerateTxMockedDescribe() {
    let wallet;
    let bgUrl;
    let explorerUrl;
    let minChangeSize;

    let parentTxId = '6a74b74df4991d93c32d751336c85b5f2d1ee544a2dfbae2e5f4beb4f914e5e0';
    const outputIdx = 0;
    const outputAddress = '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4';
    const unrelatedTxId = '08f5e0b4acb5ab8245229dfe161ce4ca0da1ec983e7a34b09e72f56979a467df';
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
    function inputParentTxId({ hash }): string {
      return (Buffer.from(hash).reverse() as Buffer).toString('hex');
    }

    before(function accelerateTxMockedBefore() {
      nock.pendingMocks().should.be.empty();

      bitgo = new BitGoAPI({ env: 'mock' });
      // bitgo.initializeTestVars();
      bitgo.setValidate(false);
      wallet = new Wallet(bitgo, { id: walletId, private: { keychains: [userKeypair, backupKeypair, bitgoKey] } });
      (wallet as any).bitgo = bitgo;
      bgUrl = common.Environments[bitgo.getEnv()].uri;
      explorerUrl = common.Environments[bitgo.getEnv()].btcExplorerBaseUrl;

      // try to get the min change size from the server, otherwise default to 0.1 BTC
      // TODO: minChangeSize is not currently a constant defined on the client and should be added
      minChangeSize = 1e7;
    });

    after(function accelerateTxMockedAfter() {
      // make sure all nocks are cleared or consumed after the tests are complete
      nock.pendingMocks().should.be.empty();
    });

    it('arguments', async () => {
      await wallet.accelerateTransaction({ feeRate: 123 }).should.be.rejectedWith(/^Missing parameter: transactionID$/);

      await wallet
        .accelerateTransaction({ transactionID: 123, feeRate: 123 })
        .should.be.rejectedWith(/^Expecting parameter string: transactionID but found number$/);

      await wallet
        .accelerateTransaction({ transactionID: '123' })
        .should.be.rejectedWith(/^Missing parameter: feeRate$/);

      const feeRatesParams = ['123', 0, -10, -Infinity, Infinity, NaN];
      for (const feeRate of feeRatesParams) {
        await wallet
          .accelerateTransaction({ transactionID: '123', feeRate })
          .should.be.rejectedWith(/^Expecting positive finite number for parameter: feeRate$/);
      }
    });

    describe('bad input', function badInputDescribe() {
      after(() => {
        // make sure all nocks are cleared or consumed after the tests are complete
        nock.pendingMocks().should.be.empty();
      });

      it('non existent transaction ID', async () => {
        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
          .reply(404, 'transaction not found on this wallet');

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 123 })
          .should.be.rejectedWith(/^404\ntransaction not found on this wallet$/);
      });

      it('confirmed transaction', async () => {
        nock(bgUrl).get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`).reply(200, {
          confirmations: 6,
        });

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 })
          .should.be.rejectedWith(/^Transaction [0-9a-f]+ is already confirmed and cannot be accelerated$/);
      });

      it('no outputs to wallet', async () => {
        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
          .reply(200, {
            outputs: [
              {
                account: outputAddress,
                value: 1890000,
                vout: 0,
                chain: 0,
              },
            ],
            confirmations: 0,
          });

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 })
          .should.be.rejectedWith(
            /^Transaction [0-9a-f]+ contains no outputs to this wallet, and thus cannot be accelerated$/
          );
      });

      /*
       * This test covers the case where a failure occurs during the process of
       * converting an output from the parent transaction into an unspent which
       * can be used to chain the child tx to the parent.
       *
       * This should never happen, but it is possible (for example, in the case
       * of an attempted double spend of the output from the parent, or a race
       * between finding the parent output, and retrieving the corresponding unspent).
       */
      it('cannot find correct unspent to use', async () => {
        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
          .reply(200, {
            outputs: [
              {
                account: outputAddress,
                value: 50 * 1e4,
                vout: outputIdx,
                isMine: true,
                chain: 0,
              },
            ],
            confirmations: 0,
            hex: parentTxId,
            fee: 10,
          });

        nock(bgUrl).get(`/api/v1/wallet/${wallet.id()}/unspents`).query(true).reply(200, {
          count: 0,
          unspents: [],
        });

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 })
          .should.be.rejectedWith(/^Could not find unspent output from parent tx to use as child input$/);
      });

      it('Detects when an incorrect tx hex is returned by the external service', async () => {
        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
          .reply(200, {
            outputs: [
              {
                account: outputAddress,
                value: 10,
                vout: outputIdx,
                isMine: true,
                chain: 0,
              },
            ],
            confirmations: 0,
            hex: fixtures[parentTxId],
            fee: 10,
          });

        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/unspents`)
          .query(true)
          .reply(200, {
            count: 1,
            unspents: [
              {
                tx_hash: parentTxId,
                tx_output_n: outputIdx,
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[unrelatedTxId]);

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 })
          .should.be.rejectedWith(/^Decoded transaction id is [0-9a-f]+, which does not match given txid [0-9a-f]+$/);
      });

      it('cannot cover child fee with one parent output and one wallet unspent', async () => {
        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
          .reply(200, {
            outputs: [
              {
                account: outputAddress,
                value: 10,
                vout: outputIdx,
                isMine: true,
                chain: 0,
              },
            ],
            confirmations: 0,
            hex: fixtures[parentTxId],
            fee: 10,
          });

        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/unspents`)
          .query(true)
          .reply(200, {
            count: 1,
            unspents: [
              {
                tx_hash: parentTxId,
                tx_output_n: outputIdx,
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        nock(bgUrl).get(`/api/v1/wallet/${wallet.id()}/unspents`).query(true).reply(200, {
          count: 0,
          unspents: [],
        });

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 })
          .should.be.rejectedWith(/^Insufficient confirmed unspents available to cover the child fee$/);
      });

      it('cannot lower fee rate', async () => {
        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
          .reply(200, {
            outputs: [
              {
                account: outputAddress,
                value: 10,
                vout: outputIdx,
                isMine: true,
                chain: 11,
              },
            ],
            confirmations: 0,
            hex: fixtures[parentTxId],
            fee: 10000, // large fee, and thus fee rate, for parent
          });

        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/unspents`)
          .query(true)
          .reply(200, {
            count: 1,
            unspents: [
              {
                tx_hash: parentTxId,
                tx_output_n: outputIdx,
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 2000 })
          .should.be.rejectedWith(
            /^Cannot lower fee rate! \(Parent tx fee rate is \d+\.?\d* sat\/kB, and requested fee rate was \d+\.?\d* sat\/kB\)$/
          );
      });

      it('cannot break maximum fee limit for combined transaction', async () => {
        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/tx/${parentTxId}`)
          .reply(200, {
            outputs: [
              {
                account: outputAddress,
                value: 3e7,
                vout: outputIdx,
                isMine: true,
                chain: 11,
              },
            ],
            confirmations: 0,
            hex: fixtures[parentTxId],
            fee: 1000,
          });

        nock(bgUrl)
          .get(`/api/v1/wallet/${wallet.id()}/unspents`)
          .query(true)
          .reply(200, {
            count: 1,
            unspents: [
              {
                tx_hash: parentTxId,
                tx_output_n: outputIdx,
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        await wallet
          .accelerateTransaction({ transactionID: parentTxId, feeRate: 2e6 })
          .should.be.rejectedWith(
            /^Transaction cannot be accelerated\. Combined fee rate of \d+\.?\d* sat\/kB exceeds maximum fee rate of \d+\.?\d* sat\/kB$/
          );
      });
    });

    describe('successful tx acceleration', function successfulTxDescribe() {
      const feeRate = 20000;

      beforeEach(() => {
        nock(bgUrl).post(`/api/v1/wallet/${wallet.id()}/address/1`).reply(200, {
          address: '2NCYjG8Q56yr8tx9jazNoYnGKxjgB2MQSfY',
        });

        nock(bgUrl).post('/api/v1/billing/address').reply(200, {
          address: '2NFbvo2HK4eXZm1aqDcSDGGqD64FPt7T6d8',
        });

        nock(bgUrl).get('/api/v1/tx/fee').query(true).reply(200, {
          feePerKb: 0,
        });

        nock(bgUrl)
          .post(`/api/v1/keychain/${userKeypair.xpub}`, {})
          .reply(200, {
            encryptedXprv: bitgo.encrypt({ input: userKeypair.xprv, password: TestBitGo.TEST_WALLET1_PASSCODE }),
            path: userKeypair.path + userKeypair.walletSubPath,
          });
      });

      it('accelerates a stuck tx without additional unspents', async () => {
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
                chain: 1,
              },
              {
                vout: 1,
                value: 10000,
                isMine: true,
                chain: 11,
              },
            ],
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
                witnessScript:
                  '5221027f0b45bb4155ea532e3b4312fe0be80166f297d1e0753d2d4a9118c073ad6514210310aa9d68c98831625f329b7826b6c3e3b53e16736b1994b8902442bdcd6653d121026e0ca414f2488b0ab572b99e0ae5442911ab4e0821b2709d885175a527fd552b53ae',
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        nock(bgUrl)
          .post('/api/v1/tx/send', (body) => {
            return !body.ignoreMaxFeeRate;
          })
          .reply(200, function (_, body) {
            return {
              transaction: (body as any).tx,
            };
          });

        const childTx = await wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
        });

        should.exist(childTx);
        childTx.should.have.property('status', 'accepted');
        childTx.should.have.property('tx');

        // assert the following:
        // 0) The child tx has exactly one input
        // 1) The parent tx output is an input
        // 2) The child tx has exactly one output
        // 3) The child tx output meets the minimum change threshold
        const decodedChild = utxolib.bitgo.createTransactionFromHex(childTx.tx, utxolib.networks.bitcoin);
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
      });

      it('accelerates a stuck tx with one additional segwit unspent', async () => {
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
                chain: 11,
              },
              {
                vout: 1,
                value: 8664,
                isMine: true,
                chain: 1,
              },
            ],
            confirmations: 0,
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
                redeemScript:
                  '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
                chainPath: '/0/0',
              },
            ],
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
                witnessScript:
                  '522102219d2aa8417633f0bce3911374a1604c1b64161f83a3c2ee409c27c42355f08e2102c9734920dc4da06c289fe69171dfcd75e3b9b4f190d0cbc3d5d0ff3f5fdeeaae2103ccd68d7fa8dc0d02dd45dad165557a48582eda4435fae7377b3c31e08ad065c953ae',
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        nock(bgUrl)
          .post('/api/v1/tx/send', (body) => {
            return !body.ignoreMaxFeeRate;
          })
          .reply(200, function (_, body) {
            return {
              transaction: (body as any).tx,
            };
          });

        const childTx = await wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
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
        const decodedChild = utxolib.bitgo.createTransactionFromHex(childTx.tx, utxolib.networks.bitcoin);
        decodedChild.ins.length.should.equal(2);
        decodedChild.outs.length.should.equal(1);

        let inputFromParent: any = undefined;
        let additionalInput: any = undefined;

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
      });

      it('accelerates a stuck tx with one additional P2SH unspent', async () => {
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
                chain: 11,
              },
              {
                vout: 1,
                value: 8664,
                isMine: true,
                chain: 1,
              },
            ],
            confirmations: 0,
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
                redeemScript:
                  '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
                chainPath: '/0/0',
              },
            ],
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
                redeemScript:
                  '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
                chainPath: '/0/0',
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        nock(bgUrl)
          .post('/api/v1/tx/send', (body) => {
            return !body.ignoreMaxFeeRate;
          })
          .reply(200, function (_, body) {
            return {
              transaction: (body as any).tx,
            };
          });

        const childTx = await wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
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
        const decodedChild = utxolib.bitgo.createTransactionFromHex(childTx.tx, utxolib.networks.bitcoin);
        decodedChild.ins.length.should.equal(2);
        decodedChild.outs.length.should.equal(1);

        let inputFromParent: any = undefined;
        let additionalInput: any = undefined;

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
      });

      it('accelerates a stuck tx with two additional unspents (segwit and P2SH)', async () => {
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
                chain: 11,
              },
              {
                vout: 1,
                value: 8664,
                isMine: true,
                chain: 1,
              },
            ],
            confirmations: 0,
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
                redeemScript:
                  '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
                chainPath: '/0/0',
              },
            ],
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
                redeemScript:
                  '522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae',
                chainPath: '/0/0',
              },
              {
                tx_hash: '07d6ee57b024ce2b6108f67847454a0a79a4fcfb98ab255553a2993a1a170b87',
                tx_output_n: 0,
                value: 20006284,
                redeemScript: '0020d34ef6dd34ef2a4fbea67c541c1c796749a60afe4a97fee8ec7ded188bd749da',
                chainPath: '/11/155',
                witnessScript:
                  '522102219d2aa8417633f0bce3911374a1604c1b64161f83a3c2ee409c27c42355f08e2102c9734920dc4da06c289fe69171dfcd75e3b9b4f190d0cbc3d5d0ff3f5fdeeaae2103ccd68d7fa8dc0d02dd45dad165557a48582eda4435fae7377b3c31e08ad065c953ae',
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        nock(bgUrl)
          .post('/api/v1/tx/send', (body) => {
            return !body.ignoreMaxFeeRate;
          })
          .reply(200, function (_, body) {
            return {
              transaction: (body as any).tx,
            };
          });

        const childTx = await wallet.accelerateTransaction({
          transactionID: parentTxId,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          feeRate,
        });

        should.exist(childTx);
        childTx.should.have.property('status', 'accepted');
        childTx.should.have.property('tx');

        // assert the following:
        // 0) The child tx has exactly three inputs
        // 1) The parent tx output is an input
        // 2) The child tx has exactly one output
        // 3) The child tx output meets the minimum change threshold
        const decodedChild = utxolib.bitgo.createTransactionFromHex(childTx.tx, utxolib.networks.bitcoin);
        decodedChild.ins.length.should.equal(3);
        decodedChild.outs.length.should.equal(1);

        let inputFromParent: any = undefined;
        const additionalInputs: any[] = [];

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
      });

      it('correctly uses the ignoreMaxFeeRate parameter only when necessary', async () => {
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
                chain: 0,
              },
              {
                vout: 1,
                value: 10000,
                isMine: true,
                chain: 11,
              },
            ],
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
                witnessScript:
                  '5221027f0b45bb4155ea532e3b4312fe0be80166f297d1e0753d2d4a9118c073ad6514210310aa9d68c98831625f329b7826b6c3e3b53e16736b1994b8902442bdcd6653d121026e0ca414f2488b0ab572b99e0ae5442911ab4e0821b2709d885175a527fd552b53ae',
              },
            ],
          });

        nock(explorerUrl).get(`/tx/${parentTxId}/hex`).reply(200, fixtures[parentTxId]);

        nock(bgUrl)
          .post('/api/v1/tx/send', (body) => {
            // ignore max fee rate must be set for this test
            return body.ignoreMaxFeeRate;
          })
          .reply(200);

        // monkey patch the bitgo getConstants() function
        const oldGetConstants = (bitgo as any).__proto__.getConstants;
        (bitgo as any).__proto__.getConstants = () => ({
          // child fee rate in this test is 31378 sat/kb
          // so set the max fee rate just below that limit,
          // but above the combined fee rate of 20000
          maxFeeRate: 30000,
        });

        await wallet.accelerateTransaction({
          transactionID: parentTxId,
          feeRate,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
        });
        nock.pendingMocks().should.be.empty();

        (bitgo as any).__proto__.getConstants = oldGetConstants;
      });
    });
  });
});
