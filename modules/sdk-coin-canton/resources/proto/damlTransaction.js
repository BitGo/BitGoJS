const { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } = require('@protobuf-ts/runtime');
const { DamlTransaction_Node } = require('./damlTransactionNode.js');
const { DamlTransaction_NodeSeed } = require('./damlTransactionNodeSeed.js');

class DamlTransaction$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.DamlTransaction', [
      {
        no: 1,
        name: 'version',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 2,
        name: 'roots',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 3,
        name: 'nodes',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => DamlTransaction_Node,
      },
      {
        no: 4,
        name: 'node_seeds',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => DamlTransaction_NodeSeed,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.version = '';
    message.roots = [];
    message.nodes = [];
    message.nodeSeeds = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string version */ 1:
          message.version = reader.string();
          break;
        case /* repeated string roots */ 2:
          message.roots.push(reader.string());
          break;
        case /* repeated com.daml.ledger.api.v2.interactive.DamlTransaction.Node nodes */ 3:
          message.nodes.push(DamlTransaction_Node.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* repeated com.daml.ledger.api.v2.interactive.DamlTransaction.NodeSeed node_seeds */ 4:
          message.nodeSeeds.push(DamlTransaction_NodeSeed.internalBinaryRead(reader, reader.uint32(), options));
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
    /* string version = 1; */
    if (message.version !== '') writer.tag(1, WireType.LengthDelimited).string(message.version);
    /* repeated string roots = 2; */
    for (let i = 0; i < message.roots.length; i++) writer.tag(2, WireType.LengthDelimited).string(message.roots[i]);
    /* repeated com.daml.ledger.api.v2.interactive.DamlTransaction.Node nodes = 3; */
    for (let i = 0; i < message.nodes.length; i++)
      DamlTransaction_Node.internalBinaryWrite(
        message.nodes[i],
        writer.tag(3, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* repeated com.daml.ledger.api.v2.interactive.DamlTransaction.NodeSeed node_seeds = 4; */
    for (let i = 0; i < message.nodeSeeds.length; i++)
      DamlTransaction_NodeSeed.internalBinaryWrite(
        message.nodeSeeds[i],
        writer.tag(4, WireType.LengthDelimited).fork(),
        options
      ).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.DamlTransaction
 */
module.exports.DamlTransaction = new DamlTransaction$Type();
