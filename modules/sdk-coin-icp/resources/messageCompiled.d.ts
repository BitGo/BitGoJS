import * as $protobuf from 'protobufjs';
import Long = require('long');
/** Properties of a Memo. */
export interface IMemo {
  /** Memo memo */
  memo?: number | Long | null;
}

/** Represents a Memo. */
export class Memo implements IMemo {
  /**
   * Constructs a new Memo.
   * @param [properties] Properties to set
   */
  constructor(properties?: IMemo);

  /** Memo memo. */
  public memo: number | Long;

  /**
   * Creates a new Memo instance using the specified properties.
   * @param [properties] Properties to set
   * @returns Memo instance
   */
  public static create(properties?: IMemo): Memo;

  /**
   * Encodes the specified Memo message. Does not implicitly {@link Memo.verify|verify} messages.
   * @param message Memo message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: IMemo, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified Memo message, length delimited. Does not implicitly {@link Memo.verify|verify} messages.
   * @param message Memo message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: IMemo, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a Memo message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns Memo
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): Memo;

  /**
   * Decodes a Memo message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns Memo
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): Memo;

  /**
   * Verifies a Memo message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates a Memo message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns Memo
   */
  public static fromObject(object: { [k: string]: any }): Memo;

  /**
   * Creates a plain object from a Memo message. Also converts values to other types if specified.
   * @param message Memo
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: Memo, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this Memo to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for Memo
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a Tokens. */
export interface ITokens {
  /** Tokens e8s */
  e8s?: number | Long | null;
}

/** Represents a Tokens. */
export class Tokens implements ITokens {
  /**
   * Constructs a new Tokens.
   * @param [properties] Properties to set
   */
  constructor(properties?: ITokens);

  /** Tokens e8s. */
  public e8s: number | Long;

  /**
   * Creates a new Tokens instance using the specified properties.
   * @param [properties] Properties to set
   * @returns Tokens instance
   */
  public static create(properties?: ITokens): Tokens;

  /**
   * Encodes the specified Tokens message. Does not implicitly {@link Tokens.verify|verify} messages.
   * @param message Tokens message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: ITokens, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified Tokens message, length delimited. Does not implicitly {@link Tokens.verify|verify} messages.
   * @param message Tokens message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: ITokens, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a Tokens message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns Tokens
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): Tokens;

  /**
   * Decodes a Tokens message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns Tokens
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): Tokens;

  /**
   * Verifies a Tokens message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates a Tokens message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns Tokens
   */
  public static fromObject(object: { [k: string]: any }): Tokens;

  /**
   * Creates a plain object from a Tokens message. Also converts values to other types if specified.
   * @param message Tokens
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: Tokens, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this Tokens to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for Tokens
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a Payment. */
export interface IPayment {
  /** Payment receiverGets */
  receiverGets?: ITokens | null;
}

/** Represents a Payment. */
export class Payment implements IPayment {
  /**
   * Constructs a new Payment.
   * @param [properties] Properties to set
   */
  constructor(properties?: IPayment);

  /** Payment receiverGets. */
  public receiverGets?: ITokens | null;

  /**
   * Creates a new Payment instance using the specified properties.
   * @param [properties] Properties to set
   * @returns Payment instance
   */
  public static create(properties?: IPayment): Payment;

  /**
   * Encodes the specified Payment message. Does not implicitly {@link Payment.verify|verify} messages.
   * @param message Payment message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: IPayment, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified Payment message, length delimited. Does not implicitly {@link Payment.verify|verify} messages.
   * @param message Payment message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: IPayment, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a Payment message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns Payment
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): Payment;

  /**
   * Decodes a Payment message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns Payment
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): Payment;

  /**
   * Verifies a Payment message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates a Payment message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns Payment
   */
  public static fromObject(object: { [k: string]: any }): Payment;

  /**
   * Creates a plain object from a Payment message. Also converts values to other types if specified.
   * @param message Payment
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: Payment, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this Payment to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for Payment
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a Subaccount. */
export interface ISubaccount {
  /** Subaccount subAccount */
  subAccount?: Uint8Array | null;
}

/** Represents a Subaccount. */
export class Subaccount implements ISubaccount {
  /**
   * Constructs a new Subaccount.
   * @param [properties] Properties to set
   */
  constructor(properties?: ISubaccount);

