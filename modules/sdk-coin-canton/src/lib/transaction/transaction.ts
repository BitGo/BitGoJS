import { BaseKey, BaseTransaction, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  CantonPrepareCommandResponse,
  MultiHashSignature,
  PartySignature,
  PreparedTxnParsedInfo,
  TransactionBroadcastData,
  TransferAcknowledge,
  TxData,
} from '../iface';
import utils from '../utils';
import { DUMMY_HASH, HASHING_SCHEME_VERSION, SIGNATURE_ALGORITHM_SPEC, SIGNATURE_FORMAT } from '../constant';

export class Transaction extends BaseTransaction {
  private _prepareCommand: CantonPrepareCommandResponse;
  private _signerFingerprint: string;
  private _acknowledgeData: TransferAcknowledge;

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
    if (!this._type) {
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
    if (!this._prepareCommand) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const partySignatures: PartySignature[] = [];
    const data: TransactionBroadcastData = {
      prepareCommandResponse: this._prepareCommand,
      txType: this._type ? TransactionType[this._type] : '',
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
      const signerPartyId = `${this._signerFingerprint.slice(0, 5)}::${this._signerFingerprint}`;
      this.signature.map((signature) => {
        const signatureObj: MultiHashSignature = {
          format: SIGNATURE_FORMAT,
          signature: signature,
          signedBy: this._signerFingerprint,
          signingAlgorithmSpec: SIGNATURE_ALGORITHM_SPEC,
        };
        signatures.push(signatureObj);
      });
      const partySignature = {
        party: signerPartyId,
        signatures: signatures,
      };
      data.partySignatures?.signatures.push(partySignature);
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
    };
    if (this._type === TransactionType.TransferAcknowledge) {
      if (!this._acknowledgeData) {
        throw new InvalidTransactionError('AcknowledgeData is not set');
      }
      result.acknowledgeData = this._acknowledgeData;
      return result;
    }
    if (!this._prepareCommand || !this._prepareCommand.preparedTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    // TODO: extract other required data (utxo used, request time, execute before etc)
    let parsedInfo: PreparedTxnParsedInfo;
    try {
      parsedInfo = utils.parseRawCantonTransactionData(this._prepareCommand.preparedTransaction);
    } catch (e) {
      throw new InvalidTransactionError(`Failed to parse transaction hash: ${e instanceof Error ? e.message : e}`);
    }
    result.sender = parsedInfo.sender;
    result.receiver = parsedInfo.receiver;
    return result;
  }

  get signablePayload(): Buffer {
    if (this._type === TransactionType.TransferAcknowledge) {
      return Buffer.from(DUMMY_HASH, 'base64');
    }
    if (!this._prepareCommand) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return Buffer.from(this._prepareCommand.preparedTransactionHash, 'base64');
  }

  fromRawTransaction(rawTx: string): void {
    try {
      const decoded: TransactionBroadcastData = JSON.parse(Buffer.from(rawTx, 'base64').toString('utf8'));
      this.id = decoded.submissionId;
      this.transactionType = TransactionType[decoded.txType];
      if (this.type !== TransactionType.TransferAcknowledge) {
        if (decoded.prepareCommandResponse) {
          this.prepareCommand = decoded.prepareCommandResponse;
        }
        if (decoded.partySignatures && decoded.partySignatures.signatures.length > 0) {
          this.signerFingerprint = decoded.partySignatures.signatures[0].party.split('::')[1];
          this.signatures = decoded.partySignatures.signatures[0].signatures[0].signature;
        }
      } else {
        if (decoded.acknowledgeData) {
          this.acknowledgeData = decoded.acknowledgeData;
        }
      }
    } catch (e) {
      throw new InvalidTransactionError('Unable to parse raw transaction data');
    }
  }
}
