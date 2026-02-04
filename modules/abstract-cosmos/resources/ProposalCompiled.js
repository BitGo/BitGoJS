/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
'use strict';

var $protobuf = require('protobufjs/minimal');

// Common aliases
var $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {});

$root.cosmos = (function () {
  /**
   * Namespace cosmos.
   * @exports cosmos
   * @namespace
   */
  var cosmos = {};

  cosmos.group = (function () {
    /**
     * Namespace group.
     * @memberof cosmos
     * @namespace
     */
    var group = {};

    group.v1 = (function () {
      /**
       * Namespace v1.
       * @memberof cosmos.group
       * @namespace
       */
      var v1 = {};

      v1.MsgSubmitProposal = (function () {
        /**
         * Properties of a MsgSubmitProposal.
         * @memberof cosmos.group.v1
         * @interface IMsgSubmitProposal
         * @property {string|null} [groupPolicyAddress] MsgSubmitProposal groupPolicyAddress
         * @property {Array.<string>|null} [proposers] MsgSubmitProposal proposers
         * @property {string|null} [metadata] MsgSubmitProposal metadata
         * @property {Array.<google.protobuf.IAny>|null} [messages] MsgSubmitProposal messages
         * @property {cosmos.group.v1.Exec|null} [exec] MsgSubmitProposal exec
         * @property {string|null} [title] MsgSubmitProposal title
         * @property {string|null} [summary] MsgSubmitProposal summary
         */

        /**
         * Constructs a new MsgSubmitProposal.
         * @memberof cosmos.group.v1
         * @classdesc Represents a MsgSubmitProposal.
         * @implements IMsgSubmitProposal
         * @constructor
         * @param {cosmos.group.v1.IMsgSubmitProposal=} [properties] Properties to set
         */
        function MsgSubmitProposal(properties) {
          this.proposers = [];
          this.messages = [];
          if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
        }

        /**
         * MsgSubmitProposal groupPolicyAddress.
         * @member {string} groupPolicyAddress
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         */
        MsgSubmitProposal.prototype.groupPolicyAddress = '';

        /**
         * MsgSubmitProposal proposers.
         * @member {Array.<string>} proposers
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         */
        MsgSubmitProposal.prototype.proposers = $util.emptyArray;

        /**
         * MsgSubmitProposal metadata.
         * @member {string} metadata
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         */
        MsgSubmitProposal.prototype.metadata = '';

        /**
         * MsgSubmitProposal messages.
         * @member {Array.<google.protobuf.IAny>} messages
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         */
        MsgSubmitProposal.prototype.messages = $util.emptyArray;

        /**
         * MsgSubmitProposal exec.
         * @member {cosmos.group.v1.Exec} exec
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         */
        MsgSubmitProposal.prototype.exec = 0;

        /**
         * MsgSubmitProposal title.
         * @member {string} title
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         */
        MsgSubmitProposal.prototype.title = '';

        /**
         * MsgSubmitProposal summary.
         * @member {string} summary
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         */
        MsgSubmitProposal.prototype.summary = '';

        /**
         * Creates a new MsgSubmitProposal instance using the specified properties.
         * @function create
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {cosmos.group.v1.IMsgSubmitProposal=} [properties] Properties to set
         * @returns {cosmos.group.v1.MsgSubmitProposal} MsgSubmitProposal instance
         */
        MsgSubmitProposal.create = function create(properties) {
          return new MsgSubmitProposal(properties);
        };

        /**
         * Encodes the specified MsgSubmitProposal message. Does not implicitly {@link cosmos.group.v1.MsgSubmitProposal.verify|verify} messages.
         * @function encode
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {cosmos.group.v1.IMsgSubmitProposal} message MsgSubmitProposal message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MsgSubmitProposal.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (message.groupPolicyAddress != null && Object.hasOwnProperty.call(message, 'groupPolicyAddress'))
            writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.groupPolicyAddress);
          if (message.proposers != null && message.proposers.length)
            for (var i = 0; i < message.proposers.length; ++i)
              writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.proposers[i]);
          if (message.metadata != null && Object.hasOwnProperty.call(message, 'metadata'))
            writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.metadata);
          if (message.messages != null && message.messages.length)
            for (var i = 0; i < message.messages.length; ++i)
              $root.google.protobuf.Any.encode(
                message.messages[i],
                writer.uint32(/* id 4, wireType 2 =*/ 34).fork()
              ).ldelim();
          if (message.exec != null && Object.hasOwnProperty.call(message, 'exec'))
            writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.exec);
          if (message.title != null && Object.hasOwnProperty.call(message, 'title'))
            writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.title);
          if (message.summary != null && Object.hasOwnProperty.call(message, 'summary'))
            writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.summary);
          return writer;
        };

        /**
         * Encodes the specified MsgSubmitProposal message, length delimited. Does not implicitly {@link cosmos.group.v1.MsgSubmitProposal.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {cosmos.group.v1.IMsgSubmitProposal} message MsgSubmitProposal message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MsgSubmitProposal.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a MsgSubmitProposal message from the specified reader or buffer.
         * @function decode
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cosmos.group.v1.MsgSubmitProposal} MsgSubmitProposal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MsgSubmitProposal.decode = function decode(reader, length, error) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.cosmos.group.v1.MsgSubmitProposal();
          while (reader.pos < end) {
            var tag = reader.uint32();
            if (tag === error) break;
            switch (tag >>> 3) {
              case 1: {
                message.groupPolicyAddress = reader.string();
                break;
              }
              case 2: {
                if (!(message.proposers && message.proposers.length)) message.proposers = [];
                message.proposers.push(reader.string());
                break;
              }
              case 3: {
                message.metadata = reader.string();
                break;
              }
              case 4: {
                if (!(message.messages && message.messages.length)) message.messages = [];
                message.messages.push($root.google.protobuf.Any.decode(reader, reader.uint32()));
                break;
              }
              case 5: {
                message.exec = reader.int32();
                break;
              }
              case 6: {
                message.title = reader.string();
                break;
              }
              case 7: {
                message.summary = reader.string();
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
         * Decodes a MsgSubmitProposal message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cosmos.group.v1.MsgSubmitProposal} MsgSubmitProposal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MsgSubmitProposal.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a MsgSubmitProposal message.
         * @function verify
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        MsgSubmitProposal.verify = function verify(message) {
          if (typeof message !== 'object' || message === null) return 'object expected';
          if (message.groupPolicyAddress != null && message.hasOwnProperty('groupPolicyAddress'))
            if (!$util.isString(message.groupPolicyAddress)) return 'groupPolicyAddress: string expected';
          if (message.proposers != null && message.hasOwnProperty('proposers')) {
            if (!Array.isArray(message.proposers)) return 'proposers: array expected';
            for (var i = 0; i < message.proposers.length; ++i)
              if (!$util.isString(message.proposers[i])) return 'proposers: string[] expected';
          }
          if (message.metadata != null && message.hasOwnProperty('metadata'))
            if (!$util.isString(message.metadata)) return 'metadata: string expected';
          if (message.messages != null && message.hasOwnProperty('messages')) {
            if (!Array.isArray(message.messages)) return 'messages: array expected';
            for (var i = 0; i < message.messages.length; ++i) {
              var error = $root.google.protobuf.Any.verify(message.messages[i]);
              if (error) return 'messages.' + error;
            }
          }
          if (message.exec != null && message.hasOwnProperty('exec'))
            switch (message.exec) {
              default:
                return 'exec: enum value expected';
              case 0:
              case 1:
                break;
            }
          if (message.title != null && message.hasOwnProperty('title'))
            if (!$util.isString(message.title)) return 'title: string expected';
          if (message.summary != null && message.hasOwnProperty('summary'))
            if (!$util.isString(message.summary)) return 'summary: string expected';
          return null;
        };

        /**
         * Creates a MsgSubmitProposal message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cosmos.group.v1.MsgSubmitProposal} MsgSubmitProposal
         */
        MsgSubmitProposal.fromObject = function fromObject(object) {
          if (object instanceof $root.cosmos.group.v1.MsgSubmitProposal) return object;
          var message = new $root.cosmos.group.v1.MsgSubmitProposal();
          if (object.groupPolicyAddress != null) message.groupPolicyAddress = String(object.groupPolicyAddress);
          if (object.proposers) {
            if (!Array.isArray(object.proposers))
              throw TypeError('.cosmos.group.v1.MsgSubmitProposal.proposers: array expected');
            message.proposers = [];
            for (var i = 0; i < object.proposers.length; ++i) message.proposers[i] = String(object.proposers[i]);
          }
          if (object.metadata != null) message.metadata = String(object.metadata);
          if (object.messages) {
            if (!Array.isArray(object.messages))
              throw TypeError('.cosmos.group.v1.MsgSubmitProposal.messages: array expected');
            message.messages = [];
            for (var i = 0; i < object.messages.length; ++i) {
              if (typeof object.messages[i] !== 'object')
                throw TypeError('.cosmos.group.v1.MsgSubmitProposal.messages: object expected');
              message.messages[i] = $root.google.protobuf.Any.fromObject(object.messages[i]);
            }
          }
          switch (object.exec) {
            default:
              if (typeof object.exec === 'number') {
                message.exec = object.exec;
                break;
              }
              break;
            case 'EXEC_UNSPECIFIED':
            case 0:
              message.exec = 0;
              break;
            case 'EXEC_TRY':
            case 1:
              message.exec = 1;
              break;
          }
          if (object.title != null) message.title = String(object.title);
          if (object.summary != null) message.summary = String(object.summary);
          return message;
        };

        /**
         * Creates a plain object from a MsgSubmitProposal message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {cosmos.group.v1.MsgSubmitProposal} message MsgSubmitProposal
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        MsgSubmitProposal.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.arrays || options.defaults) {
            object.proposers = [];
            object.messages = [];
          }
          if (options.defaults) {
            object.groupPolicyAddress = '';
            object.metadata = '';
            object.exec = options.enums === String ? 'EXEC_UNSPECIFIED' : 0;
            object.title = '';
            object.summary = '';
          }
          if (message.groupPolicyAddress != null && message.hasOwnProperty('groupPolicyAddress'))
            object.groupPolicyAddress = message.groupPolicyAddress;
          if (message.proposers && message.proposers.length) {
            object.proposers = [];
            for (var j = 0; j < message.proposers.length; ++j) object.proposers[j] = message.proposers[j];
          }
          if (message.metadata != null && message.hasOwnProperty('metadata')) object.metadata = message.metadata;
          if (message.messages && message.messages.length) {
            object.messages = [];
            for (var j = 0; j < message.messages.length; ++j)
              object.messages[j] = $root.google.protobuf.Any.toObject(message.messages[j], options);
          }
          if (message.exec != null && message.hasOwnProperty('exec'))
            object.exec =
              options.enums === String
                ? $root.cosmos.group.v1.Exec[message.exec] === undefined
                  ? message.exec
                  : $root.cosmos.group.v1.Exec[message.exec]
                : message.exec;
          if (message.title != null && message.hasOwnProperty('title')) object.title = message.title;
          if (message.summary != null && message.hasOwnProperty('summary')) object.summary = message.summary;
          return object;
        };

        /**
         * Converts this MsgSubmitProposal to JSON.
         * @function toJSON
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        MsgSubmitProposal.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for MsgSubmitProposal
         * @function getTypeUrl
         * @memberof cosmos.group.v1.MsgSubmitProposal
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        MsgSubmitProposal.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
          if (typeUrlPrefix === undefined) {
            typeUrlPrefix = 'type.googleapis.com';
          }
          return typeUrlPrefix + '/cosmos.group.v1.MsgSubmitProposal';
        };

        return MsgSubmitProposal;
      })();

      /**
       * Exec enum.
       * @name cosmos.group.v1.Exec
       * @enum {number}
       * @property {number} EXEC_UNSPECIFIED=0 EXEC_UNSPECIFIED value
       * @property {number} EXEC_TRY=1 EXEC_TRY value
       */
      v1.Exec = (function () {
        var valuesById = {},
          values = Object.create(valuesById);
        values[(valuesById[0] = 'EXEC_UNSPECIFIED')] = 0;
        values[(valuesById[1] = 'EXEC_TRY')] = 1;
        return values;
      })();

      return v1;
    })();

    return group;
  })();

  return cosmos;
})();

