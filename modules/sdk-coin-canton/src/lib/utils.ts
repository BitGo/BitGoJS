import BigNumber from 'bignumber.js';
import crypto from 'crypto';

import { BaseUtils, isValidEd25519PublicKey, TransactionType } from '@bitgo/sdk-core';
import { CantonToken, coins } from '@bitgo/statics';

import { computePreparedTransaction } from '../../resources/hash/hash.js';
import { PreparedTransaction } from '../../resources/proto/preparedTransaction.js';

import { CryptoKeyFormat, SigningAlgorithmSpec, SigningKeySpec } from './constant';
import { CantonCommandInfo, PreparedTransaction as IPreparedTransaction, PreparedTxnParsedInfo } from './iface';
import { RecordField, Value } from './resourcesInterface';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    if (!address || address.trim() === '') return false;
    const [partyHint, fingerprint] = address.trim().split('::');
    if (!fingerprint) return false;
    // all memoIds are considered valid as long as strings are passed
    const [fingerprintPart] = fingerprint.trim().split('?memoId=');
    if (!partyHint || !fingerprintPart) return false;
    return this.isValidCantonHex(fingerprintPart);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    // In canton, there is no block hash, we store the height as the _id (hash)
    // this will be of the form, <blockHeight>_<version>
    const [height] = hash.split('_');
    const blockHeight = Number(height);
    return !isNaN(blockHeight) && blockHeight > 0;
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Method to validate the input is a valid canton hex string
   * @param {String} value the hex string value
   * @returns {Boolean} true if valid
   */
  isValidCantonHex(value: string): boolean {
    const regex = /^[a-fA-F0-9]{68}$/;
    return regex.test(value);
  }

  /**
   * Helper method to convert hex value to base64
   * @param {String} hexString - hex encoded string
   * @returns {String} base64 encoded string
   */
  getBase64FromHex(hexString: string): string {
    return Buffer.from(hexString, 'hex').toString('base64');
  }

  /**
   * Method to create fingerprint (part of the canton partyId) from public key
   * @param {String} publicKey the public key
   * @returns {String}
   */
  getAddressFromPublicKey(publicKey: string): string {
    const key = this.signingPublicKeyFromEd25519(publicKey);
    const hashPurpose = 12;
    return this.computeSha256CantonHash(hashPurpose, key.publicKey);
  }

  /**
   * Method to parse raw canton transaction & get required data
   * @param {String} rawData base64 encoded string
   * @param {TransactionType} txType the transaction type
   * @returns {PreparedTxnParsedInfo}
   */
  parseRawCantonTransactionData(rawData: string, txType: TransactionType): PreparedTxnParsedInfo {
    const decodedData = this.decodePreparedTransaction(rawData);
    const nodes = decodedData.transaction?.nodes ?? [];
    const getField = (fields: RecordField[], label: string) => fields.find((f) => f.label === label)?.value?.sum;

    let sender = '';
    let receiver = '';
    let amount = '';
    let memoId: string | undefined;
    let instrumentId: string | undefined;
    let instrumentAdmin: string | undefined;

    /**
     * Returns the argument fields of the first create node matching the given entity name.
     */
    const findCreateNodeFields = (entityName: string): RecordField[] | undefined => {
      for (const node of nodes) {
        const vn = node.versionedNode;
        if (!vn || vn.oneofKind !== 'v1') continue;
        const nt = vn.v1.nodeType;
        if (nt.oneofKind !== 'create') continue;
        if (nt.create.templateId?.entityName !== entityName) continue;
        const argSum = nt.create.argument?.sum;
        if (!argSum || argSum.oneofKind !== 'record') continue;
        const fields = argSum.record?.fields;
        if (fields) return fields;
      }
      return undefined;
    };

    /**
     * Returns the chosenValue fields of the first exercise node matching the given choiceId.
     */
    const findExerciseNodeFields = (choiceId: string): RecordField[] | undefined => {
      for (const node of nodes) {
        const vn = node.versionedNode;
        if (!vn || vn.oneofKind !== 'v1') continue;
        const nt = vn.v1.nodeType;
        if (nt.oneofKind !== 'exercise') continue;
        if (nt.exercise.choiceId !== choiceId) continue;
        const argSum = nt.exercise.chosenValue?.sum;
        if (!argSum || argSum.oneofKind !== 'record') continue;
        const fields = argSum.record?.fields;
        if (fields) return fields;
      }
      return undefined;
    };

    /**
     * Returns the first acting party of the first exercise node matching the given choiceId.
     */
    const findExerciseActingParty = (choiceId: string): string | undefined => {
      for (const node of nodes) {
        const vn = node.versionedNode;
        if (!vn || vn.oneofKind !== 'v1') continue;
        const nt = vn.v1.nodeType;
        if (nt.oneofKind !== 'exercise') continue;
        if (nt.exercise.choiceId !== choiceId) continue;
        return nt.exercise.actingParties[0];
      }
      return undefined;
    };

    /**
     * Extracts sender, receiver, amount, and instrument fields from a transfer record.
     * Canton coin transfers and cbtc use instrumentId.admin; regular token transfers use instrumentIdentifier.source.
     */
    const extractFromTransferRecord = (
      transferRecord: RecordField[],
      instrumentFieldName: string,
      instrumentAdminFieldName: string
    ): void => {
      const senderData = getField(transferRecord, 'sender');
      if (senderData?.oneofKind === 'party') sender = senderData.party ?? '';
      const receiverData = getField(transferRecord, 'receiver');
      if (receiverData?.oneofKind === 'party') receiver = receiverData.party ?? '';
      const amountData = getField(transferRecord, 'amount');
      if (amountData?.oneofKind === 'numeric') amount = amountData.numeric ?? '';
      const instrumentField = getField(transferRecord, instrumentFieldName);
      if (instrumentField?.oneofKind === 'record') {
        const instrumentFields = instrumentField.record?.fields ?? [];
        const adminData = getField(instrumentFields, instrumentAdminFieldName);
        if (adminData?.oneofKind === 'party') instrumentAdmin = adminData.party ?? '';
        const idData = getField(instrumentFields, 'id');
        if (idData?.oneofKind === 'text') instrumentId = idData.text ?? '';
      }
    };

    switch (txType) {
      case TransactionType.OneStepPreApproval: {
        // Canton coin: TransferPreapprovalProposal create node → provider=sender, receiver
        const coinFields = findCreateNodeFields('TransferPreapprovalProposal');
        if (coinFields) {
          const providerData = getField(coinFields, 'provider');
          if (providerData?.oneofKind === 'party') sender = providerData.party ?? '';
          const receiverData = getField(coinFields, 'receiver');
          if (receiverData?.oneofKind === 'party') receiver = receiverData.party ?? '';
          amount = '0';
          break;
        }
        // Token: TransferPreapproval create node → operator=sender, receiver, instrumentAdmin, instrumentAllowances
        const tokenFields = findCreateNodeFields('TransferPreapproval');
        if (tokenFields) {
          const operatorData = getField(tokenFields, 'operator');
          if (operatorData?.oneofKind === 'party') sender = operatorData.party ?? '';
          const receiverData = getField(tokenFields, 'receiver');
          if (receiverData?.oneofKind === 'party') receiver = receiverData.party ?? '';
          amount = '0';
          const instrumentAdminData = getField(tokenFields, 'instrumentAdmin');
          if (instrumentAdminData?.oneofKind === 'party') instrumentAdmin = instrumentAdminData.party ?? '';
          const allowancesData = getField(tokenFields, 'instrumentAllowances');
          if (allowancesData?.oneofKind === 'list') {
            // for the same instrument admin, if multiple tokens are supported then we can enable all of them,
            // but we won't be doing that for now
            const firstAllowance = allowancesData.list?.elements?.[0]?.sum;
            if (firstAllowance?.oneofKind === 'record') {
              const allowanceFields = firstAllowance.record?.fields ?? [];
              const idData = getField(allowanceFields, 'id');
              if (idData?.oneofKind === 'text') instrumentId = idData.text ?? '';
            }
          }
        }
        break;
      }

      case TransactionType.TransferAccept: {
        // Canton coin: Amulet create node → dso=sender, owner=receiver, amount.initialAmount
        const amuletFields = findCreateNodeFields('Amulet');
        if (amuletFields) {
          const dsoData = getField(amuletFields, 'dso');
          if (dsoData?.oneofKind === 'party') sender = dsoData.party ?? '';
          const ownerData = getField(amuletFields, 'owner');
          if (ownerData?.oneofKind === 'party') receiver = ownerData.party ?? '';
          const amountField = getField(amuletFields, 'amount');
          if (amountField?.oneofKind === 'record') {
            const initialAmountData = getField(amountField.record?.fields ?? [], 'initialAmount');
            if (initialAmountData?.oneofKind === 'numeric') amount = initialAmountData.numeric ?? '';
          }
          break;
        }
        // Regular token (non-cbtc): ExecutedTransfer create node
        // → transfer.{sender, receiver, amount, instrumentIdentifier.{source=admin, id}}
        const executedTransferFields = findCreateNodeFields('ExecutedTransfer');
        if (executedTransferFields) {
          const transferSum = getField(executedTransferFields, 'transfer');
          if (transferSum?.oneofKind === 'record') {
            extractFromTransferRecord(transferSum.record?.fields ?? [], 'instrumentIdentifier', 'source');
          }
          break;
        }
        // cbtc token fallback: TransferRule_DirectTransfer exercise node
        // → transfer.{sender, receiver, amount, instrumentId.{admin, id}}
        const directTransferFields = findExerciseNodeFields('TransferRule_DirectTransfer');
        if (directTransferFields) {
          const transferSum = getField(directTransferFields, 'transfer');
          if (transferSum?.oneofKind === 'record') {
            extractFromTransferRecord(transferSum.record?.fields ?? [], 'instrumentId', 'admin');
          }
        }
        // USDCx/two-step token fallback: TransferRule_TwoStepTransfer exercise node
        // → transfer.{sender, receiver, amount, instrumentId.{admin, id}}
        if (!sender) {
          const twoStepTransferFields = findExerciseNodeFields('TransferRule_TwoStepTransfer');
          if (twoStepTransferFields) {
            const transferSum = getField(twoStepTransferFields, 'transfer');
            if (transferSum?.oneofKind === 'record') {
              extractFromTransferRecord(transferSum.record?.fields ?? [], 'instrumentId', 'admin');
            }
          }
        }
        break;
      }

      case TransactionType.TransferReject: {
        // Canton coin: Amulet create node → dso=sender, owner=receiver, amount.initialAmount
        const amuletFields = findCreateNodeFields('Amulet');
        if (amuletFields) {
          const dsoData = getField(amuletFields, 'dso');
          if (dsoData?.oneofKind === 'party') sender = dsoData.party ?? '';
          const ownerData = getField(amuletFields, 'owner');
          if (ownerData?.oneofKind === 'party') receiver = ownerData.party ?? '';
          const amountField = getField(amuletFields, 'amount');
          if (amountField?.oneofKind === 'record') {
            const initialAmountData = getField(amountField.record?.fields ?? [], 'initialAmount');
            if (initialAmountData?.oneofKind === 'numeric') amount = initialAmountData.numeric ?? '';
          }
          break;
        }
        // Regular token (non-cbtc): RejectedTransfer create node
        // → transfer.{sender, receiver, amount, instrumentIdentifier.{source=admin, id}}
        const rejectedTransferFields = findCreateNodeFields('RejectedTransfer');
        if (rejectedTransferFields) {
          const transferSum = getField(rejectedTransferFields, 'transfer');
          if (transferSum?.oneofKind === 'record') {
            extractFromTransferRecord(transferSum.record?.fields ?? [], 'instrumentIdentifier', 'source');
          }
          break;
        }
        // cbtc token fallback: Holding create node (owner=sender, instrument, amount)
        // + TransferInstruction_Reject exercise (actingParties[0]=receiver who rejected)
        const holdingFields = findCreateNodeFields('Holding');
        if (holdingFields) {
          const ownerData = getField(holdingFields, 'owner');
          if (ownerData?.oneofKind === 'party') sender = ownerData.party ?? '';
          const amountData = getField(holdingFields, 'amount');
          if (amountData?.oneofKind === 'numeric') amount = amountData.numeric ?? '';
          const instrumentData = getField(holdingFields, 'instrument');
          if (instrumentData?.oneofKind === 'record') {
            const instrumentFields = instrumentData.record?.fields ?? [];
            const sourceData = getField(instrumentFields, 'source');
            if (sourceData?.oneofKind === 'party') instrumentAdmin = sourceData.party ?? '';
            const idData = getField(instrumentFields, 'id');
            if (idData?.oneofKind === 'text') instrumentId = idData.text ?? '';
          }
          const receiverParty = findExerciseActingParty('TransferInstruction_Reject');
          if (receiverParty) receiver = receiverParty;
        }
        break;
      }

      case TransactionType.AllocationAllocate: {
        // DvpLegAllocation create node → allocation.transferLeg contains the full settlement transfer details:
        // sender, receiver (the actual settlement counterparty), amount, and instrumentId
        const dvpFields = findCreateNodeFields('DvpLegAllocation');
        if (dvpFields) {
          const allocationField = getField(dvpFields, 'allocation');
          if (allocationField?.oneofKind === 'record') {
            const allocationFields = allocationField.record?.fields ?? [];
            const transferLegField = getField(allocationFields, 'transferLeg');
            if (transferLegField?.oneofKind === 'record') {
              const transferLegFields = transferLegField.record?.fields ?? [];
              const senderData = getField(transferLegFields, 'sender');
              if (senderData?.oneofKind === 'party') sender = senderData.party ?? '';
              const receiverData = getField(transferLegFields, 'receiver');
              if (receiverData?.oneofKind === 'party') receiver = receiverData.party ?? '';
              const amountData = getField(transferLegFields, 'amount');
              if (amountData?.oneofKind === 'numeric') amount = amountData.numeric ?? '';
              const instrumentIdField = getField(transferLegFields, 'instrumentId');
              if (instrumentIdField?.oneofKind === 'record') {
                const instrumentIdFields = instrumentIdField.record?.fields ?? [];
                const adminData = getField(instrumentIdFields, 'admin');
                if (adminData?.oneofKind === 'party') instrumentAdmin = adminData.party ?? '';
                const idData = getField(instrumentIdFields, 'id');
                if (idData?.oneofKind === 'text') instrumentId = idData.text ?? '';
              }
            }
          }
        }
        // Fallback: if DvpLegAllocation is absent, use the operator as receiver
        if (!receiver) {
          const allocateFields = findExerciseNodeFields('AllocationFactory_Allocate');
          if (allocateFields) {
            const adminData = getField(allocateFields, 'expectedAdmin');
            if (adminData?.oneofKind === 'party') receiver = adminData.party ?? '';
          }
        }
        if (!sender) {
          const senderParty = findExerciseActingParty('AllocationFactory_Allocate');
          if (senderParty) sender = senderParty;
        }
        break;
      }

      case TransactionType.CosignDelegationAccept: {
        // exercise CosigningDelegationProposal_Accept → actingParties[0] = signer (sender)
        const signerParty = findExerciseActingParty('CosigningDelegationProposal_Accept');
        if (signerParty) sender = signerParty;
        // CosigningDelegation create node (result of the accept) → admin = receiver
        const delegationFields = findCreateNodeFields('CosigningDelegation');
        if (delegationFields) {
          const adminData = getField(delegationFields, 'admin');
          if (adminData?.oneofKind === 'party') receiver = adminData.party ?? '';
        }
        amount = '0';
        break;
      }

      case TransactionType.TransferOfferWithdrawn: {
        // Canton coin: Amulet create node → owner=sender=receiver, amount.initialAmount
        const amuletFields = findCreateNodeFields('Amulet');
        if (amuletFields) {
          const ownerData = getField(amuletFields, 'owner');
          if (ownerData?.oneofKind === 'party') {
            receiver = ownerData.party ?? '';
            sender = receiver;
          }
          const amountField = getField(amuletFields, 'amount');
          if (amountField?.oneofKind === 'record') {
            const initialAmountData = getField(amountField.record?.fields ?? [], 'initialAmount');
            if (initialAmountData?.oneofKind === 'numeric') amount = initialAmountData.numeric ?? '';
          }
          break;
        }
        // Token: Holding create node → owner=sender=receiver, instrument.{source=admin, id}, amount
        const holdingFields = findCreateNodeFields('Holding');
        if (holdingFields) {
          const ownerData = getField(holdingFields, 'owner');
          if (ownerData?.oneofKind === 'party') {
            receiver = ownerData.party ?? '';
            sender = receiver;
          }
          const amountData = getField(holdingFields, 'amount');
          if (amountData?.oneofKind === 'numeric') amount = amountData.numeric ?? '';
          const instrumentData = getField(holdingFields, 'instrument');
          if (instrumentData?.oneofKind === 'record') {
            const instrumentFields = instrumentData.record?.fields ?? [];
            const sourceData = getField(instrumentFields, 'source');
            if (sourceData?.oneofKind === 'party') instrumentAdmin = sourceData.party ?? '';
            const idData = getField(instrumentFields, 'id');
            if (idData?.oneofKind === 'text') instrumentId = idData.text ?? '';
          }
        }
        break;
      }

      default: {
        // Initial transfer (1-step and 2-step, coin and token): TransferFactory_Transfer exercise node
        // → transfer.{sender, receiver, amount, instrumentId.{admin, id}, meta}
        const transferFields = findExerciseNodeFields('TransferFactory_Transfer');
        if (transferFields) {
          const transferSum = getField(transferFields, 'transfer');
          if (transferSum?.oneofKind === 'record') {
            const transferRecord = transferSum.record?.fields ?? [];
            extractFromTransferRecord(transferRecord, 'instrumentId', 'admin');
            const metaField = getField(transferRecord, 'meta');
            if (metaField?.oneofKind === 'record') {
              const valuesField = getField(metaField.record?.fields ?? [], 'values');
              if (valuesField?.oneofKind === 'textMap') {
                const memoEntry = valuesField.textMap?.entries.find(
                  (e) => e.key === 'splice.lfdecentralizedtrust.org/reason'
                );
                if (memoEntry) {
                  const memoValue = memoEntry?.value?.sum;
                  if (memoValue?.oneofKind === 'text') memoId = memoValue.text;
                }
              }
            }
          }
        }
        break;
      }
    }

    if (!sender || !receiver || !amount) {
      const missingFields: string[] = [];
      if (!sender) missingFields.push('sender');
      if (!receiver) missingFields.push('receiver');
      if (!amount) missingFields.push('amount');
      throw new Error(`invalid transaction data: missing ${missingFields.join(', ')}`);
    }
    const convertedAmount = this.convertAmountToLowestUnit(new BigNumber(amount));
    const parsedData: PreparedTxnParsedInfo = {
      sender,
      receiver,
      amount: convertedAmount,
    };
    if (memoId) {
      parsedData.memoId = memoId;
    }
    if (instrumentId && instrumentAdmin) {
      parsedData.token = this.findTokenNameByContractAddress(`${instrumentAdmin}:${instrumentId}`);
    }
    return parsedData;
  }

  /** Parses `"Pkg:Module:Entity"` into parts. */
  parseCantonTemplateId(value: string): { pkg: string; moduleName: string; entityName: string } | undefined {
    if (typeof value !== 'string') return undefined;
    const parts = value.split(':');
    if (parts.length !== 3) return undefined;
    const [pkg, moduleName, entityName] = parts;
    if (!pkg || !moduleName || !entityName) return undefined;
    return { pkg, moduleName, entityName };
  }

  damlValueToJson(value: Value | undefined): unknown {
    if (!value || !value.sum) return undefined;
    const sum = value.sum;
    switch (sum.oneofKind) {
      case 'unit':
        return null;
      case 'bool':
        return sum.bool;
      case 'int64':
        return sum.int64;
      case 'date':
        return sum.date;
      case 'timestamp':
        return sum.timestamp;
      case 'numeric':
        return sum.numeric;
      case 'party':
        return sum.party;
      case 'text':
        return sum.text;
      case 'contractId':
        return sum.contractId;
      case 'optional':
        return sum.optional?.value ? this.damlValueToJson(sum.optional.value) : null;
      case 'list':
        return (sum.list?.elements ?? []).map((el) => this.damlValueToJson(el));
      case 'textMap': {
        const obj: Record<string, unknown> = {};
        for (const entry of sum.textMap?.entries ?? []) {
          obj[entry.key] = this.damlValueToJson(entry.value);
        }
        return obj;
      }
      case 'genMap':
        return (sum.genMap?.entries ?? []).map((entry) => [
          this.damlValueToJson(entry.key),
          this.damlValueToJson(entry.value),
        ]);
      case 'record': {
        const obj: Record<string, unknown> = {};
        for (const f of sum.record?.fields ?? []) {
          obj[f.label] = this.damlValueToJson(f.value);
        }
        return obj;
      }
      case 'variant': {
        const obj: Record<string, unknown> = {};
        obj[sum.variant.constructor] = this.damlValueToJson(sum.variant.value);
        return obj;
      }
      case 'enum':
        return sum.enum.constructor;
      default:
        return undefined;
    }
  }

  /** Reads actAs parties from a base64-encoded prepared transaction protobuf. */
  extractSubmitterActAs(rawBase64: string): string[] {
    const decoded = this.decodePreparedTransaction(rawBase64);
    return decoded.metadata?.submitterInfo?.actAs ?? [];
  }

  /** Decodes a prepared Canton transaction protobuf and extracts the root CreateCommand or ExerciseCommand. */
  extractCantonCommandInfo(rawBase64: string): CantonCommandInfo {
    const decoded = this.decodePreparedTransaction(rawBase64);
    const tx = decoded.transaction;
    if (!tx) {
      throw new Error('decoded prepared transaction has no transaction body');
    }
    const roots = tx.roots ?? [];
    if (roots.length === 0) {
      throw new Error('decoded prepared transaction has no root nodes');
    }
    if (roots.length > 1) {
      throw new Error(`decoded prepared transaction has ${roots.length} root nodes; expected exactly 1`);
    }
    const rootId = roots[0];
    const rootNode = (tx.nodes ?? []).find((n) => n.nodeId === rootId);
    if (!rootNode) {
      throw new Error(`root node '${rootId}' not found in nodes list`);
    }
    const versionedNode = rootNode.versionedNode;
    if (!versionedNode || versionedNode.oneofKind !== 'v1') {
      throw new Error(`unsupported root node version: ${versionedNode?.oneofKind ?? 'undefined'}`);
    }
    const nodeType = versionedNode.v1.nodeType;
    if (nodeType.oneofKind === 'create') {
      const createNode = nodeType.create;
      if (!createNode.templateId) {
        throw new Error('create node missing templateId');
      }
      return {
        kind: 'CreateCommand',
        templateId: {
          packageId: createNode.templateId.packageId,
          moduleName: createNode.templateId.moduleName,
          entityName: createNode.templateId.entityName,
        },
        argument: this.damlValueToJson(createNode.argument),
      };
    }
    if (nodeType.oneofKind === 'exercise') {
      const exerciseNode = nodeType.exercise;
      if (!exerciseNode.templateId) {
        throw new Error('exercise node missing templateId');
      }
      return {
        kind: 'ExerciseCommand',
        templateId: {
          packageId: exerciseNode.templateId.packageId,
          moduleName: exerciseNode.templateId.moduleName,
          entityName: exerciseNode.templateId.entityName,
        },
        argument: this.damlValueToJson(exerciseNode.chosenValue),
        choice: exerciseNode.choiceId,
        contractId: exerciseNode.contractId,
        actingParties: [...(exerciseNode.actingParties ?? [])],
      };
    }
    throw new Error(`unsupported root node type: ${nodeType.oneofKind ?? 'undefined'}`);
  }

  sameElements(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((x, i) => x === sortedB[i]);
  }

  /** Strips the `command.` prefix from injectAs paths (e.g. `command.ExerciseCommand.contractId` → `ExerciseCommand.contractId`). */
  normalizeInjectAs(specs: readonly { injectAs?: string }[] | undefined): Set<string> {
    const out = new Set<string>();
    if (!specs) return out;
    for (const spec of specs) {
      if (!spec || typeof spec.injectAs !== 'string') continue;
      const stripped = spec.injectAs.startsWith('command.') ? spec.injectAs.slice('command.'.length) : spec.injectAs;
      if (stripped) out.add(stripped);
    }
    return out;
  }

  /**
   * Recursively asserts that `actual` matches `expected`. Paths in `injectAsPaths` are skipped.
   * Numeric strings are compared via BigNumber to handle DAML formatting differences (e.g. "100" vs "100.0000000000").
   */
  assertDeepCantonMatch(expected: unknown, actual: unknown, injectAsPaths: Set<string>, currentPath = ''): void {
    if (injectAsPaths.has(currentPath)) return;

    // Only undefined means "unspecified — skip comparison". Empty {} or [] are valid
    // Daml values and must be verified against actual to prevent accidental under-verification.
    if (expected === undefined) {
      return;
    }

    if (expected === null || actual === null) {
      if (expected !== actual) {
        throw new Error(
          `Canton command mismatch at '${currentPath || '<root>'}': expected ${this.stringifyForError(
            expected
          )}, got ${this.stringifyForError(actual)}`
        );
      }
      return;
    }
    if (typeof expected === 'string' && typeof actual === 'string') {
      if (this.areNumericStrings(expected, actual)) {
        if (!new BigNumber(expected).isEqualTo(new BigNumber(actual))) {
          throw new Error(
            `Canton command numeric mismatch at '${currentPath || '<root>'}': expected ${expected}, got ${actual}`
          );
        }
        return;
      }
      // ISO 8601 input vs microsecond-since-epoch encoding in the prepared-transaction protobuf.
      if (this.isIsoTimestamp(expected) && this.isIntegerString(actual)) {
        const expectedMicroseconds = new BigNumber(new Date(expected).getTime()).multipliedBy(1000);
        if (!expectedMicroseconds.isEqualTo(new BigNumber(actual))) {
          throw new Error(
            `Canton command timestamp mismatch at '${currentPath || '<root>'}': ` +
              `expected '${expected}' (${expectedMicroseconds.toFixed(0)} µs), got '${actual}'`
          );
        }
        return;
      }
      if (expected !== actual) {
        throw new Error(
          `Canton command mismatch at '${currentPath || '<root>'}': expected '${expected}', got '${actual}'`
        );
      }
      return;
    }
    if (typeof expected === 'number' && typeof actual === 'number') {
      if (expected !== actual) {
        throw new Error(`Canton command mismatch at '${currentPath || '<root>'}': expected ${expected}, got ${actual}`);
      }
      return;
    }
    if (typeof expected === 'boolean' && typeof actual === 'boolean') {
      if (expected !== actual) {
        throw new Error(`Canton command mismatch at '${currentPath || '<root>'}': expected ${expected}, got ${actual}`);
      }
      return;
    }
    if (Array.isArray(expected) && Array.isArray(actual)) {
      if (expected.length !== actual.length) {
        throw new Error(
          `Canton command list-length mismatch at '${currentPath || '<root>'}': expected ${expected.length}, got ${
            actual.length
          }`
        );
      }
      for (let i = 0; i < expected.length; i++) {
        const childPath = currentPath ? `${currentPath}.${i}` : String(i);
        this.assertDeepCantonMatch(expected[i], actual[i], injectAsPaths, childPath);
      }
      return;
    }
    if (this.isPlainObject(expected) && this.isPlainObject(actual)) {
      const expectedKeys = new Set(Object.keys(expected));
      const actualKeys = new Set(Object.keys(actual));
      for (const key of expectedKeys) {
        const childPath = currentPath ? `${currentPath}.${key}` : key;
        if (expected[key] === undefined || injectAsPaths.has(childPath)) continue;
        if (!actualKeys.has(key)) {
          throw new Error(`Canton command missing field at '${childPath}' on prepared transaction`);
        }
        this.assertDeepCantonMatch(expected[key], (actual as Record<string, unknown>)[key], injectAsPaths, childPath);
      }
      return;
    }
    throw new Error(
      `Canton command type mismatch at '${currentPath || '<root>'}': expected ${this.describeType(
        expected
      )}, got ${this.describeType(actual)}`
    );
  }

  /**
   * Computes the topology hash from the API response of the 'create party' endpoint.
   *
   * @param topologyTransactions - List of base64-encoded topology transactions from the Canton API.
   * @returns The final base64-encoded topology transaction hash.
   */
  computeHashFromCreatePartyResponse(topologyTransactions: string[]): string {
    const txBuffers = topologyTransactions.map((tx) => Buffer.from(tx, 'base64'));
    return this.computeHashFromTopologyTransaction(txBuffers);
  }

  async computeHashFromPrepareSubmissionResponse(preparedTransactionBase64: string): Promise<string> {
    const preparedTransaction = this.decodePreparedTransaction(preparedTransactionBase64);
    const hash = await computePreparedTransaction(preparedTransaction);
    return Buffer.from(hash).toString('base64');
  }

  /**
   * Computes the final topology transaction hash for a list of prepared Canton transactions.
   *
   * Each transaction is first hashed with purpose `11`, then all hashes are combined and
   * hashed again with purpose `55`, following the Canton topology hash rules.
   *
   * The resulting hash is encoded as a base64 string.
   *
   * @param {Buffer[]} preparedTransactions - An array of Canton transaction buffers.
   * @returns {string} The final topology hash, base64-encoded.
   */
  private computeHashFromTopologyTransaction(preparedTransactions: Buffer[]): string {
    const rawHashes = preparedTransactions.map((tx) => this.computeSha256CantonHash(11, tx));
    const combinedHashes = this.computeMultiHashForTopology(rawHashes);
    const computedHash = this.computeSha256CantonHash(55, combinedHashes);
    return Buffer.from(computedHash, 'hex').toString('base64');
  }

  /**
   * Converts a base64-encoded Ed25519 public key string into a structured signing public key object.
   * @param {String} publicKey The base64-encoded Ed25519 public key
   * @returns {Object} The structured signing key object formatted for use with cryptographic operations
   * @private
   */
  private signingPublicKeyFromEd25519(publicKey: string): {
    format: number;
    publicKey: Buffer;
    scheme: number;
    keySpec: number;
    usage: [];
  } {
    return {
      format: CryptoKeyFormat.RAW,
      publicKey: Buffer.from(publicKey, 'base64'),
      scheme: SigningAlgorithmSpec.ED25519,
      keySpec: SigningKeySpec.EC_CURVE25519,
      usage: [],
    };
  }

  /**
   * Creates a buffer with a 4-byte big-endian integer prefix followed by the provided byte buffer
   * @param {Number} value The integer to prefix, written as 4 bytes in big-endian order
   * @param {Buffer} bytes The buffer to append after the integer prefix
   * @returns {Buffer} The resulting buffer with the prefixed integer
   * @private
   */
  private prefixedInt(value: number, bytes: Buffer): Buffer {
    const buffer = Buffer.alloc(4 + bytes.length);
    buffer.writeUInt32BE(value, 0);
    Buffer.from(bytes).copy(buffer, 4);
    return buffer;
  }

  /**
   * Computes an SHA-256 Canton-style hash by prefixing the input with a purpose identifier,
   * then hashing the resulting buffer and prepending a multi-prefix
   *
   * @param {Number} purpose A numeric identifier to prefix the hash input with
   * @param {Buffer} bytes The buffer to be hashed
   * @returns {String} A hexadecimal string representation of the resulting hash with multi-prefix
   * @private
   */
  private computeSha256CantonHash(purpose: number, bytes: Buffer): string {
    const hashInput = this.prefixedInt(purpose, bytes);
    const hash = crypto.createHash('sha256').update(hashInput).digest();
    const multiprefix = Buffer.from([0x12, 0x20]);
    return Buffer.concat([multiprefix, hash]).toString('hex');
  }

  /**
   * Decodes a Base64-encoded string into a Uint8Array
   * @param {String} b64 The Base64-encoded string
   * @returns {Uint8Array} The decoded byte array
   * @private
   */
  private fromBase64(b64: string): Uint8Array {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }

  /**
   * Decodes a Base64-encoded prepared transaction into a structured object
   * @param {String} base64 The Base64-encoded transaction data
   * @returns {IPreparedTransaction} The decoded `IPreparedTransaction` object
   * @private
   */
  private decodePreparedTransaction(base64: string): IPreparedTransaction {
    const bytes = this.fromBase64(base64);
    return PreparedTransaction.fromBinary(bytes);
  }

  /**
   * Computes a deterministic combined hash from an array of individual Canton-style SHA-256 hashes
   *
   * Each hash is decoded from hex, sorted lexicographically (by hex), and prefixed with its length
   * The final buffer includes the number of hashes followed by each (length-prefixed) hash
   *
   * @param {string[]} hashes - An array of Canton-prefixed SHA-256 hashes in hexadecimal string format
   * @returns {Buffer} A binary buffer representing the combined hash input
   */
  private computeMultiHashForTopology(hashes: string[]): Buffer {
    const sortedHashes = hashes
      .map((hex) => Buffer.from(hex, 'hex'))
      .sort((a, b) => a.toString('hex').localeCompare(b.toString('hex')));

    const numHashesBytes = this.encodeInt32(sortedHashes.length);
    const parts: Buffer[] = [numHashesBytes];

    for (const h of sortedHashes) {
      const lengthBytes = this.encodeInt32(h.length);
      parts.push(lengthBytes, h);
    }

    return Buffer.concat(parts);
  }

  /**
   * Encodes a 32-bit signed integer into a 4-byte big-endian Buffer
   *
   * @param {number} value - The integer to encode
   * @returns {Buffer} A 4-byte buffer representing the integer in big-endian format
   */
  private encodeInt32(value: number): Buffer {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(value, 0);
    return buf;
  }

  /**
   * Convert to canton raw units
   * @param {BigNumber} value
   * @returns {String} the converted raw canton units
   * @private
   */
  private convertAmountToLowestUnit(value: BigNumber): string {
    return value.multipliedBy(new BigNumber(10).pow(10)).toFixed(0);
  }

  isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private areNumericStrings(a: string, b: string): boolean {
    const numericRe = /^-?\d+(\.\d+)?$/;
    return numericRe.test(a) && numericRe.test(b);
  }

  private isIsoTimestamp(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)) {
      return false;
    }
    return Number.isFinite(Date.parse(value));
  }

  private isIntegerString(value: string): boolean {
    return /^\d+$/.test(value);
  }

  private describeType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private stringifyForError(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  /**
   * Get the bitgo token name using the on-chain instrument details
   * @param contractAddress - the contract address of the form, `instrumentAdmin:instrumentId`
   * @returns tokenName if contractAddress matches with any supported canton tokens
   */
  private findTokenNameByContractAddress(contractAddress: string): string | undefined {
    if (contractAddress.includes('Amulet')) {
      return undefined;
    }
    const cantonToken = coins
      .filter((coin) => coin instanceof CantonToken && coin.contractAddress === contractAddress)
      .map((coin) => coin as CantonToken);
    return cantonToken ? cantonToken[0].name : undefined;
  }
}

const utils = new Utils();

export default utils;
