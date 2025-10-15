const {
  MessageType,
  UnknownFieldHandler,
  reflectionMergePartial,
  WireType,
  PbLong,
  typeofJsonValue,
} = require('@protobuf-ts/runtime');

class Timestamp$Type extends MessageType {
  constructor() {
    super('google.protobuf.Timestamp', [
      {
        no: 1,
        name: 'seconds',
        kind: 'scalar',
        T: 3 /*ScalarType.INT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
      { no: 2, name: 'nanos', kind: 'scalar', T: 5 /*ScalarType.INT32*/ },
    ]);
  }
  /**
   * Creates a new `Timestamp` for the current time.
   */
  now() {
    const msg = this.create();
    const ms = Date.now();
    msg.seconds = PbLong.from(Math.floor(ms / 1000)).toBigInt();
    msg.nanos = (ms % 1000) * 1000000;
    return msg;
  }
  /**
   * Converts a `Timestamp` to a JavaScript Date.
   */
  toDate(message) {
    return new Date(PbLong.from(message.seconds).toNumber() * 1000 + Math.ceil(message.nanos / 1000000));
  }
  /**
   * Converts a JavaScript Date to a `Timestamp`.
   */
  fromDate(date) {
    const msg = this.create();
    const ms = date.getTime();
    msg.seconds = PbLong.from(Math.floor(ms / 1000)).toBigInt();
    msg.nanos = ((ms % 1000) + (ms < 0 && ms % 1000 !== 0 ? 1000 : 0)) * 1000000;
    return msg;
  }
  /**
   * In JSON format, the `Timestamp` type is encoded as a string
   * in the RFC 3339 format.
   */
  internalJsonWrite(message, options) {
    const ms = PbLong.from(message.seconds).toNumber() * 1000;
    if (ms < Date.parse('0001-01-01T00:00:00Z') || ms > Date.parse('9999-12-31T23:59:59Z'))
      throw new Error(
        'Unable to encode Timestamp to JSON. Must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive.'
      );
    if (message.nanos < 0) throw new Error('Unable to encode invalid Timestamp to JSON. Nanos must not be negative.');
    let z = 'Z';
    if (message.nanos > 0) {
      const nanosStr = (message.nanos + 1000000000).toString().substring(1);
      if (nanosStr.substring(3) === '000000') z = '.' + nanosStr.substring(0, 3) + 'Z';
      else if (nanosStr.substring(6) === '000') z = '.' + nanosStr.substring(0, 6) + 'Z';
      else z = '.' + nanosStr + 'Z';
    }
    return new Date(ms).toISOString().replace('.000Z', z);
  }
  /**
   * In JSON format, the `Timestamp` type is encoded as a string
   * in the RFC 3339 format.
   */
  internalJsonRead(json, options, target) {
    if (typeof json !== 'string') throw new Error('Unable to parse Timestamp from JSON ' + typeofJsonValue(json) + '.');
    const matches = json.match(
      /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:Z|\.([0-9]{3,9})Z|([+-][0-9][0-9]:[0-9][0-9]))$/
    );
    if (!matches) throw new Error('Unable to parse Timestamp from JSON. Invalid format.');
    const ms = Date.parse(
      matches[1] +
        '-' +
        matches[2] +
        '-' +
        matches[3] +
        'T' +
        matches[4] +
        ':' +
        matches[5] +
        ':' +
        matches[6] +
        (matches[8] ? matches[8] : 'Z')
    );
    if (Number.isNaN(ms)) throw new Error('Unable to parse Timestamp from JSON. Invalid value.');
    if (ms < Date.parse('0001-01-01T00:00:00Z') || ms > Date.parse('9999-12-31T23:59:59Z'))
      throw new Error(
        'Unable to parse Timestamp from JSON. Must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive.'
      );
    if (!target) target = this.create();
    target.seconds = PbLong.from(ms / 1000).toBigInt();
    target.nanos = 0;
    if (matches[7]) target.nanos = parseInt('1' + matches[7] + '0'.repeat(9 - matches[7].length), 10) - 1000000000;
    return target;
  }
  create(value) {
    const message = Object.create(this.messagePrototype);
    message.seconds = 0n;
    message.nanos = 0;
    if (value !== undefined) reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    const message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* int64 seconds */ 1:
          message.seconds = reader.int64().toBigInt();
          break;
        case /* int32 nanos */ 2:
          message.nanos = reader.int32();
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
    /* int64 seconds = 1; */
    if (message.seconds !== 0n) writer.tag(1, WireType.Varint).int64(message.seconds);
    /* int32 nanos = 2; */
    if (message.nanos !== 0) writer.tag(2, WireType.Varint).int32(message.nanos);
    const u = options.writeUnknownFields;
    if (u !== false) (u === true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message google.protobuf.Timestamp
 */
module.exports.Timestamp = new Timestamp$Type();
