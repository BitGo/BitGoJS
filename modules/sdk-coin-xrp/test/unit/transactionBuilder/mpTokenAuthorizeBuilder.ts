import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/xrp';
import { getMptBuilderFactory } from '../getBuilderFactory';

describe('XRP MPTAuthorize Builder', () => {
  const factory = getMptBuilderFactory(testData.MPT_ISSUANCE_ID);

  const sender = utils.getAddressDetails(testData.TEST_MULTI_SIG_ACCOUNT.address).address;

  describe('build', () => {
    it('should build a valid MPTokenAuthorize transaction', async () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      should.equal(utils.isValidRawTransaction(rawTx), true);

      const txJson = tx.toJson();
      txJson.transactionType.should.equal('MPTokenAuthorize');
      txJson.from.should.equal(sender);
      should.exist(txJson.mptIssuanceId);
      (txJson.mptIssuanceId as string).toUpperCase().should.equal(testData.MPT_ISSUANCE_ID.toUpperCase());
      should.not.exist(txJson.mptAmount);
    });

    it('should not include Holder field for holder self-authorization', async () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      // Verify via toJson — Holder is Phase 2 only, absent for self-auth
      const txJson = tx.toJson();
      should.not.exist((txJson as Record<string, unknown>).holder);
      should.equal(utils.isValidRawTransaction(tx.toBroadcastFormat()), true);
    });

    it('should include Holder field when set (issuer-side authorization)', async () => {
      const holderAddress = testData.TEST_SINGLE_SIG_ACCOUNT.address;

      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.mptHolder(holderAddress);
      builder.sequence(1600001);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      should.equal(utils.isValidRawTransaction(tx.toBroadcastFormat()), true);
      // mptHolder must appear in toJson() so initBuilder() can restore it on round-trip
      const txJson = tx.toJson();
      should.exist(txJson.mptHolder);
      txJson.mptHolder!.should.equal(holderAddress);
    });

    it('should build a zero-value authorization (no amount field)', async () => {
      // MPTokenAuthorize carries no amount — the holder's initial MPTAmount is
      // implicitly zero on-chain (XRPL sparse encoding omits zero-value fields).
      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const txJson = tx.toJson();

      should.not.exist(txJson.mptAmount);
      should.not.exist((txJson as Record<string, unknown>).amount);
      should.equal(utils.isValidRawTransaction(tx.toBroadcastFormat()), true);
    });

    it('should set the correct internal TransactionType', async () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      tx.type.should.equal(TransactionType.MPTokenAuthorize);
    });
  });

  describe('round-trip: build → serialize → deserialize', () => {
    it('should rebuild correctly from raw unsigned transaction', async () => {
      const holderAddress = testData.TEST_SINGLE_SIG_ACCOUNT.address;

      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.mptHolder(holderAddress);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      const rebuiltJson = rebuiltTx.toJson();

      rebuiltTx.type.should.equal(TransactionType.MPTokenAuthorize);
      rebuiltJson.transactionType.should.equal('MPTokenAuthorize');
      rebuiltJson.from.should.equal(sender);
      should.exist(rebuiltJson.mptIssuanceId);
      (rebuiltJson.mptIssuanceId as string).toUpperCase().should.equal(testData.MPT_ISSUANCE_ID.toUpperCase());
      // mptHolder must survive the full serialize → deserialize round-trip
      should.exist(rebuiltJson.mptHolder);
      rebuiltJson.mptHolder!.should.equal(holderAddress);
    });

    it('should sign correctly after rebuild (multi-sig)', async () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      const rebuilder = factory.from(rawTx);
      rebuilder.setMultiSig();
      rebuilder.sign({ key: testData.SIGNER_USER.prv });
      rebuilder.sign({ key: testData.SIGNER_BITGO.prv });
      const signedTx = await rebuilder.build();

      should.equal(utils.isValidRawTransaction(signedTx.toBroadcastFormat()), true);
    });
  });

  describe('input validation', () => {
    it('should throw if sender is missing', async () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.mptIssuanceId(testData.MPT_ISSUANCE_ID);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      await builder.build().should.be.rejectedWith(/missing sender/);
    });

    it('should throw if MPTokenIssuanceID is missing', async () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      builder.sender(sender);
      builder.sequence(1600000);
      builder.fee('12');
      builder.flags(2147483648);

      await builder.build().should.be.rejectedWith(/MPTokenIssuanceID must be set/);
    });

    it('should throw if MPTokenIssuanceID is fewer than 48 hex chars', () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      should(() => builder.mptIssuanceId('00AABB')).throw(/48-character hex/);
    });

    it('should throw if MPTokenIssuanceID contains non-hex characters', () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      // 48 chars but not valid hex
      const notHex = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ';
      should(() => builder.mptIssuanceId(notHex)).throw(/48-character hex/);
    });

    it('should throw if MPTokenIssuanceID is more than 48 hex chars', () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      // Valid hex, but 50 chars
      should(() => builder.mptIssuanceId(testData.MPT_ISSUANCE_ID + 'FF')).throw(/48-character hex/);
    });

    it('should throw if mptHolder receives an invalid XRP address', () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      should(() => builder.mptHolder('not-a-valid-xrp-address')).throw(/Invalid holder address/);
    });

    it('should not throw if mptHolder receives a valid XRP address', () => {
      const builder = factory.getMPTokenAuthorizeBuilder();
      should(() => builder.mptHolder(testData.TEST_SINGLE_SIG_ACCOUNT.address)).not.throw();
    });
  });
});
