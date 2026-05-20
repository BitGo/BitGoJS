const { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } = require('@protobuf-ts/runtime');
const { Empty } = require('./empty.js');
const { Identifier } = require('./identifier.js');

class Value$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.Value', [
      {
        no: 1,
        name: 'unit',
        kind: 'message',
        oneof: 'sum',
        T: () => Empty,
      },
      {
        no: 2,
        name: 'bool',
        kind: 'scalar',
        oneof: 'sum',
        T: 8 /*ScalarType.BOOL*/,
      },
      {
        no: 3,
        name: 'int64',
        kind: 'scalar',
        oneof: 'sum',
        T: 18 /*ScalarType.SINT64*/,
      },
      {
        no: 4,
        name: 'date',
        kind: 'scalar',
        oneof: 'sum',
        T: 5 /*ScalarType.INT32*/,
      },
      {
        no: 5,
        name: 'timestamp',
        kind: 'scalar',
        oneof: 'sum',
        T: 16 /*ScalarType.SFIXED64*/,
      },
      {
        no: 6,
        name: 'numeric',
        kind: 'scalar',
        oneof: 'sum',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 7,
        name: 'party',
        kind: 'scalar',
        oneof: 'sum',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 8,
        name: 'text',
        kind: 'scalar',
        oneof: 'sum',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 9,
        name: 'contract_id',
        kind: 'scalar',
        oneof: 'sum',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 10,
        name: 'optional',
        kind: 'message',
        oneof: 'sum',
        T: () => Optional,
      },
      {
        no: 11,
        name: 'list',
        kind: 'message',
        oneof: 'sum',
        T: () => List,
      },
      {
        no: 12,
        name: 'text_map',
        kind: 'message',
        oneof: 'sum',
        T: () => TextMap,
      },
      {
        no: 13,
        name: 'gen_map',
        kind: 'message',
        oneof: 'sum',
        T: () => GenMap,
      },
      {
        no: 14,
        name: 'record',
        kind: 'message',
        oneof: 'sum',
        T: () => Record,
      },
      {
        no: 15,
        name: 'variant',
        kind: 'message',
        oneof: 'sum',
        T: () => Variant,
      },
      {
        no: 16,
        name: 'enum',
        kind: 'message',
        oneof: 'sum',
        T: () => Enum,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.sum = { oneofKind: undefined };
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* google.protobuf.Empty unit */ 1:
          message.sum = {
            oneofKind: 'unit',
            unit: Empty.internalBinaryRead(reader, reader.uint32(), options, message.sum.unit),
          };
          break;
        case /* bool bool */ 2:
          message.sum = {
            oneofKind: 'bool',
            bool: reader.bool(),
          };
          break;
        case /* sint64 int64 = 3 [jstype = JS_STRING] */ 3:
          message.sum = {
            oneofKind: 'int64',
            int64: reader.sint64().toString(),
          };
          break;
        case /* int32 date */ 4:
          message.sum = {
            oneofKind: 'date',
            date: reader.int32(),
          };
          break;
        case /* sfixed64 timestamp = 5 [jstype = JS_STRING] */ 5:
          message.sum = {
            oneofKind: 'timestamp',
            timestamp: reader.sfixed64().toString(),
          };
          break;
        case /* string numeric */ 6:
          message.sum = {
            oneofKind: 'numeric',
            numeric: reader.string(),
          };
          break;
        case /* string party */ 7:
          message.sum = {
            oneofKind: 'party',
            party: reader.string(),
          };
          break;
        case /* string text */ 8:
          message.sum = {
            oneofKind: 'text',
            text: reader.string(),
          };
          break;
        case /* string contract_id */ 9:
          message.sum = {
            oneofKind: 'contractId',
            contractId: reader.string(),
          };
          break;
        case /* com.daml.ledger.api.v2.Optional optional */ 10:
          message.sum = {
            oneofKind: 'optional',
            optional: Optional.internalBinaryRead(reader, reader.uint32(), options, message.sum.optional),
          };
          break;
        case /* com.daml.ledger.api.v2.List list */ 11:
          message.sum = {
            oneofKind: 'list',
            list: List.internalBinaryRead(reader, reader.uint32(), options, message.sum.list),
          };
          break;
        case /* com.daml.ledger.api.v2.TextMap text_map */ 12:
          message.sum = {
            oneofKind: 'textMap',
            textMap: TextMap.internalBinaryRead(reader, reader.uint32(), options, message.sum.textMap),
          };
          break;
        case /* com.daml.ledger.api.v2.GenMap gen_map */ 13:
          message.sum = {
            oneofKind: 'genMap',
            genMap: GenMap.internalBinaryRead(reader, reader.uint32(), options, message.sum.genMap),
          };
          break;
        case /* com.daml.ledger.api.v2.Record record */ 14:
          message.sum = {
            oneofKind: 'record',
            record: Record.internalBinaryRead(reader, reader.uint32(), options, message.sum.record),
          };
          break;
        case /* com.daml.ledger.api.v2.Variant variant */ 15:
          message.sum = {
            oneofKind: 'variant',
            variant: Variant.internalBinaryRead(reader, reader.uint32(), options, message.sum.variant),
          };
          break;
        case /* com.daml.ledger.api.v2.Enum enum */ 16:
          message.sum = {
            oneofKind: 'enum',
            enum: Enum.internalBinaryRead(reader, reader.uint32(), options, message.sum.enum),
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
    /* google.protobuf.Empty unit = 1; */
    if (message.sum.oneofKind === 'unit')
      Empty.internalBinaryWrite(message.sum.unit, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    /* bool bool = 2; */
    if (message.sum.oneofKind === 'bool') writer.tag(2, WireType.Varint).bool(message.sum.bool);
    /* sint64 int64 = 3 [jstype = JS_STRING]; */
    if (message.sum.oneofKind === 'int64') writer.tag(3, WireType.Varint).sint64(message.sum.int64);
    /* int32 date = 4; */
    if (message.sum.oneofKind === 'date') writer.tag(4, WireType.Varint).int32(message.sum.date);
    /* sfixed64 timestamp = 5 [jstype = JS_STRING]; */
    if (message.sum.oneofKind === 'timestamp') writer.tag(5, WireType.Bit64).sfixed64(message.sum.timestamp);
    /* string numeric = 6; */
    if (message.sum.oneofKind === 'numeric') writer.tag(6, WireType.LengthDelimited).string(message.sum.numeric);
    /* string party = 7; */
    if (message.sum.oneofKind === 'party') writer.tag(7, WireType.LengthDelimited).string(message.sum.party);
    /* string text = 8; */
    if (message.sum.oneofKind === 'text') writer.tag(8, WireType.LengthDelimited).string(message.sum.text);
    /* string contract_id = 9; */
    if (message.sum.oneofKind === 'contractId') writer.tag(9, WireType.LengthDelimited).string(message.sum.contractId);
    /* com.daml.ledger.api.v2.Optional optional = 10; */
    if (message.sum.oneofKind === 'optional')
      Optional.internalBinaryWrite(
        message.sum.optional,
        writer.tag(10, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* com.daml.ledger.api.v2.List list = 11; */
    if (message.sum.oneofKind === 'list')
      List.internalBinaryWrite(message.sum.list, writer.tag(11, WireType.LengthDelimited).fork(), options).join();
    /* com.daml.ledger.api.v2.TextMap text_map = 12; */
    if (message.sum.oneofKind === 'textMap')
      TextMap.internalBinaryWrite(message.sum.textMap, writer.tag(12, WireType.LengthDelimited).fork(), options).join();
    /* com.daml.ledger.api.v2.GenMap gen_map = 13; */
    if (message.sum.oneofKind === 'genMap')
      GenMap.internalBinaryWrite(message.sum.genMap, writer.tag(13, WireType.LengthDelimited).fork(), options).join();
    /* com.daml.ledger.api.v2.Record record = 14; */
    if (message.sum.oneofKind === 'record')
      Record.internalBinaryWrite(message.sum.record, writer.tag(14, WireType.LengthDelimited).fork(), options).join();
    /* com.daml.ledger.api.v2.Variant variant = 15; */
    if (message.sum.oneofKind === 'variant')
      Variant.internalBinaryWrite(message.sum.variant, writer.tag(15, WireType.LengthDelimited).fork(), options).join();
    /* com.daml.ledger.api.v2.Enum enum = 16; */
    if (message.sum.oneofKind === 'enum')
      Enum.internalBinaryWrite(message.sum.enum, writer.tag(16, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.Value
 */
const Value = new Value$Type();

class Optional$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.Optional', [{ no: 1, name: 'value', kind: 'message', T: () => Value }]);
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
        case /* com.daml.ledger.api.v2.Value value */ 1:
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
    /* com.daml.ledger.api.v2.Value value = 1; */
    if (message.value)
      Value.internalBinaryWrite(message.value, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.Optional
 */
const Optional = new Optional$Type();

class List$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.List', [
      {
        no: 1,
        name: 'elements',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => Value,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.elements = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated com.daml.ledger.api.v2.Value elements */ 1:
          message.elements.push(Value.internalBinaryRead(reader, reader.uint32(), options));
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
    /* repeated com.daml.ledger.api.v2.Value elements = 1; */
    for (let i = 0; i < message.elements.length; i++)
      Value.internalBinaryWrite(message.elements[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.List
 */
const List = new List$Type();

class TextMap$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.TextMap', [
      {
        no: 1,
        name: 'entries',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => TextMap_Entry,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.entries = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated com.daml.ledger.api.v2.TextMap.Entry entries */ 1:
          message.entries.push(TextMap_Entry.internalBinaryRead(reader, reader.uint32(), options));
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
    /* repeated com.daml.ledger.api.v2.TextMap.Entry entries = 1; */
    for (let i = 0; i < message.entries.length; i++)
      TextMap_Entry.internalBinaryWrite(
        message.entries[i],
        writer.tag(1, WireType.LengthDelimited).fork(),
        options
      ).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.TextMap
 */
const TextMap = new TextMap$Type();

class TextMap_Entry$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.TextMap.Entry', [
      { no: 1, name: 'key', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      { no: 2, name: 'value', kind: 'message', T: () => Value },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.key = '';
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string key */ 1:
          message.key = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Value value */ 2:
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
    /* string key = 1; */
    if (message.key !== '') writer.tag(1, WireType.LengthDelimited).string(message.key);
    /* com.daml.ledger.api.v2.Value value = 2; */
    if (message.value)
      Value.internalBinaryWrite(message.value, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.TextMap.Entry
 */
const TextMap_Entry = new TextMap_Entry$Type();

class GenMap$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.GenMap', [
      {
        no: 1,
        name: 'entries',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => GenMap_Entry,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.entries = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated com.daml.ledger.api.v2.GenMap.Entry entries */ 1:
          message.entries.push(GenMap_Entry.internalBinaryRead(reader, reader.uint32(), options));
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
    /* repeated com.daml.ledger.api.v2.GenMap.Entry entries = 1; */
    for (let i = 0; i < message.entries.length; i++)
      GenMap_Entry.internalBinaryWrite(
        message.entries[i],
        writer.tag(1, WireType.LengthDelimited).fork(),
        options
      ).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.GenMap
 */
const GenMap = new GenMap$Type();

class GenMap_Entry$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.GenMap.Entry', [
      { no: 1, name: 'key', kind: 'message', T: () => Value },
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
        case /* com.daml.ledger.api.v2.Value key */ 1:
          message.key = Value.internalBinaryRead(reader, reader.uint32(), options, message.key);
          break;
        case /* com.daml.ledger.api.v2.Value value */ 2:
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
    /* com.daml.ledger.api.v2.Value key = 1; */
    if (message.key)
      Value.internalBinaryWrite(message.key, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    /* com.daml.ledger.api.v2.Value value = 2; */
    if (message.value)
      Value.internalBinaryWrite(message.value, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.GenMap.Entry
 */
const GenMap_Entry = new GenMap_Entry$Type();

class Record$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.Record', [
      { no: 1, name: 'record_id', kind: 'message', T: () => Identifier },
      {
        no: 2,
        name: 'fields',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => RecordField,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.fields = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.Identifier record_id */ 1:
          message.recordId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.recordId);
          break;
        case /* repeated com.daml.ledger.api.v2.RecordField fields */ 2:
          message.fields.push(RecordField.internalBinaryRead(reader, reader.uint32(), options));
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
    /* com.daml.ledger.api.v2.Identifier record_id = 1; */
    if (message.recordId)
      Identifier.internalBinaryWrite(message.recordId, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    /* repeated com.daml.ledger.api.v2.RecordField fields = 2; */
    for (let i = 0; i < message.fields.length; i++)
      RecordField.internalBinaryWrite(
        message.fields[i],
        writer.tag(2, WireType.LengthDelimited).fork(),
        options
      ).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.Record
 */
const Record = new Record$Type();

class RecordField$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.RecordField', [
      {
        no: 1,
        name: 'label',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      { no: 2, name: 'value', kind: 'message', T: () => Value },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.label = '';
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string label */ 1:
          message.label = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Value value */ 2:
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
    /* string label = 1; */
    if (message.label !== '') writer.tag(1, WireType.LengthDelimited).string(message.label);
    /* com.daml.ledger.api.v2.Value value = 2; */
    if (message.value)
      Value.internalBinaryWrite(message.value, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.RecordField
 */
const RecordField = new RecordField$Type();

class Variant$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.Variant', [
      { no: 1, name: 'variant_id', kind: 'message', T: () => Identifier },
      {
        no: 2,
        name: 'constructor',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      { no: 3, name: 'value', kind: 'message', T: () => Value },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.constructor = '';
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.Identifier variant_id */ 1:
          message.variantId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.variantId);
          break;
        case /* string constructor */ 2:
          message.constructor = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Value value */ 3:
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
    /* com.daml.ledger.api.v2.Identifier variant_id = 1; */
    if (message.variantId)
      Identifier.internalBinaryWrite(message.variantId, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    /* string constructor = 2; */
    if (message.constructor !== '') writer.tag(2, WireType.LengthDelimited).string(message.constructor);
    /* com.daml.ledger.api.v2.Value value = 3; */
    if (message.value)
      Value.internalBinaryWrite(message.value, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.Variant
 */
const Variant = new Variant$Type();

class Enum$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.Enum', [
      { no: 1, name: 'enum_id', kind: 'message', T: () => Identifier },
      {
        no: 2,
        name: 'constructor',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.constructor = '';
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.Identifier enum_id */ 1:
          message.enumId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.enumId);
          break;
        case /* string constructor */ 2:
          message.constructor = reader.string();
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
    /* com.daml.ledger.api.v2.Identifier enum_id = 1; */
    if (message.enumId)
      Identifier.internalBinaryWrite(message.enumId, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    /* string constructor = 2; */
    if (message.constructor !== '') writer.tag(2, WireType.LengthDelimited).string(message.constructor);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.Enum
 */
const Enum = new Enum$Type();

module.exports = {
  Value,
  Optional,
  List,
  TextMap,
  TextMap_Entry,
  GenMap,
  GenMap_Entry,
  Record,
  RecordField,
  Variant,
  Enum,
};
