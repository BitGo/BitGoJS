
import * as Promise from 'bluebird';
const co = Promise.coroutine;
const should = require('should');
const secp256k1 = require('secp256k1');
const nock = require('nock');
const bitGoUtxoLib = require('bitgo-utxo-lib');
import 'should';
const TestV2BitGo = require('../../lib/test_bitgo');
const sinon = require('sinon');
const Util = require('../../../src/util');
const common = require('../../../src/common');
const fixtures = require('../fixtures/eth.ts');
const EthTx = require('ethereumjs-tx');

describe('Sign ETH Transaction', co(function *() {

  let bitgo;
  let ethWallet;
  let recipients;
  let tx;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    const coin = bitgo.coin('teth');
    ethWallet = coin.newWalletObject(bitgo, coin, {});
    recipients = [{
      address: '0xe59dfe5c67114b39a5662cc856be536c614124c0',
      amount: '100000'
    }];
    tx = { recipients, nextContractSequenceId: 0 };
  }));

  it('should read transaction recipients from txPrebuild even if none are specified as top-level params', co(function *() {
    sinon.stub(Util, 'xprvToEthPrivateKey');
    sinon.stub(Util, 'ethSignMsgHash');
    sinon.stub(ethWallet.getOperationSha3ForExecuteAndConfirm);
    const { halfSigned } = yield ethWallet.signTransaction({ txPrebuild: tx, prv: 'my_user_prv' });
    halfSigned.should.have.property('recipients', recipients);
    sinon.restore();
  }));

  it('should throw an error if no recipients are in the txPrebuild and none are specified as params', co(function *() {
    yield ethWallet.signTransaction({ txPrebuild: {}, prv: 'my_user_prv' }).should.be.rejectedWith('recipients missing or not array');
  }));

  it('should throw an error if the recipients param is not an array', co(function *() {
    yield ethWallet.signTransaction({ txPrebuild: { recipients: 'not-array' }, prv: 'my_user_prv' }).should.be.rejectedWith('recipients missing or not array');
  }));

}));

