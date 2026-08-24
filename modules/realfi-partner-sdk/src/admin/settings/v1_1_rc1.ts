import { addressFromValidator } from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import type { Provider } from "@blaze-cardano/query";
import {
  type Blaze,
  calculateMinAda,
  Core,
  type TxBuilder,
  type Wallet,
} from "@blaze-cardano/sdk";

import type {
  GovernanceConfig,
  SettingsV1,
} from "../../generated-types/v1_1_rc1/index.js";
import {
  credentialFromScript,
  deployScript,
  lockOrPayAssets,
  readSingletonDatum,
  rewardAccountFromScript,
} from "../../sdk/shared/index.js";
import type {
  IBuildChangeConfigTxParams,
  IBuildChangeLogicTxParams,
  IBuildChangePermissionsTxParams,
  IBuildMigrateTxParams,
  IProtocolSettingsAdminInstance,
  IProtocolSettingsAdminParams,
  IProtocolSettingsAdminSource,
  IProtocolSettingsState,
  IResolvedSettingsChange,
  TSettingsChange,
  TSettingsSignatures,
} from "./types.js";
import {
  buildRawProxyDatum,
  buildSettingsAuthPayload,
  createSettingsValidatorScript,
  freezeSettingsData,
  hashSettingsAuthPayload,
  isFrozenSettingsData,
  parseLiveSettings,
  parseProxyDatumRaw,
  serializeSettings,
  serializeSettingsSignedRedeemer,
  unwrapFrozenSettingsData,
} from "./utils.js";

// Internal implementation for the current v1.1-era settings layout.
// Public consumers should import the version-neutral RealfiProtocolSettingsAdmin
// from admin/settings or the package root.
export class RealfiProtocolSettingsAdmin<
  P extends Provider,
  W extends Wallet,
