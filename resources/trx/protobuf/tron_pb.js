/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
goog.object.extend(proto, google_protobuf_any_pb);
var Discover_pb = require('./Discover_pb.js');
goog.object.extend(proto, Discover_pb);
goog.exportSymbol('proto.protocol.Account', null, global);
goog.exportSymbol('proto.protocol.Account.AccountResource', null, global);
goog.exportSymbol('proto.protocol.Account.Frozen', null, global);
goog.exportSymbol('proto.protocol.AccountId', null, global);
goog.exportSymbol('proto.protocol.AccountType', null, global);
goog.exportSymbol('proto.protocol.Block', null, global);
goog.exportSymbol('proto.protocol.BlockHeader', null, global);
goog.exportSymbol('proto.protocol.BlockHeader.raw', null, global);
goog.exportSymbol('proto.protocol.BlockInventory', null, global);
goog.exportSymbol('proto.protocol.BlockInventory.BlockId', null, global);
goog.exportSymbol('proto.protocol.BlockInventory.Type', null, global);
goog.exportSymbol('proto.protocol.ChainInventory', null, global);
goog.exportSymbol('proto.protocol.ChainInventory.BlockId', null, global);
goog.exportSymbol('proto.protocol.ChainParameters', null, global);
goog.exportSymbol('proto.protocol.ChainParameters.ChainParameter', null, global);
goog.exportSymbol('proto.protocol.DelegatedResource', null, global);
goog.exportSymbol('proto.protocol.DelegatedResourceAccountIndex', null, global);
goog.exportSymbol('proto.protocol.DisconnectMessage', null, global);
goog.exportSymbol('proto.protocol.DynamicProperties', null, global);
goog.exportSymbol('proto.protocol.Exchange', null, global);
goog.exportSymbol('proto.protocol.HelloMessage', null, global);
goog.exportSymbol('proto.protocol.HelloMessage.BlockId', null, global);
goog.exportSymbol('proto.protocol.InternalTransaction', null, global);
goog.exportSymbol('proto.protocol.InternalTransaction.CallValueInfo', null, global);
goog.exportSymbol('proto.protocol.Inventory', null, global);
goog.exportSymbol('proto.protocol.Inventory.InventoryType', null, global);
goog.exportSymbol('proto.protocol.Items', null, global);
goog.exportSymbol('proto.protocol.Items.ItemType', null, global);
goog.exportSymbol('proto.protocol.Key', null, global);
goog.exportSymbol('proto.protocol.NodeInfo', null, global);
goog.exportSymbol('proto.protocol.NodeInfo.ConfigNodeInfo', null, global);
goog.exportSymbol('proto.protocol.NodeInfo.MachineInfo', null, global);
goog.exportSymbol('proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo', null, global);
goog.exportSymbol('proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo', null, global);
goog.exportSymbol('proto.protocol.NodeInfo.PeerInfo', null, global);
goog.exportSymbol('proto.protocol.Permission', null, global);
goog.exportSymbol('proto.protocol.Permission.PermissionType', null, global);
goog.exportSymbol('proto.protocol.Proposal', null, global);
goog.exportSymbol('proto.protocol.Proposal.State', null, global);
goog.exportSymbol('proto.protocol.ReasonCode', null, global);
goog.exportSymbol('proto.protocol.ResourceReceipt', null, global);
goog.exportSymbol('proto.protocol.SmartContract', null, global);
goog.exportSymbol('proto.protocol.SmartContract.ABI', null, global);
goog.exportSymbol('proto.protocol.SmartContract.ABI.Entry', null, global);
goog.exportSymbol('proto.protocol.SmartContract.ABI.Entry.EntryType', null, global);
goog.exportSymbol('proto.protocol.SmartContract.ABI.Entry.Param', null, global);
goog.exportSymbol('proto.protocol.SmartContract.ABI.Entry.StateMutabilityType', null, global);
goog.exportSymbol('proto.protocol.TXInput', null, global);
goog.exportSymbol('proto.protocol.TXInput.raw', null, global);
goog.exportSymbol('proto.protocol.TXOutput', null, global);
goog.exportSymbol('proto.protocol.TXOutputs', null, global);
goog.exportSymbol('proto.protocol.Transaction', null, global);
goog.exportSymbol('proto.protocol.Transaction.Contract', null, global);
goog.exportSymbol('proto.protocol.Transaction.Contract.ContractType', null, global);
goog.exportSymbol('proto.protocol.Transaction.Result', null, global);
goog.exportSymbol('proto.protocol.Transaction.Result.code', null, global);
goog.exportSymbol('proto.protocol.Transaction.Result.contractResult', null, global);
goog.exportSymbol('proto.protocol.Transaction.raw', null, global);
goog.exportSymbol('proto.protocol.TransactionInfo', null, global);
goog.exportSymbol('proto.protocol.TransactionInfo.Log', null, global);
goog.exportSymbol('proto.protocol.TransactionInfo.code', null, global);
goog.exportSymbol('proto.protocol.TransactionRet', null, global);
goog.exportSymbol('proto.protocol.TransactionSign', null, global);
goog.exportSymbol('proto.protocol.Transactions', null, global);
goog.exportSymbol('proto.protocol.Vote', null, global);
goog.exportSymbol('proto.protocol.Votes', null, global);
goog.exportSymbol('proto.protocol.Witness', null, global);
goog.exportSymbol('proto.protocol.authority', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.AccountId = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.AccountId, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.AccountId.displayName = 'proto.protocol.AccountId';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Vote = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Vote, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Vote.displayName = 'proto.protocol.Vote';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Proposal = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Proposal.repeatedFields_, null);
};
goog.inherits(proto.protocol.Proposal, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Proposal.displayName = 'proto.protocol.Proposal';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Exchange = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Exchange, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Exchange.displayName = 'proto.protocol.Exchange';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.ChainParameters = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.ChainParameters.repeatedFields_, null);
};
goog.inherits(proto.protocol.ChainParameters, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.ChainParameters.displayName = 'proto.protocol.ChainParameters';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.ChainParameters.ChainParameter = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.ChainParameters.ChainParameter, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.ChainParameters.ChainParameter.displayName = 'proto.protocol.ChainParameters.ChainParameter';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Account = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Account.repeatedFields_, null);
};
goog.inherits(proto.protocol.Account, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Account.displayName = 'proto.protocol.Account';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Account.Frozen = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Account.Frozen, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Account.Frozen.displayName = 'proto.protocol.Account.Frozen';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Account.AccountResource = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Account.AccountResource, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Account.AccountResource.displayName = 'proto.protocol.Account.AccountResource';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Key = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Key, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Key.displayName = 'proto.protocol.Key';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.DelegatedResource = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.DelegatedResource, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.DelegatedResource.displayName = 'proto.protocol.DelegatedResource';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.authority = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.authority, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.authority.displayName = 'proto.protocol.authority';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Permission = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Permission.repeatedFields_, null);
};
goog.inherits(proto.protocol.Permission, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Permission.displayName = 'proto.protocol.Permission';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Witness = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Witness, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Witness.displayName = 'proto.protocol.Witness';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Votes = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Votes.repeatedFields_, null);
};
goog.inherits(proto.protocol.Votes, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Votes.displayName = 'proto.protocol.Votes';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TXOutput = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.TXOutput, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TXOutput.displayName = 'proto.protocol.TXOutput';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TXInput = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.TXInput, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TXInput.displayName = 'proto.protocol.TXInput';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TXInput.raw = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.TXInput.raw, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TXInput.raw.displayName = 'proto.protocol.TXInput.raw';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TXOutputs = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.TXOutputs.repeatedFields_, null);
};
goog.inherits(proto.protocol.TXOutputs, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TXOutputs.displayName = 'proto.protocol.TXOutputs';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.ResourceReceipt = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.ResourceReceipt, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.ResourceReceipt.displayName = 'proto.protocol.ResourceReceipt';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Transaction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Transaction.repeatedFields_, null);
};
goog.inherits(proto.protocol.Transaction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Transaction.displayName = 'proto.protocol.Transaction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Transaction.Contract = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Transaction.Contract, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Transaction.Contract.displayName = 'proto.protocol.Transaction.Contract';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Transaction.Result = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.Transaction.Result, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Transaction.Result.displayName = 'proto.protocol.Transaction.Result';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Transaction.raw = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Transaction.raw.repeatedFields_, null);
};
goog.inherits(proto.protocol.Transaction.raw, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Transaction.raw.displayName = 'proto.protocol.Transaction.raw';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TransactionInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.TransactionInfo.repeatedFields_, null);
};
goog.inherits(proto.protocol.TransactionInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TransactionInfo.displayName = 'proto.protocol.TransactionInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TransactionInfo.Log = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.TransactionInfo.Log.repeatedFields_, null);
};
goog.inherits(proto.protocol.TransactionInfo.Log, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TransactionInfo.Log.displayName = 'proto.protocol.TransactionInfo.Log';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TransactionRet = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.TransactionRet.repeatedFields_, null);
};
goog.inherits(proto.protocol.TransactionRet, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TransactionRet.displayName = 'proto.protocol.TransactionRet';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Transactions = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Transactions.repeatedFields_, null);
};
goog.inherits(proto.protocol.Transactions, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Transactions.displayName = 'proto.protocol.Transactions';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.TransactionSign = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.TransactionSign, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.TransactionSign.displayName = 'proto.protocol.TransactionSign';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.BlockHeader = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.BlockHeader, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.BlockHeader.displayName = 'proto.protocol.BlockHeader';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.BlockHeader.raw = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.BlockHeader.raw, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.BlockHeader.raw.displayName = 'proto.protocol.BlockHeader.raw';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Block = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Block.repeatedFields_, null);
};
goog.inherits(proto.protocol.Block, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Block.displayName = 'proto.protocol.Block';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.ChainInventory = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.ChainInventory.repeatedFields_, null);
};
goog.inherits(proto.protocol.ChainInventory, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.ChainInventory.displayName = 'proto.protocol.ChainInventory';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.ChainInventory.BlockId = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.ChainInventory.BlockId, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.ChainInventory.BlockId.displayName = 'proto.protocol.ChainInventory.BlockId';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.BlockInventory = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.BlockInventory.repeatedFields_, null);
};
goog.inherits(proto.protocol.BlockInventory, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.BlockInventory.displayName = 'proto.protocol.BlockInventory';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.BlockInventory.BlockId = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.BlockInventory.BlockId, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.BlockInventory.BlockId.displayName = 'proto.protocol.BlockInventory.BlockId';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Inventory = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Inventory.repeatedFields_, null);
};
goog.inherits(proto.protocol.Inventory, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Inventory.displayName = 'proto.protocol.Inventory';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.Items = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.Items.repeatedFields_, null);
};
goog.inherits(proto.protocol.Items, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.Items.displayName = 'proto.protocol.Items';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.DynamicProperties = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.DynamicProperties, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.DynamicProperties.displayName = 'proto.protocol.DynamicProperties';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.DisconnectMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.DisconnectMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.DisconnectMessage.displayName = 'proto.protocol.DisconnectMessage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.HelloMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.HelloMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.HelloMessage.displayName = 'proto.protocol.HelloMessage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.HelloMessage.BlockId = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.HelloMessage.BlockId, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.HelloMessage.BlockId.displayName = 'proto.protocol.HelloMessage.BlockId';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.SmartContract = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.SmartContract, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.SmartContract.displayName = 'proto.protocol.SmartContract';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.SmartContract.ABI = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.SmartContract.ABI.repeatedFields_, null);
};
goog.inherits(proto.protocol.SmartContract.ABI, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.SmartContract.ABI.displayName = 'proto.protocol.SmartContract.ABI';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.SmartContract.ABI.Entry = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.SmartContract.ABI.Entry.repeatedFields_, null);
};
goog.inherits(proto.protocol.SmartContract.ABI.Entry, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.SmartContract.ABI.Entry.displayName = 'proto.protocol.SmartContract.ABI.Entry';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.SmartContract.ABI.Entry.Param = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.SmartContract.ABI.Entry.Param, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.SmartContract.ABI.Entry.Param.displayName = 'proto.protocol.SmartContract.ABI.Entry.Param';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.InternalTransaction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.InternalTransaction.repeatedFields_, null);
};
goog.inherits(proto.protocol.InternalTransaction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.InternalTransaction.displayName = 'proto.protocol.InternalTransaction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.InternalTransaction.CallValueInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.InternalTransaction.CallValueInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.InternalTransaction.CallValueInfo.displayName = 'proto.protocol.InternalTransaction.CallValueInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.DelegatedResourceAccountIndex = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.DelegatedResourceAccountIndex.repeatedFields_, null);
};
goog.inherits(proto.protocol.DelegatedResourceAccountIndex, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.DelegatedResourceAccountIndex.displayName = 'proto.protocol.DelegatedResourceAccountIndex';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.NodeInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.NodeInfo.repeatedFields_, null);
};
goog.inherits(proto.protocol.NodeInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.NodeInfo.displayName = 'proto.protocol.NodeInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.NodeInfo.PeerInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.NodeInfo.PeerInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.NodeInfo.PeerInfo.displayName = 'proto.protocol.NodeInfo.PeerInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.NodeInfo.ConfigNodeInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.NodeInfo.ConfigNodeInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.NodeInfo.ConfigNodeInfo.displayName = 'proto.protocol.NodeInfo.ConfigNodeInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.NodeInfo.MachineInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.protocol.NodeInfo.MachineInfo.repeatedFields_, null);
};
goog.inherits(proto.protocol.NodeInfo.MachineInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.NodeInfo.MachineInfo.displayName = 'proto.protocol.NodeInfo.MachineInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.displayName = 'proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.displayName = 'proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.AccountId.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.AccountId.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.AccountId} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.AccountId.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: msg.getName_asB64(),
    address: msg.getAddress_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.AccountId}
 */
proto.protocol.AccountId.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.AccountId;
  return proto.protocol.AccountId.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.AccountId} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.AccountId}
 */
proto.protocol.AccountId.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAddress(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.AccountId.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.AccountId.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.AccountId} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.AccountId.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
};


/**
 * optional bytes name = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.AccountId.prototype.getName = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes name = 1;
 * This is a type-conversion wrapper around `getName()`
 * @return {string}
 */
proto.protocol.AccountId.prototype.getName_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getName()));
};


/**
 * optional bytes name = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getName()`
 * @return {!Uint8Array}
 */
proto.protocol.AccountId.prototype.getName_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getName()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.AccountId.prototype.setName = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional bytes address = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.AccountId.prototype.getAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes address = 2;
 * This is a type-conversion wrapper around `getAddress()`
 * @return {string}
 */
proto.protocol.AccountId.prototype.getAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAddress()));
};


/**
 * optional bytes address = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.AccountId.prototype.getAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.AccountId.prototype.setAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Vote.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Vote.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Vote} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Vote.toObject = function(includeInstance, msg) {
  var f, obj = {
    voteAddress: msg.getVoteAddress_asB64(),
    voteCount: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Vote}
 */
proto.protocol.Vote.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Vote;
  return proto.protocol.Vote.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Vote} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Vote}
 */
proto.protocol.Vote.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setVoteAddress(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setVoteCount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Vote.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Vote.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Vote} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Vote.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVoteAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getVoteCount();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional bytes vote_address = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Vote.prototype.getVoteAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes vote_address = 1;
 * This is a type-conversion wrapper around `getVoteAddress()`
 * @return {string}
 */
proto.protocol.Vote.prototype.getVoteAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getVoteAddress()));
};


/**
 * optional bytes vote_address = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getVoteAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.Vote.prototype.getVoteAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getVoteAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Vote.prototype.setVoteAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 vote_count = 2;
 * @return {number}
 */
proto.protocol.Vote.prototype.getVoteCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.Vote.prototype.setVoteCount = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Proposal.repeatedFields_ = [6];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Proposal.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Proposal.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Proposal} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Proposal.toObject = function(includeInstance, msg) {
  var f, obj = {
    proposalId: jspb.Message.getFieldWithDefault(msg, 1, 0),
    proposerAddress: msg.getProposerAddress_asB64(),
    parametersMap: (f = msg.getParametersMap()) ? f.toObject(includeInstance, undefined) : [],
    expirationTime: jspb.Message.getFieldWithDefault(msg, 4, 0),
    createTime: jspb.Message.getFieldWithDefault(msg, 5, 0),
    approvalsList: msg.getApprovalsList_asB64(),
    state: jspb.Message.getFieldWithDefault(msg, 7, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Proposal}
 */
proto.protocol.Proposal.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Proposal;
  return proto.protocol.Proposal.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Proposal} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Proposal}
 */
proto.protocol.Proposal.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProposalId(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setProposerAddress(value);
      break;
    case 3:
      var value = msg.getParametersMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readInt64, jspb.BinaryReader.prototype.readInt64, null, 0);
         });
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExpirationTime(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setCreateTime(value);
      break;
    case 6:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.addApprovals(value);
      break;
    case 7:
      var value = /** @type {!proto.protocol.Proposal.State} */ (reader.readEnum());
      msg.setState(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Proposal.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Proposal.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Proposal} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Proposal.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProposalId();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getProposerAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getParametersMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(3, writer, jspb.BinaryWriter.prototype.writeInt64, jspb.BinaryWriter.prototype.writeInt64);
  }
  f = message.getExpirationTime();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getCreateTime();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getApprovalsList_asU8();
  if (f.length > 0) {
    writer.writeRepeatedBytes(
      6,
      f
    );
  }
  f = message.getState();
  if (f !== 0.0) {
    writer.writeEnum(
      7,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.Proposal.State = {
  PENDING: 0,
  DISAPPROVED: 1,
  APPROVED: 2,
  CANCELED: 3
};

/**
 * optional int64 proposal_id = 1;
 * @return {number}
 */
proto.protocol.Proposal.prototype.getProposalId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.Proposal.prototype.setProposalId = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional bytes proposer_address = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Proposal.prototype.getProposerAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes proposer_address = 2;
 * This is a type-conversion wrapper around `getProposerAddress()`
 * @return {string}
 */
proto.protocol.Proposal.prototype.getProposerAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getProposerAddress()));
};


/**
 * optional bytes proposer_address = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getProposerAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.Proposal.prototype.getProposerAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getProposerAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Proposal.prototype.setProposerAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * map<int64, int64> parameters = 3;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<number,number>}
 */
proto.protocol.Proposal.prototype.getParametersMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<number,number>} */ (
      jspb.Message.getMapField(this, 3, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.Proposal.prototype.clearParametersMap = function() {
  this.getParametersMap().clear();
};


/**
 * optional int64 expiration_time = 4;
 * @return {number}
 */
proto.protocol.Proposal.prototype.getExpirationTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.Proposal.prototype.setExpirationTime = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int64 create_time = 5;
 * @return {number}
 */
proto.protocol.Proposal.prototype.getCreateTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.Proposal.prototype.setCreateTime = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * repeated bytes approvals = 6;
 * @return {!(Array<!Uint8Array>|Array<string>)}
 */
proto.protocol.Proposal.prototype.getApprovalsList = function() {
  return /** @type {!(Array<!Uint8Array>|Array<string>)} */ (jspb.Message.getRepeatedField(this, 6));
};


/**
 * repeated bytes approvals = 6;
 * This is a type-conversion wrapper around `getApprovalsList()`
 * @return {!Array<string>}
 */
proto.protocol.Proposal.prototype.getApprovalsList_asB64 = function() {
  return /** @type {!Array<string>} */ (jspb.Message.bytesListAsB64(
      this.getApprovalsList()));
};


/**
 * repeated bytes approvals = 6;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getApprovalsList()`
 * @return {!Array<!Uint8Array>}
 */
proto.protocol.Proposal.prototype.getApprovalsList_asU8 = function() {
  return /** @type {!Array<!Uint8Array>} */ (jspb.Message.bytesListAsU8(
      this.getApprovalsList()));
};


/** @param {!(Array<!Uint8Array>|Array<string>)} value */
proto.protocol.Proposal.prototype.setApprovalsList = function(value) {
  jspb.Message.setField(this, 6, value || []);
};


/**
 * @param {!(string|Uint8Array)} value
 * @param {number=} opt_index
 */
proto.protocol.Proposal.prototype.addApprovals = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 6, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Proposal.prototype.clearApprovalsList = function() {
  this.setApprovalsList([]);
};


/**
 * optional State state = 7;
 * @return {!proto.protocol.Proposal.State}
 */
proto.protocol.Proposal.prototype.getState = function() {
  return /** @type {!proto.protocol.Proposal.State} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {!proto.protocol.Proposal.State} value */
proto.protocol.Proposal.prototype.setState = function(value) {
  jspb.Message.setProto3EnumField(this, 7, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Exchange.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Exchange.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Exchange} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Exchange.toObject = function(includeInstance, msg) {
  var f, obj = {
    exchangeId: jspb.Message.getFieldWithDefault(msg, 1, 0),
    creatorAddress: msg.getCreatorAddress_asB64(),
    createTime: jspb.Message.getFieldWithDefault(msg, 3, 0),
    firstTokenId: msg.getFirstTokenId_asB64(),
    firstTokenBalance: jspb.Message.getFieldWithDefault(msg, 7, 0),
    secondTokenId: msg.getSecondTokenId_asB64(),
    secondTokenBalance: jspb.Message.getFieldWithDefault(msg, 9, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Exchange}
 */
proto.protocol.Exchange.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Exchange;
  return proto.protocol.Exchange.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Exchange} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Exchange}
 */
proto.protocol.Exchange.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeId(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setCreatorAddress(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setCreateTime(value);
      break;
    case 6:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setFirstTokenId(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFirstTokenBalance(value);
      break;
    case 8:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setSecondTokenId(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setSecondTokenBalance(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Exchange.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Exchange.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Exchange} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Exchange.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExchangeId();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getCreatorAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getCreateTime();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getFirstTokenId_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      6,
      f
    );
  }
  f = message.getFirstTokenBalance();
  if (f !== 0) {
    writer.writeInt64(
      7,
      f
    );
  }
  f = message.getSecondTokenId_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      8,
      f
    );
  }
  f = message.getSecondTokenBalance();
  if (f !== 0) {
    writer.writeInt64(
      9,
      f
    );
  }
};


/**
 * optional int64 exchange_id = 1;
 * @return {number}
 */
proto.protocol.Exchange.prototype.getExchangeId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.Exchange.prototype.setExchangeId = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional bytes creator_address = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Exchange.prototype.getCreatorAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes creator_address = 2;
 * This is a type-conversion wrapper around `getCreatorAddress()`
 * @return {string}
 */
proto.protocol.Exchange.prototype.getCreatorAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getCreatorAddress()));
};


/**
 * optional bytes creator_address = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getCreatorAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.Exchange.prototype.getCreatorAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getCreatorAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Exchange.prototype.setCreatorAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional int64 create_time = 3;
 * @return {number}
 */
proto.protocol.Exchange.prototype.getCreateTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.Exchange.prototype.setCreateTime = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional bytes first_token_id = 6;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Exchange.prototype.getFirstTokenId = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * optional bytes first_token_id = 6;
 * This is a type-conversion wrapper around `getFirstTokenId()`
 * @return {string}
 */
proto.protocol.Exchange.prototype.getFirstTokenId_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getFirstTokenId()));
};


/**
 * optional bytes first_token_id = 6;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getFirstTokenId()`
 * @return {!Uint8Array}
 */
proto.protocol.Exchange.prototype.getFirstTokenId_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getFirstTokenId()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Exchange.prototype.setFirstTokenId = function(value) {
  jspb.Message.setProto3BytesField(this, 6, value);
};


/**
 * optional int64 first_token_balance = 7;
 * @return {number}
 */
proto.protocol.Exchange.prototype.getFirstTokenBalance = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.protocol.Exchange.prototype.setFirstTokenBalance = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional bytes second_token_id = 8;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Exchange.prototype.getSecondTokenId = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * optional bytes second_token_id = 8;
 * This is a type-conversion wrapper around `getSecondTokenId()`
 * @return {string}
 */
proto.protocol.Exchange.prototype.getSecondTokenId_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getSecondTokenId()));
};


/**
 * optional bytes second_token_id = 8;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getSecondTokenId()`
 * @return {!Uint8Array}
 */
proto.protocol.Exchange.prototype.getSecondTokenId_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getSecondTokenId()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Exchange.prototype.setSecondTokenId = function(value) {
  jspb.Message.setProto3BytesField(this, 8, value);
};


/**
 * optional int64 second_token_balance = 9;
 * @return {number}
 */
proto.protocol.Exchange.prototype.getSecondTokenBalance = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/** @param {number} value */
proto.protocol.Exchange.prototype.setSecondTokenBalance = function(value) {
  jspb.Message.setProto3IntField(this, 9, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.ChainParameters.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.ChainParameters.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.ChainParameters.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.ChainParameters} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainParameters.toObject = function(includeInstance, msg) {
  var f, obj = {
    chainparameterList: jspb.Message.toObjectList(msg.getChainparameterList(),
    proto.protocol.ChainParameters.ChainParameter.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.ChainParameters}
 */
proto.protocol.ChainParameters.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.ChainParameters;
  return proto.protocol.ChainParameters.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.ChainParameters} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.ChainParameters}
 */
proto.protocol.ChainParameters.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.ChainParameters.ChainParameter;
      reader.readMessage(value,proto.protocol.ChainParameters.ChainParameter.deserializeBinaryFromReader);
      msg.addChainparameter(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.ChainParameters.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.ChainParameters.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.ChainParameters} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainParameters.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getChainparameterList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.protocol.ChainParameters.ChainParameter.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.ChainParameters.ChainParameter.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.ChainParameters.ChainParameter.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.ChainParameters.ChainParameter} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainParameters.ChainParameter.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, ""),
    value: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.ChainParameters.ChainParameter}
 */
proto.protocol.ChainParameters.ChainParameter.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.ChainParameters.ChainParameter;
  return proto.protocol.ChainParameters.ChainParameter.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.ChainParameters.ChainParameter} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.ChainParameters.ChainParameter}
 */
proto.protocol.ChainParameters.ChainParameter.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.ChainParameters.ChainParameter.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.ChainParameters.ChainParameter.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.ChainParameters.ChainParameter} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainParameters.ChainParameter.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getValue();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional string key = 1;
 * @return {string}
 */
proto.protocol.ChainParameters.ChainParameter.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.protocol.ChainParameters.ChainParameter.prototype.setKey = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int64 value = 2;
 * @return {number}
 */
proto.protocol.ChainParameters.ChainParameter.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.ChainParameters.ChainParameter.prototype.setValue = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * repeated ChainParameter chainParameter = 1;
 * @return {!Array<!proto.protocol.ChainParameters.ChainParameter>}
 */
