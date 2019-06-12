//
// Tests for BitGo Object
//

import * as should from 'should';
import * as nock from 'nock';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

import * as BitGoJS from '../../src/index';
const TestBitGo = require('../lib/test_bitgo');
import * as common from '../../src/common';
const rp = require('request-promise');
import * as _ from 'lodash';
import * as bitcoin from 'bitgo-utxo-lib';

nock.disableNetConnect();

describe('BitGo Prototype Methods', function() {

  describe('Version', () => {
    it('version', function() {
      const bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      const version = bitgo.version();
      version.should.be.a.String();
    });
  });

  describe('validate', () => {
    it('should get', () => {
      const bitgo = new TestBitGo();
      bitgo.getValidate().should.equal(true);
    });

    it('should set', () => {
      const bitgo = new TestBitGo();
      bitgo.setValidate(false);
      bitgo.getValidate().should.equal(false);
      bitgo._validate.should.equal(false);
    });
  });

  describe('Environments', () => {
    it('production', () => {
      BitGoJS.setNetwork('testnet');
      new TestBitGo({ env: 'prod' });
      BitGoJS.getNetwork().should.equal('bitcoin');
    });

    it('staging', () => {
      BitGoJS.setNetwork('testnet');
      new TestBitGo({ env: 'staging' });
      BitGoJS.getNetwork().should.equal('bitcoin');
    });

    it('test', () => {
      BitGoJS.setNetwork('bitcoin');
      new TestBitGo({ env: 'test' });
      BitGoJS.getNetwork().should.equal('testnet');
    });

    it('dev', () => {
      new TestBitGo({ env: 'dev' });
      BitGoJS.getNetwork().should.equal('testnet');
    });

    it('custom network (prod)', () => {
      new TestBitGo({ customBitcoinNetwork: 'bitcoin', customRootURI: 'http://rooturi.example' });
      BitGoJS.getNetwork().should.equal('bitcoin');
    });

    it('custom network (testnet)', () => {
      new TestBitGo({ customBitcoinNetwork: 'testnet', customRootURI: 'http://rooturi.example' });
      BitGoJS.getNetwork().should.equal('testnet');
    });
  });

  describe('Authenticate in Microservices', () => {
    let bitgo;
    const microservicesUri = 'https://microservices.uri';
    const uri = 'https://test.bitgo.com';
    const authenticateRequest = {
      username: 'test@bitgo.com',
      password: 'password',
      otp: '000000',
      extensible: false,
      extensionAddress: 'address',
      forceSMS: false
    };

    it('goes to microservices', co(function *() {
      bitgo = new TestBitGo({ env: 'custom', microservicesUri });
      const scope = nock(microservicesUri)
        .post('/api/v1/auth/session')
        .reply(200, { user: 'test@bitgo.com', access_token: 'token12356' });

      yield bitgo.authenticate(authenticateRequest);
      scope.isDone().should.be.true();
    }));

    it('goes to normal uri', co(function *() {
      bitgo = new TestBitGo();
      const scope = nock(uri)
        .post('/api/v1/user/login')
        .reply(200, { user: 'test@bitgo.com', access_token: 'token12356' });

      yield bitgo.authenticate(authenticateRequest);
      scope.isDone().should.be.true();
    }));
  });

  describe('Verify Address', () => {
    let bitgo;
    before(() => {
      bitgo = new TestBitGo();
    });

    it('errors', () => {
      (() => bitgo.verifyAddress()).should.throw();
      (() => bitgo.verifyAddress({})).should.throw();

      bitgo.verifyAddress({ address: 'xyzzy' }).should.be.false();
    });

    it('standard', () => {
      bitgo = new TestBitGo({ env: 'prod' });
      bitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();
      // wrong version byte:
      bitgo.verifyAddress({ address: '9Ef7HsuByGBogqkjoF5Yng7MYkq5UCdmZz' }).should.be.false();

      bitgo = new TestBitGo();
      bitgo.verifyAddress({ address: 'n4DNhSiEaodqaiF9tLYXTCh4kFbdUzxBHs' }).should.be.true();
    });

    it('p2sh', () => {
      bitgo = new TestBitGo({ env: 'prod' });
      bitgo.verifyAddress({ address: '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC' }).should.be.true();
      // wrong version byte:
      bitgo.verifyAddress({ address: 'HV8swrGkmeN7Xig4vENr93aQSrX4iHjg7D' }).should.be.false();
      bitgo = new TestBitGo();
      bitgo.verifyAddress({ address: '2NEeFWbfu4EA1rcKx48e82Mj8d6FKcWawZw' }).should.be.true();
    });
  });

  describe('Encrypt/Decrypt', () => {
    const password = 'mickey mouse';
    const secret = 'this is a secret';

    it('invalid password', () => {
      const bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      const opaque = bitgo.encrypt({ password: password, input: secret });
      (() => bitgo.decrypt({ password: 'hack hack', input: opaque })).should.throw();
    });

    it('valid password', () => {
      const bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      const opaque = bitgo.encrypt({ password: password, input: secret });
      bitgo.decrypt({ password: password, input: opaque }).should.equal(secret);
    });
  });

  describe('Password Generation', () => {
    it('generates a random password', () => {
      const bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      const password = bitgo.generateRandomPassword();
      should.exist(password);
    });

    it('generates a random password with a numWords argument', () => {
      const bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      for (let i = 0; i < 1000; i++) {
        const password = bitgo.generateRandomPassword(10);
        should.exist(password);
        // randomly generated password should be 55 characters roughly 92.5% of the time,
        // 54 characters roughly 7.5% of the time, 53 characters 0.001% of the time,
        // and fewer than 53 characters very, very rarely
        password.length.should.be.within(53, 55);
      }
    });
  });

  describe('Shamir Secret Sharing', () => {
    const bitgo = new TestBitGo();
    const seed = '8cc57dac9cdae42bf7848a2d12f2874d31eca1f9de8fe3f8fa13e7857b545d59';
    const xpub = 'xpub661MyMwAqRbcEusRjkJ64BXgR8ddYsXbuDJfbRc3eZcZVEa2ygswDiFZQpHFsA5N211YDvi2N898h4KrcXcfsR8PLhjJaPUwCUqg1ptBBHN';
    const passwords = ['mickey', 'mouse', 'donald', 'duck'];

    it('should fail to split secret with wrong m', () => {
      (() => bitgo.splitSecret({
        seed,
        passwords: ['abc'],
        m: 0
      })).should.throw('m must be a positive integer greater than or equal to 2');
    });

    it('should fail to split secret with bad password count', () => {
      (() => bitgo.splitSecret({
        seed,
        passwords: ['abc'],
        m: 2
      })).should.throw('passwords array length cannot be less than m');
    });

    it('should split and fail to reconstitute secret with bad passwords', () => {
      const splitSecret = bitgo.splitSecret({ seed, passwords: passwords, m: 3 });
      const shards = _.at(splitSecret.seedShares, [0, 2]);
      const subsetPasswords = _.at(passwords, [0, 3]);
      (() => bitgo.reconstituteSecret({
        shards,
        passwords: subsetPasswords,
        xpub
      })).should.throw(/ccm: tag doesn't match/);
    });

    it('should split and reconstitute secret', () => {
      const splitSecret = bitgo.splitSecret({ seed, passwords: passwords, m: 2 });
      const shards = _.at(splitSecret.seedShares, [0, 2]);
      const subsetPasswords = _.at(passwords, [0, 2]);
      const reconstitutedSeed = bitgo.reconstituteSecret({ shards, passwords: subsetPasswords });
      reconstitutedSeed.seed.should.equal(seed);
      reconstitutedSeed.xpub.should.equal('xpub661MyMwAqRbcEusRjkJ64BXgR8ddYsXbuDJfbRc3eZcZVEa2ygswDiFZQpHFsA5N211YDvi2N898h4KrcXcfsR8PLhjJaPUwCUqg1ptBBHN');
      reconstitutedSeed.xprv.should.equal('xprv9s21ZrQH143K2Rnxdim5h3aws6o99QokXzP4o3CS6E5acSEtS9Zgfuw5ZWujhTHTWEAZDfmP3yxA1Ccn6myVkGEpRrT4xWgaEpoW7YiBAtC');
    });

    it('should split and incorrectly verify secret', () => {
      const splitSecret = bitgo.splitSecret({ seed, passwords: passwords, m: 3 });
      const isValid = bitgo.verifyShards({ shards: splitSecret.seedShares, passwords, m: 2 });
      isValid.should.equal(false);
    });

    it('should split and verify secret', () => {
      const splitSecret = bitgo.splitSecret({ seed, passwords: passwords, m: 2 });
      const isValid = bitgo.verifyShards({ shards: splitSecret.seedShares, passwords, m: 2, xpub });
      isValid.should.equal(true);
    });

    it('should split and verify secret with many parts', () => {
      const allPws = ['0', '1', '2', '3', '4', '5', '6', '7'];
      const splitSecret = bitgo.splitSecret({ seed, passwords: allPws, m: 3 });
      const isValid = bitgo.verifyShards({ shards: splitSecret.seedShares, passwords: allPws, m: 3, xpub });
      isValid.should.equal(true);
    });

  });

  describe('ECDH sharing secret', () => {
    it('should calculate a new ECDH sharing secret correctly', () => {
      const bitgo = new TestBitGo();
      const eckey1 = bitcoin.ECPair.makeRandom({ network: bitcoin.networks[common.getNetwork()] });
      const eckey2 = bitcoin.ECPair.makeRandom({ network: bitcoin.networks[common.getNetwork()] });
      const sharingKey1 = bitgo.getECDHSecret({ eckey: eckey1, otherPubKeyHex: eckey2.getPublicKeyBuffer().toString('hex') });
      const sharingKey2 = bitgo.getECDHSecret({ eckey: eckey2, otherPubKeyHex: eckey1.getPublicKeyBuffer().toString('hex') });
      sharingKey1.should.equal(sharingKey2);
    });

  });

  describe('change password', function() {
    let bitgo;
    let bgUrl;

    before(co(function *coBeforeChangePassword() {
      nock('https://bitgo.fakeurl')
      .post('/api/v1/user/login')
      .reply(200, {
        access_token: 'access_token',
        user: { username: 'update_pw_tester@bitgo.com' }
      });

      bitgo = new TestBitGo({ env: 'mock' });
      bitgo.initializeTestVars();
      bitgo.setValidate(false);

      yield bitgo.authenticateChangePWTestUser(bitgo.testUserOTP());

      bgUrl = common.Environments[bitgo.getEnv()].uri;
    }));

    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const otherPassword = 'otherPassword';

    describe('should fail to change the password', function changePWFail() {
      it('wrong arguments', co(function *coWrongArguments() {
        try {
          yield bitgo.changePassword({ newPassword: '5678' });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Missing parameter: oldPassword');
        }

        try {
          yield bitgo.changePassword({ oldPassword: 1234, newPassword: '5678' });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Expecting parameter string: oldPassword but found number');
        }

        try {
          yield bitgo.changePassword({ oldPassword: '1234' });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Missing parameter: newPassword');
        }

        try {
          yield bitgo.changePassword({ oldPassword: '1234', newPassword: 5678 });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Expecting parameter string: newPassword but found number');
        }
      }));

      it('incorrect old password', co(function *coIncorrectOldPW() {
        nock(bgUrl)
        .post('/api/v1/user/verifypassword')
        .reply(200, { valid: false });
        try {
          yield bitgo.changePassword({ oldPassword, newPassword });
          throw new Error();
        } catch (e) {
          e.message.should.equal('the provided oldPassword is incorrect');
        }
      }));
    });

    it('successful password change', co(function *coChangePWSuccess() {
      nock(bgUrl)
      .post('/api/v1/user/verifypassword')
      .reply(200, { valid: true });

      nock(bgUrl)
      .post('/api/v1/user/encrypted')
      .reply(200, {
        version: 1,
        keychains: {
          xpub11: bitgo.encrypt({ input: 'xprv11', password: oldPassword }),
          xpub12: bitgo.encrypt({ input: 'xprv12', password: oldPassword }),
          xpub13: bitgo.encrypt({ input: 'xprv13', password: otherPassword }),
          xpub14: bitgo.encrypt({ input: 'xprv14', password: oldPassword })
        }
      });

      nock(bgUrl)
      .get('/api/v2/tbtc/key')
      .query(true)
      .reply(200, {
        keys: [
          {
            pub: 'xpub21',
            encryptedPrv: bitgo.encrypt({ input: 'xprv21', password: oldPassword })
          },
          {
            pub: 'xpub22',
            encryptedPrv: bitgo.encrypt({ input: 'xprv22', password: otherPassword })
          }
        ]
      });

      nock(bgUrl)
      .post('/api/v1/user/changepassword')
      .reply(200, {});

      yield bitgo.changePassword({ oldPassword, newPassword });
    }));

    afterEach(function afterChangePassword() {
      nock.pendingMocks().should.be.empty();
    });
  });

  describe('HMAC Handling', () => {
    let bitgo;
    const token = 'v2x5b735fed2486593f8fea19113e5c717308f90a5fb00e740e46c7bfdcc078cfd0';

    before(() => {
      bitgo = new TestBitGo({ env: 'mock' });
    });

    it('should correctly calculate request headers', () => {
      const originalDateNow = Date.now;
      Date.now = () => 1521589882510;

      const fetchMeUrl = bitgo.url('/user/me');
      const requestHeaders = bitgo.calculateRequestHeaders({ url: fetchMeUrl, token });
      Date.now = originalDateNow;

      requestHeaders.timestamp.should.equal(1521589882510);
      requestHeaders.tokenHash.should.equal('a85af08e6723e41acd6a3fb9ef58422082e673df33c58e1db175bb740a2c934d');
      requestHeaders.hmac.should.equal('6de77d5a5446a3e5649456c11480706a71071b15639c3c787af65bdb02ecf1ec');
    });

    it('should correctly handle authentication response', () => {
      const responseJson = {
        encryptedToken: '{"iv":"EqxVaGTLY4naAYkuBaTz0w==","v":1,"iter":1000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"4S4dBYcgL4s=","ct":"FgBRJljb8iSYxnAjMi4Qotr7sTKbSmWnlfHZShMSi8YeeE3kiS8bpHNUwAPhY8tgouh3UsEwrJnY+54MvqFD7yd19pG1V4CVssr8"}',
        derivationPath: 'm/999999/104490948/173846667',
        encryptedECDHXprv: '{"iv":"QKHEF2GNcwOJwy6+pwANRA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"W2sVFvXDlOw=","ct":"8BTCqS25X37kLzmzQdGenhXH6znn9qEmkszAeS8kLnRdqKSiUiC7bTAVgg/Np5yrV7F7Jyiq+MTpVT76EoUT+PMJzArv0gUQKC2JPB3JuVKeAAVWBQmhWfkEwRfyv4hq4WMxwZtocwBqThvd2pJm9HE51GX4/Wo="}'
      };
      const parsedAuthenticationData = bitgo.handleTokenIssuance(responseJson, 'test@bitgo.com');
      parsedAuthenticationData.token.should.equal(token);
      parsedAuthenticationData.ecdhXprv.should.equal('xprv9s21ZrQH143K3si1bKGp7KqgCQv39ttQ7aUwWzVdytgHd8HtDCHyEp14mxfhiT3qHTq4BaSrA7uUkG6AJTfPJBsRu63drvBqYuMZyTxepH7');
    });

    it('should correctly verify a response hmac', co(function *() {
      const url = bitgo.coin('tltc').url('/wallet/5941b202b42fcbc707170d5b597491d9/address/QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE?segwit=1');
      const requestHeaderData = bitgo.calculateRequestHeaders({ url, token });
      const requestHeaders = {
        'BitGo-Auth-Version': '2.0',
        'Content-Type': 'application/json',
        'Auth-Timestamp': requestHeaderData.timestamp,
        Authorization: 'Bearer ' + requestHeaderData.tokenHash,
        HMAC: requestHeaderData.hmac
      };
      const responseBody = '{"id":"5a7ca8bcaf52c8e807c575fb692609ec","address":"QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE","chain":0,"index":2,"coin":"tltc","wallet":"5941b202b42fcbc707170d5b597491d9","coinSpecific":{"redeemScript":"522102835bcfd130f7a56f72c905b782d90b66e22f88ad3309cf72af5138a7d44be8b3210322c7f42a1eb212868eab78db7ba64846075d98c7f4c7aa25a02e57871039e0cd210265825be0d5bf957fb72abd7c23bf0836a78a15f951a073467cd5c99e03ce7ab753ae"},"balance":{"updated":"2018-02-28T23:48:07.341Z","numTx":1,"numUnspents":1,"totalReceived":20000000}}';

      nock('https://bitgo.fakeurl', { reqheaders: requestHeaders })
      .get('/api/v2/tltc/wallet/5941b202b42fcbc707170d5b597491d9/address/QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE?segwit=1')
      .reply(200, responseBody, {
        hmac: '30a5943043ab4b0503d807f0cca7dac3a670e8785331322567db5189432b87ec',
        timestamp: '1521590532925'
      });

      const responseData = yield rp({
        uri: url,
        method: 'GET',
        headers: requestHeaders,
        transform: (body, response) => {
          // verify the response headers
          const url = response.request.href;
          const hmac = response.headers.hmac;
          const timestamp = response.headers.timestamp;
          const statusCode = response.statusCode;
          const verificationParams = {
            url,
            hmac,
            timestamp,
            token,
            statusCode,
            text: body
          };
          return bitgo.verifyResponse(verificationParams);
        }
      });
      responseData.signatureSubject.should.equal('1521590532925|/api/v2/tltc/wallet/5941b202b42fcbc707170d5b597491d9/address/QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE?segwit=1|200|{"id":"5a7ca8bcaf52c8e807c575fb692609ec","address":"QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE","chain":0,"index":2,"coin":"tltc","wallet":"5941b202b42fcbc707170d5b597491d9","coinSpecific":{"redeemScript":"522102835bcfd130f7a56f72c905b782d90b66e22f88ad3309cf72af5138a7d44be8b3210322c7f42a1eb212868eab78db7ba64846075d98c7f4c7aa25a02e57871039e0cd210265825be0d5bf957fb72abd7c23bf0836a78a15f951a073467cd5c99e03ce7ab753ae"},"balance":{"updated":"2018-02-28T23:48:07.341Z","numTx":1,"numUnspents":1,"totalReceived":20000000}}');
      responseData.expectedHmac.should.equal('30a5943043ab4b0503d807f0cca7dac3a670e8785331322567db5189432b87ec');
      responseData.isValid.should.equal(true);
    }));

    it('should recognize trailing slash inconsistency', () => {
      const verificationParams = {
        url: 'https://google.com/api',
        hmac: '30a5943043ab4b0503d807f0cca7dac3a670e8785331322567db5189432b87ec',
        timestamp: '1521590532925',
        token: token,
        statusCode: 200,
        text: 'fakedata'
      };
      const verificationDetails = bitgo.verifyResponse(verificationParams);
      verificationDetails.signatureSubject.should.equal('1521590532925|/api|200|fakedata');
      verificationDetails.signatureSubject.should.not.equal('1521590532925|/api/|200|fakedata');
      verificationDetails.expectedHmac.should.equal('2064f2adb168ef8808f6a42f588d7d6bc14e98e8b41239c6bbb7349e52f2249a');
      verificationDetails.isValid.should.equal(false);
    });

    it('should auto-amend trailing slash', () => {
      const verificationParams = {
        url: 'https://google.com',
        hmac: '30a5943043ab4b0503d807f0cca7dac3a670e8785331322567db5189432b87ec',
        timestamp: '1521590532925',
        token: token,
        statusCode: 200,
        text: 'fakedata'
      };
      const verificationDetails = bitgo.verifyResponse(verificationParams);
      verificationDetails.signatureSubject.should.equal('1521590532925|/|200|fakedata');
      verificationDetails.expectedHmac.should.equal('51c6d024f261e166e8a323f8fa36a9bb8d4d02b076334c2a9ae0a49efc5724d4');
      verificationDetails.isValid.should.equal(false);
    });
  });

  describe('Token Definitions at Startup', function() {

    it('Should return a non-empty list of tokens before the server responds', co(function *coTokenDefinitionsIt() {
      const bitgo = new TestBitGo({ env: 'mock' });
      bitgo.initializeTestVars();
      const tokens = bitgo.getConstants().eth.tokens;

      // currently four tokens are defined for non-production environments
      should.exist(tokens);
      tokens.length.should.equal(6);
    }));

    after(function tokenDefinitionsAfter() {
      nock.pendingMocks().should.be.empty();
    });
  });

  describe('superagent wrappers', function() {

    let bitgo;
    let bgUrl;
    before(co(function *() {
      bitgo = new TestBitGo({ env: 'mock' });
      bitgo.initializeTestVars();

      bgUrl = common.Environments[bitgo.getEnv()].uri;

      nock(bgUrl)
      .patch('/')
      .reply(200);
    }));

    it('PATCH requests', co(function *() {
      const res = yield bitgo.patch(bgUrl);

      res.status.should.equal(200);
    }));

    after(function() {
      nock.pendingMocks().should.be.empty();
    });
  });
});
