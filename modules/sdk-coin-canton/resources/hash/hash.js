// This is the static helper file from canton SDK, replicating it here since we won't be using the canton wallet SDK
// TODO: https://bitgoinc.atlassian.net/browse/COIN-6016
const PREPARED_TRANSACTION_HASH_PURPOSE = Uint8Array.from([0x00, 0x00, 0x00, 0x30]);
const NODE_ENCODING_VERSION = Uint8Array.from([0x01]);
const HASHING_SCHEME_VERSION = Uint8Array.from([2]);
async function sha256(message) {
  const msg = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  return crypto.subtle.digest('SHA-256', new Uint8Array(msg)).then((hash) => new Uint8Array(hash));
}
async function mkByteArray(...args) {
  const normalizedArgs = args.map((arg) => {
    if (typeof arg === 'number') {
      return new Uint8Array([arg]);
    } else {
      return arg;
    }
  });
  let totalLength = 0;
  normalizedArgs.forEach((arg) => {
    totalLength += arg.length;
  });
  const mergedArray = new Uint8Array(totalLength);
  let offset = 0;
  normalizedArgs.forEach((arg) => {
    mergedArray.set(arg, offset);
    offset += arg.length;
  });
  return mergedArray;
}
async function encodeBool(value) {
  return new Uint8Array([value ? 1 : 0]);
}
async function encodeInt32(value) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, value, false); // true for little-endian
  return new Uint8Array(buffer);
}
async function encodeInt64(value) {
  // eslint-disable-next-line no-undef
  const num = typeof value === 'bigint' ? value : BigInt(value || 0);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigInt64(0, num, false); // true for little-endian
  return new Uint8Array(buffer);
}
export async function encodeString(value = '') {
  const utf8Bytes = new TextEncoder().encode(value);
  return encodeBytes(utf8Bytes);
}
async function encodeBytes(value) {
  const length = await encodeInt32(value.length);
  return mkByteArray(length, value);
}
async function encodeHash(value) {
  return value;
}
function encodeHexString(value = '') {
  // Convert hex string to Uint8Array
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < value.length; i += 2) {
    bytes[i / 2] = parseInt(value.slice(i, i + 2), 16);
  }
  return encodeBytes(bytes);
}
// Maybe suspicious?
async function encodeOptional(value, encodeFn) {
  if (value === undefined || value === null) {
    return new Uint8Array([0]); // Return empty array for undefined fields
  } else {
    return mkByteArray(1, await encodeFn(value));
  }
}
// Maybe suspicious?
async function encodeProtoOptional(parentValue, fieldName, value, encodeFn) {
  if (parentValue && parentValue[fieldName] !== undefined) {
    return mkByteArray(1, await encodeFn(value));
  } else {
    return new Uint8Array([0]); // Return empty array for undefined fields
  }
}
async function encodeRepeated(values = [], encodeFn) {
  const length = await encodeInt32(values.length);
  const encodedValues = await Promise.all(values.map(encodeFn));
  return mkByteArray(length, ...encodedValues);
}
function findSeed(nodeId, nodeSeeds) {
  const seed = nodeSeeds.find((seed) => seed.nodeId.toString() === nodeId)?.seed;
  return seed;
}
async function encodeIdentifier(identifier) {
  return mkByteArray(
    await encodeString(identifier.packageId),
    await encodeRepeated(identifier.moduleName.split('.'), encodeString),
    await encodeRepeated(identifier.entityName.split('.'), encodeString)
  );
}
async function encodeMetadata(metadata) {
  return mkByteArray(
    Uint8Array.from([0x01]),
    await encodeRepeated(metadata.submitterInfo?.actAs, encodeString),
    await encodeString(metadata.submitterInfo?.commandId),
    await encodeString(metadata.transactionUuid),
    await encodeInt32(metadata.mediatorGroup),
    await encodeString(metadata.synchronizerId),
    await encodeProtoOptional(metadata, 'minLedgerEffectiveTime', metadata.minLedgerEffectiveTime, encodeInt64),
    await encodeProtoOptional(metadata, 'maxLedgerEffectiveTime', metadata.maxLedgerEffectiveTime, encodeInt64),
    await encodeInt64(metadata.preparationTime),
    await encodeRepeated(metadata.inputContracts, encodeInputContract)
  );
}
async function encodeCreateNode(create, nodeId, nodeSeeds) {
  return create
    ? mkByteArray(
        NODE_ENCODING_VERSION,
        await encodeString(create.lfVersion),
        0 /** Create node tag */,
        await encodeOptional(findSeed(nodeId, nodeSeeds), encodeHash),
        await encodeHexString(create.contractId),
        await encodeString(create.packageName),
        await encodeIdentifier(create.templateId),
        await encodeValue(create.argument),
        await encodeRepeated(create.signatories, encodeString),
        await encodeRepeated(create.stakeholders, encodeString)
      )
    : mkByteArray();
}
async function encodeExerciseNode(exercise, nodeId, nodesDict, nodeSeeds) {
  return mkByteArray(
    NODE_ENCODING_VERSION,
    await encodeString(exercise.lfVersion),
    1 /** Exercise node tag */,
    await encodeHash(findSeed(nodeId, nodeSeeds)),
    await encodeHexString(exercise.contractId),
    await encodeString(exercise.packageName),
    await encodeIdentifier(exercise.templateId),
    await encodeRepeated(exercise.signatories, encodeString),
    await encodeRepeated(exercise.stakeholders, encodeString),
    await encodeRepeated(exercise.actingParties, encodeString),
    await encodeProtoOptional(exercise, 'interfaceId', exercise.interfaceId, encodeIdentifier),
    await encodeString(exercise.choiceId),
    await encodeValue(exercise.chosenValue),
    await encodeBool(exercise.consuming),
    await encodeProtoOptional(exercise, 'exerciseResult', exercise.exerciseResult, encodeValue),
    await encodeRepeated(exercise.choiceObservers, encodeString),
    await encodeRepeated(exercise.children, encodeNodeId(nodesDict, nodeSeeds))
  );
}
async function encodeFetchNode(fetch) {
  return mkByteArray(
    NODE_ENCODING_VERSION,
    await encodeString(fetch.lfVersion),
    2 /** Fetch node tag */,
    await encodeHexString(fetch.contractId),
    await encodeString(fetch.packageName),
    await encodeIdentifier(fetch.templateId),
    await encodeRepeated(fetch.signatories, encodeString),
    await encodeRepeated(fetch.stakeholders, encodeString),
    await encodeProtoOptional(fetch, 'interfaceId', fetch.interfaceId, encodeIdentifier),
    await encodeRepeated(fetch.actingParties, encodeString)
  );
}
async function encodeRollbackNode(rollback, nodesDict, nodeSeeds) {
  return mkByteArray(
    NODE_ENCODING_VERSION,
    3 /** Rollback node tag */,
    await encodeRepeated(rollback.children, encodeNodeId(nodesDict, nodeSeeds))
  );
}
async function encodeInputContract(contract) {
  if (contract.contract.oneofKind === 'v1')
    return mkByteArray(
      await encodeInt64(contract.createdAt),
      await sha256(await encodeCreateNode(contract.contract.v1, 'unused_node_id', []))
    );
  else throw new Error('Unsupported contract version');
}
async function encodeValue(value) {
  if (value.sum.oneofKind === 'unit') {
    return Uint8Array.from([0]); // Unit value
  } else if (value.sum.oneofKind === 'bool') {
    return mkByteArray(Uint8Array.from([0x01]), await encodeBool(value.sum.bool));
  } else if (value.sum.oneofKind === 'int64') {
    return mkByteArray(Uint8Array.from([0x02]), await encodeInt64(parseInt(value.sum.int64, 10)));
  } else if (value.sum.oneofKind === 'numeric') {
    return mkByteArray(Uint8Array.from([0x03]), await encodeString(value.sum.numeric));
  } else if (value.sum.oneofKind === 'timestamp') {
    // eslint-disable-next-line no-undef
    return mkByteArray(Uint8Array.from([0x04]), await encodeInt64(BigInt(value.sum.timestamp)));
  } else if (value.sum.oneofKind === 'date') {
    return mkByteArray(Uint8Array.from([0x05]), await encodeInt32(value.sum.date));
  } else if (value.sum.oneofKind === 'party') {
    return mkByteArray(Uint8Array.from([0x06]), await encodeString(value.sum.party));
  } else if (value.sum.oneofKind === 'text') {
    return mkByteArray(Uint8Array.from([0x07]), await encodeString(value.sum.text));
  } else if (value.sum.oneofKind === 'contractId') {
    return mkByteArray(Uint8Array.from([0x08]), await encodeHexString(value.sum.contractId));
  } else if (value.sum.oneofKind === 'optional') {
    return mkByteArray(
      Uint8Array.from([0x09]),
      await encodeProtoOptional(value.sum.optional, 'value', value.sum.optional.value, encodeValue)
    );
  } else if (value.sum.oneofKind === 'list') {
    return mkByteArray(Uint8Array.from([0x0a]), await encodeRepeated(value.sum.list.elements, encodeValue));
  } else if (value.sum.oneofKind === 'textMap') {
    return mkByteArray(Uint8Array.from([0x0b]), await encodeRepeated(value.sum.textMap?.entries, encodeTextMapEntry));
  } else if (value.sum.oneofKind === 'record') {
    return mkByteArray(
      Uint8Array.from([0x0c]),
      await encodeProtoOptional(value.sum.record, 'recordId', value.sum.record.recordId, encodeIdentifier),
      await encodeRepeated(value.sum.record.fields, encodeRecordField)
    );
  } else if (value.sum.oneofKind === 'variant') {
    return mkByteArray(
      Uint8Array.from([0x0d]),
      await encodeProtoOptional(value.sum.variant, 'variantId', value.sum.variant.variantId, encodeIdentifier),
      await encodeString(value.sum.variant.constructor),
      await encodeValue(value.sum.variant.value)
    );
  } else if (value.sum.oneofKind === 'enum') {
    return mkByteArray(
      Uint8Array.from([0x0e]),
      await encodeProtoOptional(value.sum.enum, 'enumId', value.sum.enum.enumId, encodeIdentifier),
      await encodeString(value.sum.enum.constructor)
    );
  } else if (value.sum.oneofKind === 'genMap') {
    return mkByteArray(Uint8Array.from([0x0f]), await encodeRepeated(value.sum.genMap?.entries, encodeGenMapEntry));
  }
  throw new Error('Unsupported value type: ' + JSON.stringify(value));
}
async function encodeTextMapEntry(entry) {
  return mkByteArray(await encodeString(entry.key), await encodeValue(entry.value));
}
async function encodeRecordField(field) {
  return mkByteArray(await encodeOptional(field.label, encodeString), await encodeValue(field.value));
}
async function encodeGenMapEntry(entry) {
  return mkByteArray(await encodeValue(entry.key), await encodeValue(entry.value));
}
function encodeNodeId(nodesDict, nodeSeeds) {
  return async (nodeId) => {
    const node = nodesDict[nodeId];
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found in transaction`);
    }
    const encodedNode = await encodeNode(node, nodesDict, nodeSeeds);
    return sha256(encodedNode);
  };
}
async function encodeNode(node, nodesDict, nodeSeeds) {
  if (node.versionedNode.oneofKind === 'v1') {
    if (node.versionedNode.v1.nodeType.oneofKind === 'create') {
      return encodeCreateNode(node.versionedNode.v1.nodeType.create, node.nodeId, nodeSeeds);
    } else if (node.versionedNode.v1.nodeType.oneofKind === 'exercise') {
      return encodeExerciseNode(node.versionedNode.v1.nodeType.exercise, node.nodeId, nodesDict, nodeSeeds);
    } else if (node.versionedNode.v1.nodeType.oneofKind === 'fetch') {
      return encodeFetchNode(node.versionedNode.v1.nodeType.fetch);
    } else if (node.versionedNode.v1.nodeType.oneofKind === 'rollback') {
      return encodeRollbackNode(node.versionedNode.v1.nodeType.rollback, nodesDict, nodeSeeds);
    }
    throw new Error('Unsupported node type');
  } else {
    throw new Error(`Unsupported node version`);
  }
}
function createNodesDict(preparedTransaction) {
  const nodesDict = {};
  const nodes = preparedTransaction.transaction?.nodes || [];
  for (const node of nodes) {
    nodesDict[node.nodeId] = node;
  }
  return nodesDict;
}
async function encodeTransaction(transaction, nodesDict, nodeSeeds) {
  return mkByteArray(
    await encodeString(transaction.version),
    await encodeRepeated(transaction.roots, encodeNodeId(nodesDict, nodeSeeds))
  );
}
async function hashTransaction(transaction, nodesDict) {
  const encodedTransaction = await encodeTransaction(transaction, nodesDict, transaction.nodeSeeds);
  const hash = await sha256(await mkByteArray(PREPARED_TRANSACTION_HASH_PURPOSE, encodedTransaction));
  return hash;
}
async function hashMetadata(metadata) {
  const hash = await sha256(await mkByteArray(PREPARED_TRANSACTION_HASH_PURPOSE, await encodeMetadata(metadata)));
  return hash;
}
async function encodePreparedTransaction(preparedTransaction) {
  const nodesDict = createNodesDict(preparedTransaction);
  const transactionHash = await hashTransaction(preparedTransaction.transaction, nodesDict);
  const metadataHash = await hashMetadata(preparedTransaction.metadata);
  return mkByteArray(PREPARED_TRANSACTION_HASH_PURPOSE, HASHING_SCHEME_VERSION, transactionHash, metadataHash);
}
export async function computePreparedTransaction(preparedTransaction) {
  return sha256(await encodePreparedTransaction(preparedTransaction));
}
