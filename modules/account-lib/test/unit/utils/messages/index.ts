import should from 'should';
import {
  getMidnightGlacierDropMsg,
  isMessageWhitelisted,
  MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE,
  MIDNIGHT_TNC_HASH,
} from '@bitgo/sdk-core';

describe('Message validation', () => {
  describe('isMessageWhitelisted', () => {
    const whitelistedMessageTemplates = [MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE];

    const adaTestnetDestinationAddress = 'addr_test1vz7xs7ceu4xx9n5xn57lfe86vrwddqpp77vjwq5ptlkh49cqy3wur';
    const adaMainnetDestinationAddress =
      'addr1q9k6u7lhf467y2f8skr2dafldx2npsd8fymq0mslnj0t44nd4ealwnt4ug5j0pvx5m6n76v4xrq6wjfkqlhpl8y7httq2m9cmu';
    const allocationAmt = 100;

    it('should validate testnet message matching the Midnight glacier drop claim template', () => {
      const messageRaw = getMidnightGlacierDropMsg(adaTestnetDestinationAddress, allocationAmt);

      const result = isMessageWhitelisted(whitelistedMessageTemplates, messageRaw);

      should.equal(result, true);
    });

    it('should validate mainnet message matching the Midnight glacier drop claim template', () => {
      const messageRaw = getMidnightGlacierDropMsg(adaMainnetDestinationAddress, allocationAmt);

      const result = isMessageWhitelisted(whitelistedMessageTemplates, messageRaw);

      should.equal(result, true);
    });

    it('should not validate message with incorrect format', () => {
      const messageRaw = `INCORRECT 100 to ${adaTestnetDestinationAddress} ${MIDNIGHT_TNC_HASH}`;

      const result = isMessageWhitelisted(whitelistedMessageTemplates, messageRaw);

      should.equal(result, false);
    });

    it('should not validate message with missing parts', () => {
      // Missing "to addr" part
      const messageRaw = `STAR 100 ${MIDNIGHT_TNC_HASH}`;

      const result = isMessageWhitelisted(whitelistedMessageTemplates, messageRaw);

      should.equal(result, false);
    });

    it('should not validate message with incorrect hash', () => {
      // Different hash
      const incorrectHash =
        '5af1adf825baa496729e2eac1e895ebc77973744bce67f44276bf6006f5c21de863ed121e11828d8fc0241773191e26dc1134803a681a9a98ba0ae812553db24';
      const messageRaw = `STAR 100 to ${adaTestnetDestinationAddress} ${incorrectHash}`;

      const result = isMessageWhitelisted(whitelistedMessageTemplates, messageRaw);

      should.equal(result, false);
    });

    it('should handle empty message', () => {
      const result = isMessageWhitelisted(whitelistedMessageTemplates, '');

      should.equal(result, false);
    });

    it('should not validate message with special regex characters', () => {
      const messageRaw = `STAR shade.with+special*chars to addr.with[special]chars ${MIDNIGHT_TNC_HASH}`;

      const result = isMessageWhitelisted(whitelistedMessageTemplates, messageRaw);

      should.equal(result, false);
    });
  });
});
