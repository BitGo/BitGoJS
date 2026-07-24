import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  ITransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  AllocationRequest,
  CantonCommandExplain,
  CantonPrepareCommandResponse,
  CosignDelegationProposal,
  EndInvestorOnboardingOfferData,
  MultiHashSignature,
  PartySignature,
  PreparedTxnParsedInfo,
  TransactionBroadcastData,
  TransactionExplanation,
  TransferAcknowledge,
  TxData,
} from '../iface';
import utils from '../utils';
import { DUMMY_HASH, HASHING_SCHEME_VERSION, SIGNATURE_ALGORITHM_SPEC, SIGNATURE_FORMAT } from '../constant';

export class Transaction extends BaseTransaction {
  private _prepareCommand: CantonPrepareCommandResponse;
  private _signerFingerprint: string;
  private _acknowledgeData: TransferAcknowledge;
  private _cosignDelegationProposalData: CosignDelegationProposal;
  private _allocationRequestData: AllocationRequest;
  private _endInvestorOnboardingOfferData: EndInvestorOnboardingOfferData;
  private _cantonCommandActAs: string[];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get prepareCommand(): CantonPrepareCommandResponse {
    return this._prepareCommand;
  }

  set prepareCommand(transaction: CantonPrepareCommandResponse) {
    this._prepareCommand = transaction;
  }

  set transactionType(transactionType: TransactionType) {
    this._type = transactionType;
  }

  set acknowledgeData(data: TransferAcknowledge) {
    this._acknowledgeData = data;
  }

  set cosignDelegationProposalData(data: CosignDelegationProposal) {
    this._cosignDelegationProposalData = data;
  }

  set allocationRequestData(data: AllocationRequest) {
    this._allocationRequestData = data;
  }

  set endInvestorOnboardingOfferData(data: EndInvestorOnboardingOfferData) {
    this._endInvestorOnboardingOfferData = data;
  }

  set cantonCommandActAs(parties: string[]) {
    this._cantonCommandActAs = parties;
  }

  get id(): string {
    if (!this._id) {
      throw new InvalidTransactionError('transaction is is not set');
    }
    return this._id;
  }

  set id(id: string) {
    this._id = id;
  }

  canSign(key: BaseKey): boolean {
    return false;
  }

  set signatures(signature: string) {
    this._signatures.push(signature);
  }

  set signerFingerprint(fingerprint: string) {
    this._signerFingerprint = fingerprint;
  }