proto.protocol.ChainParameters.prototype.getChainparameterList = function() {
  return /** @type{!Array<!proto.protocol.ChainParameters.ChainParameter>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.ChainParameters.ChainParameter, 1));
};


/** @param {!Array<!proto.protocol.ChainParameters.ChainParameter>} value */
proto.protocol.ChainParameters.prototype.setChainparameterList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.protocol.ChainParameters.ChainParameter=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.ChainParameters.ChainParameter}
 */
proto.protocol.ChainParameters.prototype.addChainparameter = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.protocol.ChainParameters.ChainParameter, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.ChainParameters.prototype.clearChainparameterList = function() {
  this.setChainparameterList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Account.repeatedFields_ = [5,7,16,33];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Account.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Account.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Account} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Account.toObject = function(includeInstance, msg) {
  var f, obj = {
    accountName: msg.getAccountName_asB64(),
    type: jspb.Message.getFieldWithDefault(msg, 2, 0),
    address: msg.getAddress_asB64(),
    balance: jspb.Message.getFieldWithDefault(msg, 4, 0),
    votesList: jspb.Message.toObjectList(msg.getVotesList(),
    proto.protocol.Vote.toObject, includeInstance),
    assetMap: (f = msg.getAssetMap()) ? f.toObject(includeInstance, undefined) : [],
    assetv2Map: (f = msg.getAssetv2Map()) ? f.toObject(includeInstance, undefined) : [],
    frozenList: jspb.Message.toObjectList(msg.getFrozenList(),
    proto.protocol.Account.Frozen.toObject, includeInstance),
    netUsage: jspb.Message.getFieldWithDefault(msg, 8, 0),
    acquiredDelegatedFrozenBalanceForBandwidth: jspb.Message.getFieldWithDefault(msg, 41, 0),
    delegatedFrozenBalanceForBandwidth: jspb.Message.getFieldWithDefault(msg, 42, 0),
    createTime: jspb.Message.getFieldWithDefault(msg, 9, 0),
    latestOprationTime: jspb.Message.getFieldWithDefault(msg, 10, 0),
    allowance: jspb.Message.getFieldWithDefault(msg, 11, 0),
    latestWithdrawTime: jspb.Message.getFieldWithDefault(msg, 12, 0),
    code: msg.getCode_asB64(),
    isWitness: jspb.Message.getFieldWithDefault(msg, 14, false),
    isCommittee: jspb.Message.getFieldWithDefault(msg, 15, false),
    frozenSupplyList: jspb.Message.toObjectList(msg.getFrozenSupplyList(),
    proto.protocol.Account.Frozen.toObject, includeInstance),
    assetIssuedName: msg.getAssetIssuedName_asB64(),
    assetIssuedId: msg.getAssetIssuedId_asB64(),
    latestAssetOperationTimeMap: (f = msg.getLatestAssetOperationTimeMap()) ? f.toObject(includeInstance, undefined) : [],
    latestAssetOperationTimev2Map: (f = msg.getLatestAssetOperationTimev2Map()) ? f.toObject(includeInstance, undefined) : [],
    freeNetUsage: jspb.Message.getFieldWithDefault(msg, 19, 0),
    freeAssetNetUsageMap: (f = msg.getFreeAssetNetUsageMap()) ? f.toObject(includeInstance, undefined) : [],
    freeAssetNetUsagev2Map: (f = msg.getFreeAssetNetUsagev2Map()) ? f.toObject(includeInstance, undefined) : [],
    latestConsumeTime: jspb.Message.getFieldWithDefault(msg, 21, 0),
    latestConsumeFreeTime: jspb.Message.getFieldWithDefault(msg, 22, 0),
    accountId: msg.getAccountId_asB64(),
    accountResource: (f = msg.getAccountResource()) && proto.protocol.Account.AccountResource.toObject(includeInstance, f),
    codehash: msg.getCodehash_asB64(),
    ownerPermission: (f = msg.getOwnerPermission()) && proto.protocol.Permission.toObject(includeInstance, f),
    witnessPermission: (f = msg.getWitnessPermission()) && proto.protocol.Permission.toObject(includeInstance, f),
    activePermissionList: jspb.Message.toObjectList(msg.getActivePermissionList(),
    proto.protocol.Permission.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Account}
 */
proto.protocol.Account.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Account;
  return proto.protocol.Account.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Account} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Account}
 */
proto.protocol.Account.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAccountName(value);
      break;
    case 2:
      var value = /** @type {!proto.protocol.AccountType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAddress(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setBalance(value);
      break;
    case 5:
      var value = new proto.protocol.Vote;
      reader.readMessage(value,proto.protocol.Vote.deserializeBinaryFromReader);
      msg.addVotes(value);
      break;
    case 6:
      var value = msg.getAssetMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readInt64, null, "");
         });
      break;
    case 56:
      var value = msg.getAssetv2Map();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readInt64, null, "");
         });
      break;
    case 7:
      var value = new proto.protocol.Account.Frozen;
      reader.readMessage(value,proto.protocol.Account.Frozen.deserializeBinaryFromReader);
      msg.addFrozen(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNetUsage(value);
      break;
    case 41:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setAcquiredDelegatedFrozenBalanceForBandwidth(value);
      break;
    case 42:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDelegatedFrozenBalanceForBandwidth(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setCreateTime(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestOprationTime(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setAllowance(value);
      break;
    case 12:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestWithdrawTime(value);
      break;
    case 13:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setCode(value);
      break;
    case 14:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsWitness(value);
      break;
    case 15:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsCommittee(value);
      break;
    case 16:
      var value = new proto.protocol.Account.Frozen;
      reader.readMessage(value,proto.protocol.Account.Frozen.deserializeBinaryFromReader);
      msg.addFrozenSupply(value);
      break;
    case 17:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAssetIssuedName(value);
      break;
    case 57:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAssetIssuedId(value);
      break;
    case 18:
      var value = msg.getLatestAssetOperationTimeMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readInt64, null, "");
         });
      break;
    case 58:
      var value = msg.getLatestAssetOperationTimev2Map();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readInt64, null, "");
         });
      break;
    case 19:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFreeNetUsage(value);
      break;
    case 20:
      var value = msg.getFreeAssetNetUsageMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readInt64, null, "");
         });
      break;
    case 59:
      var value = msg.getFreeAssetNetUsagev2Map();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readInt64, null, "");
         });
      break;
    case 21:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestConsumeTime(value);
      break;
    case 22:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestConsumeFreeTime(value);
      break;
    case 23:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAccountId(value);
      break;
    case 26:
      var value = new proto.protocol.Account.AccountResource;
      reader.readMessage(value,proto.protocol.Account.AccountResource.deserializeBinaryFromReader);
      msg.setAccountResource(value);
      break;
    case 30:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setCodehash(value);
      break;
    case 31:
      var value = new proto.protocol.Permission;
      reader.readMessage(value,proto.protocol.Permission.deserializeBinaryFromReader);
      msg.setOwnerPermission(value);
      break;
    case 32:
      var value = new proto.protocol.Permission;
      reader.readMessage(value,proto.protocol.Permission.deserializeBinaryFromReader);
      msg.setWitnessPermission(value);
      break;
    case 33:
      var value = new proto.protocol.Permission;
      reader.readMessage(value,proto.protocol.Permission.deserializeBinaryFromReader);
      msg.addActivePermission(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Account.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Account} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Account.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccountName_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
  f = message.getBalance();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getVotesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      5,
      f,
      proto.protocol.Vote.serializeBinaryToWriter
    );
  }
  f = message.getAssetMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(6, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeInt64);
  }
  f = message.getAssetv2Map(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(56, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeInt64);
  }
  f = message.getFrozenList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      7,
      f,
      proto.protocol.Account.Frozen.serializeBinaryToWriter
    );
  }
  f = message.getNetUsage();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
  f = message.getAcquiredDelegatedFrozenBalanceForBandwidth();
  if (f !== 0) {
    writer.writeInt64(
      41,
      f
    );
  }
  f = message.getDelegatedFrozenBalanceForBandwidth();
  if (f !== 0) {
    writer.writeInt64(
      42,
      f
    );
  }
  f = message.getCreateTime();
  if (f !== 0) {
    writer.writeInt64(
      9,
      f
    );
  }
  f = message.getLatestOprationTime();
  if (f !== 0) {
    writer.writeInt64(
      10,
      f
    );
  }
  f = message.getAllowance();
  if (f !== 0) {
    writer.writeInt64(
      11,
      f
    );
  }
  f = message.getLatestWithdrawTime();
  if (f !== 0) {
    writer.writeInt64(
      12,
      f
    );
  }
  f = message.getCode_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      13,
      f
    );
  }
  f = message.getIsWitness();
  if (f) {
    writer.writeBool(
      14,
      f
    );
  }
  f = message.getIsCommittee();
  if (f) {
    writer.writeBool(
      15,
      f
    );
  }
  f = message.getFrozenSupplyList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      16,
      f,
      proto.protocol.Account.Frozen.serializeBinaryToWriter
    );
  }
  f = message.getAssetIssuedName_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      17,
      f
    );
  }
  f = message.getAssetIssuedId_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      57,
      f
    );
  }
  f = message.getLatestAssetOperationTimeMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(18, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeInt64);
  }
  f = message.getLatestAssetOperationTimev2Map(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(58, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeInt64);
  }
  f = message.getFreeNetUsage();
  if (f !== 0) {
    writer.writeInt64(
      19,
      f
    );
  }
  f = message.getFreeAssetNetUsageMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(20, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeInt64);
  }
  f = message.getFreeAssetNetUsagev2Map(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(59, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeInt64);
  }
  f = message.getLatestConsumeTime();
  if (f !== 0) {
    writer.writeInt64(
      21,
      f
    );
  }
  f = message.getLatestConsumeFreeTime();
  if (f !== 0) {
    writer.writeInt64(
      22,
      f
    );
  }
  f = message.getAccountId_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      23,
      f
    );
  }
  f = message.getAccountResource();
  if (f != null) {
    writer.writeMessage(
      26,
      f,
      proto.protocol.Account.AccountResource.serializeBinaryToWriter
    );
  }
  f = message.getCodehash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      30,
      f
    );
  }
  f = message.getOwnerPermission();
  if (f != null) {
    writer.writeMessage(
      31,
      f,
      proto.protocol.Permission.serializeBinaryToWriter
    );
  }
  f = message.getWitnessPermission();
  if (f != null) {
    writer.writeMessage(
      32,
      f,
      proto.protocol.Permission.serializeBinaryToWriter
    );
  }
  f = message.getActivePermissionList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      33,
      f,
      proto.protocol.Permission.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Account.Frozen.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Account.Frozen.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Account.Frozen} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Account.Frozen.toObject = function(includeInstance, msg) {
  var f, obj = {
    frozenBalance: jspb.Message.getFieldWithDefault(msg, 1, 0),
    expireTime: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Account.Frozen}
 */
proto.protocol.Account.Frozen.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Account.Frozen;
  return proto.protocol.Account.Frozen.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Account.Frozen} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Account.Frozen}
 */
proto.protocol.Account.Frozen.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFrozenBalance(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExpireTime(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Account.Frozen.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Account.Frozen.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Account.Frozen} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Account.Frozen.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFrozenBalance();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getExpireTime();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional int64 frozen_balance = 1;
 * @return {number}
 */
proto.protocol.Account.Frozen.prototype.getFrozenBalance = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.Account.Frozen.prototype.setFrozenBalance = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int64 expire_time = 2;
 * @return {number}
 */
proto.protocol.Account.Frozen.prototype.getExpireTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.Account.Frozen.prototype.setExpireTime = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Account.AccountResource.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Account.AccountResource.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Account.AccountResource} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Account.AccountResource.toObject = function(includeInstance, msg) {
  var f, obj = {
    energyUsage: jspb.Message.getFieldWithDefault(msg, 1, 0),
    frozenBalanceForEnergy: (f = msg.getFrozenBalanceForEnergy()) && proto.protocol.Account.Frozen.toObject(includeInstance, f),
    latestConsumeTimeForEnergy: jspb.Message.getFieldWithDefault(msg, 3, 0),
    acquiredDelegatedFrozenBalanceForEnergy: jspb.Message.getFieldWithDefault(msg, 4, 0),
    delegatedFrozenBalanceForEnergy: jspb.Message.getFieldWithDefault(msg, 5, 0),
    storageLimit: jspb.Message.getFieldWithDefault(msg, 6, 0),
    storageUsage: jspb.Message.getFieldWithDefault(msg, 7, 0),
    latestExchangeStorageTime: jspb.Message.getFieldWithDefault(msg, 8, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Account.AccountResource}
 */
proto.protocol.Account.AccountResource.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Account.AccountResource;
  return proto.protocol.Account.AccountResource.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Account.AccountResource} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Account.AccountResource}
 */
proto.protocol.Account.AccountResource.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setEnergyUsage(value);
      break;
    case 2:
      var value = new proto.protocol.Account.Frozen;
      reader.readMessage(value,proto.protocol.Account.Frozen.deserializeBinaryFromReader);
      msg.setFrozenBalanceForEnergy(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestConsumeTimeForEnergy(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setAcquiredDelegatedFrozenBalanceForEnergy(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDelegatedFrozenBalanceForEnergy(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setStorageLimit(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setStorageUsage(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestExchangeStorageTime(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Account.AccountResource.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Account.AccountResource.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Account.AccountResource} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Account.AccountResource.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEnergyUsage();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getFrozenBalanceForEnergy();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.protocol.Account.Frozen.serializeBinaryToWriter
    );
  }
  f = message.getLatestConsumeTimeForEnergy();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getAcquiredDelegatedFrozenBalanceForEnergy();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getDelegatedFrozenBalanceForEnergy();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getStorageLimit();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getStorageUsage();
  if (f !== 0) {
    writer.writeInt64(
      7,
      f
    );
  }
  f = message.getLatestExchangeStorageTime();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
};


/**
 * optional int64 energy_usage = 1;
 * @return {number}
 */
proto.protocol.Account.AccountResource.prototype.getEnergyUsage = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.Account.AccountResource.prototype.setEnergyUsage = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional Frozen frozen_balance_for_energy = 2;
 * @return {?proto.protocol.Account.Frozen}
 */
proto.protocol.Account.AccountResource.prototype.getFrozenBalanceForEnergy = function() {
  return /** @type{?proto.protocol.Account.Frozen} */ (
    jspb.Message.getWrapperField(this, proto.protocol.Account.Frozen, 2));
};


/** @param {?proto.protocol.Account.Frozen|undefined} value */
proto.protocol.Account.AccountResource.prototype.setFrozenBalanceForEnergy = function(value) {
  jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.Account.AccountResource.prototype.clearFrozenBalanceForEnergy = function() {
  this.setFrozenBalanceForEnergy(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.Account.AccountResource.prototype.hasFrozenBalanceForEnergy = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional int64 latest_consume_time_for_energy = 3;
 * @return {number}
 */
proto.protocol.Account.AccountResource.prototype.getLatestConsumeTimeForEnergy = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.Account.AccountResource.prototype.setLatestConsumeTimeForEnergy = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 acquired_delegated_frozen_balance_for_energy = 4;
 * @return {number}
 */
proto.protocol.Account.AccountResource.prototype.getAcquiredDelegatedFrozenBalanceForEnergy = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.Account.AccountResource.prototype.setAcquiredDelegatedFrozenBalanceForEnergy = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int64 delegated_frozen_balance_for_energy = 5;
 * @return {number}
 */
proto.protocol.Account.AccountResource.prototype.getDelegatedFrozenBalanceForEnergy = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.Account.AccountResource.prototype.setDelegatedFrozenBalanceForEnergy = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int64 storage_limit = 6;
 * @return {number}
 */
proto.protocol.Account.AccountResource.prototype.getStorageLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.Account.AccountResource.prototype.setStorageLimit = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional int64 storage_usage = 7;
 * @return {number}
 */
proto.protocol.Account.AccountResource.prototype.getStorageUsage = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.protocol.Account.AccountResource.prototype.setStorageUsage = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional int64 latest_exchange_storage_time = 8;
 * @return {number}
 */
proto.protocol.Account.AccountResource.prototype.getLatestExchangeStorageTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {number} value */
proto.protocol.Account.AccountResource.prototype.setLatestExchangeStorageTime = function(value) {
  jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional bytes account_name = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Account.prototype.getAccountName = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes account_name = 1;
 * This is a type-conversion wrapper around `getAccountName()`
 * @return {string}
 */
proto.protocol.Account.prototype.getAccountName_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAccountName()));
};


/**
 * optional bytes account_name = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAccountName()`
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.getAccountName_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAccountName()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Account.prototype.setAccountName = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional AccountType type = 2;
 * @return {!proto.protocol.AccountType}
 */
proto.protocol.Account.prototype.getType = function() {
  return /** @type {!proto.protocol.AccountType} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {!proto.protocol.AccountType} value */
proto.protocol.Account.prototype.setType = function(value) {
  jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional bytes address = 3;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Account.prototype.getAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes address = 3;
 * This is a type-conversion wrapper around `getAddress()`
 * @return {string}
 */
proto.protocol.Account.prototype.getAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAddress()));
};


/**
 * optional bytes address = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.getAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Account.prototype.setAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * optional int64 balance = 4;
 * @return {number}
 */
proto.protocol.Account.prototype.getBalance = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setBalance = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * repeated Vote votes = 5;
 * @return {!Array<!proto.protocol.Vote>}
 */
proto.protocol.Account.prototype.getVotesList = function() {
  return /** @type{!Array<!proto.protocol.Vote>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Vote, 5));
};


/** @param {!Array<!proto.protocol.Vote>} value */
proto.protocol.Account.prototype.setVotesList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 5, value);
};


/**
 * @param {!proto.protocol.Vote=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Vote}
 */
proto.protocol.Account.prototype.addVotes = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.protocol.Vote, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Account.prototype.clearVotesList = function() {
  this.setVotesList([]);
};


/**
 * map<string, int64> asset = 6;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,number>}
 */
proto.protocol.Account.prototype.getAssetMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,number>} */ (
      jspb.Message.getMapField(this, 6, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.Account.prototype.clearAssetMap = function() {
  this.getAssetMap().clear();
};


/**
 * map<string, int64> assetV2 = 56;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,number>}
 */
proto.protocol.Account.prototype.getAssetv2Map = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,number>} */ (
      jspb.Message.getMapField(this, 56, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.Account.prototype.clearAssetv2Map = function() {
  this.getAssetv2Map().clear();
};


/**
 * repeated Frozen frozen = 7;
 * @return {!Array<!proto.protocol.Account.Frozen>}
 */
proto.protocol.Account.prototype.getFrozenList = function() {
  return /** @type{!Array<!proto.protocol.Account.Frozen>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Account.Frozen, 7));
};


/** @param {!Array<!proto.protocol.Account.Frozen>} value */
proto.protocol.Account.prototype.setFrozenList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 7, value);
};


/**
 * @param {!proto.protocol.Account.Frozen=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Account.Frozen}
 */
proto.protocol.Account.prototype.addFrozen = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 7, opt_value, proto.protocol.Account.Frozen, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Account.prototype.clearFrozenList = function() {
  this.setFrozenList([]);
};


/**
 * optional int64 net_usage = 8;
 * @return {number}
 */
proto.protocol.Account.prototype.getNetUsage = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setNetUsage = function(value) {
  jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional int64 acquired_delegated_frozen_balance_for_bandwidth = 41;
 * @return {number}
 */
proto.protocol.Account.prototype.getAcquiredDelegatedFrozenBalanceForBandwidth = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 41, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setAcquiredDelegatedFrozenBalanceForBandwidth = function(value) {
  jspb.Message.setProto3IntField(this, 41, value);
};


/**
 * optional int64 delegated_frozen_balance_for_bandwidth = 42;
 * @return {number}
 */
proto.protocol.Account.prototype.getDelegatedFrozenBalanceForBandwidth = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 42, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setDelegatedFrozenBalanceForBandwidth = function(value) {
  jspb.Message.setProto3IntField(this, 42, value);
};


/**
 * optional int64 create_time = 9;
 * @return {number}
 */
proto.protocol.Account.prototype.getCreateTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setCreateTime = function(value) {
  jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional int64 latest_opration_time = 10;
 * @return {number}
 */
proto.protocol.Account.prototype.getLatestOprationTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setLatestOprationTime = function(value) {
  jspb.Message.setProto3IntField(this, 10, value);
};


/**
 * optional int64 allowance = 11;
 * @return {number}
 */
proto.protocol.Account.prototype.getAllowance = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 11, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setAllowance = function(value) {
  jspb.Message.setProto3IntField(this, 11, value);
};


/**
 * optional int64 latest_withdraw_time = 12;
 * @return {number}
 */
proto.protocol.Account.prototype.getLatestWithdrawTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 12, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setLatestWithdrawTime = function(value) {
  jspb.Message.setProto3IntField(this, 12, value);
};


/**
 * optional bytes code = 13;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Account.prototype.getCode = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 13, ""));
};


/**
 * optional bytes code = 13;
 * This is a type-conversion wrapper around `getCode()`
 * @return {string}
 */
proto.protocol.Account.prototype.getCode_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getCode()));
};


/**
 * optional bytes code = 13;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getCode()`
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.getCode_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getCode()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Account.prototype.setCode = function(value) {
  jspb.Message.setProto3BytesField(this, 13, value);
};


/**
 * optional bool is_witness = 14;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.Account.prototype.getIsWitness = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 14, false));
};


/** @param {boolean} value */
proto.protocol.Account.prototype.setIsWitness = function(value) {
  jspb.Message.setProto3BooleanField(this, 14, value);
};


/**
 * optional bool is_committee = 15;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.Account.prototype.getIsCommittee = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 15, false));
};


/** @param {boolean} value */
proto.protocol.Account.prototype.setIsCommittee = function(value) {
  jspb.Message.setProto3BooleanField(this, 15, value);
};


/**
 * repeated Frozen frozen_supply = 16;
 * @return {!Array<!proto.protocol.Account.Frozen>}
 */
proto.protocol.Account.prototype.getFrozenSupplyList = function() {
  return /** @type{!Array<!proto.protocol.Account.Frozen>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Account.Frozen, 16));
};


/** @param {!Array<!proto.protocol.Account.Frozen>} value */
proto.protocol.Account.prototype.setFrozenSupplyList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 16, value);
};


/**
 * @param {!proto.protocol.Account.Frozen=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Account.Frozen}
 */
proto.protocol.Account.prototype.addFrozenSupply = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 16, opt_value, proto.protocol.Account.Frozen, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Account.prototype.clearFrozenSupplyList = function() {
  this.setFrozenSupplyList([]);
};


/**
 * optional bytes asset_issued_name = 17;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Account.prototype.getAssetIssuedName = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 17, ""));
};


/**
 * optional bytes asset_issued_name = 17;
 * This is a type-conversion wrapper around `getAssetIssuedName()`
 * @return {string}
 */
proto.protocol.Account.prototype.getAssetIssuedName_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAssetIssuedName()));
};


/**
 * optional bytes asset_issued_name = 17;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAssetIssuedName()`
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.getAssetIssuedName_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAssetIssuedName()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Account.prototype.setAssetIssuedName = function(value) {
  jspb.Message.setProto3BytesField(this, 17, value);
};


/**
 * optional bytes asset_issued_ID = 57;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Account.prototype.getAssetIssuedId = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 57, ""));
};


/**
 * optional bytes asset_issued_ID = 57;
 * This is a type-conversion wrapper around `getAssetIssuedId()`
 * @return {string}
 */
proto.protocol.Account.prototype.getAssetIssuedId_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAssetIssuedId()));
};


/**
 * optional bytes asset_issued_ID = 57;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAssetIssuedId()`
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.getAssetIssuedId_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAssetIssuedId()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Account.prototype.setAssetIssuedId = function(value) {
  jspb.Message.setProto3BytesField(this, 57, value);
};


/**
 * map<string, int64> latest_asset_operation_time = 18;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,number>}
 */
proto.protocol.Account.prototype.getLatestAssetOperationTimeMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,number>} */ (
      jspb.Message.getMapField(this, 18, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.Account.prototype.clearLatestAssetOperationTimeMap = function() {
  this.getLatestAssetOperationTimeMap().clear();
};


/**
 * map<string, int64> latest_asset_operation_timeV2 = 58;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,number>}
 */
proto.protocol.Account.prototype.getLatestAssetOperationTimev2Map = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,number>} */ (
      jspb.Message.getMapField(this, 58, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.Account.prototype.clearLatestAssetOperationTimev2Map = function() {
  this.getLatestAssetOperationTimev2Map().clear();
};


/**
 * optional int64 free_net_usage = 19;
 * @return {number}
 */
proto.protocol.Account.prototype.getFreeNetUsage = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 19, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setFreeNetUsage = function(value) {
  jspb.Message.setProto3IntField(this, 19, value);
};


/**
 * map<string, int64> free_asset_net_usage = 20;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,number>}
 */
proto.protocol.Account.prototype.getFreeAssetNetUsageMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,number>} */ (
      jspb.Message.getMapField(this, 20, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.Account.prototype.clearFreeAssetNetUsageMap = function() {
  this.getFreeAssetNetUsageMap().clear();
};


/**
 * map<string, int64> free_asset_net_usageV2 = 59;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,number>}
 */
proto.protocol.Account.prototype.getFreeAssetNetUsagev2Map = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,number>} */ (
      jspb.Message.getMapField(this, 59, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.Account.prototype.clearFreeAssetNetUsagev2Map = function() {
  this.getFreeAssetNetUsagev2Map().clear();
};


/**
 * optional int64 latest_consume_time = 21;
 * @return {number}
 */
proto.protocol.Account.prototype.getLatestConsumeTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 21, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setLatestConsumeTime = function(value) {
  jspb.Message.setProto3IntField(this, 21, value);
};


/**
 * optional int64 latest_consume_free_time = 22;
 * @return {number}
 */
proto.protocol.Account.prototype.getLatestConsumeFreeTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 22, 0));
};


/** @param {number} value */
proto.protocol.Account.prototype.setLatestConsumeFreeTime = function(value) {
  jspb.Message.setProto3IntField(this, 22, value);
};


/**
 * optional bytes account_id = 23;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Account.prototype.getAccountId = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 23, ""));
};


/**
 * optional bytes account_id = 23;
 * This is a type-conversion wrapper around `getAccountId()`
 * @return {string}
 */
proto.protocol.Account.prototype.getAccountId_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAccountId()));
};


/**
 * optional bytes account_id = 23;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAccountId()`
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.getAccountId_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAccountId()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Account.prototype.setAccountId = function(value) {
  jspb.Message.setProto3BytesField(this, 23, value);
};


/**
 * optional AccountResource account_resource = 26;
 * @return {?proto.protocol.Account.AccountResource}
 */
proto.protocol.Account.prototype.getAccountResource = function() {
  return /** @type{?proto.protocol.Account.AccountResource} */ (
    jspb.Message.getWrapperField(this, proto.protocol.Account.AccountResource, 26));
};


