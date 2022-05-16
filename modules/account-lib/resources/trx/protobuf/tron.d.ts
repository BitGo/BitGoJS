import * as $protobuf from "protobufjs";
/** Namespace protocol. */
export namespace protocol {

    /** Properties of an Endpoint. */
    interface IEndpoint {

        /** Endpoint address */
        address?: (Uint8Array|null);

        /** Endpoint port */
        port?: (number|null);

        /** Endpoint nodeId */
        nodeId?: (Uint8Array|null);
    }

    /** Represents an Endpoint. */
    class Endpoint implements IEndpoint {

        /**
         * Constructs a new Endpoint.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IEndpoint);

        /** Endpoint address. */
        public address: Uint8Array;

        /** Endpoint port. */
        public port: number;

        /** Endpoint nodeId. */
        public nodeId: Uint8Array;

        /**
         * Creates a new Endpoint instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Endpoint instance
         */
        public static create(properties?: protocol.IEndpoint): protocol.Endpoint;

        /**
         * Encodes the specified Endpoint message. Does not implicitly {@link protocol.Endpoint.verify|verify} messages.
         * @param message Endpoint message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IEndpoint, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Endpoint message, length delimited. Does not implicitly {@link protocol.Endpoint.verify|verify} messages.
         * @param message Endpoint message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IEndpoint, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Endpoint message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Endpoint
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Endpoint;

        /**
         * Decodes an Endpoint message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Endpoint
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Endpoint;

        /**
         * Verifies an Endpoint message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Endpoint message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Endpoint
         */
        public static fromObject(object: { [k: string]: any }): protocol.Endpoint;

        /**
         * Creates a plain object from an Endpoint message. Also converts values to other types if specified.
         * @param message Endpoint
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Endpoint, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Endpoint to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a PingMessage. */
    interface IPingMessage {

        /** PingMessage from */
        from?: (protocol.IEndpoint|null);

        /** PingMessage to */
        to?: (protocol.IEndpoint|null);

        /** PingMessage version */
        version?: (number|null);

        /** PingMessage timestamp */
        timestamp?: (number|Long|null);
    }

    /** Represents a PingMessage. */
    class PingMessage implements IPingMessage {

        /**
         * Constructs a new PingMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IPingMessage);

        /** PingMessage from. */
        public from?: (protocol.IEndpoint|null);

        /** PingMessage to. */
        public to?: (protocol.IEndpoint|null);

        /** PingMessage version. */
        public version: number;

        /** PingMessage timestamp. */
        public timestamp: (number|Long);

        /**
         * Creates a new PingMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PingMessage instance
         */
        public static create(properties?: protocol.IPingMessage): protocol.PingMessage;

        /**
         * Encodes the specified PingMessage message. Does not implicitly {@link protocol.PingMessage.verify|verify} messages.
         * @param message PingMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IPingMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PingMessage message, length delimited. Does not implicitly {@link protocol.PingMessage.verify|verify} messages.
         * @param message PingMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IPingMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PingMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PingMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.PingMessage;

        /**
         * Decodes a PingMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PingMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.PingMessage;

        /**
         * Verifies a PingMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PingMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PingMessage
         */
        public static fromObject(object: { [k: string]: any }): protocol.PingMessage;

        /**
         * Creates a plain object from a PingMessage message. Also converts values to other types if specified.
         * @param message PingMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.PingMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PingMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a PongMessage. */
    interface IPongMessage {

        /** PongMessage from */
        from?: (protocol.IEndpoint|null);

        /** PongMessage echo */
        echo?: (number|null);

        /** PongMessage timestamp */
        timestamp?: (number|Long|null);
    }

    /** Represents a PongMessage. */
    class PongMessage implements IPongMessage {

        /**
         * Constructs a new PongMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IPongMessage);

        /** PongMessage from. */
        public from?: (protocol.IEndpoint|null);

        /** PongMessage echo. */
        public echo: number;

        /** PongMessage timestamp. */
        public timestamp: (number|Long);

        /**
         * Creates a new PongMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PongMessage instance
         */
        public static create(properties?: protocol.IPongMessage): protocol.PongMessage;

        /**
         * Encodes the specified PongMessage message. Does not implicitly {@link protocol.PongMessage.verify|verify} messages.
         * @param message PongMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IPongMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PongMessage message, length delimited. Does not implicitly {@link protocol.PongMessage.verify|verify} messages.
         * @param message PongMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IPongMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PongMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PongMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.PongMessage;

        /**
         * Decodes a PongMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PongMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.PongMessage;

        /**
         * Verifies a PongMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PongMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PongMessage
         */
        public static fromObject(object: { [k: string]: any }): protocol.PongMessage;

        /**
         * Creates a plain object from a PongMessage message. Also converts values to other types if specified.
         * @param message PongMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.PongMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PongMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a FindNeighbours. */
    interface IFindNeighbours {

        /** FindNeighbours from */
        from?: (protocol.IEndpoint|null);

        /** FindNeighbours targetId */
        targetId?: (Uint8Array|null);

        /** FindNeighbours timestamp */
        timestamp?: (number|Long|null);
    }

    /** Represents a FindNeighbours. */
    class FindNeighbours implements IFindNeighbours {

        /**
         * Constructs a new FindNeighbours.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IFindNeighbours);

        /** FindNeighbours from. */
        public from?: (protocol.IEndpoint|null);

        /** FindNeighbours targetId. */
        public targetId: Uint8Array;

        /** FindNeighbours timestamp. */
        public timestamp: (number|Long);

        /**
         * Creates a new FindNeighbours instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FindNeighbours instance
         */
        public static create(properties?: protocol.IFindNeighbours): protocol.FindNeighbours;

        /**
         * Encodes the specified FindNeighbours message. Does not implicitly {@link protocol.FindNeighbours.verify|verify} messages.
         * @param message FindNeighbours message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IFindNeighbours, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FindNeighbours message, length delimited. Does not implicitly {@link protocol.FindNeighbours.verify|verify} messages.
         * @param message FindNeighbours message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IFindNeighbours, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FindNeighbours message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FindNeighbours
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.FindNeighbours;

        /**
         * Decodes a FindNeighbours message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FindNeighbours
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.FindNeighbours;

        /**
         * Verifies a FindNeighbours message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FindNeighbours message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FindNeighbours
         */
        public static fromObject(object: { [k: string]: any }): protocol.FindNeighbours;

        /**
         * Creates a plain object from a FindNeighbours message. Also converts values to other types if specified.
         * @param message FindNeighbours
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.FindNeighbours, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FindNeighbours to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Neighbours. */
    interface INeighbours {

        /** Neighbours from */
        from?: (protocol.IEndpoint|null);

        /** Neighbours neighbours */
        neighbours?: (protocol.IEndpoint[]|null);

        /** Neighbours timestamp */
        timestamp?: (number|Long|null);
    }

    /** Represents a Neighbours. */
    class Neighbours implements INeighbours {

        /**
         * Constructs a new Neighbours.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.INeighbours);

        /** Neighbours from. */
        public from?: (protocol.IEndpoint|null);

        /** Neighbours neighbours. */
        public neighbours: protocol.IEndpoint[];

        /** Neighbours timestamp. */
        public timestamp: (number|Long);

        /**
         * Creates a new Neighbours instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Neighbours instance
         */
        public static create(properties?: protocol.INeighbours): protocol.Neighbours;

        /**
         * Encodes the specified Neighbours message. Does not implicitly {@link protocol.Neighbours.verify|verify} messages.
         * @param message Neighbours message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.INeighbours, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Neighbours message, length delimited. Does not implicitly {@link protocol.Neighbours.verify|verify} messages.
         * @param message Neighbours message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.INeighbours, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Neighbours message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Neighbours
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Neighbours;

        /**
         * Decodes a Neighbours message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Neighbours
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Neighbours;

        /**
         * Verifies a Neighbours message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Neighbours message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Neighbours
         */
        public static fromObject(object: { [k: string]: any }): protocol.Neighbours;

        /**
         * Creates a plain object from a Neighbours message. Also converts values to other types if specified.
         * @param message Neighbours
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Neighbours, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Neighbours to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BackupMessage. */
    interface IBackupMessage {

        /** BackupMessage flag */
        flag?: (boolean|null);

        /** BackupMessage priority */
        priority?: (number|null);
    }

    /** Represents a BackupMessage. */
    class BackupMessage implements IBackupMessage {

        /**
         * Constructs a new BackupMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IBackupMessage);

        /** BackupMessage flag. */
        public flag: boolean;

        /** BackupMessage priority. */
        public priority: number;

        /**
         * Creates a new BackupMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BackupMessage instance
         */
        public static create(properties?: protocol.IBackupMessage): protocol.BackupMessage;

        /**
         * Encodes the specified BackupMessage message. Does not implicitly {@link protocol.BackupMessage.verify|verify} messages.
         * @param message BackupMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IBackupMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BackupMessage message, length delimited. Does not implicitly {@link protocol.BackupMessage.verify|verify} messages.
         * @param message BackupMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IBackupMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BackupMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BackupMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.BackupMessage;

        /**
         * Decodes a BackupMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BackupMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.BackupMessage;

        /**
         * Verifies a BackupMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BackupMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BackupMessage
         */
        public static fromObject(object: { [k: string]: any }): protocol.BackupMessage;

        /**
         * Creates a plain object from a BackupMessage message. Also converts values to other types if specified.
         * @param message BackupMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.BackupMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BackupMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AccountCreateContract. */
    interface IAccountCreateContract {

        /** AccountCreateContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** AccountCreateContract accountAddress */
        accountAddress?: (Uint8Array|null);

        /** AccountCreateContract type */
        type?: (protocol.AccountType|null);
    }

    /** Represents an AccountCreateContract. */
    class AccountCreateContract implements IAccountCreateContract {

        /**
         * Constructs a new AccountCreateContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IAccountCreateContract);

        /** AccountCreateContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** AccountCreateContract accountAddress. */
        public accountAddress: Uint8Array;

        /** AccountCreateContract type. */
        public type: protocol.AccountType;

        /**
         * Creates a new AccountCreateContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountCreateContract instance
         */
        public static create(properties?: protocol.IAccountCreateContract): protocol.AccountCreateContract;

        /**
         * Encodes the specified AccountCreateContract message. Does not implicitly {@link protocol.AccountCreateContract.verify|verify} messages.
         * @param message AccountCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IAccountCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountCreateContract message, length delimited. Does not implicitly {@link protocol.AccountCreateContract.verify|verify} messages.
         * @param message AccountCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IAccountCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountCreateContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.AccountCreateContract;

        /**
         * Decodes an AccountCreateContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.AccountCreateContract;

        /**
         * Verifies an AccountCreateContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountCreateContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountCreateContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.AccountCreateContract;

        /**
         * Creates a plain object from an AccountCreateContract message. Also converts values to other types if specified.
         * @param message AccountCreateContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.AccountCreateContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountCreateContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AccountUpdateContract. */
    interface IAccountUpdateContract {

        /** AccountUpdateContract accountName */
        accountName?: (Uint8Array|null);

        /** AccountUpdateContract ownerAddress */
        ownerAddress?: (Uint8Array|null);
    }

    /** Represents an AccountUpdateContract. */
    class AccountUpdateContract implements IAccountUpdateContract {

        /**
         * Constructs a new AccountUpdateContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IAccountUpdateContract);

        /** AccountUpdateContract accountName. */
        public accountName: Uint8Array;

        /** AccountUpdateContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /**
         * Creates a new AccountUpdateContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountUpdateContract instance
         */
        public static create(properties?: protocol.IAccountUpdateContract): protocol.AccountUpdateContract;

        /**
         * Encodes the specified AccountUpdateContract message. Does not implicitly {@link protocol.AccountUpdateContract.verify|verify} messages.
         * @param message AccountUpdateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IAccountUpdateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountUpdateContract message, length delimited. Does not implicitly {@link protocol.AccountUpdateContract.verify|verify} messages.
         * @param message AccountUpdateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IAccountUpdateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountUpdateContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountUpdateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.AccountUpdateContract;

        /**
         * Decodes an AccountUpdateContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountUpdateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.AccountUpdateContract;

        /**
         * Verifies an AccountUpdateContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountUpdateContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountUpdateContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.AccountUpdateContract;

        /**
         * Creates a plain object from an AccountUpdateContract message. Also converts values to other types if specified.
         * @param message AccountUpdateContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.AccountUpdateContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountUpdateContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a SetAccountIdContract. */
    interface ISetAccountIdContract {

        /** SetAccountIdContract accountId */
        accountId?: (Uint8Array|null);

        /** SetAccountIdContract ownerAddress */
        ownerAddress?: (Uint8Array|null);
    }

    /** Represents a SetAccountIdContract. */
    class SetAccountIdContract implements ISetAccountIdContract {

        /**
         * Constructs a new SetAccountIdContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ISetAccountIdContract);

        /** SetAccountIdContract accountId. */
        public accountId: Uint8Array;

        /** SetAccountIdContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /**
         * Creates a new SetAccountIdContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetAccountIdContract instance
         */
        public static create(properties?: protocol.ISetAccountIdContract): protocol.SetAccountIdContract;

        /**
         * Encodes the specified SetAccountIdContract message. Does not implicitly {@link protocol.SetAccountIdContract.verify|verify} messages.
         * @param message SetAccountIdContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ISetAccountIdContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetAccountIdContract message, length delimited. Does not implicitly {@link protocol.SetAccountIdContract.verify|verify} messages.
         * @param message SetAccountIdContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ISetAccountIdContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetAccountIdContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetAccountIdContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.SetAccountIdContract;

        /**
         * Decodes a SetAccountIdContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetAccountIdContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.SetAccountIdContract;

        /**
         * Verifies a SetAccountIdContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetAccountIdContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetAccountIdContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.SetAccountIdContract;

        /**
         * Creates a plain object from a SetAccountIdContract message. Also converts values to other types if specified.
         * @param message SetAccountIdContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.SetAccountIdContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetAccountIdContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a TransferContract. */
    interface ITransferContract {

        /** TransferContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** TransferContract toAddress */
        toAddress?: (Uint8Array|null);

        /** TransferContract amount */
        amount?: (number|Long|null);
    }

    /** Represents a TransferContract. */
    class TransferContract implements ITransferContract {

        /**
         * Constructs a new TransferContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITransferContract);

        /** TransferContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** TransferContract toAddress. */
        public toAddress: Uint8Array;

        /** TransferContract amount. */
        public amount: (number|Long);

        /**
         * Creates a new TransferContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TransferContract instance
         */
        public static create(properties?: protocol.ITransferContract): protocol.TransferContract;

        /**
         * Encodes the specified TransferContract message. Does not implicitly {@link protocol.TransferContract.verify|verify} messages.
         * @param message TransferContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITransferContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TransferContract message, length delimited. Does not implicitly {@link protocol.TransferContract.verify|verify} messages.
         * @param message TransferContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITransferContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TransferContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TransferContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TransferContract;

        /**
         * Decodes a TransferContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TransferContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TransferContract;

        /**
         * Verifies a TransferContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TransferContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TransferContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.TransferContract;

        /**
         * Creates a plain object from a TransferContract message. Also converts values to other types if specified.
         * @param message TransferContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TransferContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TransferContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a TransferAssetContract. */
    interface ITransferAssetContract {

        /** TransferAssetContract assetName */
        assetName?: (Uint8Array|null);

        /** TransferAssetContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** TransferAssetContract toAddress */
        toAddress?: (Uint8Array|null);

        /** TransferAssetContract amount */
        amount?: (number|Long|null);
    }

    /** Represents a TransferAssetContract. */
    class TransferAssetContract implements ITransferAssetContract {

        /**
         * Constructs a new TransferAssetContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITransferAssetContract);

        /** TransferAssetContract assetName. */
        public assetName: Uint8Array;

        /** TransferAssetContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** TransferAssetContract toAddress. */
        public toAddress: Uint8Array;

        /** TransferAssetContract amount. */
        public amount: (number|Long);

        /**
         * Creates a new TransferAssetContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TransferAssetContract instance
         */
        public static create(properties?: protocol.ITransferAssetContract): protocol.TransferAssetContract;

        /**
         * Encodes the specified TransferAssetContract message. Does not implicitly {@link protocol.TransferAssetContract.verify|verify} messages.
         * @param message TransferAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITransferAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TransferAssetContract message, length delimited. Does not implicitly {@link protocol.TransferAssetContract.verify|verify} messages.
         * @param message TransferAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITransferAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TransferAssetContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TransferAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TransferAssetContract;

        /**
         * Decodes a TransferAssetContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TransferAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TransferAssetContract;

        /**
         * Verifies a TransferAssetContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TransferAssetContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TransferAssetContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.TransferAssetContract;

        /**
         * Creates a plain object from a TransferAssetContract message. Also converts values to other types if specified.
         * @param message TransferAssetContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TransferAssetContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TransferAssetContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a VoteAssetContract. */
    interface IVoteAssetContract {

        /** VoteAssetContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** VoteAssetContract voteAddress */
        voteAddress?: (Uint8Array[]|null);

        /** VoteAssetContract support */
        support?: (boolean|null);

        /** VoteAssetContract count */
        count?: (number|null);
    }

    /** Represents a VoteAssetContract. */
    class VoteAssetContract implements IVoteAssetContract {

        /**
         * Constructs a new VoteAssetContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IVoteAssetContract);

        /** VoteAssetContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** VoteAssetContract voteAddress. */
        public voteAddress: Uint8Array[];

        /** VoteAssetContract support. */
        public support: boolean;

        /** VoteAssetContract count. */
        public count: number;

        /**
         * Creates a new VoteAssetContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns VoteAssetContract instance
         */
        public static create(properties?: protocol.IVoteAssetContract): protocol.VoteAssetContract;

        /**
         * Encodes the specified VoteAssetContract message. Does not implicitly {@link protocol.VoteAssetContract.verify|verify} messages.
         * @param message VoteAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IVoteAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified VoteAssetContract message, length delimited. Does not implicitly {@link protocol.VoteAssetContract.verify|verify} messages.
         * @param message VoteAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IVoteAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a VoteAssetContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns VoteAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.VoteAssetContract;

        /**
         * Decodes a VoteAssetContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns VoteAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.VoteAssetContract;

        /**
         * Verifies a VoteAssetContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a VoteAssetContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns VoteAssetContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.VoteAssetContract;

        /**
         * Creates a plain object from a VoteAssetContract message. Also converts values to other types if specified.
         * @param message VoteAssetContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.VoteAssetContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this VoteAssetContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a VoteWitnessContract. */
    interface IVoteWitnessContract {

        /** VoteWitnessContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** VoteWitnessContract votes */
        votes?: (protocol.VoteWitnessContract.IVote[]|null);

        /** VoteWitnessContract support */
        support?: (boolean|null);
    }

    /** Represents a VoteWitnessContract. */
    class VoteWitnessContract implements IVoteWitnessContract {

        /**
         * Constructs a new VoteWitnessContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IVoteWitnessContract);

        /** VoteWitnessContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** VoteWitnessContract votes. */
        public votes: protocol.VoteWitnessContract.IVote[];

        /** VoteWitnessContract support. */
        public support: boolean;

        /**
         * Creates a new VoteWitnessContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns VoteWitnessContract instance
         */
        public static create(properties?: protocol.IVoteWitnessContract): protocol.VoteWitnessContract;

        /**
         * Encodes the specified VoteWitnessContract message. Does not implicitly {@link protocol.VoteWitnessContract.verify|verify} messages.
         * @param message VoteWitnessContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IVoteWitnessContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified VoteWitnessContract message, length delimited. Does not implicitly {@link protocol.VoteWitnessContract.verify|verify} messages.
         * @param message VoteWitnessContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IVoteWitnessContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a VoteWitnessContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns VoteWitnessContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.VoteWitnessContract;

        /**
         * Decodes a VoteWitnessContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns VoteWitnessContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.VoteWitnessContract;

        /**
         * Verifies a VoteWitnessContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a VoteWitnessContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns VoteWitnessContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.VoteWitnessContract;

        /**
         * Creates a plain object from a VoteWitnessContract message. Also converts values to other types if specified.
         * @param message VoteWitnessContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.VoteWitnessContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this VoteWitnessContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace VoteWitnessContract {

        /** Properties of a Vote. */
        interface IVote {

            /** Vote voteAddress */
            voteAddress?: (Uint8Array|null);

            /** Vote voteCount */
            voteCount?: (number|Long|null);
        }

        /** Represents a Vote. */
        class Vote implements IVote {

            /**
             * Constructs a new Vote.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.VoteWitnessContract.IVote);

            /** Vote voteAddress. */
            public voteAddress: Uint8Array;

            /** Vote voteCount. */
            public voteCount: (number|Long);

            /**
             * Creates a new Vote instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Vote instance
             */
            public static create(properties?: protocol.VoteWitnessContract.IVote): protocol.VoteWitnessContract.Vote;

            /**
             * Encodes the specified Vote message. Does not implicitly {@link protocol.VoteWitnessContract.Vote.verify|verify} messages.
             * @param message Vote message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.VoteWitnessContract.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Vote message, length delimited. Does not implicitly {@link protocol.VoteWitnessContract.Vote.verify|verify} messages.
             * @param message Vote message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.VoteWitnessContract.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Vote message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Vote
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.VoteWitnessContract.Vote;

            /**
             * Decodes a Vote message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Vote
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.VoteWitnessContract.Vote;

            /**
             * Verifies a Vote message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Vote message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Vote
             */
            public static fromObject(object: { [k: string]: any }): protocol.VoteWitnessContract.Vote;

            /**
             * Creates a plain object from a Vote message. Also converts values to other types if specified.
             * @param message Vote
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.VoteWitnessContract.Vote, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Vote to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of an UpdateSettingContract. */
    interface IUpdateSettingContract {

        /** UpdateSettingContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** UpdateSettingContract contractAddress */
        contractAddress?: (Uint8Array|null);

        /** UpdateSettingContract consumeUserResourcePercent */
        consumeUserResourcePercent?: (number|Long|null);
    }

    /** Represents an UpdateSettingContract. */
    class UpdateSettingContract implements IUpdateSettingContract {

        /**
         * Constructs a new UpdateSettingContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IUpdateSettingContract);

        /** UpdateSettingContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** UpdateSettingContract contractAddress. */
        public contractAddress: Uint8Array;

        /** UpdateSettingContract consumeUserResourcePercent. */
        public consumeUserResourcePercent: (number|Long);

        /**
         * Creates a new UpdateSettingContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UpdateSettingContract instance
         */
        public static create(properties?: protocol.IUpdateSettingContract): protocol.UpdateSettingContract;

        /**
         * Encodes the specified UpdateSettingContract message. Does not implicitly {@link protocol.UpdateSettingContract.verify|verify} messages.
         * @param message UpdateSettingContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IUpdateSettingContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UpdateSettingContract message, length delimited. Does not implicitly {@link protocol.UpdateSettingContract.verify|verify} messages.
         * @param message UpdateSettingContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IUpdateSettingContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UpdateSettingContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UpdateSettingContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.UpdateSettingContract;

        /**
         * Decodes an UpdateSettingContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UpdateSettingContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.UpdateSettingContract;

        /**
         * Verifies an UpdateSettingContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UpdateSettingContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UpdateSettingContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.UpdateSettingContract;

        /**
         * Creates a plain object from an UpdateSettingContract message. Also converts values to other types if specified.
         * @param message UpdateSettingContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.UpdateSettingContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UpdateSettingContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an UpdateEnergyLimitContract. */
    interface IUpdateEnergyLimitContract {

        /** UpdateEnergyLimitContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** UpdateEnergyLimitContract contractAddress */
        contractAddress?: (Uint8Array|null);

        /** UpdateEnergyLimitContract originEnergyLimit */
        originEnergyLimit?: (number|Long|null);
    }

    /** Represents an UpdateEnergyLimitContract. */
    class UpdateEnergyLimitContract implements IUpdateEnergyLimitContract {

