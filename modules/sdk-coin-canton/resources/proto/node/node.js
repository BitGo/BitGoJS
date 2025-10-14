import { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } from '@protobuf-ts/runtime';
import { Value } from './value.js';
import { Identifier } from './identifier.js';

class Fetch$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.transaction.v1.Fetch', [
      {
        no: 1,
        name: 'lf_version',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 2,
        name: 'contract_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 3,
        name: 'package_name',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 4,
        name: 'template_id',
        kind: 'message',
        T: () => Identifier,
      },
      {
        no: 5,
        name: 'signatories',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 6,
        name: 'stakeholders',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 7,
        name: 'acting_parties',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 8,
        name: 'interface_id',
        kind: 'message',
        T: () => Identifier,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.lfVersion = '';
    message.contractId = '';
    message.packageName = '';
    message.signatories = [];
    message.stakeholders = [];
    message.actingParties = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string lf_version */ 1:
          message.lfVersion = reader.string();
          break;
        case /* string contract_id */ 2:
          message.contractId = reader.string();
          break;
        case /* string package_name */ 3:
          message.packageName = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Identifier template_id */ 4:
          message.templateId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.templateId);
          break;
        case /* repeated string signatories */ 5:
          message.signatories.push(reader.string());
          break;
        case /* repeated string stakeholders */ 6:
          message.stakeholders.push(reader.string());
          break;
        case /* repeated string acting_parties */ 7:
          message.actingParties.push(reader.string());
          break;
        case /* com.daml.ledger.api.v2.Identifier interface_id */ 8:
          message.interfaceId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.interfaceId);
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
    /* string lf_version = 1; */
    if (message.lfVersion !== '') writer.tag(1, WireType.LengthDelimited).string(message.lfVersion);
    /* string contract_id = 2; */
    if (message.contractId !== '') writer.tag(2, WireType.LengthDelimited).string(message.contractId);
    /* string package_name = 3; */
    if (message.packageName !== '') writer.tag(3, WireType.LengthDelimited).string(message.packageName);
    /* com.daml.ledger.api.v2.Identifier template_id = 4; */
    if (message.templateId)
      Identifier.internalBinaryWrite(
        message.templateId,
        writer.tag(4, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* repeated string signatories = 5; */
    for (let i = 0; i < message.signatories.length; i++)
      writer.tag(5, WireType.LengthDelimited).string(message.signatories[i]);
    /* repeated string stakeholders = 6; */
    for (let i = 0; i < message.stakeholders.length; i++)
      writer.tag(6, WireType.LengthDelimited).string(message.stakeholders[i]);
    /* repeated string acting_parties = 7; */
    for (let i = 0; i < message.actingParties.length; i++)
      writer.tag(7, WireType.LengthDelimited).string(message.actingParties[i]);
    /* com.daml.ledger.api.v2.Identifier interface_id = 8; */
    if (message.interfaceId)
      Identifier.internalBinaryWrite(
        message.interfaceId,
        writer.tag(8, WireType.LengthDelimited).fork(),
        options
      ).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.transaction.v1.Fetch
 */
export const Fetch = new Fetch$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Exercise$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.transaction.v1.Exercise', [
      {
        no: 1,
        name: 'lf_version',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 2,
        name: 'contract_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 3,
        name: 'package_name',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 4,
        name: 'template_id',
        kind: 'message',
        T: () => Identifier,
      },
      {
        no: 5,
        name: 'signatories',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 6,
        name: 'stakeholders',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 7,
        name: 'acting_parties',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 8,
        name: 'interface_id',
        kind: 'message',
        T: () => Identifier,
      },
      {
        no: 9,
        name: 'choice_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      { no: 10, name: 'chosen_value', kind: 'message', T: () => Value },
      {
        no: 11,
        name: 'consuming',
        kind: 'scalar',
        T: 8 /*ScalarType.BOOL*/,
      },
      {
        no: 12,
        name: 'children',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 13,
        name: 'exercise_result',
        kind: 'message',
        T: () => Value,
      },
      {
        no: 14,
        name: 'choice_observers',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.lfVersion = '';
    message.contractId = '';
    message.packageName = '';
    message.signatories = [];
    message.stakeholders = [];
    message.actingParties = [];
    message.choiceId = '';
    message.consuming = false;
    message.children = [];
    message.choiceObservers = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string lf_version */ 1:
          message.lfVersion = reader.string();
          break;
        case /* string contract_id */ 2:
          message.contractId = reader.string();
          break;
        case /* string package_name */ 3:
          message.packageName = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Identifier template_id */ 4:
          message.templateId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.templateId);
          break;
        case /* repeated string signatories */ 5:
          message.signatories.push(reader.string());
          break;
        case /* repeated string stakeholders */ 6:
          message.stakeholders.push(reader.string());
          break;
        case /* repeated string acting_parties */ 7:
          message.actingParties.push(reader.string());
          break;
        case /* com.daml.ledger.api.v2.Identifier interface_id */ 8:
          message.interfaceId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.interfaceId);
          break;
        case /* string choice_id */ 9:
          message.choiceId = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Value chosen_value */ 10:
          message.chosenValue = Value.internalBinaryRead(reader, reader.uint32(), options, message.chosenValue);
          break;
        case /* bool consuming */ 11:
          message.consuming = reader.bool();
          break;
        case /* repeated string children */ 12:
          message.children.push(reader.string());
          break;
        case /* com.daml.ledger.api.v2.Value exercise_result */ 13:
          message.exerciseResult = Value.internalBinaryRead(reader, reader.uint32(), options, message.exerciseResult);
          break;
        case /* repeated string choice_observers */ 14:
          message.choiceObservers.push(reader.string());
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
    /* string lf_version = 1; */
    if (message.lfVersion !== '') writer.tag(1, WireType.LengthDelimited).string(message.lfVersion);
    /* string contract_id = 2; */
    if (message.contractId !== '') writer.tag(2, WireType.LengthDelimited).string(message.contractId);
    /* string package_name = 3; */
    if (message.packageName !== '') writer.tag(3, WireType.LengthDelimited).string(message.packageName);
    /* com.daml.ledger.api.v2.Identifier template_id = 4; */
    if (message.templateId)
      Identifier.internalBinaryWrite(
        message.templateId,
        writer.tag(4, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* repeated string signatories = 5; */
    for (let i = 0; i < message.signatories.length; i++)
      writer.tag(5, WireType.LengthDelimited).string(message.signatories[i]);
    /* repeated string stakeholders = 6; */
    for (let i = 0; i < message.stakeholders.length; i++)
      writer.tag(6, WireType.LengthDelimited).string(message.stakeholders[i]);
    /* repeated string acting_parties = 7; */
    for (let i = 0; i < message.actingParties.length; i++)
      writer.tag(7, WireType.LengthDelimited).string(message.actingParties[i]);
    /* com.daml.ledger.api.v2.Identifier interface_id = 8; */
    if (message.interfaceId)
      Identifier.internalBinaryWrite(
        message.interfaceId,
        writer.tag(8, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* string choice_id = 9; */
    if (message.choiceId !== '') writer.tag(9, WireType.LengthDelimited).string(message.choiceId);
    /* com.daml.ledger.api.v2.Value chosen_value = 10; */
    if (message.chosenValue)
      Value.internalBinaryWrite(message.chosenValue, writer.tag(10, WireType.LengthDelimited).fork(), options).join();
    /* bool consuming = 11; */
    if (message.consuming !== false) writer.tag(11, WireType.Varint).bool(message.consuming);
    /* repeated string children = 12; */
    for (let i = 0; i < message.children.length; i++)
      writer.tag(12, WireType.LengthDelimited).string(message.children[i]);
    /* com.daml.ledger.api.v2.Value exercise_result = 13; */
    if (message.exerciseResult)
      Value.internalBinaryWrite(
        message.exerciseResult,
        writer.tag(13, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* repeated string choice_observers = 14; */
    for (let i = 0; i < message.choiceObservers.length; i++)
      writer.tag(14, WireType.LengthDelimited).string(message.choiceObservers[i]);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.transaction.v1.Exercise
 */
export const Exercise = new Exercise$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Create$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.transaction.v1.Create', [
      {
        no: 1,
        name: 'lf_version',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 2,
        name: 'contract_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 3,
        name: 'package_name',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 4,
        name: 'template_id',
        kind: 'message',
        T: () => Identifier,
      },
      { no: 5, name: 'argument', kind: 'message', T: () => Value },
      {
        no: 6,
        name: 'signatories',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 7,
        name: 'stakeholders',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.lfVersion = '';
    message.contractId = '';
    message.packageName = '';
    message.signatories = [];
    message.stakeholders = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string lf_version */ 1:
          message.lfVersion = reader.string();
          break;
        case /* string contract_id */ 2:
          message.contractId = reader.string();
          break;
        case /* string package_name */ 3:
          message.packageName = reader.string();
          break;
        case /* com.daml.ledger.api.v2.Identifier template_id */ 4:
          message.templateId = Identifier.internalBinaryRead(reader, reader.uint32(), options, message.templateId);
          break;
        case /* com.daml.ledger.api.v2.Value argument */ 5:
          message.argument = Value.internalBinaryRead(reader, reader.uint32(), options, message.argument);
          break;
        case /* repeated string signatories */ 6:
          message.signatories.push(reader.string());
          break;
        case /* repeated string stakeholders */ 7:
          message.stakeholders.push(reader.string());
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
    /* string lf_version = 1; */
    if (message.lfVersion !== '') writer.tag(1, WireType.LengthDelimited).string(message.lfVersion);
    /* string contract_id = 2; */
    if (message.contractId !== '') writer.tag(2, WireType.LengthDelimited).string(message.contractId);
    /* string package_name = 3; */
    if (message.packageName !== '') writer.tag(3, WireType.LengthDelimited).string(message.packageName);
    /* com.daml.ledger.api.v2.Identifier template_id = 4; */
    if (message.templateId)
      Identifier.internalBinaryWrite(
        message.templateId,
        writer.tag(4, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* com.daml.ledger.api.v2.Value argument = 5; */
    if (message.argument)
      Value.internalBinaryWrite(message.argument, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
    /* repeated string signatories = 6; */
    for (let i = 0; i < message.signatories.length; i++)
      writer.tag(6, WireType.LengthDelimited).string(message.signatories[i]);
    /* repeated string stakeholders = 7; */
    for (let i = 0; i < message.stakeholders.length; i++)
      writer.tag(7, WireType.LengthDelimited).string(message.stakeholders[i]);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.transaction.v1.Create
 */
export const Create = new Create$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Rollback$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.transaction.v1.Rollback', [
      {
        no: 1,
        name: 'children',
        kind: 'scalar',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: 9 /*ScalarType.STRING*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.children = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated string children */ 1:
          message.children.push(reader.string());
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
    /* repeated string children = 1; */
    for (let i = 0; i < message.children.length; i++)
      writer.tag(1, WireType.LengthDelimited).string(message.children[i]);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.transaction.v1.Rollback
 */
export const Rollback = new Rollback$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Node$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.transaction.v1.Node', [
      {
        no: 1,
        name: 'create',
        kind: 'message',
        oneof: 'nodeType',
        T: () => Create,
      },
      {
        no: 2,
        name: 'fetch',
        kind: 'message',
        oneof: 'nodeType',
        T: () => Fetch,
      },
      {
        no: 3,
        name: 'exercise',
        kind: 'message',
        oneof: 'nodeType',
        T: () => Exercise,
      },
      {
        no: 4,
        name: 'rollback',
        kind: 'message',
        oneof: 'nodeType',
        T: () => Rollback,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.nodeType = { oneofKind: undefined };
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.interactive.transaction.v1.Create create */ 1:
          message.nodeType = {
            oneofKind: 'create',
            create: Create.internalBinaryRead(reader, reader.uint32(), options, message.nodeType.create),
          };
          break;
        case /* com.daml.ledger.api.v2.interactive.transaction.v1.Fetch fetch */ 2:
          message.nodeType = {
            oneofKind: 'fetch',
            fetch: Fetch.internalBinaryRead(reader, reader.uint32(), options, message.nodeType.fetch),
          };
          break;
        case /* com.daml.ledger.api.v2.interactive.transaction.v1.Exercise exercise */ 3:
          message.nodeType = {
            oneofKind: 'exercise',
            exercise: Exercise.internalBinaryRead(reader, reader.uint32(), options, message.nodeType.exercise),
          };
          break;
        case /* com.daml.ledger.api.v2.interactive.transaction.v1.Rollback rollback */ 4:
          message.nodeType = {
            oneofKind: 'rollback',
            rollback: Rollback.internalBinaryRead(reader, reader.uint32(), options, message.nodeType.rollback),
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
    /* com.daml.ledger.api.v2.interactive.transaction.v1.Create create = 1; */
    if (message.nodeType.oneofKind === 'create')
      Create.internalBinaryWrite(
        message.nodeType.create,
        writer.tag(1, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* com.daml.ledger.api.v2.interactive.transaction.v1.Fetch fetch = 2; */
    if (message.nodeType.oneofKind === 'fetch')
      Fetch.internalBinaryWrite(message.nodeType.fetch, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    /* com.daml.ledger.api.v2.interactive.transaction.v1.Exercise exercise = 3; */
    if (message.nodeType.oneofKind === 'exercise')
      Exercise.internalBinaryWrite(
        message.nodeType.exercise,
        writer.tag(3, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* com.daml.ledger.api.v2.interactive.transaction.v1.Rollback rollback = 4; */
    if (message.nodeType.oneofKind === 'rollback')
      Rollback.internalBinaryWrite(
        message.nodeType.rollback,
        writer.tag(4, WireType.LengthDelimited).fork(),
        options
      ).join();
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.transaction.v1.Node
 */
export const Node = new Node$Type();
