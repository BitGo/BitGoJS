import * as assert from 'assert';
import { TestBitGo } from '@bitgo/sdk-test';
import * as nock from 'nock';
import { BaseCoin, PendingApprovalData, State, Type } from '@bitgo/sdk-core';
import {
  CreateInvoiceBody,
  getLightningWallet,
  Invoice,
  InvoiceInfo,
  InvoiceQuery,
  LndCreatePaymentResponse,
  LightningWallet,
  SubmitPaymentParams,
  UpdateLightningWalletClientRequest,
  getLightningKeychain,
  getLightningAuthKeychains,
  updateWalletCoinSpecific,
  LightningOnchainWithdrawParams,
} from '@bitgo/abstract-lightning';

import { BitGo, common, GenerateLightningWalletOptions, Wallet, Wallets } from '../../../../src';

describe('Lightning wallets', function () {
  const coinName = 'tlnbtc';
  const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
  let basecoin: BaseCoin;
  let wallets: Wallets;
  let bgUrl: string;

  const userAuthKey = {
    id: 'def',
    pub: 'xpub661MyMwAqRbcGYjYsnsDj1SHdiXynWEXNnfNgMSpokN54FKyMqbu7rWEfVNDs6uAJmz86UVFtq4sefhQpXZhSAzQcL9zrEPtiLNNZoeSxCG',
    encryptedPrv:
      '{"iv":"zYhhaNdW0wPfJEoBjZ4pvg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"tgAMua9jjhw=","ct":"HcrbxQvNlWG5tLMndYzdNCYa1l+1h7o+vSsweA0+q1le3tWt6jLUJSEjZN+JI8lTZ2KPFQgLulQQhsUa+ytUCBi0vSgjF7x7CprT7l2Cfjkew00XsEd7wnmtJUsrQk8m69Co7tIRA3oEgzrnYwy4qOM81lbNNyQ="}',
    source: 'user',
    coinSpecific: {
      tlnbtc: {
        purpose: 'userAuth',
      },
    },
  };

  const nodeAuthKey = {
    id: 'ghi',
    pub: 'xpub661MyMwAqRbcG9xnTnAnRbJPo3MAHyRtH4zeehN8exYk4VFz5buepUzebhix33BKhS5Eb4V3LEfW5pYiSR8qmaEnyrpeghhKY8JfzAsUDpq',
    encryptedPrv:
      '{"iv":"bH6eGbnl9x8PZECPrgvcng==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"o8yknV6nTI8=","ct":"nGyzAToIzYkQeIdcVafoWHtMx7+Fgj0YldCme3WA1yxJAA0QulZVhblMZN/7efCRIumA0NNmpH7dxH6n8cVlz/Z+RUgC2q9lgvZKUoJcYNTjWUfkmkJutXX2tr8yVxm+eC/hnRiyfVLZ2qPxctvDlBVBfgLuPyc="}',
    source: 'user',
    coinSpecific: {
      tlnbtc: {
        purpose: 'nodeAuth',
      },
    },
  };

  before(function () {
    bitgo.initializeTestVars();

    basecoin = bitgo.coin(coinName);
    wallets = basecoin.wallets();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  after(function () {
    nock.cleanAll();
    nock.pendingMocks().length.should.equal(0);
  });

  describe('Generate lightning wallet', function () {
    it('should validate parameters', async function () {
      await wallets
        .generateWallet({
          passphrase: 'pass123',
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.label, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.passphrase, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          passcodeEncryptionCode: 'code123',
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.enterprise, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          enterprise: 'ent123',
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.passcodeEncryptionCode, expected string."
        );

      await wallets
        .generateWallet({
          label: 123 as any,
          passphrase: 'pass123',
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.label, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 123 as any,
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.passphrase, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          enterprise: 123 as any,
          passcodeEncryptionCode: 'code123',
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.enterprise, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          enterprise: 'ent123',
          passcodeEncryptionCode: 123 as any,
          subType: 'lightningCustody',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.passcodeEncryptionCode, expected string."
        );
    });

    for (const subType of ['lightningCustody', 'lightningSelfCustody'] as const) {
      it(`should generate ${subType} lightning wallet`, async function () {
        const params: GenerateLightningWalletOptions = {
          label: 'my ln wallet',
          passphrase: 'pass123',
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
          subType: subType as 'lightningCustody' | 'lightningSelfCustody',
        };

        const validateKeyRequest = (body) => {
          const baseChecks =
            body.pub.startsWith('xpub') &&
            !!body.encryptedPrv &&
            body.keyType === 'independent' &&
            body.source === 'user';

          if (body.originalPasscodeEncryptionCode !== undefined) {
            return baseChecks && body.originalPasscodeEncryptionCode === 'code123' && body.coinSpecific === undefined;
          } else {
            const coinSpecific = body.coinSpecific && body.coinSpecific.tlnbtc;
            return baseChecks && !!coinSpecific && ['userAuth', 'nodeAuth'].includes(coinSpecific.purpose);
          }
        };

        const validateWalletRequest = (body) => {
          return (
            body.label === 'my ln wallet' &&
            body.m === 1 &&
            body.n === 1 &&
            body.type === 'hot' &&
            body.subType === subType &&
            body.enterprise === 'ent123' &&
            Array.isArray(body.keys) &&
            body.keys.length === 1 &&
            body.keys[0] === 'keyId1' &&
            body.coinSpecific &&
            body.coinSpecific.tlnbtc &&
            Array.isArray(body.coinSpecific.tlnbtc.keys) &&
            body.coinSpecific.tlnbtc.keys.length === 2 &&
            body.coinSpecific.tlnbtc.keys.includes('keyId2') &&
            body.coinSpecific.tlnbtc.keys.includes('keyId3')
          );
        };

        nock(bgUrl)
          .post('/api/v2/' + coinName + '/key', (body) => validateKeyRequest(body))
          .reply(200, { id: 'keyId1' });
        nock(bgUrl)
          .post('/api/v2/' + coinName + '/key', (body) => validateKeyRequest(body))
          .reply(200, { id: 'keyId2' });
        nock(bgUrl)
          .post('/api/v2/' + coinName + '/key', (body) => validateKeyRequest(body))
          .reply(200, { id: 'keyId3' });

        nock(bgUrl)
          .post('/api/v2/' + coinName + '/wallet/add', (body) => validateWalletRequest(body))
          .reply(200, { id: 'walletId' });

        const response = await wallets.generateWallet(params);

        assert.ok(response.wallet);
        assert.ok(response.encryptedWalletPassphrase);
        assert.equal(
          bitgo.decrypt({ input: response.encryptedWalletPassphrase, password: params.passcodeEncryptionCode }),
          params.passphrase
        );
      });
    }
  });

  describe('invoices', function () {
    let wallet: LightningWallet;
    beforeEach(function () {
      wallet = getLightningWallet(
        new Wallet(bitgo, basecoin, {
          id: 'walletId',
          coin: 'tlnbtc',
          subType: 'lightningCustody',
          coinSpecific: { keys: ['def', 'ghi'] },
        })
      ) as LightningWallet;
    });

    it('should list invoices', async function () {
      const invoice: InvoiceInfo = {
        valueMsat: 1000n,
        paymentHash: 'foo',
        invoice: 'tlnfoobar',
        walletId: wallet.wallet.id(),
        status: 'open',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const query = {
        status: 'open',
        startDate: new Date(),
        limit: 100n,
      } as InvoiceQuery;
      const listInvoicesNock = nock(bgUrl)
        .get(`/api/v2/wallet/${wallet.wallet.id()}/lightning/invoice`)
        .query(InvoiceQuery.encode(query))
        .reply(200, [InvoiceInfo.encode(invoice)]);
      const invoiceResponse = await wallet.listInvoices(query);
      assert.strictEqual(invoiceResponse.length, 1);
      assert.deepStrictEqual(invoiceResponse[0], invoice);
      listInvoicesNock.done();
    });

    it('listInvoices should throw error if wp response is invalid', async function () {
      const listInvoicesNock = nock(bgUrl)
        .get(`/api/v2/wallet/${wallet.wallet.id()}/lightning/invoice`)
        .reply(200, [{ valueMsat: '1000' }]);
      await assert.rejects(async () => await wallet.listInvoices({}), /Invalid list invoices response/);
      listInvoicesNock.done();
    });

    it('should create invoice', async function () {
      const createInvoice: CreateInvoiceBody = {
        valueMsat: 1000n,
        memo: 'test invoice',
        expiry: 100,
      };
      const invoice: Invoice = {
        invoice: 'tlnabc',
        paymentHash: '123',
        expiresAt: new Date(),
        status: 'open',
        walletId: wallet.wallet.id(),
        valueMsat: 1000n,
      };
      const createInvoiceNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/lightning/invoice`, CreateInvoiceBody.encode(createInvoice))
        .reply(200, Invoice.encode(invoice));
      const createInvoiceResponse = await wallet.createInvoice(createInvoice);
      assert.deepStrictEqual(createInvoiceResponse, invoice);
      createInvoiceNock.done();
    });

    it('createInvoice should throw error if wp response is invalid', async function () {
      const createInvoice: CreateInvoiceBody = {
        valueMsat: 1000n,
        memo: 'test invoice',
        expiry: 100,
      };
      const createInvoiceNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/lightning/invoice`)
        .reply(200, { valueMsat: '1000' });
      await assert.rejects(async () => await wallet.createInvoice(createInvoice), /Invalid create invoice response/);
      createInvoiceNock.done();
    });

    it('should pay invoice', async function () {
      const params: SubmitPaymentParams = {
        invoice: 'lnbc1...',
        amountMsat: 1000n,
        feeLimitMsat: 100n,
        feeLimitRatio: 0.1,
        sequenceId: '123',
        comment: 'test payment',
        passphrase: 'password123',
      };

      const txRequestResponse = {
        txRequestId: 'txReq123',
        state: 'delivered',
      };

      const lndResponse: LndCreatePaymentResponse = {
        status: 'settled',
        paymentHash: 'paymentHash123',
        amountMsat: params.amountMsat !== undefined ? params.amountMsat.toString() : undefined,
        feeMsat: params.feeLimitMsat !== undefined ? params.feeLimitMsat.toString() : undefined,
        paymentPreimage: 'preimage123',
      };

      const finalPaymentResponse = {
        txRequestId: 'txReq123',
        state: 'delivered',
        transactions: [
          {
            unsignedTx: {
              coinSpecific: {
                ...lndResponse,
              },
            },
          },
        ],
      };

      const transferData = {
        id: 'fake_id',
        coin: 'tlnbtc',
        state: 'confirmed',
        txid: lndResponse.paymentHash,
      };

      const getTransferNock = nock(bgUrl)
        .get(`/api/v2/${coinName}/wallet/${wallet.wallet.id()}/transfer/${lndResponse.paymentHash}`)
        .reply(200, transferData);

      const createTxRequestNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/txrequests`)
        .reply(200, txRequestResponse);

      const sendTxRequestNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/txrequests/${txRequestResponse.txRequestId}/transactions/0/send`)
        .reply(200, finalPaymentResponse);

      const userAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/def')
        .reply(200, userAuthKey);
      const nodeAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/ghi')
        .reply(200, nodeAuthKey);

      const response = await wallet.pay(params);
      assert.strictEqual(response.txRequestId, 'txReq123');
      assert.strictEqual(response.txRequestState, 'delivered');
      assert(response.paymentStatus);
      assert.strictEqual(
        response.paymentStatus.status,
        finalPaymentResponse.transactions[0].unsignedTx.coinSpecific.status
      );
      assert.strictEqual(
        response.paymentStatus.paymentHash,
        finalPaymentResponse.transactions[0].unsignedTx.coinSpecific.paymentHash
      );
      assert.strictEqual(
        response.paymentStatus.amountMsat,
        finalPaymentResponse.transactions[0].unsignedTx.coinSpecific.amountMsat
      );
      assert.strictEqual(
        response.paymentStatus.feeMsat,
        finalPaymentResponse.transactions[0].unsignedTx.coinSpecific.feeMsat
      );
      assert.strictEqual(
        response.paymentStatus.paymentPreimage,
        finalPaymentResponse.transactions[0].unsignedTx.coinSpecific.paymentPreimage
      );

      getTransferNock.done();
      createTxRequestNock.done();
      sendTxRequestNock.done();
      userAuthKeyNock.done();
      nodeAuthKeyNock.done();
    });

    it('should handle pending approval when paying invoice', async function () {
      const params: SubmitPaymentParams = {
        invoice: 'lnbc1...',
        amountMsat: 1000n,
        feeLimitMsat: 100n,
        feeLimitRatio: 0.1,
        sequenceId: '123',
        comment: 'test payment',
        passphrase: 'password123',
      };

      const txRequestResponse = {
        txRequestId: 'txReq123',
        state: 'pendingApproval',
        pendingApprovalId: 'approval123',
      };

      const pendingApprovalData: PendingApprovalData = {
        id: 'approval123',
        state: State.PENDING,
        creator: 'user123',
        info: {
          type: Type.TRANSACTION_REQUEST,
        },
      };

      const createTxRequestNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/txrequests`)
        .reply(200, txRequestResponse);

      const getPendingApprovalNock = nock(bgUrl)
        .get(`/api/v2/${coinName}/pendingapprovals/${txRequestResponse.pendingApprovalId}`)
        .reply(200, pendingApprovalData);

      const userAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/def')
        .reply(200, userAuthKey);
      const nodeAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/ghi')
        .reply(200, nodeAuthKey);

      const response = await wallet.pay(params);
      assert.strictEqual(response.txRequestId, 'txReq123');
      assert.strictEqual(response.txRequestState, 'pendingApproval');
      assert(response.pendingApproval);
      assert.strictEqual(response.paymentStatus, undefined);

      createTxRequestNock.done();
      getPendingApprovalNock.done();
      userAuthKeyNock.done();
      nodeAuthKeyNock.done();
    });
  });

  describe('Get lightning key(s)', function () {
    const walletData = {
      id: 'fakeid',
      coin: coinName,
      keys: ['abc'],
      coinSpecific: { keys: ['def', 'ghi'] },
      subType: 'lightningCustody',
    };

    const userKeyData = {
      id: 'abc',
      pub: 'xpub1',
      encryptedPrv: 'encryptedPrv1',
      source: 'user',
    };

    const userAuthKeyData = {
      id: 'def',
      pub: 'xpub2',
      encryptedPrv: 'encryptedPrv2',
      source: 'user',
      coinSpecific: {
        tlnbtc: {
          purpose: 'userAuth',
        },
      },
    };

    const nodeAuthKeyData = {
      id: 'ghi',
      pub: 'xpub3',
      encryptedPrv: 'encryptedPrv3',
      source: 'user',
      coinSpecific: {
        tlnbtc: {
          purpose: 'nodeAuth',
        },
      },
    };

    it('should get lightning key', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      const keyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/abc')
        .reply(200, userKeyData);

      const key = await getLightningKeychain(wallet);
      assert.deepStrictEqual(key, userKeyData);
      keyNock.done();
    });

    it('should get lightning auth keys', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      const userAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/def')
        .reply(200, userAuthKeyData);
      const nodeAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/ghi')
        .reply(200, nodeAuthKeyData);

      const { userAuthKey, nodeAuthKey } = await getLightningAuthKeychains(wallet);
      assert.deepStrictEqual(userAuthKey, userAuthKeyData);
      assert.deepStrictEqual(nodeAuthKey, nodeAuthKeyData);
      userAuthKeyNock.done();
      nodeAuthKeyNock.done();
    });

    it('should fail to get lightning key for invalid number of keys', async function () {
      const wallet = new Wallet(bitgo, basecoin, { ...walletData, keys: [] });
      await assert.rejects(
        async () => await getLightningKeychain(wallet),
        /Error: Invalid number of key in lightning wallet: 0/
      );
    });

    it('should fail to get lightning auth keys for invalid number of keys', async function () {
      const wallet = new Wallet(bitgo, basecoin, { ...walletData, coinSpecific: { keys: ['def'] } });
      await assert.rejects(
        async () => await getLightningAuthKeychains(wallet),
        /Error: Invalid number of auth keys in lightning wallet: 1/
      );
    });

    it('should fail to get lightning key for invalid response', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/abc')
        .reply(200, { ...userKeyData, source: 'backup' });

      await assert.rejects(async () => await getLightningKeychain(wallet), /Error: Invalid user key/);
    });

    it('should fail to get lightning auth keys for invalid response', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/def')
        .reply(200, { ...userAuthKeyData, source: 'backup' });

      nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/ghi')
        .reply(200, nodeAuthKeyData);

      await assert.rejects(
        async () => await getLightningAuthKeychains(wallet),
        /Error: Invalid lightning auth key: def/
      );
    });
  });

  describe('Update lightning wallet coin specific', function () {
    const walletData = {
      id: 'fakeid',
      coin: coinName,
      keys: ['abc'],
      coinSpecific: { keys: ['def', 'ghi'] },
      subType: 'lightningSelfCustody',
    };

    const watchOnlyAccounts = {
      master_key_birthday_timestamp: 'dummy',
      master_key_fingerprint: 'dummy',
      accounts: [
        {
          xpub: 'upub5Eep7H5q39PzQZLVEYLBytDyBNeV74E8mQsyeL6UozFq9Y3MsZ52G7YGuqrJPgoyAqF7TBeJdnkrHrVrB5pkWkPJ9cJGAePMU6F1Gyw6aFH',
          purpose: 49,
          coin_type: 0,
          account: 0,
        },
        {
          xpub: 'vpub5ZU1PHGpQoDSHckYico4nsvwsD3mTh6UjqL5zyGWXZXzBjTYMNKot7t9eRPQY71hJcnNN9r1ss25g3xA9rmoJ5nWPg8jEWavrttnsVa1qw1',
          purpose: 84,
          coin_type: 0,
          account: 0,
        },
      ],
    };
    it('should update wallet', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      const userAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/def')
        .reply(200, userAuthKey);
      const nodeAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/ghi')
        .reply(200, nodeAuthKey);
      let capturedBody;
      const wpWalletUpdateNock = nock(bgUrl)
        .put(`/api/v2/tlnbtc/wallet/${walletData.id}`)
        .reply(function (uri, requestBody) {
          capturedBody = requestBody;
          return [200];
        });

      const params: UpdateLightningWalletClientRequest = {
        signerMacaroon: 'signerMacaroon',
        signerAdminMacaroon: 'signerAdminMacaroon',
        signerTlsKey: 'signerTlsKey',
        signerTlsCert: 'signerTlsCert',
        watchOnlyAccounts,
        passphrase: 'password123',
      };

      await assert.doesNotReject(async () => await updateWalletCoinSpecific(wallet, params));
      assert(userAuthKeyNock.isDone());
      assert(nodeAuthKeyNock.isDone());
      assert(wpWalletUpdateNock.isDone());

      // Verify structure and required fields
      assert.ok(capturedBody.coinSpecific?.tlnbtc?.signedRequest, 'signedRequest should exist');
      const signedRequest = capturedBody.coinSpecific.tlnbtc.signedRequest;

      assert.ok(signedRequest.signerTlsCert, 'signerTlsCert should exist');
      assert.ok(signedRequest.watchOnlyAccounts, 'watchOnlyAccounts should exist');
      assert.ok(signedRequest.encryptedSignerTlsKey, 'encryptedSignerTlsKey should exist');
      assert.ok(signedRequest.encryptedSignerAdminMacaroon, 'encryptedSignerAdminMacaroon should exist');
      assert.ok(signedRequest.encryptedSignerMacaroon, 'encryptedSignerMacaroon should exist');

      // Verify signature exists
      assert.ok(capturedBody.coinSpecific.tlnbtc.signature, 'signature should exist');

      // we should not pass passphrase to the backend
      assert.strictEqual(signedRequest.passphrase, undefined, 'passphrase should not exist in request');
    });
  });
  describe('On chain withdrawal', function () {
    let wallet: LightningWallet;
    beforeEach(function () {
      wallet = getLightningWallet(
        new Wallet(bitgo, basecoin, {
          id: 'walletId',
          coin: 'tlnbtc',
          subType: 'lightningCustody',
          coinSpecific: { keys: ['def', 'ghi'] },
        })
      ) as LightningWallet;
    });
    it('should withdraw on chain', async function () {
      const params: LightningOnchainWithdrawParams = {
        recipients: [
          {
            amountSat: 500000n,
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        satsPerVbyte: 15n,
      };

      const txRequestResponse = {
        txRequestId: 'txReq123',
        state: 'pendingDelivery',
      };

      const finalPaymentResponse = {
        txRequestId: 'txReq123',
        state: 'delivered',
      };

      const createTxRequestNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/txrequests`)
        .reply(200, txRequestResponse);

      const sendTxRequestNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/txrequests/${txRequestResponse.txRequestId}/transactions/0/send`)
        .reply(200, finalPaymentResponse);

      const response = await wallet.withdrawOnchain(params);
      assert.strictEqual(response.txRequestId, 'txReq123');
      assert.strictEqual(response.txRequestState, 'delivered');

      createTxRequestNock.done();
      sendTxRequestNock.done();
    });

    it('should handle pending approval when withdrawing onchain', async function () {
      const params: LightningOnchainWithdrawParams = {
        recipients: [
          {
            amountSat: 500000n,
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        satsPerVbyte: 15n,
      };

      const txRequestResponse = {
        txRequestId: 'txReq123',
        state: 'pendingApproval',
        pendingApprovalId: 'approval123',
      };

      const pendingApprovalData: PendingApprovalData = {
        id: 'approval123',
        state: State.PENDING,
        creator: 'user123',
        info: {
          type: Type.TRANSACTION_REQUEST,
        },
      };

      const createTxRequestNock = nock(bgUrl)
        .post(`/api/v2/wallet/${wallet.wallet.id()}/txrequests`)
        .reply(200, txRequestResponse);

      const getPendingApprovalNock = nock(bgUrl)
        .get(`/api/v2/${coinName}/pendingapprovals/${txRequestResponse.pendingApprovalId}`)
        .reply(200, pendingApprovalData);

      const response = await wallet.withdrawOnchain(params);
      assert.strictEqual(response.txRequestId, 'txReq123');
      assert.strictEqual(response.txRequestState, 'pendingApproval');
      assert(response.pendingApproval);

      createTxRequestNock.done();
      getPendingApprovalNock.done();
    });
  });
});