describe('Ethereum Hop Transactions', co(function *() {
  let bitgo;
  let ethWallet;
  let tx;
  let txid;
  let bitgoSignature;
  let bitgoKeyXprv;
  let bgUrl;
  let env;

  const userKeypair = {
    xprv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    xpub: 'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp',
    rawPub: '02c103ac74481874b5ef0f385d12725e4f14aedc9e00bc814ce96f47f62ce7adf2',
    rawPrv: '936c5af3f8af81f75cdad1b08f29e7d9c01e598e2db2d7be18b9e5a8646e87c6',
    path: 'm',
    walletSubPath: '/0/0'
  };
  const bitgoKey = {
    pub: 'xpub661MyMwAqRbcGNtyHK3eQ9p5MZCuobtmnmEHXH9wWjb9L3jWVUANF5hKPhdPFPmfXqep5X7vd9roR2gvkC5RxwAzBBVsRWcuZaSuSuweMv8',
    path: 'm',
    walletSubPath: '/0/0'
  };

  before(co(function *() {
    tx = '0xf86c82015285012a05f200825208945208d8e80c6d1aef9be37b4bd19a9cf75ed93dc886b5e620f480008026a00e13f9e0e11337b2b0227e3412211d3625e43f1083fda399cc361dd4bf89083ba06c801a761e0aa3bc8db0ac2568d575b0fb306a1f04f4d5ba82ba3cc0ea0a83bd';
    txid = '0x0ac669c5fef8294443c75a31e32c44b97bbc9e43a18ea8beabcc2a3b45eb6ffa';
    bitgoKeyXprv = 'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bitGoUtxoLib.HDNode.fromBase58(bitgoKeyXprv);
    const bitgoPrvBuffer = bitgoKey.getKey().getPrivateKeyBuffer();
    const bitgoXpub = bitgoKey.neutered().toBase58();
    bitgoSignature = '0xaa' + secp256k1.sign(Buffer.from(txid.slice(2), 'hex'), bitgoPrvBuffer).signature.toString('hex');

    env = 'test';
    bitgo = new TestV2BitGo({ env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.initializeTestVars();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
    const coin = bitgo.coin('teth');
    ethWallet = coin.newWalletObject({ keys: ['user', 'backup', 'bitgo'] });
  }));

  describe('Verify HSM Hop prebuild', co(function *() {
    let prebuild;
    let buildParams;
    let finalRecipient;
    let sendAmount;

    before(co(function *() {
      finalRecipient = '0x5208d8e80c6d1aef9be37b4bd19a9cf75ed93dc8';
      sendAmount = '200000000000000';
      prebuild = {
        tx,
        id: txid,
        signature: bitgoSignature,
      };
      buildParams = {
        recipients: [{
          address: finalRecipient,
          amount: sendAmount
        }]
      };
    }));

    it('should accept a valid hop prebuild', co(function *() {
      let error = undefined;
      try {
        yield ethWallet.baseCoin.validateHopPrebuild(ethWallet, prebuild, buildParams);
      } catch (e) {
        error = e.message;
      }
      should.not.exist(error);
    }));

    it('should fail if the HSM prebuild recipient is wrong', co(function *() {
      let error = undefined;
      const badBuildParams = JSON.parse(JSON.stringify(buildParams));
      badBuildParams.recipients[0].address = '0x54bf1609aeed804aa231f08c53dbb18f7d374615';

      try {
        yield ethWallet.baseCoin.validateHopPrebuild(ethWallet, prebuild, badBuildParams);
      } catch (e) {
        error = e.message;
      }
      should.exist(error);
      error.should.containEql("does not equal original recipient");
    }));

    it('should fail if the HSM prebuild tx amount is wrong', co(function *() {
      let error = undefined;
      const badBuildParams = JSON.parse(JSON.stringify(buildParams));
      badBuildParams.recipients[0].amount = '50000000';

      try {
        yield ethWallet.baseCoin.validateHopPrebuild(ethWallet, prebuild, badBuildParams);
      } catch (e) {
        error = e.message;
      }
      should.exist(error);
      error.should.containEql("does not equal original amount");
    }));

    it('should fail if the HSM signature is invalid', co(function *() {
      let error = undefined;
      // Mocking a different BitGo key means the signing key should be wrong (it maps to a different address than this xpub)
      const goodXpub = common.Environments[env].hsmXpub;
      common.Environments[env].hsmXpub = 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL';

      try {
        yield ethWallet.baseCoin.validateHopPrebuild(ethWallet, prebuild, buildParams);
      } catch (e) {
        error = e.message;
      }
      should.exist(error);
      error.should.containEql("Hop txid signature invalid");
      common.Environments[env].hsmXpub = goodXpub;
    }));

    it('should fail if the HSM signature signed the wrong HSM commitment digest', co(function *() {
      let error = undefined;
      const badTxid = '0xb4b3827a529c9166786e796528017889ac5027255b65b3fa2a3d3ad91244a12b';
      const badTxidBuffer = Buffer.from(badTxid.slice(2), 'hex');
      const xprvNode = bitGoUtxoLib.HDNode.fromBase58(bitgoKeyXprv);

      const badSignature = '0xaa' + secp256k1.sign(badTxidBuffer, xprvNode.getKey().getPrivateKeyBuffer()).signature.toString('hex');
      const badPrebuild = JSON.parse(JSON.stringify(prebuild));
      badPrebuild.signature = badSignature;

      try {
        yield ethWallet.baseCoin.validateHopPrebuild(ethWallet, badPrebuild, buildParams);
      } catch (e) {
        error = e.message;
      }
      should.exist(error);
      error.should.containEql("Hop txid signature invalid");
    }));
  }));

  describe('Prebuild hop transaction', co(function *() {
    let prebuild;
    let buildParams;
    let finalRecipient;
    let sendAmount;
    let gasLimitEstimate;
    let gasPrice;

    const nockUserKey = function() {
      nock(bgUrl)
        .get(`/api/v2/teth/key/user`)
        .reply(200, {
          encryptedPrv: bitgo.encrypt({ input: userKeypair.xprv, password: TestV2BitGo.TEST_WALLET1_PASSCODE }),
          path: userKeypair.path + userKeypair.walletSubPath
        });
    };
    const nockFees = function() {
      const scope = nock(bgUrl)
        .get('/api/v2/teth/tx/fee')
        .query(true)
        .reply(200, {
          gasLimitEstimate: gasLimitEstimate,
          feeEstimate: gasLimitEstimate * gasPrice,
        });
      return scope;
    };

    const nockBuild = function(walletId) {
      nock(bgUrl)
        .post('/api/v2/teth/wallet/' + walletId + '/tx/build')
        .reply(200, { hopTransaction: prebuild, buildParams});
    };

    before(co(function* () {
      gasLimitEstimate = 100000;
      gasPrice = 50000000;
      finalRecipient = '0x5208d8e80c6d1aef9be37b4bd19a9cf75ed93dc8';
      sendAmount = '200000000000000';
      prebuild = {
        tx,
        id: txid,
        signature: bitgoSignature,
      };
      buildParams = {
        recipients: [{
          address: finalRecipient,
          amount: sendAmount
        }],
        hop: true,
        walletPassphrase: TestV2BitGo.TEST_WALLET1_PASSCODE,
      };
    }));

   it('should prebuild a hop transaction if given the correct args', co(function *() {
     let error = undefined;

     nockUserKey();
     const feeScope = nockFees();
     nockBuild(ethWallet.id());
     try {
       const res = yield ethWallet.prebuildTransaction(buildParams);
       should.exist(res.hopTransaction);
       should.exist(res.hopTransaction.tx);
       should.exist(res.hopTransaction.tx);
       should.exist(res.hopTransaction.id);
       should.exist(res.hopTransaction.signature);
       should.not.exist(res.wallet);
       should.not.exist(res.buildParams);
     } catch (e) {
       error = e.message;
     }
     should.not.exist(error);
     feeScope.isDone().should.equal(true);
     const feeReq = feeScope.interceptors[0].req;
     feeReq.path.should.containEql('hop=true');
     feeReq.path.should.containEql('recipient=' + finalRecipient);
     feeReq.path.should.containEql('amount=' + sendAmount);
   }));
  }));
}));

describe('Add final signature to ETH tx from offline vault', function() {

  let paramsFromVault, expectedResult, bitgo, coin;
  before(function() {
    const vals = fixtures.getHalfSignedTethFromVault();
    paramsFromVault = vals.paramsFromVault;
    expectedResult = vals.expectedResult;
    bitgo = new TestV2BitGo({ env: 'test' });
    coin = bitgo.coin('teth');
  });

  it('should successfully fully sign a half-signed transaction from the offline vault', function() {
    const response = coin.signTransaction(paramsFromVault);
    const expectedTx = new EthTx(expectedResult.txHex);
    const actualTx = new EthTx(response.txHex);
    actualTx.nonce.should.deepEqual(expectedTx.nonce);
    actualTx.to.should.deepEqual(expectedTx.to);
    actualTx.value.should.deepEqual(expectedTx.value);
    actualTx.data.should.deepEqual(expectedTx.data);
    actualTx.v.should.deepEqual(expectedTx.v);
    actualTx.r.should.deepEqual(expectedTx.r);
    actualTx.s.should.deepEqual(expectedTx.s);
    actualTx.gasPrice.should.deepEqual(expectedTx.gasPrice);
    actualTx.gasLimit.should.deepEqual(expectedTx.gasLimit);
    response.txHex.should.equal(expectedResult.txHex);
  });
});
