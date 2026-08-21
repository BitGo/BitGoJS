import {
  addressFromCredential,
  addressFromValidator,
  Hash28ByteBase16,
  toHex,
} from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import { parse, Void } from "@blaze-cardano/data";
import type { Provider } from "@blaze-cardano/query";
import {
  type Blaze,
  Core,
  makeValue,
  TxBuilder,
  Value,
  type Wallet,
} from "@blaze-cardano/sdk";

import { AssetAmount } from "@sundaeswap/asset";
import { BaseTypes, V0_1Types } from "../../generated-types/index.js";
import type { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import {
  addDirectOutput,
  credentialFromScriptHash,
  deployScript,
  getDatumFromNFT,
  getSignatureKeyHashesFromMultisigScript,
  type IBaseSDKParams,
  type ICachedReferenceInputs,
  type IProxyDatumResult,
  type IRealfiSDKWithTreasury,
  type ITreasuryDatumResult,
  lockOrPayAssets,
  RealfiSDKBase,
} from "../shared/index.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiSDKParamsV0_1 {
  version: "V0_1";
  proxyBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  assetNameHex: string;
  /**
   * The bootstrap UTXO reference for treasury script parameterization.
   * Treasury script and NFT are derived from this.
   */
  treasuryBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
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
    treasuryRefInput?: Core.TransactionUnspentOutput;
  };
}

