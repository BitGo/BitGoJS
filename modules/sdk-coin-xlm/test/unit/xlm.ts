import * as should from 'should';
import { randomBytes } from 'crypto';
import * as stellar from 'stellar-sdk';

import { Environments, Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI, encrypt } from '@bitgo/sdk-api';
import { Txlm } from '../../src';
import { KeyPair } from '../../src/lib/keyPair';

import nock from 'nock';
import * as assert from 'assert';
import { xlmBackupKey } from './fixtures/xlmBackupKey';
nock.enableNetConnect();

describe('XLM:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let uri;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('txlm', Txlm.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txlm');
    uri = Environments[bitgo.getEnv()].uri;
  });

  after(function () {
    nock.cleanAll();
  });

  describe('Addresses:', () => {
    const noMemoIdAddress = 'GBIEJQUARJ33DIZU4AIRDOKYPSVK66Z3O5XU7OOI7LUOAJWTPI4OA4JI';
    const validMemoIdAddress = 'GBIEJQUARJ33DIZU4AIRDOKYPSVK66Z3O5XU7OOI7LUOAJWTPI4OA4JI?memoId=5';
    const invalidMemoIdAddress = 'GBIEJQUARJ33DIZU4AIRDOKYPSVK66Z3O5XU7OOI7LUOAJWTPI4OA4JI?memoId=x';
    const multipleMemoIdAddress = 'GBIEJQUARJ33DIZU4AIRDOKYPSVK66Z3O5XU7OOI7LUOAJWTPI4OA4JI?memoId=5&memoId=3';
    // Muxed address of GAFHNUKOZT6QA4WJS6YSDCN6XETEOP7Q6AOHFFLUGLNVM6FY724ULORC
    const validMuxedAddress = 'MAFHNUKOZT6QA4WJS6YSDCN6XETEOP7Q6AOHFFLUGLNVM6FY724UKAAAAAAAAAAAAEJCO';
    const validMuxedBaseAddress = 'GAFHNUKOZT6QA4WJS6YSDCN6XETEOP7Q6AOHFFLUGLNVM6FY724ULORC';

    it('should get address details without memoId', function () {
      const addressDetails = basecoin.getAddressDetails(noMemoIdAddress);
      addressDetails.address.should.equal(noMemoIdAddress);
      should.not.exist(addressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const addressDetails = basecoin.getAddressDetails(validMemoIdAddress);
      addressDetails.address.should.equal(validMemoIdAddress.split('?')[0]);
      addressDetails.memoId.should.equal('5');
    });

    it('should throw on invalid memo id address', () => {
      (() => {
        basecoin.getAddressDetails(invalidMemoIdAddress);
      }).should.throw();
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        basecoin.getAddressDetails(multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate address', function () {
      basecoin.isValidAddress('GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4').should.equal(true);
      basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2').should.equal(true);
      basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=1').should.equal(true);
      basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=x').should.equal(false);
      basecoin.isValidAddress('SBKGCMBY56MHTT4EGE3YJIYL4CPWKSGJ7VDEQF4J3B3YO576KNL7DOYJ').should.equal(false); // private key
      basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.equal(false); // xrp account
    });

    it('should validate muxed address', function () {
      basecoin.isValidAddress(validMuxedAddress).should.equal(true);
      const muxedAddressDetails = basecoin.getAddressDetails(validMuxedAddress);
      muxedAddressDetails.should.deepEqual({
        baseAddress: validMuxedBaseAddress,
        address: validMuxedAddress,
        id: '1',
        memoId: undefined,
      });
    });

    it('verifyAddress should work', async function () {
      await basecoin.verifyAddress({
        address: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4',
        rootAddress: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4',
      });
      await basecoin.verifyAddress({
        address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=1',
        rootAddress: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2',
      });

      await basecoin.verifyAddress({
        address: validMuxedAddress,
        rootAddress: validMuxedBaseAddress,
      });

      assert.rejects(
        basecoin.verifyAddress({
          address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=243432',
          rootAddress: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4',
        })
      );

      assert.rejects(
        basecoin.verifyAddress({
          address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2=x',
          rootAddress: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2',
        })
      );

      assert.rejects(
        basecoin.verifyAddress({
          address: 'SBKGCMBY56MHTT4EGE3YJIYL4CPWKSGJ7VDEQF4J3B3YO576KNL7DOYJ',
        })
      );

      assert.rejects(
        basecoin.verifyAddress({
          address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8',
        })
      );
    });
  });

  it('should validate pub key', () => {
    const { pub } = basecoin.keychains().create();
    basecoin.isValidPub(pub).should.equal(true);
  });

  it('should validate root keypair', () => {
    const { pub, prv } = basecoin.keychains().create({ isRootKey: true });
    basecoin.isValidPub(pub).should.equal(true);
    basecoin.isValidPrv(prv).should.equal(true);
  });

  it('should validate stellar username', function () {
    basecoin.isValidStellarUsername('foo@bar.baz').should.equal(true);
    basecoin.isValidStellarUsername('foo_bar9.baz').should.equal(true);
    basecoin.isValidStellarUsername('foo+bar_9.baz').should.equal(true);
    basecoin.isValidStellarUsername('').should.equal(false);
    basecoin.isValidStellarUsername('foo bar.baz').should.equal(false); // whitespace is not allowed
    basecoin.isValidStellarUsername('Foo@bar.baz').should.equal(false); // only lowercase letters are allowed
  });

  it('Should explain an XLM transaction', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txBase64:
        'AAAAAMDHAbd3O7B2auR1e+EH/LRKe8IcQBOF+XP2lOxWi1PfAAAB9AAEvJEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB1RFU1RJTkcAAAAAAQAAAAAAAAABAAAAALgEl4p84728zfXtl/JdOsx3QbI97mcybqcXdfgdv54zAAAAAAAAAAEqBfIAAAAAAAAAAAFWi1PfAAAAQDoqo7juOBZawMlk8znIbYqSKemjgmINosp/P4+0SFGo/xJy1YgD6YEc65aWuyBxucFFBXCSlAxP2Z7nPMyjewM=',
    });
    signedExplanation.outputAmount.should.equal('5000000000');
    signedExplanation.outputAmounts.should.have.property('txlm', '5000000000');
    signedExplanation.outputs.length.should.equal(1);
    signedExplanation.outputs[0].address.should.equal('GC4AJF4KPTR33PGN6XWZP4S5HLGHOQNSHXXGOMTOU4LXL6A5X6PDH445');
    signedExplanation.outputs[0].amount.should.equal('5000000000');
    signedExplanation.outputs[0].coin.should.equal('txlm');
    signedExplanation.fee.fee.should.equal('500');
    signedExplanation.memo.value.should.equal('TESTING');
    signedExplanation.memo.type.should.equal('text');
    signedExplanation.changeOutputs.length.should.equal(0);
    signedExplanation.changeAmount.should.equal('0');
    const unsignedExplanation = await basecoin.explainTransaction({
      txBase64:
        'AAAAAMDHAbd3O7B2auR1e+EH/LRKe8IcQBOF+XP2lOxWi1PfAAAAZAAEvJEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAEAAAABAAAAAAAAAAEAAAAAuASXinzjvbzN9e2X8l06zHdBsj3uZzJupxd1+B2/njMAAAAAAAAAAlQL5AAAAAAAAAAAAA==',
    });
    unsignedExplanation.outputAmount.should.equal('10000000000');
    unsignedExplanation.outputAmounts.should.have.property('txlm', '10000000000');
    unsignedExplanation.outputs.length.should.equal(1);
    unsignedExplanation.outputs[0].address.should.equal('GC4AJF4KPTR33PGN6XWZP4S5HLGHOQNSHXXGOMTOU4LXL6A5X6PDH445');
    unsignedExplanation.outputs[0].amount.should.equal('10000000000');
    unsignedExplanation.outputs[0].coin.should.equal('txlm');
    unsignedExplanation.fee.fee.should.equal('100');
    unsignedExplanation.memo.value.should.equal('1');
    unsignedExplanation.memo.type.should.equal('id');
    unsignedExplanation.changeOutputs.length.should.equal(0);
    unsignedExplanation.changeAmount.should.equal('0');
  });

  it('Should explain an XLM transaction', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txBase64:
        'AAAAAMDHAbd3O7B2auR1e+EH/LRKe8IcQBOF+XP2lOxWi1PfAAAB9AAEvJEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB1RFU1RJTkcAAAAAAQAAAAAAAAABAAAAALgEl4p84728zfXtl/JdOsx3QbI97mcybqcXdfgdv54zAAAAAAAAAAEqBfIAAAAAAAAAAAFWi1PfAAAAQDoqo7juOBZawMlk8znIbYqSKemjgmINosp/P4+0SFGo/xJy1YgD6YEc65aWuyBxucFFBXCSlAxP2Z7nPMyjewM=',
    });
    signedExplanation.outputAmount.should.equal('5000000000');
    signedExplanation.outputAmounts.should.have.property('txlm', '5000000000');
    signedExplanation.outputs.length.should.equal(1);
    signedExplanation.outputs[0].address.should.equal('GC4AJF4KPTR33PGN6XWZP4S5HLGHOQNSHXXGOMTOU4LXL6A5X6PDH445');
    signedExplanation.outputs[0].amount.should.equal('5000000000');
    signedExplanation.outputs[0].coin.should.equal('txlm');
    signedExplanation.fee.fee.should.equal('500');
    signedExplanation.memo.value.should.equal('TESTING');
    signedExplanation.memo.type.should.equal('text');
    signedExplanation.changeOutputs.length.should.equal(0);
    signedExplanation.changeAmount.should.equal('0');
    const unsignedExplanation = await basecoin.explainTransaction({
      txBase64:
        'AAAAAMDHAbd3O7B2auR1e+EH/LRKe8IcQBOF+XP2lOxWi1PfAAAAZAAEvJEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAEAAAABAAAAAAAAAAEAAAAAuASXinzjvbzN9e2X8l06zHdBsj3uZzJupxd1+B2/njMAAAAAAAAAAlQL5AAAAAAAAAAAAA==',
    });
    unsignedExplanation.outputAmount.should.equal('10000000000');
    unsignedExplanation.outputAmounts.should.have.property('txlm', '10000000000');
    unsignedExplanation.outputs.length.should.equal(1);
    unsignedExplanation.outputs[0].address.should.equal('GC4AJF4KPTR33PGN6XWZP4S5HLGHOQNSHXXGOMTOU4LXL6A5X6PDH445');
    unsignedExplanation.outputs[0].amount.should.equal('10000000000');
    unsignedExplanation.outputs[0].coin.should.equal('txlm');
    unsignedExplanation.fee.fee.should.equal('100');
    unsignedExplanation.memo.value.should.equal('1');
    unsignedExplanation.memo.type.should.equal('id');
    unsignedExplanation.changeOutputs.length.should.equal(0);
    unsignedExplanation.changeAmount.should.equal('0');
  });

  it('Should explain an XLM transaction by passing in a hex format', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txHex:
        '0000000200000000aa0c5c593ed36af12269dc4605dd34da32fdab5c676fa0644f28e598dd57512a0000afc800000000009896810000000100000000000000000000000000000000000000000000000100000000000000010000010000000000000000010a76d14eccfd0072c997b12189beb926473ff0f01c72957432db5678b8feb945000000000000000005f5e1000000000000000000',
    });
    signedExplanation.outputAmount.should.equal('100000000');
    signedExplanation.outputAmounts.should.have.property('txlm', '100000000');
    signedExplanation.outputs.length.should.equal(1);
    signedExplanation.outputs[0].address.should.equal(
      'MAFHNUKOZT6QA4WJS6YSDCN6XETEOP7Q6AOHFFLUGLNVM6FY724UKAAAAAAAAAAAAEJCO'
    );
    signedExplanation.outputs[0].amount.should.equal('100000000');
    signedExplanation.outputs[0].coin.should.equal('txlm');
    signedExplanation.fee.fee.should.equal('45000');
    signedExplanation.changeOutputs.length.should.equal(0);
    signedExplanation.changeAmount.should.equal('0');
  });

  it('Should explain a trustline transaction', async function () {
    const explanation = await basecoin.explainTransaction({
      txBase64:
        'AAAAAIKWO6R0/V4oJDk2LZsdiEInIzgJ6L0GxmSU2Ffs8Y7ZAAABLAAIj4EAAAACAAAAAAAAAAAAAAABAAAAAAAAAAYAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAOjUpRAAAAAAAAAAAAA=',
    });
    explanation.outputAmount.should.equal('0');
    explanation.fee.fee.should.equal('300');
    explanation.memo.should.be.empty();
    explanation.changeOutputs.length.should.equal(0);
    explanation.changeAmount.should.equal('0');
    explanation.operations.length.should.equal(1);
    explanation.operations[0].limit.should.equal('1000000000000');
    explanation.operations[0].coin.should.equal('txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L');
    explanation.operations[0].type.should.equal('changeTrust');
    explanation.operations[0].should.have.property('asset');
    explanation.operations[0].asset.code.should.equal('BST');
    explanation.operations[0].asset.issuer.should.equal('GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L');
  });

  it('Should explain a token transaction', async function () {
    const explanation = await basecoin.explainTransaction({
      txBase64:
        'AAAAAIXpiGPR/Yc+gSN614hAf1N1hecXFL7Lac99olpq38K/AAAAZAAC9TAAAAAEAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAgpY7pHT9XigkOTYtmx2IQicjOAnovQbGZJTYV+zxjtkAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAAAdzWUAAAAAAAAAAAFq38K/AAAAQPJTLIGGY06BuVDw0ISasYwHZpR6V38CaOfGhSooclY+4IBE9JKdKuMyGNXXCcFxM/NxrX64jhBXk+lWvjjo4wY=',
    });
    explanation.outputAmount.should.equal('0');
    explanation.fee.fee.should.equal('100');
    explanation.memo.should.be.empty();
    explanation.changeOutputs.length.should.equal(0);
    explanation.changeAmount.should.equal('0');
    explanation.outputAmounts.should.have.property(
      'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
      '500000000'
    );
  });

  it('isValidMemoId should work', function () {
    basecoin.isValidMemo({ value: '1', type: 'id' }).should.equal(true);
    basecoin.isValidMemo({ value: 'uno', type: 'text' }).should.equal(true);
    const buffer = Buffer.alloc(32).fill(10);
    basecoin.isValidMemo({ value: buffer, type: 'hash' }).should.equal(true);
    basecoin.isValidMemo({ value: buffer.toString('hex'), type: 'hash' }).should.equal(true);
    basecoin.isValidMemo({ value: 1, type: 'id' }).should.equal(false);
    basecoin.isValidMemo({ value: 1, type: 'text' }).should.equal(false);
    basecoin.isValidMemo({ value: '1', type: 'hash' }).should.equal(false);
    basecoin.isValidMemo({ value: '1', type: 'return' }).should.equal(false);
  });

  it('should supplement wallet generation', async function () {
    const walletParams = await basecoin.supplementGenerateWallet({});
    walletParams.should.have.property('rootPrivateKey');
    basecoin.isValidPrv(walletParams.rootPrivateKey).should.equal(true);
  });

  it('should supplement wallet generation with provided private key', async function () {
    const rootPrivateKey = basecoin.generateKeyPair().prv;
    const walletParams = await basecoin.supplementGenerateWallet({ rootPrivateKey });
    walletParams.should.have.property('rootPrivateKey');
    walletParams.rootPrivateKey.should.equal(rootPrivateKey);
  });

  describe('deriveKeyWithSeed', function () {
    it('should derive key with seed', function () {
      (() => {
        basecoin.deriveKeyWithSeed('test');
      }).should.throw('method deriveKeyWithSeed not supported for eddsa curve');
    });
  });

  describe('Transaction Verification', function () {
    let basecoin;
    let wallet;
    let halfSignedTransaction;
    let rootKeyHalfSignedTransaction;

    const userKeychain = {
      pub: 'GA34NPQ4M54HHZBKSDZ5B3J3BZHTXKCZD4UFO2OYZERPOASK4DAATSIB',
      prv: 'SDADJSTZNIKF46NM7LE3ZHMX4TJ2VJBL7PTERNDLWHZ5U6KNO5S7XFJD',
    };
    const backupKeychain = {
      pub: 'GC3D3ZNNK7GHLMSWJA54DQO6QJUJJF7K6J5JGCEW45ZT6QMKZ6PMUHUM',
      prv: 'SA22TDBINLZMGYUDVXGUP2JMYIQ3DTJE53PNQUVCDK73XRS6TDVYU7WW',
    };
    // This key pair is the decoded version of the userKeychain above
    const rootKeychain = {
      pub: '37c6be1c677873e42a90f3d0ed3b0e4f3ba8591f285769d8c922f7024ae0c009',
      prv: 'c034ca796a145e79acfac9bc9d97e4d3aaa42bfbe648b46bb1f3da794d7765fb37c6be1c677873e42a90f3d0ed3b0e4f3ba8591f285769d8c922f7024ae0c009',
    };
    // This key pair is the decoded version of the backupKeychain above
    const backupRootKeychain = {
      pub: 'b63de5ad57cc75b256483bc1c1de82689497eaf27a930896e7733f418acf9eca',
      prv: '35a98c286af2c36283adcd47e92cc221b1cd24eeded852a21abfbbc65e98eb8ab63de5ad57cc75b256483bc1c1de82689497eaf27a930896e7733f418acf9eca',
    };

    const prebuild = {
      txBase64:
        'AAAAAGRnXg19FteG/7zPd+jDC7LDvRlzgfFC+JrPhRep0kYiAAAAZAB/4cUAAAACAAAAAAAAAAAAAAABAAAAAQAAAABkZ14NfRbXhv+8z3fowwuyw70Zc4HxQviaz4UXqdJGIgAAAAEAAAAAmljT/+FedddnAHwo95dOC4RNy6eVLSehaJY34b9GxuYAAAAAAAAAAAehIAAAAAAAAAAAAA==',
      txInfo: {
        fee: 100,
        sequence: '35995558267060226',
        source: 'GBSGOXQNPULNPBX7XTHXP2GDBOZMHPIZOOA7CQXYTLHYKF5J2JDCF7LT',
        operations: [
          {
            amount: '12.8', // 12.8 XLM
            asset: { code: 'XLM' },
            destination: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
            type: 'payment',
          },
        ],
        signatures: [],
      },
      feeInfo: {
        height: 123456,
        xlmBaseFee: '100',
        xlmBaseReserve: '5000000',
      },
      walletId: '5a78dd561c6258a907f1eeaee132f796',
    };
    const signedTxBase64 =
      'AAAAAGRnXg19FteG/7zPd+jDC7LDvRlzgfFC+JrPhRep0kYiAAAAZAB/4cUAAAACAAAAAAAAAAAAAAABAAAAAQAAAABkZ14NfRbXhv+8z3fowwuyw70Zc4HxQviaz4UXqdJGIgAAAAEAAAAAmljT/+FedddnAHwo95dOC4RNy6eVLSehaJY34b9GxuYAAAAAAAAAAAehIAAAAAAAAAAAAUrgwAkAAABAOExcvVJIUJv9HuVfbV0y7lRPRARv4wDtcdhHG7QN40h5wQ2uwPF52OGQ8KY+66a1A/8lNKB75sgj2xj44s8lDQ==';

    before(function () {
      basecoin = bitgo.coin('txlm');
      const walletData = {
        id: '5a78dd561c6258a907f1eeaee132f796',
        users: [
          {
            user: '543c11ed356d00cb7600000b98794503',
            permissions: ['admin', 'view', 'spend'],
          },
        ],
        coin: 'txlm',
        label: 'Verification Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a78dd56bfe424aa07aa068651b194fd',
          '5a78dd5674a70eb4079f58797dfe2f5e',
          '5a78dd561c6258a907f1eea9f1d079e2',
        ],
        tags: ['5a78dd561c6258a907f1eeaee132f796'],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        clientFlags: [],
        balance: 650000000,
        confirmedBalance: 650000000,
        spendableBalance: 650000000,
        balanceString: '650000000',
        confirmedBalanceString: '650000000',
        spendableBalanceString: '650000000',
        receiveAddress: {
          id: '5a78de2bbfe424aa07aa131ec03c8dc1',
          address: 'GBSGOXQNPULNPBX7XTHXP2GDBOZMHPIZOOA7CQXYTLHYKF5J2JDCF7LT',
          chain: 0,
          index: 0,
          coin: 'txlm',
          wallet: '5a78dd561c6258a907f1eeaee132f796',
          coinSpecific: {},
        },
        pendingApprovals: [],
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    });

    it('should sign a prebuild', async function () {
      // sign transaction
      halfSignedTransaction = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: userKeychain.prv,
      });
      halfSignedTransaction.halfSigned.txBase64.should.equal(signedTxBase64);
    });

    it('should sign a prebuild with root key', async function () {
      rootKeyHalfSignedTransaction = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: rootKeychain.prv,
      });
      rootKeyHalfSignedTransaction.halfSigned.txBase64.should.equal(signedTxBase64);
    });

    it('should sign a transaction with generated root key pair', async function () {
      const seed = Buffer.from(rootKeychain.prv.slice(0, 64), 'hex');
      const kp = basecoin.generateRootKeyPair(seed);
      kp.prv.length.should.equal(128);
      const halfSignedTx = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: kp.prv,
      });
      halfSignedTx.halfSigned.txBase64.should.equal(signedTxBase64);
    });

    it('should verify the user signature on a tx', function () {
      const userPub = userKeychain.pub;
      const tx = new stellar.Transaction(halfSignedTransaction.halfSigned.txBase64, stellar.Networks.TESTNET);
      const validSignature = basecoin.verifySignature(userPub, tx.hash(), tx.signatures[0].signature());
      validSignature.should.equal(true);
    });

    it('should verify the user signature on a tx given root key', function () {
      const rootPub = rootKeychain.pub;
      const tx = new stellar.Transaction(rootKeyHalfSignedTransaction.halfSigned.txBase64, stellar.Networks.TESTNET);
      const validSignature = basecoin.verifySignature(rootPub, tx.hash(), tx.signatures[0].signature());
      validSignature.should.equal(true);
    });

    it('should fail to verify the wrong signature on a tx', function () {
      const keyPair = basecoin.generateKeyPair();
      const tx = new stellar.Transaction(halfSignedTransaction.halfSigned.txBase64, stellar.Networks.TESTNET);
      const validSignature = basecoin.verifySignature(keyPair.pub, tx.hash(), tx.signatures[0].signature());
      validSignature.should.equal(false);
    });

    it('should fail to verify the wrong signature on a tx given root key', function () {
      const keyPair = basecoin.generateRootKeyPair();
      const tx = new stellar.Transaction(rootKeyHalfSignedTransaction.halfSigned.txBase64, stellar.Networks.TESTNET);
      const validSignature = basecoin.verifySignature(keyPair.pub, tx.hash(), tx.signatures[0].signature());
      validSignature.should.equal(false);
    });

    it('should create a recovery transaction', async function () {
      const destinationAddress = 'GDDHCKMYYYCVXOSAVMSEIYGYNX74LIAV3ACXYQ6WPMDUF7W3KZNWTHTH';
      nock('https://horizon-testnet.stellar.org/accounts')
        .get('/' + wallet.receiveAddress())
        .reply(200, {
          sequence: '35995558267060226',
          balances: [
            {
              asset_type: 'native',
              balance: '6500000000',
            },
          ],
        });

      nock('https://horizon-testnet.stellar.org/accounts')
        .get('/' + destinationAddress)
        .reply(200, {
          sequence: '35995558267060213',
          balances: 13131313,
        });

      nock('https://horizon-testnet.stellar.org')
        .get('/ledgers')
        .query({
          order: 'desc',
          limit: 1,
        })
        .reply(200, {
          records: [
            {
              base_reserve_in_stroops: '5000000',
              base_fee_in_stroops: 100,
            },
          ],
        })
        .persist();

      const recovery = await basecoin.recover({
        userKey: 'GA34NPQ4M54HHZBKSDZ5B3J3BZHTXKCZD4UFO2OYZERPOASK4DAATSIB',
        backupKey: 'GC3D3ZNNK7GHLMSWJA54DQO6QJUJJF7K6J5JGCEW45ZT6QMKZ6PMUHUM',
        recoveryDestination: destinationAddress,
        rootAddress: wallet.receiveAddress(),
      });
      should.exist(recovery.txBase64);
      should.exist(recovery.feeInfo);
      recovery.coin.should.equal('txlm');
      recovery.txBase64.should.be.a.String();
      recovery.recoveryAmount.should.be.a.Number();
      recovery.feeInfo.fee.should.equal(100);
    });

    it('should fail to verify a transaction signed with the wrong key', async function () {
      // sign transaction
      const tx = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv,
      });

      const txParams = {
        recipients: [
          {
            address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
            amount: '128000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('transaction signed with wrong key');
    });

    it('should fail to verify a transaction signed with the wrong root key', async function () {
      // sign transaction
      const tx = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupRootKeychain.prv,
      });

      const txParams = {
        recipients: [
          {
            address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
            amount: '128000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: rootKeychain.pub },
          backup: { pub: backupRootKeychain.pub },
        },
      };
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('transaction signed with wrong key');
    });

    it('should fail to verify a transaction to the wrong recipient', async function () {
      // sign transaction
      const tx = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv,
      });

      const txParams = {
        recipients: [
          {
            address: 'GAK3NSB43EVCZKDH4PYGJPCVPOYZ7X7KIR3ZTWSYRKRMJWGG5TABM6TH',
            amount: '128000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('transaction prebuild does not match expected recipient');
    });

    it('should fail to verify a transaction with the wrong amount', async function () {
      // sign transaction
      const tx = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv,
      });

      const txParams = {
        recipients: [
          {
            address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
            amount: '130000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('transaction prebuild does not match expected amount');
    });

    it('should fail to verify a transaction without recipients', async function () {
      const prebuilt = {
        txBase64:
          'AAAAAP1qe44j+i4uIT+arbD4QDQBt8ryEeJd7a0jskQ3nwDeAAAAAAB/4cUAAAACAAAAAAAAAAIAAAAAAAAAAQAAAAAAAAAAAAAAAA==',
        txInfo: {
          fee: 0,
          sequence: '35995558267060226',
          source: 'GD6WU64OEP5C4LRBH6NK3MHYIA2ADN6K6II6EXPNVUR3ERBXT4AN4ACD',
          operations: [],
          signatures: [],
        },
        feeInfo: {
          height: 123456,
          xlmBaseFee: '100',
          xlmBaseReserve: '5000000',
        },
        walletId: '5a78dd561c6258a907f1eeaee132f796',
      };

      const keyPair = {
        pub: 'GAA4LVBE2HEKECNWDRT2NLTSBWFIZRGTEQFC7BLOREMMPNDHFRUGP3VZ',
        prv: 'SCIVSTUJX7SYJZHKMJI4YF7YWA27FU7XN5EH4OWBFL2Y2KTYI7IP2DFZ',
      };

      // sign transaction
      const tx = await wallet.signTransaction({
        txPrebuild: prebuilt,
        prv: keyPair.prv,
      });

      const txParams = {
        recipients: [
          {
            address: 'GAUKA3ZTH3DZ6THBCPL6AOQBCEEBIFYDU4FGXUCHOC7PILXGUPTUBJ6E',
            amount: '130000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('transaction prebuild does not have any operations');
    });

    it('should verify a transaction', async function () {
      const txParams = {
        recipients: [
          {
            address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
            amount: '128000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: halfSignedTransaction.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });

    it('should verify a transaction has recipient having memo', async function () {
      const txParams = {
        recipients: [
          {
            address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY?memoId=1234567890',
            amount: '128000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: halfSignedTransaction.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });

    it('should verify a transaction with root key', async function () {
      const txParams = {
        recipients: [
          {
            address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
            amount: '128000000',
          },
        ],
      };
      const txPrebuild = {
        txBase64: rootKeyHalfSignedTransaction.halfSigned.txBase64,
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: rootKeychain.pub },
          backup: { pub: backupRootKeychain.pub },
        },
      };
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });

    describe('trustline transactions', function () {
      it('should fail to verify a trustline transaction with unmatching number of trustlines', async function () {
        const txParams = {
          recipients: [],
          type: 'trustline',
          trustlines: [],
        };

        const buildResult = {
          txBase64:
            'AAAAANsKrHV2BVjACFt2xlyhxYzP2MNBmb4IQ5E9/WiJiV3TAAABLAAM4aEAAAAHAAAAAAAAAAAAAAABAAAAAAAAAAYAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAOjUpRAAAAAAAAAAAAA=',
        };

        nock(uri).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`).reply(200, buildResult);

        const txPrebuild = await wallet.prebuildTransaction(txParams);
        const verification = {
          disableNetworking: true,
          keychains: {
            user: { pub: userKeychain.pub },
            backup: { pub: backupKeychain.pub },
          },
        };
        await basecoin
          .verifyTransaction({ txParams, txPrebuild, wallet, verification })
          .should.be.rejectedWith('transaction prebuild does not match expected trustline operations');
      });

      it('should fail to verify a trustline transaction with unmatching trustlines', async function () {
        const txParams = {
          type: 'trustline',
          recipients: [],
          trustlines: [
            {
              token: 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
              action: 'remove',
            },
          ],
        };

        const buildResult = {
          txBase64:
            'AAAAANsKrHV2BVjACFt2xlyhxYzP2MNBmb4IQ5E9/WiJiV3TAAABLAAM4aEAAAAHAAAAAAAAAAAAAAABAAAAAAAAAAYAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAOjUpRAAAAAAAAAAAAA=',
        };

        nock(uri).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`).reply(200, buildResult);

        const txPrebuild = await wallet.prebuildTransaction(txParams);
        const verification = {
          disableNetworking: true,
          keychains: {
            user: { pub: userKeychain.pub },
            backup: { pub: backupKeychain.pub },
          },
        };
        await basecoin
          .verifyTransaction({ txParams, txPrebuild, wallet, verification })
          .should.be.rejectedWith('transaction prebuild does not match expected trustline tokens');
      });

      it('should fail to verify a trustline transaction with unmatching limit', async function () {
        const txParams = {
          type: 'trustline',
          recipients: [],
          trustlines: [
            {
              token: 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
              action: 'add',
              limit: '999',
            },
          ],
        };

        const buildResult = {
          txBase64:
            'AAAAANsKrHV2BVjACFt2xlyhxYzP2MNBmb4IQ5E9/WiJiV3TAAABLAAM4aEAAAAHAAAAAAAAAAAAAAABAAAAAAAAAAYAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAOjUpRAAAAAAAAAAAAA=',
        };

        nock(uri).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`).reply(200, buildResult);

        const txPrebuild = await wallet.prebuildTransaction(txParams);
        const verification = {
          disableNetworking: true,
          keychains: {
            user: { pub: userKeychain.pub },
            backup: { pub: backupKeychain.pub },
          },
        };
        await basecoin
          .verifyTransaction({ txParams, txPrebuild, wallet, verification })
          .should.be.rejectedWith('transaction prebuild does not match expected trustline tokens');
      });

      it('should verify a trustline transaction', async function () {
        const txParams = {
          type: 'trustline',
          recipients: [],
          trustlines: [
            {
              token: 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
              action: 'add',
              limit: '1000000000000',
            },
            {
              token: 'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
              action: 'remove',
            },
          ],
        };

        const buildResult = {
          txBase64:
            'AAAAANsKrHV2BVjACFt2xlyhxYzP2MNBmb4IQ5E9/WiJiV3TAAAAyAAM4aEAAAAJAAAAAAAAAAAAAAACAAAAAAAAAAYAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAOjUpRAAAAAAAAAAAAYAAAABVFNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAAAAAAAAAAAAAAAAAAA=',
        };

        nock(uri).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`).reply(200, buildResult);

        const txPrebuild = await wallet.prebuildTransaction(txParams);
        const verification = {
          disableNetworking: true,
          keychains: {
            user: { pub: userKeychain.pub },
            backup: { pub: backupKeychain.pub },
          },
        };
        const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
        validTransaction.should.equal(true);
      });
    });

    describe('enabletoken transactions', function () {
      it('should fail to verify a enbletoken transaction with unmatching number of token', async function () {
        const txParams = {
          recipients: [],
          type: 'enabletoken',
        };

        const buildResult = {
          txBase64:
            'AAAAANsKrHV2BVjACFt2xlyhxYzP2MNBmb4IQ5E9/WiJiV3TAAABLAAM4aEAAAAHAAAAAAAAAAAAAAABAAAAAAAAAAYAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAOjUpRAAAAAAAAAAAAA=',
        };

        nock(uri).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`).reply(200, buildResult);

        const txPrebuild = await wallet.prebuildTransaction(txParams);
        const verification = {
          disableNetworking: true,
          keychains: {
            user: { pub: userKeychain.pub },
            backup: { pub: backupKeychain.pub },
          },
        };
        await basecoin
          .verifyTransaction({ txParams, txPrebuild, wallet, verification })
          .should.be.rejectedWith('transaction prebuild does not match expected trustline operations');
      });

      it('should fail to verify a enbletoken transaction with unmatching token', async function () {
        const txParams = {
          type: 'enabletoken',
          recipients: [
            {
              token: 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
              amount: 0,
              address: '',
            },
          ],
        };

        const buildResult = {
          txBase64:
            'AAAAANsKrHV2BVjACFt2xlyhxYzP2MNBmb4IQ5E9/WiJiV3TAAABLAAM4aEAAAAHAAAAAAAAAAAAAAABAAAAAAAAAAYAAAABQlNUAAAAAABhNDpbuY4frrgwVQqkws7jxK+k4IMrJ6BaE0OFUva9vwAAAOjUpRAAAAAAAAAAAAA=',
        };

        nock(uri).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`).reply(200, buildResult);

        const txPrebuild = await wallet.prebuildTransaction(txParams);
        const verification = {
          disableNetworking: true,
          keychains: {
            user: { pub: userKeychain.pub },
            backup: { pub: backupKeychain.pub },
          },
        };
        await basecoin
          .verifyTransaction({ txParams, txPrebuild, wallet, verification })
          .should.be.rejectedWith('transaction prebuild does not match expected trustline tokens');
      });
    });
  });

  describe('Federation lookups:', function () {
    describe('Look up by stellar address:', function () {
      it('should fail to loop up an invalid stellar address with a bitgo.com domain', async function () {
        const stellarAddress = 'invalid*bitgo.com';

        nock(uri)
          .get('/.well-known/stellar.toml')
          .reply(200, 'FEDERATION_SERVER="https://test.bitgo.com/api/v2/txlm/federation"')
          .get('/api/v2/txlm/federation')
          .query({
            q: stellarAddress,
            type: 'name',
          })
          .reply(404, {
            detail: `user not found: ${stellarAddress}`,
            name: 'UserNotFound',
          });

        await basecoin
          .federationLookupByName(stellarAddress)
          .should.be.rejectedWith(`user not found: ${stellarAddress}`);
      });

      it('should resolve a stellar address into an account', async function () {
        const stellarAddress = 'tester*bitgo.com';
        const accountId = 'GCBYY3S62QY43PMEKGJHRCBHEFJOHCLGSMWXREUZYDQHJHQ2LK4I42JA';

        nock(uri)
          .get('/.well-known/stellar.toml')
          .reply(200, 'FEDERATION_SERVER="https://test.bitgo.com/api/v2/txlm/federation"')
          .get('/api/v2/txlm/federation')
          .query({
            q: stellarAddress,
            type: 'name',
          })
          .reply(200, {
            stellar_address: stellarAddress,
            account_id: accountId,
          });

        const res = await basecoin.federationLookupByName(stellarAddress);
        res.should.have.property('stellar_address');
        res.should.have.property('account_id');
        res.stellar_address.should.equal(stellarAddress);
        res.account_id.should.equal(accountId);
      });
    });

    describe('Look up by account id:', function () {
      it('should fail to look up an account if the account id is invalid', async function () {
        const accountId = '123';

        nock(uri)
          .get('/api/v2/txlm/federation')
          .query({
            q: accountId,
            type: 'id',
          })
          .reply(400, {
            detail: 'invalid id: ' + accountId,
          });

        await basecoin.federationLookupByAccountId(accountId).should.be.rejectedWith(`invalid id: ${accountId}`);
      });

      it('should return only account_id for non-bitgo accounts', async function () {
        const accountId = 'GCROXHYJSTCS3CQQIU7GFC7YQIRIVGPYZQRZEM6PN7P7TAZ3PU4CHJRG';

        nock(uri)
          .get('/api/v2/txlm/federation')
          .query({
            q: accountId,
            type: 'id',
          })
          .reply(200, {
            account_id: accountId,
          });

        const res = await basecoin.federationLookupByAccountId(accountId);
        res.should.not.have.property('stellar_address');
        res.should.not.have.property('memo_type');
        res.should.not.have.property('memo');
        res.should.have.property('account_id');
        res.account_id.should.equal(accountId);
      });

      it('should resolve a valid account id into an account', async function () {
        const accountId = 'GDDHCKMYYYCVXOSAVMSEIYGYNX74LIAV3ACXYQ6WPMDUF7W3KZNWTHTH';

        nock(uri)
          .get('/api/v2/txlm/federation')
          .query({
            q: accountId,
            type: 'id',
          })
          .reply(200, {
            stellar_address: 'tester*bitgo.com',
            account_id: accountId,
            memo_type: 'id',
            memo: '0',
          });

        const res = await basecoin.federationLookupByAccountId(accountId);
        res.should.have.property('stellar_address');
        res.should.have.property('account_id');
        res.should.have.property('memo_type');
        res.should.have.property('memo');
        res.account_id.should.equal(accountId);
        res.stellar_address.should.equal('tester*bitgo.com');
      });
    });
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      const address = keyPair.pub;
      basecoin.isValidAddress(address).should.equal(true);

      basecoin.isValidPub(keyPair.pub).should.equal(true);
      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });

    it('should generate a keypair from seed', function () {
      const seed = randomBytes(32);
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      const address = keyPair.pub;
      basecoin.isValidAddress(address).should.equal(true);

      basecoin.isValidPub(keyPair.pub).should.equal(true);
      basecoin.isValidPrv(keyPair.prv).should.equal(true);

      const secret = keyPair.prv;
      stellar.StrKey.encodeEd25519SecretSeed(seed).should.equal(secret);
    });

    it('should validate pub key', () => {
      const { pub } = basecoin.keychains().create();
      basecoin.isValidPub(pub).should.equal(true);
    });
  });

  describe('Generate wallet Root key pair: ', () => {
    it('should generate a root keypair from random seed', function () {
      const kp = basecoin.generateRootKeyPair();
      basecoin.isValidPub(kp.pub).should.equal(true);

      const keyPair = new KeyPair({ prv: kp.prv }).getKeys(true);
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
      keyPair.prv?.should.equal(kp.prv.slice(0, 64));
      keyPair.pub.should.equal(kp.pub);
    });

    it('should generate a root keypair from seed', function () {
      const seed = Buffer.from('761de570c460792f10378a8b3c7cc2283241db37d8dac13dbdd8095a05ea00b2', 'hex');
      const kp = basecoin.generateRootKeyPair(seed);
      basecoin.isValidPub(kp.pub).should.equal(true);
      kp.pub.should.equal('7fe4254baaeebfefd5a632fdb71aa9ec63aa611bcd392b07a759a4b21307b7fc');
      kp.prv.should.equal(
        '761de570c460792f10378a8b3c7cc2283241db37d8dac13dbdd8095a05ea00b27fe4254baaeebfefd5a632fdb71aa9ec63aa611bcd392b07a759a4b21307b7fc'
      );

      const keyPair = new KeyPair({ prv: kp.prv }).getKeys(true);
      keyPair.should.have.property('prv');
      keyPair.prv?.should.equal(kp.prv.slice(0, 64));
      keyPair.pub.should.equal(kp.pub);
    });
  });

  describe('AuditKey', () => {
    const { key } = xlmBackupKey;
    const walletPassphrase = 'kAm[EFQ6o=SxlcLFDw%,';

    it('should return for valid inputs', () => {
      basecoin.assertIsValidKey({
        encryptedPrv: key,
        walletPassphrase,
      });
    });

    it('should throw error if the walletPassphrase is incorrect', () => {
      assert.throws(
        () =>
          basecoin.assertIsValidKey({
            encryptedPrv: key,
            walletPassphrase: 'foo',
          }),
        {
          message: "failed to decrypt prv: ccm: tag doesn't match",
        }
      );
    });

    it('should throw error if the key is altered', () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      assert.throws(
        () =>
          basecoin.assertIsValidKey({
            encryptedPrv: alteredKey,
            walletPassphrase,
          }),
        {
          message: 'failed to decrypt prv: json decrypt: invalid parameters',
        }
      );
    });

    it('should return { isValid: false } if the key is not a valid key', () => {
      const invalidKey = '#@)$#($*@)#($*';
      const encryptedPrv = encrypt(walletPassphrase, invalidKey);
      assert.throws(
        () =>
          basecoin.assertIsValidKey({
            encryptedPrv,
            walletPassphrase,
          }),
        {
          message: 'Invalid private key: Unable to generate keypair from prv',
        }
      );
    });
  });
});
