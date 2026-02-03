import * as $protobuf from 'protobufjs';
import Long = require('long');
/** Namespace cosmos. */
export namespace cosmos {
  /** Namespace group. */
  namespace group {
    /** Namespace v1. */
    namespace v1 {
      /** Properties of a MsgSubmitProposal. */
      interface IMsgSubmitProposal {
        /** MsgSubmitProposal groupPolicyAddress */
        groupPolicyAddress?: string | null;

        /** MsgSubmitProposal proposers */
        proposers?: string[] | null;

        /** MsgSubmitProposal metadata */
        metadata?: string | null;

        /** MsgSubmitProposal messages */
        messages?: google.protobuf.IAny[] | null;

        /** MsgSubmitProposal exec */
        exec?: cosmos.group.v1.Exec | null;

        /** MsgSubmitProposal title */
        title?: string | null;

        /** MsgSubmitProposal summary */
        summary?: string | null;
      }

      /** Represents a MsgSubmitProposal. */
      class MsgSubmitProposal implements IMsgSubmitProposal {
        /**
         * Constructs a new MsgSubmitProposal.
         * @param [properties] Properties to set
         */
        constructor(properties?: cosmos.group.v1.IMsgSubmitProposal);

        /** MsgSubmitProposal groupPolicyAddress. */
        public groupPolicyAddress: string;

        /** MsgSubmitProposal proposers. */
        public proposers: string[];

        /** MsgSubmitProposal metadata. */
        public metadata: string;

        /** MsgSubmitProposal messages. */
        public messages: google.protobuf.IAny[];

        /** MsgSubmitProposal exec. */
        public exec: cosmos.group.v1.Exec;

        /** MsgSubmitProposal title. */
        public title: string;

        /** MsgSubmitProposal summary. */
        public summary: string;

        /**
         * Creates a new MsgSubmitProposal instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MsgSubmitProposal instance
         */
        public static create(properties?: cosmos.group.v1.IMsgSubmitProposal): cosmos.group.v1.MsgSubmitProposal;

        /**
         * Encodes the specified MsgSubmitProposal message. Does not implicitly {@link cosmos.group.v1.MsgSubmitProposal.verify|verify} messages.
         * @param message MsgSubmitProposal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cosmos.group.v1.IMsgSubmitProposal, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MsgSubmitProposal message, length delimited. Does not implicitly {@link cosmos.group.v1.MsgSubmitProposal.verify|verify} messages.
         * @param message MsgSubmitProposal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(
          message: cosmos.group.v1.IMsgSubmitProposal,
          writer?: $protobuf.Writer
        ): $protobuf.Writer;

        /**
         * Decodes a MsgSubmitProposal message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MsgSubmitProposal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): cosmos.group.v1.MsgSubmitProposal;

        /**
         * Decodes a MsgSubmitProposal message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MsgSubmitProposal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): cosmos.group.v1.MsgSubmitProposal;

        /**
         * Verifies a MsgSubmitProposal message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): string | null;

        /**
         * Creates a MsgSubmitProposal message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MsgSubmitProposal
         */
        public static fromObject(object: { [k: string]: any }): cosmos.group.v1.MsgSubmitProposal;

        /**
         * Creates a plain object from a MsgSubmitProposal message. Also converts values to other types if specified.
         * @param message MsgSubmitProposal
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(
          message: cosmos.group.v1.MsgSubmitProposal,
          options?: $protobuf.IConversionOptions
        ): { [k: string]: any };

        /**
         * Converts this MsgSubmitProposal to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MsgSubmitProposal
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
      }

      /** Exec enum. */
      enum Exec {
        EXEC_UNSPECIFIED = 0,
        EXEC_TRY = 1,
      }
    }
  }
}

/** Namespace google. */
export namespace google {
  /** Namespace protobuf. */
  namespace protobuf {
    /** Properties of an Any. */
    interface IAny {
      /** Any type_url */
      type_url?: string | null;

      /** Any value */
      value?: Uint8Array | null;
    }

    /** Represents an Any. */
    class Any implements IAny {
      /**
       * Constructs a new Any.
       * @param [properties] Properties to set
       */
      constructor(properties?: google.protobuf.IAny);

      /** Any type_url. */
      public type_url: string;

      /** Any value. */
      public value: Uint8Array;

      /**
       * Creates a new Any instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Any instance
       */
      public static create(properties?: google.protobuf.IAny): google.protobuf.Any;

      /**
       * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
       * @param message Any message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
       * @param message Any message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes an Any message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Any
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): google.protobuf.Any;

      /**
       * Decodes an Any message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Any
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): google.protobuf.Any;

      /**
       * Verifies an Any message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates an Any message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Any
       */
      public static fromObject(object: { [k: string]: any }): google.protobuf.Any;

      /**
       * Creates a plain object from an Any message. Also converts values to other types if specified.
       * @param message Any
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: google.protobuf.Any,
        options?: $protobuf.IConversionOptions
      ): { [k: string]: any };

      /**
       * Converts this Any to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Any
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }
}
