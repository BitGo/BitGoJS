import { BuildTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StarknetCall, StarknetTransactionType, UdcDeployParams } from './iface';
import { OZ_ETH_ACCOUNT_CLASS_HASH, UDC_ADDRESS, UDC_DEPLOY_ENTRYPOINT } from './constants';
import utils from './utils';

/**
 * INVOKE to UDC `deployContract` from a master wallet.
 * Always uses unique=0 so the address matches `computeStarknetAddress` (deployer=0).
 * `fromPublicKey` sets the *target* only — call `sender` with the master address separately.
 */
export class UdcDeployBuilder extends TransactionBuilder {
  protected _classHash: string = OZ_ETH_ACCOUNT_CLASS_HASH;
  protected _salt?: string;
  protected _constructorCalldata?: string[];
  protected _targetAddress?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): StarknetTransactionType {
    return StarknetTransactionType.INVOKE;
  }

  /** Sets deploy params and derives the counterfactual target address. */
  public deployParams(params: UdcDeployParams): this {
    if (!params.classHash || !utils.isValidAddress(params.classHash)) {
      throw new BuildTransactionError('Invalid class hash, got: ' + params.classHash);
    }
    if (!params.salt || !utils.isValidAddress(params.salt)) {
      throw new BuildTransactionError('Invalid salt, got: ' + params.salt);
    }
    if (!params.constructorCalldata || params.constructorCalldata.length === 0) {
      throw new BuildTransactionError('Constructor calldata is required');
    }
    for (const felt of params.constructorCalldata) {
      // Limbs may be 0x0 (e.g. pubkey x/y halves); only require 0x-hex form.
      if (!felt || !/^0x[0-9a-fA-F]+$/i.test(felt)) {
        throw new BuildTransactionError('Invalid constructor calldata felt, got: ' + felt);
      }
    }

    this._classHash = params.classHash;
    this._salt = params.salt;
    this._constructorCalldata = params.constructorCalldata;
    this._targetAddress = utils.calculateContractAddressFromHash(
      params.salt,
      params.classHash,
      params.constructorCalldata,
      0
    );
    return this;
  }

  /** Derive deploy params from the target user's pubkey. Does not set sender. */
  public fromPublicKey(pubKey: string): this {
    if (!utils.isValidPublicKey(pubKey)) {
      throw new BuildTransactionError('Invalid pubKey, got: ' + pubKey);
    }
    const fullPublicKey = utils.getUncompressedPublicKey(pubKey);
    const { address, constructorCalldata, salt } = utils.computeStarknetAddress(fullPublicKey);
    this.deployParams({
      classHash: OZ_ETH_ACCOUNT_CLASS_HASH,
      salt,
      constructorCalldata,
    });
    this._targetAddress = address;
    return this;
  }

  public getTargetAddress(): string | undefined {
    return this._targetAddress;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    if (this._calls.length === 0) {
      return;
    }
    const call = this._calls[0];
    if (!utils.isUdcDeployCall(call)) {
      return;
    }
    const parsed = utils.parseUdcDeployCall(call);
    if (!parsed) {
      throw new BuildTransactionError('Invalid UDC deploy calldata');
    }
    if (parsed.unique) {
      throw new BuildTransactionError('UDC deploy with unique=true is not supported; BitGo requires unique=false');
    }
    this.deployParams({
      classHash: parsed.classHash,
      salt: parsed.salt,
      constructorCalldata: parsed.constructorCalldata,
    });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.validateUdcDeploy();

    const udcCall: StarknetCall = {
      contractAddress: UDC_ADDRESS,
      entrypoint: UDC_DEPLOY_ENTRYPOINT,
      calldata: this.compileUdcDeployCalldata(
        this._classHash,
        this._salt as string,
        this._constructorCalldata as string[]
      ),
    };

    this._calls = [udcCall];

    return super.buildImplementation();
  }

  /** Calldata: [classHash, salt, unique=0, ctor_len, ...ctorCalldata] */
  private compileUdcDeployCalldata(classHash: string, salt: string, constructorCalldata: string[]): string[] {
    return [classHash, salt, '0x0', '0x' + BigInt(constructorCalldata.length).toString(16), ...constructorCalldata];
  }

  private validateUdcDeploy(): void {
    if (!this._sender) {
      throw new BuildTransactionError('Sender is required');
    }
    if (!utils.isValidAddress(this._sender)) {
      throw new BuildTransactionError(`Invalid sender address: ${this._sender}`);
    }
    if (!this._salt || !this._constructorCalldata || this._constructorCalldata.length === 0) {
      throw new BuildTransactionError(
        'UDC deploy requires fromPublicKey() or deployParams({ classHash, salt, constructorCalldata })'
      );
    }
  }
}
