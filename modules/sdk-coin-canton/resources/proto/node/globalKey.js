import { MessageType, reflectionMergePartial, UnknownFieldHandler, WireType } from '@protobuf-ts/runtime';
import { Value } from './value.js';
import { Identifier } from './identifier.js';

class GlobalKey$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.GlobalKey', [
      {
        no: 1,
        name: 'template_id',
        kind: 'message',
        T: () => Identifier,
      },
      {
        no: 2,
        name: 'package_name',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      { no: 3, name: 'key', kind: 'message', T: () => Value },
      { no: 4, name: 'hash', kind: 'scalar', T: 12 /*ScalarType.BYTES*/ },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.packageName = '';
    message.hash = new Uint8Array(0);
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.Identifier template_id */ 1:
          message.templateId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.templateId);
          break;
        case /* string package_name */ 2:
          message.packageName = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Value key */ 3:
          message.key = Value.internalBinaryRead(reader, reader.uint32(), options, message.key);
          break;
        case /* bytes hash */ 4:
          message.hash = reader.bytes();
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
    /* com.daml.ledger.api.v2.Identifier template_id = 1; */
    if (message.templateId)
      Identifier.internalBinaryWrite(
        message.templateId,
        writer.tag(1, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* string package_name = 2; */
    if (message.packageName !== '') writer.tag(2, WireType.LengthDelimited).string(message.packageName);
    /* com.daml.ledger.api.v2.Value key = 3; */
    if (message.key)
      Value.internalBinaryWrite(message.key, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    /* bytes hash = 4; */
    if (message.hash.length) writer.tag(4, WireType.LengthDelimited).bytes(message.hash);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.GlobalKey
 */
export const GlobalKey = new GlobalKey$Type();
