//
// Tests for Wallet
//

import * as should from 'should';
import * as sinon from 'sinon';
import '../lib/asserts';
import * as nock from 'nock';
import * as _ from 'lodash';

import {
  common,
  CustomSigningFunction,
  ECDSAUtils,
  RequestTracer,
  TokenType,
  TssUtils,
  TxRequest,
  Wallet,
  SignatureShareType,
  Ecdsa,
  Keychains,
  TypedData,
  TypedMessage,
  MessageTypes,
  SignTypedDataVersion,
  GetUserPrvOptions,
  ManageUnspentsOptions,
  SignedMessage,
  BaseTssUtils,
  KeyType,
  SendManyOptions,
} from '@bitgo/sdk-core';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src';
import * as utxoLib from '@bitgo/utxo-lib';
import { randomBytes } from 'crypto';
import { getDefaultWalletKeys, toKeychainObjects } from './coins/utxo/util';
import { Tsol } from '@bitgo/sdk-coin-sol';
import { Teth } from '@bitgo/sdk-coin-eth';

import { nftResponse, unsupportedNftResponse } from '../fixtures/nfts/nftResponses';

require('should-sinon');

nock.disableNetConnect();

describe('V2 Wallet:', function () {
  const reqId = new RequestTracer();
  const bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
  bitgo.initializeTestVars();
  const basecoin: any = bitgo.coin('tbtc');
  const walletData = {
    id: '5b34252f1bf349930e34020a00000000',
    coin: 'tbtc',
    keys: ['5b3424f91bf349930e34017500000000', '5b3424f91bf349930e34017600000000', '5b3424f91bf349930e34017700000000'],
    coinSpecific: {},
    multisigType: 'onchain',
    type: 'hot',
  };
  const coldWalletData = {
    id: '65774419fb4d9690847fbe4b00000000',
    coin: 'tbtc',
    keys: ['65774412e54b7516393c9df800000000', '6577442428664ffe791af7ea00000000', '6577442b7317a945756c2fd900000000'],
    coinSpecific: {},
    multisigType: 'onchain',
    type: 'cold',
  };
  const wallet = new Wallet(bitgo, basecoin, walletData);
  const coldWallet = new Wallet(bitgo, basecoin, coldWalletData);
  const bgUrl = common.Environments[bitgo.getEnv()].uri;
  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const tbtcHotWalletDefaultParams = {
    txFormat: 'psbt',
    changeAddressType: ['p2trMusig2', 'p2wsh', 'p2shP2wsh', 'p2sh', 'p2tr'],
  };

  afterEach(function () {
    sinon.restore();
    sinon.reset();
  });

  describe('Wallet transfers', function () {
    it('should search in wallet for a transfer', async function () {
      const params = { limit: 1, searchLabel: 'test' };

      const scope = nock(bgUrl)
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
      const apiParams = _.mapValues(params, (param) => (Array.isArray(param) ? param : String(param)));

      const scope = nock(bgUrl)
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

      const scope = nock(bgUrl)
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
      await wallet
        // @ts-expect-error checking type mismatch
        .transfers({ address: 13375 })
        .should.be.rejectedWith('invalid address argument, expecting string or array');

      await wallet
        // @ts-expect-error checking type mismatch
        .transfers({ address: [null] })
        .should.be.rejectedWith('invalid address argument, expecting array of address strings');

      await wallet
        // @ts-expect-error checking type mismatch
        .transfers({ dateGte: 20101904 })
        .should.be.rejectedWith('invalid dateGte argument, expecting string');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ dateLt: 20101904 }).should.be.rejectedWith('invalid dateLt argument, expecting string');

      await wallet
        // @ts-expect-error checking type mismatch
        .transfers({ valueGte: '10230005' })
        .should.be.rejectedWith('invalid valueGte argument, expecting number');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ valueLt: '-5e8' }).should.be.rejectedWith('invalid valueLt argument, expecting number');

      await wallet
        // @ts-expect-error checking type mismatch
        .transfers({ includeHex: '123' })
        .should.be.rejectedWith('invalid includeHex argument, expecting boolean');

      await wallet
        // @ts-expect-error checking type mismatch
        .transfers({ state: 123 })
        .should.be.rejectedWith('invalid state argument, expecting string or array');

      await wallet
        // @ts-expect-error checking type mismatch
        .transfers({ state: [123, 456] })
        .should.be.rejectedWith('invalid state argument, expecting array of state strings');

      // @ts-expect-error checking type mismatch
      await wallet.transfers({ type: 123 }).should.be.rejectedWith('invalid type argument, expecting string');
    });
  });

  describe('Wallet addresses', function () {
    it('should search in wallet addresses', async function () {
      const params = { limit: 1, labelContains: 'test' };

      const scope = nock(bgUrl)
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

  describe('TETH Wallet Addresses', function () {
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

    it('search list addresses should return success', async function () {
      const params = {
        includeBalances: true,
        includeTokens: true,
        returnBalancesForToken: 'gterc6dp',
        pendingDeployment: false,
        includeTotalAddressCount: true,
      };

      const scope = nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/addresses`)
        .query(params)
        .reply(200);
      try {
        await wallet.addresses(params);
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    });

    it('should throw errors for invalid expected parameters', async function () {
      await ethWallet
        .addresses({ includeBalances: true, returnBalancesForToken: 1 })
        .should.be.rejectedWith('invalid returnBalancesForToken argument, expecting string');

      await ethWallet
        .addresses({ pendingDeployment: 1 })
        .should.be.rejectedWith('invalid pendingDeployment argument, expecting boolean');

      await ethWallet
        .addresses({ includeBalances: 1 })
        .should.be.rejectedWith('invalid includeBalances argument, expecting boolean');

      await ethWallet
        .addresses({ includeTokens: 1 })
        .should.be.rejectedWith('invalid includeTokens argument, expecting boolean');

      await ethWallet
        .addresses({ includeTotalAddressCount: 1 })
        .should.be.rejectedWith('invalid includeTotalAddressCount argument, expecting boolean');
    });

    it('get forwarder balance', async function () {
      const forwarders = [
        {
          address: '0xbfbcc0fe2b865de877134246af09378e9bc3c91d',
          balance: '200000',
        },
        {
          address: '0xe59524ed8b47165f4cb0850c9428069a6002e5eb',
          balance: '10000000000000000',
        },
      ];

      nock(bgUrl).get(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/forwarders/balances`).reply(200, {
        forwarders,
      });

      const forwarderBalance = await ethWallet.getForwarderBalance();
      forwarderBalance.forwarders[0].address.should.eql(forwarders[0].address);
      forwarderBalance.forwarders[0].balance.should.eql(forwarders[0].balance);
      forwarderBalance.forwarders[1].address.should.eql(forwarders[1].address);
      forwarderBalance.forwarders[1].balance.should.eql(forwarders[1].balance);
    });
  });

  describe('Get User Prv', () => {
    const prv =
      'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';
    const derivedPrv =
      'xprv9yoG67Td11uwjXwbV8zEmrySVXERu5FZAsLD9suBeEJbgJqANs8Yng5dEJoii7hag5JermK6PbfxgDmSzW7ewWeLmeJEkmPfmZUSLdETtHx';
    it('should use the cold derivation seed to derive the proper user private key', async () => {
      const userPrvOptions = {
        prv,
        coldDerivationSeed: '123',
      };
      wallet.getUserPrv(userPrvOptions).should.eql(derivedPrv);
    });

    it('should use the user keychain derivedFromParentWithSeed as the cold derivation seed if none is provided', async () => {
      const userPrvOptions: GetUserPrvOptions = {
        prv,
        keychain: {
          derivedFromParentWithSeed: '123',
          id: '456',
          pub: '789',
          type: 'independent',
        },
      };
      wallet.getUserPrv(userPrvOptions).should.eql(derivedPrv);
    });

    it('should prefer the explicit cold derivation seed to the user keychain derivedFromParentWithSeed', async () => {
      const userPrvOptions: GetUserPrvOptions = {
        prv,
        coldDerivationSeed: '123',
        keychain: {
          derivedFromParentWithSeed: '456',
          id: '789',
          pub: '012',
          type: 'independent',
        },
      };
      wallet.getUserPrv(userPrvOptions).should.eql(derivedPrv);
    });

    it('should return the prv provided for TSS SMC', async () => {
      const tssWalletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {},
        multisigType: 'tss',
      };
      const tsolcoin: any = bitgo.coin('tsol');
      const wallet = new Wallet(bitgo, tsolcoin, tssWalletData);
      const prv = 'longstringifiedjson';
      const keychain = {
        derivedFromParentWithSeed: 'random seed',
        id: '123',
        commonKeychain: 'longstring',
        type: 'tss' as KeyType,
      };
      const userPrvOptions = {
        prv,
        keychain,
      };
      wallet.getUserPrv(userPrvOptions).should.eql(prv);
    });
  });

  describe('UTXO Custom Signer Function', function () {
    const recipients = [
      { address: 'abc', amount: 123 },
      { address: 'def', amount: 456 },
    ];
    const rootWalletKey = getDefaultWalletKeys();
    let customSigningFunction: CustomSigningFunction;
    let stubs: sinon.SinonStub[];

    beforeEach(function () {
      customSigningFunction = sinon.stub().returns({
        txHex: 'this-is-a-tx',
      });
      stubs = [
        sinon.stub(wallet.baseCoin, 'postProcessPrebuild').returnsArg(0),
        sinon.stub(wallet.baseCoin, 'verifyTransaction').resolves(true),
        sinon.stub(wallet.baseCoin, 'signTransaction').resolves({ txHex: 'this-is-a-tx' }),
      ];
    });

    function nocks(txPrebuild: { txHex: string }) {
      return nock(bgUrl)
        .post(wallet.url('/tx/build').replace(bgUrl, ''))
        .reply(200, txPrebuild)
        .get(wallet.baseCoin.url('/public/block/latest').replace(bgUrl, ''))
        .reply(200)
        .get(wallet.baseCoin.url(`/key/${wallet.keyIds()[0]}`).replace(bgUrl, ''))
        .reply(200, { pub: 'pub' })
        .get(wallet.baseCoin.url(`/key/${wallet.keyIds()[1]}`).replace(bgUrl, ''))
        .reply(200, { pub: 'pub' })
        .get(wallet.baseCoin.url(`/key/${wallet.keyIds()[2]}`).replace(bgUrl, ''))
        .reply(200, { pub: 'pub' })
        .post(wallet.url('/tx/send').replace(bgUrl, ''))
        .reply(200, { ok: true });
    }

    it('should use a custom signing function if provided for PSBT with taprootKeyPathSpend input', async function () {
      const psbt = utxoLib.testutil.constructPsbt(
        [{ scriptType: 'taprootKeyPathSpend', value: BigInt(1000) }],
        [{ scriptType: 'p2sh', value: BigInt(900) }],
        basecoin.network,
        rootWalletKey,
        'unsigned'
      );
      const scope = nocks({ txHex: psbt.toHex() });
      const result = await wallet.sendMany({ recipients, customSigningFunction });

      result.should.have.property('ok', true);
      customSigningFunction.should.have.been.calledTwice();
      scope.done();
      stubs.forEach((s) => s.restore());
    });

    it('should use a custom signing function if provided for PSBT without taprootKeyPathSpend input', async function () {
      const psbt = utxoLib.testutil.constructPsbt(
        [{ scriptType: 'p2wsh', value: BigInt(1000) }],
        [{ scriptType: 'p2sh', value: BigInt(900) }],
        basecoin.network,
        rootWalletKey,
        'unsigned'
      );
      const scope = nocks({ txHex: psbt.toHex() });
      const result = await wallet.sendMany({ recipients, customSigningFunction });

      result.should.have.property('ok', true);
      customSigningFunction.should.have.been.calledOnce();
      scope.done();
      stubs.forEach((s) => s.restore());
    });

    it('should use a custom signing function if provided for Tx without taprootKeyPathSpend input', async function () {
      const tx = utxoLib.testutil.constructTxnBuilder(
        [{ scriptType: 'p2wsh', value: BigInt(1000) }],
        [{ scriptType: 'p2sh', value: BigInt(900) }],
        basecoin.network,
        rootWalletKey,
        'unsigned'
      );
      const scope = nocks({ txHex: tx.buildIncomplete().toHex() });
      const result = await wallet.sendMany({ recipients, customSigningFunction });

      result.should.have.property('ok', true);
      customSigningFunction.should.have.been.calledOnce();
      scope.done();
      stubs.forEach((s) => s.restore());
    });
  });

  describe('TETH Wallet Transactions', function () {
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
        multisigType: 'onchain',
      };
      ethWallet = new Wallet(bitgo, bitgo.coin('teth'), walletData);
    });

    afterEach(async function () {
      nock.cleanAll();
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

      const scope = nock(bgUrl).get(`/api/v2/${wallet.coin()}/tx/pending/first`).query(params).reply(200);
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

      const scope = nock(bgUrl).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/changeFee`, params).reply(200);

      try {
        await wallet.changeFee({ txid: '0xffffffff', fee: '10000000' });
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    });

    it('should try to change the fee correctly using eip1559', async function () {
      const params = {
        txid: '0xffffffff',
        eip1559: {
          maxPriorityFeePerGas: '1000000000',
          maxFeePerGas: '25000000000',
        },
      };

      const scope = nock(bgUrl).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/changeFee`, params).reply(200);

      try {
        await wallet.changeFee(params);
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    });

    it('should pass data parameter and amount: 0 when using sendTransaction', async function () {
      const path = `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`;
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [
        {
          address: recipientAddress,
          amount: 0,
          data: '0x00110011',
        },
      ];
      const response = nock(bgUrl)
        .post(path, _.matches({ recipients })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      const nockKeyChain = nock(bgUrl).get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[0]}`).reply(200, {});

      try {
        await ethWallet.send({
          address: recipients[0].address,
          data: recipients[0].data,
          amount: recipients[0].amount,
        });
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      response.isDone().should.be.true();
      nockKeyChain.isDone().should.be.true();
    });

    it('should pass data parameter and amount: 0 when using sendMany', async function () {
      const path = `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`;
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [
        {
          address: recipientAddress,
          amount: 0,
          data: '0x00110011',
        },
      ];
      const response = nock(bgUrl)
        .post(path, _.matches({ recipients })) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);

      const nockKeyChain = nock(bgUrl).get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[0]}`).reply(200, {});

      try {
        await ethWallet.sendMany({ recipients });
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      response.isDone().should.be.true();
      nockKeyChain.isDone().should.be.true();
    });

    it('should not pass recipients in sendMany when transaction type is fillNonce', async function () {
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [
        {
          address: recipientAddress,
          amount: 0,
        },
      ];
      const sendManyParams = { recipients, type: 'fillNonce', isTss: true, nonce: '13' };

      try {
        await ethWallet.sendMany(sendManyParams);
      } catch (e) {
        e.message.should.equal('cannot provide recipients for transaction type fillNonce');
        // test is successful if nock is consumed, HMAC errors expected
      }
    });

    it('should not pass receiveAddress in sendMany when TSS transaction type is transfer or transferToken', async function () {
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [
        {
          address: recipientAddress,
          amount: 0,
        },
      ];
      const errorMessage = 'cannot use receive address for TSS transactions of type transfer';
      const sendManyParamsReceiveAddressError = {
        receiveAddress: 'throw',
        recipients,
        type: 'transfer',
        isTss: true,
        nonce: '13',
      };
      const sendManyParams = { recipients, type: 'transfer', isTss: true, nonce: '13' };

      try {
        await ethWallet.sendMany(sendManyParamsReceiveAddressError);
      } catch (e) {
        e.message.should.equal(errorMessage);
      }

      try {
        await ethWallet.sendMany(sendManyParams);
      } catch (e) {
        e.message.should.not.equal(errorMessage);
      }
    });

    it('should throw error early if password is wrong', async function () {
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [
        {
          address: recipientAddress,
          amount: 0,
        },
      ];
      const errorMessage = `unable to decrypt keychain with the given wallet passphrase`;
      const sendManyParamsCorrectPassPhrase = {
        recipients,
        type: 'transfer',
        isTss: true,
        nonce: '13',
        walletPassphrase: TestBitGo.V2.TEST_ETH_WALLET_PASSPHRASE,
      };
      const nockKeychain = nock(bgUrl)
        .get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[0]}`)
        .times(2)
        .reply(200, {
          id: '598f606cd8fc24710d2ebad89dce86c2',
          pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
          ethAddress: '0x26a163ba9739529720c0914c583865dec0d37278',
          source: 'user',
          encryptedPrv:
            '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
          coinSpecific: {},
        });

      await ethWallet
        .sendMany({ ...sendManyParamsCorrectPassPhrase, walletPassphrase: 'wrongPassphrase' })
        .should.be.rejectedWith(errorMessage);

      try {
        const customSigningFunction = () => {
          return 'mock';
        };
        // Should not validate passphrase if custom signing function is provided
        await ethWallet.sendMany({
          ...sendManyParamsCorrectPassPhrase,
          walletPassphrase: 'wrongPassphrase',
          customSigningFunction,
        });
      } catch (e) {
        e.message.should.not.equal(errorMessage);
      }
      try {
        await ethWallet.sendMany({ ...sendManyParamsCorrectPassPhrase });
      } catch (e) {
        e.message.should.not.equal(errorMessage);
      }
      nockKeychain.isDone().should.be.true();
    });
  });

  describe('OFC Create Address', () => {
    let ofcWallet: Wallet;
    let nocks;
    before(async function () {
      const walletDataOfc = {
        id: '5b34252f1bf349930e3400b00000000',
        coin: 'ofc',
        keys: [
          '5b3424f91bf349930e34017800000000',
          '5b3424f91bf349930e34017900000000',
          '5b3424f91bf349930e34018000000000',
        ],
        coinSpecific: {},
        multisigType: 'onchain',
      };
      ofcWallet = new Wallet(bitgo, bitgo.coin('ofc'), walletDataOfc);
    });

    beforeEach(async function () {
      nocks = [
        nock(bgUrl).get(`/api/v2/ofc/key/${ofcWallet.keyIds()[0]}`).reply(200, {
          id: ofcWallet.keyIds()[0],
          pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
          source: 'user',
          encryptedPrv:
            '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
          coinSpecific: {},
        }),

        nock(bgUrl).get(`/api/v2/ofc/key/${ofcWallet.keyIds()[1]}`).reply(200, {
          id: ofcWallet.keyIds()[1],
          pub: 'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
          source: 'backup',
          coinSpecific: {},
        }),

        nock(bgUrl).get(`/api/v2/ofc/key/${ofcWallet.keyIds()[2]}`).reply(200, {
          id: ofcWallet.keyIds()[2],
          pub: 'xpub661MyMwAqRbcFsXShW8R3hJsHNTYTUwzcejnLkY7KCtaJbDqcGkcBF99BrEJSjNZHeHveiYUrsAdwnjUMGwpgmEbiKcZWRuVA9HxnRaA3r3',
          source: 'bitgo',
          coinSpecific: {},
        }),
      ];
    });

    afterEach(async function () {
      nock.cleanAll();
      nocks.forEach((scope) => scope.isDone().should.be.true());
    });

    it('should correctly validate arguments to create address on OFC wallet', async function () {
      await ofcWallet.createAddress().should.be.rejectedWith('onToken is a mandatory parameter for OFC wallets');
      // @ts-expect-error test passing invalid number argument
      await ofcWallet.createAddress({ onToken: 42 }).should.be.rejectedWith('onToken has to be a string');
    });

    it('address creation with valid onToken argument succeeds', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/ofc/wallet/${ofcWallet.id()}/address`, { onToken: 'ofctbtc' })
        .reply(200, {
          id: '638a48c6c3dba40007a3497fa49a080c',
          address: 'generated address',
          chain: 0,
          index: 1,
          coin: 'tbtc',
          wallet: ofcWallet.id,
        });
      const address = await ofcWallet.createAddress({ onToken: 'ofctbtc' });
      address.address.should.equal('generated address');
      scope.isDone().should.be.true();
    });
  });

  describe('TETH Create Address', () => {
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

    beforeEach(async function () {
      ethWallet = new Wallet(bitgo, bitgo.coin('teth'), walletData);
      nocks = [
        nock(bgUrl).get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[0]}`).reply(200, {
          id: '598f606cd8fc24710d2ebad89dce86c2',
          pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
          ethAddress: '0x26a163ba9739529720c0914c583865dec0d37278',
          source: 'user',
          encryptedPrv:
            '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
          coinSpecific: {},
        }),

        nock(bgUrl).get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[1]}`).reply(200, {
          id: '598f606cc8e43aef09fcb785221d9dd2',
          pub: 'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
          ethAddress: '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91',
          source: 'backup',
          coinSpecific: {},
        }),

        nock(bgUrl).get(`/api/v2/${ethWallet.coin()}/key/${ethWallet.keyIds()[2]}`).reply(200, {
          id: '5935d59cf660764331bafcade1855fd7',
          pub: 'xpub661MyMwAqRbcFsXShW8R3hJsHNTYTUwzcejnLkY7KCtaJbDqcGkcBF99BrEJSjNZHeHveiYUrsAdwnjUMGwpgmEbiKcZWRuVA9HxnRaA3r3',
          ethAddress: '0x032821b7ea40ea5d446f47c29a0f777ee035aa10',
          source: 'bitgo',
          coinSpecific: {},
        }),
      ];
    });

    afterEach(async function () {
      nock.cleanAll();
      nocks.forEach((scope) => scope.isDone().should.be.true());
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

      message = 'forwarderVersion has to be an integer 0, 1, 2, 3 or 4';
      await wallet.createAddress({ forwarderVersion: 5 }).should.be.rejectedWith(message);
      await wallet.createAddress({ forwarderVersion: -1 }).should.be.rejectedWith(message);
    });

    it('address creation with forwarder version 3 succeeds', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 3 })
        .reply(200, {
          id: '638a48c6c3dba40007a3497fa49a080c',
          address: '0x5e61b64f38f1b5f85078fb84b27394830b4c8e80',
          chain: 0,
          index: 1,
          coin: 'tpolygon',
          lastNonce: 0,
          wallet: '63785f95af7c760007cfae068c2f31ae',
          coinSpecific: {
            nonce: -1,
            updateTime: '2022-12-02T18:49:42.348Z',
            txCount: 0,
            pendingChainInitialization: false,
            creationFailure: [],
            salt: '0x1',
            pendingDeployment: true,
            forwarderVersion: 3,
            isTss: true,
          },
        });
      const address = await ethWallet.createAddress({ chain: 0, forwarderVersion: 3 });
      address.coinSpecific.forwarderVersion.should.equal(3);
      scope.isDone().should.be.true();
    });

    it('address creation with forwarder version 3 fails due invalid address', async function () {
      const address = '0x5e61b6'; // invalid address
      nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 3 })
        .reply(200, {
          id: '638a48c6c3dba40007a3497fa49a080c',
          address: address,
          chain: 0,
          index: 1,
          coin: 'tpolygon',
          lastNonce: 0,
          wallet: '63785f95af7c760007cfae068c2f31ae',
          coinSpecific: {
            nonce: -1,
            updateTime: '2022-12-02T18:49:42.348Z',
            txCount: 0,
            pendingChainInitialization: false,
            creationFailure: [],
            salt: '0x1',
            pendingDeployment: true,
            forwarderVersion: 3,
            isTss: true,
          },
        });
      await ethWallet
        .createAddress({ chain: 0, forwarderVersion: 3 })
        .should.be.rejectedWith(`invalid address: ${address}`);
    });

    it('address creation with forwarder version 2 succeeds', async function () {
      const scope = nock(bgUrl)
        .post(`/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/address`, { chain: 0, forwarderVersion: 2 })
        .reply(200, {
          id: '638a48c6c3dba40007a3497fa49a080c',
          address: '0x5e61b64f38f1b5f85078fb84b27394830b4c8e80',
          chain: 0,
          index: 1,
          coin: 'tpolygon',
          lastNonce: 0,
          wallet: '63785f95af7c760007cfae068c2f31ae',
          coinSpecific: {
            nonce: -1,
            updateTime: '2022-12-02T18:49:42.348Z',
            txCount: 0,
            pendingChainInitialization: true,
            creationFailure: [],
            salt: '0x1',
            pendingDeployment: true,
            forwarderVersion: 2,
            isTss: true,
          },
        });
      const address = await ethWallet.createAddress({ chain: 0, forwarderVersion: 2 });
      address.coinSpecific.forwarderVersion.should.equal(2);
      scope.isDone().should.be.true();
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
      await ethWallet
        .createAddress({ chain: 0, forwarderVersion: 1 })
        .should.be.rejectedWith(
          'address validation failure: expected 0x32a226cda14e352a47bf4b1658648d8037736f80 but got 0x8c13cd0bb198858f628d5631ba4b2293fc08df49'
        );
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
      await ethWallet
        .createAddress({ chain: 0, forwarderVersion: 1, baseAddress: 'asgf' })
        .should.be.rejectedWith('invalid base address');
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
      await ethWallet
        .createAddress({ chain: 0, forwarderVersion: 1, baseAddress: '0x8c13cd0bb198858f628d5631ba4b2293fc08df49' })
        .should.be.rejectedWith(
          'address validation failure: expected 0x36748926007790e7ee416c6485b32e00cfb177a3 but got 0x32a226cda14e352a47bf4b1658648d8037736f80'
        );
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
      await ethWallet
        .createAddress({ chain: 0, forwarderVersion: 0, allowSkipVerifyAddress: false })
        .should.be.rejectedWith('address verification skipped for count = 1');
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
      const newAddress = await ethWallet.createAddress({
        chain: 0,
        forwarderVersion: 1,
        allowSkipVerifyAddress: false,
      });
      newAddress.index.should.equal(3179);
      scope.isDone().should.be.true();
    });
  });

  describe('Algorand tests', () => {
    let algoWallet: Wallet;

    before(async () => {
      // This is not a real TALGO wallet
      const walletData = {
        id: '650204cf43d8b40007cd9e11a872ce65',
        coin: 'talgo',
        keys: [
          '650204b78a75c90007790bce979ae34d',
          '650204b766c56a00072956c08fb9cdf1',
          '650204b8ccf1370007b32bb8155dfbec',
        ],
        coinSpecific: {
          rootAddress: '2ULRGE64U7LTMT5M6REB7ORHX5GLJYWHTIV5EAXVLWQTTATVJDGM5KJMII',
        },
      };
      algoWallet = new Wallet(bitgo, bitgo.coin('talgo'), walletData);
    });

    it('Should build token enablement transactions', async () => {
      const params = {
        enableTokens: [
          {
            name: 'talgo:USDt-180447',
          },
        ],
      };
      const txRequestNock = nock(bgUrl)
        .post(`/api/v2/${algoWallet.coin()}/wallet/${algoWallet.id()}/tx/build`)
        .reply((uri, body) => {
          const params = body as any;
          params.recipients.length.should.equal(1);
          params.recipients[0].tokenName.should.equal('talgo:USDt-180447');
          params.type.should.equal('enabletoken');
          should.not.exist(params.enableTokens);
          return [200, params];
        });
      await algoWallet.buildTokenEnablements(params);
      txRequestNock.isDone().should.equal(true);
    });

    afterEach(() => {
      nock.cleanAll();
    });
  });

  describe('Hedera tests', () => {
    let hbarWallet: Wallet;

    before(async () => {
      // This is not a real THBAR wallet
      const walletData = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coin: 'thbar',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7',
        ],
        coinSpecific: {
          baseAddress: '0.0.47841511',
        },
      };
      hbarWallet = new Wallet(bitgo, bitgo.coin('thbar'), walletData);
    });

    it('Should build token enablement transactions', async () => {
      const params = {
        enableTokens: [
          {
            name: 'thbar:usdc',
          },
        ],
      };
      const txRequestNock = nock(bgUrl)
        .post(`/api/v2/${hbarWallet.coin()}/wallet/${hbarWallet.id()}/tx/build`)
        .reply((uri, body) => {
          const params = body as any;
          params.recipients.length.should.equal(1);
          params.recipients[0].tokenName.should.equal('thbar:usdc');
          params.type.should.equal('enabletoken');
          should.not.exist(params.enableTokens);
          return [200, params];
        });
      await hbarWallet.buildTokenEnablements(params);
      txRequestNock.isDone().should.equal(true);
    });

    afterEach(() => {
      nock.cleanAll();
    });
  });

  describe('Solana tests: ', () => {
    let solWallet: Wallet;
    const passphrase = '#Bondiola1234';
    const solBitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    solBitgo.initializeTestVars();
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
      multisigType: 'tss',
    };

    before(async function () {
      solWallet = new Wallet(bitgo, bitgo.coin('tsol'), walletData);
      nock(bgUrl).get(`/api/v2/${solWallet.coin()}/key/${solWallet.keyIds()[0]}`).times(3).reply(200, {
        id: '598f606cd8fc24710d2ebad89dce86c2',
        pub: '5f8WmC2uW9SAk7LMX2r4G1Bx8MMwx8sdgpotyHGodiZo',
        source: 'user',
        encryptedPrv:
          '{"iv":"hNK3rg82P1T94MaueXFAbA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"cV4wU4EzPjs=","ct":"9VZX99Ztsb6p75Cxl2lrcXBplmssIAQ9k7ZA81vdDYG4N5dZ36BQNWVfDoelj9O31XyJ+Xri0XKIWUzl0KKLfUERplmtNoOCn5ifJcZwCrOxpHZQe3AJ700o8Wmsrk5H"}',
        coinSpecific: {},
      });

      nock(bgUrl).get(`/api/v2/${solWallet.coin()}/key/${solWallet.keyIds()[1]}`).times(2).reply(200, {
        id: '598f606cc8e43aef09fcb785221d9dd2',
        pub: 'G1s43JTzNZzqhUn4aNpwgcc6wb9FUsZQD5JjffG6isyd',
        encryptedPrv:
          '{"iv":"UFrt/QlIUR1XeQafPBaAlw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"7VPBYaJXPm8=","ct":"ajFKv2y8yaIBXQ39sAbBWcnbiEEzbjS4AoQtp5cXYqjeDRxt3aCxemPm22pnkJaCijFjJrMHbkmsNhNYzHg5aHFukN+nEAVssyNwHbzlhSnm8/BVN50yAdAAtWreh8cp"}',
        source: 'backup',
        coinSpecific: {},
      });

      nock(bgUrl).get(`/api/v2/${solWallet.coin()}/key/${solWallet.keyIds()[2]}`).times(2).reply(200, {
        id: '5935d59cf660764331bafcade1855fd7',
        pub: 'GH1LV1e9FdqGe8U2c8PMEcma3fDeh1ktcGVBrD3AuFqx',
        encryptedPrv:
          '{"iv":"iIuWOHIOErEDdiJn6g46mg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Rzh7RRJksj0=","ct":"rcNICUfp9FakT53l+adB6XKzS1vNTc0Qq9jAtqnxA+ScssiS4Q0l3sgG/0gDy5DaZKtXryKBDUvGsi7b/fYaFCUpAoZn/VZTOhOUN/mo7ZHb4OhOXL29YPPkiryAq9Cr"}',
        source: 'bitgo',
        coinSpecific: {},
      });
    });

    after(async function () {
      nock.cleanAll();
    });

    describe('prebuildAndSignTransaction: ', function () {
      // TODO (STLX-15018): fix test
      xit('should successfully sign a consolidation transfer', async function () {
        const txParams = {
          prebuildTx: {
            walletId: walletData.id,
            txHex:
              'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIE9MWWV2ct01mg5Gm4EqcJ9SAn2XuD+FuAHcHFTkc1Tgut3DgTsiSgTQ0dmzj5JJg6qYTpn8FxOYPFCFTMoZi46gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUpTWpkpIQZNJOhxYNo4fHw1td28kruB5B+oQEEFRI0Qc+q0Zg6OOpV8eCDVLfYziox7YBA7+QPLX4IRhDCSKwICAgABDAIAAACghgEAAAAAAAMAFVRlc3QgaW50ZWdyYXRpb24gbWVtbw==',
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

    it('Should build token enablement transactions correctly', async function () {
      const params = {
        enableTokens: [{ name: 'tsol:usdc' }, { name: 'tsol:srm' }, { name: 'tsol:gmt' }],
      };
      const txRequestNock = nock(bgUrl)
        .post(`/api/v2/wallet/${solWallet.id()}/txrequests`)
        .reply((url, body) => {
          const bodyParams = body as any;
          bodyParams.intent.intentType.should.equal('enableToken');
          bodyParams.intent.recipients.length.should.equal(0);
          bodyParams.intent.enableTokens.should.deepEqual(params.enableTokens);
          return [
            200,
            {
              apiVersion: 'full',
              transactions: [
                {
                  unsignedTx: {
                    serializedTxHex: 'fake transaction',
                    feeInfo: 'fake fee info',
                  },
                },
              ],
            },
          ];
        });
      await solWallet.buildTokenEnablements(params);
      txRequestNock.isDone().should.equal(true);
    });
  });

  describe('Accelerate Transaction', function () {
    it('fails if acceleration ids are not passed', async function () {
      await wallet.accelerateTransaction({}).should.be.rejectedWith({ code: 'cpfptxids_or_rbftxids_required' });
    });

    it('fails if cpfpTxIds is not an array', async function () {
      // @ts-expect-error checking type mismatch
      await wallet.accelerateTransaction({ cpfpTxIds: {} }).should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    });

    it('fails if cpfpTxIds is not of length 1', async function () {
      await wallet.accelerateTransaction({ cpfpTxIds: [] }).should.be.rejectedWith({ code: 'cpfptxids_not_array' });
      await wallet
        .accelerateTransaction({ cpfpTxIds: ['id1', 'id2'] })
        .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    });

    it('fails if cpfpFeeRate is not passed and neither is noCpfpFeeRate', async function () {
      await wallet.accelerateTransaction({ cpfpTxIds: ['id'] }).should.be.rejectedWith({ code: 'cpfpfeerate_not_set' });
    });

    it('fails if cpfpFeeRate is not an integer', async function () {
      await wallet
        // @ts-expect-error checking type mismatch
        .accelerateTransaction({ cpfpTxIds: ['id'], cpfpFeeRate: 'one' })
        .should.be.rejectedWith({ code: 'cpfpfeerate_not_nonnegative_integer' });
    });

    it('fails if cpfpFeeRate is negative', async function () {
      await wallet
        .accelerateTransaction({ cpfpTxIds: ['id'], cpfpFeeRate: -1 })
        .should.be.rejectedWith({ code: 'cpfpfeerate_not_nonnegative_integer' });
    });

    it('fails if maxFee is not passed and neither is noMaxFee', async function () {
      await wallet
        .accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true })
        .should.be.rejectedWith({ code: 'maxfee_not_set' });
    });

    it('fails if maxFee is not an integer', async function () {
      await wallet
        // @ts-expect-error checking type mismatch
        .accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true, maxFee: 'one' })
        .should.be.rejectedWith({ code: 'maxfee_not_nonnegative_integer' });
    });

    it('fails if maxFee is negative', async function () {
      await wallet
        .accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true, maxFee: -1 })
        .should.be.rejectedWith({ code: 'maxfee_not_nonnegative_integer' });
    });

    it('fails if both rbfTxids and cpfpTxids is set', async function () {
      await wallet
        .accelerateTransaction({ cpfpTxIds: ['id1'], rbfTxIds: ['id2'] })
        .should.be.rejectedWith({ code: 'cannot_specify_both_cpfp_and_rbf_txids' });
    });

    it('fails if rbfTxIds is set but feeMultiplier is missing', async function () {
      await wallet
        .accelerateTransaction({ rbfTxIds: ['id'] })
        .should.be.rejectedWith({ code: 'feemultiplier_not_set' });
    });

    it('fails if fee multiplier is less than or equal to 1', async function () {
      await wallet
        .accelerateTransaction({ rbfTxIds: ['id'], feeMultiplier: 1 })
        .should.be.rejectedWith({ code: 'feemultiplier_greater_than_one' });

      await wallet
        .accelerateTransaction({ rbfTxIds: ['id2'], feeMultiplier: 0.5 })
        .should.be.rejectedWith({ code: 'feemultiplier_greater_than_one' });
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
      nock(bgUrl).post(path, _.matches(prebuildReturn)).reply(200);

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
        keys: ['5b3424f91bf349930e340175'],
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

  describe('manage unspents', function () {
    let rootWalletKey;
    let walletPassphrase;
    let basecoin;
    let wallet;
    let keysObj;

    before(async function () {
      rootWalletKey = getDefaultWalletKeys();
      walletPassphrase = 'fixthemoneyfixtheworld';
      keysObj = toKeychainObjects(rootWalletKey, walletPassphrase);
      basecoin = bitgo.coin('tbtc');
      const walletData = {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: keysObj.map((k) => k.id),
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    });

    it('should pass for bulk consolidating unspents', async function () {
      const psbts = (['p2wsh', 'p2shP2wsh'] as const).map((scriptType) =>
        utxoLib.testutil.constructPsbt(
          [{ scriptType, value: BigInt(1000) }],
          [{ scriptType, value: BigInt(900) }],
          basecoin.network,
          rootWalletKey,
          'unsigned'
        )
      );
      const txHexes = psbts.map((psbt) => ({ txHex: psbt.toHex() }));

      const nocks: nock.Scope[] = [];
      nocks.push(
        nock(bgUrl).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`).reply(200, txHexes)
      );

      nocks.push(
        ...keysObj.map((k, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[i]}`).reply(200, k))
      );

      nocks.push(
        ...psbts.map((psbt) =>
          nock(bgUrl)
            .post(
              `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`,
              _.matches({ txHex: psbt.signAllInputsHD(rootWalletKey.user).toHex() })
            )
            .reply(200)
        )
      );

      await wallet.consolidateUnspents({ bulk: true, walletPassphrase });

      nocks.forEach((n) => {
        n.isDone().should.be.true();
      });
    });

    it('should pass for single consolidating unspents', async function () {
      const psbt = utxoLib.testutil.constructPsbt(
        [{ scriptType: 'p2wsh', value: BigInt(1000) }],
        [{ scriptType: 'p2shP2wsh', value: BigInt(900) }],
        basecoin.network,
        rootWalletKey,
        'unsigned'
      );

      const nocks: nock.Scope[] = [];
      nocks.push(
        nock(bgUrl)
          .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`)
          .reply(200, { txHex: psbt.toHex() })
      );

      nocks.push(
        ...keysObj.map((k, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[i]}`).reply(200, k))
      );

      nocks.push(
        nock(bgUrl)
          .post(
            `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`,
            _.matches({ txHex: psbt.signAllInputsHD(rootWalletKey.user).toHex() })
          )
          .reply(200)
      );

      await wallet.consolidateUnspents({ walletPassphrase });

      nocks.forEach((n) => {
        n.isDone().should.be.true();
      });
    });
  });

  describe('maxFeeRate verification', function () {
    const address = '5b34252f1bf349930e34020a';
    const recipients = [
      {
        address,
        amount: 0,
      },
    ];
    const maxFeeRate = 10000;
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

      nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[0]}`).reply(200);

      try {
        await wallet.consolidateUnspents({ recipients, maxFeeRate });
      } catch (e) {
        // the consolidateUnspents method will probably throw an exception for not having all of the correct nocks
        // we only care about /consolidateUnspents and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    });

    it('should only build tx (not sign/send) while consolidating unspents', async function () {
      const toBeUsedNock = nock(bgUrl);
      toBeUsedNock.post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`).reply(200);

      const unusedNocks = nock(bgUrl);
      unusedNocks.get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[0]}`).reply(200);
      unusedNocks.post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`).reply(200);

      await wallet.consolidateUnspents({ recipients }, ManageUnspentsOptions.BUILD_ONLY);

      toBeUsedNock.isDone().should.be.true();
      unusedNocks.pendingMocks().length.should.eql(2);
      nock.cleanAll();
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

    it('should return reqId if it was passed in the params', async function () {
      const params = { offlineVerification: true };
      const scope = nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`, tbtcHotWalletDefaultParams)
        .query(params)
        .reply(200, {});
      const blockHeight = 100;
      sinon.stub(basecoin, 'getLatestBlockHeight').resolves(blockHeight);
      sinon.stub(basecoin, 'postProcessPrebuild').resolves({});
      const txRequest = await wallet.prebuildTransaction({ ...params, reqId: reqId });
      txRequest.reqId?.should.containEql(reqId);
      scope.done();
    });

    it('should pass offlineVerification=true query param if passed truthy value', async function () {
      const params = { offlineVerification: true };
      const scope = nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`, tbtcHotWalletDefaultParams)
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
        buildParams: tbtcHotWalletDefaultParams,
      });
      scope.done();
      blockHeightStub.restore();
      postProcessStub.restore();
    });

    it('should not pass the offlineVerification query param if passed a falsey value', async function () {
      const params = { offlineVerification: false };
      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`, tbtcHotWalletDefaultParams)
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
        buildParams: tbtcHotWalletDefaultParams,
      });
      blockHeightStub.restore();
      postProcessStub.restore();
    });

    it('prebuild should call build and getLatestBlockHeight for utxo coins', async function () {
      const params = {};
      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`, tbtcHotWalletDefaultParams)
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
        buildParams: tbtcHotWalletDefaultParams,
      });
      blockHeightStub.restore();
      postProcessStub.restore();
    });

    it('prebuild should not have changeAddressType array in post body when changeAddressType is defined', async function () {
      const expectedBuildPostBodyParams = {
        changeAddressType: 'p2trMusig2',
        txFormat: 'psbt',
      };

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`, expectedBuildPostBodyParams)
        .query({})
        .reply(200, {});
      const blockHeight = 100;
      const blockHeightStub = sinon.stub(basecoin, 'getLatestBlockHeight').resolves(blockHeight);
      const postProcessStub = sinon.stub(basecoin, 'postProcessPrebuild').resolves({});
      await wallet.prebuildTransaction({ changeAddressType: 'p2trMusig2' });
      blockHeightStub.should.have.been.calledOnce();
      postProcessStub.should.have.been.calledOnceWith({
        blockHeight: 100,
        wallet: wallet,
        buildParams: expectedBuildPostBodyParams,
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
          keys: ['5b3424f91bf349930e340175'],
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
          buildParams: {},
        });
        postProcessStub.restore();
      });
    });

    it('should have isBatch = true in the txPrebuild if txParams has more than one recipient', async function () {
      const txParams = {
        recipients: [
          { amount: '1000000000000000', address: address1 },
          { amount: '1000000000000000', address: address2 },
        ],
        walletContractAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        walletPassphrase: 'moon',
      };

      const totalAmount = '2000000000000000';

      nock(bgUrl)
        .post(
          `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`,
          _.matches({ recipients: txParams.recipients })
        )
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
      txPrebuild.recipients[0].address.should.equal(
        (bitgo.coin('teth') as any).staticsCoin.network.batcherContractAddress
      );
      txPrebuild.recipients[0].amount.should.equal(totalAmount);
    });

    it('should have isBatch = false and hopTransaction field should not be there in the txPrebuild  for normal eth tx', async function () {
      const txParams = {
        recipients: [{ amount: '1000000000000000', address: address1 }],
        walletContractAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        walletPassphrase: 'moon',
      };

      nock(bgUrl)
        .post(
          `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`,
          _.matches({ recipients: txParams.recipients })
        )
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
      const recipients = [
        {
          address: 'aaa',
          amount: '1000',
        },
      ];
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

    it('should pass gas limit parameter through when building transaction for sui', async function () {
      const params = { gasLimit: 100 };
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`;
      const response = nock(bgUrl)
        .post(path, _.matches(params)) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200);
      try {
        await wallet.prebuildTransaction(params);
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
      const apiParams = _.mapValues(optionalParams, (param) => String(param));

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

      const getSharingKeyNock = nock(bgUrl).post('/api/v1/user/sharingkey', { email }).reply(200, { userId });

      const getKeyNock = nock(bgUrl)
        .get(`/api/v2/tbtc/key/${coldWallet.keyIds()[0]}`)
        .reply(200, {})
        .get(`/api/v2/tbtc/key/${coldWallet.keyIds()[1]}`)
        .reply(200, {})
        .get(`/api/v2/tbtc/key/${coldWallet.keyIds()[2]}`)
        .reply(200, {});

      const createShareNock = nock(bgUrl)
        .post(`/api/v2/tbtc/wallet/${coldWallet.id()}/share`, {
          user: userId,
          permissions,
          skipKeychain: true,
        })
        .reply(200, {});

      await coldWallet.shareWallet({ email, permissions });

      getSharingKeyNock.isDone().should.be.True();
      getKeyNock.isDone().should.be.True();
      createShareNock.isDone().should.be.True();
    });

    it('should use keychain pub to share hot wallet', async function () {
      const userId = '123';
      const email = 'shareto@sdktest.com';
      const permissions = 'view,spend';
      const toKeychain = utxoLib.bip32.fromSeed(Buffer.from('deadbeef02deadbeef02deadbeef02deadbeef02', 'hex'));
      const path = 'm/999999/1/1';
      const pubkey = toKeychain.derivePath(path).publicKey.toString('hex');
      const walletPassphrase = 'bitgo1234';

      const getSharingKeyNock = nock(bgUrl)
        .post('/api/v1/user/sharingkey', { email })
        .reply(200, { userId, pubkey, path });

      const pub = 'Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk';
      const getKeyNock = nock(bgUrl)
        .get(`/api/v2/tbtc/key/${wallet.keyIds()[0]}`)
        .reply(200, {
          id: wallet.keyIds()[0],
          pub,
          source: 'user',
          encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: walletPassphrase }),
          coinSpecific: {},
        });

      const stub = sinon.stub(wallet, 'createShare').callsFake(async (options) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        options!.keychain!.pub!.should.not.be.undefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        options!.keychain!.pub!.should.equal(pub);
        return undefined;
      });
      await wallet.shareWallet({ email, permissions, walletPassphrase });

      stub.calledOnce.should.be.true();
      getSharingKeyNock.isDone().should.be.True();
      getKeyNock.isDone().should.be.True();
    });

    it('should provide skipKeychain to wallet share api for hot wallet', async function () {
      const userId = '123';
      const email = 'shareto@sdktest.com';
      const permissions = 'view,spend';
      const toKeychain = utxoLib.bip32.fromSeed(Buffer.from('deadbeef02deadbeef02deadbeef02deadbeef02', 'hex'));
      const path = 'm/999999/1/1';
      const pubkey = toKeychain.derivePath(path).publicKey.toString('hex');

      const getSharingKeyNock = nock(bgUrl)
        .post('/api/v1/user/sharingkey', { email })
        .reply(200, { userId, pubkey, path });
      const createShareNock = nock(bgUrl)
        .post(`/api/v2/tbtc/wallet/${wallet.id()}/share`, {
          user: userId,
          permissions,
          skipKeychain: true,
        })
        .reply(200, {});

      await wallet.shareWallet({ email, permissions, skipKeychain: true });

      createShareNock.isDone().should.be.True();
      getSharingKeyNock.isDone().should.be.True();
    });

    it('should decrypt webauthn encryptedPrv for wallet share (spend)', async function () {
      const userId = '123';
      const email = 'shareto@sdktest.com';
      const permissions = 'view,spend';
      const toKeychain = utxoLib.bip32.fromSeed(Buffer.from('deadbeef02deadbeef02deadbeef02deadbeef02', 'hex'));
      const path = 'm/999999/1/1';
      const pubkey = toKeychain.derivePath(path).publicKey.toString('hex');
      const privateKey = 'xprv1';
      const walletPassphrase1 = 'bitgo1234';
      const walletPassphrase2 = 'bitgo5678';

      const getSharingKeyNock = nock(bgUrl)
        .post('/api/v1/user/sharingkey', { email })
        .reply(200, { userId, pubkey, path });

      const pub = 'Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk';
      const getKeyNock = nock(bgUrl)
        .get(`/api/v2/tbtc/key/${wallet.keyIds()[0]}`)
        .reply(200, {
          id: wallet.keyIds()[0],
          pub,
          source: 'user',
          encryptedPrv: bitgo.encrypt({ input: privateKey, password: walletPassphrase1 }),
          webauthnDevices: [
            {
              otpDeviceId: '123',
              authenticatorInfo: {
                credID: 'credID',
                fmt: 'packed',
                publicKey: 'some value',
              },
              prfSalt: '456',
              encryptedPrv: bitgo.encrypt({ input: privateKey, password: walletPassphrase2 }),
            },
          ],
          coinSpecific: {},
        });

      const stub = sinon.stub(wallet, 'createShare').callsFake(async (options) => {
        options!.keychain!.encryptedPrv!.should.not.be.undefined();
        return undefined;
      });
      await wallet.shareWallet({ email, permissions, walletPassphrase: walletPassphrase2 });
      stub.calledOnce.should.be.true();
      getSharingKeyNock.isDone().should.be.True();
      getKeyNock.isDone().should.be.True();
    });
  });

  describe('Wallet Freezing', function () {
    it('should freeze wallet for specified duration in seconds', async function () {
      const params = { duration: 60 };
      const scope = nock(bgUrl).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/freeze`, params).reply(200, {});
      await wallet.freeze(params);
      scope.isDone().should.be.True();
    });
  });

  describe('TSS Wallets', function () {
    const sandbox = sinon.createSandbox();
    const tsol = bitgo.coin('tsol');
    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: 'tsol',
      keys: [
        '598f606cd8fc24710d2ebad89dce86c2',
        '598f606cc8e43aef09fcb785221d9dd2',
        '5935d59cf660764331bafcade1855fd7',
      ],
      coinSpecific: {},
      multisigType: 'tss',
    };

    const ethWalletData = {
      id: '598f606cd8fc24710d2ebadb1d9459bb',
      coin: 'teth',
      keys: [
        '598f606cd8fc24710d2ebad89dce86c2',
        '598f606cc8e43aef09fcb785221d9dd2',
        '5935d59cf660764331bafcade1855fd7',
      ],
      multisigType: 'tss',
      coinSpecific: { addressVersion: 1 },
      type: 'hot',
    };

    const polygonWalletData = {
      id: '632826520ee1e5000729017354acaeab',
      coin: 'tpolygon',
      keys: [
        '598f606cd8fc24710d2ebad89dce86c2',
        '598f606cc8e43aef09fcb785221d9dd2',
        '5935d59cf660764331bafcade1855fd7',
      ],
      multisigType: 'tss',
    };

    const tssSolWallet = new Wallet(bitgo, tsol, walletData);

    let tssEthWallet = new Wallet(bitgo, bitgo.coin('teth'), ethWalletData);
    const tssPolygonWallet = new Wallet(bitgo, bitgo.coin('tpolygon'), polygonWalletData);
    const custodialTssSolWallet = new Wallet(bitgo, tsol, {
      ...walletData,
      type: 'custodial',
    });

    const txRequest: TxRequest = {
      txRequestId: 'id',
      transactions: [],
      intent: {
        intentType: 'payment',
      },
      date: new Date().toISOString(),
      latest: true,
      state: 'pendingUserSignature',
      userId: 'userId',
      walletType: 'hot',
      policiesChecked: false,
      version: 1,
      walletId: 'walletId',
      unsignedTxs: [
        {
          serializedTxHex: 'ababcdcd',
          signableHex: 'deadbeef',
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
          derivationPath: 'm/0',
        },
      ],
    };

    const txRequestFull: TxRequest = {
      txRequestId: 'id',
      intent: {
        intentType: 'payment',
      },
      date: new Date().toISOString(),
      latest: true,
      state: 'pendingUserSignature',
      userId: 'userId',
      walletId: 'walletId',
      signatureShares: [],
      version: 1,
      policiesChecked: false,
      walletType: 'hot',
      transactions: [
        {
          state: 'pendingSignature',
          unsignedTx: {
            serializedTxHex: 'ababcdcd',
            signableHex: 'deadbeef',
            feeInfo: {
              fee: 5000,
              feeString: '5000',
            },
            derivationPath: 'm/0',
          },
          signatureShares: [],
          commitmentShares: [],
        },
      ],
      unsignedTxs: [],
      apiVersion: 'full',
    };

    afterEach(function () {
      sandbox.verifyAndRestore();
    });

    describe('preBuildAndSignTransaction', async function () {
      const params = {
        walletPassphrase: 'passphrase12345',
        prebuildTx: { walletId: tssEthWallet.id(), txRequestId: 'randomId' },
        type: 'transfer',
      };

      ['eddsa', 'ecdsa'].forEach((keyCurvve: string) => {
        describe(keyCurvve, () => {
          const wallet = keyCurvve === 'eddsa' ? tssSolWallet : tssEthWallet;

          beforeEach(function () {
            sandbox
              .stub(Keychains.prototype, 'getKeysForSigning')
              .resolves([{ commonKeychain: 'test', id: '', pub: '', type: 'independent' }]);
            if (keyCurvve === 'eddsa') {
              sandbox.stub(Tsol.prototype, 'verifyTransaction').resolves(true);
            } else {
              sandbox.stub(Teth.prototype, 'verifyTransaction').resolves(true);
            }
          });

          afterEach(function () {
            sandbox.verifyAndRestore();
          });

          it('it should succeed but not sign if the txRequest is pending approval', async function () {
            const getTxRequestStub = sandbox.stub(BaseTssUtils.default.prototype, 'getTxRequest').resolves({
              ...txRequestFull,
              state: 'pendingApproval',
            });

            const signTransactionSpy = sandbox.spy(Wallet.prototype, 'signTransaction');

            const result = (await wallet.prebuildAndSignTransaction(params)) as TxRequest;
            result.should.have.property('state');
            result.state.should.equal('pendingApproval');
            getTxRequestStub.calledOnce.should.be.true();
            signTransactionSpy.notCalled.should.be.true();
          });

          it('it should succeed and sign if the txRequest is not pending approval', async function () {
            const getTxRequestStub = sandbox.stub(BaseTssUtils.default.prototype, 'getTxRequest');
            getTxRequestStub.resolves(txRequestFull);

            const signTransactionStub = sandbox.stub(Wallet.prototype, 'signTransaction');
            signTransactionStub.resolves({ ...txRequestFull, state: 'signed' });

            const result = (await wallet.prebuildAndSignTransaction(params)) as TxRequest;
            result.should.have.property('state');
            result.state.should.equal('signed');
            getTxRequestStub.calledOnce.should.be.true();
            signTransactionStub.calledOnce.should.be.true();
          });
        });
      });
    });

    describe('Transaction prebuilds', function () {
      it('should build a single recipient transfer transaction', async function () {
        const recipients = [
          {
            address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
            amount: '1000',
          },
        ];

        const prebuildTxWithIntent = sandbox.stub(TssUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequest);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke prebuildTransaction
        prebuildTxWithIntent.calledOnceWithExactly({
          reqId,
          recipients,
          intentType: 'payment',
        });

        const txPrebuild = await tssSolWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'transfer',
        });

        txPrebuild.should.deepEqual({
          walletId: tssSolWallet.id(),
          wallet: tssSolWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
          buildParams: {
            recipients,
            type: 'transfer',
          },
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
        });
      });

      it('should build a single recipient transfer with pending approval id if transaction is having one', async function () {
        const recipients = [
          {
            address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
            amount: '1000',
          },
        ];

        const prebuildTxWithIntent = sandbox.stub(TssUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves({ ...txRequest, state: 'pendingApproval', pendingApprovalId: 'some-id' });
        prebuildTxWithIntent.calledOnceWithExactly({
          reqId,
          recipients,
          intentType: 'payment',
        });

        const txPrebuild = await custodialTssSolWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'transfer',
        });

        txPrebuild.should.deepEqual({
          walletId: custodialTssSolWallet.id(),
          wallet: custodialTssSolWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
          pendingApprovalId: 'some-id',
          buildParams: {
            recipients,
            type: 'transfer',
          },
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
        });
      });

      it('should build a multiple recipient transfer transaction with memo', async function () {
        const recipients = [
          {
            address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
            amount: '1000',
          },
          {
            address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
            amount: '2000',
          },
        ];

        const prebuildTxWithIntent = sandbox.stub(TssUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequest);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke prebuildTransaction
        prebuildTxWithIntent.calledOnceWithExactly({
          reqId,
          recipients,
          intentType: 'payment',
          memo: {
            type: 'type',
            value: 'test memo',
          },
        });

        const txPrebuild = await tssSolWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'transfer',
          memo: {
            type: 'type',
            value: 'test memo',
          },
        });

        txPrebuild.should.deepEqual({
          walletId: tssSolWallet.id(),
          wallet: tssSolWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
          buildParams: {
            recipients,
            memo: {
              type: 'type',
              value: 'test memo',
            },
            type: 'transfer',
          },
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
        });
      });

      it('should build an enable token transaction', async function () {
        const recipients = [];
        const tokenName = 'tcoin:tokenName';
        const prebuildTxWithIntent = sandbox.stub(TssUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequest);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke prebuildTransaction
        prebuildTxWithIntent.calledOnceWithExactly({
          reqId,
          recipients,
          intentType: 'createAccount',
          memo: {
            type: 'type',
            value: 'test memo',
          },
          tokenName,
        });

        const txPrebuild = await tssSolWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'enabletoken',
          memo: {
            type: 'type',
            value: 'test memo',
          },
          tokenName,
        });

        txPrebuild.should.deepEqual({
          walletId: tssSolWallet.id(),
          wallet: tssSolWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
          buildParams: {
            recipients,
            memo: {
              type: 'type',
              value: 'test memo',
            },
            type: 'enabletoken',
            tokenName,
          },
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
        });
      });

      it('should fail for non-transfer transaction types', async function () {
        await tssSolWallet
          .prebuildTransaction({
            reqId,
            recipients: [
              {
                address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
                amount: '1000',
              },
            ],
            type: 'stake',
          })
          .should.be.rejectedWith('transaction type not supported: stake');
      });

      it('should fail for full api version compatibility', async function () {
        await custodialTssSolWallet
          .prebuildTransaction({
            reqId,
            apiVersion: 'lite',
            recipients: [
              {
                address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
                amount: '1000',
              },
            ],
            type: 'transfer',
          })
          .should.be.rejectedWith(`Custodial and ECDSA MPC algorithm must always use 'full' api version`);
      });

      it('should build a single recipient transfer transaction for full', async function () {
        const recipients = [
          {
            address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
            amount: '1000',
          },
        ];

        const prebuildTxWithIntent = sandbox.stub(TssUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke prebuildTransaction
        prebuildTxWithIntent.calledOnceWithExactly(
          {
            reqId,
            recipients,
            intentType: 'payment',
          },
          'full'
        );

        const txPrebuild = await custodialTssSolWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'transfer',
        });

        txPrebuild.should.deepEqual({
          walletId: tssSolWallet.id(),
          wallet: custodialTssSolWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
          buildParams: {
            recipients,
            type: 'transfer',
          },
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
        });
      });

      it('should call prebuildTxWithIntent with the correct params for eth transfers', async function () {
        const recipients = [
          {
            address: '0xAB100912e133AA06cEB921459aaDdBd62381F5A3',
            amount: '1000',
          },
        ];

        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };

        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);

        await tssEthWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'transfer',
          feeOptions,
        });

        sinon.assert.calledOnce(prebuildTxWithIntent);
        const args = prebuildTxWithIntent.args[0];
        args[0]!.recipients!.should.deepEqual(recipients);
        args[0]!.feeOptions!.should.deepEqual(feeOptions);
        args[0]!.intentType.should.equal('payment');
        args[1]!.should.equal('full');
      });

      it('should call prebuildTxWithIntent with the correct params for eth transfertokens', async function () {
        const recipients = [
          {
            address: '0xAB100912e133AA06cEB921459aaDdBd62381F5A3',
            amount: '1000',
            tokenName: 'gterc18dp',
          },
        ];

        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };

        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);

        await tssEthWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'transfertoken',
          isTss: true,
          feeOptions,
        });

        sinon.assert.calledOnce(prebuildTxWithIntent);
        const args = prebuildTxWithIntent.args[0];
        args[0]!.recipients!.should.deepEqual(recipients);
        args[0]!.feeOptions!.should.deepEqual(feeOptions);
        args[0]!.isTss!.should.equal(true);
        args[0]!.intentType.should.equal('transferToken');
        args[1]!.should.equal('full');
      });

      it('should call prebuildTxWithIntent with the correct params for eth accelerations', async function () {
        const recipients = [
          {
            address: '0xAB100912e133AA06cEB921459aaDdBd62381F5A3',
            amount: '1000',
            tokenName: 'gterc18dp',
          },
        ];

        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };

        const lowFeeTxid = '0x6ea07f9420f4676be6478ab1660eb92444a7c663e0e24bece929f715e882e0cf';

        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);

        await tssEthWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'acceleration',
          feeOptions,
          lowFeeTxid,
        });

        sinon.assert.calledOnce(prebuildTxWithIntent);
        const args = prebuildTxWithIntent.args[0];
        args[0]!.should.not.have.property('recipients');
        args[0]!.feeOptions!.should.deepEqual(feeOptions);
        args[0]!.lowFeeTxid!.should.equal(lowFeeTxid);
        args[0]!.intentType.should.equal('acceleration');
        args[1]!.should.equal('full');
      });

      it('should call prebuildTxWithIntent with the correct params for eth accelerations for receive address', async function () {
        const recipients = [
          {
            address: '0xAB100912e133AA06cEB921459aaDdBd62381F5A3',
            amount: '1000',
            tokenName: 'gterc18dp',
          },
        ];

        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };

        const lowFeeTxid = '0x6ea07f9420f4676be6478ab1660eb92444a7c663e0e24bece929f715e882e0cf';
        const receiveAddress = '0x062176bc9345da3e8ee90361b0cf6ff883ba7206';

        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);

        await tssEthWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'acceleration',
          feeOptions,
          lowFeeTxid,
          receiveAddress,
        });

        sinon.assert.calledOnce(prebuildTxWithIntent);
        const args = prebuildTxWithIntent.args[0];
        args[0]!.should.not.have.property('recipients');
        args[0]!.feeOptions!.should.deepEqual(feeOptions);
        args[0]!.lowFeeTxid!.should.equal(lowFeeTxid);
        args[0]!.receiveAddress!.should.equal(receiveAddress);
        args[0]!.intentType.should.equal('acceleration');
        args[1]!.should.equal('full');
      });

      it('should call prebuildTxWithIntent with the correct params for eth fillNonce', async function () {
        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };

        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);

        const nonce = '1';
        const comment = 'fillNonce comment';

        await tssEthWallet.prebuildTransaction({
          reqId,
          type: 'fillNonce',
          feeOptions,
          nonce,
          comment,
        });

        sinon.assert.calledOnce(prebuildTxWithIntent);
        const args = prebuildTxWithIntent.args[0];
        args[0]!.should.not.have.property('recipients');
        args[0]!.feeOptions!.should.deepEqual(feeOptions);
        args[0]!.nonce!.should.equal(nonce);
        args[0]!.intentType.should.equal('fillNonce');
        args[0]!.comment!.should.equal(comment);
        args[1]!.should.equal('full');
      });

      it('should call prebuildTxWithIntent with the correct params for eth fillNonce for receive address nonce filling tx', async function () {
        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };

        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);

        const nonce = '1';
        const comment = 'fillNonce comment';
        const receiveAddress = '0x062176bc9345da3e8ee90361b0cf6ff883ba7206';

        await tssEthWallet.prebuildTransaction({
          reqId,
          type: 'fillNonce',
          feeOptions,
          nonce,
          receiveAddress,
          comment,
        });

        sinon.assert.calledOnce(prebuildTxWithIntent);
        const args = prebuildTxWithIntent.args[0];
        args[0]!.should.not.have.property('recipients');
        args[0]!.feeOptions!.should.deepEqual(feeOptions);
        args[0]!.nonce!.should.equal(nonce);
        args[0]!.intentType.should.equal('fillNonce');
        args[0]!.comment!.should.equal(comment);
        args[0]!.receiveAddress!.should.equal(receiveAddress);
        args[1]!.should.equal('full');
      });

      it('should call prebuildTxWithIntent with the correct feeOptions when passing using the legacy format', async function () {
        const recipients = [
          {
            address: '0xAB100912e133AA06cEB921459aaDdBd62381F5A3',
            amount: '1000',
          },
        ];

        const expectedFeeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
          gasLimit: undefined,
        };

        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);

        await tssEthWallet.prebuildTransaction({
          reqId,
          recipients,
          type: 'transfer',
          eip1559: {
            maxFeePerGas: expectedFeeOptions.maxFeePerGas.toString(),
            maxPriorityFeePerGas: expectedFeeOptions.maxPriorityFeePerGas.toString(),
          },
        });

        sinon.assert.calledOnce(prebuildTxWithIntent);
        const args = prebuildTxWithIntent.args[0];
        args[0]!.feeOptions!.should.deepEqual(expectedFeeOptions);
      });

      it('populate intent should return valid eth acceleration intent', async function () {
        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('hteth'));

        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };
        const lowFeeTxid = '0x6ea07f9420f4676be6478ab1660eb92444a7c663e0e24bece929f715e882e0cf';

        const intent = mpcUtils.populateIntent(bitgo.coin('hteth'), {
          reqId,
          intentType: 'acceleration',
          lowFeeTxid,
          feeOptions,
        });

        intent.should.have.property('recipients', undefined);
        intent.feeOptions!.should.deepEqual(feeOptions);
        intent.txid!.should.equal(lowFeeTxid);
        intent.intentType.should.equal('acceleration');
      });

      it('populate intent should return valid eth acceleration intent for receive address', async function () {
        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('hteth'));

        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };
        const lowFeeTxid = '0x6ea07f9420f4676be6478ab1660eb92444a7c663e0e24bece929f715e882e0cf';
        const receiveAddress = '0x062176bc9345da3e8ee90361b0cf6ff883ba7206';

        const intent = mpcUtils.populateIntent(bitgo.coin('hteth'), {
          reqId,
          intentType: 'acceleration',
          lowFeeTxid,
          receiveAddress,
          feeOptions,
        });

        intent.should.have.property('recipients', undefined);
        intent.feeOptions!.should.deepEqual(feeOptions);
        intent.txid!.should.equal(lowFeeTxid);
        intent.receiveAddress!.should.equal(receiveAddress);
        intent.intentType.should.equal('acceleration');
      });

      it('populate intent should return valid eth fillNonce intent', async function () {
        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('hteth'));
        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };
        const nonce = '1';

        const intent = mpcUtils.populateIntent(bitgo.coin('hteth'), {
          reqId,
          intentType: 'fillNonce',
          nonce,
          feeOptions,
        });

        intent.should.have.property('recipients', undefined);
        intent.feeOptions!.should.deepEqual(feeOptions);
        intent.nonce!.should.equal(nonce);
        intent.intentType.should.equal('fillNonce');
      });

      it('populate intent should return valid eth fillNonce intent for receive address nonce filling tx', async function () {
        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('hteth'));
        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };
        const nonce = '1';
        const receiveAddress = '0x062176bc9345da3e8ee90361b0cf6ff883ba7206';

        const intent = mpcUtils.populateIntent(bitgo.coin('hteth'), {
          reqId,
          intentType: 'fillNonce',
          nonce,
          receiveAddress,
          feeOptions,
        });

        intent.should.have.property('recipients', undefined);
        intent.feeOptions!.should.deepEqual(feeOptions);
        intent.nonce!.should.equal(nonce);
        intent.receiveAddress!.should.equal(receiveAddress);
        intent.intentType.should.equal('fillNonce');
      });

      it('should populate intent with custodianTransactionId', async function () {
        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('hteth'));
        const feeOptions = {
          maxFeePerGas: 3000000000,
          maxPriorityFeePerGas: 2000000000,
        };
        const nonce = '1';

        const intent = mpcUtils.populateIntent(bitgo.coin('hteth'), {
          custodianTransactionId: 'unittest',
          reqId,
          intentType: 'fillNonce',
          nonce,
          feeOptions,
          isTss: true,
        });

        intent.custodianTransactionId!.should.equal('unittest');
        intent.should.have.property('recipients', undefined);
        intent.feeOptions!.should.deepEqual(feeOptions);
        intent.nonce!.should.equal(nonce);
        intent.isTss!.should.equal(true);
        intent.intentType.should.equal('fillNonce');
      });

      it('should build a single recipient transfer transaction providing apiVersion parameter as "full" ', async function () {
        const recipients = [
          {
            address: '6DadkZcx9JZgeQUDbHh12cmqCpaqehmVxv6sGy49jrah',
            amount: '1000',
          },
        ];

        const prebuildTxWithIntent = sandbox.stub(TssUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFull);
        prebuildTxWithIntent.calledOnceWithExactly(
          {
            reqId,
            recipients,
            intentType: 'payment',
          },
          'full'
        );

        const txPrebuild = await custodialTssSolWallet.prebuildTransaction({
          reqId,
          apiVersion: 'full',
          recipients,
          type: 'transfer',
        });

        txPrebuild.should.deepEqual({
          walletId: tssSolWallet.id(),
          wallet: custodialTssSolWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
          buildParams: {
            apiVersion: 'full',
            recipients,
            type: 'transfer',
          },
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
        });
      });
    });

    describe('Transaction signing', function () {
      it('should sign transaction', async function () {
        const signTxRequest = sandbox.stub(TssUtils.prototype, 'signTxRequest');
        signTxRequest.resolves(txRequest);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke signTransaction
        signTxRequest.calledOnceWithExactly({ txRequest, prv: 'secretKey', reqId });

        const txPrebuild = {
          walletId: tssSolWallet.id(),
          wallet: tssSolWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
        };
        const signedTransaction = await tssSolWallet.signTransaction({
          reqId,
          txPrebuild,
          prv: 'sercretKey',
        });
        signedTransaction.should.deepEqual({
          txRequestId: txRequest.txRequestId,
        });
      });

      it('should fail to sign transaction without txRequestId', async function () {
        const txPrebuild = {
          walletId: tssSolWallet.id(),
          wallet: tssSolWallet,
          txHex: 'ababcdcd',
        };
        await tssSolWallet
          .signTransaction({
            reqId,
            txPrebuild,
            prv: 'sercretKey',
          })
          .should.be.rejectedWith('txRequestId required to sign transactions with TSS');
      });
    });

    describe('getUserKeyAndSignTssTransaction', function () {
      ['eddsa', 'ecdsa'].forEach((keyCurve: string) => {
        describe(keyCurve, () => {
          const wallet = keyCurve === 'eddsa' ? tssSolWallet : tssEthWallet;
          let getKeysStub: sinon.SinonStub;
          let signTransactionStub: sinon.SinonStub;
          beforeEach(function () {
            getKeysStub = sandbox.stub(Keychains.prototype, 'getKeysForSigning');

            signTransactionStub = sandbox
              .stub(Wallet.prototype, 'signTransaction')
              .resolves({ ...txRequestFull, state: 'signed' });
          });

          afterEach(function () {
            sandbox.verifyAndRestore();
          });
          it('should sign transaction', async function () {
            getKeysStub.resolves([
              {
                commonKeychain: 'test',
                id: '',
                pub: '',
                type: 'tss',
                encryptedPrv:
                  '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
              },
            ]);
            const params = {
              walletPassphrase: TestBitGo.V2.TEST_ETH_WALLET_PASSPHRASE as string,
              txRequestId: 'id',
            };

            const response = await wallet.getUserKeyAndSignTssTransaction(params);
            response.should.deepEqual({ ...txRequestFull, state: 'signed' });

            getKeysStub.calledOnce.should.be.true();
            signTransactionStub.calledOnce.should.be.true();
          });

          it('should throw if the keychain doesnt have the encryptedKey', async function () {
            getKeysStub.resolves([{ commonKeychain: 'test', id: '', pub: '', type: 'tss' }]);
            const params = {
              walletPassphrase: TestBitGo.V2.TEST_ETH_WALLET_PASSPHRASE as string,
              txRequestId: 'id',
            };

            await wallet
              .getUserKeyAndSignTssTransaction(params)
              .should.be.rejectedWith('the user keychain does not have property encryptedPrv');

            getKeysStub.calledOnce.should.be.true();
            signTransactionStub.notCalled.should.be.true();
          });

          it('should throw if password is invalid', async function () {
            getKeysStub.resolves([
              {
                commonKeychain: 'test',
                id: '',
                pub: '',
                type: 'tss',
                encryptedPrv:
                  '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
              },
            ]);
            const params = {
              walletPassphrase: 'randompass',
              txRequestId: 'id',
            };

            await wallet
              .getUserKeyAndSignTssTransaction(params)
              .should.be.rejectedWith(`unable to decrypt keychain with the given wallet passphrase`);

            getKeysStub.calledOnce.should.be.true();
            signTransactionStub.notCalled.should.be.true();
          });
        });
      });
    });

    describe('Message Signing', function () {
      const txHash = '0xrrrsss1b';
      const txRequestForMessageSigning: TxRequest = {
        txRequestId: reqId.toString(),
        transactions: [],
        intent: {
          intentType: 'signMessage',
        },
        date: new Date().toISOString(),
        latest: true,
        state: 'pendingUserSignature',
        userId: 'userId',
        walletType: 'hot',
        policiesChecked: false,
        version: 1,
        walletId: 'walletId',
        unsignedTxs: [],
        unsignedMessages: [],
        messages: [
          {
            state: 'signed',
            signatureShares: [{ from: SignatureShareType.USER, to: SignatureShareType.USER, share: '' }],
            combineSigShare: '0:rrr:sss:3',
            txHash,
          },
        ],
      };
      let signTxRequestForMessage;
      const messageSigningCoins = ['teth', 'tpolygon'];
      const messageRaw = 'test';
      const expected: SignedMessage = { txRequestId: reqId.toString(), txHash, messageRaw, coin: 'teth' };

      beforeEach(async function () {
        signTxRequestForMessage = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'signTxRequestForMessage');
        signTxRequestForMessage.resolves(txRequestForMessageSigning);
        sandbox
          .stub(Keychains.prototype, 'getKeysForSigning')
          .resolves([{ commonKeychain: 'test', id: '', pub: '', type: 'independent' }]);
        sinon.stub(Ecdsa.prototype, 'verify').resolves(true);
      });

      afterEach(async function () {
        sinon.restore();
        nock.cleanAll();
      });

      it('should throw error for unsupported coins', async function () {
        await tssSolWallet
          .signMessage({
            reqId,
            message: { messageRaw },
            prv: 'secretKey',
          })
          .should.be.rejectedWith('Message signing not supported for Testnet Solana');
      });

      messageSigningCoins.map((coinName) => {
        const expectedWithCoinField = { ...expected, coin: 'teth' };

        tssEthWallet = new Wallet(bitgo, bitgo.coin(coinName), ethWalletData);
        const txRequestId = txRequestForMessageSigning.txRequestId;

        it('should sign message', async function () {
          const signMessageTssSpy = sinon.spy(tssEthWallet, 'signMessageTss' as any);
          nock(bgUrl)
            .get(
              `/api/v2/wallet/${tssEthWallet.id()}/txrequests?txRequestIds=${
                txRequestForMessageSigning.txRequestId
              }&latest=true`
            )
            .reply(200, { txRequests: [txRequestForMessageSigning] });

          const signMessage = await tssEthWallet.signMessage({
            reqId,
            message: { messageRaw, txRequestId },
            prv: 'secretKey',
          });
          signMessage.should.deepEqual(expectedWithCoinField);
          const actualArg = signMessageTssSpy.getCalls()[0].args[0];
          actualArg.message.messageEncoded.should.equal(
            `\u0019Ethereum Signed Message:\n${messageRaw.length}${messageRaw}`
          );
        });

        it('should sign message when custodianMessageId is provided', async function () {
          const signMessageTssSpy = sinon.spy(tssEthWallet, 'signMessageTss' as any);
          nock(bgUrl).post(`/api/v2/wallet/${tssEthWallet.id()}/txrequests`).reply(200, txRequestForMessageSigning);

          const signMessage = await tssEthWallet.signMessage({
            custodianMessageId: 'unittest',
            reqId,
            message: { messageRaw },
            prv: 'secretKey',
          });
          signMessage.should.deepEqual(expectedWithCoinField);
          const actualArg = signMessageTssSpy.getCalls()[0].args[0];
          actualArg.message.messageEncoded.should.equal(
            `\u0019Ethereum Signed Message:\n${messageRaw.length}${messageRaw}`
          );
        });

        it('should sign message when txRequestId not provided', async function () {
          const signMessageTssSpy = sinon.spy(tssEthWallet, 'signMessageTss' as any);
          nock(bgUrl).post(`/api/v2/wallet/${tssEthWallet.id()}/txrequests`).reply(200, txRequestForMessageSigning);

          const signMessage = await tssEthWallet.signMessage({
            reqId,
            message: { messageRaw },
            prv: 'secretKey',
          });
          signMessage.should.deepEqual(expectedWithCoinField);
          const actualArg = signMessageTssSpy.getCalls()[0].args[0];
          actualArg.message.messageEncoded.should.equal(
            `\u0019Ethereum Signed Message:\n${messageRaw.length}${messageRaw}`
          );
        });

        it('should fail to sign message with empty prv', async function () {
          await tssEthWallet
            .signMessage({
              reqId,
              message: { messageRaw, txRequestId },
              prv: '',
            })
            .should.be.rejectedWith('keychain does not have property encryptedPrv');
        });
      });
    });

    describe('Typed Data Signing', function () {
      const txHash =
        '1901493fbf2ae1c27c3ced26a89070c6ab5d3fbf37ed778de9378e7703b7d1f116b3883077a61826129b98b622e54fc68c5008d1b1c16552e1eda6916f870d719220';
      const txRequestForTypedDataSigning: TxRequest = {
        txRequestId: reqId.toString(),
        transactions: [],
        intent: {
          intentType: 'signMessage',
        },
        date: new Date().toISOString(),
        latest: true,
        state: 'pendingUserSignature',
        userId: 'userId',
        walletType: 'hot',
        policiesChecked: false,
        version: 1,
        walletId: 'walletId',
        unsignedTxs: [],
        unsignedMessages: [],
        messages: [
          {
            state: 'signed',
            signatureShares: [{ from: SignatureShareType.USER, to: SignatureShareType.USER, share: '' }],
            combineSigShare: '0:rrr:sss:3',
            txHash,
          },
        ],
      };
      let signTxRequestForMessage;
      const messageSigningCoins = ['teth', 'tpolygon'];
      const types: MessageTypes = {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
        ],
        Message: [{ name: 'data', type: 'string' }],
      };
      const typedMessage: TypedMessage<MessageTypes> = {
        domain: {
          name: 'bitgo',
          version: '1',
          chainId: 1,
          verifyingContract: '0x0000000000000000000000000000000000000000',
        },
        primaryType: 'Message',
        types,
        message: { data: 'bitgo says hello!' },
      };
      const typedDataBase: TypedData = {
        typedDataRaw: JSON.stringify(typedMessage),
        version: SignTypedDataVersion.V3,
      };

      beforeEach(async function () {
        signTxRequestForMessage = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'signTxRequestForMessage');
        signTxRequestForMessage.resolves(txRequestForTypedDataSigning);
        sandbox
          .stub(Keychains.prototype, 'getKeysForSigning')
          .resolves([{ commonKeychain: 'test', id: '', pub: '', type: 'independent' }]);
        sinon.stub(Ecdsa.prototype, 'verify').resolves(true);
      });

      afterEach(async function () {
        sinon.restore();
        nock.cleanAll();
      });

      it('should throw error for unsupported coins', async function () {
        await tssSolWallet
          .signTypedData({
            reqId,
            typedData: typedDataBase,
            prv: 'secretKey',
          })
          .should.be.rejectedWith('Sign typed data not supported for Testnet Solana');
      });

      it('should throw error for sign typed data V1', async function () {
        const typedData = { ...typedDataBase };
        typedData.version = SignTypedDataVersion.V1;
        nock(bgUrl)
          .get(
            `/api/v2/wallet/${tssEthWallet.id()}/txrequests?txRequestIds=${
              txRequestForTypedDataSigning.txRequestId
            }&latest=true`
          )
          .reply(200, { txRequests: [txRequestForTypedDataSigning] });

        await tssEthWallet
          .signTypedData({
            reqId,
            typedData,
            prv: 'secretKey',
          })
          .should.be.rejectedWith('SignTypedData v1 is not supported due to security concerns');
      });
      messageSigningCoins.map((coinName) => {
        tssEthWallet = new Wallet(bitgo, bitgo.coin(coinName), ethWalletData);
        const txRequestId = txRequestForTypedDataSigning.txRequestId;
        typedDataBase.txRequestId = txRequestId;
        const expected: SignedMessage = { txRequestId, messageRaw: JSON.stringify(typedMessage), txHash, coin: 'teth' };

        describe(`sign typed data V3 for ${coinName}`, async function () {
          const typedData = { ...typedDataBase };
          typedData.version = SignTypedDataVersion.V3;

          it('should sign typed data V3', async function () {
            const signTypedDataTssSpy = sinon.spy(tssEthWallet, 'signTypedDataTss' as any);
            nock(bgUrl)
              .get(
                `/api/v2/wallet/${tssEthWallet.id()}/txrequests?txRequestIds=${
                  txRequestForTypedDataSigning.txRequestId
                }&latest=true`
              )
              .reply(200, { txRequests: [txRequestForTypedDataSigning] });

            const signedTypedData = await tssEthWallet.signTypedData({
              reqId,
              typedData,
              prv: 'secretKey',
            });
            signedTypedData.should.deepEqual(expected);
            const actualArg = signTypedDataTssSpy.getCalls()[0].args[0];
            actualArg.typedData.typedDataEncoded.toString('hex').should.equal(txHash);
          });

          it('should sign typed data V3 when custodianMessageID is provided', async function () {
            typedData.txRequestId = txRequestId;
            const signTypedDataTssSpy = sinon.spy(tssEthWallet, 'signTypedDataTss' as any);
            nock(bgUrl)
              .get(
                `/api/v2/wallet/${tssEthWallet.id()}/txrequests?txRequestIds=${
                  txRequestForTypedDataSigning.txRequestId
                }&latest=true`
              )
              .reply(200, { txRequests: [txRequestForTypedDataSigning] });

            const signedTypedData = await tssEthWallet.signTypedData({
              custodianMessageId: 'unittest',
              reqId,
              typedData,
              prv: 'secretKey',
            });
            signedTypedData.should.deepEqual(expected);
            const actualArg = signTypedDataTssSpy.getCalls()[0].args[0];
            actualArg.typedData.typedDataEncoded.toString('hex').should.equal(txHash);
          });

          it('should fail to sign typed data V3 with empty prv', async function () {
            await tssEthWallet
              .signTypedData({
                reqId,
                typedData: typedDataBase,
                prv: '',
              })
              .should.be.rejectedWith('keychain does not have property encryptedPrv');
          });

          it('should sign typed data V3 when txRequestId not provided ', async function () {
            delete typedData.txRequestId;
            const signedTypedDataTssSpy = sinon.spy(tssEthWallet, 'signTypedDataTss' as any);
            nock(bgUrl).post(`/api/v2/wallet/${tssEthWallet.id()}/txrequests`).reply(200, txRequestForTypedDataSigning);

            const signedTypedData = await tssEthWallet.signTypedData({
              reqId,
              typedData,
              prv: 'secretKey',
            });
            signedTypedData.should.deepEqual(expected);
            const actualArg = signedTypedDataTssSpy.getCalls()[0].args[0];
            actualArg.typedData.typedDataEncoded.toString('hex').should.equal(txHash);
          });
        });

        describe(`sign typed data V4 for ${coinName}`, async function () {
          const typedData = { ...typedDataBase };
          typedData.version = SignTypedDataVersion.V4;
          it('should sign typed data V4', async function () {
            typedData.txRequestId = txRequestId;
            nock(bgUrl)
              .get(
                `/api/v2/wallet/${tssEthWallet.id()}/txrequests?txRequestIds=${
                  txRequestForTypedDataSigning.txRequestId
                }&latest=true`
              )
              .reply(200, { txRequests: [txRequestForTypedDataSigning] });

            const signedTypedData = await tssEthWallet.signTypedData({
              reqId,
              typedData,
              prv: 'secretKey',
            });
            signedTypedData.should.deepEqual(expected);
          });

          it('should sign typed data V4 when custodianMessageID is provided', async function () {
            typedData.txRequestId = txRequestId;
            nock(bgUrl)
              .get(
                `/api/v2/wallet/${tssEthWallet.id()}/txrequests?txRequestIds=${
                  txRequestForTypedDataSigning.txRequestId
                }&latest=true`
              )
              .reply(200, { txRequests: [txRequestForTypedDataSigning] });

            const signedTypedData = await tssEthWallet.signTypedData({
              custodianMessageId: 'unittest',
              reqId,
              typedData,
              prv: 'secretKey',
            });
            signedTypedData.should.deepEqual(expected);
          });

          it('should fail to sign typed data V4 with empty prv', async function () {
            await tssEthWallet
              .signTypedData({
                reqId,
                typedData: typedDataBase,
                prv: '',
              })
              .should.be.rejectedWith('keychain does not have property encryptedPrv');
          });

          it('should sign typed data V4 when txRequestId not provided ', async function () {
            delete typedData.txRequestId;
            const signedTypedDataTssSpy = sinon.spy(tssEthWallet, 'signTypedDataTss' as any);
            nock(bgUrl).post(`/api/v2/wallet/${tssEthWallet.id()}/txrequests`).reply(200, txRequestForTypedDataSigning);

            const signedTypedData = await tssEthWallet.signTypedData({
              reqId,
              typedData,
              prv: 'secretKey',
            });
            signedTypedData.should.deepEqual(expected);
            const actualArg = signedTypedDataTssSpy.getCalls()[0].args[0];
            actualArg.typedData.typedDataEncoded.toString('hex').should.equal(txHash);
          });
        });
      });
    });

    describe('Send Many', function () {
      const sendManyInput = {
        type: 'transfer',
        recipients: [
          {
            address: 'address',
            amount: '1000',
          },
        ],
        reqId: new RequestTracer(),
      };

      afterEach(function () {
        nock.cleanAll();
      });

      it('should send many', async function () {
        const signedTransaction = {
          txRequestId: 'txRequestId',
        };

        const prebuildAndSignTransaction = sandbox.stub(tssSolWallet, 'prebuildAndSignTransaction');
        prebuildAndSignTransaction.resolves(signedTransaction);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke sendMany
        prebuildAndSignTransaction.calledOnceWithExactly(sendManyInput);

        const sendTxRequest = sandbox.stub(TssUtils.prototype, 'sendTxRequest');
        sendTxRequest.resolves('sendTxResponse');
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke sendMany
        sendTxRequest.calledOnceWithExactly(signedTransaction.txRequestId);

        const sendMany = await tssSolWallet.sendMany(sendManyInput);
        sendMany.should.deepEqual('sendTxResponse');
      });

      it('should send many and call setRequestTracer', async function () {
        const signedTransaction = {
          txRequestId: 'txRequestId',
        };

        const prebuildAndSignTransaction = sandbox.stub(tssSolWallet, 'prebuildAndSignTransaction');
        prebuildAndSignTransaction.resolves(signedTransaction);
        prebuildAndSignTransaction.calledOnceWithExactly(sendManyInput);

        const sendTxRequest = sandbox.stub(TssUtils.prototype, 'sendTxRequest');
        sendTxRequest.resolves('sendTxResponse');
        sendTxRequest.calledOnceWithExactly(signedTransaction.txRequestId);

        const setRequestTracerSpy = sinon.spy(bitgo, 'setRequestTracer');
        setRequestTracerSpy.withArgs(sendManyInput.reqId);

        const sendMany = await tssSolWallet.sendMany(sendManyInput);
        sendMany.should.deepEqual('sendTxResponse');
        sinon.assert.calledOnce(setRequestTracerSpy);
        setRequestTracerSpy.restore();
      });

      it('should return transfer from sendMany for apiVersion=full', async function () {
        const wallet = new Wallet(bitgo, tsol, {
          ...walletData,
          type: 'custodial',
        });
        const signedTxResult = {
          txRequestId: 'txRequestId',
        };
        const txRequest: TxRequest = {
          date: new Date().toString(),
          intent: 'payment',
          latest: false,
          policiesChecked: false,
          state: 'delivered',
          unsignedTxs: [],
          userId: 'unit-test',
          version: 0,
          walletId: wallet.id(),
          walletType: wallet.type() ?? 'hot',
          txRequestId: signedTxResult.txRequestId,
          transactions: [
            {
              state: 'delivered',
              signedTx: {
                id: 'txid',
                tx: 'tx',
              },
              unsignedTx: 'something' as any,
              signatureShares: [],
            },
          ],
        };
        const transfer = {
          id: 'transferId',
          state: 'signed',
          txid: 'txid',
        };

        const prebuildAndSignTransaction = sandbox.stub(wallet, 'prebuildAndSignTransaction').resolves(signedTxResult);

        const txRequestNock = nock(bgUrl)
          .persist()
          .get(`/api/v2/wallet/${walletData.id}/txrequests?txRequestIds=${signedTxResult.txRequestId}&latest=true`)
          .reply(200, { txRequests: [txRequest] });

        const createTransferNock = nock(bgUrl)
          .persist()
          .post(`/api/v2/wallet/${walletData.id}/txrequests/${signedTxResult.txRequestId}/transfers`)
          .reply(200, transfer);

        const input: SendManyOptions = {
          type: 'transfer',
          recipients: [
            {
              address: 'address',
              amount: '1000',
            },
          ],
          apiVersion: 'full',
        };
        const sendManyResult = await wallet.sendMany(input);
        prebuildAndSignTransaction.calledOnceWithExactly(input);
        txRequestNock.isDone().should.be.true();
        createTransferNock.isDone().should.be.true();

        sendManyResult.should.deepEqual({
          txRequest,
          transfer,
          txid: 'txid',
          tx: 'tx',
          status: 'signed',
        });
      });

      it('should return pendingApproval from sendMany for apiVersion=full', async function () {
        const wallet = new Wallet(bitgo, tsol, {
          ...walletData,
          type: 'hot',
        });
        const signedTxResult = {
          txRequestId: 'txRequestId',
        };
        const txRequest: TxRequest = {
          txRequestId: signedTxResult.txRequestId,
          date: new Date().toString(),
          intent: 'payment',
          latest: false,
          policiesChecked: false,
          state: 'pendingApproval',
          unsignedTxs: [],
          userId: 'unit-test',
          version: 0,
          walletId: wallet.id(),
          walletType: wallet.type() ?? 'hot',
          pendingApprovalId: 'some-pending-approval-id',
          transactions: [
            {
              state: 'initialized',
              unsignedTx: 'something' as any,
              signatureShares: [],
            },
          ],
        };
        const transfer = {
          id: 'transferId',
          state: 'signed',
          txid: 'txid',
        };
        const pendingApproval = {
          id: 'some-pending-approval-id',
          wallet: wallet.id(),
          info: {
            type: 'transactionRequestFull',
          },
          txRequestId: txRequest.txRequestId,
        };

        const prebuildAndSignTransaction = sandbox.stub(wallet, 'prebuildAndSignTransaction').resolves(signedTxResult);

        const txRequestNock = nock(bgUrl)
          .persist()
          .get(`/api/v2/wallet/${walletData.id}/txrequests?txRequestIds=${txRequest.txRequestId}&latest=true`)
          .reply(200, { txRequests: [txRequest] });

        const createTransferNock = nock(bgUrl)
          .persist()
          .post(`/api/v2/wallet/${walletData.id}/txrequests/${txRequest.txRequestId}/transfers`)
          .reply(200, transfer);

        const getPendingApprovalNock = nock(bgUrl)
          .persist()
          .get(`/api/v2/${wallet.coin()}/pendingapprovals/${txRequest.pendingApprovalId}`)
          .reply(200, pendingApproval);

        const input: SendManyOptions = {
          type: 'transfer',
          recipients: [
            {
              address: 'address',
              amount: '1000',
            },
          ],
          apiVersion: 'full',
        };
        const sendManyResult = await wallet.sendMany(input);
        prebuildAndSignTransaction.calledOnceWithExactly(input);
        txRequestNock.isDone().should.be.true();
        createTransferNock.isDone().should.be.true();
        getPendingApprovalNock.isDone().should.be.true();

        sendManyResult.should.deepEqual({ pendingApproval, txRequest });
      });

      it('should fail if txRequestId is missing from prebuild', async function () {
        const signedTransaction = {
          txHex: 'deadbeef',
        };

        const prebuildAndSignTransaction = sandbox.stub(tssSolWallet, 'prebuildAndSignTransaction');
        prebuildAndSignTransaction.resolves(signedTransaction);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke sendMany
        prebuildAndSignTransaction.calledOnceWithExactly(sendManyInput);

        await tssSolWallet
          .sendMany(sendManyInput)
          .should.be.rejectedWith('txRequestId missing from signed transaction');
      });
    });

    describe('Submit transaction', function () {
      it('should submit transaction with txRequestId', async function () {
        const nockSendTx = nock(bgUrl)
          .persist(false)
          .post(tssSolWallet.url('/tx/send').replace(bgUrl, ''))
          .reply(200, { message: 'success' });

        const submittedTx = await tssSolWallet.submitTransaction({
          txRequestId: 'id',
        });
        submittedTx.should.deepEqual({ message: 'success' });
        nockSendTx.isDone().should.be.true();
      });

      it('should fail when txRequestId and txHex are both provided', async function () {
        await tssSolWallet
          .submitTransaction({
            txRequestId: 'id',
            txHex: 'beef',
          })
          .should.be.rejectedWith('must supply exactly one of txRequestId, txHex, or halfSigned');
      });

      it('should fail when txRequestId and halfSigned are both provided', async function () {
        await tssSolWallet
          .submitTransaction({
            txRequestId: 'id',
            halfSigned: {
              txHex: 'beef',
            },
          })
          .should.be.rejectedWith('must supply exactly one of txRequestId, txHex, or halfSigned');
      });

      it('should fail when txHex and halfSigned are both provided', async function () {
        await tssSolWallet
          .submitTransaction({
            txHex: 'beef',
            halfSigned: {
              txHex: 'beef',
            },
          })
          .should.be.rejectedWith('must supply either txHex or halfSigned, but not both');
      });
    });

    describe('Transfer tokens', function () {
      const recipients = [
        {
          address: '0x101c3928946b2e1d99759e8e5d34b5e94c1a8e2f',
          amount: '0',
          tokenData: {
            tokenName: 'erc721:bitgoerc721',
            tokenContractAddress: '0x8397b091514c1f7bebb9dea6ac267ea23b570605',
            tokenId: '38',
            tokenQuantity: '1',
            decimalPlaces: 0,
            tokenType: TokenType.ERC721,
          },
        },
      ];

      const feeOptions = {
        maxFeePerGas: 2000000000,
        maxPriorityFeePerGas: 1000000000,
      };

      it('calling prebuildxTransaction should execute prebuildTxWithIntent with proper params', async function () {
        const txRequestFullTokenTransfer = { ...txRequestFull, intent: 'transferToken' };
        const prebuildTxWithIntent = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'prebuildTxWithIntent');
        prebuildTxWithIntent.resolves(txRequestFullTokenTransfer);
        // TODO(BG-59686): this is not doing anything if we don't check the return value, we should also move this check to happen after we invoke prebuildTransaction
        prebuildTxWithIntent.calledOnceWithExactly(
          {
            reqId,
            recipients,
            intentType: 'transferToken',
            feeOptions,
          },
          'full'
        );

        const txPrebuild = await tssPolygonWallet.prebuildTransaction({
          isTss: true,
          recipients,
          type: 'transfertoken',
          walletPassphrase: 'passphrase12345',
          feeOptions,
        });

        txPrebuild.should.deepEqual({
          walletId: tssPolygonWallet.id(),
          wallet: tssPolygonWallet,
          txRequestId: 'id',
          txHex: 'ababcdcd',
          buildParams: {
            recipients,
            type: 'transfertoken',
          },
          feeInfo: {
            fee: 5000,
            feeString: '5000',
          },
        });
      });

      it('should populate intent with EVM-like params', async function () {
        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('tpolygon'));
        // @ts-expect-error only pass in params being tested
        const intent = mpcUtils.populateIntent(bitgo.coin('tpolygon'), {
          intentType: 'transferToken',
          recipients,
          feeOptions,
        });
        intent.should.have.property('feeOptions');
        intent.feeOptions!.should.have.property('maxFeePerGas', 2000000000);
        intent.feeOptions!.should.have.property('maxPriorityFeePerGas', 1000000000);
        intent.should.have.property('recipients');
        intent.recipients!.should.have.property('length', 1);
        intent.recipients![0].should.have.property('tokenData');
        intent.recipients![0].tokenData!.should.have.property('tokenQuantity', recipients[0].tokenData.tokenQuantity);
        intent.recipients![0].tokenData!.should.have.property('tokenType', recipients[0].tokenData.tokenType);
        intent.recipients![0].tokenData!.should.have.property('tokenName', recipients[0].tokenData.tokenName);
        intent.recipients![0].tokenData!.should.have.property(
          'tokenContractAddress',
          recipients[0].tokenData.tokenContractAddress
        );
        intent.recipients![0].tokenData!.should.have.property('tokenId', recipients[0].tokenData.tokenId);
        intent.recipients![0].tokenData!.should.have.property('decimalPlaces', recipients[0].tokenData.decimalPlaces);
      });

      it('should populate intent with calldata', async function () {
        const recipients = [
          {
            address: '0x101c3928946b2e1d99759e8e5d34b5e94c1a8e2f',
            amount: '0',
            data: '0x000011112222',
          },
        ];

        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('hteth'));
        // @ts-expect-error only pass in params being tested
        const intent = mpcUtils.populateIntent(bitgo.coin('hteth'), {
          intentType: 'payment',
          recipients,
          feeOptions,
        });

        intent.should.have.property('feeOptions');
        intent.feeOptions!.should.have.property('maxFeePerGas', 2000000000);
        intent.feeOptions!.should.have.property('maxPriorityFeePerGas', 1000000000);
        intent.should.have.property('recipients');
        intent.recipients!.should.have.property('length', 1);
        intent.recipients![0].data!.should.equal('0x000011112222');
      });

      it('should not populate intent with tokenData if certain params are undefined', async function () {
        const mpcUtils = new ECDSAUtils.EcdsaUtils(bitgo, bitgo.coin('tpolygon'));
        const recipients = [
          {
            address: '0x101c3928946b2e1d99759e8e5d34b5e94c1a8e2f',
            amount: '0',
            tokenData: {
              tokenName: 'erc721:bitgoerc721',
              tokenContractAddress: '0x8397b091514c1f7bebb9dea6ac267ea23b570605',
              tokenId: '38',
              tokenQuantity: '1',
              decimalPlaces: 0,
            },
          },
        ];
        let intent;
        try {
          intent = mpcUtils.populateIntent(bitgo.coin('tpolygon'), {
            intentType: 'transferToken',
            // @ts-expect-error only pass in params be tested for
            recipients,
            feeOptions,
          });
          intent.should.equal(undefined);
        } catch (e: any) {
          e.message.should.equal(
            'token type and quantity is required to request a transaction with intent to transfer a token'
          );
        }
      });
    });

    describe('Wallet Sharing', function () {
      it('should use keychain pub to share tss wallet', async function () {
        const userId = '123';
        const email = 'shareto@sdktest.com';
        const permissions = 'view,spend';
        const toKeychain = utxoLib.bip32.fromSeed(Buffer.from('deadbeef02deadbeef02deadbeef02deadbeef02', 'hex'));
        const path = 'm/999999/1/1';
        const pubkey = toKeychain.derivePath(path).publicKey.toString('hex');
        const walletPassphrase = 'bitgo1234';

        const getSharingKeyNock = nock(bgUrl)
          .post('/api/v1/user/sharingkey', { email })
          .reply(200, { userId, pubkey, path });

        // commonPub + commonChaincode
        const commonKeychain = randomBytes(32).toString('hex') + randomBytes(32).toString('hex');
        const getKeyNock = nock(bgUrl)
          .get(`/api/v2/tsol/key/${tssSolWallet.keyIds()[0]}`)
          .reply(200, {
            id: tssSolWallet.keyIds()[0],
            commonKeychain: commonKeychain,
            source: 'user',
            encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: walletPassphrase }),
            coinSpecific: {},
          });

        const stub = sinon.stub(tssSolWallet, 'createShare').callsFake(async (options) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          options!.keychain!.pub!.should.not.be.undefined();
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          options!.keychain!.pub!.should.equal(TssUtils.getPublicKeyFromCommonKeychain(commonKeychain));
          return undefined;
        });
        await tssSolWallet.shareWallet({ email, permissions, walletPassphrase });

        stub.calledOnce.should.be.true();
        getSharingKeyNock.isDone().should.be.True();
        getKeyNock.isDone().should.be.True();
      });
    });
  });

  describe('AVAX tests', function () {
    let bgUrl;
    let basecoin;
    let walletData;
    let wallet;

    before(async function () {
      nock.pendingMocks().should.be.empty();
      bgUrl = common.Environments[bitgo.getEnv()].uri;
      walletData = {
        id: '5b34252f1bf349930e34020a00000000',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {},
      };
    });

    it('should fetch cross-chain utxos', async function () {
      basecoin = bitgo.coin('tavaxp');
      walletData.coin = 'tavaxp';
      wallet = new Wallet(bitgo, basecoin, walletData);

      const params = { sourceChain: 'C' };
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/crossChainUnspents`;
      const scope = nock(bgUrl)
        .get(path)
        .query(params)
        .reply(200, {
          unspent: {
            outputID: 7,
            amount: '10000000',
            txid: 'V3UBZTQj364zNWqt8uMHD5NjxxX8T8qkbeZXURmjnVmLEqzab',
            threshold: 2,
            addresses: [
              'C-fuji199fluegrthqs4tvz40zajfrsx5m7dvy75ajfm6',
              'C-fuji1gk3m444893ynl0gfvxahjgw3vftnn8sptyd9g5',
              'C-fuji1ujfzjgwzfygl60qp2l8rmglg3lnm7w4059nca5',
            ],
            outputidx: '1111XiaYg',
            locktime: '0',
          },
          fromWallet: '635092fd4ff3316142df6e6b7a078b92',
          toWallet: '635092fd4ff3316142df6e891f6a7ee6',
          toAddress: '0x125c4451c870f753265b0b1af3cf6ab88ffe4657',
        });

      try {
        await wallet.fetchCrossChainUTXOs(params);
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }

      scope.isDone().should.be.True();
    });

    it('sendMany should work for C > P export with custodial wallet', async function () {
      basecoin = bitgo.coin('tavaxc');
      walletData.coin = 'tavaxc';
      walletData.type = 'custodial';
      wallet = new Wallet(bitgo, basecoin, walletData);

      const address =
        'P-fuji1e56pc4966qsevzhwgkym5l0jfma9llkqnrr4gh~P-fuji1kq05zm9nmlq8p3ld55k79dl3qay6c0e3atj56v~P-fuji1rp46z30qg457xc3dpffyxcgzpflxc85mhkjme3';
      const initiateTxParams = {
        recipients: [
          {
            amount: '10000000000000000', // 0.01 AVAX
            address,
          },
        ],
        hop: true,
        type: 'Export',
      };

      const initiateTxPath = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/initiate`;
      let initiateTxBody;
      const response = nock(bgUrl)
        .post(initiateTxPath, (body) => {
          initiateTxBody = body;
          return true;
        })
        .reply(200);

      const feeEstimationPath = `/api/v2/${wallet.coin()}/tx/fee?hop=true&recipient=${address}&amount=10000000000000000&type=Export`;
      nock(bgUrl).get(feeEstimationPath).reply(200, {
        feeEstimate: '718750000000000',
        gasLimitEstimate: 500000,
      });

      try {
        await wallet.sendMany(initiateTxParams);
      } catch (e) {
        console.log(e);
        // test is successful if nock is consumed, HMAC errors expected
      }
      _.isMatch(initiateTxBody, {
        hopParams: {
          gasPriceMax: 7187500000,
        },
        type: 'Export',
        gasLimit: 500000,
        recipients: [
          {
            amount: '10000000000000000',
            address,
          },
        ],
      }).should.be.true();

      response.isDone().should.be.true();
    });
  });

  describe('NFT Tests', function () {
    let ethWallet: Wallet;

    before(async function () {
      const walletData = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coin: 'hteth',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7',
        ],
        multisigType: 'onchain',
        coinSpecific: {
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        },
      };
      ethWallet = new Wallet(bitgo, bitgo.coin('hteth'), walletData);
    });

    afterEach(async function () {
      nock.cleanAll();
    });

    it('Should return all nfts in the wallet', async function () {
      const getTokenBalanceNock = nock(bgUrl)
        .get(`/api/v2/hteth/wallet/${ethWallet.id()}?allTokens=true`)
        .reply(200, {
          ...walletData,
          ...nftResponse,
        });
      const nfts = await ethWallet.getNftBalances();
      getTokenBalanceNock.isDone().should.be.true();

      nfts.should.length(5);
      nfts.should.containEql({
        type: 'ERC721',
        metadata: {
          name: 'terc721:bitgoerc721',
          tokenContractAddress: '0x8397b091514c1f7bebb9dea6ac267ea23b570605',
        },
        collections: {},
        balanceString: '0',
        confirmedBalanceString: '0',
        spendableBalanceString: '0',
        transferCount: 0,
      });
    });

    it('Should throw when attempting to transfer a nft collection not in the wallet', async function () {
      const getTokenBalanceNock = nock(bgUrl)
        .get(`/api/v2/hteth/wallet/${ethWallet.id()}?allTokens=true`)
        .reply(200, {
          ...walletData,
          ...nftResponse,
        });

      await ethWallet
        .sendNft(
          {
            walletPassphrase: '123abc',
            otp: '000000',
          },
          {
            tokenId: '123',
            type: 'ERC721',
            tokenContractAddress: '0x123badaddress',
            recipientAddress: '0xc15acc27ee41f266877c8f0c61df5bcbc7997df6',
          }
        )
        .should.be.rejectedWith('Collection not found for token contract 0x123badaddress');
      getTokenBalanceNock.isDone().should.be.true();
    });

    it('Should throw when attempting to transfer a ERC-721 nft not owned by the wallet', async function () {
      const getTokenBalanceNock = nock(bgUrl)
        .get(`/api/v2/hteth/wallet/${ethWallet.id()}?allTokens=true`)
        .reply(200, {
          ...walletData,
          ...nftResponse,
          ...unsupportedNftResponse,
        });

      await ethWallet
        .sendNft(
          {
            walletPassphrase: '123abc',
            otp: '000000',
          },
          {
            tokenId: '123',
            type: 'ERC721',
            tokenContractAddress: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
            recipientAddress: '0xc15acc27ee41f266877c8f0c61df5bcbc7997df6',
          }
        )
        .should.be.rejectedWith(
          'Token 123 not found in collection 0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b or does not have a spendable balance'
        );
      getTokenBalanceNock.isDone().should.be.true();
    });

    it('Should throw when attempting to transfer ERC-1155 tokens when the amount transferred is more than the spendable balance', async function () {
      const getTokenBalanceNock = nock(bgUrl)
        .get(`/api/v2/hteth/wallet/${ethWallet.id()}?allTokens=true`)
        .reply(200, {
          ...walletData,
          ...{
            unsupportedNfts: {
              '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b': {
                type: 'ERC1155',
                collections: {
                  1186703: '9',
                  1186705: '1',
                  1294856: '1',
                  1294857: '1',
                  1294858: '1',
                  1294859: '1',
                  1294860: '1',
                },
                metadata: {
                  name: 'MultiFaucet NFT',
                  tokenContractAddress: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
                },
              },
            },
          },
        });

      await ethWallet
        .sendNft(
          {
            walletPassphrase: '123abc',
            otp: '000000',
          },
          {
            entries: [
              {
                amount: 10,
                tokenId: '1186703',
              },
              {
                amount: 1,
                tokenId: '1186705',
              },
            ],
            type: 'ERC1155',
            tokenContractAddress: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
            recipientAddress: '0xc15acc27ee41f266877c8f0c61df5bcbc7997df6',
          }
        )
        .should.be.rejectedWith('Amount 10 exceeds spendable balance of 9 for token 1186703');
      getTokenBalanceNock.isDone().should.be.true();
    });
  });
});
