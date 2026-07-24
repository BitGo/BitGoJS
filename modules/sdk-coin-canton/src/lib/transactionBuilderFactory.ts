import {
  BaseTransaction,
  BaseTransactionBuilderFactory,
  InvalidTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AllocationAllocateBuilder } from './allocationAllocateBuilder';
import { AllocationAllocateWithdrawnBuilder } from './allocationAllocateWithdrawnBuilder';
import { AllocationRejectBuilder } from './allocationRejectBuilder';
import { AllocationRequestBuilder } from './allocationRequestBuilder';
import { CantonCommandBuilder } from './cantonCommandBuilder';
import { EndInvestorOnboardingOfferBuilder } from './endInvestorOnboardingOfferBuilder';
import { CosignDelegationAcceptBuilder } from './cosignDelegationAcceptBuilder';
import { CosignDelegationProposalBuilder } from './cosignDelegationProposalBuilder';
import { OneStepPreApprovalBuilder } from './oneStepPreApprovalBuilder';
import { TransferAcceptanceBuilder } from './transferAcceptanceBuilder';
import { TransferAcknowledgeBuilder } from './transferAcknowledgeBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransferOfferWithdrawnBuilder } from './transferOfferWithdrawnBuilder';
import { TransferRejectionBuilder } from './transferRejectionBuilder';
import { Transaction } from './transaction/transaction';
import { WalletInitBuilder } from './walletInitBuilder';
import { WalletInitTransaction } from './walletInitialization/walletInitTransaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  /** @inheritdoc */
  from(raw: string): TransactionBuilder | WalletInitBuilder {
    try {
      const tx = new WalletInitTransaction(this._coinConfig);
      tx.fromRawTransaction(raw);
      return this.getWalletInitializationBuilder(tx);
    } catch {
      const tx = new Transaction(this._coinConfig);
      tx.fromRawTransaction(raw);
      switch (tx.type) {
        case TransactionType.OneStepPreApproval: {
          return this.getOneStepPreapprovalBuilder(tx);
        }
        case TransactionType.Send: {
          return this.getTransferBuilder(tx);
        }
        case TransactionType.TransferAccept: {
          return this.getTransferAcceptanceBuilder(tx);
        }
        case TransactionType.TransferAcknowledge: {
          return this.getTransferAcknowledgeBuilder(tx);
        }
        case TransactionType.CosignDelegationProposal: {
          return this.getCosignDelegationProposalBuilder(tx);
        }
        case TransactionType.CosignDelegationAccept: {
          return this.getCosignDelegationAcceptBuilder(tx);
        }
        case TransactionType.TransferOfferWithdrawn: {
          return this.getTransferOfferWithdrawnBuilder(tx);
        }
        case TransactionType.TransferReject: {
          return this.getTransferRejectBuilder(tx);
        }
        case TransactionType.AllocationAllocate: {
          return this.getAllocationAllocateBuilder(tx);
        }
        case TransactionType.AllocationAllocateWithdrawn: {
          return this.getAllocationAllocateWithdrawnBuilder(tx);
        }
        case TransactionType.AllocationRequest: {
          return this.getAllocationRequestBuilder(tx);
        }
        case TransactionType.AllocationReject: {
          return this.getAllocationRejectBuilder(tx);
        }
        case TransactionType.CantonCommand: {
          return this.getCantonCommandBuilder(tx);
        }
        case TransactionType.EndInvestorOnboardingOffer: {
          return this.getEndInvestorOnboardingOfferBuilder(tx);
        }
        default: {
          throw new InvalidTransactionError('unsupported transaction');
        }
      }
    }
  }

  getAllocationAllocateBuilder(tx?: Transaction): AllocationAllocateBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new AllocationAllocateBuilder(this._coinConfig));
  }

  getAllocationAllocateWithdrawnBuilder(tx?: Transaction): AllocationAllocateWithdrawnBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new AllocationAllocateWithdrawnBuilder(this._coinConfig));
  }

  getAllocationRejectBuilder(tx?: Transaction): AllocationRejectBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new AllocationRejectBuilder(this._coinConfig));
  }

  getAllocationRequestBuilder(tx?: Transaction): AllocationRequestBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new AllocationRequestBuilder(this._coinConfig));
  }

  getCantonCommandBuilder(tx?: Transaction): CantonCommandBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new CantonCommandBuilder(this._coinConfig));
  }

  getEndInvestorOnboardingOfferBuilder(tx?: Transaction): EndInvestorOnboardingOfferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new EndInvestorOnboardingOfferBuilder(this._coinConfig));
  }

  getOneStepPreapprovalBuilder(tx?: Transaction): OneStepPreApprovalBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new OneStepPreApprovalBuilder(this._coinConfig));
  }

  getTransferAcceptanceBuilder(tx?: Transaction): TransferAcceptanceBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferAcceptanceBuilder(this._coinConfig));
  }

  getTransferAcknowledgeBuilder(tx?: Transaction): TransferAcknowledgeBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferAcknowledgeBuilder(this._coinConfig));
  }

  getCosignDelegationProposalBuilder(tx?: Transaction): CosignDelegationProposalBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new CosignDelegationProposalBuilder(this._coinConfig));
  }

  getCosignDelegationAcceptBuilder(tx?: Transaction): CosignDelegationAcceptBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new CosignDelegationAcceptBuilder(this._coinConfig));
  }

  getTransferOfferWithdrawnBuilder(tx?: Transaction): TransferOfferWithdrawnBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferOfferWithdrawnBuilder(this._coinConfig));
  }

  getTransferRejectBuilder(tx?: Transaction): TransferRejectionBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferRejectionBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: WalletInitTransaction): WalletInitBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new WalletInitBuilder(this._coinConfig));
  }

  private static initializeBuilder<TTx extends BaseTransaction, TBuilder extends { initBuilder(tx: TTx): void }>(
    tx: TTx | undefined,
    builder: TBuilder
  ): TBuilder {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
