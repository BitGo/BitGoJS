import { coins } from '@bitgo/statics';
import { MessageStandardType } from '@bitgo/sdk-core';
import { MessageBuilderFactory, GroupPolicyMessage, GroupPolicyMessageBuilder } from '../../../src/lib';
import should = require('should');

describe('HASH GroupPolicy Message', function () {
  const hashCoinConfig = coins.get('hash');

  describe('MessageBuilderFactory', function () {
    it('should return a GroupPolicyMessageBuilder for GROUP_POLICY type', function () {
      const factory = new MessageBuilderFactory(hashCoinConfig);
      const builder = factory.getMessageBuilder(MessageStandardType.GROUP_POLICY);
      builder.should.be.instanceof(GroupPolicyMessageBuilder);
    });

    it('should throw for unsupported message standard types', function () {
      const factory = new MessageBuilderFactory(hashCoinConfig);
      should.throws(
        () => factory.getMessageBuilder(MessageStandardType.EIP191),
        /not supported/,
      );
    });
  });

  describe('GroupPolicyMessageBuilder', function () {
    it('should build a GroupPolicyMessage', async function () {
      const factory = new MessageBuilderFactory(hashCoinConfig);
      const builder = factory.getMessageBuilder(MessageStandardType.GROUP_POLICY);

      const payload = 'test group policy vote payload';
      builder.setPayload(payload);
      builder.addSigner('pb1testaddress123');

      const message = await builder.build();
      message.should.be.instanceof(GroupPolicyMessage);
      message.getType().should.equal(MessageStandardType.GROUP_POLICY);
    });
  });

  describe('GroupPolicyMessage', function () {
    it('should return raw bytes as signable payload', async function () {
      const payload = 'vote on group policy';
      const message = new GroupPolicyMessage({
        coinConfig: hashCoinConfig,
        payload,
      });

      const signablePayload = await message.getSignablePayload();
      Buffer.isBuffer(signablePayload).should.be.true();
      (signablePayload as Buffer).toString().should.equal(payload);
    });

    it('should throw when payload is missing', async function () {
      const message = new GroupPolicyMessage({
        coinConfig: hashCoinConfig,
        payload: '',
      });

      await message.getSignablePayload().should.be.rejectedWith(/payload is required/);
    });

    it('should serialize to broadcast string', async function () {
      const payload = 'provenance group policy message';
      const message = new GroupPolicyMessage({
        coinConfig: hashCoinConfig,
        payload,
      });
      message.addSigner('pb1testaddress123');

      const broadcastStr = await message.toBroadcastString();
      broadcastStr.should.be.a.String();
      broadcastStr.length.should.be.greaterThan(0);

      const parsed = JSON.parse(Buffer.from(broadcastStr, 'hex').toString());
      parsed.type.should.equal(MessageStandardType.GROUP_POLICY);
      parsed.payload.should.equal(payload);
    });
  });
});