        /**
         * Constructs a new UpdateEnergyLimitContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IUpdateEnergyLimitContract);

        /** UpdateEnergyLimitContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** UpdateEnergyLimitContract contractAddress. */
        public contractAddress: Uint8Array;

        /** UpdateEnergyLimitContract originEnergyLimit. */
        public originEnergyLimit: (number|Long);

        /**
         * Creates a new UpdateEnergyLimitContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UpdateEnergyLimitContract instance
         */
        public static create(properties?: protocol.IUpdateEnergyLimitContract): protocol.UpdateEnergyLimitContract;

        /**
         * Encodes the specified UpdateEnergyLimitContract message. Does not implicitly {@link protocol.UpdateEnergyLimitContract.verify|verify} messages.
         * @param message UpdateEnergyLimitContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IUpdateEnergyLimitContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UpdateEnergyLimitContract message, length delimited. Does not implicitly {@link protocol.UpdateEnergyLimitContract.verify|verify} messages.
         * @param message UpdateEnergyLimitContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IUpdateEnergyLimitContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UpdateEnergyLimitContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UpdateEnergyLimitContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.UpdateEnergyLimitContract;

        /**
         * Decodes an UpdateEnergyLimitContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UpdateEnergyLimitContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.UpdateEnergyLimitContract;

        /**
         * Verifies an UpdateEnergyLimitContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UpdateEnergyLimitContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UpdateEnergyLimitContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.UpdateEnergyLimitContract;

        /**
         * Creates a plain object from an UpdateEnergyLimitContract message. Also converts values to other types if specified.
         * @param message UpdateEnergyLimitContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.UpdateEnergyLimitContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UpdateEnergyLimitContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ClearABIContract. */
    interface IClearABIContract {

        /** ClearABIContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ClearABIContract contractAddress */
        contractAddress?: (Uint8Array|null);
    }

    /** Represents a ClearABIContract. */
    class ClearABIContract implements IClearABIContract {

        /**
         * Constructs a new ClearABIContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IClearABIContract);

        /** ClearABIContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ClearABIContract contractAddress. */
        public contractAddress: Uint8Array;

        /**
         * Creates a new ClearABIContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ClearABIContract instance
         */
        public static create(properties?: protocol.IClearABIContract): protocol.ClearABIContract;

        /**
         * Encodes the specified ClearABIContract message. Does not implicitly {@link protocol.ClearABIContract.verify|verify} messages.
         * @param message ClearABIContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IClearABIContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ClearABIContract message, length delimited. Does not implicitly {@link protocol.ClearABIContract.verify|verify} messages.
         * @param message ClearABIContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IClearABIContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ClearABIContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ClearABIContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ClearABIContract;

        /**
         * Decodes a ClearABIContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ClearABIContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ClearABIContract;

        /**
         * Verifies a ClearABIContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ClearABIContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ClearABIContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ClearABIContract;

        /**
         * Creates a plain object from a ClearABIContract message. Also converts values to other types if specified.
         * @param message ClearABIContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ClearABIContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ClearABIContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a WitnessCreateContract. */
    interface IWitnessCreateContract {

        /** WitnessCreateContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** WitnessCreateContract url */
        url?: (Uint8Array|null);
    }

    /** Represents a WitnessCreateContract. */
    class WitnessCreateContract implements IWitnessCreateContract {

        /**
         * Constructs a new WitnessCreateContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IWitnessCreateContract);

        /** WitnessCreateContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** WitnessCreateContract url. */
        public url: Uint8Array;

        /**
         * Creates a new WitnessCreateContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WitnessCreateContract instance
         */
        public static create(properties?: protocol.IWitnessCreateContract): protocol.WitnessCreateContract;

        /**
         * Encodes the specified WitnessCreateContract message. Does not implicitly {@link protocol.WitnessCreateContract.verify|verify} messages.
         * @param message WitnessCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IWitnessCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WitnessCreateContract message, length delimited. Does not implicitly {@link protocol.WitnessCreateContract.verify|verify} messages.
         * @param message WitnessCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IWitnessCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WitnessCreateContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WitnessCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.WitnessCreateContract;

        /**
         * Decodes a WitnessCreateContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WitnessCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.WitnessCreateContract;

        /**
         * Verifies a WitnessCreateContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WitnessCreateContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WitnessCreateContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.WitnessCreateContract;

        /**
         * Creates a plain object from a WitnessCreateContract message. Also converts values to other types if specified.
         * @param message WitnessCreateContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.WitnessCreateContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WitnessCreateContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a WitnessUpdateContract. */
    interface IWitnessUpdateContract {

        /** WitnessUpdateContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** WitnessUpdateContract updateUrl */
        updateUrl?: (Uint8Array|null);
    }

    /** Represents a WitnessUpdateContract. */
    class WitnessUpdateContract implements IWitnessUpdateContract {

        /**
         * Constructs a new WitnessUpdateContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IWitnessUpdateContract);

        /** WitnessUpdateContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** WitnessUpdateContract updateUrl. */
        public updateUrl: Uint8Array;

        /**
         * Creates a new WitnessUpdateContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WitnessUpdateContract instance
         */
        public static create(properties?: protocol.IWitnessUpdateContract): protocol.WitnessUpdateContract;

        /**
         * Encodes the specified WitnessUpdateContract message. Does not implicitly {@link protocol.WitnessUpdateContract.verify|verify} messages.
         * @param message WitnessUpdateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IWitnessUpdateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WitnessUpdateContract message, length delimited. Does not implicitly {@link protocol.WitnessUpdateContract.verify|verify} messages.
         * @param message WitnessUpdateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IWitnessUpdateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WitnessUpdateContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WitnessUpdateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.WitnessUpdateContract;

        /**
         * Decodes a WitnessUpdateContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WitnessUpdateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.WitnessUpdateContract;

        /**
         * Verifies a WitnessUpdateContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WitnessUpdateContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WitnessUpdateContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.WitnessUpdateContract;

        /**
         * Creates a plain object from a WitnessUpdateContract message. Also converts values to other types if specified.
         * @param message WitnessUpdateContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.WitnessUpdateContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WitnessUpdateContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AssetIssueContract. */
    interface IAssetIssueContract {

        /** AssetIssueContract id */
        id?: (string|null);

        /** AssetIssueContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** AssetIssueContract name */
        name?: (Uint8Array|null);

        /** AssetIssueContract abbr */
        abbr?: (Uint8Array|null);

        /** AssetIssueContract totalSupply */
        totalSupply?: (number|Long|null);

        /** AssetIssueContract frozenSupply */
        frozenSupply?: (protocol.AssetIssueContract.IFrozenSupply[]|null);

        /** AssetIssueContract trxNum */
        trxNum?: (number|null);

        /** AssetIssueContract precision */
        precision?: (number|null);

        /** AssetIssueContract num */
        num?: (number|null);

        /** AssetIssueContract startTime */
        startTime?: (number|Long|null);

        /** AssetIssueContract endTime */
        endTime?: (number|Long|null);

        /** AssetIssueContract order */
        order?: (number|Long|null);

        /** AssetIssueContract voteScore */
        voteScore?: (number|null);

        /** AssetIssueContract description */
        description?: (Uint8Array|null);

        /** AssetIssueContract url */
        url?: (Uint8Array|null);

        /** AssetIssueContract freeAssetNetLimit */
        freeAssetNetLimit?: (number|Long|null);

        /** AssetIssueContract publicFreeAssetNetLimit */
        publicFreeAssetNetLimit?: (number|Long|null);

        /** AssetIssueContract publicFreeAssetNetUsage */
        publicFreeAssetNetUsage?: (number|Long|null);

        /** AssetIssueContract publicLatestFreeNetTime */
        publicLatestFreeNetTime?: (number|Long|null);
    }

    /** Represents an AssetIssueContract. */
    class AssetIssueContract implements IAssetIssueContract {

        /**
         * Constructs a new AssetIssueContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IAssetIssueContract);

        /** AssetIssueContract id. */
        public id: string;

        /** AssetIssueContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** AssetIssueContract name. */
        public name: Uint8Array;

        /** AssetIssueContract abbr. */
        public abbr: Uint8Array;

        /** AssetIssueContract totalSupply. */
        public totalSupply: (number|Long);

        /** AssetIssueContract frozenSupply. */
        public frozenSupply: protocol.AssetIssueContract.IFrozenSupply[];

        /** AssetIssueContract trxNum. */
        public trxNum: number;

        /** AssetIssueContract precision. */
        public precision: number;

        /** AssetIssueContract num. */
        public num: number;

        /** AssetIssueContract startTime. */
        public startTime: (number|Long);

        /** AssetIssueContract endTime. */
        public endTime: (number|Long);

        /** AssetIssueContract order. */
        public order: (number|Long);

        /** AssetIssueContract voteScore. */
        public voteScore: number;

        /** AssetIssueContract description. */
        public description: Uint8Array;

        /** AssetIssueContract url. */
        public url: Uint8Array;

        /** AssetIssueContract freeAssetNetLimit. */
        public freeAssetNetLimit: (number|Long);

        /** AssetIssueContract publicFreeAssetNetLimit. */
        public publicFreeAssetNetLimit: (number|Long);

        /** AssetIssueContract publicFreeAssetNetUsage. */
        public publicFreeAssetNetUsage: (number|Long);

        /** AssetIssueContract publicLatestFreeNetTime. */
        public publicLatestFreeNetTime: (number|Long);

        /**
         * Creates a new AssetIssueContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AssetIssueContract instance
         */
        public static create(properties?: protocol.IAssetIssueContract): protocol.AssetIssueContract;

        /**
         * Encodes the specified AssetIssueContract message. Does not implicitly {@link protocol.AssetIssueContract.verify|verify} messages.
         * @param message AssetIssueContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IAssetIssueContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AssetIssueContract message, length delimited. Does not implicitly {@link protocol.AssetIssueContract.verify|verify} messages.
         * @param message AssetIssueContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IAssetIssueContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AssetIssueContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AssetIssueContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.AssetIssueContract;

        /**
         * Decodes an AssetIssueContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AssetIssueContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.AssetIssueContract;

        /**
         * Verifies an AssetIssueContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AssetIssueContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AssetIssueContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.AssetIssueContract;

        /**
         * Creates a plain object from an AssetIssueContract message. Also converts values to other types if specified.
         * @param message AssetIssueContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.AssetIssueContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AssetIssueContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace AssetIssueContract {

        /** Properties of a FrozenSupply. */
        interface IFrozenSupply {

            /** FrozenSupply frozenAmount */
            frozenAmount?: (number|Long|null);

            /** FrozenSupply frozenDays */
            frozenDays?: (number|Long|null);
        }

        /** Represents a FrozenSupply. */
        class FrozenSupply implements IFrozenSupply {

            /**
             * Constructs a new FrozenSupply.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.AssetIssueContract.IFrozenSupply);

            /** FrozenSupply frozenAmount. */
            public frozenAmount: (number|Long);

            /** FrozenSupply frozenDays. */
            public frozenDays: (number|Long);

            /**
             * Creates a new FrozenSupply instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FrozenSupply instance
             */
            public static create(properties?: protocol.AssetIssueContract.IFrozenSupply): protocol.AssetIssueContract.FrozenSupply;

            /**
             * Encodes the specified FrozenSupply message. Does not implicitly {@link protocol.AssetIssueContract.FrozenSupply.verify|verify} messages.
             * @param message FrozenSupply message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.AssetIssueContract.IFrozenSupply, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FrozenSupply message, length delimited. Does not implicitly {@link protocol.AssetIssueContract.FrozenSupply.verify|verify} messages.
             * @param message FrozenSupply message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.AssetIssueContract.IFrozenSupply, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FrozenSupply message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FrozenSupply
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.AssetIssueContract.FrozenSupply;

            /**
             * Decodes a FrozenSupply message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FrozenSupply
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.AssetIssueContract.FrozenSupply;

            /**
             * Verifies a FrozenSupply message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FrozenSupply message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FrozenSupply
             */
            public static fromObject(object: { [k: string]: any }): protocol.AssetIssueContract.FrozenSupply;

            /**
             * Creates a plain object from a FrozenSupply message. Also converts values to other types if specified.
             * @param message FrozenSupply
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.AssetIssueContract.FrozenSupply, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FrozenSupply to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a ParticipateAssetIssueContract. */
    interface IParticipateAssetIssueContract {

        /** ParticipateAssetIssueContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ParticipateAssetIssueContract toAddress */
        toAddress?: (Uint8Array|null);

        /** ParticipateAssetIssueContract assetName */
        assetName?: (Uint8Array|null);

        /** ParticipateAssetIssueContract amount */
        amount?: (number|Long|null);
    }

    /** Represents a ParticipateAssetIssueContract. */
    class ParticipateAssetIssueContract implements IParticipateAssetIssueContract {

        /**
         * Constructs a new ParticipateAssetIssueContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IParticipateAssetIssueContract);

        /** ParticipateAssetIssueContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ParticipateAssetIssueContract toAddress. */
        public toAddress: Uint8Array;

        /** ParticipateAssetIssueContract assetName. */
        public assetName: Uint8Array;

        /** ParticipateAssetIssueContract amount. */
        public amount: (number|Long);

        /**
         * Creates a new ParticipateAssetIssueContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ParticipateAssetIssueContract instance
         */
        public static create(properties?: protocol.IParticipateAssetIssueContract): protocol.ParticipateAssetIssueContract;

        /**
         * Encodes the specified ParticipateAssetIssueContract message. Does not implicitly {@link protocol.ParticipateAssetIssueContract.verify|verify} messages.
         * @param message ParticipateAssetIssueContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IParticipateAssetIssueContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ParticipateAssetIssueContract message, length delimited. Does not implicitly {@link protocol.ParticipateAssetIssueContract.verify|verify} messages.
         * @param message ParticipateAssetIssueContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IParticipateAssetIssueContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ParticipateAssetIssueContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ParticipateAssetIssueContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ParticipateAssetIssueContract;

        /**
         * Decodes a ParticipateAssetIssueContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ParticipateAssetIssueContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ParticipateAssetIssueContract;

        /**
         * Verifies a ParticipateAssetIssueContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ParticipateAssetIssueContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ParticipateAssetIssueContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ParticipateAssetIssueContract;

        /**
         * Creates a plain object from a ParticipateAssetIssueContract message. Also converts values to other types if specified.
         * @param message ParticipateAssetIssueContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ParticipateAssetIssueContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ParticipateAssetIssueContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** ResourceCode enum. */
    enum ResourceCode {
        BANDWIDTH = 0,
        ENERGY = 1
    }

    /** Properties of a FreezeBalanceContract. */
    interface IFreezeBalanceContract {

        /** FreezeBalanceContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** FreezeBalanceContract frozenBalance */
        frozenBalance?: (number|Long|null);

        /** FreezeBalanceContract frozenDuration */
        frozenDuration?: (number|Long|null);

        /** FreezeBalanceContract resource */
        resource?: (protocol.ResourceCode|null);

        /** FreezeBalanceContract receiverAddress */
        receiverAddress?: (Uint8Array|null);
    }

    /** Represents a FreezeBalanceContract. */
    class FreezeBalanceContract implements IFreezeBalanceContract {

        /**
         * Constructs a new FreezeBalanceContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IFreezeBalanceContract);

        /** FreezeBalanceContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** FreezeBalanceContract frozenBalance. */
        public frozenBalance: (number|Long);

        /** FreezeBalanceContract frozenDuration. */
        public frozenDuration: (number|Long);

        /** FreezeBalanceContract resource. */
        public resource: protocol.ResourceCode;

        /** FreezeBalanceContract receiverAddress. */
        public receiverAddress: Uint8Array;

        /**
         * Creates a new FreezeBalanceContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FreezeBalanceContract instance
         */
        public static create(properties?: protocol.IFreezeBalanceContract): protocol.FreezeBalanceContract;

        /**
         * Encodes the specified FreezeBalanceContract message. Does not implicitly {@link protocol.FreezeBalanceContract.verify|verify} messages.
         * @param message FreezeBalanceContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IFreezeBalanceContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FreezeBalanceContract message, length delimited. Does not implicitly {@link protocol.FreezeBalanceContract.verify|verify} messages.
         * @param message FreezeBalanceContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IFreezeBalanceContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FreezeBalanceContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FreezeBalanceContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.FreezeBalanceContract;

        /**
         * Decodes a FreezeBalanceContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FreezeBalanceContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.FreezeBalanceContract;

        /**
         * Verifies a FreezeBalanceContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FreezeBalanceContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FreezeBalanceContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.FreezeBalanceContract;

        /**
         * Creates a plain object from a FreezeBalanceContract message. Also converts values to other types if specified.
         * @param message FreezeBalanceContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.FreezeBalanceContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FreezeBalanceContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an UnfreezeBalanceContract. */
    interface IUnfreezeBalanceContract {

        /** UnfreezeBalanceContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** UnfreezeBalanceContract resource */
        resource?: (protocol.ResourceCode|null);

        /** UnfreezeBalanceContract receiverAddress */
        receiverAddress?: (Uint8Array|null);
    }

    /** Represents an UnfreezeBalanceContract. */
    class UnfreezeBalanceContract implements IUnfreezeBalanceContract {

        /**
         * Constructs a new UnfreezeBalanceContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IUnfreezeBalanceContract);

        /** UnfreezeBalanceContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** UnfreezeBalanceContract resource. */
        public resource: protocol.ResourceCode;

        /** UnfreezeBalanceContract receiverAddress. */
        public receiverAddress: Uint8Array;

        /**
         * Creates a new UnfreezeBalanceContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UnfreezeBalanceContract instance
         */
        public static create(properties?: protocol.IUnfreezeBalanceContract): protocol.UnfreezeBalanceContract;

        /**
         * Encodes the specified UnfreezeBalanceContract message. Does not implicitly {@link protocol.UnfreezeBalanceContract.verify|verify} messages.
         * @param message UnfreezeBalanceContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IUnfreezeBalanceContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UnfreezeBalanceContract message, length delimited. Does not implicitly {@link protocol.UnfreezeBalanceContract.verify|verify} messages.
         * @param message UnfreezeBalanceContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IUnfreezeBalanceContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UnfreezeBalanceContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UnfreezeBalanceContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.UnfreezeBalanceContract;

        /**
         * Decodes an UnfreezeBalanceContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UnfreezeBalanceContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.UnfreezeBalanceContract;

        /**
         * Verifies an UnfreezeBalanceContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UnfreezeBalanceContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UnfreezeBalanceContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.UnfreezeBalanceContract;

        /**
         * Creates a plain object from an UnfreezeBalanceContract message. Also converts values to other types if specified.
         * @param message UnfreezeBalanceContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.UnfreezeBalanceContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UnfreezeBalanceContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an UnfreezeAssetContract. */
    interface IUnfreezeAssetContract {

        /** UnfreezeAssetContract ownerAddress */
        ownerAddress?: (Uint8Array|null);
    }

    /** Represents an UnfreezeAssetContract. */
    class UnfreezeAssetContract implements IUnfreezeAssetContract {

        /**
         * Constructs a new UnfreezeAssetContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IUnfreezeAssetContract);

        /** UnfreezeAssetContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /**
         * Creates a new UnfreezeAssetContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UnfreezeAssetContract instance
         */
        public static create(properties?: protocol.IUnfreezeAssetContract): protocol.UnfreezeAssetContract;

        /**
         * Encodes the specified UnfreezeAssetContract message. Does not implicitly {@link protocol.UnfreezeAssetContract.verify|verify} messages.
         * @param message UnfreezeAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IUnfreezeAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UnfreezeAssetContract message, length delimited. Does not implicitly {@link protocol.UnfreezeAssetContract.verify|verify} messages.
         * @param message UnfreezeAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IUnfreezeAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UnfreezeAssetContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UnfreezeAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.UnfreezeAssetContract;

        /**
         * Decodes an UnfreezeAssetContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UnfreezeAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.UnfreezeAssetContract;

        /**
         * Verifies an UnfreezeAssetContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UnfreezeAssetContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UnfreezeAssetContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.UnfreezeAssetContract;

        /**
         * Creates a plain object from an UnfreezeAssetContract message. Also converts values to other types if specified.
         * @param message UnfreezeAssetContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.UnfreezeAssetContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UnfreezeAssetContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a WithdrawBalanceContract. */
    interface IWithdrawBalanceContract {

        /** WithdrawBalanceContract ownerAddress */
        ownerAddress?: (Uint8Array|null);
    }

    /** Represents a WithdrawBalanceContract. */
    class WithdrawBalanceContract implements IWithdrawBalanceContract {

        /**
         * Constructs a new WithdrawBalanceContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IWithdrawBalanceContract);

        /** WithdrawBalanceContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /**
         * Creates a new WithdrawBalanceContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WithdrawBalanceContract instance
         */
        public static create(properties?: protocol.IWithdrawBalanceContract): protocol.WithdrawBalanceContract;

        /**
         * Encodes the specified WithdrawBalanceContract message. Does not implicitly {@link protocol.WithdrawBalanceContract.verify|verify} messages.
         * @param message WithdrawBalanceContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IWithdrawBalanceContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WithdrawBalanceContract message, length delimited. Does not implicitly {@link protocol.WithdrawBalanceContract.verify|verify} messages.
         * @param message WithdrawBalanceContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IWithdrawBalanceContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WithdrawBalanceContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WithdrawBalanceContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.WithdrawBalanceContract;

        /**
         * Decodes a WithdrawBalanceContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WithdrawBalanceContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.WithdrawBalanceContract;

        /**
         * Verifies a WithdrawBalanceContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WithdrawBalanceContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WithdrawBalanceContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.WithdrawBalanceContract;

        /**
         * Creates a plain object from a WithdrawBalanceContract message. Also converts values to other types if specified.
         * @param message WithdrawBalanceContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.WithdrawBalanceContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WithdrawBalanceContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an UpdateAssetContract. */
    interface IUpdateAssetContract {

        /** UpdateAssetContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** UpdateAssetContract description */
        description?: (Uint8Array|null);

        /** UpdateAssetContract url */
        url?: (Uint8Array|null);

        /** UpdateAssetContract newLimit */
        newLimit?: (number|Long|null);

        /** UpdateAssetContract newPublicLimit */
        newPublicLimit?: (number|Long|null);
    }

    /** Represents an UpdateAssetContract. */
    class UpdateAssetContract implements IUpdateAssetContract {

        /**
         * Constructs a new UpdateAssetContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IUpdateAssetContract);

        /** UpdateAssetContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** UpdateAssetContract description. */
        public description: Uint8Array;

        /** UpdateAssetContract url. */
        public url: Uint8Array;

        /** UpdateAssetContract newLimit. */
        public newLimit: (number|Long);

        /** UpdateAssetContract newPublicLimit. */
        public newPublicLimit: (number|Long);

        /**
         * Creates a new UpdateAssetContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UpdateAssetContract instance
         */
        public static create(properties?: protocol.IUpdateAssetContract): protocol.UpdateAssetContract;

        /**
         * Encodes the specified UpdateAssetContract message. Does not implicitly {@link protocol.UpdateAssetContract.verify|verify} messages.
         * @param message UpdateAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IUpdateAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UpdateAssetContract message, length delimited. Does not implicitly {@link protocol.UpdateAssetContract.verify|verify} messages.
         * @param message UpdateAssetContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IUpdateAssetContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UpdateAssetContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UpdateAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.UpdateAssetContract;

        /**
         * Decodes an UpdateAssetContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UpdateAssetContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.UpdateAssetContract;

        /**
         * Verifies an UpdateAssetContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UpdateAssetContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UpdateAssetContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.UpdateAssetContract;

        /**
         * Creates a plain object from an UpdateAssetContract message. Also converts values to other types if specified.
         * @param message UpdateAssetContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.UpdateAssetContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UpdateAssetContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ProposalCreateContract. */
    interface IProposalCreateContract {

