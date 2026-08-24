import * as Data from "@blaze-cardano/data";
import { parse, Void } from "@blaze-cardano/data";
import type { Provider } from "@blaze-cardano/query";
import {
  type Blaze,
  Core,
  makeValue,
  TxBuilder,
  type Wallet,
} from "@blaze-cardano/sdk";
import { AssetAmount } from "@sundaeswap/asset";

import { BaseTypes, V0Types } from "../../generated-types/index.js";
import {
  type IBaseSDKParams,
  type ICachedReferenceInputs,
  type IProxyDatumResult,
  lockOrPayAssets,
  RealfiSDKBase,
} from "../shared/index.js";

/**
 * V0 datum type - simple datum with logic hash and no settings
 */
export const AdminDatum = Data.Type.Object(
  {
    logic: Data.Type.String(),
    settings: Data.Type.Void(),
  },
  { ctor: 0n },
);

export type TAdminDatumType = {
  logic: string;
  settings: void;
};

export interface IRealfiSDKParamsV0 {
  version: "V0";
  proxyBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  assetNameHex: string;
  /** Enable trace output in Plutus scripts for debugging. Default: false */
  enableTrace?: boolean;
  /**
   * Address to deploy reference scripts to (and resolve them from). When
   * omitted, Blaze's burn address is used for both deploy and resolve.
   */
  scriptDeploymentAddress?: Core.Address;
  referenceInputs?: {
    protocolRefInput?: Core.TransactionUnspentOutput;
    proxyRefInput?: Core.TransactionUnspentOutput;
  };
}

/**
 * V0 SDK implementation.
 *
 * Simple minting without treasury management.
 * All operations (oneshot, protocol, mint proxy) are consolidated here.
 */
export class RealfiSDKV0<
  P extends Provider,
  W extends Wallet,
> extends RealfiSDKBase<P, W> {
  readonly version = "V0" as const;

  // Script hashes and policy IDs
  readonly stablecoinPolicyId: Core.PolicyId;
  readonly oneShotPolicyId: Core.PolicyId;
  readonly protocolScriptHash: Core.Hash28ByteBase16;

  // Scripts
  protected readonly oneShotScript: Core.Script;
  protected readonly protocolScript: Core.Script;
  protected readonly mintProxyScript: Core.Script;

  private constructor(
    blaze: Blaze<P, W>,
    params: IBaseSDKParams,
    scripts: {
      oneShotScript: Core.Script;
      protocolScript: Core.Script;
      mintProxyScript: Core.Script;
    },
    cachedReferenceInputs?: ICachedReferenceInputs,
  ) {
    super(blaze, params, cachedReferenceInputs);

    this.oneShotScript = scripts.oneShotScript;
    this.protocolScript = scripts.protocolScript;
    this.mintProxyScript = scripts.mintProxyScript;

    this.oneShotPolicyId = Core.PolicyId(this.oneShotScript.hash());
    this.protocolScriptHash = this.protocolScript.hash();
    this.stablecoinPolicyId = Core.PolicyId(this.mintProxyScript.hash());
  }

  /**
   * Create a V0 SDK instance.
   */
  static create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV0,
  ): RealfiSDKV0<P, W> {
    const enableTrace = params.enableTrace ?? false;

    // Instantiate one-shot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint(
      {
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex,
      },
      enableTrace,
    ).Script;

    // Instantiate protocol script (V0 uses no parameters)
    const protocolScript = new V0Types.V0ProtocolProtocolWithdraw(enableTrace)
      .Script;

    // Instantiate mint proxy script (parameterized by one-shot policy ID)
    const oneShotPolicyId = oneShotScript.hash();
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    return new RealfiSDKV0(
      blaze,
      {
        version: "V0",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
      },
      {
        oneShotScript,
        protocolScript,
        mintProxyScript,
      },
      {
        protocolRefInput: params.referenceInputs?.protocolRefInput,
        proxyRefInput: params.referenceInputs?.proxyRefInput,
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // One-Shot Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the one-shot NFT with the initial datum.
   * This consumes the bootstrap UTXO and can only be done once.
   */
  async mintOneShot(
    receiverAddress: Core.Address,
    datum: TAdminDatumType,
  ): Promise<{ tx: TxBuilder; policyId: Core.PolicyId }> {
    const utxo = await this.resolveBootstrapUtxo();
    const serializedDatum = Data.serialize(AdminDatum, {
      logic: datum.logic,
      settings: datum.settings,
    });

    const baseTx = this.blaze
      .newTransaction()
      .addInput(utxo)
      .addMint(
        this.oneShotPolicyId,
        new Map([[Core.AssetName(""), 1n]]),
        Data.Void(),
      );
    const tx = lockOrPayAssets(
      baseTx,
      receiverAddress,
      makeValue(1000000n, [this.oneShotPolicyId, 1n]),
      serializedDatum,
    ).provideScript(this.oneShotScript);

    return { tx, policyId: this.oneShotPolicyId };
  }

  /**
   * Update the one-shot datum.
   * This spends the one-shot UTXO and sends it back to the receiver with new datum.
   */
  async updateOneShotDatum(
    receiverAddress: Core.Address,
    newDatum: TAdminDatumType,
  ): Promise<TxBuilder> {
    const oneshotUtxo = await this.blaze.provider.getUnspentOutputByNFT(
      Core.AssetId(this.oneShotPolicyId),
    );
    if (!oneshotUtxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }

    const serializedDatum = Data.serialize(AdminDatum, {
      logic: newDatum.logic,
      settings: newDatum.settings,
    });

    return lockOrPayAssets(
      this.blaze.newTransaction().addInput(oneshotUtxo),
      receiverAddress,
      makeValue(1000000n, [this.oneShotPolicyId, 1n]),
      serializedDatum,
    );
  }

  /**
   * Get the proxy datum from the one-shot token UTXO.
   * Result is cached after first fetch.
   */
  async getParsedProxyDatum(): Promise<IProxyDatumResult<TAdminDatumType>> {
    if (this.cachedProxyDatumResult) {
      return this.cachedProxyDatumResult as IProxyDatumResult<TAdminDatumType>;
    }

    const { proxyUtxo, proxyDatum } = await this.getRawProxyDatum();
    const parsedProxyDatum = parse(AdminDatum, proxyDatum);
    const result = { proxyUtxo, proxyDatum, parsedProxyDatum };

    this.cachedProxyDatumResult = result;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Minting Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a mint (positive amount) or burn (negative amount) transaction.
   * V0 minting is simple - no treasury involvement.
   */
  async buildMintTx(amount: AssetAmount): Promise<TxBuilder> {
    const rewardAccount = this.getProtocolRewardAccount();

    const utxo = await this.blaze.provider.getUnspentOutputByNFT(
      Core.AssetId(this.oneShotPolicyId),
    );
    if (!utxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }

    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash(),
    });

    const tx = this.blaze
      .newTransaction()
      .addReferenceInput(utxo)
      .addWithdrawal(rewardAccount, 0n, Void())
      .addReferenceInput(refInputs.protocol!)
      .addReferenceInput(refInputs.proxy!)
      .addMint(
        this.stablecoinPolicyId,
        new Map([[Core.AssetName(this.assetNameHex), amount.amount]]),
        Void(),
      );

    return tx;
  }
}
