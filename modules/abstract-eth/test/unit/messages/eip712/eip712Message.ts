import 'should';
import { EIP712Message } from '../../../../src/';
import { fixtures } from './fixtures';
import { MessageStandardType } from '@bitgo/sdk-core';
import { testEthMessageSigning } from '../abstractEthMessagesTests';

describe('EIP712 Message', () => {
  testEthMessageSigning({
    messageType: MessageStandardType.EIP712,
    messageClass: EIP712Message,
    ...fixtures,
  });
});