        /** ProposalCreateContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ProposalCreateContract parameters */
        parameters?: ({ [k: string]: (number|Long) }|null);
    }

    /** Represents a ProposalCreateContract. */
    class ProposalCreateContract implements IProposalCreateContract {

        /**
         * Constructs a new ProposalCreateContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IProposalCreateContract);

        /** ProposalCreateContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ProposalCreateContract parameters. */
        public parameters: { [k: string]: (number|Long) };

        /**
         * Creates a new ProposalCreateContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ProposalCreateContract instance
         */
        public static create(properties?: protocol.IProposalCreateContract): protocol.ProposalCreateContract;

        /**
         * Encodes the specified ProposalCreateContract message. Does not implicitly {@link protocol.ProposalCreateContract.verify|verify} messages.
         * @param message ProposalCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IProposalCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ProposalCreateContract message, length delimited. Does not implicitly {@link protocol.ProposalCreateContract.verify|verify} messages.
         * @param message ProposalCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IProposalCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ProposalCreateContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ProposalCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ProposalCreateContract;

        /**
         * Decodes a ProposalCreateContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ProposalCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ProposalCreateContract;

        /**
         * Verifies a ProposalCreateContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ProposalCreateContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ProposalCreateContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ProposalCreateContract;

        /**
         * Creates a plain object from a ProposalCreateContract message. Also converts values to other types if specified.
         * @param message ProposalCreateContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ProposalCreateContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ProposalCreateContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ProposalApproveContract. */
    interface IProposalApproveContract {

        /** ProposalApproveContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ProposalApproveContract proposalId */
        proposalId?: (number|Long|null);

        /** ProposalApproveContract isAddApproval */
        isAddApproval?: (boolean|null);
    }

    /** Represents a ProposalApproveContract. */
    class ProposalApproveContract implements IProposalApproveContract {

        /**
         * Constructs a new ProposalApproveContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IProposalApproveContract);

        /** ProposalApproveContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ProposalApproveContract proposalId. */
        public proposalId: (number|Long);

        /** ProposalApproveContract isAddApproval. */
        public isAddApproval: boolean;

        /**
         * Creates a new ProposalApproveContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ProposalApproveContract instance
         */
        public static create(properties?: protocol.IProposalApproveContract): protocol.ProposalApproveContract;

        /**
         * Encodes the specified ProposalApproveContract message. Does not implicitly {@link protocol.ProposalApproveContract.verify|verify} messages.
         * @param message ProposalApproveContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IProposalApproveContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ProposalApproveContract message, length delimited. Does not implicitly {@link protocol.ProposalApproveContract.verify|verify} messages.
         * @param message ProposalApproveContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IProposalApproveContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ProposalApproveContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ProposalApproveContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ProposalApproveContract;

        /**
         * Decodes a ProposalApproveContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ProposalApproveContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ProposalApproveContract;

        /**
         * Verifies a ProposalApproveContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ProposalApproveContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ProposalApproveContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ProposalApproveContract;

        /**
         * Creates a plain object from a ProposalApproveContract message. Also converts values to other types if specified.
         * @param message ProposalApproveContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ProposalApproveContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ProposalApproveContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ProposalDeleteContract. */
    interface IProposalDeleteContract {

        /** ProposalDeleteContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ProposalDeleteContract proposalId */
        proposalId?: (number|Long|null);
    }

    /** Represents a ProposalDeleteContract. */
    class ProposalDeleteContract implements IProposalDeleteContract {

        /**
         * Constructs a new ProposalDeleteContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IProposalDeleteContract);

        /** ProposalDeleteContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ProposalDeleteContract proposalId. */
        public proposalId: (number|Long);

        /**
         * Creates a new ProposalDeleteContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ProposalDeleteContract instance
         */
        public static create(properties?: protocol.IProposalDeleteContract): protocol.ProposalDeleteContract;

        /**
         * Encodes the specified ProposalDeleteContract message. Does not implicitly {@link protocol.ProposalDeleteContract.verify|verify} messages.
         * @param message ProposalDeleteContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IProposalDeleteContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ProposalDeleteContract message, length delimited. Does not implicitly {@link protocol.ProposalDeleteContract.verify|verify} messages.
         * @param message ProposalDeleteContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IProposalDeleteContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ProposalDeleteContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ProposalDeleteContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ProposalDeleteContract;

        /**
         * Decodes a ProposalDeleteContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ProposalDeleteContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ProposalDeleteContract;

        /**
         * Verifies a ProposalDeleteContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ProposalDeleteContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ProposalDeleteContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ProposalDeleteContract;

        /**
         * Creates a plain object from a ProposalDeleteContract message. Also converts values to other types if specified.
         * @param message ProposalDeleteContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ProposalDeleteContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ProposalDeleteContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a CreateSmartContract. */
    interface ICreateSmartContract {

        /** CreateSmartContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** CreateSmartContract newContract */
        newContract?: (protocol.ISmartContract|null);

        /** CreateSmartContract callTokenValue */
        callTokenValue?: (number|Long|null);

        /** CreateSmartContract tokenId */
        tokenId?: (number|Long|null);
    }

    /** Represents a CreateSmartContract. */
    class CreateSmartContract implements ICreateSmartContract {

        /**
         * Constructs a new CreateSmartContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ICreateSmartContract);

        /** CreateSmartContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** CreateSmartContract newContract. */
        public newContract?: (protocol.ISmartContract|null);

        /** CreateSmartContract callTokenValue. */
        public callTokenValue: (number|Long);

        /** CreateSmartContract tokenId. */
        public tokenId: (number|Long);

        /**
         * Creates a new CreateSmartContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CreateSmartContract instance
         */
        public static create(properties?: protocol.ICreateSmartContract): protocol.CreateSmartContract;

        /**
         * Encodes the specified CreateSmartContract message. Does not implicitly {@link protocol.CreateSmartContract.verify|verify} messages.
         * @param message CreateSmartContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ICreateSmartContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CreateSmartContract message, length delimited. Does not implicitly {@link protocol.CreateSmartContract.verify|verify} messages.
         * @param message CreateSmartContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ICreateSmartContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CreateSmartContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CreateSmartContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.CreateSmartContract;

        /**
         * Decodes a CreateSmartContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CreateSmartContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.CreateSmartContract;

        /**
         * Verifies a CreateSmartContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CreateSmartContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CreateSmartContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.CreateSmartContract;

        /**
         * Creates a plain object from a CreateSmartContract message. Also converts values to other types if specified.
         * @param message CreateSmartContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.CreateSmartContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CreateSmartContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a TriggerSmartContract. */
    interface ITriggerSmartContract {

        /** TriggerSmartContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** TriggerSmartContract contractAddress */
        contractAddress?: (Uint8Array|null);

        /** TriggerSmartContract callValue */
        callValue?: (number|Long|null);

        /** TriggerSmartContract data */
        data?: (Uint8Array|null);

        /** TriggerSmartContract callTokenValue */
        callTokenValue?: (number|Long|null);

        /** TriggerSmartContract tokenId */
        tokenId?: (number|Long|null);
    }

    /** Represents a TriggerSmartContract. */
    class TriggerSmartContract implements ITriggerSmartContract {

        /**
         * Constructs a new TriggerSmartContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITriggerSmartContract);

        /** TriggerSmartContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** TriggerSmartContract contractAddress. */
        public contractAddress: Uint8Array;

        /** TriggerSmartContract callValue. */
        public callValue: (number|Long);

        /** TriggerSmartContract data. */
        public data: Uint8Array;

        /** TriggerSmartContract callTokenValue. */
        public callTokenValue: (number|Long);

        /** TriggerSmartContract tokenId. */
        public tokenId: (number|Long);

        /**
         * Creates a new TriggerSmartContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TriggerSmartContract instance
         */
        public static create(properties?: protocol.ITriggerSmartContract): protocol.TriggerSmartContract;

        /**
         * Encodes the specified TriggerSmartContract message. Does not implicitly {@link protocol.TriggerSmartContract.verify|verify} messages.
         * @param message TriggerSmartContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITriggerSmartContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TriggerSmartContract message, length delimited. Does not implicitly {@link protocol.TriggerSmartContract.verify|verify} messages.
         * @param message TriggerSmartContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITriggerSmartContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TriggerSmartContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TriggerSmartContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TriggerSmartContract;

        /**
         * Decodes a TriggerSmartContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TriggerSmartContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TriggerSmartContract;

        /**
         * Verifies a TriggerSmartContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TriggerSmartContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TriggerSmartContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.TriggerSmartContract;

        /**
         * Creates a plain object from a TriggerSmartContract message. Also converts values to other types if specified.
         * @param message TriggerSmartContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TriggerSmartContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TriggerSmartContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BuyStorageContract. */
    interface IBuyStorageContract {

        /** BuyStorageContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** BuyStorageContract quant */
        quant?: (number|Long|null);
    }

    /** Represents a BuyStorageContract. */
    class BuyStorageContract implements IBuyStorageContract {

        /**
         * Constructs a new BuyStorageContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IBuyStorageContract);

        /** BuyStorageContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** BuyStorageContract quant. */
        public quant: (number|Long);

        /**
         * Creates a new BuyStorageContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BuyStorageContract instance
         */
        public static create(properties?: protocol.IBuyStorageContract): protocol.BuyStorageContract;

        /**
         * Encodes the specified BuyStorageContract message. Does not implicitly {@link protocol.BuyStorageContract.verify|verify} messages.
         * @param message BuyStorageContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IBuyStorageContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BuyStorageContract message, length delimited. Does not implicitly {@link protocol.BuyStorageContract.verify|verify} messages.
         * @param message BuyStorageContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IBuyStorageContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BuyStorageContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BuyStorageContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.BuyStorageContract;

        /**
         * Decodes a BuyStorageContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BuyStorageContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.BuyStorageContract;

        /**
         * Verifies a BuyStorageContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BuyStorageContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BuyStorageContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.BuyStorageContract;

        /**
         * Creates a plain object from a BuyStorageContract message. Also converts values to other types if specified.
         * @param message BuyStorageContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.BuyStorageContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BuyStorageContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BuyStorageBytesContract. */
    interface IBuyStorageBytesContract {

        /** BuyStorageBytesContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** BuyStorageBytesContract bytes */
        bytes?: (number|Long|null);
    }

    /** Represents a BuyStorageBytesContract. */
    class BuyStorageBytesContract implements IBuyStorageBytesContract {

        /**
         * Constructs a new BuyStorageBytesContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IBuyStorageBytesContract);

        /** BuyStorageBytesContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** BuyStorageBytesContract bytes. */
        public bytes: (number|Long);

        /**
         * Creates a new BuyStorageBytesContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BuyStorageBytesContract instance
         */
        public static create(properties?: protocol.IBuyStorageBytesContract): protocol.BuyStorageBytesContract;

        /**
         * Encodes the specified BuyStorageBytesContract message. Does not implicitly {@link protocol.BuyStorageBytesContract.verify|verify} messages.
         * @param message BuyStorageBytesContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IBuyStorageBytesContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BuyStorageBytesContract message, length delimited. Does not implicitly {@link protocol.BuyStorageBytesContract.verify|verify} messages.
         * @param message BuyStorageBytesContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IBuyStorageBytesContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BuyStorageBytesContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BuyStorageBytesContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.BuyStorageBytesContract;

        /**
         * Decodes a BuyStorageBytesContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BuyStorageBytesContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.BuyStorageBytesContract;

        /**
         * Verifies a BuyStorageBytesContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BuyStorageBytesContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BuyStorageBytesContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.BuyStorageBytesContract;

        /**
         * Creates a plain object from a BuyStorageBytesContract message. Also converts values to other types if specified.
         * @param message BuyStorageBytesContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.BuyStorageBytesContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BuyStorageBytesContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a SellStorageContract. */
    interface ISellStorageContract {

        /** SellStorageContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** SellStorageContract storageBytes */
        storageBytes?: (number|Long|null);
    }

    /** Represents a SellStorageContract. */
    class SellStorageContract implements ISellStorageContract {

        /**
         * Constructs a new SellStorageContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ISellStorageContract);

        /** SellStorageContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** SellStorageContract storageBytes. */
        public storageBytes: (number|Long);

        /**
         * Creates a new SellStorageContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SellStorageContract instance
         */
        public static create(properties?: protocol.ISellStorageContract): protocol.SellStorageContract;

        /**
         * Encodes the specified SellStorageContract message. Does not implicitly {@link protocol.SellStorageContract.verify|verify} messages.
         * @param message SellStorageContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ISellStorageContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SellStorageContract message, length delimited. Does not implicitly {@link protocol.SellStorageContract.verify|verify} messages.
         * @param message SellStorageContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ISellStorageContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SellStorageContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SellStorageContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.SellStorageContract;

        /**
         * Decodes a SellStorageContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SellStorageContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.SellStorageContract;

        /**
         * Verifies a SellStorageContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SellStorageContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SellStorageContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.SellStorageContract;

        /**
         * Creates a plain object from a SellStorageContract message. Also converts values to other types if specified.
         * @param message SellStorageContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.SellStorageContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SellStorageContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an ExchangeCreateContract. */
    interface IExchangeCreateContract {

        /** ExchangeCreateContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ExchangeCreateContract firstTokenId */
        firstTokenId?: (Uint8Array|null);

        /** ExchangeCreateContract firstTokenBalance */
        firstTokenBalance?: (number|Long|null);

        /** ExchangeCreateContract secondTokenId */
        secondTokenId?: (Uint8Array|null);

        /** ExchangeCreateContract secondTokenBalance */
        secondTokenBalance?: (number|Long|null);
    }

    /** Represents an ExchangeCreateContract. */
    class ExchangeCreateContract implements IExchangeCreateContract {

        /**
         * Constructs a new ExchangeCreateContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IExchangeCreateContract);

        /** ExchangeCreateContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ExchangeCreateContract firstTokenId. */
        public firstTokenId: Uint8Array;

        /** ExchangeCreateContract firstTokenBalance. */
        public firstTokenBalance: (number|Long);

        /** ExchangeCreateContract secondTokenId. */
        public secondTokenId: Uint8Array;

        /** ExchangeCreateContract secondTokenBalance. */
        public secondTokenBalance: (number|Long);

        /**
         * Creates a new ExchangeCreateContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ExchangeCreateContract instance
         */
        public static create(properties?: protocol.IExchangeCreateContract): protocol.ExchangeCreateContract;

        /**
         * Encodes the specified ExchangeCreateContract message. Does not implicitly {@link protocol.ExchangeCreateContract.verify|verify} messages.
         * @param message ExchangeCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IExchangeCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ExchangeCreateContract message, length delimited. Does not implicitly {@link protocol.ExchangeCreateContract.verify|verify} messages.
         * @param message ExchangeCreateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IExchangeCreateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ExchangeCreateContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ExchangeCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ExchangeCreateContract;

        /**
         * Decodes an ExchangeCreateContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ExchangeCreateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ExchangeCreateContract;

        /**
         * Verifies an ExchangeCreateContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ExchangeCreateContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ExchangeCreateContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ExchangeCreateContract;

        /**
         * Creates a plain object from an ExchangeCreateContract message. Also converts values to other types if specified.
         * @param message ExchangeCreateContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ExchangeCreateContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ExchangeCreateContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an ExchangeInjectContract. */
    interface IExchangeInjectContract {

        /** ExchangeInjectContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ExchangeInjectContract exchangeId */
        exchangeId?: (number|Long|null);

        /** ExchangeInjectContract tokenId */
        tokenId?: (Uint8Array|null);

        /** ExchangeInjectContract quant */
        quant?: (number|Long|null);
    }

    /** Represents an ExchangeInjectContract. */
    class ExchangeInjectContract implements IExchangeInjectContract {

        /**
         * Constructs a new ExchangeInjectContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IExchangeInjectContract);

        /** ExchangeInjectContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ExchangeInjectContract exchangeId. */
        public exchangeId: (number|Long);

        /** ExchangeInjectContract tokenId. */
        public tokenId: Uint8Array;

        /** ExchangeInjectContract quant. */
        public quant: (number|Long);

        /**
         * Creates a new ExchangeInjectContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ExchangeInjectContract instance
         */
        public static create(properties?: protocol.IExchangeInjectContract): protocol.ExchangeInjectContract;

        /**
         * Encodes the specified ExchangeInjectContract message. Does not implicitly {@link protocol.ExchangeInjectContract.verify|verify} messages.
         * @param message ExchangeInjectContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IExchangeInjectContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ExchangeInjectContract message, length delimited. Does not implicitly {@link protocol.ExchangeInjectContract.verify|verify} messages.
         * @param message ExchangeInjectContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IExchangeInjectContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ExchangeInjectContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ExchangeInjectContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ExchangeInjectContract;

        /**
         * Decodes an ExchangeInjectContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ExchangeInjectContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ExchangeInjectContract;

        /**
         * Verifies an ExchangeInjectContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ExchangeInjectContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ExchangeInjectContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ExchangeInjectContract;

        /**
         * Creates a plain object from an ExchangeInjectContract message. Also converts values to other types if specified.
         * @param message ExchangeInjectContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ExchangeInjectContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ExchangeInjectContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an ExchangeWithdrawContract. */
    interface IExchangeWithdrawContract {

        /** ExchangeWithdrawContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ExchangeWithdrawContract exchangeId */
        exchangeId?: (number|Long|null);

        /** ExchangeWithdrawContract tokenId */
        tokenId?: (Uint8Array|null);

        /** ExchangeWithdrawContract quant */
        quant?: (number|Long|null);
    }

    /** Represents an ExchangeWithdrawContract. */
    class ExchangeWithdrawContract implements IExchangeWithdrawContract {

        /**
         * Constructs a new ExchangeWithdrawContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IExchangeWithdrawContract);

        /** ExchangeWithdrawContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ExchangeWithdrawContract exchangeId. */
        public exchangeId: (number|Long);

        /** ExchangeWithdrawContract tokenId. */
        public tokenId: Uint8Array;

        /** ExchangeWithdrawContract quant. */
        public quant: (number|Long);

        /**
         * Creates a new ExchangeWithdrawContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ExchangeWithdrawContract instance
         */
        public static create(properties?: protocol.IExchangeWithdrawContract): protocol.ExchangeWithdrawContract;

        /**
         * Encodes the specified ExchangeWithdrawContract message. Does not implicitly {@link protocol.ExchangeWithdrawContract.verify|verify} messages.
         * @param message ExchangeWithdrawContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IExchangeWithdrawContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ExchangeWithdrawContract message, length delimited. Does not implicitly {@link protocol.ExchangeWithdrawContract.verify|verify} messages.
         * @param message ExchangeWithdrawContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IExchangeWithdrawContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ExchangeWithdrawContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ExchangeWithdrawContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ExchangeWithdrawContract;

        /**
         * Decodes an ExchangeWithdrawContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ExchangeWithdrawContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ExchangeWithdrawContract;

        /**
         * Verifies an ExchangeWithdrawContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ExchangeWithdrawContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ExchangeWithdrawContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ExchangeWithdrawContract;

        /**
         * Creates a plain object from an ExchangeWithdrawContract message. Also converts values to other types if specified.
         * @param message ExchangeWithdrawContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ExchangeWithdrawContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ExchangeWithdrawContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an ExchangeTransactionContract. */
    interface IExchangeTransactionContract {

        /** ExchangeTransactionContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** ExchangeTransactionContract exchangeId */
        exchangeId?: (number|Long|null);

        /** ExchangeTransactionContract tokenId */
        tokenId?: (Uint8Array|null);

        /** ExchangeTransactionContract quant */
        quant?: (number|Long|null);

        /** ExchangeTransactionContract expected */
        expected?: (number|Long|null);
    }

    /** Represents an ExchangeTransactionContract. */
    class ExchangeTransactionContract implements IExchangeTransactionContract {

        /**
         * Constructs a new ExchangeTransactionContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IExchangeTransactionContract);

        /** ExchangeTransactionContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** ExchangeTransactionContract exchangeId. */
        public exchangeId: (number|Long);

        /** ExchangeTransactionContract tokenId. */
        public tokenId: Uint8Array;

        /** ExchangeTransactionContract quant. */
        public quant: (number|Long);

        /** ExchangeTransactionContract expected. */
        public expected: (number|Long);

        /**
         * Creates a new ExchangeTransactionContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ExchangeTransactionContract instance
         */
        public static create(properties?: protocol.IExchangeTransactionContract): protocol.ExchangeTransactionContract;

        /**
         * Encodes the specified ExchangeTransactionContract message. Does not implicitly {@link protocol.ExchangeTransactionContract.verify|verify} messages.
         * @param message ExchangeTransactionContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IExchangeTransactionContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ExchangeTransactionContract message, length delimited. Does not implicitly {@link protocol.ExchangeTransactionContract.verify|verify} messages.
         * @param message ExchangeTransactionContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IExchangeTransactionContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ExchangeTransactionContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ExchangeTransactionContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ExchangeTransactionContract;

        /**
         * Decodes an ExchangeTransactionContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ExchangeTransactionContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ExchangeTransactionContract;

        /**
         * Verifies an ExchangeTransactionContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ExchangeTransactionContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ExchangeTransactionContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.ExchangeTransactionContract;

        /**
         * Creates a plain object from an ExchangeTransactionContract message. Also converts values to other types if specified.
         * @param message ExchangeTransactionContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ExchangeTransactionContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ExchangeTransactionContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AccountPermissionUpdateContract. */
    interface IAccountPermissionUpdateContract {

        /** AccountPermissionUpdateContract ownerAddress */
        ownerAddress?: (Uint8Array|null);

        /** AccountPermissionUpdateContract owner */
        owner?: (protocol.IPermission|null);

        /** AccountPermissionUpdateContract witness */
        witness?: (protocol.IPermission|null);

        /** AccountPermissionUpdateContract actives */
        actives?: (protocol.IPermission[]|null);
    }

    /** Represents an AccountPermissionUpdateContract. */
    class AccountPermissionUpdateContract implements IAccountPermissionUpdateContract {

        /**
         * Constructs a new AccountPermissionUpdateContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IAccountPermissionUpdateContract);

        /** AccountPermissionUpdateContract ownerAddress. */
        public ownerAddress: Uint8Array;

        /** AccountPermissionUpdateContract owner. */
        public owner?: (protocol.IPermission|null);

        /** AccountPermissionUpdateContract witness. */
        public witness?: (protocol.IPermission|null);

        /** AccountPermissionUpdateContract actives. */
        public actives: protocol.IPermission[];

        /**
         * Creates a new AccountPermissionUpdateContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountPermissionUpdateContract instance
         */
        public static create(properties?: protocol.IAccountPermissionUpdateContract): protocol.AccountPermissionUpdateContract;

        /**
         * Encodes the specified AccountPermissionUpdateContract message. Does not implicitly {@link protocol.AccountPermissionUpdateContract.verify|verify} messages.
         * @param message AccountPermissionUpdateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IAccountPermissionUpdateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountPermissionUpdateContract message, length delimited. Does not implicitly {@link protocol.AccountPermissionUpdateContract.verify|verify} messages.
         * @param message AccountPermissionUpdateContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IAccountPermissionUpdateContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountPermissionUpdateContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountPermissionUpdateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.AccountPermissionUpdateContract;

        /**
         * Decodes an AccountPermissionUpdateContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountPermissionUpdateContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.AccountPermissionUpdateContract;

        /**
         * Verifies an AccountPermissionUpdateContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountPermissionUpdateContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountPermissionUpdateContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.AccountPermissionUpdateContract;

        /**
         * Creates a plain object from an AccountPermissionUpdateContract message. Also converts values to other types if specified.
         * @param message AccountPermissionUpdateContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.AccountPermissionUpdateContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountPermissionUpdateContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** AccountType enum. */
    enum AccountType {
        Normal = 0,
        AssetIssue = 1,
        Contract = 2
    }