/**
 * V0_1 SDK implementation.
 *
 * Includes treasury management, reserve backing, and circulating supply tracking.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
export class RealfiSDKV0_1<P extends Provider, W extends Wallet>
  extends RealfiSDKBase<P, W>
  implements IRealfiSDKWithTreasury
{
  readonly version = "V0_1" as const;

  // Script hashes and policy IDs
  readonly stablecoinPolicyId: Core.PolicyId;
  readonly oneShotPolicyId: Core.PolicyId;
  readonly protocolScriptHash: Core.Hash28ByteBase16;
  readonly treasuryScriptHash: Core.Hash28ByteBase16;
  readonly treasuryNFTAssetId: Core.AssetId;

  // Scripts
  protected readonly oneShotScript: Core.Script;
  protected readonly protocolScript: Core.Script;
  protected readonly mintProxyScript: Core.Script;
  protected readonly treasuryScript: Core.Script;

  private constructor(
    blaze: Blaze<P, W>,
    params: IBaseSDKParams,
    scripts: {
      oneShotScript: Core.Script;
      protocolScript: Core.Script;
      mintProxyScript: Core.Script;
      treasuryScript: Core.Script;
    },
    treasuryNFTAssetId: Core.AssetId,
    cachedReferenceInputs?: ICachedReferenceInputs,
  ) {
    super(blaze, params, cachedReferenceInputs);

    this.oneShotScript = scripts.oneShotScript;
    this.protocolScript = scripts.protocolScript;
    this.mintProxyScript = scripts.mintProxyScript;
    this.treasuryScript = scripts.treasuryScript;

    this.oneShotPolicyId = Core.PolicyId(this.oneShotScript.hash());
    this.protocolScriptHash = this.protocolScript.hash();
    this.stablecoinPolicyId = Core.PolicyId(this.mintProxyScript.hash());
    this.treasuryScriptHash = this.treasuryScript.hash();
    this.treasuryNFTAssetId = treasuryNFTAssetId;
  }

  /**
   * Create a V0_1 SDK instance.
   */
  static create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV0_1,
  ): RealfiSDKV0_1<P, W> {
    const enableTrace = params.enableTrace ?? false;

    // Instantiate one-shot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint(
      {
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex,
      },
      enableTrace,
    ).Script;
    const oneShotPolicyId = oneShotScript.hash();

    // Instantiate protocol script (V0_1 parameterized by one-shot policy ID)
    const protocolScript = new V0_1Types.V0_1ProtocolProtocolWithdraw(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    // Instantiate mint proxy script (parameterized by one-shot policy ID)
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    // Instantiate treasury script (parameterized by UTXO ref and one-shot policy ID)
    const treasuryScript = new V0_1Types.V0_1TreasuryTreasurySpend(
      {
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex,
      },
      oneShotPolicyId,
      enableTrace,
    ).Script;

    // Derive treasury NFT asset ID from treasury script hash
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    const treasuryNFTAssetId = Core.AssetId(
      treasuryScript.hash() + treasuryAssetName.toString(),
    );

    return new RealfiSDKV0_1(
      blaze,
      {
        version: "V0_1",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
      },
      {
        oneShotScript,
        protocolScript,
        mintProxyScript,
        treasuryScript,
      },
      treasuryNFTAssetId,
      {
        protocolRefInput: params.referenceInputs?.protocolRefInput,
        proxyRefInput: params.referenceInputs?.proxyRefInput,
        treasuryRefInput: params.referenceInputs?.treasuryRefInput,
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Treasury Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the treasury NFT.
   * This creates a new treasury with an initial datum.
   * Uses the treasury bootstrap UTXO that was provided when creating the SDK.
   */
  async mintTreasuryNFT(
    treasuryBootstrapUtxo: Core.TransactionUnspentOutput,
    initialDatum: V0_1TreasuryDatum = { circulating_supply: 0n },
  ): Promise<{ tx: TxBuilder; nftAssetId: Core.AssetId }> {
    const treasuryPolicyId = Core.PolicyId(this.treasuryScript.hash());
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    const treasuryAddress = addressFromValidator(
      this.network,
      this.treasuryScript,
    );

    const datum = Data.serialize(V0_1Types.TreasuryDatum, initialDatum);
    const tx = this.blaze
      .newTransaction()
      .addInput(treasuryBootstrapUtxo)
      .addMint(
        treasuryPolicyId,
        new Map([[treasuryAssetName, 1n]]),
        Data.Void(),
      )
      .lockAssets(
        treasuryAddress,
        makeValue(1000000n, [this.treasuryNFTAssetId, 1n]),
        datum,
      )
      .provideScript(this.treasuryScript);

    return { tx, nftAssetId: this.treasuryNFTAssetId };
  }

  /**
   * Deploy the treasury script as a reference script.
   */
  async deployTreasury(): Promise<TxBuilder> {
    return deployScript(
      this.blaze,
      this.treasuryScript,
      this.scriptDeploymentAddress,
    );
  }

  /**
   * Get the treasury datum.
   */
  async getTreasuryDatum(): Promise<ITreasuryDatumResult<V0_1TreasuryDatum>> {
    const {
      utxo: treasuryUtxo,
      datum: treasuryDatum,
      parsedDatum: parsedTreasuryDatum,
    } = await getDatumFromNFT(
      this.blaze,
      this.treasuryNFTAssetId,
      V0_1Types.TreasuryDatum,
    );

    if (!treasuryUtxo) {
      throw new Error("No UTXO found with the treasury NFT");
    }
    if (!treasuryDatum) {
      throw new Error("No treasury datum found");
    }

    return {
      treasuryUtxo,
      treasuryDatum,
      parsedTreasuryDatum: parsedTreasuryDatum as V0_1TreasuryDatum,
    };
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
    datum: V0_1Types.ProxyDatum,
  ): Promise<{ tx: TxBuilder; policyId: Core.PolicyId }> {
    const utxo = await this.resolveBootstrapUtxo();
    const serializedDatum = Data.serialize(V0_1Types.ProxyDatum, {
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
    newDatum: V0_1Types.ProxyDatum,
  ): Promise<TxBuilder> {
    const oneshotUtxo = await this.blaze.provider.getUnspentOutputByNFT(
      Core.AssetId(this.oneShotPolicyId),
    );
    if (!oneshotUtxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }

    const serializedDatum = Data.serialize(V0_1Types.ProxyDatum, {
      logic: newDatum.logic,
      settings: newDatum.settings,
    });

    const tx = lockOrPayAssets(
      this.blaze.newTransaction().addInput(oneshotUtxo),
      receiverAddress,
      makeValue(1000000n, [this.oneShotPolicyId, 1n]),
      serializedDatum,
    );

    return tx;
  }

  /**
   * Get the proxy datum from the one-shot token UTXO.
   * Result is cached after first fetch.
   */
  async getParsedProxyDatum(): Promise<
    IProxyDatumResult<V0_1Types.ProxyDatum>
  > {
    if (this.cachedProxyDatumResult) {
      return this
        .cachedProxyDatumResult as IProxyDatumResult<V0_1Types.ProxyDatum>;
    }

    const { proxyUtxo, proxyDatum } = await this.getRawProxyDatum();
    const parsedProxyDatum = parse(V0_1Types.ProxyDatum, proxyDatum);
    const result = { proxyUtxo, proxyDatum, parsedProxyDatum };

    this.cachedProxyDatumResult = result;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Minting Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a mint (positive amount) or burn (negative amount) transaction.
   * V0_1 minting includes treasury update for circulating supply tracking.
   */
  async buildMintTx(assetAmount: AssetAmount): Promise<TxBuilder> {
    const isBurn = assetAmount.amount < 0n;
    const rewardAccount = this.getProtocolRewardAccount();

    const { proxyUtxo, parsedProxyDatum } = await this.getParsedProxyDatum();

    const treasuryScriptHash = Hash28ByteBase16(
      parsedProxyDatum.settings.registry.treasury,
    );

    // Get all reference inputs in one call (cached after first fetch)
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash(),
      treasury: treasuryScriptHash,
    });

    const { utxo: treasuryUtxo, parsedDatum: parsedTreasuryDatum } =
      await getDatumFromNFT(
        this.blaze,
        this.treasuryNFTAssetId,
        V0_1Types.TreasuryDatum,
      );

    const circulatingSupply = (parsedTreasuryDatum as V0_1TreasuryDatum)
      .circulating_supply;
    const newCirculatingSupply = circulatingSupply + assetAmount.amount;

    const newTreasuryDatum = Data.serialize(V0_1Types.TreasuryDatum, {
      circulating_supply: newCirculatingSupply,
    });

    const reserveToken = parsedProxyDatum.settings.reserve_token.join("");
    const treasuryAddress = addressFromCredential(
      this.network,
      credentialFromScriptHash(treasuryScriptHash),
    );

    const redeemer = isBurn
      ? Data.serialize(V0_1Types.ProtocolRedeemer, "Burn")
      : Data.serialize(V0_1Types.ProtocolRedeemer, "Mint");

    const assetName = Core.AssetName(this.assetNameHex);

    const initialTreasuryValue = treasuryUtxo!.output().amount();
    const valueToAdd = makeValue(0n, [reserveToken, assetAmount.amount]);
    const updatedTreasuryValue = Value.merge(initialTreasuryValue, valueToAdd);

    const tx = this.blaze
      .newTransaction()
      .addReferenceInput(proxyUtxo!)
      .addWithdrawal(rewardAccount, 0n, redeemer)
      .addReferenceInput(refInputs.protocol!)
      .addReferenceInput(refInputs.proxy!)
      .addReferenceInput(refInputs.treasury!)
      .addInput(treasuryUtxo!, Void())
      .addMint(
        this.stablecoinPolicyId,
        new Map([[assetName, assetAmount.amount]]),
        Void(),
      )
      .lockAssets(treasuryAddress, updatedTreasuryValue, newTreasuryDatum);

    if (isBurn) {
      const requiredSigners = getSignatureKeyHashesFromMultisigScript(
        parsedProxyDatum.settings.burn_permission,
      ).map((key) => Core.Ed25519KeyHashHex(key));

      for (const signer of requiredSigners) {
        tx.addRequiredSigner(signer);
      }

      const receiverAddress = await this.blaze.wallet.getChangeAddress();
      addDirectOutput(
        tx,
        receiverAddress,
        makeValue(0n, [reserveToken, -assetAmount.amount]),
      );
    } else {
      const requiredSigners = getSignatureKeyHashesFromMultisigScript(
        parsedProxyDatum.settings.mint_permission,
      ).map((key) => Core.Ed25519KeyHashHex(key));

      for (const signer of requiredSigners) {
        tx.addRequiredSigner(signer);
      }
    }

    return tx;
  }
}