  /** Subaccount subAccount. */
  public subAccount: Uint8Array;

  /**
   * Creates a new Subaccount instance using the specified properties.
   * @param [properties] Properties to set
   * @returns Subaccount instance
   */
  public static create(properties?: ISubaccount): Subaccount;

  /**
   * Encodes the specified Subaccount message. Does not implicitly {@link Subaccount.verify|verify} messages.
   * @param message Subaccount message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: ISubaccount, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified Subaccount message, length delimited. Does not implicitly {@link Subaccount.verify|verify} messages.
   * @param message Subaccount message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: ISubaccount, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a Subaccount message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns Subaccount
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): Subaccount;

  /**
   * Decodes a Subaccount message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns Subaccount
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): Subaccount;

  /**
   * Verifies a Subaccount message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates a Subaccount message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns Subaccount
   */
  public static fromObject(object: { [k: string]: any }): Subaccount;

  /**
   * Creates a plain object from a Subaccount message. Also converts values to other types if specified.
   * @param message Subaccount
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: Subaccount, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this Subaccount to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for Subaccount
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of an AccountIdentifier. */
export interface IAccountIdentifier {
  /** AccountIdentifier hash */
  hash?: Uint8Array | null;
}

/** Represents an AccountIdentifier. */
export class AccountIdentifier implements IAccountIdentifier {
  /**
   * Constructs a new AccountIdentifier.
   * @param [properties] Properties to set
   */
  constructor(properties?: IAccountIdentifier);

  /** AccountIdentifier hash. */
  public hash: Uint8Array;

  /**
   * Creates a new AccountIdentifier instance using the specified properties.
   * @param [properties] Properties to set
   * @returns AccountIdentifier instance
   */
  public static create(properties?: IAccountIdentifier): AccountIdentifier;

  /**
   * Encodes the specified AccountIdentifier message. Does not implicitly {@link AccountIdentifier.verify|verify} messages.
   * @param message AccountIdentifier message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: IAccountIdentifier, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified AccountIdentifier message, length delimited. Does not implicitly {@link AccountIdentifier.verify|verify} messages.
   * @param message AccountIdentifier message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: IAccountIdentifier, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes an AccountIdentifier message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns AccountIdentifier
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): AccountIdentifier;

  /**
   * Decodes an AccountIdentifier message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns AccountIdentifier
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): AccountIdentifier;

  /**
   * Verifies an AccountIdentifier message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates an AccountIdentifier message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns AccountIdentifier
   */
  public static fromObject(object: { [k: string]: any }): AccountIdentifier;

  /**
   * Creates a plain object from an AccountIdentifier message. Also converts values to other types if specified.
   * @param message AccountIdentifier
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: AccountIdentifier, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this AccountIdentifier to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for AccountIdentifier
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a BlockIndex. */
export interface IBlockIndex {
  /** BlockIndex height */
  height?: number | Long | null;
}

/** Represents a BlockIndex. */
export class BlockIndex implements IBlockIndex {
  /**
   * Constructs a new BlockIndex.
   * @param [properties] Properties to set
   */
  constructor(properties?: IBlockIndex);

  /** BlockIndex height. */
  public height: number | Long;

  /**
   * Creates a new BlockIndex instance using the specified properties.
   * @param [properties] Properties to set
   * @returns BlockIndex instance
   */
  public static create(properties?: IBlockIndex): BlockIndex;

  /**
   * Encodes the specified BlockIndex message. Does not implicitly {@link BlockIndex.verify|verify} messages.
   * @param message BlockIndex message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: IBlockIndex, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified BlockIndex message, length delimited. Does not implicitly {@link BlockIndex.verify|verify} messages.
   * @param message BlockIndex message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: IBlockIndex, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a BlockIndex message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns BlockIndex
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): BlockIndex;

  /**
   * Decodes a BlockIndex message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns BlockIndex
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): BlockIndex;

  /**
   * Verifies a BlockIndex message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates a BlockIndex message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns BlockIndex
   */
  public static fromObject(object: { [k: string]: any }): BlockIndex;

