const Wallet = require('../../src/wallet');
import { TestBitGo } from '../lib/test_bitgo';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
import * as nock from 'nock';
import * as common from '../../src/common';

nock.disableNetConnect();
const externalHost = 'https://externalsign.com';
const externalApiPath = '/api/sign';


describe('Wallet External API:', function () {

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

  describe('Transaction Signature Verification', function () {
    it('signs p2sh using external api', co(function *() {
      const prodBitgo = new TestBitGo({ env: 'prod', externalSignerUrl: `${externalHost}${externalApiPath}` });
      prodBitgo.initializeTestVars();
      const bgUrl = common.Environments[prodBitgo.getEnv()].uri;
      const fakeProdWallet = new Wallet(prodBitgo, { id: '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4', private: { keychains: [userKeypair, backupKeypair, bitgoKey] } });

      const firstSignature = '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b600473044022021fa73d5fe61ac8942cd70ff4507c574677ce747de5bc46c3dd2e38ec2448fce022047906d2c0154337ab96041e8fb58c243b9bce5f8818fa991643c1260a1859ad80100004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000';
      const secondSignature = '010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000fdfd0000473044022021fa73d5fe61ac8942cd70ff4507c574677ce747de5bc46c3dd2e38ec2448fce022047906d2c0154337ab96041e8fb58c243b9bce5f8818fa991643c1260a1859ad80147304402202ae01f01b5ae0c3fa7d67ac73db81932cb5aca10db16a99063fef45e3f1398cd022055001ba7e163cb350910fc7321ecd7eb6359b321d4c04887484d9c7284b78c4701004c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000';

      const p2shAddress = fakeProdWallet.generateAddress({ path: '/0/13', segwit: false });
      const unspent: any = {
        addresses: [
          '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
        ],
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

      nock(bgUrl)
        .post('/api/v1/billing/address')
        .reply(200, { address: '2MswQjkvN6oWYdE7L2brJ5cAAMjPmG59oco' });

      const transaction = (yield fakeProdWallet.createTransaction({
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
      transaction.transactionHex.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737422a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add first signature
      const scope = nock(externalHost)
        .post(externalApiPath)
        .reply(200, { tx: firstSignature });
      transaction.keychain = userKeypair;
      const signature1 = (yield fakeProdWallet.signTransaction(transaction)) as any;
      signature1.tx.should.equal(firstSignature);
      scope.isDone().should.be.True();

      // add second signature
      const scope2 = nock(externalHost)
        .post(externalApiPath)
        .reply(200, { tx: secondSignature });
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = (yield fakeProdWallet.signTransaction(transaction)) as any;
      signature2.tx.should.equal(secondSignature);
      scope2.isDone().should.be.True();
    }));
  });
});
