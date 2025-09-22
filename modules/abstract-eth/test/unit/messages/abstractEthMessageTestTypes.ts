import {
  BaseMessage,
  BaseMessageBuilder,
  MessageMetadata,
  MessageOptions,
  MessageStandardType,
  Signature,
} from '@bitgo-beta/sdk-core';

type MessageCtor = new (options: MessageOptions) => BaseMessage;

type MessageBuildParams = { payload: string; metadata?: MessageMetadata };
type SignatureParams = { signature: Signature; signer: string };

type MessageVerificationParams = { expectedSignableHex: string };
type MessageVerificationParamsBase64 = { expectedSignableBase64: string };

type MessageTestCase = { input: MessageBuildParams; expected: MessageVerificationParams };
type SignedMessageTestCase = {
  input: MessageBuildParams & SignatureParams;
  expected: MessageVerificationParams & MessageVerificationParamsBase64;
};

type MessageBuilderTestCase = {
  input: MessageBuildParams & SignatureParams;
  expected: MessageVerificationParams;
  broadcastHex: string;
};

export type MessageTestConfig = {
  messageType: MessageStandardType;
  messageClass: MessageCtor;
  tests: Record<string, MessageTestCase>;
  signedTest: SignedMessageTestCase;
};

export type MessageBuildingTestConfig = {
  messageType: MessageStandardType;
  messageBuilderClass: typeof BaseMessageBuilder;
  messageClass: typeof BaseMessage;
  test: MessageBuilderTestCase;
};
