const { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } = require('@protobuf-ts/runtime');
const { Node } = require('./node/node.js');

class DamlTransaction_Node$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.DamlTransaction.Node', [
      {
        no: 1,
        name: 'node_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 1000,
        name: 'v1',
        kind: 'message',
        oneof: 'versionedNode',
        T: () => Node,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.nodeId = '';
    message.versionedNode = { oneofKind: undefined };
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string node_id */ 1:
          message.nodeId = reader.string();
          break;
        case /* com.daml.ledger.api.v2.interactive.transaction.v1.Node v1 */ 1000:
          message.versionedNode = {
            oneofKind: 'v1',
            v1: Node.internalBinaryRead(reader, reader.uint32(), options, message.versionedNode.v1),
          };
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
    /* string node_id = 1; */
    if (message.nodeId !== '') writer.tag(1, WireType.LengthDelimited).string(message.nodeId);
    /* com.daml.ledger.api.v2.interactive.transaction.v1.Node v1 = 1000; */
    if (message.versionedNode.oneofKind === 'v1')
      Node.internalBinaryWrite(
        message.versionedNode.v1,
        writer.tag(1000, WireType.LengthDelimited).fork(),
        options
      ).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.DamlTransaction.Node
 */
module.exports.DamlTransaction_Node = new DamlTransaction_Node$Type();
