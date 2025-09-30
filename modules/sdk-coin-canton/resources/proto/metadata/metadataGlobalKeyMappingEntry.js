import { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } from '@protobuf-ts/runtime';
import { Value } from '../node/value.js';
import { GlobalKey } from '../node/globalKey.js';

class Metadata_GlobalKeyMappingEntry$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.Metadata.GlobalKeyMappingEntry', [
      { no: 1, name: 'key', kind: 'message', T: () => GlobalKey },
      { no: 2, name: 'value', kind: 'message', T: () => Value },
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
        case /* com.daml.ledger.api.v2.interactive.GlobalKey key */ 1:
          message.key = GlobalKey.internalBinaryRead(reader, reader.uint32(), options, message.key);
          break;
        case /* optional com.daml.ledger.api.v2.Value value */ 2:
          message.value = Value.internalBinaryRead(reader, reader.uint32(), options, message.value);
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
    /* com.daml.ledger.api.v2.interactive.GlobalKey key = 1; */
    if (message.key)
      GlobalKey.internalBinaryWrite(message.key, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    /* optional com.daml.ledger.api.v2.Value value = 2; */
    if (message.value)
      Value.internalBinaryWrite(message.value, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.Metadata.GlobalKeyMappingEntry
 */
export const Metadata_GlobalKeyMappingEntry = new Metadata_GlobalKeyMappingEntry$Type();
