import { BaseMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';

export class EIP712Message extends BaseMessage {
  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.EIP712,
    });
  }

  async getSignablePayload(): Promise<string | Buffer> {
    /*this.signablePayload = TypedDataUtils.eip712Hash(JSON.parse(this.payload), SignTypedDataVersion.V4);
    return this.signablePayload;*/

    const typedData = JSON.parse(this.payload);
    const sanitizedData = TypedDataUtils.sanitizeData(typedData);
    const parts: Buffer[] = [];

    parts.push(Buffer.from('1901', 'hex'));
    parts.push(TypedDataUtils.eip712DomainHash(typedData, SignTypedDataVersion.V4));
    if (sanitizedData.primaryType !== 'EIP712Domain') {
      parts.push(
        TypedDataUtils.hashStruct(
          sanitizedData.primaryType as string,
          sanitizedData.message,
          sanitizedData.types,
          SignTypedDataVersion.V4
        )
      );
    }

    this.signablePayload = Buffer.concat(parts);
    return this.signablePayload;
  }
}