    /** Properties of an AccountId. */
    interface IAccountId {

        /** AccountId name */
        name?: (Uint8Array|null);

        /** AccountId address */
        address?: (Uint8Array|null);
    }

    /** Represents an AccountId. */
    class AccountId implements IAccountId {

        /**
         * Constructs a new AccountId.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IAccountId);

        /** AccountId name. */
        public name: Uint8Array;

        /** AccountId address. */
        public address: Uint8Array;

        /**
         * Creates a new AccountId instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountId instance
         */
        public static create(properties?: protocol.IAccountId): protocol.AccountId;

        /**
         * Encodes the specified AccountId message. Does not implicitly {@link protocol.AccountId.verify|verify} messages.
         * @param message AccountId message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IAccountId, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountId message, length delimited. Does not implicitly {@link protocol.AccountId.verify|verify} messages.
         * @param message AccountId message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IAccountId, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountId message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountId
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.AccountId;

        /**
         * Decodes an AccountId message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountId
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.AccountId;

        /**
         * Verifies an AccountId message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountId message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountId
         */
        public static fromObject(object: { [k: string]: any }): protocol.AccountId;

        /**
         * Creates a plain object from an AccountId message. Also converts values to other types if specified.
         * @param message AccountId
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.AccountId, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountId to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Vote. */
    interface IVote {

        /** Vote voteAddress */
        voteAddress?: (Uint8Array|null);

        /** Vote voteCount */
        voteCount?: (number|Long|null);
    }

    /** Represents a Vote. */
    class Vote implements IVote {

        /**
         * Constructs a new Vote.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IVote);

        /** Vote voteAddress. */
        public voteAddress: Uint8Array;

        /** Vote voteCount. */
        public voteCount: (number|Long);

        /**
         * Creates a new Vote instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Vote instance
         */
        public static create(properties?: protocol.IVote): protocol.Vote;

        /**
         * Encodes the specified Vote message. Does not implicitly {@link protocol.Vote.verify|verify} messages.
         * @param message Vote message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Vote message, length delimited. Does not implicitly {@link protocol.Vote.verify|verify} messages.
         * @param message Vote message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Vote message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Vote
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Vote;

        /**
         * Decodes a Vote message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Vote
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Vote;

        /**
         * Verifies a Vote message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Vote message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Vote
         */
        public static fromObject(object: { [k: string]: any }): protocol.Vote;

        /**
         * Creates a plain object from a Vote message. Also converts values to other types if specified.
         * @param message Vote
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Vote, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Vote to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Proposal. */
    interface IProposal {

        /** Proposal proposalId */
        proposalId?: (number|Long|null);

        /** Proposal proposerAddress */
        proposerAddress?: (Uint8Array|null);

        /** Proposal parameters */
        parameters?: ({ [k: string]: (number|Long) }|null);

        /** Proposal expirationTime */
        expirationTime?: (number|Long|null);

        /** Proposal createTime */
        createTime?: (number|Long|null);

        /** Proposal approvals */
        approvals?: (Uint8Array[]|null);

        /** Proposal state */
        state?: (protocol.Proposal.State|null);
    }

    /** Represents a Proposal. */
    class Proposal implements IProposal {

        /**
         * Constructs a new Proposal.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IProposal);

        /** Proposal proposalId. */
        public proposalId: (number|Long);

        /** Proposal proposerAddress. */
        public proposerAddress: Uint8Array;

        /** Proposal parameters. */
        public parameters: { [k: string]: (number|Long) };

        /** Proposal expirationTime. */
        public expirationTime: (number|Long);

        /** Proposal createTime. */
        public createTime: (number|Long);

        /** Proposal approvals. */
        public approvals: Uint8Array[];

        /** Proposal state. */
        public state: protocol.Proposal.State;

        /**
         * Creates a new Proposal instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Proposal instance
         */
        public static create(properties?: protocol.IProposal): protocol.Proposal;

        /**
         * Encodes the specified Proposal message. Does not implicitly {@link protocol.Proposal.verify|verify} messages.
         * @param message Proposal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IProposal, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Proposal message, length delimited. Does not implicitly {@link protocol.Proposal.verify|verify} messages.
         * @param message Proposal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IProposal, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Proposal message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Proposal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Proposal;

        /**
         * Decodes a Proposal message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Proposal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Proposal;

        /**
         * Verifies a Proposal message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Proposal message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Proposal
         */
        public static fromObject(object: { [k: string]: any }): protocol.Proposal;

        /**
         * Creates a plain object from a Proposal message. Also converts values to other types if specified.
         * @param message Proposal
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Proposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Proposal to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace Proposal {

        /** State enum. */
        enum State {
            PENDING = 0,
            DISAPPROVED = 1,
            APPROVED = 2,
            CANCELED = 3
        }
    }

    /** Properties of an Exchange. */
    interface IExchange {

        /** Exchange exchangeId */
        exchangeId?: (number|Long|null);

        /** Exchange creatorAddress */
        creatorAddress?: (Uint8Array|null);

        /** Exchange createTime */
        createTime?: (number|Long|null);

        /** Exchange firstTokenId */
        firstTokenId?: (Uint8Array|null);

        /** Exchange firstTokenBalance */
        firstTokenBalance?: (number|Long|null);

        /** Exchange secondTokenId */
        secondTokenId?: (Uint8Array|null);

        /** Exchange secondTokenBalance */
        secondTokenBalance?: (number|Long|null);
    }

    /** Represents an Exchange. */
    class Exchange implements IExchange {

        /**
         * Constructs a new Exchange.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IExchange);

        /** Exchange exchangeId. */
        public exchangeId: (number|Long);

        /** Exchange creatorAddress. */
        public creatorAddress: Uint8Array;

        /** Exchange createTime. */
        public createTime: (number|Long);

        /** Exchange firstTokenId. */
        public firstTokenId: Uint8Array;

        /** Exchange firstTokenBalance. */
        public firstTokenBalance: (number|Long);

        /** Exchange secondTokenId. */
        public secondTokenId: Uint8Array;

        /** Exchange secondTokenBalance. */
        public secondTokenBalance: (number|Long);

        /**
         * Creates a new Exchange instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Exchange instance
         */
        public static create(properties?: protocol.IExchange): protocol.Exchange;

        /**
         * Encodes the specified Exchange message. Does not implicitly {@link protocol.Exchange.verify|verify} messages.
         * @param message Exchange message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IExchange, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Exchange message, length delimited. Does not implicitly {@link protocol.Exchange.verify|verify} messages.
         * @param message Exchange message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IExchange, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Exchange message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Exchange
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Exchange;

        /**
         * Decodes an Exchange message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Exchange
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Exchange;

        /**
         * Verifies an Exchange message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Exchange message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Exchange
         */
        public static fromObject(object: { [k: string]: any }): protocol.Exchange;

        /**
         * Creates a plain object from an Exchange message. Also converts values to other types if specified.
         * @param message Exchange
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Exchange, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Exchange to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ChainParameters. */
    interface IChainParameters {

        /** ChainParameters chainParameter */
        chainParameter?: (protocol.ChainParameters.IChainParameter[]|null);
    }

    /** Represents a ChainParameters. */
    class ChainParameters implements IChainParameters {

        /**
         * Constructs a new ChainParameters.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IChainParameters);

        /** ChainParameters chainParameter. */
        public chainParameter: protocol.ChainParameters.IChainParameter[];

        /**
         * Creates a new ChainParameters instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChainParameters instance
         */
        public static create(properties?: protocol.IChainParameters): protocol.ChainParameters;

        /**
         * Encodes the specified ChainParameters message. Does not implicitly {@link protocol.ChainParameters.verify|verify} messages.
         * @param message ChainParameters message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IChainParameters, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChainParameters message, length delimited. Does not implicitly {@link protocol.ChainParameters.verify|verify} messages.
         * @param message ChainParameters message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IChainParameters, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChainParameters message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChainParameters
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ChainParameters;

        /**
         * Decodes a ChainParameters message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChainParameters
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ChainParameters;

        /**
         * Verifies a ChainParameters message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChainParameters message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChainParameters
         */
        public static fromObject(object: { [k: string]: any }): protocol.ChainParameters;

        /**
         * Creates a plain object from a ChainParameters message. Also converts values to other types if specified.
         * @param message ChainParameters
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ChainParameters, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChainParameters to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace ChainParameters {

        /** Properties of a ChainParameter. */
        interface IChainParameter {

            /** ChainParameter key */
            key?: (string|null);

            /** ChainParameter value */
            value?: (number|Long|null);
        }

        /** Represents a ChainParameter. */
        class ChainParameter implements IChainParameter {

            /**
             * Constructs a new ChainParameter.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.ChainParameters.IChainParameter);

            /** ChainParameter key. */
            public key: string;

            /** ChainParameter value. */
            public value: (number|Long);

            /**
             * Creates a new ChainParameter instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ChainParameter instance
             */
            public static create(properties?: protocol.ChainParameters.IChainParameter): protocol.ChainParameters.ChainParameter;

            /**
             * Encodes the specified ChainParameter message. Does not implicitly {@link protocol.ChainParameters.ChainParameter.verify|verify} messages.
             * @param message ChainParameter message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.ChainParameters.IChainParameter, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ChainParameter message, length delimited. Does not implicitly {@link protocol.ChainParameters.ChainParameter.verify|verify} messages.
             * @param message ChainParameter message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.ChainParameters.IChainParameter, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ChainParameter message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ChainParameter
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ChainParameters.ChainParameter;

            /**
             * Decodes a ChainParameter message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ChainParameter
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ChainParameters.ChainParameter;

            /**
             * Verifies a ChainParameter message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ChainParameter message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ChainParameter
             */
            public static fromObject(object: { [k: string]: any }): protocol.ChainParameters.ChainParameter;

            /**
             * Creates a plain object from a ChainParameter message. Also converts values to other types if specified.
             * @param message ChainParameter
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.ChainParameters.ChainParameter, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ChainParameter to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of an Account. */
    interface IAccount {

        /** Account accountName */
        accountName?: (Uint8Array|null);

        /** Account type */
        type?: (protocol.AccountType|null);

        /** Account address */
        address?: (Uint8Array|null);

        /** Account balance */
        balance?: (number|Long|null);

        /** Account votes */
        votes?: (protocol.IVote[]|null);

        /** Account asset */
        asset?: ({ [k: string]: (number|Long) }|null);

        /** Account assetV2 */
        assetV2?: ({ [k: string]: (number|Long) }|null);

        /** Account frozen */
        frozen?: (protocol.Account.IFrozen[]|null);

        /** Account netUsage */
        netUsage?: (number|Long|null);

        /** Account acquiredDelegatedFrozenBalanceForBandwidth */
        acquiredDelegatedFrozenBalanceForBandwidth?: (number|Long|null);

        /** Account delegatedFrozenBalanceForBandwidth */
        delegatedFrozenBalanceForBandwidth?: (number|Long|null);

        /** Account createTime */
        createTime?: (number|Long|null);

        /** Account latestOprationTime */
        latestOprationTime?: (number|Long|null);

        /** Account allowance */
        allowance?: (number|Long|null);

        /** Account latestWithdrawTime */
        latestWithdrawTime?: (number|Long|null);

        /** Account code */
        code?: (Uint8Array|null);

        /** Account isWitness */
        isWitness?: (boolean|null);

        /** Account isCommittee */
        isCommittee?: (boolean|null);

        /** Account frozenSupply */
        frozenSupply?: (protocol.Account.IFrozen[]|null);

        /** Account assetIssuedName */
        assetIssuedName?: (Uint8Array|null);

        /** Account assetIssued_ID */
        assetIssued_ID?: (Uint8Array|null);

        /** Account latestAssetOperationTime */
        latestAssetOperationTime?: ({ [k: string]: (number|Long) }|null);

        /** Account latestAssetOperationTimeV2 */
        latestAssetOperationTimeV2?: ({ [k: string]: (number|Long) }|null);

        /** Account freeNetUsage */
        freeNetUsage?: (number|Long|null);

        /** Account freeAssetNetUsage */
        freeAssetNetUsage?: ({ [k: string]: (number|Long) }|null);

        /** Account freeAssetNetUsageV2 */
        freeAssetNetUsageV2?: ({ [k: string]: (number|Long) }|null);

        /** Account latestConsumeTime */
        latestConsumeTime?: (number|Long|null);

        /** Account latestConsumeFreeTime */
        latestConsumeFreeTime?: (number|Long|null);

        /** Account accountId */
        accountId?: (Uint8Array|null);

        /** Account accountResource */
        accountResource?: (protocol.Account.IAccountResource|null);

        /** Account codeHash */
        codeHash?: (Uint8Array|null);

        /** Account ownerPermission */
        ownerPermission?: (protocol.IPermission|null);

        /** Account witnessPermission */
        witnessPermission?: (protocol.IPermission|null);

        /** Account activePermission */
        activePermission?: (protocol.IPermission[]|null);
    }

    /** Represents an Account. */
    class Account implements IAccount {

        /**
         * Constructs a new Account.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IAccount);

        /** Account accountName. */
        public accountName: Uint8Array;

        /** Account type. */
        public type: protocol.AccountType;

        /** Account address. */
        public address: Uint8Array;

        /** Account balance. */
        public balance: (number|Long);

        /** Account votes. */
        public votes: protocol.IVote[];

        /** Account asset. */
        public asset: { [k: string]: (number|Long) };

        /** Account assetV2. */
        public assetV2: { [k: string]: (number|Long) };

        /** Account frozen. */
        public frozen: protocol.Account.IFrozen[];

        /** Account netUsage. */
        public netUsage: (number|Long);

        /** Account acquiredDelegatedFrozenBalanceForBandwidth. */
        public acquiredDelegatedFrozenBalanceForBandwidth: (number|Long);

        /** Account delegatedFrozenBalanceForBandwidth. */
        public delegatedFrozenBalanceForBandwidth: (number|Long);

        /** Account createTime. */
        public createTime: (number|Long);

        /** Account latestOprationTime. */
        public latestOprationTime: (number|Long);

        /** Account allowance. */
        public allowance: (number|Long);

        /** Account latestWithdrawTime. */
        public latestWithdrawTime: (number|Long);

        /** Account code. */
        public code: Uint8Array;

        /** Account isWitness. */
        public isWitness: boolean;

        /** Account isCommittee. */
        public isCommittee: boolean;

        /** Account frozenSupply. */
        public frozenSupply: protocol.Account.IFrozen[];

        /** Account assetIssuedName. */
        public assetIssuedName: Uint8Array;

        /** Account assetIssued_ID. */
        public assetIssued_ID: Uint8Array;

        /** Account latestAssetOperationTime. */
        public latestAssetOperationTime: { [k: string]: (number|Long) };

        /** Account latestAssetOperationTimeV2. */
        public latestAssetOperationTimeV2: { [k: string]: (number|Long) };

        /** Account freeNetUsage. */
        public freeNetUsage: (number|Long);

        /** Account freeAssetNetUsage. */
        public freeAssetNetUsage: { [k: string]: (number|Long) };

        /** Account freeAssetNetUsageV2. */
        public freeAssetNetUsageV2: { [k: string]: (number|Long) };

        /** Account latestConsumeTime. */
        public latestConsumeTime: (number|Long);

        /** Account latestConsumeFreeTime. */
        public latestConsumeFreeTime: (number|Long);

        /** Account accountId. */
        public accountId: Uint8Array;

        /** Account accountResource. */
        public accountResource?: (protocol.Account.IAccountResource|null);

        /** Account codeHash. */
        public codeHash: Uint8Array;

        /** Account ownerPermission. */
        public ownerPermission?: (protocol.IPermission|null);

        /** Account witnessPermission. */
        public witnessPermission?: (protocol.IPermission|null);

        /** Account activePermission. */
        public activePermission: protocol.IPermission[];

        /**
         * Creates a new Account instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Account instance
         */
        public static create(properties?: protocol.IAccount): protocol.Account;

        /**
         * Encodes the specified Account message. Does not implicitly {@link protocol.Account.verify|verify} messages.
         * @param message Account message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IAccount, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Account message, length delimited. Does not implicitly {@link protocol.Account.verify|verify} messages.
         * @param message Account message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IAccount, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Account message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Account;

        /**
         * Decodes an Account message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Account;

        /**
         * Verifies an Account message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Account message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Account
         */
        public static fromObject(object: { [k: string]: any }): protocol.Account;

        /**
         * Creates a plain object from an Account message. Also converts values to other types if specified.
         * @param message Account
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Account, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Account to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace Account {

        /** Properties of a Frozen. */
        interface IFrozen {

            /** Frozen frozenBalance */
            frozenBalance?: (number|Long|null);

            /** Frozen expireTime */
            expireTime?: (number|Long|null);
        }

        /** Represents a Frozen. */
        class Frozen implements IFrozen {

            /**
             * Constructs a new Frozen.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.Account.IFrozen);

            /** Frozen frozenBalance. */
            public frozenBalance: (number|Long);

            /** Frozen expireTime. */
            public expireTime: (number|Long);

            /**
             * Creates a new Frozen instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Frozen instance
             */
            public static create(properties?: protocol.Account.IFrozen): protocol.Account.Frozen;

            /**
             * Encodes the specified Frozen message. Does not implicitly {@link protocol.Account.Frozen.verify|verify} messages.
             * @param message Frozen message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.Account.IFrozen, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Frozen message, length delimited. Does not implicitly {@link protocol.Account.Frozen.verify|verify} messages.
             * @param message Frozen message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.Account.IFrozen, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Frozen message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Frozen
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Account.Frozen;

            /**
             * Decodes a Frozen message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Frozen
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Account.Frozen;

            /**
             * Verifies a Frozen message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Frozen message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Frozen
             */
            public static fromObject(object: { [k: string]: any }): protocol.Account.Frozen;

            /**
             * Creates a plain object from a Frozen message. Also converts values to other types if specified.
             * @param message Frozen
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.Account.Frozen, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Frozen to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an AccountResource. */
        interface IAccountResource {

            /** AccountResource energyUsage */
            energyUsage?: (number|Long|null);

            /** AccountResource frozenBalanceForEnergy */
            frozenBalanceForEnergy?: (protocol.Account.IFrozen|null);

            /** AccountResource latestConsumeTimeForEnergy */
            latestConsumeTimeForEnergy?: (number|Long|null);

            /** AccountResource acquiredDelegatedFrozenBalanceForEnergy */
            acquiredDelegatedFrozenBalanceForEnergy?: (number|Long|null);

            /** AccountResource delegatedFrozenBalanceForEnergy */
            delegatedFrozenBalanceForEnergy?: (number|Long|null);

            /** AccountResource storageLimit */
            storageLimit?: (number|Long|null);

            /** AccountResource storageUsage */
            storageUsage?: (number|Long|null);

            /** AccountResource latestExchangeStorageTime */
            latestExchangeStorageTime?: (number|Long|null);
        }

        /** Represents an AccountResource. */
        class AccountResource implements IAccountResource {

            /**
             * Constructs a new AccountResource.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.Account.IAccountResource);

            /** AccountResource energyUsage. */
            public energyUsage: (number|Long);

            /** AccountResource frozenBalanceForEnergy. */
            public frozenBalanceForEnergy?: (protocol.Account.IFrozen|null);

            /** AccountResource latestConsumeTimeForEnergy. */
            public latestConsumeTimeForEnergy: (number|Long);

            /** AccountResource acquiredDelegatedFrozenBalanceForEnergy. */
            public acquiredDelegatedFrozenBalanceForEnergy: (number|Long);

            /** AccountResource delegatedFrozenBalanceForEnergy. */
            public delegatedFrozenBalanceForEnergy: (number|Long);

            /** AccountResource storageLimit. */
            public storageLimit: (number|Long);

            /** AccountResource storageUsage. */
            public storageUsage: (number|Long);

            /** AccountResource latestExchangeStorageTime. */
            public latestExchangeStorageTime: (number|Long);

            /**
             * Creates a new AccountResource instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AccountResource instance
             */
            public static create(properties?: protocol.Account.IAccountResource): protocol.Account.AccountResource;

            /**
             * Encodes the specified AccountResource message. Does not implicitly {@link protocol.Account.AccountResource.verify|verify} messages.
             * @param message AccountResource message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.Account.IAccountResource, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AccountResource message, length delimited. Does not implicitly {@link protocol.Account.AccountResource.verify|verify} messages.
             * @param message AccountResource message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.Account.IAccountResource, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AccountResource message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns AccountResource
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Account.AccountResource;

            /**
             * Decodes an AccountResource message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns AccountResource
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Account.AccountResource;

            /**
             * Verifies an AccountResource message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AccountResource message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AccountResource
             */
            public static fromObject(object: { [k: string]: any }): protocol.Account.AccountResource;

            /**
             * Creates a plain object from an AccountResource message. Also converts values to other types if specified.
             * @param message AccountResource
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.Account.AccountResource, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AccountResource to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a Key. */
    interface IKey {

        /** Key address */
        address?: (Uint8Array|null);

        /** Key weight */
        weight?: (number|Long|null);
    }

    /** Represents a Key. */
    class Key implements IKey {

        /**
         * Constructs a new Key.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IKey);

        /** Key address. */
        public address: Uint8Array;

        /** Key weight. */
        public weight: (number|Long);

        /**
         * Creates a new Key instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Key instance
         */
        public static create(properties?: protocol.IKey): protocol.Key;

        /**
         * Encodes the specified Key message. Does not implicitly {@link protocol.Key.verify|verify} messages.
         * @param message Key message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IKey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Key message, length delimited. Does not implicitly {@link protocol.Key.verify|verify} messages.
         * @param message Key message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IKey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Key message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Key
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Key;

        /**
         * Decodes a Key message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Key
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Key;

        /**
         * Verifies a Key message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Key message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Key
         */
        public static fromObject(object: { [k: string]: any }): protocol.Key;

        /**
         * Creates a plain object from a Key message. Also converts values to other types if specified.
         * @param message Key
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Key, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Key to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a DelegatedResource. */
    interface IDelegatedResource {

        /** DelegatedResource from */
        from?: (Uint8Array|null);

        /** DelegatedResource to */
        to?: (Uint8Array|null);

        /** DelegatedResource frozenBalanceForBandwidth */
        frozenBalanceForBandwidth?: (number|Long|null);

        /** DelegatedResource frozenBalanceForEnergy */
        frozenBalanceForEnergy?: (number|Long|null);

        /** DelegatedResource expireTimeForBandwidth */
        expireTimeForBandwidth?: (number|Long|null);

        /** DelegatedResource expireTimeForEnergy */
        expireTimeForEnergy?: (number|Long|null);
    }

    /** Represents a DelegatedResource. */
    class DelegatedResource implements IDelegatedResource {

        /**
         * Constructs a new DelegatedResource.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IDelegatedResource);

        /** DelegatedResource from. */
        public from: Uint8Array;

        /** DelegatedResource to. */
        public to: Uint8Array;

        /** DelegatedResource frozenBalanceForBandwidth. */
        public frozenBalanceForBandwidth: (number|Long);

        /** DelegatedResource frozenBalanceForEnergy. */
        public frozenBalanceForEnergy: (number|Long);

        /** DelegatedResource expireTimeForBandwidth. */
        public expireTimeForBandwidth: (number|Long);

        /** DelegatedResource expireTimeForEnergy. */
        public expireTimeForEnergy: (number|Long);

        /**
         * Creates a new DelegatedResource instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DelegatedResource instance
         */
        public static create(properties?: protocol.IDelegatedResource): protocol.DelegatedResource;

        /**
         * Encodes the specified DelegatedResource message. Does not implicitly {@link protocol.DelegatedResource.verify|verify} messages.
         * @param message DelegatedResource message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IDelegatedResource, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DelegatedResource message, length delimited. Does not implicitly {@link protocol.DelegatedResource.verify|verify} messages.
         * @param message DelegatedResource message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IDelegatedResource, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DelegatedResource message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DelegatedResource
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.DelegatedResource;

        /**
         * Decodes a DelegatedResource message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DelegatedResource
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.DelegatedResource;

        /**
         * Verifies a DelegatedResource message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DelegatedResource message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DelegatedResource
         */
        public static fromObject(object: { [k: string]: any }): protocol.DelegatedResource;

