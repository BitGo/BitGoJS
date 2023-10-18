//
// Tests for BitGo Object
//

import * as crypto from 'crypto';
import * as nock from 'nock';
import * as should from 'should';

import { common } from '@bitgo/sdk-core';
import { bip32, ECPair } from '@bitgo/utxo-lib';
import * as _ from 'lodash';
import * as BitGoJS from '../../src/index';
const rp = require('request-promise');

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../src/bitgo';

nock.disableNetConnect();

describe('BitGo Prototype Methods', function () {
  describe('Version', () => {
    it('version', function () {
      const bitgo = TestBitGo.decorate(BitGo);
      bitgo.initializeTestVars();
      const version = bitgo.version();
      version.should.be.a.String();
    });
  });

  describe('validate', () => {
    it('should get', () => {
      const bitgo = TestBitGo.decorate(BitGo);
      bitgo.getValidate().should.equal(true);
    });

    it('should set', () => {
      const bitgo = TestBitGo.decorate(BitGo);
      bitgo.setValidate(false);
      bitgo.getValidate().should.equal(false);
      bitgo['_validate'].should.equal(false);
    });
  });

  describe('Environments', () => {
    it('production', () => {
      BitGoJS.setNetwork('testnet');
      TestBitGo.decorate(BitGo, { env: 'prod' });
      BitGoJS.getNetwork().should.equal('bitcoin');
    });

    it('staging', () => {
      BitGoJS.setNetwork('testnet');
      TestBitGo.decorate(BitGo, { env: 'staging' });
      BitGoJS.getNetwork().should.equal('testnet');
    });

    it('test', () => {
      BitGoJS.setNetwork('bitcoin');
      TestBitGo.decorate(BitGo, { env: 'test' });
      BitGoJS.getNetwork().should.equal('testnet');
    });

    it('dev', () => {
      TestBitGo.decorate(BitGo, { env: 'dev' });
      BitGoJS.getNetwork().should.equal('testnet');
    });

    it('custom network (prod)', () => {
      TestBitGo.decorate(BitGo, { customBitcoinNetwork: 'bitcoin', customRootURI: 'http://rooturi.example' });
      BitGoJS.getNetwork().should.equal('bitcoin');
    });

    it('custom network (testnet)', () => {
      TestBitGo.decorate(BitGo, { customBitcoinNetwork: 'testnet', customRootURI: 'http://rooturi.example' });
      BitGoJS.getNetwork().should.equal('testnet');
    });
  });

  describe('HMAC request verification', () => {
    it('throws if HMAC request verification is disabled for non-prod environments', function () {
      (() => TestBitGo.decorate(BitGo, { env: 'prod', hmacVerification: false })).should.throw(
        /Cannot disable request HMAC verification in environment/
      );
      (() => TestBitGo.decorate(BitGo, { env: 'test', hmacVerification: false })).should.not.throw(
        /Cannot disable request HMAC verification in environment/
      );
      (() => TestBitGo.decorate(BitGo, { env: 'adminProd', hmacVerification: false })).should.throw(
        /Cannot disable request HMAC verification in environment/
      );
      (() => TestBitGo.decorate(BitGo, { env: 'adminTest', hmacVerification: false })).should.not.throw(
        /Cannot disable request HMAC verification in environment/
      );
      (() =>
        TestBitGo.decorate(BitGo, {
          env: 'dev',
          customRootURI: 'http://rooturi.example',
          hmacVerification: false,
        })).should.not.throw(/Cannot disable request HMAC verification in environment/);
    });

    it('allows disabling of HMAC request verification only for dev environments', function () {
      (() => TestBitGo.decorate(BitGo, { env: 'dev', hmacVerification: false })).should.not.throw();
      (() => TestBitGo.decorate(BitGo, { env: 'latest', hmacVerification: false })).should.not.throw();
      (() => TestBitGo.decorate(BitGo, { env: 'adminDev', hmacVerification: false })).should.not.throw();
      (() => TestBitGo.decorate(BitGo, { env: 'adminLatest', hmacVerification: false })).should.not.throw();
      (() => TestBitGo.decorate(BitGo, { env: 'local', hmacVerification: false })).should.not.throw();
      (() => TestBitGo.decorate(BitGo, { env: 'localNonSecure', hmacVerification: false })).should.not.throw();
      (() =>
        TestBitGo.decorate(BitGo, {
          env: 'branch',
          customRootURI: 'http://rooturi.example',
          hmacVerification: false,
        })).should.not.throw();
    });
  });

  describe('Authenticate in Microservices', () => {
    let bitgo;
    const authenticateRequest = {
      username: 'test@bitgo.com',
      password: 'password',
      otp: '000000',
      extensible: false,
      extensionAddress: 'address',
      forceSMS: false,
    };

    it('goes to microservices', async function () {
      bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri: 'https://microservices.uri' } as any);
      const scope = nock(BitGoJS.Environments[bitgo.getEnv()].uri)
        .post('/api/auth/v1/session')
        .reply(200, {
          user: {
            username: 'test@bitgo.com',
          },
          access_token: 'token12356',
        });

      await bitgo.authenticate(authenticateRequest);
      scope.isDone().should.be.true();
    });

    it('goes to microservices even when microservicesUri is not specified', async function () {
      bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      const scope = nock(BitGoJS.Environments[bitgo.getEnv()].uri)
        .post('/api/auth/v1/session')
        .reply(200, {
          user: {
            username: 'test@bitgo.com',
          },
          access_token: 'token12356',
        });

      await bitgo.authenticate(authenticateRequest);
      scope.isDone().should.be.true();
    });
  });

  describe('Verify Address', () => {
    let bitgo;
    before(() => {
      bitgo = TestBitGo.decorate(BitGo);
    });

    it('errors', () => {
      (() => bitgo.verifyAddress()).should.throw();
      (() => bitgo.verifyAddress({})).should.throw();

      bitgo.verifyAddress({ address: 'xyzzy' }).should.be.false();
    });

    it('standard', () => {
      bitgo = TestBitGo.decorate(BitGo, { env: 'prod' });
      bitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();
      // wrong version byte:
      bitgo.verifyAddress({ address: '9Ef7HsuByGBogqkjoF5Yng7MYkq5UCdmZz' }).should.be.false();

      bitgo = TestBitGo.decorate(BitGo);
      bitgo.verifyAddress({ address: 'n4DNhSiEaodqaiF9tLYXTCh4kFbdUzxBHs' }).should.be.true();
    });

    it('p2sh', () => {
      bitgo = TestBitGo.decorate(BitGo, { env: 'prod' });
      bitgo.verifyAddress({ address: '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC' }).should.be.true();
      // wrong version byte:
      bitgo.verifyAddress({ address: 'HV8swrGkmeN7Xig4vENr93aQSrX4iHjg7D' }).should.be.false();
      bitgo = TestBitGo.decorate(BitGo);
      bitgo.verifyAddress({ address: '2NEeFWbfu4EA1rcKx48e82Mj8d6FKcWawZw' }).should.be.true();
    });
  });

  describe('Encrypt/Decrypt', () => {
    const password = 'mickey mouse';
    const secret = 'this is a secret';

    it('invalid password', () => {
      const bitgo = TestBitGo.decorate(BitGo);
      bitgo.initializeTestVars();
      const opaque = bitgo.encrypt({ password: password, input: secret });
      (() => bitgo.decrypt({ password: 'hack hack', input: opaque })).should.throw();
    });

    it('valid password', () => {
      const bitgo = TestBitGo.decorate(BitGo);
      bitgo.initializeTestVars();
      const opaque = bitgo.encrypt({ password: password, input: secret });
      bitgo.decrypt({ password: password, input: opaque }).should.equal(secret);
    });
  });

  describe('Password Generation', () => {
    it('generates a random password', () => {
      const bitgo = TestBitGo.decorate(BitGo);
      bitgo.initializeTestVars();
      const password = bitgo.generateRandomPassword();
      should.exist(password);
    });

    it('generates a random password with a numWords argument', () => {
      const bitgo = TestBitGo.decorate(BitGo);
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
    const bitgo = TestBitGo.decorate(BitGo);
    const seed = '8cc57dac9cdae42bf7848a2d12f2874d31eca1f9de8fe3f8fa13e7857b545d59';
    const xpub =
      'xpub661MyMwAqRbcEusRjkJ64BXgR8ddYsXbuDJfbRc3eZcZVEa2ygswDiFZQpHFsA5N211YDvi2N898h4KrcXcfsR8PLhjJaPUwCUqg1ptBBHN';
    const passwords = ['mickey', 'mouse', 'donald', 'duck'];

    it('should fail to split secret with wrong m', () => {
      (() =>
        bitgo.splitSecret({
          seed,
          passwords: ['abc'],
          m: 0,
        })).should.throw('m must be a positive integer greater than or equal to 2');
    });

    it('should fail to split secret with bad password count', () => {
      (() =>
        bitgo.splitSecret({
          seed,
          passwords: ['abc'],
          m: 2,
        })).should.throw('passwords array length cannot be less than m');
    });

    it('should split and fail to reconstitute secret with bad passwords', () => {
      const splitSecret = bitgo.splitSecret({ seed, passwords: passwords, m: 3 });
      const shards = _.at(splitSecret.seedShares, [0, 2]);
      const subsetPasswords = _.at(passwords, [0, 3]);
      (() =>
        bitgo.reconstituteSecret({
          shards,
          passwords: subsetPasswords,
          xpub,
        } as any)).should.throw(/ccm: tag doesn't match/);
    });

    it('should split and reconstitute secret', () => {
      const splitSecret = bitgo.splitSecret({ seed, passwords: passwords, m: 2 });
      const shards = _.at(splitSecret.seedShares, [0, 2]);
      const subsetPasswords = _.at(passwords, [0, 2]);
      const reconstitutedSeed = bitgo.reconstituteSecret({ shards, passwords: subsetPasswords });
      reconstitutedSeed.seed.should.equal(seed);
      reconstitutedSeed.xpub.should.equal(
        'xpub661MyMwAqRbcEusRjkJ64BXgR8ddYsXbuDJfbRc3eZcZVEa2ygswDiFZQpHFsA5N211YDvi2N898h4KrcXcfsR8PLhjJaPUwCUqg1ptBBHN'
      );
      reconstitutedSeed.xprv.should.equal(
        'xprv9s21ZrQH143K2Rnxdim5h3aws6o99QokXzP4o3CS6E5acSEtS9Zgfuw5ZWujhTHTWEAZDfmP3yxA1Ccn6myVkGEpRrT4xWgaEpoW7YiBAtC'
      );
    });

    it('should split and incorrectly verify secret', () => {
      const splitSecret = bitgo.splitSecret({ seed, passwords: passwords, m: 3 });
      const isValid = bitgo.verifyShards({ shards: splitSecret.seedShares, passwords, m: 2 } as any);
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
    function getKey(seed: string) {
      return ECPair.fromPrivateKey(
        bip32.fromSeed(crypto.createHash('sha256').update(seed).digest()).privateKey as Buffer
      );
    }

    it('should calculate a new ECDH sharing secret correctly', () => {
      for (let i = 0; i < 256; i++) {
        const bitgo = TestBitGo.decorate(BitGo);
        const eckey1 = getKey(`${i}.a`);
        const eckey2 = getKey(`${i}.b`);
        const sharingKey1 = bitgo.getECDHSecret({ eckey: eckey1, otherPubKeyHex: eckey2.publicKey.toString('hex') });
        const sharingKey2 = bitgo.getECDHSecret({ eckey: eckey2, otherPubKeyHex: eckey1.publicKey.toString('hex') });
        sharingKey1.should.equal(sharingKey2);

        switch (i) {
          case 0:
            sharingKey1.should.eql('465ffe5745325998b83fb39631347148e24d4f21b3f3b54739c264d5c42db4b8');
            break;
          case 1:
            sharingKey1.should.eql('61ff44fc1af8061a433a314b7b8be8ae352c10f62aac5887047dbaa5643b818d');
            break;
        }
      }
    });
  });

  describe('change password', function () {
    let bitgo;
    let bgUrl;

    before(async function () {
      nock('https://bitgo.fakeurl')
        .post('/api/auth/v1/session')
        .reply(200, {
          access_token: 'access_token',
          user: { username: 'update_pw_tester@bitgo.com' },
        });

      bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      bitgo.initializeTestVars();
      bitgo.setValidate(false);

      await bitgo.authenticateChangePWTestUser(bitgo.testUserOTP());

      bgUrl = common.Environments[bitgo.getEnv()].uri;
    });

    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const otherPassword = 'otherPassword';

    describe('should fail to change the password', function changePWFail() {
      it('wrong arguments', async function () {
        await bitgo.changePassword({ newPassword: '5678' }).should.be.rejectedWith('expected string oldPassword');
        await bitgo
          .changePassword({ oldPassword: 1234, newPassword: '5678' })
          .should.be.rejectedWith('expected string oldPassword');
        await bitgo.changePassword({ oldPassword: '1234' }).should.be.rejectedWith('expected string newPassword');
        await bitgo
          .changePassword({ oldPassword: '1234', newPassword: 5678 })
          .should.be.rejectedWith('expected string newPassword');
      });

      it('incorrect old password', async function () {
        nock(bgUrl).post('/api/v1/user/verifypassword').reply(200, { valid: false });
        await bitgo
          .changePassword({ oldPassword, newPassword })
          .should.be.rejectedWith('the provided oldPassword is incorrect');
      });
    });

    it('successful password change', async function () {
      nock(bgUrl).post('/api/v1/user/verifypassword').reply(200, { valid: true });

      nock(bgUrl)
        .post('/api/v1/user/encrypted')
        .reply(200, {
          version: 1,
          keychains: {
            xpub11: bitgo.encrypt({ input: 'xprv11', password: oldPassword }),
            xpub12: bitgo.encrypt({ input: 'xprv12', password: oldPassword }),
            xpub13: bitgo.encrypt({ input: 'xprv13', password: otherPassword }),
            xpub14: bitgo.encrypt({ input: 'xprv14', password: oldPassword }),
          },
        });

      nock(bgUrl)
        .get('/api/v2/tbtc/key')
        .query(true)
        .reply(200, {
          keys: [
            {
              pub: 'xpub21',
              encryptedPrv: bitgo.encrypt({ input: 'xprv21', password: oldPassword }),
            },
            {
              pub: 'xpub22',
              encryptedPrv: bitgo.encrypt({ input: 'xprv22', password: otherPassword }),
            },
          ],
        });

      nock(bgUrl).post('/api/v1/user/changepassword').reply(200, {});

      await bitgo.changePassword({ oldPassword, newPassword });
    });

    afterEach(function afterChangePassword() {
      nock.pendingMocks().should.be.empty();
    });
  });

  describe('HMAC Handling', () => {
    let bitgo;
    const token = 'v2x5b735fed2486593f8fea19113e5c717308f90a5fb00e740e46c7bfdcc078cfd0';

    before(() => {
      bitgo = TestBitGo.decorate(BitGo, { env: 'mock', accessToken: token });
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
        encryptedToken:
          '{"iv":"EqxVaGTLY4naAYkuBaTz0w==","v":1,"iter":1000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"4S4dBYcgL4s=","ct":"FgBRJljb8iSYxnAjMi4Qotr7sTKbSmWnlfHZShMSi8YeeE3kiS8bpHNUwAPhY8tgouh3UsEwrJnY+54MvqFD7yd19pG1V4CVssr8"}',
        derivationPath: 'm/999999/104490948/173846667',
        encryptedECDHXprv:
          '{"iv":"QKHEF2GNcwOJwy6+pwANRA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"W2sVFvXDlOw=","ct":"8BTCqS25X37kLzmzQdGenhXH6znn9qEmkszAeS8kLnRdqKSiUiC7bTAVgg/Np5yrV7F7Jyiq+MTpVT76EoUT+PMJzArv0gUQKC2JPB3JuVKeAAVWBQmhWfkEwRfyv4hq4WMxwZtocwBqThvd2pJm9HE51GX4/Wo="}',
      };
      const parsedAuthenticationData = bitgo.handleTokenIssuance(responseJson, 'test@bitgo.com');
      parsedAuthenticationData.token.should.equal(token);
      parsedAuthenticationData.ecdhXprv.should.equal(
        'xprv9s21ZrQH143K3si1bKGp7KqgCQv39ttQ7aUwWzVdytgHd8HtDCHyEp14mxfhiT3qHTq4BaSrA7uUkG6AJTfPJBsRu63drvBqYuMZyTxepH7'
      );
    });

    it('should correctly verify a response hmac', async function () {
      const url = bitgo
        .coin('tltc')
        .url('/wallet/5941b202b42fcbc707170d5b597491d9/address/QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE?segwit=1');
      const requestHeaderData = bitgo.calculateRequestHeaders({ url, token });
      const requestHeaders = {
        'BitGo-Auth-Version': '2.0',
        'Content-Type': 'application/json',
        'Auth-Timestamp': requestHeaderData.timestamp,
        Authorization: 'Bearer ' + requestHeaderData.tokenHash,
        HMAC: requestHeaderData.hmac,
      };
      const responseBody =
        '{"id":"5a7ca8bcaf52c8e807c575fb692609ec","address":"QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE","chain":0,"index":2,"coin":"tltc","wallet":"5941b202b42fcbc707170d5b597491d9","coinSpecific":{"redeemScript":"522102835bcfd130f7a56f72c905b782d90b66e22f88ad3309cf72af5138a7d44be8b3210322c7f42a1eb212868eab78db7ba64846075d98c7f4c7aa25a02e57871039e0cd210265825be0d5bf957fb72abd7c23bf0836a78a15f951a073467cd5c99e03ce7ab753ae"},"balance":{"updated":"2018-02-28T23:48:07.341Z","numTx":1,"numUnspents":1,"totalReceived":20000000}}';

      nock('https://bitgo.fakeurl', { reqheaders: requestHeaders })
        .get('/api/v2/tltc/wallet/5941b202b42fcbc707170d5b597491d9/address/QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE?segwit=1')
        .reply(200, responseBody, {
          hmac: '30a5943043ab4b0503d807f0cca7dac3a670e8785331322567db5189432b87ec',
          timestamp: '1521590532925',
        });

      const responseData = (await rp({
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
            text: body,
          };
          return bitgo.verifyResponse(verificationParams);
        },
      })) as any;
      responseData.signatureSubject.should.equal(
        '1521590532925|/api/v2/tltc/wallet/5941b202b42fcbc707170d5b597491d9/address/QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE?segwit=1|200|{"id":"5a7ca8bcaf52c8e807c575fb692609ec","address":"QNc4RFAcbvqmtrR1kR2wbGLCx6tEvojFYE","chain":0,"index":2,"coin":"tltc","wallet":"5941b202b42fcbc707170d5b597491d9","coinSpecific":{"redeemScript":"522102835bcfd130f7a56f72c905b782d90b66e22f88ad3309cf72af5138a7d44be8b3210322c7f42a1eb212868eab78db7ba64846075d98c7f4c7aa25a02e57871039e0cd210265825be0d5bf957fb72abd7c23bf0836a78a15f951a073467cd5c99e03ce7ab753ae"},"balance":{"updated":"2018-02-28T23:48:07.341Z","numTx":1,"numUnspents":1,"totalReceived":20000000}}'
      );
      responseData.expectedHmac.should.equal('30a5943043ab4b0503d807f0cca7dac3a670e8785331322567db5189432b87ec');
      responseData.isValid.should.equal(true);
    });

    it('should include request body as part of the hmac', async function () {
      const url = 'https://bitgo.fakeurl';
      const body = { test: 'test' };

      const fixedUnixTime = 1627374646;
      const originalDateNow = Date.now;
      Date.now = () => fixedUnixTime;

      try {
        nock(url)
          .post('/', body)
          .reply(201, undefined, {
            hmac: '677e0c9a65ca384415945cb19b40ae38eaadfbce3ccce8c5d7bf37c1973b2553',
            timestamp: String(fixedUnixTime),
          });

        const resp = (await bitgo.post(url).send(body)) as any;
        resp.req.headers['hmac'].should.equal('4425a4004ef2724add25b4dd019d21c66394653a049d82e37df3a2c356b5706d');
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('should recognize trailing slash inconsistency', () => {
      const verificationParams = {
        url: 'https://google.com/api',
        hmac: '30a5943043ab4b0503d807f0cca7dac3a670e8785331322567db5189432b87ec',
        timestamp: '1521590532925',
        token: token,
        statusCode: 200,
        text: 'fakedata',
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
        text: 'fakedata',
      };
      const verificationDetails = bitgo.verifyResponse(verificationParams);
      verificationDetails.signatureSubject.should.equal('1521590532925|/|200|fakedata');
      verificationDetails.expectedHmac.should.equal('51c6d024f261e166e8a323f8fa36a9bb8d4d02b076334c2a9ae0a49efc5724d4');
      verificationDetails.isValid.should.equal(false);
    });

    it('should throw if hmac validation is enabled, and no valid hmac headers are returned', async function () {
      const url = 'https://fakeurl.invalid';
      const scope = nock(url).get('/').reply(200);

      // test suite bitgo object has hmac verification enabled, so it should throw when the nock responds
      await bitgo.get(url).should.be.rejectedWith(/invalid response HMAC, possible man-in-the-middle-attack/);
      scope.done();
    });

    it('should not enforce hmac verification if hmac verification is disabled', async function () {
      const bg = TestBitGo.decorate(BitGo, { env: 'mock', hmacVerification: false, accessToken: token });
      const url = 'https://fakeurl.invalid';
      const scope = nock(url).get('/').reply(200, { ok: 1 });

      const res = (await bg.get(url)) as any;
      res.body.should.have.property('ok', 1);
      scope.done();
    });
  });

  describe('Token Definitions at Startup', function () {
    it('Should return a non-empty list of tokens before the server responds', async function () {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      bitgo.initializeTestVars();
      const constants = bitgo.getConstants();
      constants.should.have.propertyByPath('eth', 'tokens', 'length').greaterThan(0);
    });

    after(function tokenDefinitionsAfter() {
      nock.pendingMocks().should.be.empty();
    });
  });

  describe('superagent wrappers', function () {
    let bitgo;
    let bgUrl;
    before(function () {
      bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      bitgo.initializeTestVars();

      bgUrl = common.Environments[bitgo.getEnv()].uri;

      nock(bgUrl).patch('/').reply(200);
    });

    it('PATCH requests', async function () {
      const res = await bitgo.patch(bgUrl);
      res.status.should.equal(200);
    });

    after(function () {
      nock.pendingMocks().should.be.empty();
    });
  });

  describe('preprocessAuthenticationParams', () => {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    it('should fail if passed non-string username or password', function () {
      (() => bitgo.preprocessAuthenticationParams({ username: 123 } as any)).should.throw(/expected string username/);
      (() => bitgo.preprocessAuthenticationParams({ username: 'abc', password: {} } as any)).should.throw(
        /expected string password/
      );
    });
  });

  describe('authenticate', function () {
    afterEach(function ensureNoPendingMocks() {
      nock.pendingMocks().should.be.empty();
    });

    it('should get the ecdhKeychain if ensureEcdhKeychain is set and user already has ecdhKeychain', async function () {
      nock('https://bitgo.fakeurl')
        .post('/api/auth/v1/session')
        .reply(200, {
          access_token: 'access_token',
          user: { username: 'auth-test@bitgo.com' },
        });
      nock('https://bitgo.fakeurl')
        .get('/api/v1/user/settings')
        .reply(200, {
          settings: {
            ecdhKeychain: 'some-existing-xpub',
          },
        });

      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      const response = await bitgo.authenticate({
        username: 'auth-test@bitgo.com',
        password: 'password123',
        otp: '000000',
        ensureEcdhKeychain: true,
      });

      should.exist(response.user.ecdhKeychain);
      response.user.ecdhKeychain.should.equal('some-existing-xpub');
    });
    it('should create the ecdhKeychain if ensureEcdhKeychain is set and the user does not already have ecdhKeychain', async function () {
      nock('https://bitgo.fakeurl')
        .post('/api/auth/v1/session')
        .reply(200, {
          access_token: 'access_token',
          user: { username: 'auth-test@bitgo.com' },
        });
      /**
       * This is {} because want to make sure the user has no ecdhXpub set before we set it
       */
      nock('https://bitgo.fakeurl').get('/api/v1/user/settings').reply(200, {
        settings: {},
      });
      nock('https://bitgo.fakeurl').post('/api/v1/keychain').reply(200, {
        xpub: 'some-xpub',
      });
      nock('https://bitgo.fakeurl')
        .put('/api/v2/user/settings')
        .reply(200, {
          settings: {
            ecdhKeychain: 'some-xpub',
          },
        });

      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      const response = await bitgo.authenticate({
        username: 'auth-test@bitgo.com',
        password: 'password123',
        otp: '000000',
        ensureEcdhKeychain: true,
      });

      should.exist(response.user.ecdhKeychain);
      response.user.ecdhKeychain.should.equal('some-xpub');
    });
  });
});
