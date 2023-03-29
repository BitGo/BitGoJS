import { BCS, getSuiMoveConfig } from '@mysten/bcs';

const BCS_SPEC = {
  enums: {
    'Option<T>': {
      None: null,
      Some: 'T',
    },
    ObjectArg: {
      ImmOrOwned: 'SuiObjectRef',
      Shared: 'SharedObjectRef',
    },
    CallArg: {
      Pure: 'vector<u8>',
      Object: 'ObjectArg',
      ObjVec: 'vector<ObjectArg>',
    },
    TypeTag: {
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
    },
    Transaction: {
      TransferObject: 'TransferObjectTx',
      Publish: 'PublishTx',
      Call: 'MoveCallTx',
      TransferSui: 'TransferSuiTx',
      Pay: 'PayTx',
      PaySui: 'PaySuiTx',
      PayAllSui: 'PayAllSuiTx',
    },
    TransactionKind: {
      Single: 'Transaction',
      Batch: 'vector<Transaction>',
    },
  },
  structs: {
    SuiObjectRef: {
      objectId: BCS.ADDRESS,
      version: BCS.U64,
      digest: 'ObjectDigest',
    },
    TransferObjectTx: {
      recipient: BCS.ADDRESS,
      object_ref: 'SuiObjectRef',
    },
    PayTx: {
      coins: 'vector<SuiObjectRef>',
      recipients: 'vector<address>',
      amounts: 'vector<u64>',
    },
    PaySuiTx: {
      coins: 'vector<SuiObjectRef>',
      recipients: 'vector<address>',
      amounts: 'vector<u64>',
    },
    PayAllSuiTx: {
      coins: 'vector<SuiObjectRef>',
      recipient: BCS.ADDRESS,
    },
    TransferSuiTx: {
      recipient: BCS.ADDRESS,
      amount: 'Option<u64>',
    },
    PublishTx: {
      modules: 'vector<vector<u8>>',
    },
    SharedObjectRef: {
      objectId: BCS.ADDRESS,
      initialSharedVersion: BCS.U64,
      mutable: BCS.BOOL,
    },
    StructTag: {
      address: BCS.ADDRESS,
      module: BCS.STRING,
      name: BCS.STRING,
      typeParams: 'vector<TypeTag>',
    },
    MoveCallTx: {
      package: BCS.ADDRESS,
      module: BCS.STRING,
      function: BCS.STRING,
      typeArguments: 'vector<TypeTag>',
      arguments: 'vector<CallArg>',
    },
    TransactionData: {
      kind: 'TransactionKind',
      sender: BCS.ADDRESS,
      gasData: 'GasData',
    },
    GasData: {
      payment: 'SuiObjectRef',
      owner: BCS.ADDRESS,
      price: BCS.U64,
      budget: BCS.U64,
    },
    // Signed transaction data needed to generate transaction digest.
    SenderSignedData: {
      data: 'TransactionData',
      txSignatures: 'vector<vector<u8>>',
    },
  },
  aliases: {
    ObjectDigest: BCS.BASE64,
  },
};

export const bcs = new BCS({ ...getSuiMoveConfig(), types: BCS_SPEC });

bcs.registerType(
  'utf8string',
  (writer, str) => {
    const bytes = Array.from(new TextEncoder().encode(str));
    return writer.writeVec(bytes, (writer, el) => writer.write8(el));
  },
  (reader) => {
    const bytes = reader.readVec((reader) => reader.read8());
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
);
