import 'should';
import { EIP712Message, Eip712MessageBuilder } from '../../../../src';
import { fixtures } from './fixtures';
import { MessageStandardType } from '@bitgo/sdk-core';
import { testEthMessageBuilding } from '../abstractEthMessageBuilderTests';

describe('EIP712 Message Builder', () => {
  testEthMessageBuilding({
    messageType: MessageStandardType.EIP712,
    messageBuilderClass: Eip712MessageBuilder,
    messageClass: EIP712Message,
    test: fixtures.messageBuilderTest,
  });
});
