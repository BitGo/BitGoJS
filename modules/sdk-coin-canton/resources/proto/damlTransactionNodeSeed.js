const { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } = require('@protobuf-ts/runtime');

class DamlTransaction_NodeSeed$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.DamlTransaction.NodeSeed', [
      {
        no: 1,
        name: 'node_id',
        kind: 'scalar',
        T: 5 /*ScalarType.INT32*/,
      },
      { no: 2, name: 'seed', kind: 'scalar', T: 12 /*ScalarType.BYTES*/ },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.nodeId = 0;
    message.seed = new Uint8Array(0);
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* int32 node_id */ 1:
          message.nodeId = reader.int32();
          break;
        case /* bytes seed */ 2:
          message.seed = reader.bytes();
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
    /* int32 node_id = 1; */
    if (message.nodeId !== 0) writer.tag(1, WireType.Varint).int32(message.nodeId);
    /* bytes seed = 2; */
    if (message.seed.length) writer.tag(2, WireType.LengthDelimited).bytes(message.seed);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.DamlTransaction.NodeSeed
 */
module.exports.DamlTransaction_NodeSeed = new DamlTransaction_NodeSeed$Type();