        /**
         * Creates a plain object from a DelegatedResource message. Also converts values to other types if specified.
         * @param message DelegatedResource
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.DelegatedResource, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DelegatedResource to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an authority. */
    interface Iauthority {

        /** authority account */
        account?: (protocol.IAccountId|null);

        /** authority permissionName */
        permissionName?: (Uint8Array|null);
    }

    /** Represents an authority. */
    class authority implements Iauthority {

        /**
         * Constructs a new authority.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.Iauthority);

        /** authority account. */
        public account?: (protocol.IAccountId|null);

        /** authority permissionName. */
        public permissionName: Uint8Array;

        /**
         * Creates a new authority instance using the specified properties.
         * @param [properties] Properties to set
         * @returns authority instance
         */
        public static create(properties?: protocol.Iauthority): protocol.authority;

        /**
         * Encodes the specified authority message. Does not implicitly {@link protocol.authority.verify|verify} messages.
         * @param message authority message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.Iauthority, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified authority message, length delimited. Does not implicitly {@link protocol.authority.verify|verify} messages.
         * @param message authority message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.Iauthority, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an authority message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns authority
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.authority;

        /**
         * Decodes an authority message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns authority
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.authority;

        /**
         * Verifies an authority message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an authority message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns authority
         */
        public static fromObject(object: { [k: string]: any }): protocol.authority;

        /**
         * Creates a plain object from an authority message. Also converts values to other types if specified.
         * @param message authority
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.authority, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this authority to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Permission. */
    interface IPermission {

        /** Permission type */
        type?: (protocol.Permission.PermissionType|null);

        /** Permission id */
        id?: (number|null);

        /** Permission permissionName */
        permissionName?: (string|null);

        /** Permission threshold */
        threshold?: (number|Long|null);

        /** Permission parentId */
        parentId?: (number|null);

        /** Permission operations */
        operations?: (Uint8Array|null);

        /** Permission keys */
        keys?: (protocol.IKey[]|null);
    }

    /** Represents a Permission. */
    class Permission implements IPermission {

        /**
         * Constructs a new Permission.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IPermission);

        /** Permission type. */
        public type: protocol.Permission.PermissionType;

        /** Permission id. */
        public id: number;

        /** Permission permissionName. */
        public permissionName: string;

        /** Permission threshold. */
        public threshold: (number|Long);

        /** Permission parentId. */
        public parentId: number;

        /** Permission operations. */
        public operations: Uint8Array;

        /** Permission keys. */
        public keys: protocol.IKey[];

        /**
         * Creates a new Permission instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Permission instance
         */
        public static create(properties?: protocol.IPermission): protocol.Permission;

        /**
         * Encodes the specified Permission message. Does not implicitly {@link protocol.Permission.verify|verify} messages.
         * @param message Permission message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IPermission, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Permission message, length delimited. Does not implicitly {@link protocol.Permission.verify|verify} messages.
         * @param message Permission message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IPermission, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Permission message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Permission
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Permission;

        /**
         * Decodes a Permission message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Permission
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Permission;

        /**
         * Verifies a Permission message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Permission message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Permission
         */
        public static fromObject(object: { [k: string]: any }): protocol.Permission;

        /**
         * Creates a plain object from a Permission message. Also converts values to other types if specified.
         * @param message Permission
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Permission, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Permission to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace Permission {

        /** PermissionType enum. */
        enum PermissionType {
            Owner = 0,
            Witness = 1,
            Active = 2
        }
    }

    /** Properties of a Witness. */
    interface IWitness {

        /** Witness address */
        address?: (Uint8Array|null);

        /** Witness voteCount */
        voteCount?: (number|Long|null);

        /** Witness pubKey */
        pubKey?: (Uint8Array|null);

        /** Witness url */
        url?: (string|null);

        /** Witness totalProduced */
        totalProduced?: (number|Long|null);

        /** Witness totalMissed */
        totalMissed?: (number|Long|null);

        /** Witness latestBlockNum */
        latestBlockNum?: (number|Long|null);

        /** Witness latestSlotNum */
        latestSlotNum?: (number|Long|null);

        /** Witness isJobs */
        isJobs?: (boolean|null);
    }

    /** Represents a Witness. */
    class Witness implements IWitness {

        /**
         * Constructs a new Witness.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IWitness);

        /** Witness address. */
        public address: Uint8Array;

        /** Witness voteCount. */
        public voteCount: (number|Long);

        /** Witness pubKey. */
        public pubKey: Uint8Array;

        /** Witness url. */
        public url: string;

        /** Witness totalProduced. */
        public totalProduced: (number|Long);

        /** Witness totalMissed. */
        public totalMissed: (number|Long);

        /** Witness latestBlockNum. */
        public latestBlockNum: (number|Long);

        /** Witness latestSlotNum. */
        public latestSlotNum: (number|Long);

        /** Witness isJobs. */
        public isJobs: boolean;

        /**
         * Creates a new Witness instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Witness instance
         */
        public static create(properties?: protocol.IWitness): protocol.Witness;

        /**
         * Encodes the specified Witness message. Does not implicitly {@link protocol.Witness.verify|verify} messages.
         * @param message Witness message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IWitness, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Witness message, length delimited. Does not implicitly {@link protocol.Witness.verify|verify} messages.
         * @param message Witness message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IWitness, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Witness message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Witness
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Witness;

        /**
         * Decodes a Witness message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Witness
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Witness;

        /**
         * Verifies a Witness message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Witness message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Witness
         */
        public static fromObject(object: { [k: string]: any }): protocol.Witness;

        /**
         * Creates a plain object from a Witness message. Also converts values to other types if specified.
         * @param message Witness
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Witness, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Witness to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Votes. */
    interface IVotes {

        /** Votes address */
        address?: (Uint8Array|null);

        /** Votes oldVotes */
        oldVotes?: (protocol.IVote[]|null);

        /** Votes newVotes */
        newVotes?: (protocol.IVote[]|null);
    }

    /** Represents a Votes. */
    class Votes implements IVotes {

        /**
         * Constructs a new Votes.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IVotes);

        /** Votes address. */
        public address: Uint8Array;

        /** Votes oldVotes. */
        public oldVotes: protocol.IVote[];

        /** Votes newVotes. */
        public newVotes: protocol.IVote[];

        /**
         * Creates a new Votes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Votes instance
         */
        public static create(properties?: protocol.IVotes): protocol.Votes;

        /**
         * Encodes the specified Votes message. Does not implicitly {@link protocol.Votes.verify|verify} messages.
         * @param message Votes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IVotes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Votes message, length delimited. Does not implicitly {@link protocol.Votes.verify|verify} messages.
         * @param message Votes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IVotes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Votes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Votes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Votes;

        /**
         * Decodes a Votes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Votes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Votes;

        /**
         * Verifies a Votes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Votes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Votes
         */
        public static fromObject(object: { [k: string]: any }): protocol.Votes;

        /**
         * Creates a plain object from a Votes message. Also converts values to other types if specified.
         * @param message Votes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Votes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Votes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a TXOutput. */
    interface ITXOutput {

        /** TXOutput value */
        value?: (number|Long|null);

        /** TXOutput pubKeyHash */
        pubKeyHash?: (Uint8Array|null);
    }

    /** Represents a TXOutput. */
    class TXOutput implements ITXOutput {

        /**
         * Constructs a new TXOutput.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITXOutput);

        /** TXOutput value. */
        public value: (number|Long);

        /** TXOutput pubKeyHash. */
        public pubKeyHash: Uint8Array;

        /**
         * Creates a new TXOutput instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TXOutput instance
         */
        public static create(properties?: protocol.ITXOutput): protocol.TXOutput;

        /**
         * Encodes the specified TXOutput message. Does not implicitly {@link protocol.TXOutput.verify|verify} messages.
         * @param message TXOutput message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITXOutput, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TXOutput message, length delimited. Does not implicitly {@link protocol.TXOutput.verify|verify} messages.
         * @param message TXOutput message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITXOutput, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TXOutput message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TXOutput
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TXOutput;

        /**
         * Decodes a TXOutput message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TXOutput
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TXOutput;

        /**
         * Verifies a TXOutput message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TXOutput message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TXOutput
         */
        public static fromObject(object: { [k: string]: any }): protocol.TXOutput;

        /**
         * Creates a plain object from a TXOutput message. Also converts values to other types if specified.
         * @param message TXOutput
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TXOutput, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TXOutput to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a TXInput. */
    interface ITXInput {

        /** TXInput rawData */
        rawData?: (protocol.TXInput.Iraw|null);

        /** TXInput signature */
        signature?: (Uint8Array|null);
    }

    /** Represents a TXInput. */
    class TXInput implements ITXInput {

        /**
         * Constructs a new TXInput.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITXInput);

        /** TXInput rawData. */
        public rawData?: (protocol.TXInput.Iraw|null);

        /** TXInput signature. */
        public signature: Uint8Array;

        /**
         * Creates a new TXInput instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TXInput instance
         */
        public static create(properties?: protocol.ITXInput): protocol.TXInput;

        /**
         * Encodes the specified TXInput message. Does not implicitly {@link protocol.TXInput.verify|verify} messages.
         * @param message TXInput message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITXInput, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TXInput message, length delimited. Does not implicitly {@link protocol.TXInput.verify|verify} messages.
         * @param message TXInput message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITXInput, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TXInput message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TXInput
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TXInput;

        /**
         * Decodes a TXInput message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TXInput
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TXInput;

        /**
         * Verifies a TXInput message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TXInput message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TXInput
         */
        public static fromObject(object: { [k: string]: any }): protocol.TXInput;

        /**
         * Creates a plain object from a TXInput message. Also converts values to other types if specified.
         * @param message TXInput
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TXInput, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TXInput to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace TXInput {

        /** Properties of a raw. */
        interface Iraw {

            /** raw txID */
            txID?: (Uint8Array|null);

            /** raw vout */
            vout?: (number|Long|null);

            /** raw pubKey */
            pubKey?: (Uint8Array|null);
        }

        /** Represents a raw. */
        class raw implements Iraw {

            /**
             * Constructs a new raw.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.TXInput.Iraw);

            /** raw txID. */
            public txID: Uint8Array;

            /** raw vout. */
            public vout: (number|Long);

            /** raw pubKey. */
            public pubKey: Uint8Array;

            /**
             * Creates a new raw instance using the specified properties.
             * @param [properties] Properties to set
             * @returns raw instance
             */
            public static create(properties?: protocol.TXInput.Iraw): protocol.TXInput.raw;

            /**
             * Encodes the specified raw message. Does not implicitly {@link protocol.TXInput.raw.verify|verify} messages.
             * @param message raw message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.TXInput.Iraw, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified raw message, length delimited. Does not implicitly {@link protocol.TXInput.raw.verify|verify} messages.
             * @param message raw message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.TXInput.Iraw, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a raw message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns raw
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TXInput.raw;

            /**
             * Decodes a raw message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns raw
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TXInput.raw;

            /**
             * Verifies a raw message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a raw message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns raw
             */
            public static fromObject(object: { [k: string]: any }): protocol.TXInput.raw;

            /**
             * Creates a plain object from a raw message. Also converts values to other types if specified.
             * @param message raw
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.TXInput.raw, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this raw to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a TXOutputs. */
    interface ITXOutputs {

        /** TXOutputs outputs */
        outputs?: (protocol.ITXOutput[]|null);
    }

    /** Represents a TXOutputs. */
    class TXOutputs implements ITXOutputs {

        /**
         * Constructs a new TXOutputs.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITXOutputs);

        /** TXOutputs outputs. */
        public outputs: protocol.ITXOutput[];

        /**
         * Creates a new TXOutputs instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TXOutputs instance
         */
        public static create(properties?: protocol.ITXOutputs): protocol.TXOutputs;

        /**
         * Encodes the specified TXOutputs message. Does not implicitly {@link protocol.TXOutputs.verify|verify} messages.
         * @param message TXOutputs message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITXOutputs, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TXOutputs message, length delimited. Does not implicitly {@link protocol.TXOutputs.verify|verify} messages.
         * @param message TXOutputs message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITXOutputs, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TXOutputs message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TXOutputs
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TXOutputs;

        /**
         * Decodes a TXOutputs message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TXOutputs
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TXOutputs;

        /**
         * Verifies a TXOutputs message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TXOutputs message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TXOutputs
         */
        public static fromObject(object: { [k: string]: any }): protocol.TXOutputs;

        /**
         * Creates a plain object from a TXOutputs message. Also converts values to other types if specified.
         * @param message TXOutputs
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TXOutputs, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TXOutputs to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ResourceReceipt. */
    interface IResourceReceipt {

        /** ResourceReceipt energyUsage */
        energyUsage?: (number|Long|null);

        /** ResourceReceipt energyFee */
        energyFee?: (number|Long|null);

        /** ResourceReceipt originEnergyUsage */
        originEnergyUsage?: (number|Long|null);

        /** ResourceReceipt energyUsageTotal */
        energyUsageTotal?: (number|Long|null);

        /** ResourceReceipt netUsage */
        netUsage?: (number|Long|null);

        /** ResourceReceipt netFee */
        netFee?: (number|Long|null);

        /** ResourceReceipt result */
        result?: (protocol.Transaction.Result.contractResult|null);
    }

    /** Represents a ResourceReceipt. */
    class ResourceReceipt implements IResourceReceipt {

        /**
         * Constructs a new ResourceReceipt.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IResourceReceipt);

        /** ResourceReceipt energyUsage. */
        public energyUsage: (number|Long);

        /** ResourceReceipt energyFee. */
        public energyFee: (number|Long);

        /** ResourceReceipt originEnergyUsage. */
        public originEnergyUsage: (number|Long);

        /** ResourceReceipt energyUsageTotal. */
        public energyUsageTotal: (number|Long);

        /** ResourceReceipt netUsage. */
        public netUsage: (number|Long);

        /** ResourceReceipt netFee. */
        public netFee: (number|Long);

        /** ResourceReceipt result. */
        public result: protocol.Transaction.Result.contractResult;

        /**
         * Creates a new ResourceReceipt instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ResourceReceipt instance
         */
        public static create(properties?: protocol.IResourceReceipt): protocol.ResourceReceipt;

        /**
         * Encodes the specified ResourceReceipt message. Does not implicitly {@link protocol.ResourceReceipt.verify|verify} messages.
         * @param message ResourceReceipt message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IResourceReceipt, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ResourceReceipt message, length delimited. Does not implicitly {@link protocol.ResourceReceipt.verify|verify} messages.
         * @param message ResourceReceipt message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IResourceReceipt, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ResourceReceipt message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ResourceReceipt
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ResourceReceipt;

        /**
         * Decodes a ResourceReceipt message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ResourceReceipt
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ResourceReceipt;

        /**
         * Verifies a ResourceReceipt message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ResourceReceipt message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ResourceReceipt
         */
        public static fromObject(object: { [k: string]: any }): protocol.ResourceReceipt;

        /**
         * Creates a plain object from a ResourceReceipt message. Also converts values to other types if specified.
         * @param message ResourceReceipt
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ResourceReceipt, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ResourceReceipt to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Transaction. */
    interface ITransaction {

        /** Transaction rawData */
        rawData?: (protocol.Transaction.Iraw|null);

        /** Transaction signature */
        signature?: (Uint8Array[]|null);

        /** Transaction ret */
        ret?: (protocol.Transaction.IResult[]|null);
    }

    /** Represents a Transaction. */
    class Transaction implements ITransaction {

        /**
         * Constructs a new Transaction.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITransaction);

        /** Transaction rawData. */
        public rawData?: (protocol.Transaction.Iraw|null);

        /** Transaction signature. */
        public signature: Uint8Array[];

        /** Transaction ret. */
        public ret: protocol.Transaction.IResult[];

        /**
         * Creates a new Transaction instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Transaction instance
         */
        public static create(properties?: protocol.ITransaction): protocol.Transaction;

        /**
         * Encodes the specified Transaction message. Does not implicitly {@link protocol.Transaction.verify|verify} messages.
         * @param message Transaction message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Transaction message, length delimited. Does not implicitly {@link protocol.Transaction.verify|verify} messages.
         * @param message Transaction message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Transaction message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Transaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Transaction;

        /**
         * Decodes a Transaction message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Transaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Transaction;

        /**
         * Verifies a Transaction message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Transaction message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Transaction
         */
        public static fromObject(object: { [k: string]: any }): protocol.Transaction;

        /**
         * Creates a plain object from a Transaction message. Also converts values to other types if specified.
         * @param message Transaction
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Transaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Transaction to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace Transaction {

        /** Properties of a Contract. */
        interface IContract {

            /** Contract type */
            type?: (protocol.Transaction.Contract.ContractType|null);

            /** Contract parameter */
            parameter?: (google.protobuf.IAny|null);

            /** Contract provider */
            provider?: (Uint8Array|null);

            /** Contract ContractName */
            ContractName?: (Uint8Array|null);

            /** Contract PermissionId */
            PermissionId?: (number|null);
        }

        /** Represents a Contract. */
        class Contract implements IContract {

            /**
             * Constructs a new Contract.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.Transaction.IContract);

            /** Contract type. */
            public type: protocol.Transaction.Contract.ContractType;

            /** Contract parameter. */
            public parameter?: (google.protobuf.IAny|null);

            /** Contract provider. */
            public provider: Uint8Array;

            /** Contract ContractName. */
            public ContractName: Uint8Array;

            /** Contract PermissionId. */
            public PermissionId: number;

            /**
             * Creates a new Contract instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Contract instance
             */
            public static create(properties?: protocol.Transaction.IContract): protocol.Transaction.Contract;

            /**
             * Encodes the specified Contract message. Does not implicitly {@link protocol.Transaction.Contract.verify|verify} messages.
             * @param message Contract message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.Transaction.IContract, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Contract message, length delimited. Does not implicitly {@link protocol.Transaction.Contract.verify|verify} messages.
             * @param message Contract message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.Transaction.IContract, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Contract message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Contract
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Transaction.Contract;

            /**
             * Decodes a Contract message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Contract
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Transaction.Contract;

            /**
             * Verifies a Contract message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Contract message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Contract
             */
            public static fromObject(object: { [k: string]: any }): protocol.Transaction.Contract;

            /**
             * Creates a plain object from a Contract message. Also converts values to other types if specified.
             * @param message Contract
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.Transaction.Contract, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Contract to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Contract {

            /** ContractType enum. */
            enum ContractType {
                AccountCreateContract = 0,
                TransferContract = 1,
                TransferAssetContract = 2,
                VoteAssetContract = 3,
                VoteWitnessContract = 4,
                WitnessCreateContract = 5,
                AssetIssueContract = 6,
                WitnessUpdateContract = 8,
                ParticipateAssetIssueContract = 9,
                AccountUpdateContract = 10,
                FreezeBalanceContract = 11,
                UnfreezeBalanceContract = 12,
                WithdrawBalanceContract = 13,
                UnfreezeAssetContract = 14,
                UpdateAssetContract = 15,
                ProposalCreateContract = 16,
                ProposalApproveContract = 17,
                ProposalDeleteContract = 18,
                SetAccountIdContract = 19,
                CustomContract = 20,
                CreateSmartContract = 30,
                TriggerSmartContract = 31,
                GetContract = 32,
                UpdateSettingContract = 33,
                ExchangeCreateContract = 41,
                ExchangeInjectContract = 42,
                ExchangeWithdrawContract = 43,
                ExchangeTransactionContract = 44,
                UpdateEnergyLimitContract = 45,
                AccountPermissionUpdateContract = 46,
                ClearABIContract = 48
            }
        }

        /** Properties of a Result. */
        interface IResult {

            /** Result fee */
            fee?: (number|Long|null);

            /** Result ret */
            ret?: (protocol.Transaction.Result.code|null);

            /** Result contractRet */
            contractRet?: (protocol.Transaction.Result.contractResult|null);

            /** Result assetIssueID */
            assetIssueID?: (string|null);

            /** Result withdrawAmount */
            withdrawAmount?: (number|Long|null);

            /** Result unfreezeAmount */
            unfreezeAmount?: (number|Long|null);

            /** Result exchangeReceivedAmount */
            exchangeReceivedAmount?: (number|Long|null);

            /** Result exchangeInjectAnotherAmount */
            exchangeInjectAnotherAmount?: (number|Long|null);

            /** Result exchangeWithdrawAnotherAmount */
            exchangeWithdrawAnotherAmount?: (number|Long|null);

            /** Result exchangeId */
            exchangeId?: (number|Long|null);
        }

        /** Represents a Result. */
        class Result implements IResult {

            /**
             * Constructs a new Result.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.Transaction.IResult);

            /** Result fee. */
            public fee: (number|Long);

            /** Result ret. */
            public ret: protocol.Transaction.Result.code;

            /** Result contractRet. */
            public contractRet: protocol.Transaction.Result.contractResult;

            /** Result assetIssueID. */
            public assetIssueID: string;

            /** Result withdrawAmount. */
            public withdrawAmount: (number|Long);

            /** Result unfreezeAmount. */
            public unfreezeAmount: (number|Long);

            /** Result exchangeReceivedAmount. */
            public exchangeReceivedAmount: (number|Long);

            /** Result exchangeInjectAnotherAmount. */
            public exchangeInjectAnotherAmount: (number|Long);

            /** Result exchangeWithdrawAnotherAmount. */
            public exchangeWithdrawAnotherAmount: (number|Long);

            /** Result exchangeId. */
            public exchangeId: (number|Long);

            /**
             * Creates a new Result instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Result instance
             */
            public static create(properties?: protocol.Transaction.IResult): protocol.Transaction.Result;

            /**
             * Encodes the specified Result message. Does not implicitly {@link protocol.Transaction.Result.verify|verify} messages.
             * @param message Result message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.Transaction.IResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Result message, length delimited. Does not implicitly {@link protocol.Transaction.Result.verify|verify} messages.
             * @param message Result message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.Transaction.IResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Result message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Result
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Transaction.Result;

            /**
             * Decodes a Result message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Result
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Transaction.Result;

            /**
             * Verifies a Result message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Result message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Result
             */
            public static fromObject(object: { [k: string]: any }): protocol.Transaction.Result;

            /**
             * Creates a plain object from a Result message. Also converts values to other types if specified.
             * @param message Result
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.Transaction.Result, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Result to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Result {

            /** code enum. */
            enum code {
                SUCESS = 0,
                FAILED = 1
            }

            /** contractResult enum. */
            enum contractResult {
                DEFAULT = 0,
                SUCCESS = 1,
                REVERT = 2,
                BAD_JUMP_DESTINATION = 3,
                OUT_OF_MEMORY = 4,
                PRECOMPILED_CONTRACT = 5,
                STACK_TOO_SMALL = 6,
                STACK_TOO_LARGE = 7,
                ILLEGAL_OPERATION = 8,
                STACK_OVERFLOW = 9,
                OUT_OF_ENERGY = 10,
                OUT_OF_TIME = 11,
                JVM_STACK_OVER_FLOW = 12,
                UNKNOWN = 13,
                TRANSFER_FAILED = 14
            }
        }

        /** Properties of a raw. */
        interface Iraw {

            /** raw refBlockBytes */
            refBlockBytes?: (Uint8Array|null);

            /** raw refBlockNum */
            refBlockNum?: (number|Long|null);

            /** raw refBlockHash */
            refBlockHash?: (Uint8Array|null);

            /** raw expiration */
            expiration?: (number|Long|null);

            /** raw auths */
            auths?: (protocol.Iauthority[]|null);

            /** raw data */
            data?: (Uint8Array|null);

            /** raw contract */
            contract?: (protocol.Transaction.IContract[]|null);

            /** raw scripts */
            scripts?: (Uint8Array|null);

            /** raw timestamp */
            timestamp?: (number|Long|null);

            /** raw feeLimit */
            feeLimit?: (number|Long|null);
        }

        /** Represents a raw. */
        class raw implements Iraw {

            /**
             * Constructs a new raw.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.Transaction.Iraw);

            /** raw refBlockBytes. */
            public refBlockBytes: Uint8Array;