/** @param {?proto.protocol.Account.AccountResource|undefined} value */
proto.protocol.Account.prototype.setAccountResource = function(value) {
  jspb.Message.setWrapperField(this, 26, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.Account.prototype.clearAccountResource = function() {
  this.setAccountResource(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.Account.prototype.hasAccountResource = function() {
  return jspb.Message.getField(this, 26) != null;
};


/**
 * optional bytes codeHash = 30;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Account.prototype.getCodehash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 30, ""));
};


/**
 * optional bytes codeHash = 30;
 * This is a type-conversion wrapper around `getCodehash()`
 * @return {string}
 */
proto.protocol.Account.prototype.getCodehash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getCodehash()));
};


/**
 * optional bytes codeHash = 30;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getCodehash()`
 * @return {!Uint8Array}
 */
proto.protocol.Account.prototype.getCodehash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getCodehash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Account.prototype.setCodehash = function(value) {
  jspb.Message.setProto3BytesField(this, 30, value);
};


/**
 * optional Permission owner_permission = 31;
 * @return {?proto.protocol.Permission}
 */
proto.protocol.Account.prototype.getOwnerPermission = function() {
  return /** @type{?proto.protocol.Permission} */ (
    jspb.Message.getWrapperField(this, proto.protocol.Permission, 31));
};


/** @param {?proto.protocol.Permission|undefined} value */
proto.protocol.Account.prototype.setOwnerPermission = function(value) {
  jspb.Message.setWrapperField(this, 31, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.Account.prototype.clearOwnerPermission = function() {
  this.setOwnerPermission(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.Account.prototype.hasOwnerPermission = function() {
  return jspb.Message.getField(this, 31) != null;
};


/**
 * optional Permission witness_permission = 32;
 * @return {?proto.protocol.Permission}
 */
proto.protocol.Account.prototype.getWitnessPermission = function() {
  return /** @type{?proto.protocol.Permission} */ (
    jspb.Message.getWrapperField(this, proto.protocol.Permission, 32));
};


/** @param {?proto.protocol.Permission|undefined} value */
proto.protocol.Account.prototype.setWitnessPermission = function(value) {
  jspb.Message.setWrapperField(this, 32, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.Account.prototype.clearWitnessPermission = function() {
  this.setWitnessPermission(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.Account.prototype.hasWitnessPermission = function() {
  return jspb.Message.getField(this, 32) != null;
};


/**
 * repeated Permission active_permission = 33;
 * @return {!Array<!proto.protocol.Permission>}
 */
proto.protocol.Account.prototype.getActivePermissionList = function() {
  return /** @type{!Array<!proto.protocol.Permission>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Permission, 33));
};


/** @param {!Array<!proto.protocol.Permission>} value */
proto.protocol.Account.prototype.setActivePermissionList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 33, value);
};


/**
 * @param {!proto.protocol.Permission=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Permission}
 */
proto.protocol.Account.prototype.addActivePermission = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 33, opt_value, proto.protocol.Permission, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Account.prototype.clearActivePermissionList = function() {
  this.setActivePermissionList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Key.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Key.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Key} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Key.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: msg.getAddress_asB64(),
    weight: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Key}
 */
proto.protocol.Key.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Key;
  return proto.protocol.Key.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Key} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Key}
 */
proto.protocol.Key.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setWeight(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Key.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Key.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Key} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Key.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getWeight();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional bytes address = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Key.prototype.getAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes address = 1;
 * This is a type-conversion wrapper around `getAddress()`
 * @return {string}
 */
proto.protocol.Key.prototype.getAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAddress()));
};


/**
 * optional bytes address = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.Key.prototype.getAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Key.prototype.setAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 weight = 2;
 * @return {number}
 */
proto.protocol.Key.prototype.getWeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.Key.prototype.setWeight = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.DelegatedResource.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.DelegatedResource.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.DelegatedResource} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DelegatedResource.toObject = function(includeInstance, msg) {
  var f, obj = {
    from: msg.getFrom_asB64(),
    to: msg.getTo_asB64(),
    frozenBalanceForBandwidth: jspb.Message.getFieldWithDefault(msg, 3, 0),
    frozenBalanceForEnergy: jspb.Message.getFieldWithDefault(msg, 4, 0),
    expireTimeForBandwidth: jspb.Message.getFieldWithDefault(msg, 5, 0),
    expireTimeForEnergy: jspb.Message.getFieldWithDefault(msg, 6, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.DelegatedResource}
 */
proto.protocol.DelegatedResource.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.DelegatedResource;
  return proto.protocol.DelegatedResource.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.DelegatedResource} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.DelegatedResource}
 */
proto.protocol.DelegatedResource.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setFrom(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setTo(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFrozenBalanceForBandwidth(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFrozenBalanceForEnergy(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExpireTimeForBandwidth(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExpireTimeForEnergy(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.DelegatedResource.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.DelegatedResource.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.DelegatedResource} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DelegatedResource.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFrom_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getTo_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getFrozenBalanceForBandwidth();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getFrozenBalanceForEnergy();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getExpireTimeForBandwidth();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getExpireTimeForEnergy();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
};


/**
 * optional bytes from = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.DelegatedResource.prototype.getFrom = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes from = 1;
 * This is a type-conversion wrapper around `getFrom()`
 * @return {string}
 */
proto.protocol.DelegatedResource.prototype.getFrom_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getFrom()));
};


/**
 * optional bytes from = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getFrom()`
 * @return {!Uint8Array}
 */
proto.protocol.DelegatedResource.prototype.getFrom_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getFrom()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.DelegatedResource.prototype.setFrom = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional bytes to = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.DelegatedResource.prototype.getTo = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes to = 2;
 * This is a type-conversion wrapper around `getTo()`
 * @return {string}
 */
proto.protocol.DelegatedResource.prototype.getTo_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getTo()));
};


/**
 * optional bytes to = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTo()`
 * @return {!Uint8Array}
 */
proto.protocol.DelegatedResource.prototype.getTo_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getTo()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.DelegatedResource.prototype.setTo = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional int64 frozen_balance_for_bandwidth = 3;
 * @return {number}
 */
proto.protocol.DelegatedResource.prototype.getFrozenBalanceForBandwidth = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.DelegatedResource.prototype.setFrozenBalanceForBandwidth = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 frozen_balance_for_energy = 4;
 * @return {number}
 */
proto.protocol.DelegatedResource.prototype.getFrozenBalanceForEnergy = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.DelegatedResource.prototype.setFrozenBalanceForEnergy = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int64 expire_time_for_bandwidth = 5;
 * @return {number}
 */
proto.protocol.DelegatedResource.prototype.getExpireTimeForBandwidth = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.DelegatedResource.prototype.setExpireTimeForBandwidth = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int64 expire_time_for_energy = 6;
 * @return {number}
 */
proto.protocol.DelegatedResource.prototype.getExpireTimeForEnergy = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.DelegatedResource.prototype.setExpireTimeForEnergy = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.authority.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.authority.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.authority} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.authority.toObject = function(includeInstance, msg) {
  var f, obj = {
    account: (f = msg.getAccount()) && proto.protocol.AccountId.toObject(includeInstance, f),
    permissionName: msg.getPermissionName_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.authority}
 */
proto.protocol.authority.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.authority;
  return proto.protocol.authority.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.authority} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.authority}
 */
proto.protocol.authority.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.AccountId;
      reader.readMessage(value,proto.protocol.AccountId.deserializeBinaryFromReader);
      msg.setAccount(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setPermissionName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.authority.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.authority.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.authority} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.authority.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccount();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.protocol.AccountId.serializeBinaryToWriter
    );
  }
  f = message.getPermissionName_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
};


/**
 * optional AccountId account = 1;
 * @return {?proto.protocol.AccountId}
 */
proto.protocol.authority.prototype.getAccount = function() {
  return /** @type{?proto.protocol.AccountId} */ (
    jspb.Message.getWrapperField(this, proto.protocol.AccountId, 1));
};


/** @param {?proto.protocol.AccountId|undefined} value */
proto.protocol.authority.prototype.setAccount = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.authority.prototype.clearAccount = function() {
  this.setAccount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.authority.prototype.hasAccount = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bytes permission_name = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.authority.prototype.getPermissionName = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes permission_name = 2;
 * This is a type-conversion wrapper around `getPermissionName()`
 * @return {string}
 */
proto.protocol.authority.prototype.getPermissionName_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getPermissionName()));
};


/**
 * optional bytes permission_name = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getPermissionName()`
 * @return {!Uint8Array}
 */
proto.protocol.authority.prototype.getPermissionName_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getPermissionName()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.authority.prototype.setPermissionName = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Permission.repeatedFields_ = [7];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Permission.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Permission.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Permission} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Permission.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, 0),
    id: jspb.Message.getFieldWithDefault(msg, 2, 0),
    permissionName: jspb.Message.getFieldWithDefault(msg, 3, ""),
    threshold: jspb.Message.getFieldWithDefault(msg, 4, 0),
    parentId: jspb.Message.getFieldWithDefault(msg, 5, 0),
    operations: msg.getOperations_asB64(),
    keysList: jspb.Message.toObjectList(msg.getKeysList(),
    proto.protocol.Key.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Permission}
 */
proto.protocol.Permission.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Permission;
  return proto.protocol.Permission.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Permission} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Permission}
 */
proto.protocol.Permission.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.protocol.Permission.PermissionType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPermissionName(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setThreshold(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setParentId(value);
      break;
    case 6:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setOperations(value);
      break;
    case 7:
      var value = new proto.protocol.Key;
      reader.readMessage(value,proto.protocol.Key.deserializeBinaryFromReader);
      msg.addKeys(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Permission.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Permission.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Permission} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Permission.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getId();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getPermissionName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getThreshold();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getParentId();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getOperations_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      6,
      f
    );
  }
  f = message.getKeysList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      7,
      f,
      proto.protocol.Key.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.Permission.PermissionType = {
  OWNER: 0,
  WITNESS: 1,
  ACTIVE: 2
};

/**
 * optional PermissionType type = 1;
 * @return {!proto.protocol.Permission.PermissionType}
 */
proto.protocol.Permission.prototype.getType = function() {
  return /** @type {!proto.protocol.Permission.PermissionType} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {!proto.protocol.Permission.PermissionType} value */
proto.protocol.Permission.prototype.setType = function(value) {
  jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional int32 id = 2;
 * @return {number}
 */
proto.protocol.Permission.prototype.getId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.Permission.prototype.setId = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string permission_name = 3;
 * @return {string}
 */
proto.protocol.Permission.prototype.getPermissionName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/** @param {string} value */
proto.protocol.Permission.prototype.setPermissionName = function(value) {
  jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int64 threshold = 4;
 * @return {number}
 */
proto.protocol.Permission.prototype.getThreshold = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.Permission.prototype.setThreshold = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int32 parent_id = 5;
 * @return {number}
 */
proto.protocol.Permission.prototype.getParentId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.Permission.prototype.setParentId = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional bytes operations = 6;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Permission.prototype.getOperations = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * optional bytes operations = 6;
 * This is a type-conversion wrapper around `getOperations()`
 * @return {string}
 */
proto.protocol.Permission.prototype.getOperations_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getOperations()));
};


/**
 * optional bytes operations = 6;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getOperations()`
 * @return {!Uint8Array}
 */
proto.protocol.Permission.prototype.getOperations_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getOperations()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Permission.prototype.setOperations = function(value) {
  jspb.Message.setProto3BytesField(this, 6, value);
};


/**
 * repeated Key keys = 7;
 * @return {!Array<!proto.protocol.Key>}
 */
proto.protocol.Permission.prototype.getKeysList = function() {
  return /** @type{!Array<!proto.protocol.Key>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Key, 7));
};


/** @param {!Array<!proto.protocol.Key>} value */
proto.protocol.Permission.prototype.setKeysList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 7, value);
};


/**
 * @param {!proto.protocol.Key=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Key}
 */
proto.protocol.Permission.prototype.addKeys = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 7, opt_value, proto.protocol.Key, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Permission.prototype.clearKeysList = function() {
  this.setKeysList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Witness.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Witness.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Witness} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Witness.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: msg.getAddress_asB64(),
    votecount: jspb.Message.getFieldWithDefault(msg, 2, 0),
    pubkey: msg.getPubkey_asB64(),
    url: jspb.Message.getFieldWithDefault(msg, 4, ""),
    totalproduced: jspb.Message.getFieldWithDefault(msg, 5, 0),
    totalmissed: jspb.Message.getFieldWithDefault(msg, 6, 0),
    latestblocknum: jspb.Message.getFieldWithDefault(msg, 7, 0),
    latestslotnum: jspb.Message.getFieldWithDefault(msg, 8, 0),
    isjobs: jspb.Message.getFieldWithDefault(msg, 9, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Witness}
 */
proto.protocol.Witness.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Witness;
  return proto.protocol.Witness.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Witness} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Witness}
 */
proto.protocol.Witness.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setVotecount(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setPubkey(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setUrl(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTotalproduced(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTotalmissed(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestblocknum(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLatestslotnum(value);
      break;
    case 9:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsjobs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Witness.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Witness.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Witness} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Witness.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getVotecount();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getPubkey_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
  f = message.getUrl();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getTotalproduced();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getTotalmissed();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getLatestblocknum();
  if (f !== 0) {
    writer.writeInt64(
      7,
      f
    );
  }
  f = message.getLatestslotnum();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
  f = message.getIsjobs();
  if (f) {
    writer.writeBool(
      9,
      f
    );
  }
};


/**
 * optional bytes address = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Witness.prototype.getAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes address = 1;
 * This is a type-conversion wrapper around `getAddress()`
 * @return {string}
 */
proto.protocol.Witness.prototype.getAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAddress()));
};


/**
 * optional bytes address = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.Witness.prototype.getAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Witness.prototype.setAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 voteCount = 2;
 * @return {number}
 */
proto.protocol.Witness.prototype.getVotecount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.Witness.prototype.setVotecount = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional bytes pubKey = 3;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Witness.prototype.getPubkey = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes pubKey = 3;
 * This is a type-conversion wrapper around `getPubkey()`
 * @return {string}
 */
proto.protocol.Witness.prototype.getPubkey_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getPubkey()));
};


/**
 * optional bytes pubKey = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getPubkey()`
 * @return {!Uint8Array}
 */
proto.protocol.Witness.prototype.getPubkey_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getPubkey()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Witness.prototype.setPubkey = function(value) {
  jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * optional string url = 4;
 * @return {string}
 */
proto.protocol.Witness.prototype.getUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/** @param {string} value */
proto.protocol.Witness.prototype.setUrl = function(value) {
  jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional int64 totalProduced = 5;
 * @return {number}
 */
proto.protocol.Witness.prototype.getTotalproduced = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.Witness.prototype.setTotalproduced = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int64 totalMissed = 6;
 * @return {number}
 */
proto.protocol.Witness.prototype.getTotalmissed = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.Witness.prototype.setTotalmissed = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional int64 latestBlockNum = 7;
 * @return {number}
 */
proto.protocol.Witness.prototype.getLatestblocknum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.protocol.Witness.prototype.setLatestblocknum = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional int64 latestSlotNum = 8;
 * @return {number}
 */
proto.protocol.Witness.prototype.getLatestslotnum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {number} value */
proto.protocol.Witness.prototype.setLatestslotnum = function(value) {
  jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional bool isJobs = 9;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.Witness.prototype.getIsjobs = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 9, false));
};


/** @param {boolean} value */
proto.protocol.Witness.prototype.setIsjobs = function(value) {
  jspb.Message.setProto3BooleanField(this, 9, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Votes.repeatedFields_ = [2,3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Votes.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Votes.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Votes} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Votes.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: msg.getAddress_asB64(),
    oldVotesList: jspb.Message.toObjectList(msg.getOldVotesList(),
    proto.protocol.Vote.toObject, includeInstance),
    newVotesList: jspb.Message.toObjectList(msg.getNewVotesList(),
    proto.protocol.Vote.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Votes}
 */
proto.protocol.Votes.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Votes;
  return proto.protocol.Votes.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Votes} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Votes}
 */
proto.protocol.Votes.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAddress(value);
      break;
    case 2:
      var value = new proto.protocol.Vote;
      reader.readMessage(value,proto.protocol.Vote.deserializeBinaryFromReader);
      msg.addOldVotes(value);
      break;
    case 3:
      var value = new proto.protocol.Vote;
      reader.readMessage(value,proto.protocol.Vote.deserializeBinaryFromReader);
      msg.addNewVotes(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Votes.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Votes.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Votes} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Votes.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getOldVotesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.protocol.Vote.serializeBinaryToWriter
    );
  }
  f = message.getNewVotesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.protocol.Vote.serializeBinaryToWriter
    );
  }
};


/**
 * optional bytes address = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Votes.prototype.getAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes address = 1;
 * This is a type-conversion wrapper around `getAddress()`
 * @return {string}
 */
proto.protocol.Votes.prototype.getAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAddress()));
};


/**
 * optional bytes address = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.Votes.prototype.getAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Votes.prototype.setAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * repeated Vote old_votes = 2;
 * @return {!Array<!proto.protocol.Vote>}
 */
proto.protocol.Votes.prototype.getOldVotesList = function() {
  return /** @type{!Array<!proto.protocol.Vote>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Vote, 2));
};


/** @param {!Array<!proto.protocol.Vote>} value */
proto.protocol.Votes.prototype.setOldVotesList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.protocol.Vote=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Vote}
 */
proto.protocol.Votes.prototype.addOldVotes = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.protocol.Vote, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Votes.prototype.clearOldVotesList = function() {
  this.setOldVotesList([]);
};


/**
 * repeated Vote new_votes = 3;
 * @return {!Array<!proto.protocol.Vote>}
 */
proto.protocol.Votes.prototype.getNewVotesList = function() {
  return /** @type{!Array<!proto.protocol.Vote>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Vote, 3));
};


/** @param {!Array<!proto.protocol.Vote>} value */
proto.protocol.Votes.prototype.setNewVotesList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.protocol.Vote=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Vote}
 */
proto.protocol.Votes.prototype.addNewVotes = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.protocol.Vote, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Votes.prototype.clearNewVotesList = function() {
  this.setNewVotesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TXOutput.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TXOutput.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TXOutput} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXOutput.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0),
    pubkeyhash: msg.getPubkeyhash_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TXOutput}
 */
proto.protocol.TXOutput.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TXOutput;
  return proto.protocol.TXOutput.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TXOutput} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TXOutput}
 */
proto.protocol.TXOutput.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setValue(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setPubkeyhash(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TXOutput.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TXOutput.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TXOutput} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXOutput.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getPubkeyhash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
};


/**
 * optional int64 value = 1;
 * @return {number}
 */
proto.protocol.TXOutput.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.TXOutput.prototype.setValue = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional bytes pubKeyHash = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TXOutput.prototype.getPubkeyhash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes pubKeyHash = 2;
 * This is a type-conversion wrapper around `getPubkeyhash()`
 * @return {string}
 */
proto.protocol.TXOutput.prototype.getPubkeyhash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getPubkeyhash()));
};


/**
 * optional bytes pubKeyHash = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getPubkeyhash()`
 * @return {!Uint8Array}
 */
proto.protocol.TXOutput.prototype.getPubkeyhash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getPubkeyhash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TXOutput.prototype.setPubkeyhash = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TXInput.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TXInput.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TXInput} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXInput.toObject = function(includeInstance, msg) {
  var f, obj = {
    rawData: (f = msg.getRawData()) && proto.protocol.TXInput.raw.toObject(includeInstance, f),
    signature: msg.getSignature_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TXInput}
 */
proto.protocol.TXInput.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TXInput;
  return proto.protocol.TXInput.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TXInput} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TXInput}
 */
proto.protocol.TXInput.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.TXInput.raw;
      reader.readMessage(value,proto.protocol.TXInput.raw.deserializeBinaryFromReader);
      msg.setRawData(value);
      break;
    case 4:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setSignature(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TXInput.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TXInput.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TXInput} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXInput.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRawData();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.protocol.TXInput.raw.serializeBinaryToWriter
    );
  }
  f = message.getSignature_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      4,
      f
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TXInput.raw.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TXInput.raw.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TXInput.raw} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXInput.raw.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: msg.getTxid_asB64(),
    vout: jspb.Message.getFieldWithDefault(msg, 2, 0),
    pubkey: msg.getPubkey_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TXInput.raw}
 */
proto.protocol.TXInput.raw.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TXInput.raw;
  return proto.protocol.TXInput.raw.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TXInput.raw} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TXInput.raw}
 */
proto.protocol.TXInput.raw.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setTxid(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setVout(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setPubkey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TXInput.raw.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TXInput.raw.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TXInput.raw} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXInput.raw.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getVout();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getPubkey_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
};


/**
 * optional bytes txID = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TXInput.raw.prototype.getTxid = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes txID = 1;
 * This is a type-conversion wrapper around `getTxid()`
 * @return {string}
 */
proto.protocol.TXInput.raw.prototype.getTxid_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getTxid()));
};


/**
 * optional bytes txID = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTxid()`
 * @return {!Uint8Array}
 */
proto.protocol.TXInput.raw.prototype.getTxid_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getTxid()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TXInput.raw.prototype.setTxid = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 vout = 2;
 * @return {number}
 */
proto.protocol.TXInput.raw.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.TXInput.raw.prototype.setVout = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional bytes pubKey = 3;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TXInput.raw.prototype.getPubkey = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes pubKey = 3;
 * This is a type-conversion wrapper around `getPubkey()`
 * @return {string}
 */
proto.protocol.TXInput.raw.prototype.getPubkey_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getPubkey()));
};


/**
 * optional bytes pubKey = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getPubkey()`
 * @return {!Uint8Array}
 */
proto.protocol.TXInput.raw.prototype.getPubkey_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getPubkey()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TXInput.raw.prototype.setPubkey = function(value) {
  jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * optional raw raw_data = 1;
 * @return {?proto.protocol.TXInput.raw}
 */
proto.protocol.TXInput.prototype.getRawData = function() {
  return /** @type{?proto.protocol.TXInput.raw} */ (
    jspb.Message.getWrapperField(this, proto.protocol.TXInput.raw, 1));
};


/** @param {?proto.protocol.TXInput.raw|undefined} value */
proto.protocol.TXInput.prototype.setRawData = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.TXInput.prototype.clearRawData = function() {
  this.setRawData(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.TXInput.prototype.hasRawData = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bytes signature = 4;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TXInput.prototype.getSignature = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * optional bytes signature = 4;
 * This is a type-conversion wrapper around `getSignature()`
 * @return {string}
 */
proto.protocol.TXInput.prototype.getSignature_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getSignature()));
};


/**
 * optional bytes signature = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getSignature()`
 * @return {!Uint8Array}
 */
proto.protocol.TXInput.prototype.getSignature_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getSignature()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TXInput.prototype.setSignature = function(value) {
  jspb.Message.setProto3BytesField(this, 4, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.TXOutputs.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TXOutputs.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TXOutputs.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TXOutputs} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXOutputs.toObject = function(includeInstance, msg) {
  var f, obj = {
    outputsList: jspb.Message.toObjectList(msg.getOutputsList(),
    proto.protocol.TXOutput.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TXOutputs}
 */
proto.protocol.TXOutputs.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TXOutputs;
  return proto.protocol.TXOutputs.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TXOutputs} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TXOutputs}
 */
proto.protocol.TXOutputs.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.TXOutput;
      reader.readMessage(value,proto.protocol.TXOutput.deserializeBinaryFromReader);
      msg.addOutputs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TXOutputs.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TXOutputs.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TXOutputs} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TXOutputs.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOutputsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.protocol.TXOutput.serializeBinaryToWriter
    );
  }
};


/**
 * repeated TXOutput outputs = 1;
 * @return {!Array<!proto.protocol.TXOutput>}
 */
proto.protocol.TXOutputs.prototype.getOutputsList = function() {
  return /** @type{!Array<!proto.protocol.TXOutput>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.TXOutput, 1));
};


/** @param {!Array<!proto.protocol.TXOutput>} value */
proto.protocol.TXOutputs.prototype.setOutputsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.protocol.TXOutput=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.TXOutput}
 */
proto.protocol.TXOutputs.prototype.addOutputs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.protocol.TXOutput, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.TXOutputs.prototype.clearOutputsList = function() {
  this.setOutputsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.ResourceReceipt.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.ResourceReceipt.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.ResourceReceipt} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ResourceReceipt.toObject = function(includeInstance, msg) {
  var f, obj = {
    energyUsage: jspb.Message.getFieldWithDefault(msg, 1, 0),
    energyFee: jspb.Message.getFieldWithDefault(msg, 2, 0),
    originEnergyUsage: jspb.Message.getFieldWithDefault(msg, 3, 0),
    energyUsageTotal: jspb.Message.getFieldWithDefault(msg, 4, 0),
    netUsage: jspb.Message.getFieldWithDefault(msg, 5, 0),
    netFee: jspb.Message.getFieldWithDefault(msg, 6, 0),
    result: jspb.Message.getFieldWithDefault(msg, 7, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.ResourceReceipt}
 */
proto.protocol.ResourceReceipt.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.ResourceReceipt;
  return proto.protocol.ResourceReceipt.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.ResourceReceipt} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.ResourceReceipt}
 */
