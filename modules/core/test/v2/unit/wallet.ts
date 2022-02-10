//
// Tests for Wallets
//

import 'should';
import * as sinon from 'sinon';
require('should-sinon');
import '../lib/asserts';
import * as nock from 'nock';
import * as _ from 'lodash';

import { CustomSigningFunction, Wallet } from '../../../src/';
import * as common from '../../../src/common';

import { TestBitGo } from '../../lib/test_bitgo';

nock.disableNetConnect();

describe('V2 Wallet:', function () {
  const bitgo = new TestBitGo({ env: 'test' });
  bitgo.initializeTestVars();
  const basecoin = bitgo.coin('tbtc');
  const walletData = {
    id: '5b34252f1bf349930e34020a00000000',
    coin: 'tbtc',
    keys: [
      '5b3424f91bf349930e34017500000000',
      '5b3424f91bf349930e34017600000000',
      '5b3424f91bf349930e34017700000000',
    ],
    coinSpecific: {},
  };
  const wallet = new Wallet(bitgo, basecoin, walletData);
  const bgUrl = common.Environments[bitgo.getEnv()].uri;
  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';

  describe('Wallet transfers', function () {
    it('should search in wallet for a transfer', async function () {
      const params = { limit: 1, searchLabel: 'test' };

      const scope =
        nock(bgUrl)
          .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/transfer`)
          .query(params)
          .reply(200, {
            coin: 'tbch',
            transfers: [
              {
                wallet: wallet.id(),
                comment: 'tests',
              },
            ],
          });

      try {
        await wallet.transfers(params);
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }

      scope.isDone().should.be.True();
    });

    it('should forward all valid parameters', async function () {
      const params = {
        limit: 1,
        address: ['address1', 'address2'],
        dateGte: 'dateString0',
        dateLt: 'dateString1',
        valueGte: 0,
        valueLt: 300000000,
        allTokens: true,
        searchLabel: 'abc',
        includeHex: true,
        type: 'transfer_type',
        state: 'transfer_state',
      };

      // The actual api request will only send strings, but the SDK function expects numbers for some values
      const apiParams = _.mapValues(params, param => Array.isArray(param) ? param : String(param));

      const scope =
        nock(bgUrl)
          .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/transfer`)
          .query(_.matches(apiParams))
          .reply(200);

      await wallet.transfers(params);
      scope.isDone().should.be.True();
    });

    it('should accept a string argument for address', async function () {
      const params = {
        limit: 1,
        address: 'stringAddress',
      };

      const apiParams = {
        limit: '1',
        address: 'stringAddress',
      };

      const scope =
        nock(bgUrl)
          .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/transfer`)
          .query(_.matches(apiParams))
          .reply(200);

      try {
        await wallet.transfers(params);
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }

      scope.isDone().should.be.True();
    });

    it('should throw errors for invalid expected parameters', async function () {
      // @ts-expect-error checking type mismatch
      await wallet.transfers({ address: 13375 }).should.be.rejectedWith('invalid address argument, expecting string or array');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ address: [null] }).should.be.rejectedWith('invalid address argument, expecting array of address strings');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ dateGte: 20101904 }).should.be.rejectedWith('invalid dateGte argument, expecting string');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ dateLt: 20101904 }).should.be.rejectedWith('invalid dateLt argument, expecting string');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ valueGte: '10230005' }).should.be.rejectedWith('invalid valueGte argument, expecting number');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ valueLt: '-5e8' }).should.be.rejectedWith('invalid valueLt argument, expecting number');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ includeHex: '123' }).should.be.rejectedWith('invalid includeHex argument, expecting boolean');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ state: 123 }).should.be.rejectedWith('invalid state argument, expecting string or array');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ state: [123, 456] }).should.be.rejectedWith('invalid state argument, expecting array of state strings');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ type: 123 }).should.be.rejectedWith('invalid type argument, expecting string');
    });
  });

  describe('Wallet addresses', function () {
    it('should search in wallet addresses', async function () {
      const params = { limit: 1, labelContains: 'test' };

      const scope =
        nock(bgUrl)
          .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/addresses`)
          .query(params)
          .reply(200, {
            coin: 'tbch',
            transfers: [
              {
                wallet: wallet.id(),
                comment: 'tests',
              },
            ],
          });

      try {
        await wallet.addresses(params);
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }

      scope.isDone().should.be.True();
    });
  });

  describe('Get User Prv', () => {
    const prv = 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';
    const derivedPrv = 'xprv9yoG67Td11uwjXwbV8zEmrySVXERu5FZAsLD9suBeEJbgJqANs8Yng5dEJoii7hag5JermK6PbfxgDmSzW7ewWeLmeJEkmPfmZUSLdETtHx';
    it('should use the cold derivation seed to derive the proper user private key', async () => {
      const userPrvOptions = {
        prv,
        coldDerivationSeed: '123',
      };
      wallet.getUserPrv(userPrvOptions).should.eql(derivedPrv);
    });

    it('should use the user keychain derivedFromParentWithSeed as the cold derivation seed if none is provided', async () => {
      const userPrvOptions = {
        prv,
        keychain: {
          derivedFromParentWithSeed: '123',
          id: '456',
          pub: '789',
        },
      };
      wallet.getUserPrv(userPrvOptions).should.eql(derivedPrv);
    });

    it('should prefer the explicit cold derivation seed to the user keychain derivedFromParentWithSeed', async () => {
      const userPrvOptions = {
        prv,
        coldDerivationSeed: '123',
        keychain: {
          derivedFromParentWithSeed: '456',
          id: '789',
          pub: '012',
        },
      };
      wallet.getUserPrv(userPrvOptions).should.eql(derivedPrv);
    });
  });

  describe('Wallet Transactions', function () {
    let ethWallet;

    before(async function () {
      const walletData = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coin: 'teth',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7',
        ],
      };
      ethWallet = new Wallet(bitgo, bitgo.coin('teth'), walletData);
    });

    it('should error eip1559 and gasPrice are passed', async function () {
      const params = {
        gasPrice: 100,
        eip1559: {
          maxPriorityFeePerGas: 10,
          maxFeePerGas: 10,
        },
        amount: 10,
        address: TestBitGo.V2.TEST_WALLET1_ADDRESS,
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
      };
      await ethWallet.send(params).should.be.rejected();
    });

    it('should search for pending transaction correctly', async function () {
      const params = { walletId: wallet.id() };

      const scope =
        nock(bgUrl)
          .get(`/api/v2/${wallet.coin()}/tx/pending/first`)
          .query(params)
          .reply(200);
      try {
        await wallet.getFirstPendingTransaction();
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    });

    it('should try to change the fee correctly', async function () {
      const params = { txid: '0xffffffff', fee: '10000000' };

      const scope =
        nock(bgUrl)
          .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/changeFee`, params)
          .reply(200);

      try {
        await wallet.changeFee({ txid: '0xffffffff', fee: '10000000' });
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    });

    it('should pass data parameter and amount: 0 when using sendTransaction', async function () {
      const path = `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`;
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [{
        address: recipientAddress,
        amount: 0,
        data: '0x00110011',
      }];
      const response = nock(bgUrl)
        .post(path, _.matches({ recipients })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      try {
        await ethWallet.send({ address: recipients[0].address, data: recipients[0].data, amount: recipients[0].amount });
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      response.isDone().should.be.true();
    });

    it('should pass data parameter and amount: 0 when using sendMany', async function () {
      const path = `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`;
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [{
        address: recipientAddress,
        amount: 0,
        data: '0x00110011',
      }];
      const response = nock(bgUrl)
        .post(path, _.matches({ recipients })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      try {
        await ethWallet.sendMany({ recipients });
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      response.isDone().should.be.true();
    });

    it('should use a custom signing function if provided', async function () {
      const customSigningFunction: CustomSigningFunction = sinon.stub();
      const builtInSigningMethod = sinon.spy();

      const stubs = [
        sinon.stub(wallet.baseCoin, 'postProcessPrebuild').returnsArg(0),
        sinon.stub(wallet.baseCoin, 'verifyTransaction').resolves(true),
        sinon.stub(wallet.baseCoin, 'signTransaction').callsFake(builtInSigningMethod),
      ];

      const recipients = [
        { address: 'abc', amount: 123 },
        { address: 'def', amount: 456 },
      ];

      const txPrebuild = {
        txHex: 'this-is-a-tx',
      };

      const scope = nock(bgUrl)
        .post(wallet.url('/tx/build').replace(bgUrl, ''))
        .reply(200, txPrebuild)
        .get(wallet.baseCoin.url('/public/block/latest').replace(bgUrl, ''))
        .reply(200)
        .get(wallet.baseCoin.url(`/key/${wallet.keyIds()[0]}`).replace(bgUrl, ''))
        .reply(200)
        .get(wallet.baseCoin.url(`/key/${wallet.keyIds()[1]}`).replace(bgUrl, ''))
        .reply(200)
        .get(wallet.baseCoin.url(`/key/${wallet.keyIds()[2]}`).replace(bgUrl, ''))
        .reply(200)
        .post(wallet.url('/tx/send').replace(bgUrl, ''))
        .reply(200, { ok: true });

      const result = await wallet.sendMany({ recipients, customSigningFunction });

      result.should.have.property('ok', true);
      customSigningFunction.should.have.been.calledOnceWith(sinon.match({
        recipients,
        txPrebuild,
        pubs: sinon.match.array,
      }));
      builtInSigningMethod.called.should.be.false();
      scope.done();
      stubs.forEach((s) => s.restore());
    });
  });

  describe('Create Address', () => {
    let ethWallet, nocks;
    const walletData = {
      id: '598f606cd8fc24710d2ebadb1d9459bb',
      coinSpecific: {
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
      },
      coin: 'teth',
      keys: [
        '598f606cd8fc24710d2ebad89dce86c2',
        '598f606cc8e43aef09fcb785221d9dd2',
        '5935d59cf660764331bafcade1855fd7',
      ],
    };

    beforeEach(async function() {
      ethWallet = new Wallet(bitgo, bitgo.coin('teth'), walletData);
      nocks = [
        nock(bgUrl)
          .get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[0]}`)
          .reply(200, {
            id: '598f606cd8fc24710d2ebad89dce86c2',
            pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
            ethAddress: '0x26a163ba9739529720c0914c583865dec0d37278',
            source: 'user',
            encryptedPrv: '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
            coinSpecific: {},
          }),

        nock(bgUrl)
          .get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[1]}`)
          .reply(200, {
            id: '598f606cc8e43aef09fcb785221d9dd2',
            pub: 'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
            ethAddress: '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91',
            source: 'backup',
            coinSpecific: {},
          }),

        nock(bgUrl)
          .get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[2]}`)
          .reply(200, {
            id: '5935d59cf660764331bafcade1855fd7',
            pub: 'xpub661MyMwAqRbcFsXShW8R3hJsHNTYTUwzcejnLkY7KCtaJbDqcGkcBF99BrEJSjNZHeHveiYUrsAdwnjUMGwpgmEbiKcZWRuVA9HxnRaA3r3',
            ethAddress: '0x032821b7ea40ea5d446f47c29a0f777ee035aa10',
            source: 'bitgo',
            coinSpecific: {},
          }),
      ];
    });

    afterEach(async function() {
      nock.cleanAll();
      nocks.forEach(scope => scope.isDone().should.be.true());
    });

    it('should correctly validate arguments to create address', async function () {
      let message = 'gasPrice has to be an integer or numeric string';
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ gasPrice: {} }).should.be.rejectedWith(message);
      await wallet.createAddress({ gasPrice: 'abc' }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ gasPrice: null }).should.be.rejectedWith(message);

      message = 'chain has to be an integer';
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ chain: {} }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ chain: 'abc' }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ chain: null }).should.be.rejectedWith(message);

      message = 'count has to be a number between 1 and 250';
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ count: {} }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ count: 'abc' }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ count: null }).should.be.rejectedWith(message);
      await wallet.createAddress({ count: -1 }).should.be.rejectedWith(message);
      await wallet.createAddress({ count: 0 }).should.be.rejectedWith(message);
      await wallet.createAddress({ count: 251 }).should.be.rejectedWith(message);

      message = 'baseAddress has to be a string';
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ baseAddress: {} }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ baseAddress: 123 }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ baseAddress: null }).should.be.rejectedWith(message);

      message = 'allowSkipVerifyAddress has to be a boolean';
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ allowSkipVerifyAddress: {} }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ allowSkipVerifyAddress: 123 }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ allowSkipVerifyAddress: 'abc' }).should.be.rejectedWith(message);
      // @ts-expect-error checking type mismatch
      await wallet.createAddress({ allowSkipVerifyAddress: null }).should.be.rejectedWith(message);
    });

    it('verify address when pendingChainInitialization is true in case of eth v1 forwarder', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 1 })
        .reply(200, {
          id: '615c643a98a2a100068e023c639c0f74',
          address: '0x8c13cd0bb198858f628d5631ba4b2293fc08df49',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          chain: 0,
          index: 3179,
          coin: 'teth',
          lastNonce: 0,
          wallet: '598f606cd8fc24710d2ebadb1d9459bb',
          coinSpecific: {
            nonce: -1,
            updateTime: '2021-10-05T14:42:02.399Z',
            txCount: 0,
            pendingChainInitialization: true,
            creationFailure: [],
            salt: '0xc6b',
            pendingDeployment: true,
            forwarderVersion: 1,
          },
        });
      await ethWallet.createAddress({ chain: 0, forwarderVersion: 1 }).should.be.rejectedWith('address validation failure: expected 0x32a226cda14e352a47bf4b1658648d8037736f80 but got 0x8c13cd0bb198858f628d5631ba4b2293fc08df49');
      scope.isDone().should.be.true();
    });

    it('verify address when invalid baseAddress is passed', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 1 })
        .reply(200, {
          id: '615c643a98a2a100068e023c639c0f74',
          address: '0x32a226cda14e352a47bf4b1658648d8037736f80',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          chain: 0,
          index: 3179,
          coin: 'teth',
          lastNonce: 0,
          wallet: '598f606cd8fc24710d2ebadb1d9459bb',
          coinSpecific: {
            nonce: -1,
            updateTime: '2021-10-05T14:42:02.399Z',
            txCount: 0,
            pendingChainInitialization: true,
            creationFailure: [],
            salt: '0xc6b',
            pendingDeployment: true,
            forwarderVersion: 1,
          },
        });
      await ethWallet.createAddress({ chain: 0, forwarderVersion: 1, baseAddress: 'asgf' }).should.be.rejectedWith('invalid base address');
      scope.isDone().should.be.true();
    });

    it('verify address when incorrect baseAddress is passed', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 1 })
        .reply(200, {
          id: '615c643a98a2a100068e023c639c0f74',
          address: '0x32a226cda14e352a47bf4b1658648d8037736f80',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          chain: 0,
          index: 3179,
          coin: 'teth',
          lastNonce: 0,
          wallet: '598f606cd8fc24710d2ebadb1d9459bb',
          coinSpecific: {
            nonce: -1,
            updateTime: '2021-10-05T14:42:02.399Z',
            txCount: 0,
            pendingChainInitialization: true,
            creationFailure: [],
            salt: '0xc6b',
            pendingDeployment: true,
            forwarderVersion: 1,
          },
        });
      // incorrect address is generated while validating due to incorrect baseAddress
      await ethWallet.createAddress({ chain: 0, forwarderVersion: 1, baseAddress: '0x8c13cd0bb198858f628d5631ba4b2293fc08df49' }).should.be.rejectedWith('address validation failure: expected 0x36748926007790e7ee416c6485b32e00cfb177a3 but got 0x32a226cda14e352a47bf4b1658648d8037736f80');
      scope.isDone().should.be.true();
    });

    it('verify address when pendingChainInitialization is true  and allowSkipVerifyAddress is false in case of eth v0 forwarder', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 0 })
        .reply(200, {
          id: '615c643a98a2a100068e023c639c0f74',
          address: '0x32a26cda14e352a47bf4b1658648d8037736f80',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          chain: 0,
          index: 3179,
          coin: 'teth',
          lastNonce: 0,
          wallet: '598f606cd8fc24710d2ebadb1d9459bb',
          coinSpecific: {
            nonce: -1,
            updateTime: '2021-10-05T14:42:02.399Z',
            txCount: 0,
            pendingChainInitialization: true,
            creationFailure: [],
            salt: '0xc6b',
            pendingDeployment: true,
            forwarderVersion: 1,
          },
        });
      await ethWallet.createAddress({ chain: 0, forwarderVersion: 0, allowSkipVerifyAddress: false }).should.be.rejectedWith('address verification skipped for count = 1');
      scope.isDone().should.be.true();
    });

    it('verify address with allowSkipVerifyAddress set to false and eth v1 forwarder', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 1 })
        .reply(200, {
          id: '615c643a98a2a100068e023c639c0f74',
          address: '0x32a226cda14e352a47bf4b1658648d8037736f80',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          chain: 0,
          index: 3179,
          coin: 'teth',
          lastNonce: 0,
          wallet: '598f606cd8fc24710d2ebadb1d9459bb',
          coinSpecific: {
            nonce: -1,
            updateTime: '2021-10-05T14:42:02.399Z',
            txCount: 0,
            pendingChainInitialization: true,
            creationFailure: [],
            salt: '0xc6b',
            pendingDeployment: true,
            forwarderVersion: 0,
          },
        });
      const newAddress = await ethWallet.createAddress({ chain: 0, forwarderVersion: 1, allowSkipVerifyAddress: false });
      newAddress.index.should.equal(3179);
      scope.isDone().should.be.true();
    });
  }) ;

  describe('Solana tests: ', () => {
    let solWallet;
    const passphrase = '#Bondiola1234';
    const solBitgo = new TestBitGo({ env: 'mock' });
    solBitgo.initializeTestVars();
    const tsol = solBitgo.coin('tsol');
    const walletData = {
      id: '598f606cd8fc24710d2ebadb1d9459bb',
      coinSpecific: {
        baseAddress: '5f8WmC2uW9SAk7LMX2r4G1Bx8MMwx8sdgpotyHGodiZo',
        pendingChainInitialization: false,
        minimumFunding: 2447136,
        lastChainIndex: { 0: 0 },
      },
      coin: 'tsol',
      keys: [
        '598f606cd8fc24710d2ebad89dce86c2',
        '598f606cc8e43aef09fcb785221d9dd2',
        '5935d59cf660764331bafcade1855fd7',
      ],
    };

    before(async function () {
      solWallet = new Wallet(bitgo, bitgo.coin('tsol'), walletData);
      nock(bgUrl)
        .get(`/api/v2/${solWallet.coin()}/key/${solWallet.keyIds()[0]}`)
        .times(3)
        .reply(200, {
          id: '598f606cd8fc24710d2ebad89dce86c2',
          pub: '5f8WmC2uW9SAk7LMX2r4G1Bx8MMwx8sdgpotyHGodiZo',
          source: 'user',
          encryptedPrv: '{"iv":"hNK3rg82P1T94MaueXFAbA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"cV4wU4EzPjs=","ct":"9VZX99Ztsb6p75Cxl2lrcXBplmssIAQ9k7ZA81vdDYG4N5dZ36BQNWVfDoelj9O31XyJ+Xri0XKIWUzl0KKLfUERplmtNoOCn5ifJcZwCrOxpHZQe3AJ700o8Wmsrk5H"}',
          coinSpecific: {},
          addressDerivationKeypair: {
            pub: '3eJ1H3LfbSpQy1NFGsTHtLhP1s1PuMWaaqHqj4Bm13ya',
            encryptedPrv: '{"iv":"5pSLrx+MK3N8exqwDtiH2A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"c3z58NKwCMQ=","ct":"ZPsexWW+bbkZSkwVph9doog0b0xrILehlSFfafpq65J14QmU5gklKc7jhK3taBtuyGPmAVWfkXCdZBe9s4ohaWzuQnG6r8DRQmR5xG8mzF9hDCBl+wAuW3pRMugn1Zdj"}',
          },
        });

      nock(bgUrl)
        .get(`/api/v2/${solWallet.coin()}/key/${solWallet.keyIds()[1]}`)
        .times(2)
        .reply(200, {
          id: '598f606cc8e43aef09fcb785221d9dd2',
          pub: 'G1s43JTzNZzqhUn4aNpwgcc6wb9FUsZQD5JjffG6isyd',
          encryptedPrv: '{"iv":"UFrt/QlIUR1XeQafPBaAlw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"7VPBYaJXPm8=","ct":"ajFKv2y8yaIBXQ39sAbBWcnbiEEzbjS4AoQtp5cXYqjeDRxt3aCxemPm22pnkJaCijFjJrMHbkmsNhNYzHg5aHFukN+nEAVssyNwHbzlhSnm8/BVN50yAdAAtWreh8cp"}',
          source: 'backup',
          coinSpecific: {},
        });

      nock(bgUrl)
        .get(`/api/v2/${solWallet.coin()}/key/${solWallet.keyIds()[2]}`)
        .times(2)
        .reply(200, {
          id: '5935d59cf660764331bafcade1855fd7',
          pub: 'GH1LV1e9FdqGe8U2c8PMEcma3fDeh1ktcGVBrD3AuFqx',
          encryptedPrv: '{"iv":"iIuWOHIOErEDdiJn6g46mg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Rzh7RRJksj0=","ct":"rcNICUfp9FakT53l+adB6XKzS1vNTc0Qq9jAtqnxA+ScssiS4Q0l3sgG/0gDy5DaZKtXryKBDUvGsi7b/fYaFCUpAoZn/VZTOhOUN/mo7ZHb4OhOXL29YPPkiryAq9Cr"}',
          source: 'bitgo',
          coinSpecific: {},
        });
    });

    after(async function () {
      nock.cleanAll();
    });

    describe('prebuildAndSignTransaction: ', function () {
      it('should successfully sign a consolidation transfer', async function () {
        const txParams = {
          prebuildTx: {
            walletId: walletData.id,
            txHex: 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIE9MWWV2ct01mg5Gm4EqcJ9SAn2XuD+FuAHcHFTkc1Tgut3DgTsiSgTQ0dmzj5JJg6qYTpn8FxOYPFCFTMoZi46gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUpTWpkpIQZNJOhxYNo4fHw1td28kruB5B+oQEEFRI0Qc+q0Zg6OOpV8eCDVLfYziox7YBA7+QPLX4IRhDCSKwICAgABDAIAAACghgEAAAAAAAMAFVRlc3QgaW50ZWdyYXRpb24gbWVtbw==',
            txInfo: {
              feePayer: 'HUVE5NfJyGfU1djZsVLA6fxSTS1E2iRqcTRVNC9K2z7c',
              lamportsPerSignature: 5000,
              nonce: '27E3MXFvXMUNYeMJeX1pAbERGsJfUbkaZTfgMgpmNN5g',
              numSignatures: 0,
              instructionsData: [
                {
                  type: 'Transfer',
                  params: {
                    fromAddress: 'HUVE5NfJyGfU1djZsVLA6fxSTS1E2iRqcTRVNC9K2z7c',
                    toAddress: 'ChgJ5tgDwBUsk9RNMm2iLiwP8RodwgZ6uqrC5paJsXVT',
                    amount: '100000',
                  },
                },
                {
                  type: 'Memo',
                  params: {
                    memo: 'Test integration memo',
                  },
                },
              ],
            },
            buildParams: {
              memo: {
                type: 'Memo',
                value: 'Test integration memo',
              },
              recipients: [
                {
                  address: 'ChgJ5tgDwBUsk9RNMm2iLiwP8RodwgZ6uqrC5paJsXVT',
                  amount: '100000',
                },
              ],
              type: 'transfer',
            },
            consolidateId: '1234',
            consolidationDetails: {
              senderAddressIndex: 1,
            },
          },
          walletPassphrase: passphrase,
        };
        // Build and sign the transaction
        const preBuiltSignedTx = await solWallet.prebuildAndSignTransaction(txParams);
        preBuiltSignedTx.should.have.property('txHex');
      });
    });

    describe('Create Address for Solana', () => {
      it('should create a 2 derived addresses for sol', async function () {
        const nock1 = nock(bgUrl)
          .post(`/api/v2/${solWallet.coin()}/wallet/${solWallet.id()}/address`, _.conforms(
            { chain: (c) => _.isNumber(c), index: (i) => _.isEqual(i, 1), derivedAddress: (a) => _.isString(a) }))
          .reply(200, (uri, body) => {
            const parsedBody = JSON.parse(body as string);
            tsol.isValidAddress(parsedBody.derivedAddress).should.be.true();
            parsedBody.chain.should.equal(0);
            parsedBody.index.should.equal(1);
            return {
              id: '615c643a98a2a100068e023c639c0f74',
              address: parsedBody.derivedAddress,
              chain: parsedBody.chain,
              index: parsedBody.index,
              coin: 'tsol',
              lastNonce: 0,
              wallet: '598f606cd8fc24710d2ebadb1d9459bb',
              coinSpecific: {
                pendingChainInitialization: true,
                minimumFunding: 2447136,
                rootAddress: parsedBody.derivedAddress,
              },
            };
          });
        await solWallet.createAddress({
          chain: 0,
          passphrase,
        });
        nock1.isDone().should.be.true();

        // imitates the raise of the lastChainIndex after the address creation
        walletData.coinSpecific.lastChainIndex[0]++;
        const updatedSolWallet = new Wallet(bitgo, bitgo.coin('tsol'), walletData);
        const nock2 = nock(bgUrl)
          .post(`/api/v2/${updatedSolWallet.coin()}/wallet/${updatedSolWallet.id()}/address`, _.conforms(
            { chain: (c) => _.isNumber(c), index: (i) => _.isEqual(i, 2), derivedAddress: (a) => _.isString(a) }))
          .reply(200, (uri, body) => {
            const parsedBody = JSON.parse(body as string);
            tsol.isValidAddress(parsedBody.derivedAddress).should.be.true();
            parsedBody.chain.should.equal(0);
            parsedBody.index.should.equal(2);
            return {
              id: '615c643a98a2a100068e023c639c0f73',
              address: parsedBody.derivedAddress,
              chain: parsedBody.chain,
              index: parsedBody.index,
              coin: 'tsol',
              lastNonce: 0,
              wallet: '598f606cd8fc24710d2ebadb1d9459bb',
              coinSpecific: {
                pendingChainInitialization: true,
                minimumFunding: 2447136,
                rootAddress: parsedBody.derivedAddress,
              },
            };
          });

        await updatedSolWallet.createAddress({
          chain: 0,
          passphrase,
        });
        nock2.isDone().should.be.true();
      });
    });
  });

  describe('Create Address for Polkadot', () => {
    let dotWallet, coinNocks;
    const passphrase = 'Passphrase1234';
    const coinBitgo = new TestBitGo({ env: 'mock' });
    coinBitgo.initializeTestVars();
    const tdot = coinBitgo.coin('tdot');
    const walletData = {
      id: '598f606cd8fc24710d2ebadb1d9459bb',
      coinSpecific: {
        rootAddress: '5f8WmC2uW9SAk7LMX2r4G1Bx8MMwx8sdgpotyHGodiZo',
        lastChainIndex: { 0: 0 },
      },
      coin: 'tdot',
      keys: [
        '598f606cd8fc24710d2ebad89dce86c2',
        '598f606cc8e43aef09fcb785221d9dd2',
        '5935d59cf660764331bafcade1855fd7',
      ],
    };

    beforeEach(async function () {
      dotWallet = new Wallet(bitgo, bitgo.coin('tdot'), walletData);
      coinNocks = [
        nock(bgUrl)
          .get(`/api/v2/${dotWallet.coin()}/key/${dotWallet.keyIds()[0]}`)
          .times(2)
          .reply(200, {
            id: '598f606cd8fc24710d2ebad89dce86c2',
            pub: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
            source: 'user',
            encryptedPrv: '{"iv":"8yOcLDpWe5wZnqJyftjrqQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"YDBv4nR/hu8=","ct":"m4CKUWNGTNXMJahCrYG2+6M+YmhegZTk0S3SP3BEOoNunc4dvg7ZT3EdryXeKoFG77W8bh+uJpB38yVEnLGQv5vYNjAmMu4J"}',
            coinSpecific: {},
            // addressDerivationKeypair represents the single sig KP used to derive addresses from
            addressDerivationKeypair: {
              pub: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
              encryptedPrv: '{"iv":"qv4P1xvbBWvJ82ANzVQICA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"xUMlfBzd6/E=","ct":"UVWWDhivmo/9DCMUOdTzLnDrDbjEX98MmVwC+TBAC+C6RYi6EKSL5wiCx5QI8PRic1CALeU2NEg6uu2akhIm7nS3bEDD4Vfe"}',
            },
          }),

        nock(bgUrl)
          .get(`/api/v2/${dotWallet.coin()}/key/${dotWallet.keyIds()[1]}`)
          .times(2)
          .reply(200, {
            id: '598f606cc8e43aef09fcb785221d9dd2',
            pub: 'd472bd6e0f1f92297631938e30edb682208c2cd2698d80cf678c53a69979eb9f',
            encryptedPrv: '{"iv":"Os4sXt/AWg4GVOlzcswxhQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"cn7WLegr0zA=","ct":"29Aq9b+7KmCZbnpqDYBusS2qxj3JB3prNbc3Fq+TBwjv97K69NNR2h2Id2Fq36lJO9eu7neqvjG0rkI64phBRD6npdw7mtmt"}',
            source: 'backup',
            coinSpecific: {},
          }),

        nock(bgUrl)
          .get(`/api/v2/${dotWallet.coin()}/key/${dotWallet.keyIds()[2]}`)
          .times(2)
          .reply(200, {
            id: '5935d59cf660764331bafcade1855fd7',
            pub: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7',
            encryptedPrv: '{"iv":"45l3KXJTWVeT24fjPAwK9g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"NctSBGanqrc=","ct":"uquQCan0ItRHCGNnUkF1JkjxGJyAChLnx6QfkgKE5FSeoMutA77hB4GM2DTn2kMoxYhXMnnCX/nIld1RXvAjSrX99vHwdcuQ"}',
            source: 'bitgo',
            coinSpecific: {},
          }),
      ];
    });

    afterEach(async function () {
      nock.cleanAll();
      coinNocks.forEach(scope => scope.isDone().should.be.true());
    });

    it('should create a 2 derived addresses for dot', async function () {
      const nock1 = nock(bgUrl)
        .post(`/api/v2/${dotWallet.coin()}/wallet/${dotWallet.id()}/address`, _.conforms(
          { chain: (c) => _.isNumber(c), index: (i) => _.isEqual(i, 1), derivedAddress: (a) => _.isString(a) }))
        .reply(200, (uri, body) => {
          const parsedBody = JSON.parse(body as string);
          tdot.isValidAddress(parsedBody.derivedAddress).should.be.true();
          parsedBody.chain.should.equal(0);
          parsedBody.index.should.equal(1);
          return {
            id: '615c643a98a2a100068e023c639c0f74',
            address: parsedBody.derivedAddress,
            chain: parsedBody.chain,
            index: parsedBody.index,
            coin: 'tdot',
            lastNonce: 0,
            wallet: '598f606cd8fc24710d2ebadb1d9459bb',
            coinSpecific: {
              rootAddress: parsedBody.derivedAddress,
            },
          };
        });
      await dotWallet.createAddress({
        chain: 0,
        passphrase,
      });
      nock1.isDone().should.be.true();

      // imitates the raise of the lastChainIndex after the address creation
      walletData.coinSpecific.lastChainIndex[0]++;
      const updatedDotWallet = new Wallet(bitgo, bitgo.coin('tdot'), walletData);
      const nock2 = nock(bgUrl)
        .post(`/api/v2/${updatedDotWallet.coin()}/wallet/${updatedDotWallet.id()}/address`, _.conforms(
          { chain: (c) => _.isNumber(c), index: (i) => _.isEqual(i, 2), derivedAddress: (a) => _.isString(a) }))
        .reply(200, (uri, body) => {
          const parsedBody = JSON.parse(body as string);
          tdot.isValidAddress(parsedBody.derivedAddress).should.be.true();
          parsedBody.chain.should.equal(0);
          parsedBody.index.should.equal(2);
          return {
            id: '615c643a98a2a100068e023c639c0f73',
            address: parsedBody.derivedAddress,
            chain: parsedBody.chain,
            index: parsedBody.index,
            coin: 'tdot',
            lastNonce: 0,
            wallet: '598f606cd8fc24710d2ebadb1d9459bb',
            coinSpecific: {
              rootAddress: parsedBody.derivedAddress,
            },
          };
        });

      await updatedDotWallet.createAddress({
        chain: 0,
        passphrase,
      });
      nock2.isDone().should.be.true();
    });
  });

  describe('Accelerate Transaction', function () {
    it('fails if cpfpTxIds is not passed', async function () {
      await wallet.accelerateTransaction({})
        .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    });

    it('fails if cpfpTxIds is not an array', async function () {
      // @ts-expect-error checking type mismatch
      await wallet.accelerateTransaction({ cpfpTxIds: {} })
        .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    });

    it('fails if cpfpTxIds is not of length 1', async function () {
      await wallet.accelerateTransaction({ cpfpTxIds: [] })
        .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
      await wallet.accelerateTransaction({ cpfpTxIds: ['id1', 'id2'] })
        .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    });

    it('fails if cpfpFeeRate is not passed and neither is noCpfpFeeRate', async function () {
      await wallet.accelerateTransaction({ cpfpTxIds: ['id'] })
        .should.be.rejectedWith({ code: 'cpfpfeerate_not_set' });
    });

    it('fails if cpfpFeeRate is not an integer', async function () {
      // @ts-expect-error checking type mismatch
      await wallet.accelerateTransaction({ cpfpTxIds: ['id'], cpfpFeeRate: 'one' })
        .should.be.rejectedWith({ code: 'cpfpfeerate_not_nonnegative_integer' });
    });

    it('fails if cpfpFeeRate is negative', async function () {
      await wallet.accelerateTransaction({ cpfpTxIds: ['id'], cpfpFeeRate: -1 })
        .should.be.rejectedWith({ code: 'cpfpfeerate_not_nonnegative_integer' });
    });

    it('fails if maxFee is not passed and neither is noMaxFee', async function () {
      await wallet.accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true })
        .should.be.rejectedWith({ code: 'maxfee_not_set' });
    });

    it('fails if maxFee is not an integer', async function () {
      // @ts-expect-error checking type mismatch
      await wallet.accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true, maxFee: 'one' })
        .should.be.rejectedWith({ code: 'maxfee_not_nonnegative_integer' });
    });

    it('fails if maxFee is negative', async function () {
      await wallet.accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true, maxFee: -1 })
        .should.be.rejectedWith({ code: 'maxfee_not_nonnegative_integer' });
    });

    it('submits a transaction with all cpfp specific parameters', async function () {
      const params = {
        cpfpTxIds: ['id'],
        cpfpFeeRate: 1,
        maxFee: 1,
      };

      const prebuildReturn = Object.assign({ txHex: '123' }, params);
      const prebuildStub = sinon.stub(wallet, 'prebuildAndSignTransaction').resolves(prebuildReturn);

      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`;
      nock(bgUrl)
        .post(path, _.matches(prebuildReturn))
        .reply(200);

      await wallet.accelerateTransaction(params);

      prebuildStub.should.have.been.calledOnceWith(params);

      sinon.restore();
    });
  });

  describe('maxNumInputsToUse verification', function () {
    const address = '5b34252f1bf349930e34020a';
    const maxNumInputsToUse = 2;
    let basecoin;
    let wallet;

    before(async function () {
      basecoin = bitgo.coin('tbtc');
      const walletData = {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: [
          '5b3424f91bf349930e340175',
        ],
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    });


    it('should pass maxNumInputsToUse parameter when calling fanout unspents', async function () {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`;
      const response = nock(bgUrl)
        .post(path, _.matches({ maxNumInputsToUse })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      try {
        await wallet.fanoutUnspents({ address, maxNumInputsToUse });
      } catch (e) {
        // the fanoutUnspents method will probably throw an exception for not having all of the correct nocks
        // we only care about /fanoutUnspents and whether maxNumInputsToUse is an allowed parameter
      }

      response.isDone().should.be.true();
    });
  });

  describe('maxFeeRate verification', function () {
    const address = '5b34252f1bf349930e34020a';
    const recipients = [{
      address,
      amount: 0,
    }];
    const maxFeeRate = 10000;
    let basecoin;
    let wallet;

    before(async function () {
      basecoin = bitgo.coin('tbtc');
      const walletData = {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: [
          '5b3424f91bf349930e340175',
        ],
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    });

    it('should pass maxFeeRate parameter when building transactions', async function () {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`;
      const response = nock(bgUrl)
        .post(path, _.matches({ recipients, maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      try {
        await wallet.prebuildTransaction({ recipients, maxFeeRate });
      } catch (e) {
        // the prebuildTransaction method will probably throw an exception for not having all of the correct nocks
        // we only care about /tx/build and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    });

    it('should pass maxFeeRate parameter when consolidating unspents', async function () {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`;
      const response = nock(bgUrl)
        .post(path, _.matches({ maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[0]}`)
        .reply(200);

      try {
        await wallet.consolidateUnspents({ recipients, maxFeeRate });
      } catch (e) {
        // the consolidateUnspents method will probably throw an exception for not having all of the correct nocks
        // we only care about /consolidateUnspents and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    });

    it('should pass maxFeeRate parameter when calling sweep wallets', async function () {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/sweepWallet`;
      const response = nock(bgUrl)
        .post(path, _.matches({ address, maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      try {
        await wallet.sweep({ address, maxFeeRate });
      } catch (e) {
        // the sweep method will probably throw an exception for not having all of the correct nocks
        // we only care about /sweepWallet and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    });

    it('should pass maxFeeRate parameter when calling fanout unspents', async function () {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`;
      const response = nock(bgUrl)
        .post(path, _.matches({ maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      try {
        await wallet.fanoutUnspents({ address, maxFeeRate });
      } catch (e) {
        // the fanoutUnspents method will probably throw an exception for not having all of the correct nocks
        // we only care about /fanoutUnspents and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    });
  });

  describe('allowPartialSweep verification', function () {
    const address = '5b34252f1bf349930e34020a';
    const allowPartialSweep = true;
    let basecoin;
    let wallet;

    before(async function () {
      basecoin = bitgo.coin('tbtc');
      const walletData = {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['5b3424f91bf349930e340175'],
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    });

    it('should pass allowPartialSweep parameter when calling sweep wallets', async function () {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/sweepWallet`;
      const response = nock(bgUrl)
        .post(path, _.matches({ address, allowPartialSweep })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      try {
        await wallet.sweep({ address, allowPartialSweep });
      } catch (e) {
        // the sweep method will probably throw an exception for not having all of the correct nocks
        // we only care about /sweepWallet and whether allowPartialSweep is an allowed parameter
      }

      response.isDone().should.be.true();
    });
  });

  describe('Transaction prebuilds', function () {
    let ethWallet;

    before(async function () {
      const walletData = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coin: 'teth',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7',
        ],
      };
      ethWallet = new Wallet(bitgo, bitgo.coin('teth'), walletData);
    });

    it('should pass offlineVerification=true query param if passed truthy value', async function () {
      const params = { offlineVerification: true };
      const scope = nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`)
        .query(params)
        .reply(200, {});
      const blockHeight = 100;
      const blockHeightStub = sinon.stub(basecoin, 'getLatestBlockHeight').resolves(blockHeight);
      const postProcessStub = sinon.stub(basecoin, 'postProcessPrebuild').resolves({});
      await wallet.prebuildTransaction(params);
      blockHeightStub.should.have.been.calledOnce();
      postProcessStub.should.have.been.calledOnceWith({
        blockHeight: 100,
        wallet: wallet,
        buildParams: { },
      });
      scope.done();
      blockHeightStub.restore();
      postProcessStub.restore();
    });

    it('should not pass the offlineVerification query param if passed a falsey value', async function () {
      const params = { offlineVerification: false };
      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`)
        .query({})
        .reply(200, {});
      const blockHeight = 100;
      const blockHeightStub = sinon.stub(basecoin, 'getLatestBlockHeight').resolves(blockHeight);
      const postProcessStub = sinon.stub(basecoin, 'postProcessPrebuild').resolves({});
      await wallet.prebuildTransaction(params);
      blockHeightStub.should.have.been.calledOnce();
      postProcessStub.should.have.been.calledOnceWith({
        blockHeight: 100,
        wallet: wallet,
        buildParams: { },
      });
      blockHeightStub.restore();
      postProcessStub.restore();
    });

    it('prebuild should call build and getLatestBlockHeight for utxo coins', async function () {
      const params = {};
      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`)
        .query(params)
        .reply(200, {});
      const blockHeight = 100;
      const blockHeightStub = sinon.stub(basecoin, 'getLatestBlockHeight').resolves(blockHeight);
      const postProcessStub = sinon.stub(basecoin, 'postProcessPrebuild').resolves({});
      await wallet.prebuildTransaction(params);
      blockHeightStub.should.have.been.calledOnce();
      postProcessStub.should.have.been.calledOnceWith({
        blockHeight: 100,
        wallet: wallet,
        buildParams: { },
      });
      blockHeightStub.restore();
      postProcessStub.restore();
    });

    it('prebuild should call build but not getLatestBlockHeight for account coins', async function () {
      ['txrp', 'txlm', 'teth'].forEach(async function (coin) {
        const accountcoin = bitgo.coin(coin);
        const walletData = {
          id: '5b34252f1bf349930e34021a',
          coin,
          keys: [
            '5b3424f91bf349930e340175',
          ],
        };
        const accountWallet = new Wallet(bitgo, accountcoin, walletData);
        const params = {};
        nock(bgUrl)
          .post(`/api/v2/${accountWallet.coin()}/wallet/${accountWallet.id()}/tx/build`)
          .query(params)
          .reply(200, {});
        const postProcessStub = sinon.stub(accountcoin, 'postProcessPrebuild').resolves({});
        await accountWallet.prebuildTransaction(params);
        postProcessStub.should.have.been.calledOnceWith({
          wallet: accountWallet,
          buildParams: { },
        });
        postProcessStub.restore();
      });
    });

    it('should have isBatch = true in the txPrebuild if txParams has more than one recipient', async function () {

      const txParams = {
        recipients: [{ amount: '1000000000000000', address: address1 }, { amount: '1000000000000000', address: address2 }],
        walletContractAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        walletPassphrase: 'moon',
      };

      const totalAmount = '2000000000000000';

      nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`, _.matches({ recipients: txParams.recipients }))
        .reply(200, {
          recipients: [
            {
              address: '0xc0aaf2649e7b0f3950164681eca2b1a8f654a478',
              amount: '2000000000000000',
              data: '0xc00c4e9e000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000174cfd823af8ce27ed0afee3fcf3c3ba259116be0000000000000000000000007e85bdc27c050e3905ebf4b8e634d9ad6edd0de6000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000038d7ea4c68000',
            },
          ],
          nextContractSequenceId: 10896,
          gasPrice: 20000000000,
          gasLimit: 500000,
          isBatch: true,
          coin: 'teth',
        });

      const txPrebuild = await ethWallet.prebuildTransaction(txParams);
      txPrebuild.isBatch.should.equal(true);
      txPrebuild.recipients[0].address.should.equal(bitgo.coin('teth').staticsCoin.network.batcherContractAddress);
      txPrebuild.recipients[0].amount.should.equal(totalAmount);
    });

    it('should have isBatch = false and hopTransaction field should not be there in the txPrebuild  for normal eth tx', async function () {

      const txParams = {
        recipients: [{ amount: '1000000000000000', address: address1 }],
        walletContractAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        walletPassphrase: 'moon',
      };

      nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`, _.matches({ recipients: txParams.recipients }))
        .reply(200, {
          recipients: [
            {
              amount: '1000000000000000',
              address: '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be',
            },
          ],
          nextContractSequenceId: 10897,
          gasPrice: 20000000000,
          gasLimit: 500000,
          isBatch: false,
          coin: 'teth',
        });

      const txPrebuild = await ethWallet.prebuildTransaction(txParams);
      txPrebuild.isBatch.should.equal(false);
      txPrebuild.should.not.have.property('hopTransaction');
      txPrebuild.recipients[0].address.should.equal(address1);
      txPrebuild.recipients[0].amount.should.equal('1000000000000000');
    });

    it('should pass unspent reservation parameter through when building transactions', async function () {
      const reservation = {
        expireTime: '2029-08-12',
      };
      const recipients = [{
        address: 'aaa',
        amount: '1000',
      }];
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`;
      const response = nock(bgUrl)
        .post(path, _.matches({ recipients, reservation })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);
      try {
        await wallet.prebuildTransaction({ recipients, reservation });
      } catch (e) {
        // the prebuildTransaction method will probably throw an exception for not having all of the correct nocks
        // we only care about /tx/build and whether reservation is an allowed parameter
      }

      response.isDone().should.be.true();
    });
  });

  describe('Maximum Spendable', function maximumSpendable() {
    let bgUrl;

    before(async function () {
      nock.pendingMocks().should.be.empty();
      bgUrl = common.Environments[bitgo.getEnv()].uri;
    });

    it('arguments', async function () {
      const optionalParams = {
        limit: 25,
        minValue: '0',
        maxValue: '9999999999999',
        minHeight: 0,
        minConfirms: 2,
        enforceMinConfirmsForChange: false,
        feeRate: 10000,
        maxFeeRate: 100000,
        recipientAddress: '2NCUFDLiUz9CVnmdVqQe9acVonoM89e76df',
      };

      // The actual api request will only send strings, but the SDK function expects numbers for some values
      const apiParams = _.mapValues(optionalParams, param => String(param));

      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/maximumSpendable`;
      const response = nock(bgUrl)
        .get(path)
        .query(_.matches(apiParams)) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200, {
          coin: 'tbch',
          maximumSpendable: 65000,
        });

      try {
        await wallet.maximumSpendable(optionalParams);
      } catch (e) {
        // test is successful if nock is consumed
      }

      response.isDone().should.be.true();
    });
  });

  describe('Wallet Sharing', function () {
    it('should share to cold wallet without passing skipKeychain', async function () {
      const userId = '123';
      const email = 'shareto@sdktest.com';
      const permissions = 'view,spend';

      const getSharingKeyNock = nock(bgUrl)
        .post('/api/v1/user/sharingkey', { email })
        .reply(200, { userId });

      const getKeyNock = nock(bgUrl)
        .get(`/api/v2/tbtc/key/${wallet.keyIds()[0]}`)
        .reply(200, {})
        .get(`/api/v2/tbtc/key/${wallet.keyIds()[1]}`)
        .reply(200, {})
        .get(`/api/v2/tbtc/key/${wallet.keyIds()[2]}`)
        .reply(200, {});

      const createShareNock = nock(bgUrl)
        .post(`/api/v2/tbtc/wallet/${wallet.id()}/share`, { user: userId, permissions, keychain: {} })
        .reply(200, {});

      await wallet.shareWallet({ email, permissions });

      getSharingKeyNock.isDone().should.be.True();
      getKeyNock.isDone().should.be.True();
      createShareNock.isDone().should.be.True();
    });
  });

  describe('Wallet Freezing', function () {
    it('should freeze wallet for specified duration in seconds', async function () {
      const params = { duration: 60 };
      const scope =
        nock(bgUrl)
          .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/freeze`, params)
          .reply(200, {});
      await wallet.freeze(params);
      scope.isDone().should.be.True();
    });
  });
});
