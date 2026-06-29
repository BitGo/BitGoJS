/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
'use strict';

var $protobuf = require('protobufjs/minimal');

// Common aliases
var $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {});

$root.Memo = (function () {
  /**
   * Properties of a Memo.
   * @exports IMemo
   * @interface IMemo
   * @property {number|Long|null} [memo] Memo memo
   */

  /**
   * Constructs a new Memo.
   * @exports Memo
   * @classdesc Represents a Memo.
   * @implements IMemo
   * @constructor
   * @param {IMemo=} [properties] Properties to set
   */
  function Memo(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * Memo memo.
   * @member {number|Long} memo
   * @memberof Memo
   * @instance
   */
  Memo.prototype.memo = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

  /**
   * Creates a new Memo instance using the specified properties.
   * @function create
   * @memberof Memo
   * @static
   * @param {IMemo=} [properties] Properties to set
   * @returns {Memo} Memo instance
   */
  Memo.create = function create(properties) {
    return new Memo(properties);
  };

  /**
   * Encodes the specified Memo message. Does not implicitly {@link Memo.verify|verify} messages.
   * @function encode
   * @memberof Memo
   * @static
   * @param {IMemo} message Memo message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Memo.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.memo != null && Object.hasOwnProperty.call(message, 'memo'))
      writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.memo);
    return writer;
  };

  /**
   * Encodes the specified Memo message, length delimited. Does not implicitly {@link Memo.verify|verify} messages.
   * @function encodeDelimited
   * @memberof Memo
   * @static
   * @param {IMemo} message Memo message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Memo.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a Memo message from the specified reader or buffer.
   * @function decode
   * @memberof Memo
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {Memo} Memo
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Memo.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.Memo();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.memo = reader.uint64();
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a Memo message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof Memo
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {Memo} Memo
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Memo.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a Memo message.
   * @function verify
   * @memberof Memo
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  Memo.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.memo != null && message.hasOwnProperty('memo'))
      if (
        !$util.isInteger(message.memo) &&
        !(message.memo && $util.isInteger(message.memo.low) && $util.isInteger(message.memo.high))
      )
        return 'memo: integer|Long expected';
    return null;
  };

  /**
   * Creates a Memo message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof Memo
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {Memo} Memo
   */
  Memo.fromObject = function fromObject(object) {
    if (object instanceof $root.Memo) return object;
    var message = new $root.Memo();
    if (object.memo != null)
      if ($util.Long) (message.memo = $util.Long.fromValue(object.memo)).unsigned = true;
      else if (typeof object.memo === 'string') message.memo = parseInt(object.memo, 10);
      else if (typeof object.memo === 'number') message.memo = object.memo;
      else if (typeof object.memo === 'object')
        message.memo = new $util.LongBits(object.memo.low >>> 0, object.memo.high >>> 0).toNumber(true);
    return message;
  };

  /**
   * Creates a plain object from a Memo message. Also converts values to other types if specified.
   * @function toObject
   * @memberof Memo
   * @static
   * @param {Memo} message Memo
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  Memo.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults)
      if ($util.Long) {
        var long = new $util.Long(0, 0, true);
        object.memo = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
      } else object.memo = options.longs === String ? '0' : 0;
    if (message.memo != null && message.hasOwnProperty('memo'))
      if (typeof message.memo === 'number')
        object.memo = options.longs === String ? String(message.memo) : message.memo;
      else
        object.memo =
          options.longs === String
            ? $util.Long.prototype.toString.call(message.memo)
            : options.longs === Number
            ? new $util.LongBits(message.memo.low >>> 0, message.memo.high >>> 0).toNumber(true)
            : message.memo;
    return object;
  };

  /**
   * Converts this Memo to JSON.
   * @function toJSON
   * @memberof Memo
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  Memo.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for Memo
   * @function getTypeUrl
   * @memberof Memo
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  Memo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/Memo';
  };

  return Memo;
})();

$root.Tokens = (function () {
  /**
   * Properties of a Tokens.
   * @exports ITokens
   * @interface ITokens
   * @property {number|Long|null} [e8s] Tokens e8s
   */

  /**
   * Constructs a new Tokens.
   * @exports Tokens
   * @classdesc Represents a Tokens.
   * @implements ITokens
   * @constructor
   * @param {ITokens=} [properties] Properties to set
   */
  function Tokens(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * Tokens e8s.
   * @member {number|Long} e8s
   * @memberof Tokens
   * @instance
   */
  Tokens.prototype.e8s = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

  /**
   * Creates a new Tokens instance using the specified properties.
   * @function create
   * @memberof Tokens
   * @static
   * @param {ITokens=} [properties] Properties to set
   * @returns {Tokens} Tokens instance
   */
  Tokens.create = function create(properties) {
    return new Tokens(properties);
  };

  /**
   * Encodes the specified Tokens message. Does not implicitly {@link Tokens.verify|verify} messages.
   * @function encode
   * @memberof Tokens
   * @static
   * @param {ITokens} message Tokens message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Tokens.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.e8s != null && Object.hasOwnProperty.call(message, 'e8s'))
      writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.e8s);
    return writer;
  };

  /**
   * Encodes the specified Tokens message, length delimited. Does not implicitly {@link Tokens.verify|verify} messages.
   * @function encodeDelimited
   * @memberof Tokens
   * @static
   * @param {ITokens} message Tokens message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Tokens.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a Tokens message from the specified reader or buffer.
   * @function decode
   * @memberof Tokens
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {Tokens} Tokens
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Tokens.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.Tokens();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.e8s = reader.uint64();
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a Tokens message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof Tokens
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {Tokens} Tokens
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Tokens.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a Tokens message.
   * @function verify
   * @memberof Tokens
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  Tokens.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.e8s != null && message.hasOwnProperty('e8s'))
      if (
        !$util.isInteger(message.e8s) &&
        !(message.e8s && $util.isInteger(message.e8s.low) && $util.isInteger(message.e8s.high))
      )
        return 'e8s: integer|Long expected';
    return null;
  };

  /**
   * Creates a Tokens message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof Tokens
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {Tokens} Tokens
   */
  Tokens.fromObject = function fromObject(object) {
    if (object instanceof $root.Tokens) return object;
    var message = new $root.Tokens();
    if (object.e8s != null)
      if ($util.Long) (message.e8s = $util.Long.fromValue(object.e8s)).unsigned = true;
      else if (typeof object.e8s === 'string') message.e8s = parseInt(object.e8s, 10);
      else if (typeof object.e8s === 'number') message.e8s = object.e8s;
      else if (typeof object.e8s === 'object')
        message.e8s = new $util.LongBits(object.e8s.low >>> 0, object.e8s.high >>> 0).toNumber(true);
    return message;
  };

  /**
   * Creates a plain object from a Tokens message. Also converts values to other types if specified.
   * @function toObject
   * @memberof Tokens
   * @static
   * @param {Tokens} message Tokens
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  Tokens.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults)
      if ($util.Long) {
        var long = new $util.Long(0, 0, true);
        object.e8s = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
      } else object.e8s = options.longs === String ? '0' : 0;
    if (message.e8s != null && message.hasOwnProperty('e8s'))
      if (typeof message.e8s === 'number') object.e8s = options.longs === String ? String(message.e8s) : message.e8s;
      else
        object.e8s =
          options.longs === String
            ? $util.Long.prototype.toString.call(message.e8s)
            : options.longs === Number
            ? new $util.LongBits(message.e8s.low >>> 0, message.e8s.high >>> 0).toNumber(true)
            : message.e8s;
    return object;
  };

  /**
   * Converts this Tokens to JSON.
   * @function toJSON
   * @memberof Tokens
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  Tokens.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for Tokens
   * @function getTypeUrl
   * @memberof Tokens
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  Tokens.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/Tokens';
  };

  return Tokens;
})();

$root.Payment = (function () {
  /**
   * Properties of a Payment.
   * @exports IPayment
   * @interface IPayment
   * @property {ITokens|null} [receiverGets] Payment receiverGets
   */

  /**
   * Constructs a new Payment.
   * @exports Payment
   * @classdesc Represents a Payment.
   * @implements IPayment
   * @constructor
   * @param {IPayment=} [properties] Properties to set
   */
  function Payment(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * Payment receiverGets.
   * @member {ITokens|null|undefined} receiverGets
   * @memberof Payment
   * @instance
   */
  Payment.prototype.receiverGets = null;

  /**
   * Creates a new Payment instance using the specified properties.
   * @function create
   * @memberof Payment
   * @static
   * @param {IPayment=} [properties] Properties to set
   * @returns {Payment} Payment instance
   */
  Payment.create = function create(properties) {
    return new Payment(properties);
  };

  /**
   * Encodes the specified Payment message. Does not implicitly {@link Payment.verify|verify} messages.
   * @function encode
   * @memberof Payment
   * @static
   * @param {IPayment} message Payment message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Payment.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.receiverGets != null && Object.hasOwnProperty.call(message, 'receiverGets'))
      $root.Tokens.encode(message.receiverGets, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
    return writer;
  };

  /**
   * Encodes the specified Payment message, length delimited. Does not implicitly {@link Payment.verify|verify} messages.
   * @function encodeDelimited
   * @memberof Payment
   * @static
   * @param {IPayment} message Payment message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Payment.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a Payment message from the specified reader or buffer.
   * @function decode
   * @memberof Payment
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {Payment} Payment
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Payment.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.Payment();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.receiverGets = $root.Tokens.decode(reader, reader.uint32());
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a Payment message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof Payment
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {Payment} Payment
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Payment.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a Payment message.
   * @function verify
   * @memberof Payment
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  Payment.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.receiverGets != null && message.hasOwnProperty('receiverGets')) {
      var error = $root.Tokens.verify(message.receiverGets);
      if (error) return 'receiverGets.' + error;
    }
    return null;
  };

  /**
   * Creates a Payment message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof Payment
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {Payment} Payment
   */
  Payment.fromObject = function fromObject(object) {
    if (object instanceof $root.Payment) return object;
    var message = new $root.Payment();
    if (object.receiverGets != null) {
      if (typeof object.receiverGets !== 'object') throw TypeError('.Payment.receiverGets: object expected');
      message.receiverGets = $root.Tokens.fromObject(object.receiverGets);
    }
    return message;
  };

  /**
   * Creates a plain object from a Payment message. Also converts values to other types if specified.
   * @function toObject
   * @memberof Payment
   * @static
   * @param {Payment} message Payment
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  Payment.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults) object.receiverGets = null;
    if (message.receiverGets != null && message.hasOwnProperty('receiverGets'))
      object.receiverGets = $root.Tokens.toObject(message.receiverGets, options);
    return object;
  };

  /**
   * Converts this Payment to JSON.
   * @function toJSON
   * @memberof Payment
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  Payment.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for Payment
   * @function getTypeUrl
   * @memberof Payment
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  Payment.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/Payment';
  };

  return Payment;
})();

$root.Subaccount = (function () {
  /**
   * Properties of a Subaccount.
   * @exports ISubaccount
   * @interface ISubaccount
   * @property {Uint8Array|null} [subAccount] Subaccount subAccount
   */

  /**
   * Constructs a new Subaccount.
   * @exports Subaccount
   * @classdesc Represents a Subaccount.
   * @implements ISubaccount
   * @constructor
   * @param {ISubaccount=} [properties] Properties to set
   */
  function Subaccount(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * Subaccount subAccount.
   * @member {Uint8Array} subAccount
   * @memberof Subaccount
   * @instance
   */
  Subaccount.prototype.subAccount = $util.newBuffer([]);

  /**
   * Creates a new Subaccount instance using the specified properties.
   * @function create
   * @memberof Subaccount
   * @static
   * @param {ISubaccount=} [properties] Properties to set
   * @returns {Subaccount} Subaccount instance
   */
  Subaccount.create = function create(properties) {
    return new Subaccount(properties);
  };

  /**
   * Encodes the specified Subaccount message. Does not implicitly {@link Subaccount.verify|verify} messages.
   * @function encode
   * @memberof Subaccount
   * @static
   * @param {ISubaccount} message Subaccount message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Subaccount.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.subAccount != null && Object.hasOwnProperty.call(message, 'subAccount'))
      writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.subAccount);
    return writer;
  };

  /**
   * Encodes the specified Subaccount message, length delimited. Does not implicitly {@link Subaccount.verify|verify} messages.
   * @function encodeDelimited
   * @memberof Subaccount
   * @static
   * @param {ISubaccount} message Subaccount message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  Subaccount.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a Subaccount message from the specified reader or buffer.
   * @function decode
   * @memberof Subaccount
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {Subaccount} Subaccount
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Subaccount.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.Subaccount();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.subAccount = reader.bytes();
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a Subaccount message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof Subaccount
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {Subaccount} Subaccount
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  Subaccount.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a Subaccount message.
   * @function verify
   * @memberof Subaccount
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  Subaccount.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.subAccount != null && message.hasOwnProperty('subAccount'))
      if (
        !((message.subAccount && typeof message.subAccount.length === 'number') || $util.isString(message.subAccount))
      )
        return 'subAccount: buffer expected';
    return null;
  };

  /**
   * Creates a Subaccount message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof Subaccount
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {Subaccount} Subaccount
   */
  Subaccount.fromObject = function fromObject(object) {
    if (object instanceof $root.Subaccount) return object;
    var message = new $root.Subaccount();
    if (object.subAccount != null)
      if (typeof object.subAccount === 'string')
        $util.base64.decode(
          object.subAccount,
          (message.subAccount = $util.newBuffer($util.base64.length(object.subAccount))),
          0
        );
      else if (object.subAccount.length >= 0) message.subAccount = object.subAccount;
    return message;
  };

  /**
   * Creates a plain object from a Subaccount message. Also converts values to other types if specified.
   * @function toObject
   * @memberof Subaccount
   * @static
   * @param {Subaccount} message Subaccount
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  Subaccount.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults)
      if (options.bytes === String) object.subAccount = '';
      else {
        object.subAccount = [];
        if (options.bytes !== Array) object.subAccount = $util.newBuffer(object.subAccount);
      }
    if (message.subAccount != null && message.hasOwnProperty('subAccount'))
      object.subAccount =
        options.bytes === String
          ? $util.base64.encode(message.subAccount, 0, message.subAccount.length)
          : options.bytes === Array
          ? Array.prototype.slice.call(message.subAccount)
          : message.subAccount;
    return object;
  };

  /**
   * Converts this Subaccount to JSON.
   * @function toJSON
   * @memberof Subaccount
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  Subaccount.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for Subaccount
   * @function getTypeUrl
   * @memberof Subaccount
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  Subaccount.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/Subaccount';
  };

  return Subaccount;
})();

$root.AccountIdentifier = (function () {
  /**
   * Properties of an AccountIdentifier.
   * @exports IAccountIdentifier
   * @interface IAccountIdentifier
   * @property {Uint8Array|null} [hash] AccountIdentifier hash
   */

  /**
   * Constructs a new AccountIdentifier.
   * @exports AccountIdentifier
   * @classdesc Represents an AccountIdentifier.
   * @implements IAccountIdentifier
   * @constructor
   * @param {IAccountIdentifier=} [properties] Properties to set
   */
  function AccountIdentifier(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * AccountIdentifier hash.
   * @member {Uint8Array} hash
   * @memberof AccountIdentifier
   * @instance
   */
  AccountIdentifier.prototype.hash = $util.newBuffer([]);

  /**
   * Creates a new AccountIdentifier instance using the specified properties.
   * @function create
   * @memberof AccountIdentifier
   * @static
   * @param {IAccountIdentifier=} [properties] Properties to set
   * @returns {AccountIdentifier} AccountIdentifier instance
   */
  AccountIdentifier.create = function create(properties) {
    return new AccountIdentifier(properties);
  };

  /**
   * Encodes the specified AccountIdentifier message. Does not implicitly {@link AccountIdentifier.verify|verify} messages.
   * @function encode
   * @memberof AccountIdentifier
   * @static
   * @param {IAccountIdentifier} message AccountIdentifier message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  AccountIdentifier.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.hash != null && Object.hasOwnProperty.call(message, 'hash'))
      writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.hash);
    return writer;
  };

  /**
   * Encodes the specified AccountIdentifier message, length delimited. Does not implicitly {@link AccountIdentifier.verify|verify} messages.
   * @function encodeDelimited
   * @memberof AccountIdentifier
   * @static
   * @param {IAccountIdentifier} message AccountIdentifier message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  AccountIdentifier.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes an AccountIdentifier message from the specified reader or buffer.
   * @function decode
   * @memberof AccountIdentifier
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {AccountIdentifier} AccountIdentifier
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  AccountIdentifier.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.AccountIdentifier();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.hash = reader.bytes();
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes an AccountIdentifier message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof AccountIdentifier
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {AccountIdentifier} AccountIdentifier
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  AccountIdentifier.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies an AccountIdentifier message.
   * @function verify
   * @memberof AccountIdentifier
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  AccountIdentifier.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.hash != null && message.hasOwnProperty('hash'))
      if (!((message.hash && typeof message.hash.length === 'number') || $util.isString(message.hash)))
        return 'hash: buffer expected';
    return null;
  };

  /**
   * Creates an AccountIdentifier message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof AccountIdentifier
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {AccountIdentifier} AccountIdentifier
   */
  AccountIdentifier.fromObject = function fromObject(object) {
    if (object instanceof $root.AccountIdentifier) return object;
    var message = new $root.AccountIdentifier();
    if (object.hash != null)
      if (typeof object.hash === 'string')
        $util.base64.decode(object.hash, (message.hash = $util.newBuffer($util.base64.length(object.hash))), 0);
      else if (object.hash.length >= 0) message.hash = object.hash;
    return message;
  };

  /**
   * Creates a plain object from an AccountIdentifier message. Also converts values to other types if specified.
   * @function toObject
   * @memberof AccountIdentifier
   * @static
   * @param {AccountIdentifier} message AccountIdentifier
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  AccountIdentifier.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults)
      if (options.bytes === String) object.hash = '';
      else {
        object.hash = [];
        if (options.bytes !== Array) object.hash = $util.newBuffer(object.hash);
      }
    if (message.hash != null && message.hasOwnProperty('hash'))
      object.hash =
        options.bytes === String
          ? $util.base64.encode(message.hash, 0, message.hash.length)
          : options.bytes === Array
          ? Array.prototype.slice.call(message.hash)
          : message.hash;
    return object;
  };

  /**
   * Converts this AccountIdentifier to JSON.
   * @function toJSON
   * @memberof AccountIdentifier
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  AccountIdentifier.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for AccountIdentifier
   * @function getTypeUrl
   * @memberof AccountIdentifier
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  AccountIdentifier.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/AccountIdentifier';
  };

  return AccountIdentifier;
})();

$root.BlockIndex = (function () {
  /**
   * Properties of a BlockIndex.
   * @exports IBlockIndex
   * @interface IBlockIndex
   * @property {number|Long|null} [height] BlockIndex height
   */

  /**
   * Constructs a new BlockIndex.
   * @exports BlockIndex
   * @classdesc Represents a BlockIndex.
   * @implements IBlockIndex
   * @constructor
   * @param {IBlockIndex=} [properties] Properties to set
   */
  function BlockIndex(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * BlockIndex height.
   * @member {number|Long} height
   * @memberof BlockIndex
   * @instance
   */
  BlockIndex.prototype.height = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

  /**
   * Creates a new BlockIndex instance using the specified properties.
   * @function create
   * @memberof BlockIndex
   * @static
   * @param {IBlockIndex=} [properties] Properties to set
   * @returns {BlockIndex} BlockIndex instance
   */
  BlockIndex.create = function create(properties) {
    return new BlockIndex(properties);
  };

  /**
   * Encodes the specified BlockIndex message. Does not implicitly {@link BlockIndex.verify|verify} messages.
   * @function encode
   * @memberof BlockIndex
   * @static
   * @param {IBlockIndex} message BlockIndex message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  BlockIndex.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.height != null && Object.hasOwnProperty.call(message, 'height'))
      writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.height);
    return writer;
  };

  /**
   * Encodes the specified BlockIndex message, length delimited. Does not implicitly {@link BlockIndex.verify|verify} messages.
   * @function encodeDelimited
   * @memberof BlockIndex
   * @static
   * @param {IBlockIndex} message BlockIndex message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  BlockIndex.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a BlockIndex message from the specified reader or buffer.
   * @function decode
   * @memberof BlockIndex
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {BlockIndex} BlockIndex
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  BlockIndex.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.BlockIndex();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.height = reader.uint64();
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a BlockIndex message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof BlockIndex
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {BlockIndex} BlockIndex
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  BlockIndex.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a BlockIndex message.
   * @function verify
   * @memberof BlockIndex
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  BlockIndex.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.height != null && message.hasOwnProperty('height'))
      if (
        !$util.isInteger(message.height) &&
        !(message.height && $util.isInteger(message.height.low) && $util.isInteger(message.height.high))
      )
        return 'height: integer|Long expected';
    return null;
  };

  /**
   * Creates a BlockIndex message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof BlockIndex
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {BlockIndex} BlockIndex
   */
  BlockIndex.fromObject = function fromObject(object) {
    if (object instanceof $root.BlockIndex) return object;
    var message = new $root.BlockIndex();
    if (object.height != null)
      if ($util.Long) (message.height = $util.Long.fromValue(object.height)).unsigned = true;
      else if (typeof object.height === 'string') message.height = parseInt(object.height, 10);
      else if (typeof object.height === 'number') message.height = object.height;
      else if (typeof object.height === 'object')
        message.height = new $util.LongBits(object.height.low >>> 0, object.height.high >>> 0).toNumber(true);
    return message;
  };

  /**
   * Creates a plain object from a BlockIndex message. Also converts values to other types if specified.
   * @function toObject
   * @memberof BlockIndex
   * @static
   * @param {BlockIndex} message BlockIndex
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  BlockIndex.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults)
      if ($util.Long) {
        var long = new $util.Long(0, 0, true);
        object.height = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
      } else object.height = options.longs === String ? '0' : 0;
    if (message.height != null && message.hasOwnProperty('height'))
      if (typeof message.height === 'number')
        object.height = options.longs === String ? String(message.height) : message.height;
      else
        object.height =
          options.longs === String
            ? $util.Long.prototype.toString.call(message.height)
            : options.longs === Number
            ? new $util.LongBits(message.height.low >>> 0, message.height.high >>> 0).toNumber(true)
            : message.height;
    return object;
  };

  /**
   * Converts this BlockIndex to JSON.
   * @function toJSON
   * @memberof BlockIndex
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  BlockIndex.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for BlockIndex
   * @function getTypeUrl
   * @memberof BlockIndex
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  BlockIndex.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/BlockIndex';
  };

  return BlockIndex;
})();

$root.TimeStamp = (function () {
  /**
   * Properties of a TimeStamp.
   * @exports ITimeStamp
   * @interface ITimeStamp
   * @property {number|Long|null} [timestampNanos] TimeStamp timestampNanos
   */

  /**
   * Constructs a new TimeStamp.
   * @exports TimeStamp
   * @classdesc Represents a TimeStamp.
   * @implements ITimeStamp
   * @constructor
   * @param {ITimeStamp=} [properties] Properties to set
   */
  function TimeStamp(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * TimeStamp timestampNanos.
   * @member {number|Long} timestampNanos
   * @memberof TimeStamp
   * @instance
   */
  TimeStamp.prototype.timestampNanos = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

  /**
   * Creates a new TimeStamp instance using the specified properties.
   * @function create
   * @memberof TimeStamp
   * @static
   * @param {ITimeStamp=} [properties] Properties to set
   * @returns {TimeStamp} TimeStamp instance
   */
  TimeStamp.create = function create(properties) {
    return new TimeStamp(properties);
  };

  /**
   * Encodes the specified TimeStamp message. Does not implicitly {@link TimeStamp.verify|verify} messages.
   * @function encode
   * @memberof TimeStamp
   * @static
   * @param {ITimeStamp} message TimeStamp message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  TimeStamp.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.timestampNanos != null && Object.hasOwnProperty.call(message, 'timestampNanos'))
      writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.timestampNanos);
    return writer;
  };

  /**
   * Encodes the specified TimeStamp message, length delimited. Does not implicitly {@link TimeStamp.verify|verify} messages.
   * @function encodeDelimited
   * @memberof TimeStamp
   * @static
   * @param {ITimeStamp} message TimeStamp message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  TimeStamp.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a TimeStamp message from the specified reader or buffer.
   * @function decode
   * @memberof TimeStamp
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {TimeStamp} TimeStamp
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  TimeStamp.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.TimeStamp();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.timestampNanos = reader.uint64();
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a TimeStamp message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof TimeStamp
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {TimeStamp} TimeStamp
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  TimeStamp.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a TimeStamp message.
   * @function verify
   * @memberof TimeStamp
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  TimeStamp.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.timestampNanos != null && message.hasOwnProperty('timestampNanos'))
      if (
        !$util.isInteger(message.timestampNanos) &&
        !(
          message.timestampNanos &&
          $util.isInteger(message.timestampNanos.low) &&
          $util.isInteger(message.timestampNanos.high)
        )
      )
        return 'timestampNanos: integer|Long expected';
    return null;
  };

  /**
   * Creates a TimeStamp message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof TimeStamp
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {TimeStamp} TimeStamp
   */
  TimeStamp.fromObject = function fromObject(object) {
    if (object instanceof $root.TimeStamp) return object;
    var message = new $root.TimeStamp();
    if (object.timestampNanos != null)
      if ($util.Long) (message.timestampNanos = $util.Long.fromValue(object.timestampNanos)).unsigned = true;
      else if (typeof object.timestampNanos === 'string') message.timestampNanos = parseInt(object.timestampNanos, 10);
      else if (typeof object.timestampNanos === 'number') message.timestampNanos = object.timestampNanos;
      else if (typeof object.timestampNanos === 'object')
        message.timestampNanos = new $util.LongBits(
          object.timestampNanos.low >>> 0,
          object.timestampNanos.high >>> 0
        ).toNumber(true);
    return message;
  };

  /**
   * Creates a plain object from a TimeStamp message. Also converts values to other types if specified.
   * @function toObject
   * @memberof TimeStamp
   * @static
   * @param {TimeStamp} message TimeStamp
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  TimeStamp.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults)
      if ($util.Long) {
        var long = new $util.Long(0, 0, true);
        object.timestampNanos =
          options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
      } else object.timestampNanos = options.longs === String ? '0' : 0;
    if (message.timestampNanos != null && message.hasOwnProperty('timestampNanos'))
      if (typeof message.timestampNanos === 'number')
        object.timestampNanos = options.longs === String ? String(message.timestampNanos) : message.timestampNanos;
      else
        object.timestampNanos =
          options.longs === String
            ? $util.Long.prototype.toString.call(message.timestampNanos)
            : options.longs === Number
            ? new $util.LongBits(message.timestampNanos.low >>> 0, message.timestampNanos.high >>> 0).toNumber(true)
            : message.timestampNanos;
    return object;
  };

  /**
   * Converts this TimeStamp to JSON.
   * @function toJSON
   * @memberof TimeStamp
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  TimeStamp.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for TimeStamp
   * @function getTypeUrl
   * @memberof TimeStamp
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  TimeStamp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/TimeStamp';
  };

  return TimeStamp;
})();

$root.SendRequest = (function () {
  /**
   * Properties of a SendRequest.
   * @exports ISendRequest
   * @interface ISendRequest
   * @property {IMemo|null} [memo] SendRequest memo
   * @property {IPayment|null} [payment] SendRequest payment
   * @property {ITokens|null} [maxFee] SendRequest maxFee
   * @property {ISubaccount|null} [fromSubaccount] SendRequest fromSubaccount
   * @property {IAccountIdentifier|null} [to] SendRequest to
   * @property {IBlockIndex|null} [createdAt] SendRequest createdAt
   * @property {ITimeStamp|null} [createdAtTime] SendRequest createdAtTime
   */

  /**
   * Constructs a new SendRequest.
   * @exports SendRequest
   * @classdesc Represents a SendRequest.
   * @implements ISendRequest
   * @constructor
   * @param {ISendRequest=} [properties] Properties to set
   */
  function SendRequest(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
  }

  /**
   * SendRequest memo.
   * @member {IMemo|null|undefined} memo
   * @memberof SendRequest
   * @instance
   */
  SendRequest.prototype.memo = null;

  /**
   * SendRequest payment.
   * @member {IPayment|null|undefined} payment
   * @memberof SendRequest
   * @instance
   */
  SendRequest.prototype.payment = null;

  /**
   * SendRequest maxFee.
   * @member {ITokens|null|undefined} maxFee
   * @memberof SendRequest
   * @instance
   */
  SendRequest.prototype.maxFee = null;

  /**
   * SendRequest fromSubaccount.
   * @member {ISubaccount|null|undefined} fromSubaccount
   * @memberof SendRequest
   * @instance
   */
  SendRequest.prototype.fromSubaccount = null;

  /**
   * SendRequest to.
   * @member {IAccountIdentifier|null|undefined} to
   * @memberof SendRequest
   * @instance
   */
  SendRequest.prototype.to = null;

  /**
   * SendRequest createdAt.
   * @member {IBlockIndex|null|undefined} createdAt
   * @memberof SendRequest
   * @instance
   */
  SendRequest.prototype.createdAt = null;

  /**
   * SendRequest createdAtTime.
   * @member {ITimeStamp|null|undefined} createdAtTime
   * @memberof SendRequest
   * @instance
   */
  SendRequest.prototype.createdAtTime = null;

  /**
   * Creates a new SendRequest instance using the specified properties.
   * @function create
   * @memberof SendRequest
   * @static
   * @param {ISendRequest=} [properties] Properties to set
   * @returns {SendRequest} SendRequest instance
   */
  SendRequest.create = function create(properties) {
    return new SendRequest(properties);
  };

  /**
   * Encodes the specified SendRequest message. Does not implicitly {@link SendRequest.verify|verify} messages.
   * @function encode
   * @memberof SendRequest
   * @static
   * @param {ISendRequest} message SendRequest message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  SendRequest.encode = function encode(message, writer) {
    if (!writer) writer = $Writer.create();
    if (message.memo != null && Object.hasOwnProperty.call(message, 'memo'))
      $root.Memo.encode(message.memo, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
    if (message.payment != null && Object.hasOwnProperty.call(message, 'payment'))
      $root.Payment.encode(message.payment, writer.uint32(/* id 2, wireType 2 =*/ 18).fork()).ldelim();
    if (message.maxFee != null && Object.hasOwnProperty.call(message, 'maxFee'))
      $root.Tokens.encode(message.maxFee, writer.uint32(/* id 3, wireType 2 =*/ 26).fork()).ldelim();
    if (message.fromSubaccount != null && Object.hasOwnProperty.call(message, 'fromSubaccount'))
      $root.Subaccount.encode(message.fromSubaccount, writer.uint32(/* id 4, wireType 2 =*/ 34).fork()).ldelim();
    if (message.to != null && Object.hasOwnProperty.call(message, 'to'))
      $root.AccountIdentifier.encode(message.to, writer.uint32(/* id 5, wireType 2 =*/ 42).fork()).ldelim();
    if (message.createdAt != null && Object.hasOwnProperty.call(message, 'createdAt'))
      $root.BlockIndex.encode(message.createdAt, writer.uint32(/* id 6, wireType 2 =*/ 50).fork()).ldelim();
    if (message.createdAtTime != null && Object.hasOwnProperty.call(message, 'createdAtTime'))
      $root.TimeStamp.encode(message.createdAtTime, writer.uint32(/* id 7, wireType 2 =*/ 58).fork()).ldelim();
    return writer;
  };

  /**
   * Encodes the specified SendRequest message, length delimited. Does not implicitly {@link SendRequest.verify|verify} messages.
   * @function encodeDelimited
   * @memberof SendRequest
   * @static
   * @param {ISendRequest} message SendRequest message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  SendRequest.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a SendRequest message from the specified reader or buffer.
   * @function decode
   * @memberof SendRequest
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {SendRequest} SendRequest
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  SendRequest.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length,
      message = new $root.SendRequest();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error) break;
      switch (tag >>> 3) {
        case 1: {
          message.memo = $root.Memo.decode(reader, reader.uint32());
          break;
        }
        case 2: {
          message.payment = $root.Payment.decode(reader, reader.uint32());
          break;
        }
        case 3: {
          message.maxFee = $root.Tokens.decode(reader, reader.uint32());
          break;
        }
        case 4: {
          message.fromSubaccount = $root.Subaccount.decode(reader, reader.uint32());
          break;
        }
        case 5: {
          message.to = $root.AccountIdentifier.decode(reader, reader.uint32());
          break;
        }
        case 6: {
          message.createdAt = $root.BlockIndex.decode(reader, reader.uint32());
          break;
        }
        case 7: {
          message.createdAtTime = $root.TimeStamp.decode(reader, reader.uint32());
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a SendRequest message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof SendRequest
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {SendRequest} SendRequest
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  SendRequest.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a SendRequest message.
   * @function verify
   * @memberof SendRequest
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  SendRequest.verify = function verify(message) {
    if (typeof message !== 'object' || message === null) return 'object expected';
    if (message.memo != null && message.hasOwnProperty('memo')) {
      var error = $root.Memo.verify(message.memo);
      if (error) return 'memo.' + error;
    }
    if (message.payment != null && message.hasOwnProperty('payment')) {
      var error = $root.Payment.verify(message.payment);
      if (error) return 'payment.' + error;
    }
    if (message.maxFee != null && message.hasOwnProperty('maxFee')) {
      var error = $root.Tokens.verify(message.maxFee);
      if (error) return 'maxFee.' + error;
    }
    if (message.fromSubaccount != null && message.hasOwnProperty('fromSubaccount')) {
      var error = $root.Subaccount.verify(message.fromSubaccount);
      if (error) return 'fromSubaccount.' + error;
    }
    if (message.to != null && message.hasOwnProperty('to')) {
      var error = $root.AccountIdentifier.verify(message.to);
      if (error) return 'to.' + error;
    }
    if (message.createdAt != null && message.hasOwnProperty('createdAt')) {
      var error = $root.BlockIndex.verify(message.createdAt);
      if (error) return 'createdAt.' + error;
    }
    if (message.createdAtTime != null && message.hasOwnProperty('createdAtTime')) {
      var error = $root.TimeStamp.verify(message.createdAtTime);
      if (error) return 'createdAtTime.' + error;
    }
    return null;
  };

  /**
   * Creates a SendRequest message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof SendRequest
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {SendRequest} SendRequest
   */
  SendRequest.fromObject = function fromObject(object) {
    if (object instanceof $root.SendRequest) return object;
    var message = new $root.SendRequest();
    if (object.memo != null) {
      if (typeof object.memo !== 'object') throw TypeError('.SendRequest.memo: object expected');
      message.memo = $root.Memo.fromObject(object.memo);
    }
    if (object.payment != null) {
      if (typeof object.payment !== 'object') throw TypeError('.SendRequest.payment: object expected');
      message.payment = $root.Payment.fromObject(object.payment);
    }
    if (object.maxFee != null) {
      if (typeof object.maxFee !== 'object') throw TypeError('.SendRequest.maxFee: object expected');
      message.maxFee = $root.Tokens.fromObject(object.maxFee);
    }
    if (object.fromSubaccount != null) {
      if (typeof object.fromSubaccount !== 'object') throw TypeError('.SendRequest.fromSubaccount: object expected');
      message.fromSubaccount = $root.Subaccount.fromObject(object.fromSubaccount);
    }
    if (object.to != null) {
      if (typeof object.to !== 'object') throw TypeError('.SendRequest.to: object expected');
      message.to = $root.AccountIdentifier.fromObject(object.to);
    }
    if (object.createdAt != null) {
      if (typeof object.createdAt !== 'object') throw TypeError('.SendRequest.createdAt: object expected');
      message.createdAt = $root.BlockIndex.fromObject(object.createdAt);
    }
    if (object.createdAtTime != null) {
      if (typeof object.createdAtTime !== 'object') throw TypeError('.SendRequest.createdAtTime: object expected');
      message.createdAtTime = $root.TimeStamp.fromObject(object.createdAtTime);
    }
    return message;
  };

  /**
   * Creates a plain object from a SendRequest message. Also converts values to other types if specified.
   * @function toObject
   * @memberof SendRequest
   * @static
   * @param {SendRequest} message SendRequest
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  SendRequest.toObject = function toObject(message, options) {
    if (!options) options = {};
    var object = {};
    if (options.defaults) {
      object.memo = null;
      object.payment = null;
      object.maxFee = null;
      object.fromSubaccount = null;
      object.to = null;
      object.createdAt = null;
      object.createdAtTime = null;
    }
    if (message.memo != null && message.hasOwnProperty('memo'))
      object.memo = $root.Memo.toObject(message.memo, options);
    if (message.payment != null && message.hasOwnProperty('payment'))
      object.payment = $root.Payment.toObject(message.payment, options);
    if (message.maxFee != null && message.hasOwnProperty('maxFee'))
      object.maxFee = $root.Tokens.toObject(message.maxFee, options);
    if (message.fromSubaccount != null && message.hasOwnProperty('fromSubaccount'))
      object.fromSubaccount = $root.Subaccount.toObject(message.fromSubaccount, options);
    if (message.to != null && message.hasOwnProperty('to'))
      object.to = $root.AccountIdentifier.toObject(message.to, options);
    if (message.createdAt != null && message.hasOwnProperty('createdAt'))
      object.createdAt = $root.BlockIndex.toObject(message.createdAt, options);
    if (message.createdAtTime != null && message.hasOwnProperty('createdAtTime'))
      object.createdAtTime = $root.TimeStamp.toObject(message.createdAtTime, options);
    return object;
  };

  /**
   * Converts this SendRequest to JSON.
   * @function toJSON
   * @memberof SendRequest
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  SendRequest.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for SendRequest
   * @function getTypeUrl
   * @memberof SendRequest
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  SendRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = 'type.googleapis.com';
    }
    return typeUrlPrefix + '/SendRequest';
  };

  return SendRequest;
})();

module.exports = $root;
