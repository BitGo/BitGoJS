import 'should';
import assert from 'assert';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Bsc, Tbsc } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Native BNB', function () {
  before(function () {
    bitgo.safeRegister('bsc', Bsc.createInstance);
    bitgo.safeRegister('tbsc', Tbsc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for bsc', function () {
      const bsc = bitgo.coin('bsc');

      bsc.should.be.an.instanceof(Bsc);
      bsc.getChain().should.equal('bsc');
      bsc.getFamily().should.equal('bsc');
      bsc.getFullName().should.equal('Native BNB');
      bsc.getBaseFactor().should.equal(1e18);
      bsc.supportsTss().should.equal(true);
      bsc.allowsAccountConsolidations().should.equal(true);
    });

    it('should return the right info for tbsc', function () {
      const tbsc = bitgo.coin('tbsc');

      tbsc.should.be.an.instanceof(Tbsc);
      tbsc.getChain().should.equal('tbsc');
      tbsc.getFamily().should.equal('bsc');
      tbsc.getFullName().should.equal('Testnet Native BNB');
      tbsc.getBaseFactor().should.equal(1e18);
      tbsc.supportsTss().should.equal(true);
      tbsc.allowsAccountConsolidations().should.equal(true);
    });
  });

  describe('verifyTssTransaction', function () {
    let bsc: Bsc;

    before(function () {
      bsc = bitgo.coin('bsc') as Bsc;
    });

    const baseTxPrebuild = { txHex: '0xdeadbeef' } as any;
    const baseWallet = {} as any;

    it('returns true immediately when skipTssRecipientVerification is true', async function () {
      const result = await bsc.verifyTssTransaction({
        txParams: {} as any,
        txPrebuild: baseTxPrebuild,
        wallet: baseWallet,
        verification: { skipTssRecipientVerification: true },
      });
      assert.strictEqual(result, true);
    });

    it('throws when no recipients and skipTssRecipientVerification is false', async function () {
      await assert.rejects(
        () =>
          bsc.verifyTssTransaction({
            txParams: {} as any,
            txPrebuild: baseTxPrebuild,
            wallet: baseWallet,
            verification: { skipTssRecipientVerification: false },
          }),
        /missing txParams/
      );
    });

    it('throws when no recipients and verification is not set', async function () {
      await assert.rejects(
        () =>
          bsc.verifyTssTransaction({
            txParams: {} as any,
            txPrebuild: baseTxPrebuild,
            wallet: baseWallet,
          }),
        /missing txParams/
      );
    });

    it('returns true for exempt type without skipTssRecipientVerification', async function () {
      const result = await bsc.verifyTssTransaction({
        txParams: { type: 'delegate' } as any,
        txPrebuild: baseTxPrebuild,
        wallet: baseWallet,
      });
      assert.strictEqual(result, true);
    });

    it('returns true when recipients are present without flag', async function () {
      const result = await bsc.verifyTssTransaction({
        txParams: { recipients: [{ address: '0xabc', amount: '100' }] } as any,
        txPrebuild: baseTxPrebuild,
        wallet: baseWallet,
      });
      assert.strictEqual(result, true);
    });

    it('still throws missing params when wallet is missing even with skipTssRecipientVerification', async function () {
      await assert.rejects(
        () =>
          bsc.verifyTssTransaction({
            txParams: {} as any,
            txPrebuild: baseTxPrebuild,
            wallet: undefined as any,
            verification: { skipTssRecipientVerification: true },
          }),
        /missing params/
      );
    });

    it('still throws missing params when txPrebuild is missing even with skipTssRecipientVerification', async function () {
      await assert.rejects(
        () =>
          bsc.verifyTssTransaction({
            txParams: {} as any,
            txPrebuild: undefined as any,
            wallet: baseWallet,
            verification: { skipTssRecipientVerification: true },
          }),
        /missing params/
      );
    });

    it('still throws hop error even with skipTssRecipientVerification', async function () {
      await assert.rejects(
        () =>
          bsc.verifyTssTransaction({
            txParams: {
              hop: true,
              recipients: [
                { address: '0xabc', amount: '100' },
                { address: '0xdef', amount: '200' },
              ],
            } as any,
            txPrebuild: baseTxPrebuild,
            wallet: baseWallet,
            verification: { skipTssRecipientVerification: true },
          }),
        /tx cannot be both a batch and hop transaction/
      );
    });

    it('skips recipient check but passes other validation with skipTssRecipientVerification', async function () {
      const result = await bsc.verifyTssTransaction({
        txParams: {} as any,
        txPrebuild: baseTxPrebuild,
        wallet: baseWallet,
        verification: { skipTssRecipientVerification: true },
      });
      assert.strictEqual(result, true);
    });
  });
});