            /** raw refBlockNum. */
            public refBlockNum: (number|Long);

            /** raw refBlockHash. */
            public refBlockHash: Uint8Array;

            /** raw expiration. */
            public expiration: (number|Long);

            /** raw auths. */
            public auths: protocol.Iauthority[];

            /** raw data. */
            public data: Uint8Array;

            /** raw contract. */
            public contract: protocol.Transaction.IContract[];

            /** raw scripts. */
            public scripts: Uint8Array;

            /** raw timestamp. */
            public timestamp: (number|Long);

            /** raw feeLimit. */
            public feeLimit: (number|Long);

            /**
             * Creates a new raw instance using the specified properties.
             * @param [properties] Properties to set
             * @returns raw instance
             */
            public static create(properties?: protocol.Transaction.Iraw): protocol.Transaction.raw;

            /**
             * Encodes the specified raw message. Does not implicitly {@link protocol.Transaction.raw.verify|verify} messages.
             * @param message raw message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.Transaction.Iraw, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified raw message, length delimited. Does not implicitly {@link protocol.Transaction.raw.verify|verify} messages.
             * @param message raw message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.Transaction.Iraw, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a raw message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns raw
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Transaction.raw;

            /**
             * Decodes a raw message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns raw
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Transaction.raw;

            /**
             * Verifies a raw message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a raw message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns raw
             */
            public static fromObject(object: { [k: string]: any }): protocol.Transaction.raw;

            /**
             * Creates a plain object from a raw message. Also converts values to other types if specified.
             * @param message raw
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.Transaction.raw, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this raw to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a TransactionInfo. */
    interface ITransactionInfo {

        /** TransactionInfo id */
        id?: (Uint8Array|null);

        /** TransactionInfo fee */
        fee?: (number|Long|null);

        /** TransactionInfo blockNumber */
        blockNumber?: (number|Long|null);

        /** TransactionInfo blockTimeStamp */
        blockTimeStamp?: (number|Long|null);

        /** TransactionInfo contractResult */
        contractResult?: (Uint8Array[]|null);

        /** TransactionInfo contractAddress */
        contractAddress?: (Uint8Array|null);

        /** TransactionInfo receipt */
        receipt?: (protocol.IResourceReceipt|null);

        /** TransactionInfo log */
        log?: (protocol.TransactionInfo.ILog[]|null);

        /** TransactionInfo result */
        result?: (protocol.TransactionInfo.code|null);

        /** TransactionInfo resMessage */
        resMessage?: (Uint8Array|null);

        /** TransactionInfo assetIssueID */
        assetIssueID?: (string|null);

        /** TransactionInfo withdrawAmount */
        withdrawAmount?: (number|Long|null);

        /** TransactionInfo unfreezeAmount */
        unfreezeAmount?: (number|Long|null);

        /** TransactionInfo internalTransactions */
        internalTransactions?: (protocol.IInternalTransaction[]|null);

        /** TransactionInfo exchangeReceivedAmount */
        exchangeReceivedAmount?: (number|Long|null);

        /** TransactionInfo exchangeInjectAnotherAmount */
        exchangeInjectAnotherAmount?: (number|Long|null);

        /** TransactionInfo exchangeWithdrawAnotherAmount */
        exchangeWithdrawAnotherAmount?: (number|Long|null);

        /** TransactionInfo exchangeId */
        exchangeId?: (number|Long|null);
    }

    /** Represents a TransactionInfo. */
    class TransactionInfo implements ITransactionInfo {

        /**
         * Constructs a new TransactionInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITransactionInfo);

        /** TransactionInfo id. */
        public id: Uint8Array;

        /** TransactionInfo fee. */
        public fee: (number|Long);

        /** TransactionInfo blockNumber. */
        public blockNumber: (number|Long);

        /** TransactionInfo blockTimeStamp. */
        public blockTimeStamp: (number|Long);

        /** TransactionInfo contractResult. */
        public contractResult: Uint8Array[];

        /** TransactionInfo contractAddress. */
        public contractAddress: Uint8Array;

        /** TransactionInfo receipt. */
        public receipt?: (protocol.IResourceReceipt|null);

        /** TransactionInfo log. */
        public log: protocol.TransactionInfo.ILog[];

        /** TransactionInfo result. */
        public result: protocol.TransactionInfo.code;

        /** TransactionInfo resMessage. */
        public resMessage: Uint8Array;

        /** TransactionInfo assetIssueID. */
        public assetIssueID: string;

        /** TransactionInfo withdrawAmount. */
        public withdrawAmount: (number|Long);

        /** TransactionInfo unfreezeAmount. */
        public unfreezeAmount: (number|Long);

        /** TransactionInfo internalTransactions. */
        public internalTransactions: protocol.IInternalTransaction[];

        /** TransactionInfo exchangeReceivedAmount. */
        public exchangeReceivedAmount: (number|Long);

        /** TransactionInfo exchangeInjectAnotherAmount. */
        public exchangeInjectAnotherAmount: (number|Long);

        /** TransactionInfo exchangeWithdrawAnotherAmount. */
        public exchangeWithdrawAnotherAmount: (number|Long);

        /** TransactionInfo exchangeId. */
        public exchangeId: (number|Long);

        /**
         * Creates a new TransactionInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TransactionInfo instance
         */
        public static create(properties?: protocol.ITransactionInfo): protocol.TransactionInfo;

        /**
         * Encodes the specified TransactionInfo message. Does not implicitly {@link protocol.TransactionInfo.verify|verify} messages.
         * @param message TransactionInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITransactionInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TransactionInfo message, length delimited. Does not implicitly {@link protocol.TransactionInfo.verify|verify} messages.
         * @param message TransactionInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITransactionInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TransactionInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TransactionInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TransactionInfo;

        /**
         * Decodes a TransactionInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TransactionInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TransactionInfo;

        /**
         * Verifies a TransactionInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TransactionInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TransactionInfo
         */
        public static fromObject(object: { [k: string]: any }): protocol.TransactionInfo;

        /**
         * Creates a plain object from a TransactionInfo message. Also converts values to other types if specified.
         * @param message TransactionInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TransactionInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TransactionInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace TransactionInfo {

        /** code enum. */
        enum code {
            SUCESS = 0,
            FAILED = 1
        }

        /** Properties of a Log. */
        interface ILog {

            /** Log address */
            address?: (Uint8Array|null);

            /** Log topics */
            topics?: (Uint8Array[]|null);

            /** Log data */
            data?: (Uint8Array|null);
        }

        /** Represents a Log. */
        class Log implements ILog {

            /**
             * Constructs a new Log.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.TransactionInfo.ILog);

            /** Log address. */
            public address: Uint8Array;

            /** Log topics. */
            public topics: Uint8Array[];

            /** Log data. */
            public data: Uint8Array;

            /**
             * Creates a new Log instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Log instance
             */
            public static create(properties?: protocol.TransactionInfo.ILog): protocol.TransactionInfo.Log;

            /**
             * Encodes the specified Log message. Does not implicitly {@link protocol.TransactionInfo.Log.verify|verify} messages.
             * @param message Log message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.TransactionInfo.ILog, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Log message, length delimited. Does not implicitly {@link protocol.TransactionInfo.Log.verify|verify} messages.
             * @param message Log message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.TransactionInfo.ILog, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Log message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Log
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TransactionInfo.Log;

            /**
             * Decodes a Log message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Log
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TransactionInfo.Log;

            /**
             * Verifies a Log message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Log message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Log
             */
            public static fromObject(object: { [k: string]: any }): protocol.TransactionInfo.Log;

            /**
             * Creates a plain object from a Log message. Also converts values to other types if specified.
             * @param message Log
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.TransactionInfo.Log, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Log to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a TransactionRet. */
    interface ITransactionRet {

        /** TransactionRet blockNumber */
        blockNumber?: (number|Long|null);

        /** TransactionRet blockTimeStamp */
        blockTimeStamp?: (number|Long|null);

        /** TransactionRet transactioninfo */
        transactioninfo?: (protocol.ITransactionInfo[]|null);
    }

    /** Represents a TransactionRet. */
    class TransactionRet implements ITransactionRet {

        /**
         * Constructs a new TransactionRet.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITransactionRet);

        /** TransactionRet blockNumber. */
        public blockNumber: (number|Long);

        /** TransactionRet blockTimeStamp. */
        public blockTimeStamp: (number|Long);

        /** TransactionRet transactioninfo. */
        public transactioninfo: protocol.ITransactionInfo[];

        /**
         * Creates a new TransactionRet instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TransactionRet instance
         */
        public static create(properties?: protocol.ITransactionRet): protocol.TransactionRet;

        /**
         * Encodes the specified TransactionRet message. Does not implicitly {@link protocol.TransactionRet.verify|verify} messages.
         * @param message TransactionRet message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITransactionRet, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TransactionRet message, length delimited. Does not implicitly {@link protocol.TransactionRet.verify|verify} messages.
         * @param message TransactionRet message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITransactionRet, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TransactionRet message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TransactionRet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TransactionRet;

        /**
         * Decodes a TransactionRet message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TransactionRet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TransactionRet;

        /**
         * Verifies a TransactionRet message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TransactionRet message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TransactionRet
         */
        public static fromObject(object: { [k: string]: any }): protocol.TransactionRet;

        /**
         * Creates a plain object from a TransactionRet message. Also converts values to other types if specified.
         * @param message TransactionRet
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TransactionRet, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TransactionRet to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Transactions. */
    interface ITransactions {

        /** Transactions transactions */
        transactions?: (protocol.ITransaction[]|null);
    }

    /** Represents a Transactions. */
    class Transactions implements ITransactions {

        /**
         * Constructs a new Transactions.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITransactions);

        /** Transactions transactions. */
        public transactions: protocol.ITransaction[];

        /**
         * Creates a new Transactions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Transactions instance
         */
        public static create(properties?: protocol.ITransactions): protocol.Transactions;

        /**
         * Encodes the specified Transactions message. Does not implicitly {@link protocol.Transactions.verify|verify} messages.
         * @param message Transactions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITransactions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Transactions message, length delimited. Does not implicitly {@link protocol.Transactions.verify|verify} messages.
         * @param message Transactions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITransactions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Transactions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Transactions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Transactions;

        /**
         * Decodes a Transactions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Transactions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Transactions;

        /**
         * Verifies a Transactions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Transactions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Transactions
         */
        public static fromObject(object: { [k: string]: any }): protocol.Transactions;

        /**
         * Creates a plain object from a Transactions message. Also converts values to other types if specified.
         * @param message Transactions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Transactions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Transactions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a TransactionSign. */
    interface ITransactionSign {

        /** TransactionSign transaction */
        transaction?: (protocol.ITransaction|null);

        /** TransactionSign privateKey */
        privateKey?: (Uint8Array|null);
    }

    /** Represents a TransactionSign. */
    class TransactionSign implements ITransactionSign {

        /**
         * Constructs a new TransactionSign.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ITransactionSign);

        /** TransactionSign transaction. */
        public transaction?: (protocol.ITransaction|null);

        /** TransactionSign privateKey. */
        public privateKey: Uint8Array;

        /**
         * Creates a new TransactionSign instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TransactionSign instance
         */
        public static create(properties?: protocol.ITransactionSign): protocol.TransactionSign;

        /**
         * Encodes the specified TransactionSign message. Does not implicitly {@link protocol.TransactionSign.verify|verify} messages.
         * @param message TransactionSign message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ITransactionSign, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TransactionSign message, length delimited. Does not implicitly {@link protocol.TransactionSign.verify|verify} messages.
         * @param message TransactionSign message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ITransactionSign, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TransactionSign message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TransactionSign
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.TransactionSign;

        /**
         * Decodes a TransactionSign message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TransactionSign
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.TransactionSign;

        /**
         * Verifies a TransactionSign message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TransactionSign message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TransactionSign
         */
        public static fromObject(object: { [k: string]: any }): protocol.TransactionSign;

        /**
         * Creates a plain object from a TransactionSign message. Also converts values to other types if specified.
         * @param message TransactionSign
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.TransactionSign, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TransactionSign to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BlockHeader. */
    interface IBlockHeader {

        /** BlockHeader rawData */
        rawData?: (protocol.BlockHeader.Iraw|null);

        /** BlockHeader witnessSignature */
        witnessSignature?: (Uint8Array|null);
    }

    /** Represents a BlockHeader. */
    class BlockHeader implements IBlockHeader {

        /**
         * Constructs a new BlockHeader.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IBlockHeader);

        /** BlockHeader rawData. */
        public rawData?: (protocol.BlockHeader.Iraw|null);

        /** BlockHeader witnessSignature. */
        public witnessSignature: Uint8Array;

        /**
         * Creates a new BlockHeader instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BlockHeader instance
         */
        public static create(properties?: protocol.IBlockHeader): protocol.BlockHeader;

        /**
         * Encodes the specified BlockHeader message. Does not implicitly {@link protocol.BlockHeader.verify|verify} messages.
         * @param message BlockHeader message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BlockHeader message, length delimited. Does not implicitly {@link protocol.BlockHeader.verify|verify} messages.
         * @param message BlockHeader message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IBlockHeader, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BlockHeader message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BlockHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.BlockHeader;

        /**
         * Decodes a BlockHeader message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BlockHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.BlockHeader;

        /**
         * Verifies a BlockHeader message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BlockHeader message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BlockHeader
         */
        public static fromObject(object: { [k: string]: any }): protocol.BlockHeader;

        /**
         * Creates a plain object from a BlockHeader message. Also converts values to other types if specified.
         * @param message BlockHeader
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.BlockHeader, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BlockHeader to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace BlockHeader {

        /** Properties of a raw. */
        interface Iraw {

            /** raw timestamp */
            timestamp?: (number|Long|null);

            /** raw txTrieRoot */
            txTrieRoot?: (Uint8Array|null);

            /** raw parentHash */
            parentHash?: (Uint8Array|null);

            /** raw number */
            number?: (number|Long|null);

            /** raw witnessId */
            witnessId?: (number|Long|null);

            /** raw witnessAddress */
            witnessAddress?: (Uint8Array|null);

            /** raw version */
            version?: (number|null);

            /** raw accountStateRoot */
            accountStateRoot?: (Uint8Array|null);
        }

        /** Represents a raw. */
        class raw implements Iraw {

            /**
             * Constructs a new raw.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.BlockHeader.Iraw);

            /** raw timestamp. */
            public timestamp: (number|Long);

            /** raw txTrieRoot. */
            public txTrieRoot: Uint8Array;

            /** raw parentHash. */
            public parentHash: Uint8Array;

            /** raw number. */
            public number: (number|Long);

            /** raw witnessId. */
            public witnessId: (number|Long);

            /** raw witnessAddress. */
            public witnessAddress: Uint8Array;

            /** raw version. */
            public version: number;

            /** raw accountStateRoot. */
            public accountStateRoot: Uint8Array;

            /**
             * Creates a new raw instance using the specified properties.
             * @param [properties] Properties to set
             * @returns raw instance
             */
            public static create(properties?: protocol.BlockHeader.Iraw): protocol.BlockHeader.raw;

            /**
             * Encodes the specified raw message. Does not implicitly {@link protocol.BlockHeader.raw.verify|verify} messages.
             * @param message raw message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.BlockHeader.Iraw, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified raw message, length delimited. Does not implicitly {@link protocol.BlockHeader.raw.verify|verify} messages.
             * @param message raw message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.BlockHeader.Iraw, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a raw message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns raw
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.BlockHeader.raw;

            /**
             * Decodes a raw message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns raw
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.BlockHeader.raw;

            /**
             * Verifies a raw message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a raw message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns raw
             */
            public static fromObject(object: { [k: string]: any }): protocol.BlockHeader.raw;

            /**
             * Creates a plain object from a raw message. Also converts values to other types if specified.
             * @param message raw
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.BlockHeader.raw, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this raw to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a Block. */
    interface IBlock {

        /** Block transactions */
        transactions?: (protocol.ITransaction[]|null);

        /** Block blockHeader */
        blockHeader?: (protocol.IBlockHeader|null);
    }

    /** Represents a Block. */
    class Block implements IBlock {

        /**
         * Constructs a new Block.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IBlock);

        /** Block transactions. */
        public transactions: protocol.ITransaction[];

        /** Block blockHeader. */
        public blockHeader?: (protocol.IBlockHeader|null);

        /**
         * Creates a new Block instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Block instance
         */
        public static create(properties?: protocol.IBlock): protocol.Block;

        /**
         * Encodes the specified Block message. Does not implicitly {@link protocol.Block.verify|verify} messages.
         * @param message Block message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Block message, length delimited. Does not implicitly {@link protocol.Block.verify|verify} messages.
         * @param message Block message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Block message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Block;

        /**
         * Decodes a Block message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Block;

        /**
         * Verifies a Block message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Block message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Block
         */
        public static fromObject(object: { [k: string]: any }): protocol.Block;

        /**
         * Creates a plain object from a Block message. Also converts values to other types if specified.
         * @param message Block
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Block, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Block to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ChainInventory. */
    interface IChainInventory {

        /** ChainInventory ids */
        ids?: (protocol.ChainInventory.IBlockId[]|null);

        /** ChainInventory remainNum */
        remainNum?: (number|Long|null);
    }

    /** Represents a ChainInventory. */
    class ChainInventory implements IChainInventory {

        /**
         * Constructs a new ChainInventory.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IChainInventory);

        /** ChainInventory ids. */
        public ids: protocol.ChainInventory.IBlockId[];

        /** ChainInventory remainNum. */
        public remainNum: (number|Long);

        /**
         * Creates a new ChainInventory instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChainInventory instance
         */
        public static create(properties?: protocol.IChainInventory): protocol.ChainInventory;

        /**
         * Encodes the specified ChainInventory message. Does not implicitly {@link protocol.ChainInventory.verify|verify} messages.
         * @param message ChainInventory message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IChainInventory, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChainInventory message, length delimited. Does not implicitly {@link protocol.ChainInventory.verify|verify} messages.
         * @param message ChainInventory message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IChainInventory, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChainInventory message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChainInventory
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ChainInventory;

        /**
         * Decodes a ChainInventory message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChainInventory
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ChainInventory;

        /**
         * Verifies a ChainInventory message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChainInventory message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChainInventory
         */
        public static fromObject(object: { [k: string]: any }): protocol.ChainInventory;

        /**
         * Creates a plain object from a ChainInventory message. Also converts values to other types if specified.
         * @param message ChainInventory
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.ChainInventory, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChainInventory to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace ChainInventory {

        /** Properties of a BlockId. */
        interface IBlockId {

            /** BlockId hash */
            hash?: (Uint8Array|null);

            /** BlockId number */
            number?: (number|Long|null);
        }

        /** Represents a BlockId. */
        class BlockId implements IBlockId {

            /**
             * Constructs a new BlockId.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.ChainInventory.IBlockId);

            /** BlockId hash. */
            public hash: Uint8Array;

            /** BlockId number. */
            public number: (number|Long);

            /**
             * Creates a new BlockId instance using the specified properties.
             * @param [properties] Properties to set
             * @returns BlockId instance
             */
            public static create(properties?: protocol.ChainInventory.IBlockId): protocol.ChainInventory.BlockId;

            /**
             * Encodes the specified BlockId message. Does not implicitly {@link protocol.ChainInventory.BlockId.verify|verify} messages.
             * @param message BlockId message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.ChainInventory.IBlockId, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockId message, length delimited. Does not implicitly {@link protocol.ChainInventory.BlockId.verify|verify} messages.
             * @param message BlockId message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.ChainInventory.IBlockId, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockId message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockId
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.ChainInventory.BlockId;

            /**
             * Decodes a BlockId message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockId
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.ChainInventory.BlockId;

            /**
             * Verifies a BlockId message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockId message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockId
             */
            public static fromObject(object: { [k: string]: any }): protocol.ChainInventory.BlockId;

            /**
             * Creates a plain object from a BlockId message. Also converts values to other types if specified.
             * @param message BlockId
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.ChainInventory.BlockId, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockId to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a BlockInventory. */
    interface IBlockInventory {

        /** BlockInventory ids */
        ids?: (protocol.BlockInventory.IBlockId[]|null);

        /** BlockInventory type */
        type?: (protocol.BlockInventory.Type|null);
    }

    /** Represents a BlockInventory. */
    class BlockInventory implements IBlockInventory {

        /**
         * Constructs a new BlockInventory.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IBlockInventory);

        /** BlockInventory ids. */
        public ids: protocol.BlockInventory.IBlockId[];

        /** BlockInventory type. */
        public type: protocol.BlockInventory.Type;

        /**
         * Creates a new BlockInventory instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BlockInventory instance
         */
        public static create(properties?: protocol.IBlockInventory): protocol.BlockInventory;

        /**
         * Encodes the specified BlockInventory message. Does not implicitly {@link protocol.BlockInventory.verify|verify} messages.
         * @param message BlockInventory message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IBlockInventory, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BlockInventory message, length delimited. Does not implicitly {@link protocol.BlockInventory.verify|verify} messages.
         * @param message BlockInventory message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IBlockInventory, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BlockInventory message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BlockInventory
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.BlockInventory;

        /**
         * Decodes a BlockInventory message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BlockInventory
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.BlockInventory;

        /**
         * Verifies a BlockInventory message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BlockInventory message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BlockInventory
         */
        public static fromObject(object: { [k: string]: any }): protocol.BlockInventory;

        /**
         * Creates a plain object from a BlockInventory message. Also converts values to other types if specified.
         * @param message BlockInventory
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.BlockInventory, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BlockInventory to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace BlockInventory {

        /** Type enum. */
        enum Type {
            SYNC = 0,
            ADVTISE = 1,
            FETCH = 2
        }

        /** Properties of a BlockId. */
        interface IBlockId {

            /** BlockId hash */
            hash?: (Uint8Array|null);

            /** BlockId number */
            number?: (number|Long|null);
        }

        /** Represents a BlockId. */
        class BlockId implements IBlockId {

            /**
             * Constructs a new BlockId.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.BlockInventory.IBlockId);

            /** BlockId hash. */
            public hash: Uint8Array;

            /** BlockId number. */
            public number: (number|Long);

            /**
             * Creates a new BlockId instance using the specified properties.
             * @param [properties] Properties to set
             * @returns BlockId instance
             */
            public static create(properties?: protocol.BlockInventory.IBlockId): protocol.BlockInventory.BlockId;

            /**
             * Encodes the specified BlockId message. Does not implicitly {@link protocol.BlockInventory.BlockId.verify|verify} messages.
             * @param message BlockId message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.BlockInventory.IBlockId, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockId message, length delimited. Does not implicitly {@link protocol.BlockInventory.BlockId.verify|verify} messages.
             * @param message BlockId message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.BlockInventory.IBlockId, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockId message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockId
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.BlockInventory.BlockId;

            /**
             * Decodes a BlockId message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockId
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.BlockInventory.BlockId;

            /**
             * Verifies a BlockId message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockId message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockId
             */
            public static fromObject(object: { [k: string]: any }): protocol.BlockInventory.BlockId;

            /**
             * Creates a plain object from a BlockId message. Also converts values to other types if specified.
             * @param message BlockId
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.BlockInventory.BlockId, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockId to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of an Inventory. */
    interface IInventory {

        /** Inventory type */
        type?: (protocol.Inventory.InventoryType|null);

        /** Inventory ids */
        ids?: (Uint8Array[]|null);
    }

    /** Represents an Inventory. */
    class Inventory implements IInventory {

        /**
         * Constructs a new Inventory.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IInventory);

        /** Inventory type. */
        public type: protocol.Inventory.InventoryType;

        /** Inventory ids. */
        public ids: Uint8Array[];

        /**
         * Creates a new Inventory instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Inventory instance
         */
        public static create(properties?: protocol.IInventory): protocol.Inventory;

        /**
         * Encodes the specified Inventory message. Does not implicitly {@link protocol.Inventory.verify|verify} messages.
         * @param message Inventory message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IInventory, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Inventory message, length delimited. Does not implicitly {@link protocol.Inventory.verify|verify} messages.
         * @param message Inventory message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IInventory, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Inventory message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Inventory
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Inventory;

        /**
         * Decodes an Inventory message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Inventory
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Inventory;

        /**
         * Verifies an Inventory message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Inventory message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Inventory
         */
        public static fromObject(object: { [k: string]: any }): protocol.Inventory;