proto.protocol.ResourceReceipt.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setEnergyUsage(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setEnergyFee(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setOriginEnergyUsage(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setEnergyUsageTotal(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNetUsage(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNetFee(value);
      break;
    case 7:
      var value = /** @type {!proto.protocol.Transaction.Result.contractResult} */ (reader.readEnum());
      msg.setResult(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.ResourceReceipt.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.ResourceReceipt.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.ResourceReceipt} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ResourceReceipt.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEnergyUsage();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getEnergyFee();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getOriginEnergyUsage();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getEnergyUsageTotal();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getNetUsage();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getNetFee();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getResult();
  if (f !== 0.0) {
    writer.writeEnum(
      7,
      f
    );
  }
};


/**
 * optional int64 energy_usage = 1;
 * @return {number}
 */
proto.protocol.ResourceReceipt.prototype.getEnergyUsage = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.ResourceReceipt.prototype.setEnergyUsage = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int64 energy_fee = 2;
 * @return {number}
 */
proto.protocol.ResourceReceipt.prototype.getEnergyFee = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.ResourceReceipt.prototype.setEnergyFee = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int64 origin_energy_usage = 3;
 * @return {number}
 */
proto.protocol.ResourceReceipt.prototype.getOriginEnergyUsage = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.ResourceReceipt.prototype.setOriginEnergyUsage = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 energy_usage_total = 4;
 * @return {number}
 */
proto.protocol.ResourceReceipt.prototype.getEnergyUsageTotal = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.ResourceReceipt.prototype.setEnergyUsageTotal = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int64 net_usage = 5;
 * @return {number}
 */
proto.protocol.ResourceReceipt.prototype.getNetUsage = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.ResourceReceipt.prototype.setNetUsage = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int64 net_fee = 6;
 * @return {number}
 */
proto.protocol.ResourceReceipt.prototype.getNetFee = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.ResourceReceipt.prototype.setNetFee = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional Transaction.Result.contractResult result = 7;
 * @return {!proto.protocol.Transaction.Result.contractResult}
 */
proto.protocol.ResourceReceipt.prototype.getResult = function() {
  return /** @type {!proto.protocol.Transaction.Result.contractResult} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {!proto.protocol.Transaction.Result.contractResult} value */
proto.protocol.ResourceReceipt.prototype.setResult = function(value) {
  jspb.Message.setProto3EnumField(this, 7, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Transaction.repeatedFields_ = [2,5];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Transaction.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Transaction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Transaction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.toObject = function(includeInstance, msg) {
  var f, obj = {
    rawData: (f = msg.getRawData()) && proto.protocol.Transaction.raw.toObject(includeInstance, f),
    signatureList: msg.getSignatureList_asB64(),
    retList: jspb.Message.toObjectList(msg.getRetList(),
    proto.protocol.Transaction.Result.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Transaction}
 */
proto.protocol.Transaction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Transaction;
  return proto.protocol.Transaction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Transaction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Transaction}
 */
proto.protocol.Transaction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.Transaction.raw;
      reader.readMessage(value,proto.protocol.Transaction.raw.deserializeBinaryFromReader);
      msg.setRawData(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.addSignature(value);
      break;
    case 5:
      var value = new proto.protocol.Transaction.Result;
      reader.readMessage(value,proto.protocol.Transaction.Result.deserializeBinaryFromReader);
      msg.addRet(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Transaction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Transaction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRawData();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.protocol.Transaction.raw.serializeBinaryToWriter
    );
  }
  f = message.getSignatureList_asU8();
  if (f.length > 0) {
    writer.writeRepeatedBytes(
      2,
      f
    );
  }
  f = message.getRetList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      5,
      f,
      proto.protocol.Transaction.Result.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Transaction.Contract.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Transaction.Contract.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Transaction.Contract} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.Contract.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, 0),
    parameter: (f = msg.getParameter()) && google_protobuf_any_pb.Any.toObject(includeInstance, f),
    provider: msg.getProvider_asB64(),
    contractname: msg.getContractname_asB64(),
    permissionId: jspb.Message.getFieldWithDefault(msg, 5, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Transaction.Contract}
 */
proto.protocol.Transaction.Contract.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Transaction.Contract;
  return proto.protocol.Transaction.Contract.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Transaction.Contract} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Transaction.Contract}
 */
proto.protocol.Transaction.Contract.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.protocol.Transaction.Contract.ContractType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 2:
      var value = new google_protobuf_any_pb.Any;
      reader.readMessage(value,google_protobuf_any_pb.Any.deserializeBinaryFromReader);
      msg.setParameter(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setProvider(value);
      break;
    case 4:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setContractname(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPermissionId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.Contract.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Transaction.Contract.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Transaction.Contract} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.Contract.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getParameter();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_any_pb.Any.serializeBinaryToWriter
    );
  }
  f = message.getProvider_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
  f = message.getContractname_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      4,
      f
    );
  }
  f = message.getPermissionId();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.Transaction.Contract.ContractType = {
  ACCOUNTCREATECONTRACT: 0,
  TRANSFERCONTRACT: 1,
  TRANSFERASSETCONTRACT: 2,
  VOTEASSETCONTRACT: 3,
  VOTEWITNESSCONTRACT: 4,
  WITNESSCREATECONTRACT: 5,
  ASSETISSUECONTRACT: 6,
  WITNESSUPDATECONTRACT: 8,
  PARTICIPATEASSETISSUECONTRACT: 9,
  ACCOUNTUPDATECONTRACT: 10,
  FREEZEBALANCECONTRACT: 11,
  UNFREEZEBALANCECONTRACT: 12,
  WITHDRAWBALANCECONTRACT: 13,
  UNFREEZEASSETCONTRACT: 14,
  UPDATEASSETCONTRACT: 15,
  PROPOSALCREATECONTRACT: 16,
  PROPOSALAPPROVECONTRACT: 17,
  PROPOSALDELETECONTRACT: 18,
  SETACCOUNTIDCONTRACT: 19,
  CUSTOMCONTRACT: 20,
  CREATESMARTCONTRACT: 30,
  TRIGGERSMARTCONTRACT: 31,
  GETCONTRACT: 32,
  UPDATESETTINGCONTRACT: 33,
  EXCHANGECREATECONTRACT: 41,
  EXCHANGEINJECTCONTRACT: 42,
  EXCHANGEWITHDRAWCONTRACT: 43,
  EXCHANGETRANSACTIONCONTRACT: 44,
  UPDATEENERGYLIMITCONTRACT: 45,
  ACCOUNTPERMISSIONUPDATECONTRACT: 46,
  CLEARABICONTRACT: 48
};

/**
 * optional ContractType type = 1;
 * @return {!proto.protocol.Transaction.Contract.ContractType}
 */
proto.protocol.Transaction.Contract.prototype.getType = function() {
  return /** @type {!proto.protocol.Transaction.Contract.ContractType} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {!proto.protocol.Transaction.Contract.ContractType} value */
proto.protocol.Transaction.Contract.prototype.setType = function(value) {
  jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional google.protobuf.Any parameter = 2;
 * @return {?proto.google.protobuf.Any}
 */
proto.protocol.Transaction.Contract.prototype.getParameter = function() {
  return /** @type{?proto.google.protobuf.Any} */ (
    jspb.Message.getWrapperField(this, google_protobuf_any_pb.Any, 2));
};


/** @param {?proto.google.protobuf.Any|undefined} value */
proto.protocol.Transaction.Contract.prototype.setParameter = function(value) {
  jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.Transaction.Contract.prototype.clearParameter = function() {
  this.setParameter(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.Transaction.Contract.prototype.hasParameter = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional bytes provider = 3;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Transaction.Contract.prototype.getProvider = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes provider = 3;
 * This is a type-conversion wrapper around `getProvider()`
 * @return {string}
 */
proto.protocol.Transaction.Contract.prototype.getProvider_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getProvider()));
};


/**
 * optional bytes provider = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getProvider()`
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.Contract.prototype.getProvider_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getProvider()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Transaction.Contract.prototype.setProvider = function(value) {
  jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * optional bytes ContractName = 4;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Transaction.Contract.prototype.getContractname = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * optional bytes ContractName = 4;
 * This is a type-conversion wrapper around `getContractname()`
 * @return {string}
 */
proto.protocol.Transaction.Contract.prototype.getContractname_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getContractname()));
};


/**
 * optional bytes ContractName = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getContractname()`
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.Contract.prototype.getContractname_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getContractname()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Transaction.Contract.prototype.setContractname = function(value) {
  jspb.Message.setProto3BytesField(this, 4, value);
};


/**
 * optional int32 Permission_id = 5;
 * @return {number}
 */
proto.protocol.Transaction.Contract.prototype.getPermissionId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Contract.prototype.setPermissionId = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Transaction.Result.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Transaction.Result.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Transaction.Result} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.Result.toObject = function(includeInstance, msg) {
  var f, obj = {
    fee: jspb.Message.getFieldWithDefault(msg, 1, 0),
    ret: jspb.Message.getFieldWithDefault(msg, 2, 0),
    contractret: jspb.Message.getFieldWithDefault(msg, 3, 0),
    assetissueid: jspb.Message.getFieldWithDefault(msg, 14, ""),
    withdrawAmount: jspb.Message.getFieldWithDefault(msg, 15, 0),
    unfreezeAmount: jspb.Message.getFieldWithDefault(msg, 16, 0),
    exchangeReceivedAmount: jspb.Message.getFieldWithDefault(msg, 18, 0),
    exchangeInjectAnotherAmount: jspb.Message.getFieldWithDefault(msg, 19, 0),
    exchangeWithdrawAnotherAmount: jspb.Message.getFieldWithDefault(msg, 20, 0),
    exchangeId: jspb.Message.getFieldWithDefault(msg, 21, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Transaction.Result}
 */
proto.protocol.Transaction.Result.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Transaction.Result;
  return proto.protocol.Transaction.Result.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Transaction.Result} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Transaction.Result}
 */
proto.protocol.Transaction.Result.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFee(value);
      break;
    case 2:
      var value = /** @type {!proto.protocol.Transaction.Result.code} */ (reader.readEnum());
      msg.setRet(value);
      break;
    case 3:
      var value = /** @type {!proto.protocol.Transaction.Result.contractResult} */ (reader.readEnum());
      msg.setContractret(value);
      break;
    case 14:
      var value = /** @type {string} */ (reader.readString());
      msg.setAssetissueid(value);
      break;
    case 15:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setWithdrawAmount(value);
      break;
    case 16:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUnfreezeAmount(value);
      break;
    case 18:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeReceivedAmount(value);
      break;
    case 19:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeInjectAnotherAmount(value);
      break;
    case 20:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeWithdrawAnotherAmount(value);
      break;
    case 21:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.Result.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Transaction.Result.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Transaction.Result} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.Result.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFee();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getRet();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getContractret();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
  f = message.getAssetissueid();
  if (f.length > 0) {
    writer.writeString(
      14,
      f
    );
  }
  f = message.getWithdrawAmount();
  if (f !== 0) {
    writer.writeInt64(
      15,
      f
    );
  }
  f = message.getUnfreezeAmount();
  if (f !== 0) {
    writer.writeInt64(
      16,
      f
    );
  }
  f = message.getExchangeReceivedAmount();
  if (f !== 0) {
    writer.writeInt64(
      18,
      f
    );
  }
  f = message.getExchangeInjectAnotherAmount();
  if (f !== 0) {
    writer.writeInt64(
      19,
      f
    );
  }
  f = message.getExchangeWithdrawAnotherAmount();
  if (f !== 0) {
    writer.writeInt64(
      20,
      f
    );
  }
  f = message.getExchangeId();
  if (f !== 0) {
    writer.writeInt64(
      21,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.Transaction.Result.code = {
  SUCESS: 0,
  FAILED: 1
};

/**
 * @enum {number}
 */
proto.protocol.Transaction.Result.contractResult = {
  DEFAULT: 0,
  SUCCESS: 1,
  REVERT: 2,
  BAD_JUMP_DESTINATION: 3,
  OUT_OF_MEMORY: 4,
  PRECOMPILED_CONTRACT: 5,
  STACK_TOO_SMALL: 6,
  STACK_TOO_LARGE: 7,
  ILLEGAL_OPERATION: 8,
  STACK_OVERFLOW: 9,
  OUT_OF_ENERGY: 10,
  OUT_OF_TIME: 11,
  JVM_STACK_OVER_FLOW: 12,
  UNKNOWN: 13,
  TRANSFER_FAILED: 14
};

/**
 * optional int64 fee = 1;
 * @return {number}
 */
proto.protocol.Transaction.Result.prototype.getFee = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Result.prototype.setFee = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional code ret = 2;
 * @return {!proto.protocol.Transaction.Result.code}
 */
proto.protocol.Transaction.Result.prototype.getRet = function() {
  return /** @type {!proto.protocol.Transaction.Result.code} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {!proto.protocol.Transaction.Result.code} value */
proto.protocol.Transaction.Result.prototype.setRet = function(value) {
  jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional contractResult contractRet = 3;
 * @return {!proto.protocol.Transaction.Result.contractResult}
 */
proto.protocol.Transaction.Result.prototype.getContractret = function() {
  return /** @type {!proto.protocol.Transaction.Result.contractResult} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {!proto.protocol.Transaction.Result.contractResult} value */
proto.protocol.Transaction.Result.prototype.setContractret = function(value) {
  jspb.Message.setProto3EnumField(this, 3, value);
};


/**
 * optional string assetIssueID = 14;
 * @return {string}
 */
proto.protocol.Transaction.Result.prototype.getAssetissueid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 14, ""));
};


/** @param {string} value */
proto.protocol.Transaction.Result.prototype.setAssetissueid = function(value) {
  jspb.Message.setProto3StringField(this, 14, value);
};


/**
 * optional int64 withdraw_amount = 15;
 * @return {number}
 */
proto.protocol.Transaction.Result.prototype.getWithdrawAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 15, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Result.prototype.setWithdrawAmount = function(value) {
  jspb.Message.setProto3IntField(this, 15, value);
};


/**
 * optional int64 unfreeze_amount = 16;
 * @return {number}
 */
proto.protocol.Transaction.Result.prototype.getUnfreezeAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 16, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Result.prototype.setUnfreezeAmount = function(value) {
  jspb.Message.setProto3IntField(this, 16, value);
};


/**
 * optional int64 exchange_received_amount = 18;
 * @return {number}
 */
proto.protocol.Transaction.Result.prototype.getExchangeReceivedAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 18, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Result.prototype.setExchangeReceivedAmount = function(value) {
  jspb.Message.setProto3IntField(this, 18, value);
};


/**
 * optional int64 exchange_inject_another_amount = 19;
 * @return {number}
 */
proto.protocol.Transaction.Result.prototype.getExchangeInjectAnotherAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 19, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Result.prototype.setExchangeInjectAnotherAmount = function(value) {
  jspb.Message.setProto3IntField(this, 19, value);
};


/**
 * optional int64 exchange_withdraw_another_amount = 20;
 * @return {number}
 */
proto.protocol.Transaction.Result.prototype.getExchangeWithdrawAnotherAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 20, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Result.prototype.setExchangeWithdrawAnotherAmount = function(value) {
  jspb.Message.setProto3IntField(this, 20, value);
};


/**
 * optional int64 exchange_id = 21;
 * @return {number}
 */
proto.protocol.Transaction.Result.prototype.getExchangeId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 21, 0));
};


/** @param {number} value */
proto.protocol.Transaction.Result.prototype.setExchangeId = function(value) {
  jspb.Message.setProto3IntField(this, 21, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Transaction.raw.repeatedFields_ = [9,11];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Transaction.raw.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Transaction.raw.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Transaction.raw} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.raw.toObject = function(includeInstance, msg) {
  var f, obj = {
    refBlockBytes: msg.getRefBlockBytes_asB64(),
    refBlockNum: jspb.Message.getFieldWithDefault(msg, 3, 0),
    refBlockHash: msg.getRefBlockHash_asB64(),
    expiration: jspb.Message.getFieldWithDefault(msg, 8, 0),
    authsList: jspb.Message.toObjectList(msg.getAuthsList(),
    proto.protocol.authority.toObject, includeInstance),
    data: msg.getData_asB64(),
    contractList: jspb.Message.toObjectList(msg.getContractList(),
    proto.protocol.Transaction.Contract.toObject, includeInstance),
    scripts: msg.getScripts_asB64(),
    timestamp: jspb.Message.getFieldWithDefault(msg, 14, 0),
    feeLimit: jspb.Message.getFieldWithDefault(msg, 18, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Transaction.raw}
 */
proto.protocol.Transaction.raw.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Transaction.raw;
  return proto.protocol.Transaction.raw.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Transaction.raw} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Transaction.raw}
 */
proto.protocol.Transaction.raw.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setRefBlockBytes(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setRefBlockNum(value);
      break;
    case 4:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setRefBlockHash(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExpiration(value);
      break;
    case 9:
      var value = new proto.protocol.authority;
      reader.readMessage(value,proto.protocol.authority.deserializeBinaryFromReader);
      msg.addAuths(value);
      break;
    case 10:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    case 11:
      var value = new proto.protocol.Transaction.Contract;
      reader.readMessage(value,proto.protocol.Transaction.Contract.deserializeBinaryFromReader);
      msg.addContract(value);
      break;
    case 12:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setScripts(value);
      break;
    case 14:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimestamp(value);
      break;
    case 18:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFeeLimit(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.raw.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Transaction.raw.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Transaction.raw} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transaction.raw.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRefBlockBytes_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getRefBlockNum();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getRefBlockHash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      4,
      f
    );
  }
  f = message.getExpiration();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
  f = message.getAuthsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      9,
      f,
      proto.protocol.authority.serializeBinaryToWriter
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      10,
      f
    );
  }
  f = message.getContractList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      11,
      f,
      proto.protocol.Transaction.Contract.serializeBinaryToWriter
    );
  }
  f = message.getScripts_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      12,
      f
    );
  }
  f = message.getTimestamp();
  if (f !== 0) {
    writer.writeInt64(
      14,
      f
    );
  }
  f = message.getFeeLimit();
  if (f !== 0) {
    writer.writeInt64(
      18,
      f
    );
  }
};


/**
 * optional bytes ref_block_bytes = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Transaction.raw.prototype.getRefBlockBytes = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes ref_block_bytes = 1;
 * This is a type-conversion wrapper around `getRefBlockBytes()`
 * @return {string}
 */
proto.protocol.Transaction.raw.prototype.getRefBlockBytes_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getRefBlockBytes()));
};


/**
 * optional bytes ref_block_bytes = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getRefBlockBytes()`
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.raw.prototype.getRefBlockBytes_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getRefBlockBytes()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Transaction.raw.prototype.setRefBlockBytes = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 ref_block_num = 3;
 * @return {number}
 */
proto.protocol.Transaction.raw.prototype.getRefBlockNum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.Transaction.raw.prototype.setRefBlockNum = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional bytes ref_block_hash = 4;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Transaction.raw.prototype.getRefBlockHash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * optional bytes ref_block_hash = 4;
 * This is a type-conversion wrapper around `getRefBlockHash()`
 * @return {string}
 */
proto.protocol.Transaction.raw.prototype.getRefBlockHash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getRefBlockHash()));
};


/**
 * optional bytes ref_block_hash = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getRefBlockHash()`
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.raw.prototype.getRefBlockHash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getRefBlockHash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Transaction.raw.prototype.setRefBlockHash = function(value) {
  jspb.Message.setProto3BytesField(this, 4, value);
};


/**
 * optional int64 expiration = 8;
 * @return {number}
 */
proto.protocol.Transaction.raw.prototype.getExpiration = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {number} value */
proto.protocol.Transaction.raw.prototype.setExpiration = function(value) {
  jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * repeated authority auths = 9;
 * @return {!Array<!proto.protocol.authority>}
 */
proto.protocol.Transaction.raw.prototype.getAuthsList = function() {
  return /** @type{!Array<!proto.protocol.authority>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.authority, 9));
};


/** @param {!Array<!proto.protocol.authority>} value */
proto.protocol.Transaction.raw.prototype.setAuthsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 9, value);
};


/**
 * @param {!proto.protocol.authority=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.authority}
 */
proto.protocol.Transaction.raw.prototype.addAuths = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 9, opt_value, proto.protocol.authority, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Transaction.raw.prototype.clearAuthsList = function() {
  this.setAuthsList([]);
};


/**
 * optional bytes data = 10;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Transaction.raw.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * optional bytes data = 10;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.protocol.Transaction.raw.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 10;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.raw.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Transaction.raw.prototype.setData = function(value) {
  jspb.Message.setProto3BytesField(this, 10, value);
};


/**
 * repeated Contract contract = 11;
 * @return {!Array<!proto.protocol.Transaction.Contract>}
 */
proto.protocol.Transaction.raw.prototype.getContractList = function() {
  return /** @type{!Array<!proto.protocol.Transaction.Contract>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Transaction.Contract, 11));
};


/** @param {!Array<!proto.protocol.Transaction.Contract>} value */
proto.protocol.Transaction.raw.prototype.setContractList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 11, value);
};


/**
 * @param {!proto.protocol.Transaction.Contract=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Transaction.Contract}
 */
proto.protocol.Transaction.raw.prototype.addContract = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 11, opt_value, proto.protocol.Transaction.Contract, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Transaction.raw.prototype.clearContractList = function() {
  this.setContractList([]);
};


/**
 * optional bytes scripts = 12;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.Transaction.raw.prototype.getScripts = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 12, ""));
};


/**
 * optional bytes scripts = 12;
 * This is a type-conversion wrapper around `getScripts()`
 * @return {string}
 */
proto.protocol.Transaction.raw.prototype.getScripts_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getScripts()));
};


/**
 * optional bytes scripts = 12;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getScripts()`
 * @return {!Uint8Array}
 */
proto.protocol.Transaction.raw.prototype.getScripts_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getScripts()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.Transaction.raw.prototype.setScripts = function(value) {
  jspb.Message.setProto3BytesField(this, 12, value);
};


/**
 * optional int64 timestamp = 14;
 * @return {number}
 */
proto.protocol.Transaction.raw.prototype.getTimestamp = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 14, 0));
};


/** @param {number} value */
proto.protocol.Transaction.raw.prototype.setTimestamp = function(value) {
  jspb.Message.setProto3IntField(this, 14, value);
};


/**
 * optional int64 fee_limit = 18;
 * @return {number}
 */
proto.protocol.Transaction.raw.prototype.getFeeLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 18, 0));
};


/** @param {number} value */
proto.protocol.Transaction.raw.prototype.setFeeLimit = function(value) {
  jspb.Message.setProto3IntField(this, 18, value);
};


/**
 * optional raw raw_data = 1;
 * @return {?proto.protocol.Transaction.raw}
 */
proto.protocol.Transaction.prototype.getRawData = function() {
  return /** @type{?proto.protocol.Transaction.raw} */ (
    jspb.Message.getWrapperField(this, proto.protocol.Transaction.raw, 1));
};


/** @param {?proto.protocol.Transaction.raw|undefined} value */
proto.protocol.Transaction.prototype.setRawData = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.Transaction.prototype.clearRawData = function() {
  this.setRawData(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.Transaction.prototype.hasRawData = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * repeated bytes signature = 2;
 * @return {!(Array<!Uint8Array>|Array<string>)}
 */
proto.protocol.Transaction.prototype.getSignatureList = function() {
  return /** @type {!(Array<!Uint8Array>|Array<string>)} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * repeated bytes signature = 2;
 * This is a type-conversion wrapper around `getSignatureList()`
 * @return {!Array<string>}
 */
proto.protocol.Transaction.prototype.getSignatureList_asB64 = function() {
  return /** @type {!Array<string>} */ (jspb.Message.bytesListAsB64(
      this.getSignatureList()));
};


/**
 * repeated bytes signature = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getSignatureList()`
 * @return {!Array<!Uint8Array>}
 */
proto.protocol.Transaction.prototype.getSignatureList_asU8 = function() {
  return /** @type {!Array<!Uint8Array>} */ (jspb.Message.bytesListAsU8(
      this.getSignatureList()));
};


/** @param {!(Array<!Uint8Array>|Array<string>)} value */
proto.protocol.Transaction.prototype.setSignatureList = function(value) {
  jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {!(string|Uint8Array)} value
 * @param {number=} opt_index
 */
proto.protocol.Transaction.prototype.addSignature = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Transaction.prototype.clearSignatureList = function() {
  this.setSignatureList([]);
};


/**
 * repeated Result ret = 5;
 * @return {!Array<!proto.protocol.Transaction.Result>}
 */
proto.protocol.Transaction.prototype.getRetList = function() {
  return /** @type{!Array<!proto.protocol.Transaction.Result>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Transaction.Result, 5));
};


/** @param {!Array<!proto.protocol.Transaction.Result>} value */
proto.protocol.Transaction.prototype.setRetList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 5, value);
};


/**
 * @param {!proto.protocol.Transaction.Result=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Transaction.Result}
 */
proto.protocol.Transaction.prototype.addRet = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.protocol.Transaction.Result, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Transaction.prototype.clearRetList = function() {
  this.setRetList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.TransactionInfo.repeatedFields_ = [5,8,17];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TransactionInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TransactionInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TransactionInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: msg.getId_asB64(),
    fee: jspb.Message.getFieldWithDefault(msg, 2, 0),
    blocknumber: jspb.Message.getFieldWithDefault(msg, 3, 0),
    blocktimestamp: jspb.Message.getFieldWithDefault(msg, 4, 0),
    contractresultList: msg.getContractresultList_asB64(),
    contractAddress: msg.getContractAddress_asB64(),
    receipt: (f = msg.getReceipt()) && proto.protocol.ResourceReceipt.toObject(includeInstance, f),
    logList: jspb.Message.toObjectList(msg.getLogList(),
    proto.protocol.TransactionInfo.Log.toObject, includeInstance),
    result: jspb.Message.getFieldWithDefault(msg, 9, 0),
    resmessage: msg.getResmessage_asB64(),
    assetissueid: jspb.Message.getFieldWithDefault(msg, 14, ""),
    withdrawAmount: jspb.Message.getFieldWithDefault(msg, 15, 0),
    unfreezeAmount: jspb.Message.getFieldWithDefault(msg, 16, 0),
    internalTransactionsList: jspb.Message.toObjectList(msg.getInternalTransactionsList(),
    proto.protocol.InternalTransaction.toObject, includeInstance),
    exchangeReceivedAmount: jspb.Message.getFieldWithDefault(msg, 18, 0),
    exchangeInjectAnotherAmount: jspb.Message.getFieldWithDefault(msg, 19, 0),
    exchangeWithdrawAnotherAmount: jspb.Message.getFieldWithDefault(msg, 20, 0),
    exchangeId: jspb.Message.getFieldWithDefault(msg, 21, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TransactionInfo}
 */
proto.protocol.TransactionInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TransactionInfo;
  return proto.protocol.TransactionInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TransactionInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TransactionInfo}
 */
proto.protocol.TransactionInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFee(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setBlocknumber(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setBlocktimestamp(value);
      break;
    case 5:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.addContractresult(value);
      break;
    case 6:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setContractAddress(value);
      break;
    case 7:
      var value = new proto.protocol.ResourceReceipt;
      reader.readMessage(value,proto.protocol.ResourceReceipt.deserializeBinaryFromReader);
      msg.setReceipt(value);
      break;
    case 8:
      var value = new proto.protocol.TransactionInfo.Log;
      reader.readMessage(value,proto.protocol.TransactionInfo.Log.deserializeBinaryFromReader);
      msg.addLog(value);
      break;
    case 9:
      var value = /** @type {!proto.protocol.TransactionInfo.code} */ (reader.readEnum());
      msg.setResult(value);
      break;
    case 10:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setResmessage(value);
      break;
    case 14:
      var value = /** @type {string} */ (reader.readString());
      msg.setAssetissueid(value);
      break;
    case 15:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setWithdrawAmount(value);
      break;
    case 16:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUnfreezeAmount(value);
      break;
    case 17:
      var value = new proto.protocol.InternalTransaction;
      reader.readMessage(value,proto.protocol.InternalTransaction.deserializeBinaryFromReader);
      msg.addInternalTransactions(value);
      break;
    case 18:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeReceivedAmount(value);
      break;
    case 19:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeInjectAnotherAmount(value);
      break;
    case 20:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeWithdrawAnotherAmount(value);
      break;
    case 21:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExchangeId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TransactionInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TransactionInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TransactionInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getFee();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getBlocknumber();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getBlocktimestamp();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getContractresultList_asU8();
  if (f.length > 0) {
    writer.writeRepeatedBytes(
      5,
      f
    );
  }
  f = message.getContractAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      6,
      f
    );
  }
  f = message.getReceipt();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.protocol.ResourceReceipt.serializeBinaryToWriter
    );
  }
  f = message.getLogList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      8,
      f,
      proto.protocol.TransactionInfo.Log.serializeBinaryToWriter
    );
  }
  f = message.getResult();
  if (f !== 0.0) {
    writer.writeEnum(
      9,
      f
    );
  }
  f = message.getResmessage_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      10,
      f
    );
  }
  f = message.getAssetissueid();
  if (f.length > 0) {
    writer.writeString(
      14,
      f
    );
  }
  f = message.getWithdrawAmount();
  if (f !== 0) {
    writer.writeInt64(
      15,
      f
    );
  }
  f = message.getUnfreezeAmount();
  if (f !== 0) {
    writer.writeInt64(
      16,
      f
    );
  }
  f = message.getInternalTransactionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      17,
      f,
      proto.protocol.InternalTransaction.serializeBinaryToWriter
    );
  }
  f = message.getExchangeReceivedAmount();
  if (f !== 0) {
    writer.writeInt64(
      18,
      f
    );
  }
  f = message.getExchangeInjectAnotherAmount();
  if (f !== 0) {
    writer.writeInt64(
      19,
      f
    );
  }
  f = message.getExchangeWithdrawAnotherAmount();
  if (f !== 0) {
    writer.writeInt64(
      20,
      f
    );
  }
  f = message.getExchangeId();
  if (f !== 0) {
    writer.writeInt64(
      21,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.TransactionInfo.code = {
  SUCESS: 0,
  FAILED: 1
};


/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.TransactionInfo.Log.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TransactionInfo.Log.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TransactionInfo.Log.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TransactionInfo.Log} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionInfo.Log.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: msg.getAddress_asB64(),
    topicsList: msg.getTopicsList_asB64(),
    data: msg.getData_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TransactionInfo.Log}
 */
