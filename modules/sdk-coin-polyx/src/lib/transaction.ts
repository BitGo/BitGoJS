import { Transaction as SubstrateTransaction, utils, KeyPair } from '@bitgo/abstract-substrate';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { construct, decode } from '@substrate/txwrapper-polkadot';
import { decodeAddress } from '@polkadot/keyring';
import { coins, PolyxCoin } from '@bitgo/statics';
import {
  DecodedTx,
  RegisterDidWithCDDArgs,
  PreApproveAssetArgs,
  TxData,
  AddAndAffirmWithMediatorsArgs,
  RejectInstructionBuilderArgs,
} from './iface';
import polyxUtils from './utils';

export class Transaction extends SubstrateTransaction {
  /**
   * Override the getAddressFormat method to return different values based on network type
   * Returns 12 for mainnet and 42 for testnet
   *
   * @returns {number} The address format to use
   * @override
   */
  protected getAddressFormat(): number {
    return polyxUtils.getAddressFormat(this._coinConfig.name);
  }

  /**
   * Helper method to find a token name by assetId
   * @param assetId The assetId to search for
   * @returns The token name if found
   * @throws {InvalidTransactionError} If no matching token is found
   */
  private getTokenNameByAssetId(assetId: string): string {
    // Search through all coins to find the one with matching assetId
    let foundToken: string | undefined;
    coins.forEach((coin) => {
      if (coin instanceof PolyxCoin && coin.assetId === assetId) {
        foundToken = coin.name;
      }
    });

    if (!foundToken) {
      throw new InvalidTransactionError(`No token found for assetId: ${assetId}`);
    }

    return foundToken;
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._substrateTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }

    const decodedTx = decode(this._substrateTransaction, {
      metadataRpc: this._substrateTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._substrateTransaction.era),
    }) as unknown as DecodedTx;

    const result: TxData = {
      id: construct.txHash(this.toBroadcastFormat()),
      sender: decodedTx.address,
      referenceBlock: decodedTx.blockHash,
      blockNumber: decodedTx.blockNumber,
      genesisHash: decodedTx.genesisHash,
      nonce: decodedTx.nonce,
      specVersion: decodedTx.specVersion,
      transactionVersion: decodedTx.transactionVersion,
      eraPeriod: decodedTx.eraPeriod,
      chainName: this._chainName,
      tip: decodedTx.tip ? Number(decodedTx.tip) : 0,
    };

    const txMethod = decodedTx.method.args;
    if (this.type === TransactionType.WalletInitialization) {
      const { targetAccount } = txMethod as RegisterDidWithCDDArgs;
      const keypairDest = new KeyPair({
        pub: Buffer.from(decodeAddress(targetAccount)).toString('hex'),
      });
      result.to = keypairDest.getAddress(this.getAddressFormat());
      result.amount = '0'; // RegisterDidWithCDD does not transfer any value
    } else if (this.type === TransactionType.TrustLine) {
      const { assetId } = txMethod as PreApproveAssetArgs;
      result.assetId = assetId;
      result.sender = decodedTx.address;
      result.amount = '0'; // Pre-approval does not transfer any value
    } else if (this.type === TransactionType.SendToken) {
      const sendTokenArgs = txMethod as AddAndAffirmWithMediatorsArgs;
      result.fromDID = sendTokenArgs.legs[0].fungible.sender.did;
      result.toDID = sendTokenArgs.legs[0].fungible.receiver.did;
      result.amount = sendTokenArgs.legs[0].fungible.amount.toString();
      result.assetId = sendTokenArgs.legs[0].fungible.assetId;
      result.memo = sendTokenArgs.instructionMemo;
    } else if (this.type === TransactionType.RejectInstruction) {
      const rejectInstructionArgs = txMethod as RejectInstructionBuilderArgs;
      result.instructionId = rejectInstructionArgs.id as string;
      result.portfolioDID = rejectInstructionArgs.portfolio.did as string;
      result.amount = '0'; // Reject instruction does not transfer any value
    } else {
      return super.toJson() as TxData;
    }

    return result;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    super.loadInputsAndOutputs();

    const decodedTx = decode(this._substrateTransaction, {
      metadataRpc: this._substrateTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._substrateTransaction.era),
    }) as unknown as DecodedTx;

    if (this.type === TransactionType.WalletInitialization) {
      this.decodeInputsAndOutputsForRegisterDidWithCDD(decodedTx);
    } else if (this.type === TransactionType.TrustLine) {
      this.decodeInputsAndOutputsForPreApproveAsset(decodedTx);
    } else if (this.type === TransactionType.SendToken) {
      this.decodeInputsAndOutputsForSendToken(decodedTx);
    } else if (this.type === TransactionType.RejectInstruction) {
      this.decodeInputsAndOutputsForRejectInstruction(decodedTx);
    }
  }

  private decodeInputsAndOutputsForRegisterDidWithCDD(decodedTx: DecodedTx) {
    const txMethod = decodedTx.method.args as RegisterDidWithCDDArgs;
    const keypairDest = new KeyPair({
      pub: Buffer.from(decodeAddress(txMethod.targetAccount)).toString('hex'),
    });
    const to = keypairDest.getAddress(this.getAddressFormat());
    const value = '0';
    const from = decodedTx.address;

    this._inputs.push({
      address: from,
      value,
      coin: this._coinConfig.name,
    });

    this._outputs.push({
      address: to,
      value,
      coin: this._coinConfig.name,
    });
  }

  private decodeInputsAndOutputsForPreApproveAsset(decodedTx: DecodedTx) {
    const txMethod = decodedTx.method.args as PreApproveAssetArgs;
    const sender = decodedTx.address;
    const value = '0'; // Pre-approval does not transfer any value
    const tokenName = this.getTokenNameByAssetId(txMethod.assetId);

    this._inputs.push({
      address: sender,
      value,
      coin: tokenName,
    });

    this._outputs.push({
      address: sender, // In pre-approval, the output is the same as the input
      value,
      coin: tokenName,
    });
  }

  private decodeInputsAndOutputsForSendToken(decodedTx: DecodedTx) {
    const txMethod = decodedTx.method.args as AddAndAffirmWithMediatorsArgs;
    const fromDID = txMethod.legs[0].fungible.sender.did;
    const toDID = txMethod.legs[0].fungible.receiver.did;
    const amount = txMethod.legs[0].fungible.amount.toString();
    const assetId = txMethod.legs[0].fungible.assetId;
    const tokenName = this.getTokenNameByAssetId(assetId);

    this._inputs.push({
      address: fromDID,
      value: amount,
      coin: tokenName,
    });

    this._outputs.push({
      address: toDID,
      value: amount,
      coin: tokenName,
    });
  }

  private decodeInputsAndOutputsForRejectInstruction(decodedTx: DecodedTx) {
    const txMethod = decodedTx.method.args as RejectInstructionBuilderArgs;
    const portfolioDID = txMethod.portfolio.did;
    const value = '0'; // Reject instruction does not transfer any value

    this._inputs.push({
      address: portfolioDID,
      value,
      coin: this._coinConfig.name,
    });

    this._outputs.push({
      address: portfolioDID,
      value,
      coin: this._coinConfig.name,
    });
  }
}
