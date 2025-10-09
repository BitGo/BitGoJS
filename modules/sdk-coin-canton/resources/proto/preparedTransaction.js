import { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } from '@protobuf-ts/runtime';
import { DamlTransaction } from './damlTransaction.js';
import { Metadata } from './metadata.js';

class PreparedTransaction$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.PreparedTransaction', [
      {
        no: 1,
        name: 'transaction',
        kind: 'message',
        T: () => DamlTransaction,
      },
      { no: 2, name: 'metadata', kind: 'message', T: () => Metadata },
    ]);
  }

  create(value) {
    const message = Object.create(this.messagePrototype);
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.interactive.DamlTransaction transaction */ 1:
          message.transaction = DamlTransaction.internalBinaryRead(
            reader,
            reader.uint32(),
            options,
            message.transaction
          );
          break;
        case /* com.daml.ledger.api.v2.interactive.Metadata metadata */ 2:
          message.metadata = Metadata.internalBinaryRead(reader, reader.uint32(), options, message.metadata);
          break;
        default:
          const u = options.readUnknownField;
          if (u === 'throw') throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          const d = reader.skip(wireType);
          if (u !== false) (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    /* com.daml.ledger.api.v2.interactive.DamlTransaction transaction = 1; */
    if (message.transaction)
      DamlTransaction.internalBinaryWrite(
        message.transaction,
        writer.tag(1, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* com.daml.ledger.api.v2.interactive.Metadata metadata = 2; */
    if (message.metadata)
      Metadata.internalBinaryWrite(message.metadata, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}

export const PreparedTransaction = new PreparedTransaction$Type();