proto.protocol.TransactionInfo.Log.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TransactionInfo.Log;
  return proto.protocol.TransactionInfo.Log.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TransactionInfo.Log} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TransactionInfo.Log}
 */
proto.protocol.TransactionInfo.Log.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.addTopics(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setData(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TransactionInfo.Log.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TransactionInfo.Log.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TransactionInfo.Log} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionInfo.Log.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getTopicsList_asU8();
  if (f.length > 0) {
    writer.writeRepeatedBytes(
      2,
      f
    );
  }
  f = message.getData_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
};


/**
 * optional bytes address = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TransactionInfo.Log.prototype.getAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes address = 1;
 * This is a type-conversion wrapper around `getAddress()`
 * @return {string}
 */
proto.protocol.TransactionInfo.Log.prototype.getAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAddress()));
};


/**
 * optional bytes address = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.TransactionInfo.Log.prototype.getAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TransactionInfo.Log.prototype.setAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * repeated bytes topics = 2;
 * @return {!(Array<!Uint8Array>|Array<string>)}
 */
proto.protocol.TransactionInfo.Log.prototype.getTopicsList = function() {
  return /** @type {!(Array<!Uint8Array>|Array<string>)} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * repeated bytes topics = 2;
 * This is a type-conversion wrapper around `getTopicsList()`
 * @return {!Array<string>}
 */
proto.protocol.TransactionInfo.Log.prototype.getTopicsList_asB64 = function() {
  return /** @type {!Array<string>} */ (jspb.Message.bytesListAsB64(
      this.getTopicsList()));
};


/**
 * repeated bytes topics = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTopicsList()`
 * @return {!Array<!Uint8Array>}
 */
proto.protocol.TransactionInfo.Log.prototype.getTopicsList_asU8 = function() {
  return /** @type {!Array<!Uint8Array>} */ (jspb.Message.bytesListAsU8(
      this.getTopicsList()));
};


/** @param {!(Array<!Uint8Array>|Array<string>)} value */
proto.protocol.TransactionInfo.Log.prototype.setTopicsList = function(value) {
  jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {!(string|Uint8Array)} value
 * @param {number=} opt_index
 */
proto.protocol.TransactionInfo.Log.prototype.addTopics = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.TransactionInfo.Log.prototype.clearTopicsList = function() {
  this.setTopicsList([]);
};


/**
 * optional bytes data = 3;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TransactionInfo.Log.prototype.getData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes data = 3;
 * This is a type-conversion wrapper around `getData()`
 * @return {string}
 */
proto.protocol.TransactionInfo.Log.prototype.getData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getData()));
};


/**
 * optional bytes data = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getData()`
 * @return {!Uint8Array}
 */
proto.protocol.TransactionInfo.Log.prototype.getData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getData()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TransactionInfo.Log.prototype.setData = function(value) {
  jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * optional bytes id = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TransactionInfo.prototype.getId = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes id = 1;
 * This is a type-conversion wrapper around `getId()`
 * @return {string}
 */
proto.protocol.TransactionInfo.prototype.getId_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getId()));
};


/**
 * optional bytes id = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getId()`
 * @return {!Uint8Array}
 */
proto.protocol.TransactionInfo.prototype.getId_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getId()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TransactionInfo.prototype.setId = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 fee = 2;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getFee = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setFee = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int64 blockNumber = 3;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getBlocknumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setBlocknumber = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 blockTimeStamp = 4;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getBlocktimestamp = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setBlocktimestamp = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * repeated bytes contractResult = 5;
 * @return {!(Array<!Uint8Array>|Array<string>)}
 */
proto.protocol.TransactionInfo.prototype.getContractresultList = function() {
  return /** @type {!(Array<!Uint8Array>|Array<string>)} */ (jspb.Message.getRepeatedField(this, 5));
};


/**
 * repeated bytes contractResult = 5;
 * This is a type-conversion wrapper around `getContractresultList()`
 * @return {!Array<string>}
 */
proto.protocol.TransactionInfo.prototype.getContractresultList_asB64 = function() {
  return /** @type {!Array<string>} */ (jspb.Message.bytesListAsB64(
      this.getContractresultList()));
};


/**
 * repeated bytes contractResult = 5;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getContractresultList()`
 * @return {!Array<!Uint8Array>}
 */
proto.protocol.TransactionInfo.prototype.getContractresultList_asU8 = function() {
  return /** @type {!Array<!Uint8Array>} */ (jspb.Message.bytesListAsU8(
      this.getContractresultList()));
};


/** @param {!(Array<!Uint8Array>|Array<string>)} value */
proto.protocol.TransactionInfo.prototype.setContractresultList = function(value) {
  jspb.Message.setField(this, 5, value || []);
};


/**
 * @param {!(string|Uint8Array)} value
 * @param {number=} opt_index
 */
proto.protocol.TransactionInfo.prototype.addContractresult = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 5, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.TransactionInfo.prototype.clearContractresultList = function() {
  this.setContractresultList([]);
};


/**
 * optional bytes contract_address = 6;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TransactionInfo.prototype.getContractAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * optional bytes contract_address = 6;
 * This is a type-conversion wrapper around `getContractAddress()`
 * @return {string}
 */
proto.protocol.TransactionInfo.prototype.getContractAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getContractAddress()));
};


/**
 * optional bytes contract_address = 6;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getContractAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.TransactionInfo.prototype.getContractAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getContractAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TransactionInfo.prototype.setContractAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 6, value);
};


/**
 * optional ResourceReceipt receipt = 7;
 * @return {?proto.protocol.ResourceReceipt}
 */
proto.protocol.TransactionInfo.prototype.getReceipt = function() {
  return /** @type{?proto.protocol.ResourceReceipt} */ (
    jspb.Message.getWrapperField(this, proto.protocol.ResourceReceipt, 7));
};


/** @param {?proto.protocol.ResourceReceipt|undefined} value */
proto.protocol.TransactionInfo.prototype.setReceipt = function(value) {
  jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.TransactionInfo.prototype.clearReceipt = function() {
  this.setReceipt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.TransactionInfo.prototype.hasReceipt = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * repeated Log log = 8;
 * @return {!Array<!proto.protocol.TransactionInfo.Log>}
 */
proto.protocol.TransactionInfo.prototype.getLogList = function() {
  return /** @type{!Array<!proto.protocol.TransactionInfo.Log>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.TransactionInfo.Log, 8));
};


/** @param {!Array<!proto.protocol.TransactionInfo.Log>} value */
proto.protocol.TransactionInfo.prototype.setLogList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 8, value);
};


/**
 * @param {!proto.protocol.TransactionInfo.Log=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.TransactionInfo.Log}
 */
proto.protocol.TransactionInfo.prototype.addLog = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 8, opt_value, proto.protocol.TransactionInfo.Log, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.TransactionInfo.prototype.clearLogList = function() {
  this.setLogList([]);
};


/**
 * optional code result = 9;
 * @return {!proto.protocol.TransactionInfo.code}
 */
proto.protocol.TransactionInfo.prototype.getResult = function() {
  return /** @type {!proto.protocol.TransactionInfo.code} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/** @param {!proto.protocol.TransactionInfo.code} value */
proto.protocol.TransactionInfo.prototype.setResult = function(value) {
  jspb.Message.setProto3EnumField(this, 9, value);
};


/**
 * optional bytes resMessage = 10;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TransactionInfo.prototype.getResmessage = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * optional bytes resMessage = 10;
 * This is a type-conversion wrapper around `getResmessage()`
 * @return {string}
 */
proto.protocol.TransactionInfo.prototype.getResmessage_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getResmessage()));
};


/**
 * optional bytes resMessage = 10;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getResmessage()`
 * @return {!Uint8Array}
 */
proto.protocol.TransactionInfo.prototype.getResmessage_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getResmessage()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TransactionInfo.prototype.setResmessage = function(value) {
  jspb.Message.setProto3BytesField(this, 10, value);
};


/**
 * optional string assetIssueID = 14;
 * @return {string}
 */
proto.protocol.TransactionInfo.prototype.getAssetissueid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 14, ""));
};


/** @param {string} value */
proto.protocol.TransactionInfo.prototype.setAssetissueid = function(value) {
  jspb.Message.setProto3StringField(this, 14, value);
};


/**
 * optional int64 withdraw_amount = 15;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getWithdrawAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 15, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setWithdrawAmount = function(value) {
  jspb.Message.setProto3IntField(this, 15, value);
};


/**
 * optional int64 unfreeze_amount = 16;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getUnfreezeAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 16, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setUnfreezeAmount = function(value) {
  jspb.Message.setProto3IntField(this, 16, value);
};


/**
 * repeated InternalTransaction internal_transactions = 17;
 * @return {!Array<!proto.protocol.InternalTransaction>}
 */
proto.protocol.TransactionInfo.prototype.getInternalTransactionsList = function() {
  return /** @type{!Array<!proto.protocol.InternalTransaction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.InternalTransaction, 17));
};


/** @param {!Array<!proto.protocol.InternalTransaction>} value */
proto.protocol.TransactionInfo.prototype.setInternalTransactionsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 17, value);
};


/**
 * @param {!proto.protocol.InternalTransaction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.InternalTransaction}
 */
proto.protocol.TransactionInfo.prototype.addInternalTransactions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 17, opt_value, proto.protocol.InternalTransaction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.TransactionInfo.prototype.clearInternalTransactionsList = function() {
  this.setInternalTransactionsList([]);
};


/**
 * optional int64 exchange_received_amount = 18;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getExchangeReceivedAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 18, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setExchangeReceivedAmount = function(value) {
  jspb.Message.setProto3IntField(this, 18, value);
};


/**
 * optional int64 exchange_inject_another_amount = 19;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getExchangeInjectAnotherAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 19, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setExchangeInjectAnotherAmount = function(value) {
  jspb.Message.setProto3IntField(this, 19, value);
};


/**
 * optional int64 exchange_withdraw_another_amount = 20;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getExchangeWithdrawAnotherAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 20, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setExchangeWithdrawAnotherAmount = function(value) {
  jspb.Message.setProto3IntField(this, 20, value);
};


/**
 * optional int64 exchange_id = 21;
 * @return {number}
 */
proto.protocol.TransactionInfo.prototype.getExchangeId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 21, 0));
};


/** @param {number} value */
proto.protocol.TransactionInfo.prototype.setExchangeId = function(value) {
  jspb.Message.setProto3IntField(this, 21, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.TransactionRet.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TransactionRet.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TransactionRet.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TransactionRet} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionRet.toObject = function(includeInstance, msg) {
  var f, obj = {
    blocknumber: jspb.Message.getFieldWithDefault(msg, 1, 0),
    blocktimestamp: jspb.Message.getFieldWithDefault(msg, 2, 0),
    transactioninfoList: jspb.Message.toObjectList(msg.getTransactioninfoList(),
    proto.protocol.TransactionInfo.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TransactionRet}
 */
proto.protocol.TransactionRet.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TransactionRet;
  return proto.protocol.TransactionRet.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TransactionRet} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TransactionRet}
 */
proto.protocol.TransactionRet.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setBlocknumber(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setBlocktimestamp(value);
      break;
    case 3:
      var value = new proto.protocol.TransactionInfo;
      reader.readMessage(value,proto.protocol.TransactionInfo.deserializeBinaryFromReader);
      msg.addTransactioninfo(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TransactionRet.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TransactionRet.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TransactionRet} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionRet.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBlocknumber();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getBlocktimestamp();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getTransactioninfoList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.protocol.TransactionInfo.serializeBinaryToWriter
    );
  }
};


/**
 * optional int64 blockNumber = 1;
 * @return {number}
 */
proto.protocol.TransactionRet.prototype.getBlocknumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.TransactionRet.prototype.setBlocknumber = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int64 blockTimeStamp = 2;
 * @return {number}
 */
proto.protocol.TransactionRet.prototype.getBlocktimestamp = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.TransactionRet.prototype.setBlocktimestamp = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * repeated TransactionInfo transactioninfo = 3;
 * @return {!Array<!proto.protocol.TransactionInfo>}
 */
proto.protocol.TransactionRet.prototype.getTransactioninfoList = function() {
  return /** @type{!Array<!proto.protocol.TransactionInfo>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.TransactionInfo, 3));
};


/** @param {!Array<!proto.protocol.TransactionInfo>} value */
proto.protocol.TransactionRet.prototype.setTransactioninfoList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.protocol.TransactionInfo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.TransactionInfo}
 */
proto.protocol.TransactionRet.prototype.addTransactioninfo = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.protocol.TransactionInfo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.TransactionRet.prototype.clearTransactioninfoList = function() {
  this.setTransactioninfoList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Transactions.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Transactions.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Transactions.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Transactions} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transactions.toObject = function(includeInstance, msg) {
  var f, obj = {
    transactionsList: jspb.Message.toObjectList(msg.getTransactionsList(),
    proto.protocol.Transaction.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Transactions}
 */
proto.protocol.Transactions.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Transactions;
  return proto.protocol.Transactions.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Transactions} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Transactions}
 */
proto.protocol.Transactions.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.Transaction;
      reader.readMessage(value,proto.protocol.Transaction.deserializeBinaryFromReader);
      msg.addTransactions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Transactions.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Transactions.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Transactions} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Transactions.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTransactionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.protocol.Transaction.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Transaction transactions = 1;
 * @return {!Array<!proto.protocol.Transaction>}
 */
proto.protocol.Transactions.prototype.getTransactionsList = function() {
  return /** @type{!Array<!proto.protocol.Transaction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Transaction, 1));
};


/** @param {!Array<!proto.protocol.Transaction>} value */
proto.protocol.Transactions.prototype.setTransactionsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.protocol.Transaction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Transaction}
 */
proto.protocol.Transactions.prototype.addTransactions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.protocol.Transaction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Transactions.prototype.clearTransactionsList = function() {
  this.setTransactionsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.TransactionSign.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.TransactionSign.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.TransactionSign} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionSign.toObject = function(includeInstance, msg) {
  var f, obj = {
    transaction: (f = msg.getTransaction()) && proto.protocol.Transaction.toObject(includeInstance, f),
    privatekey: msg.getPrivatekey_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.TransactionSign}
 */
proto.protocol.TransactionSign.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.TransactionSign;
  return proto.protocol.TransactionSign.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.TransactionSign} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.TransactionSign}
 */
proto.protocol.TransactionSign.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.Transaction;
      reader.readMessage(value,proto.protocol.Transaction.deserializeBinaryFromReader);
      msg.setTransaction(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setPrivatekey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.TransactionSign.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.TransactionSign.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.TransactionSign} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.TransactionSign.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTransaction();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.protocol.Transaction.serializeBinaryToWriter
    );
  }
  f = message.getPrivatekey_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
};


/**
 * optional Transaction transaction = 1;
 * @return {?proto.protocol.Transaction}
 */
proto.protocol.TransactionSign.prototype.getTransaction = function() {
  return /** @type{?proto.protocol.Transaction} */ (
    jspb.Message.getWrapperField(this, proto.protocol.Transaction, 1));
};


/** @param {?proto.protocol.Transaction|undefined} value */
proto.protocol.TransactionSign.prototype.setTransaction = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.TransactionSign.prototype.clearTransaction = function() {
  this.setTransaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.TransactionSign.prototype.hasTransaction = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bytes privateKey = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.TransactionSign.prototype.getPrivatekey = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes privateKey = 2;
 * This is a type-conversion wrapper around `getPrivatekey()`
 * @return {string}
 */
proto.protocol.TransactionSign.prototype.getPrivatekey_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getPrivatekey()));
};


/**
 * optional bytes privateKey = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getPrivatekey()`
 * @return {!Uint8Array}
 */
proto.protocol.TransactionSign.prototype.getPrivatekey_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getPrivatekey()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.TransactionSign.prototype.setPrivatekey = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.BlockHeader.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.BlockHeader.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.BlockHeader} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockHeader.toObject = function(includeInstance, msg) {
  var f, obj = {
    rawData: (f = msg.getRawData()) && proto.protocol.BlockHeader.raw.toObject(includeInstance, f),
    witnessSignature: msg.getWitnessSignature_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.BlockHeader}
 */
proto.protocol.BlockHeader.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.BlockHeader;
  return proto.protocol.BlockHeader.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.BlockHeader} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.BlockHeader}
 */
proto.protocol.BlockHeader.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.BlockHeader.raw;
      reader.readMessage(value,proto.protocol.BlockHeader.raw.deserializeBinaryFromReader);
      msg.setRawData(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setWitnessSignature(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.BlockHeader.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.BlockHeader.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.BlockHeader} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockHeader.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRawData();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.protocol.BlockHeader.raw.serializeBinaryToWriter
    );
  }
  f = message.getWitnessSignature_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.BlockHeader.raw.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.BlockHeader.raw.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.BlockHeader.raw} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockHeader.raw.toObject = function(includeInstance, msg) {
  var f, obj = {
    timestamp: jspb.Message.getFieldWithDefault(msg, 1, 0),
    txtrieroot: msg.getTxtrieroot_asB64(),
    parenthash: msg.getParenthash_asB64(),
    number: jspb.Message.getFieldWithDefault(msg, 7, 0),
    witnessId: jspb.Message.getFieldWithDefault(msg, 8, 0),
    witnessAddress: msg.getWitnessAddress_asB64(),
    version: jspb.Message.getFieldWithDefault(msg, 10, 0),
    accountstateroot: msg.getAccountstateroot_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.BlockHeader.raw}
 */
proto.protocol.BlockHeader.raw.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.BlockHeader.raw;
  return proto.protocol.BlockHeader.raw.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.BlockHeader.raw} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.BlockHeader.raw}
 */
proto.protocol.BlockHeader.raw.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimestamp(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setTxtrieroot(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setParenthash(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNumber(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setWitnessId(value);
      break;
    case 9:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setWitnessAddress(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 11:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAccountstateroot(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.BlockHeader.raw.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.BlockHeader.raw.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.BlockHeader.raw} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockHeader.raw.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTimestamp();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getTxtrieroot_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getParenthash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
  f = message.getNumber();
  if (f !== 0) {
    writer.writeInt64(
      7,
      f
    );
  }
  f = message.getWitnessId();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
  f = message.getWitnessAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      9,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      10,
      f
    );
  }
  f = message.getAccountstateroot_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      11,
      f
    );
  }
};


/**
 * optional int64 timestamp = 1;
 * @return {number}
 */
proto.protocol.BlockHeader.raw.prototype.getTimestamp = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.BlockHeader.raw.prototype.setTimestamp = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional bytes txTrieRoot = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.BlockHeader.raw.prototype.getTxtrieroot = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes txTrieRoot = 2;
 * This is a type-conversion wrapper around `getTxtrieroot()`
 * @return {string}
 */
proto.protocol.BlockHeader.raw.prototype.getTxtrieroot_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getTxtrieroot()));
};


/**
 * optional bytes txTrieRoot = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTxtrieroot()`
 * @return {!Uint8Array}
 */
proto.protocol.BlockHeader.raw.prototype.getTxtrieroot_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getTxtrieroot()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.BlockHeader.raw.prototype.setTxtrieroot = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional bytes parentHash = 3;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.BlockHeader.raw.prototype.getParenthash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes parentHash = 3;
 * This is a type-conversion wrapper around `getParenthash()`
 * @return {string}
 */
proto.protocol.BlockHeader.raw.prototype.getParenthash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getParenthash()));
};


/**
 * optional bytes parentHash = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getParenthash()`
 * @return {!Uint8Array}
 */
proto.protocol.BlockHeader.raw.prototype.getParenthash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getParenthash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.BlockHeader.raw.prototype.setParenthash = function(value) {
  jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * optional int64 number = 7;
 * @return {number}
 */
proto.protocol.BlockHeader.raw.prototype.getNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.protocol.BlockHeader.raw.prototype.setNumber = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional int64 witness_id = 8;
 * @return {number}
 */
proto.protocol.BlockHeader.raw.prototype.getWitnessId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {number} value */
proto.protocol.BlockHeader.raw.prototype.setWitnessId = function(value) {
  jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional bytes witness_address = 9;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.BlockHeader.raw.prototype.getWitnessAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * optional bytes witness_address = 9;
 * This is a type-conversion wrapper around `getWitnessAddress()`
 * @return {string}
 */
proto.protocol.BlockHeader.raw.prototype.getWitnessAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getWitnessAddress()));
};


/**
 * optional bytes witness_address = 9;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getWitnessAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.BlockHeader.raw.prototype.getWitnessAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getWitnessAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.BlockHeader.raw.prototype.setWitnessAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 9, value);
};


/**
 * optional int32 version = 10;
 * @return {number}
 */
proto.protocol.BlockHeader.raw.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/** @param {number} value */
proto.protocol.BlockHeader.raw.prototype.setVersion = function(value) {
  jspb.Message.setProto3IntField(this, 10, value);
};


/**
 * optional bytes accountStateRoot = 11;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.BlockHeader.raw.prototype.getAccountstateroot = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 11, ""));
};


/**
 * optional bytes accountStateRoot = 11;
 * This is a type-conversion wrapper around `getAccountstateroot()`
 * @return {string}
 */
proto.protocol.BlockHeader.raw.prototype.getAccountstateroot_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAccountstateroot()));
};


/**
 * optional bytes accountStateRoot = 11;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAccountstateroot()`
 * @return {!Uint8Array}
 */
proto.protocol.BlockHeader.raw.prototype.getAccountstateroot_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAccountstateroot()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.BlockHeader.raw.prototype.setAccountstateroot = function(value) {
  jspb.Message.setProto3BytesField(this, 11, value);
};


/**
 * optional raw raw_data = 1;
 * @return {?proto.protocol.BlockHeader.raw}
 */
proto.protocol.BlockHeader.prototype.getRawData = function() {
  return /** @type{?proto.protocol.BlockHeader.raw} */ (
    jspb.Message.getWrapperField(this, proto.protocol.BlockHeader.raw, 1));
};


/** @param {?proto.protocol.BlockHeader.raw|undefined} value */
proto.protocol.BlockHeader.prototype.setRawData = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.BlockHeader.prototype.clearRawData = function() {
  this.setRawData(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.BlockHeader.prototype.hasRawData = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bytes witness_signature = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.BlockHeader.prototype.getWitnessSignature = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes witness_signature = 2;
 * This is a type-conversion wrapper around `getWitnessSignature()`
 * @return {string}
 */
proto.protocol.BlockHeader.prototype.getWitnessSignature_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getWitnessSignature()));
};


/**
 * optional bytes witness_signature = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getWitnessSignature()`
 * @return {!Uint8Array}
 */
proto.protocol.BlockHeader.prototype.getWitnessSignature_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getWitnessSignature()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.BlockHeader.prototype.setWitnessSignature = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Block.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Block.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Block.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Block} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Block.toObject = function(includeInstance, msg) {
  var f, obj = {
    transactionsList: jspb.Message.toObjectList(msg.getTransactionsList(),
    proto.protocol.Transaction.toObject, includeInstance),
    blockHeader: (f = msg.getBlockHeader()) && proto.protocol.BlockHeader.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Block}
 */
proto.protocol.Block.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Block;
  return proto.protocol.Block.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Block} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Block}
 */
proto.protocol.Block.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.Transaction;
      reader.readMessage(value,proto.protocol.Transaction.deserializeBinaryFromReader);
      msg.addTransactions(value);
      break;
    case 2:
      var value = new proto.protocol.BlockHeader;
      reader.readMessage(value,proto.protocol.BlockHeader.deserializeBinaryFromReader);
      msg.setBlockHeader(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Block.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Block.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Block} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Block.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTransactionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.protocol.Transaction.serializeBinaryToWriter
    );
  }
  f = message.getBlockHeader();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.protocol.BlockHeader.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Transaction transactions = 1;
 * @return {!Array<!proto.protocol.Transaction>}
 */
proto.protocol.Block.prototype.getTransactionsList = function() {
  return /** @type{!Array<!proto.protocol.Transaction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Transaction, 1));
};


/** @param {!Array<!proto.protocol.Transaction>} value */
proto.protocol.Block.prototype.setTransactionsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.protocol.Transaction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Transaction}
 */
proto.protocol.Block.prototype.addTransactions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.protocol.Transaction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Block.prototype.clearTransactionsList = function() {
  this.setTransactionsList([]);
};


/**
 * optional BlockHeader block_header = 2;
 * @return {?proto.protocol.BlockHeader}
 */
proto.protocol.Block.prototype.getBlockHeader = function() {
  return /** @type{?proto.protocol.BlockHeader} */ (
    jspb.Message.getWrapperField(this, proto.protocol.BlockHeader, 2));
};


