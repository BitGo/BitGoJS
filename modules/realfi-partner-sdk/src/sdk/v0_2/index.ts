import {
  addressFromCredential,
  addressFromValidator,
  AssetId,
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
import {
  BaseTypes,
  V0_1Types,
  V0_2Types,
} from "../../generated-types/index.js";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
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
export interface IRealfiSDKParamsV0_2 {
  version: "V0_2";
  proxyBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  assetNameHex: string;
  /**
   * The treasury bootstrap UTxO reference. The treasury script and NFT asset ID
   * are derived from this reference and the stablecoin policy ID.
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
 * V0_2 SDK implementation.
 *
 * Extends V0_1 with deposit and withdraw operations for treasury management.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
export class RealfiSDKV0_2<P extends Provider, W extends Wallet>
  extends RealfiSDKBase<P, W>
  implements IRealfiSDKWithTreasury
{
  readonly version = "V0_2" as const;

  // Script hashes and policy IDs
  readonly stablecoinPolicyId: Core.PolicyId;
  readonly oneShotPolicyId: Core.PolicyId;
  readonly protocolScriptHash: Core.Hash28ByteBase16;
  readonly treasuryScriptHash: Core.Hash28ByteBase16;
  readonly treasuryNFTAssetId: Core.AssetId;
  readonly treasuryAddress: Core.Address;

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

    // Derive treasury NFT asset ID from treasury script hash
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    this.treasuryNFTAssetId = Core.AssetId(
      this.treasuryScriptHash + treasuryAssetName.toString(),
    );
    this.treasuryAddress = addressFromValidator(
      this.network,
      this.treasuryScript,
    );
  }

  /**
   * Create a V0_2 SDK instance.
   */
  static create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV0_2,
  ): RealfiSDKV0_2<P, W> {
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
    // Instantiate protocol script (V0_2 uses V0_2ProtocolProtocolWithdraw)
    const protocolScript = new V0_2Types.V0_2ProtocolProtocolWithdraw(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    // Instantiate mint proxy script (parameterized by one-shot policy ID)
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(
      oneShotPolicyId,
      enableTrace,
    ).Script;
    // Instantiate treasury script from treasury bootstrap
    const treasuryScript = new V0_1Types.V0_1TreasuryTreasurySpend(
      {
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex,
      },
      oneShotPolicyId,
      enableTrace,
    ).Script;

    return new RealfiSDKV0_2(
      blaze,
      {
        version: "V0_2",
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
   * The treasury bootstrap UTxO must be provided to consume it.
   */
  async mintTreasuryNFT(
    treasuryBootstrapUtxo: Core.TransactionUnspentOutput,
    initialDatum: V0_1TreasuryDatum = { circulating_supply: 0n },
  ): Promise<{ tx: TxBuilder; nftAssetId: Core.AssetId }> {
    const treasuryPolicyId = Core.PolicyId(this.treasuryScriptHash);
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    const treasuryAddress = addressFromValidator(
      this.network,
      this.treasuryScript,
    );

    const datum = Data.serialize(V0_1TreasuryDatum, initialDatum);
    const tx = await this.blaze
      .newTransaction()
      .addInput(treasuryBootstrapUtxo)
      .addMint(
        treasuryPolicyId,
        new Map([[treasuryAssetName, 1n]]),
        Data.Void(),
      )
      .lockAssets(
        treasuryAddress,
        makeValue(10000000n, [this.treasuryNFTAssetId, 1n]),
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
      V0_1TreasuryDatum,
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
   * V0_2 uses V0_2Types.ProxyDatum which includes withdraw/deposit permissions.
   */
  async mintOneShot(
    receiverAddress: Core.Address,
    datum: V0_2Types.ProxyDatum,
  ): Promise<{ tx: TxBuilder; policyId: Core.PolicyId }> {
    const utxo = await this.resolveBootstrapUtxo();
    const serializedDatum = Data.serialize(V0_2Types.ProxyDatum, {
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
      makeValue(10000000n, [this.oneShotPolicyId, 1n]),
      serializedDatum,
    ).provideScript(this.oneShotScript);
    return { tx, policyId: this.oneShotPolicyId };
  }

  /**
   * Update the one-shot datum.
   */
  async updateOneShotDatum(
    receiverAddress: Core.Address,
    newDatum: V0_2Types.ProxyDatum,
  ): Promise<TxBuilder> {
    const oneshotUtxo = await this.blaze.provider.getUnspentOutputByNFT(
      Core.AssetId(this.oneShotPolicyId),
    );
    if (!oneshotUtxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }

    const serializedDatum = Data.serialize(V0_2Types.ProxyDatum, {
      logic: newDatum.logic,
      settings: newDatum.settings,
    });

    return lockOrPayAssets(
      this.blaze.newTransaction().addInput(oneshotUtxo),
      receiverAddress,
      makeValue(10000000n, [this.oneShotPolicyId, 1n]),
      serializedDatum,
    );
  }

  /**
   * Get the proxy datum from the one-shot token UTXO.
   * V0_2 returns V0_2Types.ProxyDatum which includes withdraw/deposit permissions.
   * Result is cached after first fetch.
   */
  async getParsedProxyDatum(): Promise<
    IProxyDatumResult<V0_2Types.ProxyDatum>
  > {
    if (this.cachedProxyDatumResult) {
      return this
        .cachedProxyDatumResult as IProxyDatumResult<V0_2Types.ProxyDatum>;
    }

    const { proxyUtxo, proxyDatum } = await this.getRawProxyDatum();
    const parsedProxyDatum = parse(V0_2Types.ProxyDatum, proxyDatum);
    const result = { proxyUtxo, proxyDatum, parsedProxyDatum };

    this.cachedProxyDatumResult = result;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Minting Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a mint (positive amount) or burn (negative amount) transaction.
   * V0_2 minting uses V0_2Types.ProtocolRedeemer.
   */
  async buildMintTx(assetAmount: AssetAmount): Promise<TxBuilder> {
    const isBurn = assetAmount.amount < 0n;
    const rewardAccount = this.getProtocolRewardAccount();
    const conversionRatio = 1; // V0_2 uses 1:1 conversion ratio (no decimals taken into account, etc.)

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
    const reserveTokenAmount = BigInt(conversionRatio) * assetAmount.amount;
    const treasuryAddress = addressFromCredential(
      this.network,
      credentialFromScriptHash(treasuryScriptHash),
    );

    const redeemer = isBurn
      ? Data.serialize(V0_2Types.ProtocolRedeemer, "Burn")
      : Data.serialize(V0_2Types.ProtocolRedeemer, "Mint");

    const assetName = Core.AssetName(this.assetNameHex);
    const initialTreasuryValue = treasuryUtxo!.output().amount();
    const valueToAdd = makeValue(0n, [reserveToken, reserveTokenAmount]);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // V0_2-specific Operations: Deposit and Withdraw
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a deposit transaction to add reserve to the treasury.
   */
  async buildDepositTx(assetAmount: AssetAmount): Promise<TxBuilder> {
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash(),
      treasury: this.treasuryScriptHash,
    });

    const { proxyUtxo, parsedProxyDatum } = await this.getParsedProxyDatum();
    const { treasuryUtxo, treasuryDatum } = await this.getTreasuryDatum();

    const redeemer = Data.serialize(V0_2Types.ProtocolRedeemer, {
      Deposit: {
        deposit_amount: assetAmount.amount,
      },
    });

    const rewardAccount = this.getProtocolRewardAccount();
    const requiredSigners = getSignatureKeyHashesFromMultisigScript(
      parsedProxyDatum.settings.deposit_permission,
    ).map((key) => Core.Ed25519KeyHashHex(key));

    const reserveToken = AssetId(
      assetAmount.id ?? parsedProxyDatum.settings.reserve_token.join(""),
    );
    const treasuryAddress = addressFromCredential(
      this.network,
      credentialFromScriptHash(
        Hash28ByteBase16(parsedProxyDatum.settings.registry.treasury),
      ),
    );

    const inititalTreasuryValue = treasuryUtxo.output().amount();
    const depositValue = makeValue(0n, [reserveToken, assetAmount.amount]);
    const newTreasuryValue = Value.merge(inititalTreasuryValue, depositValue);

    const tx = this.blaze
      .newTransaction()
      .addWithdrawal(rewardAccount, 0n, redeemer)
      .addReferenceInput(proxyUtxo)
      .addReferenceInput(refInputs.protocol!)
      .addReferenceInput(refInputs.proxy!)
      .addReferenceInput(refInputs.treasury!)
      .addInput(treasuryUtxo!, Data.Void())
      .lockAssets(treasuryAddress, newTreasuryValue, treasuryDatum);

    for (const signer of requiredSigners) {
      tx.addRequiredSigner(signer);
    }

    return tx;
  }

  /**
   * Build a withdraw transaction to remove reserve from the treasury.
   * @param amount Amount to withdraw from treasury
   * @param receiverAddress Address to send withdrawn assets to; defaults to wallet address
   */
  async buildWithdrawTx(
    assetAmount: AssetAmount,
    receiverAddress?: string,
  ): Promise<TxBuilder> {
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash(),
      treasury: this.treasuryScriptHash,
    });

    const receiver = receiverAddress
      ? Core.Address.fromBech32(receiverAddress)
      : await this.blaze.wallet.getChangeAddress();

    const { proxyUtxo, parsedProxyDatum } = await this.getParsedProxyDatum();
    const { treasuryUtxo, treasuryDatum } = await this.getTreasuryDatum();

    const redeemer = Data.serialize(V0_2Types.ProtocolRedeemer, {
      Withdraw: {
        withdraw_amount: assetAmount.amount,
      },
    });

    const rewardAccount = this.getProtocolRewardAccount();
    const requiredSigners = getSignatureKeyHashesFromMultisigScript(
      parsedProxyDatum.settings.withdraw_permission,
    ).map((key) => Core.Ed25519KeyHashHex(key));

    const reserveToken = AssetId(
      assetAmount.id ?? parsedProxyDatum.settings.reserve_token.join(""),
    );
    const treasuryAddress = addressFromCredential(
      this.network,
      credentialFromScriptHash(
        Hash28ByteBase16(parsedProxyDatum.settings.registry.treasury),
      ),
    );

    const inititalTreasuryValue = treasuryUtxo.output().amount();
    const withdrawValue = makeValue(0n, [reserveToken, -assetAmount.amount]);
    const newTreasuryValue = Value.merge(inititalTreasuryValue, withdrawValue);

    const tx = this.blaze
      .newTransaction()
      .addWithdrawal(rewardAccount, 0n, redeemer)
      .addReferenceInput(proxyUtxo)
      .addReferenceInput(refInputs.protocol!)
      .addReferenceInput(refInputs.proxy!)
      .addReferenceInput(refInputs.treasury!)
      .addInput(treasuryUtxo!, Data.Void());
    addDirectOutput(
      tx,
      receiver,
      makeValue(0n, [reserveToken, assetAmount.amount]),
    );
    tx.lockAssets(treasuryAddress, newTreasuryValue, treasuryDatum);

    for (const signer of requiredSigners) {
      tx.addRequiredSigner(signer);
    }

    return tx;
  }
}
