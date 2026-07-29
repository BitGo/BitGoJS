import 'should';
import { testEthMessageBuilding } from '../abstractEthMessageBuilderTests';
import { EIP191Message, Eip191MessageBuilder } from '../../../../src';
import { fixtures } from './fixtures';
import { MessageStandardType } from '@bitgo/sdk-core';

describe('EIP191 Message Builder', () => {
  testEthMessageBuilding({
    messageType: MessageStandardType.EIP191,
    messageBuilderClass: Eip191MessageBuilder,
    messageClass: EIP191Message,
    test: fixtures.messageBuilderTest,
  });
});