/** @param {?proto.protocol.BlockHeader|undefined} value */
proto.protocol.Block.prototype.setBlockHeader = function(value) {
  jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.Block.prototype.clearBlockHeader = function() {
  this.setBlockHeader(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.Block.prototype.hasBlockHeader = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.ChainInventory.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.ChainInventory.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.ChainInventory.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.ChainInventory} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainInventory.toObject = function(includeInstance, msg) {
  var f, obj = {
    idsList: jspb.Message.toObjectList(msg.getIdsList(),
    proto.protocol.ChainInventory.BlockId.toObject, includeInstance),
    remainNum: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.ChainInventory}
 */
proto.protocol.ChainInventory.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.ChainInventory;
  return proto.protocol.ChainInventory.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.ChainInventory} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.ChainInventory}
 */
proto.protocol.ChainInventory.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.ChainInventory.BlockId;
      reader.readMessage(value,proto.protocol.ChainInventory.BlockId.deserializeBinaryFromReader);
      msg.addIds(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setRemainNum(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.ChainInventory.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.ChainInventory.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.ChainInventory} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainInventory.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIdsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.protocol.ChainInventory.BlockId.serializeBinaryToWriter
    );
  }
  f = message.getRemainNum();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.ChainInventory.BlockId.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.ChainInventory.BlockId.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.ChainInventory.BlockId} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainInventory.BlockId.toObject = function(includeInstance, msg) {
  var f, obj = {
    hash: msg.getHash_asB64(),
    number: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.ChainInventory.BlockId}
 */
proto.protocol.ChainInventory.BlockId.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.ChainInventory.BlockId;
  return proto.protocol.ChainInventory.BlockId.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.ChainInventory.BlockId} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.ChainInventory.BlockId}
 */
proto.protocol.ChainInventory.BlockId.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setHash(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNumber(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.ChainInventory.BlockId.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.ChainInventory.BlockId.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.ChainInventory.BlockId} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.ChainInventory.BlockId.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getNumber();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional bytes hash = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.ChainInventory.BlockId.prototype.getHash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes hash = 1;
 * This is a type-conversion wrapper around `getHash()`
 * @return {string}
 */
proto.protocol.ChainInventory.BlockId.prototype.getHash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getHash()));
};


/**
 * optional bytes hash = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getHash()`
 * @return {!Uint8Array}
 */
proto.protocol.ChainInventory.BlockId.prototype.getHash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getHash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.ChainInventory.BlockId.prototype.setHash = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 number = 2;
 * @return {number}
 */
proto.protocol.ChainInventory.BlockId.prototype.getNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.ChainInventory.BlockId.prototype.setNumber = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * repeated BlockId ids = 1;
 * @return {!Array<!proto.protocol.ChainInventory.BlockId>}
 */
proto.protocol.ChainInventory.prototype.getIdsList = function() {
  return /** @type{!Array<!proto.protocol.ChainInventory.BlockId>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.ChainInventory.BlockId, 1));
};


/** @param {!Array<!proto.protocol.ChainInventory.BlockId>} value */
proto.protocol.ChainInventory.prototype.setIdsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.protocol.ChainInventory.BlockId=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.ChainInventory.BlockId}
 */
proto.protocol.ChainInventory.prototype.addIds = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.protocol.ChainInventory.BlockId, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.ChainInventory.prototype.clearIdsList = function() {
  this.setIdsList([]);
};


/**
 * optional int64 remain_num = 2;
 * @return {number}
 */
proto.protocol.ChainInventory.prototype.getRemainNum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.ChainInventory.prototype.setRemainNum = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.BlockInventory.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.BlockInventory.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.BlockInventory.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.BlockInventory} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockInventory.toObject = function(includeInstance, msg) {
  var f, obj = {
    idsList: jspb.Message.toObjectList(msg.getIdsList(),
    proto.protocol.BlockInventory.BlockId.toObject, includeInstance),
    type: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.BlockInventory}
 */
proto.protocol.BlockInventory.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.BlockInventory;
  return proto.protocol.BlockInventory.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.BlockInventory} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.BlockInventory}
 */
proto.protocol.BlockInventory.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.BlockInventory.BlockId;
      reader.readMessage(value,proto.protocol.BlockInventory.BlockId.deserializeBinaryFromReader);
      msg.addIds(value);
      break;
    case 2:
      var value = /** @type {!proto.protocol.BlockInventory.Type} */ (reader.readEnum());
      msg.setType(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.BlockInventory.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.BlockInventory.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.BlockInventory} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockInventory.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIdsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.protocol.BlockInventory.BlockId.serializeBinaryToWriter
    );
  }
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.BlockInventory.Type = {
  SYNC: 0,
  ADVTISE: 1,
  FETCH: 2
};




if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.BlockInventory.BlockId.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.BlockInventory.BlockId.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.BlockInventory.BlockId} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockInventory.BlockId.toObject = function(includeInstance, msg) {
  var f, obj = {
    hash: msg.getHash_asB64(),
    number: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.BlockInventory.BlockId}
 */
proto.protocol.BlockInventory.BlockId.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.BlockInventory.BlockId;
  return proto.protocol.BlockInventory.BlockId.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.BlockInventory.BlockId} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.BlockInventory.BlockId}
 */
proto.protocol.BlockInventory.BlockId.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setHash(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNumber(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.BlockInventory.BlockId.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.BlockInventory.BlockId.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.BlockInventory.BlockId} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.BlockInventory.BlockId.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getNumber();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional bytes hash = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.BlockInventory.BlockId.prototype.getHash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes hash = 1;
 * This is a type-conversion wrapper around `getHash()`
 * @return {string}
 */
proto.protocol.BlockInventory.BlockId.prototype.getHash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getHash()));
};


/**
 * optional bytes hash = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getHash()`
 * @return {!Uint8Array}
 */
proto.protocol.BlockInventory.BlockId.prototype.getHash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getHash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.BlockInventory.BlockId.prototype.setHash = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 number = 2;
 * @return {number}
 */
proto.protocol.BlockInventory.BlockId.prototype.getNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.BlockInventory.BlockId.prototype.setNumber = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * repeated BlockId ids = 1;
 * @return {!Array<!proto.protocol.BlockInventory.BlockId>}
 */
proto.protocol.BlockInventory.prototype.getIdsList = function() {
  return /** @type{!Array<!proto.protocol.BlockInventory.BlockId>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.BlockInventory.BlockId, 1));
};


/** @param {!Array<!proto.protocol.BlockInventory.BlockId>} value */
proto.protocol.BlockInventory.prototype.setIdsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.protocol.BlockInventory.BlockId=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.BlockInventory.BlockId}
 */
proto.protocol.BlockInventory.prototype.addIds = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.protocol.BlockInventory.BlockId, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.BlockInventory.prototype.clearIdsList = function() {
  this.setIdsList([]);
};


/**
 * optional Type type = 2;
 * @return {!proto.protocol.BlockInventory.Type}
 */
proto.protocol.BlockInventory.prototype.getType = function() {
  return /** @type {!proto.protocol.BlockInventory.Type} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {!proto.protocol.BlockInventory.Type} value */
proto.protocol.BlockInventory.prototype.setType = function(value) {
  jspb.Message.setProto3EnumField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Inventory.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Inventory.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Inventory.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Inventory} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Inventory.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, 0),
    idsList: msg.getIdsList_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Inventory}
 */
proto.protocol.Inventory.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Inventory;
  return proto.protocol.Inventory.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Inventory} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Inventory}
 */
proto.protocol.Inventory.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.protocol.Inventory.InventoryType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.addIds(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Inventory.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Inventory.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Inventory} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Inventory.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getIdsList_asU8();
  if (f.length > 0) {
    writer.writeRepeatedBytes(
      2,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.Inventory.InventoryType = {
  TRX: 0,
  BLOCK: 1
};

/**
 * optional InventoryType type = 1;
 * @return {!proto.protocol.Inventory.InventoryType}
 */
proto.protocol.Inventory.prototype.getType = function() {
  return /** @type {!proto.protocol.Inventory.InventoryType} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {!proto.protocol.Inventory.InventoryType} value */
proto.protocol.Inventory.prototype.setType = function(value) {
  jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * repeated bytes ids = 2;
 * @return {!(Array<!Uint8Array>|Array<string>)}
 */
proto.protocol.Inventory.prototype.getIdsList = function() {
  return /** @type {!(Array<!Uint8Array>|Array<string>)} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * repeated bytes ids = 2;
 * This is a type-conversion wrapper around `getIdsList()`
 * @return {!Array<string>}
 */
proto.protocol.Inventory.prototype.getIdsList_asB64 = function() {
  return /** @type {!Array<string>} */ (jspb.Message.bytesListAsB64(
      this.getIdsList()));
};


/**
 * repeated bytes ids = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getIdsList()`
 * @return {!Array<!Uint8Array>}
 */
proto.protocol.Inventory.prototype.getIdsList_asU8 = function() {
  return /** @type {!Array<!Uint8Array>} */ (jspb.Message.bytesListAsU8(
      this.getIdsList()));
};


/** @param {!(Array<!Uint8Array>|Array<string>)} value */
proto.protocol.Inventory.prototype.setIdsList = function(value) {
  jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {!(string|Uint8Array)} value
 * @param {number=} opt_index
 */
proto.protocol.Inventory.prototype.addIds = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Inventory.prototype.clearIdsList = function() {
  this.setIdsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.Items.repeatedFields_ = [2,3,4];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.Items.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.Items.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.Items} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Items.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, 0),
    blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    proto.protocol.Block.toObject, includeInstance),
    blockHeadersList: jspb.Message.toObjectList(msg.getBlockHeadersList(),
    proto.protocol.BlockHeader.toObject, includeInstance),
    transactionsList: jspb.Message.toObjectList(msg.getTransactionsList(),
    proto.protocol.Transaction.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.Items}
 */
proto.protocol.Items.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.Items;
  return proto.protocol.Items.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.Items} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.Items}
 */
proto.protocol.Items.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.protocol.Items.ItemType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 2:
      var value = new proto.protocol.Block;
      reader.readMessage(value,proto.protocol.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
      break;
    case 3:
      var value = new proto.protocol.BlockHeader;
      reader.readMessage(value,proto.protocol.BlockHeader.deserializeBinaryFromReader);
      msg.addBlockHeaders(value);
      break;
    case 4:
      var value = new proto.protocol.Transaction;
      reader.readMessage(value,proto.protocol.Transaction.deserializeBinaryFromReader);
      msg.addTransactions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.Items.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.Items.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.Items} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.Items.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.protocol.Block.serializeBinaryToWriter
    );
  }
  f = message.getBlockHeadersList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.protocol.BlockHeader.serializeBinaryToWriter
    );
  }
  f = message.getTransactionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.protocol.Transaction.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.Items.ItemType = {
  ERR: 0,
  TRX: 1,
  BLOCK: 2,
  BLOCKHEADER: 3
};

/**
 * optional ItemType type = 1;
 * @return {!proto.protocol.Items.ItemType}
 */
proto.protocol.Items.prototype.getType = function() {
  return /** @type {!proto.protocol.Items.ItemType} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {!proto.protocol.Items.ItemType} value */
proto.protocol.Items.prototype.setType = function(value) {
  jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * repeated Block blocks = 2;
 * @return {!Array<!proto.protocol.Block>}
 */
proto.protocol.Items.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.protocol.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Block, 2));
};


/** @param {!Array<!proto.protocol.Block>} value */
proto.protocol.Items.prototype.setBlocksList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.protocol.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Block}
 */
proto.protocol.Items.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.protocol.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Items.prototype.clearBlocksList = function() {
  this.setBlocksList([]);
};


/**
 * repeated BlockHeader block_headers = 3;
 * @return {!Array<!proto.protocol.BlockHeader>}
 */
proto.protocol.Items.prototype.getBlockHeadersList = function() {
  return /** @type{!Array<!proto.protocol.BlockHeader>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.BlockHeader, 3));
};


/** @param {!Array<!proto.protocol.BlockHeader>} value */
proto.protocol.Items.prototype.setBlockHeadersList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.protocol.BlockHeader=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.BlockHeader}
 */
proto.protocol.Items.prototype.addBlockHeaders = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.protocol.BlockHeader, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Items.prototype.clearBlockHeadersList = function() {
  this.setBlockHeadersList([]);
};


/**
 * repeated Transaction transactions = 4;
 * @return {!Array<!proto.protocol.Transaction>}
 */
proto.protocol.Items.prototype.getTransactionsList = function() {
  return /** @type{!Array<!proto.protocol.Transaction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.Transaction, 4));
};


/** @param {!Array<!proto.protocol.Transaction>} value */
proto.protocol.Items.prototype.setTransactionsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.protocol.Transaction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.Transaction}
 */
proto.protocol.Items.prototype.addTransactions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.protocol.Transaction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.Items.prototype.clearTransactionsList = function() {
  this.setTransactionsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.DynamicProperties.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.DynamicProperties.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.DynamicProperties} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DynamicProperties.toObject = function(includeInstance, msg) {
  var f, obj = {
    lastSolidityBlockNum: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.DynamicProperties}
 */
proto.protocol.DynamicProperties.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.DynamicProperties;
  return proto.protocol.DynamicProperties.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.DynamicProperties} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.DynamicProperties}
 */
proto.protocol.DynamicProperties.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLastSolidityBlockNum(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.DynamicProperties.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.DynamicProperties.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.DynamicProperties} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DynamicProperties.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLastSolidityBlockNum();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 last_solidity_block_num = 1;
 * @return {number}
 */
proto.protocol.DynamicProperties.prototype.getLastSolidityBlockNum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.DynamicProperties.prototype.setLastSolidityBlockNum = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.DisconnectMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.DisconnectMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.DisconnectMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DisconnectMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    reason: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.DisconnectMessage}
 */
proto.protocol.DisconnectMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.DisconnectMessage;
  return proto.protocol.DisconnectMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.DisconnectMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.DisconnectMessage}
 */
proto.protocol.DisconnectMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.protocol.ReasonCode} */ (reader.readEnum());
      msg.setReason(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.DisconnectMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.DisconnectMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.DisconnectMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DisconnectMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReason();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional ReasonCode reason = 1;
 * @return {!proto.protocol.ReasonCode}
 */
proto.protocol.DisconnectMessage.prototype.getReason = function() {
  return /** @type {!proto.protocol.ReasonCode} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {!proto.protocol.ReasonCode} value */
proto.protocol.DisconnectMessage.prototype.setReason = function(value) {
  jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.HelloMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.HelloMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.HelloMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.HelloMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    from: (f = msg.getFrom()) && Discover_pb.Endpoint.toObject(includeInstance, f),
    version: jspb.Message.getFieldWithDefault(msg, 2, 0),
    timestamp: jspb.Message.getFieldWithDefault(msg, 3, 0),
    genesisblockid: (f = msg.getGenesisblockid()) && proto.protocol.HelloMessage.BlockId.toObject(includeInstance, f),
    solidblockid: (f = msg.getSolidblockid()) && proto.protocol.HelloMessage.BlockId.toObject(includeInstance, f),
    headblockid: (f = msg.getHeadblockid()) && proto.protocol.HelloMessage.BlockId.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.HelloMessage}
 */
proto.protocol.HelloMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.HelloMessage;
  return proto.protocol.HelloMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.HelloMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.HelloMessage}
 */
proto.protocol.HelloMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new Discover_pb.Endpoint;
      reader.readMessage(value,Discover_pb.Endpoint.deserializeBinaryFromReader);
      msg.setFrom(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimestamp(value);
      break;
    case 4:
      var value = new proto.protocol.HelloMessage.BlockId;
      reader.readMessage(value,proto.protocol.HelloMessage.BlockId.deserializeBinaryFromReader);
      msg.setGenesisblockid(value);
      break;
    case 5:
      var value = new proto.protocol.HelloMessage.BlockId;
      reader.readMessage(value,proto.protocol.HelloMessage.BlockId.deserializeBinaryFromReader);
      msg.setSolidblockid(value);
      break;
    case 6:
      var value = new proto.protocol.HelloMessage.BlockId;
      reader.readMessage(value,proto.protocol.HelloMessage.BlockId.deserializeBinaryFromReader);
      msg.setHeadblockid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.HelloMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.HelloMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.HelloMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.HelloMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFrom();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      Discover_pb.Endpoint.serializeBinaryToWriter
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getTimestamp();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getGenesisblockid();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.protocol.HelloMessage.BlockId.serializeBinaryToWriter
    );
  }
  f = message.getSolidblockid();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.protocol.HelloMessage.BlockId.serializeBinaryToWriter
    );
  }
  f = message.getHeadblockid();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.protocol.HelloMessage.BlockId.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.HelloMessage.BlockId.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.HelloMessage.BlockId.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.HelloMessage.BlockId} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.HelloMessage.BlockId.toObject = function(includeInstance, msg) {
  var f, obj = {
    hash: msg.getHash_asB64(),
    number: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.HelloMessage.BlockId}
 */
proto.protocol.HelloMessage.BlockId.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.HelloMessage.BlockId;
  return proto.protocol.HelloMessage.BlockId.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.HelloMessage.BlockId} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.HelloMessage.BlockId}
 */
proto.protocol.HelloMessage.BlockId.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setHash(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNumber(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.HelloMessage.BlockId.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.HelloMessage.BlockId.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.HelloMessage.BlockId} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.HelloMessage.BlockId.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getNumber();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional bytes hash = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.HelloMessage.BlockId.prototype.getHash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes hash = 1;
 * This is a type-conversion wrapper around `getHash()`
 * @return {string}
 */
proto.protocol.HelloMessage.BlockId.prototype.getHash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getHash()));
};


/**
 * optional bytes hash = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getHash()`
 * @return {!Uint8Array}
 */
proto.protocol.HelloMessage.BlockId.prototype.getHash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getHash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.HelloMessage.BlockId.prototype.setHash = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional int64 number = 2;
 * @return {number}
 */
proto.protocol.HelloMessage.BlockId.prototype.getNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.HelloMessage.BlockId.prototype.setNumber = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional Endpoint from = 1;
 * @return {?proto.protocol.Endpoint}
 */
proto.protocol.HelloMessage.prototype.getFrom = function() {
  return /** @type{?proto.protocol.Endpoint} */ (
    jspb.Message.getWrapperField(this, Discover_pb.Endpoint, 1));
};


/** @param {?proto.protocol.Endpoint|undefined} value */
proto.protocol.HelloMessage.prototype.setFrom = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.HelloMessage.prototype.clearFrom = function() {
  this.setFrom(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.HelloMessage.prototype.hasFrom = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional int32 version = 2;
 * @return {number}
 */
proto.protocol.HelloMessage.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.HelloMessage.prototype.setVersion = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int64 timestamp = 3;
 * @return {number}
 */
proto.protocol.HelloMessage.prototype.getTimestamp = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.HelloMessage.prototype.setTimestamp = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional BlockId genesisBlockId = 4;
 * @return {?proto.protocol.HelloMessage.BlockId}
 */
proto.protocol.HelloMessage.prototype.getGenesisblockid = function() {
  return /** @type{?proto.protocol.HelloMessage.BlockId} */ (
    jspb.Message.getWrapperField(this, proto.protocol.HelloMessage.BlockId, 4));
};


/** @param {?proto.protocol.HelloMessage.BlockId|undefined} value */
proto.protocol.HelloMessage.prototype.setGenesisblockid = function(value) {
  jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.HelloMessage.prototype.clearGenesisblockid = function() {
  this.setGenesisblockid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.HelloMessage.prototype.hasGenesisblockid = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional BlockId solidBlockId = 5;
 * @return {?proto.protocol.HelloMessage.BlockId}
 */
proto.protocol.HelloMessage.prototype.getSolidblockid = function() {
  return /** @type{?proto.protocol.HelloMessage.BlockId} */ (
    jspb.Message.getWrapperField(this, proto.protocol.HelloMessage.BlockId, 5));
};


/** @param {?proto.protocol.HelloMessage.BlockId|undefined} value */
proto.protocol.HelloMessage.prototype.setSolidblockid = function(value) {
  jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.HelloMessage.prototype.clearSolidblockid = function() {
  this.setSolidblockid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.HelloMessage.prototype.hasSolidblockid = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional BlockId headBlockId = 6;
 * @return {?proto.protocol.HelloMessage.BlockId}
 */
proto.protocol.HelloMessage.prototype.getHeadblockid = function() {
  return /** @type{?proto.protocol.HelloMessage.BlockId} */ (
    jspb.Message.getWrapperField(this, proto.protocol.HelloMessage.BlockId, 6));
};


/** @param {?proto.protocol.HelloMessage.BlockId|undefined} value */
proto.protocol.HelloMessage.prototype.setHeadblockid = function(value) {
  jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.HelloMessage.prototype.clearHeadblockid = function() {
  this.setHeadblockid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.HelloMessage.prototype.hasHeadblockid = function() {
  return jspb.Message.getField(this, 6) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.SmartContract.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.SmartContract.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.SmartContract} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.toObject = function(includeInstance, msg) {
  var f, obj = {
    originAddress: msg.getOriginAddress_asB64(),
    contractAddress: msg.getContractAddress_asB64(),
    abi: (f = msg.getAbi()) && proto.protocol.SmartContract.ABI.toObject(includeInstance, f),
    bytecode: msg.getBytecode_asB64(),
    callValue: jspb.Message.getFieldWithDefault(msg, 5, 0),
    consumeUserResourcePercent: jspb.Message.getFieldWithDefault(msg, 6, 0),
    name: jspb.Message.getFieldWithDefault(msg, 7, ""),
    originEnergyLimit: jspb.Message.getFieldWithDefault(msg, 8, 0),
    codeHash: msg.getCodeHash_asB64(),
    trxHash: msg.getTrxHash_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.SmartContract}
 */
proto.protocol.SmartContract.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.SmartContract;
  return proto.protocol.SmartContract.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.SmartContract} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.SmartContract}
 */
proto.protocol.SmartContract.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setOriginAddress(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setContractAddress(value);
      break;
    case 3:
      var value = new proto.protocol.SmartContract.ABI;
      reader.readMessage(value,proto.protocol.SmartContract.ABI.deserializeBinaryFromReader);
      msg.setAbi(value);
      break;
    case 4:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setBytecode(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setCallValue(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setConsumeUserResourcePercent(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setOriginEnergyLimit(value);
      break;
    case 9:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setCodeHash(value);
      break;
    case 10:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setTrxHash(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.SmartContract.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.SmartContract} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOriginAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getContractAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getAbi();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.protocol.SmartContract.ABI.serializeBinaryToWriter
    );
  }
  f = message.getBytecode_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      4,
      f
    );
  }
  f = message.getCallValue();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getConsumeUserResourcePercent();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getOriginEnergyLimit();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
  f = message.getCodeHash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      9,
      f
    );
  }
  f = message.getTrxHash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      10,
      f
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.SmartContract.ABI.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.SmartContract.ABI.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.SmartContract.ABI.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.SmartContract.ABI} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.ABI.toObject = function(includeInstance, msg) {
  var f, obj = {
    entrysList: jspb.Message.toObjectList(msg.getEntrysList(),
    proto.protocol.SmartContract.ABI.Entry.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.SmartContract.ABI}
 */
proto.protocol.SmartContract.ABI.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.SmartContract.ABI;
  return proto.protocol.SmartContract.ABI.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.SmartContract.ABI} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.SmartContract.ABI}
 */
proto.protocol.SmartContract.ABI.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.protocol.SmartContract.ABI.Entry;
      reader.readMessage(value,proto.protocol.SmartContract.ABI.Entry.deserializeBinaryFromReader);
      msg.addEntrys(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.ABI.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.SmartContract.ABI.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.SmartContract.ABI} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.ABI.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEntrysList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.protocol.SmartContract.ABI.Entry.serializeBinaryToWriter
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.SmartContract.ABI.Entry.repeatedFields_ = [4,5];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.SmartContract.ABI.Entry.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.SmartContract.ABI.Entry} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.ABI.Entry.toObject = function(includeInstance, msg) {
  var f, obj = {
    anonymous: jspb.Message.getFieldWithDefault(msg, 1, false),
    constant: jspb.Message.getFieldWithDefault(msg, 2, false),
    name: jspb.Message.getFieldWithDefault(msg, 3, ""),
    inputsList: jspb.Message.toObjectList(msg.getInputsList(),
    proto.protocol.SmartContract.ABI.Entry.Param.toObject, includeInstance),
    outputsList: jspb.Message.toObjectList(msg.getOutputsList(),
    proto.protocol.SmartContract.ABI.Entry.Param.toObject, includeInstance),
    type: jspb.Message.getFieldWithDefault(msg, 6, 0),
    payable: jspb.Message.getFieldWithDefault(msg, 7, false),
    statemutability: jspb.Message.getFieldWithDefault(msg, 8, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.SmartContract.ABI.Entry}
 */
proto.protocol.SmartContract.ABI.Entry.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.SmartContract.ABI.Entry;
  return proto.protocol.SmartContract.ABI.Entry.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.SmartContract.ABI.Entry} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.SmartContract.ABI.Entry}
 */
proto.protocol.SmartContract.ABI.Entry.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setAnonymous(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setConstant(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = new proto.protocol.SmartContract.ABI.Entry.Param;
      reader.readMessage(value,proto.protocol.SmartContract.ABI.Entry.Param.deserializeBinaryFromReader);
      msg.addInputs(value);
      break;
    case 5:
      var value = new proto.protocol.SmartContract.ABI.Entry.Param;
      reader.readMessage(value,proto.protocol.SmartContract.ABI.Entry.Param.deserializeBinaryFromReader);
      msg.addOutputs(value);
      break;
    case 6:
      var value = /** @type {!proto.protocol.SmartContract.ABI.Entry.EntryType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 7:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setPayable(value);
      break;
    case 8:
      var value = /** @type {!proto.protocol.SmartContract.ABI.Entry.StateMutabilityType} */ (reader.readEnum());
      msg.setStatemutability(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.SmartContract.ABI.Entry.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.SmartContract.ABI.Entry} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.ABI.Entry.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAnonymous();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getConstant();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getInputsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.protocol.SmartContract.ABI.Entry.Param.serializeBinaryToWriter
    );
  }
  f = message.getOutputsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      5,
      f,
      proto.protocol.SmartContract.ABI.Entry.Param.serializeBinaryToWriter
    );
  }
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      6,
      f
    );
  }
  f = message.getPayable();
  if (f) {
    writer.writeBool(
      7,
      f
    );
  }
  f = message.getStatemutability();
  if (f !== 0.0) {
    writer.writeEnum(
      8,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.protocol.SmartContract.ABI.Entry.EntryType = {
  UNKNOWNENTRYTYPE: 0,
  CONSTRUCTOR: 1,
  FUNCTION: 2,
  EVENT: 3,
  FALLBACK: 4
};

/**
 * @enum {number}
 */
proto.protocol.SmartContract.ABI.Entry.StateMutabilityType = {
  UNKNOWNMUTABILITYTYPE: 0,
  PURE: 1,
  VIEW: 2,
  NONPAYABLE: 3,
  PAYABLE: 4
};




if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.SmartContract.ABI.Entry.Param.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.SmartContract.ABI.Entry.Param} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.ABI.Entry.Param.toObject = function(includeInstance, msg) {
  var f, obj = {
    indexed: jspb.Message.getFieldWithDefault(msg, 1, false),
    name: jspb.Message.getFieldWithDefault(msg, 2, ""),
    type: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.SmartContract.ABI.Entry.Param}
 */
proto.protocol.SmartContract.ABI.Entry.Param.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.SmartContract.ABI.Entry.Param;
  return proto.protocol.SmartContract.ABI.Entry.Param.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.SmartContract.ABI.Entry.Param} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.SmartContract.ABI.Entry.Param}
 */
