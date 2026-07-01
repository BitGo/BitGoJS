import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Interface } from '@bitgo/abstract-substrate';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import { TokenTransferBuilder } from './tokenTransferBuilder';
import {
  AddAndAffirmWithMediatorsArgs,
  AssetHolder,
  DecodedAssetHolder,
  DecodedV8AddAndAffirmWithMediatorsArgs,
  MethodNames,
  PortfolioKind,
  SettlementType,
  V8AddAndAffirmWithMediatorsArgs,
} from './iface';
import { V8AddAndAffirmWithMediatorsTransactionSchema } from './txnSchema';
import utils from './utils';

/**
 * Reads the DID out of a decoded AssetHolder. Only the `Portfolio` variant is supported —
 * `Account` covers v8 account-based ownership, which is out of scope for this migration.
 */
function assetHolderDID(holder: DecodedAssetHolder): string {
  if ('portfolio' in holder) {
    return holder.portfolio.did;
  }
  throw new Error('Unsupported AssetHolder variant: Account (account-based ownership is out of scope)');
}

/**
 * Builds a Polymesh settlement.addAndAffirmWithMediators transaction against Polymesh v8
 * chain metadata.
 *
 * Confirmed on Polymesh Testnet v8 (block 24801173): the call index is unchanged (0x2514), but
 * the top-level `portfolios` field is renamed `holderSet`, and every leg `sender`/`receiver` is
 * wrapped in the `AssetHolder` enum (`{ Portfolio: { did, kind } }`) instead of the bare v7
 * PortfolioId shape. TokenTransferBuilder's v7 args are therefore not compatible with v8
 * metadata as-is; this builder constructs the v8-shaped args directly.
 */
export class V8TokenTransferBuilder extends TokenTransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    const senderHolder: AssetHolder = { Portfolio: { did: this._fromDID, kind: PortfolioKind.Default } };
    const receiverHolder: AssetHolder = { Portfolio: { did: this._toDID, kind: PortfolioKind.Default } };
    return this.buildV8AddAndAffirmWithMediators(
      {
        venueId: null,
        settlementType: SettlementType.SettleOnAffirmation,
        tradeDate: null,
        valueDate: null,
        legs: [
          {
            fungible: {
              sender: senderHolder,
              receiver: receiverHolder,
              assetId: this._assetId,
              amount: this._amount,
            },
          },
        ],
        holderSet: [senderHolder],
        instructionMemo: this._memo,
        mediators: [],
      },
      baseTxInfo
    );
  }

  /** @inheritdoc */
  protected populateFromMethodArgs(txMethod: AddAndAffirmWithMediatorsArgs): void {
    const v8Method = txMethod as unknown as DecodedV8AddAndAffirmWithMediatorsArgs;
    this.assetId(v8Method.legs[0].fungible.assetId);
    this.amount(v8Method.legs[0].fungible.amount);
    this.memo(v8Method.instructionMemo);
    this.fromDID(assetHolderDID(v8Method.legs[0].fungible.sender));
    this.toDID(assetHolderDID(v8Method.legs[0].fungible.receiver));
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction?: string): void {
    if (decodedTxn.method?.name === MethodNames.AddAndAffirmWithMediators) {
      const txMethod = decodedTxn.method.args as unknown as DecodedV8AddAndAffirmWithMediatorsArgs;
      const validationResult = V8AddAndAffirmWithMediatorsTransactionSchema.validate({
        venueId: txMethod.venueId,
        settlementType: txMethod.settlementType,
        tradeDate: txMethod.tradeDate,
        valueDate: txMethod.valueDate,
        legs: txMethod.legs,
        holderSet: txMethod.holderSet,
        instructionMemo: txMethod.instructionMemo,
        mediators: txMethod.mediators,
      });
      if (validationResult.error) {
        throw new Error(`Invalid transaction: ${validationResult.error.message}`);
      }
    }
  }

  private buildV8AddAndAffirmWithMediators(
    args: V8AddAndAffirmWithMediatorsArgs,
    info: Interface.CreateBaseTxInfo
  ): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'addAndAffirmWithMediators',
          pallet: 'settlement',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
