import { BCS, decodeStr, encodeStr, getSuiMoveConfig } from '@mysten/bcs';
import { Buffer } from 'buffer';

export const bcs = new BCS(getSuiMoveConfig());

bcs
  .registerType(
    'utf8string',
    (writer, str) => {
      const bytes = Array.from(Buffer.from(str));
      return writer.writeVec(bytes, (writer, el) => writer.write8(el));
    },
    (reader) => {
      const bytes = reader.readVec((reader) => reader.read8());
      return Buffer.from(bytes).toString('utf-8');
    }
  )
  .registerType(
    'ObjectDigest',
    (writer, str) => {
      const bytes = Array.from(decodeStr(str, 'base64'));
      return writer.writeVec(bytes, (writer, el) => writer.write8(el));
    },
    (reader) => {
      const bytes = reader.readVec((reader) => reader.read8());
      return encodeStr(new Uint8Array(bytes), 'base64');
    }
  );

bcs.registerStructType('SuiObjectRef', {
  objectId: 'address',
  version: 'u64',
  digest: 'ObjectDigest',
});

/**
 * Transaction type used for Pay transaction.
 */
bcs.registerStructType('PayTx', {
  coins: 'vector<SuiObjectRef>',
  recipients: 'vector<address>',
  amounts: 'vector<u64>',
});

bcs.registerStructType('PaySuiTx', {
  coins: 'vector<SuiObjectRef>',
  recipients: 'vector<address>',
  amounts: 'vector<u64>',
});

bcs.registerStructType('PayAllSuiTx', {
  coins: 'vector<SuiObjectRef>',
  recipient: 'address',
});

bcs.registerStructType('MoveCallTx', {
  package: 'SuiObjectRef',
  module: 'string',
  function: 'string',
  typeArguments: 'vector<TypeTag>',
  arguments: 'vector<CallArg>',
});

bcs
  .registerEnumType('TypeTag', {
    bool: null,
    u8: null,
    u64: null,
    u128: null,
    address: null,
    signer: null,
    vector: 'TypeTag',
    struct: 'StructTag',
    u16: null,
    u32: null,
    u256: null,
  })
  .registerStructType('StructTag', {
    address: 'address',
    module: 'string',
    name: 'string',
    typeParams: 'vector<TypeTag>',
  });

bcs
  .registerStructType('SharedObjectRef', {
    objectId: 'address',
    initialSharedVersion: 'u64',
  })
  .registerEnumType('ObjectArg', {
    ImmOrOwned: 'SuiObjectRef',
    Shared: 'SharedObjectRef',
  })
  .registerEnumType('CallArg', {
    Pure: 'vector<u8>',
    Object: 'ObjectArg',
    ObjVec: 'vector<ObjectArg>',
  });

bcs.registerEnumType('Transaction', {
  TransferObject: 'TransferObjectTx',
  Publish: 'PublishTx',
  Call: 'MoveCallTx',
  TransferSui: 'TransferSuiTx',
  Pay: 'PayTx',
  PaySui: 'PaySuiTx',
  PayAllSui: 'PayAllSuiTx',
});

bcs.registerEnumType('TransactionKind', {
  Single: 'Transaction',
  Batch: 'vector<Transaction>',
});

bcs.registerStructType('TransactionData', {
  kind: 'TransactionKind',
  sender: 'address',
  gasPayment: 'SuiObjectRef',
  gasPrice: 'u64',
  gasBudget: 'u64',
});

bcs.registerStructType('SenderSignedData', {
  data: 'TransactionData',
  txSignature: 'vector<u8>',
});
