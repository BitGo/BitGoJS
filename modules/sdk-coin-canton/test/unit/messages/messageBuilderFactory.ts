import should from 'should';
import { BaseCoin } from '@bitgo/statics';
import { MessageStandardType } from '@bitgo/sdk-core';
import { MessageBuilderFactory } from '../../../src/lib/messages/messageBuilderFactory';
import { CantonSignTransactionMessageBuilder } from '../../../src/lib/messages/cantonSignTransaction/cantonSignTransactionMessageBuilder';
import { CantonSignTopologyMessageBuilder } from '../../../src/lib/messages/cantonSignTopology/cantonSignTopologyMessageBuilder';

describe('Canton MessageBuilderFactory', function () {
  let factory: MessageBuilderFactory;

  beforeEach(function () {
    factory = new MessageBuilderFactory({ name: 'canton' } as BaseCoin);
  });

  describe('getMessageBuilder', function () {
    it('should return CantonSignTransactionMessageBuilder for CANTON_SIGN_TRANSACTION', function () {
      const builder = factory.getMessageBuilder(MessageStandardType.CANTON_SIGN_TRANSACTION);
      should.exist(builder);
      builder.should.be.instanceof(CantonSignTransactionMessageBuilder);
    });

    it('should return CantonSignTopologyMessageBuilder for CANTON_SIGN_TOPOLOGY', function () {
      const builder = factory.getMessageBuilder(MessageStandardType.CANTON_SIGN_TOPOLOGY);
      should.exist(builder);
      builder.should.be.instanceof(CantonSignTopologyMessageBuilder);
    });

    it('should throw for unsupported message standard types', function () {
      should.throws(() => factory.getMessageBuilder(MessageStandardType.SIMPLE), /Invalid message standard SIMPLE/);
      should.throws(() => factory.getMessageBuilder(MessageStandardType.EIP191), /Invalid message standard EIP191/);
      should.throws(
        () => factory.getMessageBuilder('UNSUPPORTED' as MessageStandardType),
        /Invalid message standard UNSUPPORTED/
      );
    });

    it('should build a message with CANTON_SIGN_TRANSACTION that returns correct signable payload', async function () {
      const txHash = '7Ey4Q2TqWQcK1eAl6p15UT02M4mx92Tvo9ifvtzlm5o=';
      const builder = factory.getMessageBuilder(MessageStandardType.CANTON_SIGN_TRANSACTION);
      builder.setPayload(txHash);
      const message = await builder.build();
      const signable = await message.getSignablePayload();
      should.ok(Buffer.isBuffer(signable));
      (signable as Buffer).should.deepEqual(Buffer.from(txHash, 'base64'));
    });

    it('should build a message with CANTON_SIGN_TOPOLOGY that returns correct signable payload', async function () {
      const topoHash = 'EiDQky+Uxo2zEwFp+JabeazILMMd7QR639/B/u+OGR+npg==';
      const builder = factory.getMessageBuilder(MessageStandardType.CANTON_SIGN_TOPOLOGY);
      builder.setPayload(topoHash);
      const message = await builder.build();
      const signable = await message.getSignablePayload();
      should.ok(Buffer.isBuffer(signable));
      (signable as Buffer).should.deepEqual(Buffer.from(topoHash, 'base64'));
    });
  });
});
