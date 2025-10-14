import { TransactionType } from '@bitgo/sdk-core';
import { DamlTransaction, Metadata } from './resourcesInterface';

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface TxData {
  id: string;
  type: TransactionType;
  sender: string;
  receiver: string;
}

export interface PreparedTxnParsedInfo {
  sender: string;
  receiver: string;
  amount: string;
}

export interface WalletInitTxData {
  id: string;
  type: TransactionType;
  preparedParty: PreparedParty;
}

export interface CantonPrepareCommandResponse {
  preparedTransaction?: string;
  preparedTransactionHash: string;
  hashingSchemeVersion: string;
  hashingDetails?: string | null;
}

export interface PreparedParty {
  partyId: string;
  publicKeyFingerprint: string;
  topologyTransactions: string[];
  multiHash: string;
}

export interface PreparedTransaction {
  transaction?: DamlTransaction;
  metadata?: Metadata;
}

export interface IPublicKey {
  format: string;
  keyData: string;
  keySpec: string;
}

export interface WalletInitRequest {
  synchronizer: string;
  partyHint: string;
  publicKey: IPublicKey;
  localParticipantObservationOnly: boolean;
  otherConfirmingParticipantUids: string[];
  confirmationThreshold: number;
  observingParticipantUids: string[];
}

interface PreApprovalCreateCommand {
  templateId: string;
  createArguments: {
    receiver: string;
    provider: string;
    expectedDso: string;
  };
}

export interface OneStepEnablementRequest {
  commandId: string;
  commands: [
    {
      CreateCommand: PreApprovalCreateCommand;
    }
  ];
  disclosedContracts: [];
  synchronizerId: string;
  verboseHashing: boolean;
  actAs: string[];
  readAs: string[];
  packageIdSelectionPreference: string[];
}
