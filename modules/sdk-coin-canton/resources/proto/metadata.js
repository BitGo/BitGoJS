import { MessageType, UnknownFieldHandler, reflectionMergePartial, WireType } from '@protobuf-ts/runtime';
import { Metadata_GlobalKeyMappingEntry } from './metadata/metadataGlobalKeyMappingEntry.js';
import { Metadata_InputContract } from './metadata/metadataInputContract.js';
import { Metadata_SubmitterInfo } from './metadata/metadataSubmitterInfo.js';

class Metadata$Type extends MessageType {
  constructor() {
    super('com.daml.ledger.api.v2.interactive.Metadata', [
      {
        no: 2,
        name: 'submitter_info',
        kind: 'message',
        T: () => Metadata_SubmitterInfo,
      },
      {
        no: 3,
        name: 'synchronizer_id',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 4,
        name: 'mediator_group',
        kind: 'scalar',
        T: 13 /*ScalarType.UINT32*/,
      },
      {
        no: 5,
        name: 'transaction_uuid',
        kind: 'scalar',
        T: 9 /*ScalarType.STRING*/,
      },
      {
        no: 6,
        name: 'preparation_time',
        kind: 'scalar',
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
      {
        no: 7,
        name: 'input_contracts',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => Metadata_InputContract,
      },
      {
        no: 9,
        name: 'min_ledger_effective_time',
        kind: 'scalar',
        opt: true,
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
      {
        no: 10,
        name: 'max_ledger_effective_time',
        kind: 'scalar',
        opt: true,
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
      {
        no: 8,
        name: 'global_key_mapping',
        kind: 'message',
        repeat: 2 /*RepeatType.UNPACKED*/,
        T: () => Metadata_GlobalKeyMappingEntry,
      },
      {
        no: 11,
        name: 'max_record_time',
        kind: 'scalar',
        opt: true,
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
    ]);
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.synchronizerId = '';
    message.mediatorGroup = 0;
    message.transactionUuid = '';
    message.preparationTime = 0n;
    message.inputContracts = [];
    message.globalKeyMapping = [];
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* com.daml.ledger.api.v2.interactive.Metadata.SubmitterInfo submitter_info */ 2:
          message.submitterInfo = Metadata_SubmitterInfo.internalBinaryRead(
            reader,
            reader.uint32(),
            options,
            message.submitterInfo
          );
          break;
        case /* string synchronizer_id */ 3:
          message.synchronizerId = reader.string();
          break;
        case /* uint32 mediator_group */ 4:
          message.mediatorGroup = reader.uint32();
          break;
        case /* string transaction_uuid */ 5:
          message.transactionUuid = reader.string();
          break;
        case /* uint64 preparation_time */ 6:
          message.preparationTime = reader.uint64().toBigInt();
          break;
        case /* repeated com.daml.ledger.api.v2.interactive.Metadata.InputContract input_contracts */ 7:
          message.inputContracts.push(Metadata_InputContract.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* optional uint64 min_ledger_effective_time */ 9:
          message.minLedgerEffectiveTime = reader.uint64().toBigInt();
          break;
        case /* optional uint64 max_ledger_effective_time */ 10:
          message.maxLedgerEffectiveTime = reader.uint64().toBigInt();
          break;
        case /* repeated com.daml.ledger.api.v2.interactive.Metadata.GlobalKeyMappingEntry global_key_mapping */ 8:
          message.globalKeyMapping.push(
            Metadata_GlobalKeyMappingEntry.internalBinaryRead(reader, reader.uint32(), options)
          );
          break;
        case /* optional uint64 max_record_time */ 11:
          message.maxRecordTime = reader.uint64().toBigInt();
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
    /* com.daml.ledger.api.v2.interactive.Metadata.SubmitterInfo submitter_info = 2; */
    if (message.submitterInfo)
      Metadata_SubmitterInfo.internalBinaryWrite(
        message.submitterInfo,
        writer.tag(2, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* string synchronizer_id = 3; */
    if (message.synchronizerId !== '') writer.tag(3, WireType.LengthDelimited).string(message.synchronizerId);
    /* uint32 mediator_group = 4; */
    if (message.mediatorGroup !== 0) writer.tag(4, WireType.Varint).uint32(message.mediatorGroup);
    /* string transaction_uuid = 5; */
    if (message.transactionUuid !== '') writer.tag(5, WireType.LengthDelimited).string(message.transactionUuid);
    /* uint64 preparation_time = 6; */
    if (message.preparationTime !== 0n) writer.tag(6, WireType.Varint).uint64(message.preparationTime);
    /* repeated com.daml.ledger.api.v2.interactive.Metadata.InputContract input_contracts = 7; */
    for (let i = 0; i < message.inputContracts.length; i++)
      Metadata_InputContract.internalBinaryWrite(
        message.inputContracts[i],
        writer.tag(7, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* repeated com.daml.ledger.api.v2.interactive.Metadata.GlobalKeyMappingEntry global_key_mapping = 8; */
    for (let i = 0; i < message.globalKeyMapping.length; i++)
      Metadata_GlobalKeyMappingEntry.internalBinaryWrite(
        message.globalKeyMapping[i],
        writer.tag(8, WireType.LengthDelimited).fork(),
        options
      ).join();
    /* optional uint64 min_ledger_effective_time = 9; */
    if (message.minLedgerEffectiveTime !== undefined)
      writer.tag(9, WireType.Varint).uint64(message.minLedgerEffectiveTime);
    /* optional uint64 max_ledger_effective_time = 10; */
    if (message.maxLedgerEffectiveTime !== undefined)
      writer.tag(10, WireType.Varint).uint64(message.maxLedgerEffectiveTime);
    /* optional uint64 max_record_time = 11; */
    if (message.maxRecordTime !== undefined) writer.tag(11, WireType.Varint).uint64(message.maxRecordTime);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message com.daml.ledger.api.v2.interactive.Metadata
 */
export const Metadata = new Metadata$Type();
