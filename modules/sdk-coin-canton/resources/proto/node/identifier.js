import { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } from '@protobuf-ts/runtime';

class Identifier$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.Identifier', [
      {
        no: 1,
        name: 'package_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 2,
        name: 'module_name',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 3,
        name: 'entity_name',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.packageId = '';
    message.moduleName = '';
    message.entityName = '';
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string package_id */ 1:
          message.packageId = reader.string();
          break;
        case /* string module_name */ 2:
          message.moduleName = reader.string();
          break;
        case /* string entity_name */ 3:
          message.entityName = reader.string();
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
    /* string package_id = 1; */
    if (message.packageId !== '') writer.tag(1, WireType.LengthDelimited).string(message.packageId);
    /* string module_name = 2; */
    if (message.moduleName !== '') writer.tag(2, WireType.LengthDelimited).string(message.moduleName);
    /* string entity_name = 3; */
    if (message.entityName !== '') writer.tag(3, WireType.LengthDelimited).string(message.entityName);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.Identifier
 */
export const Identifier = new Identifier$Type();
