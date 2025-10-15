const { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } = require('@protobuf-ts/runtime');
const { Create } = require('../node/node.js');

class Metadata_InputContract$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.Metadata.InputContract', [
      {
        no: 1,
        name: 'v1',
        kind: 'message',
        oneof: 'contract',
        T: () => Create,
      },
      {
        no: 1000,
        name: 'created_at',
        kind: 'scalar',
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
      {
        no: 1002,
        name: 'event_blob',
        kind: 'scalar',
        T: 12 /*ScalarType.BYTES*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.contract = { oneofKind: undefined };
    message.createdAt = 0n;
    message.eventBlob = new Uint8Array(0);
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.interactive.transaction.v1.Create v1 */ 1:
          message.contract = {
            oneofKind: 'v1',
            v1: Create.internalBinaryRead(reader, reader.uint32(), options, message.contract.v1),
          };
          break;
        case /* uint64 created_at */ 1000:
          message.createdAt = reader.uint64().toBigInt();
          break;
        case /* bytes event_blob */ 1002:
          message.eventBlob = reader.bytes();
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
    /* com.daml.ledger.api.v2.interactive.transaction.v1.Create v1 = 1; */
    if (message.contract.oneofKind === 'v1')
      Create.internalBinaryWrite(message.contract.v1, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    /* uint64 created_at = 1000; */
    if (message.createdAt !== 0n) writer.tag(1000, WireType.Varint).uint64(message.createdAt);
    /* bytes event_blob = 1002; */
    if (message.eventBlob.length) writer.tag(1002, WireType.LengthDelimited).bytes(message.eventBlob);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.Metadata.InputContract
 */
module.exports.Metadata_InputContract = new Metadata_InputContract$Type();
