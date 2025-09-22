import 'should';
import { MessageStandardType } from '@bitgo-beta/sdk-core';
import { fixtures } from './fixtures';
import { EIP191Message } from '../../../../src';
import { testEthMessageSigning } from '../abstractEthMessagesTests';

describe('EIP191 Message', () => {
  testEthMessageSigning({
    messageType: MessageStandardType.EIP191,
    messageClass: EIP191Message,
    ...fixtures,
  });
});