  /**
   * Creates a plain object from a BlockIndex message. Also converts values to other types if specified.
   * @param message BlockIndex
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: BlockIndex, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this BlockIndex to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for BlockIndex
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a TimeStamp. */
export interface ITimeStamp {
  /** TimeStamp timestampNanos */
  timestampNanos?: number | Long | null;
}

/** Represents a TimeStamp. */
export class TimeStamp implements ITimeStamp {
  /**
   * Constructs a new TimeStamp.
   * @param [properties] Properties to set
   */
  constructor(properties?: ITimeStamp);

  /** TimeStamp timestampNanos. */
  public timestampNanos: number | Long;

  /**
   * Creates a new TimeStamp instance using the specified properties.
   * @param [properties] Properties to set
   * @returns TimeStamp instance
   */
  public static create(properties?: ITimeStamp): TimeStamp;

  /**
   * Encodes the specified TimeStamp message. Does not implicitly {@link TimeStamp.verify|verify} messages.
   * @param message TimeStamp message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: ITimeStamp, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified TimeStamp message, length delimited. Does not implicitly {@link TimeStamp.verify|verify} messages.
   * @param message TimeStamp message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: ITimeStamp, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a TimeStamp message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns TimeStamp
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): TimeStamp;

  /**
   * Decodes a TimeStamp message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns TimeStamp
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): TimeStamp;

  /**
   * Verifies a TimeStamp message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates a TimeStamp message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns TimeStamp
   */
  public static fromObject(object: { [k: string]: any }): TimeStamp;

  /**
   * Creates a plain object from a TimeStamp message. Also converts values to other types if specified.
   * @param message TimeStamp
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: TimeStamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this TimeStamp to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for TimeStamp
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SendRequest. */
export interface ISendRequest {
  /** SendRequest memo */
  memo?: IMemo | null;

  /** SendRequest payment */
  payment?: IPayment | null;

  /** SendRequest maxFee */
  maxFee?: ITokens | null;

  /** SendRequest fromSubaccount */
  fromSubaccount?: ISubaccount | null;

  /** SendRequest to */
  to?: IAccountIdentifier | null;

  /** SendRequest createdAt */
  createdAt?: IBlockIndex | null;

  /** SendRequest createdAtTime */
  createdAtTime?: ITimeStamp | null;
}

/** Represents a SendRequest. */
export class SendRequest implements ISendRequest {
  /**
   * Constructs a new SendRequest.
   * @param [properties] Properties to set
   */
  constructor(properties?: ISendRequest);

  /** SendRequest memo. */
  public memo?: IMemo | null;

  /** SendRequest payment. */
  public payment?: IPayment | null;

  /** SendRequest maxFee. */
  public maxFee?: ITokens | null;

  /** SendRequest fromSubaccount. */
  public fromSubaccount?: ISubaccount | null;

  /** SendRequest to. */
  public to?: IAccountIdentifier | null;

  /** SendRequest createdAt. */
  public createdAt?: IBlockIndex | null;

  /** SendRequest createdAtTime. */
  public createdAtTime?: ITimeStamp | null;

  /**
   * Creates a new SendRequest instance using the specified properties.
   * @param [properties] Properties to set
   * @returns SendRequest instance
   */
  public static create(properties?: ISendRequest): SendRequest;

  /**
   * Encodes the specified SendRequest message. Does not implicitly {@link SendRequest.verify|verify} messages.
   * @param message SendRequest message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: ISendRequest, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified SendRequest message, length delimited. Does not implicitly {@link SendRequest.verify|verify} messages.
   * @param message SendRequest message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: ISendRequest, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a SendRequest message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns SendRequest
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): SendRequest;

  /**
   * Decodes a SendRequest message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns SendRequest
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): SendRequest;

  /**
   * Verifies a SendRequest message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): string | null;

  /**
   * Creates a SendRequest message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns SendRequest
   */
  public static fromObject(object: { [k: string]: any }): SendRequest;

  /**
   * Creates a plain object from a SendRequest message. Also converts values to other types if specified.
   * @param message SendRequest
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: SendRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this SendRequest to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for SendRequest
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}