> implements IProtocolSettingsAdminInstance<P, W> {
  readonly blaze: Blaze<P, W>;
  readonly proxyPolicyId: Core.PolicyId;
  readonly governanceConfig: GovernanceConfig;
  readonly settingsScript: Core.Script;
  readonly settingsScriptHash: Core.ScriptHash;
  readonly settingsValidatorAddress: Core.Address;
  readonly settingsRewardAccount: Core.RewardAccount;
  readonly enableTrace: boolean;

  private settingsRefInput?: Core.TransactionUnspentOutput;

  private constructor(
    blaze: Blaze<P, W>,
    params: IProtocolSettingsAdminParams,
  ) {
    this.blaze = blaze;
    this.proxyPolicyId = params.proxyPolicyId;
    this.governanceConfig = params.governanceConfig;
    this.enableTrace = params.enableTrace ?? false;
    this.settingsRefInput = params.referenceInputs?.settingsRefInput;

    this.settingsScript = createSettingsValidatorScript(
      this.proxyPolicyId,
      this.governanceConfig,
      this.enableTrace,
    );
    this.settingsScriptHash = this.settingsScript.hash();
    this.settingsValidatorAddress = addressFromValidator(
      this.blaze.provider.network,
      this.settingsScript,
    );
    this.settingsRewardAccount = rewardAccountFromScript(
      this.settingsScript,
      this.blaze.provider.network,
    );
  }

  static create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IProtocolSettingsAdminParams,
  ): RealfiProtocolSettingsAdmin<P, W> {
    return new RealfiProtocolSettingsAdmin(blaze, params);
  }

  static fromProtocolSdk<P extends Provider, W extends Wallet>(
    sdk: IProtocolSettingsAdminSource<P, W>,
    params: Omit<
      IProtocolSettingsAdminParams,
      "proxyPolicyId" | "enableTrace"
    > & {
      enableTrace?: boolean;
    },
  ): RealfiProtocolSettingsAdmin<P, W> {
    return new RealfiProtocolSettingsAdmin(sdk.blaze, {
      proxyPolicyId: sdk.oneShotPolicyId,
      governanceConfig: params.governanceConfig,
      enableTrace: params.enableTrace ?? sdk.enableTrace,
      referenceInputs: params.referenceInputs,
    });
  }

  async deploySettingsValidator(): Promise<TxBuilder> {
    return deployScript(this.blaze, this.settingsScript);
  }

  registerSettingsStake(): TxBuilder {
    return this.blaze
      .newTransaction()
      .addRegisterStake(credentialFromScript(this.settingsScript));
  }

  async getSettingsState(): Promise<IProtocolSettingsState> {
    const proxyAssetId = Core.AssetId(this.proxyPolicyId);
    const { utxo: proxyUtxo, datum: proxyDatum } = await readSingletonDatum(
      this.blaze.provider,
      proxyAssetId,
    );

    const { logicHash, settingsData } = parseProxyDatumRaw(proxyDatum);
    const proxyAddress = proxyUtxo.output().address();
    const paymentCredentialHash = proxyAddress.getProps().paymentPart?.hash;
    if (!paymentCredentialHash) {
      throw new Error("Proxy UTxO address has no payment credential");
    }

    const isFrozen = isFrozenSettingsData(settingsData);
    return {
      proxyUtxo,
      proxyDatum,
      proxyAddress,
      logicHash,
      settingsData,
      liveSettings: isFrozen ? undefined : parseLiveSettings(settingsData),
      paymentCredentialHash,
      isFrozen,
      isGovernedByThisValidator:
        paymentCredentialHash === this.settingsScriptHash,
    };
  }

  async buildDepositProxyTx(): Promise<TxBuilder> {
    const state = await this.getSettingsState();

    if (state.isGovernedByThisValidator) {
      throw new Error("Proxy NFT is already locked at this settings validator");
    }

    if (
      state.proxyAddress.getProps().paymentPart?.type ===
      Core.CredentialType.ScriptHash
    ) {
      throw new Error(
        "Proxy NFT is currently held by another script. Move it with the current controller before depositing into protocol settings.",
      );
    }

    return lockOrPayAssets(
      this.blaze.newTransaction().addInput(state.proxyUtxo),
      this.settingsValidatorAddress,
      // Same datum, but a script address is wider than the wallet address the
      // proxy is moving from, so the floor can still rise here.
      this.valueWithDatumMinAda(
        this.settingsValidatorAddress,
        state.proxyUtxo.output().amount(),
        state.proxyDatum,
      ),
      state.proxyDatum,
    );
  }

  /**
   * Compute the 32-byte auth-payload hash the governance keys must COSE-sign for
   * `change`, against the current on-chain proxy state. Two-phase, mirroring the
   * orchestrator's `getSignedPayloadFromOrderInputs`: get this hash, collect the
   * signatures out-of-band, then pass them to the matching build method. The
   * proxy UTxO must be unchanged between the two calls (it is the nonce).
   */
  async getSettingsAuthPayloadHash(
    change: TSettingsChange<P, W>,
  ): Promise<string> {
    const state = await this.requireGovernedState();
    const resolved = this.resolveChange(state, change);
    return hashSettingsAuthPayload(
      buildSettingsAuthPayload(
        resolved.redeemer,
        this.scriptHashOfAddress(resolved.receiverAddress),
        resolved.nextLogicHash,
        resolved.nextSettingsData,
        state.proxyUtxo.input(),
      ),
    );
  }

  async buildChangePermissionsTx(
    params: IBuildChangePermissionsTxParams,
  ): Promise<TxBuilder> {
    return this.buildChange(
      { type: "ChangePermissions", nextPermissions: params.nextPermissions },
      params.signatures,
    );
  }

  async buildChangeConfigTx(
    params: IBuildChangeConfigTxParams,
  ): Promise<TxBuilder> {
    return this.buildChange(
      { type: "ChangeConfig", nextConfig: params.nextConfig },
      params.signatures,
    );
  }

  async buildChangeLogicTx(
    params: IBuildChangeLogicTxParams,
  ): Promise<TxBuilder> {
    return this.buildChange(
      {
        type: "ChangeLogic",
        nextLogicHash: params.nextLogicHash,
        nextRegistry: params.nextRegistry,
      },
      params.signatures,
    );
  }

  async buildShutdownTx(params: {
    signatures: TSettingsSignatures;
  }): Promise<TxBuilder> {
    return this.buildChange({ type: "Shutdown" }, params.signatures);
  }

  async buildRestoreTx(params: {
    signatures: TSettingsSignatures;
  }): Promise<TxBuilder> {
    return this.buildChange({ type: "Restore" }, params.signatures);
  }

  async buildMigrateTx(
    params: IBuildMigrateTxParams<P, W>,
  ): Promise<TxBuilder> {
    return this.buildChange(
      { type: "Migrate", destination: params.destination },
      params.signatures,
      params.destinationSignatures,
    );
  }

  /**
   * Resolve a change against the current state into the concrete redeemer +
   * resulting proxy output (logic, canonical settings, destination). Shared by
   * `getSettingsAuthPayloadHash` and `buildChange` so the signed hash and the
   * submitted tx always describe the same resulting state. Settings read from
   * chain are canonicalized through the typed schema (see `canonicalizeSettings`)
   * so blaze's encoding matches the validator's `cbor.serialise`.
   */
  private resolveChange(
    state: IProtocolSettingsState,
    change: TSettingsChange<P, W>,
  ): IResolvedSettingsChange {
    const here = this.settingsValidatorAddress;
    switch (change.type) {
      case "ChangePermissions": {
        const current = this.requireLive(state);
        const next: SettingsV1 = {
          ...current,
          permissions: change.nextPermissions,
        };
        return {
          redeemer: "ChangePermissions",
          nextLogicHash: state.logicHash,
          nextSettingsData: serializeSettings(next),
          receiverAddress: here,
        };
      }
      case "ChangeConfig": {
        const current = this.requireLive(state);
        const next: SettingsV1 = { ...current, config: change.nextConfig };
        return {
          redeemer: "ChangeConfig",
          nextLogicHash: state.logicHash,
          nextSettingsData: serializeSettings(next),
          receiverAddress: here,
        };
      }
      case "ChangeLogic": {
        const current = this.requireLive(state);
        const nextLogicHash = change.nextLogicHash ?? state.logicHash;
        const nextRegistry = change.nextRegistry ?? current.registry;
        if (
          nextLogicHash === state.logicHash &&
          JSON.stringify(nextRegistry) === JSON.stringify(current.registry)
        ) {
          throw new Error("ChangeLogic requires a logic or registry change");
        }
        return {
          redeemer: "ChangeLogic",
          nextLogicHash,
          nextSettingsData: serializeSettings({
            ...current,
            registry: nextRegistry,
          }),
          receiverAddress: here,
        };
      }
      case "Shutdown": {
        if (state.isFrozen) {
          throw new Error("Settings are already frozen");
        }
        return {
          redeemer: "Shutdown",
          nextLogicHash: state.logicHash,
          nextSettingsData: freezeSettingsData(state.settingsData),
          receiverAddress: here,
        };
      }
      case "Restore": {
        if (!state.isFrozen) {
          throw new Error("Settings are not frozen");
        }
        return {
          redeemer: "Restore",
          nextLogicHash: state.logicHash,
          nextSettingsData: this.canonicalizeSettings(
            unwrapFrozenSettingsData(state.settingsData),
          ),
          receiverAddress: here,
        };
      }
      case "Migrate": {
        const destination = change.destination;
        if (destination.settingsScriptHash === this.settingsScriptHash) {
          throw new Error(
            "Migrate requires a different destination settings validator",
          );
        }
        return {
          redeemer: "Migrate",
          nextLogicHash: state.logicHash,
          nextSettingsData: this.canonicalizeSettings(state.settingsData),
          receiverAddress: destination.settingsValidatorAddress,
          coValidateWith: {
            rewardAccount: destination.settingsRewardAccount,
            applyWitness: destination.applySettingsWitness.bind(destination),
          },
        };
      }
    }
  }

  private requireLive(state: IProtocolSettingsState): SettingsV1 {
    if (state.isFrozen || !state.liveSettings) {
      throw new Error("Settings are not in a live state");
    }
    return state.liveSettings;
  }

  /**
   * Re-serialize live settings through the typed schema so the CBOR matches the
   * validator's `cbor.serialise` of the parsed output datum. Settings read from
   * chain and re-embedded opaquely (Restore's unwrap, Migrate's passthrough)
   * otherwise don't. Frozen settings aren't a `SettingsV1`, so pass through.
   */
  private canonicalizeSettings(settingsData: Core.PlutusData): Core.PlutusData {
    const live = parseLiveSettings(settingsData);
    return live ? serializeSettings(live) : settingsData;
  }

  private async buildChange(
    change: TSettingsChange<P, W>,
    signatures: TSettingsSignatures,
    destinationSignatures?: TSettingsSignatures,
  ): Promise<TxBuilder> {
    const state = await this.requireGovernedState();
    const resolved = this.resolveChange(state, change);

    const tx = this.blaze.newTransaction();
    tx.addInput(state.proxyUtxo, Data.Void());
    tx.addWithdrawal(
      this.settingsRewardAccount,
      0n,
      serializeSettingsSignedRedeemer(resolved.redeemer, signatures),
    );

    await this.applySettingsWitness(tx);

    if (resolved.coValidateWith) {
      if (!destinationSignatures) {
        throw new Error(
          "Migrate requires destinationSignatures for the destination validator",
        );
      }
      // The destination validator independently verifies signatures over the
      // same auth-payload hash against its own governance config.
      tx.addWithdrawal(
        resolved.coValidateWith.rewardAccount,
        0n,
        serializeSettingsSignedRedeemer("Migrate", destinationSignatures),
      );
      await resolved.coValidateWith.applyWitness(tx);
    }

    const nextDatum = buildRawProxyDatum(
      resolved.nextLogicHash,
      resolved.nextSettingsData,
    );
    return lockOrPayAssets(
      tx,
      resolved.receiverAddress,
      this.valueWithDatumMinAda(
        resolved.receiverAddress,
        state.proxyUtxo.output().amount(),
        nextDatum,
      ),
      nextDatum,
    );
  }

  /**
   * The value to put on a settings output carrying `datum`, topped up to the
   * min-ADA floor for that datum when the incoming coin no longer covers it.
   *
   * A settings edit can grow the datum (appending a reserve asset, a larger
   * registry), and the coin comes from the UTxO being spent, which was sized
   * for the *previous* datum. `TxBuilder` would raise an under-funded output to
   * the floor on its way out, but that happens after balancing has already
   * decided what to draw from the wallet, so the bump is never funded and the
   * built transaction is short by exactly that amount. Reserving it here means
   * `complete()` treats the growth as an ordinary larger payment from the first
   * iteration.
   *
   * The floor is recomputed after each raise: a larger coin is itself a few
   * bytes wider on the wire, which can lift the floor again.
   */
  private valueWithDatumMinAda(
    address: Core.Address,
    value: Core.Value,
    datum: Core.PlutusData,
  ): Core.Value {
    let result = value;
    // Converges in one or two passes; the bound just refuses to spin.
    for (let i = 0; i < 4; i++) {
      const output = new Core.TransactionOutput(address, result);
      output.setDatum(Core.Datum.newInlineData(datum));
      const floor = calculateMinAda(output, this.blaze.params.coinsPerUtxoByte);
      if (result.coin() >= floor) return result;
      result = new Core.Value(floor, result.multiasset());
    }
    return result;
  }

  /** The payment-credential script hash of a settings validator address. */
  private scriptHashOfAddress(address: Core.Address): Core.ScriptHash {
    const paymentPart = address.getProps().paymentPart;
    if (!paymentPart || paymentPart.type !== Core.CredentialType.ScriptHash) {
      throw new Error(
        "Governed settings output must be locked at a script (validator) address",
      );
    }
    return paymentPart.hash as Core.ScriptHash;
  }

  private async requireGovernedState(): Promise<IProtocolSettingsState> {
    const state = await this.getSettingsState();
    if (!state.isGovernedByThisValidator) {
      throw new Error(
        "Proxy NFT is not currently governed by this settings validator. Deposit it first.",
      );
    }
    return state;
  }

  async applySettingsWitness(tx: TxBuilder): Promise<void> {
    if (this.settingsRefInput) {
      tx.addReferenceInput(this.settingsRefInput);
      return;
    }

    const refInput = await this.blaze.provider.resolveScriptRef(
      this.settingsScriptHash,
    );
    if (refInput) {
      this.settingsRefInput = refInput;
      tx.addReferenceInput(refInput);
      return;
    }

    tx.provideScript(this.settingsScript);
  }
}
