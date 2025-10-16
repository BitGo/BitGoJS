const { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } = require('@protobuf-ts/runtime');

class Metadata_SubmitterInfo$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.Metadata.SubmitterInfo', [
      {
        no: 1,
        name: 'act_as',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 2,
        name: 'command_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.actAs = [];
    message.commandId = '';
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated string act_as */ 1:
          message.actAs.push(reader.string());
          break;
        case /* string command_id */ 2:
          message.commandId = reader.string();
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
    /* repeated string act_as = 1; */
    for (let i = 0; i < message.actAs.length; i++) writer.tag(1, WireType.LengthDelimited).string(message.actAs[i]);
    /* string command_id = 2; */
    if (message.commandId !== '') writer.tag(2, WireType.LengthDelimited).string(message.commandId);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.Metadata.SubmitterInfo
 */
module.exports.Metadata_SubmitterInfo = new Metadata_SubmitterInfo$Type();
