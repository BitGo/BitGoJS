import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { Address, Credential, pvmSerial, TransferOutput, UnsignedTx, utils as AvaxUtils } from '@bitgo/avalanchejs';
import { Buffer as BufferAvax } from 'avalanche';
import { Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { Tx as PVMTx } from 'avalanche/dist/apis/platformvm';
import { DeprecatedTransactionBuilder } from './deprecatedTransactionBuilder';
import { ExportInCTxBuilder } from './exportInCTxBuilder';
import { ExportTxBuilder } from './exportTxBuilder';
import { ImportInCTxBuilder } from './importInCTxBuilder';
import { ImportTxBuilder } from './importTxBuilder';
import { PermissionlessValidatorTxBuilder } from './permissionlessValidatorTxBuilder';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';
import { ValidatorTxBuilder } from './validatorTxBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder | DeprecatedTransactionBuilder {
    utils.validateRawTransaction(raw);
    let txSource: 'EVM' | 'PVM' = 'PVM';
    let transactionBuilder: TransactionBuilder | DeprecatedTransactionBuilder | undefined = undefined;
    let tx: PVMTx | EVMTx | UnsignedTx;
    const rawNoHex = utils.removeHexPrefix(raw);
    try {
      tx = new PVMTx();
      // could throw an error if a txType doesn't match.
      tx.fromBuffer(BufferAvax.from(rawNoHex, 'hex'));

      if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).blockchainID)) {
        throw new Error('It is not a transaction of this platformvm old flow');
      }
    } catch (e) {
      try {
        // TODO(CR-1073): How do we create other EVM Tx types here, may be unpack from rawTx
        txSource = 'EVM';
        tx = new EVMTx();
        tx.fromBuffer(BufferAvax.from(rawNoHex, 'hex'));

        if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).cChainBlockchainID)) {
          throw new Error('It is not a transaction of this network or C chain EVM');
        }
      } catch (e) {
        try {
          txSource = 'PVM';
          // this should be the last because other PVM functions are still being detected in the new SDK
          const manager = AvaxUtils.getManagerForVM('PVM');
          const [codec, txBytes] = manager.getCodecFromBuffer(AvaxUtils.hexToBuffer(raw));
          const unpackedTx = codec.UnpackPrefix<pvmSerial.AddPermissionlessValidatorTx>(txBytes); // todo check if unpackPrefix works with SignedTx
          // A signed transaction includes 4 bytes for the number of credentials as an Int type that is not known by the codec
          // We can skip those 4 bytes because we know number of credentials is 2
          // @see https://docs.avax.network/reference/avalanchego/p-chain/txn-format#signed-transaction-example
          const credentialBytes = unpackedTx[1].slice(4);
          const [credential1, credential2Bytes] = codec.UnpackPrefix<Credential>(credentialBytes);
          console.log('credential1', JSON.stringify(credential1.getSignatures()));
          // const [credential2,rest2] = Credential.fromBytes(credentials[1], codec);
          const [credential2, rest] = codec.UnpackPrefix<Credential>(credential2Bytes);
          console.log('credential2', JSON.stringify(credential2.getSignatures()));
          if (rest.length > 0) {
            throw new Error('AddPermissionlessValidator tx has more than 2 credentials');
          }

          const unpacked = codec.UnpackPrefix<pvmSerial.AddPermissionlessValidatorTx>(txBytes);
          const permissionlessValidatorTx = unpacked[0] as pvmSerial.AddPermissionlessValidatorTx;
          const outputs = permissionlessValidatorTx.baseTx.outputs;
          const output = outputs[0].output as TransferOutput;
          if (outputs[0].getAssetId() !== (this._coinConfig.network as AvalancheNetwork).avaxAssetID) {
            throw new Error('The Asset ID of the output does not match the transaction');
          }
          const fromAddresses = output.outputOwners.addrs.map((a) => AvaxUtils.hexToBuffer(a.toHex()));
          const addressMaps = [
            new AvaxUtils.AddressMap([[new Address(fromAddresses[2]), 0]]),
            new AvaxUtils.AddressMap([[new Address(fromAddresses[0]), 0]]),
            new AvaxUtils.AddressMap([[new Address(fromAddresses[1]), 0]]),
          ];
          // const addressMaps = fromAddresses.map((address) => new AvaxUtils.AddressMap([[new Address(address), 0]]));
          tx = new UnsignedTx(unpacked[0], [], new AvaxUtils.AddressMaps(addressMaps), [credential1, credential2]);
        } catch (e) {
          // TODO(CR-1073): remove log
          console.log('failed all attempts to parse tx');
          throw e;
        }
      }
    }

    if (txSource === 'PVM') {
      // if (PermissionlessValidatorTxBuilder.verifyTxType((tx as UnsignedTx).tx?._type)) {
      if ((tx as UnsignedTx)?.tx?._type && PermissionlessValidatorTxBuilder.verifyTxType((tx as UnsignedTx).tx._type)) {
        transactionBuilder = this.getPermissionlessValidatorTxBuilder().initBuilder(tx);
      } else if (ValidatorTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getValidatorBuilder().initBuilder(tx as PVMTx);
      } else if (ExportTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportBuilder().initBuilder(tx as PVMTx);
      } else if (ImportTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportBuilder().initBuilder(tx as PVMTx);
      }
    } else if (txSource === 'EVM') {
      if (ImportInCTxBuilder.verifyTxType((tx as EVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportInCBuilder().initBuilder(tx as EVMTx);
      } else if (ExportInCTxBuilder.verifyTxType((tx as EVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportInCBuilder().initBuilder(tx as EVMTx);
      }
    }
    if (transactionBuilder === undefined) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    return transactionBuilder;
  }

  // TODO(CR-1073): export codec from avalanchejs if needed
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  // getCodec() {
  //   return new Codec([undefined, undefined, Int, undefined, undefined]);
  // }

  /** @inheritdoc */
  getTransferBuilder(): DeprecatedTransactionBuilder {
    throw new NotSupported('Transfer is not supported in P Chain');
  }

  /**
   * Initialize Validator builder
   *
   * @returns {ValidatorTxBuilder} the builder initialized
   */
  getValidatorBuilder(): ValidatorTxBuilder {
    return new ValidatorTxBuilder(this._coinConfig);
  }

  /**
   * Initialize Permissionless Validator builder
   *
   * @returns {PermissionlessValidatorTxBuilder} the builder initialized
   */
  getPermissionlessValidatorTxBuilder(): PermissionlessValidatorTxBuilder {
    return new PermissionlessValidatorTxBuilder(this._coinConfig);
  }

  /**
   * Export Cross chain transfer
   *
   * @returns {ExportTxBuilder} the builder initialized
   */
  getExportBuilder(): ExportTxBuilder {
    return new ExportTxBuilder(this._coinConfig);
  }

  /**
   * Import Cross chain transfer
   *
   * @returns {ImportTxBuilder} the builder initialized
   */
  getImportBuilder(): ImportTxBuilder {
    return new ImportTxBuilder(this._coinConfig);
  }

  /**
   * Import in C chain Cross chain transfer
   *
   * @returns {ImportInCTxBuilder} the builder initialized
   */
  getImportInCBuilder(): ImportInCTxBuilder {
    return new ImportInCTxBuilder(this._coinConfig);
  }

  /**
   * Export in C chain Cross chain transfer
   *
   * @returns {ExportInCTxBuilder} the builder initialized
   */
  getExportInCBuilder(): ExportInCTxBuilder {
    return new ExportInCTxBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): DeprecatedTransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