  toBroadcastFormat(): string {
    if (this._type === undefined) {
      throw new InvalidTransactionError('Transaction type is not set');
    }
    if (this._type === TransactionType.TransferAcknowledge) {
      if (!this._acknowledgeData) {
        throw new InvalidTransactionError('AcknowledgeData is not set');
      }
      const minData: TransactionBroadcastData = {
        txType: TransactionType[this._type],
        submissionId: this.id,
        acknowledgeData: this._acknowledgeData,
      };
      return Buffer.from(JSON.stringify(minData)).toString('base64');
    }
    if (this._type === TransactionType.CosignDelegationProposal) {
      if (!this._cosignDelegationProposalData) {
        throw new InvalidTransactionError('CosignDelegationProposalData is not set');
      }
      const minData: TransactionBroadcastData = {
        txType: TransactionType[this._type],
        submissionId: this.id,
        cosignDelegationProposalData: this._cosignDelegationProposalData,
      };
      return Buffer.from(JSON.stringify(minData)).toString('base64');
    }
    if (this._type === TransactionType.AllocationRequest) {
      if (!this._allocationRequestData) {
        throw new InvalidTransactionError('AllocationRequestData is not set');
      }
      const minData: TransactionBroadcastData = {
        txType: TransactionType[this._type],
        submissionId: this.id,
        allocationRequestData: this._allocationRequestData,
      };
      return Buffer.from(JSON.stringify(minData)).toString('base64');
    }
    if (this._type === TransactionType.EndInvestorOnboardingOffer) {
      if (!this._endInvestorOnboardingOfferData) {
        throw new InvalidTransactionError('EndInvestorOnboardingOfferData is not set');
      }
      const minData: TransactionBroadcastData = {
        txType: TransactionType[this._type],
        submissionId: this.id,
        endInvestorOnboardingOfferData: this._endInvestorOnboardingOfferData,
      };
      return Buffer.from(JSON.stringify(minData)).toString('base64');
    }
    if (!this._prepareCommand) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const partySignatures: PartySignature[] = [];
    const data: TransactionBroadcastData = {
      prepareCommandResponse: this._prepareCommand,
      txType: this._type !== undefined ? TransactionType[this._type] : '',
      preparedTransaction: '',
      partySignatures: {
        signatures: partySignatures,
      },
      deduplicationPeriod: {
        Empty: {},
      },
      submissionId: this.id,
      hashingSchemeVersion: HASHING_SCHEME_VERSION,
      minLedgerTime: {
        time: {
          Empty: {},
        },
      },
    };
    const signatures: MultiHashSignature[] = [];
    if (this._signatures.length > 0 && this._signerFingerprint) {
      this.signature.map((signature) => {
        const signatureObj: MultiHashSignature = {
          format: SIGNATURE_FORMAT,
          signature: signature,
          signedBy: this._signerFingerprint,
          signingAlgorithmSpec: SIGNATURE_ALGORITHM_SPEC,
        };
        signatures.push(signatureObj);
      });
      // CantonCommand: the Canton protocol requires one partySignatures entry per actAs party; all parties share the same TSS key and signature.
      if (this._type === TransactionType.CantonCommand) {
        if (!this._cantonCommandActAs?.length) {
          throw new InvalidTransactionError(
            'CantonCommand transaction is missing actAs parties required for partySignatures'
          );
        }
        for (const party of this._cantonCommandActAs) {
          data.partySignatures?.signatures.push({ party, signatures });
        }
      } else {
        const signerPartyId = `${this._signerFingerprint.slice(0, 5)}::${this._signerFingerprint}`;
        data.partySignatures?.signatures.push({ party: signerPartyId, signatures });
      }
      data.preparedTransaction = this._prepareCommand.preparedTransaction
        ? this._prepareCommand.preparedTransaction
        : '';
    }
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  toJson(): TxData {
    const result: TxData = {
      id: this.id,
      type: this._type as TransactionType,
      sender: '',
      receiver: '',
      amount: '',
    };
    if (this._type === TransactionType.TransferAcknowledge) {
      if (!this._acknowledgeData) {
        throw new InvalidTransactionError('AcknowledgeData is not set');
      }
      result.acknowledgeData = this._acknowledgeData;
      return result;
    }
    if (this._type === TransactionType.CosignDelegationProposal) {
      if (!this._cosignDelegationProposalData) {
        throw new InvalidTransactionError('CosignDelegationProposalData is not set');
      }
      result.cosignDelegationProposalData = this._cosignDelegationProposalData;
      return result;
    }
    if (this._type === TransactionType.AllocationRequest) {
      if (!this._allocationRequestData) {
        throw new InvalidTransactionError('AllocationRequestData is not set');
      }
      result.allocationRequestData = this._allocationRequestData;
      return result;
    }
    if (this._type === TransactionType.EndInvestorOnboardingOffer) {
      if (!this._endInvestorOnboardingOfferData) {
        throw new InvalidTransactionError('EndInvestorOnboardingOfferData is not set');
      }
      result.endInvestorOnboardingOfferData = this._endInvestorOnboardingOfferData;
      return result;
    }
    if (this._type === TransactionType.CantonCommand) {
      if (!this._prepareCommand?.preparedTransaction) {
        throw new InvalidTransactionError('Empty transaction data');
      }
      const commandSummary = this.buildCantonCommandSummary();
      if (commandSummary) {
        result.cantonCommand = commandSummary;
      }
      return result;
    }
    if (!this._prepareCommand || !this._prepareCommand.preparedTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    // TODO: extract other required data (utxo used, request time, execute before etc)
    let parsedInfo: PreparedTxnParsedInfo;
    try {
      parsedInfo = utils.parseRawCantonTransactionData(this._prepareCommand.preparedTransaction, this.type);
    } catch (e) {
      throw new InvalidTransactionError(`Failed to parse transaction hash: ${e instanceof Error ? e.message : e}`);
    }
    result.sender = parsedInfo.sender;
    result.receiver = parsedInfo.receiver;
    result.amount = parsedInfo.amount;
    if (parsedInfo.memoId) {
      result.memoId = parsedInfo.memoId;
    }
    if (parsedInfo.token) {
      result.token = parsedInfo.token;
    }
    return result;
  }

  get signablePayload(): Buffer {
    if (
      this._type === TransactionType.TransferAcknowledge ||
      this._type === TransactionType.CosignDelegationProposal ||
      this._type === TransactionType.AllocationRequest ||
      this._type === TransactionType.EndInvestorOnboardingOffer
    ) {
      return Buffer.from(DUMMY_HASH, 'base64');
    }
    if (!this._prepareCommand) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return Buffer.from(this._prepareCommand.preparedTransactionHash, 'base64');
  }

  get cantonCommandActAsParties(): string[] {
    return this._cantonCommandActAs ?? [];
  }

  fromRawTransaction(rawTx: string): void {
    try {
      const decoded: TransactionBroadcastData = JSON.parse(Buffer.from(rawTx, 'base64').toString('utf8'));
      this.id = decoded.submissionId;
      this.transactionType = TransactionType[decoded.txType];
      if (this.type === TransactionType.TransferAcknowledge) {
        if (decoded.acknowledgeData) {
          this.acknowledgeData = decoded.acknowledgeData;
        }
      } else if (this.type === TransactionType.CosignDelegationProposal) {
        if (decoded.cosignDelegationProposalData) {
          this.cosignDelegationProposalData = decoded.cosignDelegationProposalData;
        }
      } else if (this.type === TransactionType.AllocationRequest) {
        if (decoded.allocationRequestData) {
          this.allocationRequestData = decoded.allocationRequestData;
        }
      } else if (this.type === TransactionType.EndInvestorOnboardingOffer) {
        if (decoded.endInvestorOnboardingOfferData) {
          this.endInvestorOnboardingOfferData = decoded.endInvestorOnboardingOfferData;
        }
      } else {
        if (decoded.prepareCommandResponse) {
          this.prepareCommand = decoded.prepareCommandResponse;
          if (this.type !== TransactionType.CantonCommand) {
            this.loadInputsAndOutputs();
          }
        }
        if (decoded.partySignatures && decoded.partySignatures.signatures.length > 0) {
          this.signerFingerprint = decoded.partySignatures.signatures[0].party.split('::')[1];
          this.signatures = decoded.partySignatures.signatures[0].signatures[0].signature;
        }
        if (this.type === TransactionType.CantonCommand && decoded.prepareCommandResponse?.preparedTransaction) {
          this.cantonCommandActAs = utils.extractSubmitterActAs(decoded.prepareCommandResponse.preparedTransaction);
        }
      }
    } catch (e) {
      throw new InvalidTransactionError('Unable to parse raw transaction data');
    }
  }

  /**
   * Loads the input & output fields for the transaction
   *
   */
  loadInputsAndOutputs(): void {
    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    const txData = this.toJson();
    const input: Entry = {
      address: txData.sender,
      value: txData.amount,
      coin: txData.token ? txData.token : this._coinConfig.name,
    };
    const output: Entry = {
      address: txData.receiver,
      value: txData.amount,
      coin: txData.token ? txData.token : this._coinConfig.name,
    };
    inputs.push(input);
    outputs.push(output);
    this._inputs = inputs;
    this._outputs = outputs;
  }

  explainTransaction(): TransactionExplanation {
    const displayOrder = [
      'id',
      'outputs',
      'outputAmount',
      'inputs',
      'inputAmount',
      'changeOutputs',
      'changeAmount',
      'fee',
      'type',
    ];
    const inputs: ITransactionRecipient[] = [];
    const outputs: ITransactionRecipient[] = [];
    let inputAmount = '0';
    let outputAmount = '0';
    switch (this.type) {
      case TransactionType.CosignDelegationAccept:
      case TransactionType.TransferAccept:
      case TransactionType.TransferReject: {
        const txData = this.toJson();
        const input: ITransactionRecipient = {
          address: txData.sender,
          amount: txData.amount,
        };
        if (txData.token) {
          input.tokenName = txData.token;
        }
        inputs.push(input);
        inputAmount = txData.amount;
        break;
      }
      case TransactionType.AllocationAllocate:
      case TransactionType.Send: {
        const txData = this.toJson();
        const output: ITransactionRecipient = {
          address: txData.receiver,
          amount: txData.amount,
        };
        if (txData.memoId) {
          output.memo = txData.memoId;
        }
        if (txData.token) {
          output.tokenName = txData.token;
        }
        outputs.push(output);
        outputAmount = txData.amount;
        break;
      }
      case TransactionType.TransferOfferWithdrawn:
      case TransactionType.AllocationAllocateWithdrawn: {
        const txData = this.toJson();
        const input: ITransactionRecipient = {
          address: txData.receiver,
          amount: txData.amount,
        };
        if (txData.token) {
          input.tokenName = txData.token;
        }
        inputs.push(input);
        inputAmount = txData.amount;
        break;
      }
      case TransactionType.CantonCommand: {
        const commandSummary = this.buildCantonCommandSummary();
        const explanation: TransactionExplanation = {
          id: this.id,
          displayOrder,
          outputs: outputs,
          outputAmount: outputAmount,
          inputs: inputs,
          inputAmount: inputAmount,
          changeOutputs: [],
          changeAmount: '0',
          fee: { fee: '0' },
          type: this.type,
        };
        if (commandSummary) {
          explanation.cantonCommand = commandSummary;
        }
        return explanation;
      }
      case TransactionType.EndInvestorOnboardingOffer: {
        // Non-signable notification record — no inputs, outputs, or amounts to explain.
        return {
          id: this.id,
          displayOrder,
          outputs: [],
          outputAmount: '0',
          inputs: [],
          inputAmount: '0',
          changeOutputs: [],
          changeAmount: '0',
          fee: { fee: '0' },
          type: this.type,
        };
      }
    }
    return {
      id: this.id,
      displayOrder,
      outputs: outputs,
      outputAmount: outputAmount,
      inputs: inputs,
      inputAmount: inputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: '0' },
      type: this.type,
    };
  }

  private buildCantonCommandSummary(): CantonCommandExplain | undefined {
    const rawPrepared = this._prepareCommand?.preparedTransaction;
    if (!rawPrepared) {
      return undefined;
    }
    try {
      const info = utils.extractCantonCommandInfo(rawPrepared);
      const templateIdStr = `${info.templateId.packageId}:${info.templateId.moduleName}:${info.templateId.entityName}`;
      const summary: CantonCommandExplain = {
        kind: info.kind,
        templateId: templateIdStr,
        actAs: this._cantonCommandActAs ?? [],
      };
      if (info.choice !== undefined) summary.choice = info.choice;
      if (info.contractId !== undefined && info.contractId !== '') summary.contractId = info.contractId;
      return summary;
    } catch {
      return undefined;
    }
  }
}