        /**
         * Creates a plain object from an Inventory message. Also converts values to other types if specified.
         * @param message Inventory
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Inventory, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Inventory to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace Inventory {

        /** InventoryType enum. */
        enum InventoryType {
            TRX = 0,
            BLOCK = 1
        }
    }

    /** Properties of an Items. */
    interface IItems {

        /** Items type */
        type?: (protocol.Items.ItemType|null);

        /** Items blocks */
        blocks?: (protocol.IBlock[]|null);

        /** Items blockHeaders */
        blockHeaders?: (protocol.IBlockHeader[]|null);

        /** Items transactions */
        transactions?: (protocol.ITransaction[]|null);
    }

    /** Represents an Items. */
    class Items implements IItems {

        /**
         * Constructs a new Items.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IItems);

        /** Items type. */
        public type: protocol.Items.ItemType;

        /** Items blocks. */
        public blocks: protocol.IBlock[];

        /** Items blockHeaders. */
        public blockHeaders: protocol.IBlockHeader[];

        /** Items transactions. */
        public transactions: protocol.ITransaction[];

        /**
         * Creates a new Items instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Items instance
         */
        public static create(properties?: protocol.IItems): protocol.Items;

        /**
         * Encodes the specified Items message. Does not implicitly {@link protocol.Items.verify|verify} messages.
         * @param message Items message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IItems, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Items message, length delimited. Does not implicitly {@link protocol.Items.verify|verify} messages.
         * @param message Items message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IItems, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Items message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Items
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Items;

        /**
         * Decodes an Items message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Items
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Items;

        /**
         * Verifies an Items message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Items message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Items
         */
        public static fromObject(object: { [k: string]: any }): protocol.Items;

        /**
         * Creates a plain object from an Items message. Also converts values to other types if specified.
         * @param message Items
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Items, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Items to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace Items {

        /** ItemType enum. */
        enum ItemType {
            ERR = 0,
            TRX = 1,
            BLOCK = 2,
            BLOCKHEADER = 3
        }
    }

    /** Properties of a DynamicProperties. */
    interface IDynamicProperties {

        /** DynamicProperties lastSolidityBlockNum */
        lastSolidityBlockNum?: (number|Long|null);
    }

    /** Represents a DynamicProperties. */
    class DynamicProperties implements IDynamicProperties {

        /**
         * Constructs a new DynamicProperties.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IDynamicProperties);

        /** DynamicProperties lastSolidityBlockNum. */
        public lastSolidityBlockNum: (number|Long);

        /**
         * Creates a new DynamicProperties instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DynamicProperties instance
         */
        public static create(properties?: protocol.IDynamicProperties): protocol.DynamicProperties;

        /**
         * Encodes the specified DynamicProperties message. Does not implicitly {@link protocol.DynamicProperties.verify|verify} messages.
         * @param message DynamicProperties message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IDynamicProperties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DynamicProperties message, length delimited. Does not implicitly {@link protocol.DynamicProperties.verify|verify} messages.
         * @param message DynamicProperties message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IDynamicProperties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DynamicProperties message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DynamicProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.DynamicProperties;

        /**
         * Decodes a DynamicProperties message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DynamicProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.DynamicProperties;

        /**
         * Verifies a DynamicProperties message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DynamicProperties message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DynamicProperties
         */
        public static fromObject(object: { [k: string]: any }): protocol.DynamicProperties;

        /**
         * Creates a plain object from a DynamicProperties message. Also converts values to other types if specified.
         * @param message DynamicProperties
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.DynamicProperties, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DynamicProperties to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** ReasonCode enum. */
    enum ReasonCode {
        REQUESTED = 0,
        BAD_PROTOCOL = 2,
        TOO_MANY_PEERS = 4,
        DUPLICATE_PEER = 5,
        INCOMPATIBLE_PROTOCOL = 6,
        NULL_IDENTITY = 7,
        PEER_QUITING = 8,
        UNEXPECTED_IDENTITY = 9,
        LOCAL_IDENTITY = 10,
        PING_TIMEOUT = 11,
        USER_REASON = 16,
        RESET = 17,
        SYNC_FAIL = 18,
        FETCH_FAIL = 19,
        BAD_TX = 20,
        BAD_BLOCK = 21,
        FORKED = 22,
        UNLINKABLE = 23,
        INCOMPATIBLE_VERSION = 24,
        INCOMPATIBLE_CHAIN = 25,
        TIME_OUT = 32,
        CONNECT_FAIL = 33,
        TOO_MANY_PEERS_WITH_SAME_IP = 34,
        UNKNOWN = 255
    }

    /** Properties of a DisconnectMessage. */
    interface IDisconnectMessage {

        /** DisconnectMessage reason */
        reason?: (protocol.ReasonCode|null);
    }

    /** Represents a DisconnectMessage. */
    class DisconnectMessage implements IDisconnectMessage {

        /**
         * Constructs a new DisconnectMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IDisconnectMessage);

        /** DisconnectMessage reason. */
        public reason: protocol.ReasonCode;

        /**
         * Creates a new DisconnectMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DisconnectMessage instance
         */
        public static create(properties?: protocol.IDisconnectMessage): protocol.DisconnectMessage;

        /**
         * Encodes the specified DisconnectMessage message. Does not implicitly {@link protocol.DisconnectMessage.verify|verify} messages.
         * @param message DisconnectMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IDisconnectMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DisconnectMessage message, length delimited. Does not implicitly {@link protocol.DisconnectMessage.verify|verify} messages.
         * @param message DisconnectMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IDisconnectMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DisconnectMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DisconnectMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.DisconnectMessage;

        /**
         * Decodes a DisconnectMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DisconnectMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.DisconnectMessage;

        /**
         * Verifies a DisconnectMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DisconnectMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DisconnectMessage
         */
        public static fromObject(object: { [k: string]: any }): protocol.DisconnectMessage;

        /**
         * Creates a plain object from a DisconnectMessage message. Also converts values to other types if specified.
         * @param message DisconnectMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.DisconnectMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DisconnectMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a HelloMessage. */
    interface IHelloMessage {

        /** HelloMessage from */
        from?: (protocol.IEndpoint|null);

        /** HelloMessage version */
        version?: (number|null);

        /** HelloMessage timestamp */
        timestamp?: (number|Long|null);

        /** HelloMessage genesisBlockId */
        genesisBlockId?: (protocol.HelloMessage.IBlockId|null);

        /** HelloMessage solidBlockId */
        solidBlockId?: (protocol.HelloMessage.IBlockId|null);

        /** HelloMessage headBlockId */
        headBlockId?: (protocol.HelloMessage.IBlockId|null);
    }

    /** Represents a HelloMessage. */
    class HelloMessage implements IHelloMessage {

        /**
         * Constructs a new HelloMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IHelloMessage);

        /** HelloMessage from. */
        public from?: (protocol.IEndpoint|null);

        /** HelloMessage version. */
        public version: number;

        /** HelloMessage timestamp. */
        public timestamp: (number|Long);

        /** HelloMessage genesisBlockId. */
        public genesisBlockId?: (protocol.HelloMessage.IBlockId|null);

        /** HelloMessage solidBlockId. */
        public solidBlockId?: (protocol.HelloMessage.IBlockId|null);

        /** HelloMessage headBlockId. */
        public headBlockId?: (protocol.HelloMessage.IBlockId|null);

        /**
         * Creates a new HelloMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HelloMessage instance
         */
        public static create(properties?: protocol.IHelloMessage): protocol.HelloMessage;

        /**
         * Encodes the specified HelloMessage message. Does not implicitly {@link protocol.HelloMessage.verify|verify} messages.
         * @param message HelloMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IHelloMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HelloMessage message, length delimited. Does not implicitly {@link protocol.HelloMessage.verify|verify} messages.
         * @param message HelloMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IHelloMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HelloMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HelloMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.HelloMessage;

        /**
         * Decodes a HelloMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HelloMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.HelloMessage;

        /**
         * Verifies a HelloMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HelloMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HelloMessage
         */
        public static fromObject(object: { [k: string]: any }): protocol.HelloMessage;

        /**
         * Creates a plain object from a HelloMessage message. Also converts values to other types if specified.
         * @param message HelloMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.HelloMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HelloMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace HelloMessage {

        /** Properties of a BlockId. */
        interface IBlockId {

            /** BlockId hash */
            hash?: (Uint8Array|null);

            /** BlockId number */
            number?: (number|Long|null);
        }

        /** Represents a BlockId. */
        class BlockId implements IBlockId {

            /**
             * Constructs a new BlockId.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.HelloMessage.IBlockId);

            /** BlockId hash. */
            public hash: Uint8Array;

            /** BlockId number. */
            public number: (number|Long);

            /**
             * Creates a new BlockId instance using the specified properties.
             * @param [properties] Properties to set
             * @returns BlockId instance
             */
            public static create(properties?: protocol.HelloMessage.IBlockId): protocol.HelloMessage.BlockId;

            /**
             * Encodes the specified BlockId message. Does not implicitly {@link protocol.HelloMessage.BlockId.verify|verify} messages.
             * @param message BlockId message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.HelloMessage.IBlockId, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockId message, length delimited. Does not implicitly {@link protocol.HelloMessage.BlockId.verify|verify} messages.
             * @param message BlockId message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.HelloMessage.IBlockId, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockId message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockId
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.HelloMessage.BlockId;

            /**
             * Decodes a BlockId message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockId
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.HelloMessage.BlockId;

            /**
             * Verifies a BlockId message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockId message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockId
             */
            public static fromObject(object: { [k: string]: any }): protocol.HelloMessage.BlockId;

            /**
             * Creates a plain object from a BlockId message. Also converts values to other types if specified.
             * @param message BlockId
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.HelloMessage.BlockId, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockId to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a SmartContract. */
    interface ISmartContract {

        /** SmartContract originAddress */
        originAddress?: (Uint8Array|null);

        /** SmartContract contractAddress */
        contractAddress?: (Uint8Array|null);

        /** SmartContract abi */
        abi?: (protocol.SmartContract.IABI|null);

        /** SmartContract bytecode */
        bytecode?: (Uint8Array|null);

        /** SmartContract callValue */
        callValue?: (number|Long|null);

        /** SmartContract consumeUserResourcePercent */
        consumeUserResourcePercent?: (number|Long|null);

        /** SmartContract name */
        name?: (string|null);

        /** SmartContract originEnergyLimit */
        originEnergyLimit?: (number|Long|null);

        /** SmartContract codeHash */
        codeHash?: (Uint8Array|null);

        /** SmartContract trxHash */
        trxHash?: (Uint8Array|null);
    }

    /** Represents a SmartContract. */
    class SmartContract implements ISmartContract {

        /**
         * Constructs a new SmartContract.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.ISmartContract);

        /** SmartContract originAddress. */
        public originAddress: Uint8Array;

        /** SmartContract contractAddress. */
        public contractAddress: Uint8Array;

        /** SmartContract abi. */
        public abi?: (protocol.SmartContract.IABI|null);

        /** SmartContract bytecode. */
        public bytecode: Uint8Array;

        /** SmartContract callValue. */
        public callValue: (number|Long);

        /** SmartContract consumeUserResourcePercent. */
        public consumeUserResourcePercent: (number|Long);

        /** SmartContract name. */
        public name: string;

        /** SmartContract originEnergyLimit. */
        public originEnergyLimit: (number|Long);

        /** SmartContract codeHash. */
        public codeHash: Uint8Array;

        /** SmartContract trxHash. */
        public trxHash: Uint8Array;

        /**
         * Creates a new SmartContract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SmartContract instance
         */
        public static create(properties?: protocol.ISmartContract): protocol.SmartContract;

        /**
         * Encodes the specified SmartContract message. Does not implicitly {@link protocol.SmartContract.verify|verify} messages.
         * @param message SmartContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.ISmartContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SmartContract message, length delimited. Does not implicitly {@link protocol.SmartContract.verify|verify} messages.
         * @param message SmartContract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.ISmartContract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SmartContract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SmartContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.SmartContract;

        /**
         * Decodes a SmartContract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SmartContract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.SmartContract;

        /**
         * Verifies a SmartContract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SmartContract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SmartContract
         */
        public static fromObject(object: { [k: string]: any }): protocol.SmartContract;

        /**
         * Creates a plain object from a SmartContract message. Also converts values to other types if specified.
         * @param message SmartContract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.SmartContract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SmartContract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace SmartContract {

        /** Properties of a ABI. */
        interface IABI {

            /** ABI entrys */
            entrys?: (protocol.SmartContract.ABI.IEntry[]|null);
        }

        /** Represents a ABI. */
        class ABI implements IABI {

            /**
             * Constructs a new ABI.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.SmartContract.IABI);

            /** ABI entrys. */
            public entrys: protocol.SmartContract.ABI.IEntry[];

            /**
             * Creates a new ABI instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ABI instance
             */
            public static create(properties?: protocol.SmartContract.IABI): protocol.SmartContract.ABI;

            /**
             * Encodes the specified ABI message. Does not implicitly {@link protocol.SmartContract.ABI.verify|verify} messages.
             * @param message ABI message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.SmartContract.IABI, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ABI message, length delimited. Does not implicitly {@link protocol.SmartContract.ABI.verify|verify} messages.
             * @param message ABI message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.SmartContract.IABI, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ABI message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ABI
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.SmartContract.ABI;

            /**
             * Decodes a ABI message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ABI
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.SmartContract.ABI;

            /**
             * Verifies a ABI message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ABI message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ABI
             */
            public static fromObject(object: { [k: string]: any }): protocol.SmartContract.ABI;

            /**
             * Creates a plain object from a ABI message. Also converts values to other types if specified.
             * @param message ABI
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.SmartContract.ABI, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ABI to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace ABI {

            /** Properties of an Entry. */
            interface IEntry {

                /** Entry anonymous */
                anonymous?: (boolean|null);

                /** Entry constant */
                constant?: (boolean|null);

                /** Entry name */
                name?: (string|null);

                /** Entry inputs */
                inputs?: (protocol.SmartContract.ABI.Entry.IParam[]|null);

                /** Entry outputs */
                outputs?: (protocol.SmartContract.ABI.Entry.IParam[]|null);

                /** Entry type */
                type?: (protocol.SmartContract.ABI.Entry.EntryType|null);

                /** Entry payable */
                payable?: (boolean|null);

                /** Entry stateMutability */
                stateMutability?: (protocol.SmartContract.ABI.Entry.StateMutabilityType|null);
            }

            /** Represents an Entry. */
            class Entry implements IEntry {

                /**
                 * Constructs a new Entry.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: protocol.SmartContract.ABI.IEntry);

                /** Entry anonymous. */
                public anonymous: boolean;

                /** Entry constant. */
                public constant: boolean;

                /** Entry name. */
                public name: string;

                /** Entry inputs. */
                public inputs: protocol.SmartContract.ABI.Entry.IParam[];

                /** Entry outputs. */
                public outputs: protocol.SmartContract.ABI.Entry.IParam[];

                /** Entry type. */
                public type: protocol.SmartContract.ABI.Entry.EntryType;

                /** Entry payable. */
                public payable: boolean;

                /** Entry stateMutability. */
                public stateMutability: protocol.SmartContract.ABI.Entry.StateMutabilityType;

                /**
                 * Creates a new Entry instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Entry instance
                 */
                public static create(properties?: protocol.SmartContract.ABI.IEntry): protocol.SmartContract.ABI.Entry;

                /**
                 * Encodes the specified Entry message. Does not implicitly {@link protocol.SmartContract.ABI.Entry.verify|verify} messages.
                 * @param message Entry message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: protocol.SmartContract.ABI.IEntry, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Entry message, length delimited. Does not implicitly {@link protocol.SmartContract.ABI.Entry.verify|verify} messages.
                 * @param message Entry message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: protocol.SmartContract.ABI.IEntry, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Entry message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Entry
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.SmartContract.ABI.Entry;

                /**
                 * Decodes an Entry message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Entry
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.SmartContract.ABI.Entry;

                /**
                 * Verifies an Entry message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Entry message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Entry
                 */
                public static fromObject(object: { [k: string]: any }): protocol.SmartContract.ABI.Entry;

                /**
                 * Creates a plain object from an Entry message. Also converts values to other types if specified.
                 * @param message Entry
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: protocol.SmartContract.ABI.Entry, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Entry to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace Entry {

                /** EntryType enum. */
                enum EntryType {
                    UnknownEntryType = 0,
                    Constructor = 1,
                    Function = 2,
                    Event = 3,
                    Fallback = 4
                }

                /** Properties of a Param. */
                interface IParam {

                    /** Param indexed */
                    indexed?: (boolean|null);

                    /** Param name */
                    name?: (string|null);

                    /** Param type */
                    type?: (string|null);
                }

                /** Represents a Param. */
                class Param implements IParam {

                    /**
                     * Constructs a new Param.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: protocol.SmartContract.ABI.Entry.IParam);

                    /** Param indexed. */
                    public indexed: boolean;

                    /** Param name. */
                    public name: string;

                    /** Param type. */
                    public type: string;

                    /**
                     * Creates a new Param instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Param instance
                     */
                    public static create(properties?: protocol.SmartContract.ABI.Entry.IParam): protocol.SmartContract.ABI.Entry.Param;

                    /**
                     * Encodes the specified Param message. Does not implicitly {@link protocol.SmartContract.ABI.Entry.Param.verify|verify} messages.
                     * @param message Param message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: protocol.SmartContract.ABI.Entry.IParam, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Param message, length delimited. Does not implicitly {@link protocol.SmartContract.ABI.Entry.Param.verify|verify} messages.
                     * @param message Param message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: protocol.SmartContract.ABI.Entry.IParam, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Param message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Param
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.SmartContract.ABI.Entry.Param;

                    /**
                     * Decodes a Param message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Param
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.SmartContract.ABI.Entry.Param;

                    /**
                     * Verifies a Param message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Param message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Param
                     */
                    public static fromObject(object: { [k: string]: any }): protocol.SmartContract.ABI.Entry.Param;

                    /**
                     * Creates a plain object from a Param message. Also converts values to other types if specified.
                     * @param message Param
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: protocol.SmartContract.ABI.Entry.Param, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Param to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** StateMutabilityType enum. */
                enum StateMutabilityType {
                    UnknownMutabilityType = 0,
                    Pure = 1,
                    View = 2,
                    Nonpayable = 3,
                    Payable = 4
                }
            }
        }
    }

    /** Properties of an InternalTransaction. */
    interface IInternalTransaction {

        /** InternalTransaction hash */
        hash?: (Uint8Array|null);

        /** InternalTransaction callerAddress */
        callerAddress?: (Uint8Array|null);

        /** InternalTransaction transferToAddress */
        transferToAddress?: (Uint8Array|null);

        /** InternalTransaction callValueInfo */
        callValueInfo?: (protocol.InternalTransaction.ICallValueInfo[]|null);

        /** InternalTransaction note */
        note?: (Uint8Array|null);

        /** InternalTransaction rejected */
        rejected?: (boolean|null);
    }

    /** Represents an InternalTransaction. */
    class InternalTransaction implements IInternalTransaction {

        /**
         * Constructs a new InternalTransaction.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IInternalTransaction);

        /** InternalTransaction hash. */
        public hash: Uint8Array;

        /** InternalTransaction callerAddress. */
        public callerAddress: Uint8Array;

        /** InternalTransaction transferToAddress. */
        public transferToAddress: Uint8Array;

        /** InternalTransaction callValueInfo. */
        public callValueInfo: protocol.InternalTransaction.ICallValueInfo[];

        /** InternalTransaction note. */
        public note: Uint8Array;

        /** InternalTransaction rejected. */
        public rejected: boolean;

        /**
         * Creates a new InternalTransaction instance using the specified properties.
         * @param [properties] Properties to set
         * @returns InternalTransaction instance
         */
        public static create(properties?: protocol.IInternalTransaction): protocol.InternalTransaction;

        /**
         * Encodes the specified InternalTransaction message. Does not implicitly {@link protocol.InternalTransaction.verify|verify} messages.
         * @param message InternalTransaction message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IInternalTransaction, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified InternalTransaction message, length delimited. Does not implicitly {@link protocol.InternalTransaction.verify|verify} messages.
         * @param message InternalTransaction message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IInternalTransaction, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an InternalTransaction message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns InternalTransaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.InternalTransaction;

        /**
         * Decodes an InternalTransaction message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns InternalTransaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.InternalTransaction;

        /**
         * Verifies an InternalTransaction message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an InternalTransaction message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns InternalTransaction
         */
        public static fromObject(object: { [k: string]: any }): protocol.InternalTransaction;

        /**
         * Creates a plain object from an InternalTransaction message. Also converts values to other types if specified.
         * @param message InternalTransaction
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.InternalTransaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this InternalTransaction to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace InternalTransaction {

        /** Properties of a CallValueInfo. */
        interface ICallValueInfo {

            /** CallValueInfo callValue */
            callValue?: (number|Long|null);

            /** CallValueInfo tokenId */
            tokenId?: (string|null);
        }

        /** Represents a CallValueInfo. */
        class CallValueInfo implements ICallValueInfo {

            /**
             * Constructs a new CallValueInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.InternalTransaction.ICallValueInfo);

            /** CallValueInfo callValue. */
            public callValue: (number|Long);

            /** CallValueInfo tokenId. */
            public tokenId: string;

            /**
             * Creates a new CallValueInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallValueInfo instance
             */
            public static create(properties?: protocol.InternalTransaction.ICallValueInfo): protocol.InternalTransaction.CallValueInfo;

            /**
             * Encodes the specified CallValueInfo message. Does not implicitly {@link protocol.InternalTransaction.CallValueInfo.verify|verify} messages.
             * @param message CallValueInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.InternalTransaction.ICallValueInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallValueInfo message, length delimited. Does not implicitly {@link protocol.InternalTransaction.CallValueInfo.verify|verify} messages.
             * @param message CallValueInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.InternalTransaction.ICallValueInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallValueInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CallValueInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.InternalTransaction.CallValueInfo;

            /**
             * Decodes a CallValueInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CallValueInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.InternalTransaction.CallValueInfo;

            /**
             * Verifies a CallValueInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallValueInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallValueInfo
             */
            public static fromObject(object: { [k: string]: any }): protocol.InternalTransaction.CallValueInfo;

            /**
             * Creates a plain object from a CallValueInfo message. Also converts values to other types if specified.
             * @param message CallValueInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.InternalTransaction.CallValueInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallValueInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Properties of a DelegatedResourceAccountIndex. */
    interface IDelegatedResourceAccountIndex {

        /** DelegatedResourceAccountIndex account */
        account?: (Uint8Array|null);

        /** DelegatedResourceAccountIndex fromAccounts */
        fromAccounts?: (Uint8Array[]|null);

        /** DelegatedResourceAccountIndex toAccounts */
        toAccounts?: (Uint8Array[]|null);
    }

    /** Represents a DelegatedResourceAccountIndex. */
    class DelegatedResourceAccountIndex implements IDelegatedResourceAccountIndex {

        /**
         * Constructs a new DelegatedResourceAccountIndex.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IDelegatedResourceAccountIndex);

        /** DelegatedResourceAccountIndex account. */
        public account: Uint8Array;

        /** DelegatedResourceAccountIndex fromAccounts. */
        public fromAccounts: Uint8Array[];

        /** DelegatedResourceAccountIndex toAccounts. */
        public toAccounts: Uint8Array[];

        /**
         * Creates a new DelegatedResourceAccountIndex instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DelegatedResourceAccountIndex instance
         */
        public static create(properties?: protocol.IDelegatedResourceAccountIndex): protocol.DelegatedResourceAccountIndex;

