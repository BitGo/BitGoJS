import { TransactionType, InvalidTransactionError } from '@bitgo-beta/sdk-core';
import {
  getCreateForwarderParamsAndTypes,
  calculateForwarderV1Address,
  decodeForwarderCreationData,
  getProxyInitcode,
} from '@bitgo-beta/abstract-eth';
import { BaseCoin as CoinConfig, EthereumNetwork } from '@bitgo-beta/statics';
import * as ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import { Transaction as VetTransaction, Secp256k1 } from '@vechain/sdk-core';
import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';

export class AddressInitializationTransaction extends Transaction {
  private _baseAddress: string;
  private _feeAddress: string;
  private _salt: string;
  private _initCode: string;
  private _deployedAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.AddressInitialization;
  }

  get baseAddress(): string {
    return this._baseAddress;
  }

  set baseAddress(address: string) {
    this._baseAddress = address;
  }

  get feeAddress(): string {
    return this._feeAddress;
  }

  set feeAddress(address: string) {
    this._feeAddress = address;
  }

  get salt(): string {
    return this._salt;
  }

  set salt(salt: string) {
    this._salt = salt;
  }

  get initCode(): string {
    return this._initCode;
  }

  set initCode(initCode: string) {
    this._initCode = initCode;
  }

  get deployedAddress(): string {
    return this._deployedAddress;
  }

  set deployedAddress(address: string) {
    this._deployedAddress = address;
  }

  /** @inheritdoc */
  async build(): Promise<void> {
    super.build();
    if (this._salt && this._initCode) {
      const saltBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(this._salt), 32);

      const { createForwarderParams, createForwarderTypes } = getCreateForwarderParamsAndTypes(
        this._baseAddress,
        saltBuffer,
        this._feeAddress
      );

      // Hash the wallet base address and fee address if present with the given salt, so the address directly relies on the base address and fee address
      const calculationSalt = ethUtil.bufferToHex(
        EthereumAbi.soliditySHA3(createForwarderTypes, createForwarderParams)
      );
      this.deployedAddress = calculateForwarderV1Address(this._contract, calculationSalt, this._initCode);
    }
  }

  /** @inheritdoc */
  buildClauses(): void {
    this._clauses = [
      {
        to: this._contract,
        value: '0x0',
        data: this._transactionData,
      },
    ];
  }

  /** @inheritdoc */
  toJson(): VetTransactionData {
    const json: VetTransactionData = {
      id: this.id,
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: this.expiration,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: this.dependsOn,
      nonce: this.nonce,
      data: this.transactionData,
      value: '0',
      sender: this.sender,
      to: this.contract,
      deployedAddress: this.deployedAddress,
    };
    return json;
  }

  /** @inheritdoc */
  fromDeserializedSignedTransaction(signedTx: VetTransaction): void {
    try {
      if (!signedTx || !signedTx.body) {
        throw new InvalidTransactionError('Invalid transaction: missing transaction body');
      }

      // Store the raw transaction
      this.rawTransaction = signedTx;

      // Set transaction body properties
      const body = signedTx.body;
      this.chainTag = typeof body.chainTag === 'number' ? body.chainTag : 0;
      this.blockRef = body.blockRef || '0x0';
      this.expiration = typeof body.expiration === 'number' ? body.expiration : 64;
      this.clauses = body.clauses || [];
      this.gasPriceCoef = typeof body.gasPriceCoef === 'number' ? body.gasPriceCoef : 128;
      this.gas = typeof body.gas === 'number' ? body.gas : Number(body.gas) || 0;
      this.dependsOn = body.dependsOn || null;
      this.nonce = String(body.nonce);
      // Set data from clauses
      this.contract = body.clauses[0]?.to || '0x0';
      this.transactionData = body.clauses[0]?.data || '0x0';
      this.type = TransactionType.AddressInitialization;
      const { baseAddress, addressCreationSalt, feeAddress } = decodeForwarderCreationData(this.transactionData);

      this.baseAddress = baseAddress as string;
      this.salt = addressCreationSalt as string;
      this.feeAddress = feeAddress as string;
      const forwarderImplementationAddress = (this._coinConfig.network as EthereumNetwork)
        .forwarderImplementationAddress as string;
      this.initCode = getProxyInitcode(forwarderImplementationAddress);

      // Set sender address
      if (signedTx.origin) {
        this.sender = signedTx.origin.toString().toLowerCase();
      }

      // Set signatures if present
      if (signedTx.signature) {
        // First signature is sender's signature
        this.senderSignature = Buffer.from(signedTx.signature.slice(0, Secp256k1.SIGNATURE_LENGTH));

        // If there's additional signature data, it's the fee payer's signature
        if (signedTx.signature.length > Secp256k1.SIGNATURE_LENGTH) {
          this.feePayerSignature = Buffer.from(signedTx.signature.slice(Secp256k1.SIGNATURE_LENGTH));
        }
      }
    } catch (e) {
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }
}
