import should from 'should';
import * as accountLib from '../../src';
import { getMidnightGlacierDropClaimMsg, MessageStandardType } from '@bitgo/sdk-core';

describe('verifyMessage', () => {
  const adaTestnetOriginAddress = 'addr_test1wz4h6068hs93n8j5ar88fgzz6sfnw8krng09xx0mmf36m8c7j9yap';
  const adaTestnetDestinationAddress = 'addr_test1vz7xs7ceu4xx9n5xn57lfe86vrwddqpp77vjwq5ptlkh49cqy3wur';
  const allocationAmt = 100;
  const testnetMessageRaw = getMidnightGlacierDropClaimMsg(adaTestnetDestinationAddress, allocationAmt);

  describe('EIP191 Message', function () {
    const eip191MessageBuilder = accountLib
      .getMessageBuilderFactory('eth')
      .getMessageBuilder(MessageStandardType.EIP191);

    it('should throw error if coin is not supported', async () => {
      const coinName = 'unsupportedCoin';
      const messageRaw = 'test message';
      const messageEncoded = 'encoded message';
      const messageStandardType = MessageStandardType.EIP191;

      const result = await accountLib.verifyMessage(coinName, messageRaw, messageEncoded, messageStandardType);
      should.equal(result, false);
    });

    it('should verify EIP191 message successfully when both checks pass', async () => {
      const coinName = 'eth';
      eip191MessageBuilder.setPayload(testnetMessageRaw);
      const message = await eip191MessageBuilder.build();
      const messageEncodedHex = (await message.getSignablePayload()).toString('hex');

      const result = await accountLib.verifyMessage(
        coinName,
        testnetMessageRaw,
        messageEncodedHex,
        MessageStandardType.EIP191,
      );
      should.equal(result, true);
    });

    it('should return false if template validation fails', async () => {
      const coinName = 'eth';
      const messageRaw = 'Invalid message format'; // Doesn't match the template
      eip191MessageBuilder.setPayload(messageRaw);
      const message = await eip191MessageBuilder.build();
      const messageEncodedHex = (await message.getSignablePayload()).toString('hex');

      const result = await accountLib.verifyMessage(
        coinName,
        testnetMessageRaw,
        messageEncodedHex,
        MessageStandardType.EIP191,
      );
      should.equal(result, false);
    });
  });

  describe('CIP8 Message', function () {
    const cip8MessageBuilder = accountLib.getMessageBuilderFactory('ada').getMessageBuilder(MessageStandardType.CIP8);

    it('should check metadata for verifying CIP8 message', async () => {
      const coinName = 'ada';
      cip8MessageBuilder.setPayload(testnetMessageRaw);
      cip8MessageBuilder.addSigner(adaTestnetOriginAddress);
      const message = await cip8MessageBuilder.build();
      const messageEncodedHex = (await message.getSignablePayload()).toString('hex');

      // metadata is required for CIP8 message verification
      let result = await accountLib.verifyMessage(
        coinName,
        testnetMessageRaw,
        messageEncodedHex,
        MessageStandardType.CIP8,
      );
      should.equal(result, false);

      const metadata = {
        signers: [adaTestnetOriginAddress],
      };
      result = await accountLib.verifyMessage(
        coinName,
        testnetMessageRaw,
        messageEncodedHex,
        MessageStandardType.CIP8,
        metadata,
      );
      should.equal(result, true);
    });
  });
});