        /**
         * Encodes the specified DelegatedResourceAccountIndex message. Does not implicitly {@link protocol.DelegatedResourceAccountIndex.verify|verify} messages.
         * @param message DelegatedResourceAccountIndex message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IDelegatedResourceAccountIndex, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DelegatedResourceAccountIndex message, length delimited. Does not implicitly {@link protocol.DelegatedResourceAccountIndex.verify|verify} messages.
         * @param message DelegatedResourceAccountIndex message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IDelegatedResourceAccountIndex, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DelegatedResourceAccountIndex message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DelegatedResourceAccountIndex
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.DelegatedResourceAccountIndex;

        /**
         * Decodes a DelegatedResourceAccountIndex message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DelegatedResourceAccountIndex
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.DelegatedResourceAccountIndex;

        /**
         * Verifies a DelegatedResourceAccountIndex message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DelegatedResourceAccountIndex message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DelegatedResourceAccountIndex
         */
        public static fromObject(object: { [k: string]: any }): protocol.DelegatedResourceAccountIndex;

        /**
         * Creates a plain object from a DelegatedResourceAccountIndex message. Also converts values to other types if specified.
         * @param message DelegatedResourceAccountIndex
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.DelegatedResourceAccountIndex, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DelegatedResourceAccountIndex to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a NodeInfo. */
    interface INodeInfo {

        /** NodeInfo beginSyncNum */
        beginSyncNum?: (number|Long|null);

        /** NodeInfo block */
        block?: (string|null);

        /** NodeInfo solidityBlock */
        solidityBlock?: (string|null);

        /** NodeInfo currentConnectCount */
        currentConnectCount?: (number|null);

        /** NodeInfo activeConnectCount */
        activeConnectCount?: (number|null);

        /** NodeInfo passiveConnectCount */
        passiveConnectCount?: (number|null);

        /** NodeInfo totalFlow */
        totalFlow?: (number|Long|null);

        /** NodeInfo peerInfoList */
        peerInfoList?: (protocol.NodeInfo.IPeerInfo[]|null);

        /** NodeInfo configNodeInfo */
        configNodeInfo?: (protocol.NodeInfo.IConfigNodeInfo|null);

        /** NodeInfo machineInfo */
        machineInfo?: (protocol.NodeInfo.IMachineInfo|null);

        /** NodeInfo cheatWitnessInfoMap */
        cheatWitnessInfoMap?: ({ [k: string]: string }|null);
    }

    /** Represents a NodeInfo. */
    class NodeInfo implements INodeInfo {

        /**
         * Constructs a new NodeInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.INodeInfo);

        /** NodeInfo beginSyncNum. */
        public beginSyncNum: (number|Long);

        /** NodeInfo block. */
        public block: string;

        /** NodeInfo solidityBlock. */
        public solidityBlock: string;

        /** NodeInfo currentConnectCount. */
        public currentConnectCount: number;

        /** NodeInfo activeConnectCount. */
        public activeConnectCount: number;

        /** NodeInfo passiveConnectCount. */
        public passiveConnectCount: number;

        /** NodeInfo totalFlow. */
        public totalFlow: (number|Long);

        /** NodeInfo peerInfoList. */
        public peerInfoList: protocol.NodeInfo.IPeerInfo[];

        /** NodeInfo configNodeInfo. */
        public configNodeInfo?: (protocol.NodeInfo.IConfigNodeInfo|null);

        /** NodeInfo machineInfo. */
        public machineInfo?: (protocol.NodeInfo.IMachineInfo|null);

        /** NodeInfo cheatWitnessInfoMap. */
        public cheatWitnessInfoMap: { [k: string]: string };

        /**
         * Creates a new NodeInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns NodeInfo instance
         */
        public static create(properties?: protocol.INodeInfo): protocol.NodeInfo;

        /**
         * Encodes the specified NodeInfo message. Does not implicitly {@link protocol.NodeInfo.verify|verify} messages.
         * @param message NodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.INodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified NodeInfo message, length delimited. Does not implicitly {@link protocol.NodeInfo.verify|verify} messages.
         * @param message NodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.INodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a NodeInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns NodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.NodeInfo;

        /**
         * Decodes a NodeInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns NodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.NodeInfo;

        /**
         * Verifies a NodeInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a NodeInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns NodeInfo
         */
        public static fromObject(object: { [k: string]: any }): protocol.NodeInfo;

        /**
         * Creates a plain object from a NodeInfo message. Also converts values to other types if specified.
         * @param message NodeInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.NodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this NodeInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace NodeInfo {

        /** Properties of a PeerInfo. */
        interface IPeerInfo {

            /** PeerInfo lastSyncBlock */
            lastSyncBlock?: (string|null);

            /** PeerInfo remainNum */
            remainNum?: (number|Long|null);

            /** PeerInfo lastBlockUpdateTime */
            lastBlockUpdateTime?: (number|Long|null);

            /** PeerInfo syncFlag */
            syncFlag?: (boolean|null);

            /** PeerInfo headBlockTimeWeBothHave */
            headBlockTimeWeBothHave?: (number|Long|null);

            /** PeerInfo needSyncFromPeer */
            needSyncFromPeer?: (boolean|null);

            /** PeerInfo needSyncFromUs */
            needSyncFromUs?: (boolean|null);

            /** PeerInfo host */
            host?: (string|null);

            /** PeerInfo port */
            port?: (number|null);

            /** PeerInfo nodeId */
            nodeId?: (string|null);

            /** PeerInfo connectTime */
            connectTime?: (number|Long|null);

            /** PeerInfo avgLatency */
            avgLatency?: (number|null);

            /** PeerInfo syncToFetchSize */
            syncToFetchSize?: (number|null);

            /** PeerInfo syncToFetchSizePeekNum */
            syncToFetchSizePeekNum?: (number|Long|null);

            /** PeerInfo syncBlockRequestedSize */
            syncBlockRequestedSize?: (number|null);

            /** PeerInfo unFetchSynNum */
            unFetchSynNum?: (number|Long|null);

            /** PeerInfo blockInPorcSize */
            blockInPorcSize?: (number|null);

            /** PeerInfo headBlockWeBothHave */
            headBlockWeBothHave?: (string|null);

            /** PeerInfo isActive */
            isActive?: (boolean|null);

            /** PeerInfo score */
            score?: (number|null);

            /** PeerInfo nodeCount */
            nodeCount?: (number|null);

            /** PeerInfo inFlow */
            inFlow?: (number|Long|null);

            /** PeerInfo disconnectTimes */
            disconnectTimes?: (number|null);

            /** PeerInfo localDisconnectReason */
            localDisconnectReason?: (string|null);

            /** PeerInfo remoteDisconnectReason */
            remoteDisconnectReason?: (string|null);
        }

        /** Represents a PeerInfo. */
        class PeerInfo implements IPeerInfo {

            /**
             * Constructs a new PeerInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.NodeInfo.IPeerInfo);

            /** PeerInfo lastSyncBlock. */
            public lastSyncBlock: string;

            /** PeerInfo remainNum. */
            public remainNum: (number|Long);

            /** PeerInfo lastBlockUpdateTime. */
            public lastBlockUpdateTime: (number|Long);

            /** PeerInfo syncFlag. */
            public syncFlag: boolean;

            /** PeerInfo headBlockTimeWeBothHave. */
            public headBlockTimeWeBothHave: (number|Long);

            /** PeerInfo needSyncFromPeer. */
            public needSyncFromPeer: boolean;

            /** PeerInfo needSyncFromUs. */
            public needSyncFromUs: boolean;

            /** PeerInfo host. */
            public host: string;

            /** PeerInfo port. */
            public port: number;

            /** PeerInfo nodeId. */
            public nodeId: string;

            /** PeerInfo connectTime. */
            public connectTime: (number|Long);

            /** PeerInfo avgLatency. */
            public avgLatency: number;

            /** PeerInfo syncToFetchSize. */
            public syncToFetchSize: number;

            /** PeerInfo syncToFetchSizePeekNum. */
            public syncToFetchSizePeekNum: (number|Long);

            /** PeerInfo syncBlockRequestedSize. */
            public syncBlockRequestedSize: number;

            /** PeerInfo unFetchSynNum. */
            public unFetchSynNum: (number|Long);

            /** PeerInfo blockInPorcSize. */
            public blockInPorcSize: number;

            /** PeerInfo headBlockWeBothHave. */
            public headBlockWeBothHave: string;

            /** PeerInfo isActive. */
            public isActive: boolean;

            /** PeerInfo score. */
            public score: number;

            /** PeerInfo nodeCount. */
            public nodeCount: number;

            /** PeerInfo inFlow. */
            public inFlow: (number|Long);

            /** PeerInfo disconnectTimes. */
            public disconnectTimes: number;

            /** PeerInfo localDisconnectReason. */
            public localDisconnectReason: string;

            /** PeerInfo remoteDisconnectReason. */
            public remoteDisconnectReason: string;

            /**
             * Creates a new PeerInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PeerInfo instance
             */
            public static create(properties?: protocol.NodeInfo.IPeerInfo): protocol.NodeInfo.PeerInfo;

            /**
             * Encodes the specified PeerInfo message. Does not implicitly {@link protocol.NodeInfo.PeerInfo.verify|verify} messages.
             * @param message PeerInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.NodeInfo.IPeerInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PeerInfo message, length delimited. Does not implicitly {@link protocol.NodeInfo.PeerInfo.verify|verify} messages.
             * @param message PeerInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.NodeInfo.IPeerInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PeerInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PeerInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.NodeInfo.PeerInfo;

            /**
             * Decodes a PeerInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PeerInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.NodeInfo.PeerInfo;

            /**
             * Verifies a PeerInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PeerInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PeerInfo
             */
            public static fromObject(object: { [k: string]: any }): protocol.NodeInfo.PeerInfo;

            /**
             * Creates a plain object from a PeerInfo message. Also converts values to other types if specified.
             * @param message PeerInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.NodeInfo.PeerInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PeerInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ConfigNodeInfo. */
        interface IConfigNodeInfo {

            /** ConfigNodeInfo codeVersion */
            codeVersion?: (string|null);

            /** ConfigNodeInfo p2pVersion */
            p2pVersion?: (string|null);

            /** ConfigNodeInfo listenPort */
            listenPort?: (number|null);

            /** ConfigNodeInfo discoverEnable */
            discoverEnable?: (boolean|null);

            /** ConfigNodeInfo activeNodeSize */
            activeNodeSize?: (number|null);

            /** ConfigNodeInfo passiveNodeSize */
            passiveNodeSize?: (number|null);

            /** ConfigNodeInfo sendNodeSize */
            sendNodeSize?: (number|null);

            /** ConfigNodeInfo maxConnectCount */
            maxConnectCount?: (number|null);

            /** ConfigNodeInfo sameIpMaxConnectCount */
            sameIpMaxConnectCount?: (number|null);

            /** ConfigNodeInfo backupListenPort */
            backupListenPort?: (number|null);

            /** ConfigNodeInfo backupMemberSize */
            backupMemberSize?: (number|null);

            /** ConfigNodeInfo backupPriority */
            backupPriority?: (number|null);

            /** ConfigNodeInfo dbVersion */
            dbVersion?: (number|null);

            /** ConfigNodeInfo minParticipationRate */
            minParticipationRate?: (number|null);

            /** ConfigNodeInfo supportConstant */
            supportConstant?: (boolean|null);

            /** ConfigNodeInfo minTimeRatio */
            minTimeRatio?: (number|null);

            /** ConfigNodeInfo maxTimeRatio */
            maxTimeRatio?: (number|null);

            /** ConfigNodeInfo allowCreationOfContracts */
            allowCreationOfContracts?: (number|Long|null);

            /** ConfigNodeInfo allowAdaptiveEnergy */
            allowAdaptiveEnergy?: (number|Long|null);
        }

        /** Represents a ConfigNodeInfo. */
        class ConfigNodeInfo implements IConfigNodeInfo {

            /**
             * Constructs a new ConfigNodeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.NodeInfo.IConfigNodeInfo);

            /** ConfigNodeInfo codeVersion. */
            public codeVersion: string;

            /** ConfigNodeInfo p2pVersion. */
            public p2pVersion: string;

            /** ConfigNodeInfo listenPort. */
            public listenPort: number;

            /** ConfigNodeInfo discoverEnable. */
            public discoverEnable: boolean;

            /** ConfigNodeInfo activeNodeSize. */
            public activeNodeSize: number;

            /** ConfigNodeInfo passiveNodeSize. */
            public passiveNodeSize: number;

            /** ConfigNodeInfo sendNodeSize. */
            public sendNodeSize: number;

            /** ConfigNodeInfo maxConnectCount. */
            public maxConnectCount: number;

            /** ConfigNodeInfo sameIpMaxConnectCount. */
            public sameIpMaxConnectCount: number;

            /** ConfigNodeInfo backupListenPort. */
            public backupListenPort: number;

            /** ConfigNodeInfo backupMemberSize. */
            public backupMemberSize: number;

            /** ConfigNodeInfo backupPriority. */
            public backupPriority: number;

            /** ConfigNodeInfo dbVersion. */
            public dbVersion: number;

            /** ConfigNodeInfo minParticipationRate. */
            public minParticipationRate: number;

            /** ConfigNodeInfo supportConstant. */
            public supportConstant: boolean;

            /** ConfigNodeInfo minTimeRatio. */
            public minTimeRatio: number;

            /** ConfigNodeInfo maxTimeRatio. */
            public maxTimeRatio: number;

            /** ConfigNodeInfo allowCreationOfContracts. */
            public allowCreationOfContracts: (number|Long);

            /** ConfigNodeInfo allowAdaptiveEnergy. */
            public allowAdaptiveEnergy: (number|Long);

            /**
             * Creates a new ConfigNodeInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConfigNodeInfo instance
             */
            public static create(properties?: protocol.NodeInfo.IConfigNodeInfo): protocol.NodeInfo.ConfigNodeInfo;

            /**
             * Encodes the specified ConfigNodeInfo message. Does not implicitly {@link protocol.NodeInfo.ConfigNodeInfo.verify|verify} messages.
             * @param message ConfigNodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.NodeInfo.IConfigNodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConfigNodeInfo message, length delimited. Does not implicitly {@link protocol.NodeInfo.ConfigNodeInfo.verify|verify} messages.
             * @param message ConfigNodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.NodeInfo.IConfigNodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConfigNodeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConfigNodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.NodeInfo.ConfigNodeInfo;

            /**
             * Decodes a ConfigNodeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConfigNodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.NodeInfo.ConfigNodeInfo;

            /**
             * Verifies a ConfigNodeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConfigNodeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConfigNodeInfo
             */
            public static fromObject(object: { [k: string]: any }): protocol.NodeInfo.ConfigNodeInfo;

            /**
             * Creates a plain object from a ConfigNodeInfo message. Also converts values to other types if specified.
             * @param message ConfigNodeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.NodeInfo.ConfigNodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConfigNodeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MachineInfo. */
        interface IMachineInfo {

            /** MachineInfo threadCount */
            threadCount?: (number|null);

            /** MachineInfo deadLockThreadCount */
            deadLockThreadCount?: (number|null);

            /** MachineInfo cpuCount */
            cpuCount?: (number|null);

            /** MachineInfo totalMemory */
            totalMemory?: (number|Long|null);

            /** MachineInfo freeMemory */
            freeMemory?: (number|Long|null);

            /** MachineInfo cpuRate */
            cpuRate?: (number|null);

            /** MachineInfo javaVersion */
            javaVersion?: (string|null);

            /** MachineInfo osName */
            osName?: (string|null);

            /** MachineInfo jvmTotalMemoery */
            jvmTotalMemoery?: (number|Long|null);

            /** MachineInfo jvmFreeMemory */
            jvmFreeMemory?: (number|Long|null);

            /** MachineInfo processCpuRate */
            processCpuRate?: (number|null);

            /** MachineInfo memoryDescInfoList */
            memoryDescInfoList?: (protocol.NodeInfo.MachineInfo.IMemoryDescInfo[]|null);

            /** MachineInfo deadLockThreadInfoList */
            deadLockThreadInfoList?: (protocol.NodeInfo.MachineInfo.IDeadLockThreadInfo[]|null);
        }

        /** Represents a MachineInfo. */
        class MachineInfo implements IMachineInfo {

            /**
             * Constructs a new MachineInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: protocol.NodeInfo.IMachineInfo);

            /** MachineInfo threadCount. */
            public threadCount: number;

            /** MachineInfo deadLockThreadCount. */
            public deadLockThreadCount: number;

            /** MachineInfo cpuCount. */
            public cpuCount: number;

            /** MachineInfo totalMemory. */
            public totalMemory: (number|Long);

            /** MachineInfo freeMemory. */
            public freeMemory: (number|Long);

            /** MachineInfo cpuRate. */
            public cpuRate: number;

            /** MachineInfo javaVersion. */
            public javaVersion: string;

            /** MachineInfo osName. */
            public osName: string;

            /** MachineInfo jvmTotalMemoery. */
            public jvmTotalMemoery: (number|Long);

            /** MachineInfo jvmFreeMemory. */
            public jvmFreeMemory: (number|Long);

            /** MachineInfo processCpuRate. */
            public processCpuRate: number;

            /** MachineInfo memoryDescInfoList. */
            public memoryDescInfoList: protocol.NodeInfo.MachineInfo.IMemoryDescInfo[];

            /** MachineInfo deadLockThreadInfoList. */
            public deadLockThreadInfoList: protocol.NodeInfo.MachineInfo.IDeadLockThreadInfo[];

            /**
             * Creates a new MachineInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MachineInfo instance
             */
            public static create(properties?: protocol.NodeInfo.IMachineInfo): protocol.NodeInfo.MachineInfo;

            /**
             * Encodes the specified MachineInfo message. Does not implicitly {@link protocol.NodeInfo.MachineInfo.verify|verify} messages.
             * @param message MachineInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: protocol.NodeInfo.IMachineInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MachineInfo message, length delimited. Does not implicitly {@link protocol.NodeInfo.MachineInfo.verify|verify} messages.
             * @param message MachineInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: protocol.NodeInfo.IMachineInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MachineInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MachineInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.NodeInfo.MachineInfo;

            /**
             * Decodes a MachineInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MachineInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.NodeInfo.MachineInfo;

            /**
             * Verifies a MachineInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MachineInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MachineInfo
             */
            public static fromObject(object: { [k: string]: any }): protocol.NodeInfo.MachineInfo;

            /**
             * Creates a plain object from a MachineInfo message. Also converts values to other types if specified.
             * @param message MachineInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: protocol.NodeInfo.MachineInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MachineInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace MachineInfo {

            /** Properties of a MemoryDescInfo. */
            interface IMemoryDescInfo {

                /** MemoryDescInfo name */
                name?: (string|null);

                /** MemoryDescInfo initSize */
                initSize?: (number|Long|null);

                /** MemoryDescInfo useSize */
                useSize?: (number|Long|null);

                /** MemoryDescInfo maxSize */
                maxSize?: (number|Long|null);

                /** MemoryDescInfo useRate */
                useRate?: (number|null);
            }

            /** Represents a MemoryDescInfo. */
            class MemoryDescInfo implements IMemoryDescInfo {

                /**
                 * Constructs a new MemoryDescInfo.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: protocol.NodeInfo.MachineInfo.IMemoryDescInfo);

                /** MemoryDescInfo name. */
                public name: string;

                /** MemoryDescInfo initSize. */
                public initSize: (number|Long);

                /** MemoryDescInfo useSize. */
                public useSize: (number|Long);

                /** MemoryDescInfo maxSize. */
                public maxSize: (number|Long);

                /** MemoryDescInfo useRate. */
                public useRate: number;

                /**
                 * Creates a new MemoryDescInfo instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns MemoryDescInfo instance
                 */
                public static create(properties?: protocol.NodeInfo.MachineInfo.IMemoryDescInfo): protocol.NodeInfo.MachineInfo.MemoryDescInfo;

                /**
                 * Encodes the specified MemoryDescInfo message. Does not implicitly {@link protocol.NodeInfo.MachineInfo.MemoryDescInfo.verify|verify} messages.
                 * @param message MemoryDescInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: protocol.NodeInfo.MachineInfo.IMemoryDescInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MemoryDescInfo message, length delimited. Does not implicitly {@link protocol.NodeInfo.MachineInfo.MemoryDescInfo.verify|verify} messages.
                 * @param message MemoryDescInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: protocol.NodeInfo.MachineInfo.IMemoryDescInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MemoryDescInfo message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MemoryDescInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.NodeInfo.MachineInfo.MemoryDescInfo;

                /**
                 * Decodes a MemoryDescInfo message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MemoryDescInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.NodeInfo.MachineInfo.MemoryDescInfo;

                /**
                 * Verifies a MemoryDescInfo message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MemoryDescInfo message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MemoryDescInfo
                 */
                public static fromObject(object: { [k: string]: any }): protocol.NodeInfo.MachineInfo.MemoryDescInfo;

                /**
                 * Creates a plain object from a MemoryDescInfo message. Also converts values to other types if specified.
                 * @param message MemoryDescInfo
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: protocol.NodeInfo.MachineInfo.MemoryDescInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MemoryDescInfo to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a DeadLockThreadInfo. */
            interface IDeadLockThreadInfo {

                /** DeadLockThreadInfo name */
                name?: (string|null);

                /** DeadLockThreadInfo lockName */
                lockName?: (string|null);

                /** DeadLockThreadInfo lockOwner */
                lockOwner?: (string|null);

                /** DeadLockThreadInfo state */
                state?: (string|null);

                /** DeadLockThreadInfo blockTime */
                blockTime?: (number|Long|null);

                /** DeadLockThreadInfo waitTime */
                waitTime?: (number|Long|null);

                /** DeadLockThreadInfo stackTrace */
                stackTrace?: (string|null);
            }

            /** Represents a DeadLockThreadInfo. */
            class DeadLockThreadInfo implements IDeadLockThreadInfo {

                /**
                 * Constructs a new DeadLockThreadInfo.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: protocol.NodeInfo.MachineInfo.IDeadLockThreadInfo);

                /** DeadLockThreadInfo name. */
                public name: string;

                /** DeadLockThreadInfo lockName. */
                public lockName: string;

                /** DeadLockThreadInfo lockOwner. */
                public lockOwner: string;

                /** DeadLockThreadInfo state. */
                public state: string;

                /** DeadLockThreadInfo blockTime. */
                public blockTime: (number|Long);

                /** DeadLockThreadInfo waitTime. */
                public waitTime: (number|Long);

                /** DeadLockThreadInfo stackTrace. */
                public stackTrace: string;

                /**
                 * Creates a new DeadLockThreadInfo instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns DeadLockThreadInfo instance
                 */
                public static create(properties?: protocol.NodeInfo.MachineInfo.IDeadLockThreadInfo): protocol.NodeInfo.MachineInfo.DeadLockThreadInfo;

                /**
                 * Encodes the specified DeadLockThreadInfo message. Does not implicitly {@link protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.verify|verify} messages.
                 * @param message DeadLockThreadInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: protocol.NodeInfo.MachineInfo.IDeadLockThreadInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified DeadLockThreadInfo message, length delimited. Does not implicitly {@link protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.verify|verify} messages.
                 * @param message DeadLockThreadInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: protocol.NodeInfo.MachineInfo.IDeadLockThreadInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DeadLockThreadInfo message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns DeadLockThreadInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.NodeInfo.MachineInfo.DeadLockThreadInfo;

                /**
                 * Decodes a DeadLockThreadInfo message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns DeadLockThreadInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.NodeInfo.MachineInfo.DeadLockThreadInfo;

                /**
                 * Verifies a DeadLockThreadInfo message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a DeadLockThreadInfo message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns DeadLockThreadInfo
                 */
                public static fromObject(object: { [k: string]: any }): protocol.NodeInfo.MachineInfo.DeadLockThreadInfo;

                /**
                 * Creates a plain object from a DeadLockThreadInfo message. Also converts values to other types if specified.
                 * @param message DeadLockThreadInfo
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: protocol.NodeInfo.MachineInfo.DeadLockThreadInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this DeadLockThreadInfo to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
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
            type_url?: (string|null);

            /** Any value */
            value?: (Uint8Array|null);
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
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Any;

            /**
             * Decodes an Any message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Any;

            /**
             * Verifies an Any message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

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
            public static toObject(message: google.protobuf.Any, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Any to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}