proto.protocol.SmartContract.ABI.Entry.Param.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIndexed(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setType(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.SmartContract.ABI.Entry.Param.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.SmartContract.ABI.Entry.Param} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.SmartContract.ABI.Entry.Param.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIndexed();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional bool indexed = 1;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.getIndexed = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 1, false));
};


/** @param {boolean} value */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.setIndexed = function(value) {
  jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.setName = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string type = 3;
 * @return {string}
 */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/** @param {string} value */
proto.protocol.SmartContract.ABI.Entry.Param.prototype.setType = function(value) {
  jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional bool anonymous = 1;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getAnonymous = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 1, false));
};


/** @param {boolean} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setAnonymous = function(value) {
  jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool constant = 2;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getConstant = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 2, false));
};


/** @param {boolean} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setConstant = function(value) {
  jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/** @param {string} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setName = function(value) {
  jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * repeated Param inputs = 4;
 * @return {!Array<!proto.protocol.SmartContract.ABI.Entry.Param>}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getInputsList = function() {
  return /** @type{!Array<!proto.protocol.SmartContract.ABI.Entry.Param>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.SmartContract.ABI.Entry.Param, 4));
};


/** @param {!Array<!proto.protocol.SmartContract.ABI.Entry.Param>} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setInputsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.protocol.SmartContract.ABI.Entry.Param=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.SmartContract.ABI.Entry.Param}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.addInputs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.protocol.SmartContract.ABI.Entry.Param, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.SmartContract.ABI.Entry.prototype.clearInputsList = function() {
  this.setInputsList([]);
};


/**
 * repeated Param outputs = 5;
 * @return {!Array<!proto.protocol.SmartContract.ABI.Entry.Param>}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getOutputsList = function() {
  return /** @type{!Array<!proto.protocol.SmartContract.ABI.Entry.Param>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.SmartContract.ABI.Entry.Param, 5));
};


/** @param {!Array<!proto.protocol.SmartContract.ABI.Entry.Param>} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setOutputsList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 5, value);
};


/**
 * @param {!proto.protocol.SmartContract.ABI.Entry.Param=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.SmartContract.ABI.Entry.Param}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.addOutputs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.protocol.SmartContract.ABI.Entry.Param, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.SmartContract.ABI.Entry.prototype.clearOutputsList = function() {
  this.setOutputsList([]);
};


/**
 * optional EntryType type = 6;
 * @return {!proto.protocol.SmartContract.ABI.Entry.EntryType}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getType = function() {
  return /** @type {!proto.protocol.SmartContract.ABI.Entry.EntryType} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {!proto.protocol.SmartContract.ABI.Entry.EntryType} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setType = function(value) {
  jspb.Message.setProto3EnumField(this, 6, value);
};


/**
 * optional bool payable = 7;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getPayable = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 7, false));
};


/** @param {boolean} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setPayable = function(value) {
  jspb.Message.setProto3BooleanField(this, 7, value);
};


/**
 * optional StateMutabilityType stateMutability = 8;
 * @return {!proto.protocol.SmartContract.ABI.Entry.StateMutabilityType}
 */
proto.protocol.SmartContract.ABI.Entry.prototype.getStatemutability = function() {
  return /** @type {!proto.protocol.SmartContract.ABI.Entry.StateMutabilityType} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {!proto.protocol.SmartContract.ABI.Entry.StateMutabilityType} value */
proto.protocol.SmartContract.ABI.Entry.prototype.setStatemutability = function(value) {
  jspb.Message.setProto3EnumField(this, 8, value);
};


/**
 * repeated Entry entrys = 1;
 * @return {!Array<!proto.protocol.SmartContract.ABI.Entry>}
 */
proto.protocol.SmartContract.ABI.prototype.getEntrysList = function() {
  return /** @type{!Array<!proto.protocol.SmartContract.ABI.Entry>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.SmartContract.ABI.Entry, 1));
};


/** @param {!Array<!proto.protocol.SmartContract.ABI.Entry>} value */
proto.protocol.SmartContract.ABI.prototype.setEntrysList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.protocol.SmartContract.ABI.Entry=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.SmartContract.ABI.Entry}
 */
proto.protocol.SmartContract.ABI.prototype.addEntrys = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.protocol.SmartContract.ABI.Entry, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.SmartContract.ABI.prototype.clearEntrysList = function() {
  this.setEntrysList([]);
};


/**
 * optional bytes origin_address = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.SmartContract.prototype.getOriginAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes origin_address = 1;
 * This is a type-conversion wrapper around `getOriginAddress()`
 * @return {string}
 */
proto.protocol.SmartContract.prototype.getOriginAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getOriginAddress()));
};


/**
 * optional bytes origin_address = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getOriginAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.prototype.getOriginAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getOriginAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.SmartContract.prototype.setOriginAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional bytes contract_address = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.SmartContract.prototype.getContractAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes contract_address = 2;
 * This is a type-conversion wrapper around `getContractAddress()`
 * @return {string}
 */
proto.protocol.SmartContract.prototype.getContractAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getContractAddress()));
};


/**
 * optional bytes contract_address = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getContractAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.prototype.getContractAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getContractAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.SmartContract.prototype.setContractAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional ABI abi = 3;
 * @return {?proto.protocol.SmartContract.ABI}
 */
proto.protocol.SmartContract.prototype.getAbi = function() {
  return /** @type{?proto.protocol.SmartContract.ABI} */ (
    jspb.Message.getWrapperField(this, proto.protocol.SmartContract.ABI, 3));
};


/** @param {?proto.protocol.SmartContract.ABI|undefined} value */
proto.protocol.SmartContract.prototype.setAbi = function(value) {
  jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.SmartContract.prototype.clearAbi = function() {
  this.setAbi(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.SmartContract.prototype.hasAbi = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional bytes bytecode = 4;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.SmartContract.prototype.getBytecode = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * optional bytes bytecode = 4;
 * This is a type-conversion wrapper around `getBytecode()`
 * @return {string}
 */
proto.protocol.SmartContract.prototype.getBytecode_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getBytecode()));
};


/**
 * optional bytes bytecode = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getBytecode()`
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.prototype.getBytecode_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getBytecode()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.SmartContract.prototype.setBytecode = function(value) {
  jspb.Message.setProto3BytesField(this, 4, value);
};


/**
 * optional int64 call_value = 5;
 * @return {number}
 */
proto.protocol.SmartContract.prototype.getCallValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.SmartContract.prototype.setCallValue = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int64 consume_user_resource_percent = 6;
 * @return {number}
 */
proto.protocol.SmartContract.prototype.getConsumeUserResourcePercent = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.SmartContract.prototype.setConsumeUserResourcePercent = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string name = 7;
 * @return {string}
 */
proto.protocol.SmartContract.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/** @param {string} value */
proto.protocol.SmartContract.prototype.setName = function(value) {
  jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional int64 origin_energy_limit = 8;
 * @return {number}
 */
proto.protocol.SmartContract.prototype.getOriginEnergyLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {number} value */
proto.protocol.SmartContract.prototype.setOriginEnergyLimit = function(value) {
  jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional bytes code_hash = 9;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.SmartContract.prototype.getCodeHash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * optional bytes code_hash = 9;
 * This is a type-conversion wrapper around `getCodeHash()`
 * @return {string}
 */
proto.protocol.SmartContract.prototype.getCodeHash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getCodeHash()));
};


/**
 * optional bytes code_hash = 9;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getCodeHash()`
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.prototype.getCodeHash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getCodeHash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.SmartContract.prototype.setCodeHash = function(value) {
  jspb.Message.setProto3BytesField(this, 9, value);
};


/**
 * optional bytes trx_hash = 10;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.SmartContract.prototype.getTrxHash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * optional bytes trx_hash = 10;
 * This is a type-conversion wrapper around `getTrxHash()`
 * @return {string}
 */
proto.protocol.SmartContract.prototype.getTrxHash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getTrxHash()));
};


/**
 * optional bytes trx_hash = 10;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTrxHash()`
 * @return {!Uint8Array}
 */
proto.protocol.SmartContract.prototype.getTrxHash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getTrxHash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.SmartContract.prototype.setTrxHash = function(value) {
  jspb.Message.setProto3BytesField(this, 10, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.InternalTransaction.repeatedFields_ = [4];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.InternalTransaction.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.InternalTransaction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.InternalTransaction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.InternalTransaction.toObject = function(includeInstance, msg) {
  var f, obj = {
    hash: msg.getHash_asB64(),
    callerAddress: msg.getCallerAddress_asB64(),
    transfertoAddress: msg.getTransfertoAddress_asB64(),
    callvalueinfoList: jspb.Message.toObjectList(msg.getCallvalueinfoList(),
    proto.protocol.InternalTransaction.CallValueInfo.toObject, includeInstance),
    note: msg.getNote_asB64(),
    rejected: jspb.Message.getFieldWithDefault(msg, 6, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.InternalTransaction}
 */
proto.protocol.InternalTransaction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.InternalTransaction;
  return proto.protocol.InternalTransaction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.InternalTransaction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.InternalTransaction}
 */
proto.protocol.InternalTransaction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setHash(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setCallerAddress(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setTransfertoAddress(value);
      break;
    case 4:
      var value = new proto.protocol.InternalTransaction.CallValueInfo;
      reader.readMessage(value,proto.protocol.InternalTransaction.CallValueInfo.deserializeBinaryFromReader);
      msg.addCallvalueinfo(value);
      break;
    case 5:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setNote(value);
      break;
    case 6:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setRejected(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.InternalTransaction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.InternalTransaction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.InternalTransaction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.InternalTransaction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHash_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getCallerAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getTransfertoAddress_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
  f = message.getCallvalueinfoList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.protocol.InternalTransaction.CallValueInfo.serializeBinaryToWriter
    );
  }
  f = message.getNote_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      5,
      f
    );
  }
  f = message.getRejected();
  if (f) {
    writer.writeBool(
      6,
      f
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.InternalTransaction.CallValueInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.InternalTransaction.CallValueInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.InternalTransaction.CallValueInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.InternalTransaction.CallValueInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    callvalue: jspb.Message.getFieldWithDefault(msg, 1, 0),
    tokenid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.InternalTransaction.CallValueInfo}
 */
proto.protocol.InternalTransaction.CallValueInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.InternalTransaction.CallValueInfo;
  return proto.protocol.InternalTransaction.CallValueInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.InternalTransaction.CallValueInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.InternalTransaction.CallValueInfo}
 */
proto.protocol.InternalTransaction.CallValueInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setCallvalue(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTokenid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.InternalTransaction.CallValueInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.InternalTransaction.CallValueInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.InternalTransaction.CallValueInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.InternalTransaction.CallValueInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCallvalue();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getTokenid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional int64 callValue = 1;
 * @return {number}
 */
proto.protocol.InternalTransaction.CallValueInfo.prototype.getCallvalue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.InternalTransaction.CallValueInfo.prototype.setCallvalue = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string tokenId = 2;
 * @return {string}
 */
proto.protocol.InternalTransaction.CallValueInfo.prototype.getTokenid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.protocol.InternalTransaction.CallValueInfo.prototype.setTokenid = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional bytes hash = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.InternalTransaction.prototype.getHash = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes hash = 1;
 * This is a type-conversion wrapper around `getHash()`
 * @return {string}
 */
proto.protocol.InternalTransaction.prototype.getHash_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getHash()));
};


/**
 * optional bytes hash = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getHash()`
 * @return {!Uint8Array}
 */
proto.protocol.InternalTransaction.prototype.getHash_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getHash()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.InternalTransaction.prototype.setHash = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * optional bytes caller_address = 2;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.InternalTransaction.prototype.getCallerAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes caller_address = 2;
 * This is a type-conversion wrapper around `getCallerAddress()`
 * @return {string}
 */
proto.protocol.InternalTransaction.prototype.getCallerAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getCallerAddress()));
};


/**
 * optional bytes caller_address = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getCallerAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.InternalTransaction.prototype.getCallerAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getCallerAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.InternalTransaction.prototype.setCallerAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional bytes transferTo_address = 3;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.InternalTransaction.prototype.getTransfertoAddress = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes transferTo_address = 3;
 * This is a type-conversion wrapper around `getTransfertoAddress()`
 * @return {string}
 */
proto.protocol.InternalTransaction.prototype.getTransfertoAddress_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getTransfertoAddress()));
};


/**
 * optional bytes transferTo_address = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTransfertoAddress()`
 * @return {!Uint8Array}
 */
proto.protocol.InternalTransaction.prototype.getTransfertoAddress_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getTransfertoAddress()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.InternalTransaction.prototype.setTransfertoAddress = function(value) {
  jspb.Message.setProto3BytesField(this, 3, value);
};


/**
 * repeated CallValueInfo callValueInfo = 4;
 * @return {!Array<!proto.protocol.InternalTransaction.CallValueInfo>}
 */
proto.protocol.InternalTransaction.prototype.getCallvalueinfoList = function() {
  return /** @type{!Array<!proto.protocol.InternalTransaction.CallValueInfo>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.InternalTransaction.CallValueInfo, 4));
};


/** @param {!Array<!proto.protocol.InternalTransaction.CallValueInfo>} value */
proto.protocol.InternalTransaction.prototype.setCallvalueinfoList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.protocol.InternalTransaction.CallValueInfo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.InternalTransaction.CallValueInfo}
 */
proto.protocol.InternalTransaction.prototype.addCallvalueinfo = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.protocol.InternalTransaction.CallValueInfo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.InternalTransaction.prototype.clearCallvalueinfoList = function() {
  this.setCallvalueinfoList([]);
};


/**
 * optional bytes note = 5;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.InternalTransaction.prototype.getNote = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * optional bytes note = 5;
 * This is a type-conversion wrapper around `getNote()`
 * @return {string}
 */
proto.protocol.InternalTransaction.prototype.getNote_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getNote()));
};


/**
 * optional bytes note = 5;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getNote()`
 * @return {!Uint8Array}
 */
proto.protocol.InternalTransaction.prototype.getNote_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getNote()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.InternalTransaction.prototype.setNote = function(value) {
  jspb.Message.setProto3BytesField(this, 5, value);
};


/**
 * optional bool rejected = 6;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.InternalTransaction.prototype.getRejected = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 6, false));
};


/** @param {boolean} value */
proto.protocol.InternalTransaction.prototype.setRejected = function(value) {
  jspb.Message.setProto3BooleanField(this, 6, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.DelegatedResourceAccountIndex.repeatedFields_ = [2,3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.DelegatedResourceAccountIndex.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.DelegatedResourceAccountIndex} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DelegatedResourceAccountIndex.toObject = function(includeInstance, msg) {
  var f, obj = {
    account: msg.getAccount_asB64(),
    fromaccountsList: msg.getFromaccountsList_asB64(),
    toaccountsList: msg.getToaccountsList_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.DelegatedResourceAccountIndex}
 */
proto.protocol.DelegatedResourceAccountIndex.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.DelegatedResourceAccountIndex;
  return proto.protocol.DelegatedResourceAccountIndex.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.DelegatedResourceAccountIndex} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.DelegatedResourceAccountIndex}
 */
proto.protocol.DelegatedResourceAccountIndex.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAccount(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.addFromaccounts(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.addToaccounts(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.DelegatedResourceAccountIndex.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.DelegatedResourceAccountIndex} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.DelegatedResourceAccountIndex.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccount_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      1,
      f
    );
  }
  f = message.getFromaccountsList_asU8();
  if (f.length > 0) {
    writer.writeRepeatedBytes(
      2,
      f
    );
  }
  f = message.getToaccountsList_asU8();
  if (f.length > 0) {
    writer.writeRepeatedBytes(
      3,
      f
    );
  }
};


/**
 * optional bytes account = 1;
 * @return {!(string|Uint8Array)}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getAccount = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * optional bytes account = 1;
 * This is a type-conversion wrapper around `getAccount()`
 * @return {string}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getAccount_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAccount()));
};


/**
 * optional bytes account = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAccount()`
 * @return {!Uint8Array}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getAccount_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAccount()));
};


/** @param {!(string|Uint8Array)} value */
proto.protocol.DelegatedResourceAccountIndex.prototype.setAccount = function(value) {
  jspb.Message.setProto3BytesField(this, 1, value);
};


/**
 * repeated bytes fromAccounts = 2;
 * @return {!(Array<!Uint8Array>|Array<string>)}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getFromaccountsList = function() {
  return /** @type {!(Array<!Uint8Array>|Array<string>)} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * repeated bytes fromAccounts = 2;
 * This is a type-conversion wrapper around `getFromaccountsList()`
 * @return {!Array<string>}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getFromaccountsList_asB64 = function() {
  return /** @type {!Array<string>} */ (jspb.Message.bytesListAsB64(
      this.getFromaccountsList()));
};


/**
 * repeated bytes fromAccounts = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getFromaccountsList()`
 * @return {!Array<!Uint8Array>}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getFromaccountsList_asU8 = function() {
  return /** @type {!Array<!Uint8Array>} */ (jspb.Message.bytesListAsU8(
      this.getFromaccountsList()));
};


/** @param {!(Array<!Uint8Array>|Array<string>)} value */
proto.protocol.DelegatedResourceAccountIndex.prototype.setFromaccountsList = function(value) {
  jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {!(string|Uint8Array)} value
 * @param {number=} opt_index
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.addFromaccounts = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.clearFromaccountsList = function() {
  this.setFromaccountsList([]);
};


/**
 * repeated bytes toAccounts = 3;
 * @return {!(Array<!Uint8Array>|Array<string>)}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getToaccountsList = function() {
  return /** @type {!(Array<!Uint8Array>|Array<string>)} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * repeated bytes toAccounts = 3;
 * This is a type-conversion wrapper around `getToaccountsList()`
 * @return {!Array<string>}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getToaccountsList_asB64 = function() {
  return /** @type {!Array<string>} */ (jspb.Message.bytesListAsB64(
      this.getToaccountsList()));
};


/**
 * repeated bytes toAccounts = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getToaccountsList()`
 * @return {!Array<!Uint8Array>}
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.getToaccountsList_asU8 = function() {
  return /** @type {!Array<!Uint8Array>} */ (jspb.Message.bytesListAsU8(
      this.getToaccountsList()));
};


