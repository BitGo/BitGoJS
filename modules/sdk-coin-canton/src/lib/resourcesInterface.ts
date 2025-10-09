export interface Metadata {
  submitterInfo?: Metadata_SubmitterInfo;
  synchronizerId: string;
  mediatorGroup: number;
  transactionUuid: string;
  preparationTime: bigint;
  inputContracts: Metadata_InputContract[];
  minLedgerEffectiveTime?: bigint;
  maxLedgerEffectiveTime?: bigint;
  globalKeyMapping: Metadata_GlobalKeyMappingEntry[];
  maxRecordTime?: bigint;
}

interface Metadata_SubmitterInfo {
  actAs: string[];
  commandId: string;
}

interface Metadata_InputContract {
  contract:
    | {
        oneofKind: 'v1';
        v1: Create;
      }
    | {
        oneofKind: undefined;
      };
  createdAt: bigint;
  eventBlob: Uint8Array;
}

interface Create {
  lfVersion: string;
  contractId: string;
  packageName: string;
  templateId?: Identifier;
  argument?: Value;
  signatories: string[];
  stakeholders: string[];
}

interface Metadata_GlobalKeyMappingEntry {
  key?: GlobalKey;
  value?: Value;
}

interface GlobalKey {
  templateId?: Identifier;
  packageName: string;
  key?: Value;
  hash: Uint8Array;
}

interface Identifier {
  packageId: string;
  moduleName: string;
  entityName: string;
}

interface Value {
  sum:
    | {
        oneofKind: 'unit';
        unit: Empty;
      }
    | {
        oneofKind: 'bool';
        bool: boolean;
      }
    | {
        oneofKind: 'int64';
        int64: string;
      }
    | {
        oneofKind: 'date';
        date: number;
      }
    | {
        oneofKind: 'timestamp';
        timestamp: string;
      }
    | {
        oneofKind: 'numeric';
        numeric: string;
      }
    | {
        oneofKind: 'party';
        party: string;
      }
    | {
        oneofKind: 'text';
        text: string;
      }
    | {
        oneofKind: 'contractId';
        contractId: string;
      }
    | {
        oneofKind: 'optional';
        optional: Optional;
      }
    | {
        oneofKind: 'list';
        list: List;
      }
    | {
        oneofKind: 'textMap';
        textMap: TextMap;
      }
    | {
        oneofKind: 'genMap';
        genMap: GenMap;
      }
    | {
        oneofKind: 'record';
        record: Record;
      }
    | {
        oneofKind: 'variant';
        variant: Variant;
      }
    | {
        oneofKind: 'enum';
        enum: Enum;
      }
    | {
        oneofKind: undefined;
      };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Empty {}

interface Optional {
  value?: Value;
}

interface List {
  elements: Value[];
}

interface TextMap {
  entries: TextMap_Entry[];
}

interface TextMap_Entry {
  key: string;
  value?: Value;
}

interface GenMap {
  entries: GenMap_Entry[];
}

interface GenMap_Entry {
  key?: Value;
  value?: Value;
}

interface Record {
  recordId?: Identifier;
  fields: RecordField[];
}

export interface RecordField {
  label: string;
  value?: Value;
}

interface Variant {
  variantId?: Identifier;
  constructor: string;
  value?: Value;
}

interface Enum {
  enumId?: Identifier;
  constructor: string;
}

export interface DamlTransaction {
  version: string;
  roots: string[];
  nodes: DamlTransaction_Node[];
  nodeSeeds: DamlTransaction_NodeSeed[];
}

interface DamlTransaction_Node {
  nodeId: string;
  /**
   * Versioned node
   *
   * @generated from protobuf oneof: versioned_node
   */
  versionedNode:
    | {
        oneofKind: 'v1';
        v1: Node;
      }
    | {
        oneofKind: undefined;
      };
}

interface Node {
  nodeType:
    | {
        oneofKind: 'create';
        create: Create;
      }
    | {
        oneofKind: 'fetch';
        fetch: Fetch;
      }
    | {
        oneofKind: 'exercise';
        exercise: Exercise;
      }
    | {
        oneofKind: 'rollback';
        rollback: Rollback;
      }
    | {
        oneofKind: undefined;
      };
}

interface Fetch {
  lfVersion: string;
  contractId: string;
  packageName: string;
  templateId?: Identifier;
  signatories: string[];
  stakeholders: string[];
  actingParties: string[];
  interfaceId?: Identifier;
}

interface Exercise {
  lfVersion: string;
  contractId: string;
  packageName: string;
  templateId?: Identifier;
  signatories: string[];
  stakeholders: string[];
  actingParties: string[];
  interfaceId?: Identifier;
  choiceId: string;
  chosenValue?: Value;
  consuming: boolean;
  children: string[];
  exerciseResult?: Value;
  choiceObservers: string[];
}

interface Rollback {
  children: string[];
}

interface DamlTransaction_NodeSeed {
  nodeId: number;
  seed: Uint8Array;
}