$root.google = (function () {
  /**
   * Namespace google.
   * @exports google
   * @namespace
   */
  var google = {};

  google.protobuf = (function () {
    /**
     * Namespace protobuf.
     * @memberof google
     * @namespace
     */
    var protobuf = {};

    protobuf.Any = (function () {
      /**
       * Properties of an Any.
       * @memberof google.protobuf
       * @interface IAny
       * @property {string|null} [type_url] Any type_url
       * @property {Uint8Array|null} [value] Any value
       */

      /**
       * Constructs a new Any.
       * @memberof google.protobuf
       * @classdesc Represents an Any.
       * @implements IAny
       * @constructor
       * @param {google.protobuf.IAny=} [properties] Properties to set
       */
      function Any(properties) {
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
      }

      /**
       * Any type_url.
       * @member {string} type_url
       * @memberof google.protobuf.Any
       * @instance
       */
      Any.prototype.type_url = '';

      /**
       * Any value.
       * @member {Uint8Array} value
       * @memberof google.protobuf.Any
       * @instance
       */
      Any.prototype.value = $util.newBuffer([]);

      /**
       * Creates a new Any instance using the specified properties.
       * @function create
       * @memberof google.protobuf.Any
       * @static
       * @param {google.protobuf.IAny=} [properties] Properties to set
       * @returns {google.protobuf.Any} Any instance
       */
      Any.create = function create(properties) {
        return new Any(properties);
      };

      /**
       * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
       * @function encode
       * @memberof google.protobuf.Any
       * @static
       * @param {google.protobuf.IAny} message Any message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Any.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.type_url != null && Object.hasOwnProperty.call(message, 'type_url'))
          writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.type_url);
        if (message.value != null && Object.hasOwnProperty.call(message, 'value'))
          writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.value);
        return writer;
      };

      /**
       * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
       * @function encodeDelimited
       * @memberof google.protobuf.Any
       * @static
       * @param {google.protobuf.IAny} message Any message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Any.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes an Any message from the specified reader or buffer.
       * @function decode
       * @memberof google.protobuf.Any
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {google.protobuf.Any} Any
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Any.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.google.protobuf.Any();
        while (reader.pos < end) {
          var tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.type_url = reader.string();
              break;
            }
            case 2: {
              message.value = reader.bytes();
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
       * Decodes an Any message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof google.protobuf.Any
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {google.protobuf.Any} Any
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Any.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies an Any message.
       * @function verify
       * @memberof google.protobuf.Any
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Any.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected';
        if (message.type_url != null && message.hasOwnProperty('type_url'))
          if (!$util.isString(message.type_url)) return 'type_url: string expected';
        if (message.value != null && message.hasOwnProperty('value'))
          if (!((message.value && typeof message.value.length === 'number') || $util.isString(message.value)))
            return 'value: buffer expected';
        return null;
      };

      /**
       * Creates an Any message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof google.protobuf.Any
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {google.protobuf.Any} Any
       */
      Any.fromObject = function fromObject(object) {
        if (object instanceof $root.google.protobuf.Any) return object;
        var message = new $root.google.protobuf.Any();
        if (object.type_url != null) message.type_url = String(object.type_url);
        if (object.value != null)
          if (typeof object.value === 'string')
            $util.base64.decode(object.value, (message.value = $util.newBuffer($util.base64.length(object.value))), 0);
          else if (object.value.length >= 0) message.value = object.value;
        return message;
      };

      /**
       * Creates a plain object from an Any message. Also converts values to other types if specified.
       * @function toObject
       * @memberof google.protobuf.Any
       * @static
       * @param {google.protobuf.Any} message Any
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Any.toObject = function toObject(message, options) {
        if (!options) options = {};
        var object = {};
        if (options.defaults) {
          object.type_url = '';
          if (options.bytes === String) object.value = '';
          else {
            object.value = [];
            if (options.bytes !== Array) object.value = $util.newBuffer(object.value);
          }
        }
        if (message.type_url != null && message.hasOwnProperty('type_url')) object.type_url = message.type_url;
        if (message.value != null && message.hasOwnProperty('value'))
          object.value =
            options.bytes === String
              ? $util.base64.encode(message.value, 0, message.value.length)
              : options.bytes === Array
              ? Array.prototype.slice.call(message.value)
              : message.value;
        return object;
      };

      /**
       * Converts this Any to JSON.
       * @function toJSON
       * @memberof google.protobuf.Any
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Any.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Any
       * @function getTypeUrl
       * @memberof google.protobuf.Any
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Any.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = 'type.googleapis.com';
        }
        return typeUrlPrefix + '/google.protobuf.Any';
      };

      return Any;
    })();

    return protobuf;
  })();

  return google;
})();

module.exports = $root;