/** @param {!(Array<!Uint8Array>|Array<string>)} value */
proto.protocol.DelegatedResourceAccountIndex.prototype.setToaccountsList = function(value) {
  jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {!(string|Uint8Array)} value
 * @param {number=} opt_index
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.addToaccounts = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.DelegatedResourceAccountIndex.prototype.clearToaccountsList = function() {
  this.setToaccountsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.NodeInfo.repeatedFields_ = [8];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.NodeInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.NodeInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.NodeInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    beginsyncnum: jspb.Message.getFieldWithDefault(msg, 1, 0),
    block: jspb.Message.getFieldWithDefault(msg, 2, ""),
    solidityblock: jspb.Message.getFieldWithDefault(msg, 3, ""),
    currentconnectcount: jspb.Message.getFieldWithDefault(msg, 4, 0),
    activeconnectcount: jspb.Message.getFieldWithDefault(msg, 5, 0),
    passiveconnectcount: jspb.Message.getFieldWithDefault(msg, 6, 0),
    totalflow: jspb.Message.getFieldWithDefault(msg, 7, 0),
    peerinfolistList: jspb.Message.toObjectList(msg.getPeerinfolistList(),
    proto.protocol.NodeInfo.PeerInfo.toObject, includeInstance),
    confignodeinfo: (f = msg.getConfignodeinfo()) && proto.protocol.NodeInfo.ConfigNodeInfo.toObject(includeInstance, f),
    machineinfo: (f = msg.getMachineinfo()) && proto.protocol.NodeInfo.MachineInfo.toObject(includeInstance, f),
    cheatwitnessinfomapMap: (f = msg.getCheatwitnessinfomapMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.NodeInfo}
 */
proto.protocol.NodeInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.NodeInfo;
  return proto.protocol.NodeInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.NodeInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.NodeInfo}
 */
proto.protocol.NodeInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setBeginsyncnum(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBlock(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setSolidityblock(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCurrentconnectcount(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setActiveconnectcount(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPassiveconnectcount(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTotalflow(value);
      break;
    case 8:
      var value = new proto.protocol.NodeInfo.PeerInfo;
      reader.readMessage(value,proto.protocol.NodeInfo.PeerInfo.deserializeBinaryFromReader);
      msg.addPeerinfolist(value);
      break;
    case 9:
      var value = new proto.protocol.NodeInfo.ConfigNodeInfo;
      reader.readMessage(value,proto.protocol.NodeInfo.ConfigNodeInfo.deserializeBinaryFromReader);
      msg.setConfignodeinfo(value);
      break;
    case 10:
      var value = new proto.protocol.NodeInfo.MachineInfo;
      reader.readMessage(value,proto.protocol.NodeInfo.MachineInfo.deserializeBinaryFromReader);
      msg.setMachineinfo(value);
      break;
    case 11:
      var value = msg.getCheatwitnessinfomapMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.NodeInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.NodeInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.NodeInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBeginsyncnum();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getBlock();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getSolidityblock();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getCurrentconnectcount();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getActiveconnectcount();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getPassiveconnectcount();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
  f = message.getTotalflow();
  if (f !== 0) {
    writer.writeInt64(
      7,
      f
    );
  }
  f = message.getPeerinfolistList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      8,
      f,
      proto.protocol.NodeInfo.PeerInfo.serializeBinaryToWriter
    );
  }
  f = message.getConfignodeinfo();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.protocol.NodeInfo.ConfigNodeInfo.serializeBinaryToWriter
    );
  }
  f = message.getMachineinfo();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      proto.protocol.NodeInfo.MachineInfo.serializeBinaryToWriter
    );
  }
  f = message.getCheatwitnessinfomapMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(11, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.NodeInfo.PeerInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.NodeInfo.PeerInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.PeerInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    lastsyncblock: jspb.Message.getFieldWithDefault(msg, 1, ""),
    remainnum: jspb.Message.getFieldWithDefault(msg, 2, 0),
    lastblockupdatetime: jspb.Message.getFieldWithDefault(msg, 3, 0),
    syncflag: jspb.Message.getFieldWithDefault(msg, 4, false),
    headblocktimewebothhave: jspb.Message.getFieldWithDefault(msg, 5, 0),
    needsyncfrompeer: jspb.Message.getFieldWithDefault(msg, 6, false),
    needsyncfromus: jspb.Message.getFieldWithDefault(msg, 7, false),
    host: jspb.Message.getFieldWithDefault(msg, 8, ""),
    port: jspb.Message.getFieldWithDefault(msg, 9, 0),
    nodeid: jspb.Message.getFieldWithDefault(msg, 10, ""),
    connecttime: jspb.Message.getFieldWithDefault(msg, 11, 0),
    avglatency: +jspb.Message.getFieldWithDefault(msg, 12, 0.0),
    synctofetchsize: jspb.Message.getFieldWithDefault(msg, 13, 0),
    synctofetchsizepeeknum: jspb.Message.getFieldWithDefault(msg, 14, 0),
    syncblockrequestedsize: jspb.Message.getFieldWithDefault(msg, 15, 0),
    unfetchsynnum: jspb.Message.getFieldWithDefault(msg, 16, 0),
    blockinporcsize: jspb.Message.getFieldWithDefault(msg, 17, 0),
    headblockwebothhave: jspb.Message.getFieldWithDefault(msg, 18, ""),
    isactive: jspb.Message.getFieldWithDefault(msg, 19, false),
    score: jspb.Message.getFieldWithDefault(msg, 20, 0),
    nodecount: jspb.Message.getFieldWithDefault(msg, 21, 0),
    inflow: jspb.Message.getFieldWithDefault(msg, 22, 0),
    disconnecttimes: jspb.Message.getFieldWithDefault(msg, 23, 0),
    localdisconnectreason: jspb.Message.getFieldWithDefault(msg, 24, ""),
    remotedisconnectreason: jspb.Message.getFieldWithDefault(msg, 25, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.NodeInfo.PeerInfo}
 */
proto.protocol.NodeInfo.PeerInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.NodeInfo.PeerInfo;
  return proto.protocol.NodeInfo.PeerInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.NodeInfo.PeerInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.NodeInfo.PeerInfo}
 */
proto.protocol.NodeInfo.PeerInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setLastsyncblock(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setRemainnum(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLastblockupdatetime(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSyncflag(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setHeadblocktimewebothhave(value);
      break;
    case 6:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setNeedsyncfrompeer(value);
      break;
    case 7:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setNeedsyncfromus(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setHost(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPort(value);
      break;
    case 10:
      var value = /** @type {string} */ (reader.readString());
      msg.setNodeid(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setConnecttime(value);
      break;
    case 12:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setAvglatency(value);
      break;
    case 13:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setSynctofetchsize(value);
      break;
    case 14:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setSynctofetchsizepeeknum(value);
      break;
    case 15:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setSyncblockrequestedsize(value);
      break;
    case 16:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUnfetchsynnum(value);
      break;
    case 17:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setBlockinporcsize(value);
      break;
    case 18:
      var value = /** @type {string} */ (reader.readString());
      msg.setHeadblockwebothhave(value);
      break;
    case 19:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsactive(value);
      break;
    case 20:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setScore(value);
      break;
    case 21:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setNodecount(value);
      break;
    case 22:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setInflow(value);
      break;
    case 23:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDisconnecttimes(value);
      break;
    case 24:
      var value = /** @type {string} */ (reader.readString());
      msg.setLocaldisconnectreason(value);
      break;
    case 25:
      var value = /** @type {string} */ (reader.readString());
      msg.setRemotedisconnectreason(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.NodeInfo.PeerInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.NodeInfo.PeerInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.PeerInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLastsyncblock();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRemainnum();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getLastblockupdatetime();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getSyncflag();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
  f = message.getHeadblocktimewebothhave();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getNeedsyncfrompeer();
  if (f) {
    writer.writeBool(
      6,
      f
    );
  }
  f = message.getNeedsyncfromus();
  if (f) {
    writer.writeBool(
      7,
      f
    );
  }
  f = message.getHost();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getPort();
  if (f !== 0) {
    writer.writeInt32(
      9,
      f
    );
  }
  f = message.getNodeid();
  if (f.length > 0) {
    writer.writeString(
      10,
      f
    );
  }
  f = message.getConnecttime();
  if (f !== 0) {
    writer.writeInt64(
      11,
      f
    );
  }
  f = message.getAvglatency();
  if (f !== 0.0) {
    writer.writeDouble(
      12,
      f
    );
  }
  f = message.getSynctofetchsize();
  if (f !== 0) {
    writer.writeInt32(
      13,
      f
    );
  }
  f = message.getSynctofetchsizepeeknum();
  if (f !== 0) {
    writer.writeInt64(
      14,
      f
    );
  }
  f = message.getSyncblockrequestedsize();
  if (f !== 0) {
    writer.writeInt32(
      15,
      f
    );
  }
  f = message.getUnfetchsynnum();
  if (f !== 0) {
    writer.writeInt64(
      16,
      f
    );
  }
  f = message.getBlockinporcsize();
  if (f !== 0) {
    writer.writeInt32(
      17,
      f
    );
  }
  f = message.getHeadblockwebothhave();
  if (f.length > 0) {
    writer.writeString(
      18,
      f
    );
  }
  f = message.getIsactive();
  if (f) {
    writer.writeBool(
      19,
      f
    );
  }
  f = message.getScore();
  if (f !== 0) {
    writer.writeInt32(
      20,
      f
    );
  }
  f = message.getNodecount();
  if (f !== 0) {
    writer.writeInt32(
      21,
      f
    );
  }
  f = message.getInflow();
  if (f !== 0) {
    writer.writeInt64(
      22,
      f
    );
  }
  f = message.getDisconnecttimes();
  if (f !== 0) {
    writer.writeInt32(
      23,
      f
    );
  }
  f = message.getLocaldisconnectreason();
  if (f.length > 0) {
    writer.writeString(
      24,
      f
    );
  }
  f = message.getRemotedisconnectreason();
  if (f.length > 0) {
    writer.writeString(
      25,
      f
    );
  }
};


/**
 * optional string lastSyncBlock = 1;
 * @return {string}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getLastsyncblock = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setLastsyncblock = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int64 remainNum = 2;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getRemainnum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setRemainnum = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int64 lastBlockUpdateTime = 3;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getLastblockupdatetime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setLastblockupdatetime = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional bool syncFlag = 4;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getSyncflag = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 4, false));
};


/** @param {boolean} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setSyncflag = function(value) {
  jspb.Message.setProto3BooleanField(this, 4, value);
};


/**
 * optional int64 headBlockTimeWeBothHave = 5;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getHeadblocktimewebothhave = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setHeadblocktimewebothhave = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional bool needSyncFromPeer = 6;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getNeedsyncfrompeer = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 6, false));
};


/** @param {boolean} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setNeedsyncfrompeer = function(value) {
  jspb.Message.setProto3BooleanField(this, 6, value);
};


/**
 * optional bool needSyncFromUs = 7;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getNeedsyncfromus = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 7, false));
};


/** @param {boolean} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setNeedsyncfromus = function(value) {
  jspb.Message.setProto3BooleanField(this, 7, value);
};


/**
 * optional string host = 8;
 * @return {string}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getHost = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setHost = function(value) {
  jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional int32 port = 9;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getPort = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setPort = function(value) {
  jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional string nodeId = 10;
 * @return {string}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getNodeid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setNodeid = function(value) {
  jspb.Message.setProto3StringField(this, 10, value);
};


/**
 * optional int64 connectTime = 11;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getConnecttime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 11, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setConnecttime = function(value) {
  jspb.Message.setProto3IntField(this, 11, value);
};


/**
 * optional double avgLatency = 12;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getAvglatency = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(this, 12, 0.0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setAvglatency = function(value) {
  jspb.Message.setProto3FloatField(this, 12, value);
};


/**
 * optional int32 syncToFetchSize = 13;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getSynctofetchsize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 13, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setSynctofetchsize = function(value) {
  jspb.Message.setProto3IntField(this, 13, value);
};


/**
 * optional int64 syncToFetchSizePeekNum = 14;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getSynctofetchsizepeeknum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 14, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setSynctofetchsizepeeknum = function(value) {
  jspb.Message.setProto3IntField(this, 14, value);
};


/**
 * optional int32 syncBlockRequestedSize = 15;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getSyncblockrequestedsize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 15, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setSyncblockrequestedsize = function(value) {
  jspb.Message.setProto3IntField(this, 15, value);
};


/**
 * optional int64 unFetchSynNum = 16;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getUnfetchsynnum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 16, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setUnfetchsynnum = function(value) {
  jspb.Message.setProto3IntField(this, 16, value);
};


/**
 * optional int32 blockInPorcSize = 17;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getBlockinporcsize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 17, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setBlockinporcsize = function(value) {
  jspb.Message.setProto3IntField(this, 17, value);
};


/**
 * optional string headBlockWeBothHave = 18;
 * @return {string}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getHeadblockwebothhave = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 18, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setHeadblockwebothhave = function(value) {
  jspb.Message.setProto3StringField(this, 18, value);
};


/**
 * optional bool isActive = 19;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getIsactive = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 19, false));
};


/** @param {boolean} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setIsactive = function(value) {
  jspb.Message.setProto3BooleanField(this, 19, value);
};


/**
 * optional int32 score = 20;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getScore = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 20, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setScore = function(value) {
  jspb.Message.setProto3IntField(this, 20, value);
};


/**
 * optional int32 nodeCount = 21;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getNodecount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 21, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setNodecount = function(value) {
  jspb.Message.setProto3IntField(this, 21, value);
};


/**
 * optional int64 inFlow = 22;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getInflow = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 22, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setInflow = function(value) {
  jspb.Message.setProto3IntField(this, 22, value);
};


/**
 * optional int32 disconnectTimes = 23;
 * @return {number}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getDisconnecttimes = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 23, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setDisconnecttimes = function(value) {
  jspb.Message.setProto3IntField(this, 23, value);
};


/**
 * optional string localDisconnectReason = 24;
 * @return {string}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getLocaldisconnectreason = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 24, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setLocaldisconnectreason = function(value) {
  jspb.Message.setProto3StringField(this, 24, value);
};


/**
 * optional string remoteDisconnectReason = 25;
 * @return {string}
 */
proto.protocol.NodeInfo.PeerInfo.prototype.getRemotedisconnectreason = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 25, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.PeerInfo.prototype.setRemotedisconnectreason = function(value) {
  jspb.Message.setProto3StringField(this, 25, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.NodeInfo.ConfigNodeInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.NodeInfo.ConfigNodeInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.ConfigNodeInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    codeversion: jspb.Message.getFieldWithDefault(msg, 1, ""),
    p2pversion: jspb.Message.getFieldWithDefault(msg, 2, ""),
    listenport: jspb.Message.getFieldWithDefault(msg, 3, 0),
    discoverenable: jspb.Message.getFieldWithDefault(msg, 4, false),
    activenodesize: jspb.Message.getFieldWithDefault(msg, 5, 0),
    passivenodesize: jspb.Message.getFieldWithDefault(msg, 6, 0),
    sendnodesize: jspb.Message.getFieldWithDefault(msg, 7, 0),
    maxconnectcount: jspb.Message.getFieldWithDefault(msg, 8, 0),
    sameipmaxconnectcount: jspb.Message.getFieldWithDefault(msg, 9, 0),
    backuplistenport: jspb.Message.getFieldWithDefault(msg, 10, 0),
    backupmembersize: jspb.Message.getFieldWithDefault(msg, 11, 0),
    backuppriority: jspb.Message.getFieldWithDefault(msg, 12, 0),
    dbversion: jspb.Message.getFieldWithDefault(msg, 13, 0),
    minparticipationrate: jspb.Message.getFieldWithDefault(msg, 14, 0),
    supportconstant: jspb.Message.getFieldWithDefault(msg, 15, false),
    mintimeratio: +jspb.Message.getFieldWithDefault(msg, 16, 0.0),
    maxtimeratio: +jspb.Message.getFieldWithDefault(msg, 17, 0.0),
    allowcreationofcontracts: jspb.Message.getFieldWithDefault(msg, 18, 0),
    allowadaptiveenergy: jspb.Message.getFieldWithDefault(msg, 19, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.NodeInfo.ConfigNodeInfo}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.NodeInfo.ConfigNodeInfo;
  return proto.protocol.NodeInfo.ConfigNodeInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.NodeInfo.ConfigNodeInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.NodeInfo.ConfigNodeInfo}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setCodeversion(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setP2pversion(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setListenport(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setDiscoverenable(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setActivenodesize(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPassivenodesize(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setSendnodesize(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setMaxconnectcount(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setSameipmaxconnectcount(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setBackuplistenport(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setBackupmembersize(value);
      break;
    case 12:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setBackuppriority(value);
      break;
    case 13:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDbversion(value);
      break;
    case 14:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setMinparticipationrate(value);
      break;
    case 15:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSupportconstant(value);
      break;
    case 16:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setMintimeratio(value);
      break;
    case 17:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setMaxtimeratio(value);
      break;
    case 18:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setAllowcreationofcontracts(value);
      break;
    case 19:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setAllowadaptiveenergy(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.NodeInfo.ConfigNodeInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.NodeInfo.ConfigNodeInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.ConfigNodeInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCodeversion();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getP2pversion();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getListenport();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getDiscoverenable();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
  f = message.getActivenodesize();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getPassivenodesize();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
  f = message.getSendnodesize();
  if (f !== 0) {
    writer.writeInt32(
      7,
      f
    );
  }
  f = message.getMaxconnectcount();
  if (f !== 0) {
    writer.writeInt32(
      8,
      f
    );
  }
  f = message.getSameipmaxconnectcount();
  if (f !== 0) {
    writer.writeInt32(
      9,
      f
    );
  }
  f = message.getBackuplistenport();
  if (f !== 0) {
    writer.writeInt32(
      10,
      f
    );
  }
  f = message.getBackupmembersize();
  if (f !== 0) {
    writer.writeInt32(
      11,
      f
    );
  }
  f = message.getBackuppriority();
  if (f !== 0) {
    writer.writeInt32(
      12,
      f
    );
  }
  f = message.getDbversion();
  if (f !== 0) {
    writer.writeInt32(
      13,
      f
    );
  }
  f = message.getMinparticipationrate();
  if (f !== 0) {
    writer.writeInt32(
      14,
      f
    );
  }
  f = message.getSupportconstant();
  if (f) {
    writer.writeBool(
      15,
      f
    );
  }
  f = message.getMintimeratio();
  if (f !== 0.0) {
    writer.writeDouble(
      16,
      f
    );
  }
  f = message.getMaxtimeratio();
  if (f !== 0.0) {
    writer.writeDouble(
      17,
      f
    );
  }
  f = message.getAllowcreationofcontracts();
  if (f !== 0) {
    writer.writeInt64(
      18,
      f
    );
  }
  f = message.getAllowadaptiveenergy();
  if (f !== 0) {
    writer.writeInt64(
      19,
      f
    );
  }
};


/**
 * optional string codeVersion = 1;
 * @return {string}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getCodeversion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setCodeversion = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string p2pVersion = 2;
 * @return {string}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getP2pversion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setP2pversion = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 listenPort = 3;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getListenport = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setListenport = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional bool discoverEnable = 4;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getDiscoverenable = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 4, false));
};


/** @param {boolean} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setDiscoverenable = function(value) {
  jspb.Message.setProto3BooleanField(this, 4, value);
};


/**
 * optional int32 activeNodeSize = 5;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getActivenodesize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setActivenodesize = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int32 passiveNodeSize = 6;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getPassivenodesize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setPassivenodesize = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional int32 sendNodeSize = 7;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getSendnodesize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setSendnodesize = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional int32 maxConnectCount = 8;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getMaxconnectcount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setMaxconnectcount = function(value) {
  jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional int32 sameIpMaxConnectCount = 9;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getSameipmaxconnectcount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setSameipmaxconnectcount = function(value) {
  jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional int32 backupListenPort = 10;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getBackuplistenport = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setBackuplistenport = function(value) {
  jspb.Message.setProto3IntField(this, 10, value);
};


/**
 * optional int32 backupMemberSize = 11;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getBackupmembersize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 11, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setBackupmembersize = function(value) {
  jspb.Message.setProto3IntField(this, 11, value);
};


/**
 * optional int32 backupPriority = 12;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getBackuppriority = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 12, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setBackuppriority = function(value) {
  jspb.Message.setProto3IntField(this, 12, value);
};


/**
 * optional int32 dbVersion = 13;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getDbversion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 13, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setDbversion = function(value) {
  jspb.Message.setProto3IntField(this, 13, value);
};


/**
 * optional int32 minParticipationRate = 14;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getMinparticipationrate = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 14, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setMinparticipationrate = function(value) {
  jspb.Message.setProto3IntField(this, 14, value);
};


/**
 * optional bool supportConstant = 15;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getSupportconstant = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 15, false));
};


/** @param {boolean} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setSupportconstant = function(value) {
  jspb.Message.setProto3BooleanField(this, 15, value);
};


/**
 * optional double minTimeRatio = 16;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getMintimeratio = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(this, 16, 0.0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setMintimeratio = function(value) {
  jspb.Message.setProto3FloatField(this, 16, value);
};


/**
 * optional double maxTimeRatio = 17;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getMaxtimeratio = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(this, 17, 0.0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setMaxtimeratio = function(value) {
  jspb.Message.setProto3FloatField(this, 17, value);
};


/**
 * optional int64 allowCreationOfContracts = 18;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getAllowcreationofcontracts = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 18, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setAllowcreationofcontracts = function(value) {
  jspb.Message.setProto3IntField(this, 18, value);
};


/**
 * optional int64 allowAdaptiveEnergy = 19;
 * @return {number}
 */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.getAllowadaptiveenergy = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 19, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.ConfigNodeInfo.prototype.setAllowadaptiveenergy = function(value) {
  jspb.Message.setProto3IntField(this, 19, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.protocol.NodeInfo.MachineInfo.repeatedFields_ = [12,13];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.NodeInfo.MachineInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.NodeInfo.MachineInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.MachineInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    threadcount: jspb.Message.getFieldWithDefault(msg, 1, 0),
    deadlockthreadcount: jspb.Message.getFieldWithDefault(msg, 2, 0),
    cpucount: jspb.Message.getFieldWithDefault(msg, 3, 0),
    totalmemory: jspb.Message.getFieldWithDefault(msg, 4, 0),
    freememory: jspb.Message.getFieldWithDefault(msg, 5, 0),
    cpurate: +jspb.Message.getFieldWithDefault(msg, 6, 0.0),
    javaversion: jspb.Message.getFieldWithDefault(msg, 7, ""),
    osname: jspb.Message.getFieldWithDefault(msg, 8, ""),
    jvmtotalmemoery: jspb.Message.getFieldWithDefault(msg, 9, 0),
    jvmfreememory: jspb.Message.getFieldWithDefault(msg, 10, 0),
    processcpurate: +jspb.Message.getFieldWithDefault(msg, 11, 0.0),
    memorydescinfolistList: jspb.Message.toObjectList(msg.getMemorydescinfolistList(),
    proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.toObject, includeInstance),
    deadlockthreadinfolistList: jspb.Message.toObjectList(msg.getDeadlockthreadinfolistList(),
    proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.NodeInfo.MachineInfo}
 */
proto.protocol.NodeInfo.MachineInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.NodeInfo.MachineInfo;
  return proto.protocol.NodeInfo.MachineInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.NodeInfo.MachineInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.NodeInfo.MachineInfo}
 */
proto.protocol.NodeInfo.MachineInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setThreadcount(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDeadlockthreadcount(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCpucount(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTotalmemory(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFreememory(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setCpurate(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setJavaversion(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setOsname(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setJvmtotalmemoery(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setJvmfreememory(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setProcesscpurate(value);
      break;
    case 12:
      var value = new proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo;
      reader.readMessage(value,proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.deserializeBinaryFromReader);
      msg.addMemorydescinfolist(value);
      break;
    case 13:
      var value = new proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo;
      reader.readMessage(value,proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.deserializeBinaryFromReader);
      msg.addDeadlockthreadinfolist(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.NodeInfo.MachineInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.NodeInfo.MachineInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.MachineInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getThreadcount();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getDeadlockthreadcount();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getCpucount();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getTotalmemory();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getFreememory();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getCpurate();
  if (f !== 0.0) {
    writer.writeDouble(
      6,
      f
    );
  }
  f = message.getJavaversion();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getOsname();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getJvmtotalmemoery();
  if (f !== 0) {
    writer.writeInt64(
      9,
      f
    );
  }
  f = message.getJvmfreememory();
  if (f !== 0) {
    writer.writeInt64(
      10,
      f
    );
  }
  f = message.getProcesscpurate();
  if (f !== 0.0) {
    writer.writeDouble(
      11,
      f
    );
  }
  f = message.getMemorydescinfolistList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      12,
      f,
      proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.serializeBinaryToWriter
    );
  }
  f = message.getDeadlockthreadinfolistList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      13,
      f,
      proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    initsize: jspb.Message.getFieldWithDefault(msg, 2, 0),
    usesize: jspb.Message.getFieldWithDefault(msg, 3, 0),
    maxsize: jspb.Message.getFieldWithDefault(msg, 4, 0),
    userate: +jspb.Message.getFieldWithDefault(msg, 5, 0.0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo;
  return proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setInitsize(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUsesize(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setMaxsize(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setUserate(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getInitsize();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getUsesize();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getMaxsize();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getUserate();
  if (f !== 0.0) {
    writer.writeDouble(
      5,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.setName = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int64 initSize = 2;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.getInitsize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.setInitsize = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int64 useSize = 3;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.getUsesize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.setUsesize = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 maxSize = 4;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.getMaxsize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.setMaxsize = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional double useRate = 5;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.getUserate = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(this, 5, 0.0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo.prototype.setUserate = function(value) {
  jspb.Message.setProto3FloatField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    lockname: jspb.Message.getFieldWithDefault(msg, 2, ""),
    lockowner: jspb.Message.getFieldWithDefault(msg, 3, ""),
    state: jspb.Message.getFieldWithDefault(msg, 4, ""),
    blocktime: jspb.Message.getFieldWithDefault(msg, 5, 0),
    waittime: jspb.Message.getFieldWithDefault(msg, 6, 0),
    stacktrace: jspb.Message.getFieldWithDefault(msg, 7, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo;
  return proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setLockname(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setLockowner(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setState(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setBlocktime(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setWaittime(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setStacktrace(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLockname();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getLockowner();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getState();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getBlocktime();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getWaittime();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getStacktrace();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.setName = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string lockName = 2;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.getLockname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.setLockname = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string lockOwner = 3;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.getLockowner = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.setLockowner = function(value) {
  jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string state = 4;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.getState = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.setState = function(value) {
  jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional int64 blockTime = 5;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.getBlocktime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.setBlocktime = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int64 waitTime = 6;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.getWaittime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.setWaittime = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string stackTrace = 7;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.getStacktrace = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo.prototype.setStacktrace = function(value) {
  jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional int32 threadCount = 1;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getThreadcount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setThreadcount = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int32 deadLockThreadCount = 2;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getDeadlockthreadcount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setDeadlockthreadcount = function(value) {
  jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int32 cpuCount = 3;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getCpucount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setCpucount = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 totalMemory = 4;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getTotalmemory = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setTotalmemory = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int64 freeMemory = 5;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getFreememory = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setFreememory = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional double cpuRate = 6;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getCpurate = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(this, 6, 0.0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setCpurate = function(value) {
  jspb.Message.setProto3FloatField(this, 6, value);
};


/**
 * optional string javaVersion = 7;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getJavaversion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setJavaversion = function(value) {
  jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional string osName = 8;
 * @return {string}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getOsname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setOsname = function(value) {
  jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional int64 jvmTotalMemoery = 9;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getJvmtotalmemoery = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setJvmtotalmemoery = function(value) {
  jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional int64 jvmFreeMemory = 10;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getJvmfreememory = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setJvmfreememory = function(value) {
  jspb.Message.setProto3IntField(this, 10, value);
};


/**
 * optional double processCpuRate = 11;
 * @return {number}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getProcesscpurate = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(this, 11, 0.0));
};


/** @param {number} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setProcesscpurate = function(value) {
  jspb.Message.setProto3FloatField(this, 11, value);
};


/**
 * repeated MemoryDescInfo memoryDescInfoList = 12;
 * @return {!Array<!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo>}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getMemorydescinfolistList = function() {
  return /** @type{!Array<!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo, 12));
};


/** @param {!Array<!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo>} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setMemorydescinfolistList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 12, value);
};


/**
 * @param {!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.addMemorydescinfolist = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 12, opt_value, proto.protocol.NodeInfo.MachineInfo.MemoryDescInfo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.NodeInfo.MachineInfo.prototype.clearMemorydescinfolistList = function() {
  this.setMemorydescinfolistList([]);
};


/**
 * repeated DeadLockThreadInfo deadLockThreadInfoList = 13;
 * @return {!Array<!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo>}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.getDeadlockthreadinfolistList = function() {
  return /** @type{!Array<!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo, 13));
};


/** @param {!Array<!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo>} value */
proto.protocol.NodeInfo.MachineInfo.prototype.setDeadlockthreadinfolistList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 13, value);
};


/**
 * @param {!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo}
 */
proto.protocol.NodeInfo.MachineInfo.prototype.addDeadlockthreadinfolist = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 13, opt_value, proto.protocol.NodeInfo.MachineInfo.DeadLockThreadInfo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.NodeInfo.MachineInfo.prototype.clearDeadlockthreadinfolistList = function() {
  this.setDeadlockthreadinfolistList([]);
};


/**
 * optional int64 beginSyncNum = 1;
 * @return {number}
 */
proto.protocol.NodeInfo.prototype.getBeginsyncnum = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.prototype.setBeginsyncnum = function(value) {
  jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string block = 2;
 * @return {string}
 */
proto.protocol.NodeInfo.prototype.getBlock = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.prototype.setBlock = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string solidityBlock = 3;
 * @return {string}
 */
proto.protocol.NodeInfo.prototype.getSolidityblock = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/** @param {string} value */
proto.protocol.NodeInfo.prototype.setSolidityblock = function(value) {
  jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int32 currentConnectCount = 4;
 * @return {number}
 */
proto.protocol.NodeInfo.prototype.getCurrentconnectcount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.prototype.setCurrentconnectcount = function(value) {
  jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int32 activeConnectCount = 5;
 * @return {number}
 */
proto.protocol.NodeInfo.prototype.getActiveconnectcount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.prototype.setActiveconnectcount = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int32 passiveConnectCount = 6;
 * @return {number}
 */
proto.protocol.NodeInfo.prototype.getPassiveconnectcount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.prototype.setPassiveconnectcount = function(value) {
  jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional int64 totalFlow = 7;
 * @return {number}
 */
proto.protocol.NodeInfo.prototype.getTotalflow = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.protocol.NodeInfo.prototype.setTotalflow = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * repeated PeerInfo peerInfoList = 8;
 * @return {!Array<!proto.protocol.NodeInfo.PeerInfo>}
 */
proto.protocol.NodeInfo.prototype.getPeerinfolistList = function() {
  return /** @type{!Array<!proto.protocol.NodeInfo.PeerInfo>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.protocol.NodeInfo.PeerInfo, 8));
};


/** @param {!Array<!proto.protocol.NodeInfo.PeerInfo>} value */
proto.protocol.NodeInfo.prototype.setPeerinfolistList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 8, value);
};


/**
 * @param {!proto.protocol.NodeInfo.PeerInfo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.protocol.NodeInfo.PeerInfo}
 */
proto.protocol.NodeInfo.prototype.addPeerinfolist = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 8, opt_value, proto.protocol.NodeInfo.PeerInfo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 */
proto.protocol.NodeInfo.prototype.clearPeerinfolistList = function() {
  this.setPeerinfolistList([]);
};


/**
 * optional ConfigNodeInfo configNodeInfo = 9;
 * @return {?proto.protocol.NodeInfo.ConfigNodeInfo}
 */
proto.protocol.NodeInfo.prototype.getConfignodeinfo = function() {
  return /** @type{?proto.protocol.NodeInfo.ConfigNodeInfo} */ (
    jspb.Message.getWrapperField(this, proto.protocol.NodeInfo.ConfigNodeInfo, 9));
};


/** @param {?proto.protocol.NodeInfo.ConfigNodeInfo|undefined} value */
proto.protocol.NodeInfo.prototype.setConfignodeinfo = function(value) {
  jspb.Message.setWrapperField(this, 9, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.NodeInfo.prototype.clearConfignodeinfo = function() {
  this.setConfignodeinfo(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.NodeInfo.prototype.hasConfignodeinfo = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional MachineInfo machineInfo = 10;
 * @return {?proto.protocol.NodeInfo.MachineInfo}
 */
proto.protocol.NodeInfo.prototype.getMachineinfo = function() {
  return /** @type{?proto.protocol.NodeInfo.MachineInfo} */ (
    jspb.Message.getWrapperField(this, proto.protocol.NodeInfo.MachineInfo, 10));
};


/** @param {?proto.protocol.NodeInfo.MachineInfo|undefined} value */
proto.protocol.NodeInfo.prototype.setMachineinfo = function(value) {
  jspb.Message.setWrapperField(this, 10, value);
};


/**
 * Clears the message field making it undefined.
 */
proto.protocol.NodeInfo.prototype.clearMachineinfo = function() {
  this.setMachineinfo(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.protocol.NodeInfo.prototype.hasMachineinfo = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * map<string, string> cheatWitnessInfoMap = 11;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.protocol.NodeInfo.prototype.getCheatwitnessinfomapMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 11, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 */
proto.protocol.NodeInfo.prototype.clearCheatwitnessinfomapMap = function() {
  this.getCheatwitnessinfomapMap().clear();
};


/**
 * @enum {number}
 */
proto.protocol.AccountType = {
  NORMAL: 0,
  ASSETISSUE: 1,
  CONTRACT: 2
};

/**
 * @enum {number}
 */
proto.protocol.ReasonCode = {
  REQUESTED: 0,
  BAD_PROTOCOL: 2,
  TOO_MANY_PEERS: 4,
  DUPLICATE_PEER: 5,
  INCOMPATIBLE_PROTOCOL: 6,
  NULL_IDENTITY: 7,
  PEER_QUITING: 8,
  UNEXPECTED_IDENTITY: 9,
  LOCAL_IDENTITY: 10,
  PING_TIMEOUT: 11,
  USER_REASON: 16,
  RESET: 17,
  SYNC_FAIL: 18,
  FETCH_FAIL: 19,
  BAD_TX: 20,
  BAD_BLOCK: 21,
  FORKED: 22,
  UNLINKABLE: 23,
  INCOMPATIBLE_VERSION: 24,
  INCOMPATIBLE_CHAIN: 25,
  TIME_OUT: 32,
  CONNECT_FAIL: 33,
  TOO_MANY_PEERS_WITH_SAME_IP: 34,
  UNKNOWN: 255
};

goog.object.extend(exports, proto.protocol);
